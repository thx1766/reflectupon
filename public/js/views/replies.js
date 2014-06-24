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

            this.collapsible = {
                type: true,
                label: 'replies'
            };

            cv.CollectionContainer.prototype.initialize.call(this, function(model) { 
                options.model = model;
                return new rv.ReplyView(options);
            });
        },

        render: function(){

            //this.$el.toggleClass('hidden', this.collection.models.length == 0);
            cv.CollectionContainer.prototype.render.call(this);

        },

        addView: function(model, opt_selector) {
            if (model.get('description') != undefined && model.get('description') != "") {
                cv.CollectionContainer.prototype.addView.call(this, model, opt_selector);
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

            template_options.can_reply = options.user && !template_options.is_author;

            this.$el.html(this.template(template_options));
        },

        thankReply: function() {
            var attr = _.clone(this.model.attributes);
            this.trigger('thank-reply', attr);
        }

    });

})();
