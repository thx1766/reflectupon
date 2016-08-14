var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , bcrypt   = require('bcryptjs');

// User Schema
var userSchema = mongoose.Schema({
    username:   { type: String, unique: true }
  , email:      { type: String, unique: true }
  , password:   { type: String, select: false }
  , facebookId: { type: Number}
  , created_at: { type: Date }
  , updated_at: { type: Date }
  , communities: [{
      type: Schema.Types.ObjectId, ref: 'Community'
    }]
  , status:      String
  , user_challenges: [{
      date: Date
    , status: String
    , challenge: {
        type: Schema.Types.ObjectId, ref: 'Challenge'
      }
    }]
  , intention:   String
});

// Bcrypt middleware
userSchema.pre('save', function(next) {
    var date = new Date;
    this.updated_at = date;
    if (!this.created_at) {
        this.created_at = date;
    }

    var user = this;

    if(!user.isModified('password')) return next();

    bcrypt.genSalt(10, function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});

// Password verification
userSchema.methods = {

    comparePassword: function(candidatePassword, cb) {
        bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
            if(err) return cb(err);
            cb(null, isMatch);
        })
    }

};

mongoose.model('User', userSchema);
