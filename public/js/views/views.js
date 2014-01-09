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

    rv.MessageView = Backbone.View.extend({
        tagName: "li",
        template: Handlebars.compile($("#message-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template(this.model.attributes));
        }
    });

    rv.MessageFeedView = Backbone.View.extend({
        tagName: "ul",

        initialize: function() {
            this.collection.on("reset", this.render, this);
            this.render();
        },

        render: function() {
            var self = this;
            _.each(_.first(this.collection.models,3), function(model) {
                var message = new rv.MessageView({model: model});
                self.$el.append(message.$el);
            })
        }
    })

    rv.IndexView = Backbone.View.extend({

        el: ".left-side",

        events: {
            'click .or-register': 'showRegister',
            'click .or-login': 'showLogin'
        },

        showRegister: function() {
            $("#register-form").fadeIn();
            $(".or-register").fadeOut();
            $("#login-form").slideUp(500, function() {
                $(".or-login").fadeIn();
            });
        },

        showLogin: function() {
            $("#login-form").slideDown();
            $(".or-login").fadeOut();
            $("#register-form").fadeOut(500, function() {
                $(".or-register").fadeIn();
            });
        }

    })

    rv.ThoughtView = Backbone.View.extend({

        tagName: "div",
        className: "thoughts-list",

        initialize: function(options) {

            this.collection.on('reset', this.render, this );
            this.collection.on('add', this.displayItem, this);

            this.render();
        },

        render: function() {

            _.each( this.collection.models, this.displayItem, this);

            return this;
        },

        displayItem: function(thought) {

            var formatThought = new rv.ThoughtItemView({ model: thought });

            this.$el.prepend(formatThought.$el);

            var self = this;
            this.listenTo(formatThought, 'all', function() {
                self.trigger.apply(this, arguments);
            });

        },

    });

    rv.ThoughtItemView = Backbone.View.extend({

        tagName:   "div",
        className: "thought-row tooltipbottom section",
        template: Handlebars.compile($("#thought-item-template").html()),

        events: {
            'click a': 'showSingle',
            'selectstart .description': 'takeAnnotation'
        },

        initialize: function() {
            this.model.on("change", this.modelChanged, this);
            this.$el.tooltip({
                event_in: "start-tooltip"
            });
            this.render();
        },

        render: function(options) {

            var formatThought = this.model.toJSON();

            options = options || {};
            options.showMore = options.showMore || false;

            if (!options.showMore && formatThought.description.length >350) {
                formatThought.description = formatThought.description.trim().substring(0,330).split(" ").slice(0, -1).join(" ").replace(/\n/g,"<br>") + "...";
                formatThought.read_more = true;
            }

            var outputHtml = this.template(formatThought);
            this.$el.html(outputHtml);
        },

        modelChanged: function(model, changes) {
            this.render();
        },

        showSingle: function() {
            var attrs = {
                showMore: true
            }
            this.render(attrs);
        },

        takeAnnotation: function() {

            var self = this;
            $(document).one('mouseup', function() {
                if (this.getSelection() != "") {
                    $(".thoughts-list").addClass("select-text");
                    self.$el.siblings().removeClass("selected")
                    self.$el.addClass("selected");

                    self.trigger("start-tooltip", self.$el);
                }
            });
        }

    });

    rv.TooltipView = Backbone.View.extend({
        tagName: "div",
        className: "tooltip-view",
        template: Handlebars.compile($("#tooltip-template").html()),

        events: {
            'click a': 'createReflection'
        },

        initialize: function(options) {
            this.render(options);
            this.annotation = options.annotation || "";
        },

        render: function(options) {
            this.$el.html(this.template(options));
        },

        createReflection: function(){

            this.collection.create({
                description:    this.$el.find("textarea").val(),
                annotation:     this.annotation
            });
        }

    });

    rv.PostboxView = Backbone.View.extend({
        tagName: "div",
        className: "postbox",
        template: Handlebars.compile($("#postbox-template").html()),

        events: {

            'click .postbox-send': 'goStep2',
            'click .postbox-write': 'poemPrompt',
            'click .postbox-sing': 'songPrompt',
            'click .postbox-submit': 'submitReflection'

        },

        initialize: function() {

            this.title          = this.$('.postbox-title');
            this.description    = this.$('.postbox-description');
            this.privacy        = this.$('.postbox-privacy');
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

            this.collection.create({

                title:          this.title.val(),
                description:    this.description.val(),
                expression:     this.$el.find("#expression-field").val(),
                privacy:        this.privacy.val()

            });
        }
    });

    var highlightSet = [];

    rv.DashboardView = Backbone.View.extend({
        tagName: 'div',
        template: Handlebars.compile($("#dashboard-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
        }
    })

})();
