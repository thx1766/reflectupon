window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views,
        cv = window.rupon.common_views;
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

    rv.FrequencyView = cv.CollectionContainer.extend({

        tagName: "div",
        className: "side-view clearfix",

        template: Handlebars.compile($("#frequency-template").html()),

        initialize: function(options) {
            this.$el.html(this.template());
            cv.CollectionContainer.prototype.initialize.call(this, function(model) { 
                return new rv.FrequencyItemView({model: model});
            });
        }

    });

    rv.FrequencyItemView = cv.TemplateView.extend({

        tagName: "li",
        template: Handlebars.compile($("#frequency-item-template").html()),

        events: {
            "click a":        "goToEntry",
            "click .fa-plus": "writeNewEntry"
        },

        initialize: function() {
            this.listenTo(this.model, "thought-change", this.render);
            cv.TemplateView.prototype.initialize.call(this);
        },

        render: function() {
            var filled = this.model.get("thoughts") && this.model.get("thoughts").length > 0;

            var options = {
                date:   moment(this.model.attributes.day).format('MMM Do'),
                filled: filled
            } 
            cv.TemplateView.prototype.render.call(this,options);

            this.$el.toggleClass("filled", filled);
        },

        goToEntry: function(e) {
            this.trigger('go-to-entry', this.model.attributes.day);
        },

        writeNewEntry: function(e) {
            this.trigger('write-entry', this.model.attributes.day);
        }

    });

})();