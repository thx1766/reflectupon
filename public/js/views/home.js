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

    rv.SideView = Backbone.View.extend({
        tagName: "div",
        className: "side-view-container col-md-2",

        events: {
            "click a": "goToEntry"
        },

        initialize: function() {
            this.render();
            this.listenTo(this.collection, "reset", this.render)
            this.listenTo(this.collection, "create", this.displayItem)
        },

        render: function() {
            var list_ele = "<div class='side-view'>";
            list_ele += _.map(this.collection.models, this.template).join("");
            list_ele += "</div>";
            this.$el.html(list_ele)
        },

        displayItem: function(model) {
            this.$el.find('.side-view').prepend(this.template(model));
        },

        template: function(model) {
            description = model.attributes.description.substring(0, 10);
            date = moment(model.attributes.date).format('MMM Do');
            return "<li><div>"+date+"</div><a href='javascript:;' data-model-id='"+model.attributes._id+"'>"+description+"</a></li>"
        },

        goToEntry: function(e) {
            var val = $(e.currentTarget).attr('data-model-id')
            this.trigger('go-to-entry', val)
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

    rv.PaginationView = Backbone.View.extend({
        tagName: "div",
        className: "row",
        template: Handlebars.templates['pagination'],

        events: {
            "click a.less-recent": "getNextPage",
            "click a.more-recent": "getPreviousPage",
            "click a.go-to-journal": "goToJournal",
            "click a.go-to-write": "goToWrite"
        },

        initialize: function() {
            this.listenTo(this.collection, 'reset', this.render);
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.find('.more-recent').addClass('hidden');
        },

        getNextPage: function() {
            this.trigger('get-next-entry');
            this.$el.find('.go-to-write').addClass('hidden');
            this.$el.find('.more-recent').removeClass('hidden');
        },

        getPreviousPage: function() {
            var self = this;
            this.trigger('get-previous-entry', function() {
                self.$el.find('.go-to-write').removeClass('hidden');
                self.$el.find('.more-recent').addClass('hidden');
            });
        },

        goToJournal: function() {
            this.trigger('go-to-entry');
            this.$el.find('.go-to-journal').addClass('hidden');
            this.$el.find('.go-to-write').removeClass('hidden');
            this.$el.find('.less-recent').removeClass('hidden');
        },

        goToWrite: function() {
            this.trigger('write-reflection');
            this.$el.find('.go-to-journal').removeClass('hidden');
            this.$el.find('.go-to-write').addClass('hidden');
            this.$el.find('.less-recent').addClass('hidden');
        }
    });

})();