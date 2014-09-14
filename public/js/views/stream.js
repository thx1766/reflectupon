window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

  var rv = window.rupon.views;
  var cv = window.rupon.common_views;

  rv.StreamView = Backbone.View.extend({

    tagName: "div",
    className: "thoughts-list",

    initialize: function(options) {

        this.listenTo(this.collection.fullCollection,'add', this.appendItem);
        this.listenTo(this.collection, 'create', this.prependItem);

        this.modelView = function(model) {

            console.log(model);

            var replies = model.get('replies').models;

            var one_day_ago = new Date();
            one_day_ago.setDate(one_day_ago.getDate() - 1);

            if (model.get('type') && model.get('type') == 'journey-report') {
                return new rv.JourneyReportView();

            } else if (replies && replies.length && new Date(_.last(replies).toJSON().date) > one_day_ago) {
                return new rv.ReplyCentricWrapper({
                    model: model,
                    user:  options.user,
                    reply_collection: options.reply_collection,
                    thought_collection: options.thought_collection
                })
            } else {
                return new rv.ThoughtWrapperView({
                    model: model,
                    user:  options.user,
                    reply_collection: options.reply_collection,
                    thought_collection: options.thought_collection
                })
            }

        };

        this.render(options);

        this.archived_count = 0;
        this.last_archived = false;

    },

    render: function(options) {

        _.each( this.collection.models, function(thought) {
            this.displayItem(thought, 'append')
        }, this);

        return this;
    },

    prependItem: function(thought) {
        this.displayItem(thought, 'prepend');
    },

    appendItem: function(thought) {
        this.displayItem(thought, 'append');
    },

    displayItem: function(thought, method) {

        if (thought.get("archived")) {
            this.archived_count = this.last_archived ? (this.archived_count+1) : 1;
            this.last_archived = true;
        } else {
            this.archived_count = 0;
            this.last_archived = false;
        }

        var formatThought;

        if (!this.archived_count || (this.archived_count && this.archived_count == 1)) {
            formatThought = this.modelView(thought);
        } else {
            formatThought = new rv.ArchivedItemView({ model: thought });
        }

        method = method || "append";
        this.$el[method](formatThought.$el);

        var self = this;
        this.listenTo(formatThought, 'all', function() {
            self.trigger.apply(this, arguments);
        });

    }

  });

  rv.JourneyReportView = cv.TemplateView.extend({

    template: Handlebars.compile($('#journey-report-template').html())
  })
})();