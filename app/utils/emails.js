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
 *   - user_id:    (string) User, who wrote the reply
 */
exports.sendEmailWhenRepliedTo = function(thought_id, user_id) {

    // Send e-mail notification if you're getting a reply from someone else
  Thought.findById(thought_id, function(err, thought) {
    
    User.findById(thought.user_id, function(err, user) {
          
      userSettings.getSettings(user.id, function(userSettings) {

          if (!userSettings.email_reply) {
            return false;
          }

          if (user_id != user.id) {
              var params = {
                  recipients:    user.email,
                  subject:       'Someone replied to your entry!',
                  html_template: 'Someone just replied to one of your entries. Take a look at your entries to see their reply!<br /><br/>Thanks!<br />reflectupon team'
              }

              exports.sendEmail(params);
          }
      })
    })
  })

}