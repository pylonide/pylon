/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

/**
 * @term dateformat Format a date based on small strings of characters representing
 * a variable.
 * Syntax:
 * <code>
 * d      day of the month as digits, no leading zero for single-digit days
 * dd     day of the month as digits, leading zero for single-digit days
 * ddd    day of the week as a three-letter abbreviation
 * dddd   day of the week as its full name
 * m      month as digits, no leading zero for single-digit months
 * mm     month as digits, leading zero for single-digit months
 * mmm    month as a three-letter abbreviation
 * mmmm   month as its full name
 * yy     year as last two digits, leading zero for years less than 2010
 * yyyy   year represented by four digits
 * h      hours, no leading zero for single-digit hours (12-hour clock)
 * hh     hours, leading zero for single-digit hours (12-hour clock)
 * H      hours, no leading zero for single-digit hours (24-hour clock)
 * HH     hours, leading zero for single-digit hours (24-hour clock)
 * M      minutes, no leading zero for single-digit minutes
 * MM     minutes, leading zero for single-digit minutes
 * s      seconds, no leading zero for single-digit seconds
 * ss     seconds, leading zero for single-digit seconds
 * </code>
 */

// #ifdef __WITH_DATE
// Some common format strings
/**
 * @private
 */
jpf.date = {
    masks : {
        "default":      "ddd mmm dd yyyy HH:MM:ss",
        shortDate:      "m/d/yy",
        mediumDate:     "mmm d, yyyy",
        longDate:       "mmmm d, yyyy",
        fullDate:       "dddd, mmmm d, yyyy",
        shortTime:      "h:MM TT",
        mediumTime:     "h:MM:ss TT",
        longTime:       "h:MM:ss TT Z",
        isoDate:        "yyyy-mm-dd",
        isoTime:        "HH:MM:ss",
        isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    },

    // Internationalization strings
    i18n : {
        dayNames : [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday"
        ],

        dayNumbers : {
            "Sun" : 0, "Mon" : 1, "Tue" : 2, "Wed" : 3, "Thu" : 4, "Fri" : 5,
            "Sat" : 6, "Sunday" : 0, "Monday" : 1, "Tuesday" : 2,
            "Wednesday" : 3, "Thursday" : 4, "Friday" : 5, "Saturday" : 6
        },
        monthNames : [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],
        monthNumbers : {
            "Jan" : 0, "Feb" : 1, "Mar" : 2, "Apr" : 3, "May" : 4, "Jun" : 5,
            "Jul" : 6, "Aug" : 7, "Sep" : 8, "Oct" : 9, "Nov" : 10, "Dec" : 11
        }
    }
};

