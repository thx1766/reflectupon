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
        'click .edit-intention-container button': 'submitIntention'
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
                container.html('"' +intention+ '"');
                container.show()
                editContainer.hide();
              },
              dataType: 'JSON'
          });
        }
      }
    });

})();