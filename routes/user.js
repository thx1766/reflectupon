var passport      = require('passport'),
    util          = require('util'),
    mongoose      = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt        = require('bcrypt'),
    sendgrid      = require('sendgrid')(
        process.env.SENDGRID_USERNAME,
        process.env.SENDGRID_PASSWORD
    ),
    SALT_WORK_FACTOR = 10;

exports.home = function(req, res) {

    exports.Thought
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

                res.render('home', { user: req.user, topBar: true, thoughts: thoughts });
            }

    })

};

exports.stream = function(req, res) {
    res.render('stream', { user: req.user, topBar: true });
};

exports.newUser = function(req, res) {
    res.render('new-user', {topBar: false, body: true });
};
exports.getIndex = function(req, res) {
    res.render('index', { user: req.user, message: req.session.messages, topBar: false });
};

exports.postlogin = function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }

        if (!user) {
            req.session.messages =  [info.message];
            return res.redirect('/login')
        }
        req.logIn(user, function(err) {

            if (err) { return next(err); }
            console.log("redirect already: " + err);
            return res.redirect('/home');
        });
    })(req, res, next);
};

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

exports.postregister = function(req, res, next) {

    var user = new User({ username: req.body.username, email: req.body.email, password: req.body.password });
    user.save(function(err) {
        if(err) {
            console.log(err);
        } else {

            sendgrid.send({
                to: req.body.email,
                from: 'sender@example.com',
                subject: 'Welcome to reflectupon!',
                html: 'Thanks for your interest!<br /><br />Here are your credentials.<br /><br/>Username: ' + req.body.username + '<br />Password: ' + req.body.password + '<br /><br/>Thanks! -reflectupon team'
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
                    return res.redirect('/new-ux');
                });
            })(req, res, next);
        }
    });

};

// User Schema
var userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true}
});

// Bcrypt middleware
userSchema.pre('save', function(next) {
    var user = this;

    if(!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});

// Password verification
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if(err) return cb(err);
        cb(null, isMatch);
    });
};

// Seed a user
var User = mongoose.model('User', userSchema);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
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