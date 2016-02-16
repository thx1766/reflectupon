var mongoose        = require('mongoose')
  , async           = require('async')
  , auth            = require('./middlewares/authorization')
  , _               = require('underscore')
  , emails          = require('../app/utils/emails')
  , user_routes      = require('../app/controllers/user')
  , thought_routes   = require('../app/controllers/thought')
  , superuser_routes = require('../app/controllers/superuser')
  , dates            = require('../app/controllers/api/dates')
  , thoughts         = require('../app/controllers/api/thoughts')
  , replies          = require('../app/controllers/api/replies')
  , reports          = require('../app/controllers/api/reports')
  , superuser        = require('../app/controllers/api/superuser')

var Thought     = mongoose.model('Thought'),
    Reply       = mongoose.model('Reply'),
    Annotation  = mongoose.model('Annotation'),
    User        = mongoose.model('User'),
    userMessage = mongoose.model('UserMessage'),
    Topic       = mongoose.model('Topic');

module.exports = function(app) {

    app.get( '/',                                    user_routes.getIndex);
    app.get( '/home',   auth.ensureAuthenticated,    function(req, res) {
        user_routes.home(req, res, dates);
    });
    app.get( '/reports',auth.ensureAuthenticated,    user_routes.reports);
    app.get( '/entry/:id',                           user_routes.entry);
    app.get( '/new-ux', auth.ensureAuthenticated,    user_routes.newUser);
    app.post('/login',                               user_routes.postlogin);
    app.get( '/logout',                              user_routes.logout);
    app.post('/register',                            user_routes.postregister);
    app.post('/register-beta',                       user_routes.postRegBetaUser);
    app.post('/forgot',                              user_routes.postForgot);
    app.post('/reset',                               user_routes.postReset);
    app.get( '/twiml',                               thought_routes.getTwiml);
    app.get( '/superuser', auth.ensureAuthenticated, superuser_routes.get);

    app.get('/api/frequency', function(req, res) {

        var is_mobile = req.query.mobile,
            user_id   = req.user._id;

        dates.get(is_mobile, user_id, function(frequency) {
            res.send(frequency);
        });
    });

    app.get('/api/thought',        thoughts.get);
    app.post('/api/thought',       thoughts.post);
    app.put('/api/thought/:id',    thoughts.put);
    app.delete('/api/thought/:id', thoughts.delete);

    app.get('/api/reports',        reports.get);

    app.post('/api/send_email', function(req,res) {

        var startDate = new Date();
        startDate.setDate(startDate.getDate()-7);

        var endDate = new Date();
        endDate.setDate(endDate.getDate());

        // thought_routes.getAllByTimePeriod(startDate, endDate)
        //     .then( function(thoughts) {

        //         thoughts     = _.first(thoughts, 3);
        //         descriptions = _.pluck(thoughts, 'description');
        //         descriptions = _.map(descriptions, function(description) { 
        //             if (description.length > 300) {
        //                 return description.substr(0,300) + "...";
        //             } else {
        //                 return description;
        //             }
        //         })

        //         user_routes.getUserEmailList()
        //             .then(function(recipients) {
        //                 app.render('weekly_email', {descriptions: descriptions}, function(err, html) {

        //                     params = {
        //                         html_template: html,
        //                         subject:       "Weekly Postings on Reflect Upon",
        //                         recipients:    recipients
        //                     }

        //                     return emails.sendEmail(params)
        //                 })
        //             })
        //     })
        //     .then( function(json) {
        //         res.send({success: 1});
        //     });
    });

    app.get('/api/active_users', superuser.active_users.get)

    app.get('/api/users', auth.ensureAuthenticated, function(req,res) {

        var options = {};

        //if (req.body.check_username) options.check_username

        User
            .find({})
            .sort({'created_at': -1})
            .limit(20)
            .exec(function(err, users) {

            var send_users = [];

            async.eachSeries(users, function(user, callback) {
                var send_user = user.toObject();

                Thought.find({user_id: send_user._id}).count().exec(function(err,count) {
                    send_user.num_thoughts = count;
                    send_users.push(send_user);
                    callback();
                });
            }, function(err){
                send_users = send_users;
                res.send(send_users);
            });

        });

    });

    app.delete('/api/users/:id', auth.ensureAuthenticated, function(req,res) {
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


    app.post('/api/thought/:thought/reply', thoughts.postReply);

    app.post('/api/thought/:thought/reply/:reply/annotation/', function(req, res) {

        var annotation = new Annotation({
            description:    req.body.description,
            thought_id:     req.body.thought_id,
            reply_id:       req.body.reply_id,
            user_id:        req.user._id,
            date:           new Date()
        });

        Reply.findById(req.body.reply_id, function(err, reply) {
            annotation.replies.push(reply);

            annotation.save(function(err) {

                if (err) console.log(err);

                res.send( req.body );

            });
        })

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

    app.get('/api/reply', auth.ensureAuthenticated, replies.get);

    app.delete('/api/reply/:id', replies.delete);

    app.put('/api/reply/:reply_id', function(req, res) {
        
        Reply.findById(req.params.reply_id, function(err,reply) {

            if (err) console.log(err);

            if (req.body.thanked) reply.thanked = req.body.thanked;
            if (req.body.privacy) reply.privacy = req.body.privacy;
            if (req.body.status)  reply.status  = req.body.status;

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

    app.post('/api/email', function(req, res) {
        var thought = new Thought({
            description:    req.body.plain,
            privacy:        "PRIVATE",
            user_id:        "522ebb4ee553960200000001",
            date:           new Date()
        });

        thought.save(function(err) {

            if (err) console.log(err);

            res.send( thought );

        });
    })

}