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

// #ifdef __JWORKAREA || __INC_ALL
// #define __WITH_DRAGDROP 1
// #define __JBASELIST 1

/**
 * Component displaying an area containing elements which can be freely 
 * placed and moved in the two dimensional plane. Individual elements 
 * can be locked, their z-indexes can be changed. This component
 * allows for alignment of multiple elements.
 *
 * @classDescription		This class creates a new workarea
 * @return {Workarea} Returns a new workarea
 * @type {Workarea}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:workarea
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.workarea = function(pHtmlNode){
    jpf.register(this, "workarea", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    /* ***********************
              RENAME
    ************************/
    
    this.__getCaptionElement = function(){
        var x = this.__getLayoutNode("Item", "caption", this.__selected);
        return x.nodeType == 1 ? x : x.parentNode;
    }
    
    this.addEventListener("onafterselect",function(e){
        if(this.hasFeature(__VALIDATION__)) this.validate();
    });
    
    /* ***********************
      Other Inheritance
    ************************/
    this.inherit(jpf.BaseList); /** @inherits jpf.BaseList */
    
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if(!this.selected) return;
        var value = (ctrlKey ? 10 : (shiftKey ? 100 : 1));
        
        switch(key){
            case 37:
                this.MoveTo(this.selected, parseInt(this.applyRuleSetOnNode("left", this.selected)) - value, this.applyRuleSetOnNode("top", this.selected));  
            return false;
            case 38:
                this.MoveTo(this.selected, this.applyRuleSetOnNode("left", this.selected), parseInt(this.applyRuleSetOnNode("top", this.selected)) - value);
            return false;
            case 39:  
                this.MoveTo(this.selected, parseInt(this.applyRuleSetOnNode("left", this.selected)) + value, this.applyRuleSetOnNode("top", this.selected));
            return false;
            case 40:
                this.MoveTo(this.selected, this.applyRuleSetOnNode("left", this.selected), parseInt(this.applyRuleSetOnNode("top", this.selected)) + value);
            return false;
        }
    }
    
    this.inherit(jpf.Rename); /** @inherits jpf.Rename */
    
    /* ***********************
            DRAGDROP
    ************************/
    
    this.__showDragIndicator = function(sel, e){
        var x = e.offsetX;
        var y = e.offsetY;

        this.oDrag.startX = x;
        this.oDrag.startY = y;
        
        document.body.appendChild(this.oDrag);
        //this.oDrag.getElementsByTagName("DIV")[0].innerHTML = this.__selected.innerHTML;
        //this.oDrag.getElementsByTagName("IMG")[0].src = this.__selected.parentNode.parentNode.childNodes[1].firstChild.src;
        this.__updateNode(this.selected, this.oDrag, true);
        
        return this.oDrag;
    }
    
    this.__hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    }
    
    this.__moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX - this.oDrag.startX) + "px";
        this.oDrag.style.top = (e.clientY - this.oDrag.startY) + "px";
    }
    
    this.__initDragDrop = function(){
        if(!this.__hasLayoutNode("DragIndicator")) return;
        this.oDrag = jpf.XMLDatabase.htmlImport(this.__getLayoutNode("DragIndicator"), document.body);
        
        this.oDrag.style.zIndex = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor = "default";
        this.oDrag.style.display = "none";
    }
    
    this.__dragout = function(el, dragdata){
        var htmlNode = jpf.XMLDatabase.findHTMLNode(dragdata.data, this);
        if(htmlNode) htmlNode.style.display = "block";
    }
    this.__dragover = function(el, dragdata, candrop){
        var htmlNode = jpf.XMLDatabase.findHTMLNode(dragdata.data, this);
        if(htmlNode){
            htmlNode.style.display = candrop[0] && jpf.XMLDatabase.isChildOf(this.XMLRoot, candrop[0], true) ? "none" : "block"; 
        }
    }
    this.__dragstart = function(el, dragdata){
        var htmlNode = jpf.XMLDatabase.findHTMLNode(dragdata.data, this);
        if(htmlNode) htmlNode.style.display = "none";
    }
    this.__dragdrop = function(el, dragdata, candrop){
        //if(!dragdata.resultNode.
    }
    
    this.addEventListener("ondragstart", function(e){
        return this.applyRuleSetOnNode("move", e.data) ? true : false;
    });
    
    this.addEventListener("ondragdrop", function(e){ 
        if(e.candrop && e.host == this){
            var pos = jpf.compat.getAbsolutePosition(this.oInt, null, true);
            this.MoveTo(e.data, (e.x - pos[0] - e.indicator.startX), (e.y - pos[1] - e.indicator.startY));
            
            return false;
        }
    });
    
    this.MoveTo = function(xmlNode, x, y){
        //Use Action Tracker
        var lnode = this.getNodeFromRule("left", xmlNode, null, null, true);
        var tnode = this.getNodeFromRule("top", xmlNode, null, null, true);
        
        var attrs = {};
        attrs[lnode.nodeName] = x;
        attrs[tnode.nodeName] = y;
        
        var exec = this.executeAction("setAttributes", [xmlNode, attrs], "moveto", xmlNode);
        if(exec !== false) return xmlNode;
        
        this.dispatchEvent("onmoveitem", {xmlNode : xmlNode, x : x, y : y});
    }
    
    this.SetZindex = function(xmlNode, value){
        var node = this.getNodeFromRule("zindex", xmlNode, null, null, true);
        if(!node) return;
        
        var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4 ? "setTextNode" : "setAttribute";
        var args = node.nodeType == 1 ? [node, value] : (node.nodeType == 3 || node.nodeType == 4 ? [node.parentNode, value] : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);

        //Use Action Tracker
        this.executeAction(atAction, args, "setzindex", xmlNode);
    }	
    
    this.inherit(jpf.DragDrop); /** @inherits jpf.DragDrop */
    
    /* *********
        Item creation
    **********/
    
    this.__updateModifier = function(xmlNode, htmlNode){
        htmlNode.style.left = (this.applyRuleSetOnNode("left", xmlNode) || 10) + "px";
        htmlNode.style.top = (this.applyRuleSetOnNode("top", xmlNode) || 10) + "px";
        htmlNode.style.width = (this.applyRuleSetOnNode("width", xmlNode) || 100) + "px";
        htmlNode.style.height = (this.applyRuleSetOnNode("height", xmlNode) || 100) + "px";
        
        var zindex = parseInt(this.applyRuleSetOnNode("zindex", xmlNode));
        var curzindex = parseInt(jpf.compat.getStyle(htmlNode, jpf.descPropJs ? "zIndex" : "z-index")) || 1;
        if(curzindex != zindex){
            var nodes = this.getTraverseNodes();
            for(var res=[],i=0;i<nodes.length;i++){
                if(nodes[i] == xmlNode) continue;
                res[nodes[i].getAttribute("zindex")] = nodes[i];
            }
            res[curzindex] = xmlNode;

            if(curzindex < zindex){
                for(var k=curzindex;k<zindex;k++){
                    if(!res[k+1]) continue;
                    res[k+1].setAttribute("zindex", k);
                    jpf.XMLDatabase.findHTMLNode(res[k+1], this).style.zIndex = k;
                }
            }
            else{
                for(var k=zindex;k<curzindex;k++){
                    if(!res[k]) continue;
                    res[k].setAttribute("zindex", k+1);
                    jpf.XMLDatabase.findHTMLNode(res[k], this).style.zIndex = k+1;
                }
            }

            htmlNode.style.zIndex = zindex;
        }
    }
    
    this.__addModifier = function(xmlNode, htmlNode){
        if(!xmlNode.getAttribute("zindex")){
            xmlNode.setAttribute("zindex", this.oExt.childNodes.length+1);
        }
        
        var x, y;
        if(jpf.DragServer.dragdata){
            var pos = jpf.compat.getAbsolutePosition(this.oInt, null, true);
            if(!xmlNode.getAttribute("left")) xmlNode.setAttribute("left", (jpf.DragServer.dragdata.x - pos[0] - jpf.DragServer.dragdata.indicator.startX));
            if(!xmlNode.getAttribute("top")) xmlNode.setAttribute("top", (jpf.DragServer.dragdata.y - pos[1] - jpf.DragServer.dragdata.indicator.startY));
        }

        if(htmlNode.style){
            htmlNode.style.left = (this.applyRuleSetOnNode("left", xmlNode) || 10) + "px";
            htmlNode.style.top = (this.applyRuleSetOnNode("top", xmlNode) || 10) + "px";
            htmlNode.style.width = (this.applyRuleSetOnNode("width", xmlNode) || 100) + "px";
            htmlNode.style.height = (this.applyRuleSetOnNode("height", xmlNode) || 100) + "px";
            htmlNode.style.zIndex = (this.oExt.childNodes.length+1);
        }
        else{
            var style = [];
            style.push("left:" + (this.applyRuleSetOnNode("left", xmlNode) || 10) + "px");
            style.push("top:" + (this.applyRuleSetOnNode("top", xmlNode) || 10) + "px");
            style.push("width:" + (this.applyRuleSetOnNode("width", xmlNode) || 100) + "px");
            style.push("height:" + (this.applyRuleSetOnNode("height", xmlNode) || 100) + "px");
            style.push("z-index:" + (this.oExt.childNodes.length+1));
            htmlNode.setAttribute("style", style.join(";"));
        }
    }
    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(); 
        this.oInt = this.__getLayoutNode("Main", "container", this.oExt);

        /*this.oExt.onmousedown = function(e){
            if(!e) e = event;
            if(e.ctrlKey || e.shiftKey) return;
            
            var srcElement = IS_IE ? e.srcElement : e.target;
            debugger;
            if(this.host.allowDeselect && (srcElement == this || srcElement.getAttribute(XMLDatabase.htmlIdTag)))
                this.host.clearSelection(); //hacky
        }*/
        
        this.oExt.onclick = function(e){
            this.host.dispatchEvent("onclick", {htmlEvent : e || event});
        }

        //Get Options form skin
        this.listtype = parseInt(this.__getLayoutNode("Main", "type")) || 1; //Types: 1=One dimensional List, 2=Two dimensional List
        this.behaviour = parseInt(this.__getLayoutNode("Main", "behaviour")) || 1; //Types: 1=Check on click, 2=Check independent
    }
    
    this.__loadJML = function(x){
        if(this.jml.childNodes.length) this.loadInlineData(this.jml);
        
        if(this.hasFeature(__MULTIBINDING__) && x.getAttribute("value")) this.setValue(x.getAttribute("value"));
        
        // this.doOptimize(true);
        
        if(x.getAttribute("multibinding") == "true" && !x.getAttribute("ref")) 
            this.inherit(jpf.MultiLevelBinding); /** @inherits jpf.MultiLevelBinding */
    }
    
    this.__destroy = function(){
        this.oExt.onclick = null;
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
    }
}

//#endif