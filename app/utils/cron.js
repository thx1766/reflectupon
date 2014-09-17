var CronJob = require('cron');

exports.runCron = function(action_to_run) {

  var job = new CronJob({
    cronTime: '00 30 11 * * 1', 
    onTick: function() { },
    start: false,
    timeZone: "America/Los_Angeles"
  })

}