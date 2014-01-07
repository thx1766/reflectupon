window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    rv.Single = rv.Single || {};

    rv.Single.ThoughtView = Backbone.View.extend({
        tagName:"div",

        events: {
            'click .submit-reply': 'submitReply',
            //'mouseup #main-thought': 'createAnnotation',
            'click .show-thought': 'showThought',
            'click .hide-thought': 'hideThought'
        },

        template: Handlebars.compile($("#single-thought-template").html()),

        initialize: function() {

            //this.collection.replies = new rupon.models.replyCollection({thought_id: this.model.attributes._id});

            this.model.get('replies').on('add', function(reply) {

                var formatReply = new rv.Single.ReplyView({ model: reply });
                $(".reply-area").removeClass("hidden");
                $(".reply-area").prepend( formatReply.el );

            });

            this.render();

        },

        render: function() {

            var attr = _.clone(this.model.attributes);

            var output = {
                description: attr.expression || attr.description.replace(/\n/g,"<br>"),
                description2: attr.expression ? attr.description.replace(/\n/g,"<br>") : null
            };

            this.$el.html(this.template( output ));

            var self = this;
            _.each(this.model.get('replies').models, function(reply) {

                self.$el.find(".reply-area").removeClass("hidden");

                var formatReply = new rv.Single.ReplyView({ model: reply });
                self.$el.find(".reply-area").prepend( formatReply.el );
            });

            return this;
        },

        showThought: function() {
            this.$el.find(".full-thought").find("span").removeClass("hidden");
            this.$el.find(".show-thought").addClass("hidden");
            this.$el.find(".hide-thought").removeClass("hidden");
        },

        hideThought: function() {
            this.$el.find(".full-thought").find("span").addClass("hidden");
            this.$el.find(".show-thought").removeClass("hidden");
            this.$el.find(".hide-thought").addClass("hidden");
        },

        submitReply: function(e) {

            e.preventDefault();

            this.model.get('replies').create({
                title:          "test",
                description:    this.$el.find("textarea").val(),
                thought_id:     this.model.attributes._id,
                user_id:        rupon.account_info.user_id
            });

        }

        /*
         showAnnotations: function() {
         _.each( singleAnnotations.models, this.displayAnnotation, this);

         var description = $("#main-thought").find(".description");

         for (var y=0; y<highlightSet.length; y++) {

         description.highlight( description.text().substring(highlightSet[y].start, highlightSet[y].end));

         }

         },

         displayReply: function(reply) {
         var formatReply = new ReplyItemView({ model:reply});
         formatReply.render();

         $(".reply-area").prepend( formatReply.el );
         },

         displayAnnotation: function(annotation) {

         var start = annotation.get("start"),
         end = annotation.get("end")

         var overlap = false;

         if (start && end) {
         for (var x=0; x<highlightSet.length; x++) {

         if (start < highlightSet[x].start && end > highlightSet[x].end) {
         highlightSet[x].start = start;
         highlightSet[x].end = end;
         overlap = true;
         break;
         }

         if (start > highlightSet[x].start && end < highlightSet[x].end) {
         overlap = true;
         break;
         }

         if (end > highlightSet[x].start && start < highlightSet[x].start) {
         highlightSet[x].start = start;
         overlap = true;
         break;
         }

         if (start < highlightSet[x].end && end > highlightSet[x].end) {
         highlightSet[x].end = end;
         overlap = true;
         break;
         }

         }

         if (!overlap) {
         highlightSet.push({start: start, end: end});
         }
         }

         },

         createAnnotation: function(){
         var selection;

         if (window.getSelection) {
         selection = window.getSelection();
         } else if (document.selection) {
         selection = document.selection.createRange();
         }

         var selectionText = selection.toString()
         selectionText !== '' && $('#main-thought').highlight(selectionText);

         var paragraph = $("#main-thought").find(".description").text();
         var start = paragraph.indexOf(selectionText);
         var end = start + selectionText.length;

         this.annotations.push({
         description: selectionText,
         start:       start,
         end:         end
         });
         console.log(this.annotations);
         }
         */
    });

    rv.Single.AllReplyView = Backbone.View.extend({

    });

    rv.Single.ReplyView = Backbone.View.extend({

        template:  _.template($("#reply-template").html()),

        tagName:   "div",
        className: "reply-row",

        initialize: function() {
            this.render();
        },

        render: function() {

            this.$el.html( this.template(this.model.toJSON()));
            return this;

        }

    });

})();