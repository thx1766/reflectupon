window.rupon = window.rupon || {};
window.rupon.models = window.rupon.models || {};

(function() {

    var rm = window.rupon.models;

    rm.user = Backbone.Model.extend({
        urlRoot: '/api/users'
    });

    rm.userCollection = Backbone.Collection.extend({
        model: rm.user,
        url: '/api/users/'
    });

    rm.thought = Backbone.Model.extend({
        defaults: {
            "title":        "Untitled",
            "description":  "test",
            "privacy":      "PRIVATE"
        },
        urlRoot: "/api/thought",

        initialize: function() {

            var replies = this.get('replies') || [];
            this.set('replies', new rm.replyCollection(replies));

            this.get('replies').on('add', this.repliesAdded, this);

        },

        repliesAdded: function(model) {
            this.trigger('reply:change', model)
        }

    });

    rm.thoughtCollection = Backbone.Collection.extend({
        model: rm.thought,

        initialize: function(models, options) {
            this.type = options.type;

        },
        url: function() {
            return '/api/thought/'+ this.type +'/';
        }
    });

    rm.reply = Backbone.Model.extend({
        defaults: {
            "title":       "Untitled"
        }
    });

    rm.annotation = Backbone.Model.extend({

    });

    rm.replyCollection = Backbone.Collection.extend({
        model: rm.reply,

        initialize: function(options) {
            this.thought_id = options.thought_id;
        },

        url: function() {
            return '/api/thought/'+ this.thought_id +'/reply/';
        }
    });

    rm.annotationCollection = Backbone.Collection.extend({
        model: rm.annotation,
        url: function() {
            return '/api/thought/'+ this.thoughtId +'/reply/'+ this.replyId + '/annotation/';
        }
    });

    rm.followUser = Backbone.Model.extend({
        urlRoot: "/follow_user"
    });

    rm.followUserCollection = Backbone.Collection.extend({
        model: rm.followUser,
        url: "/follow_user"
    })

})();