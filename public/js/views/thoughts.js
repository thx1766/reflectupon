window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    Handlebars.registerHelper('breaklines', function(text) {
        text = Handlebars.Utils.escapeExpression(text);
        text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
        return new Handlebars.SafeString(text);
    });

    String.prototype.splice = function( idx, rem, s ) {
        return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
    };

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;
    var rh = window.rupon.helpers;
    var rmixins = window.rupon.mixins;

    var privacy = ["PRIVATE", "ANONYMOUS"];

    var toTitleCase = function(str){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    rv.WriteToThoughtsView = Backbone.View.extend({
        className: "dashboard-view",

        initialize: function(options) {
            this.options = options;

            this.listenTo(this.options.frequency_collection, 'sync', this.render)

            var self = this;
            this.on('write-reflection', function() {
                self.render("write");
            });

            this.render();
        },

        render: function(view_type, model) {

            view_type = (typeof view_type != "string") ? "recommended" : view_type;

            // show write view instead
            if (view_type == "recommended" && !this.options.frequency_collection.models[0].get('thoughts').length) {
                view_type = "write";
            }

            if (this.subView) {
                this.subView.remove();
            }

            switch (view_type) {
                case "write":
                    this.subView = this.renderWriteView();
                    break;
                case "day":
                    this.subView = this.renderDayView(model);
                    break;
                case "recommended":
                    this.subView = this.renderRecommendedView();
                    break;
            }

            if (this.subView && this.subView.$el) {
                this.$el.html(this.subView.$el);

                this.subView.trigger('content-loaded');
            }
        },

        renderWriteView: function() {
            var tags_collection = this.options.tags_collection;

            var view = new rv.WriteView({
                tags_collection: tags_collection,
                entry_date:      moment().format("MMM DD")
            });

            var self = this;
            view.on("create-reflection", function(attrs) {
                self.trigger("create-reflection", attrs);
            });
            return view;
        },

        renderDayView: function(model) {

            var view = new rv.DayView({
                model:              model,
                user:               this.options.user,
                reply_collection:   this.options.reply_collection,
                tags_collection:    this.options.tags_collection
            });

            var self = this;
            view
                .on('highlight-mine-done', function() {
                    self.trigger('highlight-mine-done'); });

            return view;
        },

        renderRecommendedView: function() {
            var todayModelThoughts = new rupon.models.thoughtCollection(this.options.frequency_collection.models[0].get('thoughts')),
                todayModelThought  = todayModelThoughts.models[0],
                replyCollection    = new this.options.reply_collection();

            if (todayModelThought.get('recommended') && todayModelThought.get('recommended').length) {
                var recommendedThought = todayModelThought.get('recommended')[0];

                var view = new rv.RecommendedView({
                    model:            new Backbone.Model(recommendedThought),
                    user:             this.options.user,
                    reply_collection: replyCollection
                });
            }

            var self = this;
            replyCollection
                .on('add', function() {
                    self.trigger('highlight-else-done');
                })

            return view;
        }

    });

    rv.RecommendedView = cv.TemplateView.extend({
        className: 'recommended-view',
        template: Handlebars.templates['recommended'],

        events: {
            'click .read-more': 'readMore'
        },

        render: function(options) {
            options = options || {};
            this.user = (options && options.user) ? options.user : this.user;

            if (options && options.reply_collection) {
                this.replyCollection =  options.reply_collection;
            }

            var template_options = this.model.toJSON();

            if (!options.read_more && template_options.description.length > 400) {
                template_options.description = template_options.description.substring(0, 400) + "...";
                template_options.read_more_button = true;
            }

            template_options.description = rh.convertLineBreaks(template_options.description, 'n');

            this.$el.html(this.template(template_options));
            this.setupAnnotations(template_options.description, this.model.get('annotations'), this.model.get('replies'));
        },

        readMore: function() {
            this.render({read_more: true});
        }
    });

    rh.extendWithEvents(rv.RecommendedView.prototype, rmixins.AnnotationMixin);

    rv.ThoughtsView = cv.CollectionContainer.extend({
        initialize: function(options) {
            var self = this;
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                var view = new rv.ThoughtWrapperView({
                    model:              model,
                    user:               options.user,
                    reply_collection:   options.reply_collection,
                    tags_collection:    options.tags_collection
                })

                view
                    .on("delete-thought", function(model) {
                        model.destroy();
                    })
                    .on("edit-thought", function(model, value) {
                        model.save({
                            description: value
                        })
                    })
                    .on("change-privacy", function(privacy, model) {
                        model.save({privacy: privacy},{wait:true})
                    })
                    .on("highlight-mine-done", function() {
                        self.trigger('highlight-mine-done');
                    });

                self
                    .on('content-loaded', function() {
                        view.renderOnContentLoad();
                    })

                return view
            });
        }

    });

    rv.AnnotationContextBox = cv.SimpleModelView.extend({
        template: Handlebars.templates['activity-context']
    });

})();