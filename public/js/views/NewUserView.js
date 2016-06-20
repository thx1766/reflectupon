window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.NewUserView = cv.TemplateView.extend({
      template: Handlebars.templates['new-user'],

      events: {
        'click button': 'redirectHome'
      },

      render: function(options) {
        cv.TemplateView.prototype.render.call(this,options);

        var communitiesView = new rv.CommunitiesView({
          collection: options.communities,
          pick: true
        });

        var self = this;
        this.communityIds = [];

        communitiesView.on('picked', function(id) {
          if (_.contains(self.communityIds, id)) {
            self.communityIds = _.without(self.communityIds, id);
          } else {
            self.communityIds.push(id);
          }
        })
        this.$el.find('.communities-container').html(communitiesView.$el);
      },

      redirectHome: function() {
        $.ajax({
          type: 'POST',
          url:  '/new-user-communities',
          data: {
            communities: this.communityIds
          },
          success: function() {
            window.location.replace('/home');
          }
        })
      }
    });

})();