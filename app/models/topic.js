var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var topicSchema = Schema({
    name: String,
    date: Date
});

mongoose.model('Topic', topicSchema);