window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        allThoughts, dashboardView, singleView, tooltipView, elem,
        my_thoughts_collection, other_thoughts_collection;

    rc.startPage = function(options) {

        rupon.account_info = rupon.account_info || {};
        rupon.account_info.user_id = options.user_id;

        my_thoughts_collection = new rupon.models.thoughtCollection([],{type: "my-posts"});
        other_thoughts_collection = new rupon.models.thoughtCollection([],{type: "other-posts"});

        var sidebarView     = new rupon.views.Sidebar.MainView();
        var newThoughtsView = new rupon.views.Sidebar.ThoughtsView({collection: other_thoughts_collection});

        $(".new-reflections").html(newThoughtsView.$el);

        newThoughtsView
            .on("view-thought", function(model) {
                rc.resetViews();
                singleView = new rupon.views.Single.ThoughtView({model: model});
                $("#container").html(singleView.$el);
            });

        sidebarView
            .on("create-reflection", function() {
                var postboxView = new rupon.views.PostboxView({collection: my_thoughts_collection}) })
            .on("view-dashboard", function() {
                rc.resetViews();
                rc.setDashboard(); })
            .on("view-all", function() {
                rc.resetViews();
                rc.setAllThoughts(); });

        rc.setDashboard();

        my_thoughts_collection.fetch({reset: true});
        other_thoughts_collection.fetch({reset: true});

    };

    rc.resetViews = function() {
        if (singleView)    singleView.remove();
        if (dashboardView) dashboardView.remove();
        if (allThoughts)   allThoughts.remove();
    };

    rc.setDashboard = function() {
        dashboardView = new rupon.views.DashboardView();
        $("#container").html(dashboardView.$el);

        var frequencyView   = new rupon.views.FrequencyView({collection: my_thoughts_collection});
        var messageFeedView = new rupon.views.MessageFeedView({collection: my_thoughts_collection});

        $(".my-dashboard")
            .find(".post-frequency").html(frequencyView.$el).end()
            .find(".message-feed").html(messageFeedView.$el);
    };

    rc.setAllThoughts = function() {
        allThoughts = new rupon.views.ThoughtView({collection: my_thoughts_collection})
        $("#container").append(allThoughts.$el);

        var setTooltipView = function() {

            var text = rupon.utils.getSelectionText();

            tooltipView = new rupon.views.TooltipView({collection: my_thoughts_collection, annotation: text});
            $(".jquery-gdakram-tooltip").find(".content").html(tooltipView.$el);

        }

        $(".thought-row").tooltip({
            event_in: "tooltip-start",
            event_out: "tooltip-end",
            opacity: 1,
            on_complete: setTooltipView
        });

        allThoughts.on("start-tooltip", function(ele) {
            if (elem != ele) {
                elem = ele;

                if (tooltipView) tooltipView.remove();
                $(".thought-row").trigger("tooltip-end");

                elem.trigger("tooltip-start");
            }
        });
    }

    rupon.utils.getSelectionText = function() {
        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        return text;
    }
})();