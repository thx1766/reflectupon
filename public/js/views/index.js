window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    rv.IndexView = cv.BaseView.extend({

        tagName: "div",
        template: Handlebars.templates['index'],

        events: {
            'click button': 'clickButton'
        },

        initialize: function(options){
            this.message = options.message;
            this.render();

            $(window).scroll(function() {
                var scrollTop = $(document).scrollTop(),
                    ind, pos;

                if (scrollTop > 250) {
                    $('.navbar').addClass('scrolled');
                } else {
                    $('.navbar').removeClass('scrolled');
                }

                ind = $("#level3 img").index($('#level3 img.selected'));
                if (scrollTop > 700) {
                    pos = 4;
                    if (ind != pos) {
                        $("#level3 img.selected").removeClass("selected");
                        $("#level3 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 600) {
                    pos = 3;
                    if (ind != pos) {
                        $("#level3 img.selected").removeClass("selected");
                        $("#level3 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 500) {
                    pos = 2;
                    if (ind != pos) {
                        $("#level3 img.selected").removeClass("selected");
                        $("#level3 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 400) {
                    pos = 1;
                    if (ind != pos) {
                        $("#level3 img.selected").removeClass("selected");
                        $("#level3 img:eq("+pos+")").addClass("selected");
                    }
                } else {
                    pos = 0;
                    if (ind != pos) {
                        $("#level3 img.selected").removeClass("selected");
                        $("#level3 img:eq("+pos+")").addClass("selected");
                    }
                }

                ind = $("#level4 img").index($('#level4 img.selected'));
                if (scrollTop > 1300) {
                    pos = 4;
                    if (ind != pos) {
                        $("#level4 img.selected").removeClass("selected");
                        $("#level4 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 1200) {
                    pos = 3;
                    if (ind != pos) {
                        $("#level4 img.selected").removeClass("selected");
                        $("#level4 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 1100) {
                    pos = 2;
                    if (ind != pos) {
                        $("#level4 img.selected").removeClass("selected");
                        $("#level4 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 1000) {
                    pos = 1;
                    if (ind != pos) {
                        $("#level4 img.selected").removeClass("selected");
                        $("#level4 img:eq("+pos+")").addClass("selected");
                    }
                } else {
                    pos = 0;
                    if (ind != pos) {
                        $("#level4 img.selected").removeClass("selected");
                        $("#level4 img:eq("+pos+")").addClass("selected");
                    }
                }

                ind = $("#level6 img").index($('#level6 img.selected'));
                if (scrollTop > 2200) {
                    pos = 4;
                    if (ind != pos) {
                        $("#level6 img.selected").removeClass("selected");
                        $("#level6 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 2100) {
                    pos = 3;
                    if (ind != pos) {
                        $("#level6 img.selected").removeClass("selected");
                        $("#level6 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 2000) {
                    pos = 2;
                    if (ind != pos) {
                        $("#level6 img.selected").removeClass("selected");
                        $("#level6 img:eq("+pos+")").addClass("selected");
                    }
                } else if (scrollTop > 1900) {
                    pos = 1;
                    if (ind != pos) {
                        $("#level6 img.selected").removeClass("selected");
                        $("#level6 img:eq("+pos+")").addClass("selected");
                    }
                } else {
                    pos = 0;
                    if (ind != pos) {
                        $("#level6 img.selected").removeClass("selected");
                        $("#level6 img:eq("+pos+")").addClass("selected");
                    }
                }
            })
        },

        render: function() {

            var template_options = {};

            if ($.trim(this.message)) {
                template_options.message = this.message;
            }

            this.$el.append(this.template(template_options))
        },

        clickButton: function(e) {
            var target = $(e.currentTarget),
                input = target.siblings('input'),
                email = input.val(),
                value = '',
                msg = target.siblings('.error-msg');

            if (!this.validateEmail(email)) {
                value = 'Insert a proper e-mail!';
                input.select();

                this.showValidationMsg(msg, value);
                return;
            }

            var self = this;
            this.trigger('subscribe', email, function(response) {

                if (response == "success") {
                    self.showValidationMsg(msg, 'Thanks for subscribing!');
                } else if (response == "exists") {
                    self.showValidationMsg(msg, 'E-mail already exists. Try another one.');
                }
            });

        },

        showValidationMsg: function(msg, value) {
            msg.html('');
            msg.hide();
            msg.html(value);
            msg.fadeIn(200);
        },

        validateEmail: function(email) {
            var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

    })

})();