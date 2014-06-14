window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views,
        cv = window.rupon.common_views;

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };

    rv.RepliesView = cv.CollectionContainer.extend({
        tagName: "ul",
        className: "reply-collection",

        initialize: function(options) {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) { 
                options.model = model;
                return new rv.ReplyView(options);
            });
        },

        addView: function(model) {
            cv.CollectionContainer.prototype.addView.call(this, model);
        }

    });

    rv.ReplyView = cv.TemplateView.extend({
        tagName: "li",
        className: "clearfix",
        template: Handlebars.compile($("#reply-template").html()),

        initialize: function(options) {
            this.listenTo(this.model, "change", this.render);

            cv.TemplateView.prototype.initialize.call(this, options);
        },
        events: {
            "click .action": "thankReply"
        },

        render: function(options) {
            var template_options = _.clone(this.model.attributes);
            template_options.is_author = options.user && options.user.user_id == this.model.get('user_id');
            this.$el.html(this.template(template_options));
        },

        thankReply: function() {
            var attr = _.clone(this.model.attributes);
            this.trigger('thank-reply', attr);
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
                    privacy:        "ANONYMOUS",
                    date:           new Date()
                })
            }
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
