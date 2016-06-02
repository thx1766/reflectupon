window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startCommunityPage = function(params) {

      rupon.account_info         = rupon.account_info || {};
      rupon.account_info.user_id = params.user_id;
      rupon.account_info.email   = params.email;
      rupon.account_info.username = params.username;

      var settings = params.settings;

      var popularCollection = new rupon.models.thoughtCollection(params.popular),
          tags_collection         = new rm.topicsCollection();

      var userSubscribed = _.contains(_.pluck(params.communities, "_id"),params.community._id) || false;

      var communitySidebarView = new rv.CommunitySidebarView({
        communityId: params.community._id,         
        title:       params.community.title,
        description: params.community.description,
        creator:     params.community.creator,
        members:     params.community.members,
        communities: params.communities
      });

      communitySidebarView
          .on("subscribed", function() {
            $('.write-view').removeClass('hidden');
          });

      // Only pass reference to reply_collection - since each thought handles its own replies
      var writeView = new rv.WriteView({
        tags_collection: tags_collection,
        showView:        userSubscribed
      });

      writeView
          .on("create-reflection", function(attrs) {
              attrs.communityId = params.community._id;
              var thought = new rm.thought(attrs);
              thought.save();
              popularCollection.add(thought);
          });

      var communityMainView = new rv.ThoughtsView({
        collection:       popularCollection,
        reply_collection: rm.replyCollection,
        user:             rupon.account_info
      });

      $("#container").append('<div class="main-view-container"></div><div class="side-view-container"></div>');
      $("#container .side-view-container").append(communitySidebarView.$el);
      $("#container .main-view-container").append(writeView.$el);
      $("#container .main-view-container").append('<div class="popular-container"><div class="header">Community Entries</div></div>')
      $("#container .popular-container").append(communityMainView.$el);     

      tags_collection.fetch(); 

      settings.username = rupon.account_info.username;
      var settingsView = new rv.SettingsView({
          model: new rm.userSettings(settings)
      });
      $(".me-container .dropdown").html(settingsView.$el);
    }
})();