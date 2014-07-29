window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views,
        cv = window.rupon.common_views;

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };
    
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

    rv.WriteThoughtView = cv.TemplateView.extend({
        tagName: "div",
        className: "write-view",
        template: Handlebars.compile($("#write-template").html()),

        events: {
            'click .create': 'submitReflection',
            'click .privacy': 'changePrivacy',
            'click .write-another': 'writeAnother',
            'click .link': 'showLink'
        },

        render: function() {
            cv.TemplateView.prototype.render.call(this);
            this.$el.find('.fa-lock').tooltip();
            this.$el.find('.fa-unlock-alt').tooltip();
            this.$el.find('.fa-link').tooltip();
        },

        showLink: function() {
            var addLink = this.$el.find('input.add-link');
            addLink.removeClass('hidden');

            setTimeout(function() {
                addLink.addClass('revealed');
            }, 100);
        },

        changePrivacy: function() {

            var privacy_ele = this.$el.find('.privacy');
            var make_not_private = privacy_ele.hasClass('is_private');

            privacy_ele.toggleClass('is_private', !make_not_private);

        },

        writeAnother: function() {
            
            var textarea_ele = this.$el.find("textarea");
            textarea_ele.val('');
            this.$el.find('.expanded').removeClass('no-opacity');
            textarea_ele.focus();
        },

        submitReflection: function() {

            var self = this;
            var expanded = this.$el.find('.expanded');
            var textarea_ele = this.$el.find("textarea");
            var addlink_shown = this.$el.find('input.add-link').hasClass('revealed');
            var privacy_ele = this.$el.find('.privacy');

            if (!this.clickedOnce && $.trim(textarea_ele.val()) != "") {
                this.clickedOnce = true;

                var params = {
                    description:    textarea_ele.val(),
                    //title:          '',
                    //expression:     '',
                    privacy:        privacy_ele.hasClass('is_private') ? 'PRIVATE' : 'ANONYMOUS',
                    date:           new Date()
                }

                if (addlink_shown) params.link = this.$el.find('input.add-link').val();

                this.trigger("create-reflection", params, function() {

                    expanded.addClass('no-opacity');
                    self.clickedOnce = false;

                })
            }
        }

    })

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

            this.addChild(new rv.EmailsView({
                model: options.email
            }), '.email-container');

            this.addChild(new rv.ActiveUserRangesView({
                collection: options.user_ranges_collection
            }), '.active-user-ranges-view-container');

            this.addChild(new rv.UsersView({
                collection: options.user_collection
            }), '.user-view-container');

            this.addChild(new rv.VetThoughtsView({
                collection: options.other_thoughts_collection
            }), '.thought-view-container');

        }

    });

    rv.EmailsView = cv.TemplateView.extend({

        template: Handlebars.compile("<a href='javascript:;'>send emails</a>"),

        events: {
            'click a': 'sendEmail'
        },

        sendEmail: function(){
            this.model.save();
        }
    })

    rv.ActiveUserRangesView = cv.CollectionContainer.extend({
        tagName: "div",
        className: "active-user-ranges-view",

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.ActiveUserRangeView({model: model});
            });
        }

    });

    rv.ActiveUserRangeView = cv.TemplateView.extend({

        template: Handlebars.compile($("#active-user-ranges-template").html()),

        render: function(options) {
            var template_options = _.clone(this.model.attributes);
            template_options.start_date = moment(template_options.start_date).format('MMM D');
            template_options.end_date = moment(template_options.end_date).format('MMM D');
            cv.TemplateView.prototype.render.call(this, template_options);
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
            'click .delete': 'deleteThought',
            'click .set-private': 'setPrivate'
        },

        deleteThought: function() {
            this.model.destroy();
        },

        setPrivate: function() {
            this.model.save({privacy: 'PRIVATE'});
        }

    });


})();
