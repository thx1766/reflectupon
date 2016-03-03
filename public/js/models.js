window.rupon = window.rupon || {};
window.rupon.models = window.rupon.models || {};

(function() {

    Backbone.Model.prototype.idAttribute = "_id";

    var rm = window.rupon.models,
        rh = window.rupon.helpers;

    rm.user = Backbone.Model.extend({
        urlRoot: '/api/users'
    });

    rm.userCollection = Backbone.Collection.extend({
        model: rm.user,
        url: '/api/users/'
    });

    rm.email = Backbone.Model.extend({
        url: "/api/send_email/"
    })

    rm.thought = Backbone.Model.extend({
        defaults: {
            "title":        "Untitled",
            "description":  "test",
            "privacy":      "PRIVATE",
            "replies":      []
        },
        urlRoot: "/api/thought",

        initialize: function() {

            var replies = this.get('replies') || [];
            this.set('replies', new rm.replyCollection(replies));

            this.get('replies').on('add', this.repliesAdded, this);

        },

        repliesAdded: function(model) {
            this.trigger('reply:change', model)
        },

        getAnnotations: function() {
            
            var annotations = new rm.annotationCollection();
            annotations.thought_id = this.id;

            var self = this;
            annotations.fetch({
                success: function() {
                    self.set('annotations', annotations)
                }
            })
        }

    });

    //rm.thoughtCollection = Backbone.PageableCollection.extend({
    rm.thoughtCollection = Backbone.Collection.extend({
        model: rm.thought,
        mode: "infinite",

        url: function() {
            return '/api/thought/';
        },

        state: {
            pageSize: 15,
            sortKey:  "updated",
            order:    1
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
        },

        initialize: function(options) {
            this.thought_id = options.thought_id;
        },

        urlRoot: '/api/reply/',

        url: function() {
            if (this.isNew()) {
                return '/api/thought/'+this.thought_id+'/reply'
            } else {
                return Backbone.Model.prototype.url.call(this);
            }
        }

    });

    rm.annotation = Backbone.Model.extend({

    });

    rm.replyCollection = Backbone.Collection.extend({
        model: rm.reply,

        initialize: function(options) {
        },

        sync: function(method, model, options) {
            if (method == 'read') {
                options.url = '/api/reply';
            }else{
                options.url = '/api/thought/'+this.thought_id+'/reply';
            }
            return Backbone.sync(method, model, options);
        }
    });

    rm.annotationCollection = Backbone.Collection.extend({
        model: rm.annotation,
        url: function() {

            var query = "";
            if (this.thought_id) {
                query += '?thought_id=' + this.thought_id;
            }

            return '/api/annotations' + query;
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

    rm.frequency = Backbone.Model.extend({
        parse: function(response) {
            response.thoughts = new rm.thoughtCollection(response.thoughts);
            return response;
        }
    });

    rm.frequencyCollection = Backbone.Collection.extend({
        model: rm.frequency,
        url: '/api/frequency',

        addToDate: function(model) {

            var freq_model = this.models[0],
                thoughts   = _.clone(freq_model.get("thoughts"));

            thoughts.push(model.toJSON());
            freq_model.set("thoughts",thoughts);
        }
    });

    rm.userRange = Backbone.Model.extend({});

    rm.userRangesCollection = Backbone.Collection.extend({
        model: rm.userRange,
        url: '/api/active_users'
    });

    rm.topic = Backbone.Model.extend({});

    rm.topicsCollection = Backbone.Collection.extend({
        model: rm.topic,
        url:   '/api/topics'
    });

    rm.report = Backbone.Model.extend({});

    rm.reportsCollection = Backbone.Collection.extend({
        model: rm.report,
        url:   '/api/reports'
    });

    rm.prompt = Backbone.Model.extend({});
    rm.promptsCollection = Backbone.Collection.extend({
        url: '/api/prompts'
    });

    rm.userSettings = Backbone.Model.extend({
        initialize: function(options) {
            this.user = options.user
        },

        url: function() {
            return '/api/user_settings?user_id=' + this.user;
        }
    });

})();