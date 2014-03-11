window.rupon = window.rupon || {};
window.rupon.models = window.rupon.models || {};

(function() {

    Backbone.Model.prototype.idAttribute = "_id";

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

    rm.thoughtCollection = Backbone.PageableCollection.extend({
        model: rm.thought,
        mode: "infinite",

        url: '/api/thought/',

        state: {
            totalRecords:50,
            pageSize:15,
            sortKey: "updated",
            order:1
        },

        queryParams: {
            totalPages: null,
            totalRecords: null,
            sortKey: "sort",
            order: "direction",
            directions: {
                "-1": "asc",
                "1": "desc"
            }
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

    rm.userMessage = Backbone.Model.extend({

    });

    rm.userMessageCollection = Backbone.Collection.extend({
        model: rm.userMessage,

        url: function() {
            return '/api/user_messages';
        }
    });

})();