window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    rv.Single = rv.Single || {};

    rv.Single.ThoughtView = Backbone.View.extend({
        tagName:"div",

        events: {
            'click .submit-reply': 'submitReply',
            'click .show-thought': 'showThought'
        },

        template: Handlebars.compile($("#single-thought-template").html()),

        initialize: function() {

            //this.collection.replies = new rupon.models.replyCollection({thought_id: this.model.attributes._id});

            this.model.get('replies').on('add', function(reply) {

                var formatReply = new rv.Single.ReplyView({ model: reply });
                $(".write-reply").html( formatReply.el );

            });

            this.render();

        },

        render: function() {

            if (this.model) {
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
                    self.$el.find(".write-reply").html( formatReply.el );
                });
            }

            return this;
        },

        showThought: function() {
            this.$el.find(".full-thought").addClass("expanded");
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
    });

    rv.Single.ReplyView = Backbone.View.extend({

        template:  Handlebars.compile($("#reply-template").html()),

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