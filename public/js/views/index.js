window.rupon = window.rupon || {};
window.rupon.views = window.rupon.views || {};

(function() {

    var rv = window.rupon.views;
    var cv = window.rupon.common_views;

    var a, b, c;

    rv.IndexView = cv.BaseView.extend({

        tagName: "div",
        template: Handlebars.templates['index'],

        events: {
            'click button': 'clickButton'
        },

        initialize: function(options){
            this.message = options.message;
            this.render();

            var self = this;
            $(window).scroll(function() {
                var scrollTop = $(document).scrollTop(),
                    ind, pos, level;

                var docWidth = $(document).width();
                var scrollDict = {};

                if (scrollTop < 300 && docWidth > 1200) {
                    $("#level1 img").css('margin-top', -100 * scrollTop/300);
                }

                if (scrollTop > 200) {
                    $('.navbar').addClass('scrolled');
                } else {
                    $('.navbar').removeClass('scrolled');
                }

                if (docWidth > 1200) {
                    scrollDict = {
                        top: {
                            upper: 775,
                            third: 600,
                            second: 400
                        },
                        middle: {
                            upper: 1400,
                            lower: 775,
                            third: 1200,
                            second: 1000
                        },
                        bottom: {
                            upper: 2400,
                            lower: 1800,
                            third: 2200,
                            second: 2000
                        }
                    }
                } else /*if (docWidth < 500) */{
                    scrollDict = {
                        top: {
                            upper: 775,
                            third: 600,
                            second: 400
                        },
                        middle: {
                            upper: 2000,
                            lower: 1000,
                            third: 1750,
                            second: 1550
                        },
                        bottom: {
                            upper: 3100,
                            lower: 2000,
                            third: 3000,
                            second: 2750
                        }
                    }
                }
                

                if (scrollTop < scrollDict.top.upper) {
                    level = 3;
                    if (scrollTop > scrollDict.top.third) {
                        pos = 4;
                    } else if (scrollTop > scrollDict.top.second) {
                        pos = 2;
                    } else {
                        pos = 0;
                    }
                }

                if (scrollTop >= scrollDict.middle.lower && scrollTop < scrollDict.middle.upper) {
                    level = 4;
                    if (scrollTop > scrollDict.middle.third) {
                        pos = 4;
                    } else if (scrollTop > scrollDict.middle.second) {
                        pos = 2;
                    } else {
                        pos = 0;
                    }
                }

                if (scrollTop > scrollDict.bottom.lower && scrollTop < scrollDict.bottom.upper) {
                    level = 6;
                    if (scrollTop > scrollDict.bottom.third) {
                        pos = 4;
                    } else if (scrollTop > scrollDict.bottom.second) {
                        pos = 2;
                    } else {
                        pos = 0;
                    }
                }

                if (!!level && (self.level != level || self.pos != pos)) {
                    self.transitionPicture(level, pos, a);
                    self.level = level;
                    self.pos = pos;
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
        },

        transitionPicture: function(levelNum, pos, t) {
            $("#level"+levelNum+" img.selected").removeClass("selected");
            $("#level"+levelNum+" img:eq("+pos+")").addClass("selected");
        }

    })

})();