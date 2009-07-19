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

var __VIRTUALVIEWPORT__ = 1 << 19;

// #ifdef __WITH_VIRTUALVIEWPORT
// #define __WITH_SCROLLBAR 1

/**
 * All elements inheriting from this {@link term.baseclass baseclass} can have a virtual viewport.
 *
 * @experimental This code has never been run. 
 * @constructor
 * @baseclass
 * @private
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com) & Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.VirtualViewport = function(){
    this.$regbase = this.$regbase | __VIRTUALVIEWPORT__;
    
    apf.setStyleClass(this.oExt, "virtual");
    
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
        var htmlNode = this.$findNode(null, Lid);
        
        if(!htmlNode)
            return;
        
        //execute update
        this.$updateNode(xmlNode, htmlNode);//, noModifier);
    };

    this.$fill = function(){
        
    };
    
    this.clear = function(nomsg, do_event){
        if (this.clearSelection)
            this.clearSelection(null, !do_event);

        if (!nomsg)
            this.$setClearMessage(this["empty-message"]);
        else if(this.$removeClearMessage)
            this.$removeClearMessage();
        
        this.documentId = this.xmlRoot = this.cacheID = null;
        
        this.viewport.cache = [];
        this.viewport.prepare();
        this.viewport.cache = null;
    };

    var _self = this;
    this.viewport = {
        offset : 0,
        limit  : 15,
        length : 0,
        sb     : new apf.scrollbar(this.pHtmlNode),
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
            
            var docId  = apf.xmldb.getXmlDocId(_self.xmlRoot);
            var hNodes = _self.oInt.childNodes;
            for (var j = 0, i = 0; i < hNodes.length; i++) {
                if (hNodes[i].nodeType != 1) continue;
                
                hNodes[i].style.display = j >= nodes.length ? "none" : "block"; //Will ruin tables & lists
                
                apf.xmldb.nodeConnect(docId, nodes[j], hNodes[i], _self);
                j++;
            }
        },
        
        /**
         * @note This function only supports single dimension items (also no grid, like thumbnails)
         */
        resize : function(limit, updateScrollbar){
            this.cache = null;

            //Viewport shrinks
            if (limit < this.limit) {
                var nodes = _self.oInt.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].nodeType != 1) continue;
                    _self.oInt.removeChild(nodes[i]);
                    if(--this.limit == limit) break;
                }
            }
            //Viewport grows
            else if (limit > this.limit) {
                for (var i = this.limit; i < limit; i++) {
                    _self.$addEmpty(_self.emptyNode, "", _self.xmlRoot, _self.oInt);
                }
            }
            else return;
            
            this.limit = limit;
            
            if (updateScrollbar)
                this.sb.update();
        },
        
        
        /**
         *  @todo   This method should be optimized by checking if there is
         *          overlap between the new offset and the old one
        */
        change : function(offset, limit, updateScrollbar){
            this.cache  = null;
            var diff = offset - this.offset;
            var oldLimit = this.limit;
            if (diff*diff >= this.limit*this.limit) //there is no overlap
                diff = 0;
            this.offset = offset;
            
            if (diff > 0) { //get last node before resize
                var lastNode = _self.oInt.lastChild;
                if (lastNode.nodeType != 1) lastNode = lastNode.previousSibling;
            }
            
            if (limit && this.limit != limit)
                this.resize(limit, updateScrollbar);
            else if (updateScrollbar)
                this.sb.update();
            
            //this.viewport.prepare();
            
            //Traverse through XMLTree
            //var nodes = this.$addNodes(this.xmlRoot, this.oInt, null, this.renderRoot);
            var nodes = _self.getTraverseNodes();
            if (!nodes)
                return;
            
            var docId  = apf.xmldb.getXmlDocId(_self.xmlRoot);
            var hNodes = _self.oInt.childNodes;

            //remove nodes from the beginning
            if (diff > 0) {
                var xmlNode, htmlNode, xmlPos = oldLimit - diff, len = hNodes.length;
                for (var j = 0, i = 0; j < diff && i < len; i++) {
                    htmlNode = _self.oInt.firstChild;
                    if (htmlNode.nodeType == 1) {
                        j++;
                        xmlNode = nodes[xmlPos++];
                        //htmlNode.style.display = j >= nodes.length ? "none" : "block"
                        apf.xmldb.nodeConnect(docId, xmlNode, htmlNode, _self);
                        _self.$updateNode(xmlNode, htmlNode);//, noModifier);
                    }
                    
                    _self.oInt.appendChild(htmlNode);
                }
                
                //var lastNode = nodes[oldLimit - diff - 1]
            }
            //remove nodes from the end
            else if (diff < 0) {
                diff = diff * -1;
                var xmlNode, htmlNode, xmlPos = 0; //should be adjusted for changing limit
                for (var j = 0, i = hNodes.length-1; j < diff && i >= 0; i++) {
                    htmlNode = _self.oInt.lastChild;
                    if (htmlNode.nodeType == 1) {
                        j++;
                        xmlNode = nodes[xmlPos++];
                        //htmlNode.style.display = j >= nodes.length ? "none" : "block"
                        apf.xmldb.nodeConnect(docId, xmlNode, htmlNode, _self);
                        _self.$updateNode(xmlNode, htmlNode);//, noModifier);
                    }
                    
                    _self.oInt.insertBefore(htmlNode, _self.oInt.firstChild);
                }
            }
            //Recalc all nodes
            else {
                var xmlNode, htmlNode, len = hNodes.length; 
                for (var j = 0, i = 0; i < len; i++) {
                    htmlNode = hNodes[i];
                    if (htmlNode.nodeType == 1) {
                        xmlNode = nodes[j++];
                        apf.xmldb.nodeConnect(docId, xmlNode, htmlNode, _self);
                        _self.$updateNode(xmlNode, htmlNode);//, noModifier);
                    }
                }
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
    
    var timer;
    this.viewport.sb.realtime = false;//!apf.isIE;
    this.viewport.sb.attach(this.oInt, this.viewport, function(timed, pos){
        var vp = _self.viewport;
        
        if (vp.sb.realtime || !timed)
            vp.change(Math.round((vp.length - vp.limit) * pos), vp.limit, false);
        else {
            clearTimeout(timer);
            timer = setTimeout(function(){
                vp.change(Math.round((vp.length - vp.limit) * pos), vp.limit, false);
            }, 300);
        }
    })
    
    this.$isInViewport = function(xmlNode, struct){
        var marker = xmlNode.selectSingleNode("preceding-sibling::j_marker");
        var start = marker ? marker.getAttribute("end") : 0;
        
        if(!struct && this.viewport.offset + this.viewport.limit < start + 1)
            return false;
        
        var position = start;
        var nodes = (marker || xmlNode).selectNodes("following-sibling::"
              + this.traverse.split("|").join("following-sibling::"));
        
        for (var i = 0; i < nodes.length; i++) {
            ++position;
            if (nodes[i] == xmlNode)
                break;
        }
        
        if(struct) struct.position = position;
        
        if(this.viewport.offset > position 
          || this.viewport.offset + this.viewport.limit < position)
            return false;
        
        return true;
    };
    
    this.scrollTo = function(xmlNode, last){
        var sPos = {};
        this.$isInViewport(xmlNode, sPos);
        this.viewport.change(sPos.position + (last ? this.viewport.limit-1 : 0));
    };
    
    /**
     * @todo this one should be optimized
     */
    this.getFirstTraverseNode = function(xmlNode){
        return this.getTraverseNodes(xmlNode)[0];
    };
    
    var xmlUpdate = this.$xmlUpdate;
    this.$xmlUpdate = function(){
        this.viewport.cache = null;
        this.viewport.length = this.xmlRoot.selectNodes(this.traverse).length; //@todo fix this for virtual length
        this.viewport.sb.update();
        xmlUpdate.apply(this, arguments);
    };
    
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(XMLRoot, this);

        //Reserve here a set of nodeConnect id's and add them to our initial marker
        //Init virtual dataset here
        
        if (!this.renderRoot && !this.getTraverseNodes(XMLRoot).length)
            return this.clearAllTraverse(this["loading-message"]);
        
        //Initialize virtual dataset if load rule exists
        if (this.bindingRules["load"])
            apf.xmldb.createVirtualDataset(XMLRoot);
        
        //Prepare viewport
        this.viewport.cache  = null;
        this.viewport.length = this.xmlRoot.selectNodes(this.traverse).length; //@todo fix this for virtual length
        this.viewport.sb.update();
        this.viewport.prepare();
        
        //Traverse through XMLTree
        var nodes = this.$addNodes(XMLRoot, null, null, this.renderRoot);

        //Build HTML
        //this.$fill(nodes);

        //Select First Child
        if (this.selectable) {
            if (this.autoselect) {
                if (nodes.length)
                    this.$selectDefault(XMLRoot);
                else
                    this.setConnections();
            }
            else {
                this.clearSelection(null, true);
                var xmlNode = this.getFirstTraverseNode(); //should this be moved to the clearSelection function?
                if (xmlNode)
                    this.setIndicator(xmlNode);
                this.setConnections(null, "both");
            }
        }

        if (this.$focussable)
            apf.window.hasFocus(this) ? this.$focus() : this.$blur();
    };
    
    this.$loadSubData = function(){}; //We use the same process for subloading, it shouldn't be done twice
    
    /**
     * @example <j:load get="call:getCategory(start, length, ascending)" total="@total" />
     */
    this.$loadPartialData = function(marker, start, length){
        //We should have a queing system here, disabled the check for now
        //if (this.$hasLoadStatus(xmlRootNode)) return;
        
        var loadNode, rule = this.getNodeFromRule("load", xmlRootNode, false, true);
        var sel = (rule && rule.getAttribute("select"))
            ? rule.getAttribute("select")
            : ".";

        if (rule && (loadNode = xmlRootNode.selectSingleNode(sel))) {
            this.$setLoadStatus(xmlRootNode, "loading");
            
            var mdl = this.getModel(true);
            //#ifdef __DEBUG
            if (!mdl)
                throw new Error("Could not find model");
            
            if (!rule.getAttribute("total")) {
                throw new Error(apf.formatErrorString(this, "Loading data", "Error in load rule. Missing total xpath. Expecting <j:load total='xpath' />"))                
            }
            //#endif

            mdl.insertFrom(rule.getAttribute("get"), loadNode, {
                    documentId  : this.documentId, //or should xmldb find this itself
                    marker      : marker,
                    start       : start,
                    length      : length,
                    insertPoint : this.xmlRoot, 
                    amlNode     : this
                    //#ifdef __WITH_SORTING
                    ,ascending  : this.$sort ? this.$sort.get().ascending : true
                    //#endif
                }, 
                function(xmlNode){
                    _self.setConnections(_self.xmlRoot);
                    
                    var length = parseInt(apf.getXmlValue(xmlNode, 
                        rule.getAttribute("total")));
                    
                    if (_self.viewport.length != length) {
                        _self.viewport.length = length;
                        
                        apf.xmldb.createVirtualDataset(_self.xmlRoot, 
                            _self.viewport.length, _self.documentId);
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
        var vlen = this.viewport.limit;
        var marker, nodes, start, list = [];
        
        //Count from 0
        if (markerId == -1) {
            nodes    = xml.selectNodes(_self.traverse);
            start    = 0;
            marker   = markers[0];
            markerid = 0;
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
              + this.traverse.split("|").join("following-sibling::"));
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
    
    this.getTraverseNodes = function(xmlNode){
        if (!this.xmlRoot)
            return;
        
        if (this.viewport.cache)
            return this.viewport.cache;

        var start = this.viewport.offset;
        var end   = start + this.viewport.limit + 1;
        
        //caching statement here

        var markers = (xmlNode || this.xmlRoot).selectNodes("j_marker");

        //Special case for fully loaded virtual dataset
        if (!markers.length) {
            var list = (xmlNode || this.xmlRoot).selectNodes("("
                + this.traverse + ")[position() >= " + start
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
    
    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        
        if (!this.indicator) return;
        
        function selScroll(xmlNode, down){
            if(!_self.$isInViewport(xmlNode))
                _self.scrollTo(xmlNode, down);
            
            if (ctrlKey)
                _self.setIndicator(xmlNode);
            else
                _self.select(xmlNode, null, shiftKey);
        }

        switch (key) {
            case 13:
                this.choose(this.$selected);
                break;
            case 32:
                this.select(this.indicator, true);
                break;
            case 46:
            //DELETE
                if(this.disableremove) return;
            
                this.remove(null, true);
                break;
            case 38:
            //UP
                var node = this.getNextTraverseSelected(this.indicator
                    || this.selected, false, items);

                if (node) selScroll(node);
                break;
            case 40:
            //DOWN
                var node = this.getNextTraverseSelected(this.indicator
                    || this.selected, true, items);
                    
                if (node) selScroll(node, true);
                break;
            case 33:
            //PGUP
                var node = this.getNextTraverseSelected(this.indicator 
                    || this.selected, false, this.viewport.limit);
                
                if (!node)
                    node = this.getFirstTraverseNode();
                
                if (node) selScroll(node);
                break;
            case 34:
            //PGDN
                var node = this.getNextTraverseSelected(this.indicator
                    || this.selected, true, this.nodeCount-1);

                if (!node)
                    node = this.getLastTraverseNode();
                
                if (node) selScroll(node, true);
                break;
            case 36:
                //HOME
                var node = this.getFirstTraverseNode();
                if (node) selScroll(node);
                break;
            case 35:
                //END
                var node = this.getLastTraverseNode();
                if (node) selScroll(node);
                break;
            default:
                /*if (key == 65 && ctrlKey) {
                    this.selectAll();
                }
                else if(this.bindingRules["caption"]){
                    //this should move to a onkeypress based function
                    if(!this.lookup || new Date().getTime()
                      - this.lookup.date.getTime() > 300)
                        this.lookup = {
                            str  : "",
                            date : new Date()
                        };
                    
                    this.lookup.str += String.fromCharCode(key);
    
                    var nodes = this.getTraverseNodes();
                    for (var i = 0; i < nodes.length; i++) {
                        if(this.applyRuleSetOnNode("caption", nodes[i])
                          .substr(0, this.lookup.str.length).toUpperCase()
                          == this.lookup.str) {
                            this.scrollTo(nodes[i], true);
                            this.select(nodes[i]);
                            return;
                        }
                    }
                    
                    return;
                }*/
                break;
        };
        
        //this.lookup = null;
        return false;
    }, true);
    
    // #endif
    
    //Init
    this.caching = false; //for now, because the implications are unknown
};
// #endif
