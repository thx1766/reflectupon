window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var toTitleCase = function(str){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    var privacy = ["PRIVATE", "ANONYMOUS"];

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

        tagName: "div",
        template: Handlebars.compile($("#index-template").html()),

        events: {
            'click .or-register': 'showRegister',
            'click .or-login': 'showLogin'
        },

        initialize: function(){
            this.render();
        },

        render: function() {
            this.$el.html(this.template())
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

        }

    });

    rv.ThoughtItemView = Backbone.View.extend({

        tagName:   "div",
        className: "thought-row tooltipbottom section",
        template: Handlebars.compile($("#thought-item-template").html()),

        events: {
            'click a':               'showSingle',
            'selectstart .message':  'takeAnnotation',
            'click .privacy-status': 'changePrivacy'
        },

        initialize: function() {
            this.model.on("change", this.modelChanged, this);
            this.activateTooltip();
            this.render();
        },

        render: function(options) {

            var template_options = _.clone(this.model.attributes);

            options = options || {};
            template_options.showMore = options.showMore || false;

            if (!template_options.showMore && template_options.description.length >300) {
                template_options.description = template_options.description.trim().substring(0,300).split(" ").slice(0, -1).join(" ").replace(/\n/g,"<br>") + "...";
                template_options.read_more = true;
            }

            if (template_options.privacy) {

                if (template_options.privacy == privacy[0]) {
                    template_options.privacy_inverse = privacy[1];
                } else if (template_options.privacy == privacy[1]){
                    template_options.privacy_inverse = privacy[0];
                }

                template_options.privacy = toTitleCase(template_options.privacy.toLowerCase());
                template_options.privacy_inverse = toTitleCase(template_options.privacy_inverse.toLowerCase());
            }

            var outputHtml = this.template(template_options);
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
        },

        changePrivacy: function() {

            var model_privacy = this.model.get("privacy");

            if (privacy[0] == model_privacy) {
                model_privacy = privacy[1];
            } else if(privacy[1] == model_privacy) {
                model_privacy = privacy[0];
            }

            this.trigger("change-privacy", model_privacy, this.model);
        },

        activateTooltip: function() {
            var self = this;

            this.$el.tooltip({
                event_in:          "tooltip-start",
                event_out:         "tooltip-end",
                opacity:           1,
                on_complete:       function() {
                    self.trigger("tooltip-initialized");
                },
                arrow_left_offset: 280,
                tooltip_class:     "thought-tooltip"
            });
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
            this.trigger("create-reflection", {
                description:    this.$el.find("textarea").val(),
                annotation:     this.annotation
            });
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

            this.collection.create({

                title:          this.$el.find(".postbox-title").val(),
                description:    this.$el.find(".postbox-description").val(),
                expression:     this.$el.find("#expression-field").val()

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
