var util     = require('util');

exports.single = function(req, res) {

    exports.Thought.find({ _id: req.params.id }, function(err, thoughts) {

        exports.Reply.find({ thought_id: req.params.id }, function(err, replies) {

            exports.Annotations.find({ thought_id: req.params.id}, function(err, annotations) {

                exports.Thought
                    .where('user_id').ne(req.user._id)
                    .where('description').ne("")
                    .sort('-date')
                    .limit(5)
                    .exec( function(err, thoughts1) {

                    if (thoughts.length == 1) {

                        for (var x = 0; x < thoughts1.length; x++) {
                            if (thoughts1[x] && thoughts1[x].description) {
                                thoughts1[x].description = thoughts1[x].description.substr(0,40) + "...";
                            }
                        }

                        res.render('single', {
                            id: req.params.id,
                            user: req.user,
                            topBar: true,

                            thought: thoughts[0],
                            replies: replies,
                            annotations: annotations,
                            thoughts: thoughts1
                        });

                    } else {
                        res.send(thoughts);
                    }
                })

            })

        });

    });
};

exports.today = function(req, res) {

    exports.Thought.random(req.user._id,function(err, thought) {

        console.log("thought: " + thought);

        exports.Reply.find({ thought_id: thought._id }, function(err, replies) {

            exports.Annotations.find({ thought_id: thought._id}, function(err, annotations) {

                exports.Thought
                    .where('user_id').ne(req.user._id)
                    .where('description').ne("")
                    .sort('-date')
                    .limit(5)
                    .exec( function(err, thoughts1) {

                        for (var x = 0; x < thoughts1.length; x++) {
                            if (thoughts1[x] && thoughts1[x].description) {
                                thoughts1[x].description = thoughts1[x].description.substr(0,40) + "...";
                            }
                        }

                    res.render('today', {
                        id: thought._id,
                        user: req.user,
                        topBar: true,

                        thought: thought,
                        replies: replies,
                        annotations: annotations,
                        thoughts: thoughts1
                    });
                })

            })

        });

    });
};

exports.getTwiml = function(req, res) {

    exports.Thought.random(null,function(err, thought) {

        res.render('twiml', {reflection: thought.description} );

    })
};