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
 *  <j:frame caption="Options">
 *      <j:radiobutton value="1">Option 1</j:radiobutton>
 *      <j:radiobutton value="2">Option 2</j:radiobutton>
 *      <j:radiobutton value="3">Option 3</j:radiobutton>
 *      <j:radiobutton value="4">Option 4</j:radiobutton>
 *  </j:frame>
 * </code>
 *
 * @constructor
 * @define fieldset, frame
 * @allowchild {elements}, {anyjml}
 * @addnode elements:frame
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 *
 * @inherits jpf.Presentation
 */
jpf.fieldset = 
jpf.frame    = jpf.component(jpf.NODE_VISIBLE, function(){
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
        this.oExt     = this.$getExternal(); 
        this.oCaption = this.$getLayoutNode("main", "caption", this.oExt);
        var oInt      = this.$getLayoutNode("main", "container", this.oExt);
        
        this.oInt = this.oInt 
            ? jpf.JmlParser.replaceNode(oInt, this.oInt) 
            : jpf.JmlParser.parseChildren(this.$jml, oInt, this);
    };
    
    this.$loadJml = function(x){
        // not implement now.
    };
}).implement(jpf.Presentation);

// #endif
