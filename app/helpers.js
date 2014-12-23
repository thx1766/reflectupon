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
        path: 'replies'
    };

    Thought
        .find(params)
        .populate(populate)
        .sort({date:-1})
        .limit(limit)
        .exec(function(err, thoughts) {
            async.mapSeries(
                thoughts,
                getAnnotationByThought, 
                function(err, results) {
                    callback(results);
                });
        });

};

var getAnnotationByThought = function(thought, callback) {
    formatted_thought = {};
    formatted_thought = thought.toObject();
    Annotation.find({thought_id: thought.id}, function(err, thought_annotations) {
        formatted_thought.annotations = thought_annotations;
        callback(err, formatted_thought);
    })
}

exports.getDateRange = function(num_days) {
    var d = new Date();
    d.setDate(d.getDate()-num_days);
    return { $lt: new Date(), $gt: d }
};