var mongoose = require('mongoose')
  , user_routes     = require('../app/controllers/user')
  , thought_routes  = require('../app/controllers/thought')
  , auth = require('./middlewares/authorization');

var Thought     = mongoose.model('Thought'),
    Reply       = mongoose.model('Reply'),
    Annotation  = mongoose.model('Annotation'),
    User        = mongoose.model('User'),
    userMessage = mongoose.model('UserMessage');

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

    app.get('/api/thought', function(req, res) {

        var params = {},
            limit  = 0,
            date_sort = null;
            more_limit = 0,
            where = null,
            populate = 'replies';

        var stream_type = req.query.stream_type || null,
            thought_id  = req.query.thought_id  || null,
            per_page    = req.query.per_page    || null,
            page        = req.query.page        || null;

        if (req.user) {

            switch (stream_type) {
                case "my-thoughts":
                    params.user_id = req.user._id;
                    limit = Number(per_page);
                    date_sort = {date: -1};
                    populate = 'replies';
                    break;
                case "other-thoughts":
                    params.user_id = { $ne: req.user._id };

                    var startDate = new Date(new Date().setHours(0,0,0,0));
                    startDate.setDate(startDate.getDate()-7);

                    params.date = {
                        $gte: startDate,
                        $lte: new Date() 
                    };

                    limit = 5;
                    populate = {
                        path: 'replies',
                        match: { user_id: req.user._id }
                    }

                    date_sort = {date: -1};
                    params.privacy = "ANONYMOUS"
                    break;
                case "recommended":
                    params.user_id = req.user._id;
                    limit = 15;
                    date_sort = {date: -1};
                    populate = 'replies';
                    break;
            }

            if (thought_id) params._id = thought_id;
        }

        Thought.find( params )
            .populate(populate)
            .limit(limit)
            .skip(per_page * (page - 1))
            .sort(date_sort)
            .exec(function(err, thoughts) {

                if (err) console.log(err);

                Thought.find( params).count().exec(function(err, count) {

                    if (err) console.log(err);

                    // Array that will be sent back that picks from data taken from database
                    var send_thoughts = [];

                    // Send reflections from different intervals of time, so user may reflect back on them
                    if (stream_type == "recommended") {
                        if (thoughts[0])  send_thoughts.push(thoughts[0]);
                        if (thoughts[5])  send_thoughts.push(thoughts[5]);
                        if (thoughts[10]) send_thoughts.push(thoughts[10]);
                    } else {
                        send_thoughts = thoughts;
                    }

                    if ((per_page * page) < count) { 
                        res.links({
                            next: '/api/thought/?stream_type='+stream_type+'&page='+(Number(page)+1)+'&per_page=15&sort=updated&direction=desc'
                        });
                    }

                    if (thoughts) {
                        if (thoughts.length == 1) {
                            res.send(send_thoughts[0])
                        } else {
                            res.send(send_thoughts);
                        }
                    }
                })
            });

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

            var frequency = [];

            if (!thoughts.length) { res.send(frequency) };

            for (var i = 0; i < numDays; i++) {

                var endDate = new Date(new Date().setHours(0,0,0,0));
                endDate.setDate(endDate.getDate()-(i-1));

                var startDate = new Date(new Date().setHours(0,0,0,0));
                startDate.setDate(startDate.getDate()-i);

                frequency[i] = {
                    day: startDate,
                    thoughts: []
                };

                if (thoughts.length) thought_date = new Date(thoughts[0].date);

                while (thoughts && thoughts.length && thought_date < endDate && thought_date >= startDate) {

                    frequency[i].thoughts.push(thoughts.shift());

                    if (thoughts.length) thought_date = new Date(thoughts[0].date);

                }

            }

            res.send(frequency);
        });

    });

    app.post('/api/thought', function(req, res) {

        var thought = new Thought({
            title:          req.body.title,
            description:    req.body.description,
            expression:     req.body.expression,
            annotation:     req.body.annotation,
            privacy:        req.body.privacy,
            user_id:        req.user._id,
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

            res.send(users);

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

                    console.log("user messages A");
                    console.log(user_message);
                    res.send(user_message);
                });

            } else {

                console.log("user messages B");
                console.log(user_messages);
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

    app.post('/api/thought/:thought/reply/',function(req, res) {

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

    app.get('/account', auth.ensureAuthenticated, function(req,res) {
        res.send( req.user );
    });

}