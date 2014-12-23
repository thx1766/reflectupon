var mongoose   = require('mongoose')
  , async      = require('async')
  , Thought    = mongoose.model('Thought');

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
        reply_privacy = req.query.reply_privacy || null;

        if (thought_id) params._id = thought_id;

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

                var startDate = new Date(new Date().setHours(0,0,0,0));
                startDate.setDate(startDate.getDate()-14);

                params.date = {
                    $gte: startDate,
                    $lte: new Date() 
                };

                date_sort = {date: -1};
                params.privacy = "ANONYMOUS";
                
                Thought.find( params )
                    .sort(date_sort)
                    .exec(function(err, thoughts) {

                        if (err) console.log(err);

                        res.send(thoughts);

                    });
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

exports.post = function(req, res) {
    var thought = new Thought({
        title:          req.body.title,
        description:    req.body.description,
        expression:     req.body.expression,
        annotation:     req.body.annotation,
        privacy:        req.body.privacy,
        user_id:        req.user._id,
        link:           req.body.link,
        tag_ids:        req.body.tag_ids,
        date:           new Date()
    });

    thought.save(function(err) {

        if (err) console.log(err);

        res.send( thought );

    });

}

exports.put = function(req,res) {
    Thought.findById(req.params.id, function(err,thought) {
        if (req.body.privacy)     thought.privacy     = req.body.privacy;
        if (req.body.description) thought.description = req.body.description;
        if (req.body.archived)    thought.archived    = req.body.archived;

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