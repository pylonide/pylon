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
    
    this.getTraverseNodes = function(xmlNode){
        var start = this.viewport.start;
        var vlen = this.viewport.length;
        
        function fillList(nr){
            for (var i = 0; i < nr; i++) list.push(null); //this should fill with the id of the virtual xml node
        }
        
        var list = [], markers = (xmlNode || this.XMLRoot).selectNodes("j_marker");
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].getAttribute("end") < start) 
                continue;
            
            //Found one that has exceeded my current position
            var x = markers[i].getAttribute("start") - end;
            if (x < 0) { //start van de marker is eerder dan het einde van onze viewport
                if (start >= markers[i].getAttribute("start")) { //start van de viewport is gelijk of later dan de start van de marker
                    //fully overlaps 
                    fillList(markers[i].getAttribute("end") - start);
                    var nextNodes = markers[i].selectNodes("following-sibling::" + this.ruleTraverse.split("|").join("following-sibling::"));
                    
                    var size = Math.min(
                        makers[i+1] ? makers[i+1].getAttribute("start") - makers[i].getAttribute("end") : vlen, 
                        vlen - list.length, 
                        nextNodes.length);

                    for(var i = 0; i < size; i++)
                        list.push(nextNodes[i]);
                    
                    if(list.length != vlen && markers[i+1]){
                        //process next marker
                        
                    }
                    else{
                        //i'm done
                        
                    }
                }
                else {
                    //partial case
                    
                    //case van ER IN
                    //case van BOTTOM partial
                    //case van TOP partial
                }
                //go get data from server
            }
            else if (markers[i-1]) {
                //fully loaded use marker
                if (x > start - markers[i-1].getAttribute("end")) {
                    markers[i]
                    //omlaag tellen vanaf start
                }
                else {
                    markers[-1];
                    //omhoog tellen vanaf end
                }
            }
            else {
                //start is 0 ???
                if (x > start) {
                    //omlaag tellen vanaf start
                    marker = markers[i]
                }
                else {
                    //fully loaded count from 0
                }
            }
        }
        
        //if not found, count backward from end here
        
        //var nodes = (xmlNode || this.XMLRoot).selectNodes(this.ruleTraverse + "|j_marker");
        
        //#ifdef __WITH_SORTING
        if (sortObj && extra.total == extra.loaded)
            return sortObj.apply(list);
        //#endif
        
        return list;
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
    this.caching = false; //until now, because the implications are unknown
    this.sb = new jpf.Scrollbar(this.pHtmlNode);
}
// #endif