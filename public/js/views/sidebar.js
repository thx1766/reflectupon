window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views,
        cv = window.rupon.common_views;

    var getMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    rv.FrequencyView = cv.CollectionContainer.extend({

        tagName: "div",
        className: "side-view clearfix",

        template: Handlebars.templates['frequency'],

        initialize: function(options) {
            this.$el.html(this.template());
            cv.CollectionContainer.prototype.initialize.call(this, function(model) { 
                return new rv.FrequencyItemView({model: model});
            });
        }

    });

    rv.FrequencyItemView = cv.TemplateView.extend({

        tagName: "li",
        template: Handlebars.templates['frequency-item'],

        events: {
            "click a":        "goToEntry",
            "click .fa-plus": "writeNewEntry"
        },

        initialize: function() {
            this.listenTo(this.model, "thought-change", this.render);
            cv.TemplateView.prototype.initialize.call(this);
        },

        render: function() {
            var filled = this.model.get("thoughts") && this.model.get("thoughts").length > 0;

            var options = {
                date:   moment(this.model.attributes.day).format('MMM Do'),
                filled: filled,
                colored_tabs: getUserTabs(this.model.attributes.tags)
            } 
            cv.TemplateView.prototype.render.call(this,options);

            this.$el.toggleClass("filled", filled);
        },

        goToEntry: function(e) {
            this.trigger('go-to-entry', this.model.attributes.day);
        },

        writeNewEntry: function(e) {
            this.trigger('write-entry', this.model.attributes.day);
        }

    });

    var getUserTabs = function(tags) {
        return _.map(tags, function(tag) {
            return getUserTabFromDictionary(tag);
        })
    };

    var getUserTabFromDictionary = function(tag) {
        rupon.colored_tabs = rupon.colored_tabs || [];
        tab_index = _.indexOf(rupon.colored_tabs, tag);
        if (tab_index == -1) {
            rupon.colored_tabs.push(tag);
            tab_index = _.indexOf(rupon.colored_tabs, tag);
        }
        return tab_index;
    }

})();