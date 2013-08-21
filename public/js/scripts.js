$(document).ready(function() {
  
  var Thought = Backbone.Model.extend({
    defaults: {
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
      'click .create-thought': 'createThought'
    },

    template: _.template("<li><%= description %></li>"),

    initialize: function() {

       this.$main = this.$('#main');

       this.thoughts = new Thoughts();
       this.thoughts.fetch({ reset: true });
       this.thoughts.on('reset', this.render, this );
    },

    render: function() {
      this.input = this.$('create-thought');
      _.each( this.thoughts.models, function(thought){
          this.$main.append( this.template( thought.toJSON() ) );
      }, this);
      return this;
    },

    createThought: function() {

      var self = this;

      var thought = new Thought();
      thought.save({ description: this.input.val() }, {
        success: function( model, rsp ) {

          self.$main.prepend( self.template( model.toJSON() ) );

        }
      });
    }

  });

  var thoughtView = new ThoughtView();

});
