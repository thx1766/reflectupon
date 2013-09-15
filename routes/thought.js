exports.single = function(req, res) {
    res.render('single', { id: req.params.id, user: req.user, topBar: true });
};