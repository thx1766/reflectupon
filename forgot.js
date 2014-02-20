var config = require(process.env.PORT ? './config' : './config_settings');

var url = (process.env.PORT) ? "http://reflectupon.herokuapp.com" : "http://localhost:2000";
exports.forgot = require('./reset-password')({
    uri : url + '/password_reset',
    host : 'http://smtp.sendgrid.net', port : 25,
    username: config.sg_username,
    password: config.sg_password
});