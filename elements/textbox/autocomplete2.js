//#ifdef __ENABLE_TEXTBOX_AUTOCOMPLETE2

this.$btndown = function(oHtml, e){
    this.$setStyleClass(oHtml, "down");
    
    var type = this.selected.getAttribute("type");//oHtml.getAttribute("type");
    
    if (!type) {
        var h = this.$headings[this.oHead.childNodes[this.$lastcol].getAttribute("hid")];
        type = h.type;
    }
    
    if (type == "dropdown" || type == "set") {
        if (apf.popup.isShowing(this.$uniqueId)){
            apf.popup.forceHide();
        }
        else {
            var oContainer = this.$editors["dropdown_container"],
                _self      = this;
            
            if (self[this.lookupaml]) 
                self[this.lookupaml].detach();
            
            var mirrorNode = this.namevalue
                ? oHtml.parentNode.childNodes[1]
                : oHtml.parentNode;
            //this.$setStyleClass(oContainer, mirrorNode.className);
            oContainer.className = "propeditcontainer" + type;
            oContainer.style[apf.supportOverflowComponent 
                ? "overflowY"
                : "overflow"] = "hidden";
            
            var str = [],
                s   = this.selected.selectNodes("item");
            if (type == "dropdown") {
                if (!this.namevalue) {
                    s = self[h.xml.getAttribute("model")].queryNodes("item");
                    
                    for (var i = 0, l = s.length; i < l; i++) {
                        str.push("<div tag='", (s[i].getAttribute("value") 
                          || s[i].firstChild.nodeValue), "'>",
                            s[i].firstChild.nodeValue, "</div>");
                    }
                }
                else {
                    for (var i = 0, l = s.length; i < l; i++) {
                        str.push("<div tag='", s[i].getAttribute("value"), "'>",
                            s[i].firstChild.nodeValue, "</div>");
                    }
                }
            }
            else {
                var select = this.selected.getAttribute("select");
                var values = [], n = this.xmlData.selectNodes(select);
                for (var i = 0; i < n.length; i++) {
                    values.push(n[i].nodeValue || apf.queryValue(n[i], "."));
                }
                
                for (var v, c, i = 0, l = s.length; i < l; i++) {
                    c = values.contains(s[i].getAttribute("value"))
                          ? "checked" : "";
                    str.push("<div class='", c, "' tag='", 
                        s[i].getAttribute("value"), "'><span> </span>",
                        s[i].firstChild.nodeValue, "</div>");
                }
            }

            oContainer.innerHTML = "<blockquote style='margin:0'>"
                + str.join("") + "</blockquote>";

            oContainer.firstChild.onmouseover = function(e){
                if (!e) e = event;
                var target = e.srcElement || e.target;
                
                if (target == this) 
                    return;
                
                while (target.parentNode != this)
                    target = target.parentNode;
                
                apf.setStyleClass(target, "hover");
            };
            
            oContainer.firstChild.onmouseout = function(e){
                if (!e) e = event;
                var target = e.srcElement || e.target;
                
                if (target == this) 
                    return;
                
                while (target.parentNode != this)
                    target = target.parentNode;
                
                apf.setStyleClass(target, "", ["hover"]);
            };
            
            oContainer.firstChild.onmousedown = function(e){
                if (!e) e = event;
                var target = e.srcElement || e.target;
                
                if (target == this) 
                    return;
                
                while (target.parentNode != this)
                    target = target.parentNode;

                if (type == "set") {
                    if (target.className.indexOf("checked") > -1)
                        apf.setStyleClass(target, "", ["checked"]);
                    else
                        apf.setStyleClass(target, "checked");
                }
                else {
                    _self.rename(_self.selected, target.getAttribute("tag"));
                    apf.popup.forceHide();
                }
            };
            
            var sel = this.selected;
            apf.popup.show(this.$uniqueId, {
                x       : this.namevalue ? -1 : 0,
                y       : mirrorNode.offsetHeight - 1,
                animate : true,
                ref     : mirrorNode,
                width   : mirrorNode.offsetWidth - this.widthdiff + (this.namevalue ? 3 : 1),
                height  : s.length * this.itemHeight,
                onclose : function(e){
                    if (type == "set") {
                        var changes = [], checked = [], nodes = e.htmlNode.firstChild.childNodes;
                        for (var v, i = 0; i < nodes.length; i++) {
                            if (nodes[i].className.indexOf("checked") > -1) {
                                checked.push(v = nodes[i].getAttribute("tag"));
                                
                                if (!values.contains(v)) {
                                    changes.push({
                                        action : "setValueByXpath",
                                        args   : [_self.xmlData, v, select, true]
                                    });
                                }
                            }
                        }
                        for (i = 0; i < values.length; i++) {
                            if (!checked.contains(values[i])) {
                                changes.push({
                                    action : "removeNode",
                                    args   : [n[i].nodeType != 1
                                     ? n[i].parentNode || n[i].ownerElement || n[i].selectSingleNode("..")
                                     : n[i]]
                                });
                            }
                        }
                        
                        if (changes.length) {
                            //@todo this should become the change action
                            //setTimeout(function(){
                                _self.$lastUpdated = sel;
                                _self.getActionTracker().execute({
                                    action : "multicall",
                                    args   : changes
                                });
                            //});
                        }
                    }
                }
            });
        }
    }
};

