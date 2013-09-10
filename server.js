var http     = require('http'),
    mongoose = require('mongoose'),
    express  = require('express'),
    path     = require('path'),
    util     = require('util'),
    passport = require('passport'),
    bcrypt   = require('bcrypt'),
    user_routes = require('./routes/user');

var app      = express();

app.configure( function() {

    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
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

mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://localhost:27017/reflectupon');

var Thought = mongoose.model('Thought', { title: String, description: String, privacy: String });

app.get( '/',                               user_routes.getlogin);
app.get( '/home',   ensureAuthenticated,    user_routes.home);
app.get( '/login',                          user_routes.getlogin);
app.post('/login',                          user_routes.postlogin);
app.get( '/logout',                         user_routes.logout);
app.get( '/register',                       user_routes.getregister);
app.post('/register',                       user_routes.postregister);

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
        description:    req.body.description,
        privacy:        req.body.privacy
    });

    thought.save(function(err) {

        if (err) console.log(err);

        res.send( req.body );

    });

});

app.get('/account', ensureAuthenticated, function(req,res) {
    res.send( req.user );
});

app.listen(process.env.PORT || 2000);

console.log('Server running at http://127.0.0.1:2000');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}