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

// #ifdef __JFRAME || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Element displaying a frame with a caption, containing other elements. This
 * element is called a fieldset in html.
 * Example:
 * <code>
 *  <a:frame caption="Options">
 *      <a:radiobutton value="1">Option 1</a:radiobutton>
 *      <a:radiobutton value="2">Option 2</a:radiobutton>
 *      <a:radiobutton value="3">Option 3</a:radiobutton>
 *      <a:radiobutton value="4">Option 4</a:radiobutton>
 *  </a:frame>
 * </code>
 *
 * @constructor
 * @define fieldset, frame
 * @allowchild {elements}, {anyaml}
 * @addnode elements:frame
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 *
 * @inherits apf.Presentation
 */
apf.panel    = 
apf.fieldset = 
apf.frame    = apf.component(apf.NODE_VISIBLE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    // #ifdef __WITH_EDITMODE
    this.editableParts = {"main" : [["caption", "@caption"]]};
    // #endif
    
    /**** Properties and Attributes ****/
    
    /**
     * @attribute {String} caption the text of the caption. 
     */
    this.$supportedProperties.push("caption", "url");
    this.$propHandlers["caption"] = function(value){
        if (this.oCaption) 
            this.oCaption.nodeValue = value;
    };
    
    /**
     * @attribute {String} icon the location of the image.
     */
    this.$propHandlers["icon"] = function(value){
        var oIcon = this.$getLayoutNode("main", "icon", this.oExt);
        if (!oIcon) return;

        if (oIcon.nodeType == 1)
            oIcon.style.display = value ? "block" : "none";
        apf.skins.setIcon(oIcon, value, this.iconPath);
    };
    
    this.$propHandlers["url"] = function(value){
        var node = this.oCaption.nodeType == 1 
            ? this.oCaption 
            : this.oCaption.parentNode;
        
        if (node.tagName == "A") node = node.parentNode;
        node.innerHTML = "<a href='" + value + "' " 
            + (value.match(/^http:\/\//) ? "target='_blank'" : "") + ">" 
            + this.caption + "</a>";
        this.oCaption = this.oCaption.firstChild;
    };
    
    /** 
     * Sets the text of the title of this element
     * @param {String} value the text of the title.
     */
    this.setTitle = function(value){
        this.setProperty("title", value);
    };
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt     = this.$getExternal(null, null, function(oExt){
            this.$initButtons(oExt);
        });
        this.oCaption = this.$getLayoutNode("main", "caption", this.oExt);
        var oInt      = this.$getLayoutNode("main", "container", this.oExt);
        this.oButtons = this.$getLayoutNode("main", "buttons",  this.oExt);
        
        this.oInt = this.oInt 
            ? apf.AmlParser.replaceNode(oInt, this.oInt) 
            : apf.AmlParser.parseChildren(this.$aml, oInt, this);
    };
    
    this.$loadAml = function(x){
        // not implement now.
    };
}).implement(
    apf.Presentation,
    apf.BaseStateButtons
);

// #endif
