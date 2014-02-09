var util     = require('util');

exports.getTwiml = function(req, res) {

    exports.Thought.random(null,function(err, thought) {

        thought.description = thought.description.substr(0,120) + "...";

        res.render('twiml', {reflection: thought.description} );

    })
};