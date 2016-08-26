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

    rv.NewUserContainer = cv.TemplateView.extend({
        template: Handlebars.templates['new-user-module'],

        render: function(options) {
            cv.TemplateView.prototype.render.call(this, options);

            var challengeView = new rv.ChallengeView({model: new rm.challenge(options.challenge) });
            this.$el.find('.challenge-container').html(challengeView.$el);
        }
    });

    rv.MainView = Backbone.View.extend({
        tagName: "div",
        className: "main-view",
        template: Handlebars.templates['home'],

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
        }
    });

    rv.ArchivedItemView = Backbone.View.extend({
        tagName: "div",
        className: "thought-row tooltipbottom clearfix",
        template: Handlebars.templates['archived-item'],

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
        }
    });

    rv.nagView = Backbone.View.extend({
        tagName: "div",
        template: Handlebars.templates['nag'],

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
    });

})();