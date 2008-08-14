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
// #ifdef __JLIST || __INC_ALL
// #define __JBASELIST 1

/**
 * Component displaying a skinnable list of options which can be selected.
 * Selection of multiple items can be allowed. Items can be renamed
 * individually and deleted individually or in groups.
 *
 * @classDescription		This class creates a new list
 * @return {List} Returns a new list
 * @type {List}
 * @constructor
 * @allowchild item,{smartbinding}
 * @addnode components:list, components:select, components:select1
 * @alias select
 * @alias select1
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.select = jpf.select1 = jpf.list = function(pHtmlNode, tagName, jmlNode){
    jpf.register(this, tagName || "list", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     RENAME
     ************************/
    // #ifdef __WITH_RENAME
    this.__getCaptionElement = function(){
        var x = this.__getLayoutNode("Item", "caption", this.__selected);
        if (!x) 
            return;
        return x.nodeType == 1 ? x : x.parentNode;
    }
    // #endif
    
    // #ifdef __JSUBMITFORM
    this.addEventListener("onafterselect", function(e){
        if (this.hasFeature(__VALIDATION__)) 
            this.validate();
    });
    // #endif
    
    /* ***********************
     Other Inheritance
     ************************/
    this.inherit(jpf.BaseList); /** @inherits jpf.BaseList */
    this.keyHandler = this.__keyHandler;
    
    // #ifdef __WITH_RENAME
    this.inherit(jpf.Rename); /** @inherits jpf.Rename */
    // #endif
    
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
        //this.oDrag.getElementsByTagName("DIV")[0].innerHTML = this.__selected.innerHTML;
        //this.oDrag.getElementsByTagName("IMG")[0].src = this.__selected.parentNode.parentNode.childNodes[1].firstChild.src;
        this.__updateNode(this.selected, this.oDrag);
        
        return this.oDrag;
    }
    
    this.__hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    }
    
    this.__moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX - this.oDrag.startX) + "px";
        this.oDrag.style.top  = (e.clientY - this.oDrag.startY) + "px";
    }
    
    this.__initDragDrop = function(){
        if (!this.__hasLayoutNode("DragIndicator")) 
            return;
        this.oDrag = jpf.XMLDatabase.htmlImport(
            this.__getLayoutNode("DragIndicator"), document.body);
        
        this.oDrag.style.zIndex   = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor   = "default";
        this.oDrag.style.display  = "none";
    }
    
    this.__dragout = this.__dragover = this.__dragdrop = function(){};
    
    this.inherit(jpf.DragDrop); /** @inherits jpf.DragDrop */
    // #endif
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.draw = function(){
        //#ifdef __WITH_XFORMS
        this.appearance = this.jml.getAttribute("appearance") || "compact";
        
        if (this.tagName == "select" && (this.appearance == "full" 
          || this.appearance == "minimal")) {
            this.mode = "check";
            if (!this.jml.getAttribute("skin")) 
                this.loadSkin("default:CheckList");
        }
        else 
            if (this.tagName == "select1" && this.appearance == "full") {
                this.mode = "radio";
                if (!this.jml.getAttribute("skin")) 
                    this.loadSkin("default:RadioList");
            }
            else 
                if (this.tagName == "select1" && this.appearance == "compact") 
                    this.multiselect = false;
        //#endif
        
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oInt = this.__getLayoutNode("main", "container", this.oExt);
        
        this.oExt.onmousedown = function(e){
            if (!e) 
                e = event;
            if (e.ctrlKey || e.shiftKey) 
                return;
            
            var srcElement = jpf.hasEventSrcElement ? e.srcElement : e.target;
            //debugger;
            if (this.host.allowDeselect && (srcElement == this 
              || srcElement.getAttribute(jpf.XMLDatabase.htmlIdTag))) 
                this.host.clearSelection(); //hacky
        }
        
        this.oExt.onclick = function(e){
            this.host.dispatchEvent("onclick", {
                htmlEvent: e || event
            });
        }
        
        //Get Options form skin
        this.listtype  = parseInt(this.__getOption("main", "type")) || 1; //Types: 1=One dimensional List, 2=Two dimensional List
        this.behaviour = parseInt(this.__getOption("main", "behaviour")) || 1; //Types: 1=Check on click, 2=Check independent
        //Support for check mode
        this.mode = this.mode || this.jml.getAttribute("mode") || "normal";
        if (this.mode == "check" || this.mode == "radio") {
            this.allowDeselect = false;
            this.ctrlSelect    = true;
            
            this.addEventListener("onafterrename", function(){
                var sb = this.getSelectionSmartBinding();
                if (!sb) 
                    return;
                
                //Make sure that the old value is removed and the new one is entered
                sb.__updateSelection();
                //this.reselect(this.selected);
            });
            
            if (this.mode == "check") 
                this.autoselect = false;
            if (this.mode == "radio") 
                this.multiselect = false;
        }
        
        //Support for more mode - Rename is required
        this.more = this.jml.getAttribute("more") ? true : false;
        if (this.more) {
            this.delayedSelect = false;
            
            this.addEventListener("onxmlupdate", function(e){
                if ("insert|add|synchronize|move".indexOf(e.action) > -1) 
                    this.oInt.appendChild(this.moreItem);
            });
            
            this.addEventListener("onafterrename", function(){
                var caption = this.applyRuleSetOnNode("caption", this.indicator)
                var xmlNode = this.findXmlNodeByValue(caption);
                
                var curNode = this.indicator;
                if (xmlNode != curNode || !caption) {
                    if (xmlNode && !this.isSelected(xmlNode)) 
                        this.select(xmlNode);
                    this.remove(curNode);
                }
                else 
                    if (!this.isSelected(curNode)) 
                        this.select(curNode);
            });
            
            this.addEventListener("onbeforeselect", function(){
                //This is a hack
                if (arguments[0] && this.isSelected(arguments[0]) 
                  && arguments[0].getAttribute('custom') == '1') {
                    this.setIndicator(arguments[0]);
                    this.selected = arguments[0];
                    var j = this;
                    setTimeout(function(){
                        j.startRename()
                    });
                    return false;
                }
            });
        }
    }
    
    this.__loadJML = function(x){
        if (this.jml.childNodes.length) 
            this.loadInlineData(this.jml);
        
        if (this.hasFeature(__MULTIBINDING__) && x.getAttribute("value")) 
            this.setValue(x.getAttribute("value"));
        
        // #ifdef __DESKRUN
        // this.doOptimize(true);
        // #endif
        
        if (x.getAttribute("multibinding") == "true" && !x.getAttribute("ref")) 
            this.inherit(jpf.MultiLevelBinding); /** @inherits jpf.MultiLevelBinding */
        
        // #ifdef __WITH_VIRTUALVIEWPORT
        if (x.getAttribute("viewport") == "virtual")
            this.inherit(jpf.VirtualViewport);
        //#endif
    }
    
    this.__destroy = function(){
        this.oExt.onclick = null;
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
    }
}
// #endif
