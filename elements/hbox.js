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
// #ifdef __AMLHBOX || __AMLVBOX || __INC_ALL

/**
 * @define vbox Container that stacks it's children vertically.
 * @see element.hbox
 * @define hbox Container that stacks it's children horizontally.
 * Example:
 * <code>
 *  <a:hbox height="500" width="600">
 *      <a:vbox height="500" width="500">
 *          <a:bar height="250" caption="Top bar" />
 *          <a:hbox width="500" height="250">
 *              <a:bar width="150" caption="Bottom left bar"/>
 *              <a:bar width="350" caption="Bottom Right bar"/>
 *          </a:hbox>
 *      </a:vbox>
 *      <a:bar width="100" caption="Right bar"/>
 *  </a:hbox>
 * </code>
 * Remarks:
 * The layouting engine of Ajax.org Platform lets you store layouts and set them
 * dynamically. It's very easy to make a layout manager this way. For more 
 * information see {@link object.layout}
 * @addnode elements
 * @constructor
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 */
apf.hbox = function(struct, tagName){
    this.$init(tagName || "hbox", apf.NODE_VISIBLE, struct);
    
    this.$lastRules = [];
};
apf.vbox = function(struct, tagName){
    this.$init(tagName || "vbox", apf.NODE_VISIBLE, struct);
    
    this.$lastRules = [];
};

