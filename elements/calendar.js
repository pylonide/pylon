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
    
    /*jpf.onload = function() {
        _self.redraw(_month, _year);
    }*/

    this.$booleanProperties["disableremove"] = true;

    this.$supportedProperties.push("disableremove", "initial-message", 
        "output-format", "default");

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
                (parseInt(jpf.getStyle(oHtml, "marginLeft")) || 0) + (parseInt(jpf.getStyle(oHtml, "marginLeft")) || 0),
                (parseInt(jpf.getStyle(oHtml, "marginTop")) || 0) + (parseInt(jpf.getStyle(oHtml, "marginBottom")) || 0)
            ];
        }
        else {
            return [
                parseInt(jpf.getStyle(oHtml, "margin-right") || 0) + parseInt(jpf.getStyle(oHtml, "margin-left") || 0),
                parseInt(jpf.getStyle(oHtml, "margin-top") || 0) + parseInt(jpf.getStyle(oHtml, "margin-bottom") || 0)
            ];
        }
    };

    this.redraw = function(month, year) {
        var ctDiff = jpf.getDiff(this.oExt);
        _width = Math.max(this.oExt.offsetWidth, this.width) - ctDiff[0];
        
        //Rows
        var rows = this.oContent.childNodes;
        for (var i = 0, pl = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("row") > -1) {
                var rDiff = jpf.getDiff(rows[i]);
                var rDiff2 = this.$getMargin(rows[i]);
                var rWidth = _width - rDiff[0] - rDiff2[0];

                //Cells
                var cells = rows[i].childNodes;
                for (var j = 0; j < cells.length; j++) {
                    if ((cells[j].className || "").indexOf("cell") > -1) {
                        var cDiff = jpf.getDiff(cells[j]);
                        var cDiff2 = this.$getMargin(cells[j]);

                        var cWidthf = Math.floor(rWidth / 8) - cDiff[0] - cDiff2[0]

                        cells[j].style.height = cWidthf + "px";
                        cells[j].style.width = cWidthf + "px";
                    }
                }
                
                if (i == 0) {
                    pl = Math.floor((rWidth - rDiff[0] - rDiff2[0] - (cWidthf + cDiff[0] + cDiff2[0])*8)/2);
                }

                rows[i].style.paddingLeft = pl + "px";
            }
        }
        
        /*for (z = 0, y = 0, i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("row") == -1)
                continue;

            rows[i].style.width = (squareSize * 8 + 32) + "px";
            if (!jpf.isGecko) {
                rows[i].style.paddingTop = "1px";
            }

            cells = rows[i].childNodes;
            for (var j = 0, disabledRow = 0; j < cells.length; j++) {
                if ((cells[j].className || "").indexOf("cell") == -1)
                    continue;
                z++;
                cells[j].style.width = squareSize + "px";
                cells[j].style.height = Math.floor((squareSize + 12) / 2) + "px";
                cells[j].style.paddingTop = squareSize 
                                          - (Math.floor((squareSize + 12) / 2))
                                          + "px";

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
        }*/
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
                    /*if (j > 0) {
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
                    }*/
                    oRow.appendChild(oCell);
                }
            }

            /*var oNavigation = this.$getLayoutNode("main", "navigation", oExt);

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
            }*/
        });

        //this.oNavigation = this.$getLayoutNode("main", "navigation",  this.oExt);
        //this.oDow        = this.$getLayoutNode("main", "daysofweek",  this.oExt);
        this.oContent = this.$getLayoutNode("main", "content",  this.oExt);
    };

    this.$loadJml = function(x) {
        /*if (typeof this.value == "undefined") {
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
        }*/
    };

    
    this.$destroy = function() {
        /*jpf.popup.removeContent(this.uniqueId);
        jpf.removeNode(this.oExt);
        this.oCalendar = null;*/
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
