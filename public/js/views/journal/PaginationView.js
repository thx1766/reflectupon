window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    Handlebars.registerHelper('contains', function(types, type, options) {
        if (_.contains(types, type)) {
            return options.fn();
        }
    });

    var rv = window.rupon.views;
    var rm = window.rupon.models;
    var cv = window.rupon.common_views;

    rv.PaginationView = Backbone.View.extend({
        tagName: "div",
        className: "clearfix",
        template: Handlebars.templates['pagination'],

        events: {
            "click a.less-recent": "getLessRecent",
            "click a.more-recent": "getMoreRecent",
            "click a.go-to-journal": "seeEntries",
            "click a.go-to-write": "goToWrite"
        },

        initialize: function() {
            this.listenTo(this.collection, 'reset', this.render);
            this.render();
        },

        render: function(options) {
            options = options || {};

            var model_index       = options.model_index,
                first_model_index = options.first_model_index,
                last_model_index  = options.last_model_index;

            if (typeof model_index == "undefined") {
                var types = ['see-entries'];
            } else {
                if (model_index == first_model_index) {
                    types = ['write-reflection','less-recent'];
                } else if (model_index > first_model_index && model_index < last_model_index) {
                    types = ['more-recent','less-recent'];
                }
            }

            this.$el.html(this.template({
                types: types
            }));
        },

        seeEntries: function() {
            this.trigger('go-to-entries', this.collection);
        },

        getMoreRecent: function() {
            this.trigger('get-more-recent', this.collection);
        },

        getLessRecent: function() {
            this.trigger('get-less-recent', this.collection);
        },

        goToWrite: function() {
            this.trigger('go-to-write');
        }
    });

})();