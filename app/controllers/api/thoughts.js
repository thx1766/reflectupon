var mongoose   = require('mongoose')
  , async      = require('async')
  , Thought    = mongoose.model('Thought')
  , Reply      = mongoose.model('Reply')
  , Annotation = mongoose.model('Annotation')
  , User       = mongoose.model('User')
  , helpers    = require('../../helpers')
  , emails     = require('../../utils/emails')
  , _          = require('underscore');

exports.get = function(req, res) {
    var params = {}, params2 = {}, array1 = null,
        limit  = 0,
        date_sort = null;
        more_limit = 0,
        where = null,
        populate = 'replies';

    var stream_type   = req.query.stream_type   || null,
        thought_id    = req.query.thought_id    || null,
        per_page      = req.query.per_page      || null,
        page          = req.query.page          || null,
        reply_privacy = req.query.reply_privacy || null,
        random        = req.query.random        || null;

    if (thought_id) params._id = thought_id;

    if (random) {
        Thought
            .find({
                privacy: "ANONYMOUS",
                user_id: { $ne: req.user._id } })
            .limit(1)
            .sort("-date")
            .skip(Math.floor(Math.random() * 10))
            .exec(function(err, thought) {
                res.send(thought[0]);
            })
    }
    if (req.user) {

        switch (stream_type) {
            case "my-thoughts":

                if (per_page == 0) {
                    res.links({
                        next: '/api/thought/?stream_type='+stream_type+'&page='+(Number(page)+1)+'&per_page=15&sort=updated&direction=desc'
                    });
                    res.send([])
                }

                params = {
                    user_id: req.user._id
                };

                params1 = {
                    privacy: "ANONYMOUS",
                    user_id: { $ne: req.user._id }
                };

                if (per_page == 15) {
                    limit1 = 15;
                    limit2 = 1;
                }

                date_sort = {date: -1};
                populate = {
                    path: 'replies',
                    match: { user_id: req.user._id }
                };

                async.parallel([

                    function(cb) {
                        if (params.user_id) {
                            Thought.find( params )
                                .populate('replies')
                                .limit(limit1)
                                .skip(limit1 * (page - 1))
                                .sort(date_sort)
                                .exec(cb)
                        }
                    },

                    function(cb) {
                        Thought.find( params1 )
                            .populate(populate)
                            .limit(limit2)
                            .skip(limit2 * (page - 1))
                            .sort(date_sort)
                            .exec(cb)
                    }
                    
                ], function(err, results) {

                    var thoughts = results[0]

                    function compare(a,b) {
                        if (a.date < b.date) return 1;
                        if (a.date > b.date) return -1;
                        return 0;
                    }

                    if (err) console.log(err);

                    var options = {
                        path: 'replies.annotations',
                        model: 'Annotation'
                    }

                    // Get annotations for all thoughts being outputted
                    Thought.populate(thoughts, options, function(err, thoughts2) {

                        Thought.find( params).count().exec(function(err, count) {

                            if (err) console.log(err);

                            var send_thoughts = [];

                            async.each(thoughts2, function(thought, callback) {

                                var send_thought = thought.toObject();
                                if (req.user._id != send_thought.user_id) {

                                    var params = {
                                        user_id: send_thought.user_id,
                                        privacy: "ANONYMOUS"
                                    };

                                    Thought.find(params)
                                        .populate('replies').exec(function(err, related) {

                                        send_thought.history = [];

                                        _.each(related, function(thought) {
                                            if (thought.replies && thought.replies.length) {
                                                _.each(thought.replies, function(reply) {
                                                    if (reply.user_id == req.user._id) {

                                                        send_thought.history.push(thought);
                                                    }
                                                })
                                            }
                                        })

                                        send_thoughts.push(send_thought);
                                        callback();
                                    })

                                } else {

                                    send_thoughts.push(send_thought);
                                    callback();

                                }


                            }, function(err) {

                                if ((per_page * page) < count) { 
                                    res.links({
                                        next: '/api/thought/?stream_type='+stream_type+'&page='+(Number(page)+1)+'&per_page=15&sort=updated&direction=desc'
                                    });
                                }

                                if (thoughts) {
                                    if (thoughts.length == 1) {
                                        res.send(send_thoughts[0])
                                    } else {

                                        send_thoughts = send_thoughts.sort(compare);
                                        res.send(send_thoughts);
                                    }
                                }

                            });

                        })
                    })

                });

                break;
            case "other-thoughts":
                helpers.getOnlyAnonThoughts(params, function(thoughts) {
                    res.send(thoughts);
                });
                break;
            case "featured":

                var options = {
                    feature: true
                };

                helpers.getOnlyAnonThoughts(params, function(thoughts) {
                    res.send(thoughts);
                }, options);
                break;
            case "recommended":
                params.user_id = req.user._id;
                limit = 15;
                date_sort = {date: -1};

                Thought.find( params )
                    .limit(limit)
                    .skip(per_page * (page - 1))
                    .sort(date_sort)
                    .exec(function(err, thoughts) {

                        if (err) console.log(err);

                        // Array that will be sent back that picks from data taken from database
                        var send_thoughts = [];

                        // Send reflections from different intervals of time, so user may reflect back on them
                        if (thoughts && thoughts[5])  send_thoughts.push(thoughts[5]);

                        res.send(send_thoughts[0])
                    });
                break;
        }
    } else {

        var startDate = new Date(new Date().setHours(0,0,0,0));
        startDate.setDate(startDate.getDate()-14);

        params.date = {
            $gte: startDate,
            $lte: new Date() 
        };

        date_sort = {date: -1};
        params.privacy = "ANONYMOUS";

        populate = {
            path: 'replies',
            match: { privacy: reply_privacy }
        };

        Thought.find( params )
            .sort(date_sort)
            .populate(populate)
            .limit(6)
            .exec(function(err, thoughts) {

                if (err) console.log(err);

                res.send(thoughts);

            });

    }

}

