window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.ModalView = cv.BaseView.extend({
        initialize: function(opts) {
            if (opts.view == 'login') {
                var isReset = opts.message && opts.message == "reset";
                this.renderLogin(isReset);
            } else if (opts.view == 'signup') {
                this.renderSignup();
            }
        },

        renderLogin: function(isReset) {
            var loginView = new rv.LoginModal({reset: isReset}),
                loginViewEl = $(loginView.$el);
            loginView
                .on('show-forgot', function(email) {
                    loginViewEl.modal('hide');
                    var forgotView = new rv.ForgotModal({email: email});
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
            'click .submit-box input': 'clickSubmit',
            'focusout #username-field input': 'checkUsername',
            'focusout #email-field input': 'checkEmail'
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

            if (self.err || error) {
                return false;
            }
        },

        checkUsername: function() {
            var usernameField = this.$el.find('#username-field');
            usernameField.find('span').html('');
            var usernameInput = usernameField.find('input').val();
            if ($.trim(usernameInput) == "") {
            } else {
                var self = this;
                $.ajax({
                    type: "POST",
                    url: "/check-username",
                    data: {username: usernameInput},
                    success: function(response){
                        self.err = false;
                        if (response.msg == "already exists") {
                            usernameField.find('span').html('Username already exists.');
                            self.err = true;
                        }
                    },
                    dataType: "JSON"
                });
            }
        },

        checkEmail: function() {
            var emailField = this.$el.find('#email-field');
            emailField.find('span').html('');
            var emailInput = emailField.find('input').val();
            if ($.trim(emailInput) == "") {
            } else if (!this.validateEmail(emailInput)) {
                emailField.find('span').html('Not an e-mail');
            } else {
                var self = this;
                $.ajax({
                    type: "POST",
                    url: "/check-email",
                    data: {email: emailInput},
                    success: function(response){
                        self.err = false;
                        if (response.msg == "already exists") {
                            emailField.find('span').html('E-mail already exists.');
                            self.err = true;
                        }
                    },
                    dataType: "JSON"
                });
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
            var username = this.$el.find('#username').val();

            if (!this.validateEmail(username)) {
                username = '';
            }
            this.trigger('show-forgot', username);
        },

        clickSubmit: function() {
        },

        validateEmail: function(email) {
            var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
    });

    rv.ForgotModal = cv.TemplateView.extend({
        className: "modal fade forgot",
        template: Handlebars.templates['forgot-modal'],

        events: {
            'click .submit-forgot': 'clickSubmit'
        },

        clickSubmit: function() {
            var self = this,
                email = this.$el.find('#email').val();

            if ($.trim(email) != "") {
                $.ajax({
                    type: "POST",
                    url: "/forgot",
                    data: {email: email},
                    success: function(){
                        self.$el.find('.email-sent').show();
                    },
                    dataType: "JSON"
                });
            }

            return false;
        }
    })
})();