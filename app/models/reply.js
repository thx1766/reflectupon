var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var replySchema = Schema({
    title:          String,
    description:    String,
    privacy:        String,
    user_id:        String,
    thought_id:     String,
    annotations:    [{ type: Schema.Types.ObjectId, ref: 'Annotation'}],
    date:           Date,
    thanked:        Boolean
});

mongoose.model('Reply', replySchema)