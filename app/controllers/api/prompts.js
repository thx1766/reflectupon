var mongoose   = require('mongoose')
  , Prompt     = mongoose.model('Prompt')
  , _          = require('underscore');

exports.get = function(req, res) {
    exports.getPrompts({}, function(prompts) {
        res.send(prompts);
    });
}

exports.post = function(req, res) {
    var prompt = new Prompt({
        description: req.body.description
    });

    prompt.save(function(err) {
        res.send(prompt);
    });
}

exports.put = function(req, res) {
    Prompt.findById(req.params.id, function (err, prompt) {

        prompt = _.extend(prompt, _.pick(req.body, ['eligible', 'description']));
        prompt.save(function(err) {
            res.send(prompt);
        });

    });
}

exports.delete = function(req, res) {
    Prompt.findById(req.params.id, function(err,prompt) {
        prompt.remove(function(err) {
            if (err) console.log(err);
            res.send(prompt);
        })
    });
}

exports.getPrompts = function(params, callback) {

    Prompt
        .find(params)
        .sort({
            eligible: 1
        })
        .exec(function(err, prompts) {

            if (prompts.length) {
                callback(prompts);
            } else if (_.keys(params).length){

                // Do again with no params
                exports.getPrompts({}, function(prompts) {
                    callback(prompts);
                });
            } else {
                console.log('no prompts');
                callback(false);
            }
        });
}

exports.getPromptsById = function(id, callback) {

    if (id == "") {
        callback(false);
    } else {
        exports.getPrompts({_id: id}, callback);
    }
}