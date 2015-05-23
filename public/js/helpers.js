window.rupon = window.rupon || {};
window.rupon.helpers = window.rupon.helpers || {};

(function() {

    var rh = window.rupon.helpers;

    rh.dateForFrequencyItem = function(date) {
      return new Date(date).getFullYear().toString() + "-" + formatMonth(date) + "-" + new Date(date).getDate().toString();
    };

    // Returns String of 01 - 12
    var formatMonth = function(date) {
      var month = (new Date(date).getMonth() + 1).toString();
      return month < 10 ? '0' + month : month;
    }
})();