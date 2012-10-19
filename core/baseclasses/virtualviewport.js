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

apf.__VIRTUALVIEWPORT__ = 1 << 19;

// #ifdef __WITH_VIRTUALVIEWPORT

/**
 * All elements inheriting from this {@link term.baseclass baseclass} can have a virtual viewport.
 *
 * @experimental This code has never been run. 
 * @constructor
 * @baseclass
 * @private
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org) & Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.VirtualViewport = function(){
    this.$init(true);

    this.$regbase = this.$regbase | apf.__VIRTUALVIEWPORT__;

    this.virtualVTimer = null;
    this._xmlUpdate    = this.$xmlUpdate;
    
    apf.setStyleClass(this.$ext, "virtual");
    
    this.$deInitNode = function(xmlNode, htmlNode){
        /*  
            Not the htmlNode is deleted, but the viewport is rerendered from this node on. 
            If viewport is too high either the render starting point is adjusted and
            a complete rerender is requested, or the last empty elements are hidden
        */
        this.$viewport.redraw();//very unoptimized
    };
    
    this.$moveNode = function(xmlNode, htmlNode){
        /*
            Do a remove when removed from current viewport
            Do an add when moved to current viewport
            Do a redraw from the first of either when both in viewport
        */
        this.$viewport.redraw();//very unoptimized
    };
    
    this.emptyNode = apf.xmldb.getXml("<empty />");
    this.$addEmpty = this.$add;
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //find new slot
        var htmlNode = this.$pHtmlDoc.getElementById(Lid);
        
        if(!htmlNode)
            return;
        
        //execute update
        this.$updateNode(xmlNode, htmlNode);//, noModifier);
    };

    this.$fill = function(){
        
    };
    
    this.clear = function(nomsg, do_event){
        if (this.clearSelection)
            this.clearSelection(!do_event);

        //this.documentId = this.xmlRoot = this.cacheId = null;

        if (typeof nomsg == "string") {
            var msgType = nomsg;
            nomsg = false;
            
            //@todo apf3.0 please use attr. inheritance
            if (!this[msgType + "-message"])
                this.$setInheritedAttribute(msgType + "-message");
        }

        if (!nomsg) {
            this.$viewport.offset = 0;
            this.$viewport.length = 0;
            this.$viewport.resize(0);
            if (this.$viewport.sb) 
                this.$viewport.sb.$update();
    
            if (this.$setClearMessage) {
                this.$setClearMessage(msgType 
                  ? this[msgType + "-message"] 
                  : this["empty-message"], msgType || "empty");
            }
        }
        else if(this.$removeClearMessage)
            this.$removeClearMessage();
        
        this.$viewport.cache = null;
    };

    var _self = this;
    this.$viewport = new apf.$viewportVirtual(this);
    
    this.getViewport = function(){
        return this.$viewport;
    }
    
    this.$isInViewport = function(xmlNode, struct){
        /*var marker = xmlNode.selectSingleNode("preceding-sibling::a_marker");
        var start = marker ? marker.getAttribute("end") : 0;
        
        if(!struct && this.$viewport.offset + this.$viewport.limit < start + 1)
            return false;
        
        var position = start;
        var nodes = (marker || xmlNode).selectNodes("following-sibling::"
              + this.each.split("|").join("following-sibling::"));
        
        for (var i = 0; i < nodes.length; i++) {
            ++position;
            if (nodes[i] == xmlNode)
                break;
        }
        
        if(struct) struct.position = position;
        
        if(this.$viewport.offset > position 
          || this.$viewport.offset + this.$viewport.limit < position)
            return false;
        
        return true;*/
        var nodes = this.getTraverseNodes();
        for (var i = 0, l = nodes.length; i < l; i++){
            if (nodes[i] == xmlNode)
                return true;
        }
        
        return false;
    };
    
    this.scrollTo = function(xmlNode, last){
        var sPos = {};
        this.$isInViewport(xmlNode, sPos);
        this.$viewport.change(sPos.position + (last ? this.$viewport.limit - 1 : 0));
    };
    
    /**
     * @todo this one should be optimized
     */
    this.getFirstTraverseNode = function(xmlNode){
        return this.getTraverseNodes(xmlNode)[0];
    };
    
    // #ifdef __ENABLE_VIRTUALDATASET
    
    /**
     * @private
     */
    this.$clearVirtualDataset = function(parentNode){
        var nodes = parentNode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--)
            parentNode.removeChild(nodes[i]);
    };

    /**
     * @private
     */
    this.$createVirtualDataset = function(xmlNode, length, docId) {
        var marker = xmlNode.selectSingleNode("a_marker") 
          || xmlNode.appendChild(xmlNode.ownerDocument.createElement("a_marker"));
        marker.setAttribute("start", "0");

        if (length) {
            marker.setAttribute("end",   length);
            marker.setAttribute("reserved", ++this.nodeCount[docId]);
            this.nodeCount[docId] += length;
        }
    };
    
    // #endif
    
    this.$xmlUpdate = function(){
        this.$viewport.cache  = null;
        this.$viewport.length = this.xmlRoot.selectNodes(this.each).length; //@todo fix this for virtual length
        this.$viewport.sb.$update(this.$container);
        this._xmlUpdate.apply(this, arguments);
    };
    
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(XMLRoot, this);

        //Reserve here a set of nodeConnect id's and add them to our initial marker
        //Init virtual dataset here
        
        this.$updateTraverseCache(XMLRoot, true);
        
        if (!this.renderRoot && !this.$cachedTraverseList.length)
            return this.clear();
        
        //this.$removeClearMessage();
        
        // #ifdef __ENABLE_VIRTUALDATASET
        //Initialize virtual dataset if load rule exists
        if (this.$hasBindRule("load"))
            this.$createVirtualDataset(XMLRoot);
        // #endif
        
        //Prepare viewport
        this.$viewport.cache  = null;
        this.$viewport.offset = 0;
        this.$viewport.length = this.$cachedTraverseList.length; //@todo fix this for virtual length
        if (this.$viewport.length < this.$viewport.limit)
            this.$viewport.resize(this.$viewport.length);
        this.$viewport.prepare();
        //this.$viewport.change(0);
        
        //Traverse through XMLTree
        var nodes = this.$addNodes(XMLRoot, null, null, this.renderRoot);
        
        //Build HTML
        //this.$fill(nodes);

        //Select First Child
        if (this.selectable) {
            if (this.autoselect) {
                if (nodes.length)
                    this.$selectDefault(XMLRoot);
                //#ifdef __WITH_PROPERTY_BINDING
                else
                    this.setProperty("selected", null); //@todo review this
                //#endif
            }
            else {
                this.clearSelection(true);
                var xmlNode = this.getFirstTraverseNode(); //should this be moved to the clearSelection function?
                if (xmlNode)
                    this.setCaret(xmlNode);
                //#ifdef __WITH_PROPERTY_BINDING
                this.setProperty("selected", null); //@todo review this
                this.setProperty("chosen", null);
                //#endif
            }
        }

        if (this.$focussable)
            apf.window.hasFocus(this) ? this.$focus() : this.$blur();
        
        this.$viewport.setScrollTop(0, true);
    };
    
    this.$loadSubData = function(){}; //We use the same process for subloading, it shouldn't be done twice
    
    // #ifdef __ENABLE_VIRTUALDATASET
    
    /**
     * @example <a:load get="call:getCategory(start, length, ascending)" total="@total" />
     */
    this.$loadPartialData = function(marker, start, length){
        //We should have a queing system here, disabled the check for now
        //if (this.$hasLoadStatus(xmlRootNode)) return;
        
        var loadNode, rule = this.$getBindRule("load", xmlRootNode);
        if (rule && (!rule[1] || rule[1](xmlRootNode))) {
            this.$setLoadStatus(xmlRootNode, "loading");
            
            var mdl = this.getModel(true);
            //#ifdef __DEBUG
            if (!mdl)
                throw new Error("Could not find model");
            
            if (!rule.getAttribute("total")) {
                throw new Error(apf.formatErrorString(this, "Loading data", 
                    "Error in load rule. Missing total xpath. Expecting <a:load total='xpath' />"));
            }
            //#endif

            mdl.$insertFrom(rule.getAttribute("get"), {
                //#ifdef __WITH_SORTING
                ascending  : this.$sort ? this.$sort.get().ascending : true,
                //#endif
                xmlNode     : loadNode,
                documentId  : this.documentId, //or should xmldb find this itself
                marker      : marker,
                start       : start,
                length      : length,
                insertPoint : this.xmlRoot, 
                amlNode     : this,
                callback    : function(xmlNode){
                    //#ifdef __WITH_PROPERTY_BINDING
                    _self.setProperty("root", _self.xmlRoot);
                    //#endif
                    
                    var length = parseInt(apf.queryValue(xmlNode, 
                        rule.getAttribute("total")));
                    
                    if (_self.$viewport.length != length) {
                        _self.$viewport.length = length;
                        
                        this.$createVirtualDataset(_self.xmlRoot, 
                            _self.$viewport.length, _self.documentId);
                    }
                }
            });
        }
    };
    
    //Consider moving these functions to the xmldatabase selectByXpath(xpath, from, length);
    function fillList(len, list, from){
        for (var i = 0; i < len; i++) 
            list.push(_self.documentId + "|" + (from+i));
    }
    
    function buildList(markers, markerId, distance, xml) {
        var marker, nodes, start,
            vlen = this.$viewport.limit,
            list = [];
        
        //Count from 0
        if (markerId == -1) {
            nodes    = xml.selectNodes(_self.each);
            start    = 0;
            marker   = markers[0];
        }
        else {
            //Count back from end of marker
            if (distance < 0) {
                fillList(Math.abs(distance), list, 
                    parseInt(marker.getAttribute("reserved")) + parseInt(marker.getAttribute("end"))
                    - parseInt(marker.getAttribute("start")) + distance);
                
                distance = 0;
                _self.$loadPartialData(marker);
                
                if (list.length == vlen)
                    return list;
            }
            
            nodes  = markers[markerId].selectNodes("following-sibling::"
              + this.each.split("|").join("following-sibling::"));
            start  = markers[markerId].getAttribute("end");
            marker = markers[++markerId];
        }
        
        do {
            //Add found nodes
            var loop = Math.min(marker.getAttribute("start") - start, vlen);//, nodes.length
            for (var i = distance; i < loop; i++)
                list.push(nodes[i]);
            
            if (list.length == vlen)
                break;
            
            //Add empty nodes
            var mlen = parseInt(marker.getAttribute("end")) - parseInt(marker.getAttribute("start"));
            fillList(Math.min(mlen, vlen - list.length), list, parseInt(marker.getAttribute("reserved")));
            
            //Add code here to trigger download of this missing info
            _self.$loadPartialData(marker);
            
            start    = parseInt(marker.getAttribute("end"));
            marker   = markers[++markerId];
            distance = 0;
        } 
        while (list.length < vlen && marker);
        
        _self.$viewport.cache = list;
        return list;
    }
    
    // #endif
    
    this.$updateTraverseCache = function(xmlNode, force){
        if (force || !this.$cachedTraverseList || this.$cachedTraverseList.name != this.each) {
            this.$cachedTraverseList = (xmlNode || this.xmlRoot).selectNodes(this.each);
            this.$cachedTraverseList.name = this.each;
        }
    };
    
    /**
     * Retrieves a nodelist containing the {@link term.datanode data nodes} which are rendered by
     * this element.
     *
     * @param {XMLElement} [xmlNode] the parent element on which the each query is applied.
     */
    var getTraverseNodes = this.getTraverseNodes = function(xmlNode){
        if (!this.xmlRoot)
            return;
        
        if (this.$viewport.cache)
            return this.$viewport.cache;

        //caching statement here
        this.$updateTraverseCache(xmlNode);

        var start = this.$viewport.offset,
            end   = Math.min(this.$cachedTraverseList.length, start + this.$viewport.limit);
        
        // #ifdef __ENABLE_VIRTUALDATASET
        var markers = (xmlNode || this.xmlRoot).selectNodes("a_marker");

        if (!markers.length) {
        //#endif
            
            //Special case for fully loaded virtual dataset
            var list = [];
            for (var i = start; i < end; i++) {
                list.push(this.$cachedTraverseList[i]);
            }

            //#ifdef __WITH_SORTING
            return this.$sort ? this.$sort.apply(list) : list;
            /* #else
            return list;
            #endif */
        
        // #ifdef __ENABLE_VIRTUALDATASET
        }

        for (var i = 0; i < markers.length; i++) {
            //Looking for marker that (partially) exceeds viewport's current position
            if (markers[i].getAttribute("end") < start) {
                //If this is the last marker, count from here
                if (i == markers.length - 1)
                    return buildList(markers, i, start - markers[i].getAttribute("end"), 
                      (xmlNode || this.xmlRoot));

                continue;
            }
            
            //There is overlap AND begin is IN marker
            if (markers[i].getAttribute("start") - end <= 0 
              && start >= markers[i].getAttribute("start"))
                return buildList(markers, i, start - markers[i].getAttribute("end"), 
                  (xmlNode || this.xmlRoot));

            //Marker is after viewport, there is no overlap
            else if (markers[i-1]) //Lets check the previous marker, if there is one
                return buildList(markers, i-1, start - markers[i-1].getAttribute("end"), 
                  (xmlNode || this.xmlRoot));
                
            //We have to count from the beginning
            else
                return buildList(markers, -1, start, (xmlNode || this.xmlRoot));
        }
        
        // #endif
    };
    
    var baseNTS = this.getNextTraverseSelected;
    this.getNextTraverseSelected = function(xmlNode, up, count){
        if (!xmlNode)
            xmlNode = this.selected;
        if (!count)
            count = 1;

        this.getTraverseNodes = apf.MultiselectBinding.prototype.getTraverseNodes;
        var node = baseNTS.call(this, xmlNode, up, count);
        this.getTraverseNodes = getTraverseNodes;
        
        return node;
        
//        if (node && node != xmlNode)
//            return node;

        //@todo treeArch support
        //this.getTraverseNodes()
//        var nodes = apf.MultiselectBinding.prototype.getTraverseNodes.call(_self), i = 0;
//        while (nodes[i] && nodes[i] != xmlNode)
//            i++;

//        if (up)
//            i = -1 * (nodes.length - i - 1);

//        this.$viewport.change(Math.max(0, this.$viewport.offset + i
//            + (up ? count : -1 * count)), null, true, true);
            
        //nodes = this.getTraverseNodes();
//        return nodes[up ? nodes.length - 1 : 0];
    };
    
    //@todo keyboard handlers for pgup/pgdown should measure items instead of assuming fixed height
    
    //Init
    this.caching = false; //for now, because the implications are unknown
};

