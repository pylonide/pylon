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
 * Calendar returns a date in chosen date format. Minimal size of calendar is
 * 150px.
 * 
 * Example:
 * Calendar component with date set on "Saint Nicholas Day" in iso date format
 * <code>
 * <j:calendar
 *     top           = "200"
 *     left          = "400"
 *     output-format = "yyyy-mm-dd"
 *     value         = "2008-12-05" />
 * </code>
 * 
 * Example:
 * Sets the date based on data loaded into this component.
 * <code>
 *  <j:calendar>
 *      <j:bindings>
 *          <j:value select="@date" />
 *      </j:bindings>
 *  </j:calendar>
 * </code>
 * 
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <j:calendar ref="@date" />
 * </code>
 * 
 * @constructor
 * @define calendar
 * @addnode elements
 *
 * @attribute {String}   output-format    the format of the date value. See {@link term.dateformat more about the date format}.
 * @attribute {String}   default          the default date set when the calendar is opened.
 *     Possible values:
 *     today   calendar is set on today's date
 * @attribute {String}   value            the date returned by calendar; should be in the format specified by the output-format attribute.
 * 
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.Validation
 * @inherits jpf.XForms
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 *
 */
jpf.calendar = jpf.component(jpf.NODE_VISIBLE, function() {
    /**** Properties and Attributes ****/
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

    var _day          = null,
        _month        = null,
        _year         = null,
        
        _hours        = 1,
        _minutes      = 0,
        _seconds      = 0,
        
        _currentMonth = null,
        _currentYear  = null,
        _numberOfDays = null,
        _dayNumber    = null,
        
        _temp         = null;

    var _self = this;
    var inited = false;

    this.$booleanProperties["disableremove"] = true;

    this.$supportedProperties.push("disableremove", "initial-message", 
        "output-format", "default");

    /**
     * @attribute {String} style of returned date
     * 
     * Possible values:
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
    this.$propHandlers["output-format"] = function(value) {
        if (this.value) {
            this.setProperty("value", 
                new Date(
                    _year, _month, _day, _hours, _minutes, _seconds
                ).format(this.outputFormat = value)
            );
        }
        else
            this.outputFormat = value;
    };

    this.$propHandlers["value"] = function(value) {
        if (!this.outputFormat) {
            _temp = value;
            return;
        }

        var date = Date.parse(value, this.outputFormat);

        //#ifdef __DEBUG
        if (!date) {
            throw new Error(jpf.formErrorString(this, "Parsing date",
                "Invalid date: " + value));
        }
        //#endif

        _day     = date.getDate();
        _month   = date.getMonth();
        _year    = date.getFullYear();
        _hours   = date.getHours();
        _minutes = date.getMinutes();
        _seconds = date.getSeconds();

        this.value = value;
        this.redraw(_month, _year);
    };

    /**** Public methods ****/

    /**
     * @method  Sets calendar date
     */
    this.setValue = function(value) {
        this.setProperty("value", value);
    };
    
    /**
     * @method  
     * 
     * @return {String} date indicated by calendar
     */
    this.getValue = function() {
        return this.value;
    };

    /**** Keyboard Support ****/

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        e = e || event;

        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey;

        switch (key) {
            case 13: /* enter */
                this.selectDay(_day);
                break;

            case 33: /* page up */
                this.nextMonth();
                break;

            case 34: /* page down */
                this.prevMonth();
                break;

            case 37: /* left arrow */
                if (ctrlKey)
                    this.prevMonth();
                else if (shiftKey)
                    this.prevYear();
                else {
                    if (_day - 1 < 1) {
                        this.prevMonth();
                        this.selectDay(months[_currentMonth].number);
                    }
                    else {
                        this.selectDay(_day - 1);
                    }
                }
                break;

            case 38: /* up arrow */
                if (_day - 7 < 1) {
                    this.prevMonth();
                    this.selectDay(months[_currentMonth].number + _day - 7);
                }
                else {
                    this.selectDay(_day - 7);
                }
                break;

            case 39: /* right arrow */
                if (ctrlKey)
                    this.nextMonth();
                else if (shiftKey)
                    this.nextYear();
                else
                    this.selectDay(_day + 1);
                break;

            case 40: /* down arrow */
                    this.selectDay(_day + 7);
                break;

            case 84:
                if (ctrlKey)
                    this.today();
                    return false;
                break;
        }
    }, true);
    //#endif


    this.$blur = function() {
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    };

    this.$focus = function(){
        this.$setStyleClass(this.oFocus || this.oExt, this.baseCSSname + "Focus");
    }

    var isLeapYear = function(year) {
        return ((year % 4 == 0) && (year % 100 !== 0)) || (year % 400 == 0)
            ? true
            : false;
    };
    
    this.$getMargin = function(oHtml) {
        if (jpf.isIE) {
            return [
                (parseInt(jpf.getStyle(oHtml, "marginLeft")) || 0)
                + (parseInt(jpf.getStyle(oHtml, "marginLeft")) || 0),
                (parseInt(jpf.getStyle(oHtml, "marginTop")) || 0)
                + (parseInt(jpf.getStyle(oHtml, "marginBottom")) || 0)
            ];
        }
        else {
            return [
                parseInt(jpf.getStyle(oHtml, "margin-right") || 0)
                + parseInt(jpf.getStyle(oHtml, "margin-left") || 0),
                parseInt(jpf.getStyle(oHtml, "margin-top") || 0)
                + parseInt(jpf.getStyle(oHtml, "margin-bottom") || 0)
            ];
        }
    };
    
    this.$getFontSize = function(oHtml) {
        return jpf.isIE
            ? parseInt(jpf.getStyle(oHtml, "fontSize"))
            : parseInt(jpf.getStyle(oHtml, "font-size"));
    }
    
    this.$getPadding = function(oHtml) {
        return jpf.isIE
            ? [parseInt(jpf.getStyle(oHtml, "paddingLeft")) + parseInt(jpf.getStyle(oHtml, "paddingRight")),
              parseInt(jpf.getStyle(oHtml, "paddingTop")) + parseInt(jpf.getStyle(oHtml, "paddingBottom"))]
            : [parseInt(jpf.getStyle(oHtml, "padding-left")) + parseInt(jpf.getStyle(oHtml, "padding-right")),
              parseInt(jpf.getStyle(oHtml, "padding-top")) + parseInt(jpf.getStyle(oHtml, "padding-bottom"))];
    }

    this.redraw = function(month, year) {
        /* Calculations */
        _currentMonth = month;
        _currentYear  = year;
        
        var w_firstYearDay = new Date(year, 0, 1);
        var w_dayInWeek    = w_firstYearDay.getDay();
        var w_days         = w_dayInWeek;
        
        for (i = 0; i <= month; i++) {
            if (isLeapYear(year) && i == 1) {
                w_days++;
            }
            w_days += months[i].number;
        }

        var w_weeks  = Math.ceil(w_days / 7);

        var date = new Date(year, month);

        _numberOfDays = months[date.getMonth()].number;
        if (isLeapYear(year) && date.getMonth() == 1) 
            _numberOfDays++;

        _dayNumber = new Date(year, month, 1).getDay();
        var prevMonth     = month == 0 ? 11 : month - 1;
        var prevMonthDays = months[prevMonth].number - _dayNumber + 1;

        var nextMonthDays = 1;
        /* Calculations - end */

        var ctDiff = jpf.getDiff(this.oExt);
        _width = (this.width || this.oExt.offsetWidth) - ctDiff[0];

        /* Navigation buttons */
        var navi = this.oNavigation.childNodes;
        for (i = 0; i < navi.length; i++) {
            if ((navi[i].className || "").indexOf("today") != -1) {
                navi[i].innerHTML = "T";
            }
            else if ((navi[i].className || "").indexOf("status") != -1) {
                if (_width >= 300) {
                    navi[i].innerHTML = months[_currentMonth].name + " " + _currentYear;
                }
                else {
                    navi[i].innerHTML = (_currentMonth + 1) + "/" + _currentYear;
                    navi[i].style.width = "40px";
                    navi[i].style.marginLeft = "-20px";
                }
            }
        }

        //Rows
        var rows = this.oContent.childNodes;
        var cWidthf, pl;
        for (var i = 0, z = 0, y = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("row") > -1) {
                var rDiff = jpf.getDiff(rows[i]);
                var rDiff2 = this.$getMargin(rows[i]);
                var rWidth = _width - rDiff[0] - rDiff2[0];

                //Cells
                var cells = rows[i].childNodes;
                for (var j = 0, disabledRow = 0; j < cells.length; j++) {
                    if ((cells[j].className || "").indexOf("cell") > -1) {

                        if (!inited)  {
                            var cDiff = jpf.getDiff(cells[j]);
                            var cDiff2 = this.$getMargin(cells[j]);
    
                            cWidthf = Math.floor(rWidth / 8) - cDiff[0] - cDiff2[0];
                            
                            var width = cWidthf;
                            var height = cWidthf 
                                + (cDiff[1] > cDiff[0] ? cDiff[0] - cDiff[1] : 0) 
                                + (cDiff2[1] > cDiff2[0] ? cDiff2[0] - cDiff2[1] : 0);
    
                            var paddingBottom = 
                                paddingTop = Math.ceil((height - this.$getFontSize(cells[j]))/2);
    
                            height -= (paddingTop + paddingBottom - cDiff[1]);
                            
                            cells[j].style.width         = width + "px";
                            cells[j].style.height        = height + "px";
                            cells[j].style.paddingTop    = (paddingTop + 1) + "px";
                            cells[j].style.paddingBottom = (paddingBottom > 0 ? paddingBottom - 1 : 0) + "px";
                        }

                        // Drawing day numbers
                        this.$setStyleClass(cells[j], "", ["weekend", "disabled", "active", "prev", "next"]);
                        
                        z++;
                        if ((z - 1) % 8 == 0) {
                            cells[j].innerHTML = w_weeks - Math.ceil((months[_month].number + _dayNumber) / 7) + 1 + (z - 1) / 8;
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
        
                                if (month == _month && year == _year
                                    && y - _dayNumber == _day) {
                                    this.$setStyleClass(cells[j], "active");
                                }
                            }
                            else if (y > _numberOfDays + _dayNumber) {
                                cells[j].innerHTML = nextMonthDays++;
                                this.$setStyleClass(cells[j], "disabled next");
                                disabledRow++;
                            }
                        }
                    }
                }

                if (!inited) {
                    pl = Math.floor((rWidth - rDiff[0] - rDiff2[0] - (cWidthf + cDiff[0] + cDiff2[0])*8)/2);
                    rows[i].style.paddingLeft = pl + "px";
                    
                    var eDiff = this.$getPadding(this.oExt);
                    this.oExt.style.paddingBottom = (Math.floor(eDiff[1]/2) + pl) + "px";
                }
                
                if (!this.height) {
                    rows[i].style.display = disabledRow == 7
                        ? "none"
                        : "block";
                }
                else {
                    rows[i].style.visibility = disabledRow == 7
                        ? "hidden"
                        : "visible";
                }
            }
        }
        
        /* Days of the week */
        if (!inited) {
            var daysofweek = this.oDow.childNodes;
            this.oDow.style.paddingLeft = pl + "px";
    
            for (var z = 0, i = 0; i < daysofweek.length; i++) {
                if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {
                    daysofweek[i].style.width  = cWidthf + "px";
    
                    if (cWidthf < 16) {
                        daysofweek[i].style.fontSize = "9px";
                    }
    
                    if (z > 0) {
                        daysofweek[i].innerHTML = days[z - 1].substr(0, cWidthf < 12 ? 1 : (cWidthf < 16 ? 2 : 3));
                    }
                    else {
                        daysofweek[i].innerHTML = "&nbsp;";
                    }
                    z++;
                }
            }
        }

        inited = true;
    };

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

        this.change(new Date(newYear, (newMonth - 1), nr, _hours, _minutes,
            _seconds).format(this.outputFormat));
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
        this.redraw(
            _currentMonth > 10 ? 0 : _currentMonth + 1, 
            _currentMonth > 10 ? _currentYear + 1 : _currentYear
        );
    };

    /**
     * Change displayed month to previous. If actual month is January, function
     * change current displayed year to previous
     */
    this.prevMonth = function() {
        this.redraw(
            _currentMonth < 1 ? 11 : _currentMonth - 1, 
            _currentMonth < 1 ? _currentYear - 1 : _currentYear
        );
    };

    /**
     * Select today's date on calendar component
     */
    this.today = function() {
        this.setProperty("value", new Date().format(this.outputFormat));
    };

    /**** Init ****/

    this.$draw = function() {
        //Build Main Skin
        this.oExt = this.$getExternal("main", null, function(oExt) {
            var oExt = this.$getLayoutNode("main", "contnainer", oExt);
            var oContent = this.$getLayoutNode("main", "content", oExt);

            for (var i = 0; i < 6; i++) {
                this.$getNewContext("row");
                var oRow = oContent.appendChild(this.$getLayoutNode("row"));

                for (var j = 0; j < 8; j++) {
                    this.$getNewContext("cell");
                    var oCell = this.$getLayoutNode("cell");
                    if (j > 0) {
                        oCell.setAttribute("onmouseover",
                            "if (this.className.indexOf('disabled') > -1 "
                            + "|| this.className.indexOf('active') > -1) "
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

            var oNavigation = this.$getLayoutNode("main", "navigation", oExt);

            if (oNavigation) {
                var buttons = ["prevYear", "prevMonth", "nextYear", "nextMonth",
                               "today", "status"];
                for (var i = 0; i < buttons.length; i++) {
                    this.$getNewContext("button");
                    var btn = oNavigation.appendChild(this.$getLayoutNode("button"));
                    this.$setStyleClass(btn, buttons[i]);
                    if (buttons[i] !== "status")
                        btn.setAttribute("onmousedown", 'jpf.lookup('
                                         + this.uniqueId + ').'
                                         + buttons[i] + '()');
                }
            }

            var oDaysOfWeek = this.$getLayoutNode("main", "daysofweek", oExt);

            for (var i = 0; i < days.length + 1; i++) {
                this.$getNewContext("day");
                oDaysOfWeek.appendChild(this.$getLayoutNode("day"));
            }
        });

        this.oNavigation = this.$getLayoutNode("main", "navigation",  this.oExt);
        this.oDow        = this.$getLayoutNode("main", "daysofweek",  this.oExt);
        this.oContent    = this.$getLayoutNode("main", "content",  this.oExt);
    };

    this.$loadJml = function(x) {
        if (typeof this.value == "undefined") {
            switch(this["default"]) {
                case "today":
                    this.setProperty("value", new Date().format(this.outputFormat));
                    break;
                default :
                    this.setProperty("value", new Date().format(this.outputFormat));
                    break;
            }
        }
        else {
            var date = Date.parse(_temp || this.value, this.outputFormat);
            _day   = date.getDate();
            _month = date.getMonth();
            _year  = date.getFullYear();

            this.setProperty("value", new Date(_year, _month, _day, _hours, _minutes, _seconds).format(this.outputFormat));
        }
    };


    
    this.$destroy = function() {
        jpf.popup.removeContent(this.uniqueId);
        jpf.removeNode(this.oExt);
        this.oCalendar = null;
    };
}).implement(
    //#ifdef __WITH_DATABINDING
    jpf.DataBinding,
    //#endif
    //#ifdef __WITH_VALIDATION
    jpf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    jpf.XForms,
    //#endif
    jpf.Presentation
);

// #endif
