var mongoose   = require('mongoose')
  , Community  = mongoose.model('Community')
  , Challenge  = mongoose.model('Challenge')
  , User       = mongoose.model('User')
  , _          = require('underscore');

exports.post = function(req, res) {

    var community = new Community({
        title:       req.body.title,
        description: req.body.description,
        creator:     req.user,
        guidelines:  req.body.guidelines,
        maxUsers:    req.body.maxUsers
    });

    community.members.push(req.user);
    User.findById(req.user._id, function(err, user) {
      community.save(function(err) {
        user.communities.push(community);
        user.save(function(err) {
          res.send(community);
        });
      });
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

      community = _.extend(community, _.pick(req.body, ['title','description', 'guidelines', 'maxUsers']));
      community.save(function(err) {
          res.send(community);
      });

  });
}

exports.putChallenge = function(req, res) {
  Community.findById(req.params.id, function(err, community) {
    Challenge.findById(req.body.challengeId, function(err, challenge) {

      Community.update(
        {_id: req.params.id, 'communityChallenges.pos': req.params.challengePos},
        {'$set': {
          'communityChallenges.$.date': new Date(),
          'communityChallenges.$.challenge': challenge
        }}, function(err) {
          res.send(community);
        })
    });
  })
}

exports.getCommunities = function(params, callback) {
  Community
    .find(params)
    .populate('creator')
    .populate('members')
    .exec(function(err, communities) {

      var options = {
        path: 'communityChallenges.challenge',
        model: 'Challenge'
      };

      Community.populate(communities, options, function(err, communities2) {
        callback(communities2);
      })
    })
}