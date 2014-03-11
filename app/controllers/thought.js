var mongoose = require('mongoose')
  , util     = require('util')
  , Thought  = mongoose.model('Thought');

exports.getTwiml = function(req, res) {

    Thought.random(null,function(err, thought) {

        thought.description = thought.description.substr(0,120) + "...";

        res.render('twiml', {reflection: thought.description} );

    })
};