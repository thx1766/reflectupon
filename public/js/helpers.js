window.rupon = window.rupon || {};
window.rupon.helpers = window.rupon.helpers || {};

(function() {

    var rh = window.rupon.helpers;

    rh.dateForFrequencyItem = function(date) {
      return new Date(date).getFullYear().toString() + "-" + formatMonth(date) + "-" + formatDay(date);
    };

    // Returns String of 01 - 12
    var formatMonth = function(date) {
      var month = (new Date(date).getMonth() + 1).toString();
      return month < 10 ? '0' + month : month;
    }

    var formatDay = function(date) {
      var month = (new Date(date).getDate()).toString();
      return month < 10 ? '0' + month : month;
    }

    rh.convertLineBreaks = function(description, type) {

        if (!description) {
            return description;
        }

        var before_type, after_type;

        if (type == 'n') {
            before_type = '\n';
            after_type = '<br>';
        } else if (type == 'br') {
            before_type = '<br>';
            after_type = '\n';
        }

        while (description.indexOf(before_type) != -1) {
            description = description.replace(before_type, after_type);
        }
        return description;
    }

    rh.extendWithEvents = function(destination, source) {
        _.defaults(destination, source);
        _.defaults(destination.events, source.events);
    }

    Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if( lvalue!=rvalue ) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('unlessFirst', function(lvalue, options) {
        if( lvalue == 0 ) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    });

})();