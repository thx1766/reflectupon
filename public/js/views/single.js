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

        initialize: function(options) {

            this.followUserView = options.followUserView;

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

            this.$el.find(".actions-container").html(this.followUserView.$el);

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

    rv.Single.FollowUserView = Backbone.View.extend({
        tagName: "div",
        className: "actions",
        template: _.template($("#follow-user-template").html()),

        events: {
            "click .follow": "followUser"
        },

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html( this.template());
        },

        followUser: function() {
            this.$el.find(".following").removeClass("hidden");
            this.$el.find(".follow").addClass("hidden");
            this.trigger("follow-user");
        }

    })

})();