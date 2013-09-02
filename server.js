var http     = require('http');
var mongoose = require('mongoose');
var express  = require('express');
var path     = require('path');
var util     = require('util');

var app      = express();

app.configure( function() {

  app.use( express.bodyParser() );
  app.use( express.static( __dirname + '/public' ));
  app.use( express.methodOverride() );
  app.use( app.router );
  app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));

});

if (process.env.NODE_ENV == 'development') {

  mongoose.connect('mongodb://localhost:27017/reflectupon');

}

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

app.listen(2000);  

console.log('Server running at http://127.0.0.1:2000');
