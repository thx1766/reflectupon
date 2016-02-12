window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers,

        dayModelIndex;

    rc.setAllThoughts = function(frequency, popular) {

        var getStartedView;

        var recommended_collection  = new rupon.models.thoughtCollection(),
            user_message_collection = new rupon.models.userMessageCollection(),
            frequency_collection    = new rupon.models.frequencyCollection(frequency),
            popular_collection      = new rupon.models.thoughtCollection(popular),
            tags_collection         = new rm.topicsCollection();

        // Only pass reference to reply_collection - since each thought handles its own replies
        var writeToThoughtsView = new rv.WriteToThoughtsView({
            tags_collection:      tags_collection,
            frequency_collection: frequency_collection,
            reply_collection:     rm.replyCollection,
            user:                 rupon.account_info
        });

        writeToThoughtsView
            .on("create-reflection", function(attrs) {
                var format_date = rh.dateForFrequencyItem(attrs.date);
                var freq_item   = frequency_collection.where({day: format_date})[0];

                var thought = new rm.thought(attrs);
                thought.save({},{success: function() {
                    renderRightColumnView("recommended", {
                        collection:          frequency_collection,
                        writeToThoughtsView: writeToThoughtsView
                    })
                }});

                var thoughts = freq_item.get('thoughts')
                thoughts.unshift(thought);
                freq_item.set('thoughts', thoughts);
                freq_item.trigger('thought-change');

                getStartedView.trigger('write-done')
            })
            .on('highlight-else-done', function() {
                getStartedView.render('highlight-else-done');
            })
            .on('highlight-mine-done', function() {
                getStartedView.render('highlight-mine-done');
            })

        getStartedView = new rv.GetStartedView({
            collection:  frequency_collection
        });

        getStartedView
            .on('write-done', function() {
                getStartedView.render('write-done');
            });

        frequencyView = new rv.FrequencyView({collection: frequency_collection});
        frequencyView
            .on('write-reflection', function() {
                writeToThoughtsView.trigger('write-reflection')
            })
            .on('go-to-entry', function(date) {
                renderRightColumnView(date, {
                    collection:          frequency_collection,
                    writeToThoughtsView: writeToThoughtsView
                });
            })
            .on('write-entry', function(val) {
                writeToThoughtsView.trigger('write-entry', val);
            })

        var mainView = new rv.MainView();
        var popularView = new rv.ThoughtsView({
            collection: popular_collection,
            reply_collection: rm.replyCollection,
            user: rupon.account_info
        });

        $("#container").html("<div class='main-view-container'></div><div class='side-view-container'></div>");
        $(".side-view-container")
            .append(getStartedView.$el)
            .append(frequencyView.$el);
        $(".main-view-container")
            .append(mainView.$el)

        mainView.$el
            .find(".dashboard-container").append(writeToThoughtsView.$el).end()
            .find(".popular-container").append(popularView.$el);

        popularView.trigger('content-loaded');

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

        my_thoughts_collection.fetch({
            reset: true, 
            data: {
                "stream_type":   "my-thoughts",
                "reply_privacy": "AUTHOR_TO_PUBLIC"
            }
        });

        tags_collection.fetch();

        recommended_collection.fetch({reset:true, data: {stream_type: "recommended"}});
        user_message_collection.fetch({reset:true, data: {user_id:rupon.account_info.user_id}});
        tags_collection.fetch();

    };

    /**
     * Params:
     *   - date: String (i.e. as a date "2015-06-20" or "most-recent")
     */
    var getModelByDate = function(date, collection, model_index) {
        var frequency_models = _.clone(collection.models);
        switch (date) {
            case "most-recent":
                return _.find(frequency_models, function(model) {
                    return model.get('thoughts').length;
                });
                break;
            case "next-entry":
                return _.find(frequency_models, function(model, index) {
                    return model.get('thoughts').length && index > model_index;
                });
                break;
            case "previous-entry":
                frequency_models.reverse();
                return _.find(frequency_models, function(model, index) {
                    return model.get('thoughts').length && (frequency_models.length - index) <= model_index;
                });
                break;
            case "least-recent":
                frequency_models.reverse();
                return _.find(frequency_models, function(model) {
                    return model.get('thoughts').length;
                });
        }
        return _.find(frequency_models, function(model) {
            return model.get('day') == date;
        });
    }

    var renderRightColumnView = function(modelType, options) {

        var collection          = options.collection;
        var writeToThoughtsView = options.writeToThoughtsView;

        if (modelType == "recommended") {
            writeToThoughtsView.render("recommended");
        } else {
            var model = getModelByDate(modelType, collection, dayModelIndex);
            dayModelIndex = collection.indexOf(model);

            var firstModel = getModelByDate("most-recent", collection);
            var firstModelIndex = collection.indexOf(firstModel);

            var lastModel = getModelByDate("least-recent", collection);
            var lastModelIndex = collection.indexOf(lastModel);

            writeToThoughtsView.render("day", model);
        }
    }

})();
