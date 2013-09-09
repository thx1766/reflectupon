$(document).ready(function() {

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };

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

    });

    Backbone.pubsub = _.extend({}, Backbone.Events);
  
    var Thought = Backbone.Model.extend({
        defaults: {
            "title":       "Untitled",
            "description": "test"
        },
        urlRoot: '/api/thought/'
    });

    var Thoughts = Backbone.Collection.extend({
        model: Thought,
        url: '/api/thought'
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

            this.$main.prepend( this.template( thought.toJSON() ) );

        },

        showPostbox: function() {

            $.colorbox({inline:true, href:"#postbox"});

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

        },

        template: _.template($("#thought-template").html()),

        createThought: function() {

            var self = this;

            this.thoughts = new Thoughts();

            this.thoughts.on('add', function() {
                Backbone.pubsub.trigger('addThought',this.models[0]);
            });

            this.thoughts.create({

                title:          this.title.val(),
                description:    this.description.val()

            });

        }

    });

    var postboxView = new PostboxView();
    var thoughtView = new ThoughtView();
    var router = new Router();
    Backbone.history.start();

});
