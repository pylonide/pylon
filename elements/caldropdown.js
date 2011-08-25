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

// #ifdef __AMLCALDROPDOWN || __INC_ALL
/**
 * Element displaying a calendar, ordered by week. It allows the user to choose 
 * the month and year for which to display the days. Calendar returns a date 
 * in chosen date format. Minimal size of calendar is 150px.
 * 
 * Remarks:
 * The language variables possible to use of this component:
 * <groups>
 *     <english id="sub">
 *         <group id="caldropdown">
 *             <key id="shortToday">T</key>
 *             <key id="today">Today</key>
 *         </group>
 *     </english>
 * </groups>
 * 
 * @constructor
 * @define caldropdown
 * @addnode elements
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 * 
 * @inherits apf.DataAction
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * 
 * @attribute {String}   output-format    the format of the returned date; See {@link term.dateformat more about the date format}.
 * @attribute {String}   caption-format   the format of the displayed date. Default is yyyy-mm-dd. See {@link term.dateformat more about the date format}. 
 * @attribute {String}   default          the default date set when the calendar is opened.
 *     Possible values:
 *     today   calendar is set on today's date
 * @attribute {String}   value            the date returned by calendar; should be in the format specified by the output-format attribute.
 *
 * @event slidedown Fires when the calendar slides open.
 *   cancelable: Prevents the calendar from sliding open
 * @event slideup   Fires when the calendar slides up.
 *   cancelable: Prevents the calendar from sliding up
 *
 * Example:
 * Calendar component with date set on "Saint Nicholas Day" in iso date format
 * <code>
 *  <a:caldropdown 
 *    top           = "200" 
 *    left          = "400" 
 *    output-format = "yyyy-mm-dd" 
 *    value         = "2008-12-06" />
 * </code>
 * 
 * Example:
 * Sets the date based on data loaded into this component.
 * <code>
 *  <a:model id="mdlCalDD">
 *       <data date="2009-11-25" />
 *  </a:model>
 *  <a:caldropdown 
 *    output-format = "yyyy-mm-dd" 
 *    model         = "mdlCalDD" 
 *    value         = "[@date]" />
 * </code>
 */

apf.caldropdown = function(struct, tagName){
    this.$animType        = 1;
    this.$animSteps       = 5;
    this.$animSpeed       = 20;
    this.$itemSelectEvent = "onmouseup";

    /**** Properties and Attributes ****/

    this.dragdrop      = false;
    this.reselectable  = true;
    this.$focussable   = true;
    this.autoselect    = false;
    this.multiselect   = false;

    this.outputFormat  = "yyyy-mm-dd";
    this.captionFormat = "yyyy-mm-dd";

    this.$sliderHeight = 0;
    this.isOpen        = false;

    this.$calVars      = {
        day          : null,
        month        : null,
        year         : null,
        hours        : 1,
        minutes      : 0,
        seconds      : 0,
        currentMonth : null,
        currentYear  : null,
        numberOfDays : null,
        dayNumber    : null,
        
        days         : ["Sunday", "Monday", "Tuesday", "Wednesday",
                        "Thursday", "Friday", "Saturday"],
        months       : [{name : "January",   number : 31},
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
                        {name : "December",  number : 31}]
    };
    
    this.$init(tagName || "caldropdown", apf.NODE_VISIBLE, struct);
};

