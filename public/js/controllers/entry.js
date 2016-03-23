window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

    rc.startEntryPage = function(thought, params) {
        mixpanel.track('single-entry-view');

        params = params || {};

        $('.log-in-btn').on('click', function() {
            new rv.ModalView({view: "login"});
        });

        if (params.userMade) {
            $('.side-view-container').hide();
        } else {

            var signupForm = new rv.SignupView({
                username: params.username || "",
                experiment: true,
                thoughtId: thought[0]._id
            });

            $('.sign-up-view').html(signupForm.$el);
        }

        var popular_collection = new rm.thoughtCollection(thought);

        var popularView = new rv.ThoughtsView({
            collection: popular_collection,
            reply_collection: rm.replyCollection,
            user: rupon.account_info,
            showMore: true,
            experiment: true
        });

        $(".popular-container").html(popularView.$el);
        popularView.trigger('content-loaded');

    }

})();
