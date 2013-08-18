var http     = require('http');
var mongoose = require('mongoose');
var express  = require('express');

var app = express();
mongoose.connect('mongodb://localhost/reflectupon');

var Thought = mongoose.model('Thought', { description: String });  
 
app.get('/', function(req, res) {
  
  var thought = new Thought({ description: 'Zildjian' });
  thought.save(function(err) {
   
    if (err)
     console.log(err);
     
     res.send( thought.description );

  });
  
});

app.listen(2000);  

console.log('Server running at http://127.0.0.1:2000');
 
