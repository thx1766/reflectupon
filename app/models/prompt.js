var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var promptSchema = Schema({
    description:    String,
    date:           Date,
    eligible:       String
}, {
  timestamps: true
});

mongoose.model('Prompt', promptSchema);