apf.$viewportVirtual = function(amlNode){
    this.amlNode = amlNode;
    
    var _self = this;
    this.amlNode.addEventListener("mousescroll", function(e){
        if (!_self.scrollbar || _self.scrollbar.horizontal)
            return;
        
        if (e.returnValue === false)
            return;

        var div = _self.getScrollHeight() - _self.getHeight();
        if (div) {
            _self.setScrollTop(_self.getScrollTop() 
                + (-1 * e.delta * Math.min(45, _self.getHeight()/10)), false, true)
            
            e.preventDefault();
        }
    });
    
    apf.addListener(this.$getHtmlHost(), "scroll", function(){
        _self.setScrollTop(_self.getScrollTop());
    });
    
    amlNode.addEventListener("resize", function(){
        _self.$findNewLimit();
    });
    
    amlNode.addEventListener("afterload", function(){
        var itemHeight = _self.$getItemHeight();
        _self.$findNewLimit();
        
        if (itemHeight == 1000)
            _self.$findNewLimit();
    });
    
    if (!amlNode.scrollbar) {
        this.sb = new apf.scrollbar();
        
        this.sb.parentNode = new apf.Class().$init();
        this.sb.parentNode.$container = amlNode.$pHtmlNode;
        this.sb.parentNode.$int = amlNode.$pHtmlNode;
        this.sb.dispatchEvent("DOMNodeInsertedIntoDocument");
        
        this.sb.attach(this);
    }
    
    /* @todo
     * - Fix bug in optimization
     * - Fix flickering with larger viewport
     * - Get templates to work
     * - Firefox has problems with the scrollbar
     * / Fix scrolling of items bigger than viewport (limit is too tight sometimes)
     * - Improve pgup/pgdown
     * - Fix multigrid lists (thumbnail)
     * - Fix FF html conversion (insertHtmlNodes)
     * - Optimize grow function to use fill
     */
    //#ifdef __WITH_LAYOUT
//    apf.layout.setRules(amlNode.$container, "scrollbar", "\
//        var s = apf.all[" + _self.sb.$uniqueId + "];\
//        s.$update();\
//    ", true);
//    apf.layout.queue(amlNode.$container);
    //#endif
};

