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

    rv.ReplyCentricWrapper = cv.Container.extend({

        tagName:   "div",
        className: "thought-row tooltipbottom clearfix",
        template: Handlebars.compile($("#reply-centric-template").html()),

        user: null,

        events: {
            'click .past-posts-label': 'showPastPosts',
            'click .read-more':         'showSingle',
            'selectstart .selectable-text': 'takeAnnotation',
            'click .archive':           'archiveThought',
            'keypress .message textarea':        'submitEdit',
            'focusin input':            'focusTextarea',
            'keypress .write-reply textarea': 'submitReply',
            'click .reply-summary':     'getReplySummary'
        },

        initialize: function(options) {

            cv.Container.prototype.initialize.call(this);

            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);

            this.activateTooltip();
            this.render(options);

            this.user = options.user;

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

            //show "write reply" for all posts on index page
            template_options.can_reply = (!this.model.get('replies').length && !template_options.is_author) || !this.user;
            template_options.num_replies = this.model.get('replies').length;

            template_options.duration  = moment(this.model.get("date")).fromNow();
            
            template_options.past_posts = this.model.get('history') ? this.model.get('history').length : null;

            if (!template_options.is_author) this.$el.addClass('other-author');

            template_options.reply_description = this.model.get('replies').models[0].attributes.description;

            options = options || {};
            template_options.showMore = options.showMore || false;

            if (!template_options.showMore && template_options.description.length >450) {
                template_options.description = template_options.description.trim().substring(0,450).split(" ").slice(0, -1).join(" ") + "...";
                template_options.read_more = true;
            }

            template_options.description = template_options.description.replace('\n', '<br><br>');

            template_options.annotation_notice = !!template_options.can_reply;
            
            var replies = _.clone(this.model.get('replies').models);
            if (replies) {
                var first_annotation = _.compact(_.map(replies, function(model) {
                    return model.attributes.annotations[0];
                }));

                if (first_annotation && first_annotation.length) {
                    var output_annotation = _.map(first_annotation, function(annotation) {
                        return {
                            text: annotation.description,
                            start: annotation.start,
                            end: annotation.end
                        };
                    });

                    template_options.description = condenseArray(output_annotation, template_options.description);

                }
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

        },

        takeAnnotation: function() {

            var self = this;

            var selectable_field = self.$el.find('.selectable-text');
            selectable_field.text(selectable_field.text());

            $(document).one('mouseup', function() {

                var is_author = self.user && self.user.user_id == self.model.get('user_id');

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

        submitEdit: function(e) {
            if (e.which == 13){
                var value = this.$el.find("textarea").val();
                this.$el.removeClass("editing");
                this.trigger("edit-thought", value, this.model);
            }
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

        },

        showPastPosts: function() {

            this.$el.find('.past-posts-label').addClass('hidden');

            var collection = new this.thought_collection(this.model.get('history'));
            this.addChild(new rv.PastPostsView({collection: collection}), '.past-posts-container');

        }

    });

    rv.ThoughtWrapperView = cv.Container.extend({

        tagName:   "div",
        className: "thought-row tooltipbottom clearfix",
        template: Handlebars.compile($("#thought-item-template").html()),

        user: null,

        events: {
            'click .past-posts-label': 'showPastPosts',
            'click .read-more':         'showSingle',
            'selectstart .selectable-text': 'takeAnnotation',
            'click .privacy-status':    'changePrivacy',
            'click .edit':              'editThought',
            'click .delete':            'deleteThought',
            'click .archive':           'archiveThought',
            'keypress .message textarea':        'submitEdit',
            'focusin input':            'focusTextarea',
            'click .write-reply2':     'writeReply', 
            'keypress .write-reply textarea': 'submitReply',
            'click .reply-summary':     'getReplySummary'
        },

        initialize: function(options) {

            cv.Container.prototype.initialize.call(this);

            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);

            this.activateTooltip();
            this.render(options);

            this.user = options.user;

            this.replyCollection = new options.reply_collection(this.model.get("replies").models);

            this.thought_collection = options.thought_collection;

            this.replyCollectionContainer = new rv.RepliesView({collection: this.replyCollection, user: options.user});


            var self = this;
            this.replyCollectionContainer.on('thank-reply', function(attr) {
                var reply = self.replyCollection.findWhere(attr);
                reply.save({'thanked': !reply.get('thanked') }, {wait: true, patch: true});
            });

            if (this.user) this.addChild(this.replyCollectionContainer, ".reply-collection-container");
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

            //show "write reply" for all posts on index page
            template_options.can_reply = (!this.model.get('replies').length && !template_options.is_author) || !this.user;
            template_options.num_replies = this.model.get('replies').length;

            template_options.duration  = moment(this.model.get("date")).fromNow();
            
            template_options.past_posts = this.model.get('history') ? this.model.get('history').length : null;

            if (!template_options.is_author) this.$el.addClass('other-author');

            options = options || {};
            template_options.showMore = options.showMore || false;

            if (!template_options.showMore && template_options.description.length >450) {
                template_options.description = template_options.description.trim().substring(0,450).split(" ").slice(0, -1).join(" ") + "...";
                template_options.read_more = true;
            }

            template_options.description = template_options.description.replace('\n', '<br><br>');

            template_options.annotation_notice = !!template_options.can_reply;
            
            var replies = _.clone(this.model.get('replies').models);
            if (replies) {
                var first_annotation = _.compact(_.map(replies, function(model) {
                    return model.attributes.annotations[0];
                }));

                if (first_annotation && first_annotation.length) {
                    var output_annotation = _.map(first_annotation, function(annotation) {
                        return {
                            text: annotation.description,
                            start: annotation.start,
                            end: annotation.end
                        };
                    });

                    template_options.description = condenseArray(output_annotation, template_options.description);

                }
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

        },

        takeAnnotation: function() {

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

        },

        showPastPosts: function() {

            this.$el.find('.past-posts-label').addClass('hidden');

            var collection = new this.thought_collection(this.model.get('history'));
            this.addChild(new rv.PastPostsView({collection: collection}), '.past-posts-container');

        }

    });

    var condenseArray = function(arr, str) {
      for (var i = 0; i < arr.length; i++) {
        arr[i].end = arr[i].start + arr[i].text.length;
      }

      String.prototype.splice = function( idx, rem, s ) {
        return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
      };

      var new_array = [];

      function comparePositions(obj1, obj2) {

        return obj1.start > obj2.start && obj1.start < obj2.end && obj1.end > obj2.end;

      }

      function overlap_by_position(obj) {

        if (!new_array.length) {

          new_array.push(obj);

        } else {
         
          var not_here = 1;

          for (var k = 0; k < new_array.length; k++ ) {

            if (comparePositions(new_array[k], obj)) {
              
              new_array[k] = {
                text: str.substring(obj.start,new_array[k].end),
                start: obj.start,
                end: new_array[k].end
              }

              not_here = 0;

            } else if (comparePositions(obj, new_array[k])) {
              
              new_array[k] = {
                text: str.substring(new_array[k].start,obj.end),
                start: new_array[k].start,
                end: obj.end
              }

              not_here = 0;

            } else if (obj.start < new_array[k].start && obj.end > new_array[k].end) {
              
              new_array[k] = obj;

              not_here = 0;

            } else if (obj.start > new_array[k].start && obj.end < new_array[k].end) {

              not_here = 0;

            }

          } 

          if (not_here == 1) {

            new_array.push(obj);

          }

        }

      }

      for (var m = 0; m < arr.length; m++) {
        overlap_by_position(arr[m]);
      }
      
      for (var n = 0; n < new_array.length; n++) {
        str = str.replace(new_array[n].text, "<span class='perm'>" + new_array[n].text + "</span>" );
      }

      return str;
    }

})();