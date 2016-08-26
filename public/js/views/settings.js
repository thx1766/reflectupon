window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;
    var rh = window.rupon.helpers;
    var rmixins = window.rupon.mixins;

    rv.SettingsView = cv.SimpleModelView.extend({
        className: "settings-view",
        template: Handlebars.templates['settings'],

        events: {
          'click #email-prompts': 'clickEmailPrompts',
          'click #email-replies': 'clickEmailReply',
          'click #email-thanks':  'clickEmailThanks',
          'click .display-name .fa-pencil': 'editUsername',
          'click .edit-name .fa-check': 'submitUsername'
        },

        clickEmailPrompts: function() {
          var isClicked = this.$el.find('#email-prompts').prop("checked");
          this.model.save({
            email_prompts: isClicked
          });
        },

        clickEmailReply: function() {
          var isClicked = this.$el.find('#email-replies').prop("checked");
          this.model.save({
            email_reply: isClicked
          });
        },

        clickEmailThanks: function() {
          var isClicked = this.$el.find('#email-thanks').prop("checked");
          this.model.save({
            email_thanks: isClicked
          });
        },
        editUsername: function() {
          this.$el.find('.edit-name').show();
          this.$el.find('.display-name').hide();
        },
        submitUsername: function() {
          var newUsername = this.$el.find('.edit-name input').val();
          var self = this;
          this.model.save({
            username: newUsername
          }, {
            success: function() {
              self.$el.find('.edit-name').hide();
              self.$el.find('.display-name').show();
              self.$el.find('.display-name span').text(newUsername);
              $('.navbar-right .username-label').text(newUsername);
              self.$el.find('.error-msg').hide();
            },
            error: function(model, response, options) {
              self.$el.find('.error-msg').show();
            }
          })
        }
    });

})();