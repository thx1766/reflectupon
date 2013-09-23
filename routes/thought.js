var util     = require('util');

exports.single = function(req, res) {

    exports.Thought.find({ _id: req.params.id }, function(err, thoughts) {

        exports.Reply.find({ thought_id: req.params.id }, function(err, replies) {

            exports.Annotations.find({ thought_id: req.params.id}, function(err, annotations) {

                //console.log("test: " + util.inspect(thoughts, false, null));

                if (thoughts.length == 1) {

                    res.render('single', {
                        id: req.params.id,
                        user: req.user,
                        topBar: true,

                        thought: thoughts[0],
                        replies: replies,
                        annotations: annotations
                    });

                } else {
                    res.send(thoughts);
                }

            })

        });

    });
};