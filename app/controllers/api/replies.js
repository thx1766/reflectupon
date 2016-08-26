var mongoose   = require('mongoose')
  , async      = require('async')
  , Reply      = mongoose.model('Reply')
  , User       = mongoose.model('User')
  , helpers    = require('../../helpers')
  , emails     = require('../../utils/emails')
  , _          = require('underscore');

exports.get = function(req, res) {

    Reply
        .find({})
        .sort({date: -1})
        .limit(20)
        .exec(function(err, replies) {

            res.send(replies);

        });

}

exports.patch = function(req, res) {

    var options = _.pick(req.body, [
      'thanked',
      'privacy',
      'status',
      'flaggedBy'
    ]);

    if (req.body.thanked) {
        emails.sendEmailWhenThanked(reply);
    }

    if (options.flaggedBy) {
        User.findById(req.user._id).exec(function(err, user) {
                Reply.findByIdAndUpdate(req.params.reply_id, {
                        $push: {flaggedBy: req.user._id}
                    }, {'new': true}, function(err,reply) {
                        if (err) console.log(err);
                        res.send(reply);
                    });
            });
    } else {
        Reply.findByIdAndUpdate(req.params.reply_id, options, function(err,reply) {
            if (err) console.log(err);
            res.send(reply);
        });
    }
}

exports.delete = function(req, res) {

    Reply.findById(req.params.id, function(err,reply) {
        reply.remove(function(err) {
            if (err) console.log(err);
            res.send(reply);
        })
    });

}