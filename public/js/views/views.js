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
        template:  Handlebars.templates['tooltip'],

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
        template:  Handlebars.templates['postbox'],

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
