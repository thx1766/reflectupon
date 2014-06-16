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
            if (model.get('description') != undefined && model.get('description') != "") {
                cv.CollectionContainer.prototype.addView.call(this, model);
            }
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

                var privacy = this.$el.find('.privacy-action input').is(':checked') ? "PRIVATE" : "ANONYMOUS";

                this.trigger("create-reflection", {
                    title:          this.$el.find(".postbox-title").val(),
                    description:    this.$el.find(".postbox-description").val(),
                    expression:     this.$el.find("#expression-field").val(),
                    privacy:        privacy,
                    date:           new Date()
                })
            }
        }
    });

    rv.SuperUserView = cv.Container.extend({
        tagName: 'div',
        className: 'super-user',

        template: Handlebars.compile($("#super-user-template").html()),

        initialize: function(options) {
            cv.Container.prototype.initialize.call(this);

            this.render(options);
        },

        render: function(options) {

            this.$el.html(this.template());

            this.addChild(new rv.UsersView({
                collection: options.user_collection
            }), '.user-view-container');

            this.addChild(new rv.VetThoughtsView({
                collection: options.other_thoughts_collection
            }), '.thought-view-container');

        }

    });

    rv.UsersView = cv.CollectionContainer.extend({
        tagName: 'ul',
        className: 'users-view',

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.UserView({model: model})
            })
        }

    });

    rv.UserView = Backbone.View.extend({
        tagName: 'li',
        className: 'clearfix',
        template: Handlebars.compile($("#user-template").html()),

        events: {
            'click .delete a': 'deleteUser',
            'click .confirm': 'confirmDeleteUser'
        },

        initialize: function() {
            this.render();
        },

        render: function() {
            var template_options = _.clone(this.model.attributes);
            var date = new Date(template_options.created_at);

            if (template_options.created_at) template_options.date = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
            this.$el.html(this.template(template_options));
        },

        deleteUser: function() {
            this.$el.append('<a href="javascript:;" class="confirm">Confirm Delete?</a>')
        },

        confirmDeleteUser: function() {
            this.model.destroy();
        }
    });

    rv.VetThoughtsView = cv.CollectionContainer.extend({
        tagName: 'ul',
        className: 'thought-view',

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.VetThoughtView({model: model})
            })
        }
    });

    rv.VetThoughtView = cv.SimpleModelView.extend({
        tagName: 'li',
        template: Handlebars.compile($("#vet-thought-template").html()),

        events: {
            'click .delete': 'deleteThought'
        },

        deleteThought: function() {
            this.model.destroy();
        }

    });


})();