this.$btnup = function(oHtml, force){
    if (!this.selected)
        return;

    //var type = oHtml.getAttribute("type");
    var type = this.selected.getAttribute("type");//oHtml.getAttribute("type");
    if (!force && type == "custom" && oHtml.className.indexOf("down") > -1) {
        if (this.selected.getAttribute("form")) {
            var form = self[this.selected.getAttribute("form")];

            //#ifdef __DEBUG
            if (!form) {
                throw new Error(apf.formatErrorString(0, this,
                    "Showing form connected to property",
                    "Could not find form by name '" + this.selected.getAttribute("form")
                    + "'", this.selected));
            }
            //#endif
            
            form.show();
            form.bringToFront();
        }
        else if (this.selected.getAttribute("exec")) {
            //#ifdef __DEBUG
            try {
            //#endif
                var selected = this.xmlData;
                eval(this.selected.getAttribute("exec"));
            //#ifdef __DEBUG
            }
            catch(e){
                throw new Error(apf.formatErrorString(0, this,
                    "Executing the code inside the exec property",
                    "Could not find exec by name '" + this.selected.getAttribute("exec")
                    + "'\nError: " + e.message, this.selected));
            }
            // #endif
        }
    }
    else if (!force && type == "children") {
        var select  = this.selected.getAttribute("select"),
            xmlNode = apf.createNodeFromXpath(this.xmlData, select);//newNodes
        
        this.dispatchEvent("multiedit", {
            xmlNode  : this.selected,
            dataNode : xmlNode
        });
    }
    
    if (force || "dropdown|set".indexOf(oHtml.getAttribute("type")) == -1 
      || !apf.popup.isShowing(this.$uniqueId))
        this.$setStyleClass(oHtml, "", ["down"]);
};

this.$btnout = function(oHtml, force){
    if (force || "dropdown|set".indexOf(oHtml.getAttribute("type")) == -1
      || !apf.popup.isShowing(this.$uniqueId))
        this.$setStyleClass(oHtml, "", ["down"]);
};

