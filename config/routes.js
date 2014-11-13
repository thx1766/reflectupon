var mongoose = require('mongoose')
  , async = require('async')
  , user_routes     = require('../app/controllers/user')
  , thought_routes  = require('../app/controllers/thought')
  , auth = require('./middlewares/authorization')
  , _ = require('underscore')
  , emails           = require('../app/utils/emails');

var Thought     = mongoose.model('Thought'),
    Reply       = mongoose.model('Reply'),
    Annotation  = mongoose.model('Annotation'),
    User        = mongoose.model('User'),
    userMessage = mongoose.model('UserMessage'),
    Topic       = mongoose.model('Topic');

module.exports = function(app) {

    app.get( '/',                               user_routes.getIndex);
    app.get( '/home',   auth.ensureAuthenticated,    user_routes.home);
    app.get( '/new-ux', auth.ensureAuthenticated,    user_routes.newUser);
    app.post('/login',                          user_routes.postlogin);
    app.get( '/logout',                         user_routes.logout);
    app.post('/register',                       user_routes.postregister);
    app.post('/forgot',                         user_routes.postForgot);
    app.post('/reset',                          user_routes.postReset);
    app.get( '/twiml',                          thought_routes.getTwiml);

    app.post('/api/send_email', function(req,res) {

        var startDate = new Date();
        startDate.setDate(startDate.getDate()-7);

        var endDate = new Date();
        endDate.setDate(endDate.getDate());

        thought_routes.getAllByTimePeriod(startDate, endDate)
            .then( function(thoughts) {

                thoughts     = _.first(thoughts, 3);
                descriptions = _.pluck(thoughts, 'description');
                descriptions = _.map(descriptions, function(description) { 
                    if (description.length > 300) {
                        return description.substr(0,300) + "...";
                    } else {
                        return description;
                    }
                })

                user_routes.getUserEmailList()
                    .then(function(recipients) {
                        app.render('weekly_email', {descriptions: descriptions}, function(err, html) {

                            params = {
                                html_template: html,
                                subject:       "Weekly Postings on Reflect Upon",
                                recipients:    recipients
                            }

                            return emails.sendEmail(params)
                        })
                    })
            })
            .then( function(json) {
                res.send({success: 1});
            });
    });

    app.get('/api/active_users', function(req, res) {

        var i = 0 + (new Date().getDay());
        var results = [];

        async.whilst(
            function() { return i < 100; },
            function(callback) {

                var result = {};

                var startDate = new Date(new Date().setHours(0,0,0,0));
                startDate.setDate(startDate.getDate()-i);

                var endDate = new Date(new Date().setHours(0,0,0,0));
                endDate.setDate(endDate.getDate()-(i-7));

                result.start_date = startDate;
                result.end_date = endDate;

                var params = {
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                };

                Thought.find(params, function(err, thoughts) {

                    if (err) console.log(err);

                    var unique_users = _.reduce(thoughts, function(unique_users, thought) {
                        if (unique_users.indexOf(thought.user_id) == -1) {
                            unique_users.push(thought.user_id);
                        }
                        return unique_users;
                    }, []);

                    result.active_user_count = unique_users.length;
                    results.push(result);
                    i = i+7;
                    callback();

                });
            },
            function() {
                res.send(results);
            }
        );

    })

    app.get('/api/thought', function(req, res) {

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

    });

    app.get('/api/frequency', function(req, res) {
        var d = new Date();
        var numDays = 30;

        d.setDate(d.getDate()-numDays);

        var options = {
          date: { $lt: new Date(), $gt: d },
          user_id: req.user._id
        };

        Thought.find(options).sort({date:-1}).exec(function(err, thoughts) {

            Annotation.find(options).sort({date:-1}).exec(function(err, annotations) {
                var frequency = [];

                for (var i = 0; i < numDays; i++) {

                    var endDate   = getDate(i, 1);
                    var startDate = getDate(i);

                    frequency[i] = {
                        day:      startDate,
                        thoughts: getItemsByDate(thoughts, startDate, endDate),
                        activity: getItemsByDate(annotations, startDate, endDate)
                    };

                }

                res.send(frequency);
            });
        });

    });

    var getDate = function(num_day, end_day) {

        if (typeof end_day == "undefined") {
            end_day = 0;
        }

        var date = new Date(new Date().setHours(0,0,0,0));
        date.setDate(date.getDate()-(num_day - end_day));
        return date;
    };

    var getItemsByDate = function(thoughts, startDate, endDate) {
        var output_thoughts = [];
        if (thoughts.length) thought_date = new Date(thoughts[0].date);
        while (thoughts && thoughts.length && thought_date < endDate && thought_date >= startDate) {
            output_thoughts.push(thoughts.shift());
            if (thoughts.length) thought_date = new Date(thoughts[0].date);
        }

        console.log(output_thoughts);
        return output_thoughts;
    };

    app.post('/api/thought', function(req, res) {

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

    });

    app.put('/api/thought/:id', function(req,res) {
        Thought.findById(req.params.id, function(err,thought) {
            if (req.body.privacy)     thought.privacy     = req.body.privacy;
            if (req.body.description) thought.description = req.body.description;
            if (req.body.archived)    thought.archived    = req.body.archived;

            thought.save(function(err) {
                if (err) console.log(err);
                res.send(thought);
            })
        });
    });

    app.delete('/api/thought/:id', function(req,res) {
        Thought.findById(req.params.id, function(err,thought) {
            thought.remove(function(err) {
                if (err) console.log(err);
                res.send(thought);
            })
        });
    });

    app.get('/api/users', function(req,res) {

        var options = {};

        //if (req.body.check_username) options.check_username

        User.find({}, function(err, users) {

            var send_users = [];

            async.eachSeries(users, function(user, callback) {
                var send_user = user.toObject();

                Thought.find({user_id: send_user._id}).count().exec(function(err,count) {
                    send_user.num_thoughts = count;
                    send_users.push(send_user);
                    callback();
                });
            }, function(err){
                res.send(send_users);
            });

        });

    });

    app.delete('/api/users/:id', function(req,res) {
        User.findById(req.params.id, function(err,user) {
            user.remove(function(err) {
                if (err) console.log(err);
                res.send(user);
            })
        });
    });

    app.get('/api/user_messages', function(req,res) {
        var user_id = req.query.user_id;
        userMessage.find({user_id: user_id}, function(err,user_messages) {

            if (!user_messages.length) {
                var user_message_data = {
                    message_id: "1",
                    user_id: user_id
                };

                var user_message = new userMessage(user_message_data);
                user_message.save(function (err, user_message) {
                    if (err) return console.error(err);
                    res.send(user_message);
                });

            } else {

                res.send(user_messages);

            }

        })
    });

    app.put('/api/user_messages/:user_message', function(req,res) {
        userMessage.findById(req.params.user_message, function(err,message) {
            message.dismissed = req.body.dismissed;
            message.save(function(err) {
                res.send(message);
            });
        })
    });

    app.get('/api/thought/:thought/reply/', function(req, res) {

        Reply.find({ thought_id: req.params.thought }, function(err, replies) {

            res.send(replies);

        });
    });

    app.post('/api/thought/:thought/reply',function(req, res) {

        var reply = new Reply({
            title:          req.body.title,
            description:    req.body.description,
            thought_id:     req.body.thought_id,
            user_id:        req.user._id,
            date:           new Date()
        });


        reply.save(function(err) {

            if (err) console.log(err);

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

                    annotation.save(function(err) {

                        if (err) console.log(err);

                        reply.annotations.push(annotation);
                        reply.save(function(err){

                            if (err) console.log(err);

                        });

                    });

                }
            }

            Thought.find({ _id: req.body.thought_id }, function(err, thought) {

                var oneThought = thought[0];

                oneThought.replies.push(reply);

                oneThought.save(function(err){

                    if (err) console.log(err);

                });
            });

            res.send( req.body );

        });

    });

    app.post('/api/thought/:thought/reply/:reply/annotation/', function(req, res) {

        var annotation = new Annotation({
            description:    req.body.description,
            thought_id:     req.body.thought_id,
            reply_id:       req.body.reply_id,
            user_id:        req.user._id,
            date:           new Date()
        });

        annotation.save(function(err) {

            if (err) console.log(err);

            res.send( req.body );

        });

    });

    app.get('/api/annotations', function(req, res) {
        Annotation.find({
            thought_id: req.query.thought_id
        }, function(err, annotations) {
            res.send(annotations)
        })
    });

    app.get('/account', auth.ensureAuthenticated, function(req,res) {
        res.send( req.user );
    });

    app.patch('/api/reply/:reply_id', function(req, res) {
        
        Reply.findById(req.params.reply_id, function(err,reply) {

            if (err) console.log(err);

            var permitted_privacy = [
                'REPLIER_TO_PRIVATE',
                'REPLIER_TO_PUBLIC',
                'AUTHOR_TO_PRIVATE',
                'AUTHOR_TO_PUBLIC'
            ];

            if (req.body.thanked) reply.thanked = req.body.thanked;
            if (req.body.privacy) reply.privacy = req.body.privacy;

            reply.save(function() {

                res.send( reply );

            })

        });

    });

    var topics_uri = '/api/topics';

    app.post(topics_uri, function(req, res) {

        var topic = new Topic({
            name: req.body.name,
            date: new Date()
        });

        topic.save(function(err) {
            res.send(topic);
        });
    });

    app.get(topics_uri, function(req, res) {
        Topic.find({}, function(err, topics) {
            res.send(topics);
        });
    });

    app.delete(topics_uri +"/:id", function(req, res) {
        Topic.findById(req.params.id, function(err,topic) {
            topic.remove(function(err) {
                if (err) console.log(err);
                res.send(topic);
            })
        });
    });

}