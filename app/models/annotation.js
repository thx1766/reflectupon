var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var annotationSchema = Schema({
    _reply_id:      { type: String, ref: 'Reply' },
    description:    String,
    start:          Number,
    end:            Number,
    thought_id:     String,
    user_id:        String,
    date:           Date
});

mongoose.model('Annotation', annotationSchema);