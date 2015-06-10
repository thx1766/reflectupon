var mongoose   = require('mongoose')
  , async      = require('async')
  , _          = require('underscore')
  , Thought    = mongoose.model('Thought')
  , User       = mongoose.model('User');

exports.active_users = {};

exports.active_users.get = function(req, res) {

  var i = 0 + (new Date().getDay());
  var results = [];

  async.whilst(
      function() { return i < 100; },
      function(callback) {

          var result = {};

          var startDate = new Date(new Date().setHours(0,0,0,0));
          startDate.setDate(startDate.getDate()-i);

          var endDate = new Date(new Date().setHours(0,0,0,0));
          endDate.setDate(endDate.getDate()-(i-7));

          result.start_date = startDate;
          result.end_date = endDate;

          var params = {
              date: {
                  $gte: startDate,
                  $lte: endDate
              }
          };

          Thought.find(params, function(err, thoughts) {

              if (err) console.log(err);

              var unique_users_ids = getUniqueUserIds(thoughts);
              result.active_user_count = unique_users_ids.length;

              var unique_emails = getUniqueUserEmails(unique_users_ids, function(unique_emails) {
                result.active_users = unique_emails;
                results.push(result);
                i = i+7;
                callback();
              });
          });
      },
      function() {
          res.send(results);
      }
  );

}

var getUniqueUserIds = function(thoughts) {
  return _.reduce(thoughts, function(unique_users, thought) {
    if (unique_users.indexOf(thought.user_id) == -1) {
        unique_users.push(thought.user_id);
    }
    return unique_users;
  }, []);
};

var getUniqueUserEmails = function(unique_users_ids, callback) {
  var unique_emails = [];
  async.eachSeries(unique_users_ids, function(unique_user_id, callback) {

    User.findById(unique_user_id, function(err, user) {
      if (user && user.email) unique_emails.push(user.email);
      callback();
    });
  }, function(err) {
    callback(unique_emails);
  })
}