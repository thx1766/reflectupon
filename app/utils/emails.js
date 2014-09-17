var config   = process.env.PORT ? require('../../config') : require('../../config_settings')
  , sendgrid = require('sendgrid')(
      config.sg_username,
      config.sg_password
    )
  , Q        = require('q');

exports.sendEmail = function(html_template, recipients) {

  var deferred = Q.defer();

  sendgrid.send({
      to: recipients, //req.body.email,
      from: 'andrewjcasal@gmail.com',
      subject: 'Welcome to reflectupon!',
      html: html_template
  }, function(err, json) {
      if (err) { return console.error(err); }
      deferred.resolve(json)
  });

  return deferred.promise;

}