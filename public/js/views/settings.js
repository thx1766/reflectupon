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
          'click #email-replies': 'clickEmailReply',
          'click #email-thanks':  'clickEmailThanks'
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
        }
    });

})();