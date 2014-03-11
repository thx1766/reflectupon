var config;

if (process.env.PORT) {
    config   = require('./config');
} else {
    config   = require('./config_settings');
}

var http     = require('http')
  , mongoose = require('mongoose')
  , fs       = require('fs')
  , forgot   = require('./forgot')
  , express  = require('express')
  , passport = require('passport');

var app = express();
exports.app = app;

app.configure( function() {

    app.set('views', __dirname + '/app/views');
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
    app.use( forgot.forgot.middleware);
});

mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://127.0.0.1:27017/reflectupon');

// Bootstrap models
var models_path = __dirname + '/app/models';
fs.readdirSync(models_path).forEach(function (file) {
    if (~file.indexOf('.js')) require(models_path + '/' + file)
});

require('./config/routes')(app);

app.listen(process.env.PORT || 2000);
console.log('Server running at http://127.0.0.1:2000');