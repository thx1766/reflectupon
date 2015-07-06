window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers,

        dayModelIndex;

    rc.setAllThoughts = function() {

        var recommended_collection  = new rupon.models.thoughtCollection(),
            user_message_collection = new rupon.models.userMessageCollection(),
            frequency_collection    = new rupon.models.frequencyCollection(),
            tags_collection         = new rm.topicsCollection();

        var writeToThoughtsView = new rv.WriteToThoughtsView({
            tags_collection:      tags_collection,
            frequency_collection: frequency_collection,
            reply_collection:     rm.replyCollection,
            user:                 rupon.account_info
        });

        writeToThoughtsView.on("create-reflection", function(attrs) {
            var format_date = rh.dateForFrequencyItem(attrs.date);
            var freq_item   = frequency_collection.where({day: format_date})[0];

            var thought = new rm.thought(attrs);
            thought.save();

            var thoughts = freq_item.get('thoughts')
            thoughts.unshift(thought);
            freq_item.set('thoughts', thoughts);
            freq_item.trigger('thought-change');

            writeToThoughtsView.trigger('go-to-entry', "most-recent");
        });

        var paginationView = new rv.PaginationView({collection: frequency_collection});
        paginationView
            .on('go-to-entries', function(collection) {
                renderRightColumnView("most-recent", {
                    collection:          collection,
                    writeToThoughtsView: writeToThoughtsView,
                    paginationView:      paginationView
                });
            })
            .on('get-less-recent', function(collection) {
                renderRightColumnView("next-entry", {
                    collection:          collection,
                    writeToThoughtsView: writeToThoughtsView,
                    paginationView:      paginationView
                });
            })
            .on('get-more-recent', function(collection) {
                renderRightColumnView("previous-entry", {
                    collection:          collection,
                    writeToThoughtsView: writeToThoughtsView,
                    paginationView:      paginationView
                });
            })
            .on('go-to-write', function() {
                writeToThoughtsView.trigger('write-reflection');
                paginationView.render({
                    page_num: 0
                })
            });

        frequencyView = new rv.FrequencyView({collection: frequency_collection});
        frequencyView
            .on('write-reflection', function() {
                writeToThoughtsView.trigger('write-reflection')
            })
            .on('go-to-entry', function(date) {
                renderRightColumnView(date, {
                    collection:          frequency_collection,
                    writeToThoughtsView: writeToThoughtsView,
                    paginationView:      paginationView
                });
            })
            .on('write-entry', function(val) {
                writeToThoughtsView.trigger('write-entry', val);
            })

        var mainView = new rv.MainView();

        $("#container").html("<div class='side-view-container'></div><div class='main-view-container'></div>");
        $(".side-view-container").append(frequencyView.$el);
        $(".main-view-container").append(mainView.$el);

        mainView.$el
            .find(".thought-container").append(writeToThoughtsView.$el).end()
            .find(".pagination-container").append(paginationView.$el);

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

        var frequency_data_options = {};

        if ($(window).width() < 450) {
            frequency_data_options.mobile = true;
        };

        frequency_collection.fetch({reset:true, data: frequency_data_options});
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
        var paginationView      = options.paginationView;

        var model = getModelByDate(modelType, collection, dayModelIndex);
        dayModelIndex = collection.indexOf(model);

        var firstModel = getModelByDate("most-recent", collection);
        var firstModelIndex = collection.indexOf(firstModel);

        var lastModel = getModelByDate("least-recent", collection);
        var lastModelIndex = collection.indexOf(lastModel);

        writeToThoughtsView.render("day", model);
        paginationView.render({
            model_index:       dayModelIndex,
            first_model_index: firstModelIndex,
            last_model_index:  lastModelIndex
        })
    }

})();
