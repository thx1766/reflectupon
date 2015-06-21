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
        className: "write-to-thought-view",

        initialize: function(options) {
            this.options = options;
            this.render("write");

            var self = this;
            this.on('write-reflection', function() {
                self.render("write");
            });
            this.on('go-to-entry', function(val) {
                self.render("thoughts");
                self.thoughtsView.trigger('go-to-entry', val);
            });
            this.on('write-entry', function() {
                self.render("write");
            });
        },

        render: function(view_type) {
            if (this.writeView)    this.writeView.remove();
            if (this.thoughtsView) this.thoughtsView.remove();

            switch (view_type) {
                case "write":
                    this.writeView = this.renderWriteView()
                    this.$el.html(this.writeView.$el);
                    break;
                case "thoughts":
                    this.thoughtsView = this.renderThoughtsView();
                    this.$el.html(this.thoughtsView.$el);
            }
        },

        renderWriteView: function() {
            var tags_collection = this.options.tags_collection;

            view = new rv.WriteThoughtView({
                tags_collection: tags_collection,
                entry_date:      "Nov 29th"
            });

            var self = this;
            view.on("create-reflection", function(attrs) {
                self.trigger("create-reflection", attrs);
            });
            return view;
        },

        renderThoughtsView: function(params) {
            view = new rv.DatesView({
                collection:         this.options.frequency_collection,
                user:               this.options.user,
                reply_collection:   this.options.reply_collection,
                tags_collection:    this.options.tags_collection
            });

            this.off('get-next-entry');
            this.off('get-previous-entry');

            this.on('get-next-entry', function() {
                view.trigger('get-next-entry');
            });
            this.on('get-previous-entry', function(cb) {
                view.trigger('get-previous-entry', cb);
            });
            return view;
        }

    });

    rv.DatesView = Backbone.View.extend({

        modelPosition: 0,
        tagName: "div",
        className: "dates-view",

        initialize: function(options) {

            //this.listenTo(this.collection.fullCollection,'add', this.appendItem);
            this.listenTo(this.collection, 'create', this.prependItem);

            this.on('go-to-entry',    this.goToEntry);
            this.on('get-next-entry', this.getNextEntry);
            this.on('get-previous-entry', this.getPreviousEntry);

            this.modelView = function(model) {
                return new rv.DateView({
                    model:              model,
                    user:               options.user,
                    reply_collection:   options.reply_collection,
                    thought_collection: options.thought_collection,
                    can_reply:          options.can_reply,
                    tags_collection:    options.tags_collection
                })
            };

            this.render(options);

            this.archived_count = 0;
            this.last_archived = false;

        },

        displayItem: function(date) {
            this.current_date = _.findWhere(this.collection.models, {cid: date.cid});

            if (date.get("archived")) {
                this.archived_count = this.last_archived ? (this.archived_count+1) : 1;
                this.last_archived = true;
            } else {
                this.archived_count = 0;
                this.last_archived = false;
            }

            var formatThought;

            if (!this.archived_count || (this.archived_count && this.archived_count == 1)) {
                formatThought = this.modelView(date);
            } else {
                formatThought = new rv.ArchivedItemView({ model: date });
            }

            this.$el.html(formatThought.$el)

            var self = this;
            this.listenTo(formatThought, 'all', function() {
                self.trigger.apply(this, arguments);
            });

        },

        goToEntry: function(val) {
            var model;
            if (val == "most-recent") {
                model = this.collection.first();
            } else {
                model = this.collection.where({day: val})[0];
            }
            this.displayItem(model, "append");
        },

        getNextEntry: function() {
            sorted_models = _.sortBy(this.collection.models, function(model){ return -new Date(model.attributes.date); });
            model_index = _.indexOf(sorted_models, this.current_date);
            this.displayItem(sorted_models[model_index + 1]);
        },

        getPreviousEntry: function(cb) {
            sorted_models = _.sortBy(this.collection.models, function(model){ return -new Date(model.attributes.date); });
            model_index = _.indexOf(sorted_models, this.current_date);
            this.displayItem(sorted_models[model_index - 1]);
            if (model_index == 1) cb();
        }

    });

    rv.DateView = cv.TemplateView.extend({

        className: "date-view",

        events: {
            'click .message-tabs li': 'selectTab'
        },

        template: Handlebars.templates['date-view'],

        initialize: function(options) {
            this.listenTo(this.model, 'set', this.render);
            this.render(options);
        },

        render: function(options) {
            options.day = moment(this.model.get("day")).format('MMM Do')
            cv.TemplateView.prototype.render.call(this, options);

            var thoughtsView = new rv.ThoughtsView({
                collection:         this.model.attributes.thoughts,
                user:               options.user,
                reply_collection:   options.reply_collection,
                can_reply:          options.can_reply,
                tags_collection:    options.tags_collection
            })

            this.$el.find(".thoughts-list").append(thoughtsView.$el);

            var random_thought_model = new window.rupon.models.thought();
            var randomThoughtView = new rv.RandomThoughtView({model: random_thought_model});
            this.$el.find(".section").append(randomThoughtView.$el);

            random_thought_model.fetch({
                data: {
                    'random': 1
                }
            });
        },

        selectTab: function(e) {
            $(".message-tabs li").removeClass("selected");
            $(e.currentTarget).addClass("selected");
            if ($(e.currentTarget).hasClass('entry')) {
                $(".date-view .thought-container").show();
                $(".activity-container").hide();

                _.each(this.annotationContextBoxes, function(box) {
                    box.remove();
                })

            } else if ($(e.currentTarget).hasClass('activity')) {
                $(".date-view .thought-container").hide();
                $(".activity-container").show();

                var annotation_models = this.model.attributes.activity;
                var thought_description = this.model.attributes.description;
                var self = this;
                self.annotationContextBoxes = [];
                _.each(annotation_models, function(model) {
                    thought_description = this.getThoughtDescription(model);
                    description = this.presentThoughtAnnotation(thought_description, model);


                    var params = {
                        description:       description,
                        reply_description: this.getReplyDescription(model),
                        padded_box:        description.length < 50,
                        thought_date:      this.getThoughtDate(model)
                    };

                    annotationContextBox = new rv.AnnotationContextBox({
                        model: new Backbone.Model(params)
                    });

                    self.annotationContextBoxes.push(annotationContextBox);
                    $(".activity-container").append(annotationContextBox.$el)
                }, this)
            }
        },

        presentThoughtAnnotation: function(thought_description, model) {
            if (thought_description.length) {
                var background_text = thought_description.substring(Math.max(0,model.start-75), model.end+75);
                return background_text.replace(model.description, this.highlightTemplate(model.description))
            } else {
                return this.highlightTemplate(model.description);
            }
        },

        highlightTemplate: function(description) {
            return "<span class='highlight'>"+description+"</span>"
        },

        getThoughtDate: function(model) {
            if (model && model.thoughts && model.thoughts.length) {
                return moment(model.thoughts[0].date).format('MMM Do');
            } else {
                return "";
            }
        },

        getReplyDescription: function(model) {
            if (model && model.replies && model.replies.length) {
                return model.replies[0].description;
            } else {
                return ""
            }
        },

        getThoughtDescription: function(model) {
            if (model && model.thoughts && model.thoughts.length) {
                return model.thoughts[0].description;
            } else {
                return ""
            }
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

    rv.RandomThoughtView = Backbone.View.extend({

        initialize: function() {
            this.listenTo(this.model, 'sync', this.render);
            this.render();
        },

        render: function() {
            var template = Handlebars.templates['anon-thought-item'];
            this.$el.html(template(this.model.attributes));
        }
    })

})();