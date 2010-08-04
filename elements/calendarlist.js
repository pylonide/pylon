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

// #ifdef __AMLCALENDARLIST || __INC_ALL
/**
 *
 * @inherits apf.DataAction
 *
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 *
 */

apf.calendarlist      = function(struct, tagName){
    this.$init(tagName || "calendarlist", apf.NODE_VISIBLE, struct);
    
    this.date       = new Date();
    this.strDate    = "";
    this.days       = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    this.months     = [{name : "January",   number : 31},
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
    this.range      = "day";
    this.mode       = "normal";
    this.dateFormat = "mm-dd-yyyy";
    this.interval   = null;
    this.intervals  = {
        "day"   : 15, //half an hour
        "week"  : 60, //day 
        "month" : 60  //week
    };
    
    this.ranges = {
        "day"   : 1440,
        "week"  : 10080/*,
        "month" : this.months[this.date.getMonth()].number * 1440*/ 
    };
    
    this.calendarEvents = [];
};

(function() {
    // #ifdef __WITH_RENAME
    if (!apf.isIphone)
        this.implement(apf.Rename);
    // #endif
    
    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function() {
        if (!(this.$caret || this.$selected))
            return;
        
        var x = this.$getLayoutNode("item", "caption", this.$caret || this.$selected);
        if (!x) 
            return;
        return x.nodeType == 1 ? x : x.parentNode;
    };
    // #endif
    
    // #ifdef __AMLSUBMITFORM || __INC_ALL
    this.addEventListener("afterselect", function(e) {
        if (this.hasFeature(apf.__VALIDATION__)) 
            this.validate(true);
    });
    // #endif
    
    /**** Properties and Attributes ****/
    
    this.$supportedProperties.push("appearance", "mode", "range", "date", "date-format", "interval");

    this.$propHandlers["range"] = function(value) {
        this.date = this.getStartDate(this.date, this.range = value);
        this.$updateHours();
    };
    
    this.$propHandlers["day"] = function(value) {
        this.strDate = value;
        this.date    = this.getStartDate(apf.date.getDateTime(value, this.dateFormat), this.range);
        this.$updateHours();
    };
    
    this.$propHandlers["date-format"] = function(value) {
        this.dateFormat = value;
    };
    
    this.$propHandlers["interval"] = function(value) {
        value = parseInt(value);
        this.interval = value > 5 ? value : 5;
        this.$updateHours();
    };
    /**
     * Possible values
     * normal (default)   - adding/editing notes are NOT possible
     * add                - selecting time range for note 
     * edit               - editing note
     * @param {Object} value
     */
    this.$propHandlers["mode"] = function(value) {
        this.mode = value;
    };
    
    this.getStartDate = function(objDate, range) {
        switch(range) {
            case "day":
                return apf.date.getDateTime(this.strDate, this.dateFormat);
            case "week":
                return new Date(objDate.getFullYear(), objDate.getMonth(), objDate.getDate() - objDate.getDay(), 0, 0, 0);
            case "month":
                return new Date(objDate.getFullYear(), objDate.getMonth(), 1, 0, 0, 0);
        }
    };
    
    function $xmlUpdate(e) {
        
    }
    
    /**** Keyboard support ****/
    
    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", this.$keyHandler, true);
    //#endif
    
    /**** Init ****/
    
    this.$draw = function() {
        //Build Main Skin
        this.$ext           = this.$getExternal();
        this.$container     = this.$getLayoutNode("main", "container", this.$ext);
        this.$oHours        = this.$getLayoutNode("main", "hours", this.$ext);
        this.$oNoteField    = this.$getLayoutNode("main", "note_field", this.$ext);
        this.$oNoteFieldCon = this.$getLayoutNode("main", "note_field_con", this.$ext);
        
        
        this.$container.setAttribute("onmousemove",
            "var o = apf.lookup(" + this.$uniqueId 
            + "); if (o.mode == 'add')o.$showNoteField(event);");
        
        this.$oNoteField.setAttribute("onmousemove",
            "var o = apf.lookup(" + this.$uniqueId 
            + "); if (o.mode == 'add')o.$showNoteField(event);");
            
        this.$oNoteField.setAttribute("onmouseout",
            "var o = apf.lookup(" + this.$uniqueId 
            + "); o.$hideNoteField(event);");
        
        this.$oNoteField.setAttribute("onclick",
            "var o = apf.lookup(" + this.$uniqueId 
            + "); if (o.mode == 'add')o.$editNoteField();");
        
        if (apf.hasCssUpdateScrollbarBug && !this.mode)
            this.$fixScrollBug();
        
        var _self = this;
        this.$ext.onclick = function(e) {
            _self.dispatchEvent("click", {
                htmlEvent : e || event
            });
        }
    };
    
    function getScrollPage() {
        return [
            document.documentElement.scrollLeft || document.body.scrollLeft,
            document.documentElement.scrollTop || document.body.scrollTop
        ];
    }
    
    this.$showNoteField = function(e) {
        e = e || event;
        
        var cy             = e.clientY;
        var intervalHeight = this.getInterval("pixels");
        var interval       = this.getInterval("minutes");
        
        this.$oNoteField.style.display = "block";
        this.$oNoteField.style.height = (intervalHeight * 2 - apf.getDiff(this.$oNoteField)[1]) + "px";
        this.$oNoteField.style.marginTop = -1 * intervalHeight + "px";
        
        var scrollPage = getScrollPage()[1];//333 px
        var absPosE = apf.getAbsolutePosition(this.$ext)[1];//822
        var marginTop = parseInt(this.$oNoteField.style.marginTop);

        this.$oNoteField.style.top = (cy + scrollPage - absPosE + this.$ext.scrollTop + intervalHeight / 2) + "px";
        
        //Unit relative to interval and intervalHeight  
         
        //var unit = parseInt((cy + this.$ext.scrollTop + parseInt(this.$oNoteField.style.marginTop)) / intervalHeight);
            //unit *= interval;
        
        //Constant interval = 5 min;
        intervalHeight = 5 * intervalHeight / interval;
        var unit = parseInt((cy + scrollPage - absPosE + this.$ext.scrollTop + marginTop + intervalHeight / 2) / intervalHeight);
            unit *= 5;
            
        var hours   = parseInt(unit / 60);
        var minutes = unit % 60;
        
        if (minutes < 0)
            minutes = 0;
            
            minutes = minutes < 10 ? "0" + minutes : minutes;
        
        if (hours >= 24)
            hours %= 24; 
        
        this.$oNoteFieldCon.innerHTML = hours+":"+minutes; 
    };
    
    this.$hideNoteField = function(e) {
        e = e || event;
        if (this.mode !== "edit")
            this.$oNoteField.style.display = "none";
    };
    
    this.$editNoteField = function() {
        this.mode = "edit";
    };
    
    this.getInterval = function(unit) {
        if (unit == "minutes")
            return this.interval || this.intervals[this.range];
        else if (unit == "pixels") {
            var nodes = this.$oHours.childNodes,
                l     = nodes.length
            
            for (var i = 0; i < l; i++) {
                if ((nodes[i].className || "").indexOf("hour") > -1) {
                    return nodes[i].offsetHeight;
                }
            }
        }
    };
    
    this.$isLeapYear = function(year) {
        return ((year % 4 == 0) && (year % 100 !== 0)) || (year % 400 == 0)
            ? true
            : false;
    };
    
    this.getTimeRange = function(rangeType) {
        switch (rangeType) {
            case "day":
            case "week":
                return this.ranges[rangeType];
            case "month":
                return this.months[this.date.getMonth()].number * 1440 
                    + this.$isLeapYear(this.date.getFullYear()) ? 1 : 0;
        }
    };
    
    this.$addModifier = function(xmlNode, oItem, htmlParentNode, beforeNode) {
        apf.insertHtmlNodes([oItem], this.$container);
        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, this);
        
        this.calendarEvents.push({
            xmlNode  : xmlNode, 
            htmlNode : htmlNode
        });
        
        this.updateCalendarEvent(xmlNode, htmlNode);
        
        return false;
    };
    
    this.updateCalendarEvent = function(xmlNode, htmlNode) {
        var date1          = apf.date.getDateTime(this.$applyBindRule("date", xmlNode), this.dateFormat),
            date2          = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 0, 0, 0),
            duration       = parseInt(this.$applyBindRule("duration", xmlNode)),
            interval       = this.getInterval("minutes"),
            intervalHeight = this.getInterval("pixels"),
            max            = parseInt(this.getTimeRange(this.range) / interval) * intervalHeight,
            top            = (((date1.getTime() - date2.getTime()) / 60000) / interval) * intervalHeight;
        
        if (top >= 0 && top < max) {
            htmlNode.style.display = "block";
            htmlNode.style.top     = top + "px";
            htmlNode.style.height  = ((duration / interval) * intervalHeight) - apf.getDiff(htmlNode)[1] - 1 + "px";
        }
        else {
            htmlNode.style.display = "none";
        }
    };
    
    this.updateCalendarEvents = function() {
        var calEvents     = this.calendarEvents,
            calEvents_len = calEvents.length;
        
        for (var i = 0; i < calEvents_len; i++) {
            this.updateCalendarEvent(calEvents[i].xmlNode, calEvents[i].htmlNode);
        }
    };
    
    this.$loadAml = function(x) {
        this.$updateHours();
    };
    
    this.$getHours = function() {
        var nodes = this.$oHours.childNodes,
            l     = nodes.length,
            hours = [];
        
        for (var i = 0; i < l; i++) {
            if ((nodes[i].className || "").indexOf("hour") > -1) {
                hours.push(nodes[i]);
            }
        }
        
        return hours;
    }

    this.$updateHours = function() {
        //Calculating number of labels
        var range    = this.getTimeRange(this.range), 
            interval = this.getInterval("minutes"),
            start    = 0, hours = 0, minutes = 0,
            day      = this.date.getDate(), 
            caption, cssClass, isMidnight, oHour, oCaption;
        
        var nodes = [],
            existingNodes = this.$getHours();

        for (var i = 0, l = parseInt(range / interval); i < l; i++) {
            hours      = parseInt(start / 60);
            minutes    = start % 60;
            minutes    = minutes < 10 ? "0" + minutes : minutes;
            cssClass   = null;
            isMidnight = parseInt(hours) == 24 && parseInt(minutes) == 0;
            
            if (isMidnight) {
                hours = 0; minutes = "00"; start = 0;
                cssClass = "midnight";
            } 
            
            caption = (i%2 == 0 
                ? hours + ":" + minutes 
                : "") + (isMidnight 
                    ? " (" + new Date(this.date.getFullYear(), this.date.getMonth(), ++day, 0, 0, 0).format(this.dateFormat) + ")"
                    : "");
            if (i%2 == 0)
                cssClass = cssClass ? cssClass + " odd" : "odd";
            
            if (existingNodes.length) {
                oHour = existingNodes.shift();
                oHour.style.display = "block";
                
                if (cssClass)
                    this.$setStyleClass(oHour, cssClass, []);
                
                oCaption = this.$getLayoutNode("hour", "caption", oHour);
                
                apf.setNodeValue(oCaption, caption);
            }
            else {
                this.$getNewContext("hour");
                oHour = this.$getLayoutNode("hour");
                
                if (cssClass)
                    this.$setStyleClass(oHour, cssClass, []);
                
                apf.setNodeValue(this.$getLayoutNode("hour", "caption"), caption);
                nodes.push(oHour);
            }
            
            start += interval;
        }

        if (nodes.length)
            apf.insertHtmlNodes(nodes, this.$oHours);
            
        //Hide unused nodes
        var existingNodes_len = existingNodes.length
        if (existingNodes_len) {
            for (var i = 0; i < existingNodes_len; i++) {
                existingNodes[i].style.display = "none";
            }
        }
        
        this.$container.style.height = this.$oHours.offsetHeight + "px";
        this.updateCalendarEvents();
    };

    this.$destroy = function() {
        if (this.$ext)
            this.$ext.onclick = null;
        apf.destroyHtmlNode(this.oDrag);
        this.oDrag = null;
    };
}).call(apf.calendarlist.prototype = new apf.BaseList());
apf.aml.setElement("calendarlist", apf.calendarlist);
apf.aml.setElement("date",         apf.BindingRule);
apf.aml.setElement("duration",     apf.BindingRule);
// #endif
