var mongoose = require('mongoose')
    , Schema   = mongoose.Schema;

var userMessageSchema = Schema({
    message_id:     String,
    user_id:        String,
    dismissed:      Boolean,
    date:           Date
});

mongoose.model('UserMessage', userMessageSchema);