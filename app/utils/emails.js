var config   = process.env.PORT ? require('../../config') : require('../../config_settings')
  , sendgrid = require('sendgrid')(
      config.sg_username,
      config.sg_password
    )
  , Q        = require('q')
  , mongoose = require('mongoose')
  , Thought  = mongoose.model('Thought')
  , User     = mongoose.model('User')
  , userSettings = require('../controllers/api/user_settings');

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

/**
 * Params
 *   - thought_id: (string) Thought, where reply was made
 */
exports.sendEmailWhenRepliedTo = function(thought_id, reply) {

    // Send e-mail notification if you're getting a reply from someone else
  Thought.findById(thought_id, function(err, thought) {

    User.findById(thought.user_id, function(err, user) {

      User.findById(reply.user_id, function(err, replier) {

        userSettings.getSettings(user.id, function(userSettings) {

            if (!userSettings.email_reply) {
              return false;
            }

            if (reply.user_id != user.id) {

                var display_name = reply.privacy == "PUBLIC" ? replier.username : "Someone";
                var thought_description = thought.description.length <= 100 ? thought.description : thought.description.substring(0, 100) + '...';

                var email = new sendgrid.Email();
                email.addTo('andrewjcasal@gmail.com');
                email.from = 'andrewjcasal@gmail.com';
                email.subject = display_name + " replied to your entry!";
                email.html = display_name + ' just replied to your entry, "'+thought_description+'"';
                email.addSubstitution("-reply_description-", reply.description);

                email.addFilter('templates', 'template_id', '7ab8d627-e0d0-4a39-84e7-ae5bd588450c');
                sendgrid.send(email, function(err, json) {
                  if (err) {
                    console.log(err);
                  }
                })
            }
        })
      })
    })
  })

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