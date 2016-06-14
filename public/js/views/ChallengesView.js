window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.MainChallengesView = cv.TemplateView.extend({
      template: Handlebars.templates['challenges-main'],

      events: {
        'click .add-challenge': 'addChallenge',
        'keyup .search-challenges': 'searchChallenges',
        'click .filter a': 'filter'
      },

      render: function(options) {
        this.$el.html(this.template(options));

        var challengesPage = new rv.ChallengesView({
          collection: this.collection
        });

        this.$el.find('.challenges-list').html(challengesPage.$el);
      },

      renderList: function(challenges) {
        this.$el.find('.challenges-list').html('');

        var challengesPage = new rv.ChallengesView({
          collection: challenges
        });

        this.$el.find('.challenges-list').html(challengesPage.$el);
      },

      filter: function(e) {
        var type = $(e.currentTarget).attr("class");
        this.renderList(this.collection.filterType(type));
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

    rv.ChallengesView = cv.CollectionContainer.extend({
      className: "",
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
        'click .pick-challenge':  'pickChallenge',
        'change #file-input':     'changeFileInput'
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
      },

      changeFileInput: function(e) {
        var file = $(e.currentTarget)[0].files[0];
        fr = new FileReader();
        fr.onload = function() {
          console.log(fr.result);
        }

        if(file == null){
          return alert('No file selected.');
        }

        this.getSignedRequest(file);
      },

      getSignedRequest: function(file){
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', `/sign-s3?file-name=${file.name}&file-type=${file.type}`);
        xhr.onreadystatechange = function() {
          if(xhr.readyState === 4){
            if(xhr.status === 200){
              var response = JSON.parse(xhr.responseText);
              self.uploadFile(file, response.signedRequest, response.url);
            }
            else{
              alert('Could not get signed URL.');
            }
          }
        };
        xhr.send();
      },

      uploadFile: function(file, signedRequest, url){
        var xhr = new XMLHttpRequest();
        var self = this;
        xhr.open('PUT', signedRequest);
        xhr.onreadystatechange = function() {
          if(xhr.readyState === 4){
            if(xhr.status === 200){
              self.$el.find('#preview').attr('src', url);
              self.$el.find('#avatar-url').val(url);
            }
            else{
              alert('Could not upload file.');
            }
          }
        };
        xhr.send(file);
      }
    });

    rv.CommunityChallengesView = cv.CollectionContainer.extend({
      template: Handlebars.templates['community-challenges-view'],

      className: "section community-challenges-view",
      container_ele: ".challenge-list",

      events: {
        'click .pick-challenge': 'chooseChallenge'
      },

      initialize: function(options) {
        this.communityId = options.communityId;
        this.isCreator = options.isCreator;

        cv.CollectionContainer.prototype.initialize.call(this, function(model) {
          var challenge = model.get('challenge') || {};
          if (this.isCreator) {
            challenge.pick = true;
          }

          return new rv.ChallengeView({model: new Backbone.Model(challenge)});
        })
      },

      chooseChallenge: function(e) {
        var self = this;
        var challengePos = $(e.currentTarget).closest('.challenge-view').index() + 1;
        $.ajax({
           type: 'GET',
            url:  '/api/challenges/',
            success: function(response) {

              response = _.map(response, function(challenge) {
                challenge.pick = true;
                return challenge;
              })

              var challengesView = new rv.ChallengesView({
                collection: new Backbone.Collection(response)
              });

              var modal = new rv.MainModal({
                  modalType: challengesView,
                  htmlTitle: 'Add a challenge',
              });

              challengesView
                  .on('picked', function(model) {
                    model.set('pick', true);
                    var chalRow = new rv.ChallengeView({
                      model: model
                    })

                    $.ajax({
                      type: 'PUT',
                      url:  '/api/communities/' + self.communityId + '/challenges/' + challengePos,
                      data: {
                        challengeId: model.get('_id')
                      },
                      success: function() {
                        $(e.currentTarget).closest('.challenge-view').html(chalRow.$el);
                        $(modal.$el).modal('hide');
                      }
                    })
                  });

              $(modal.$el).modal();
            },
            dataType: 'JSON'
        });
      }
    });

    rv.PromptView = cv.SimpleModelView.extend({
      template: Handlebars.templates['prompt-view']
    })

})();