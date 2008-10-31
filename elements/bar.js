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
 * Component displaying a skinnable rectangle which can contain other 
 * jml components. This component is used by other components such as the 
 * toolbar and statusbar component to specify sections within those components
 * which in turn can contain other jml components.
 *
 * @constructor
 *
 * @define bar, panel, menubar
 * @attribute {String} icon the url pointing to the icon image.
 * @allowchild button
 * @allowchild {components}, {anyjml}
 * @addnode components
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.panel = 
jpf.bar   = jpf.component(jpf.NODE_VISIBLE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    this.$domHandlers["reparent"].push(
        function(beforeNode, pNode, withinParent){
            if (!this.$jmlLoaded)
                return;

            if (isUsingParentSkin && !withinParent 
              && this.skinName != pNode.skinName
              || !isUsingParentSkin 
              && this.parentNode.$hasLayoutNode 
              && this.parentNode.$hasLayoutNode(this.tagName)) {
                isUsingParentSkin = true;
                this.$forceSkinChange(this.parentNode.skinName.split(":")[0] + ":" + skinName);
            }
        });

    var isUsingParentSkin = false;
    this.$draw = function(){
        if (this.parentNode && this.parentNode.$hasLayoutNode 
          && this.parentNode.$hasLayoutNode(this.tagName)) {
            isUsingParentSkin = true;
            if (this.skinName != this.parentNode.skinName)
                this.$loadSkin(this.parentNode.skinName);
        }
        else if(isUsingParentSkin){
            isUsingParentSkin = false;
            this.$loadSkin();
        }

        //Build Main Skin
        this.oExt = this.$getExternal(isUsingParentSkin 
            ? this.tagName 
            : "main");

        //Draggable area support, mostly for j:toolbar
        if (this.oDrag) //Remove if already exist (skin change)
            this.oDrag.parentNode.removeChild(this.oDrag);
        
        this.oDrag = this.$getLayoutNode(isUsingParentSkin 
            ? this.tagName 
            : "main", "dragger", this.oExt);
    };

    this.$loadJml = function(x){
        var oInt = this.$getLayoutNode(isUsingParentSkin 
            ? this.tagName 
            : "main", "container", this.oExt);
        
        this.oInt = this.oInt
            ? jpf.JmlParser.replaceNode(oInt, this.oInt)
            : jpf.JmlParser.parseChildren(x, oInt, this);
    };
    
    /*#ifdef __WITH_SKIN_CHANGE
    this.$skinchange = function(){
        
    }
    //#endif*/
}).implement(jpf.Presentation);

// #endif