this.addEventListener("popuphide", function(){
    if (this.$curBtn)
        this.$btnup(this.$curBtn, true);
    if (this.rename)
        this.stopRename();
});

    /**** Lookup ****/

    /*
        <prop match="[author]" descfield="name" datatype="lookupkey" 
          caption="Author" description="Author id" overview="overview" 
          maxlength="10" type="lookup" foreign_table="author" />
    */
    /** 
     * @private
     */
    this.stopLookup = function(propNode, dataNode){
        if (!dataNode)
            return;
        
        this.stopRename();
        
        var multiple = propNode.getAttribute("multiple"),
            select   = propNode.getAttribute("select"),

            oldNode = this.xmlData.selectSingleNode(select
              + (multiple == "single" ? "/node()" : "")),
            newNode = apf.xmldb.getCleanCopy(dataNode),
            s;

        if (multiple != "multiple") {
            var tagName;

            s = select.split("/");
            if ((tagName = s.pop()).match(/^@|^text\(\)/)) 
                tagName = s.pop();
            select = s.join("/") || null;
            
            if (tagName && tagName != newNode.tagName) {
                newNode = apf.mergeXml(newNode, 
                    newNode.ownerDocument.createElement(tagName));
            }
            
            //@todo this should become the change action
            var changes = [];
            if (oldNode) {
                changes.push({
                    action : "removeNode",
                    args   : [oldNode]
                });
            }

            changes.push({
                action : "appendChild",
                args   : [this.xmlData, newNode, null, null, select]
            });
            
            this.getActionTracker().execute({
                action : "multicall",
                args   : changes
            });
        }
        else {
            if (multiple) {
                if (multiple != "single") {
                    s = select.split("/");
                    if (s.pop().match(/^@|^text\(\)/))
                        s.pop();
                    select = s.join("/");
                }
            }
            else 
                select = null;

            if (!this.xmlData.selectSingleNode(select + "/" 
              + newNode.tagName + "[@id='" + newNode.getAttribute("id") + "']")) {
                //@todo this should become the change action
                this.getActionTracker().execute({
                    action : "appendChild",
                    args   : [this.xmlData, newNode, null, null, select]
                });
            }
        }
        
        if (apf.popup.isShowing(this.$uniqueId))
            apf.popup.hide();
    };

    this.$lookup = function(value, isMultiple){
        var oHtml = this.$selected.childNodes[this.namevalue ? 1 : this.$lastcol];

        if (this.dispatchEvent("beforelookup", {
            value    : value,
            xmlNode  : this.selected,
            htmlNode : oHtml
        }) === false)
            return;
        
        var oContainer = editors["dropdown_container"];
        if (self[this.lookupaml].childNodes.length
          && self[this.lookupaml].childNodes[0].parentNode != oContainer) {
            self[this.lookupaml].detach();
            oContainer.innerHTML = "";
        }
        
        var lookupAml = self[this.lookupaml].render(oContainer);
        
        if (!apf.popup.isShowing(this.$uniqueId)) {
            var mirrorNode = oHtml;
            //this.$setStyleClass(oContainer, mirrorNode.className);
            //oContainer.style.height = "auto";
            oContainer.className     = "ddamlcontainer";
            oContainer.style.display = "block";
            var height = oContainer.scrollHeight;
            oContainer.style.display = "none";
            /*oContainer.style[apf.supportOverflowComponent 
                ? "overflowY"
                : "overflow"] = "hidden";*/

            var widthdiff = apf.getWidthDiff(oContainer);
            apf.popup.show(this.$uniqueId, {
                x       : -1,
                y       : (isMultiple ? mirrorNode.firstChild.firstChild.offsetHeight : mirrorNode.offsetHeight) - 1,
                animate : true,
                ref     : mirrorNode,
                width   : mirrorNode.offsetWidth - widthdiff + 4, //Math.max(self[this.lookupaml].minwidth, 
                height  : height,
                callback: function(){
                    oContainer.style.height = "auto";
                    /*oContainer.style[apf.supportOverflowComponent 
                        ? "overflowY"
                        : "overflow"] = "auto";*/
                }
            });
        }
        
        this.selected.setAttribute("a_lastsearch", value);
        
        this.dispatchEvent("afterlookup", {
            value    : value,
            xmlNode  : this.selected,
            htmlNode : oHtml,
            nodes    : lookupAml
        });
    };

//#endif
