window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startReportsPage = function(options) {

        var tags_collection = new rm.topicsCollection();
        var collection      = new rm.reportsCollection();

        var reportsView = new rv.ReportsView({
            collection:       collection,
            model:            Backbone.Model,
            tags_collection:  tags_collection,
            reply_collection: rm.replyCollection
        });
        $("#container").html(reportsView.$el);
        
        tags_collection.fetch();
        collection.fetch({reset: true});
    };

})();
