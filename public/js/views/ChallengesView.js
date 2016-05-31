window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.MainChallengesView = cv.TemplateView.extend({
      template: Handlebars.templates['challenges-main'],

      events: {
        'click .add-challenge': 'addChallenge'
      },

      render: function(options) {
        this.$el.html(this.template(options));

        var challengesPage = new rv.ChallengesView({
          challenges: options.challenges,
          prompts:    options.prompts,
          collection: this.collection
        });

        this.$el.find('.challenges').html(challengesPage.$el);
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

    rv.ChallengesView = cv.CollectionContainer.extend({
      className: "module",
      template: Handlebars.templates['challenges-view'],

      initialize: function() {
        cv.CollectionContainer.prototype.initialize.call(this, function(model) {
          return new rv.ChallengeView({model: model});
        })
      }

    });

    rv.ChallengeView = cv.SimpleModelView.extend({
      template: Handlebars.templates['challenge-view'],
      events: {
        'click .start-challenge': 'startChallenge',
        'click .pick-challenge':  'pickChallenge'
      },

      startChallenge: function() {
        $.ajax({
            type: 'PUT',
            url:  '/api/challenges/' + this.model.id,
            success: function(response) {
            },
            dataType: 'JSON'
        });
      },

      pickChallenge: function() {
        this.trigger('picked', this.model);
      }
    });

})();