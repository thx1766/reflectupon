var helpers = require('../../helpers');

exports.get = function(req, res) {
    var options = {
      date:    helpers.getDateRange(30),
      user_id: req.user._id,
      limit:   3
    };

    helpers.getThoughtsWithAnnotation(options, function(thoughts) {
      res.send(thoughts)
    });
}