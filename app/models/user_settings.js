var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var userSettingsSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: true },
    email_reply: {
        type: Boolean,
        default: true },
    email_thanks: {
        type: Boolean,
        default: true }
});

mongoose.model('UserSettings', userSettingsSchema);