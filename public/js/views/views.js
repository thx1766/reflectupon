window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };

    rv.FrequencyView = Backbone.View.extend({

        tagName: "ul",
        className: "clearfix",
        template: Handlebars.compile($("#frequency-template").html()),

        initialize: function(options) {
            this.collection.on("reset", this.render, this);
            this.render(options);
        },

        render: function(options) {

            var models = this.collection.models;

            if (models.length) {
                var today,
                    model_pos = models.length - 1,
                    num_post = 0;

                for (var i=0;i<30;i++) {

                    today = new Date(new Date().setDate(new Date().getDate()-i));
                    var a = new Date(today.getFullYear(),today.getMonth(), today.getDate());

                    while(model_pos >= 0) {
                        var cool = new Date(models[model_pos].get("date"));
                        var b = new Date(cool.getFullYear(),cool.getMonth(), cool.getDate())

                        if (a.getTime() === b.getTime()) {
                            num_post = 1;
                        } else {
                            break;
                        }

                        model_pos--;
                    }

                    this.$el.append(this.template({num_post: num_post}));
                    num_post = 0;
                }
            }
        }

    })

    rv.RepliesView = Backbone.View.extend({
        tagName: "ul",
        className: "reply-collection",

        initialize: function() {
            this.render();
        },

        render: function() {
            var self = this;
            _.each(this.collection.models, function(model) {
                var replyView = new rv.ReplyView({model: model});
                self.$el.append(replyView.$el);
            });
        }
    });

    rv.ReplyView = Backbone.View.extend({
        tagName: "li",
        template: Handlebars.compile($("#reply-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            var template_options = _.clone(this.model.attributes);
            this.$el.html(this.template(template_options));
        }
    });

    rv.TooltipView = Backbone.View.extend({
        tagName:   "div",
        className: "tooltip-view",
        template:  Handlebars.compile($("#tooltip-template").html()),

        events: {
            'click button': 'createReflection'
        },

        initialize: function(options) {
            this.render(options);
            this.annotation = options.annotation || "";
        },

        render: function(options) {
            this.$el.html(this.template(options));
        },

        createReflection: function(){

            if (!this.clickedOnce) {
                this.clickedOnce = true;
                this.trigger("create-reflection", {
                    description:    this.$el.find("textarea").val(),
                    annotation:     this.annotation,
                    date:           new Date()
                });
            }
        }

    });

    rv.PostboxView = Backbone.View.extend({
        tagName:   "div",
        className: "postbox",
        template:  Handlebars.compile($("#postbox-template").html()),

        events: {

            'click .postbox-send':   'submitReflection',
            'click .postbox-write':  'poemPrompt',
            'click .postbox-sing':   'songPrompt',
            'click .postbox-submit': 'submitReflection'

        },

        initialize: function() {

            this.$el.html(this.template());

        },

        goStep2: function() {

            $(".postbox-two").fadeOut(function(){
                $(".postbox-options").fadeIn();
            })

        },

        poemPrompt: function() {
            $(".postbox-options").fadeOut(function() {
                $(".postbox-poem").fadeIn();
            });

        },

        songPrompt: function() {
            $(".postbox-options").fadeOut(function() {
                $(".postbox-song").fadeIn();
            });
        },

        submitReflection: function() {
            $.colorbox.close();

            if (!this.clickedOnce) {
                this.clickedOnce = true;
                this.trigger("create-reflection", {
                    title:          this.$el.find(".postbox-title").val(),
                    description:    this.$el.find(".postbox-description").val(),
                    expression:     this.$el.find("#expression-field").val(),
                    date:           new Date()
                })
            }
        }
    });

    rv.DashboardView = Backbone.View.extend({
        tagName: 'div',
        template: Handlebars.compile($("#dashboard-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
        }
    });

    rv.UsersView = Backbone.View.extend({
        tagName: 'ul',
        className: 'super-user',

        initialize: function() {
            this.listenTo(this.collection, "add", this.render);
        },

        render: function(model) {
            var userView = new rv.UserView({model: model});
            this.$el.append(userView.$el);
        }

    });

    rv.UserView = Backbone.View.extend({
        tagName: 'li',
        template: Handlebars.compile($("#user-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            var template_options = _.clone(this.model.attributes);
            var date = new Date(template_options.created_at);

            if (template_options.created_at) template_options.date = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
            this.$el.html(this.template(template_options));
        }
    })
})();
