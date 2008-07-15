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
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */

/*
<Heading caption="Contact Naam" span="2" width="18" />
<Heading width="105" />
<Heading caption="E-mail Adres" width="159" />

<Column_0 type="icon" select="." default="icoUsers.gif" />
<Column_1 select="@name" />
<Column_2 select="@email" />

<Traverse select="Person" />
<Heading name="Subject" .. />
<Name select=".@icon" type="icon" .... />
<Name select="." type="icon" .... />
<Subject select=".@icon" type="icon" .... />
<Subject select=".@icon" type="j:Textbox" .... />

type="icon|color|text|mask"
widget="j:Textbox"

selecttype = "row|cell"
*/

jpf.DgSizeServer = {
    init : function(){
        jpf.DragMode.defineMode("dgdragsize", this);
    },
    
    start : function(host, heading){

        //EVENT - cancellable: ondragstart
        if(host.dispatchEvent("onsizeheadingstart") === false) 
            return false;//(this.host.tempsel ? select(this.host.tempsel) : false);

        host.oSplitter.className = host.oSplitterLeft.className = "dg_size_headers";
        host.oSplitter.style.display = "block";
        
        var pos = jpf.compat.getAbsolutePosition(heading);
        host.oSplitter.style.left = (pos[0] + heading.offsetWidth - 1) +  "px";//+ (onRight ? heading.offsetWidth : 0)
        host.oSplitter.style.top = (pos[1]) + "px";

        var s = jpf.compat.getBox(jpf.compat.getStyle(host.oExt, "borderWidth"));
        host.oSplitter.style.height = host.oExt.offsetHeight - (s[0] + s[2]);
        var intWidth = host.oInt.clientWidth; // host.oExt.offsetWidth - (s[1] + s[3]);

        jpf.Plane.show (host.oSplitter).style.cursor = "w-resize";

        if (!(heading === host.headings[0].html))
        {
            host.oSplitterLeft.style.left = (pos[0] - 1) +  "px";//+ (onRight ? heading.offsetWidth : 0)
            host.oSplitterLeft.style.top = (pos[1]) + "px";
            host.oSplitterLeft.style.display = "block";
            host.oSplitterLeft.style.height = host.oSplitter.style.height;
        }

        // Make sure we'll take the header's border and padding into account when sizing.		
        var padding = (parseInt(jpf.compat.getStyle(heading, "paddingLeft")) || 0) + (parseInt(jpf.compat.getStyle(heading, "paddingRight")) || 0);
        var border = (parseInt(jpf.compat.getStyle(heading, "borderLeftWidth")) || 0) + (parseInt(jpf.compat.getStyle(heading, "borderRightWidth")) || 0);
        
        // Figure out the heading index we're sizing.
        var curHeading;
        for (var i=0; i<host.headings.length; i++)
            if (heading === host.headings[i].html)
            {
                curHeading = i;
                jpf.DgSizeServer.sizeHeading = i;
                break;
            }
        
        // Make sure that we can't make the right columns disappear.
        var minRemaining = 0;	
        for (var i=curHeading+1; i<host.headings.length; i++)
            minRemaining += Math.max(parseInt(host.headings[i].xml.getAttribute("minwidth")) || 0, padding+border);

        // Store relative widths - we'll keep these ratios when sizing.	
        host.rightWidth = 0;
        for (var i=curHeading+1;i<host.headings.length;i++)
            host.rightWidth += host.headings[i].width;

        host.orgSizeWidths = new Array();
        for (var i=curHeading; i<host.headings.length; i++)
            host.orgSizeWidths[i] = host.headings[i].width;
    
        this.dragdata = {
            heading : heading, 
            indicator : host.oSplitter,
            indicatorLeft : host.oSplitterLeft,
            host : host,
            minWidth : Math.max(padding+border, parseInt(host.headings[curHeading].xml.getAttribute("minwidth"))||0),
            maxWidth : Math.min(intWidth - heading.offsetLeft - minRemaining, (parseInt(host.headings[curHeading].xml.getAttribute("maxwidth")) || 9999999))
        };
        
        jpf.DgSizeServer.isActive = true;

        jpf.DragMode.setMode("dgdragsize");
    },
    
    /* **********************
        Mouse Movements
    ***********************/
    
    ontimerevent : function() {
        var dragdata = jpf.DgSizeServer .dragdata;
        dragdata.host.__updateColumnSizes(dragdata.heading.getAttribute('hid'));
        jpf.DgSizeServer.timerEvent = undefined;
    },

    onmousemove : function(e){
        if(!e) e = event;
        var dragdata = jpf.DgSizeServer .dragdata;

        // Calc the new size.
        var pos = jpf.compat.getAbsolutePosition(dragdata.heading);
        var newSize = (e.clientX+jpf.DgSizeServer.sizeOffset) - pos[0];
        if(dragdata.indicator) dragdata.indicator.style.left = 
            pos[0] + Math.min(Math.max(newSize, dragdata.minWidth), dragdata.maxWidth) - 1;

        dragdata.host.sizeColumn(dragdata.heading.getAttribute("hid"), newSize + dragdata.host.oInt.scrollLeft, true);

        if (jpf.DgSizeServer.timerEvent) 
        {
            clearTimeout(jpf.DgSizeServer.timerEvent);
            jpf.DgSizeServer.timerEvent = undefined;
        }

        if (!jpf.DgSizeServer.timerEvent) 
            jpf.DgSizeServer.timerEvent = setTimeout(jpf.DgSizeServer.ontimerevent, 100);
    },
    
    stop : function(reset) {
        if (jpf.DgSizeServer.timerEvent) clearTimeout(jpf.DgSizeServer.timerEvent);
        jpf.DgSizeServer.timerEvent = undefined;
        jpf.DgSizeServer.sizeOffset = undefined;

        jpf.DragMode.clear();
        jpf.Plane.hide ().style.cursor = "default";
        
        if(!jpf.DgSizeServer.dragdata) return;
        var dragdata = jpf.DgSizeServer .dragdata;
        dragdata.indicator.style.display = "none"; // Let's hide it again.
        dragdata.indicatorLeft.style.display = "none"; // Let's hide it again.
        
        // Clear the sizing-cursor. Although, one could argue that we'd have to check the mouse position 
        // to see whether it shouldn't again be the sizing cursor if the mouse is over a splitter.
        dragdata.heading.style.cursor = "default";
        if (jpf.DgSizeServer.sizeHeading < dragdata.host.headings.length-1)
            dragdata.host.headings[jpf.DgSizeServer.sizeHeading+1].html.style.cursor = "default";
        
        if (reset) 
        {
            for (var i=jpf.DgSizeServer.sizeHeading; i<dragdata.host.headings.length; i++)
                dragdata.host.headings[i].width = dragdata.host.orgSizeWidths[i];
            dragdata.host.__updateHeadingSizes(jpf.DgSizeServer.sizeHeading);
            dragdata.host.__updateColumnSizes(jpf.DgSizeServer.sizeHeading);
        }
        
        jpf.DgSizeServer.isActive = false;
    },
    
    onmouseup : function(e){
        if(!e) e = event;
        var dragdata = jpf.DgSizeServer .dragdata;
        var pos = jpf.compat.getAbsolutePosition(dragdata.heading);
        var newSize = (e.clientX+jpf.DgSizeServer.sizeOffset) - pos[0];
        
        jpf.DgSizeServer.stop();
        dragdata.host.sizeColumn(dragdata.heading.getAttribute("hid"), newSize + dragdata.host.oInt.scrollLeft);
        dragdata.host.__storeRelativeWidths();
    }
}
jpf.Init.add(jpf.DgSizeServer.init, jpf.DgSizeServer);

