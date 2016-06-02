window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startChallengesPage = function(params) {

      var challengesPage = new rv.MainChallengesView({
        challenges: params.challenges,
        prompts:    params.prompts,
        collection: new Backbone.Collection(params.challenges.concat(params.prompts))
      });

      $("#container").append('<div class="main-view-container"></div><div class="side-view-container"></div>');
      $("#container .main-view-container").append(challengesPage.$el);
    }
})();