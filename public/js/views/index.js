window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.IndexView = cv.BaseView.extend({

        tagName: "div",
        template: Handlebars.templates['index'],

        initialize: function(options){
            this.message = options.message;
            this.render();

            $(window).scroll(function() {
                var scrollTop = $(document).scrollTop();

                if (scrollTop > 50) {
                    $('.navbar').addClass('scrolled');
                } else {
                    $('.navbar').removeClass('scrolled');
                }
            })
        },

        render: function() {

            var template_options = {};

            if ($.trim(this.message)) {
                template_options.message = this.message;
            }

            this.$el.append(this.template(template_options))
        }

    })

})();