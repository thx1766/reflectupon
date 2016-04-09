window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startSettingsPage = function(params) {

        $('.log-in-btn').on('click', function() {
            new rv.ModalView({view: "login"});
        });

        var settings =     params.settings;
        settings.username = params.username;
        var settingsView = new rv.SettingsView({
            model: new rm.userSettings(settings)
        });

        $("#container").html(settingsView.$el);
    }

})();
