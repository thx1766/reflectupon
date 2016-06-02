var mongoose   = require('mongoose')
  , Challenge  = mongoose.model('Challenge')
  , _          = require('underscore');

exports.post = function(req, res) {
    var challenge = new Challenge({
        title:        req.body.title,
        description:  req.body.description,
        instructions: req.body.instructions
    });

    challenge.save(function(err) {
        res.send(challenge);
    });
}

exports.put = function(req, res) {
  User.findById(req.user._id, function(err, user) {
    Challenge.findById(req.params.id, function(err, challenge) {
      var user_challenge = {
        date:   new Date(),
        status: "started",
        challenge: challenge
      };

      user.update({$addToSet: { user_challenges: user_challenge}}, function(err) {
        res.send(user_challenge);
      })
    });
  })
}

exports.get = function(req, res) {
  exports.getChallenges({}, function(challenges) {
    res.send(challenges);
  })
}

exports.getChallenges = function(params, callback) {
  Challenge
    .find(params)
    .exec(function(err, challenges) {
      callback(challenges);
    })
}