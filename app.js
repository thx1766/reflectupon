var http     = require('http');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/reflectupon');

var Cat = mongoose.model('Cat', { name: String });

var kitty = new Cat({ name: 'Zildjian' });
kitty.save(function(err) {
 
  if (err)
   console.log(err);

  http.createServer( function(req,res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end( kitty.name );
  }).listen(2000, '127.0.0.1');
  console.log('Server running at http://127.0.0.1:2000');

});


