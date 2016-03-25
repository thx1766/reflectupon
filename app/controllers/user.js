var config          = process.env.PORT ? require('../../config') : require('../../config_settings'),
    passport        = require('passport'),
    util            = require('util'),
    mongoose        = require('mongoose'),
    LocalStrategy   = require('passport-local').Strategy,
    forgot          = require('../../forgot'),
    fs              = require('fs'),
    helpers         = require('../helpers'),
    prompts         = require('./api/prompts')
    userSettings    = require('./api/user_settings')
    sendgrid        = require('sendgrid')(
        config.sg_username,
        config.sg_password
    ),
    moment          = require('moment'),

    User        = mongoose.model('User'),
    Thought     = mongoose.model('Thought'),
    UserMessage = mongoose.model('UserMessage'),
    _ = require('underscore'),
    Q = require('q');
    SALT_WORK_FACTOR = 10;

exports.home = function(req, res, dates) {
    Thought
        .where('user_id').ne(req.user._id)
        .where('description').ne("")
        .sort('-date')
        .limit(5)
        .exec(function(err, thoughts) {

            if (thoughts) {

                for (var x = 0; x < thoughts.length; x++) {
                    if (thoughts[x] && thoughts[x].description) {
                        thoughts[x].description = thoughts[x].description.substr(0,40) + "...";
                    }
                }

                var is_mobile = false,
                    user_id   = req.user._id;

                dates.get(is_mobile, user_id, function(frequency) {

                    helpers.getPublicThoughts({}, function(popular_thoughts) {

                        userSettings.getSettings(user_id, function(userSettings) {

                            var daydiff = function(first, second) {
                                return Math.round((second-first)/(1000*60*60*24));
                            }
                            var date1 = new Date();
                            date1.setHours(0,0,0,0);

                            var promptsParams = {
                                eligible: daydiff(moment("2016-03-12"), date1) % 30
                            }

                            prompts.getPrompts(promptsParams, function(prompts) {

                                var attr = {
                                    user:         req.user,
                                    topBar:       true,
                                    signout:      true,
                                    thoughts:     thoughts,
                                    landing_page: false,
                                    is_admin:     req.user.email == 'andrewjcasal@gmail.com' || req.user.email == 'stranovich@gmail.com',
                                    frequency:    JSON.stringify(frequency),
                                    popular:      JSON.stringify(popular_thoughts),
                                    settings:     JSON.stringify(userSettings)
                                };

                                if (prompts.length) {
                                    attr.prompt = JSON.stringify({
                                        id: prompts[0].id,
                                        description: prompts[0].description
                                    })
                                }
                                res.render('home', attr);
                            })
                        })
                    });

                });
            }

    })

};

exports.journal = function(req, res) {
    res.render('journal', {
        user: req.user,
        topBar: true,
        signout: true,
        landing_page: false,
        is_admin: req.user.username == 'andrew'
    });
};

exports.entry = function(req, res) {
    var params = {};
    if (req.params.id) {
        params._id = req.params.id;
    }
    helpers.getPublicThoughts(params, function(thoughts) {
        if (thoughts.length) {

            User.findById(thoughts[0].user_id, function(err, user) {

                res.render('entry', {
                    user: req.user,
                    topBar: true,
                    signout: false,
                    landing_page: false,
                    is_admin: false,
                    thought: JSON.stringify(thoughts),
                    userMade: user.status == "single"
                });
            })
        }
    });
};

exports.reports = function(req, res) {
    res.render('reports', { user: req.user, topBar: true, signout: true, landing_page: false, is_admin: req.user.username == 'andrew' });
};

exports.newUser = function(req, res) {
    res.render('new-user', {
        topBar: false,
        body: true,
        landing_page: false,
        is_admin: req.user.username == 'andrew'
    });
};

exports.getIndex = function(req, res) {

    var options = { user: req.user, signout: false, topBar: true, is_admin: false, landing_page: true };

    if (req.session.messages) {
        options.message = req.session.messages.message;
        req.session.messages = {};
    }

    res.render('index', options);
};

exports.postlogin = function(req, res, next) {

    req.body.username = req.body.username.trim().toLowerCase();

    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }

        if (!user) {
            req.session.messages =  {message: 'Incorrect username or password'};
            return res.redirect('/')
        }
        req.logIn(user, function(err) {

            if (err) { return next(err); }
            return res.redirect('/home');
        });
    })(req, res, next);
};

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

