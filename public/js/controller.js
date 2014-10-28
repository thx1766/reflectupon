window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

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
        rv = window.rupon.views,
        rm = window.rupon.models,
        thoughtsView, singleView, tooltipView, postboxView, elem, newThoughtsView, FrequencyView,
        my_thoughts_collection, other_thoughts_collection;

    rc.startPage = function(options) {

        rupon.account_info         = rupon.account_info || {};
        rupon.account_info.user_id = options.user_id;
        rupon.account_info.email   = options.email;

        my_thoughts_collection    = new rupon.models.thoughtCollection([],{type: "my-posts"});
        other_thoughts_collection = new rupon.models.thoughtCollection([],{type: "other-posts"});

        var sidebarView = new rupon.views.Sidebar.MainView({collection: my_thoughts_collection});

        sidebarView
            .on("create-reflection", function() {
                rc.resetViews({tooltip_view: true});

                postboxView = new rupon.views.PostboxView({collection: my_thoughts_collection})

                postboxView
                    .on("create-reflection", function(attrs) {
                        my_thoughts_collection.create(attrs, {
                            wait:    true,
                            silent:  true,
                            success: function(response) {
                                my_thoughts_collection.trigger('create', response);
                            }
                        });
                    });

                $("#postbox-container").html(postboxView.$el);

                $.colorbox({
                    inline:true,
                    href:".postbox"
                });
            })
            .on("view-all", function() {
                rc.resetViews();
                rc.setAllThoughts(); })
            .on("show-other-thoughts", function() {})
            .on("show-super-user", function() {
                rc.resetViews();
                rc.setSuperUser();
            })

        $(".actions-container").html(sidebarView.$el);

        rc.setAllThoughts();

        other_thoughts_collection.fetch({reset: true, data: {"stream_type": "other-thoughts"}});

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
            if (thoughtsView)   thoughtsView.remove();
        }
    };

    rc.setAllThoughts = function() {

        var recommended_collection  = new rupon.models.thoughtCollection(),
            user_message_collection = new rupon.models.userMessageCollection(),
            frequency_collection    = new rupon.models.frequencyCollection({listen_collection: my_thoughts_collection}),
            tags_collection         = new rm.topicsCollection();

        var mainView        = new rv.MainView(),
            /* recThoughtsView = new rv.RecommendedView({
                collection: recommended_collection,
                user:       rupon.account_info}), */

        frequencyView   = new rv.FrequencyView({collection: frequency_collection});

        //rc.applyTooltipEvents(recThoughtsView);

        var writeThoughtView = new rv.WriteThoughtView({
            tags_collection: tags_collection
        });

        writeThoughtView
            .on("create-reflection", function(attrs) {
                my_thoughts_collection.create(attrs, {
                    wait:    true,
                    silent:  true,
                    success: function(response) {
                        my_thoughts_collection.trigger('create', response);
                        writeThoughtView.remove()

                        my_thoughts_collection.fetch({
                            reset: true,
                            data:  {
                                stream_type: "my-thoughts"
                            },
                            success: function(collection) {
                                // _.each(collection.models, function(model) {
                                //     model.getAnnotations();
                                // });
                            }
                        });
                        
                        thoughtsView    = new rv.ThoughtsView({
                            collection:         my_thoughts_collection,
                            user:               rupon.account_info,
                            reply_collection:   rm.replyCollection,
                            tags_collection:    tags_collection,

                            // used for past posts
                            thought_collection: rm.thoughtCollection
                        });

                        var paginationView = new rv.PaginationView({collection: my_thoughts_collection});
                        mainView.$el.find(".thought-container").append(thoughtsView.$el)
                        mainView.$el.find(".pagination-container").append(paginationView.$el);
                        rc.applyTooltipEvents(thoughtsView);
                    }
                });

            });

        $("#container").html(mainView.$el);

		mainView.$el
            .find(".frequency-container").append(frequencyView.$el).end()
            //.find(".recommended-container").append(recThoughtsView.$el).end()
            .find(".thought-container").append(writeThoughtView.$el).end()
            //.find(".thought-container").append(thoughtsView.$el).end()

        user_message_collection.on("reset", function() {
            if (user_message_collection.at(0)) {
                var nagView = new rv.nagView({model: user_message_collection.at(0)});

                nagView.on("dismiss-message", function() {
                    var first_message = user_message_collection.at(0);
                    var num_dismissed = parseInt(first_message.get('dismissed')) || 0;
                    first_message.save({dismissed: num_dismissed + 1 });
                });

                mainView.$el
                    .find(".message-container").html(nagView.$el);
            }
        })

        frequency_collection.fetch({reset:true});
        recommended_collection.fetch({reset:true, data: {stream_type: "recommended"}});
        user_message_collection.fetch({reset:true, data: {user_id:rupon.account_info.user_id},
            success: function() {
            }});
        tags_collection.fetch();
        $('textarea').autosize();
	};

    rc.setSingle = function(model) {
		singleView = new rupon.views.Single.ThoughtView({model: model});
		$("#container").html(singleView.$el);
    };

    rupon.utils.getSelectionText = function() {
		var text = "";
		if (window.getSelection) {
		    text = window.getSelection().toString();
		} else if (document.selection && document.selection.type != "Control") {
		    text = document.selection.createRange().text;
		}
		return text;
    }

    rc.startIndexPage = function(message, login) {
		var indexView = new rupon.views.IndexView({message: message});
		$(".index-container").html(indexView.$el);

        var thoughts_collection = new rupon.models.thoughtCollection(),
            tags_collection     = new rm.topicsCollection();

        var thoughtsView = new rv.ThoughtsView({
            collection:       thoughts_collection,
            user:             rupon.account_info,
            reply_collection: rm.replyCollection,
            can_reply:        false,
            tags_collection:  tags_collection,
        });

        thoughts_collection.fetch({ 
            data: {
                "stream_type":   "my-thoughts",
                "reply_privacy": "AUTHOR_TO_PUBLIC"
            },
            success: function(collection) {
                _.each(collection.models, function(model) {
                    model.getAnnotations();
                });
            }
        });

        tags_collection.fetch();

        $(".index-container").find(".feed-content").html(thoughtsView.$el);

        $('.index-container').find('.btn').click(function() {
            $('#myModal').modal();
        });

        if (login == "1") {
            $('.index-container').find('.btn').click()
        }
    }

    rc.setSuperUser = function() {
        var topics_collection         = new rm.topicsCollection(),
            user_collection           = new rm.userCollection(),
            user_ranges_collection    = new rm.userRangesCollection(),
            other_thoughts_collection = new rm.thoughtCollection([],{type: "other-posts"}),
            email                     = new rm.email();

        var superUserView = new rupon.views.SuperUserView({
            topics_collection:         topics_collection,
            user_collection:           user_collection,
            other_thoughts_collection: other_thoughts_collection,
            user_ranges_collection:    user_ranges_collection,
            email:                     email
        });

        $("#container").html(superUserView.$el);

        topics_collection.fetch();
        user_collection.fetch();
        user_ranges_collection.fetch();
        other_thoughts_collection.fetch({reset: true, data: {"stream_type": "other-thoughts"}});
    }
    
    rc.applyTooltipEvents = function(view) {

        var setTooltipView = function() {

            var text = rupon.utils.getSelectionText();

            tooltipView = new rupon.views.TooltipView({collection: my_thoughts_collection, annotation: text});
            $(".jquery-gdakram-tooltip").find(".content").html(tooltipView.$el);

            tooltipView.on("create-reflection", function(attrs) {
                my_thoughts_collection.create(attrs,{wait:true});
                rc.resetViews({tooltip_view:true});
            });

        }

        view
            .on("tooltip-initialized", function() {
                setTooltipView() })
            .on("start-tooltip", function(ele) {

                $("body").animate({scrollTop:(ele.offset().top - 60)}, '20000', 'swing');

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
            })
            .on("edit-thought", function(new_text, model) {
                model.save({description: new_text});
            })
            .on("delete-thought", function(model) {
                model.destroy();
            })
            .on("archive-thought", function(model) {
                model.save({archived: true});
            })
    }

})();
