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

// #ifdef __AMLFRAME || __INC_ALL

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
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 *
 * @inherits apf.Presentation
 */
apf.panel    = function(struct, tagName){
    this.$init(tagName || "panel", apf.NODE_VISIBLE, struct);
};

apf.fieldset = function(struct, tagName){
    this.$init(tagName || "fieldset", apf.NODE_VISIBLE, struct);
};

apf.frame    = function(struct, tagName){
    this.$init(tagName || "submit", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(apf.BaseStateButtons);

    this.$focussable     = false;
    
    //#ifdef __WITH_CONTENTEDITABLE
    this.$editableCaption = ["caption"]
    //#endif
    
    /**** Properties and Attributes ****/
    
    /**
     * @attribute {String} caption the text of the caption. 
     */
    this.$supportedProperties.push("caption", "url");
    this.$propHandlers["caption"] = function(value){
        if (!this.oCaption) return;
        
        if (this.oCaption.nodeType == 1)
            this.oCaption.innerHTML = value;
        else
            this.oCaption.nodeValue = value;
    };
    
    /**
     * @attribute {String} icon the location of the image.
     */
    this.$propHandlers["icon"] = function(value){
        var oIcon = this.$getLayoutNode("main", "icon", this.$ext);
        if (!oIcon) return;

        if (oIcon.nodeType == 1)
            oIcon.style.display = value ? "block" : "none";
        apf.skins.setIcon(oIcon, value, this.iconPath);
    };
    
    this.$propHandlers["url"] = function(value){
        var node = this.oCaption;
        if (node.tagName == "A" || node.nodeType != 1) 
            node = node.parentNode;

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
        this.$ext     = this.$getExternal(null, null, function(oExt){
            this.$initButtons(oExt);
        });
        this.oCaption = this.$getLayoutNode("main", "caption", this.$ext);
        this.$int     = this.$getLayoutNode("main", "container", this.$ext);
        this.$buttons = this.$getLayoutNode("main", "buttons",  this.$ext);

        /*if (this.oCaption) {
            this.oCaption = this.oCaption.nodeType == 1 
                ? this.oCaption 
                : this.oCaption.parentNode;
        }*/
    };
    
    this.$loadAml = function(x){
        // not implement now.
    };
    
        // #ifdef __WITH_UIRECORDER
    this.$getActiveElements = function() {
        // init $activeElements
        if (!this.$activeElements) {
            this.$activeElements = {
                $caption       : this.oCaption
            }
        }

        return this.$activeElements;
    }
    //#endif
}).call(apf.frame.prototype = new apf.Presentation());

apf.panel.prototype    =
apf.fieldset.prototype = apf.frame.prototype;

apf.aml.setElement("panel", apf.panel);
apf.aml.setElement("fieldset", apf.fieldset);
apf.aml.setElement("frame", apf.frame);

// #endif
