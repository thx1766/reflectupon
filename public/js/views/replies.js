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
        className: "reply-collection section",

        initialize: function(options) {

            cv.CollectionContainer.prototype.initialize.call(this, function(model) { 
                options.model = model;
                return new rv.ReplyView(options);
            });
        },

        render: function(){

            //this.$el.toggleClass('hidden', this.collection.models.length == 0);
            cv.CollectionContainer.prototype.render.call(this);

        }

    });

    rv.ReplyView = cv.TemplateView.extend({
        tagName: "li",
        className: "clearfix",
        template: Handlebars.templates['reply-item'],

        initialize: function(options) {
            this.listenTo(this.model, "change", this.render);
            this.user = options.user;

            cv.TemplateView.prototype.initialize.call(this, options);
        },
        events: {
            "click .action":      "thankReply",
            "click .make-public": "makePublic"
        },

        render: function(options) {

            var template_options = _.clone(this.model.attributes);

            var params = {
                is_author: this.user && this.user.user_id == this.model.get('user_id'),
                can_reply: this.user && !template_options.is_author,
                is_public: this.model.get('privacy') == "AUTHOR_TO_PUBLIC"
            }

            template_options = _.extend(template_options, params);
            this.$el.html(this.template(template_options));
        },

        thankReply: function() {
            var attr = _.clone(this.model.attributes);
            this.trigger('thank-reply', attr);
        },

        makePublic: function() {
            var attr = _.clone(this.model.attributes);
            this.trigger('make-reply-public', attr);
            this.$el.find('.make-public').addClass('hidden');
            this.$el.find('.public').removeClass('hidden');
        }

    });

})();
