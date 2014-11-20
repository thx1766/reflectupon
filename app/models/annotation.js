var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var annotationSchema = Schema({
    _reply_id:      { type: String, ref: 'Reply' },
    description:    String,
    start:          Number,
    end:            Number,
    thought_id:     String,
    user_id:        String,
    date:           Date,
    replies:        [{
        type: Schema.Types.ObjectId,
        ref: 'Reply' }],
    thoughts:       [{
        type: Schema.Types.ObjectId,
        ref: 'Thought' }]
});

mongoose.model('Annotation', annotationSchema);