/**
 * Get an anonymous entry from someone else for ALL recommendations
 * - TODO: To include an algorithm, which would include your entries as well soon.
 */
var getRecommended = function(user_id, callback) {

    var params = {
        user_id: {
            $ne: user_id
        },
        date: helpers.getDateRange(7),
        privacy: "ANONYMOUS"
    }

    findThought(params, function(thought) {

        callback(thought);

    });
}

var findThought = function(params, callback) {
    Thought.find(params).sort({date: -1 }).exec(function(err, thoughts) {
        if (thoughts.length) {
            thoughts = _.sortBy(thoughts, function(thought) {
                return thought.replies.length;
            })

            callback(thoughts[0]);
        } else {

            delete params.date;

            Thought.find(params).sort({date: -1 }).exec(function(err, thoughts) {
                console.log('No thoughts in the last 7 days.');
                callback(thoughts[0]);
            });
        }
    });
}

exports.post = function(req, res) {

    getRecommended(req.user._id, function(recommended) {

        var thought = new Thought({
            title:          req.body.title,
            description:    req.body.description,
            expression:     req.body.expression,
            annotation:     req.body.annotation,
            privacy:        req.body.privacy,
            user_id:        req.user._id,
            link:           req.body.link,
            tag_ids:        req.body.tag_ids,
            date:           req.body.date,
            recommended:    recommended
        });

        thought.save(function(err) {

            if (err) console.log(err);

            Thought.populate(thought, {path:"recommended"}, function(err,thought) {

                populateRepliesForThought(thought.recommended, req.user._id, function(recommended) {

                    thought.recommended = recommended;
                    thought = thought.toObject();

                    if (thought.recommended && thought.recommended[0]) {
                        helpers.getAnnotationsForThought(thought.recommended[0], req.user._id, function(annotations)  {
                            thought.recommended[0].annotations = annotations;
                            res.send(thought);
                        });
                    }

                })
            })

        });

    });

}

var populateRepliesForThought = function(thought, user_id, callback) {

    var populateOptions = {
        path: 'replies',
        match: {
            user_id: user_id
        }
    };

    Thought.populate(thought, populateOptions, function(err,recommended) {
        callback(recommended);
    })

}

exports.put = function(req,res) {
    Thought.findById(req.params.id, function(err,thought) {
        if (req.body.privacy)     thought.privacy     = req.body.privacy;
        if (req.body.description) thought.description = req.body.description;
        if (req.body.archived)    thought.archived    = req.body.archived;
        if (typeof req.body.feature == "boolean")     thought.feature     = req.body.feature;

        thought.save(function(err) {
            if (err) console.log(err);
            res.send(thought);
        })
    });
}

exports.delete = function(req,res) {
    Thought.findById(req.params.id, function(err,thought) {
        thought.remove(function(err) {
            if (err) console.log(err);
            res.send(thought);
        })
    });
}

exports.postReply = function(req, res) {

    var reply = new Reply({
        title:          req.body.title,
        description:    req.body.description,
        thought_id:     req.body.thought_id,
        user_id:        req.user._id,
        date:           new Date()
    });


    reply.save(function(err) {

        if (err) console.log(err);

        emails.sendEmailWhenRepliedTo(req.body.thought_id, req.user.id);

        if (req.body.annotations){
            for (var i = 0; i < req.body.annotations.length; i++) {

                var annotation = new Annotation({
                    _reply_id:      reply._id,
                    description:    req.body.annotations[i].description,
                    start:          req.body.annotations[i].start,
                    end:            req.body.annotations[i].end,
                    thought_id:     req.body.thought_id,
                    user_id:        req.user._id,
                    date:           new Date()
                });

                annotation.replies.push(reply);

                Thought.findById(req.body.thought_id, function(err, thought) {
                    annotation.thoughts.push(thought);

                    annotation.save(function(err) {

                        if (err) console.log(err);

                        reply.annotations.push(annotation);
                        reply.save(function(err, reply){

                            var populateOptions = {
                                path: 'annotations'
                            };

                            Reply.populate(reply, populateOptions, function(err,reply) {
                                if (err) console.log(err);

                                res.send(reply);
                            })


                        });

                    });

                })

            }
        } else {
            res.send(reply);
        }

        Thought.find({ _id: req.body.thought_id }, function(err, thought) {

            var oneThought = thought[0];

            oneThought.replies.push(reply);

            oneThought.save(function(err){

                if (err) console.log(err);

            });
        });

    });

}