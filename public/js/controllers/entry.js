window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startEntryPage = function(message, login) {

        $('.sign-up-btn').on('click', function() {
            new rv.ModalView({view: "signup"});
        })
        $('.log-in-btn').on('click', function() {
            new rv.ModalView({view: "login"});
        });

    }

})();
