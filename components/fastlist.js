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
// #ifdef __JFASTLIST || __INC_ALL
// #define __JBASEFASTLIST 1

/**
 * Component displaying a list of options which might be selected.
 * This component is optimized for large number of items (1000+) and
 * has been tested with more than 100,000 items.
 *
 * @classDescription		This class creates a new fastlist
 * @return {Fastlist} Returns a new fastlist
 * @type {Fastlist}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:fastlist
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */

jpf.fastlist = function(pHtmlNode){
    jpf.register(this, "fastlist", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     RENAME
     ************************/
    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        var x = this.$getLayoutNode("item", "caption", this.$selected);
        if (!x) 
            return false;
        return x.nodeType == 1 ? x : x.parentNode;
    }
    // #endif
    
    // #ifdef __JSUBMITFORM
    this.addEventListener("afterselect", function(e){
        if (this.hasFeature(__VALIDATION__)) 
            this.validate();
    });
    // #endif
    
    /* ***********************
     Other Inheritance
     ************************/
    this.inherit(jpf.BaseFastList); /** @inherits jpf.BaseFastList */

    this.addEventListener("keydown", this.$keyHandler);
    
    // #ifdef __WITH_RENAME
    this.inherit(jpf.Rename); /** @inherits jpf.Rename */
    // #endif
    
    /* ***********************
     DRAGDROP
     ************************/
    // #ifdef __WITH_DRAGDROP
    this.$showDragIndicator = function(sel, e){
        var x = e.offsetX;
        var y = e.offsetY;
        
        this.oDrag.startX = x;
        this.oDrag.startY = y;
        
        document.body.appendChild(this.oDrag);
        //this.oDrag.getElementsByTagName("DIV")[0].innerHTML = this.$selected.innerHTML;
        //this.oDrag.getElementsByTagName("IMG")[0].src = this.$selected.parentNode.parentNode.childNodes[1].firstChild.src;
        this.$updateNode(this.selected, this.oDrag);
        
        return this.oDrag;
    };
    
    this.$hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    };
    
    this.$moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX - this.oDrag.startX) + "px";
        this.oDrag.style.top = (e.clientY - this.oDrag.startY) + "px";
    };
    
    this.$initDragDrop = function(){
        if (!this.$hasLayoutNode("DragIndicator")) 
            return;
        this.oDrag = jpf.xmldb.htmlImport(
            this.$getLayoutNode("DragIndicator"), document.body);
        
        this.oDrag.style.zIndex   = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor   = "default";
        this.oDrag.style.display  = "none";
    };
    
    this.$dragout = this.$dragover = this.$dragdrop = function(){};
    
    this.inherit(jpf.DragDrop); /** @inherits jpf.DragDrop */
    // #endif
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        
        /*this.oExt.onmousedown = function(e){
         if(!e) e = event;
         if(e.ctrlKey || e.shiftKey) return;
         
         var srcElement = jpf.isIE ? e.srcElement : e.target;
         debugger;
         if(this.host.allowdeselect && (srcElement == this || srcElement.getAttribute(jpf.xmldb.htmlIdTag)))
         this.host.clearSelection(); //hacky
         }*/
        this.oExt.onclick = function(e){
            this.host.dispatchEvent("click", {
                htmlEvent: e || event
            });
        }
        
        this.sb = new jpf.Scrollbar(this.pHtmlNode);
        
        //Get Options form skin
        this.listtype  = parseInt(this.$getLayoutNode("main", "type")) || 1; //Types: 1=One dimensional List, 2=Two dimensional List
        this.behaviour = parseInt(this.$getLayoutNode("main", "behaviour")) || 1; //Types: 1=Check on click, 2=Check independent
    };
    
    this.$loadJml = function(x){
        if (this.jml.childNodes.length) 
            this.loadInlineData(this.jml);
        
        if (this.hasFeature(__MULTIBINDING__) && x.getAttribute("value")) 
            this.setValue(x.getAttribute("value"));
        
        // this.doOptimize(true);
        
        if (x.getAttribute("multibinding") == "true" && !x.getAttribute("ref")) 
            this.inherit(jpf.MultiLevelBinding); /** @inherits jpf.MultiLevelBinding */
    };
    
    this.$destroy = function(){
        this.oExt.onclick = null;
    };
}
// #endif
