var passport = require('passport'),
    util = require('util'),
    mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt   = require('bcrypt'),
    sendgrid  = require('sendgrid')(
        process.env.SENDGRID_USERNAME,
        process.env.SENDGRID_PASSWORD
    ),
    SALT_WORK_FACTOR = 10;

console.log(process.env.SENDGRID_USERNAME);
console.log(process.env.SENDGRID_PASSWORD);

exports.home = function(req, res) {
    res.render('home', { user: req.user, topBar: true });
};

exports.stream = function(req, res) {
    res.render('stream', { user: req.user, topBar: true });
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
            return res.redirect('/home');
        });
    })(req, res, next);
};

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

exports.postregister = function(req, res, next) {

    //console.log("test: " + util.inspect(req.body, false, null));

    var user = new User({ username: req.body.username, email: req.body.email, password: req.body.password });
    user.save(function(err) {
        if(err) {
            console.log(err);
        } else {

            sendgrid.send({
                to: 'andrewjcasal@gmail.com',
                from: 'sender@example.com',
                subject: 'Hello World',
                text: 'Sending email with NodeJS through SendGrid!'
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