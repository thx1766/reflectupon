var http     = require('http'),
    mongoose = require('mongoose'),
    express  = require('express'),
    path     = require('path'),
    util     = require('util'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt   = require('bcrypt'),
    SALT_WORK_FACTOR = 10;

var app      = express();

app.configure( function() {

    app.use( express.static( __dirname + '/public' ));
    app.use( express.cookieParser());
    app.use( express.bodyParser() );
    app.use( express.session({ secret: 'keyboard cat' }));
    app.use( passport.initialize());
    app.use( passport.session());
    app.use( express.methodOverride() );
    app.use( app.router );
    app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));

});

if (process.env.NODE_ENV == 'development') {

  mongoose.connect('mongodb://localhost:27017/reflectupon');

}


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

var Thought = mongoose.model('Thought', { title: String, description: String });
 
app.get('/api/', function(req, res) {
  
});

app.get('/api/thought', function(req, res) {

  Thought.find({}, function(err, thoughts) {

      //console.log("test: " + util.inspect(thoughts, false, null));
    res.send(thoughts);
  });

});

app.post('/api/thought/', function(req, res) {

    console.log(req.body.title);

    var thought = new Thought({
        title:          req.body.title,
        description:    req.body.description
    });

    thought.save(function(err) {

        if (err) console.log(err);

        res.send( req.body );

    });

});

app.post('/register', function(req, res, next) {

    console.log("test: " + util.inspect(req.body, false, null));

    var user = new User({ username: req.body.username, email: req.body.email, password: req.body.password });
    user.save(function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log('user: ' + user.username + " saved.");
        }
    });

});

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            req.session.messages =  ["hello"];
            return res.redirect('/login')
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/');
        });
    })(req, res, next);
});

app.get('/logout', function(req,res) {
    req.logout();
    res.redirect('/login.html');
});

app.get('/account', ensureAuthenticated, function(req,res) {
    res.send( req.user );
});

app.listen(2000);  

console.log('Server running at http://127.0.0.1:2000');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}