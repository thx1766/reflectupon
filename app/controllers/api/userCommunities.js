var mongoose   = require('mongoose')
  , UserCommunity  = mongoose.model('UserCommunity')
  , _          = require('underscore');

exports.post = function(req, res) {
    var userCommunity = new UserCommunity({
        title: req.body.title
    });

    userCommunity.save(function(err) {
        res.send(userCommunity);
    });
}

exports.get = function(req, res) {
  exports.getCommunities({}, function(communities) {
    res.send(communities);
  })
}

exports.put = function(req, res) {
  UserCommunity.findById(req.params.id, function (err, userCommunity) {

      userCommunity = _.extend(userCommunity, _.pick(req.body, ['title','description']));
      userCommunity.save(function(err) {
          res.send(userCommunity);
      });

  });
}

exports.getUserCommunities = function(params, callback) {
  UserCommunity
    .find(params)
    .exec(function(err, communities) {
      callback(communities);
    })
}