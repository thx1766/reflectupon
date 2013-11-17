var Thought = Backbone.Model.extend({
    defaults: {
        "title":       "Untitled",
        "description": "test",
        "privacy": "PRIVATE"
    },
    urlRoot: "/api/thought"
});

var Reply = Backbone.Model.extend({
    defaults: {
        "title":       "Untitled"
    }
});

var Annotation = Backbone.Model.extend({

});

var Thoughts = Backbone.Collection.extend({
    model: Thought,
    url: function() {
        return '/api/thought/'+ this.type +'/';
    }
});

var Replies = Backbone.Collection.extend({
    model: Reply,
    url: function() {
        return '/api/thought/'+ this.thoughtId +'/reply/';
    }
});

var Annotations = Backbone.Collection.extend({
    model: Annotation,
    url: function() {
        return '/api/thought/'+ this.thoughtId +'/reply/'+ this.replyId + '/annotation/';
    }
});

var singleThought = new Thoughts(),
    singleReplies = new Replies(),
    singleAnnotations = new Annotations();

$(document).ready(function() {

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };
/*
    var Router = Backbone.Router.extend({

        routes: {
            "thought/:id": "getRoute"
        },

        getRoute: function( id ) {

            switch (id){

                case "lifeline":
                    $("div.thoughts-list").removeClass("hidden");
                    break;
                case "stream":
                    $("div.thoughts-list").addClass("hidden");
                    break;

            }

        }

    });*/

    Backbone.pubsub = _.extend({}, Backbone.Events);

    var IndexView = Backbone.View.extend({

        el: ".left-side",

        events: {
            'click .or-register': 'showRegister',
            'click .or-login': 'showLogin'
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
        }

    })

    var ThoughtView = Backbone.View.extend({

        el: ".thoughts-list",

        template: _.template($("#thought-template").html()),

        initialize: function() {

            _.bindAll(this, 'detectScroll');

            this.$main = this.$('#main');

            this.thoughts = new Thoughts();
            this.thoughts.type = "my-posts";
            this.thoughts.fetch({ reset: true });
            this.thoughts.on('reset', this.render, this );
            Backbone.pubsub.on('addThought', this.displayItem, this);

            $(window).scroll(this.detectScroll);
            $('.glyphicon-info-sign').tooltip()

        },

        render: function() {

            _.each( this.thoughts.models, this.displayItem, this);
            return this;
        },

        displayItem: function(thought) {

            var formatThought = new ThoughtItemView({ model: thought, view: 'thought' });
            formatThought.render();

            this.$main.prepend( formatThought.el );

            var position = formatThought.$el.position();
            //console.log(position);
            //console.log('min: ' + position.top + ' / max: ' + parseInt(position.top + $(this).height()));
            formatThought.$el.scrollspy({
                min: position.top -30,
                max: position.top + formatThought.$el.height() -30,
                onEnter: function(element, position) {
                    if(console) console.log('entering ' +  element.id);
                    var replies = new Replies();
                    replies.thoughtId = formatThought.model.get("_id");
                    replies.fetch({ reset: true });

                    replies.on("reset", function() {

                        var test = "";

                        _.each( replies.models, function(reply) {
                            test += reply.get("description") + "<br />";
                        },this);

                        $(".annotations-list").html(test);

                    });

                    formatThought = null;
                },
                onLeave: function(element, position) {
                    if(console) console.log('leaving ' +  element.id);
                }
            });


        },

        detectScroll: function() {

            //$(window).scrollTop();
            //var rect = document.getElementById("main").getBoundingClientRect();
            //console.log(rect.top, rect.right, rect.bottom, rect.left);



        }

    });

    var SidebarView = Backbone.View.extend({

        el: "#sidebar",

        events: {
            'click .show-postbox': 'showPostbox'
        },

        showPostbox: function() {

            $.colorbox({inline:true, href:"#postbox"});

        }

    });

    var StreamThoughtView = Backbone.View.extend({

        el: ".stream-list",

        events: {
        },

        initialize: function() {

            this.$main = this.$('#main');

            this.thoughts = new Thoughts();
            this.thoughts.type = "stream";
            this.thoughts.fetch({ reset: true });
            this.thoughts.on('reset', this.render, this );

        },

        render: function() {

            _.each( this.thoughts.models, this.displayItem, this);
            return this;
        },

        displayItem: function(thought) {

            var formatThought = new ThoughtItemView({ model: thought, view: 'stream' });
            formatThought.render();

            this.$main.append( formatThought.el );
            return this;

        }

    });

    var ThoughtItemView = Backbone.View.extend({

        tagName:   "div",
        className: "thought-row",

        initialize: function() {
            this.model.on("change", this.modelChanged, this);
        },

        render: function() {

            var formatThought = this.model.toJSON();

            if (formatThought.privacy == "PRIVATE") {
                formatThought.privacy = "Private";
            } else if (formatThought.privacy == "ANONYMOUS") {
                formatThought.privacy = "Anonymous";
            }

            formatThought.description = formatThought.description.replace(/\n/g,"<br>");

            var template = _.template($("#"+ this.options.view +"-template").html());
            var outputHtml = template(formatThought);
            this.$el.html(outputHtml);
        },

        modelChanged: function(model, changes) {
            this.render();
        }

    });

    var ReplyItemView = Backbone.View.extend({

        template:  _.template($("#reply-template").html()),

        tagName:   "div",
        className: "reply-row",

        render: function() {

            this.$el.html( this.template(this.model.toJSON()));
            return this;

        }

    });

    var PostboxView = Backbone.View.extend({
        el: "#postbox",

        events: {

            'click .postbox-send': 'goStep2',
            'click .postbox-write': 'poemPrompt',
            'click .postbox-sing': 'songPrompt',
            'click .postbox-submit': 'submitReflection'

        },

        initialize: function() {

            this.title          = this.$('.postbox-title');
            this.description    = this.$('.postbox-description');
            this.privacy        = this.$('.postbox-privacy');

        },

        template: _.template($("#thought-template").html()),

        goStep2: function() {

            $(".postbox-two").fadeOut(function(){
                $(".postbox-options").fadeIn();
            })

        },

        poemPrompt: function() {
            $(".postbox-options").fadeOut(function() {
                $(".postbox-poem").fadeIn();
            });

        },

        songPrompt: function() {
            $(".postbox-options").fadeOut(function() {
                $(".postbox-song").fadeIn();
            });
        },

        submitReflection: function() {
            $.colorbox.close();

            this.thoughts = new Thoughts();

            this.thoughts.on('add', function() {
                Backbone.pubsub.trigger('addThought',this.models[0]);
            });

            this.thoughts.create({

                title:          this.title.val(),
                description:    this.description.val(),
                privacy:        this.privacy.val()

            });
        }
    });

    var highlightSet = [];

    var SingleThoughtView = Backbone.View.extend({

        el: "#single-thought",

        events: {

            'click .submit-reply': 'submitReply',
            'mouseup #main-thought': 'createAnnotation'

        },

        template: _.template($("#single-template").html()),

        initialize: function() {
            this.thoughtId = this.$el.attr("thought-id");

            _.bindAll(this, "render");

            //this.thoughts.type = this.thoughtId;
            //this.thoughts.fetch({reset:true});
            singleThought.on('reset', function() {
                this.render();
            }, this);

            this.input  = this.$("textarea");
            this.submit = this.$("a.submit-reply");

            singleReplies.on('reset', function() {
                this.showReplies();
            },this);

            singleAnnotations.on('reset', function() {
                this.showAnnotations();
            },this);

            this.annotations = [];

        },

        render: function() {

            var formatThought = singleThought.models[0];

            if (formatThought.get("privacy") == "PRIVATE") {
                formatThought.set("privacy", "Private");
            } else if (formatThought.get("privacy") == "ANONYMOUS") {
                formatThought.set("privacy", "Anonymous");
            }

            formatThought.set("description", formatThought.get("description").replace(/\n/g,"<br>"));

            var outputHtml = this.template( formatThought.attributes );
            $("#main-thought").html(outputHtml);


            return this;
        },

        showReplies: function() {
            _.each( singleReplies.models, this.displayReply, this);
        },

        showAnnotations: function() {
            _.each( singleAnnotations.models, this.displayAnnotation, this);

            var description = $("#main-thought").find(".description");

            for (var y=0; y<highlightSet.length; y++) {

                description.highlight( description.text().substring(highlightSet[y].start, highlightSet[y].end));

            }

        },

        displayReply: function(reply) {
            var formatReply = new ReplyItemView({ model:reply});
            formatReply.render();

            $(".reply-area").prepend( formatReply.el );
        },

        displayAnnotation: function(annotation) {

            var start = annotation.get("start"),
                end = annotation.get("end")

            var overlap = false;

            if (start && end) {
                for (var x=0; x<highlightSet.length; x++) {

                    if (start < highlightSet[x].start && end > highlightSet[x].end) {
                        highlightSet[x].start = start;
                        highlightSet[x].end = end;
                        overlap = true;
                        break;
                    }

                    if (start > highlightSet[x].start && end < highlightSet[x].end) {
                        overlap = true;
                        break;
                    }

                    if (end > highlightSet[x].start && start < highlightSet[x].start) {
                        highlightSet[x].start = start;
                        overlap = true;
                        break;
                    }

                    if (start < highlightSet[x].end && end > highlightSet[x].end) {
                        highlightSet[x].end = end;
                        overlap = true;
                        break;
                    }

                }

                if (!overlap) {
                    highlightSet.push({start: start, end: end});
                }
            }

        },

        submitReply: function(e) {

            e.preventDefault();

            this.replies = new Replies();

            this.replies.on('add', function(reply) {
                console.log("submitted!")

                var formatReply = new ReplyItemView({ model: reply });
                formatReply.render();

                $(".reply-area").prepend( formatReply.el );

            });

            this.replies.create({

                title:          "test",
                description:    this.input.val(),
                thought_id:     this.thoughtId,
                annotations:    this.annotations

            });

        },

        createAnnotation: function(){
            var selection;

            if (window.getSelection) {
                selection = window.getSelection();
            } else if (document.selection) {
                selection = document.selection.createRange();
            }

            var selectionText = selection.toString()
            selectionText !== '' && $('#main-thought').highlight(selectionText);

            var paragraph = $("#main-thought").find(".description").text();
            var start = paragraph.indexOf(selectionText);
            var end = start + selectionText.length;

            this.annotations.push({
                description: selectionText,
                start:       start,
                end:         end
            });
            console.log(this.annotations);
        }

    });

    var postboxView = new PostboxView();
    new SidebarView();
    var streamThoughtView = new StreamThoughtView();
    var thoughtView = new ThoughtView();
    var singleThoughtView = new SingleThoughtView();
    var indexView = new IndexView();
    //var router = new Router();
    //Backbone.history.start();

});
