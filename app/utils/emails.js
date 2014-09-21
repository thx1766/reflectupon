var config   = process.env.PORT ? require('../../config') : require('../../config_settings')
  , sendgrid = require('sendgrid')(
      config.sg_username,
      config.sg_password
    )
  , Q        = require('q');

exports.sendEmail = function(params) {

  var deferred = Q.defer();

  email_params = {
      to:       params.recipients,
      from:     'andrewjcasal@gmail.com',
      subject:  params.subject,
      html:     params.html_template
  }

  sendgrid.send(email_params, function(err, json) {
      if (err) { return console.error(err); }
      deferred.resolve(json)
  });

  return deferred.promise;

}