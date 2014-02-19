window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    Backbone.Model.prototype.idAttribute = "_id";

    Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if( lvalue!=rvalue ) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    });

    var rc = window.rupon.controllers,
        allThoughts, dashboardView, singleView, tooltipView, postboxView, elem,
        my_thoughts_collection, other_thoughts_collection;

    rc.startPage = function(options) {

        rupon.account_info = rupon.account_info || {};
        rupon.account_info.user_id = options.user_id;
        rupon.account_info.email = options.email;

        my_thoughts_collection = new rupon.models.thoughtCollection([],{type: "my-posts"});
        other_thoughts_collection = new rupon.models.thoughtCollection([],{type: "other-posts"});

        var sidebarView     = new rupon.views.Sidebar.MainView();

        sidebarView
            .on("create-reflection", function() {
                rc.resetViews({tooltip_view: true});

                postboxView = new rupon.views.PostboxView({collection: my_thoughts_collection})
                $("#postbox-container").html(postboxView.$el);

                $.colorbox({
                    inline:true,
                    href:".postbox"
                });
            })
            .on("view-dashboard", function() {
                rc.resetViews();
                rc.setDashboard(); })
            .on("view-all", function() {
                rc.resetViews();
                rc.setAllThoughts(); })
            .on("show-other-thoughts", function() {
                sidebarView.startTooltip(); })
            .on("show-super-user", function() {
                rc.resetViews();
                rc.setSuperUser();
            });

        sidebarView.activateTooltip(function() {
            var newThoughtsView = new rupon.views.Sidebar.ThoughtsView({collection: other_thoughts_collection});

            newThoughtsView
                .on("view-thought", function(model) {
                    rc.resetViews();
                    rc.setSingle(model);
                });

            $(".new-reflections").html(newThoughtsView.$el);
        });

        $("#sidebar").html(sidebarView.$el);
        rc.setDashboard();

        my_thoughts_collection.fetch({reset: true});
        other_thoughts_collection.fetch({reset: true});

    };

    /* reset all views unless otherwise stated in params */
    rc.resetViews = function(options) {

        options = options || {all_views: true};

        if (options.all_views || options.tooltip_view) {
            $(".thoughts-list").removeClass("select-text");
            $(".thought-row").removeClass("selected").trigger("tooltip-end");
            if (tooltipView) tooltipView.remove();
            if (postboxView) postboxView.remove();
        }

        if (options.all_views) {
            $("body").scrollTop(0);
            if (singleView)    singleView.remove();
            if (dashboardView) dashboardView.remove();
            if (allThoughts)   allThoughts.remove();
        }
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
		allThoughts = new rupon.views.ThoughtView({collection: my_thoughts_collection});
		allThoughts
		    .on("tooltip-initialized", function() {
			setTooltipView() })
		    .on("start-tooltip", function(ele) {

			    $("body").animate({scrollTop:(ele.offset().top - 20)}, '20000', 'swing');

			    $(".thought-row").trigger("tooltip-end");
			    if (tooltipView) tooltipView.remove();

			    ele.trigger("tooltip-start");

			    $(document).click(function(event) {
				if($(event.target).parents().index($('.jquery-gdakram-tooltip')) == -1) {
				    if($('.jquery-gdakram-tooltip').is(":visible")) {
					ele.trigger("tooltip-end");
					rc.resetViews({tooltip_view:true});
				    }
				}
			    })
			})
		    .on("change-privacy", function(privacy, model) {
			model.save({privacy: privacy},{wait:true})
		    });

		$("#container").append(allThoughts.$el);

		var setTooltipView = function() {

		    var text = rupon.utils.getSelectionText();

		    tooltipView = new rupon.views.TooltipView({collection: my_thoughts_collection, annotation: text});
		    $(".jquery-gdakram-tooltip").find(".content").html(tooltipView.$el);

		    tooltipView.on("create-reflection", function(attrs) {
			my_thoughts_collection.create(attrs);
			rc.resetViews({tooltip_view:true});
		    });

		}
	    };

	    rc.setSingle = function(model) {
		singleView = new rupon.views.Single.ThoughtView({model: model});
		$("#container").html(singleView.$el);
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

	    rc.startIndexPage = function(message) {
		var indexView = new rupon.views.IndexView({message: message});
		$(".index-container").html(indexView.$el);
    }

    rc.setSuperUser = function() {
        var user_collection = new rupon.models.userCollection();
        var superUserView = new rupon.views.UsersView({collection: user_collection});
        $("#container").html(superUserView.$el);
        user_collection.fetch();
    }

})();
