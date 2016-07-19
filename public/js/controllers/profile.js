window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startProfilePage = function(params) {
      rupon.account_info         = params.user || {};
      rupon.account_info.user_id = params.user._id;

      mixpanel.track('view-profile');
      rc.setSettings(params.settings, rupon.account_info.username);

      params.profile.isCreator = params.profile._id == params.user._id;

      if (rv.ProfileView) {
        var profilePage = new rv.ProfileView({
          model: new Backbone.Model(params.profile),
          completed: new Backbone.Collection(params.completed),
          current: new Backbone.Collection(params.current),
          communities: new Backbone.Collection(params.communities),
          created: new Backbone.Collection(params.created)
        })

        $("#container .main-view-container .main-module").append(profilePage.$el);
      }
      
      var frequencyView = new rv.FrequencyView({
        collection: new Backbone.Collection([]),
        myCommunities: params.myCommunities,
        showCommunity: true,
        myChallenges: params.myChallenges,
        showChallenges: true
      });

      $("#container .side-view-container").append(frequencyView.$el);
    }
})();