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
apf.date = (function() {

return {
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
        /**
         * Defines what day starts the week
         *
         * Monday (1) is the international standard.
         * Redefine this to 0 if you want weeks to begin on Sunday.
         */
        beginWeekday : 1,
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
    // #ifdef __WITH_DATE_EXT
    ,

    span: function(seconds) {
        if (seconds < 0) return;

        var sec  = parseInt(seconds),
            min  = Math.floor(sec / 60),
            hour = Math.floor(min / 60),
            day  = parseInt(Math.floor(hour / 24));
        this.seconds = sec % 60;
        this.minutes = min % 60;
        this.hours   = hour % 24;
        this.days    = day;
    },

    dateToDays: function(day, month, year) {
        var y = year + "";
        var century = parseInt(y.substr(0, 2));
        year = parseInt(y.substr(2, 2), 10); //do base 10, because of weird JS issue
        if (month > 2) {
            month -= 3;
        }
        else {
            month += 9;
            if (year) {
                year--;
            }
            else {
                year = 99;
                century--;
            }
        }

        return (Math.floor((146097 * century) / 4 ) +
            Math.floor((1461 * year) / 4 ) +
            Math.floor((153 * month + 2) / 5 ) +
            day + 1721119);
    },

    daysToDate: function(days) {
        days       -= 1721119;
        var century = Math.floor((4 * days - 1) / 146097);
        days        = Math.floor(4 * days - 1 - 146097 * century);
        var day     = Math.floor(days / 4);

        var year    = Math.floor((4 * day +  3) / 1461);
        day         = Math.floor(4 * day +  3 - 1461 * year);
        day         = Math.floor((day +  4) / 4);

        var month   = Math.floor((5 * day - 3) / 153);
        day         = Math.floor(5 * day - 3 - 153 * month);
        day         = Math.floor((day +  5) /  5);

        if (month < 10) {
            month += 3;
        }
        else {
            month -= 9;
            if (year++ == 99) {
                year = 0;
                century++;
            }
        }

        return {
            day  : day + "",
            month: month + "",
            year : (century + "").pad(2, "0") + (year + "").pad(2, "0")
        };
    },

    nextDay: function(day, month, year) {
        var now = new Date();
        return this.daysToDate(this.dateToDays(day || now.getDate(), month
            || now.getMonth(), year || now.getFullYear()) + 1);
    },

    prevDay: function(day, month, year) {
        var now = new Date();
        return this.daysToDate(this.dateToDays(day || now.getDate(), month
            || now.getMonth(), year || now.getFullYear()) - 1);
    },

    isLeapYear: function(year) {
        if (typeof year != "number")
            return false;
        if (year < 1582) // pre Gregorio XIII - 1582
            return (year % 4 == 0);
        else // post Gregorio XIII - 1582
            return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
    },

    julianDate: function(day, month, year) {
        var now = new Date();
        if (!month)
            month = now.getMonth();

        var days   = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
            julian = (days[month - 1] + day || now.getDate());
        if (month > 2 && this.isLeapYear(year || now.getFullYear()))
            julian++;
        return julian;
    },

    compare: function(d1, d2) {
        var days1 = this.dateToDays(d1.getUTCDate(), d1.getUTCMonth(), d1.getUTCYear()),
            days2 = this.dateToDays(d2.getUTCDate(), d2.getUTCMonth(), d2.getUTCYear());
        if (days1 < days2)
            return -1;
        if (days1 > days2)
            return 1;
        if (d1.getUTCHour() < d2.getUTCHour())
            return -1;
        if (d1.getUTCHour() > d2.getUTCHour())
            return 1;
        if (d1.getUTCMinutes() < d2.getUTCMinutes())
            return -1;
        if (d1.getUTCMinutes() > d2.getUTCMinutes())
            return 1;
        if (d1.getUTCSeconds() < d2.getUTCSeconds())
            return -1;
        if (d1.getUTCSeconds() > d2.getUTCSeconds())
            return 1;
        return 0;
    },

    gregorianToISO: function(day, month, year) {
        var mnth       = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
            y_isleap   = this.isLeapYear(year),
            y_1_isleap = this.isLeapYear(year - 1),
            day_of_year_number = day + mnth[month - 1];
        if (y_isleap && month > 2)
            day_of_year_number++;
        // find Jan 1 weekday (monday = 1, sunday = 7)
        var yy           = (year - 1) % 100,
            jan1_weekday = 1 + parseInt(((((((year - 1) - yy) / 100) % 4) * 5)
                           + (yy + parseInt(yy / 4))) % 7),
            // weekday for year-month-day
            weekday = 1 + parseInt(((day_of_year_number + (jan1_weekday - 1)) - 1) % 7),
            yearnumber, weeknumber
        // find if Y M D falls in YearNumber Y-1, WeekNumber 52 or
        if (day_of_year_number <= (8 - jan1_weekday) && jan1_weekday > 4){
            yearnumber = year - 1;
            weeknumber = (jan1_weekday == 5 || (jan1_weekday == 6 && y_1_isleap))
                ? 53
                : 52;
        }
        else {
            yearnumber = year;
        }
        // find if Y M D falls in YearNumber Y+1, WeekNumber 1
        if (yearnumber == year) {
            if (((y_isleap ? 366 : 365) - day_of_year_number) < (4 - weekday)) {
                yearnumber++;
                weeknumber = 1;
            }
        }
        // find if Y M D falls in YearNumber Y, WeekNumber 1 through 53
        if (yearnumber == year) {
            weeknumber = parseInt((day_of_year_number + (7 - weekday)
                + (jan1_weekday - 1)) / 7);
            if (jan1_weekday > 4)
                weeknumber--;
        }
        // put it all together
        if (weeknumber < 10)
            weeknumber = "0" + weeknumber;
        return yearnumber + "-" + weeknumber + "-" + weekday;
    },
    
    weekOfYear: function(day, month, year) {
        var now = new Date();
        return parseInt(this.gregorianToISO(day || now.getDate(),
            month || now.getMonth(), year || now.getFullYear()).split("-")[1]);
    },

    quarterOfYear: function(month) {
        var now = new Date();
        return parseInt((month || now.getMonth() - 1) / 3 + 1);
    },

    daysInMonth: function(month, year) {
        var now = new Date();
        if (!year)
            year = now.getFullYear();
        if (!month)
            month = now.getMonth();

        if (year == 1582 && month == 10)
            return 21;  // October 1582 only had 1st-4th and 15th-31st

        if (month == 2)
            return this.isLeapYear(year) ? 29 : 28;
        else if (month == 4 || month == 6 || month == 9 || month == 11)
            return 30;
        else
            return 31;
    },

    dayOfWeek: function(day, month, year) {
        var now = new Date();
        if (!year)
            year = now.getFullYear();
        if (!month)
            month = now.getMonth();
        if (!day)
            day = now.getDate();
        return new Date(year, month, day).getDay();
    },

    beginOfWeek: function(day, month, year, epoch) {
        var now = new Date();
        if (!year)
            year = now.getFullYear();
        if (!month)
            month = now.getMonth();
        if (!day)
            day = now.getDate();
        var this_weekday = this.dayOfWeek(day, month, year);
        var interval     = (7 - this.i18n.beginWeekday + this_weekday) % 7;
        var d            = this.dateToDays(day, month, year) - interval;
        return epoch ? d : this.daysToDate(d);
    },

    weeksInMonth: function(month, year) {
        var now = new Date();
        if (!year)
            year = now.getFullYear();
        if (!month)
            month = now.getMonth();

        var FDOM         = this.dayOfWeek(1, month, year), //firstOfMonthWeekday
            beginWeekday = this.i18n.beginWeekday,
            first_week_days, weeks;
        if (beginWeekday == 1 && FDOM == 0) {
            first_week_days = 7 - FDOM + beginWeekday;
            weeks = 1;
        }
        else if (beginWeekday == 0 && FDOM == 6) {
            first_week_days = 7 - FDOM + beginWeekday;
            weeks = 1;
        }
        else {
            first_week_days = beginWeekday - FDOM;
            weeks = 0;
        }
        first_week_days %= 7;
        return Math.ceil((this.daysInMonth(month, year) - first_week_days) / 7)
            + weeks;
    },

    getCalendarWeek: function(day, month, year) {
        var now         = new Date(),
            week_array = [];
        // date for the column of week
        var curr_day = this.beginOfWeek(day || now.getDate(),
            month || now.getMonth(), year || now.getFullYear(), true);

        for (var i = 0; i <= 6; i++) {
            week_array[i] = this.daysToDate(curr_day);
            curr_day++;
        }
        return week_array;
    },

    getCalendarMonth: function(month, year) {
        var now         = new Date(),
            month_array = [];
        if (!year)
            year = now.getFullYear();
        if (!month)
            month = now.getMonth();

        // date for the first row, first column of calendar month
        var curr_day = (this.i18n.beginWeekday == 1)
            ? (this.dayOfWeek(1, month, year) == 0)
                ? this.dateToDays(1, month, year) - 6
                : this.dateToDays(1, month, year) - this.dayOfWeek(1, month, year) + 1
            : (this.dateToDays(1, month, year) - this.dayOfWeek(1, month, year));

        // number of days in this month
        var weeksInMonth = this.weeksInMonth(month, year);
        for (var rows = 0; rows < weeksInMonth; rows++) {
            month_array[rows] = [];
            for (var cols = 0; cols <= 6; cols++) {
                month_array[rows][cols] = this.daysToDate(curr_day);
                curr_day++;
            }
        }

        return month_array;
    },

    getCalendarYear: function(year) {
        if (!year)
            year = new Date().getFullYear();
        var year_array = [];

        for (var curr_month = 0; curr_month <= 11; curr_month++)
            year_array[curr_month] = this.getCalendarMonth(curr_month + 1, year);

        return year_array;
    }
    // #endif
};

})();

