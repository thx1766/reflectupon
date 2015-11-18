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

            var description, newAnnotation, attr, annotations;

            description = this.$el.find('.popover-content').find('textarea').val()

            if ($.trim(description) != "") {

                attr = {
                    user_id:     this.user.user_id,
                    description: description,
                    thought_id:  this.model.get('_id')
                };

                if (this.selected_start >= 0 && this.selected_end && this.selected_text) {
                    newAnnotation = {
                        start: this.selected_start,
                        end:   this.selected_end,
                        description: this.selected_text
                    };

                    attr.annotations = [newAnnotation];
                }

                var self = this;
                this.replyCollection.create(attr, { 
                    wait: true,
                    success: function() {
                        self.$el.find('.write-reply').addClass('hidden');
                        self.$el.find('.preempt-reply').addClass('hidden');
                        $('.temp').popover('hide');

                        annotations = self.model.get('annotations');

                        if (typeof annotations == "undefined") {
                            annotations = [newAnnotation];
                        } else {
                            annotations.push(newAnnotation);
                        }
                        self.model.set('annotations', annotations);

                        self.renderAnnotations(self.nonHighlightedEntry, self.model.get('annotations'), self.model.get('replies'));
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

        condenseArray: function(inputs) {

            inputs = _.sortBy(inputs, function(input) {
                return input.start;
            });

            var output = [inputs.shift()];

            _.each(inputs, function(input) {
                if (output[output.length - 1].end < input.start) {
                    output.push(input);
                } else {
                    output.push(this.transformAnnotation(output.pop(), input));
                }
            }, this);

            return output;
        },

        transformAnnotation: function(output, input) {
            if (input.end > output.end) {
                return this.overlapLater(output, input);
            } else if (input.end < output.end) {
                return this.overlapWithin(output, input);
            }
        },

        overlapLater: function(into_array, element) {
            into_array.end = element.end;
            return into_array;
        },

        overlapWithin: function(into_array, element) {
            //todo - fix reply
            return into_array;
        },

        replaceWithAnnotations: function (annotations, str) {

            _.each(annotations, function(annotation) {
                end_tag   = "</span>";
                if (annotation.reply_id) {
                    start_tag = "<span class='perm' data-reply-id='"+annotation.reply_id+"'>";
                } else {
                    start_tag = "<span class='perm'>";
                }
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