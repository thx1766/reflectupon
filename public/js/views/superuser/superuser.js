window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views,
        cv = window.rupon.common_views;

    rv.SuperUserView = cv.Container.extend({
        tagName: 'div',
        className: 'super-user',

        template: Handlebars.compile($("#super-user-template").html()),

        initialize: function(options) {
            cv.Container.prototype.initialize.call(this);

            this.render(options);
        },

        render: function(options) {

            this.$el.html(this.template());

            this.addChild(new rv.TopicsView({
                collection: options.topics_collection
            }), '.tags-container');

            this.addChild(new rv.EmailsView({
                model: options.email
            }), '.email-container');

            this.addChild(new rv.ActiveUserRangesView({
                collection: options.user_ranges_collection
            }), '.active-user-ranges-view-container');

            this.addChild(new rv.UsersView({
                collection: options.user_collection
            }), '.user-view-container');

            this.addChild(new rv.VetThoughtsView({
                collection: options.other_thoughts_collection
            }), '.thought-view-container');

        }

    });

    rv.TopicsView = cv.CollectionContainer.extend({

        container_ele: 'ul',
        template: Handlebars.compile("<ul></ul><input type='text' /><a class='add' href='javascript:;'>Add topic</a>"),

        events: {
            'click .add': 'addTopic'
        },

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.TopicView({model: model});
            });
        },

        addTopic: function() {

            var topic = this.$el.find('input').val();

            this.collection.create({
                name: topic
            });

            this.$el.find('input').val("");
        }

    });

    rv.TopicView = cv.SimpleModelView.extend({
        tagName: "li",
        template: Handlebars.compile("{{name}} <a class='remove' href='javascript:;'>Remove</a>"),

        events: {
            'click .remove': 'removeTopic'
        },

        removeTopic: function() {
            this.model.destroy();
        }
    });

    rv.EmailsView = cv.TemplateView.extend({

        template: Handlebars.compile("<a href='javascript:;'>send emails</a>"),

        events: {
            'click a': 'sendEmail'
        },

        sendEmail: function(){
            this.model.save();
        }
    });

    rv.ActiveUserRangesView = cv.CollectionContainer.extend({
        tagName: "div",
        className: "active-user-ranges-view",

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.ActiveUserRangeView({model: model});
            });
        }

    });

    rv.ActiveUserRangeView = cv.TemplateView.extend({

        template: Handlebars.compile($("#active-user-ranges-template").html()),

        render: function(options) {
            var template_options = _.clone(this.model.attributes);
            template_options.start_date = moment(template_options.start_date).format('MMM D');
            template_options.end_date = moment(template_options.end_date).format('MMM D');
            cv.TemplateView.prototype.render.call(this, template_options);
        }

    });

    rv.UsersView = cv.CollectionContainer.extend({
        tagName: 'ul',
        className: 'users-view',

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.UserView({model: model})
            })
        }

    });

    rv.UserView = Backbone.View.extend({
        tagName: 'li',
        className: 'clearfix',
        template: Handlebars.compile($("#user-template").html()),

        events: {
            'click .delete a': 'deleteUser',
            'click .confirm': 'confirmDeleteUser'
        },

        initialize: function() {
            this.render();
        },

        render: function() {
            var template_options = _.clone(this.model.attributes);
            var date = new Date(template_options.created_at);

            if (template_options.created_at) template_options.date = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
            this.$el.html(this.template(template_options));
        },

        deleteUser: function() {
            this.$el.append('<a href="javascript:;" class="confirm">Confirm Delete?</a>')
        },

        confirmDeleteUser: function() {
            this.model.destroy();
        }
    });

    rv.VetThoughtsView = cv.CollectionContainer.extend({
        tagName: 'ul',
        className: 'thought-view',

        initialize: function() {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.VetThoughtView({model: model})
            })
        }
    });

    rv.VetThoughtView = cv.SimpleModelView.extend({
        tagName: 'li',
        template: Handlebars.compile($("#vet-thought-template").html()),

        events: {
            'click .delete': 'deleteThought',
            'click .set-private': 'setPrivate'
        },

        deleteThought: function() {
            this.model.destroy();
        },

        setPrivate: function() {
            this.model.save({privacy: 'PRIVATE'});
        }

    });
})();