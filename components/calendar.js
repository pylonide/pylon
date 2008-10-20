﻿/*
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
 * This component is used to choosing date. 
 *
 * @classDescription        This class creates a new calendar
 * @return {workflow}       Returns a new calendar
 * @type {calendar}
 * @constructor
 * @addnode components:calendar
 *
 * @author      Łukasz Lipiński
 * @version     %I%, %G%
 * @since       1.0
 */

jpf.calendar = function(pHtmlNode, tagName){
    jpf.register(this, tagName || "calendar", jpf.NODE_VISIBLE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;

    var datetype = "yyyy/mm/dd";

    var calendarNumber = 1;//it could be removed
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = [{
        name  : "January",
        number: 31
    }, {
        name  : "February",
        number: 28
    }, {
        name  : "March",
        number: 31
    }, {
        name  : "April",
        number: 30
    }, {
        name  : "May",
        number: 31
    }, {
        name  : "June",
        number: 30
    }, {
        name  : "July",
        number: 31
    }, {
        name  : "August",
        number: 31
    }, {
        name  : "September",
        number: 30
    }, {
        name  : "October",
        number: 31
    }, {
        name  : "November",
        number: 30
    }, {
        name  : "December",
        number: 31
    }];

    var _self = this;

    /* ***********************
     Inheritance
     ************************/
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.DataBinding
     */
    this.inherit(jpf.Presentation, jpf.DataBinding);

    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.$focussable     = true; // This object can get the focus
    this.nonSizingHeight = true;
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    var focusSelect      = false;
    var masking          = false;

    this.$supportedProperties.push("value");
    this.$propHandlers["value"] = function(value) {
        var date = Date.parse(value, this.dateFormat);

        //this.value is set automoticly with "value"
        //#ifdef __DEBUG
        if (!date) {
            throw new Error(jpf.formErrorString(this, "Parsing date", "Invalid date: " + value));
        }
        //#endif

        this.day   = date.getDate();
        this.month = date.getMonth();
        this.year  = date.getFullYear();

        this.redraw(this.month, this.year);
    }

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value) {
        this.setProperty("value", value);
    };

    this.getValue = function() {
        return this.value;//year + "-" + this.month + "-" + this.day;
    };

    this.addEventListener("keydown", function(e) {
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;

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
            this.clickDay(this.day + 1);
        }
        else if (key == 37) {
            if (this.day - 1 < 1) {
                this.prevMonth();
                this.clickDay(months[currentMonth].number);
            }
            else {
                this.clickDay(this.day - 1);
            }
        }
        else if (key == 38) {
            if (this.day - 7 < 1) {
                this.prevMonth();
                this.clickDay(months[currentMonth].number + this.day - 7);
            }
            else {
                this.clickDay(this.day - 7);
            }
        }
        else if (key == 40) {
            this.clickDay(this.day + 7);
        }
    }, true);
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */

    var isLeapYear = function(year){
        return ((year % 4 == 0) && (year % 100 !== 0)) || (year % 400 == 0) ? true : false;
    };

    var currentMonth, currentYear;
    var numberOfDays, dayNumber;

    this.redraw = function(month, year) {
        var i, j, z, y, cells;
        if (month == currentMonth && year == currentYear) {
            rows = this.oContainer.childNodes;
            for (z = 0, y = 0, i = 0; i < rows.length; i++) {
                if ((rows[i].className || "").indexOf("row") == -1) {
                    continue;
                }
                cells = rows[i].childNodes;
                for (j = 0; j < cells.length; j++) {
                    if ((cells[j].className || "").indexOf("cell") == -1) {
                        continue;
                    }
                    z++;
                    this.$setStyleClass(cells[j], "", ["active"]);
                    
                    if ((z - 1) % 8 !== 0) {
                        y++;
                        if (y > dayNumber && y <= numberOfDays + dayNumber) {
                            if (month == this.month && year == this.year && y - dayNumber == this.day) {
                                this.$setStyleClass(cells[j], "active");
                            }
                        }
                    }
                }
            }
            return;
        }

        currentMonth = month;
        currentYear  = year;

        //Title is optional
        if (this.oTitle) 
            this.oTitle.innerHTML = months[month].name + " " + year;


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

        numberOfDays = months[date.getMonth()].number;
        if (isLeapYear(year) && date.getMonth() == 1) 
            numberOfDays++;

        dayNumber = new Date(year, month, 1).getDay();
        var prevMonth     = month == 0 ? 11 : month - 1;
        var prevMonthDays = months[prevMonth].number - dayNumber + 1;

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
                this.$setStyleClass(cells[j], "", ["weekend", "disabled", "active", "prev", "next"]);

                if ((z - 1) % 8 == 0) {
                    cells[j].innerHTML = w_weeks - Math.ceil((months[this.month].number + dayNumber) / 7) + 1 + (z - 1) / 8;
                }
                else {
                    y++;
                    if (y <= dayNumber) {
                        cells[j].innerHTML = prevMonthDays++;
                        this.$setStyleClass(cells[j], "disabled prev");
                    }
                    else if (y > dayNumber && y <= numberOfDays + dayNumber) {
                        cells[j].innerHTML = y - dayNumber;

                        var dayNrWeek = new Date(year, month, y - dayNumber).getDay();

                        if (dayNrWeek == 0 || dayNrWeek == 6) {
                            this.$setStyleClass(cells[j], "weekend");
                        }

                        if (month == this.month && year == this.year && y - dayNumber == this.day)
                            this.$setStyleClass(cells[j], "active");

                    }
                    else if (y > numberOfDays + dayNumber) {
                        cells[j].innerHTML = nextMonthDays++;
                        this.$setStyleClass(cells[j], "disabled next");
                    }
                }
            }
        }
    }

    /**
     * Select choosen day, current day is selected as default
     * 
     * @param {Number} nr    Day number
     * @param {String} type  Selected cell class name
     */

    this.clickDay = function(nr, type) {
        var newMonth = type == "prev" ? currentMonth : (type == "next" ? currentMonth + 2 : currentMonth + 1);
        var newYear = currentYear;
        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        else if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }
        this.change(new Date(newYear, (newMonth - 1), nr).format(this.dateFormat));
    }

    /**
     * Change year to next
     */

    this.nextYear = function() {
        this.redraw(currentMonth, currentYear + 1);
    }

    /**
     * Change year to previous
     */

    this.prevYear = function() {
        this.redraw(currentMonth, currentYear - 1);
    }

    /**
     * Shows next month. 
     * If actual month is December, function change year to next
     */

    this.nextMonth = function() {
        var newMonth, newYear;
        if (currentMonth > 10) {
            newMonth = 0;
            newYear  = currentYear + 1;
        }
        else {
            newMonth = currentMonth + 1;
            newYear  = currentYear;
        }

        this.redraw(newMonth, newYear);
    }

    /**
     * Shows previous month. 
     * If actual month is January, function change year to previous
     */

    this.prevMonth = function() {
        var newMonth, newYear;
        if (currentMonth < 1) {
            newMonth = 11;
            newYear  = currentYear - 1;
        }
        else {
            newMonth = currentMonth - 1;
            newYear  = currentYear;
        }

        this.redraw(newMonth, newYear);
    }

    /**
     * Choose today's date on calendar
     */

    this.today = function() {
        this.setProperty("value", new Date().format(this.dateFormat));
    }

    this.$draw = function() {
        this.oExt = this.$getExternal("Main", null, function(oExt) {
            var i, j, oContainer = this.$getLayoutNode("main", "container");
            for (i = 0; i < 6; i++) {
                this.$getNewContext("Row");
                var oRow = oContainer.appendChild(this.$getLayoutNode("Row"));

                for (j = 0; j < 8; j++) {
                    this.$getNewContext("Cell");
                    var oCell = this.$getLayoutNode("Cell");
                    if (j > 0) {
                        oCell.setAttribute("onmouseover", 
                            "if (this.className.indexOf('disabled') > -1) return;\
                            jpf.lookup(" + this.uniqueId + ").$setStyleClass(this, 'hover');");
                        oCell.setAttribute("onmouseout", 
                            "var o = jpf.lookup(" + this.uniqueId + ").$setStyleClass(this, '', ['hover']);");
                        oCell.setAttribute("onmousedown", 
                            "var o = jpf.lookup(" + this.uniqueId + ");\
                            if (this.className.indexOf('prev') > -1) {\
                                o.clickDay(this.innerHTML, 'prev');\
                            } else if (this.className.indexOf('next') > -1) {\
                                o.clickDay(this.innerHTML, 'next');\
                            } else {\
                                o.clickDay(this.innerHTML);\
                            }");
                    }
                    oRow.appendChild(oCell);
                }
            }

            var oDaysOfWeek = this.$getLayoutNode("main", "daysofweek");
            for (i = 0; i < days.length + 1; i++) {
                this.$getNewContext("Day");
                oDaysOfWeek.appendChild(this.$getLayoutNode("Day"));
            }

            var oNavigation = this.$getLayoutNode("main", "navigation"); //optional
            if (oNavigation) {
                //Assign events to these buttons here
                var buttons = ["prevYear", "prevMonth", "nextYear", "nextMonth", "today"];
                for (i = 0; i < buttons.length; i++) {
                    this.$getNewContext("Button");
                    var btn = oNavigation.appendChild(this.$getLayoutNode("Button"));
                    this.$setStyleClass(btn, buttons[i]);
                    btn.setAttribute("onmousedown", 'jpf.lookup(' + this.uniqueId + ').' + buttons[i] + '()');
                    btn.setAttribute("onmouseover", 'jpf.lookup(' + this.uniqueId + ').$setStyleClass(this, "hover");');
                    btn.setAttribute("onmouseout",  'jpf.lookup(' + this.uniqueId + ').$setStyleClass(this, "", ["hover"]);');
                }
            }
        });
        this.oContainer  = this.$getLayoutNode("main", "container");
        this.oTitle      = this.$getLayoutNode("main", "title");
        this.oNavigation = this.$getLayoutNode("main", "navigation");
        
        var oDow = this.$getLayoutNode("main", "daysofweek"); //optional
        if (oDow) {
            var daysofweek = oDow.childNodes;
            for (var z = 0, i = 0; i < daysofweek.length; i++) {
                if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {
                    daysofweek[i].innerHTML = z == 0 ? "Week" : days[z - 1].substr(0, 3);
                    z++;
                }
            }
        }
    }

    this.$loadJml = function(x) {
        //etc... (if not databound)
        this.dateFormat = x.getAttribute("date-format") || "MM-DD-YYYY";

        if (!(x.getAttribute("bindings") || x.getAttribute("ref"))) {
            var dt = new Date();
            var actualDate = dt.format(this.dateFormat);
            this.setProperty("value", actualDate);
        }
    }

    this.$destroy = function(){}
}
