window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;

    rv.IndexView = Backbone.View.extend({

        tagName: "div",
        template: Handlebars.compile($("#index-template").html()),

        events: {
            'click .or-register':     'showRegister',
            'click .or-login':        'showLogin',
            'click .forgot-password': 'showForgotPassword'
        },

        initialize: function(options){
            this.message = options.message;
            this.render();
        },

        render: function() {

            var template_options = {};

            if ($.trim(this.message)) {
                template_options.message = this.message;
            }

            this.$el.html(this.template(template_options))
        },

        showRegister: function() {
            $("#register-form").fadeIn();
            $(".or-register").fadeOut();
            $("#login-form").slideUp(500, function() {
                $(".or-login").fadeIn();
            });
        },

        showLogin: function() {
            $("#login-form").slideDown();
            $(".or-login").fadeOut();
            $("#register-form").fadeOut(500, function() {
                $(".or-register").fadeIn();
            });
        },

        showForgotPassword: function() {
            $(".or-register").fadeOut();
            $("#login-form").slideUp(500, function() {
                $("#forgot-password").fadeIn();
            });
        }

    })

})();