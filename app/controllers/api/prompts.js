var mongoose   = require('mongoose')
  , Thought    = mongoose.model('Prompt')
  , _          = require('underscore');

exports.get = function(req, res) {
    Prompt.find().exec(function(err, prompts) {
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

exports.delete = function(req, res) {
    Prompt.findById(req.params.id, function(err,prompt) {
        prompt.remove(function(err) {
            if (err) console.log(err);
            res.send(prompt);
        })
    });
}