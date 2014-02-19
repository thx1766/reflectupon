var url = require('url');
var EventEmitter = require('events').EventEmitter;
var ent = require('ent');
var nodemailer = require('nodemailer');

module.exports = function (opts) {
    if (typeof opts === 'string') {
        opts = { uri : opts };
    }
    
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: "SendGrid",
        auth: {
            user: opts.username,
            pass: opts.password
        }
    });
    
    var reset = new Forgot(opts);
    
    var self = function (email_options, cb) {

        var session = reset.generate();
        if (!session) return;
        
        var uri = session.uri = opts.uri + '?' + session.id;

        var mailOptions = {
            from:    email_options.sender,
            to:      email_options.receiver,
            subject: email_options.subject,
            html:    replaceWithURI(email_options.text, encodeURI(uri))
        };
        
        smtpTransport.sendMail(mailOptions, function (err, req) {
            /*
            if (err) {
                if (cb) cb(err);
                delete reset.sessions[session.id];
            }
            else {
                req.url = req.uri = uri;
                req.setHeader('content-type', 'text/html');
                req.setHeader(
                    'subject',
                    opts.subject || 'password reset confirmation'
                );
                if (cb) cb(null, req)
                if (cb && cb.length <= 1) {
                    req.end([
                        'Click this link to reset your password:\r\n',
                        '<br>',
                        '<a href="' + encodeURI(uri) + '">',
                        ent.encode(uri),
                        '</a>',
                        ''
                    ].join('\r\n'));
                }
            }*/
        });
        
        return session;
    };
    
    self.middleware = reset.middleware.bind(reset);
    
    self.expire = function (id) {
        delete reset.sessions[id];
    };
    
    return self;
};

function Forgot (opts) {
    this.sessions = opts.sessions || {};
    this.mount = url.parse(opts.uri);
    this.mount.port = this.mount.port || 80;
}

Forgot.prototype.generate = function () {
    var buf = new Buffer(16);
    for (var i = 0; i < buf.length; i++) {
        buf[i] = Math.floor(Math.random() * 256);
    }
    var id = buf.toString('base64');
    
    var session = this.sessions[id] = new EventEmitter;
    session.id = id;
    return session;
};

Forgot.prototype.middleware = function (req, res, next) {
    if (!next) next = function (err) {
        if (err) res.end(err)
    }
    
    var u = url.parse('http://' + req.headers.host + req.url);
    u.port = u.port || 80;
    var id = u.query;
    
    if (u.hostname !== this.mount.hostname
    || parseInt(u.port, 10) !== parseInt(this.mount.port, 10)
    || u.pathname !== this.mount.pathname) {
        next()
    }
    else if (!id) {
        res.statusCode = 400;
        next('No auth token specified.');
    }
    else if (!this.sessions[id]) {
        res.statusCode = 410;
        next('auth token expired');
    }
    else {
        this.sessions[id].emit('request', req, res);
    }
};

var replaceWithURI = function(str, url) {
    return str.replace("{{ verification_link }}", url)
};