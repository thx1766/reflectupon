var config   = process.env.PORT ? require('../../config') : require('../../config_settings')
  , sendgrid = require('sendgrid')(
      config.sg_username,
      config.sg_password
    )
  , Q        = require('q')
  , mongoose = require('mongoose')
  , Thought  = mongoose.model('Thought')
  , User     = mongoose.model('User')
  , userSettings = require('../controllers/api/user_settings')
  , _        = require('underscore');

exports.sendEmail = function(params, callback) {

  var email_params = {
      to:       params.recipients,
      from:     'andrewjcasal@gmail.com',
      subject:  params.subject,
      html:     params.html_template
  }

  sendgrid.send(email_params, function(err, json) {
      if (err) {
        return console.error(err);
      }

      if (callback && typeof callback == "function") {
        callback();
      }
  });

}

exports.sendNewEmail = function(email_addresses, params) {

    var email = new sendgrid.Email();
    email.setSmtpapiTos(email_addresses);
    email.from = 'andrewjcasal@gmail.com';
    email.subject = params.subject;
    email.html    = params.html;

    if (params.subs && params.subs.length) {
      _.each(params.subs, function(sub) {
        var subTextArr = _.map(email_addresses, function(email) {
          return sub.text;
        });
        email.addSubstitution(sub.type, subTextArr);
      })
    }

    email.addFilter('templates', 'template_id', '7ab8d627-e0d0-4a39-84e7-ae5bd588450c');
    sendgrid.send(email, function(err, json) {
      if (err) {
        console.log(err);
      }
    })
}
/**
 * Params
 *   - thought_id: (string) Thought, where reply was made
 */
exports.sendReplyEmailToEntryWriter = function(thought, reply) {

    // Send e-mail notification if you're getting a reply from someone else

    User.findById(thought.user_id, function(err, user) {

      User.findById(reply.user_id, function(err, replier) {

        userSettings.getSettings(user.id, function(userSettings) {

            if (!userSettings.email_reply) {
              return false;
            }

            if (reply.user_id != user.id) {

                var display_name = reply.privacy == "PUBLIC" ? replier.username : "Someone";
                var thought_description = thought.description.length <= 100 ? thought.description : thought.description.substring(0, 100) + '...';

                exports.sendNewEmail([user.email], {
                  subject: display_name + " replied to your entry!",
                  html:    display_name + ' just replied to your entry, "'+thought_description+'"',
                  subs:    [{
                    type: "-reply_description-",
                    text: reply.description
                  }]
                });
            }
        })
      })
    })
}

exports.sendReplyToOtherParticipants = function(thought, reply) {
  var user_ids = _.pluck(thought.replies, 'user_id');
  user_ids = _.uniq(user_ids);
  user_ids = _.without(user_ids, thought.user_id, reply.user_id);

  // Get full information on the users in the conversation
  User.find({
    '_id': { $in: user_ids}
  }, function(err, users) {

    //Get full information on the person who replied
    User.findById(reply.user_id, function(err, replier) {
      var display_name = reply.privacy == "PUBLIC" ? replier.username : "Someone";
      var thought_description = thought.description.length <= 100 ? thought.description : thought.description.substring(0, 100) + '...';

      exports.sendNewEmail(_.pluck(users, 'email'), {
        subject: display_name + " wrote a reply in a conversation you're part of.",
        html:    display_name + ' just replied to an entry, "'+thought_description+'"',
        subs: [{
          type: "-reply_description-",
          text: reply.description
        }]
      });
    });
  });
}

exports.sendEmailWhenThanked = function(reply) {

  User.findById(reply.user_id, function(err, user) {

    userSettings.getSettings(user.id, function(userSettings) {

      if (!userSettings.email_thanks) {
        return false;
      }

      var params = {
        recipients:    user.email,
        subject:       'Someone thanked your reply!',
        html_template: 'Someone just thanked your reply to their entries. Great job!<br /><br/>Thanks!<br />Get Your Shit Together team'
      }

      exports.sendEmail(params);

    })
  });
}