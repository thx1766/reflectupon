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
    tag_ids:        Array,
    replies:        [{
        type: Schema.Types.ObjectId,
        ref: 'Reply' }],
    feature:        Boolean,
    recommended:    [{
        type: Schema.Types.ObjectId,
        ref: 'Thought' }],
    prompt:         [{
        type: Schema.Types.ObjectId,
        ref: 'Prompt' }],
    community:      [{
        type: Schema.Types.ObjectId,
        ref: 'Community' }],
    challenge: {
        type: Schema.Types.ObjectId,
        ref: 'Challenge' },
    flaggedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User' }]
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