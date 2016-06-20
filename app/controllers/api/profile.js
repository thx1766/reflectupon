var mongoose     = require('mongoose')
  , async        = require('async')
  , User         = mongoose.model('User')
  , helpers      = require('../../helpers')
  , _            = require('underscore');

exports.post = function(req, res) {
}

exports.get = function(req, res) {
}

exports.put = function(req,res) {
    var user_id = req.user._id;
    var attrs = _.pick(req.body, ['intention', 'personal_url', 'avatar_url']);
    User.findByIdAndUpdate(user_id, attrs, function(err, user) {
        res.send(user);
    });
}