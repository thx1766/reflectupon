var http     = require('http')
  , mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , express  = require('express'),
    path     = require('path'),
    util     = require('util'),
    passport = require('passport'),
    bcrypt   = require('bcryptjs'),
    sendgrid  = require('sendgrid')(
        process.env.SENDGRID_USERNAME,
        process.env.SENDGRID_PASSWORD
    ),
    user_routes     = require('./routes/user'),
    thought_routes  = require('./routes/thought');

var app      = express();

var accountSid = 'ACdff89a1df2ba2a2d90fa0cd39ffe1f81';
var authToken = "04916a518707f9e480e6593006c3d236";
var client = require('twilio')(accountSid, authToken);
/*
client.sms.messages.create({
    body: "Jenny please?! I love you <3",
    to: "+17327407815",
    from: "+17324104303"
}, function(err, message) {

    console.log("message: " + util.inspect(message.body, false, null));
});*/

/*
client.messages.list(function(err, data) {
    data.messages.forEach(function(sms) {
        console.log("new sms: " + util.inspect(sms.body, false, null));
    });
}); */

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

mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://127.0.0.1:27017/reflectupon');

var thoughtSchema = Schema({
    title:          String,
    description:    String,
    expression:     String,
    privacy:        String,
    user_id:        String,
    annotation:     String,
    date:           Date,
    replies:        [{
        type: Schema.Types.ObjectId,
        ref: 'Reply' }]
});

thoughtSchema.statics.random = function(user,cb) {
    this.count(function(err, count) {
        if (err) return cb(err);
        var rand = Math.floor(Math.random() * 10);
        this.findOne().sort("-date").skip(rand)
            .where('description').ne("")
            .exec(cb);
    }.bind(this));
};

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
// User Schema
var userSchema = mongoose.Schema({
    username:   { type: String, required: true, unique: true }
  , email:      { type: String, required: true, unique: true }
  , password:   { type: String, required: true}
  , created_at: { type: Date }
  , updated_at: { type: Date }
});

// Bcrypt middleware
userSchema.pre('save', function(next) {
    var date = new Date;
    this.updated_at = date;
    if (!this.created_at) {
        this.created_at = date;
    }

    var user = this;

    console.log("save user: " + util.inspect(user, false, null));

    if(!user.isModified('password')) return next();

    bcrypt.genSalt(10, function(err, salt) {
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

var Thought    = user_routes.Thought   = thought_routes.Thought = mongoose.model('Thought', thoughtSchema),
    Reply      = user_routes.Reply     = thought_routes.Reply   = mongoose.model('Reply', replySchema),
    Annotation = thought_routes.Annotations = mongoose.model('Annotation', annotationSchema),
    User       = user_routes.User      = mongoose.model('User', userSchema);

app.get( '/',                               user_routes.getIndex);
app.get( '/home',   ensureAuthenticated,    user_routes.home);
app.get( '/new-ux', ensureAuthenticated,    user_routes.newUser);
app.get( '/stream', ensureAuthenticated,    user_routes.stream);
app.get( '/thought/:id', ensureAuthenticated, thought_routes.single);
app.get( '/today', ensureAuthenticated,     thought_routes.today);
app.get( '/me', ensureAuthenticated,        user_routes.me);
app.post('/login',                          user_routes.postlogin);
app.get( '/logout',                         user_routes.logout);
app.post('/register',                       user_routes.postregister);
app.get( '/twiml',                          thought_routes.getTwiml);
app.get('/dashboard', ensureAuthenticated,  user_routes.getDashboard)

app.get('/api/', function(req, res) {
  
});

app.get('/api/thought/:type', function(req, res) {

    var params = {},
        limit  = null,
        date_sort = null;

    if (req.user) {

        if (req.params.type == "my-posts") {
            params.user_id = req.user._id;

        } else if (req.params.type == "other-posts") {
            params.user_id = { $ne: req.user._id };
            limit = 5;
            date_sort = {date: -1};
            params.privacy = "ANONYMOUS"
        } else {

            params._id = req.params.type;

        }
    }

    Thought.find( params )
        .populate('replies')
        .limit(limit)
        .sort(date_sort)
        .exec(function(err, thoughts) {

            if (thoughts) {
                if (thoughts.length == 1) {
                    res.send(thoughts[0])
                } else {
                    res.send(thoughts);
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

        res.send( req.body );

    });

});

app.put('/api/thought/:id', function(req,res) {
    Thought.findById(req.params.id, function(err,thought) {
        thought.privacy = req.body.privacy;
        thought.save(function(err) {
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

app.get('/api/thought/:thought/reply/', function(req, res) {

    console.log("annotation: " + util.inspect(req.params.thought, false, null));
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
            //console.log("repliesss: " + util.inspect(oneThought.replies, false, null));

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