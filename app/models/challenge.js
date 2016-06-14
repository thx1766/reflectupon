var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var challengeSchema = Schema({
    creator:        { type: Schema.Types.ObjectId, ref: 'User'},
    title:          String,
    description:    String,
    instructions:   String,
    date:           Date,
    link:           String,
    relatedChallenges: [{
      type: Schema.Types.ObjectId, ref: 'Challenge'
    }]
}, {
  timestamps: true
});

mongoose.model('Challenge', challengeSchema);