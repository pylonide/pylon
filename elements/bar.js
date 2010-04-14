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

// #ifdef __AMLBAR || __INC_ALL

/**
 * Element displaying a skinnable rectangle which can contain other 
 * aml elements. This element is used by other elements such as the 
 * toolbar and statusbar element to specify sections within those elements
 * which in turn can contain other aml elements.
 * Remarks:
 * This component is used in the accordion element to create its sections. In
 * the statusbar the panel element is an alias of bar.
 *
 * @constructor
 *
 * @define bar, panel, menubar
 * @attribute {String} icon the url pointing to the icon image.
 * @attribute {Boolean} collapsed   collapse panel on load, default is false
 * Possible values:
 *     true    panel is collapsed
 *     false   panel is not collapsed
 * @attribute {String} title   describes content in panel
 * @allowchild button
 * @allowchild {elements}, {anyaml}
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.section = function(struct, tagName){
    this.$init(tagName || "section", apf.NODE_VISIBLE, struct);
};

apf.menubar = function(struct, tagName){
    this.$init(tagName || "menubar", apf.NODE_VISIBLE, struct);
};

apf.bar     = function(struct, tagName){
    this.$init(tagName || "bar", apf.NODE_VISIBLE, struct);
};

(function(){
    this.$focussable     = false;
    this.$canLeechSkin   = true;
    this.$isLeechingSkin = false;
    
    this.$propHandlers["caption"] = function(value) {
        this.$int.innerHTML = value;
    }
    
    //@todo apf3.0 refactor
    this.addEventListener("AMLReparent", 
        function(beforeNode, pNode, withinParent){
            if (!this.$amlLoaded)
                return;

            if (this.$isLeechingSkin && !withinParent
              && this.skinName != pNode.skinName
              || !this.$isLeechingSkin
              && this.parentNode.$hasLayoutNode 
              && this.parentNode.$hasLayoutNode(this.localName)) {
                this.$isLeechingSkin = true;
                this.$forceSkinChange(this.parentNode.skinName.split(":")[0] + ":" + skinName);
            }
        });

    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal(this.$isLeechingSkin
            ? this.localName 
            : "main");

        //Draggable area support, mostly for a:toolbar
        if (this.oDrag) //Remove if already exist (skin change)
            this.oDrag.parentNode.removeChild(this.oDrag);
        
        this.oDrag = this.$getLayoutNode(this.$isLeechingSkin
            ? this.localName 
            : "main", "dragger", this.$ext);
            
        this.$int = this.$getLayoutNode(this.$isLeechingSkin
            ? this.localName 
            : "main", "container", this.$ext);
    };

    this.$loadAml = function(x){
        
    };
    
    /*#ifdef __WITH_SKIN_CHANGE
    this.$skinchange = function(){
        
    }
    //#endif*/
}).call(apf.bar.prototype = new apf.Presentation());

apf.menubar.prototype = 
apf.section.prototype = apf.bar.prototype;

apf.aml.setElement("bar", apf.bar);
apf.aml.setElement("menubar", apf.menubar);
apf.aml.setElement("section", apf.section);

// #endif
