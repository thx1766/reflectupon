var mongoose   = require('mongoose')
  , Community  = mongoose.model('Community')
  , User       = mongoose.model('User')
  , _          = require('underscore');

exports.post = function(req, res) {

    var community = new Community({
        title:       req.body.title,
        description: req.body.description,
        creator:     req.user
    });

    community.save(function(err) {
        res.send(community);
    });
}

exports.postMember = function(req, res) {
  User.findById(req.params.memberId, function (err, user) {
    Community.findByIdAndUpdate(req.params.id, { $addToSet: {members: user } }, function (err, community) {
      user.update({$addToSet: {communities: community}}, function(err) {
        res.send(user);
      });
    });
  });
}

exports.get = function(req, res) {
  exports.getCommunities({}, function(communities) {
    res.send(communities);
  })
}

exports.put = function(req, res) {
  Community.findById(req.params.id, function (err, community) {

      community = _.extend(community, _.pick(req.body, ['title','description']));
      community.save(function(err) {
          res.send(community);
      });

  });
}

exports.getCommunities = function(params, callback) {
  Community
    .find(params)
    .populate('creator')
    .populate('members')
    .exec(function(err, communities) {
      callback(communities);
    })
}