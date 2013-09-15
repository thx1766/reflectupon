$(document).ready(function() {

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };
/*
    var Router = Backbone.Router.extend({

        routes: {
            "thought/:id": "getRoute"
        },

        getRoute: function( id ) {

            switch (id){

                case "lifeline":
                    $("div.thoughts-list").removeClass("hidden");
                    break;
                case "stream":
                    $("div.thoughts-list").addClass("hidden");
                    break;

            }

        }

    });*/

    Backbone.pubsub = _.extend({}, Backbone.Events);
  
    var Thought = Backbone.Model.extend({
        defaults: {
            "title":       "Untitled",
            "description": "test",
            "privacy": "PRIVATE"
        },
        urlRoot: "/api/thought"
    });

    var Reply = Backbone.Model.extend({
        defaults: {
            "title":       "Untitled"
        }
    })

    var Thoughts = Backbone.Collection.extend({
        model: Thought,
        url: function() {
            return '/api/thought/'+ this.type +'/';
        }
    });

    var Replies = Backbone.Collection.extend({
        model: Reply,
        url: function() {
            return '/api/thought/'+ this.thoughtId +'/reply/';
        }
    });

    var IndexView = Backbone.View.extend({

        el: ".left-side",

        events: {
            'click .or-register': 'showRegister',
            'click .or-login': 'showLogin'
        },

        showRegister: function() {
            $("#register-form").fadeIn();
            $(".or-register").fadeOut();
            $("#login-form").slideUp(500, function() {
                $(".or-login").fadeIn();
            });
        },

        showLogin: function() {
            $("#login-form").slideDown();
            $(".or-login").fadeOut();
            $("#register-form").fadeOut(500, function() {
                $(".or-register").fadeIn();
            });
        }

    })

    var ThoughtView = Backbone.View.extend({

        el: ".thoughts-list",

        events: {
            'click .show-postbox': 'showPostbox'
        },

        template: _.template($("#thought-template").html()),

        initialize: function() {

            this.$main = this.$('#main');

            this.thoughts = new Thoughts();
            this.thoughts.type = "my-posts";
            this.thoughts.fetch({ reset: true });
            this.thoughts.on('reset', this.render, this );
            Backbone.pubsub.on('addThought', this.displayItem, this);

        },

        render: function() {

            _.each( this.thoughts.models, this.displayItem, this);
            return this;
        },

        displayItem: function(thought) {

            var formatThought = new ThoughtItemView({ model: thought, view: 'thought' });
            formatThought.render();

            this.$main.prepend( formatThought.el );

        },

        showPostbox: function() {

            $.colorbox({inline:true, href:"#postbox"});

        }

    });

    var streamThoughts;

    var StreamThoughtView = Backbone.View.extend({

        el: ".stream-list",

        events: {
        },

        initialize: function() {

            this.$main = this.$('#main');

            this.thoughts = new Thoughts();
            this.thoughts.type = "stream";
            this.thoughts.fetch({ reset: true });
            this.thoughts.on('reset', this.render, this );

        },

        render: function() {

            _.each( this.thoughts.models, this.displayItem, this);
            return this;
        },

        displayItem: function(thought) {

            var formatThought = new ThoughtItemView({ model: thought, view: 'stream' });
            formatThought.render();

            this.$main.prepend( formatThought.el );

        }

    });

    var ThoughtItemView = Backbone.View.extend({

        tagName:   "div",
        className: "thought-row",

        initialize: function() {
            this.model.on("change", this.modelChanged, this);
        },

        render: function() {

            var formatThought = this.model.toJSON();

            if (formatThought.privacy == "PRIVATE") {
                formatThought.privacy = "Private";
            } else if (formatThought.privacy == "ANONYMOUS") {
                formatThought.privacy = "Anonymous";
            }

            formatThought.description = formatThought.description.replace(/\n/g,"<br>");

            var template = _.template($("#"+ this.options.view +"-template").html());
            var outputHtml = template(formatThought);
            this.$el.html(outputHtml);
            return this;
        },

        modelChanged: function(model, changes) {
            this.render();
        }

    });

    var ReplyItemView = Backbone.View.extend({

        template:  _.template($("#reply-template").html()),

        tagName:   "div",
        className: "reply-row",

        render: function() {

            this.$el.html( this.template(this.model.toJSON()));
            return this;

        }

    });

    var PostboxView = Backbone.View.extend({
        el: "#postbox",

        events: {

            'click .postbox-send': 'createThought'

        },

        initialize: function() {

            this.title          = this.$('.postbox-title');
            this.description    = this.$('.postbox-description');
            this.privacy        = this.$('.postbox-privacy');

        },

        template: _.template($("#thought-template").html()),

        createThought: function() {

            $.colorbox.close();

            this.thoughts = new Thoughts();

            this.thoughts.on('add', function() {
                Backbone.pubsub.trigger('addThought',this.models[0]);
            });

            this.thoughts.create({

                title:          this.title.val(),
                description:    this.description.val(),
                privacy:        this.privacy.val()

            });

        }

    });

    var SingleThoughtView = Backbone.View.extend({

        el: "#single-thought",

        events: {

            'click .submit-reply': 'submitReply'

        },

        template: _.template($("#single-template").html()),

        initialize: function() {
            this.thoughtId = this.$el.attr("thought-id");

            _.bindAll(this, "render");

            this.thought = new Thought({ id: this.thoughtId });
            this.thought.fetch();
            this.thought.on('sync', function() {
                this.render();
            }, this);

            this.input  = this.$("textarea");
            this.submit = this.$("a.submit-reply");

            this.replies = new Replies();
            this.replies.thoughtId = this.thoughtId;
            this.replies.fetch();
            this.replies.on('sync', function() {
                this.showReplies();
            },this)

            $("#main-thought").bind('mouseup', function(){
                var selection;

                if (window.getSelection) {
                    selection = window.getSelection();
                } else if (document.selection) {
                    selection = document.selection.createRange();
                }

                selection.toString() !== '' && $('#main-thought').highlight(selection.toString());
            });
        },

        render: function() {

            var formatThought = this.thought.toJSON();

            if (formatThought.privacy == "PRIVATE") {
                formatThought.privacy = "Private";
            } else if (formatThought.privacy == "ANONYMOUS") {
                formatThought.privacy = "Anonymous";
            }

            formatThought.description = formatThought.description.replace(/\n/g,"<br>");

            var outputHtml = this.template( formatThought );
            $("#main-thought").html(outputHtml);


            return this;
        },

        showReplies: function() {
            _.each( this.replies.models, this.displayReply, this);
        },

        displayReply: function(reply) {
            var formatReply = new ReplyItemView({ model:reply});
            formatReply.render();

            $(".reply-area").prepend( formatReply.el );
        },

        submitReply: function(e) {

            e.preventDefault();

            this.replies = new Replies();

            this.replies.on('add', function(reply) {
                console.log("submitted!")

                var formatReply = new ReplyItemView({ model: reply });
                formatReply.render();

                $(".reply-area").prepend( formatReply.el );

            });

            this.replies.create({

                title:          "test",
                description:    this.input.val(),
                thought_id:     this.thoughtId

            });

        }

    });

    var postboxView = new PostboxView();
    var streamThoughtView = new StreamThoughtView();
    var thoughtView = new ThoughtView();
    var singleThoughtView = new SingleThoughtView();
    var indexView = new IndexView();
    //var router = new Router();
    //Backbone.history.start();

});
