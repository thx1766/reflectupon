window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startNewUserPage = function(params) {

      var newUserView = new rv.NewUserView({
        communities: new Backbone.Collection(params.communities)
      });

      $("#container").append('<div class="main-view-container"></div>');
      $("#container .main-view-container").append(newUserView.$el);
    }
})();