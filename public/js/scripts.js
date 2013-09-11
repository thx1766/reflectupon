$(document).ready(function() {

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };
/*
    var Router = Backbone.Router.extend({

        routes: {
            "route/:id": "getRoute"
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

    }); */

    Backbone.pubsub = _.extend({}, Backbone.Events);

    var viewType;
  
    var Thought = Backbone.Model.extend({
        defaults: {
            "title":       "Untitled",
            "description": "test",
            "privacy": "PRIVATE"
        }
    });

    var Thoughts = Backbone.Collection.extend({
        model: Thought,
        url: '/api/thought/my-posts/'
    });

    var StreamThoughts = Backbone.Collection.extend({
        model: Thought,
        url: '/api/thought/stream/'
    });

    var ThoughtView = Backbone.View.extend({

        el: ".thoughts-list",

        events: {
            'click .show-postbox': 'showPostbox',
            'click .postbox-send': 'createThought'
        },

        template: _.template($("#thought-template").html()),

        initialize: function() {

            this.$main = this.$('#main');

            this.thoughts = new Thoughts();
            this.thoughts.fetch({ reset: true });
            this.thoughts.on('reset', this.render, this );
            Backbone.pubsub.on('addThought', this.displayItem, this);

        },

        render: function() {
            _.each( this.thoughts.models, function(thought){

                this.displayItem(thought);
            }, this);

            return this;
        },

        displayItem: function(thought) {

            var formatThought = thought.toJSON();

            if (formatThought.privacy == "PRIVATE") {
                formatThought.privacy = "Private";
            } else if (formatThought.privacy == "ANONYMOUS") {
                formatThought.privacy = "Anonymous";
            }

            formatThought.description = formatThought.description.replace(/\n/g,"<br>");

            this.$main.prepend( this.template( formatThought ) );

        },

        showPostbox: function() {

            $.colorbox({inline:true, href:"#postbox"});

        }

    });

    var StreamThoughtView = Backbone.View.extend({

        el: ".stream-list",

        events: {
            'click .postbox-send': 'createThought'
        },

        template: _.template($("#thought-template").html()),

        initialize: function() {

            this.$main = this.$('#main');

            this.thoughts = new StreamThoughts();
            this.thoughts.fetch({ reset: true });
            this.thoughts.on('reset', this.render, this );
            Backbone.pubsub.on('addThought', this.displayItem, this);

        },

        render: function() {
            _.each( this.thoughts.models, function(thought){

                this.displayItem(thought);
            }, this);

            return this;
        },

        displayItem: function(thought) {

            var formatThought = thought.toJSON();

            if (formatThought.privacy == "PRIVATE") {
                formatThought.privacy = "Private";
            } else if (formatThought.privacy == "ANONYMOUS") {
                formatThought.privacy = "Anonymous";
            }

            formatThought.description = formatThought.description.replace(/\n/g,"<br>");

            this.$main.prepend( this.template( formatThought ) );

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

    var postboxView = new PostboxView();
    var streamThoughtView = new StreamThoughtView();
    var thoughtView = new ThoughtView();
    var router = new Router();
    Backbone.history.start();

});
