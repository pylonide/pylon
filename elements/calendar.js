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

// #ifdef __JCALENDAR || __INC_ALL
/**
 * Element displaying a list of day numbers in a grid, ordered by week. It
 * allows the user to choose the month and year for which to display the days.
 *
 * @constructor
 * @addnode elements:calendar
 *
 * @classDescription    This class creates a new calendar
 * @return {Calendar}   Returns a new calendar
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.calendar = jpf.component(jpf.NODE_VISIBLE, function() {
    this.pHtmlNode  = document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;

    this.$supportedProperties.push("value", "dateFormat");

    this.dateFormat  = null;//default is MM-DD-YYYY
    this.value       = null;//default is actual date

    var _day          = null,
        _month        = null,
        _year         = null,
        _currentMonth = null,
        _currentYear  = null,
        _numberOfDays = null,
        _dayNumber    = null;

    var days = ["Sunday", "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday"];
    var months = [{name : "January",   number : 31},
                  {name : "February",  number : 28},
                  {name : "March",     number : 31},
                  {name : "April",     number : 30},
                  {name : "May",       number : 31},
                  {name : "June",      number : 30},
                  {name : "July",      number : 31},
                  {name : "August",    number : 31},
                  {name : "September", number : 30},
                  {name : "October",   number : 31},
                  {name : "November",  number : 30},
                  {name : "December",  number : 31}];

    var _self = this;


    this.$propHandlers["value"] = function(value) {
        var date = Date.parse(value, this.dateFormat);

        //#ifdef __DEBUG
        if (!date) {
            throw new Error(jpf.formErrorString(this,
                                                "Parsing date",
                                                "Invalid date: " + value));
        }
        //#endif

        _day   = date.getDate();
        _month = date.getMonth();
        _year  = date.getFullYear();

        this.redraw(_month, _year);
    }

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/

    this.setValue = function(value) {
        this.setProperty("value", value);
    };

    this.getValue = function() {
        return this.value;
    };

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        e = e || event;
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey;

        if (ctrlKey && key == 37) {
            this.prevMonth();
        }
        else if (ctrlKey && key == 39) {
            this.nextMonth();
        }
        else if (shiftKey && key == 39) {
            this.nextYear();
        }
        else if (shiftKey && key == 37) {
            this.prevYear();
        }
        else if (key == 39) {
            this.selectDay(_day + 1);
        }
        else if (key == 37) {
            if (_day - 1 < 1) {
                this.prevMonth();
                this.selectDay(months[_currentMonth].number);
            }
            else {
                this.selectDay(_day - 1);
            }
        }
        else if (key == 38) {
            if (_day - 7 < 1) {
                this.prevMonth();
                this.selectDay(months[_currentMonth].number + _day - 7);
            }
            else {
                this.selectDay(_day - 7);
            }
        }
        else if (key == 40) {
            this.selectDay(_day + 7);
        }
    }, true);
    //#endif

    var isLeapYear = function(year){
        return ((year % 4 == 0) && (year % 100 !== 0)) || (year % 400 == 0)
            ? true
            : false;
    };

    this.redraw = function(month, year) {
        if (month == _currentMonth && year == _currentYear) {
            rows = this.oContainer.childNodes;
            for (var z = 0, y = 0, i = 0, l = rows.length, cells; i < l; i++) {
                if ((rows[i].className || "").indexOf("row") == -1) {
                    continue;
                }
                cells = rows[i].childNodes;
                for (var j = 0, l2 = cells.length; j < l2; j++) {
                    if ((cells[j].className || "").indexOf("cell") == -1) {
                        continue;
                    }
                    z++;
                    this.$setStyleClass(cells[j], "", ["active"]);
                    
                    if ((z - 1) % 8 !== 0) {
                        y++;
                        if (y > _dayNumber && y <= _numberOfDays + _dayNumber) {
                            if (month == _month
                                && year == _year
                                && y - _dayNumber == _day) {
                                this.$setStyleClass(cells[j], "active");
                            }
                        }
                    }
                }
            }
            return;
        }

        _currentMonth = month;
        _currentYear  = year;

        //Title is optional
        if (this.oTitle) {
            this.oTitle.innerHTML = months[month].name + " " + year;
        }

        /* Week number */
        var w_firstYearDay = new Date(year, 0, 1);
        var w_dayInWeek    = w_firstYearDay.getDay();
        var w_days         = w_dayInWeek;

        for (i = 0; i <= month; i++) {
            if (isLeapYear(year) && i == 1) 
                w_days++;
            w_days += months[i].number;
        }

        var w_weeks  = Math.ceil(w_days / 7);
        /* Week number - End */

        var date = new Date(year, month);

        _numberOfDays = months[date.getMonth()].number;
        if (isLeapYear(year) && date.getMonth() == 1) 
            _numberOfDays++;

        _dayNumber = new Date(year, month, 1).getDay();
        var prevMonth     = month == 0 ? 11 : month - 1;
        var prevMonthDays = months[prevMonth].number - _dayNumber + 1;

        var nextMonthDays = 1;

        var rows = this.oNavigation.childNodes;
        for (i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("today") == -1)
                continue;
            rows[i].innerHTML = "Today";
        }

        rows = this.oContainer.childNodes;
        for (z = 0, y = 0, i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("row") == -1)
                continue;

            cells = rows[i].childNodes;
            for (var j = 0; j < cells.length; j++) {
                if ((cells[j].className || "").indexOf("cell") == -1)
                    continue;

                z++;
                this.$setStyleClass(cells[j], "", ["weekend", "disabled",
                                                   "active", "prev", "next"]);

                if ((z - 1) % 8 == 0) {
                    cells[j].innerHTML = w_weeks
                        - Math.ceil((months[_month].number + _dayNumber) / 7)
                        + 1 + (z - 1) / 8;
                }
                else {
                    y++;
                    if (y <= _dayNumber) {
                        cells[j].innerHTML = prevMonthDays++;
                        this.$setStyleClass(cells[j], "disabled prev");
                    }
                    else if (y > _dayNumber && y <= _numberOfDays + _dayNumber) {
                        cells[j].innerHTML = y - _dayNumber;

                        var dayNrWeek = new Date(year, month, y - _dayNumber).getDay();

                        if (dayNrWeek == 0 || dayNrWeek == 6) {
                            this.$setStyleClass(cells[j], "weekend");
                        }

                        if (month == _month
                            && year == _year
                            && y - _dayNumber == _day)
                            this.$setStyleClass(cells[j], "active");

                    }
                    else if (y > _numberOfDays + _dayNumber) {
                        cells[j].innerHTML = nextMonthDays++;
                        this.$setStyleClass(cells[j], "disabled next");
                    }
                }
            }
        }
    };

    /**
     * Change choosen date with selected and highlight his cell in calendar
     * component
     * 
     * @param {Number}   nr     day number
     * @param {String}   type   class name of html representation of selected cell
     */
    this.selectDay = function(nr, type) {
        var newMonth = type == "prev"
            ? _currentMonth
            : (type == "next"
                ? _currentMonth + 2
                : _currentMonth + 1);

        var newYear = _currentYear;

        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        else if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }
        this.change(new Date(newYear, (newMonth - 1), nr).format(this.dateFormat));
    };

    /**
     * Change displayed year to next
     */
    this.nextYear = function() {
        this.redraw(_currentMonth, _currentYear + 1);
    };

    /**
     * Change displayed year to previous
     */
    this.prevYear = function() {
        this.redraw(_currentMonth, _currentYear - 1);
    };

    /**
     * Change displayed month to next. If actual month is December, function
     * change current displayed year to next
     */
    this.nextMonth = function() {
        var newMonth, newYear;
        if (_currentMonth > 10) {
            newMonth = 0;
            newYear  = _currentYear + 1;
        }
        else {
            newMonth = _currentMonth + 1;
            newYear  = _currentYear;
        }

        this.redraw(newMonth, newYear);
    };

    /**
     * Change displayed month to previous. If actual month is January, function
     * change current displayed year to previous
     */
    this.prevMonth = function() {
        var newMonth, newYear;
        if (_currentMonth < 1) {
            newMonth = 11;
            newYear  = _currentYear - 1;
        }
        else {
            newMonth = _currentMonth - 1;
            newYear  = _currentYear;
        }

        this.redraw(newMonth, newYear);
    };

    /**
     * Select today's date on calendar component
     */
    this.today = function() {
        this.setProperty("value", new Date().format(this.dateFormat));
    };

    this.$draw = function() {
        this.oExt = this.$getExternal("main", null, function(oExt) {
            var oContainer = this.$getLayoutNode("main", "container", this.oExt);
            for (var i = 0; i < 6; i++) {
                this.$getNewContext("row");
                var oRow = oContainer.appendChild(this.$getLayoutNode("row"));

                for (var j = 0; j < 8; j++) {
                    this.$getNewContext("cell");
                    var oCell = this.$getLayoutNode("cell");
                    if (j > 0) {
                        oCell.setAttribute("onmouseover",
                            "if (this.className.indexOf('disabled') > -1) "
                            + "return; jpf.lookup(" + this.uniqueId 
                            + ").$setStyleClass(this, 'hover');");
                        oCell.setAttribute("onmouseout", 
                            "var o = jpf.lookup(" + this.uniqueId 
                            + ").$setStyleClass(this, '', ['hover']);");
                        oCell.setAttribute("onmousedown", 
                            "var o = jpf.lookup(" + this.uniqueId + ");"
                            + " if (this.className.indexOf('prev') > -1) { "
                            + "o.selectDay(this.innerHTML, 'prev');}"
                            + " else if (this.className.indexOf('next') > -1) {"
                            + "o.selectDay(this.innerHTML, 'next');}"
                            + " else {o.selectDay(this.innerHTML);}");
                    }
                    oRow.appendChild(oCell);
                }
            }

            var oDaysOfWeek = this.$getLayoutNode("main", "daysofweek", this.oExt);
            for (var i = 0; i < days.length + 1; i++) {
                this.$getNewContext("day");
                oDaysOfWeek.appendChild(this.$getLayoutNode("day"));
            }

            var oNavigation = this.$getLayoutNode("main", "navigation", this.oExt);
            if (oNavigation) {
                var buttons = ["prevYear", "prevMonth", "nextYear",
                               "nextMonth", "today"];
                for (var i = 0; i < buttons.length; i++) {
                    this.$getNewContext("button");
                    var btn = oNavigation.appendChild(this.$getLayoutNode("button"));
                    this.$setStyleClass(btn, buttons[i]);
                    btn.setAttribute("onmousedown", 'jpf.lookup('
                        + this.uniqueId + ').' + buttons[i] + '()');
                    btn.setAttribute("onmouseover", 'jpf.lookup('
                        + this.uniqueId + ').$setStyleClass(this, "hover");');
                    btn.setAttribute("onmouseout",  'jpf.lookup('
                        + this.uniqueId
                        + ').$setStyleClass(this, "", ["hover"]);');
                }
            }
        });

        this.oContainer  = this.$getLayoutNode("main", "container", this.oExt);
        this.oTitle      = this.$getLayoutNode("main", "title", this.oExt);
        this.oNavigation = this.$getLayoutNode("main", "navigation", this.oExt);

        var oDow = this.$getLayoutNode("main", "daysofweek", this.oExt);
        if (oDow) {
            var daysofweek = oDow.childNodes;
            for (var z = 0, i = 0; i < daysofweek.length; i++) {
                if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {
                    daysofweek[i].innerHTML = z == 0 
                        ? "Week"
                        : days[z - 1].substr(0, 3);
                    z++;
                }
            }
        }
    };

    this.$loadJml = function(x) {
        //etc... (if not databound)
        this.dateFormat = x.getAttribute("date-format") || "MM-DD-YYYY";

        if (!(x.getAttribute("bindings") || x.getAttribute("ref"))) {
            var dt = new Date();
            var actualDate = dt.format(this.dateFormat);
            this.setProperty("value", actualDate);
        }
    };

    this.$destroy = function() {
    };
}).implement(jpf.Presentation, jpf.DataBinding);

// #endif
