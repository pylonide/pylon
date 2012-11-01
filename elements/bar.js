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
 * This element displays a skinnable rectangle which can contain other 
 * AML elements. Often, it's also used in place of a regular HTML `<div>`.
 *
 * This element is used by other elements such as the 
 * [[apf.toolbar]] and `apf.statusbar` elements to specify sections within those elements
 * which in turn can contain other AML elements.
 *
 * #### Example
 *
 * ```xml, demo
 * <a:application xmlns:a="http://ajax.org/2005/aml">
 * <!-- startcontent -->
 *     <a:toolbar width="400">
 *         <a:bar>
 *             <a:button
 *               icon    = "../resources/icons/database_save.png"
 *               tooltip = "Save">Save</a:button>
 *             <a:divider />
 *             <a:button 
 *               icon    = "../resources/icons/arrow_undo.png"
 *               tooltip = "Undo">Undo</a:button>
 *             <a:button 
 *               icon    = "../resources/icons/arrow_redo.png"
 *               tooltip = "Redo">Redo</a:button>
 *             <a:divider />
 *             <a:button 
 *               icon    = "../resources/icons/textfield_add.png"
 *               tooltip = "Add row">Add row</a:button>
 *             <a:button 
 *               icon    = "../resources/icons/textfield_delete.png"
 *               tooltip = "Remove row">Remove row</a:button>
 *         </a:bar>
 *     </a:toolbar>
 * <!-- endcontent -->
 * </a:application>
 * ```
 * 
 * #### Remarks
 *
 * This component is used in the accordion element to create its sections. In
 * the `apf.statusbar`, the panel element is an alias of [[apf.bar]].
 *
 * @class apf.bar
 * @inherits apf.Presentation
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @define bar
 * @container
 * @allowchild button
 * @allowchild {elements}, {anyaml}
 *
 */
/**
 * @attribute {String} icon Sets or gets the URL pointing to the icon image.
 */
/**
 *  @attribute {Boolean} collapsed=false  Sets or gets the collapse panel on load
 * 
 */
/**
 * @attribute {String} title  Sets or gets the title string
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