apf.date.dateFormat = (function () {
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
        var dF = apf.date;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && (typeof date == "string"
            || date instanceof String) && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date();

        if (isNaN(date)) return "NaN";//throw new SyntaxError("invalid date");

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
apf.date.getDateTime = function(datetime, format) {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g;
    var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC:)(?:[-+]\d{4})?)\b/g;
    var alteration = 0;
    var time, y = new Date().getFullYear(), m = 1, d = 1,
        h = 12, M = 0, s = 0;
    var i18n = apf.date.i18n;

    if (!format) {
        throw new Error(apf.formatErrorString(0, null,
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
                    throw new Error(apf.formatErrorString(0, null,
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

    return new Date(y, m-1, d, h, M, s);
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return apf.date.dateFormat(this, mask, utc);
};

Date.parse = function (datetime, format) {
    return apf.date.getDateTime(datetime, format);
};

// #ifdef __WITH_DATE_EXT
Date.prototype.copy             = function() {
    return new Date(this.getTime());
};
Date.prototype.inDaylightTime   = function() {
    // Calculate Daylight Saving Time
    var dst   = 0,
        jan1  = new Date(this.getFullYear(), 0, 1, 0, 0, 0, 0),  // jan 1st
        june1 = new Date(this.getFullYear(), 6, 1, 0, 0, 0, 0), // june 1st
        temp  = jan1.toUTCString(),
        jan2  = new Date(temp.slice(0, temp.lastIndexOf(' ')-1));
    temp = june1.toUTCString();
    var june2 = new Date(temp.slice(0, temp.lastIndexOf(' ')-1));
    var std_time_offset = (jan1 - jan2) / (1000 * 60 * 60),
        daylight_time_offset = (june1 - june2) / (1000 * 60 * 60);

    if (std_time_offset === daylight_time_offset) {
        dst = 0; // daylight savings time is NOT observed
    }
    else {
        // positive is southern, negative is northern hemisphere
        var hemisphere = std_time_offset - daylight_time_offset;
        if (hemisphere >= 0)
            std_time_offset = daylight_time_offset;
        dst = 1; // daylight savings time is observed
    }
    return dst;
};
Date.prototype.addSeconds       = function(sec) {
    sec = parseInt(sec);
    // Negative value given.
    if (sec < 0)
        return this.subtractSeconds(Math.abs(sec));

    return this.addSpan(new apf.date.span(sec));
};
Date.prototype.addSpan          = function(span) {
    if (!(span instanceof apf.date.span)) return this;
    var d;

    this.setSeconds(this.getSeconds() + span.seconds);
    if (this.getSeconds() >= 60) {
        this.setMinutes(this.getMinutes() + 1);
        this.setSeconds(this.getSeconds() - 60);
    }

    this.setMinutes(this.getMinutes() + span.minutes);
    if (this.getMinutes() >= 60) {
        this.setHours(this.getHours() + 1);
        if (this.getHours() >= 24) {
            d = apf.date.nextDay(this.getDate(), this.getMonth(), this.getFullYear());
            this.setFullYear(parseInt(d.year), parseInt(d.month), parseInt(d.day));
            this.setHours(this.getHours() - 24);
        }
        this.setMinutes(this.getMinutes() - 60);
    }

    this.setHours(this.getHours() + span.hours);
    if (this.getHours() >= 24) {
        d = apf.date.nextDay(this.getDate(), this.getMonth(), this.getFullYear());
        this.setFullYear(parseInt(d.year), parseInt(d.month), parseInt(d.day));
        this.setHours(this.getHours() - 24);
    }

    d = apf.date.dateToDays(this.getDate(), this.getMonth(), this.getFullYear());
    d += span.days;
    var d2 = apf.date.daysToDate(d);

    this.setFullYear(parseInt(d2.year), parseInt(d2.month), parseInt(d2.day));
    return this;
};
Date.prototype.subtractSeconds  = function(sec) {
    sec = parseInt(sec);

    // Negative value given.
    if (sec < 0)
        return this.addSeconds(Math.abs(sec));

    return this.subtractSpan(new apf.date.span(sec));
};
Date.prototype.subtractSpan     = function(span) {
    if (!(span instanceof apf.date.span)) return this;
    var d;

    this.setSeconds(this.getSeconds() - span.seconds);
    if (this.getSeconds() < 0) {
        this.setMinutes(this.getMinutes() - 1);
        this.setSeconds(this.getSeconds() + 60);
    }

    this.setMinutes(this.getMinutes() - span.minutes);
    if (this.getMinutes() < 0) {
        this.setHours(this.getHours() - 1);
        if (this.getHours() < 0) {
            d = apf.date.prevDay(this.getDate(), this.getMonth(), this.getFullYear());
            this.setFullYear(parseInt(d.year), parseInt(d.month), parseInt(d.day));
            this.setHours(this.getHours() + 24);
        }
        this.setMinutes(this.getMinutes() + 60);
    }

    this.setHours(this.getHours() - span.hours);
    if (this.getHours() < 0) {
        d = apf.date.prevDay(this.getDate(), this.getMonth(), this.getFullYear());
        this.setFullYear(parseInt(d.year), parseInt(d.month), parseInt(d.day));
        this.setHours(this.getHours() + 24);
    }

    d = apf.date.dateToDays(this.getDate(), this.getMonth(), this.getFullYear());
    d -= span.days;
    var d2 = apf.date.daysToDate(d);
    
    this.setFullYear(parseInt(d2.year), parseInt(d2.month), parseInt(d2.day));
    return this;
};
Date.prototype.before           = function(when) {
    return (apf.date.compare(this, when) == -1);
};
Date.prototype.after            = function(when) {
    return (apf.date.compare(this, when) == 1);
};
Date.prototype.equals           = function(when) {
    return (apf.date.compare(this, when) === 0);
};
Date.prototype.isFuture         = function() {
    return this.after(new Date());
};
Date.prototype.isPast           = function() {
    return this.before(new Date());
};
Date.prototype.isLeapYear       = function() {
    return apf.date.isLeapYear(this.getFullYear());
};
Date.prototype.getJulianDate    = function() {
    return apf.date.julianDate(this.getDate(), this.getMonth(), this.getFullYear());
};
Date.prototype.getWeekOfYear    = function() {
    return apf.date.weekOfYear(this.getDate(), this.getMonth(), this.getFullYear());
};
Date.prototype.getQuarterOfYear = function() {
    return apf.date.quarterOfYear(this.getMonth());
};
Date.prototype.getDaysInMonth   = function() {
    return apf.date.daysInMonth(this.getMonth(), this.getFullYear());
};
Date.prototype.getWeeksInMonth  = function() {
    return apf.date.weeksInMonth(this.getMonth(), this.getFullYear());
};
Date.prototype.getNextDay       = 
Date.prototype.getNextWeekday   = function() {
    var d = apf.date.nextDay(this.getDate(), this.getMonth(), this.getFullYear());
    return this.copy().setFullYear(d.year, d.month, d.day);
};
Date.prototype.getPrevDay       =
Date.prototype.getPrevWeekday   = function() {
    var d = apf.date.prevDay(this.getDate(), this.getMonth(), this.getFullYear());
    return this.copy().setFullYear(d.year, d.month, d.day);
};
Date.prototype.getCalendarWeek  = function() {
    return apf.date.getCalendarWeek(this.getDate(), this.getMonth(), this.getFullYear());
};
Date.prototype.getCalendarMonth = function() {
    return apf.date.getCalendarMonth(this.getMonth(), this.getFullYear());
};
Date.prototype.getCalendarYear = function() {
    return apf.date.getCalendarYear(this.getFullYear());
};
// #endif

// #endif
