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

// #ifdef __JDATAGRID || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1

/**
 * Element providing a sortable, selectable grid containing scrollable 
 * information. Grid columns can be reordered and resized.
 *
 * @constructor
 * @define datagrid, spreadsheet
 * @addnode elements
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.MultiSelect
 * @inherits jpf.Cache   
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.DragDrop
 */
jpf.spreadsheet = 
jpf.datagrid    = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$focussable = true; // This object can get the focus
    this.multiselect = true; // Enable MultiSelect

    this.startClosed  = true;
    this.animType     = jpf.tween.NORMAL;
    this.animSteps    = 3;
    this.animSpeed    = 20;

    var colspan    = 0;
    var totalWidth = 0;
    var _self      = this;
    
    this.headings = [];
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif

    this.$booleanProperties["cellselect"] = true;
    this.$booleanProperties["celledit"]   = true;

    /*this.$propHandlers["fill"] = function(value){
    }*/

    /**
     * This method imports a stylesheet defined in a multidimensional array 
     * @param {Array}	def Required Multidimensional array specifying 
     * @param {Object}	win Optional Reference to a window
     * @method
     * @deprecated
     */	
    function importStylesheet(def, win){
        for(var i=0;i<def.length;i++){
            if (def[i][1]) {
                if( jpf.isIE)
                    (win || window).document.styleSheets[0].addRule(def[i][0], def[i][1]);
                else
                    (win || window).document.styleSheets[0].insertRule(def[i][0] + " {" + def[i][1] + "}", 0);
            }
        }
    }
    
    function scrollIntoView(){
        var Q = (this.current || this.$selected);
        var o = this.oInt;
        o.scrollTop = (Q.offsetTop)-21;
    }

    /**** Keyboard Support ****/
    
    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        var selHtml  = this.$selected || this.$indicator;
        
        if (!selHtml || this.renaming) //@todo how about allowdeselect?
            return;

        var selXml = this.indicator || this.selected;
        var oInt   = this.oInt;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.selectTemp();
            
                this.choose(selHtml);
                break;
            case 32:
                //if (ctrlKey || this.mode)
                    this.select(this.indicator, true);
                break;
            case 109:
            case 46:
                //DELETE
                if (this.disableremove) 
                    return;
                    
                if (this.celledit) {
                    this.rename(this.indicator || this.selected, "");
                    return;
                }
            
                if (this.$tempsel)
                    this.selectTemp();
            
                this.remove(this.mode ? this.indicator : null); //this.mode != "check"
                break;
            case 36:
                //HOME
                this.select(this.getFirstTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = 0;
                break;
            case 35:
                //END
                this.select(this.getLastTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = this.oInt.scrollHeight;
                break;
            case 107:
                //+
                if (this.more)
                    this.startMore();
                break;
            case 37:
                //LEFT
                if (this.$tempsel)
                    this.selectTemp();
                    
                if (this.cellselect) {
                    if (lastcell) {
                        if (lastcell.previousSibling) {
                            this.selectCell({target:lastcell.previousSibling}, 
                                this.$selected);
                        }
                    }
                    else {
                        this.selectCell({target:this.$selected.firstChild}, 
                            this.$selected);
                    }
                }
                else if (this.$withContainer)
                    this.slideToggle(this.$indicator || this.$selected, 2)
                break;
            case 107:
            case 39:
                //RIGHT
                if (this.$tempsel)
                    this.selectTemp();
                    
                if (this.cellselect) {
                    if (lastcell) {
                        if (lastcell.nextSibling) {
                            this.selectCell({target:lastcell.nextSibling}, 
                                this.$selected);
                        }
                    }
                    else {
                        this.selectCell({target:this.$selected.firstChild}, 
                            this.$selected);
                    }
                }
                else if (this.$withContainer)
                    this.slideToggle(this.$indicator || this.$selected, 1)
                    
                break;
            case 38:
                //UP
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;

                var margin    = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                var items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, false, items);
                if (node)
                    this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                    
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop < oInt.scrollTop) {
                    oInt.scrollTop = Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                        ? 0
                        : selHtml.offsetTop - margin[0];
                }
                break;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin    = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                var items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, true, items);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oInt.scrollTop + oInt.offsetHeight) // - (hasScroll ? 10 : 0)
                    oInt.scrollTop = selHtml.offsetTop
                        - oInt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ (hasScroll ? 10 : 0)
                
                break;
            case 33:
                //PGUP
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin     = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScrollY = oInt.scrollHeight > oInt.offsetHeight;
                var hasScrollX = oInt.scrollWidth > oInt.offsetWidth;
                var items      = Math.floor((oInt.offsetWidth
                    - (hasScrollY ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                var lines      = Math.floor((oInt.offsetHeight
                    - (hasScrollX ? 15 : 0)) / (selHtml.offsetHeight
                    + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(node, false, items * lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop < oInt.scrollTop) {
                    oInt.scrollTop = Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                        ? 0
                        : selHtml.offsetTop - margin[0];
                }
                break;
            case 34:
                //PGDN
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin     = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScrollY = oInt.scrollHeight > oInt.offsetHeight;
                var hasScrollX = oInt.scrollWidth > oInt.offsetWidth;
                var items      = Math.floor((oInt.offsetWidth - (hasScrollY ? 15 : 0))
                    / (selHtml.offsetWidth + margin[1] + margin[3]));
                var lines      = Math.floor((oInt.offsetHeight - (hasScrollX ? 15 : 0))
                    / (selHtml.offsetHeight + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(selXml, true, items * lines);
                if (!node)
                    node = this.getLastTraverseNode();
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oInt.scrollTop + oInt.offsetHeight) // - (hasScrollY ? 10 : 0)
                    oInt.scrollTop = selHtml.offsetTop
                        - oInt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ 10 + (hasScrollY ? 10 : 0)
                break;
            
            default:
                if (this.celledit) {
                    if (key > 46)
                        this.startRename(null, true);
                }
                else if (key == 65 && ctrlKey) {
                    this.selectAll();
                } 
                //@todo make this work with the sorted column
                else if (this.caption || (this.bindingRules || {})["caption"]) {
                    if (!this.xmlRoot) return;
                    
                    //this should move to a onkeypress based function
                    if (!this.lookup || new Date().getTime()
                      - this.lookup.date.getTime() > 300)
                        this.lookup = {
                            str  : "",
                            date : new Date()
                        };
                    
                    this.lookup.str += String.fromCharCode(key);
    
                    var nodes = this.getTraverseNodes(); //@todo start at current indicator
                    for (var v, i = 0; i < nodes.length; i++) {
                        v = this.applyRuleSetOnNode("caption", nodes[i]);
                        if (v && v.substr(0, this.lookup.str.length)
                          .toUpperCase() == this.lookup.str) {
                            
                            if (!this.isSelected(nodes[i])) {
                                if (this.mode == "check")
                                    this.setIndicator(nodes[i]);
                                else
                                    this.select(nodes[i]);
                            }
                            
                            if (selHtml)
                                this.oInt.scrollTop = selHtml.offsetTop
                                    - (this.oInt.offsetHeight
                                    - selHtml.offsetHeight) / 2;
                            return;
                        }
                    }
                    return;
                }
                break;
        };
        
        this.lookup = null;
    }, true);
    // #endif
    
    /**** Private methods ****/
    
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r = [];
        var nodes = this.getTraverseNodes();
        for(var f=false,i=0;i<nodes.length;i++){
            if(nodes[i] == xmlStartNode) f = true;
            if(f) r.push(nodes[i]);
            if(nodes[i] == xmlEndNode) f = false;
        }
        
        if(!r.length || f){
            r = [];
            for(var f=false,i=nodes.length-1;i>=0;i--){
                if(nodes[i] == xmlStartNode) f = true;
                if(f) r.push(nodes[i]);
                if(nodes[i] == xmlEndNode) f = false;
            }
        }
        
        return r;
    }
    
    /**** Sliding functions ****/
    
    /**
     * @private
     */
    this.slideToggle = function(htmlNode, force){
        if (this.noCollapse) return;
        
        var id = htmlNode.getAttribute(jpf.xmldb.htmlIdTag);
        var container = htmlNode.nextSibling;
        
        if (jpf.getStyle(container, "display") == "block") {
            if(force == 1) return;
            htmlNode.className = htmlNode.className.replace(/min/, "plus");
            this.slideClose(container, jpf.xmldb.getNode(htmlNode));
        }
        else {
            if (force == 2) return;
            htmlNode.className = htmlNode.className.replace(/plus/, "min");
            this.slideOpen(container, jpf.xmldb.getNode(htmlNode));
        }
    };
    
    var lastOpened = {};
    /**
     * @private
     */
    this.slideOpen = function(container, xmlNode){
        var htmlNode = jpf.xmldb.findHTMLNode(xmlNode, this);
        if (!container)
            container = htmlNode.nextSibling;

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode)
            var p = (pNode || this.xmlRoot).getAttribute(jpf.xmldb.xmlIdTag);
            if (lastOpened[p] && lastOpened[p][1] != xmlNode 
              && this.getTraverseParent(lastOpened[p][1]) == pNode) 
                this.slideToggle(lastOpened[p][0], 2);//lastOpened[p][1]);
            lastOpened[p] = [htmlNode, xmlNode];
        }
        
        container.style.display = "block";

        jpf.tween.single(container, {
            type    : 'scrollheight', 
            from    : 0, 
            to      : container.scrollHeight, 
            anim    : this.animType, 
            steps   : this.animSteps,
            interval: this.animSpeed,
            onfinish: function(container){
                if (xmlNode && _self.hasLoadStatus(xmlNode, "potential")) {
                    setTimeout(function(){
                        _self.$extend(xmlNode, container);
                    });
                    container.style.height = "auto";
                }
                else {
                    //container.style.overflow = "visible";
                    container.style.height = "auto";
                }
            }
        });
    };

    /**
     * @private
     */
    this.slideClose = function(container, xmlNode){
        if (this.noCollapse) return;
        
        if (this.singleopen) {
            var p = (this.getTraverseParent(xmlNode) || this.xmlRoot)
                .getAttribute(jpf.xmldb.xmlIdTag);
            lastOpened[p] = null;
        }
        
        container.style.height   = container.offsetHeight;
        container.style.overflow = "hidden";

        jpf.tween.single(container, {
            type    : 'scrollheight', 
            from    : container.scrollHeight, 
            to      : 0, 
            anim    : this.animType, 
            steps   : this.animSteps,
            interval: this.animSpeed,
            onfinish: function(container, data){
               container.style.display = "none";
            }
        });
    };
    
    this.$findContainer = function(htmlNode) {
        return htmlNode.nextSibling;
    }
    
    /**** Databinding ****/
    
    var headings = [], cssRules = [];
    this.$loaddatabinding = function(){
        //Set Up Headings
        var heads = this.bindingRules.heading;
        
        var found, options, xml, width, h, fixed = 0, oHead, hId, nodes = [];
        for (var i = 0; i < heads.length; i++) {
            xml     = heads[i];
            width   = xml.getAttribute("width") || defaultwidth;
            options = xml.getAttribute("options") || "sort|size|move";
            h     = {
                width        : parseFloat(width),
                isPercentage : width.indexOf("%") > -1,
                xml          : xml, //possibly optimize by recording select attribute only
                select       : xml.getAttribute("select"),
                caption      : xml.getAttribute("caption") || "",
                icon         : xml.getAttribute("icon"),
                sortable     : options.indexOf("sort") > -1,
                resizable    : options.indexOf("size") > -1,
                movable      : options.indexOf("move") > -1,
                type         : xml.getAttribute("type"),
                colspan      : xml.getAttribute("span") || 1, //currently not supported
                align        : xml.getAttribute("align") || "left",
                className    : "col" + this.uniqueId + i
            };
            
            hId = headings.push(h) - 1;
            
            //#ifdef __DEBUG
            if (!h.width)
                throw new Error("missing width"); //temporary check
            //#endif
            
            if (!h.isPercentage)
                fixed += parseFloat(h.width) || 0;
            else 
                found = true;
            
            //Set css
            cssRules.push(["." + this.baseCSSname + " .headings ." + h.className, 
                "width:" + h.width + (h.isPercentage ? "%;" : "px;")
                + "text-align:" + h.align]);
            cssRules.push(["." + this.baseCSSname + " .records ." + h.className, 
                "width:" + h.width + (h.isPercentage ? "%;" : "px;")
                + "text-align:" + h.align]);
                
            //Add to htmlRoot
            this.$getNewContext("headitem");
            oHead = this.$getLayoutNode("headitem");
            oHead.setAttribute("class", h.className);
            oHead.setAttribute("hid", hId);
    
            var hCaption = this.$getLayoutNode("headitem", "caption");
            if(h.icon){
                h.sortable = false;
                oHead.setAttribute("style", "background-image:url("
                    + jpf.getAbsolutePath(this.iconPath, h.icon) 
                    +")");
                hCaption.nodeValue = "&nbsp;";
            }
            else
                hCaption.nodeValue = h.caption;

            //nodes.push(oHead);
            h.htmlNode = jpf.xmldb.htmlImport(oHead, this.oHead);
        }
        
        //jpf.xmldb.htmlImport(nodes, this.oHead);

        if (!found) {
            this.$isFixedGrid = true;
            this.$setStyleClass(this.oExt, "fixed");
        }

        if (fixed > 0 && !this.$isFixedGrid) {
            var vLeft = fixed + 5;
            
            //first column has total -1 * fixed margin-left. - 5
            //cssRules[0][1] += ";margin-left:-" + vLeft + "px;";
            //cssRules[1][1] += ";margin-left:-" + vLeft + "px;";
            cssRules.push([".row" + this.uniqueId, "padding-right:" + vLeft 
                + "px;margin-right:-" + vLeft + "px"]);
        
            //headings and records have same padding-right
            this.oInt.style.paddingRight  =
            this.oHead.style.paddingRight = vLeft + "px";
        }
        
        this.$fixed = fixed;
        this.$first = 0;

        this.$withContainer = this.bindingRules && this.bindingRules.description;

        //Activate CSS Rules
        importStylesheet(cssRules, window);
        
        this.oInt.onscroll = this.$isFixedGrid ? 
            function(){
                _self.oHead.scrollLeft = this.scrollLeft;
            } : null;
    }
    
    this.$unloaddatabinding = function(){
        var headParent = this.$getLayoutNode("main", "head", this.oExt);
        for(var i=0;i<headParent.childNodes.length;i++){
            headParent.childNodes[i].host = null;
            headParent.childNodes[i].onmousedown = null;
            headParent.childNodes[i].$isSizingColumn = null;
            headParent.childNodes[i].$isSizeableColumn = null;
            headParent.childNodes[i].onmousemove = null;
            headParent.childNodes[i].onmouseup = null;
            headParent.childNodes[i].ondragmove = null;
            headParent.childNodes[i].ondragstart = null;
            headParent.childNodes[i].onclick = null;
            headParent.childNodes[i].ondblclick = null;
        }
        
        this.oInt.onscroll = null;
        
        jpf.removeNode(this.oDragHeading);
        this.oDragHeading = null;
        jpf.removeNode(this.oSplitter);
        this.oSplitter = null;
        jpf.removeNode(this.oSplitterLeft);
        this.oSplitterLeft = null;
        
        headParent.innerHTML = "";
        totalWidth = 0;
        this.headings = [];
    }

    this.nodes = [];
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build Row
        this.$getNewContext("row");
        var Row = this.$getLayoutNode("row");
        Row.setAttribute("id", Lid);
        Row.setAttribute("class", "row" + this.uniqueId);//"width:" + (totalWidth+40) + "px");
        Row.setAttribute("onmousedown", 'var o = jpf.lookup(' + this.uniqueId + ');\
            o.select(this, event.ctrlKey, event.shiftKey);'
            + (this.cellselect ? 'o.selectCell(event, this);' : ''));//, true;o.dragging=1;
        Row.setAttribute("ondblclick", 'var o = jpf.lookup(' + this.uniqueId + ');o.choose();'
            + (this.$withContainer ? 'o.slideToggle(this);' : '')
            + (this.celledit ? 'o.startRename();' : ''));//, true;o.dragging=1;
        //Row.setAttribute("onmouseup", 'var o = jpf.lookup(' + this.uniqueId + ');o.select(this, event.ctrlKey, event.shiftKey);o.dragging=false;');
        
        //Build the Cells
        for(var c, h, i = 0; i < headings.length; i++){
            h = headings[i];
            
            this.$getNewContext("cell");

            if (h.type == "icon"){
                var node = this.$getLayoutNode("cell", "caption",
                    Row.appendChild(this.$setStyleClass(this.$getLayoutNode("cell"), 
                    h.className)));
                jpf.xmldb.setNodeValue(node, "&nbsp;");
                (node.nodeType == 1 && node || node.parentNode)
                    .setAttribute("style", "background-image:url(" 
                        + jpf.getAbsolutePath(this.iconPath, 
                            this.applyRuleSetOnNode([h.xml], xmlNode)) 
                        + ")");
                    
            }
            else {
                jpf.xmldb.setNodeValue(this.$getLayoutNode("cell", "caption",
                    Row.appendChild(this.$setStyleClass(this.$getLayoutNode("cell"), h.className))), 
                    this.applyRuleSetOnNode([h.xml], xmlNode) || " ");
            }
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if(cssClass){
            this.$setStyleClass(Row, cssClass);
            if(cssClass) this.dynCssClasses.push(cssClass);
        }
        // #endif

        //return jpf.xmldb.htmlImport(Row, htmlParentNode || this.oInt, beforeNode);
        if(htmlParentNode) jpf.xmldb.htmlImport(Row, htmlParentNode, beforeNode);
        else this.nodes.push(Row);
        
        if (this.$withContainer) {
            var desc = this.applyRuleSetOnNode("description", xmlNode);
            this.$getNewContext("container");
            var oDesc = this.$getLayoutNode("container");
            jpf.xmldb.setNodeValue(this.$getLayoutNode("container", "container", oDesc), desc);
            oDesc.setAttribute("class", (oDesc.getAttribute("class") || "") + " row" + this.uniqueId);
            
            if(htmlParentNode) jpf.xmldb.htmlImport(oDesc, htmlParentNode, beforeNode);
            else this.nodes.push(oDesc);
        }
    }
    
    this.$fill = function(nodes){
        jpf.xmldb.htmlImport(this.nodes, this.oInt);
        this.nodes.length = 0;
    }

    this.$deInitNode = function(xmlNode, htmlNode){
        if (this.$withContainer)
            htmlNode.parentNode.removeChild(htmlNode.nextSibling);
        
        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    }
    
    this.$updateNode = function(xmlNode, htmlNode){
        var nodes = this.oHead.childNodes;
        var htmlNodes = htmlNode.childNodes;
        var node;
        
        for(var i = 0, l = nodes.length; i < l; i++){
            h = headings[nodes[i].getAttribute("hid")];
            
            //@todo fake optimization
            node = htmlNodes[i].firstChild || htmlNodes[i];//this.$getLayoutNode("cell", "caption", htmlNodes[i]) || 
            
            if (h.type == "icon"){
                (node.nodeType == 1 && node || node.parentNode)
                    .style.backgroundImage = "url(" 
                        + jpf.getAbsolutePath(this.iconPath, 
                            this.applyRuleSetOnNode([h.xml], xmlNode))
                        + ")";
            }
            else {
                jpf.xmldb.setNodeValue(node, 
                    this.applyRuleSetOnNode([h.xml], xmlNode) || " ");
            }
        }
        
        return; //@todo fake optimization
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if(cssClass || this.dynCssClasses.length){
            this.$setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if(cssClass && !this.dynCssClasses.contains(cssClass)) 
                this.dynCssClasses.push(cssClass);
        }
        // #endif
        
        if (this.$withContainer) {
            htmlNode.nextSibling.innerHTML 
                = this.applyRuleSetOnNode("description", xmlNode) || "";
        }
    }
    
    this.$moveNode = function(xmlNode, htmlNode){
        if(!htmlNode) return;
        var oPHtmlNode = htmlNode.parentNode;
        var beforeNode = xmlNode.nextSibling ? jpf.xmldb.findHTMLNode(this.getNextTraverse(xmlNode), this) : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        
        //if(this.emptyMessage && !oPHtmlNode.childNodes.length) this.setEmpty(oPHtmlNode);
    }
    
    this.$selectDefault = function(XMLRoot){
        this.select(XMLRoot.selectSingleNode(this.traverse));
    }
    
    var lastcell, lastcol = 0;
    this.selectCell = function(e, rowHtml){
        var htmlNode = e.srcElement || e.target;
        if (htmlNode == rowHtml || !jpf.xmldb.isChildOf(rowHtml, htmlNode))
            return; //this is probably not good
        
        while(htmlNode.parentNode != rowHtml)
            htmlNode = htmlNode.parentNode;
            
        if (lastcell == htmlNode)
            return;
            
        if (lastcell)
            jpf.setStyleClass(lastcell, "", ["cellselected"]);
            
        var col = jpf.xmldb.getChildNumber(htmlNode);
        var h   = headings[this.oHead.childNodes[col].getAttribute("hid")];
        
        jpf.setStyleClass(htmlNode, "cellselected");
        
        lastcell = htmlNode;
        lastcol  = col;
    }

    /**** Drag & Drop ****/
    
    // #ifdef __WITH_DRAGDROP
    this.$showDragIndicator = function(sel, e){
        var x = e.offsetX;
        var y = e.offsetY;

        this.oDrag.startX = x;
        this.oDrag.startY = y;

        document.body.appendChild(this.oDrag);
        //this.$updateNode(this.selected, this.oDrag); // Solution should be found to have this on conditionally
        
        return this.oDrag;
    }
    
    this.$hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    }
    
    this.$moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX) + "px";// - this.oDrag.startX
        this.oDrag.style.top  = (e.clientY+15) + "px";// - this.oDrag.startY
    }

    this.$initDragDrop = function(){
        if(!this.$hasLayoutNode("dragindicator")) return;
        this.oDrag = jpf.xmldb.htmlImport(this.$getLayoutNode("dragindicator"), document.body);
        
        this.oDrag.style.zIndex   = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor   = "default";
        this.oDrag.style.display  = "none";
    }

    this.$dragout  = 
    this.$dragover = 
    this.$dragdrop = function(){};
    // #endif

    /**** Rename ****/
    
    this.$getCaptionElement = function(){
        var node = this.$getLayoutNode("cell", "caption", lastcell);
        return node.nodeType == 1 && node || node.parentNode;
    }
    
    this.$getCaptionXml = function(xmlNode){
        var h = headings[this.oHead.childNodes[lastcol || 0].getAttribute("hid")];
        return xmlNode.selectSingleNode(h.select || ".");
    }
    
    var $getSelectFromRule = this.getSelectFromRule;
    this.getSelectFromRule = function(setname, cnode){ 
        if (setname == "caption") {
            var h = headings[this.oHead.childNodes[lastcol || 0].getAttribute("hid")];
            return [h.select];
        }
        
        return $getSelectFromRule.apply(this, arguments);
    }
    
    //#ifndef __PACKAGED
    if (this.tagName == "spreadsheet") {
        var binds = {};
        
        var $applyRuleSetOnNode = this.applyRuleSetOnNode;
        this.applyRuleSetOnNode = function(setname, cnode, def){
            var value = $applyRuleSetOnNode.apply(this, arguments);
            if (typeof value == "string" && value.substr(0,1) == "=") {
                value = value.replace(/(\W|^)([a-zA-Z])([0-9])(?!\w)/g, function(m, b, col, row){
                    col = col.toLowerCase().charCodeAt(0) - 97;
                    var htmlRow = _self.oInt.childNodes[row - 1];
                    if (!htmlRow) 
                        throw new Error();

                    var htmlCol = htmlRow.childNodes[col];
                    if (!htmlCol)
                        throw new Error();

                    return b + parseFloat(_self.$getLayoutNode("cell", "caption", htmlCol).nodeValue);
                });
                
                return eval(value.substr(1));
            }
            
            return value;
        }
    }
    //#endif
    
    /**** Column management ****/

    var lastSorted;
    this.sortColumn = function(hid){
        var h;
        
        if (hid == lastSorted) {
            jpf.setStyleClass(headings[hid].htmlNode, 
                this.toggleSortOrder()
                    ? "ascending"
                    : "descending", ["descending", "ascending"]);
            return;
        }

        if (typeof lastSorted != "undefined") {
            h = headings[lastSorted];
            jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "background", "white");
            jpf.setStyleClass(h.htmlNode, "", ["descending", "ascending"]);
        }
        
        h = headings[hid];
        jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "background", "#f3f3f3");
        jpf.setStyleClass(h.htmlNode, "ascending", ["descending", "ascending"]);
        
        this.resort({
            order : "ascending",
            xpath : h.select
            //type : 
        });
        
        lastSorted = hid;
    }
    
    //@todo optimize but bringing down the string concats
    this.resizeColumn = function(nr, newsize){
        var hN, h = headings[nr];
        
        if (h.isPercentage) {
            var ratio  = newsize / (h.htmlNode.offsetWidth - 7); //div 0 ??
            var next  = [];
            var total = 0;
            var node  = h.htmlNode.nextSibling;
            
            while(node && node.getAttribute("hid")) {
                hN = headings[node.getAttribute("hid")];
                if (hN.isPercentage) {
                    next.push(hN);
                    total += hN.width;
                }
                node = node.nextSibling;
            }
            
            var newPerc  = ratio * h.width;
            var diffPerc = newPerc - h.width;
            var diffRatio = (total - diffPerc) / total;
            
            for (var n, i = 0; i < next.length; i++) {
                n = next[i];
                n.width *= diffRatio;
                jpf.setStyleRule("." + this.baseCSSname + " .headings ." + n.className, "width", n.width + "%"); //Set
                jpf.setStyleRule("." + this.baseCSSname + " .records ." + n.className, "width", n.width + "%"); //Set
            }
            
            h.width = newPerc;
            jpf.setStyleRule("." + this.baseCSSname + " .headings ." + h.className, "width", h.width + "%"); //Set
            jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "width", h.width + "%"); //Set
        }
        else {
            var diff = newsize - h.width;
            h.width = newsize;
            jpf.setStyleRule("." + this.baseCSSname + " .headings ." + h.className, "width", newsize + "px"); //Set
            jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "width", newsize + "px"); //Set
            
            var hFirst = headings[this.$first];
            this.$fixed += diff;
            var vLeft = (this.$fixed + 5) + "px";

            if (!this.$isFixedGrid) {
                //jpf.setStyleRule("." + this.baseCSSname + " .headings ." + hFirst.className, "marginLeft", "-" + vLeft); //Set
                //jpf.setStyleRule("." + this.baseCSSname + " .records ." + hFirst.className, "marginLeft", "-" + vLeft); //Set
                jpf.setStyleRule(".row" + this.uniqueId, "paddingRight", vLeft); //Set
                jpf.setStyleRule(".row" + this.uniqueId, "marginRight", "-" + vLeft); //Set
            
                //headings and records have same padding-right
                this.oInt.style.paddingRight  =
                this.oHead.style.paddingRight = vLeft;
            }
        }
    }

    this.hideColumn = function(nr){
        var h = headings[nr];
        jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "visibility", "hidden");
        
        //Change percentages here
    }
    
    this.showColumn = function(nr){
        var h = headings[nr];
        jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "visibility", "visible");
        
        //Change percentages here
    }
    
    this.moveColumn = function(from, to){
        if (to && from == to) 
            return;
        
        var hFrom = headings[from];
        var hTo   = headings[to];
        
        var childNrFrom = jpf.xmldb.getChildNumber(hFrom.htmlNode);
        var childNrTo   = hTo && jpf.xmldb.getChildNumber(hTo.htmlNode);
        this.oHead.insertBefore(hFrom.htmlNode, hTo && hTo.htmlNode || null);

        var node, nodes = this.oInt.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (this.$withContainer && ((i+1) % 2) == 0)
                continue;

            node = nodes[i];
            node.insertBefore(node.childNodes[childNrFrom], 
                typeof childNrTo != "undefined" && node.childNodes[childNrTo] || null);
        }
        
        /*if (this.$first == from || this.$first == to) {
            var hReset = this.$first == from ? hFrom : hTo;
            
            jpf.setStyleRule("." + this.baseCSSname + " .headings ." + hReset.className, "marginLeft", "-5px"); //Reset
            jpf.setStyleRule("." + this.baseCSSname + " .records ." + hReset.className, "marginLeft", "-5px"); //Reset
            
            this.$first = this.oHead.firstChild.getAttribute("hid");
            var h = headings[this.$first];
            var vLeft = "-" + (this.$fixed + 5) + "px";

            jpf.setStyleRule("." + this.baseCSSname + " .headings ." + h.className, "marginLeft", vLeft); //Set
            jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "marginLeft", vLeft); //Set
        }*/
    }

    var widthdiff, defaultwidth;
    this.$draw = function(){
        //Build Main Skin
        this.oExt  = this.$getExternal(); 
        this.oInt  = this.$getLayoutNode("main", "body", this.oExt);
        this.oHead = this.$getLayoutNode("main", "head", this.oExt);
        this.oPointer = this.$getLayoutNode("main", "pointer", this.oExt);
        if (this.oHead.firstChild)
            this.oHead.removeChild(this.oHead.firstChild);
        if (this.oInt.firstChild)
            this.oInt.removeChild(this.oInt.firstChild);

        widthdiff    = this.$getOption("main", "widthdiff") || 0;
        defaultwidth = this.$getOption("main", "defaultwidth") || "100";

        jpf.JmlParser.parseChildren(this.$jml, null, this);
        
        var dragging = false;
        
        this.oHead.onmouseover = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            while (target.parentNode != this)
                target = target.parentNode;

            jpf.setStyleClass(target, "hover", ["down"]);
        }
        
        this.oHead.onmouseup = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this || dragging != target) 
                return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            jpf.setStyleClass(target, "hover", ["down"]);
            
            if (!headings[target.getAttribute("hid")].sortable)
                return;

            _self.sortColumn(parseInt(target.getAttribute("hid")));
        }
        
        this.oHead.onmousedown = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            dragging = target;
            
            //Resizing
            var pos = jpf.getAbsolutePosition(target);
            var sLeft = _self.oInt.scrollLeft;
            var d = e.clientX - pos[0] + sLeft;
            if (d < 4 || target.offsetWidth - d - 8 < 3) {
                var t = d < 4 && target.previousSibling || target;
                
                if (headings[t.getAttribute("hid")].resizable) {
                    pos   = jpf.getAbsolutePosition(t);
                    jpf.setStyleClass(_self.oPointer, "size_pointer", ["move_pointer"]);
                    _self.oPointer.style.display = "block";
                    _self.oPointer.style.left = t.offsetLeft - sLeft + "px";
                    _self.oPointer.style.width = (t.offsetWidth - widthdiff) + "px";
                    
                    dragging = true;
                    document.onmouseup = function(){
                        if (!e) e = event;
    
                        document.onmouseup = 
                        document.onmousemove = null;
                        
                        _self.resizeColumn(t.getAttribute("hid"), _self.oPointer.offsetWidth);
                        
                        dragging = false;
                        _self.oPointer.style.display = "none";
                    }
                    
                    document.onmousemove = function(e){
                        if (!e) e = event;
                        
                        _self.oPointer.style.width = (e.clientX - pos[0] - 2 + sLeft) + "px";
                    }
                    
                    return;
                }
            }
            
            jpf.setStyleClass(target, "down", ["hover"]);
            
            //Moving
            if (_self.$isFixedGrid || !headings[target.getAttribute("hid")].movable) {
                document.onmouseup = function(e){
                    document.onmouseup = null;
                    dragging = false;
                }
                
                return;
            }
            
            jpf.setStyleClass(_self.oPointer, "move_pointer", ["size_pointer"]);
            
            var x = e.clientX - target.offsetLeft, sX = e.clientX;
            var y = e.clientY - target.offsetTop, sY = e.clientY;
            var copy;
            
            document.onmouseup = function(e){
                if (!e) e = event;
                
                document.onmouseup = 
                document.onmousemove = null;
                
                dragging = false;
                _self.oPointer.style.display = "none";
                
                if (!copy)
                    return;
                    
                copy.style.top = "-100px";
                
                var el = document.elementFromPoint(e.clientX, e.clientY);
                if (el.parentNode == copy.parentNode) {
                    var pos = jpf.getAbsolutePosition(el);
                    var beforeNode = (e.clientX - pos[0] > el.offsetWidth / 2
                        ? el.nextSibling
                        : el);

                    _self.moveColumn(target.getAttribute("hid"), 
                        beforeNode ? beforeNode.getAttribute("hid") : null);
                }
                
                jpf.removeNode(copy);
            }

            document.onmousemove = function(e){
                if (!e) e = event;
                
                if (!copy) {
                    if (Math.abs(e.clientX - sX) < 3 && Math.abs(e.clientY - sY) < 3)
                        return;
                    
                    copy = target.cloneNode(true);
                    copy.style.position = "absolute";
                    var diff = jpf.getWidthDiff(target);
                    copy.style.width = (target.offsetWidth - diff - widthdiff + 2) + "px";
                    copy.style.left = target.offsetLeft;
                    copy.style.top = target.offsetTop;
                    copy.style.margin = 0;
                    copy.removeAttribute("hid")
                    
                    jpf.setStyleClass(copy, "drag", ["ascending", "descending"]);
                    target.parentNode.appendChild(copy);
                }
                
                copy.style.top = "-100px";
                _self.oPointer.style.display = "none";
                
                var el = document.elementFromPoint(e.clientX, e.clientY);
                if (el.parentNode == copy.parentNode) {
                    var pos = jpf.getAbsolutePosition(el);
                    _self.oPointer.style.left = (el.offsetLeft 
                        + ((e.clientX - pos[0] > el.offsetWidth / 2)
                            ? el.offsetWidth - 8
                            : 0)) + "px";
                    _self.oPointer.style.display = "block";
                }
                
                copy.style.left = (e.clientX - x) + 'px';
                copy.style.top = (e.clientY - y) + 'px';
            }
        }
        
        this.oHead.onmouseout = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            jpf.setStyleClass(target, "", ["hover", "down"]);
        }
        
        this.oHead.onmousemove = function(e){
            if (dragging)
                return;
            
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            var pos = jpf.getAbsolutePosition(target);
            var d = e.clientX - pos[0];

            if (d < 4 || target.offsetWidth - d - widthdiff < 3) {
                var t = d < 4 ? target.previousSibling : target;
                this.style.cursor = t && headings[t.getAttribute("hid")].resizable
                    ? "w-resize"
                    : "default";
            }
            else {
                this.style.cursor = "default";
            }
        }
    }
    
    this.$loadJml = function(x){
        if(x.getAttribute("message")) this.clearMessage = x.getAttribute("message");
        
        //@todo add options attribute
        
        if (this.tagName == "spreadsheet") {
            this.celledit   = true;
            this.cellselect = true;
        }
        
        if (this.cellselect) {
            this.multiselect = false;
            this.bufferselect = false;
            
            this.addEventListener("onafterselect", function(e){
                this.selectCell({target:this.$selected.childNodes[lastcol || 0]}, 
                    this.$selected);
            });
        }
    }
    
    this.$destroy = function(){
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
        this.oExt.onclick = null;
        this.oInt.onresize = null;
        
        jpf.layout.removeRule(this.oInt, "dg" + this.uniqueId);
        jpf.layout.activateRules(this.oInt);
    }
    
    this.counter = 0;
}).implement(
    jpf.MultiSelect,
    jpf.Cache,  
    jpf.DataBinding,
    jpf.Presentation,
    //#ifdef __WITH_RENAME
    jpf.Rename,
    //#endif
    //#ifdef __WITH_DRAGDROP
    jpf.DragDrop
    //#endif
);

//#endif