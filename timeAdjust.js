(function () {
    /**
     * @author <a href="mailto:doctor.hogart@gmail.com">Konstantin Kitmanov</a>
     * May be freely distributed under the MIT license.
     */

    'use strict';


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
    function getTimeLap (amount, unit) {
        return amount * timeMultipliers[unit]
    };


    /**
     * @namespace
     * @param {Object} settings adjuster settings
     * @param {Number} [settings.serverTZ=0] server's timezone in minutes. Defaults to UTC (+00:00)
     * @param {Number} [settings.regionTZ=0] current region's timezone in minutes. Defaults to UTC.
     * @param {Number} [settings.tolerance=60000] time difference between server and local which can be treated as net lag (in milliseconds)
     */
    function TimeAdjuster (settings) {
        var options = settings || {};
        this.settings = {
            serverTZ: 'serverTZ' in options ? options.serverTZ : this.defaults.serverTZ,
            regionTZ: 'regionTZ' in options ? options.regionTZ : this.defaults.regionTZ,
            tolerance: 'tolerance' in options ? options.tolerance : this.defaults.tolerance
        };

        this.adjustment = 0;
    }

    TimeAdjuster.prototype = {
        defaults: {
            serverTZ: 0,
            regionTZ: 0,
            tolerance: 60000
        },

        /**
         * Get local timezone
         * @return {Number}
         */
        localTZ: function () {
            return new Date(TimeAdjuster.now()).getTimezoneOffset();
        },

        /**
         * Get local time
         * @return {*}
         */
        localNow: function () {
            return TimeAdjuster.now()
        },

        /**
         * What time in UTC is it now according to local time?
         * @return {Number}
         */
        localUTC: function () {
            return this.localNow() - TimeAdjuster.getTimeLap(this.localTZ(), 'min');
        },

        /**
         * Gets or sets timezone of server
         * @param {Number} [tz]
         * @return {Number|undefined} minutes
         */
        serverTZ: function (tz) {
            if (arguments.length) {
                this.settings.serverTZ = tz
            }
            else {
                return this.settings.serverTZ;
            }
        },

        /**
         * What time is it now on server?
         * @return {Number}
         */
        serverNow: function () {
            return this.localNow() - this.adjustment;
        },

        /**
         * Returns current time on server or converts given time
         * @param [dt=Date.now()]
         * @return {Date}
         */
        serverDate: function (dt) {
            var dtDraft;
            if (arguments.length) {
                dtDraft = new Date(dt).getTime() + TimeAdjuster.getTimeLap(this.localTZ(), 'min');
            }
            else {
                dtDraft = this.serverNow();
            }

            return new Date(dtDraft);
        },

        /**
         * Gets or sets timezone of region
         * @param tz
         * @return {Number|undefined} minutes
         */
        regionTZ: function (tz) {
            if (arguments.length) {
                this.settings.regionTZ = tz
            }
            else {
                return this.settings.regionTZ
            }
        },

        /**
         * What time is it now in region?
         * @return {Number}
         */
        regionNow: function () {
            return this.serverNow() - TimeAdjuster.getTimeLap(this.regionTZ(), 'min')
        },

        /**
         * Returns current time in region or converts given time
         * @param [dt=Date.now()]
         * @return {Date}
         */
        regionDate: function (dt) {
            var dtDraft;
            if (arguments.length) {
                dtDraft = new Date(dt).getTime() + TimeAdjuster.getTimeLap(this.localTZ(), 'min') - TimeAdjuster.getTimeLap(this.regionTZ(), 'min');
            }
            else {
                dtDraft = this.regionNow()
            }

            return new Date(dtDraft);
        },


//        starDate: function (dt) {
//            return 'Live long and prosper!';
//        },


        /**
         * Calculates adjustment for further
         * @param {Number} timestamp server's timestamp. Must be JS timestamp (in msecs, not nanosecs or secs).
         */
        setAdjustment: function(timestamp) {
            this.adjustment = this.localUTC() - timestamp; // difference between local UTC and server UTC

            var tz = -TimeAdjuster.getTimeLap(this.localTZ(), 'min');
            if (Math.abs(this.adjustment - tz) < this.settings.tolerance) { // the difference is so small so it's rather net lag than wrong clock
                this.adjustment = tz;
            }
        }

    };

    TimeAdjuster.getTimeLap = getTimeLap;

    /**
     * Shiv for Date.now
     */
    TimeAdjuster.now = Date.now || function() {
        return (new Date()).getTime()
    };


    // conflict management — save link to previous content of TimeAdjuster, whatever it was.
    var root = this,
        prevName = root.TimeAdjuster;

    /**
     * Cleans global namespace, restoring previous value of window.TimeAdjuster, and returns TimeAdjuster itself.
     * @return {TimeAdjuster}
     */
    TimeAdjuster.noConflict = function () {
        root.TimeAdjuster = prevName;
        return this;
    };

    // Expose our precious function to outer world.
    if (typeof define === 'function' && define.amd) { // requirejs/amd env
        define(
            'TimeAdjuster',
            [],
            function () {
                return TimeAdjuster;
            }
        );
    } else { // plain browser environment
        root.TimeAdjuster = TimeAdjuster;
    }

}).call(this);