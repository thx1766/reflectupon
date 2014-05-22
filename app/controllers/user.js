var config          = require('../../config'),
    passport        = require('passport'),
    util            = require('util'),
    mongoose        = require('mongoose'),
    LocalStrategy   = require('passport-local').Strategy,
    forgot          = require('../../forgot'),
    fs              = require('fs'),
    sendgrid        = require('sendgrid')(
        config.sg_username,
        config.sg_password
    ),
    User    = mongoose.model('User'),
    Thought = mongoose.model('Thought'),
    UserMessage = mongoose.model('UserMessage');
    SALT_WORK_FACTOR = 10;


exports.home = function(req, res) {

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

                res.render('home', { user: req.user, topBar: true, signout: true, thoughts: thoughts, landing_page: false });
            }

    })

};

exports.newUser = function(req, res) {
    res.render('new-user', {topBar: false, body: true, landing_page: false });
};

exports.getIndex = function(req, res) {

    var options = { user: req.user, signout: false, topBar: true, landing_page: true };

    if (req.session.messages) {
        options.message = req.session.messages.message;
        req.session.messages = {};
    }

    res.render('index', options);
};

exports.postlogin = function(req, res, next) {
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

    User.findOne({username: req.body.username}, function(err, user_check) {

        if (user_check) {

            req.session.messages = {message: 'Username already exists'};
            return res.redirect('/');

        } else {

            var user = new User({ username: req.body.username, email: req.body.email, password: req.body.password });
            user.save(function(err, user_saved) {
                if(err) {
                    console.log(err);
                } else {
                    sendgrid.send({
                        to: req.body.email,
                        from: 'andrewjcasal@gmail.com',
                        subject: 'Welcome to reflectupon!',
                        html: 'Thanks for your interest! Stay tuned for further updates.<br /><br/>Thanks!<br />reflectupon team'
                    }, function(err, json) {
                        if (err) { return console.error(err); }
                        console.log(json);
                    });

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

};

exports.postForgot = function(req, res, next) {

    var email = req.body.email;

    var user = User.findOne({ email: email }, function(err, user) {
        if (user) {
            var email_options = {
                sender:   "andrewjcasal@gmail.com",
                receiver: email,
                subject:  "Forgot your password?",
                text:     'Hey,<br /><br />It seems like you might have forgotten your password. Click <a href="{{ verification_link }}">here</a> to retrieve it.<br /><br/>Thanks!<br />reflectupon team'
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

    return res.redirect('/');
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
                user.save();
                res.render('index', { message: "Password successfully reset.", topBar: false, landing_page: false})
            }
        })
    }

}

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({ username: username }, '+password', function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
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