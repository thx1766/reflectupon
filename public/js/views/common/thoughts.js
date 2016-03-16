window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    String.prototype.splice = function( idx, rem, s ) {
        return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
    };

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;
    var rh = window.rupon.helpers;
    var rmixins = window.rupon.mixins;

    var privacy = ["PRIVATE", "ANONYMOUS"];

    var toTitleCase = function(str){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    rv.ThoughtWrapperView = cv.Container.extend({

        tagName:   "div",
        className: "thought-row tooltipbottom clearfix",
        template: Handlebars.templates['thought-item'],

        user: null,

        events: {
            'click .read-more':               'showSingle',
            'click .private-only':            'changePrivacy',
            'click .edit':                    'editThought',
            'click .delete':                  'deleteThought',
            'click .archive':                 'archiveThought',
            'keypress .editable':             'submitEdit',
            'click .reply-summary':           'getReplySummary',
            'click .click-reply':             'clickReply',
            'click .view-replies':            'viewReplies'
        },

        initialize: function(options) {
            options = options || {};
            var self = this;
            this.tags_collection = options.tags_collection;
            if (typeof options.reply_collection != "undefined") {

                mainModelCollection = this.model.get('replies').models

                var mainModels = _.filter(mainModelCollection, function(model){
                    return typeof model.get('main_reply_id') != "string"
                });

                if (mainModels.length != mainModelCollection) {
                    var subModels = _.filter(mainModelCollection, function(model){
                        return typeof model.get('main_reply_id') == "string"
                    });

                    mainModels = _.map(mainModels, function(model) { 
                      var mainModelsSubs = _.filter(subModels, function(subModel) {
                          return model.id == subModel.get('main_reply_id')
                      });
                      model.set('sub_models', mainModelsSubs);
                      return model;
                    });
                }

                this.replyCollection = new options.reply_collection(mainModels);

                this.replyCollection
                    .on('add', function() {
                        self.trigger('highlight-mine-done');
                    })
            }

            cv.Container.prototype.initialize.call(this);

            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);

            //this.activateTooltip();
            this.render(options);

            this.user = options.user;

            var patch_options = {
                wait: true,
                patch: true
            };

        },

        render: function(options) {

            this.$el.find(".privacy-status").trigger("tooltip-end");
            var template_options = _.clone(this.model.attributes);

            var created_at = new Date(template_options.date).getTime();
            var today = new Date().getTime();

            var difference_ms = today - created_at;

            this.user = (options && options.user) ? options.user : this.user;

            var params = {
                is_author:       this.user && this.user.user_id == this.model.get('user_id'),
                can_edit:        (difference_ms/(1000*60*60*24)) <= 1,
                duration:        moment(this.model.get("date")).format('MMM Do'),
                past_posts:      this.model.get('history') ? this.model.get('history').length : null
            }

            if (typeof this.reply_collection != "undefined") {
                params.can_reply = (!this.model.get('replies').length && !params.is_author) || !this.user;
                //params.show_replies = true;
            }

            template_options = _.extend(template_options, params);

            if (!template_options.is_author) this.$el.addClass('other-author');

            options = options || {};
            template_options.showMore = options.showMore || false;

            if (!template_options.showMore && template_options.description.length >1100) {
                template_options.description = this.truncateDescription(template_options.description, 1100);
                template_options.read_more = true;
            }

            template_options.description = rh.convertLineBreaks(template_options.description, 'n');

            if (this.model.get('privacy') == "ANONYMOUS") {
                template_options.username = "Anonymous";
            }

            template_options.date = moment(this.model.get("date")).fromNow();

            // Description used when editing - without all the annotations
            this.editable_description = template_options.description;

            var replies = this.model.get('replies').models;
            if (replies && replies.length) {
                template_options.num_replies = replies.length;
            }

            template_options.enable_below_message = !!template_options.num_annotations || !!template_options.num_replies;

            if (_.indexOf(privacy, template_options.privacy) != -1) {

                if (template_options.privacy == privacy[0]) {
                    template_options.privacy_inverse = privacy[1];
                } else if (template_options.privacy == privacy[1]){
                    template_options.privacy_inverse = privacy[0];
                }

                template_options.privacy = toTitleCase(template_options.privacy.toLowerCase());
                template_options.privacy_inverse = toTitleCase(template_options.privacy_inverse.toLowerCase());
            }

            var nonAnnotationReplies = _.filter(replies, function(reply) {
                return !reply.get('annotations').length
            });
            nonAnnotationReplies = _.map(nonAnnotationReplies, function(reply) {
                return {
                    description: reply.get('description')
                }
            });
            template_options.nonAnnotationReplies = nonAnnotationReplies;
            template_options.tag_ids = this.model.get('tag_ids');
            var outputHtml = this.template(template_options);

            cv.Container.prototype.detachChildren.call(this);
            this.$el.html(outputHtml);
            cv.Container.prototype.reattachChildren.call(this);

            this.setupAnnotations(template_options.description, this.model.get('annotations'), replies);

            this.$el.find('.write-reply textarea').autosize();
        },

        renderOnContentLoad: function() {
            var replyIds = _.pluck(this.replyCollection.models, "id");

            if (!replyIds.length) {
                return false;
            }

            var dataReplyIds = this.$el.find('[data-reply-id]').map(function() { return $(this).attr('data-reply-id') });

            var replyPos = [];
            for (var i = 0; i < replyIds.length; i++) {
                for (var j = 0; j < dataReplyIds.length; j++) {
                    if (dataReplyIds[j].indexOf(replyIds[i]) != -1) {
                        replyPos.push({
                            id:  replyIds[i],
                            pos: $(this.$el.find('[data-reply-id]')[j]).position().top || {}
                        });
                        break;
                    }
                }
            }

            replyPos = _.sortBy(replyPos, "pos");

            for (var x = 0; x < replyPos.length; x++) {
                if (x != 0 && replyPos[x].pos <= replyPos[x-1].pos + 120) {
                    replyPos[x].pos = replyPos[x-1].pos + 120;
                }
            }

            if (replyPos.length && this.$el.height() < replyPos[replyPos.length-1].pos + 120) {
                this.$el.height(replyPos[replyPos.length-1].pos + 120)
            }

            replyIds = _.map(replyPos, function(obj) { return obj.id});

            var replyDict = _.object(replyIds, replyPos);

            this.removeChild(this.replyCollectionContainer);
            this.replyCollectionContainer = new rv.RepliesView({
                collection: this.replyCollection,
                user:       this.user,
                replyDict:  replyDict,
                thoughtUserId: this.model.get('user_id')
            });
            this.addChild(this.replyCollectionContainer, ".replies");
        },

        truncateDescription: function(description, length) {
            return description.trim().substring(0,length).split(" ").slice(0, -1).join(" ") + "...";
        },

        showSingle: function() {
            mixpanel.track('read-more');
            var attrs = {
                showMore: true
            }

            this.$el.addClass('show-replies');
            this.render(attrs);
            this.renderOnContentLoad();
        },

        getReplySummary: function() {

            $(".main-view-container").addClass('left-align');

            this.$el.find('.reply-collection-container').removeClass('hidden');
            this.$el.find('.reply-summary').addClass('hidden');
            this.$el.find('.message').addClass('reply-summary-activated');

        },

        changePrivacy: function() {

            this.trigger("change-privacy", "PRIVATE", this.model);
        },

        editThought: function() {
            this.$el.addClass("editing");
            this.$el.find('.message').append('<textarea class="editable">'+this.editable_description+'</textarea>');
            this.$el.find('textarea.editable').autosize();
        },

        submitEdit: function(e) {
            if (e.which == 13){
                var value = this.$el.find("textarea").val();
                this.$el.removeClass("editing");
                this.trigger("edit-thought", this.model, value);
            }
        },

        deleteThought: function() {
            this.trigger("delete-thought", this.model);
        },

        archiveThought: function() {
            this.trigger("archive-thought", this.model);
        },

        clickReply: function() {
            mixpanel.track('bottom-write-reply');
            this.$el.find('.write-reply-container').html(Handlebars.templates['write-reply']);
            this.$el.find('.write-reply textarea').focus();
            this.$el.find('.click-reply').addClass('clicked');
        },

        viewReplies: function() {
            this.$el.find('.response-list').show();
            this.$el.find('.view-replies').addClass('clicked');
        }

    });

    rh.extendWithEvents(rv.ThoughtWrapperView.prototype, rmixins.AnnotationMixin);

})();