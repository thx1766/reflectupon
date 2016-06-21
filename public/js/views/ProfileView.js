window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.ProfileView = cv.SimpleModelView.extend({
      className: "profile-view",
      template: Handlebars.templates['profile-view'],

      events: {
        'click .intention-header .fa-pencil':     'editIntention',
        'click .edit-intention-container button': 'submitIntention',
        'click .personal-url .fa-pencil':         'editPersonalUrl',
        'click .edit-personal-container button': 'submitPersonalUrl',
        'change #file-input': 'changeFileInput'
      },

      render: function(options) {
        cv.SimpleModelView.prototype.render.call(this, options);

        var completed = new rv.ChallengesView({
          collection: options.completed
        });
        this.$el.find('.completed-challenges-container').html(completed.$el);

        var current = new rv.ChallengesView({
          collection: options.current
        });
        this.$el.find('.current-challenges-container').html(current.$el);

        var communities = new rv.CommunitiesView({
          collection: options.communities
        });
        this.$el.find('.communities-managed-container').html(communities.$el);

        var challengesCreated = new rv.ChallengesView({
          collection: options.created
        })
        this.$el.find('.challenges-created-container').html(challengesCreated.$el)
      },

      editIntention: function() {
        var editContainer = this.$el.find('.edit-intention-container');
        this.$el.find('.intention-container').hide();
        editContainer.show();
        editContainer.find('textarea').focus();
      },

      submitIntention: function() {
        var editContainer = this.$el.find('.edit-intention-container');
        var container = this.$el.find('.intention-container');
        var intention = editContainer.find('textarea').val();
        var self = this;

        if ($.trim(intention) != "") {
          $.ajax({
              type: 'PUT',
              url:  '/api/profile/',
              data: {
                  intention: intention
              },
              success: function(response) {
                container.html(intention);
                container.show()
                editContainer.hide();
              },
              dataType: 'JSON'
          });
        }
      },

      editPersonalUrl: function() {
        var editContainer = this.$el.find('.edit-personal-container');
        this.$el.find('.personal-url-container').hide();
        editContainer.show();
        editContainer.find('textarea').focus();
      },

      submitPersonalUrl: function() {
        var editContainer = this.$el.find('.edit-personal-container');
        var container = this.$el.find('.personal-url-container');
        var personalUrl = editContainer.find('textarea').val();
        var self = this;

        if ($.trim(personalUrl) != "") {
          $.ajax({
              type: 'PUT',
              url:  '/api/profile/',
              data: {
                  personal_url: personalUrl
              },
              success: function(response) {
                container.html(personalUrl);
                container.show()
                editContainer.hide();
              },
              dataType: 'JSON'
          });
        }
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
        var fileName = 'profile-' + this.model.id +'.png';
        xhr.open('GET', `/sign-s3?file-name=${fileName}&file-type=${file.type}&image-type=profile`);
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

              $.ajax({
                  type: 'PUT',
                  url:  '/api/profile/',
                  data: {
                      avatar_url: url
                  },
                  success: function(response) {
                    self.$el.find('#preview').attr('src', '');
                    setTimeout(function() {
                      self.$el.find('#preview').attr('src', url);
                    },500)
                    self.$el.find('#avatar-url').val(url);
                  },
                  dataType: 'JSON'
              });
            }
            else{
              alert('Could not upload file.');
            }
          }
        };
        xhr.send(file);
      }
    });

})();