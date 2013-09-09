var passport = require('passport');

exports.home = function(req, res) {
    res.render('home', { user: req.user });
};

exports.getlogin = function(req, res) {
    res.render('login', { user: req.user, message: req.session.messages });
};

exports.postlogin = function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            req.session.messages =  [info.message];
            return res.redirect('/login')
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/home');
        });
    })(req, res, next);
};

exports.logout = function(req, res) {
    req.logout();
    res.render('logout');
};

exports.getregister = function(req, res) {
    res.render('register', { user: req.user, message: req.session.messages });
};

exports.postregister = function(req, res, next) {

    console.log("test: " + util.inspect(req.body, false, null));

    var user = new User({ username: req.body.username, email: req.body.email, password: req.body.password });
    user.save(function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log('user: ' + user.username + " saved.");
        }
    });

};