window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views,
        cv = window.rupon.common_views;

    rv.ReportsView = cv.CollectionContainer.extend({
        template: Handlebars.templates['report'],
        container_ele: ".report-items-container",

        initialize: function(options) {
            cv.CollectionContainer.prototype.initialize.call(this, function(model) {
                return new rv.ReportItemView({
                    model:            model,
                    tags_collection:  options.tags_collection,
                    reply_collection: options.reply_collection
                })
            })
        }
    });

    rv.ReportItemView = cv.Container.extend({
        template: Handlebars.templates['report-item'],

        initialize: function(options) {
            this.render(options)
        },

        render: function(options) {
            this.$el.html(this.template());

            var thoughtView = new rv.ThoughtWrapperView({
                model:            this.model,
                tags_collection:  options.tags_collection,
                reply_collection: options.reply_collection
            });

            this.$el.html(thoughtView.$el);
        }

    });

})();
