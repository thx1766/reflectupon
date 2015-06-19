window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startSuperuserPage = function(options) {
        var topics_collection         = new rm.topicsCollection(),
            user_collection           = new rm.userCollection(),
            user_ranges_collection    = new rm.userRangesCollection(),
            other_thoughts_collection = new rm.thoughtCollection(),
            featured_collection       = new rm.thoughtCollection(),
            email                     = new rm.email();

        var superUserView = new rupon.views.SuperUserView({
            topics_collection:         topics_collection,
            user_collection:           user_collection,
            other_thoughts_collection: other_thoughts_collection,
            featured_collection:       featured_collection,
            user_ranges_collection:    user_ranges_collection,
            email:                     email
        });

        $("#container").html(superUserView.$el);

        topics_collection.fetch();
        user_collection.fetch();
        user_ranges_collection.fetch();
        other_thoughts_collection.fetch({reset: true, data: {"stream_type": "other-thoughts"}});
        featured_collection.fetch({reset: true, data: {"stream_type": "featured"}});
    }

})();
