var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var communitySchema = Schema({
    creator:        { type: Schema.Types.ObjectId, ref: 'User'},
    title:          String,
    description:    String,
    date:           Date,
    members:        [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: {unique: true, dropDups: true}
    }]
});

mongoose.model('Community', communitySchema);