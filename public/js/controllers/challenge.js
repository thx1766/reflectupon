window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startChallengePage = function(params) {
      var challengePage = new rv.ChallengeView({
        model: new Backbone.Model(params.challenge),
        extended: true
      })

      $("#container .main-view-container .module").append(challengePage.$el);
    }
})();