var http     = require('http')
  , mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , express  = require('express'),
    path     = require('path'),
    util     = require('util'),
    passport = require('passport'),

    user_routes     = require('./routes/user'),
    thought_routes  = require('./routes/thought');

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

var thoughtSchema = Schema({
    title:          String,
    description:    String,
    privacy:        String,
    user_id:        String,
    date:           Date,
    replies:        [{ type: Schema.Types.ObjectId, ref: 'Reply' }]
});

var replySchema = Schema({
    title:          String,
    description:    String,
    privacy:        String,
    user_id:        String,
    date:           Date
});

var Thought = mongoose.model('Thought', thoughtSchema);
var Reply   = mongoose.model('Reply', replySchema);

app.get( '/',                               user_routes.getIndex);
app.get( '/home',   ensureAuthenticated,    user_routes.home);
app.get( '/stream', ensureAuthenticated,    user_routes.stream);
app.get( '/thought/:id', ensureAuthenticated, thought_routes.single);
app.post('/login',                          user_routes.postlogin);
app.get( '/logout',                         user_routes.logout);
app.post('/register',                       user_routes.postregister);

app.get('/api/', function(req, res) {
  
});

app.get('/api/thought/:type', function(req, res) {

    var params;

    if (req.params.type == "my-posts") {

        params = {

            user_id: req.user._id

        }

    } else if (req.params.type == "stream") {

        params = {

            privacy: "ANONYMOUS"

        }

    } else {

        params = {

            _id: req.params.type

        }

    }

    Thought.find( params, function(err, thoughts) {

        //console.log("test: " + util.inspect(thoughts, false, null));

        if (thoughts.length == 1) {
            res.send(thoughts[0])
        } else {
            res.send(thoughts);
        }

    });

});

app.post('/api/thought/:type', function(req, res) {

    var thought = new Thought({
        title:          req.body.title,
        description:    req.body.description,
        privacy:        req.body.privacy,
        user_id:        req.user._id,
        date:           new Date()
    });

    thought.save(function(err) {

        if (err) console.log(err);

        res.send( req.body );

    });

});

app.get('/api/reply/', function(req, res) {

});

app.post('/api/reply/',function(req, res) {

    var reply = new Reply({
        title:          req.body.title,
        description:    req.body.description,
        thought_id:     req.body.thought_id,
        date:           new Date()
    });

    reply.save(function(err) {

        console.log("test: " + util.inspect(reply, false, null));

        if (err) console.log(err);

        res.send( req.body );

    })

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