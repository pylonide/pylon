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

// #ifdef __JCALDROPDOWN || __INC_ALL
/**
 * Element displaying a list of day numbers in a grid, ordered by week. It
 * allows the user to choose the month and year for which to display the days.
 * Calendar returns a date in chosen date format. Minimal size of calendar is
 * 150px.
 * 
 * @constructor
 * @define caldropdown
 * @addnode elements
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 * 
 * @inherits apf.Presentation
 * @inherits apf.DataBinding
 * @inherits apf.Validation
 * @inherits apf.XForms
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * 
 * @attribute {String}   output-format    the format of the date value. See {@link term.dateformat more about the date format}.
 * @attribute {String}   caption-format   the format of the displayed date. Default yyyy-mm-dd. See {@link term.dateformat more about the date format}. 
 * @attribute {String}   default          the default date set when the calendar is opened.
 *     Possible values:
 *     today   calendar is set on today's date
 * @attribute {String}   value            the date returned by calendar; should be in the format specified by the output-format attribute.
 *
 * @event slidedown Fires when the calendar slides open.
 *   cancellable: Prevents the calendar from sliding open
 * @event slideup   Fires when the calendar slides up.
 *   cancellable: Prevents the calendar from sliding up
 *
 * Example:
 * Calendar component with date set on "Saint Nicholas Day" in iso date format
 * <code>
 * <a:caldropdown top="200" left="400" output-format="yyyy-mm-dd" value="2008-12-06"></a:caldropdown>
 * </code>
 * 
 * Example:
 * Sets the date based on data loaded into this component.
 * <code>
 * <a:caldropdown>
 *     <a:bindings>
 *         <a:value select="@date" />
 *     </a:bindings>
 * </a:caldropdown>
 * </code>
 * 
 * Example:
 * A shorter way to write this is:
 * <code>
 * <a:caldropdown ref="@date" />
 * </code>
 */
