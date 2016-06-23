window.rupon = window.rupon || {};
window.rupon.common_views = window.rupon.common_views || {};

(function() {

    var CommonViews = window.rupon.common_views;

    CommonViews.BaseView = Backbone.View.extend({
    });

    /**
     * A simple Backbone view rendered from a template.
     */
    CommonViews.TemplateView = CommonViews.BaseView.extend({

        initialize: function(options) {
            /* if (options.template) this.template = Handlebars.compile(options.template); */
            this.render(options);
        },

        render: function(options) {
            this.$el.html(this.template(options));
        }
    });

    /**
     * A simple Backbone view rendering a model into a template.
     */
    CommonViews.SimpleModelView = CommonViews.TemplateView.extend({

        render: function(options) {
            var template_options = _.extend(options, _.clone(this.model.attributes));
            CommonViews.TemplateView.prototype.render.call(this, template_options);
        }

    });

    /**
     * Generic Backbone view that can container other views. Keeps track
     * of the child views, providing methods to add and remove them. Child
     * views can also be dettached and reattached to the container, which helps
     * when re-rendering the container from a template.
     */
    CommonViews.Container = CommonViews.BaseView.extend({
        initialize: function() {
            Backbone.View.prototype.initialize.apply(this, arguments);
            this._children = [];
            this._selectors = [];
        },

        addChild: function(child, opt_selector) {
            var childIndex = _.indexOf(this._children, child);
            if (childIndex == -1) {
                this._children.push(child);
                this._selectors.push(opt_selector);
                var $container = opt_selector ? this.$el.find(opt_selector) : this.$el;
                this.displayAddedChild($container, child);
            }
        },

        detachChildren: function() {
            _.each(this._children, function(child) {
                child.$el.detach();
            });
        },

        reattachChildren: function() {
            _.each(_.zip(this._children, this._selectors), function(info) {
                var child = info[0];
                var opt_selector = info[1];
                var $container = opt_selector ? this.$el.find(opt_selector) : this.$el;
                this.displayAddedChild($container, child);
            }, this);
        },

        removeChild: function(child) {
            var childIndex = _.indexOf(this._children, child);
            if (childIndex != -1) {
                this._children.splice(childIndex, 1);
                this._selectors.splice(childIndex, 1);
                child.remove();
            }
        },

        remove: function() {
            _.each(this._children, function(child) {
                child.remove();
            });
            this._children = [];
            this._selectors = [];
            Backbone.View.prototype.remove.call(this);
        },

        displayAddedChild: function($container, child) {
            $container.append(child.$el);
        }
    });


    /**
     * A type of CommonViews.Container that adds a child view for each model
     * in a collection. Adds and removes child views when the collection
     * changes.
     */
    CommonViews.CollectionContainer = CommonViews.Container.extend({

        /* Assign child view to a parent container within the view */
        container_ele: null,
        num_elements:  null,

        events: {
            'click .trigger': 'expandOthers'
        },

        /**
         * Initialize takes either the the model view class used to
         * render the models in the collection, or a constructor function
         * that takes the model as an argument and returns an instantiated view.
         * The constructor can be used to create views that need more than just
         * the model during instantiation.
         */
        initialize: function(modelViewClassOrConstructor, options) {
            CommonViews.Container.prototype.initialize.call(this);
            this.modelViews = {};
            if (typeof modelViewClassOrConstructor == 'function') {
                this.modelViewConstructor = modelViewClassOrConstructor;
            } else {
                this.modelViewClass = modelViewClassOrConstructor;
            }
            this.listenTo(this.collection, 'add', this.addView);
            this.listenTo(this.collection, 'remove', this.removeView);
            this.listenTo(this.collection, 'reset', this.reset);
            this.render(options);
        },

        render: function(options) {

            if (this.template) this.$el.html(this.template(options));

            var container_ele = this.container_ele || null;
            var num_elements  = this.num_elements  || null;

            _.each(this.collection.models, function(model, index) {
                this.addView(model, this.container_ele);

                if (num_elements && index == (num_elements - 1)) {
                    this.$el.append("<div class='collapsible-container'><a href='javascript:;' class='trigger'>View "+ (this.collection.length - num_elements) +" more</a><div class='collapsible-contents hidden'></div></div>");
                    this.container_ele = ".collapsible-contents";
                }
            }, this);
        },

        addView: function(model, opt_selector) {

            if (typeof opt_selector != "string") opt_selector = null;
            
            var modelView;
            if (this.modelViewClass) {
                modelView = new this.modelViewClass({model: model});
            } else {
                modelView = this.modelViewConstructor(model);
            }

            // Proxy all model view events through the collection container view.
            var that = this;
            this.listenTo(modelView, 'all', function() {
                that.trigger.apply(this, arguments);
            });

            this.modelViews[model.cid] = modelView;
            this.addChild(modelView, opt_selector);
            return modelView;
        },

        removeView: function(model) {
            var modelView = this.modelViews[model.cid];
            if (modelView) {
                this.removeChild(modelView);
                delete this.modelViews[model.cid]
            }
        },

        reset: function() {
            _.each(this.modelViews, function(modelView) {
                this.removeChild(modelView);
            }, this);
            this.modelViews = {};
            this.render();
        },

        expandOthers: function() {
            this.$el.find('.collapsible-contents').removeClass('hidden').end()
                .find('.trigger').addClass('hidden');
        }
    });

})()