(function(){
    this.offset = 0;
    this.limit  = 2;
    this.length = 0;
    this.host   = this;
    this.cache  = null;
    this.inited = false;
    this.virtual = true;
    
    this.setScrollbar = function(scrollbar, onscroll){
       this.scrollbar = scrollbar;
       
       this.amlNode.addEventListener("scroll", onscroll);
    }
    
    this.isVisible = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.offsetHeight || htmlNode.offsetWidth ? true : false;
    }
    
    this.focus = function(){
        if (this.amlNode.focus && this.amlNode.$isWindowContainer !== true)
            this.amlNode.focus();
    }
    
    this.getScrollTop = function(){
        var htmlNode = this.$getHtmlHost();
        return (this.offset * this.$getItemHeight()) + htmlNode.scrollTop;
    }
    
    this.getScrollLeft = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.scrollLeft;
    }
    
    this.getScrollHeight = function(){
        return (this.length) * this.$getItemHeight();
    }
    
    this.getScrollWidth = function(){
        var htmlNode = this.$getHtmlHost();
        return (apf.isIE && htmlNode.lastChild 
            ? htmlNode.lastChild.offsetLeft 
                + htmlNode.lastChild.offsetWidth
                + apf.getBox(apf.getStyle(htmlNode, "padding"))[1]
                + (parseInt(apf.getStyle(htmlNode, "marginRight")) || 0)
            : htmlNode.scrollWidth);
    }
    
    this.getHeight = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.tagName == "HTML" || htmlNode.tagName == "BODY" 
            ? apf.getWindowHeight() 
            : apf.getHtmlInnerHeight(htmlNode);
    }
    
    this.getWidth = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.tagName == "HTML" || htmlNode.tagName == "BODY" 
            ? apf.getWindowHeight() 
            : apf.getHtmlInnerWidth(htmlNode);
    }
    
    this.setScrollTop = function(value, preventEvent, byUser){
        var htmlNode = this.$getHtmlHost();
        var itemHeight = this.$getItemHeight();

        this.change(Math.floor(value / itemHeight));
        
        htmlNode.scrollTop = value - (this.offset * itemHeight);
        
        if (!preventEvent) {
            this.amlNode.dispatchEvent("scroll", {
                direction : "vertical",
                byUser    : byUser,
                viewport  : this,
                scrollbar : this.scrollbar
            });
        }
    }
    
    this.setScrollLeft = function(value, preventEvent, byUser){
        var htmlNode = this.$getHtmlHost();
        
        htmlNode.scrollLeft = value;
        
        if (!preventEvent) {
            this.amlNode.dispatchEvent("scroll", {
                direction : "horizontal",
                byUser    : byUser,
                viewport  : this,
                scrollbar : this.scrollbar
            });
        }
    }
    
    this.scrollIntoView = function(xmlNode, toBottom){
        var _self = this.amlNode;
        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, _self);
        if (htmlNode && htmlNode.offsetTop - _self.$container.scrollTop > 0 
          && htmlNode.offsetTop + htmlNode.offsetHeight 
            - _self.$container.scrollTop < _self.$container.offsetHeight)
            return;
        
        if (this.amlNode.$sharedScrollbarMove)
            this.amlNode.$sharedScrollbarMove();
        
        var nr = apf.getChildNumber(xmlNode, 
            apf.MultiselectBinding.prototype.getTraverseNodes.call(_self));
        var itemHeight = this.$getItemHeight();
        
        this.setScrollTop(nr * itemHeight + (toBottom ? itemHeight - this.getHeight() : 0));
    }
    
    // *** Private *** //
    
    //Assume all items have the same height;
    //@todo this can be optimized by caching
    this.$getItemHeight = function(){
        if (this.amlNode.each && this.amlNode.xmlRoot) {
            var nodes = this.amlNode.getTraverseNodes();
            if (nodes.length) {
                var htmlNode = apf.xmldb.findHtmlNode(nodes[0], this.amlNode);
                if (htmlNode)
                    return this.$lastItemHeight = htmlNode.offsetHeight;
            }
        }
        
        return this.$lastItemHeight || 1000;
    }
    
    this.$getHtmlHost = function(){
        var htmlNode = this.amlNode.$int || this.amlNode.$container;
        return (htmlNode.tagName == "BODY" || htmlNode.tagName == "HTML" 
            ? (apf.isSafari || apf.isChrome ? document.body : htmlNode.parentNode) 
            : htmlNode);
    }

    // *** Implementation *** //

    this.draw = function(){
        this.inited = true;
        var limit = this.limit; this.limit = 0;
        this.resize(limit, true);
    }
    
    this.redraw = function(){
        this.change(this.offset, this.limit, true);
    }
    
    // set id's of xml to the viewport
    this.prepare = function(){
        if (!this.inited)
            this.draw();
        
        var _self = this.amlNode;
        var nodes = _self.getTraverseNodes();
        if (!nodes)
            return;
        
        var len    = nodes.length;
        var docId  = apf.xmldb.getXmlDocId(_self.xmlRoot),
            hNodes = _self.$container.childNodes, hNode;
        for (var j = 0, i = 0, l = hNodes.length; i < l; i++) {
            if (hNodes[i].nodeType != 1) continue;
            
            if (j >= len)
                hNodes[i].style.display = "none"; //Will ruin tables & lists
            else {
                hNode = hNodes[i];
                _self.$deselect(hNode);
                hNode.style.display = "block"; //Will ruin tables & lists
                apf.xmldb.nodeConnect(docId, nodes[j], hNode, _self);
            }
            
            j++;
        }
    };
    
    /**
     * Note: this function only supports single dimension items (also no grid, like thumbnails)
     */
    this.resize = function(limit, updateScrollbar){
        this.cache = null;
        
        var _self = this.amlNode;
        var i;
        //Viewport shrinks
        if (limit < this.limit) {
            var nodes = _self.$container.childNodes;
            for (i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].nodeType != 1) continue;
                _self.$container.removeChild(nodes[i]);
                if (--this.limit == limit) break;
            }
        }
        //Viewport grows
        else if (limit > this.limit) {
            for (i = this.limit; i < limit; i++) {
                _self.$addEmpty(_self.emptyNode, "", _self.xmlRoot, _self.$container);
            }
        }
        else
            return;
        
        this.limit = limit;
        
        if (updateScrollbar && this.sb)
            this.sb.$update(this.$container);
    };
    
    this.$findNewLimit = function(){
        if (!this.amlNode.xmlRoot || !this.amlNode.$ext.offsetHeight)
            return;
        
        var limit = Math.ceil(this.getHeight() / this.$getItemHeight() + 2);
        if (this.amlNode.$cachedTraverseList 
          && this.amlNode.$cachedTraverseList.length < limit)
            limit = this.amlNode.$cachedTraverseList.length;
        
        if (limit != this.limit) {
            this.resize(limit);
            this.redraw();
        }
    };
    
    /**
     *  @todo   This method should be optimized by checking if there is
     *          overlap between the new offset and the old one
     */
    this.change = function(offset, limit, force){
        var offsetN;
        var _self = this.amlNode;
        
        if (offset > this.length - this.limit) 
            offsetN = Math.floor(this.length - this.limit);
        else 
            offsetN = Math.floor(offset);
        
        if (offsetN < 0) 
            offsetN = 0;
        
        if (!limit)
            limit = this.limit;
        
        if (!force)
            force = apf.isGecko;
        
        var scrollTop = this.getScrollTop();
        
        this.cache   = null;
        var diff     = offsetN - this.offset,
            oldLimit = this.limit;
        if (diff * diff >= this.limit*this.limit) //there is no overlap
            diff = false;
        this.offset = offsetN;
        
        if (diff > 0) { //get last node before resize
            var lastNode = _self.$container.lastChild;
            if (lastNode.nodeType != 1)
                lastNode = lastNode.previousSibling;
        }
        
        //Traverse through XMLTree
        var nodes = _self.getTraverseNodes();
        if (!nodes || !nodes.length)
            return;
            
        if (nodes.length < this.limit) {
            if (offset > 0)
                alert("shouldnt get here");
            else
                this.resize(nodes.length);
        }

        var docId  = apf.xmldb.getXmlDocId(_self.xmlRoot),
            hNodes = _self.$container.childNodes,
            xmlNode, htmlNode, xmlPos, sel, len, j, i;

        //remove nodes from the beginning
        if (diff > 0) {
            xmlPos = oldLimit - diff;
            len    = hNodes.length,
            sel    = _self.$getSelection();
            for (j = 0, i = 0; j < diff && i < len; i++) {
                htmlNode = _self.$container.firstChild;
                if (htmlNode.nodeType == 1) {
                    j++;
                    xmlNode = nodes[xmlPos++];
                    if (xmlNode) {
                        apf.xmldb.nodeConnect(docId, xmlNode, htmlNode, _self);
                        _self.$updateNode(xmlNode, htmlNode);//, noModifier);
                        if (sel.indexOf(xmlNode) > -1)
                            _self.$select(htmlNode);
                        else
                            _self.$deselect(htmlNode);
                        htmlNode.style.display = "block";
                    }
                    else {
                        htmlNode.style.display = "none";
                    }
                }
                
                _self.$container.appendChild(htmlNode);
            }
        }
        //remove nodes from the end
        else if (diff < 0) {
            diff = diff * -1;
            xmlPos = 0; //should be adjusted for changing limit
            sel    = _self.$getSelection();
            for (j = 0, i = hNodes.length-1; j < diff && i >= 0; i++) {
                htmlNode = _self.$container.lastChild;
                if (htmlNode.nodeType == 1) {
                    j++;
                    xmlNode = nodes[xmlPos++];
                    apf.xmldb.nodeConnect(docId, xmlNode, htmlNode, _self);
                    _self.$updateNode(xmlNode, htmlNode);//, noModifier);
                    if (sel.indexOf(xmlNode) > -1)
                        _self.$select(htmlNode);
                    else
                        _self.$deselect(htmlNode);
                    htmlNode.style.display = "block";
                }

                _self.$container.insertBefore(htmlNode, _self.$container.firstChild);
            }
        }
        //Recalc all nodes
        else if (force || diff === false){
            len = hNodes.length; 
            sel = _self.$getSelection();
            for (j = 0, i = 0; i < len; i++) {
                htmlNode = hNodes[i];
                if (htmlNode.nodeType == 1) {
                    xmlNode = nodes[j++];
                    apf.xmldb.nodeConnect(docId, xmlNode, htmlNode, _self);
                    _self.$updateNode(xmlNode, htmlNode);//, noModifier);
                    
                    if (sel.indexOf(xmlNode) > -1)
                        _self.$select(htmlNode);
                    else
                        _self.$deselect(htmlNode);
                }
            }
        }
        
        if (!_self.$selected && sel && sel.length)
            _self.$selected = apf.xmldb.findHtmlNode(sel[0], _self);

        var htmlNode = this.$getHtmlHost();
        var itemHeight = this.$getItemHeight();
        htmlNode.scrollTop = scrollTop - (this.offset * itemHeight);
    };
}).call(apf.$viewportVirtual.prototype);

// #endif
