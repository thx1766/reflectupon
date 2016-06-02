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
          if (!!model.get('title')) {
            return new rv.ChallengeView({model: model});
          } else {
            return new rv.PromptView({model:model})
          }
        })
      }

    });

    rv.ChallengeView = cv.SimpleModelView.extend({
      className: "challenge-view",
      template: Handlebars.templates['challenge-view'],
      events: {
        'click .start-challenge': 'startChallenge',
        'click .pick-challenge':  'pickChallenge'
      },

      startChallenge: function() {
        var self = this;
        $.ajax({
            type: 'PUT',
            url:  '/api/challenges/' + this.model.id,
            success: function(response) {
              self.$el.find('.start-challenge').addClass('hidden');
              self.$el.find('.complete-challenge').removeClass('hidden');
            },
            dataType: 'JSON'
        });
      },

      pickChallenge: function() {
        this.trigger('picked', this.model);
      }
    });

    rv.PromptView = cv.SimpleModelView.extend({
      template: Handlebars.templates['prompt-view']
    })

})();