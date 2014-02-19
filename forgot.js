var config = require('./config');

exports.forgot = require('./reset-password')({
    uri : 'http://localhost:2000/password_reset',
    host : 'http://smtp.sendgrid.net', port : 25,
    username: config.sg_username,
    password: config.sg_password
});