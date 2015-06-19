window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.ModalView = cv.BaseView.extend({
        initialize: function(opts) {
            if (opts.view == 'login') {
                this.renderLogin();
            } else if (opts.view == 'signup') {
                this.renderSignup();
            }
        },

        renderLogin: function() {
            $('#myModalLogin').modal();
        },

        renderSignup: function() {
            $('#myModalSignup').modal();
        }

    });

    rv.IndexView = cv.BaseView.extend({

        tagName: "div",
        template: Handlebars.templates['index'],

        events: {
            'click .forgot-password': 'showForgotPassword'
        },

        initialize: function(options){
            this.message = options.message;
            this.render();
        },

        render: function() {

            var loginModal  = this.showLoginModal();
            var signupModal = this.showSignupModal();
            this.$el.html(loginModal + signupModal);

            var template_options = {};

            if ($.trim(this.message)) {
                template_options.message = this.message;
            }

            this.$el.append(this.template(template_options))
        },

        showForgotPassword: function() {
            $(".or-register").fadeOut();
            $("#login-form").slideUp(500, function() {
                $("#forgot-password").fadeIn();
            });
        }

    })

})();