jpf.date.dateFormat = (function () {
    var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = jpf.date;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && (typeof date == "string"
            || date instanceof String) && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date();

        if (isNaN(date)) throw new SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var	_ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d   : d,
                dd  : pad(d),
                ddd : dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m   : m + 1,
                mm  : pad(m + 1),
                mmm : dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy  : String(y).slice(2),
                yyyy: y,
                h   : H % 12 || 12,
                hh  : pad(H % 12 || 12),
                H   : H,
                HH  : pad(H),
                M   : M,
                MM  : pad(M),
                s   : s,
                ss  : pad(s),
                l   : pad(L, 3),
                L   : pad(L > 99 ? Math.round(L / 10) : L),
                t   : H < 12 ? "a"  : "p",
                tt  : H < 12 ? "am" : "pm",
                T   : H < 12 ? "A"  : "P",
                TT  : H < 12 ? "AM" : "PM",
                Z   : utc
                          ? "UTC"
                          : (String(date).match(timezone) 
                              || [""]).pop().replace(timezoneClip, ""),
                o   : (o > 0 ? "-" : "+") 
                         + pad(Math.floor(Math.abs(o) / 60) * 100
                         + Math.abs(o) % 60, 4),
                S   : ["th", "st", "nd", "rd"]
                      [d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
})();


/**
 * Create a object representation of date from datetime string parsing it with
 * datetime format string
 * 
 * @param {String}   datetime   the date and time wrote in allowed format
 * @param {String}   format     style of displaying date, created using various
 *                              masks
 *     Possible masks:
 *     d      day of the month as digits, no leading zero for single-digit days
 *     dd     day of the month as digits, leading zero for single-digit days
 *     ddd    day of the week as a three-letter abbreviation
 *     dddd   day of the week as its full name
 *     m      month as digits, no leading zero for single-digit months
 *     mm     month as digits, leading zero for single-digit months
 *     mmm    month as a three-letter abbreviation
 *     mmmm   month as its full name
 *     yy     year as last two digits, leading zero for years less than 2010
 *     yyyy   year represented by four digits
 *     h      hours, no leading zero for single-digit hours (12-hour clock)
 *     hh     hours, leading zero for single-digit hours (12-hour clock)
 *     H      hours, no leading zero for single-digit hours (24-hour clock)
 *     HH     hours, leading zero for single-digit hours (24-hour clock)
 *     M      minutes, no leading zero for single-digit minutes
 *     MM     minutes, leading zero for single-digit minutes
 *     s      seconds, no leading zero for single-digit seconds
 *     ss     seconds, leading zero for single-digit seconds
 */
jpf.date.getDateTime = function(datetime, format) {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g;
    var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC:)(?:[-+]\d{4})?)\b/g;
    var alteration = 0;
    var time, y = new Date().getFullYear(), m = 1, d = 1,
        h = 12, M = 0, s = 0;
    var i18n = jpf.date.i18n;

    if (!format) {
        throw new Error(jpf.formatErrorString(0, null,
            "date-format", "Date format is null"));
    }

    format = format.replace(timezone, "");

    var str = format.replace(token, function(str, offset, p) {
        var part = datetime.substring(p + alteration, p + alteration + str.length);

        switch (str) {
            case 'd':
            case 'm':
            case 'h':
            case 'H':
            case 'M':
            case 's':
                if (!/[\/, :\-](d|m|h|H|M|s)$|^(d|m|h|H|M|s)[\/, :\-]|[\/, :\-](d|m|h|H|M|s)[\/, :\-]/.test(format)) {
                    throw new Error(jpf.formatErrorString(0, null,
                        "date-format", "Dates without leading zero needs separators"));
                }

                var value = parseInt(datetime.substring(p + alteration,
                    p + alteration + 2));

                if (value.toString().length == 2)
                    alteration++;
    
                return str == 'd'
                    ? d = value
                    : (str == 'm'
                        ? m = value
                        : (str == 'M'
                            ? M = value
                            : (str == 's'
                                ? s = value
                                : h = value))); 
            case 'dd':
                return d = part; //01-31
            case 'dddd':
                //changeing alteration because "dddd" have no information about day number
                alteration += i18n.dayNames[i18n.dayNumbers[part.substring(0,3)] + 7].length - 4;
                break;
            case 'mm':
                return m = part; //01 - 11
            case 'mmm':
                return m = i18n.monthNumbers[part] + 1;
            case 'mmmm':
                var monthNumber = i18n.monthNumbers[part.substring(0, 3)];
                alteration += i18n.monthNames[monthNumber + 12].length - 4;
                return m = monthNumber + 1;
            case 'yy':
                return y = parseInt(part) < 70 ? "20" + part : part;
            case 'yyyy':
                return y = part;
            case 'hh':
                return h = part;
            case 'HH':
                return h = part;
            case 'MM':
                return M = part;
            case 'ss':
                return s = part;
            case "'T'":
            case "'Z'":
                //because in date we have only T
                alteration -= 2;
                break;
         }
    });
jpf.console.info("date: "+y +" "+m+" "+d);
    return new Date(y, m-1, d, h, M, s);
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return jpf.date.dateFormat(this, mask, utc);
};

Date.parse = function (datetime, format) {
    return jpf.date.getDateTime(datetime, format);
};
// #endif
