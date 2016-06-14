window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.MainCommunitiesView = cv.TemplateView.extend({
      template: Handlebars.templates['communities-main'],

      events: {
        'click .add-challenge': 'addChallenge',
        'keyup .search-challenges': 'searchChallenges'
      },

      render: function(options) {
        this.$el.html(this.template(options));

        var challengesPage = new rv.CommunitiesView({
          collection: this.collection
        });

        this.$el.find('.challenges').html(challengesPage.$el);
      },

      renderList: function(challenges) {
        this.$el.find('.challenges').html('');

        var challengesPage = new rv.CommunitiesView({
          collection: challenges
        });

        this.$el.find('.challenges').html(challengesPage.$el);
      },

      searchChallenges: function() {
        var input = this.$el.find('.search-challenges').val();
        this.renderList(this.collection.search(input));
      },

      addChallenge: function() {

        var self = this;
        var addChallengesView = new rv.AddChallengesView();

        var modal = new rv.MainModal({
            modalType: addChallengesView,
            htmlTitle: 'Add a challenge',
        });

        addChallengesView
            .on('added', function(title) {
                self.$el.append('<li><a href="/challenges/'+title+'">'+title+'</a></li>');
                $(modal.$el).modal('hide');
            });

        $(modal.$el).modal();

      }
    });

    rv.CommunitiesView = cv.CollectionContainer.extend({
      className: "",
      template: Handlebars.templates['challenges-view'],

      initialize: function() {
        cv.CollectionContainer.prototype.initialize.call(this, function(model) {
          return new rv.CommunityView({model: model});
        })
      }

    });

    rv.CommunityView = cv.SimpleModelView.extend({
      className: "challenge-view",
      template: Handlebars.templates['community-view']
    });

})();