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

        tags: [],

        events: {
            'click .create':        'submitReflection',
            'click .privacy':       'changePrivacy',
            'click .write-another': 'writeAnother',
            'click .link':          'showLink',
            'click .tag':           'openTagsMenu'
        },

        render: function(options) {
            delete options.entry_date;
            cv.TemplateView.prototype.render.call(this, options);
            this.$el.find('textarea').autosize();

            var writeTagsView = new rv.WriteTagsView({collection: options.tags_collection});

            var self = this;
            writeTagsView
                .on('create-new-tag', function(attr) {
                    options.tags_collection.create({name: attr}, {wait: true});
                })
                .on('activate-tag', function(attr, cb) {
                    if (_.contains(self.tags, attr)) {
                        var tag_index = self.tags.indexOf(attr);
                        self.tags.splice(tag_index, 1);
                        cb(false)
                    } else {
                        self.tags.push(attr);
                        cb(true)
                    }
                })

            this.$el.find('.tags-container').html(writeTagsView.$el);
            this.$el.find('.fa').tooltip();
            this.$el.find('textarea').autosize();
        },

        showLink: function() {
            var addLink = this.$el.find('input.add-link');
            addLink.removeClass('hidden');

            setTimeout(function() {
                addLink.addClass('revealed');
            }, 100);
        },

        openTagsMenu: function() {
            //this.$el.find('.tags-content').removeClass('hidden');
            $('#myModal').modal();
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

                var date = new Date();
                // date.setDate(date.getDate()-(5));

                var params = {
                    description:    textarea_ele.val(),
                    //title:          '',
                    //expression:     '',
                    privacy:        'PRIVATE', //privacy_ele.hasClass('is_private') ? 'PRIVATE' : 'ANONYMOUS',
                    date:           date,
                    tag_ids:        self.tags
                }

                if (addlink_shown) params.link = this.$el.find('input.add-link').val();

                this.trigger("create-reflection", params)
            }
        }

    });

    rv.WriteTagsView = cv.CollectionContainer.extend({
        container_ele: 'ul',
        className: 'tags-content hidden',
        template: Handlebars.compile("<input placeholder='Add new' /><div class='tags'><ul></ul></div>"),

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.WriteTagView({model: model});
            });
        },

        events: {
            'keypress input': 'createNew'
        },

        createNew: function(e){
            switch (e.which) {
                case 13:
                    var new_tag = this.$el.find('input').val();

                    if ($.trim(new_tag) != "") {
                        this.trigger('create-new-tag', new_tag);
                    }

                    this.$el.find('input').val("");

            }
            
        }
    });

    rv.WriteTagView = cv.SimpleModelView.extend({
        tagName: 'li',
        template: Handlebars.compile("<i class='fa fa-tag'></i>{{name}}"),

        events: {
            'click': 'activateTag'
        },

        activateTag: function() {
            var self = this;
            this.trigger('activate-tag', this.model.id, function(is_activated) {
                self.$el.toggleClass('activated', is_activated)
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

})();
