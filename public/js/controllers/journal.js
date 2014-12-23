window.rupon = window.rupon || {};
window.rupon.controllers = window.rupon.controllers || {};
window.rupon.utils = window.rupon.utils || {};

(function() {

    var rc = window.rupon.controllers,
        rv = window.rupon.views,
        rm = window.rupon.models,
        rh = window.rupon.helpers;

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
            .on('get-next-entry', function() {
                writeToThoughtsView.trigger('get-next-entry');
            })
            .on('get-previous-entry', function(cb) {
                writeToThoughtsView.trigger('get-previous-entry', cb);
            })
            .on('go-to-entry', function() {
                writeToThoughtsView.trigger('go-to-entry', 'most-recent');
            })
            .on('write-reflection', function() {
                writeToThoughtsView.trigger('write-reflection')
            })

        frequencyView = new rv.FrequencyView({collection: frequency_collection});
        frequencyView
            .on('write-reflection', function() {
                writeToThoughtsView.trigger('write-reflection')
            })
            .on('go-to-entry', function(val) {
                writeToThoughtsView.trigger('go-to-entry', val);
            })
            .on('write-entry', function(val) {
                writeToThoughtsView.trigger('write-entry', val);
            })

        var mainView = new rv.MainView();
        var sideView = new rv.SideView({collection: my_thoughts_collection});

        sideView.on('go-to-entry', function(val) {
            writeToThoughtsView.trigger('go-to-entry', val);
        });

        $("#container").html("<div class='side-view-container col-md-2'></div><div class='main-view-container col-md-10'></div>");
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
        frequency_collection.fetch({reset:true});
        recommended_collection.fetch({reset:true, data: {stream_type: "recommended"}});
        user_message_collection.fetch({reset:true, data: {user_id:rupon.account_info.user_id}});
        tags_collection.fetch();
    };

})();
