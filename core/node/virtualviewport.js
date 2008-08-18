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

__VIRTUALVIEWPORT__ = 1 << 19;

// #ifdef __WITH_VIRTUALVIEWPORT
// #define __WITH_SCROLLBAR 1

/**
 * Baseclass adding Virtual Viewport features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels & Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.VirtualViewport = function(){
    this.__regbase = this.__regbase | __VIRTUALVIEWPORT__;
    
    this.__deInitNode = function(xmlNode, htmlNode){
        /*  Not the htmlNode is deleted, but the viewport is rerendered from this node on. 
            If viewport is too high either the render starting point is adjusted and
            a complete rerender is requested, or the last empty elements are hidden
        */
    }
    
    this.__moveNode = function(xmlNode, htmlNode){
        //Do a remove when removed from current viewport
        //Do a add when moved to current viewport
        //Do a redraw from the first of either when both in viewport
    }
    
    this.__addEmpty = this.__add;
    this.__add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        
    }

    this.__fill = function(){
        var jmlNode = this;
        this.lastScroll = this.getFirstTraverseNode();
        if (this.sb)
            this.sb.attach(this.oExt, this.nodeCount,
                this.getTraverseNodes().length, function(time, perc){
                    var nodes = jmlNode.getTraverseNodes();
                    jmlNode.scrollTo(nodes[Math.round((nodes.length-jmlNode.nodeCount+1)*perc)]);
                });
    }
    
    this.__findNode = function(cacheNode, id){
        //only return html node if its filled at this time
    }
    
    this.viewport = {
        start : 0,
        length : 20,
        startNode : null
    }
    
    this.__isInViewport = function(xmlNode){
        
        return true;
    }
    
    /**
     * @todo this one should be optimized
     */
    this.getFirstTraverseNode = function(xmlNode){
        return this.getTraverseNodes(xmlNode)[0];
    }
    
    //Rewrite this function
    this.__load = function(XMLRoot){
        //Add listener to XMLRoot Node
        jpf.XMLDatabase.addNodeListener(XMLRoot, this);

        //Reserve here a set of nodeConnect id's and add them to our initial marker
        //Init virtual dataset here
        
        if (!this.renderRoot && !this.getTraverseNodes(XMLRoot).length)
            return this.clearAllTraverse(this.msgLoading);

        //Traverse through XMLTree
        var nodes = this.__addNodes(XMLRoot, null, null, this.renderRoot);

        //Build HTML
        this.__fill(nodes);

        //Select First Child
        if (this.selectable) {
            if (this.autoselect) {
                if (nodes.length)
                    this.__selectDefault(XMLRoot);
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

        if (this.focussable)
            jpf.window.isFocussed(this) ? this.__focus() : this.__blur();
    }
    
    this.__loadSubData = function(){} //We use the same process for subloading, it shouldn't be done twice
    
    /**
     * @example <j:load get="call:getCategory(start, length, ascending)" />
     */
    this.__loadPartialData = function(marker, start, length){
        //We should have a queing system here, disabled the check for now
        //if (this.hasLoadStatus(xmlRootNode)) return;
        
        var loadNode, rule = this.getNodeFromRule("load", xmlRootNode, false, true);
        var sel = (rule && rule.getAttribute("select"))
            ? rule.getAttribute("select")
            : ".";

        if (rule && (loadNode = xmlRootNode.selectSingleNode(sel))) {
            this.setLoadStatus(xmlRootNode, "loading");
            
            var mdl = this.getModel(true);
            //#ifdef __DEBUG
            if (!mdl)
                throw new Error(0, "Could not find model");
            //#endif

            var jmlNode = this;
            mdl.insertFrom(rule.getAttribute("get"), {
                    xmlContext: loadNode,
                    documentId: this.documentId, //or should xmldb find this itself
                    marker: marker,
                    start: start,
                    length: length
                    //#ifdef __WITH_SORTING
                    ,ascending: this.__sort ? this.__sort.get().ascending : true
                    //#endif
                }, this.XMLRoot, this,
                function(){
                    jmlNode.setConnections(jmlNode.XMLRoot);
                })
        }
    }
    
    /*
        this.clear(true);
        if (jpf.appsettings.autoDisable)
            this.disable();
        this.setConnections(null, "select"); //causes strange behaviour
    */
    
    //Consider moving these functions to the xmldatabase selectByXpath(xpath, from, length);
    var _self = this;
    function fillList(len, list, from){
        for (var i = 0; i < len; i++) 
            list.push(_self.documentId + "|" + (from+i));
    }
    
    function buildList(markers, markerId, distance, xml) {
        var vlen = this.viewport.length;
        var marker, nodes, start, list = [];
        
        //Count from 0
        if(markerId == -1){
            nodes    = xml.selectNodes(_self.ruleTraverse);
            start    = 0;
            marker   = markers[0];
            markerid = 0;
        }
        else{
            //Count back from end of marker
            if (distance < 0){
                fillList(Math.abs(distance), list, 
                    parseInt(marker.getAttribute("reserved")) + parseInt(marker.getAttribute("end"))
                    - parseInt(marker.getAttribute("start")) + distance);
                
                distance = 0;
                _self.__loadPartialData(marker);
                
                if (list.length == vlen)
                    return list;
            }
            
            nodes  = markers[markerId].selectNodes("following-sibling::"
              + this.ruleTraverse.split("|").join("following-sibling::"));
            start  = markers[markerId].getAttribute("end");
            marker = markers[++markerId];
        }
        
        do{
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
            _self.__loadPartialData(marker);
            
            start    = parseInt(marker.getAttribute("end"));
            marker   = markers[++markerId];
            distance = 0;
        } 
        while(list.length < vlen && marker);
        
        return list;
    }
    
    this.getTraverseNodes = function(xmlNode){
        var start = this.viewport.start;
        var end   = start + this.viewport.length - 1;

        //caching statement here

        var markers = (xmlNode || this.XMLRoot).selectNodes("j_marker");

        //Special case for fully loaded virtual dataset
        if(!markers.length){
            var list = (xmlNode || this.XMLRoot).selectNode("("
                + this.ruleTraverse + ")[position() >= " + start
                + " and position() < " + (start+vlen) + "]");

            //#ifdef __WITH_SORTING
            return this.__sort ? this.__sort.apply(list) : list;
            /* #else
            return list;
            #endif */
        }

        for (var i = 0; i < markers.length; i++) {
            //Looking for marker that (partly) exceeds viewport's current position
            if (markers[i].getAttribute("end") < start) {
                //If this is the last marker, count from here
                if (i == markers.length - 1)
                    return buildList(markers, i, start - markers[i].getAttribute("end"), 
                      (xmlNode || this.XMLRoot));

                continue;
            }
            
             //There is overlap AND begin is IN marker
            if (markers[i].getAttribute("start") - end <= 0 
              && start >= markers[i].getAttribute("start"))
                return buildList(markers, i, start - markers[i].getAttribute("end"), 
                  (xmlNode || this.XMLRoot));

            //Marker is after viewport, there is no overlap
            else if (markers[i-1]) //Lets check the previous marker, if there is one
                return buildList(markers, i-1, start - markers[i-1].getAttribute("end"), 
                  (xmlNode || this.XMLRoot));
                
            //We have to count from the beginning
            else
                return buildList(markers, -1, start, (xmlNode || this.XMLRoot));
        }
    }
    
    this.scrollTo = function(xmlNode, updateScrollbar){
        this.lastScroll = xmlNode;
        
        var xNodes = this.getTraverseNodes();
        for (var j = xNodes.length - 1; j >= 0; j--) {
            if (xNodes[j] == xmlNode)
                break;
        }
        
        if (updateScrollbar) {
            this.sb.setPosition(j / (xNodes.length - this.nodeCount), true);
        }
        
        var sNodes = {}, selNodes = this.getSelection();
        for (var i = selNodes.length - 1; i >= 0; i--) {
            sNodes[selNodes[i].getAttribute(jpf.XMLDatabase.xmlIdTag)] = true;
            this.__deselect(document.getElementById(selNodes[i]
                .getAttribute(jpf.XMLDatabase.xmlIdTag) + "|" + this.uniqueId));
        }
        
        var nodes = this.oInt.childNodes;
        for(var id, i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;
            xmlNode = xNodes[j++];
            
            if (!xmlNode)
                nodes[i].style.display = "none";
            else {
                nodes[i].setAttribute(jpf.XMLDatabase.htmlIdTag,
                    xmlNode.getAttribute(jpf.XMLDatabase.xmlIdTag)
                    + "|" + this.uniqueId);
                this.__updateNode(xmlNode, nodes[i]);
                nodes[i].style.display = "block"; // or inline
                
                if (sNodes[xmlNode.getAttribute(jpf.XMLDatabase.xmlIdTag)])
                    this.__select(nodes[i]);
            }
        }
    }
    
    // #ifdef __WITH_KBSUPPORT
    this.__keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (!this.__selected) return;
        //error after delete...
        
        var jNode = this;
        function selscroll(sel, scroll){
            if (!jNode.__selected) {
                jNode.scrollTo(scroll || sel, true);
                
                if (ctrlKey)
                    jNode.setIndicator(sel);
                else
                    jNode.select(sel, null, shiftKey);
            }
        }

        switch (key) {
            case 13:
                this.choose(this.__selected);
                break;
            case 32:
                this.select(this.indicator, true);
                break;
            case 46:
            //DELETE
                if(this.disableremove) return;
            
                this.remove(null, true);
                break;
            case 37:
            //LEFT
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
            
                if(!this.selected) return;
                var node = this.getNextTraverseSelected(this.indicator || this.selected, false);
                if (node) {
                    if(ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                    
                    if (!this.__selected)
                        selscroll(node, this.getNextTraverse(this.lastScroll, true));
                    if (!this.__selected)
                        selscroll(node, node);
                }
                break;
            case 38:
            //UP
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if (!this.selected && !this.indicator) return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (this.__selected.offsetWidth
                    + margin[1] + margin[3]));
                var node      = this.getNextTraverseSelected(this.indicator
                    || this.selected, false, items);

                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                    
                    if (!this.__selected)
                        selscroll(node, this.getNextTraverse(this.lastScroll, true));
                    if (!this.__selected)
                        selscroll(node, node);
                }
                break;
            case 39:
            //RIGHT
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if (!this.selected) return;

                var node = this.getNextTraverseSelected(this.indicator || this.selected, true);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                    
                    if (!this.__selected)
                        selscroll(node, this.getNextTraverse(this.lastScroll, true));
                    if (!this.__selected)
                        selscroll(node, node);
                }
                break;
            case 40:
            //DOWN
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
                if (!this.selected && !this.indicator) return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (this.__selected.offsetWidth
                    + margin[1] + margin[3]));
                var node = this.getNextTraverseSelected(this.indicator
                    || this.selected, true, items);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);

                    var s2 = this.getNextTraverseSelected(node, true, items);
                    if (s2 && !document.getElementById(s2.getAttribute(
                      jpf.XMLDatabase.xmlIdTag) + "|" + this.uniqueId)){
                        if (!this.__selected)
                            selscroll(node, this.getNextTraverse(this.lastScroll));
                        if (!this.__selected)
                            selscroll(node, node);
                    }
                    else if(s2 == node) {
                        var nodes = this.getTraverseNodes();
                        if (!this.__selected)
                            selscroll(node, nodes[nodes.length-this.nodeCount + 1]);
                        if (!this.__selected)
                            selscroll(node, node);
                    }
                }
                
                break;
            case 33:
            //PGUP
                if (!this.selected && !this.indicator) return;
                
                var node = this.getNextTraverseSelected(this.indicator 
                    || this.selected, false, this.nodeCount-1);//items*lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                 
                this.scrollTo(node, true);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                break;
            case 34:
            //PGDN
                if (!this.selected && !this.indicator)
                    return;
                var node = this.getNextTraverseSelected(this.indicator
                    || this.selected, true, this.nodeCount-1);
                if (!node)
                    node = this.getLastTraverseNode();
                
                var xNodes = this.getTraverseNodes();
                for (var j = xNodes.length - 1; j >= 0; j--)
                    if(xNodes[j] == node)
                        break;

                if (j > xNodes.length - this.nodeCount - 1)
                    j = xNodes.length-this.nodeCount+1;
                this.scrollTo(xNodes[j], true);
                if (xNodes[j] != node)
                    node = xNodes[xNodes.length - 1];
                
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                break;
            case 36:
                //HOME
                var xmlNode = this.getFirstTraverseNode();
                this.scrollTo(xmlNode, true);
                this.select(xmlNode, null, shiftKey);
                //this.oInt.scrollTop = 0;
                //Q.scrollIntoView(true);
                break;
            case 35:
                //END
                var nodes = this.getTraverseNodes(xmlNode || this.XMLRoot);//.selectNodes(this.ruleTraverse);
                this.scrollTo(nodes[nodes.length - this.nodeCount+1], true);
                this.select(nodes[nodes.length - 1], null, shiftKey);
                //Q.scrollIntoView(true);
                break;
            default:
                if (key == 65 && ctrlKey) {
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
                }
                break;
        };
        
        this.lookup = null;
        return false;
    }
    
    // #endif
    
    //Init
    this.caching = false; //for now, because the implications are unknown
    this.sb = new jpf.Scrollbar(this.pHtmlNode);
}
// #endif