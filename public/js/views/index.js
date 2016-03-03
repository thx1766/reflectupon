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
            'click button': 'clickButton',
            'click .sign-up-btn': 'clickSignUp'
        },

        initialize: function(options){
            this.message = options.message;
            this.render();

            var self = this;

            console.log(this.$el.find('.rotater').children().length);

            self.rotate(2);

            $(window).scroll(function() {
                var scrollTop = $(document).scrollTop(),
                    ind, pos, level;

                var docWidth = $(document).width();
                var scrollDict = {};

                if (scrollTop > 80) {
                    $('.navbar').addClass('scrolled');
                } else {
                    $('.navbar').removeClass('scrolled');
                }

                if (scrollTop > 200) {
                    $('#level3 .thought-row').addClass('shown');
                }
                if (scrollTop > 300 && !$("#perm1").hasClass('shown')) {
                    $("#perm1").addClass('shown pulse');
                    setTimeout(function() {
                        $("#perm1").removeClass('pulse');
                    }, 500)
                }

                if (scrollTop > 400 && !$("#perm2").hasClass('shown')) {
                    $("#perm2").addClass('shown pulse');
                    setTimeout(function() {
                        $("#perm2").removeClass('pulse');
                    }, 500)
                }

                if (scrollTop > 550 && !$("#perm3").hasClass('shown')) {
                    $("#perm3").addClass('shown pulse');
                    setTimeout(function() {
                        $("#perm3").removeClass('pulse');
                    }, 800)
                }

                if (scrollTop > 450) {
                    $('#reply1').addClass('shown');
                    setTimeout(function() {
                        $('#reply2').addClass('shown');
                        setTimeout(function() {
                            $('#reply3').addClass('shown');
                        }, 150)
                    }, 150)
                }

                if (docWidth > 1200) {
                    scrollDict = {
                        top: {
                            upper: 775,
                            third: 600,
                            second: 400
                        },
                        middle: {
                            upper: 1800,
                            lower: 0,
                            third: 1500,
                            second: 1300
                        },
                        bottom: {
                            upper: 2600,
                            lower: 1800,
                            third: 2400,
                            second: 2200
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
                            upper: 2500,
                            lower: 0,
                            third: 2300,
                            second: 2150
                        },
                        bottom: {
                            upper: 3800,
                            lower: 2500,
                            third: 3500,
                            second: 3350
                        }
                    }
                }
                


                // if (scrollTop < scrollDict.top.upper) {
                //     level = 3;
                //     if (scrollTop > scrollDict.top.third) {
                //         pos = 4;
                //     } else if (scrollTop > scrollDict.top.second) {
                //         pos = 2;
                //     } else {
                //         pos = 0;
                //     }
                // }

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
        },

        clickSignUp: function() {
            new rv.ModalView({view: 'signup'});
        },

        rotate: function(n) {
            var self = this,
                rotater = this.$el.find('.rotater'),
                len = rotater.children().length;

            setTimeout(function() {
                rotater.find('img').removeClass('selected previous next');
                rotater.find('img:eq('+n+')').addClass('next');
                rotater.find('img:eq('+(n-1)+')').addClass('selected');
                rotater.find('img:eq('+(n-2)+')').addClass('previous');
                
                if (n+1 < len) {
                    self.rotate(n+1);
                } else {
                    self.rotate(0);
                }
            }, 2500);
        }

    })

})();