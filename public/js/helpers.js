window.rupon = window.rupon || {};
window.rupon.helpers = window.rupon.helpers || {};

(function() {

    var rh = window.rupon.helpers;

    rh.dateForFrequencyItem = function(date) {
      return new Date(date).getFullYear().toString() + "-" + (new Date(date).getMonth() + 1).toString() + "-" + new Date(date).getDate().toString();
    }
})();