window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startCommunitiesPage = function(params) {
      rupon.account_info         = params.user || {};
      rupon.account_info.user_id = params.user._id;
      rc.setSettings(params.settings, rupon.account_info.username);

      var frequencyView = new rv.FrequencyView({
        collection: new Backbone.Collection([]),
        myCommunities: params.myCommunities,
        showCommunity: true,
        myChallenges: params.myChallenges,
        showChallenges: true
      })
      var communitiesPage = new rv.MainCommunitiesView({
        collection: new rm.communitiesCollection(params.communities)
      });

      $("#container").append('<div class="main-view-container main-module"></div><div class="side-view-container"></div>');
      $("#container .main-view-container").append(communitiesPage.$el);
      $("#container .side-view-container").append(frequencyView.$el);
    }
})();