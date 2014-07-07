window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    Handlebars.registerHelper('breaklines', function(text) {
        text = Handlebars.Utils.escapeExpression(text);
        text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
        return new Handlebars.SafeString(text);
    });

    var rv = window.rupon.views;
    var rm = window.rupon.models;
    var cv = window.rupon.common_views;

    rv.MainView = Backbone.View.extend({
        tagName: "div",
        className: "main-view-container",
        template: Handlebars.compile($("#home-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
        }
    });

    rv.FrequencyView = cv.CollectionContainer.extend({

        tagName: "div",
        className: "post-frequency clearfix",

        container_ele: "ul",

        template: Handlebars.compile($("#frequency-template").html()),

        initialize: function(options) {
            this.$el.html(this.template());
            cv.CollectionContainer.prototype.initialize.call(this, function(model) { 
                return new rv.FrequencyItemView({model: model});
            });
        },

    });

    rv.FrequencyItemView = cv.TemplateView.extend({

        tagName: "li",

        initialize: function() {
            this.listenTo(this.model, "change", this.render);
            cv.TemplateView.prototype.initialize.call(this);
        },

        render: function() {
            var options = {};
            if (this.model.get("thoughts")) options.filled = this.model.get("thoughts").length;
            cv.TemplateView.prototype.render.call(this,options);
        },

        template: Handlebars.compile($("#frequency-item-template").html()),

    });

    rv.PastPostsView = cv.CollectionContainer.extend({
        tagName: "div",
        className: "past-posts",

        num_elements: 3,

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.PastPostView({model: model});
            });
        }
    });

    rv.PastPostView = cv.TemplateView.extend({
        tagName: "div",
        className: "clearfix",

        template: Handlebars.compile($("#past-post-template").html()),

        render: function() {
            var template_options = _.clone(this.model.attributes);
            template_options.date = moment(template_options.date).format('MMM D');
            cv.TemplateView.prototype.render.call(this, template_options);
        }
    });

    rv.ArchivedItemView = Backbone.View.extend({
        tagName: "div",
        className: "thought-row tooltipbottom clearfix",
        template: Handlebars.compile($("#archived-item-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
        }
    });

    rv.nagView = Backbone.View.extend({
        tagName: "div",
        template: Handlebars.compile($("#nag-template").html()),

        events: {
            'click .close': 'close'
        },

        initialize: function() {
            this.render();
            this.model.on("change", this.render, this)
        },

        render: function() {
            var template_options = _.clone(this.model.attributes);

            if (template_options.message_id == "1") {

                // dismissed longer than 2 days ago
                var d = new Date();
                var show_date = new Date(d.setDate(d.getDate() - 2));
                var date_dismissed = new Date(template_options.updated_at);

                if (show_date > date_dismissed && template_options.dismissed < 3) {

                    template_options.copy = "Using your cursor, highlight text on any entry in this page to activate a new form. Using this annotation, you'll be able to reflect on this by writing a new entry. Try it out!";          
                    this.$el.html(this.template(template_options));

                }

            }

        },

        close: function(e) {
            e.preventDefault();
            this.trigger("dismiss-message");
        }
    }) /*

    rv.RecommendedView = cv.CollectionContainer.extend({
        tagName: "div",
        className: "recommended-view",

        template: Handlebars.compile($("#recommended-template").html()),

        initialize: function(options) {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.ThoughtWrapperView({
                    model: model,
                    user:  options.user
                });
            });
        }

    });

    rv.RecommendedItemView = Backbone.View.extend({
        tagName: "div",
        template: Handlebars.compile($("#recommended-item-template").html()),

        initialize: function() {
            this.render();

        },

        render: function() {
            var template_options = {
                duration: moment(this.model.get("date")).fromNow()
            };
            
            this.$el.html(this.template(template_options));

            var thoughtView = new rv.ThoughtWrapperView({model:this.model});

            var self = this;
            
            this.listenTo(thoughtView, 'all', function() {
                self.trigger.apply(this, arguments);
            });

            this.$el.find(".rec-thought-container").html(thoughtView.$el);
        }
    }); */

    rv.PaginationView = Backbone.View.extend({
        tagName: "div",
        template: Handlebars.compile($("#pagination-template").html()),

        events: {
            "click a": "getNextPage"
        },

        initialize: function() {
            this.listenTo(this.collection, 'reset', this.render);
            this.render();
        },

        render: function() {
            this.$el.toggle(this.collection.hasNextPage());
            this.$el.html(this.template());
        },

        getNextPage: function() {
            this.collection.getNextPage({fetch:true});
        }
    });

})();