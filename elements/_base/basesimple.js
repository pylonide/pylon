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
// #ifdef __JBASESIMPLE || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Baseclass of a simple element. This are usually displaying elements 
 * (i.e. {@link element.label}, {@link element.picture})
 *
 * @constructor
 * @baseclass
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.BaseSimple = function(){
    this.inherit(jpf.Presentation);
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); 
    // #endif
    
    this.getValue = function(){
        return this.value;
    }
    
    /**** Drag & Drop ****/
    
    // #ifdef __WITH_DRAGDROP
    
    this.$showDragIndicator = function(sel, e){
        var x = e.offsetX + 22;
        var y = e.offsetY;
        
        this.oDrag.startX = x;
        this.oDrag.startY = y;
        
        
        document.body.appendChild(this.oDrag);
        //this.oDrag.getElementsByTagName("DIV")[0].innerHTML = this.selected.innerHTML;
        //this.oDrag.getElementsByTagName("IMG")[0].src = this.selected.parentNode.parentNode.childNodes[1].firstChild.src;
        var oInt = this.$getLayoutNode("main", "caption", this.oDrag);
        if (oInt.nodeType != 1) 
            oInt = oInt.parentNode;
        
        oInt.innerHTML = this.applyRuleSetOnNode("caption", this.xmlRoot) || "";
        
        return this.oDrag;
    }
    
    this.$hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    }
    
    this.$moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX - this.oDrag.startX
            + document.documentElement.scrollLeft) + "px";
        this.oDrag.style.top  = (e.clientY - this.oDrag.startY
            + document.documentElement.scrollTop) + "px";
    }
    
    this.$initDragDrop = function(){
        this.oDrag = document.body.appendChild(this.oExt.cloneNode(true));
        
        this.oDrag.style.zIndex     = 1000000;
        this.oDrag.style.position   = "absolute";
        this.oDrag.style.cursor     = "default";
        this.oDrag.style.filter     = "progid:DXImageTransform.Microsoft.Alpha(opacity=50)";
        this.oDrag.style.MozOpacity = 0.5;
        this.oDrag.style.opacity    = 0.5;
        this.oDrag.style.display    = "none";
    }
    
    this.$dragout = this.$dragover = this.$dragdrop = function(){};
    
    this.inherit(jpf.DragDrop); /** @inherits jpf.DragDrop */
    // #endif
}

//#endif
