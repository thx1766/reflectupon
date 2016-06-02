window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startProfilePage = function(params) {
      var profilePage = new rv.ProfileView({
        model: new Backbone.Model(params.user)
      })

      $("#container .main-view-container .module").append(profilePage.$el);
    }
})();