apf.caldropdown = apf.component(apf.NODE_VISIBLE, function() {
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

    this.outputFormat  = null;
    this.captionFormat = "yyyy-mm-dd";

    this.sliderHeight  = 0;

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

    this.$supportedProperties.push("initial-message", "output-format",
                                   "default", "caption-format", "value");

    /**
     * @attribute {String} initial-message the message displayed by this element
     * when it doesn't have a value set. This property is inherited from parent
     * nodes. When none is found it is looked for on the appsettings element.
     */
    this.$propHandlers["initial-message"] = function(value) {
        this.initialMsg = value
            || apf.getInheritedAttribute(this.$aml, "intial-message");
    };

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
            this.setProperty("value", new Date(_year, _month, _day, _hours,
                _minutes, _seconds).format(this.outputFormat = value));
        }
        else
            this.outputFormat = value;
    }

    /**
     * @attribute {String} style of returned date
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
            this.$setLabel(new Date(_year, _month, _day, _hours,
                _minutes, _seconds).format(this.captionFormat = value));
        }
        else
            this.captionFormat = value;
    }

    this.$propHandlers["value"] = function(value) {
        if (!this.outputFormat) {
            _temp = value;
            return;
        }

        if (!value) {
            this.$setLabel();
            return;
        }

        var date = Date.parse(value, this.outputFormat);

        //#ifdef __DEBUG
        if (!date || !date.getFullYear()) {
            throw new Error(apf.formErrorString(this, "Parsing date",
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
        this.$setLabel(new Date(_year, _month, _day, _hours,
            _minutes, _seconds).format(this.captionFormat));
        this.redraw(_month, _year);
    }
    
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
        this.setProperty("value", value);
    }
    
    /**** Keyboard Handling ****/

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        e = e || event;

        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey;

        switch (key) {
            case 13: /* enter */
                this.selectDay(_day);
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
                if (ctrlKey)
                    this.slideUp();
                else {
                    if (_day - 7 < 1) {
                        this.prevMonth();
                        this.selectDay(months[_currentMonth].number + _day - 7);
                    }
                    else {
                        this.selectDay(_day - 7);
                    }
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
                if (ctrlKey)
                    this.slideDown(e);
                else
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

    /**** Public methods ****/

    /**
     * Toggles the visibility of the container with the calendar. It opens
     * or closes it using a slide effect.
     */
    this.slideToggle = function(e) {
        if (!e) e = event;

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
        this.$setStyleClass(this.oExt, this.baseCSSname + "Down");

        this.oSlider.style.height = (this.sliderHeight > 0
            ? this.sliderHeight - 1
            : 0) + "px";

        this.oSlider.style.width  = (this.oExt.offsetWidth > 0
            ? this.oExt.offsetWidth - 1
            : 0) + "px";

        apf.caldropdown.cache["oSlider"].host = this;

        this.redraw(_month, _year);

        apf.popup.show(this.uniqueId, {
            x       : 0,
            y       : this.oExt.offsetHeight,
            animate : true,
            ref     : this.oExt,
            width   : this.oExt.offsetWidth + 1,
            height  : this.sliderHeight,
            callback: function(container) {
                container.style[apf.supportOverflowComponent
                    ? "overflowY"
                    : "overflow"] = "hidden";
            }
        });
    };

    /**
     * Hides the container with the calendar using a slide effect.
     */
    this.slideUp = function() {
        if (this.isOpen == 2) return false;
        if (this.dispatchEvent("slideup") === false) return false;

        this.isOpen = false;
        if (this.selected) {
            var htmlNode = apf.xmldb.findHtmlNode(this.selected, this);
            if (htmlNode) this.$setStyleClass(htmlNode, '', ["hover"]);
        }

        this.$setStyleClass(this.oExt, '', [this.baseCSSname + "Down"]);
        apf.popup.hide();
        return false;
    };

    /**** Private methods and event handlers ****/

    this.$setLabel = function(value) {
        this.oLabel.innerHTML = value || this.initialMsg || "";

        this.$setStyleClass(this.oExt, value ? "" : this.baseCSSname + "Initial",
            [!value ? "" : this.baseCSSname + "Initial"]);
    };

    this.addEventListener("afterselect", function(e) {
        if (!e) e = event;

        this.slideUp();
        if (!this.isOpen)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Over"]);

        this.$setLabel(this.applyRuleSetOnNode("value", this.selected))

        //#ifdef __WITH_MULTIBINDING
        this.$updateOtherBindings();
        //#endif

        //#ifdef __JSUBMITFORM || __INC_ALL
        if (this.hasFeature(__VALIDATION__) && this.form) {
            this.validate(true);
        }
        //#endif
    });

    this.addEventListener("afterdeselect", function() {
        this.$setLabel("");
    });

    function setMaxCount() {
        if (this.isOpen == 2)
            this.slideDown();
    }

    //#ifdef __WITH_MULTIBINDING
    //For MultiBinding
    this.$showSelection = function(value) {
        //Set value in Label
        var bc = this.$getMultiBind();

        //Only display caption when a value is set
        if (value === undefined) {
            var sValue2,
                sValue = bc.applyRuleSetOnNode("value", bc.xmlRoot, null, true);
            if (sValue)
                sValue2 = bc.applyRuleSetOnNode("caption", bc.xmlRoot, null, true);

            if (!sValue2 && this.xmlRoot && sValue) {
                var rule    = this.getBindRule(this.mainBind).getAttribute("select");

                var xpath   = this.traverse + "[" + rule + "='"
                    + sValue.replace(/'/g, "\\'") + "']";

                var xmlNode = this.xmlRoot.selectSingleNode(xpath);
                value       = this.applyRuleSetOnNode("caption", xmlNode);
            }
            else {
                value = sValue2 || sValue;
            }
        }
    };

    //I might want to move this method to the MultiLevelBinding baseclass
    this.$updateOtherBindings = function() {
        if (!this.multiselect) {
            // Set Caption bind
            var bc = this.$getMultiBind(), caption;
            if (bc && bc.xmlRoot && (caption = bc.bindingRules["caption"])) {
                var xmlNode = apf.createNodeFromXpath(bc.xmlRoot,
                    bc.bindingRules["caption"][0].getAttribute("select"));
                if (!xmlNode)
                    return;

                apf.setNodeValue(xmlNode,
                    this.applyRuleSetOnNode("caption", this.selected));
            }
        }
    };
    //#endif

    // Private functions
    this.$blur = function() {
        this.slideUp();
        //this.oExt.dispatchEvent("mouseout")
        if (!this.isOpen)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Over"])
        //if(this.oExt.onmouseout) this.oExt.onmouseout();

        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    };

    this.$focus = function(){
        apf.popup.forceHide();
        this.$setStyleClass(this.oFocus || this.oExt, this.baseCSSname + "Focus");
    }

    this.$setClearMessage = function(msg) {
        if (msg) {
            this.$setLabel(msg);
        }
    };

    this.$removeClearMessage = function() {
        this.$setLabel("");
    };

    //#ifdef __JSUBMITFORM || __INC_ALL
    this.addEventListener("slidedown", function() {
        //THIS SHOULD BE UPDATED TO NEW SMARTBINDINGS
        if (!this.form || !this.form.xmlActions || this.xmlRoot)
            return;
        var loadlist = this.form.xmlActions
            .selectSingleNode("LoadList[@element='" + this.name + "']");
        if (!loadlist) return;

        this.isOpen = 2;
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
        _currentMonth = month;
        _currentYear  = year;
        var _width    = this.oExt.offsetWidth;

        var temp      = Math.floor((_width - 36) / 8) * 8 + 32 - apf.getDiff(this.oNavigation)[0];

        if (temp >= 0)
            this.oNavigation.style.width = temp + "px";

        //var w_firstYearDay = new Date(year, 0, 1);
        //var w_dayInWeek    = w_firstYearDay.getDay();
        var w_days         = new Date(year, 0, 1).getDay();

        for (i = 0; i <= month; i++) {
            if (isLeapYear(year) && i == 1)
                w_days++;
            w_days += months[i].number;
        }

        var w_weeks = Math.ceil(w_days / 7),
            date    = new Date(year, month);

        _numberOfDays = months[date.getMonth()].number;
        if (isLeapYear(year) && date.getMonth() == 1)
            _numberOfDays++;

        _dayNumber = new Date(year, month, 1).getDay();
        var prevMonth     = month == 0 ? 11 : month - 1,
            prevMonthDays = months[prevMonth].number - _dayNumber + 1,
            nextMonthDays = 1,
            rows = this.oNavigation.childNodes,
            cells,
            y;

        for (i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("today") != -1) {
                if (_width < 300) {
                    rows[i].innerHTML   = "T";
                    rows[i].style.width = "8px";
                }
                else {
                    rows[i].innerHTML   = "Today";
                    rows[i].style.width = "32px";
                }
            }
            else if ((rows[i].className || "").indexOf("status") != -1) {
                if (_width >= 300)
                    rows[i].innerHTML = months[_currentMonth].name
                                      + " " + _currentYear;
                else {
                    rows[i].innerHTML = (_currentMonth + 1) + "/" + _currentYear;
                }
            }
        }

        this.sliderHeight = 22; //navigators bar height
        temp = Math.floor((_width - 37) / 8);
        var squareSize = temp > 0 ? temp : 0;

        var daysofweek   = this.oDow.childNodes,
            d_height     = Math.floor(squareSize / 4 + 6),
            d_paddingTop = Math.floor(squareSize / 4 - 8) > 0
                ? Math.floor(squareSize / 4 - 8)
                : 0,
            d_fontSize   = _width  <= 220 ? "9px" : "11px",
            d_width      = (squareSize * 8 + 32);


        this.oDow.style.width = d_width + "px";

        this.sliderHeight += d_height + d_paddingTop;

        for (var z = 0, i = 0; i < daysofweek.length; i++) {
            if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {
                daysofweek[i].style.width      = squareSize   + "px";
                daysofweek[i].style.height     = d_height     + "px";
                daysofweek[i].style.paddingTop = d_paddingTop + "px";
                daysofweek[i].style.fontSize   = d_fontSize;

                if (z > 0) {
                    daysofweek[i].innerHTML = days[z - 1].substr(0, 3);
                }
                z++;
            }
        }

        var c_height     = Math.floor((squareSize + 12) / 2);
        var c_paddingTop = squareSize - c_height > 0
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

            this.sliderHeight += (squareSize + 5);

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

                        var dayNrWeek = new Date(year, month,
                                                 y - _dayNumber).getDay();

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

            rows[i].style.visibility = disabledRow == 7
                ? "hidden"
                : "visible";
        }
    };

    /**
     * Change choosen date with selected and highlight its cell on calendar
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

        this.change(new Date(newYear, (newMonth - 1), nr, _hours,
            _minutes, _seconds).format(this.outputFormat));
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
        //this.setProperty("value", new Date().format(this.outputFormat));
        this.change(new Date().format(this.outputFormat));
    };

    /**** Init ****/

    this.$draw = function() {
        this.$getNewContext("main");
        this.$getNewContext("container");

        this.$animType = this.$getOption("main", "animtype") || 1;
        this.clickOpen = this.$getOption("main", "clickopen") || "button";

        //Build Main Skin
        this.oExt      = this.$getExternal(null, null, function(oExt) {
            oExt.setAttribute("onmouseover", 
                'var o = apf.lookup(' + this.uniqueId + ');\
                 o.$setStyleClass(o.oExt, o.baseCSSname + "Over");');
            oExt.setAttribute("onmouseout", 
                'var o = apf.lookup('+ this.uniqueId + ');\
                 if (o.isOpen) return;\
                 o.$setStyleClass(o.oExt, "", [o.baseCSSname + "Over"]);');

            //Button
            var oButton = this.$getLayoutNode("main", "button", oExt);
            if (oButton) {
                oButton.setAttribute("onmousedown",
                    'apf.lookup(' + this.uniqueId + ').slideToggle(event);');
            }

            //Label
            var oLabel  = this.$getLayoutNode("main", "label", oExt);
            if (this.clickOpen == "both") {
                oLabel.parentNode.setAttribute("onmousedown", 'apf.lookup('
                    + this.uniqueId + ').slideToggle(event);');
            }
        });
        this.oLabel     = this.$getLayoutNode("main", "label", this.oExt);
        
        if (this.oLabel.nodeType == 3)
            this.oLabel = this.oLabel.parentNode;

        this.oIcon      = this.$getLayoutNode("main", "icon", this.oExt);
        if (this.oButton)
            this.oButton = this.$getLayoutNode("main", "button", this.oExt);

        if (apf.caldropdown.cache) {
            var cal          = apf.caldropdown.cache;
            this.oSlider     = cal["oSlider"];
            this.oNavigation = cal["oNavigation"];
            this.oDow        = cal["oDow"];

            apf.caldropdown.cache.refcount++;

            //Set up the popup
            this.pHtmlDoc = apf.popup.setContent(this.uniqueId, this.oSlider,
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
                                "apf.setStyleClass(this, '', ['hover']);");
                            oCell.setAttribute("onmouseover",
                                "if (this.className.indexOf('disabled') > -1 \
                                   || this.className.indexOf('active') > -1) \
                                     return;\
                                 apf.setStyleClass(this, 'hover');");
                            oCell.setAttribute("onmousedown",
                                "var o = apf.findHost(this);\
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
                            btn.setAttribute("onmousedown", 'apf.findHost(this).' + buttons[i] + '()');
                            btn.setAttribute("onmouseover", 'apf.setStyleClass(this, "hover");');
                            btn.setAttribute("onmouseout",  'apf.setStyleClass(this, "", ["hover"]);');
                        }
                    }
                }
    
                var oDaysOfWeek = this.$getLayoutNode("container",
                                                      "daysofweek", oExt1);
    
                for (i = 0; i < days.length + 1; i++) {
                    this.$getNewContext("day");
                    oDaysOfWeek.appendChild(this.$getLayoutNode("day"));
                }
            });
    
            this.oNavigation = this.$getLayoutNode("container", "navigation", this.oSlider);
            this.oDow        = this.$getLayoutNode("container", "daysofweek", this.oSlider);
        }

        

        //Set up the popup
        this.pHtmlDoc    = apf.popup.setContent(this.uniqueId, this.oSlider,
            apf.skins.getCssString(this.skinName));

        document.body.appendChild(this.oSlider);

        //Get Options form skin
        //Types: 1=One dimensional List, 2=Two dimensional List
        this.listtype    = parseInt(this.$getLayoutNode("main", "type")) || 1;

        /*if (this.$aml.childNodes.length)
            this.$loadInlineData(this.$aml); caldropdown don't inherit that function */

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
        var date;
        if (typeof this.value == "undefined") {
            switch(this["default"]) {
                case "today":
                    this.setProperty("value", new Date().format(this.outputFormat));
                    break;
                default :
                    date =  new Date();
                    _day   = 0;
                    _month = date.getMonth();
                    _year  = date.getFullYear();

//                    if (!this.selected && this.initialMsg)
                        this.$setLabel();
                    break;
            }
        }
        else {
            date = Date.parse(_temp || this.value, this.outputFormat);
            _day   = date.getDate();
            _month = date.getMonth();
            _year  = date.getFullYear();

            this.setProperty("value", new Date(_year, _month, _day, _hours,
                _minutes, _seconds).format(this.outputFormat));
        }
    };

    this.$destroy = function() {
        apf.popup.removeContent(this.uniqueId);
        apf.removeNode(this.oSlider);
        this.oSlider = null;

        if (apf.caldropdown.cache && apf.caldropdown.cache.refcount) {
            if (apf.caldropdown.cache.refcount == 0) {
                apf.caldropdown.cache = null;
            }
            else {
                apf.caldropdown.cache.refcount--;
            }
        }
    };
}).implement(
    //#ifdef __WITH_DATABINDING
    apf.DataBinding,
    //#endif
    //#ifdef __WITH_VALIDATION
    apf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    apf.XForms,
    //#endif
    apf.Presentation
);

// #endif