jpf.DgHeadServer = {
    init : function(){
        jpf.DragMode.defineMode("dgdraghead", this);
    },
    
    start : function(host, heading){
        this.dragdata = {
            heading : heading, 
            indicator : host.__showDragHeading(heading, this.coordinates),
            host : host
        };

        //EVENT - cancellable: ondragstart
        if(host.dispatchEvent("ondragheadingstart") === false) return false;//(this.host.tempsel ? select(this.host.tempsel) : false);
        host.dragging = 2;

        jpf.DragMode.setMode("dgdraghead");
    },
    
    stop : function(runEvent){
        //Reset Objects
        var dg = this.dragdata.host;

        dg.dragging = 0;
        dg.__hideDragHeading();
        dg.__setStyleClass(this.dragdata.heading, "", ["state_down"]);
        
        dg.oSplitter.style.display = "none";
        dg.oSplitterLeft.style.display = "none";
        
        jpf.DragMode.clear();
        this.dragdata = null;
    },
    
    /* **********************
        Mouse Movements
    ***********************/
    
    onmousemove : function(e){
        if(!e) e = event;
        var dragdata = jpf.DgHeadServer .dragdata;
        
        //get Element at x, y
        if(dragdata.indicator) dragdata.indicator.style.top = "10000px";
        var el = document.elementFromPoint(e.clientX+document.documentElement.scrollLeft, e.clientY+document.documentElement.scrollTop);
        
        var o = el;
        while(o && !o.host && o.parentNode) o = o.parentNode;
        var host = o && o.host ? o.host : false;

        //Set Indicator
        dragdata.host.__moveDragHeading(e);
        
        //show highlighter..
        var dg = jpf.DgHeadServer.dragdata.host;
        if(host && host == jpf.DgHeadServer.dragdata.host && host.oExt != o){
            var oEl = dg.oSplitter;
            oEl.style.display = "block";
            
            var pos = jpf.compat.getAbsolutePosition(o);
            //var dgpos = jpf.compat.getAbsolutePosition(host.oExt);
            var toRight = (e.clientX+document.documentElement.scrollLeft - pos[0])/o.offsetWidth > 0.5
            oEl.style.left = pos[0] - 2 + (toRight ? o.offsetWidth : 0);
            oEl.style.top = pos[1] - 2;
        }
        else{
            var oEl = dg.oSplitter;
            oEl.style.display = "none";
        }
    },
    
    onmouseup : function(e){
        if(!e) e = event;
        var dragdata = jpf.DgHeadServer .dragdata;
        
        //get Element at x, y
        if(dragdata.indicator) dragdata.indicator.style.top = "10000px";
        var el = document.elementFromPoint(e.clientX+document.documentElement.scrollLeft, e.clientY+document.documentElement.scrollTop);
        
        var o = el;
        while(o && !o.host && o.parentNode) o = o.parentNode;
        var host = o && o.host ? o.host : false;

        //show highlighter..
        var dg = jpf.DgHeadServer.dragdata.host;
        if(host && host == jpf.DgHeadServer.dragdata.host && host.oExt != o){
            var pos = jpf.compat.getAbsolutePosition(o);
            
            var toRight = (e.clientX+document.documentElement.scrollLeft - pos[0])/o.offsetWidth > 0.5
            var hid = parseInt(o.getAttribute("hid")) + (toRight ? 1 : 0);
            dg.moveColumn(parseInt(dragdata.heading.getAttribute("hid")), hid);
        }
        
        //Run Events
        jpf.DgHeadServer.stop(true);
        
        //Clear Selection
        if(jpf.isNS){
            var selObj = window.getSelection();
            if(selObj) selObj.collapseToEnd();
        }
    }	
}
jpf.Init.add(jpf.DgHeadServer.init, jpf.DgHeadServer);

/**
 * Component providing a sortable, selectable grid containing scrollable information. 
 * Grid columns can be reordered and resized.
 *
 * @classDescription		This class creates a new datagrid
 * @return {Datagrid} Returns a new datagrid
 * @type {Datagrid}
 * @constructor
 * @addnode components:datagrid
 */
