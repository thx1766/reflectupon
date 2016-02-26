var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var promptSchema = Schema({
    description:    String,
    date:           Date,
    eligible:       String
});

mongoose.model('Prompt', promptSchema);