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

            this.$el.html(this.subView.$el);
        },

        renderWriteView: function() {
            var tags_collection = this.options.tags_collection;

            var view = new rv.WriteThoughtView({
                tags_collection: tags_collection,
                entry_date:      "Nov 29th"
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
            return view;
        },

        renderRecommendedView: function() {
            var todayModel = this.options.frequency_collection.models[0];
            var todayModelThought = todayModel.get('thoughts').models[0];
            var recommendedThought = todayModelThought.get('recommended')[0];

            var view = new rv.RecommendedView({
                model: new Backbone.Model(recommendedThought)
            });
            return view;
        }

    });

    rv.RecommendedView = Backbone.View.extend({
        className: 'recommended-view',
        template: Handlebars.templates['recommended'],
        initialize: function() {
            this.render();
        },

        events: {
            'click .read-more': 'readMore'
        },

        render: function(options) {
            options = options || {};

            var template_options = this.model.toJSON();

            if (!options.read_more && template_options.description.length > 400) {
                template_options.description = template_options.description.substring(0, 400) + "...";
                template_options.read_more_button = true;
            }

            this.$el.html(this.template(template_options));
        },

        readMore: function() {
            this.render({read_more: true});
        }
    });

    rv.ThoughtsView = cv.CollectionContainer.extend({
        initialize: function(options) {
            var self = this;
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                var view = new rv.ThoughtWrapperView({
                    model:              model,
                    user:               options.user,
                    reply_collection:   options.reply_collection,
                    can_reply:          options.can_reply,
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


                return view
            });
        }

    });

    rv.AnnotationContextBox = cv.SimpleModelView.extend({
        template: Handlebars.templates['activity-context']
    });

    // puts elements in order by letter position
    var condenseArray = function(input) {

        var injectAfter = function(pos, into_array, element) {
            into_array.splice(pos+1, 0, element);
            return into_array;
        }

        var injectBefore = function(pos, into_array, element) {
            into_array.splice(pos, 0, element);
            return into_array;
        }

        var overlapLater = function(pos, into_array, element) {
            old_reply_id = into_array[pos].reply_id;

            into_array[pos].end = element.end;
            into_array[pos].reply_id = old_reply_id.push(element.reply_id);

            return into_array;
        }

        var overlapEarlier = function(pos, into_array, element) {
            old_reply_id = into_array[pos].reply_id;

            into_array[pos].start = element.start;
            into_array[pos].reply_id = old_reply_id.push(element.reply_id);

            return into_array;
        }

        var overlapAround = function(pos, into_array, element) {
            old_reply_ids = into_array[pos].reply_id;
            old_reply_ids.push(element.reply_id[0]);

            into_array[pos].start = element.start;
            into_array[pos].end   = element.end;
            into_array[pos].reply_id = old_reply_ids;

            return into_array;
        }

        var overlapWithin = function(pos, into_array, element) {
            old_reply_id = into_array[pos].reply_id;
            into_array[pos].reply_id = old_reply_id.push(element.reply_id);

            return into_array;
        }

        var output = [input.shift()];

        _(input.length).times( function(n) {
            if (output[0].end < input[0].start) {
                output = injectAfter(0, output, input.shift());

            } else if (input[0].end < output[0].start) {
                output = injectBefore(0, output, input.shift());

            } else if (input[0].start > output[0].start && input[0].end > output[0].end) {
                output = overlapLater(0, output, input.shift());

            } else if (output[0].start > input[0].start && output[0].end > input[0].end) {
                output = overlapEarlier(0, output, input.shift());

            } else if (input[0].start < output[0].start && output[0].end < input[0].end) {
                output = overlapAround(0, output, input.shift());

            } else if (output[0].start < input[0].start && input[0].end < output[0].end) {
                output = overlapWithin(0, output, input.shift());
            }
        })

        return output;

    };

})();