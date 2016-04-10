var mongoose     = require('mongoose')
  , async        = require('async')
  , UserSettings = mongoose.model('UserSettings')
  , User         = mongoose.model('User')
  , helpers      = require('../../helpers')
  , emails       = require('../../utils/emails')
  , _            = require('underscore');

exports.post = function(req, res) {
}

exports.get = function(req, res) {
    exports.getSettings();
}

exports.getSettings = function(user_id, callback) {

    User.findById(user_id, function(err, user) {

        UserSettings
            .findOne({
                user: user })
            .exec(function(err, userSettings) {

                if (!userSettings) {
                    userSettings = new UserSettings({
                        user: user
                    })

                    userSettings.save(function(err) {
                        if (err) console.log(err);
                        callback(userSettings, user);
                    });
                } else {
                    callback(userSettings, user);
                }

            });
    })
}

exports.eligibleUsers = function(users, property, callback) {

    /* Users that don't have user settings */
    async.mapSeries(users, function(user, callback) {

        UserSettings
            .findOne({
                user: user})
            .exec(function(err, userSettings) {

                if (!userSettings) {
                    userSettings = new UserSettings({
                        user: user
                    })

                    userSettings.save(function(err) {
                        if (err) console.log(err);
                        callback(err, user);
                    });
                } else {
                    callback(err, user);
                }
            });

    }, function(err, results) {
        var params = {};

        params['user']   = {$in: users};
        params[property] = true;

        UserSettings.find(params, function(err, userSettings) {
            var validUserIds = _.map(_.pluck(userSettings,'user'), function(user_id) {
                return user_id.toString();
            });
            var responseUsers = _.filter(users, function(user) {
                return _.contains(validUserIds, user._id.toString());
            });
            console.log(users);
            console.log(userSettings);
            callback(responseUsers);
        })
    });
}

exports.put = function(req,res) {
    var user_id = req.query.user_id;

    User.findById(user_id, function(err, user) {

        UserSettings
            .findOne({
                user: user})
            .exec(function(err, userSettings) {

                if (userSettings) {
                    userSettings.email_reply = req.body.email_reply;
                    userSettings.email_thanks = req.body.email_thanks;
                    userSettings.email_prompts = req.body.email_prompts;
                    userSettings.save(function(err) {
                        if (err) console.log(err);
                        res.send(userSettings);
                    });
                }

            });
    });
}