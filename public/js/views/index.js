window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.ModalView = cv.BaseView.extend({
        initialize: function() {
            this.render();
        },

        render: function() {
            $('#myModal').modal();
        }

    });

    rv.IndexView = cv.BaseView.extend({

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

            this.$el.html(this.showModal());

            var template_options = {};

            if ($.trim(this.message)) {
                template_options.message = this.message;
            }

            this.$el.append(this.template(template_options))
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