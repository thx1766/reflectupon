exports.get = function(req, res) {
    var is_admin = req.user.username == 'andrew',
        page;
    if (is_admin) {
      res.render('superuser', { user: req.user, topBar: true, signout: true, landing_page: false, is_admin: is_admin });
    } else {
      res.redirect('/home');
    }
}