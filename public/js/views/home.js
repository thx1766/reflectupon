window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    Handlebars.registerHelper('breaklines', function(text) {
        text = Handlebars.Utils.escapeExpression(text);
        text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
        return new Handlebars.SafeString(text);
    });

    var rv = window.rupon.views;
    var rm = window.rupon.models;
    var cv = window.rupon.common_views;

    var privacy = ["PRIVATE", "ANONYMOUS"];

    var toTitleCase = function(str){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    rv.MainView = Backbone.View.extend({
        tagName: "div",
        className: "main-view-container",
        template: Handlebars.compile($("#home-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
        }
    });

    rv.FrequencyView = cv.CollectionContainer.extend({

        tagName: "div",
        className: "post-frequency clearfix",

        container_ele: "ul",

        template: Handlebars.compile($("#frequency-template").html()),

        initialize: function(options) {
            this.$el.html(this.template());
            cv.CollectionContainer.prototype.initialize.call(this, function(model) { 
                return new rv.FrequencyItemView({model: model});
            });
        },

    });

    rv.FrequencyItemView = cv.TemplateView.extend({

        tagName: "li",

        initialize: function() {
            this.listenTo(this.model, "change", this.render);
            cv.TemplateView.prototype.initialize.call(this);
        },

        render: function() {
            var options = {};
            if (this.model.get("thoughts")) options.filled = this.model.get("thoughts").length;
            cv.TemplateView.prototype.render.call(this,options);
        },

        template: Handlebars.compile($("#frequency-item-template").html()),

    });

    rv.ThoughtView = Backbone.View.extend({

        tagName: "div",
        className: "thoughts-list",

        initialize: function(options) {

            this.listenTo(this.collection.fullCollection,'add', this.appendItem);
            this.listenTo(this.collection, 'create', this.prependItem);

            this.modelView = function(model) {
                return new rv.ThoughtItemView({ model: model, user: options.user })
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

    rv.ThoughtItemView = cv.Container.extend({

        tagName:   "div",
        className: "thought-row tooltipbottom clearfix",
        template: Handlebars.compile($("#thought-item-template").html()),

        user: null,

        events: {
            'click .past-posts-summary a': 'showPastPosts',
            'click .read-more':         'showSingle',
            'selectstart .description': 'takeAnnotation',
            'click .privacy-status':    'changePrivacy',
            'click .edit':              'editThought',
            'click .delete':            'deleteThought',
            'click .archive':           'archiveThought',
            'keypress textarea':        'submitEdit',
            'click .preempt-reply':     'writeReply', 
            'keypress .write-reply input': 'submitReply'
        },

        initialize: function(options) {

            cv.Container.prototype.initialize.call(this);

            this.model.on("change", this.modelChanged, this);
            this.model.on("destroy", this.remove, this);
            this.activateTooltip();
            this.render(options);

            this.user = options.user;

            this.replyCollection = new rm.replyCollection(this.model.get("replies").models);
            this.replyCollectionContainer = new rv.RepliesView({collection: this.replyCollection, user: options.user});

            var self = this;
            this.replyCollectionContainer.on('thank-reply', function(attr) {
                var reply = self.replyCollection.findWhere(attr);
                reply.save({'thanked': !reply.get('thanked') }, {wait: true, patch: true});
            });

            this.addChild(this.replyCollectionContainer, ".reply-collection-container");
        },

        render: function(options) {

            this.$el.find(".privacy-status").trigger("tooltip-end");
            var template_options = _.clone(this.model.attributes);

            var created_at = new Date(template_options.date).getTime();
            var today = new Date().getTime();

            var difference_ms = today - created_at;

            this.user = (options && options.user) ? options.user : this.user;
            template_options.is_author = this.user && this.user.user_id == this.model.get('user_id');

            template_options.can_edit  = (difference_ms/(1000*60*60*24)) <= 1;
            template_options.can_reply = !this.model.get('replies').length;

            template_options.duration  = moment(this.model.get("date")).fromNow();
            
            template_options.past_posts = this.model.get('history') ? this.model.get('history').length : null;

            if (!template_options.is_author) this.$el.addClass('other-author');

            options = options || {};
            template_options.showMore = options.showMore || false;

            if (!template_options.showMore && template_options.description.length >300) {
                template_options.description = template_options.description.trim().substring(0,300).split(" ").slice(0, -1).join(" ") + "...";
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

            cv.Container.prototype.detachChildren.call(this);
            this.$el.html(outputHtml);
            cv.Container.prototype.reattachChildren.call(this);
        },

        modelChanged: function(model, changes) {
            this.render();
        },

        showSingle: function() {
            var attrs = {
                showMore: true
            }

            this.$el.addClass('show-replies');
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
        },

        editThought: function() {
            this.$el.addClass("editing");
        },

        submitEdit: function(e) {
            if (e.which == 13){
                var value = this.$el.find("textarea").val();
                this.$el.removeClass("editing");
                this.trigger("edit-thought", value, this.model);
            }
        },

        deleteThought: function() {
            this.trigger("delete-thought", this.model);
        },

        archiveThought: function() {
            this.trigger("archive-thought", this.model);
        },

        writeReply: function() {

            if (typeof this.user == "undefined") {
                $('#myModal').modal();
            } else {
                this.$el
                    .find('.preempt-reply').addClass('hidden').end()
                    .find('.write-reply').css('display','block');
            }
        },

        submitReply: function(e) {

            switch(e.which) {
                case 13:
                    var description = this.$el.find('.write-reply input').val()

                    if ($.trim(description) != "") {

                        var attr = {
                            description: description,
                            thought_id:  this.model.get('_id')
                        };

                        var self = this;
                        this.replyCollection.create({user_id: this.user.user_id, thought_id: attr.thought_id, description: attr.description}, { success: function() {
                            self.$el.find('.write-reply').addClass('hidden');
                        }});
                    }

            }

        },

        showPastPosts: function() {

            this.$el.find('.past-posts-summary a').addClass('hidden');
            this.$el.find(".past-posts-container").append('<div class="past-posts"></div>');

            _.each(this.model.get('history'), function(thought) {
                var past_post_view = new rv.PastPostView({model: new rm.thought(thought) });
                this.$el.find(".past-posts").append(past_post_view.$el);
            }, this);

        }

    });

    rv.PastPostView = cv.SimpleModelView.extend({
        tagName: "div",

        template: Handlebars.compile($("#past-post-template").html()),
    });

    rv.ArchivedItemView = Backbone.View.extend({
        tagName: "div",
        template: Handlebars.compile($("#archived-item-template").html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template());
        }
    });

    rv.nagView = Backbone.View.extend({
        tagName: "div",
        template: Handlebars.compile($("#nag-template").html()),

        events: {
            'click .close': 'close'
        },

        initialize: function() {
            this.render();
            this.model.on("change", this.render, this)
        },

        render: function() {
            var template_options = _.clone(this.model.attributes);

            if (template_options.message_id == "1") {

                // dismissed longer than 2 days ago
                var d = new Date();
                var show_date = new Date(d.setDate(d.getDate() - 2));
                var date_dismissed = new Date(template_options.updated_at);

                if (show_date > date_dismissed && template_options.dismissed < 3) {

                    template_options.copy = "Using your cursor, highlight text on any entry in this page to activate a new form. Using this annotation, you'll be able to reflect on this by writing a new entry. Try it out!";          
                    this.$el.html(this.template(template_options));

                }

            }

        },

        close: function(e) {
            e.preventDefault();
            this.trigger("dismiss-message");
        }
    })

    rv.RecommendedView = cv.CollectionContainer.extend({
        tagName: "div",
        className: "recommended-view",

        template: Handlebars.compile($("#recommended-template").html()),

        initialize: function(options) {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.ThoughtItemView({
                    model: model,
                    user:  options.user
                });
            });
        }

    });

    rv.RecommendedItemView = Backbone.View.extend({
        tagName: "div",
        template: Handlebars.compile($("#recommended-item-template").html()),

        initialize: function() {
            this.render();

        },

        render: function() {
            var template_options = {
                duration: moment(this.model.get("date")).fromNow()
            };
            
            this.$el.html(this.template(template_options));

            var thoughtView = new rv.ThoughtItemView({model:this.model});

            var self = this;
            
            this.listenTo(thoughtView, 'all', function() {
                self.trigger.apply(this, arguments);
            });

            this.$el.find(".rec-thought-container").html(thoughtView.$el);
        }
    });

    rv.PaginationView = Backbone.View.extend({
        tagName: "div",
        template: Handlebars.compile($("#pagination-template").html()),

        events: {
            "click a": "getNextPage"
        },

        initialize: function() {
            this.listenTo(this.collection, 'reset', this.render);
            this.render();
        },

        render: function() {
            this.$el.toggle(this.collection.hasNextPage());
            this.$el.html(this.template());
        },

        getNextPage: function() {
            this.collection.getNextPage({fetch:true});
        }
    });

})();