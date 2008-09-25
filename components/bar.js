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

// #ifdef __JBAR || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a skinnable rectangle which can contain other JML components.
 *
 * @classDescription This class creates a new bar
 * @return {Bar} Returns a new bar
 * @type {Bar}
 * @constructor
 * @define menubar
 * @allowchild button
 * @define bar
 * @allowchild {components}, {anyjml}
 * @addnode components:bar
 * @alias panel
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.panel = 
jpf.bar   = jpf.component(jpf.GUI_NODE, function(){
    this.canHaveChildren = true;
    
    this.__domHandlers["reparent"].push(
        function(beforeNode, pNode, withinParent){
            if (!this.__jmlLoaded)
                return;

            if (isUsingParentSkin && !withinParent 
              && this.skinName != pNode.skinName
              || !isUsingParentSkin 
              && this.parentNode.__hasLayoutNode 
              && this.parentNode.__hasLayoutNode(this.tagName)) {
                //@todo for now, assuming dom garbage collection doesn't leak
                this.draw();
                
                //Draggable area support, mostly for j:toolbar
                if (this.oDrag)
                    this.oDrag.parentNode.removeChild(this.oDrag);
                
                //Resetting properties
                var props = this.__supportedProperties;
                for (var i = 0; i < props.length; i++) {
                    if (this[props[i]] !== undefined)
                        this.__propHandlers[props[i]].call(this, this[props[i]]);
                }
                
                this.__loadJml();
            }
        });

    var isUsingParentSkin = false;
    this.draw = function(){
        if (this.parentNode && this.parentNode.__hasLayoutNode 
          && this.parentNode.__hasLayoutNode(this.tagName)) {
            isUsingParentSkin = true;
            if (this.skinName != this.parentNode.skinName)
                this.__loadSkin(this.parentNode.skinName);
        }
        else if(isUsingParentSkin){
            isUsingParentSkin = false;
            this.__loadSkin(this.jml.getAttribute("skin") 
                || "default:" + this.tagName);
        }

        //Build Main Skin
        this.oExt = this.__getExternal(isUsingParentSkin 
            ? this.tagName 
            : "main");

        //Draggable area support, mostly for j:toolbar
        this.oDrag = this.__getLayoutNode(isUsingParentSkin 
            ? this.tagName 
            : "main", "dragger", this.oExt);
    }

    this.__loadJml = function(x){
        var oInt = this.__getLayoutNode(isUsingParentSkin 
            ? this.tagName 
            : "main", "container", this.oExt);
        
        this.oInt = this.oInt
            ? jpf.JmlParser.replaceNode(oInt, this.oInt)
            : jpf.JmlParser.parseChildren(x, oInt, this);
    }
}).implement(jpf.Presentation);

// #endif