jpf.datagrid = function(pHtmlNode){
    jpf.register(this, "datagrid", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/

    this.focussable = true; // This object can get the focus
    this.multiselect = true; // Enable MultiSelect

    this.clearMessage = "There are no items"; // There is no spoon
    
    var colspan = 0;
    var totalWidth = 0;
    //this.htmlHeadings = [];
    this.headings = [];
    this.cssRules = [];
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif

    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/

    this.Data = function(xmlNode, data, fieldnum){
        if(xmlNode) this.select(xmlNode);
    }
    
    /**
    * This method imports a stylesheet defined in a multidimensional array 
    * @param {Array}	def Required Multidimensional array specifying 
    * @param {Object}	win Optional Reference to a window
    * @method
    * @deprecated
    */	
    function importStylesheet(def, win){
        //if(jpf.isOpera) return; //maybe version check here 9.21 it works, below might not
        for(var i=0;i<def.length;i++){
            if(def[i][1]){
                if(jpf.isIE)
                    (win || window).document.styleSheets[0].addRule(def[i][0], def[i][1]);
                else
                    (win || window).document.styleSheets[0].insertRule(def[i][0] + " {" + def[i][1] + "}", 0);
            }
        }
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/

    this.showSelection = function(){
        var Q = (this.current || this.__selected);
        var o = this.__getLayoutNode("Main", "body", this.oExt);
        o.scrollTop = (Q.offsetTop)-21;
    }

    /* ***********************
        Keyboard Support
    ************************/
    // #ifdef __WITH_KBSUPPORT
    this.keyHandler = function(key, ctrlKey, shiftKey){
        /*if(!this.oContainer || this.dragging) return;

        if(!this.__selected){
            if(o.firstChild.firstChild && o.firstChild.firstChild.firstChild)
                this.select(o.firstChild.firstChild.firstChild);
            else return;
            
            //this.__selected.scrollIntoView(true);
        }
        else 
        */	
        
        if(!this.__selected || !this.selected) return;	
        
        var Q = (this.current || this.__selected);
        var o = this.__getLayoutNode("Main", "body", this.oExt);
        var st = o.scrollTop;
        var oh = o.offsetHeight;
        
        if(this.colSorting && sortObj && (key > 32 && key < 41)) return; //Hack
        
        if(key == 27 && jpf.DgSizeServer.isActive)
            jpf.DgSizeServer.stop(true);
        else if(key == 38){
            //UP
            //REWRITE if(shiftKey) else select(htmlNode)
            var node = this.getNextTraverseSelected(this.selected, false);
            if(node) this.select(node, ctrlKey, shiftKey);
            
            if(Q.offsetTop < st+Q.offsetHeight+20 || Q.offsetTop > st + oh) o.scrollTop = (Q.offsetTop - Q.offsetHeight) - 20
                //Q.scrollIntoView(true);
        }
        else if(key == 40){
            //DOWN
            //REWRITE if(shiftKey) else select(htmlNode)
            var node = this.getNextTraverseSelected(this.selected, true);
            if(node) this.select(node, ctrlKey, shiftKey);
            
            if(Q.offsetTop < st || Q.offsetTop+Q.offsetHeight >= st + oh-20) o.scrollTop = (Q.offsetTop + 2*Q.offsetHeight) - o.offsetHeight + 20;
                //Q.scrollIntoView(false);
        }
        else if(key == 33){
            //PGUP
            var p = Q, count = parseInt((oh-50) / Q.offsetHeight);
            
            for(var i=0;i<count;i++)
                if(p.previousSibling) p = p.previousSibling;
                
            this.select(p, ctrlKey, shiftKey);
            o.scrollTop = (p.offsetTop)-21;
            //Q.scrollIntoView(true);
        }
        else if(key == 34){
            //PGDN
            var p = Q, count = parseInt((oh-50) / (Q.offsetHeight));
            
            for(var i=0;i<count;i++)
                if(p.nextSibling) p = p.nextSibling;
                
            this.select(p, ctrlKey, shiftKey);
            o.scrollTop = (p.offsetTop + p.offsetHeight) - o.offsetHeight+20;
            //Q.scrollIntoView(false);
        }
        else if(key == 36){
            //HOME
            this.select(Q.parentNode.firstChild, ctrlKey, shiftKey);
            o.scrollTop = 0;
            //Q.scrollIntoView(true);
        }
        else if(key == 35){
            //END
            this.select(Q.parentNode.lastChild, ctrlKey, shiftKey);
            o.scrollTop = o.scrollHeight;
            //Q.scrollIntoView(true);
        }
        else if(key == 46){
            //DEL
            var ln = this.getSelectCount();
            var xmlNode = ln == 1 ? this.selected : null;
            this.remove(xmlNode, true);
        }
        else if(ctrlKey && key == 65){
            this.selectAll();	
            return false;
        }
        else if(key == 13)
            this.dispatchEvent('onchoose');
        else return;

        return false;
    }
    // #endif
    
    /* ***********************
                SELECT
    ************************/
    
    this.__calcSelectRange = function(xmlStartNode, xmlEndNode){
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
    
    this.inherit(jpf.MultiSelect); /** @inherits jpf.MultiSelect */
    this.inherit(jpf.Cache); /** @inherits jpf.Cache */
    
    /* ***********************
            SKIN
    ************************/
    
    this.__deInitNode = function(xmlNode, htmlNode){
        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    }
    
    this.__updateNode = function(xmlNode, htmlNode){
        var dataset = this.dataset.set[htmlNode.getAttribute(jpf.XMLDatabase.htmlIdTag)];
        //Update Identity (Look)
        //this.__getLayoutNode("Item", "icon", htmlNode).style.backgroundImage = "url(" + this.iconPath + this.applyRuleSetOnNode("icon", xmlNode) + ")";
        //this.__getLayoutNode("Item", "caption", htmlNode).nodeValue = this.applyRuleSetOnNode("caption", xmlNode);

        var nodes = [];
        for(var j=0;j<htmlNode.childNodes.length;j++){
            if(htmlNode.childNodes[j].nodeType == 1) nodes.push(htmlNode.childNodes[j]);
        }

        //Build the Cells
        for(var i=0;i<this.headings.length;i++){
            var value = this.applyRuleSetOnNode(this.headings[i].xml.getAttribute("name"), xmlNode);
            if(dataset) dataset[i] = value;

            this.__getNewContext("Cell");
            var txtNode = this.__getLayoutNode("Cell", "caption", nodes[i]) || nodes[i];

            if(this.headings[i].xml.getAttribute("type") == "icon"){
                nodes[i].getElementsByTagName("img")[0].setAttribute("src", value ? this.iconPath + value : this.mediaPath + "spacer.gif");
            }
            else if(!value) jpf.XMLDatabase.setNodeValue(txtNode, " ");
            else jpf.XMLDatabase.setNodeValue(txtNode, value);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if(cssClass || this.dynCssClasses.length){
            this.__setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if(cssClass && !this.dynCssClasses.contains(cssClass)) this.dynCssClasses.push(cssClass);
        }
        // #endif
    }
    
    this.__moveNode = function(xmlNode, htmlNode){
        if(!htmlNode) return;
        var oPHtmlNode = htmlNode.parentNode;
        var beforeNode = xmlNode.nextSibling ? jpf.XMLDatabase.findHTMLNode(this.getNextTraverse(xmlNode), this) : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        
        //if(this.emptyMessage && !oPHtmlNode.childNodes.length) this.setEmpty(oPHtmlNode);
    }
    
    this.__setLoading = function(htmlNode, container){
        //xmlNode.setAttribute("_loaded", "potential");
        //jpf.XMLDatabase.htmlImport(this.__getLayoutNode("Loading"), container);
    }
    
    this.__removeLoading = function(htmlNode){
        //this.__getLayoutNode("Item", "container", htmlNode).innerHTML = "";
    }
    
    /* ***********************
            DATABINDING
    ************************/
    
    this.__selectDefault = function(XMLRoot){
        this.select(XMLRoot.selectSingleNode(this.ruleTraverse));
    }
    
    this.__addHeadings = function(xmlHeadings, headParent){
        // Calculate the control's inner width.
        var s = jpf.compat.getBox(jpf.compat.getStyle(this.oExt, "borderWidth"));
        var innerWidth = this.oExt.offsetWidth - (s[1] + s[3]);	// Now everything needs to fit in 'innerWidth' pixels.

        // Calc/retrieve heading sizes.
        var colWidths = new Array();
        var pixelsLeft = innerWidth;
        var colsLeft = xmlHeadings.length;
        for (var iHeading=0; iHeading<xmlHeadings.length; iHeading++)
        {
            var xmlHeading = xmlHeadings[iHeading];
            var xmlWidth = xmlHeading.getAttribute("width");
            if (typeof(xmlWidth) == "string" && xmlWidth.indexOf("%") != -1)
                xmlWidth = Math.round ((parseInt(xmlWidth) * innerWidth) / 100);
            else if (typeof(xmlWidth) == "string")				
                xmlWidth = parseInt(xmlWidth) || "*";

            if (typeof(xmlWidth) == "number")
            {
                // The width is beknownst to us. Do some min/max clampery, if applicable. 
                // Except for border/padding, because we don't know of those yet.
                xmlWidth = Math.min(xmlWidth, parseInt(xmlHeading.getAttribute("maxwidth"))||99999999);
                xmlWidth = Math.max(xmlWidth, parseInt(xmlHeading.getAttribute("minwidth"))||0);
                colWidths[iHeading] = xmlWidth;
                pixelsLeft -= xmlWidth;
                colsLeft--;
            }
        }
        
        var pixelsPerColumn = Math.round(pixelsLeft/colsLeft);
        for (var iHeading=0; iHeading<xmlHeadings.length; iHeading++)
        {
            if (!colWidths[iHeading])
            {
                colsLeft--;
                colWidths[iHeading] = colsLeft?pixelsPerColumn:pixelsLeft;
                pixelsLeft-=colWidths[iHeading];
            }
        }

        // Create the HTML components, calculate the desired widths, but don't size them yet.
        for (var iHeading=0; iHeading<xmlHeadings.length; iHeading++)
        {
            var xmlHeading = xmlHeadings[iHeading];
            //Check Colspan settings
            if(--this.colspan > 0){
                this.headings.push({
                    xml : xmlHeading
                });
                continue;
            }
            colspan = xmlHeading.getAttribute("span") || 1;
            xmlHeading.setAttribute("name", xmlHeading.getAttribute("name").toLowerCase());

            //Set CSS
            var cssClass = "col" + this.uniqueId + iHeading;
            var cssRule = "width:" + (colWidths[iHeading] - this.cellBorderPadding) + "px;" + (xmlHeading.getAttribute("align") ? "text-align:" + xmlHeading.getAttribute("align") : "");
            this.cssRules.push(["." + cssClass, cssRule]);
            
            //Get Width (possibly over colspan)
            var wt = colWidths[iHeading];
            for(var q=xmlHeading,i=1;i<colspan;i++){
                if((q = q.nextSibling).nodeType != 1 && i--) continue; //for Mozilla
                wt += parseInt(q.getAttribute("width"));
            }
    
            totalWidth += wt;
            
            //Add to htmlRoot
            this.__getNewContext("HeadItem");
            var Head = this.__getLayoutNode("HeadItem");
            Head.setAttribute("class", cssClass);
    
            if(colspan) Head.setAttribute("style", "width:" + (wt) + "px;" + (xmlHeading.getAttribute("align") ? "text-align:" + xmlHeading.getAttribute("align") : ""));//hack
            var hCaption = this.__getLayoutNode("HeadItem", "caption");
    
            if(xmlHeading.getAttribute("icon")){
                hCaption.nodeValue = "";
                hCaption.parentNode.appendChild(hCaption.parentNode.ownerDocument.createElement("img")).setAttribute("src", this.iconPath + xmlHeading.getAttribute("icon"));
            }
            else{
                //#ifdef __DEBUG
                if(!xmlHeading.getAttribute("caption")){
                    throw new Error(0, jpf.formErrorString(0, this, "rendering data for datagrid", "Missing caption attribute in heading", xmlHeading));	
                }
                //#endif
            
                hCaption.nodeValue = xmlHeading.getAttribute("caption");
            }
    
            //Import Head XML -> HTML
            var Head = jpf.XMLDatabase.htmlImport(Head, headParent);
    
            // Query the padding and border so the css rule actually produces the correct width.
            var padding = (parseInt(jpf.compat.getStyle(Head, "paddingLeft")) || 0) + (parseInt(jpf.compat.getStyle(Head, "paddingRight")) || 0);
            var border = (parseInt(jpf.compat.getStyle(Head, "borderLeftWidth")) || 0) + (parseInt(jpf.compat.getStyle(Head, "borderRightWidth")) || 0);
            Head.style.width = Math.max(0,wt-(padding+border)) + "px";
            
            //Add to this.headings
            var hid = this.headings.push({
                xml : xmlHeading,
                html : Head,
                width : Math.max(wt,padding+border),
                colspan : colspan,
                cssClass : cssClass
            }) - 1;

            Head.host = this;
            Head.setAttribute("hid", hid);
            
            /* Moving a column */
            Head.onmousedown = function(e){
                if(!e) e = event;
                e.cancelBubble = true;
                
                if(!jpf.isIE && !jpf.DgHeadServer.coordinates) return; //firefox quick fix
                
                // Sizing
                if(this.host.colSizing){
                    var xpos = e.layerX ? e.layerX - jpf.DgHeadServer.coordinates.srcElement.offsetLeft : e.offsetX;
                    var onRight = this.offsetWidth - xpos < 6;
                    var onLeft = xpos < 3;
                    if(onLeft || onRight){
                        jpf.DgSizeServer.sizeOffset = (onRight ? this.offsetWidth-xpos : -xpos)-3; // Fixme: where the hell does this 3 come from?
                        var sizeCol = onRight ? this : this.previousSibling;
                        if (sizeCol) // Make sure the user is not sizing column -1.


                        {
                            var xmlHead = sizeCol.host.headings[sizeCol.hid].xml;
                            if ((parseInt (xmlHead.getAttribute("minwidth")) || 0) != (parseInt (xmlHead.getAttribute("maxwidth")) || 9999999))
                            {
                                jpf.DgSizeServer.start(this.host, sizeCol);
                            }
                        }
                        return;
                    }

                }
                
                if(this.host.colSorting) 
                    this.host.__setStyleClass(this, "state_down");
                
                //Dragging
                if(this.host.colMoving){
                    this.host.dragging = 1;
                    this.host.oSplitter.className = "dg_move_headers";
                    jpf.DgHeadServer.coordinates = {
                        srcElement : this, 
                        offsetX : e.layerX ? e.layerX - this.offsetLeft : e.offsetX, 
                        offsetY : e.layerY ? e.layerY - this.offsetTop : e.offsetY,
                        clientX : e.clientX, 
                        clientY : e.clientY
                    };
                }
            }

            Head.__isSizingColumn = function(xpos) {
                var onRight = this.offsetWidth - xpos < 6;
                var onLeft = xpos < 3;
                if(onLeft || onRight)
                {
                    col = onRight ? this : this.previousSibling;
                    return col || -1;
                }
            }
        
            Head.__isSizeableColumn = function(sizeCol) {
                var xmlHead = sizeCol.host.headings[sizeCol.hid].xml;
                if ((parseInt (xmlHead.getAttribute("minwidth")) || 0) != (parseInt (xmlHead.getAttribute("maxwidth")) || 9999999))
                    return true;
            }

            Head.onmousemove = function(e){
                if(!jpf.isIE && !jpf.DgHeadServer.coordinates) return;
                if(!e) var e = event;
                
                //Sizing
                if(!this.host.colSizing) return;
                
                var xpos = e.layerX ? e.layerX - jpf.DgHeadServer.coordinates.srcElement.offsetLeft : e.offsetX;
                var sizeCol = this.__isSizingColumn(xpos)	
                if (sizeCol && sizeCol != -1) // Make sure the user is not sizing column -1.
                {
                    var xmlHead = sizeCol.host.headings[sizeCol.hid].xml;
                    if ((parseInt (xmlHead.getAttribute("minwidth")) || 0) != (parseInt (xmlHead.getAttribute("maxwidth")) || 9999999))
                        this.style.cursor = "w-resize";
                }
                else
                    this.style.cursor = "default";
                    
                if (!sizeCol)
                {
                    //Dragging
                    if(this.host.dragging != 1) return;//e.button != 1 || 
                    if(Math.abs(jpf.DgHeadServer.coordinates.offsetX - (e.layerX ? e.layerX - jpf.DgHeadServer.coordinates.srcElement.offsetLeft : e.offsetX)) < 6 && Math.abs(jpf.DgHeadServer.coordinates.offsetY - (e.layerX ? e.layerY - jpf.DgHeadServer.coordinates.srcElement.offsetTop : e.offsetY)) < 6)
                        return;
        
                    jpf.DgHeadServer.start(this.host, this);
                }
            }
            
            Head.onmouseup = function(){
                this.host.dragging = 0;
                this.host.oSplitter.style.display = "none";
                this.host.__setStyleClass(this, "", ["state_down"]);
            }
            
            Head.ondragmove = 
            Head.ondragstart = function(){return false}
            
            /* Sorting a column */
            Head.onclick = function(){
                this.host.sortColumn(this.getAttribute("hid"));
            }
            
            Head.ondblclick = function(e)
            {
                if(!this.host.colSizing) return;
                
                // Autosize
                if(!e) var e = event;
                var xpos = e.layerX ? e.layerX - jpf.DgHeadServer.coordinates.srcElement.offsetLeft : e.offsetX;
                var sizeCol = this.__isSizingColumn(xpos)	
                if (sizeCol && sizeCol != -1 && this.__isSizeableColumn(sizeCol)) // Make sure the user is not sizing column -1.
                {
                    // Autosize the heading
// 				sizeCol.style.width = "auto"; 
                    var minWidth = 0;// sizeCol.offsetWidth;
                    jpf.setStyleRule("." + this.host.headings[sizeCol.hid].cssClass, "width", "auto");
                    
                    // Iterate over all the cells. This ain't not no quick.
                    var nodes = this.host.oExt.lastChild.childNodes;
                    for(var i=0; i<nodes.length; i++)
                        minWidth = Math.max(minWidth, nodes[i].childNodes[sizeCol.hid].offsetWidth);
                    this.host.sizeColumn (sizeCol.hid, minWidth);
                    this.host.__storeRelativeWidths();
                }
            }
            
        } // for(iHeading)

        // Store the relative sizes for later use.
        this.__storeRelativeWidths();
    }

    this.__loaddatabinding = function(){
        var nSibl = this.oExt.nextSibling;
        document.body.appendChild(this.oExt);
        
        var headParent = this.__getLayoutNode("Main", "head", this.oExt);
        
        this.__initDragHeading();

        // Measure Cell
        this.__getNewContext("Cell");
        var newCell = jpf.XMLDatabase.htmlImport(this.__getLayoutNode("Cell"), this.oInt);
        newCell.style.display = "block";
        //newCell.style.width = "1px";
        //newCell.style.height = "1px";
        var diff = jpf.compat.getDiff(newCell);
        newCell.parentNode.removeChild(newCell);
        this.cellBorderPadding = diff[0];
        
        //Set Up Headings
        this.__addHeadings(this.bindingRules.heading, headParent);
        this.cssRules.push([".row" + this.uniqueId, "width:" + (totalWidth) + "px"]);

        //Add extra header for empty space....
        this.__getNewContext("HeadItem");
        this.__getLayoutNode("HeadItem", "caption").nodeValue = "";
        //this.__getLayoutNode("HeadItem").setAttribute("style", "width:" + (this.jml.getAttribute("width")-totalWidth) + "px");
        this.__getLayoutNode("HeadItem").setAttribute("class", "lastHead");
        if(jpf.isIE6) this.__getLayoutNode("HeadItem").setAttribute("style", "display:none");
        jpf.XMLDatabase.htmlImport(this.__getLayoutNode("HeadItem"), headParent);

        //Activate CSS Rules
        importStylesheet(this.cssRules, window);
        this.__getLayoutNode("Main", "body", this.oExt).onscroll = new Function('var o = jpf.lookup(' + this.uniqueId + '); var head = o.__getLayoutNode("Main", "scrollhead", o.oExt);head.scrollLeft = this.scrollLeft;');
        
        pHtmlNode.insertBefore(this.oExt, nSibl);
    }
    
    this.__unloaddatabinding = function(){
        var headParent = this.__getLayoutNode("Main", "head", this.oExt);
        for(var i=0;i<headParent.childNodes.length;i++){
            headParent.childNodes[i].host = null;
            headParent.childNodes[i].onmousedown = null;
            headParent.childNodes[i].__isSizingColumn = null;
            headParent.childNodes[i].__isSizeableColumn = null;
            headParent.childNodes[i].onmousemove = null;
            headParent.childNodes[i].onmouseup = null;
            headParent.childNodes[i].ondragmove = null;
            headParent.childNodes[i].ondragstart = null;
            headParent.childNodes[i].onclick = null;
            headParent.childNodes[i].ondblclick = null;
        }
        
        this.__getLayoutNode("Main", "body", this.oExt).onscroll = null;
        
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
    this.dataset = {set:{},seq:[]};
    //<CSS select="@new='true'" default="classname" />
    this.__add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        var dataset = [];
        
        //Build Row
        this.__getNewContext("Row");
        var Row = this.__getLayoutNode("Row");
        Row.setAttribute("id", Lid);
        Row.setAttribute("class", "row" + this.uniqueId);//"width:" + (totalWidth+40) + "px");
        Row.setAttribute("ondblclick", 'jpf.lookup(' + this.uniqueId + ').choose()');
        Row.setAttribute("onmousedown", 'var o = jpf.lookup(' + this.uniqueId + ');o.select(this, event.ctrlKey, event.shiftKey);');//, true;o.dragging=1;
        //Row.setAttribute("onmouseup", 'var o = jpf.lookup(' + this.uniqueId + ');o.select(this, event.ctrlKey, event.shiftKey);o.dragging=false;');
        
        //Build the Cells
        for(var i=0;i<this.headings.length;i++){
            this.__getNewContext("Cell");
            var value = this.applyRuleSetOnNode(this.headings[i].xml.getAttribute("name"), xmlNode);
            
            //(i == this.colCount-1 ? "width=100%" : "" )
            var Cell = this.__setStyleClass(this.__getLayoutNode("Cell"), "col" + this.uniqueId + i);
            var txtNode = this.__getLayoutNode("Cell", "caption");

            if(this.headings[i].xml.getAttribute("type") == "icon"){
                txtNode.nodeValue = "";
                txtNode.parentNode.appendChild(txtNode.parentNode.ownerDocument.createElement("img")).setAttribute("src", value ? this.iconPath + value : this.mediaPath + "spacer.gif");
            }
            else if(!value) jpf.XMLDatabase.setNodeValue(txtNode, " ");
            else jpf.XMLDatabase.setNodeValue(txtNode, value);

            Row.appendChild(Cell);
            dataset.push(value);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if(cssClass){
            this.__setStyleClass(Row, cssClass);
            if(cssClass) this.dynCssClasses.push(cssClass);
        }
        // #endif

        //return jpf.XMLDatabase.htmlImport(Row, htmlParentNode || this.oInt, beforeNode);
        if(htmlParentNode) jpf.XMLDatabase.htmlImport(Row, htmlParentNode, beforeNode);
        else this.nodes.push(Row);
        
        dataset.id = Lid;
        this.dataset.set[Lid] = dataset;
        dataset.index = this.dataset.seq.push(dataset);
    }
    
    this.__fill = function(nodes){
        jpf.XMLDatabase.htmlImport(this.nodes, this.oInt);
        this.nodes.length = 0;
    }

    /* ***********************
            DRAGDROP
    ************************/
    
    // #ifdef __WITH_DRAGDROP
    this.__showDragIndicator = function(sel, e){
        var x = e.offsetX;
        var y = e.offsetY;

        this.oDrag.startX = x;
        this.oDrag.startY = y;

        document.body.appendChild(this.oDrag);
        //this.__updateNode(this.selected, this.oDrag); // Solution should be found to have this on conditionally
        
        return this.oDrag;
    }
    
    this.__hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    }
    
    this.__moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX) + "px";// - this.oDrag.startX
        this.oDrag.style.top = (e.clientY+15) + "px";// - this.oDrag.startY
    }
    
    this.__initDragDrop = function(){
        if(!this.__hasLayoutNode("DragIndicator")) return;
        this.oDrag = jpf.XMLDatabase.htmlImport(this.__getLayoutNode("DragIndicator"), document.body);
        
        this.oDrag.style.zIndex = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor = "default";
        this.oDrag.style.display = "none";
    }
    
    this.__dragout = 
    this.__dragover = 
    this.__dragdrop = function(){}
    
    this.inherit(jpf.DragDrop); /** @inherits jpf.DragDrop */
    // #endif
    
    /* ***********************
            DRAGDROP
            headings
    ************************/
    
    this.__showDragHeading = function(heading, e){
        var x = e.offsetX;
        var y = e.offsetY;

        this.oDragHeading.startX = x;
        this.oDragHeading.startY = y;
        this.oDragHeading.style.left = e.clientX;
        this.oDragHeading.style.top = e.clientY;

        
        document.body.appendChild(this.oDragHeading);
        //this.oDragHeading.getElementsByTagName("DIV")[0].innerHTML = this.__selected.innerHTML;
        //this.oDragHeading.getElementsByTagName("IMG")[0].src = this.__selected.parentNode.parentNode.childNodes[1].firstChild.src;
        this.oDragHeading.innerHTML = heading.innerHTML;
        
        var diff = jpf.compat.getDiff(heading);
        this.oDragHeading.style.width = jpf.compat.getStyle(heading, "width");
        this.oDragHeading.style.height = jpf.compat.getStyle(heading, "height");;
        this.oDragHeading.style.padding = jpf.compat.getStyle(heading, "padding");;
        
        return this.oDragHeading;
    }
    
    this.__hideDragHeading = function(){
        this.oDragHeading.style.display = "none";
    }
    
    this.__moveDragHeading = function(e){
        this.oDragHeading.style.left = (e.clientX - this.oDragHeading.startX) + "px";
        this.oDragHeading.style.top = (e.clientY - this.oDragHeading.startY) + "px";
    }
    
    this.__initDragHeading = function(){
        if(!this.__hasLayoutNode("DragHeading") || this.oDragHeading) return;
        this.oDragHeading = jpf.XMLDatabase.htmlImport(this.__getLayoutNode("DragHeading"), document.body);
        this.oSplitter = jpf.XMLDatabase.htmlImport(this.__getLayoutNode("Splitter"), document.body);
        this.oSplitterLeft = this.oSplitter.parentNode.appendChild(this.oSplitter.cloneNode(true));
        
        this.oDragHeading.style.zIndex = 1000000;
        this.oDragHeading.style.position = "absolute";
        this.oDragHeading.style.cursor = "default";
        this.oDragHeading.style.display = "none";
    }
    
    this.__dragout = 
    this.__dragover = 
    this.__dragdrop = function(){}
    
    this.hideColumn = function(nr){
        jpf.setStyleRule(".col" + this.uniqueId + nr, "visibility", "hidden");
    }
    
    this.showColumn = function(){
        
    }
    
    this.moveColumn = function(from, to){
        if(from == to-1 || from == to) return;
        
        var pHeadings = this.__getLayoutNode("Main", "head", this.oExt);
        pHeadings.insertBefore(this.headings[from].html, this.headings[to] ? this.headings[to].html : pHeadings.lastChild);
        
        var min = Math.min(from, to), max = Math.max(from, to), htmlHeading = [];
        for(var i=0;i<min;i++) htmlHeading.push(this.headings[i]);

        if(min != from) this.headings[from].html.setAttribute("hid", htmlHeading.push(this.headings[from])-1);
        for(var i=min==from?min+1:min;i<max;i++)
            this.headings[i].html.setAttribute("hid", htmlHeading.push(this.headings[i])-1);
        if(min == from) this.headings[from].html.setAttribute("hid", htmlHeading.push(this.headings[from])-1);

        for(var i=max==from?max+1:max;i<this.headings.length;i++)
            this.headings[i].html.setAttribute("hid", htmlHeading.push(this.headings[i])-1);
        
        //if(this.htmlHeadings.length != htmlHeading.length) debugger;
        this.headings = htmlHeading;
        
        var nodes = this.__getLayoutNode("Main", "body", this.oExt).childNodes;
        for(var i=0;i<nodes.length;i++){
            nodes[i].insertBefore(nodes[i].childNodes[from], nodes[i].childNodes[to] || null);
        }
    }

    var sortObj = new jpf.Sort();
    this.sortAscending = true;
    this.currentSortColumn = null;
    this.sortColumn = function(nr){
        if(!this.colSorting) return;
        
        //Profiler.start(true);
        var sel = this.getSelection();
        for(var ids=[],i=0;i<sel.length;i++) ids.push(sel[i].getAttribute(jpf.XMLDatabase.xmlIdTag) + "|" + this.uniqueId);
        sel = null;
        //this.clearSelection();
        
        this.sortAscending = this.currentSortColumn == nr ? !this.sortAscending : true;
        sortObj.set({
            //method : sortCompare,
            getValue : function(item){return item[nr];},
            isAscending : this.sortAscending,
            type : "alpha"
        });
        this.dataset.seq = sortObj.apply(this.dataset.seq);

        var strHtml = this.oInt.innerHTML;
        var htmlNodes = strHtml.split("\n");
        var resultNodes = [];
        for(var i=0;i<htmlNodes.length;i++){
            htmlNodes[i].match(/id\=(\d+\|\d+\|\d+)/);
            resultNodes[RegExp.$1] = htmlNodes[i] + "\n";
        }

        //if(this.sortAscending) this.dataset.seq.invert();

        
        for(var sortNodes=[],i=0;i<this.dataset.seq.length;i++){
            if(this.dataset.seq[i])
                sortNodes.push(resultNodes[this.dataset.seq[i].id]);
        }

        this.oInt.innerHTML = sortNodes.join("");
        
        for(var i=0;i<ids.length;i++) 
            this.select(ids[i], true, null, true, true, true); 
        
        //Profiler.end();
        //alert(Profiler.totalTime);
        
        this.currentSortColumn = nr;
    }
    
    this.updateWindowSize = function(force)
    {
        // Size the header
        var fNode = jpf.compat.getFirstElement(this.oExt);
        
        var oldWidth = fNode.offsetWidth; // Old size.
        if (oldWidth != this.oInt.clientWidth || force) 
        {
            var innerWidth = this.oInt.clientWidth; // IE only?
            fNode.style.width = innerWidth + "px";
            
            if (this.headings && this.headings.length)
            {
                // Pass 1: Calculate the minimum/maximum usage for all following columns based on border, padding and min-width attribute.
                var minWidths = new Array();
                var maxWidths = new Array();
                var minUsage = 0, maxUsage = 0, curUsage = 0;
                for (var i=0; i<this.headings.length; i++)
                {
                    // User defined minimum width.
                    var minWidth = parseInt(this.headings[i].xml.getAttribute("minwidth"))||0;
                    
                    // Take the header's border and padding.
                    var diff = jpf.compat.getWidthDiff(this.headings[i].html);

                    minWidths[i] = Math.max(diff, minWidth);
                    maxWidths[i] = parseInt(this.headings[i].xml.getAttribute("maxwidth"))||999999999;

                    minUsage += minWidths[i];
                    maxUsage += maxWidths[i];
                    curUsage += this.headings[i].width;
                }

                // If there's blank space at the end, we'll just be sizing emptyness. Which is fairly easy.
                if ((curUsage < oldWidth && innerWidth > oldWidth) ||
                        (curUsage < oldWidth && innerWidth < oldWidth && innerWidth >= curUsage))
                {
                    jpf.setStyleRule(".row" + this.uniqueId, "width", (innerWidth) + "px");
                    return; // Do jack.
                }

                // Clamp the size to min/border/padding and max widths.
                innerWidth = Math.min (Math.max (innerWidth, minUsage), maxUsage);

                // Store all relative widths and the total, so we can keep the ratios the same.
                var relativeTotal = 0, fixedTotal = 0;
                var oldRelativeTotal = 0;
                for (var i=0; i<this.headings.length; i++)
                {
                    if (this.headings[i].relativeWidth)
                    {
                        oldRelativeTotal += this.headings[i].relativeWidth; // Before sizing.
                        relativeTotal += this.headings[i].width;
                    }
                    else fixedTotal += this.headings[i].width;
                }

                // Crunch the relative columns first until they hit the minimum size. Then try the fixed columns.
                var newRelativeTotal = innerWidth - fixedTotal; // Space to divide over the relative columns.

                // Relative, first pass. We'll divide newRelativeTotal over all relative columns, with the exception of the ones that 
                // have complaints due to min or maximum widths. We'll remove these from the equasion.

                var usedWidth = 0;
                var relativeLeft = newRelativeTotal;
                var oldRelativeLeft = oldRelativeTotal;
                
                for (var i=0; i<this.headings.length; i++)
                    this.headings[i].clamped = undefined;
                    
                var nRelColsLeft = 0;
                for (var i=0; i<this.headings.length; i++)
                    if (this.headings[i].relativeWidth) nRelColsLeft++;
                    
                var nObjections;
                do
                {
                    nObjections = 0;
                    var passRelLeft = relativeLeft;
                    var passOldRelLeft = oldRelativeLeft;
                    for (var i=0; i<this.headings.length; i++)
                    {
                        if (this.headings[i].relativeWidth && !this.headings[i].clamped)
                        {
                            var freeSize = (nRelColsLeft == 1) ? (newRelativeTotal - usedWidth) : Math.round((this.headings[i].relativeWidth * passRelLeft) / passOldRelLeft);
                            var clampedSize = Math.max(freeSize, minWidths[i]);
                            clampedSize = Math.min(clampedSize, maxWidths[i]);
                            if (freeSize != clampedSize)
                            {
                                // Objection, your honor!
                                relativeLeft -= clampedSize;
                                oldRelativeLeft -= this.headings[i].relativeWidth;
                                this.headings[i].width = clampedSize;
                                usedWidth += clampedSize;
                                this.headings[i].clamped = true;
                                nRelColsLeft--;
                                nObjections++;
                            }
                        }
                    }
                } while (nObjections);
                
                // Now process all the leftover relative columns that didn't have any objection.
                for (var i=0; i<this.headings.length; i++)
                {
                    if (this.headings[i].relativeWidth && !this.headings[i].clamped)
                    {
                            var freeSize = (nRelColsLeft == 1) ? (newRelativeTotal - usedWidth) : Math.round((this.headings[i].relativeWidth * passRelLeft) / passOldRelLeft);
                            this.headings[i].width = freeSize;
                            usedWidth += freeSize;
                            nRelColsLeft--;
                    }
                }
                
                // Adjust fixed width columns.
                var pixelsShort = (usedWidth + fixedTotal) - innerWidth;
                if (pixelsShort > 0)
                {
                    // We haven't the size. No, sir.
                    for (var i=this.headings.length-1; i>=0; i--)
                    {
                        if (!this.headings[i].relativeWidth)
                        {
                            var newWidth = Math.max(this.headings[i].width-pixelsShort, minWidths[i]);
                            pixelsShort -= (this.headings[i].width-newWidth);
                            this.headings[i].width = newWidth;
                            if (pixelsShort == 0)
                                break; // Done.	
                        }
                    }
                }
                    
                this.__updateHeadingSizes(0);
                this.innerWidth = innerWidth;
                this.__updateColumnSizes(0);
            }
        }
        
        this.dispatchEvent("onafterresize");
    }
    
    this.__updateHeadingSizes = function(nr)
    {
        for (var i=nr; i<this.headings.length; i++)
        {
            var diff = jpf.compat.getWidthDiff(this.headings[i].html);
            this.headings[i].html.style.width = Math.max (0,(this.headings[i].width-diff)) + "px";
        }
    }

    this.__storeRelativeWidths = function()
    {
        for (var i=0; i<this.headings.length; i++)
        {
            var xmlWidth = this.headings[i].xml.getAttribute("width");
            if (typeof(xmlWidth) == "string" && xmlWidth.indexOf("%") == -1)
                xmlWidth = parseInt(xmlWidth) || "*"; 
            if (typeof(xmlWidth) != "number") // Then it's relative.
                this.headings[i].relativeWidth = this.headings[i].width;
        }
    }

    this.__updateColumnSizes = function(nr)
    {
        // Pass 2: Apply the new sizes.
        for (var i=nr; i<this.headings.length; i++)
            jpf.setStyleRule("." + this.headings[i].cssClass, "width", (this.headings[i].width-(this.cellBorderPadding)) + "px");
        jpf.setStyleRule(".row" + this.uniqueId, "width", (this.innerWidth) + "px");
    }
    
    // This function updates all of the headings that need resizing.
    this.sizeColumn = function(nr, size, preview) 
    {
        // Calculate inner width of the datagrid control.
        var s = jpf.compat.getBox(jpf.compat.getStyle(this.oExt, "borderWidth"));
        this.innerWidth = this.oInt.clientWidth; //this.oExt.offsetWidth - (s[1] + s[3]);	// Now everything needs to fit in 'innerWidth' pixels.

        // Pass 1: Calculate the minimum usage for all following columns based on border, padding and min-width attribute.
        var minWidths = new Array();
        var minUsage = 0;
        for (var i=nr; i<this.headings.length; i++)
        {
            // User defined minimum width.
            var minWidth = parseInt(this.headings[i].xml.getAttribute("minwidth"))||0;
            
            // Take the header's border and padding.
            var diff = jpf.compat.getWidthDiff(this.headings[i].html);
            minWidths[i] = Math.max(diff, minWidth);
            if (i>nr) minUsage += minWidths[i];
        }

        // Clamp the size to min/border/padding and max widths.
        size = Math.max(minWidths[nr], size);
        size = Math.min(size, parseInt(this.headings[nr].xml.getAttribute("maxwidth"))||99999999);

        var leftWidth = 0, rightWidth = 0;
        for (var i=0;i<nr;i++)
            leftWidth += this.headings[i].width;
        for (var i=nr+1;i<this.headings.length;i++)
            rightWidth += this.headings[i].width;
        size = Math.min(size, this.innerWidth-(leftWidth+minUsage)); // Clamp to the right columns' minimum values as well.			
            
        if (size > this.headings[nr].width && leftWidth+size+rightWidth <= this.innerWidth)
            this.headings[nr].width = size; // Nothing fancy to do.
        else
        {
            // Store all relative widths and the total, so we can keep the ratios the same.
            var relativeRightTotal = 0;
            var oldRelativeRightTotal = 0;
            for (var i=nr+1; i<this.headings.length; i++)
            {
                if (this.headings[i].relativeWidth)
                {
                    oldRelativeRightTotal += this.headings[i].relativeWidth; // Before sizing.
                    relativeRightTotal += this.headings[i].width;
                }
            }
            
            if (size != this.headings[nr].width)
            {
                // Sizing right. Crunch the relative columns first until they hit the minimum size. Then try the fixed columns.
                var spaceAvailable = this.innerWidth - (leftWidth+size); // This is what we have divide the pixels over.
                if (size < this.headings[nr].width)
                    spaceAvailable = rightWidth + (this.headings[nr].width-size);
                    
                var fixedRightTotal = rightWidth - relativeRightTotal; // This is what we had for fixed columns.
                var newRelativeTotal = spaceAvailable - fixedRightTotal; // Space to divide over the relative columns.

                var relativeUsed = 0;
                for (var i=nr+1;i<this.headings.length;i++)
                {
                    if (this.headings[i].relativeWidth)
                    {
                        // Fixme: this could overflow by one pixel due to roundoff errors.
                        var colSize = Math.round((this.headings[i].relativeWidth * newRelativeTotal)/oldRelativeRightTotal);
                        colSize = Math.max(colSize, minWidths[i]);
                        colSize = Math.min(colSize, parseInt(this.headings[i].xml.getAttribute("maxwidth"))||99999999);
                        relativeUsed += colSize;
                        rightWidth += (colSize - this.headings[i].width); // Adjust rightWidth.
                        this.headings[i].width = colSize;
                    }
                }
                
                // Adjust fixed width columns.
                var pixelsShort = rightWidth-spaceAvailable;
                if (pixelsShort > 0)
                {
                    for (var i=this.headings.length-1; i>nr; i--)
                    {
                        var newWidth = Math.max(this.headings[i].width-pixelsShort, minWidths[i]);
                        pixelsShort -= (this.headings[i].width-newWidth);
                        this.headings[i].width = newWidth;
                        if (pixelsShort == 0)
                            break; // Done.				
                    }
                }
            }
            
            this.headings[nr].width = size; // Don't forget to set the sizing column.
        }

        // Pass 2: Apply the new sizes.
        this.__updateHeadingSizes(nr);
        if (!preview)
            this.__updateColumnSizes (nr);			
    }
    
    /* ***********************
      Other Inheritance
    ************************/
    
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    
    /* ***********************
                INIT
    ************************/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(); 
        this.oInt = this.__getLayoutNode("Main", "body", this.oExt);

        jpf.layoutServer.setRules(this.oInt, "dg" + this.uniqueId, "jpf.lookup(" + this.uniqueId + ").updateWindowSize();setTimeout(function(){jpf.lookup(" + this.uniqueId + ").updateWindowSize();});", true);

        var updScroll = this;
        updScroll.updateWindowSize(true);
        setTimeout(function(){updScroll.updateWindowSize(true);}); 
        this.addEventListener("onafterload", function(){
            // Once for scrollbar due to data changes. This gets processed when everything has been redrawn. Could move this to __fill or so.
            setTimeout(function(){updScroll.updateWindowSize(true);}); 	
        });
        this.oExt.onclick = function(){this.host.focus()}
        //this.oExt.onresize = function(){updScroll.updateWindowSize(true);}
        jpf.JMLParser.parseChildren(this.jml, null, this);
    }
    
    this.__loadJML = function(x){
        if(x.getAttribute("message")) this.clearMessage = x.getAttribute("message");
        this.colSizing = jpf.appsettings.colsizing && !jpf.isFalse(x.getAttribute("colsizing")) && jpf.isIE; //temp fix
        this.colMoving = jpf.appsettings.colmoving && !jpf.isFalse(x.getAttribute("colmoving")) && jpf.isIE;//temp fix
        this.colSorting = jpf.appsettings.colsorting && !jpf.isFalse(x.getAttribute("colsorting")) && jpf.isIE;//temp fix
    }
    
    this.__destroy = function(){
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
        this.oExt.onclick = null;
        this.oInt.onresize = null;
        
        jpf.layoutServer.removeRule(this.oInt, "dg" + this.uniqueId);
        jpf.layoutServer.activateRules(this.oInt);
    }
    
    this.counter = 0;
}
//#endif