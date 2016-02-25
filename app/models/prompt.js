var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var promptSchema = Schema({
    description:    String,
    date:           Date
});

mongoose.model('Prompt', promptSchema);