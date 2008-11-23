jpf.calendar = jpf.component(jpf.NODE_VISIBLE, function(){
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
    this.disableremove = true;
    this.sliderHeight = ((this.width - 36)/8 + 4);

    this.dateFormat  = "ddd mmm dd yyyy HH:MM:ss";
    this.value       = null;

    this.width = 200;

    var _day          = null,
        _month        = null,
        _year         = null,
        _hours        = 1,
        _minutes      = 0,
        _seconds      = 0,
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

    this.$booleanProperties["disableremove"] = true;

    this.$supportedProperties.push("disableremove", "initial-message", "value", "date-format", "width");

    this.$propHandlers["date-format"] = function(value) {
        this.setProperty("value", new Date().format(this.dateFormat = value));
    }

    this.$propHandlers["value"] = function(value) {
        this.oLabel.innerHTML = value;
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
    
    /**
     * @attribute {String} initial-message the message displayed by this element
     * when it doesn't have a value set. This property is inherited from parent 
     * nodes. When none is found it is looked for on the appsettings element. 
     */
    this.$propHandlers["initial-message"] = function(value){
        this.initialMsg = value 
            || jpf.xmldb.getInheritedAttribute(this.$jml, "intial-message");
    };
    
    /**** Public methods ****/
    
    this.setValue = function(value) {
        this.setProperty("value", value);
    };

    this.getValue = function() {
        return this.value;
    };
    
    /**
     * Toggles the visibility of the container with the list elements. It opens
     * or closes it using a slide effect.
     */
    this.slideToggle = function(e){
        if (!e) e = event;

        if (this.isOpen)
            this.slideUp();
        else
            this.slideDown(e);
    };

    /**
     * Shows the container with the list elements using a slide effect.
     */
    this.slideDown = function(e){
        if (this.dispatchEvent("slidedown") === false)
            return false;

        this.isOpen = true;

        this.oSlider.style.display = "block";
        this.oSlider.style[jpf.supportOverflowComponent
            ? "overflowY"
            : "overflow"] = "hidden";
        
        this.oSlider.style.display = "";
        this.$setStyleClass(this.oExt, this.baseCSSname + "Down");

        this.oSlider.style.height = (this.sliderHeight - 1)     + "px";
        this.oSlider.style.width  = (this.oExt.offsetWidth - 2 - this.widthdiff) + "px";

        jpf.popup.show(this.uniqueId, {
            x       : 0,
            y       : this.oExt.offsetHeight,
            animate : true,
            ref     : this.oExt,
            width   : this.oExt.offsetWidth - this.widthdiff,
            height  : this.containerHeight,
            callback: function(container){
                container.style[jpf.supportOverflowComponent 
                    ? "overflowY"
                    : "overflow"] = "auto";
            }
        });
    };
    
    /**
     * Hides the container with the list elements using a slide effect.
     */
    this.slideUp = function(){
        if (this.isOpen == 2) return false;
        if (this.dispatchEvent("slideup") === false) return false;
        
        this.isOpen = false;
        if (this.selected) {
            var htmlNode = jpf.xmldb.findHTMLNode(this.selected, this);
            if(htmlNode) this.$setStyleClass(htmlNode, '', ["hover"]);
        }
        
        this.$setStyleClass(this.oExt, '', [this.baseCSSname + "Down"]);
        jpf.popup.hide();
        return false;
    };
    
    /**** Private methods and event handlers ****/

    this.$setLabel = function(value){
        //#ifdef __SUPPORT_SAFARI
        this.oLabel.innerHTML = value || this.initialMsg || "";
        
        this.$setStyleClass(this.oExt, value ? "" : this.baseCSSname + "Initial",
            [!value ? "" : this.baseCSSname + "Initial"]);
    };

    this.addEventListener("afterselect", function(e){
        if (!e) e = event;
        
        this.slideUp();
        if (!this.isOpen)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Over"]);
        
        this.$setLabel(this.applyRuleSetOnNode("caption", this.selected))
        //return selBindClass.applyRuleSetOnNode(selBindClass.mainBind, selBindClass.xmlRoot, null, true);

    });
    
    this.addEventListener("afterdeselect", function(){
        this.$setLabel("");
    });
    
    function setMaxCount() {
        if (this.isOpen == 2)
            this.slideDown();
    }

    this.addEventListener("afterload", setMaxCount);
    this.addEventListener("xmlupdate", function(){
        setMaxCount.call(this);
        this.$setLabel(this.applyRuleSetOnNode("caption", this.selected));
    });

    // Private functions
    this.$blur = function(){
        this.slideUp();
        //this.oExt.dispatchEvent("mouseout")
        if (!this.isOpen)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Over"])
        //if(this.oExt.onmouseout) this.oExt.onmouseout();
        
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    };
    
    this.$focus = function(){
        jpf.popup.forceHide();
        //this.$setStyleClass(this.oFocus || this.oExt, this.baseCSSname + "Focus");
    }
    
    this.$setClearMessage = function(msg){
        this.$setLabel("Please set date");
    };
    
    this.$removeClearMessage = function(){
        this.$setLabel("");
    };

    this.addEventListener("popuphide", this.slideUp);
    
    /**** Keyboard Support ****/
    
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
    
    var isLeapYear = function(year) {
        return ((year % 4 == 0) && (year % 100 !== 0)) || (year % 400 == 0)
            ? true
            : false;
    };

    this.redraw = function(month, year) {
        if (month == _currentMonth && year == _currentYear) {
            rows = this.oSlider.childNodes;
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


        var w_firstYearDay = new Date(year, 0, 1);
        var w_dayInWeek    = w_firstYearDay.getDay();
        var w_days         = w_dayInWeek;

        for (i = 0; i <= month; i++) {
            if (isLeapYear(year) && i == 1) 
                w_days++;
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

        var rows = this.oNavigation.childNodes;
        for (i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("today") == -1)
                continue;
            rows[i].innerHTML = "Today";
        }

        var squareSize = (this.width - 36)/8;

        var daysofweek = this.oDow.childNodes;
        this.oDow.style.width = (this.width - 4) + "px";
        for (var z = 0, i = 0; i < daysofweek.length; i++) {
            if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {
                daysofweek[i].style.width = squareSize + "px";
                daysofweek[i].style.height = (squareSize + 12)/2 + "px";
                daysofweek[i].style.paddingTop = (squareSize - 12)/2 +"px";
                daysofweek[i].innerHTML = z == 0 
                    ? "Week"
                    : days[z - 1].substr(0, 3);
                z++;
            }
        }

        rows = this.oSlider.childNodes;
        for (z = 0, y = 0, i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("row") == -1)
                continue;

            rows[i].style.width = (this.width - 4) + "px";
            rows[i].style.height = (squareSize + 4) + "px";

            cells = rows[i].childNodes;
            for (var j = 0; j < cells.length; j++) {
                if ((cells[j].className || "").indexOf("cell") == -1)
                    continue;

                z++;
                cells[j].style.width = squareSize + "px";
                cells[j].style.height = (squareSize + 12)/2 + "px";
                cells[j].style.paddingTop = (squareSize - 12)/2 +"px";
                
                
                this.$setStyleClass(cells[j], "", ["weekend", "disabled", "active", "prev", "next"]);

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
     * Change choosen date with selected and highlight its cell in calendar
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

        this.change(new Date(newYear, (newMonth - 1), nr, _hours, _minutes, _seconds).format(this.dateFormat));
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

    
    /**** Init ****/
    
    this.$draw = function(){
        this.$animType = this.$getOption("main", "animtype") || 1;
        this.clickOpen = this.$getOption("main", "clickopen") || "button";

        //Build Main Skin
        this.oExt = this.$getExternal("main", null, function(oExt){
            var oButton = this.$getLayoutNode("main", "button", this.oExt);
            if (oButton) {
                oButton.setAttribute("onmousedown", 'jpf.lookup('
                    + this.uniqueId + ').slideToggle(event);');
            }
        });
        
         this.oExt1 = this.$getExternal("container", null, function(oExt1){
            var oSlider   = this.$getLayoutNode("container", "contents", this.oExt1);

            for (var i = 0; i < 6; i++) {
                this.$getNewContext("row");
                var oRow = oSlider.appendChild(this.$getLayoutNode("row"));

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
            
            var oNavigation = this.$getLayoutNode("container", "navigation", this.oExt1);

            if (oNavigation) {
                var buttons = ["prevYear", "prevMonth", "nextYear",
                               "nextMonth", "today"];
                for (var i = 0; i < buttons.length; i++) {
                    this.$getNewContext("button");
                    var btn = oNavigation.appendChild(this.$getLayoutNode("button"));
                    this.$setStyleClass(btn, buttons[i]);
                    btn.setAttribute("onmousedown", 'jpf.lookup('
                        + this.uniqueId + ').' + buttons[i] + '()');
                    /*btn.setAttribute("onmouseover", 'jpf.lookup('
                        + this.uniqueId + ').$setStyleClass(this, "hover");');
                    btn.setAttribute("onmouseout",  'jpf.lookup('
                        + this.uniqueId
                        + ').$setStyleClass(this, "", ["hover"]);');*/
                }
            }
            
            var oDaysOfWeek = this.$getLayoutNode("container", "daysofweek", this.oExt1);
                    
            for (var i = 0; i < days.length + 1; i++) {
                this.$getNewContext("day");
                oDaysOfWeek.appendChild(this.$getLayoutNode("day"));
            }
        });

        this.oLabel = this.$getLayoutNode("main", "label", this.oExt);
        this.oButton = this.$getLayoutNode("main", "button", this.oExt);
        this.oFirst = this.$getLayoutNode("main", "first", this.oExt);

        //this.oSlider = jpf.xmldb.htmlImport(this.$getLayoutNode("container"), document.body);
        this.oSlider        = this.$getLayoutNode("container", "contents", this.oExt1);
        //this.oInt       = this.$getLayoutNode("container", "contents", this.oExt1);
        this.oNavigation = this.$getLayoutNode("container", "navigation", this.oExt1);
        this.oDow = this.$getLayoutNode("container", "daysofweek", this.oExt1);

        var daysofweek = this.oDow.childNodes;
        for (var z = 0, i = 0; i < daysofweek.length; i++) {
            if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {               
                daysofweek[i].innerHTML = z == 0 
                    ? "Week"
                    : days[z - 1].substr(0, 3);
                z++;
            }
        }

        //Set up the popup
        this.pHtmlDoc = jpf.popup.setContent(this.uniqueId, this.oSlider,
            jpf.skins.getCssString(this.skinName));
        
        //Get Options form skin
        //Types: 1=One dimensional List, 2=Two dimensional List
        this.listtype = parseInt(this.$getLayoutNode("main", "type")) || 1;
        
        this.itemHeight = this.$getOption("main", "item-height") || 18.5;
        this.widthdiff  = this.$getOption("main", "width-diff") || 0;
        
        if (this.$jml.childNodes.length) 
            this.$loadInlineData(this.$jml);
    };
    
    this.$loadJml = function(x){
        if (!this.selected && this.initialMsg)
            this.$setLabel();
            
        if (!x.getAttribute("date-format") && !x.getAttribute("value")) {
            this.setProperty("value", new Date().format(this.dateFormat));
        }

        var size = parseInt(this.width) - this.oButton.offsetWidth
                 - this.oFirst.offsetWidth
                 - jpf.getDiff(this.oLabel)[0];
        this.oSlider.style.width = this.width +"px";
        this.oLabel.style.width = (size > 0 ? size : 1) + "px";
        this.oNavigation.style.width = (this.width - jpf.getDiff(this.oSlider)[0]) + "px";
        
    };
    
    this.$destroy = function(){
        jpf.popup.removeContent(this.uniqueId);
        jpf.removeNode(this.oSlider);
        this.oSlider = null;
    };
}).implement(    
    jpf.Presentation, 
    jpf.DataBinding
);

// #endif
