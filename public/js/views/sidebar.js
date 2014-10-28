window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    rv.Sidebar = rv.Sidebar || {};

    var getMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    rv.Sidebar.MainView = Backbone.View.extend({

        el:   ".left-nav",
        template: Handlebars.compile($("#sidebar-template").html()),

        events: {
            'click .show-postbox': 'showPostbox',
            'click .to-dashboard': 'showDashboard',
            'click .show-thoughts': 'showAllThoughts',
            'click .other-thoughts': 'showOtherThoughts',
            'click .show-super-user': 'showSuperUser'
        },

        initialize: function() {

            this.listenTo(this.collection, 'change:privacy', this.render);
            this.listenTo(this.collection, 'reset', this.render);
            this.render();
        },

        render: function() {
            var template_options = {};
            if (rupon.account_info.email == "andrewjcasal@gmail.com") {
                template_options.showSuperUser = true;
            }

            this.$el.html(this.template(template_options));
        },

        showPostbox: function() {
            this.trigger("create-reflection");
        },

        showAllThoughts: function() {
            this.trigger("view-all");
        },

        showOtherThoughts: function() {
            this.trigger("show-other-thoughts");
        },

        showSuperUser: function() {
            this.trigger("show-super-user");
        }

    });

})();