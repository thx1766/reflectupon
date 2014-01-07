window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    rv.Sidebar = rv.Sidebar || {};

    var getMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    rv.Sidebar.ThoughtView = Backbone.View.extend({
        tagName: 'li',
        template: Handlebars.compile($("#new-thought-item-template").html()),

        initialize: function() {

            var self = this;
            this.model.on('reply:change', function(thought,reply) {
                self.render();
            });

            this.render();
        },

        events: {
            'click a': 'showSingle'
        },

        render: function() {

            var model = _.clone(this.model.attributes);

            if (model.replies.models.length && model.replies.models[0].get('user_id') && (model.replies.models[0].get('user_id') == rupon.account_info.user_id)) {
                model.replied = true;
            }

            var month = new Date(model.date).getUTCMonth();
            var day = new Date(model.date).getUTCDate();

            if (model.description.length > 40) {
                model.description = model.description.trim().substring(0,40).split(" ").slice(0, -1).join(" ") + "...";
            }

            model.date = getMonth[month] + " " + day;

            this.$el.html(this.template(model));
        },

        showSingle: function() {
            this.trigger("view-thought", this.model);
        }

    });

    rv.Sidebar.ThoughtsView = Backbone.View.extend({
        tagName: 'ul',

        initialize: function() {
            this.collection.on("reset", this.render, this);
            this.render();
        },

        render: function() {
            var self = this;
            _.each(this.collection.models, function(model) {
                var sidebarThought = new rv.Sidebar.ThoughtView({model: model });
                self.$el.append(sidebarThought.$el);

                self.listenTo(sidebarThought, 'all', function() {
                    self.trigger.apply(this, arguments);
                });
            })
        }

    });

    rv.Sidebar.MainView = Backbone.View.extend({

        el: "#sidebar",

        events: {
            'click .show-postbox': 'showPostbox',
            'click .to-dashboard': 'showDashboard',
            'click .show-thoughts': 'showAllThoughts'
        },

        showPostbox: function() {
            this.trigger("create-reflection");
            $.colorbox({inline:true, href:"#postbox"});
        },

        showDashboard: function() {
            this.trigger("view-dashboard");
        },

        showAllThoughts: function() {
            this.trigger("view-all");
        }

    });

})();