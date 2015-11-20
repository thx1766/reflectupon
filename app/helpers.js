var mongoose   = require('mongoose')
  , async      = require('async')
  , Thought    = mongoose.model('Thought')
  , Annotation = mongoose.model('Annotation');

exports.getThoughtsWithAnnotation = function(options, callback) {

    var params = {};
    if (options.date)    params.date    = options.date;
    if (options.user_id) params.user_id = options.user_id;

    limit = options.limit || null;

    populate = {
        path: 'recommended'
    };

    Thought
        .find(params)
        .populate(populate)
        .populate('replies')
        .sort({date:-1})
        .limit(limit)
        .exec(function(err, thoughts) {

            var params = {
                path: 'recommended.replies',
                match: {user_id: options.user_id},
                model: 'Reply'
            };

            Thought.populate(thoughts, params, function(err, thoughtsWithRecs) {
                async.mapSeries(
                    thoughtsWithRecs, function(thought, callback) {
                        getAnnotationByThought(thought, function(err, thought) {
                            getAnnotationsForUserRecommendation(thought.recommended[0], options.user_id, function(formatted_rec_thought) {
                                thought.recommended = [formatted_rec_thought];
                                callback(err, thought);
                            });
                        })
                    },
                    function(err, results) {
                        callback(results);
                    });
            });
        });

};

var getAnnotationByThought = function(thought, callback) {
    var formatted_thought = {};
    formatted_thought = thought.toObject();
    Annotation.find({thought_id: thought.id}, function(err, thought_annotations) {
        formatted_thought.annotations = thought_annotations;
        callback(err, formatted_thought);
    })
}

/**
 * Params:
 *   - rec_thought: the recommended entry
 *   - user_id: get annotations only that the user has made to the recommended entry
 */
var getAnnotationsForUserRecommendation = function(formatted_recommended_thought, user_id, callback) {
    Annotation.find({
        thought_id: formatted_recommended_thought._id,
        user_id:    user_id
    }, function(err, thought_annotations2) {
        formatted_recommended_thought.annotations = thought_annotations2;
        callback(formatted_recommended_thought);
    })
}

exports.getOnlyAnonThoughts = function(params, callback, options) {

    options = options || {};

    var startDate = new Date(new Date().setHours(0,0,0,0));
    startDate.setDate(startDate.getDate()-14);

    params.date = {
        $gte: startDate,
        $lte: new Date()
    };

    params.privacy = "ANONYMOUS";

    if (typeof options.feature != "undefined") {
        params.feature = options.feature;
    }

    Thought.find(params)
        .sort({date: -1})
        .exec(function(err, thoughts) {

            if (err) console.log(err);
            callback(thoughts);

        });
}

/* Get date range from start to end */
exports.getDateRange = function(num_days) {
    var d = new Date();
    d.setDate(d.getDate()-num_days);
    return { $lt: new Date(), $gt: d }
};

exports.convertLineBreaks = function(description, type) {
    var before_type, after_type;

    if (type == 'n') {
        before_type = '\n';
        after_type = '<br>';
    } else if (type == 'br') {
        before_type = '<br>';
        after_type = '\n';
    }

    while (description.indexOf(before_type) != -1) {
        description = description.replace(before_type, after_type);
    }
    return description;
}