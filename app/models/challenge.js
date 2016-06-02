var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var challengeSchema = Schema({
    title:          String,
    description:    String,
    instructions:   String,
    date:           Date
}, {
  timestamps: true
});

mongoose.model('Challenge', challengeSchema);