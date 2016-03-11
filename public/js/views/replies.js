window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views,
        cv = window.rupon.common_views,
        rm = window.rupon.models;

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };

    rv.RepliesView = cv.CollectionContainer.extend({
        tagName: "div",
        className: "replies-list",

        initialize: function(options) {

            this.hiddenEle = _.some(options.replyDict, function(reply) {
                return !reply;
            })

            cv.CollectionContainer.prototype.initialize.call(this, function(model) { 
                options.model = model;
                return new rv.ReplyView(options);
            });
        },

        render: function(){

            if (this.hiddenEle) {
                this.$el.html('<div class="note">'+this.collection.models.length+' total replies, click "Read more" to see more</div>');
            }

            //this.$el.toggleClass('hidden', this.collection.models.length == 0);
            cv.CollectionContainer.prototype.render.call(this);

        }

    });

    rv.ReplyView = cv.TemplateView.extend({
        tagName: "li",
        className: "reply-desc clearfix",
        template: Handlebars.templates['reply-item'],

        responseTemplate: false,
        subModel: false,

        initialize: function(options) {
            this.listenTo(this.model, "change", this.render);
            this.subModel = options.subModel;
            if (!this.subModel) {
                this.user     = options.user;
                this.replyPos = options.replyDict[this.model.id];
                this.thoughtUserId = options.thoughtUserId;
            }

            cv.TemplateView.prototype.initialize.call(this, options);
        },
        events: {
            "click .action":          "thankReply",
            "click .reply-privacy":   "changePrivacy",
            "click .make-response":   "makeResponse",
            "click .submit-response": "submitResponse"
        },

        render: function(options) {

            var template_options = _.clone(this.model.attributes),
                isEntryAuthor = this.user && this.user.user_id == this.thoughtUserId,
                isAuthor =      this.user && this.user.user_id == this.model.get('user_id');

            var params = {
                is_author: isAuthor,
                can_thank: isEntryAuthor && !isAuthor,
                new_reply: this.responseTemplate
            }

            if (typeof template_options.privacy == "undefined") {
                template_options.privacy = "ANONYMOUS";
            }

            if (!this.subModel) {
                if (this.replyPos) {
                    this.$el.css('top', this.replyPos.pos + 'px');
                } else {
                    this.$el.addClass('hidden');
                }
            }

            template_options = _.extend(template_options, params);
            this.$el.html(this.template(template_options));

            if (this.responseTemplate) {
                this.$el.find('textarea').focus();
                this.responseTemplate = false;
            }

            if (this.model.get('description') == 'test reply 2') {
                console.log('here');
            }

            if (template_options.sub_models && template_options.sub_models.length) {
                var nestedView = new rv.RepliesView({
                    collection: new rm.replyCollection(template_options.sub_models),
                    subModel: true
                });
                this.$el.find('.nested-container').html(nestedView.$el);
            }

        },

        thankReply: function() {
            this.model.save({
                thanked: true
            }, {patch: true})
        },

        changePrivacy: function() {
            var privacy,
                privacy_types = ["ANONYMOUS", "PUBLIC"];

            if (typeof this.model.get('privacy') == "undefined") {
                privacy = "PUBLIC";
            } else {
                switch (this.model.get('privacy')) {
                    case "PUBLIC":
                        privacy = "ANONYMOUS";
                        break;
                    case "ANONYMOUS":
                        privacy = "PUBLIC";
                        break;
                }
            }

            this.model.save({
                privacy: privacy
            }, {patch: true})
        },

        makeResponse: function() {
            this.responseTemplate = true;
            this.render();
        },

        submitResponse: function() {
            var response = new rm.reply({
                thought_id: this.model.thought_id
            });
            var description = this.$el.find('.reply-to-reply textarea').val();

            var self = this;
            response.save({
                description:   description,
                privacy:       "PUBLIC",
                main_reply_id: this.model.id
            }, {
                success: function() {
                    self.$el.find('.confirmed').show();
                }
            });
        }

    });

})();
