window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views,
        cv = window.rupon.common_views;

    rv.WriteView = cv.TemplateView.extend({
        tagName: "div",
        className: "write-view clearfix",
        template: Handlebars.templates['write'],

        tags: [],

        events: {
            'click .create':        'submitReflection',
            'click .privacy':       'changePrivacy',
            'click .write-another': 'writeAnother',
            'click .link':          'showLink',
            'click .tag':           'openTagsMenu'
        },

        render: function(options) {
            options.day = moment().format("dddd");
            cv.TemplateView.prototype.render.call(this, options);
            //this.$el.find('textarea').autosize();

            var writeTagsView = new rv.WriteTagsView({collection: options.tags_collection});

            var self = this;
            writeTagsView
                .on('create-new-tag', function(attr) {
                    options.tags_collection.create({name: attr}, {wait: true});
                })
                .on('activate-tag', function(attr, cb) {
                    if (_.contains(self.tags, attr)) {
                        var tag_index = self.tags.indexOf(attr);
                        self.tags.splice(tag_index, 1);
                        cb(false)
                    } else {
                        self.tags.push(attr);
                        cb(true)
                    }
                })

            this.$el.find('.tags-container').html(writeTagsView.$el);
            this.$el.find('.fa').tooltip();
            //this.$el.find('textarea').autosize();
        },

        showLink: function() {
            var addLink = this.$el.find('input.add-link');
            addLink.removeClass('hidden');

            setTimeout(function() {
                addLink.addClass('revealed');
            }, 100);
        },

        openTagsMenu: function() {
            this.$el.find('.tags-content').removeClass('hidden');
            $('#myModal').modal();
        },

        changePrivacy: function() {

            var privacy_ele = this.$el.find('.privacy');
            var make_not_private = privacy_ele.hasClass('is_private');

            privacy_ele.toggleClass('is_private', !make_not_private);

        },

        writeAnother: function() {
            
            var textarea_ele = this.$el.find("textarea");
            textarea_ele.val('');
            this.$el.find('.expanded').removeClass('no-opacity');
            textarea_ele.focus();
        },

        submitReflection: function() {

            var self = this;
            var expanded = this.$el.find('.expanded');
            var textarea_ele = this.$el.find("textarea");
            var addlink_shown = this.$el.find('input.add-link').hasClass('revealed');
            var privacy_ele = this.$el.find('.anon-input input');
            var prompt_ele = this.$el.find('.prompt-input input');

            if (!this.clickedOnce && $.trim(textarea_ele.val()) != "") {
                this.clickedOnce = true;

                var date = new Date();
                // date.setDate(date.getDate()-(5));

                var prompt_id = $('.journal-prompt').find('.description').attr('id');

                var params = {
                    description:    textarea_ele.val(),
                    //title:          '',
                    //expression:     '',
                    privacy:        privacy_ele.prop("checked") ? 'ANONYMOUS' : 'PUBLIC',
                    date:           date,
                    tag_ids:        self.tags,
                    prompt_id:      prompt_ele.prop("checked") ? prompt_id: ''
                }

                if (addlink_shown) params.link = this.$el.find('input.add-link').val();

                this.trigger("create-reflection", params)
            }
        }

    });

})();
