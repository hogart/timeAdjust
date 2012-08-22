(function() {
    // shiv for Date.now
    var now = Date.now || function() {
        return (new Date()).getTime()
    };

    // helper for transforming various units to msecs
    var timeMultipliers = {
        'ms': 1,
        'sec': 1000,
        'min': 60 * 1000,
        'hour': 60 * 60 * 1000
    };

    /**
     * Returns given time lap in milliseconds
     * @param {Number} amount
     * @param {String} unit either 'ms', 'sec', 'min', 'hour'
     */
    function getTimelap(amount, unit) {
        return amount * timeMultipliers[unit]
    };

    var adjustment = 0; // this is the difference between server UTC and local UTC

    // various times
    // each time instance has now and tz functions

    // represents local time and tz — according to OS settings
    var localTime = {
        tz: function() {
            return new Date(now()).getTimezoneOffset()
        },
        now: now
    };
    localTime.utc = function() {
        return localTime.now() - getTimelap(localTime.tz(), 'min')
    };
    localTime.date = function(dt) {
        return new Date(dt || localTime.now())
    };

    // represents server time
    var serverTime = {
        tz: function() { return 0 }, //server thinks it located in Greenwich, UK
        now: function() { return localTime.now() - adjustment }
    };
    serverTime.date = function(dt) {
        var dtDraft;
        if (arguments.length) {
            dtDraft = new Date(dt).getTime() + getTimelap(localTime.tz(), 'min');
        }
        else {
            dtDraft = serverTime.now()
        }

        return new Date(dtDraft);
    };

    // time in given region
    var regionTZ = serverTime.tz();
    var regionTime = {
        tz: function(tz) {
            if (arguments.length) {
                regionTZ = tz
            }
            else {
                return regionTZ
            }
        }
    };
    regionTime.now = function() { return serverTime.now() - getTimelap(regionTime.tz(), 'min')  };
    regionTime.date = function(dt) {
        var dtDraft;
        if (arguments.length) {
            dtDraft = new Date(dt).getTime() + getTimelap(localTime.tz(), 'min') - getTimelap(regionTime.tz(), 'min');
        }
        else {
            dtDraft = regionTime.now()
        }

        return new Date(dtDraft);
    };

    function calculateAdjustment(timestamp) {
        adjustment = localTime.utc() - getTimelap(timestamp, 'sec'); // difference between local UTC and server UTC

        var tz = -getTimelap(localTime.tz(), 'min');
        if (Math.abs(adjustment - tz) < getTimelap(1, 'min')) { // the difference is so small so it's rather net lag than wrong clock
            adjustment = tz;
        }

        console.log('adjustment: ' + adjustment/1000/60);
    }

    return {
        now: now,
        getTimeLap: getTimelap,

        localTime: localTime,
        serverTime: serverTime,
        regionTime: regionTime,

        calculateAdjustment: calculateAdjustment
    }
})();