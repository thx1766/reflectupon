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
            limit  = null,
            date_sort = null;

        var stream_type = req.query.stream_type || null,
            thought_id  = req.query.thought_id  || null,
            per_page    = req.query.per_page    || null,
            page        = req.query.page        || null;

        if (req.user) {

            switch (stream_type) {
                case "my-thoughts":
                    params.user_id = req.user._id;
                    limit = per_page;
                    date_sort = {date: -1};
                    break;
                case "other-thoughts":
                    params.user_id = { $ne: req.user._id };
                    limit = 5;
                    date_sort = {date: -1};
                    params.privacy = "ANONYMOUS"
                    break;
                case "recommended":
                    params.user_id = req.user._id;
                    limit = 15;
                    date_sort = {date: -1};
                    break;
            }

            if (thought_id) params._id = thought_id;
        }

        Thought.find( params )
            .populate('replies')
            .limit(limit)
            .skip(per_page * (page - 1))
            .sort(date_sort)
            .exec(function(err, thoughts) {

                // Array that will be sent back that picks from data taken from database
                var send_thoughts = [];

                // Send reflections from different intervals of time, so user may reflect back on them
                if (stream_type == "recommended") {
                    send_thoughts.push(thoughts[0]);
                    send_thoughts.push(thoughts[5]);
                    send_thoughts.push(thoughts[10]);
                } else {
                    send_thoughts = thoughts;
                }

                res.links({
                    next: '/api/thought/?stream_type='+stream_type+'&page='+(page+1)+'&per_page=15&sort=updated&direction=desc'
                });

                if (thoughts) {
                    if (thoughts.length == 1) {
                        res.send(send_thoughts[0])
                    } else {
                        res.send(send_thoughts);
                    }
                }
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
        User.find({}, function(err, users) {

            var users2 = [];

            for (var i=0; i< users.length;i++) {
                delete users[i].password;
                users2.push(users[i]);
            }

            res.send(users2);

        });
    });

    app.get('/api/user_messages', function(req,res) {
        var user_id = req.query.user_id;
        userMessage.find({user_id: user_id}, function(err,messages) {
            res.send(messages);
        })
    });

    app.put('/api/user_messages/:user_message', function(req,res) {
        userMessage.findById(req.params.user_message, function(err,message) {
            console.log(message);
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