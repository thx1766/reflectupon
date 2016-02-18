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
            var loginView = new rv.LoginModal(),
                loginViewEl = $(loginView.$el);
            loginView
                .on('show-forgot', function() {
                    loginViewEl.modal('hide');
                    var forgotView = new rv.ForgotModal();
                    $(forgotView.$el).modal();
                });
            loginViewEl.modal();
        },

        renderSignup: function() {
            var signupModal = new rv.SignupModal();
            $(signupModal.$el).modal();
        }

    });

    rv.SignupModal = cv.TemplateView.extend({
        className: "modal fade signup",
        template: Handlebars.templates['signup-modal'],

        events: {
            'click .submit-box input': 'clickSubmit'
        },

        clickSubmit: function() {
            var error = false;

            var usernameField = this.$el.find('#username-field'),
                emailField    = this.$el.find('#email-field'),
                passwordField = this.$el.find('#password-field'),
                confirmField  = this.$el.find('#confirm-password-field');

            usernameField.find('span').html('');
            emailField.find('span').html('');
            passwordField.find('span').html('');
            confirmField.find('span').html('');

            if (!$.trim(usernameField.find('input').val())) {
                usernameField.find('span').html('Required');
                error = true;
            }

            var emailInput = emailField.find('input').val();
            if (!$.trim(emailInput)) {
                emailField.find('span').html('Required');
                error = true;
            } else if (!this.validateEmail(emailInput)) {
                emailField.find('span').html('Not an e-mail');
            }

            var passwordInput = passwordField.find('input').val();
            if (!$.trim(passwordInput)) {
                passwordField.find('span').html('Required');
                error = true;
            }

            var confirmInput = confirmField.find('input').val()
            if (!$.trim(confirmInput)) {
                confirmField.find('span').html('Required');
                error = true;
            }

            if (passwordInput != confirmInput) {
                passwordField.find('span').html('Passwords must match');
            }

            if (error) {
                return false;
            }
        },

        validateEmail: function(email) {
            var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

    });

    rv.LoginModal = cv.TemplateView.extend({
        className: "modal fade login",
        template: Handlebars.templates['login-modal'],

        events: {
            'click .forgot-password':  'showForgotPassword',
            'click .submit-box input': 'clickSubmit'
        },

        showForgotPassword: function() {
            this.trigger('show-forgot');
        },

        clickSubmit: function() {
        }
    });

    rv.ForgotModal = cv.TemplateView.extend({
        className: "modal fade forgot",
        template: Handlebars.templates['forgot-modal']
    })
})();