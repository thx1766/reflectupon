var mongoose   = require('mongoose')
  , _          = require('underscore')
  , async      = require('async')
  , User       = mongoose.model('User')
  , Annotation = mongoose.model('Annotation')
  , helpers    = require('../../helpers')
  , moment_tz  = require('moment-timezone')

exports.get = function(req, res) {

    var num_days = 30;
    var options = {
      date:    helpers.getDateRange(30),
      user_id: req.user._id
    };

    populate = {
        path: 'replies'
    };

    helpers.getThoughtsWithAnnotation(options, function(thoughts) {
        Annotation
            .find(options)
            .populate(populate)
            .populate({path: 'thoughts'})
            .sort({date:-1})
            .exec(function(err, annotations) {
                var frequency = [];

                for (var i = 0; i < num_days; i++) {

                    var endDate   = getDate(i, 1);
                    var startDate = getDate(i);
                    var filtered_thoughts = getItemsByDate(thoughts, startDate, endDate);
                    frequency[i] = {
                        day:      startDate,
                        thoughts: filtered_thoughts,
                        activity: getItemsByDate(annotations, startDate, endDate),
                        tags:     getTagsFromAllThoughts(filtered_thoughts)
                    };

                }

                res.send(frequency);
            });  
    })

};

var getDate = function(num_day, end_day) {

    if (typeof end_day == "undefined") {
        end_day = 0;
    }

    var date = new Date();
    date.setDate(date.getDate()-(num_day - end_day));
    return getDateByTimeZone(date);
};

var getItemsByDate = function(thoughts, startDate, endDate) {
    return _.filter(thoughts, function(thought) {
        return getDateByTimeZone(thought.date) == startDate;
    });
};

var getTagsFromAllThoughts = function(thoughts) {
    var tag_ids = _.map(thoughts, function(thought) {
        return thought.tag_ids;
    })
    return _.uniq(_.flatten(tag_ids));
};

var getDateByTimeZone = function(date) {
    return moment_tz(date).tz('America/Los_Angeles').format("YYYY-MM-DD")
}