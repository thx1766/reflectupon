window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    Handlebars.registerHelper('breaklines', function(text) {
        text = Handlebars.Utils.escapeExpression(text);
        text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
        return new Handlebars.SafeString(text);
    });

    String.prototype.splice = function( idx, rem, s ) {
        return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
    };

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    var privacy = ["PRIVATE", "ANONYMOUS"];

    var toTitleCase = function(str){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    rv.WriteToThoughtsView = Backbone.View.extend({
        className: "write-to-thought-view",

        initialize: function(options) {
            this.options = options;
            this.render("write");

            var self = this;
            this.on('write-reflection', function() {
                self.render("write");
            })
            this.on('go-to-entry', function(val) {
                self.render("thoughts");
                self.thoughtsView.trigger('go-to-entry', val);
            });
        },

        render: function(view_type) {
            if (this.writeView)    this.writeView.remove();
            if (this.thoughtsView) this.thoughtsView.remove();

            switch (view_type) {
                case "write":
                    this.writeView = this.renderWriteView()
                    this.$el.html(this.writeView.$el);
                    break;
                case "thoughts":
                    this.thoughtsView = this.renderThoughtsView();
                    this.$el.html(this.thoughtsView.$el);
            }
        },

        renderWriteView: function() {
            var tags_collection = this.options.tags_collection,
                success         = this.options.write_success;

            view = new rv.WriteThoughtView({
                tags_collection: tags_collection
            });

            var self = this;
            view.on("create-reflection", function(attrs) {
                success(attrs, function() {
                    self.render("thoughts");
                })
            });

            this.on('get-next-entry', function() {
                view.trigger('get-next-entry');
            });
            this.on('get-previous-entry', function() {
                view.trigger('get-previous-entry');
            });
            return view;
        },

        renderThoughtsView: function(params) {
            view = new rv.ThoughtsView({
                collection:         this.options.thoughts_collection,
                user:               this.options.user,
                reply_collection:   this.options.reply_collection,
                tags_collection:    this.options.tags_collection
            });
            return view;
        }

    });

    rv.ThoughtsView = Backbone.View.extend({

        modelPosition: 0,
        tagName: "div",
        className: "thoughts-list",

        initialize: function(options) {

            //this.listenTo(this.collection.fullCollection,'add', this.appendItem);
            this.listenTo(this.collection, 'create', this.prependItem);

            this.on('go-to-entry',    this.goToEntry);
            this.on('get-next-entry', this.getNextEntry);
            this.on('get-previous-entry', this.getPreviousEntry);

            this.modelView = function(model) {
                return new rv.ThoughtWrapperView({
                    model:              model,
                    user:               options.user,
                    reply_collection:   options.reply_collection,
                    thought_collection: options.thought_collection,
                    can_reply:          options.can_reply,
                    tags_collection:    options.tags_collection
                })
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
            this.current_thought = _.findWhere(this.collection.models, {id: thought.id});

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
            if (method == "append") {
                this.$el.html(formatThought.$el)
            } else {
                this.$el[method](formatThought.$el);
            }

            var self = this;
            this.listenTo(formatThought, 'all', function() {
                self.trigger.apply(this, arguments);
            });

        },

        goToEntry: function(val) {
            var model = this.collection.where({_id: val});
            this.displayItem(model[0], "append");
        },

        getNextEntry: function() {
            sorted_models = _.sortBy(this.collection.models, function(model){ return -new Date(model.attributes.date); });
            model_index = _.indexOf(sorted_models, this.current_thought);
            this.displayItem(sorted_models[model_index + 1]);
        },

        getPreviousEntry: function() {
            sorted_models = _.sortBy(this.collection.models, function(model){ return -new Date(model.attributes.date); });
            model_index = _.indexOf(sorted_models, this.current_thought);
            this.displayItem(sorted_models[model_index - 1]);
        }

    });

    rv.ThoughtWrapperView = cv.Container.extend({

        tagName:   "div",
        className: "thought-row tooltipbottom clearfix",
        template: Handlebars.compile($("#thought-item-template").html()),

        user: null,
        can_reply: true,

        events: {
            'click .past-posts-label':        'showPastPosts',
            'click .read-more':               'showSingle',
            'selectstart .selectable-text':   'takeAnnotation',
            'click .privacy-status':          'changePrivacy',
            'click .edit':                    'editThought',
            'click .delete':                  'deleteThought',
            'click .archive':                 'archiveThought',
            'keypress .message textarea':     'submitEdit',
            'focusin input':                  'focusTextarea',
            'click .write-reply2':            'writeReply', 
            'keypress .write-reply textarea': 'submitReply',
            'click .reply-summary':           'getReplySummary',
            'hover .perm':                    'viewReply'
        },

        initialize: function(options) {

            cv.Container.prototype.initialize.call(this);

            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);

            this.activateTooltip();
            this.render(options);

            this.user      = options.user;
            this.can_reply = (options.can_reply == false) ? false : true;

            this.replyCollection = new options.reply_collection(this.model.get("replies").models);
            this.thought_collection = options.thought_collection;

            this.replyCollectionContainer = new rv.RepliesView({collection: this.replyCollection, user: options.user});
            this.tags_collection = options.tags_collection;

            var self = this;
            var patch_options = {
                wait: true,
                patch: true
            };

            this.replyCollectionContainer
                .on('thank-reply', function(attr) {
                    var reply = self.replyCollection.findWhere(attr);
                    reply.save({
                        'thanked': !reply.get('thanked')
                    }, patch_options);
                })
                .on('make-reply-public', function(attr) {
                    var reply = self.replyCollection.findWhere(attr);
                    reply.save({
                        'privacy': 'AUTHOR_TO_PUBLIC'
                    }, patch_options);
                })

            if (this.user) this.addChild(this.replyCollectionContainer, ".reply-collection-container");
        },

        render: function(options) {

            this.$el.find(".privacy-status").trigger("tooltip-end");
            var template_options = _.clone(this.model.attributes);

            var created_at = new Date(template_options.date).getTime();
            var today = new Date().getTime();

            var difference_ms = today - created_at;

            this.user = (options && options.user) ? options.user : this.user;
            var annotations = this.model.get('annotations');
            var attrReplies = this.model.get('replies');
            var tags = [];

            if (this.model.get('tag_ids').length && this.tags_collection) {
                tags = _.filter(_.pluck(this.tags_collection.models, 'attributes'), function (model) {
                    return _.contains(this.model.get('tag_ids'), model._id)
                }.bind(this));
            }

            var params = {
                is_author:       this.user && this.user.user_id == this.model.get('user_id'),
                can_edit:        (difference_ms/(1000*60*60*24)) <= 1,
                duration:        moment(this.model.get("date")).fromNow(),
                past_posts:      this.model.get('history') ? this.model.get('history').length : null,
                num_annotations: annotations && annotations.models.length || 0,
                num_replies:     attrReplies && attrReplies.models && attrReplies.models.length || 0,
                tags:            tags
            }

            params.enable_below_message = !!params.num_annotations || !!params.num_replies || params.tags.length;

            if (this.can_reply) {
                //show "write reply" for all posts on index page
                params.can_reply = (!this.model.get('replies').length && !params.is_author) || !this.user;
                params.show_replies = true;
            } else {
                params.can_reply = false;
                params.show_replies = false;
            }

            template_options = _.extend(template_options, params);

            if (!template_options.is_author) this.$el.addClass('other-author');

            options = options || {};
            template_options.showMore = options.showMore || false;

            if (!template_options.showMore && template_options.description.length >450) {
                template_options.description = template_options.description.trim().substring(0,450).split(" ").slice(0, -1).join(" ") + "...";
                template_options.read_more = true;
            }

            template_options.description = template_options.description.replace('\n', '<br><br>');
            template_options.annotation_notice = !!template_options.can_reply;

            if (annotations && annotations.models.length) {
                var output_annotation = _.map(annotations.models, function(model) {
                    return {
                        text:     model.get('description'),
                        start:    model.get('start'),
                        end:      model.get('end'),
                        reply_id: [model.get('_reply_id')]
                    };
                });

                // Start from the last of array, better with text injection
                annotations_object = condenseArray(output_annotation).reverse();
                template_options.description = replaceWithAnnotations(annotations_object, template_options.description);
            }

            if (_.indexOf(privacy, template_options.privacy) != -1) {

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
            this.$el.find('.write-reply textarea').autosize();

            if (annotations && annotations.models.length &&
                attrReplies && attrReplies.models.length) {

                var highlights = this.$el.find('.perm');
                _.each(highlights, function(highlight) {

                    var filteredReplies = _.filter(attrReplies.models, function(reply) {
                        var reply_ids = $(highlight).attr('data-reply-id').split(',');
                        return _.contains(reply_ids, reply.id)
                    }, this);

                    if (filteredReplies.length) {
                        var list = _.map(filteredReplies, function(reply) {
                            return "<li>" + reply.get('description') + "</li>";
                        });

                        list = "<ul>" + list.join("") + "</ul>";

                        $(highlight).tooltip({
                            title:     list,
                            placement: 'bottom',
                            html:      true
                        });
                    }

                }, this);

            }
            cv.Container.prototype.reattachChildren.call(this);
        },

        showSingle: function() {
            var attrs = {
                showMore: true
            }

            this.$el.addClass('show-replies');
            this.render(attrs);
        },

        getReplySummary: function() {

            $(".main-view-container").addClass('left-align');

            this.$el.find('.reply-collection-container').removeClass('hidden');
            this.$el.find('.reply-summary').addClass('hidden');
            this.$el.find('.message').addClass('reply-summary-activated');

        },

        takeAnnotation: function() {

            if (!this.can_reply) {
                return;
            }

            var self = this;

            var selectable_field = self.$el.find('.selectable-text');
            selectable_field.text(selectable_field.text());

            $(document).one('mouseup', function() {

                var is_author = self.user && self.user.user_id == self.model.get('user_id');

                /* if (is_author) {

                    if (this.getSelection() != "") {
                        $(".thoughts-list").addClass("select-text");
                        self.$el.siblings().removeClass("selected")
                        self.$el.addClass("selected");

                        self.trigger("start-tooltip", self.$el);
                    }

                } else { */

                if (!is_author) {

                    var selection = this.getSelection();

                    if (selection.baseOffset < selection.extentOffset) {
                        self.selected_start = selection.baseOffset;
                        self.selected_end   = selection.extentOffset;
                    } else {
                        self.selected_start = selection.extentOffset;
                        self.selected_end   = selection.baseOffset;
                    }
                    

                    self.selected_text = selectable_field.text().substring(self.selected_start, self.selected_end);

                    var description_text = selectable_field.text();

                    selectable_field.html(description_text.replace(self.selected_text, '<span class="temp">' + self.selected_text + '</span>'));
                    self.writeReply();

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

                $(".main-view-container").addClass('left-align');

                this.$el
                    .find('.write-reply2').addClass('hidden').end()
                    .find('.write-reply').css('display','block').find('textarea').focus();
            }
        },

        focusTextarea: function() {

            if (typeof this.user == "undefined") {
                $('#myModal').modal();
            }

        },

        submitReply: function(e) {

            switch(e.which) {
                case 13:
                    var description = this.$el.find('.write-reply textarea').val()

                    if ($.trim(description) != "") {

                        var attr = {
                            user_id:     this.user.user_id,
                            description: description,
                            thought_id:  this.model.get('_id')
                        };

                        if (this.selected_start && this.selected_end && this.selected_text) {
                            attr.annotations = [{
                                start: this.selected_start,
                                end:   this.selected_end,
                                description: this.selected_text
                            }];
                        }

                        var self = this;
                        this.replyCollection.create(attr, { 
                            wait: true,
                            success: function() {
                                self.$el.find('.write-reply').addClass('hidden');
                                self.$el.find('.preempt-reply').addClass('hidden');
                                self.$el.find('.temp').removeClass('temp').addClass('perm');
                            }
                        });
                    }

            }

        }

    });

    // puts elements in order by letter position
    var condenseArray = function(input) {

        var injectAfter = function(pos, into_array, element) {
            into_array.splice(pos+1, 0, element);
            return into_array;
        }

        var injectBefore = function(pos, into_array, element) {
            into_array.splice(pos, 0, element);
            return into_array;
        }

        var overlapLater = function(pos, into_array, element) {

            old_reply_id = into_array[pos].reply_id;

            into_array[pos].end = element.end;
            into_array[pos].reply_id = old_reply_id.push(element.reply_id);

            return into_array;
        }

        var overlapEarlier = function(pos, into_array, element) {

            old_reply_id = into_array[pos].reply_id;

            into_array[pos].start = element.start;
            into_array[pos].reply_id = old_reply_id.push(element.reply_id);

            return into_array;
        }

        var overlapAround = function(pos, into_array, element) {

            old_reply_ids = into_array[pos].reply_id;
            old_reply_ids.push(element.reply_id[0]);

            into_array[pos].start = element.start;
            into_array[pos].end   = element.end;
            into_array[pos].reply_id = old_reply_ids;

            return into_array;
        }

        var overlapWithin = function(pos, into_array, element) {

            old_reply_id = into_array[pos].reply_id;
            into_array[pos].reply_id = old_reply_id.push(element.reply_id);

            return into_array;
        }

        var output = [input.shift()];

        _(input.length).times( function(n) {
            if (output[0].end < input[0].start) {
                output = injectAfter(0, output, input.shift());

            } else if (input[0].end < output[0].start) {
                output = injectBefore(0, output, input.shift());

            } else if (input[0].start > output[0].start && input[0].end > output[0].end) {
                output = overlapLater(0, output, input.shift());

            } else if (output[0].start > input[0].start && output[0].end > input[0].end) {
                output = overlapEarlier(0, output, input.shift());

            } else if (input[0].start < output[0].start && output[0].end < input[0].end) {
                output = overlapAround(0, output, input.shift());

            } else if (output[0].start < input[0].start && input[0].end < output[0].end) {
                output = overlapWithin(0, output, input.shift());
            }
        })

        return output;

    };

    var replaceWithAnnotations = function (annotations, str) {

        _.each(annotations, function(annotation) {
            end_tag   = "</span>";
            start_tag = "<span class='perm' data-reply-id='"+annotation.reply_id+"'>";
            str = [str.slice(0, annotation.end), end_tag, str.slice(annotation.end)].join('');
            str = [str.slice(0, annotation.start), start_tag, str.slice(annotation.start)].join('');
        });

        return str;
    };

})();