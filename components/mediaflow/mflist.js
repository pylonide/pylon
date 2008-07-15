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

// #ifdef __JMFLIST || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1
// #define __WITH_GANIM 1

/**
 * @constructor
 */
jpf.MFList = function(pHtmlNode){
    jpf.register(this, "MFList", GUI_NODE);
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.Cache
     * @inherits jpf.MultiSelect
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.Cache, jpf.MultiSelect, jpf.DataBinding, jpf.JmlNode);

    //Options
    this.isMFNode    = true;
    this.focussable  = true; // This object can get the focus
    this.multiselect = true; // Initially Disable MultiSelect
    this.buttons     = [];
    
    /* ***********************
                ACTIONS
    ************************/
    
    this.Remove = function(xmlNode){
        if (xmlNode)
            this.select(xmlNode);

        var sel = this.getSelection();
        for (var i = 0; i < sel.length; i++) {
            //Use Action Tracker
            this.executeAction("removeNode", [sel[i]], "Remove", sel[i]);
        }
    }
    
    this.Add = function(xmlNode, value){
        //XML from Argument
        if (xmlNode)
            return this.receiveAddData(xmlNode);
        
        var addXMLNode, node = this.actions["Add"][0];
        if (!node) throw new Error(0, "Could not get Node for Action");

        //Hard Coded XML
        if (node.firstChild) 
            addXMLNode = node.firstChild.cloneNode(true);
        //Execute Client Side Response
        else if(node.getAttribute("object"))
            addXMLNode = self[node.getAttribute("object")][node.getAttribute("method")]();
        else if(node.getAttribute("method"))
            addXMLNode = self[node.getAttribute("method")]();
        else if(node.getAttribute("eval"))
            addXMLNode = eval(node.getAttribute("eval"));

        if (addXMLNode != null)
            return addXMLNode ? this.receiveAddData(addXMLNode) : false;
        
        //Remote XML
        RPC.callRPCFromNode(node, this.value, new Function('o', 'jpf.lookup('
            + this.uniqueId + ').receiveAddData(o)'));
    }
    
    this.receiveAddData = function(xmlNode){
        if (typeof xmlNode != "object")
            xmlNode = jpf.getObject("XMLDOM", xmlNode).documentElement.firstChild;
        if (xmlNode.getAttribute("id"))
            xmlNode.setAttribute("id", "")
        
        this.executeAction("appendChildNode", [this.XMLRoot, xmlNode],
            "Odd", xmlNode);
        this.select(xmlNode);
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    
    /* ***********************
                Skin
    ************************/

    this.deInitNode = function(xmlNode, htmlNode){
        //unsupported
    }
    
    this.updateNode = function(xmlNode, htmlNode){
        //unsupported
        /*
        var elIcon = this.getLayoutNode("Item", "icon", htmlNode);
        
        if(elIcon) 
            elIcon.style.backgroundImage = "url(" + this.iconPath + this.applyRuleSetOnNode("Icon", xmlNode) + ")";
        else{
            var elImage = this.getLayoutNode("Item", "image", htmlNode);//.style.backgroundImage = "url(" + this.applyRuleSetOnNode("Image", xmlNode) + ")";
            if(elImage){
                if(elImage.nodeType == 1) elImage.style.backgroundImage = "url(" + this.applyRuleSetOnNode("Image", xmlNode) + ")";
                else elImage.nodeValue = this.applyRuleSetOnNode("Image", xmlNode);
            }
        }
        
            
        var elCaption = this.getLayoutNode("Item", "caption", htmlNode);
        if(elCaption)
            this.getLayoutNode("Item", "caption", htmlNode).parentNode.innerHTML = this.applyRuleSetOnNode("Caption", xmlNode);
        */
    }
    
    this.moveNode = function(xmlNode, htmlNode){
        //unsupported
        /*
        if(!htmlNode) return;
        var oPHtmlNode = htmlNode.parentNode;
        var beforeNode = xmlNode.nextSibling ? XMLDatabase.findHTMLNode(this.getNextTraverse(xmlNode), this) : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        */
        //if(this.emptyMessage && !oPHtmlNode.childNodes.length) this.setEmpty(oPHtmlNode);
    }
    
    /* ***********************
        Keyboard Support
    ************************/
    
    //Handler for a plane list
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (!this.selected) return;
        //error after delete...

        switch (key) {
            case 13:
                this.select(this.selected);
                if (this.onchoose)
                    this.onchoose();
                break;
            case 32:
                this.select(this.selected);
                break;
            case 46:
                //DELETE
                this.Remove();
                break;
            case 37:
                //LEFT
                var margin = jpf.compat.getBox(jpf.getStyle(this.selected, "margin"));
            
                if (!this.value) return;

                var node = this.getNextTraverseSelected(this.value, false);
                if (node)
                    this.select(node, shiftKey);
                
                if(this.selected.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.selected.offsetTop - margin[0];
                break;
            case 38:
                //UP
                var margin = jpf.compat.getBox(jpf.getStyle(this.selected, "margin"));
                
                if (!this.value) return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth - (hasScroll ? 15 : 0))
                    / (this.selected.offsetWidth + margin[1] + margin[3]));
                var node      = this.getNextTraverseSelected(this.value, false, items);
                if (node)
                    this.select(node);
                
                if (this.selected.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.selected.offsetTop - margin[0];
                break;
            case 39:
                //RIGHT
                var margin = jpf.compat.getBox(jpf.getStyle(this.selected, "margin"));
                
                if (!this.value) return;

                var node = this.getNextTraverseSelected(this.value, true);
                if (node)
                    this.select(node, shiftKey);
                
                if (this.selected.offsetTop + this.selected.offsetHeight
                  > this.oExt.scrollTop + this.oExt.offsetHeight)
                    this.oExt.scrollTop = this.selected.offsetTop
                        - this.oExt.offsetHeight + this.selected.offsetHeight
                        + margin[0];
                    
                break;
            case 40:
                //DOWN
                var margin = jpf.compat.getBox(jpf.getStyle(this.selected, "margin"));
                
                if (!this.value) return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items = Math.floor((this.oExt.offsetWidth - (hasScroll ? 15 : 0)) 
                    / (this.selected.offsetWidth + margin[1] + margin[3]));
                var node = this.getNextTraverseSelected(this.value, true, items);
                if (node)
                    this.select(node);
                
                if (this.selected.offsetTop + this.selected.offsetHeight
                  > this.oExt.scrollTop + this.oExt.offsetHeight)
                    this.oExt.scrollTop = this.selected.offsetTop
                        - this.oExt.offsetHeight + this.selected.offsetHeight + 10;
                
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
    }
    
    /* ***********************
              CACHING
    ************************/
    
    this.__getCurrentFragment = function(){
        //if(!this.value) return false;

        var fragment = {
            nodeType : 1,
            buttons  : this.buttons
        }
        
        jdshell.update();
        for (var i = 0; i < this.buttons.length; i++)
            this.buttons[i].Hide();
        
        this.buttons = [];
        
        return fragment;
    }
    
    this.__setCurrentFragment = function(fragment){
        this.buttons = fragment.buttons;
        
        jdshell.update();
        for (var i = 0; i < this.buttons.length; i++)
            this.buttons[i].Show();

        //Select First Node....
        var nodes = this.getTraverseNodes();
        if (nodes.length && this.autoselect)
            this.select(nodes[0]);
        if (!me.isFocussed(this))
            this.blur();
    }

    this.__findNode = function(cacheNode, id){
        //if(!cacheNode) return document.getElementById(id);
        //return cacheNode.getElementById(id);
    }
    
    this.__setClearMessage = function(msg){};
    
    this.__removeClearMessage = function(){
        //unsupported
    }
    
    /* ***********************
            DATABINDING
    ************************/
    
    this.nodes   = [];
    
    this.bLookup = {};
    this.__add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        if (this.bLookup[Lid]) return;

        var btn = jdwin.CreateWidget("button");

        var userdata = [xmlNode, btn,this];
        btn.onbuttonclick = function(){
            var pthis = userdata[2];
            pthis.select(userdata[0]);//unsupported: , event.ctrlKey, event.shiftKey);
            if (pthis.current)
                pthis.current.clicked = false;
            pthis.current         = userdata[1];
            pthis.current.clicked = true;
        }
                
        //[xmlNode, btn]
        btn.disabled = false;
        btn.InitButton(0, 0, 3, 3, this.applyRuleSetOnNode("Image", xmlNode),
            this.parentNode.offsetHeight ? 1 : 0);

        //elSelect.setAttribute("ondblclick", 'jpf.lookup(' + this.uniqueId + ').run_Event("onchoose")');
        
        this.buttons.push(btn);
        this.bLookup[Lid] = btn;
    }
    
    this.__fill = function(){
        if (!this.oExt.offsetHeight) return;
        
        this.posInited = false;
        this.show();
    }
    
    /* ***********************
                Select
    ************************/
    
    this.__select = function(htmlNode, xmlNode){
        if (this.value) {
            var Lid = this.value.getAttribute(XMLDatabase.xmlIdTag) + "|" + this.uniqueId;
            this.bLookup[Lid].clicked = false;
        }
        
        var Lid = xmlNode.getAttribute(XMLDatabase.xmlIdTag) + "|" + this.uniqueId;

        this.bLookup[Lid].clicked = true;
    }
    
    this.__deselect = function(){};
    
    this.__indicate = function(){};
    
    /* ***********************
                Focus
    ************************/
    
    this.__focus = function(){};
    
    this.__blur = function(){};
    
    /* ***********************
                SELECT
    ************************/
    
    this.__calcSelectRange = function(xmlStartNode, xmlEndNode){
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
    
    this.__selectDefault = function(XMLRoot){
        this.select(XMLRoot.selectSingleNode(this.ruleTraverse));
    }
    
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.pHtmlNode.appendChild(document.createElement("div"));
        if (this.jml.getAttribute("background"))
            this.oExt.style.background = "no-repeat url("
                + this.mediaPath.replace(/jav\:\//, "")
                + this.jml.getAttribute("background") + ")";
        this.oExt.style.position = "absolute";
        this.oExt.host           = this;
    }
    
    this.__loadJML = function(x){
        this.listtype    = parseInt(x.getAttribute("list-type")) || 2; //Types: 1=One dimensional List, 2=Two dimensional List
        this.behaviour   = parseInt(x.getAttribute("behaviour")) || 1; //Types: 1=Check on click, 2=Check independent
        
        this.multiselect = x.getAttribute("multiselect") != "false";
        this.autoselect  = x.getAttribute("autoselect") != "false";
        
        //this.setAnchor(x.getAttribute("left"), x.getAttribute("top"), x.getAttribute("right"), x.getAttribute("bottom"), x.getAttribute("width"), x.getAttribute("height"));
    }
    
    /* ***********************
        Deskrun Support
    ************************/
    DeskRun.register(this);
    
    this.show = function(){
        this.oExt.style.display = "block";

        if (!this.posInited) {
            this.posInited = true;
            var pos     = jpf.compat.getAbsolutePosition(this.oExt);

            var width   = 31;
            var spacing = 3;
            var linelen = Math.floor((this.oExt.offsetWidth - spacing)/(width + spacing));
            
            for (var i = 0; i < this.buttons.length; i++) {
                var posh = i % linelen;
                var posv = Math.floor(i/linelen);

                this.buttons[i].MoveTo(pos[0] + (posh * (width+spacing))
                    + spacing, pos[1] + (posv * (width+spacing)) + spacing);
            }
        }
        
        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].Show();
        }
    }
    
    this.hide = function(){
        this.oExt.style.display = "none";
        
        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].Hide();
        }
    }
}

//#endif
