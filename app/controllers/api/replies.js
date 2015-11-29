var mongoose   = require('mongoose')
  , async      = require('async')
  , Reply      = mongoose.model('Reply')
  , helpers    = require('../../helpers');

exports.get = function(req, res) {

    Reply
        .find({})
        .sort({date: -1})
        .limit(20)
        .exec(function(err, replies) {

            res.send(replies);

        });

}

exports.delete = function(req, res) {

    Reply.findById(req.params.id, function(err,reply) {
        reply.remove(function(err) {
            if (err) console.log(err);
            res.send(reply);
        })
    });

}