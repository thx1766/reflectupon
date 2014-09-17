var mongoose = require('mongoose')
  , util     = require('util')
  , Thought  = mongoose.model('Thought')
  , Q        = require('q');

exports.getTwiml = function(req, res) {

    Thought.random(null,function(err, thought) {

        thought.description = thought.description.substr(0,120) + "...";

        res.render('twiml', {reflection: thought.description} );

    })

};

exports.getAllByTimePeriod = function(start_date, end_date) {

    var deferred = Q.defer();

    var params = {
        date: {
            $gte: start_date,
            $lte: end_date
        },
        privacy: "ANONYMOUS"
    };

    Thought.find(params, function(err, thoughts) {
      deferred.resolve(thoughts);
    });

    return deferred.promise;

}