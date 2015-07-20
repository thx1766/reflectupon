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
            var login = $(Handlebars.templates['login-modal']({type: 'login'}));
            login.modal();
            login.on('click', '.forgot-password', this.showForgotPassword);
        },

        renderSignup: function() {
            $(Handlebars.templates['signup-modal']({type: 'signup'})).modal();
        },

        showForgotPassword: function() {
            $(".or-register").fadeOut();
            $("#login-form").slideUp(500, function() {
                $("#forgot-password").fadeIn();
            });
        }

    });
})();