(function() {
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
        //#ifdef __WITH_DATABINDING
        //,apf.StandardBinding
        //#endif
        //#ifdef __WITH_XFORMS
        //,apf.XForms
        //#endif
    );

    this.$supportedProperties.push("initial-message", "output-format",
                                   "default", "caption-format", "value");

    /**
     * @attribute {String} initial-message the message displayed by this element
     * when it doesn't have a value set. This property is inherited from parent
     * nodes. When none is found it is looked for on the appsettings element.
     *
     * @attribute {String} output-format style of returned date
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
        this.outputFormat = value;
    }

    /**
     * @attribute {String} caption-format style of returned date
     * 
     * Possible values
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
    this.$propHandlers["caption-format"] = function(value) {
        if (this.value) {
            var c = this.$calVars;
            this.$setLabel(new Date(c.year, c.month, c.day, c.hours,
                c.minutes, c.seconds).format(this.captionFormat = value));
        }
        else
            this.captionFormat = value;
    }

    this.$propHandlers["value"] = function(value) {
        var c = this.$calVars;
        var outputFormat = this.getAttribute("output-format");
        
        if (outputFormat !== null && outputFormat != this.outputFormat) {
            this.outputFormat = outputFormat;
        }

        if (!value) {
            this.$setLabel();
            return;
        }

        var date = apf.date.getDateTime(value, this.outputFormat);

        //#ifdef __DEBUG
        if (!date || isNaN(date)) {
            return;
            /*throw new Error(apf.formErrorString(this, "Parsing date",
                "Invalid date: " + value));*/
        }
        //#endif

        c.day     = date.getDate();
        c.month   = date.getMonth();
        c.year    = date.getFullYear();
        c.hours   = date.getHours();
        c.minutes = date.getMinutes();
        c.seconds = date.getSeconds();

        this.value = value;
        this.$setLabel(new Date(c.year, c.month, c.day, c.hours,
            c.minutes, c.seconds).format(this.captionFormat));
        this.redraw(c.month, c.year);
    }
    
    //#ifdef __WITH_CONVENIENCE_API
    /**
     * @method  
     * 
     * @return {String} date indicated by calendar
     */
    this.getValue = function(){
        return this.value;
    }
    
    /**
     * @method  Sets calendar date
     */
    this.setValue = function(value){
        this.setProperty("value", value, false, true);
    }
    //#endif
    
    /**** Keyboard Handling ****/

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        e = e || event;

        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            c        = this.$calVars;

        switch (key) {
            case 13: /* enter */
                this.selectDay(c.day);
                this.slideUp();
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
                    if (c.day - 1 < 1) {
                        this.prevMonth();
                        this.selectDay(c.months[c.currentMonth].number);
                    }
                    else {
                        this.selectDay(c.day - 1);
                    }
                }
                break;

            case 38: /* up arrow */
                if (ctrlKey)
                    this.slideUp();
                else {
                    if (c.day - 7 < 1) {
                        this.prevMonth();
                        this.selectDay(c.months[c.currentMonth].number + c.day - 7);
                    }
                    else {
                        this.selectDay(c.day - 7);
                    }
                }
                break;

            case 39: /* right arrow */
                if (ctrlKey)
                    this.nextMonth();
                else if (shiftKey)
                    this.nextYear();
                else
                    this.selectDay(c.day + 1);
                break;

            case 40: /* down arrow */
                if (ctrlKey)
                    this.slideDown(e);
                else
                    this.selectDay(c.day + 7);
                break;

            case 84:
                if (ctrlKey)
                    this.today();
                    return false;
                break;
        }
    }, true);
    //#endif

    /**** Public methods ****/

    /**
     * Toggles the visibility of the container with the calendar. It opens
     * or closes container using a slide effect.
     */
    this.slideToggle = function(e, userAction) {
        if (!e) e = event;
        if (userAction && this.disabled)
            return;

        if (this.isOpen)
            this.slideUp();
        else
            this.slideDown(e);
    };

    /**
     * Shows the container with the list elements using a slide effect.
     */
    this.slideDown = function(e) {

        if (this.dispatchEvent("slidedown") === false)
            return false;

        this.isOpen = true;

        this.oSlider.style.display = "block";
        this.oSlider.style[apf.supportOverflowComponent
            ? "overflowY"
            : "overflow"] = "hidden";

        this.oSlider.style.display = "";
        this.$setStyleClass(this.$ext, this.$baseCSSname + "Down");

        this.oSlider.style.height = (this.$sliderHeight > 0
            ? this.$sliderHeight - 1
            : 0) + "px";

        this.oSlider.style.width  = (this.$ext.offsetWidth > 0
            ? this.$ext.offsetWidth - 1
            : 0) + "px";

        apf.caldropdown.cache["oSlider"].host = this;

        this.redraw(this.$calVars.month, this.$calVars.year);

        apf.popup.show(this.$uniqueId, {
            x       : 0,
            y       : this.$ext.offsetHeight,
            animate : true,
            ref     : this.$ext,
            width   : this.$ext.offsetWidth + 1,
            height  : this.$sliderHeight,
            callback: function(container) {
                container.style[apf.supportOverflowComponent
                    ? "overflowY"
                    : "overflow"] = "hidden";
            }
        });
    };
    
    this.$getPageScroll = function() {
        return [
            document.documentElement.scrollLeft || document.body.scrollLeft,
            document.documentElement.scrollTop || document.body.scrollTop
        ];
    }

    /**
     * Hides the container with the calendar using a slide effect.
     */
    this.slideUp = function() {
        /*if (!this.isOpen) return false;*/
        if (this.dispatchEvent("slideup") === false) return false;

        this.isOpen = false;
        if (this.selected) {
            var htmlNode = apf.xmldb.findHtmlNode(this.selected, this);
            if (htmlNode) this.$setStyleClass(htmlNode, '', ["hover"]);
        }

        this.$setStyleClass(this.$ext, '', [this.$baseCSSname + "Down"]);
        apf.popup.hide();
        return false;
    };

    /**** Private methods and event handlers ****/

    this.$setLabel = function(value) {
        this.oLabel.innerHTML = value || this["initial-message"] || "";

        this.$setStyleClass(this.$ext, value ? "" : this.$baseCSSname + "Initial",
            [!value ? "" : this.$baseCSSname + "Initial"]);
    };

    this.addEventListener("afterselect", function(e) {
        if (!e) e = event;

        this.slideUp();
        if (!this.isOpen)
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Over"]);

        this.$setLabel(e.selection.length
            ? this.$applyBindRule("value", this.selected)
            : "")

        //#ifdef __AMLSUBMITFORM || __INC_ALL
        if (this.hasFeature(apf.__VALIDATION__) && this.form) {
            this.validate(true);
        }
        //#endif
    });

    // Private functions
    this.$blur = function() {
        this.slideUp();
        //this.$ext.dispatchEvent("mouseout")
        if (!this.isOpen)
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Over"])
        //if(this.$ext.onmouseout) this.$ext.onmouseout();

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);
    };

    this.$focus = function(){
        apf.popup.forceHide();
        this.$setStyleClass(this.oFocus || this.$ext, this.$baseCSSname + "Focus");
    }

    this.$setClearMessage = function(msg) {
        if (msg)
            this.$setLabel(msg);
    };

    this.$removeClearMessage = function() {
        this.$setLabel("");
    };

    //#ifdef __AMLSUBMITFORM || __INC_ALL
    this.addEventListener("slidedown", function() {
        //THIS SHOULD BE UPDATED TO NEW SMARTBINDINGS
        if (!this.form || !this.form.xmlActions || this.xmlRoot)
            return;
        var loadlist = this.form.xmlActions
            .selectSingleNode("LoadList[@element='" + this.name + "']");
        if (!loadlist) return;

        this.form.processLoadRule(loadlist, true, [loadlist]);

        return false;
    });
    //#endif

    this.addEventListener("popuphide", this.slideUp);

    var isLeapYear = function(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)
            ? true
            : false;
    };

    this.redraw = function(month, year) {
        var c = this.$calVars;
        c.currentMonth = month;
        c.currentYear  = year;

        var _width     = apf.caldropdown.cache["oSlider"].host.$ext.offsetWidth,
            temp       = Math.floor((_width - 36) / 8) * 8 + 32 
                         - apf.getDiff(this.oNavigation)[0],
            w_days     = new Date(year, 0, 1).getDay();

        if (temp >= 0)
            this.oNavigation.style.width = temp + "px";

        //var w_firstYearDay = new Date(year, 0, 1);
        //var w_dayInWeek    = w_firstYearDay.getDay();

        for (i = 0; i <= month; i++) {
            if (isLeapYear(year) && i == 1)
                w_days++;
            w_days += c.months[i].number;
        }

        var w_weeks = Math.ceil(w_days / 7),
            date    = new Date(year, month);

        c.numberOfDays = c.months[date.getMonth()].number;
        if (isLeapYear(year) && date.getMonth() == 1)
            c.numberOfDays++;

        c.dayNumber = new Date(year, month, 1).getDay();
        var prevMonth     = month == 0 ? 11 : month - 1,
            prevMonthDays = c.months[prevMonth].number - c.dayNumber + 1,
            nextMonthDays = 1,
            rows = this.oNavigation.childNodes,
            cells,
            y;

        for (i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("today") != -1) {
                if (_width < 300) {
                    var shortTodayText = apf.language.getWord("sub.calendar.shortToday") || "T";
                    rows[i].innerHTML   = shortTodayText;
                    rows[i].style.width = "8px";
                    rows[i].setAttribute("title", shortTodayText);
                }
                else {
                    var TodayText = apf.language.getWord("sub.calendar.today") || "Today";
                    rows[i].innerHTML   = TodayText;
                    rows[i].style.width = "32px";
                    rows[i].setAttribute("title", TodayText);
                }
            }
            else if ((rows[i].className || "").indexOf("status") != -1) {
                if (_width >= 300)
                    rows[i].innerHTML = c.months[c.currentMonth].name
                                      + " " + c.currentYear;
                else {
                    rows[i].innerHTML = (c.currentMonth + 1) + "/" + c.currentYear;
                }
            }
        }

        this.$sliderHeight = 22; //navigators bar height
        temp = Math.floor((_width - 37) / 8);
        var squareSize = temp > 0 ? temp : 0;

        var daysofweek   = this.oDow.childNodes,
            d_height     = Math.floor(squareSize / 4 + 6),
            d_paddingTop = Math.floor(squareSize / 4 - 8) > 0
                ? Math.floor(squareSize / 4 - 8)
                : 0,
            d_fontSize   = _width < 150 ? "6px" : (_width <= 220 ? "9px" : "11px"),
            d_width      = (squareSize * 8 + 32);

        this.oDow.style.width = d_width + "px";

        this.$sliderHeight += d_height + d_paddingTop;

        for (var z = 0, i = 0; i < daysofweek.length; i++) {
            if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {
                daysofweek[i].style.width      = squareSize   + "px";
                daysofweek[i].style.height     = d_height     + "px";
                daysofweek[i].style.paddingTop = d_paddingTop + "px";
                daysofweek[i].style.fontSize   = d_fontSize;

                if (z > 0) {
                    daysofweek[i].innerHTML = c.days[z - 1].substr(0, 3);
                }
                z++;
            }
        }

        var c_height     = Math.floor((squareSize + 12) / 2),
            c_paddingTop = squareSize - c_height > 0
                ? squareSize - c_height
                : 0;

        rows = this.oSlider.childNodes;
        for (z = 0, y = 0, i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("row") == -1)
                continue;

            rows[i].style.width = (d_width - apf.getDiff(rows[i])[0]) + "px";
            if (!apf.isGecko) {
                rows[i].style.paddingTop = "1px";
            }

            this.$sliderHeight += (squareSize + 5);

            cells = rows[i].childNodes;
            for (var j = 0, disabledRow = 0; j < cells.length; j++) {
                if ((cells[j].className || "").indexOf("cell") == -1)
                    continue;
                z++;
                cells[j].style.width      = squareSize   + "px";
                cells[j].style.height     = c_height     + "px";
                cells[j].style.paddingTop = c_paddingTop + "px";

                cells[j].style.margin = z%8 == 0 && z !== 1
                    ? "1px 0 1px 0"
                    : "1px 2px 1px 0";

                this.$setStyleClass(cells[j], "", ["weekend", "disabled",
                    "active", "prev", "next", "weeknumber"]);

                if ((z - 1) % 8 == 0) {
                    cells[j].innerHTML = w_weeks
                        - Math.ceil((c.months[c.currentMonth].number + c.dayNumber) / 7)
                        + 1 + (z - 1) / 8;
                    this.$setStyleClass(cells[j], "weeknumber");
                }
                else {
                    y++;
                    if (y <= c.dayNumber) {
                        cells[j].innerHTML = prevMonthDays++;
                        this.$setStyleClass(cells[j], "disabled prev");
                    }
                    else if (y > c.dayNumber && y <= c.numberOfDays + c.dayNumber) {
                        cells[j].innerHTML = y - c.dayNumber;

                        var dayNrWeek = new Date(year, month,
                                                 y - c.dayNumber).getDay();

                        if (dayNrWeek == 0 || dayNrWeek == 6) {
                            this.$setStyleClass(cells[j], "weekend");
                        }

                        if (month == c.month && year == c.year
                          && y - c.dayNumber == c.day) {
                            this.$setStyleClass(cells[j], "active");
                        }
                    }
                    else if (y > c.numberOfDays + c.dayNumber) {
                        cells[j].innerHTML = nextMonthDays++;
                        this.$setStyleClass(cells[j], "disabled next");
                        disabledRow++;
                    }
                }
            }

            rows[i].style.visibility = disabledRow == 7
                ? "hidden"
                : "visible";
        }
    };

    /**
     * Selects date and highlights its cell in calendar component
     *
     * @param {Number}   nr     day number
     * @param {String}   type   class name of html representation of selected cell
     */
    this.selectDay = function(nr, type) {
        var c = this.$calVars,
            newMonth = type == "prev"
                ? c.currentMonth
                : (type == "next"
                    ? c.currentMonth + 2
                    : c.currentMonth + 1),
            newYear = c.currentYear;

        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        else if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }

        apf.caldropdown.cache["oSlider"].host.change(new Date(newYear, (newMonth - 1), nr, c.hours,
            c.minutes, c.seconds).format(this.outputFormat));
    };

    /**
     * Change displayed year to next one
     */
    this.nextYear = function() {
        this.redraw(this.$calVars.currentMonth, this.$calVars.currentYear + 1);
    };

    /**
     * Change displayed year to previous one
     */
    this.prevYear = function() {
        this.redraw(this.$calVars.currentMonth, this.$calVars.currentYear - 1);
    };

    /**
     * Change displayed month to next one. If actual month is December, function
     * change current displayed year to next one
     */
    this.nextMonth = function() {
        var newMonth, newYear,
            c = this.$calVars;
        if (c.currentMonth > 10) {
            newMonth = 0;
            newYear  = c.currentYear + 1;
        }
        else {
            newMonth = c.currentMonth + 1;
            newYear  = c.currentYear;
        }

        this.redraw(newMonth, newYear);
    };

    /**
     * Change displayed month to previous one. If actual month is January, 
     * function change current displayed year to previous one
     */
    this.prevMonth = function() {
        var newMonth, newYear,
            c = this.$calVars;
        if (c.currentMonth < 1) {
            newMonth = 11;
            newYear  = c.currentYear - 1;
        }
        else {
            newMonth = c.currentMonth - 1;
            newYear  = c.currentYear;
        }

        this.redraw(newMonth, newYear);
    };
    
    /**
     * Select today's date in calendar component
     */
    this.nextDay = function() {
        var c = this.$calVars;
        //this.change(
        this.$propHandlers["value"].call(this, new Date(c.year, c.month, c.day + 1, 0, 0, 0).format(this.outputFormat));
    };
    
    this.previousDay = function() {
        var c = this.$calVars;
        //this.change(
        this.$propHandlers["value"].call(this, new Date(c.year, c.month, c.day - 1, 0, 0, 0).format(this.outputFormat));
    };

    /**
     * Select today's date in calendar component
     */
    this.today = function() {
        //this.change
        this.$propHandlers["value"].call(this, new Date().format(this.outputFormat));
    };

    /**** Init ****/

    this.$draw = function() {
        this.$getNewContext("main");
        this.$getNewContext("container");

        this.$animType = this.$getOption("main", "animtype") || 1;
        this.clickOpen = this.$getOption("main", "clickopen") || "button";

        //Build Main Skin
        this.$ext = this.$getExternal(null, null, function(oExt) {
            oExt.setAttribute("onmouseover", 
                'var o = apf.lookup(' + this.$uniqueId + ');\
                 o.$setStyleClass(o.$ext, o.$baseCSSname + "Over", null, true);');
            oExt.setAttribute("onmouseout", 
                'var o = apf.lookup('+ this.$uniqueId + ');\
                 if (o.isOpen) return;\
                 o.$setStyleClass(o.$ext, "", [o.$baseCSSname + "Over"], true);');

            //Button
            var oButton = this.$getLayoutNode("main", "button", oExt);
            if (oButton) {
                oButton.setAttribute("onmousedown",
                    'apf.lookup(' + this.$uniqueId + ').slideToggle(event, true);');
            }

            //Label
            var oLabel  = this.$getLayoutNode("main", "label", oExt);
            if (this.clickOpen == "both") {
                oLabel.parentNode.setAttribute("onmousedown", 'apf.lookup('
                    + this.$uniqueId + ').slideToggle(event, true);');
            }
        });
        this.oLabel     = this.$getLayoutNode("main", "label", this.$ext);
        
        if (this.oLabel.nodeType == 3)
            this.oLabel = this.oLabel.parentNode;

        this.oIcon      = this.$getLayoutNode("main", "icon", this.$ext);
        if (this.$button)
            this.$button = this.$getLayoutNode("main", "button", this.$ext);

        if (apf.caldropdown.cache) {
            var cal          = apf.caldropdown.cache;
            this.oSlider     = cal["oSlider"];
            this.oNavigation = cal["oNavigation"];
            this.oDow        = cal["oDow"];

            apf.caldropdown.cache.refcount++;

            //Set up the popup
            this.$pHtmlDoc = apf.popup.setContent(this.$uniqueId, this.oSlider,
            apf.skins.getCssString(this.skinName));
        }
        else {
            this.oSlider = this.$getExternal("container", null, function(oExt1) {
                var i, oSlider = this.$getLayoutNode("container", "contents", oExt1);
    
                for (i = 0; i < 6; i++) {
                    this.$getNewContext("row");
                    var oRow = oSlider.appendChild(this.$getLayoutNode("row"));
    
                    for (var j = 0; j < 8; j++) {
                        this.$getNewContext("cell");
                        var oCell = this.$getLayoutNode("cell");
                        if (j > 0) {
                            oCell.setAttribute("onmouseout",
                                "apf.lookup(" + this.$uniqueId 
                                + ").$setStyleClass(this, '', ['hover'], true);");
                            oCell.setAttribute("onmouseover",
                                "if (this.className.indexOf('disabled') > -1 \
                                   || this.className.indexOf('active') > -1) \
                                     return;\
                                 apf.lookup(" + this.$uniqueId 
                                 + ").$setStyleClass(this, 'hover', null, true);");
                            oCell.setAttribute("onmousedown",
                                "var o = apf.lookup(" + this.$uniqueId + ");\
                                 if (o.disabled) return;\
                                 if (this.className.indexOf('prev') > -1) \
                                     o.selectDay(this.innerHTML, 'prev');\
                                 else if (this.className.indexOf('next') > -1) \
                                     o.selectDay(this.innerHTML, 'next');\
                                 else \
                                     o.selectDay(this.innerHTML);\
                                 o.slideUp();");
                        }
                        oRow.appendChild(oCell);
                    }
                }
    
                var oNavigation = this.$getLayoutNode("container", "navigation",
                                                      oExt1);
    
                if (oNavigation) {
                    var buttons = ["prevYear", "prevMonth", "nextYear", "nextMonth",
                                   "today", "status"];
                    for (i = 0; i < buttons.length; i++) {
                        this.$getNewContext("button");
                        var btn = oNavigation.appendChild(this.$getLayoutNode("button"));
                        this.$setStyleClass(btn, buttons[i]);
                        if (buttons[i] !== "status") {
                            btn.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId 
                                + '); if (o.disabled) return; o.' 
                                + buttons[i] + '();apf.setStyleClass(this, "down");');
                            btn.setAttribute("onmouseup", 'apf.lookup(' + this.$uniqueId 
                                + ').$setStyleClass(this, "", ["down"], true);');
                            btn.setAttribute("onmouseover", 'apf.lookup(' + this.$uniqueId 
                                + ').$setStyleClass(this, "hover", null, true);');
                            btn.setAttribute("onmouseout",  'apf.lookup(' + this.$uniqueId 
                                + ').$setStyleClass(this, "", ["hover"], true);');
                        }
                    }
                }
    
                var oDaysOfWeek = this.$getLayoutNode("container",
                                                      "daysofweek", oExt1);
    
                for (i = 0; i < this.$calVars.days.length + 1; i++) {
                    this.$getNewContext("day");
                    oDaysOfWeek.appendChild(this.$getLayoutNode("day"));
                }
            });
    
            this.oNavigation = this.$getLayoutNode("container", "navigation", this.oSlider);
            this.oDow        = this.$getLayoutNode("container", "daysofweek", this.oSlider);
        }

        

        //Set up the popup
        this.$pHtmlDoc    = apf.popup.setContent(this.$uniqueId, this.oSlider,
            apf.skins.getCssString(this.skinName));

        document.body.appendChild(this.oSlider);

        //Get Options form skin
        //Types: 1=One dimensional List, 2=Two dimensional List
        this.listtype    = parseInt(this.$getLayoutNode("main", "type")) || 1;

        if (!apf.caldropdown.cache) {
            apf.caldropdown.cache = {
                "oSlider"     : this.oSlider,
                "oNavigation" : this.oNavigation,
                "oDow"        : this.oDow
            };
            apf.caldropdown.cache.refcount = 0;
        }
    };

    this.$loadAml = function(x) {
        var date, c = this.$calVars;

        if (typeof this.value == "undefined") {
            switch(this["default"]) {
                case "today":
                    //this.setProperty("value", 
                    this.$propHandlers["value"].call(this, new Date().format(this.outputFormat));
                    break;
                default :
                    date =  new Date();
                    c.day   = 0;
                    c.month = date.getMonth();
                    c.year  = date.getFullYear();

//                    if (!this.selected && this["initial-message"])
                        this.$setLabel();
                    break;
            }
        }
        else {
            date = apf.date.getDateTime(this.value, this.outputFormat);
            c.day   = date.getDate();
            c.month = date.getMonth();
            c.year  = date.getFullYear();

            if (c.day && c.month && c.year) {
                //this.setProperty("value", 
                this.$propHandlers["value"].call(this, new Date(c.year, c.month, c.day, c.hours,
                    c.minutes, c.seconds).format(this.outputFormat));
            }
        }
    };

    this.$destroy = function() {
        apf.popup.removeContent(this.$uniqueId);
        apf.destroyHtmlNode(this.oSlider);
        this.oSlider = null;

        if (apf.caldropdown.cache) {
            if (apf.caldropdown.cache.refcount == 0)
                apf.caldropdown.cache = null;
            else
                apf.caldropdown.cache.refcount--;
        }
    };
}).call(apf.caldropdown.prototype = new apf.StandardBinding());

apf.config.$inheritProperties["initial-message"] = 1;

apf.aml.setElement("caldropdown", apf.caldropdown);
// #endif
