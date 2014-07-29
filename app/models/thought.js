var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var thoughtSchema = Schema({
    title:          String,
    description:    String,
    expression:     String,
    privacy:        String,
    user_id:        String,
    annotation:     String,
    date:           Date,
    archived:       Boolean,
    link:           String,
    replies:        [{
        type: Schema.Types.ObjectId,
        ref: 'Reply' }]
});

thoughtSchema.statics.random = function(user,cb) {
    this.count(function(err, count) {
        if (err) return cb(err);
        var rand = Math.floor(Math.random() * 10);
        this.findOne().sort("-date").skip(rand)
            .where('description').ne("")
            .exec(cb);
    }.bind(this));
};

mongoose.model('Thought', thoughtSchema);