apf.calendarlist      = function(struct, tagName){
    this.$init(tagName || "calendarlist", apf.NODE_VISIBLE, struct);
    
    this.date       = new Date();
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
    this.dateFormat = "mm-dd-yyyy";
    this.interval   = null;
    this.intervals  = {
        "day"   : 30,   //half an hour
        "week"  : 1440, //day 
        "month" : 10080 //week
    };
    
    this.ranges = {
        "day"   : 1440,
        "week"  : 10080,
        "month" : this.months[this.date.getMonth()].number //nie uwzgledniłem roku przestępnego
    };
};

(function(){
    // #ifdef __WITH_RENAME
    if (!apf.isIphone)
        this.implement(apf.Rename);
    // #endif
    
    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        if (!(this.$caret || this.$selected))
            return;
        
        var x = this.$getLayoutNode("item", "caption", this.$caret || this.$selected);
        if (!x) 
            return;
        return x.nodeType == 1 ? x : x.parentNode;
    };
    // #endif
    
    // #ifdef __AMLSUBMITFORM || __INC_ALL
    this.addEventListener("afterselect", function(e){
        if (this.hasFeature(apf.__VALIDATION__)) 
            this.validate(true);
    });
    // #endif
    
    /**** Properties and Attributes ****/
    
    this.$supportedProperties.push("appearance", "more", "range", "date", "date-format", "interval");

    this.$propHandlers["range"] = function(value) {
        this.range = value;
    };
    
    this.$propHandlers["date"] = function(value) {
        this.date = Date.parse(value, this.dateFormat);
    };
    
    this.$propHandlers["date-format"] = function(value) {
        this.dateFormat = value;
    };
    
    this.$propHandlers["interval"] = function(value) {
        value = parseInt(value);
        this.interval = value > 10 ? value : 10;
    };

    this.$propHandlers["more"] = function(value){
        if (value) {
            this.delayedselect = false;
            this.addEventListener("xmlupdate", $xmlUpdate);
            this.addEventListener("afterload", $xmlUpdate);
            //this.addEventListener("afterrename", $afterRenameMore);
            //this.addEventListener("beforeselect", $beforeSelect);
            
            this.$setClearMessage    = function(msg){
                if (!this.moreItem)
                    this.$fill();
                this.$container.appendChild(this.moreItem);
            };
            this.$updateClearMessage = function(){}
            this.$removeClearMessage = function(){};
        }
        else {
            this.removeEventListener("xmlupdate", $xmlUpdate);
            this.removeEventListener("afterload", $xmlUpdate);
            //this.removeEventListener("afterrename", $afterRenameMore);
            //this.removeEventListener("beforeselect", $beforeSelect);
        }
    };
    
    var isLeapYear = function(year) {
        return ((year % 4 == 0) && (year % 100 !== 0)) || (year % 400 == 0)
            ? true
            : false;
    };
    
    function $xmlUpdate(e){
        if ((!e.action || "insert|add|synchronize|move".indexOf(e.action) > -1) && this.moreItem)
            this.$container.appendChild(this.moreItem);
    }
    
    //#endif
    
    /**** Keyboard support ****/
    
    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", this.$keyHandler, true);
    //#endif
    
    /**** Init ****/
    
    this.$draw = function(){
        this.appearance = this.getAttribute("appearance") || "compact";
        var mode = this.getAttribute("mode");
        
        //Build Main Skin
        this.$ext       = this.$getExternal();
        this.$container = this.$getLayoutNode("main", "container", this.$ext);
        this.$oHours    = this.$getLayoutNode("main", "hours", this.$ext);
        
        if (apf.hasCssUpdateScrollbarBug && !this.mode)
            this.$fixScrollBug();
        
        var _self = this;
        this.$ext.onclick = function(e){
            _self.dispatchEvent("click", {
                htmlEvent: e || event
            });
        }
        
        //Get Options form skin
        //Types: 1=One dimensional List, 2=Two dimensional List
        this.listtype  = parseInt(this.$getOption("main", "type")) || 1;
        //Types: 1=Check on click, 2=Check independent
        this.behaviour = parseInt(this.$getOption("main", "behaviour")) || 1; 
    };
    
    this.$addModifier = function(xmlNode, oItem, htmlParentNode, beforeNode) {
        apf.insertHtmlNodes([oItem], this.$container);
        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, this);
        
        //get real size of the interval html representation  
        var nodes = this.$oHours.childNodes,
            l     = nodes.length,
            intervalHeight;
        
        for (var i = 0; i < l; i++) {
            if ((nodes[i].className || "").indexOf("hour") > -1) {
                intervalHeight = nodes[i].offsetHeight;
                break;
            }
        }
        
        var date1           = Date.parse(this.$applyBindRule("date", xmlNode), this.dateFormat),
            date2           = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 0, 0, 0), 
            duration        = parseInt(this.$applyBindRule("duration", xmlNode)),
            time_difference = (date1.getTime() - date2.getTime())/60000; //[min]1000*60
        
        if (time_difference >= 0) {
            htmlNode.style.display = "block";
            htmlNode.style.top     = (time_difference/this.interval)* intervalHeight + intervalHeight*parseInt(time_difference/(24*60))*2 + "px";
            htmlNode.style.height  = (duration/this.interval) * intervalHeight + "px";
        }
        else {
            htmlNode.style.display = "none";
        }
        
        return false;
    }
    
    this.$loadAml = function(x){
        //Calculating number of labels
        var range    = this.ranges[this.range], 
            interval = this.interval || this.intervals[this.range],
            start    = 0, hours = 0, minutes = 0,
            day = this.date.getDate(), month = this.date.getMonth(), year = this.date.getFullYear();
        
        var nodes = [];

        for (var i = 0, l = parseInt(range / interval); i < l; i++) {
            hours   = parseInt(start / 60);
            //hours   = hours < 10 ? "0" + hours : hours;
            minutes = start % 60;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            
            if (( parseInt(hours) == 24) && parseInt(minutes) == 0) {
                hours = 0; minutes = "00"; start = 0;
                nodes.push(this.$addHour(new Date(year, month, ++day, 0, 0, 0).format(this.dateFormat), "midnight"));
                //just create an empty row
                nodes.push(this.$addHour("", null));
            }
            
            nodes.push(this.$addHour(i%2 == 0 ? hours + ":" + minutes : "", i%2 == 0 ? null : "odd"));
            
            start += interval;
        }

        apf.insertHtmlNodes(nodes, this.$oHours);
        
        this.$container.style.height = this.$oHours.offsetHeight + "px";
    };
    
    this.$addHour = function(caption, cssClass) {
        this.$getNewContext("hour");
        var oHour = this.$getLayoutNode("hour");
        if (cssClass)
            this.$setStyleClass(oHour, cssClass, []);
        
        apf.setNodeValue(this.$getLayoutNode("hour", "caption"), caption);
        return oHour;
    };

    this.$destroy = function(){
        if (this.$ext)
            this.$ext.onclick = null;
        apf.destroyHtmlNode(this.oDrag);
        this.oDrag = null;
    };
}).call(apf.calendarlist.prototype = new apf.BaseList());
apf.aml.setElement("calendarlist", apf.calendarlist);
apf.aml.setElement("date", apf.BindingRule);
apf.aml.setElement("duration", apf.BindingRule);
// #endif
