window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var rm = window.rupon.models;
    var cv = window.rupon.common_views;
    var rh = window.rupon.helpers;

    rv.DayView = cv.TemplateView.extend({

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
                collection:         new rupon.models.thoughtCollection(this.model.attributes.thoughts),
                user:               options.user,
                reply_collection:   options.reply_collection,
                tags_collection:    options.tags_collection
            })

            var self = this;
            thoughtsView
                .on('highlight-mine-done', function() {
                    self.trigger('highlight-mine-done');
                });

            this.$el.find(".thoughts-list").append(thoughtsView.$el);
        },

        selectTab: function(e) {

            if ($(e.currentTarget).hasClass('selected')) {
                return;
            }

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
            thought_description = rh.convertLineBreaks(thought_description, 'n');
            if (thought_description.length) {
                var after_word = thought_description.substr(model.end+75).indexOf(" ");

                var background_text = thought_description.substring(Math.max(0,model.start-75), model.end + 75 + after_word);
                return background_text.replace(model.description, this.highlightTemplate(model.description));
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

})();