exports.postregister = function(req, res, next) {

    if (req.body.thoughtId) {
        Thought.findById(req.body.thoughtId, function(err, thought) {
            User.findById(thought.user_id, function(err, user) {
                user.username = req.body.username;
                user.email = req.body.email;
                user.password = req.body.password;
                user.status = "single";

                user.save(function(err, user_saved) {
                    req.logIn(user, function(err) {
                        if (err) { return next(err); }
                        return res.redirect('/home');
                    });
                })
            })
        })
    } else {

    User.findOne({username: req.body.username}, function(err, user_check) {

        if (user_check) {

            req.session.messages = {message: 'Username already exists'};
            return res.redirect('/');

        } else {

            var user = new User({ 
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                status: "beta1"
            });

            user.save(function(err, user_saved) {
                if(err) {
                    console.log(err);
                } else {
                    exports.registerEmail(req.body.email);

                    passport.authenticate('local', function(err, user, info) {
                        if (err) { return next(err) }
                        if (!user) {
                            req.session.messages =  [info.message];
                            return res.redirect('/login')
                        }
                        req.logIn(user, function(err) {
                            if (err) { return next(err); }
                            return res.redirect('/home');
                        });
                    })(req, res, next);
                }
            });

        }
    })

    }

};

exports.registerEmail = function(email) {
    sendgrid.send({
        to: email,
        from: 'andrewjcasal@gmail.com',
        subject: 'Welcome to Get Your Shit Together!',
        html: 'Thanks for your interest! Stay tuned for further updates.<br /><br/>Thanks!<br />Get Your Shit Together team'
    }, function(err, json) {
        if (err) { return console.error(err); }
        console.log(json);
    });
}
exports.postRegBetaUser = function(req, res, next) {

    var emailAddress = req.body.email;

    if (!validateEmail(emailAddress)) {
        return false;
    }

    User.findOne({email: emailAddress}, function(err, user_check) {

        if (user_check) {
            res.send({"msg": "exists"});
            return false;

        }

        var username = Math.floor((Math.random() * 1000000) + 1);

        var user = new User({
            username: username,
            email:    emailAddress,
            password: "default",
            status:   "input"
        });

        user.save(function(err, user_saved) {
            if(err) {
                console.log(err);
            } else {

                var email = new sendgrid.Email();
                email.addTo(emailAddress);
                email.from = 'andrewjcasal@gmail.com';
                email.subject = "Stay tuned for further updates!";
                email.html = "Thanks for your interest. We'll get in touch with you soon regarding our newsletter and releases.<br />" +
                    "<br />Thanks,<br />" +
                    "The Team at Get Your Shit Together<br />" +
                    "<a href='www.getyourshittogether.co'>www.getyourshittogether.co</a>";

                email.addFilter('templates', 'template_id', '25bd6eaf-6b06-4f76-a255-eb5037b0ffe7');
                sendgrid.send(email, function(err, json) {
                });
                res.send({"msg": "success"});
            }
        });

    });

}

var validateEmail = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

exports.postForgot = function(req, res, next) {

    var email = req.body.email;

    var user = User.findOne({ email: email }, function(err, user) {
        if (user) {
            var email_options = {
                sender:   "andrewjcasal@gmail.com",
                receiver: email,
                subject:  "Forgot your password?",
                text:     'Hey,<br /><br />It seems like you might have forgotten your password. Click <a href="{{ verification_link }}">here</a> to retrieve it.<br /><br/>'+

                    "The Team at Get Your Shit Together<br />" +
                    "<a href='www.getyourshittogether.co'>www.getyourshittogether.co</a>"
            };

            var reset = forgot.forgot( email_options, function(err) {

                if (err) res.end('Error sending message.')

            });

            reset.on('request', function(req_, res_) {
                req_.session.reset = { email : email, id : reset.id };

                fs.createReadStream(__dirname + '/../views/forgot.ejs').pipe(res_);
            })

        } else {
            console.log("does not contain the email address");
        }
    });

    res.send({"msg": "success"});
};

exports.postReset = function(req, res, next) {
    var password = req.body.password;
    var confirm = req.body.confirm;

    var email = req.session.reset.email;
    forgot.forgot.expire(req.session.reset.id)

    if (password == confirm && email) {
        var user = User.findOne({ email: email}, function(err, user) {
            if (user) {
                user.password = password;
                user.save(function() {
                    res.redirect('/?password-reset=1');
                });
            }
        })
    }

}

exports.getUserEmailList = function () {

    var deferred = Q.defer();

    User.find({}, function(err, users) {

        deferred.resolve(_.pluck(users, "email"))

    });

    return deferred.promise;

}

exports.checkEmail = function(req, res) {
    var email = req.body.email;

    User.findOne({ email: { $regex : new RegExp(email, "i") } }, function(err, user) {
        if (user) {
            res.send({msg: "already exists"})
        } else {
            res.send({msg: "success"})
        }
    });
}

exports.checkUsername = function(req, res) {
    var username = req.body.username;
    User.findOne({ username: { $regex : new RegExp(username, "i") } }, function(err, user) {
        if (user) {
            res.send({msg: "already exists"})
        } else {
            res.send({msg: "success"})
        }
    });
}

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(function(email, password, done) {

    /* validate e-mail */
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var params = re.test(email) ? {email: email} : {username: email};

    User.findOne(params, '+password', function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + email }); }
        user.comparePassword(password, function(err, isMatch) {
            if (err) return done(err);
            if(isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Invalid password' });
            }
        });
    });
}));