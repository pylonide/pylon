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
        this.viewport.redraw();//very unoptimized
    };
    
    this.$moveNode = function(xmlNode, htmlNode){
        /*
            Do a remove when removed from current viewport
            Do an add when moved to current viewport
            Do a redraw from the first of either when both in viewport
        */
        this.viewport.redraw();//very unoptimized
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
    
    this.addEventListener("$load", function(){
        if (!this.viewport.limit)
            this.viewport.limit = 1;
    });
    
    this.clear = function(nomsg, do_event){
        if (this.clearSelection)
            this.clearSelection(!do_event);

        this.documentId = this.xmlRoot = this.cacheId = null;

        if (!nomsg) {
            this.viewport.offset = 0;
            this.viewport.length = 0;
            this.viewport.resize(0);
            this.viewport.sb.update();
    
            this.$setClearMessage(this["empty-message"]);
        }
        else if(this.$removeClearMessage)
           this.$removeClearMessage();
        
        this.viewport.cache = null;
    };

    var _self = this;
    this.viewport = {
        offset : 0,
        limit  : 2,
        length : 0,
        sb     : new apf.scrollbar(),
        host   : this,
        cache  : null,
        
        inited : false,
        draw : function(){
            this.inited = true;
            var limit = this.limit; this.limit = 0;
            this.resize(limit, true);
        },
        
        redraw : function(){
            this.change(this.offset);
        },
        
        // set id's of xml to the viewport
        prepare : function(){
            if (!this.inited)
                this.draw();
            
            var nodes = _self.getTraverseNodes();
            if (!nodes)
                return;
            
            var docId  = apf.xmldb.getXmlDocId(_self.xmlRoot),
                hNodes = _self.$container.childNodes;
            for (var j = 0, i = 0, l = hNodes.length; i < l; i++) {
                if (hNodes[i].nodeType != 1) continue;
                
                hNodes[i].style.display = (j >= nodes.length) ? "none" : "block"; //Will ruin tables & lists
                
                apf.xmldb.nodeConnect(docId, nodes[j], hNodes[i], _self);
                j++;
            }
        },
        
        /**
         * @note This function only supports single dimension items (also no grid, like thumbnails)
         */
        resize : function(limit, updateScrollbar){
            this.cache = null;

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
            
            if (updateScrollbar)
                this.sb.update(this.$container);
        },
        
        findNewLimit : function(scrollTop){
            var oHtml = _self.$container;
            
            if (!scrollTop)
                scrollTop = oHtml.scrollTop;

            if (!_self.xmlRoot || oHtml.lastChild && oHtml.lastChild.style.display == "none")
                return;

            //Grow
            if (!oHtml.lastChild || oHtml.lastChild.offsetTop + oHtml.lastChild.offsetHeight <= oHtml.offsetHeight + scrollTop) {
                var Lid, xmlNode, nodes, sel = _self.$getSelection();
                while (this.limit < this.length - 1 && (!oHtml.lastChild || oHtml.lastChild.offsetTop + oHtml.lastChild.offsetHeight <= oHtml.offsetHeight + scrollTop)) {
                    this.limit++;

                    nodes = _self.getTraverseNodes();
                    if (nodes.length < this.limit) {
                        this.limit = nodes.length;
                        break;
                    }

                    xmlNode = nodes[nodes.length - 1];
                    Lid = apf.xmldb.nodeConnect(_self.documentId, xmlNode, null, _self);
                    _self.$addEmpty(xmlNode, Lid, _self.xmlRoot, oHtml);
                    if (sel.indexOf(xmlNode) > -1)
                        _self.$select(oHtml.lastChild);
                    else
                        _self.$deselect(oHtml.lastChild);
                }
            }
            //Shrink
            else if (oHtml.lastChild && oHtml.lastChild.offsetTop > oHtml.offsetHeight + scrollTop) {
                var lastChild;
                while (this.limit > 2 && (lastChild = oHtml.lastChild).offsetTop > oHtml.offsetHeight + scrollTop) {
                    _self.$container.removeChild(lastChild);
                    this.limit--;
                }
            }
            
            if (!this.initialLimit)
                this.initialLimit = this.limit;
        },
        
        /**
         *  @todo   This method should be optimized by checking if there is
         *          overlap between the new offset and the old one
         */
        change : function(offset, limit, updateScrollbar, noScroll){
            var offsetN;
            
            if (offset < 0) 
                offset = 0;
            
            if (offset > this.length - this.limit - 1) 
                offsetN = Math.floor(this.length - this.limit - 1);
            else 
                offsetN = Math.floor(offset);
                
            if (!limit)
                limit = this.limit;
            
            //var offsetN = Math.floor(offset);

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
            
            /*if (limit && this.limit != limit)
                this.resize(limit, updateScrollbar);
            else */
            if (updateScrollbar) {
                this.sb.$curValue = this.offset / (this.length - this.limit - 1);
                this.sb.updatePos();
            }

            //this.viewport.prepare();

            //Traverse through XMLTree
            //var nodes = this.$addNodes(this.xmlRoot, this.$container, null, this.renderRoot);
            var nodes = _self.getTraverseNodes();
            if (!nodes)
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
                
                //var lastNode = nodes[oldLimit - diff - 1]
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
            else if (diff === false){
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

            if (!noScroll) {
                if (offset >= this.length - this.initialLimit) {
                    diff = offset - (this.length - this.initialLimit) + 2;
                    _self.$container.scrollTop = (_self.$container.scrollHeight - _self.$container.offsetHeight) * (diff / 2);
                }
                else {
                    var scrollTop = (offset % 1) * _self.$container.firstChild.offsetHeight;//(diff/limit) * _self.$container.offsetHeight;
                    this.findNewLimit(scrollTop);
                    _self.$container.scrollTop = scrollTop;
                }
                
                if (updateScrollbar)
                    this.sb.update();
                
                return;
            }
        
            //Build HTML
            //_self.$fill(nodes);
            
            /*if (_self.$selected) {
                _self.$deselect(_self.$selected);
                _self.$selected = null;
            }
            
            if (_self.selected && _self.$isInViewport(_self.selected))
                _self.select(_self.selected);*/
        }
    };
    
    this.viewport.sb.parentNode = new apf.Class().$init();
    this.viewport.sb.parentNode.$container = this.$pHtmlNode;
    this.viewport.sb.dispatchEvent("DOMNodeInsertedIntoDocument");
    
    //this.$container.style.paddingLeft = this.viewport.sb.$ext.offsetWidth + "px";
    
    //this.viewport.sb.realtime = false;//!apf.isIE;
    this.viewport.sb.attach(this.$container, this.viewport, function(timed, pos){
        var vp = _self.viewport;
        
        if (vp.sb.realtime || !timed) {
            var l = vp.length - vp.initialLimit;
            if (l == 0)
                _self.$container.scrollTop = pos * (_self.$container.scrollHeight - _self.$container.offsetHeight);
            else 
                vp.change(l * pos, vp.limit, false);
        }
        else {
            clearTimeout(this.virtualVTimer);
            this.virtualVTimer = $setTimeout(function(){
                vp.change(Math.round((vp.length - vp.initialLimit) * pos), vp.limit, false);
            }, 300);
        }
    });
    
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
    apf.layout.setRules(this.$container, "scrollbar", "\
        var s = apf.all[" + this.viewport.sb.$uniqueId + "];\
        s.update();\
    ", true);
    apf.layout.queue(this.$container);
    //#endif
    this.$isInViewport = function(xmlNode, struct){
        /*var marker = xmlNode.selectSingleNode("preceding-sibling::a_marker");
        var start = marker ? marker.getAttribute("end") : 0;
        
        if(!struct && this.viewport.offset + this.viewport.limit < start + 1)
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
        
        if(this.viewport.offset > position 
          || this.viewport.offset + this.viewport.limit < position)
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
        this.viewport.change(sPos.position + (last ? this.viewport.limit - 1 : 0));
    };
    
    /**
     * @todo this one should be optimized
     */
    this.getFirstTraverseNode = function(xmlNode){
        return this.getTraverseNodes(xmlNode)[0];
    };
    
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
    
    this.$xmlUpdate = function(){
        this.viewport.cache  = null;
        this.viewport.length = this.xmlRoot.selectNodes(this.each).length; //@todo fix this for virtual length
        this.viewport.sb.update(this.$container);
        this._xmlUpdate.apply(this, arguments);
    };
    
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(XMLRoot, this);

        //Reserve here a set of nodeConnect id's and add them to our initial marker
        //Init virtual dataset here
        
        if (!this.renderRoot && !this.getTraverseNodes(XMLRoot).length)
            return this.clear("loading");
        
        //Initialize virtual dataset if load rule exists
        if (this.$hasBindRule("load"))
            this.$createVirtualDataset(XMLRoot);
        
        //Prepare viewport
        this.viewport.cache  = null;
        this.viewport.length = this.xmlRoot.selectNodes(this.each).length + 1; //@todo fix this for virtual length
        this.viewport.prepare();
        
        //Traverse through XMLTree
        var nodes = this.$addNodes(XMLRoot, null, null, this.renderRoot);
        
        this.viewport.sb.update(this.$container);

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
    };
    
    this.$loadSubData = function(){}; //We use the same process for subloading, it shouldn't be done twice
    
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
                throw new Error(apf.formatErrorString(this, "Loading data", "Error in load rule. Missing total xpath. Expecting <a:load total='xpath' />"))                
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
                    
                    if (_self.viewport.length != length) {
                        _self.viewport.length = length;
                        
                        this.$createVirtualDataset(_self.xmlRoot, 
                            _self.viewport.length, _self.documentId);
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
            vlen = this.viewport.limit,
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
        
        _self.viewport.cache = list;
        return list;
    }
    
    /**
     * Retrieves a nodelist containing the {@link term.datanode data nodes} which are rendered by
     * this element (see each nodes, see {@link baseclass.multiselectbinding.binding.each}).
     *
     * @param {XMLElement} [xmlNode] the parent element on which the each query is applied.
     */
    this.getTraverseNodes = function(xmlNode){
        if (!this.xmlRoot)
            return;
        
        if (this.viewport.cache)
            return this.viewport.cache;

        var start = this.viewport.offset + 1,
            end   = start + this.viewport.limit;
        
        //caching statement here

        var markers = (xmlNode || this.xmlRoot).selectNodes("a_marker");

        //Special case for fully loaded virtual dataset
        if (!markers.length) {
            var list = (xmlNode || this.xmlRoot).selectNodes("("
                + this.each + ")[position() >= " + start
                + " and position() < " + (end) + "]");

            //#ifdef __WITH_SORTING
            return this.$sort ? this.$sort.apply(list) : list;
            /* #else
            return list;
            #endif */
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
    };
    
    var baseNTS = this.getNextTraverseSelected;
    this.getNextTraverseSelected = function(xmlNode, up, count){
        if (!xmlNode)
            xmlNode = this.selected;
        if (!count)
            count = 1;

        var node = baseNTS.call(this, xmlNode, up, count);
        if (node && node != xmlNode)
            return node;

        //@todo treeArch support
        var nodes = this.getTraverseNodes(), i = 0;
        while (nodes[i] && nodes[i] != xmlNode)
            i++;

        if (up)
            i = -1 * (nodes.length - i - 1);

        this.viewport.change(Math.max(0, this.viewport.offset + i
            + (up ? count : -1 * count)), null, true, true);
            
        nodes = this.getTraverseNodes();
        return nodes[up ? nodes.length - 1 : 0];
    };
    
    //@todo keyboard handlers for pgup/pgdown should measure items instead of assuming fixed height
    
    //Init
    this.caching = false; //for now, because the implications are unknown
};
// #endif
