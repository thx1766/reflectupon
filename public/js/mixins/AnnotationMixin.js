window.rupon = window.rupon || {};
window.rupon.mixins = window.rupon.mixins || {};

(function() {

    var rmixins = window.rupon.mixins,
        rh = window.rupon.helpers;

    rmixins.AnnotationMixin = {

        events: {
            'click .reply-popover .fa-times': 'removePopover',
            'selectstart .selectable':        'takeAnnotation',
            'click .reply-popover button':    'submitReply'
        },

        annotation_mode: false,

        takeAnnotation: function() {

            if (this.annotation_mode) {
                return;
            }

            var self = this;
            $(document).one('mouseup', function(e) {
                e.preventDefault();
                self.setAnnotation();
            });

        },

        setAnnotation: function() {
            var selectable_field = this.$el.find('.selectable');
            var selectable_text  = this.nonHighlightedEntry;
            this.selected_text = window.getSelection().toString();

            if (this.selected_text.length) {
                this.selected_text  = rh.convertLineBreaks(this.selected_text, 'n');
                this.selected_start = selectable_text.indexOf(this.selected_text)
                this.selected_end   = this.selected_start + this.selected_text.length;

                this.annotation_mode = true;
                selectable_field.html(this.showTempText(true, selectable_text, this.selected_text));

                $('.temp').popover({
                    content: Handlebars.templates['popover']
                });
                $('.temp').popover('show')

                popover_input = $('.popover-content').find('input');
                $('.temp').on('shown.bs.popover', function () {
                  popover_input.focus()
                })
            }
        },

        removePopover: function(e) {
            $('.temp').popover('hide');
            this.showTempText(false);
            this.annotation_mode = false;
        },

        submitReply: function(e) {

            var description = this.$el.find('.popover-content').find('textarea').val()

            if ($.trim(description) != "") {

                var attr = {
                    user_id:     this.user.user_id,
                    description: description,
                    thought_id:  this.model.get('_id')
                };

                if (this.selected_start >= 0 && this.selected_end && this.selected_text) {
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
                        $('.temp').popover('hide')
                        self.$el.find('.temp').removeClass('temp').addClass('perm');
                    }
                });
            }

        },

        showTempText: function(showTempText, textBeforeEdit, selectedText) {
            if (showTempText) {
                var template = '<span class="temp" data-placement="bottom" data-html="true">' + selectedText + '</span>';
                return textBeforeEdit.replace(selectedText, template);
            } else {
                var tempText = $(".temp").html();
                var tempParent = $(".temp").parent();
                $(".temp").replaceWith(tempText);
            }
        },

        highlightTemplate: function(text) {
            return '<span class="temp" data-placement="bottom" data-html="true">' + text + '</span>'
        },

        renderAnnotations: function(description, annotations, replies) {
            var output_annotation = this.formatAnnotationsForDisplay(annotations);

            // Start from the last of array, better with text injection
            var annotations_object = this.condenseArray(output_annotation).reverse();

            this.$el.find('.selectable').html(this.replaceWithAnnotations(annotations_object, description));
        },

        formatAnnotationsForDisplay: function(annotations) {
            return _.map(annotations, function(model) {
                return {
                    text:     model.description,
                    start:    model.start,
                    end:      model.end,
                    reply_id: [model._reply_id]
                };
            });
        },

    // puts elements in order by letter position
        condenseArray: function(input) {

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

        },

        replaceWithAnnotations: function (annotations, str) {

            _.each(annotations, function(annotation) {
                end_tag   = "</span>";
                start_tag = "<span class='perm' data-reply-id='"+annotation.reply_id+"'>";
                str = [str.slice(0, annotation.end), end_tag, str.slice(annotation.end)].join('');
                str = [str.slice(0, annotation.start), start_tag, str.slice(annotation.start)].join('');
            });

            return str;
        },

        setupAnnotations: function(description, annotations, replies) {
            this.nonHighlightedEntry = description;

            if (annotations && annotations.length) {
                this.renderAnnotations(description, annotations, replies);
            }

            if (annotations && annotations.length && replies && replies.length) {
                this.renderRepliesForAnnotation(this.$el.find('.perm'), replies);
            }
        }
    }
})();