(function(){
    var l = apf.layout;
    
    /**** Properties and Attributes ****/
    
    this.$focussable = false;
    this.$update     = false;
    this.$useLateDom = true; 
    
    this.padding    = 2;
    this.edge       = "5 5 5 5";
    this.pack       = "start"; //start|center|end
    this.stretch    = true;
    
    var CSSFLOAT    = apf.isIE ? "styleFloat" : "cssFloat";
    
    /**
     * @attribute {String} padding      the space between each element. Defaults to 2.
     * @attribute {String} edge         the space between the container and the elements, space seperated in pixels for each side. Similar to css in the sequence top right bottom left. Defaults to "5 5 5 5".
     * Example:
     * <code>
     *  <a:vbox edge="10 10 40 10" />
     * </code>
     * @attribute {String} pack       
     * @attribute {String} lean       
     */
    this.$supportedProperties.push("padding", "margin", "flex", "pack", "stretch");
    this.$booleanProperties["stretch"] = true;
    
    this.$propHandlers["padding"]    =
    this.$propHandlers["edge"]       = 
    this.$propHandlers["pack"]       = 
    this.$propHandlers["stretch"]    = function(value){
        if (!this.$update && apf.loaded)
            l.queue(this.$ext, this.$updateObj);
        this.$update = true;
    };
    
    function visibleHandler(){
        var p = this.parentNode;
        if (!p.$update && apf.loaded)
            l.queue(p.$ext, p.$updateObj);
        p.$update = true;
    }
    
    //@todo move this to enableTable, disableTable
    this.register = function(amlNode){
        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = apf.K;
        
        amlNode.$propHandlers["align"]      = 
        amlNode.$propHandlers["flex"]       = 
        amlNode.$propHandlers["width"]      = 
        amlNode.$propHandlers["height"]     = 
        amlNode.$propHandlers["margin"]     = this.$updateObj.updateTrigger;
        
        amlNode.addEventListener("prop.visible", visibleHandler);
        
        l.queue(this.$ext, this.$updateObj);
        this.$update = true;
    }
    
    this.unregister = function(amlNode){
        amlNode.$propHandlers["left"]       = 
        amlNode.$propHandlers["top"]        = 
        amlNode.$propHandlers["right"]      = 
        amlNode.$propHandlers["bottom"]     =
        amlNode.$propHandlers["align"]      = 
        amlNode.$propHandlers["flex"]       = 
        amlNode.$propHandlers["width"]      = 
        amlNode.$propHandlers["height"]     = 
        amlNode.$propHandlers["margin"]     = null;
        
        amlNode.removeEventListener("prop.visible", visibleHandler);
        
        amlNode.$altExt = null;
        
        //Clear css properties and set layout
        if (amlNode.nodeFunc == apf.NODE_VISIBLE) {
            //e.currentTarget.$setLayout();
            amlNode.$ext.style.display = amlNode.visible ? "block" : "none";
            amlNode.$ext.style.verticalAlign = "";
            amlNode.$ext.style[CSSFLOAT] = "";
        }
        
        l.queue(this.$ext, this.$updateObj);
        this.$update = true;
    }
    /*
         this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.register(this.parentNode);
    });
    */
    
    /**** DOM Hooks ****/
    
    this.addEventListener("DOMNodeRemoved", function(e){
        if (this.$isWaitingOnDisplay || !this.$updateObj || e.$doOnlyAdmin)
            return;

        if (e.currentTarget == this) {
            var p = this;
            while (p) {
                p.unwatch("visible", this.$updateObj.propChange);
                p = p.parentNode;
            }
        }
        else if (e.relatedNode == this){
            this.unregister(e.currentTarget);
        }
    });

    this.addEventListener("DOMNodeInserted", function(e){
        if (this.$isWaitingOnDisplay || e.currentTarget.nodeType != 1) // || e.currentTarget != this
            return;

        if (e.currentTarget == this) {
            var p = this;
            while (p) {
                p.watch("visible", this.$updateObj.propChange);
                p = p.parentNode;
            }
        }
        else if (e.relatedNode == this) {
            if (e.$isMoveWithinParent) {
                l.queue(this.$ext, this.$updateObj);
                this.$update = true;
            }
            else {
                e.currentTarget.$setLayout(this.localName);
            }
        }
    });
    
    /**
     * @macro
     */
    function setPercentage(expr, value){
        return typeof expr == "string" 
            ? expr.replace(apf.percentageMatch, "((" + value + " * $1)/100)")
            : expr;
    }
    
    this.addEventListener("prop.height", function(e){
        if (!this.$update) {
            this.$update = true;
            l.queue(this.$ext, this.$updateObj);
        }
    });
    
    this.addEventListener("prop.width", function(e){
        if (!this.$update) {
            this.$update = true;
            l.queue(this.$ext, this.$updateObj);
        }
    });
    
    //@todo this component requires a rewrite to be like table (again...)
    this.$isWaitingOnDisplay = false;
    this.$updateBox = function(){ //@todo prevent this from being called so much
        if (!this.$update)
            return;

        //@todo this cleanup should also be there when moving nodes away
        if (this.$lastRules.length) {
            for (var i = 0, il = this.$lastRules.length; i < il; i++) {
                l.removeRule(this.$lastRules[i][0], this.$lastRules[i][1]);
                l.queue(this.$lastRules[i][0]);
            }
            this.$lastRules = [];
        }

        //@todo when not visible make all property settings rule based
        //@todo isnt there a better way for doing this? (faster)
        //#ifdef __WITH_PROPERTY_WATCH
        if (!this.$ext.offsetWidth) {
            this.$isWaitingOnDisplay = true;
            this.watch("visible", this.$updateObj.propChange);
            
            var p = this.parentNode;
            while(p) {
                p.watch("visible", this.$updateObj.propChange);
                p = p.parentNode;
            }
            
            return;
        }
        //#endif
        
        this.padding = parseInt(this.padding);
        
        var id;
        var pWidth  = "pWidth",
            pHeight = "pHeight",
            edge    = apf.getBox(String(this.edge)),
            amlNodes  = this.childNodes,
            paddAdj = {total: 0, count: [], html: []},
            heightAdj = [],
            oExt, diff, j, m, s, cellInfo, span, amlNode, htmlLookup;

        this.ids = [this.$ext];
        
        var length = amlNodes.length, vbox = this.localName == "vbox", hbox = !vbox;
        
        this.$hasPerc    = false;
        this.$totalPerc  = 0;
        this.$totalFixed = (vbox ? edge[2] : edge[1]) + ((length - 1) * this.padding);
        
        var hasWidth = this.$ext.style.width;
        var hasHeight = this.$ext.style.height;
        var hasDefinedHeight = this.height || this.top && this.bottom || this.anchors;

        var minSizeX = 0;
        var size = vbox ? "height" : "width";
        var offset = vbox ? "offsetHeight" : "offsetWidth";
        for (var nodes = [], i = 0, il = amlNodes.length; i < il; i++) {
            amlNode = amlNodes[i];
            if (amlNode.nodeType != 1 && amlNode.nodeType != 7 
              || amlNode.nodeFunc == apf.NODE_HIDDEN || amlNode.visible === false) {
                /*if (amlNode.localName == "collection") {
                    amlNodes = amlNodes.slice(0);
                    for (var z = 0, zl = amlNode.childNodes.length; z < zl; z++)
                        amlNodes.insertIndex(amlNode.childNodes[z], i);
                }*/
                
                continue;
            }
            
            m = apf.getBox(String(amlNode.margin));

            diff = apf.getDiff(oExt = amlNode.$ext);

            span = amlNode.span;
            cellInfo = {
                m       : m,
                weight  : parseInt(amlNode.weight) || 1,
                align   : amlNode.align,
                width   : amlNode.width,
                height  : amlNode.height,
                minwidth  : amlNode.minwidth || 0,
                minheight : amlNode.minheight || 0,
                oHtml   : oExt
            }
            cellInfo.isPerc = String(cellInfo[size]).indexOf("%") > -1;

            //#ifdef __DEBUG
            if (cellInfo.width && !String(cellInfo.width).match(/^\d+%?$/)) {
                throw new Error ("Invalid width specified:" + cellInfo.width); //@todo turn into decent apf error
            }
            if (cellInfo.height && !String(cellInfo.height).match(/^\d+%?$/)) {
                throw new Error ("Invalid height specified:" + cellInfo.height); //@todo turn into decent apf error
            }
            //#endif

            nodes.push(cellInfo);

            //set display method
            oExt.style.display = hbox ? "inline-block" : "block"; //@todo optimize by moving this to dominsert - or in css rule push
            if (hbox)
                oExt.style.verticalAlign = "top";//@todo optimize by moving this to dominsert - or in css rule push

            //Set size
            var first = false;
            if (!hasHeight && !hasDefinedHeight && cellInfo.isPerc) {
                delete cellInfo[size];
                cellInfo.isPerc = false;
            }

            if (cellInfo.isPerc) {
                this.$createInt();
                
                //@todo only do this when element has diff...
                if (!amlNode.$altExt) {
                    amlNode.$altExt = this.$int.insertBefore(document.createElement("div"), oExt);
                    amlNode.$altExt.appendChild(oExt);
                    amlNode.$altExt.style.position = "relative";
                    if (hbox) {
                        amlNode.$altExt.style.display = "inline-block";
                        amlNode.$altExt.style.verticalAlign = "top";//@todo optimize by moving this to dominsert - or in css rule push
                    }
                    first = true;
                }

                if ((amlNode.width || vbox && (this.stretch || !oExt.style.width)) 
                  && (amlNode.height || hbox && this.stretch)) {
                    oExt.style.position  = "absolute";
                    oExt.style.left   = 0;
                    oExt.style.top    = 0;
                    oExt.style.right  = 0;
                    oExt.style.bottom = 0;
                    oExt.style.height = "";
                    oExt.style.width = "";
                }
                else {
                    oExt.style.position = "relative";
                    oExt.style.display = "block";
                    oExt.style.width = "auto";
                }
                oExt.style.margin = "";
                
                oExt = cellInfo.oHtml = amlNode.$altExt;
                amlNode.$altExt.style[size] = cellInfo[size];
                this.$hasPerc = true;
                this.$totalPerc++;
                
                //Fix for IE bug not firing onresize after reparenting
                if (first && apf.isIE)
                    apf.layout.forceResize(amlNode.$ext);
                
                if (hbox)
                    oExt.style[CSSFLOAT] = "";
            }
            else {
                if (amlNode.$altExt) {
                    if (amlNode.$altExt.parentNode == this.$int)
                        this.$int.insertBefore(oExt, amlNode.$altExt);
                    amlNode.$altExt.parentNode.removeChild(amlNode.$altExt);
                    amlNode.$altExt = null;
                    first = true;
                    
                    oExt.style.position = "";
                    oExt.style.display = "";
                }
                
                if (cellInfo[size] || cellInfo[size] === 0) {
                    //#ifdef __DEBUG
                    if (parseInt(cellInfo[size]) == NaN) {
                        apf.console.warn("Invalid " + size + " specific. Only \
                            numbers or percentage is allowed:" + cellInfo[size]);
                        cellInfo[size] = null;
                    }
                    else
                    //#endif
                    {
                        this.$totalFixed += parseInt(cellInfo[size]);
                    }

                    oExt.style[size] = Math.max(0, cellInfo[size] - diff[vbox ? 1 : 0]) + "px";
                }
                else {
                    oExt.style[size] = "";
                    this.$totalFixed += oExt[offset];

                    if (!oExt.getAttribute("id"))
                        htmlLookup = "document.getElementById('" + apf.setUniqueHtmlId(oExt) + "')";
                    else
                        htmlLookup = "document.getElementById('" + oExt.getAttribute("id") + "')";
                    
                    paddAdj.html.push(oExt);
                    paddAdj.count.push(htmlLookup + "." + offset);
                    paddAdj.total += oExt[offset];
                }
                
                oExt.style.position = "relative";
                
                //Fix for IE bug not firing onresize after reparenting
                if (first && apf.isIE)
                    apf.layout.forceResize(amlNode.$ext);
                
                if (hbox) {
                    oExt.style[CSSFLOAT] = cellInfo.align && cellInfo.align != this.pack
                        ? (cellInfo.align == "start" ? "left" : "right")
                        : "";
                }
            }
            
            //set width
            if (vbox) {
                if ((cellInfo.width || cellInfo.width === 0) && String(cellInfo.width).indexOf("%") == -1) {
                    minSizeX = Math.max(minSizeX, cellInfo.width);
                    oExt.style.width = (cellInfo.width - diff[0]) + "px";
                }
                else if (this.stretch) {//this.width && 
                    minSizeX = Math.max(minSizeX, cellInfo.minwidth || 5);
                    oExt.style.width = "auto";
                }
                else { 
                    oExt.style.width = "";
                    minSizeX = Math.max(minSizeX, cellInfo.minwidth);
                }
                minSizeX += m[1] + m[3];
            }
            //set height
            else if (hbox) {
                if ((cellInfo.height || cellInfo.height === 0) && String(cellInfo.height).indexOf("%") == -1) {
                    minSizeX = Math.max(minSizeX, cellInfo.height);
                    oExt.style.height = (cellInfo.height - diff[1]) + "px";
                }
                else if (hasDefinedHeight && this.stretch) {
                    minSizeX = Math.max(minSizeX, cellInfo.minheight || 5);
                    heightAdj.push([oExt, diff[1], cellInfo.m]);
                }
                else {
                    oExt.style.height = "";
                    minSizeX = Math.max(minSizeX, cellInfo.minheight);
                }
                minSizeX += m[0] + m[2];
            }
            
            this.$totalFixed += (vbox ? m[0] + m[2] : m[1] + m[3]);
            
            //calc minwidth / minheight here?
        }
        
        if (nodes.length == 0) {
            this.$update = false;
            return;
        }

        var last, m, next;
        for (i = 0, il = nodes.length; i < il; i++) {
            cellInfo = nodes[i];
            
            //Set margin (m and padding)
            m = cellInfo.m;
            next = nodes[i+1] && nodes[i+1].m;
            cellInfo.oHtml.style.margin = vbox 
                ? (m[0] + (last && last[2] || 0)) + "px " +
                   m[1] + "px " +
                  (m[2] + (next && next[0] || 0) + (i < il - 1 ? this.padding : 0)) + "px " +
                   m[3] + "px"
                :  m[0] + "px " +
                  (m[1] + (next && next[3] || 0) + (i < il - 1 ? this.padding : 0)) + "px " +
                   m[2] + "px " +
                  (m[3] + (last && last[1] || 0)) + "px"

            last = cellInfo.m;
        }

        var oldP = apf.getBox(this.$ext.style.padding);//apf.getStyle(this.$ext, "padding"));
        if (this.$hasPerc)
            this.$ext.style.padding = vbox 
                ? edge[0] + "px " + edge[1] + "px " + this.$totalFixed + "px " + edge[3] + "px"
                : edge[0] + "px " + this.$totalFixed + "px " + edge[2] + "px " + edge[3] + "px";
        else
            this.$ext.style.padding = edge.join("px ") + "px";

        if (paddAdj.count) {
            var me = "apf.all[" + this.$uniqueId + "]";
            paddAdj.count = paddAdj.count.join(" + ");
            for (var i = 0; i < paddAdj.html.length; i++) {
                //@todo add rule to layoutServer to adjust padding-bottom of this.$int
                html = paddAdj.html[i];
                if (this.$hasPerc) {
                    //@todo if hasDefinedHeight set height
                    l.setRules(html, "boxp", "try{" + me + ".$ext.style.padding" 
                        + (vbox ? "Bottom" : "Right") + " = (" 
                        + (this.$totalFixed - paddAdj.total) 
                        + " + " + paddAdj.count + ") + 'px';}catch(e){}", true);
                }
                else {
                    //@todo buggy...
                    l.setRules(html, "boxp", "try{" + me + ".$ext.style.min" 
                        + (vbox ? "Height" : "Width") + " = -" 
                        + (vbox ? edge[2] : edge[1]) + " + (" + me 
                        + "['min" + size + "'] = " 
                        + (this.$totalFixed - paddAdj.total) 
                        + " + " + paddAdj.count + ") + 'px';}catch(e){}", true);
                }
                l.queue(html);
                this.$lastRules.push([html, "boxp"]);
            }
            
            this.$totalFixed += vbox ? edge[0] : edge[3];
        }

        var newP = apf.getBox(this.$ext.style.padding);//apf.getStyle(this.$ext, "padding"));

        var width  = parseInt(apf.getStyle(this.$ext, "width"));
        var height = parseInt(apf.getStyle(this.$ext, "height"));

        //Set fixed height if a percentage is involved
        /*if (vbox && this.$hasPerc && !hasHeight) {
            hasHeight = true;
            height = this.$ext.offsetHeight;
        }*/

        if (hasWidth && (width || width === 0)) {
            if (this.width)
                this.$propHandlers["width"].call(this, this.width);
            else if (this.left && this.right)
                this.$propHandlers["right"].call(this, this.right);
            else
                this.$ext.style.width = Math.max(0, width + oldP[1] - newP[1] + oldP[3] - newP[3]) + "px";
        }

        if (hasHeight && (height || height === 0)) {
            if (this.height)
                this.$propHandlers["height"].call(this, this.height);
            else if (this.top && this.bottom)
                this.$propHandlers["bottom"].call(this, this.bottom);
            else {
                this.$ext.style.height = Math.max(0, height + oldP[0] - newP[0] + oldP[2] - newP[2]) + "px";
            }
        }

        if (hasDefinedHeight && heightAdj.length) {
            var rules = ["var height = apf.all[" + this.$uniqueId + "].$ext.offsetHeight"];
            for (i = 0; i < heightAdj.length; i++) {
                html = heightAdj[i][0];
                //@todo add rule to layoutServer to adjust height
                if (!html.getAttribute("id"))
                    htmlLookup = "document.getElementById('" + apf.setUniqueHtmlId(html) + "')";
                else
                    htmlLookup = "document.getElementById('" + html.getAttribute("id") + "')";
                
                rules.push(htmlLookup + ".style.height = (height - " 
                    + "apf.getHeightDiff(" + htmlLookup + ")" + " - " +
                    + (edge[0] + edge[2] + heightAdj[i][2][0] + heightAdj[i][2][2]) + ") + 'px'"); //borders???
            }

            l.setRules(this.$ext, "boxh", (rules.length 
                ? "try{" + rules.join(";}catch(e){};\ntry{") + ";}catch(e){};" 
                : ""), true);
            l.queue(this.$ext);
            this.$lastRules.push([this.$ext, "boxh"]);
        }
        
        if (hbox) {
            this.$int.style.textAlign = this.$hasPerc || !this.pack || this.pack == "start" 
                ? "left"
                : (this.pack == "middle"
                    ? "center"
                    : "right");
        }
        else if (this.pack || this.$ext != this.$int) {
            this.$createInt();
            if (this.$hasPerc || !this.pack || this.pack == "start") {
                this.$int.style.position = "static";
                if (vbox)
                    this.$int.style.height = "100%";
                this.$int.style.top = "";
                this.$int.style.marginTop = "";
            }
            else if (this.pack == "middle") {
                this.$int.style.position = "relative";
                this.$int.style.top = "50%";
                this.$int.style.height = "auto";
                this.$int.style.marginTop = "-" + (this.$int.offsetHeight/2) + "px";  //@todo add layout rule
            }
            else if (this.pack == "end") {
                this.$int.style.position = "relative";
                this.$int.style.top = "100%";
                this.$int.style.height = "auto";
                this.$int.style.marginTop = "-" + this.$int.offsetHeight + "px"; //@todo add layout rule
            }
        }

        //@todo what is this 3 ???
        this["min" + size] = this.$totalFixed + (vbox ? edge[0] : edge[3]) - 3 + (this.$totalPerc * 5); //@todo it's an illusion that percentage items smallest size is 5 (think their own min* and content)
        this.$ext.style["min" + size.uCaseFirst()] = ((this.$hasPerc
          ? (this.$totalPerc * 5) //@todo it's an illusion that percentage items smallest size is 5 (think their own min* and content)
          : this.$totalFixed - (vbox ? edge[2] : edge[1]) - 3)
            //#ifdef __WITH_CONTENTEDITABLE
            - apf[hbox ? "getHorBorders" : "getVerBorders"](this.$ext)
            //#endif
            ) + "px";
        
        this["min" + (vbox ? "width" : "height")] = minSizeX + (vbox ? edge[1] + edge[3] : edge[0] + edge[2]);
        this.$ext.style["min" + (vbox ? "Width" : "Height")] = (minSizeX 
            //#ifdef __WITH_CONTENTEDITABLE
            - apf[vbox ? "getHorBorders" : "getVerBorders"](this.$ext)
            //#endif
            ) + "px";

        this.$update = false;
    };
    
    this.$createInt = function(){
        if (this.$ext == this.$int) { //is this slow?
            this.$int = this.$ext.appendChild(document.createElement("div"));
            this.$int.style.whiteSpace = "nowrap";
            this.$int.className = "int";
            var cnodes = this.$ext.childNodes;
            for (var j = cnodes.length - 2; j >= 0; j--) {
                this.$int.insertBefore(cnodes[j], this.$int.firstChild);
            }
            
            if (this.localName == "vbox")
                this.$int.style.height = "100%";
        }
    }
    
    this.$draw = function(){
        var _self = this;
        this.$updateObj = {
            $updateLayout : function(){
                _self.$updateBox();
            },
            updateTrigger : function(value){
                //@todo this is called up the tree when nesting elements. Should be fixed when optimizing.
                if (!_self.$update && _self.$amlLoaded)
                    l.queue(_self.$ext, _self.$updateObj);
                _self.$update = true;
            },
            //#ifdef __WITH_PROPERTY_WATCH
            propChange : function (name, old, value){
                if (_self.$update && apf.isTrue(value) && _self.$ext.offsetWidth) {
                    _self.$updateBox();
                    l.activateRules(_self.$ext);
                    
                    var p = _self;
                    while (p) {
                        p.unwatch("visible", _self.$updateObj.propChange);
                        p = p.parentNode;
                    }
                    
                    _self.$isWaitingOnDisplay = false;
                }
            }
            //#endif
        }
        
        this.$ext = this.$pHtmlNode.appendChild(document.createElement("div"));
        this.$ext.className = this.localName + " " + (this.getAttribute("class") || "");
        this.$ext.style.whiteSpace = "nowrap";
        //this.$ext.style.overflow   = "hidden";
        this.$int = this.$ext;
        this.$ext.host = this;

        this.$ext.style.position  = "relative";
        this.$ext.style.minHeight = "10px";
        
        if (!apf.vbox.$initedcss) {
            apf.importCssString(".vbox>*{white-space:normal;} .hbox>*{white-space:normal;} .vbox>.int>*{white-space:normal;} .hbox>.int>*{white-space:normal;}");
            apf.vbox.$initedcss = true;
        }
        
        l.queue(this.$ext, this.$updateObj);
        this.$update = true;
    };
    
    this.$loadAml = function(x){
        if (!this.width && (apf.getStyle(this.$ext, "position") == "absolute"
          || this.left || this.top || this.right || this.bottom || this.anchors))
            this.$ext.style.width  = "100%"
    };
}).call(apf.vbox.prototype = new apf.GuiElement());

apf.hbox.prototype = apf.vbox.prototype;

apf.aml.setElement("hbox", apf.hbox);
apf.aml.setElement("vbox", apf.vbox);
// #endif
