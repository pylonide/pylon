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

// #ifdef __JLAYOUTBUILDER || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1

/**
 * @private
 * @constructor
 */
jpf.layoutbuilder = function(pHtmlNode){
    jpf.register(this, "layoutbuilder", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/

    //Options
    this.$focussable  = true; // This object can get the focus
    this.multiselect = false; // Initially Disable MultiSelect
    this.structs     = {};

    /* ***********************
                Skin
    ************************/

    this.$deInitNode = function(xmlNode, htmlNode){
        if(!htmlNode) return;

        htmlNode.parentNode.removeChild(htmlNode);
    }
    
    this.checkPosition = function(m){};
    
    this.isValid = function(){
        for (var i = 0; i < this.oInt.childNodes.length; i++) {
            this.layout.align(this.oInt.childNodes[i], 
                this.structs[this.oInt.childNodes[i].getAttribute("id")]);
        }
        
        //can be optimized
        var result = this.layout.check(true);
        this.layout.reset();
        
        return result;
    }
    
    this.alignElement = function(xmlNode, htmlNode, purge){
        var aData = {};
        if (xmlNode.getAttribute("align"))
            aData.template = xmlNode.getAttribute("align");
        if (xmlNode.getAttribute("align-lean"))
            aData.isBottom = xmlNode.getAttribute("align-lean").match(/bottom/);
        if (xmlNode.getAttribute("align-lean"))
            aData.isRight = xmlNode.getAttribute("align-lean").match(/right/);
        if (xmlNode.getAttribute("align-position")) {
            xmlNode.getAttribute("align-position").match(/\((\d+),(\d+)\)/);
            aData.vpos     = parseInt(RegExp.$1);
            aData.hpos     = parseInt(RegExp.$2);
            aData.template = undefined;
        }
        
        if (xmlNode.getAttribute("align-margin"))
            aData.edgeMargin = xmlNode.getAttribute("align-margin");
        if (xmlNode.getAttribute("align-span"))
            aData.span = parseInt(xmlNode.getAttribute("align-span"));
        if (xmlNode.getAttribute("align-splitter") 
          || xmlNode.getAttribute("align-edge") == "splitter")
            aData.splitter = xmlNode.getAttribute("align-splitter") 
              || (xmlNode.getAttribute("align-edge") == "splitter" ? 3 : false);
        if (xmlNode.getAttribute("width"))
            aData.fwidth = xmlNode.getAttribute("width");
        if (xmlNode.getAttribute("height"))
            aData.fheight = xmlNode.getAttribute("height");
        if (xmlNode.getAttribute("minwidth"))
            aData.minwidth = xmlNode.getAttribute("minwidth");
        if (xmlNode.getAttribute("minheight"))
            aData.minheight = xmlNode.getAttribute("minheight");

        /*var id = htmlNode.getAttribute("id");
        if(this.structs[id]) this.layout.remove(this.structs[id]);*/
        
        //var struct = this.layout.align(htmlNode, aData);
        this.structs[xmlNode.getAttribute(jpf.xmldb.xmlIdTag)] = aData;
        
        this.sort();
        
        if (false && !this.isValid() && !this.isInError) {
            this.isInError = true;
            return this.$setStyleClass(htmlNode, "error");
        }
        
        if (purge)
            this.purge();
    }
    
    this.seq = {"top":0, "left":1, "middle":2, "right":3, "bottom":4};
    this.getPrevSibl = function(node){
        if (!node) return; 
        return !node.previousSibling || node.previousSibling.nodeType == 1 
            ? node.previousSibling 
            : node.previousSibling.previousSibling;
    }
    this.getNextSibl = function(node){
        if (!node) return; 
        return !node.nextSibling || node.nextSibling.nodeType == 1 
            ? node.nextSibling 
            : node.nextSibling.nextSibling;
    }
    
    this.sort = function(){
        var node    = this.XmlRoot.childNodes[0];
        var prevSib = this.getPrevSibl(node);
        do {
            while (prevSib && prevSib.nodeType == 1 && node.nodeType == 1 
              && this.seq[node.getAttribute("align")] < this.seq[prevSib.getAttribute("align")]){
                node.parentNode.insertBefore(node, prevSib);
                prevSib = this.getPrevSibl(node);
            }
            node    = this.getNextSibl(node);
            prevSib = this.getPrevSibl(node);
        } while (node);
        
        return this;
    }
    
    this.purge = function(){
        //if(!this.isValid()) return;
        this.isInError = false;
        
        /*this.layout = new jpf.layoutParser(this.oExt);
        var pMargin = this.XmlRoot.getAttribute("margin");
        if(pMargin) this.layout.setMargin(pMargin.split(/,\s* /));*/
        
        //Replace below with sorting of the jpf.layout
        var nodes = this.XmlRoot.childNodes;//this.oInt.childNodes;//
        for (var i = 0; i < nodes.length; i++) {
            if(nodes[i].nodeType != 1) continue;
            //this.layout.align(jpf.xmldb.findHTMLNode(nodes[i], this), this.structs[nodes[i].getAttribute("id")]);
            this.layout.align(jpf.xmldb.findHTMLNode(nodes[i], this),
                this.structs[nodes[i].getAttribute(jpf.xmldb.xmlIdTag)]);
            //this.$setStyleClass(this.oInt.childNodes[i], "", ["error"]);
        }
        
        var cResult = this.layout.compile();
        this.layout.reset();
        if (cResult) {
            this.$setStyleClass(this.oExt, this.baseCSSname + "Error");
            alert(cResult);
        }
        else 
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Error"]);
        
        return this;
    }
    
    this.$updateNode = function(xmlNode, htmlNode){
        var elCaption = this.$getLayoutNode("item", "caption", htmlNode);
        if (elCaption)
            this.$getLayoutNode("item", "caption", htmlNode).parentNode.innerHTML = this.applyRuleSetOnNode("caption", xmlNode);

        this.alignElement(xmlNode, htmlNode);
        
        return this;
    }
    
    this.$moveNode = function(xmlNode, htmlNode){
        if (!htmlNode) return this;
        var oPHtmlNode = htmlNode.parentNode;
        var beforeNode = xmlNode.nextSibling 
            ? jpf.xmldb.findHTMLNode(this.getNextTraverse(xmlNode), this) 
            : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        
        this.alignElement(xmlNode, htmlNode);
        
        return this;
    }
    
    this.addEventListener("xmlupdate", function(e){
        if (e.action == "remove") return this;
        return this.purge();
    });
    
    /* ***********************
        Keyboard Support
    ************************/
    // #ifdef __WITH_KBSUPPORT
    
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        
        if (!this.$selected) return;

        switch (key) {
            case 13:
                this.choose(this.$selected);
                break;
            case 32:
                this.select(this.indicator, true);
                break;
            case 46:
                //DELETE
                var ln = this.getSelectCount();
                var xmlNode = (ln == 1) ? this.selected : null;
                this.remove(xmlNode);
                break;
            case 37:
                //LEFT
                var margin = jpf.getBox(jpf.getStyle(this.$selected, "margin"));
            
                if (!this.selected) return;
                var node = this.getNextTraverseSelected(this.indicator 
                    || this.selected, false);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.$selected.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.$selected.offsetTop - margin[0];
                break;
            case 38:
                //UP
                var margin = jpf.getBox(jpf.getStyle(this.$selected, "margin"));
                
                if (!this.selected && !this.indicator) return;
                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items = Math.floor((this.oExt.offsetWidth 
                    - (hasScroll ? 15 : 0)) / (this.$selected.offsetWidth 
                    + margin[1] + margin[3]));
                var node = this.getNextTraverseSelected(this.indicator 
                    || this.selected, false, items);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.$selected.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.$selected.offsetTop - margin[0];
                break;
            case 39:
                //RIGHT
                var margin = jpf.getBox(jpf.getStyle(this.$selected, "margin"));
                
                if (!this.selected) return;
                var node = this.getNextTraverseSelected(this.indicator 
                    || this.selected, true);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.$selected.offsetTop + this.$selected.offsetHeight 
                  > this.oExt.scrollTop + this.oExt.offsetHeight)
                    this.oExt.scrollTop = this.$selected.offsetTop 
                        - this.oExt.offsetHeight 
                        + this.$selected.offsetHeight + margin[0];
                    
                break;
            case 40:
                //DOWN
                var margin = jpf.getBox(jpf.getStyle(this.$selected, "margin"));
                
                if (!this.selected && !this.indicator) return;
                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items = Math.floor((this.oExt.offsetWidth 
                    - (hasScroll ? 15 : 0)) / (this.$selected.offsetWidth 
                    + margin[1] + margin[3]));
                var node = this.getNextTraverseSelected(this.indicator 
                    || this.selected, true, items);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else 
                        this.select(node, null, shiftKey);
                }
                
                if (this.$selected.offsetTop + this.$selected.offsetHeight 
                  > this.oExt.scrollTop + this.oExt.offsetHeight)
                    this.oExt.scrollTop = this.$selected.offsetTop 
                        - this.oExt.offsetHeight 
                        + this.$selected.offsetHeight + 10;
                
                break;
            case 65:
                if (ctrlKey) {
                    this.selectAll();	
                    return false;
                }
                break;
            default: 
                return;
        }
        
        return false;
    });
    // #endif
    
    /* ***********************
            DATABINDING
    ************************/
    
    this.nodes = [];
    
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build Item
        this.$getNewContext("item");
        var Item      = this.$getLayoutNode("item");
        var elSelect  = this.$getLayoutNode("item", "select");
        var elCaption = this.$getLayoutNode("item", "caption");
        
        Item.setAttribute("id", Lid);
        
        //elSelect.setAttribute("oncontextmenu", 'jpf.lookup(' + this.uniqueId + ').dispatchEvent("contextmenu", event);');
        elSelect.setAttribute("ondblclick",  'jpf.lookup(' + this.uniqueId 
            + ').choose()');
        elSelect.setAttribute("onmousedown", 'jpf.lookup(' + this.uniqueId 
            + ').select(this, event.ctrlKey, event.shiftKey)'); 
        elSelect.setAttribute("onmouseover", 'jpf.lookup(' + this.uniqueId 
            + ').$setStyleClass(this, "hover");'); 
        elSelect.setAttribute("onmouseout",  'jpf.lookup(' + this.uniqueId 
            + ').$setStyleClass(this, "", ["hover"]);'); 
        
        if (elCaption)
            elCaption.nodeValue = this.applyRuleSetOnNode("caption", xmlNode);

        if (htmlParentNode) {
            jpf.xmldb.htmlImport(Item, htmlParentNode, beforeNode);
            this.alignElement(xmlNode, Item);
        }
        else{
            this.nodes.push(Item);
            this.alignElement(xmlNode, Item);
        }
    }
    
    this.$fill = function(){
        jpf.xmldb.htmlImport(this.nodes, this.oInt);
        
        var pMargin = this.XmlRoot.getAttribute("margin");
        if (pMargin)
            this.layout.setMargin(pMargin.split(/,\s*/));

        this.sort().purge();
        
        this.nodes.length = 0;
    }
    
    /* ***********************
                SELECT
    ************************/
    
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r = [], loopNode = xmlStartNode;
        while (loopNode && loopNode != xmlEndNode.nextSibling) {
            r.push(loopNode);
            loopNode = loopNode.nextSibling;
        }

        if (r[r.length-1] != xmlEndNode) {
            var r = [], loopNode = xmlStartNode;
            while (loopNode && loopNode != xmlEndNode.previousSibling) {
                r.push(loopNode);
                loopNode = loopNode.previousSibling;
            };
        }
        
        return r;
    }
    
    this.$selectDefault = function(XMLRoot){
        this.select(XMLRoot.selectSingleNode(this.traverse));
    }

    this.inherit(jpf.MultiSelect); /** @inherits jpf.MultiSelect */
    
    /* ***********************
              CACHING
    ************************/
    
    this.$getCurrentFragment = function(){
        //if(!this.selected) return false;

        var fragment = jpf.hasDocumentFragment 
            ? document.createDocumentFragment() 
            : new DocumentFragment(); //IE55
        while (this.oInt.childNodes.length) {
            fragment.appendChild(this.oInt.childNodes[0]);
        }

        return fragment;
    }
    
    this.$setCurrentFragment = function(fragment){
        jpf.hasDocumentFragment 
            ? this.oExt.appendChild(fragment) 
            : fragment.reinsert(this.oExt); //IE55
        
        //Select First Node....
        if (!jpf.window.hasFocus(this))
            this.blur();
    }

    this.$findNode = function(cacheNode, id){
        if (!cacheNode)
            return document.getElementById(id);
        return cacheNode.getElementById(id);
    }
    
    this.$setClearMessage = function(msg){
        var oEmpty = jpf.xmldb.htmlImport(this.$getLayoutNode("empty"), this.oInt);
        var empty  = this.$getLayoutNode("empty", "caption", oEmpty);
        if (empty)
            jpf.xmldb.setNodeValue(empty, msg || "");
        if (oEmpty)
            oEmpty.setAttribute("id", "empty" + this.uniqueId);
    }
    
    this.$removeClearMessage = function(){
        var oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty)
            oEmpty.parentNode.removeChild(oEmpty);
        else
            this.oInt.innerHTML = ""; //clear if no empty message is supported
    }
    
    this.inherit(jpf.Cache); /** @inherits jpf.Cache */
    this.caching = false;

    /* ***********************
      Other Inheritance
    ************************/
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.DataBinding
     */
    this.inherit(jpf.Presentation, jpf.DataBinding);
    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal(); 
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        
        this.layout = new jpf.layoutParser(this.oExt);
    }
    
    this.$loadJml = function(x){};
}
// #endif
