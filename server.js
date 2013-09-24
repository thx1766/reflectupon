var http     = require('http')
  , mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , express  = require('express'),
    path     = require('path'),
    util     = require('util'),
    passport = require('passport'),
    sendgrid  = require('sendgrid')(
        process.env.SENDGRID_USERNAME,
        process.env.SENDGRID_PASSWORD
    ),
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
    replies:        [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
});

var replySchema = Schema({
    title:          String,
    description:    String,
    privacy:        String,
    user_id:        String,
    thought_id:     String,
    annotations:    [{ type: Schema.Types.ObjectId, ref: 'Annotation'}],
    date:           Date
});

var annotationSchema = Schema({
    _reply_id:      { type: String, ref: 'Reply' },
    description:    String,
    start:          Number,
    end:            Number,
    thought_id:     String,
    user_id:        String,
    date:           Date
});

var Thought    = thought_routes.Thought = mongoose.model('Thought', thoughtSchema),
    Reply      = thought_routes.Reply   = mongoose.model('Reply', replySchema),
    Annotation = thought_routes.Annotations = mongoose.model('Annotation', annotationSchema);

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

app.post('/api/thought', function(req, res) {

    var thought = new Thought({
        title:          req.body.title,
        description:    req.body.description,
        privacy:        req.body.privacy,
        user_id:        req.user._id,
        date:           new Date()
    });

    console.log("test: " + util.inspect(thought, false, null));

    thought.save(function(err) {

        if (err) console.log(err);

        res.send( req.body );

    });

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

        for (var i = 0; i < req.body.annotations.length; i++) {

            console.log("test: " + util.inspect(req.body.annotations[i], false, null));

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

        res.send( req.body );

    })

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

        //console.log("annotation: " + util.inspect(annotation, false, null));

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
    res.redirect('/')
}