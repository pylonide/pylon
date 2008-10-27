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
// #ifdef __JPALETTE || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a set of choices to the user which allows
 * him/her to pick a specific color. This component also gives the
 * user a choice to add a custom color.
 *
 * @constructor
 * @define palette
 * @allowchild {smartbinding}
 * @addnode components
 *
 * @inherits jpf.XForms
 * @inherits jpf.Presentation
 * @inherits jpf.Validation
 * @inherits jpf.DataBinding
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */

jpf.palette = jpf.component(jpf.NODE_VISIBLE, function(){
    
    /**** Properties and Attributes ****/
    
    this.$focussable = true; // This object can get the focus
    this.value       = null;
    this.direction   = "down";
    
    this.$supportedProperties.push("value");
    /**
     * The selected color of the palette
     */
    this.$propHandlers["value"] = function(value){
        this.oViewer.style.backgroundColor = value;
    };
    
    /**** Public methods ****/
    
    /**
     * @copy Widget#setValue
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };
    
    /**
     * @copy Widget#getValue
     */
    this.getValue = function(){
        return this.value ? this.value.nodeValue : "";
    };
    
    /**** Private state handling methods ****/
    
    this.$addColor = function(clr, oContainer){
        if (!oContainer) 
            oContainer = this.oCustom;
        
        var oItem = this.$getLayoutNode("item");
        
        if (oContainer == this.oCustom) {
            oItem.setAttribute("onmousedown", "jpf.lookup(" 
                + this.uniqueId + ").$doCustom(this)");
            oItem.setAttribute("ondblclick", "jpf.lookup(" 
                + this.uniqueId + ").$doCustom(this, true)");
        }
        else 
            oItem.setAttribute("onmousedown", "jpf.lookup(" + this.uniqueId 
                + ").change(this.style.backgroundColor.replace(/^#/, ''))");
        
        oItem = jpf.xmldb.htmlImport(oItem, oContainer, null, true);
        this.$getLayoutNode("item", "background", oItem).style.backgroundColor = clr;
    };
    
    this.$setCustom = function(oItem, clr){
        oItem.style.backgroundColor = clr;
        this.change(clr);
    };
    
    this.$doCustom = function(oItem, force_create){
        if (force_create || oItem.style.backgroundColor == "#ffffff") {
            this.dispatchEvent("createcustom", {
                htmlNode: oItem
            });
        }
        else 
            this.change(oItem.style.backgroundColor.replace(/^#/, ""));
    };
    
    this.defaultValue = "ff0000";
    
    this.colors = ["fc0025", "ffd800", "7dff00", "32ffe0", "0026ff",
        "cd00ff", "ffffff", "e5e5e5", "d9d9d9", "de003a",
        "ffc600", "009022", "00bee1", "003e83", "dc0098", 
        "737373", "666666", "000000"];
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt      = this.$getExternal();
        this.oViewer   = this.$getLayoutNode("main", "viewer", this.oExt);
        this.oStandard = this.$getLayoutNode("main", "standard", this.oExt);
        this.oCustom   = this.$getLayoutNode("main", "custom", this.oExt);

        var i;
        for (i = 0; i < this.colors.length; i++) 
            this.$addColor(this.colors[i], this.oStandard);
        for (i = 0; i < 9; i++) 
            this.$addColor("ffffff");
        
        //this.oViewer.setAttribute("ondblclick", "jpf.lookup(" + this.uniqueId + ").openColorPicker()");
    };
}).implement(
    // #ifdef __WITH_DATABINDING
    jpf.DataBinding,
    // #endif
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    jpf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    jpf.XForms,
    //#endif
    jpf.Presentation
);

// #endif
