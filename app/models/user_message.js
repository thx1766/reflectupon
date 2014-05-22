var mongoose = require('mongoose')
    , Schema   = mongoose.Schema;

var userMessageSchema = Schema({
    message_id:     String
  , user_id:        String
  , dismissed:      { type: Number, default: 0 }
  , created_at:     Date 
  , updated_at:     Date
});

userMessageSchema.pre('save', function(next){
  var newDate = new Date;
  this.updated_at = newDate;
  if (!this.created_at) {
    this.created_at = newDate;
  } 
  next();
});

mongoose.model('UserMessage', userMessageSchema);