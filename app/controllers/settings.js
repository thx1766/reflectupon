exports.get = function(req, res) {
    var is_admin = req.user.username == 'andrew',
        page;

    res.render('settings', { user: req.user, topBar: true, signout: true, landing_page: false, is_admin: is_admin });
}