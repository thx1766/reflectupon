var mongoose   = require('mongoose')
  , async      = require('async')
  , Thought    = mongoose.model('Thought')
  , Annotation = mongoose.model('Annotation')
  , User       = mongoose.model('User')
  , Topic      = mongoose.model('Topic')
  , _          = require('underscore');

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

                        thought = thought.toObject();
                        exports.getAnnotationsForThought(thought, null, function(annotations) {
                            thought.annotations = annotations;

                            if (thought.recommended && thought.recommended.length) {
                                exports.getAnnotationsForThought(thought.recommended[0], options.user_id, function(annotations) {
                                    thought.recommended[0].annotations = annotations;
                                    callback(err, thought);
                                });
                            }
                        })
                    },
                    function(err, results) {
                        callback(results);
                    });
            });
        });

};

/**
 * Params:
 *   - thought: the entry to get annotations for
 *   - user_id: get annotations only that the user has made to the recommended entry
 */
exports.getAnnotationsForThought = function(thought, user_id, callback) {

    var params = {
        thought_id: thought._id
    };

    if (user_id) {
        params.user_id = user_id;
    }

    Annotation.find(params, function(err, annotations) {
        callback(annotations);
    })
}

exports.getPublicThoughts = function(params, callback, options) {

    options = options || {};
    params = params || {};

    var limit = params.limit || 20;

    // var startDate = new Date(new Date().setHours(0,0,0,0));
    // startDate.setDate(startDate.getDate()-14);

    // params.date = {
    //     $gte: startDate,
    //     $lte: new Date()
    // };

    if (typeof options.feature != "undefined") {
        params.feature = options.feature;
    }

    Thought.find(params)
        .where('privacy')
        .in(["ANONYMOUS", "PUBLIC"])
        .sort({date: -1})
        .limit(limit)
        .populate('replies')
        .populate('prompt')
        .exec(function(err, thoughts) {

            thoughts.reverse();

            async.mapSeries(
                thoughts, function(thought, callback) {

                    thought = thought.toObject();

                    thought.replies = exports.removeRejectedReplies(thought.replies);

                    async.mapSeries(thought.replies, function(reply, callback2) {

                        exports.getUserIfPublic(reply, function(user) {
                            reply.username = user.username;
                        }, function() {
                            callback2(err, reply);
                        })

                    }, function(err, replies_results) {

                        thought.replies = replies_results;
                        exports.getAnnotationsForThought(thought, null, function(annotations) {
                            thought.annotations = annotations;

                            exports.getUserIfPublic(thought, function(user) {
                                thought.username = user.username;

                            },function() {

                                exports.getTopicsByIds(thought.tag_ids, function(topics) {
                                    thought.tag_ids = topics;
                                    callback(err, thought);
                                })
                            });

                        })
                    });
                },
                function(err, results) {
                    if (err) console.log(err);
                    callback(results);
                });
        });
}

exports.getTopicsByIds = function(tag_ids, callback) {
    Topic.find({"_id": { $in: tag_ids }}).exec(function(err, topics) {
        callback(_.map(topics, function(topic){
            return topic.name;
        }));
    });
}

exports.removeRejectedReplies = function(replies) {
    return _.reject(replies, function(reply) {
        return typeof reply.status != 'undefined' && reply.status.indexOf('rejected') != -1;
    });
}

exports.getUserIfPublic = function(item, action, callback) {
    if (item.privacy == "PUBLIC") {
        User.findById(item.user_id, function(err, user) {
            action(user);
            callback();
        });
    } else {
        callback();
    }
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