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
// #ifdef __AMLLABEL || __INC_ALL

/**
 * Element displaying a text in the user interface, usually specifying
 * a description of another element. When the user clicks on the label it 
 * can set the focus to the connected aml element.
 * Example:
 * This example uses the for attribute to connect the label to the form element.
 * <code>
 *  <a:label for="txtAddress">Address</a:label>
 *  <a:textbox id="txtAddress" value="Some text" />
 * </code>
 *
 * @constructor
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @inherits apf.BaseSimple
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the label text based on data loaded into this component.
 * <code>
 *  <a:model id="mdlLabel">
 *      <data text="Some text"></data>
 *  </a:model>
 *  <a:label model="mdlLabel" value="[@text]" />
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <a:model id="mdlLabel">
 *      <data text="Some text"></data>
 *  </a:model>
 *  <a:label value="[mdlLabel::@text]" />
 * </code>
 */
apf.label = function(struct, tagName){
    this.$init(tagName || "label", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction,
        //#endif
        apf.ChildValue
    );

    var _self = this;
    
    this.$focussable = false;
    var forElement;
    
    //#ifdef __WITH_CONVENIENCE_API
    
    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value, false, true);
    };
    
    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.value;
    }
    
    //#endif
    
    /** 
     * @attribute {String} caption the text displayed in the area defined by this 
     * element. Using the value attribute provides an alternative to using
     * the text using a text node.
     *
     * @attribute {String} for the id of the element that receives the focus 
     * when the label is clicked on.
     */
    this.$supportedProperties.push("caption", "for", "textalign");
    this.$propHandlers["caption"] = function(value){
        this.$caption.innerHTML = value;
    };
    this.$propHandlers["for"] = function(value){
        forElement = typeof value == "string" ? self[value] : value;
    };
    this.$propHandlers["textalign"] = function(value){
        this.$caption.style.textAlign = value || "";
    };

    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$caption = this.$getLayoutNode("main", "caption", this.$ext);
        if (this.$caption.nodeType != 1) 
            this.$caption = this.$caption.parentNode;
        
        this.$ext.onmousedown = function(){
            if (forElement && forElement.$focussable && forElement.focussable)
                forElement.focus();
        }
        
        var _self = this;
        apf.addListener(this.$ext, "click", function(e) {
            if (!_self.disabled)
                _self.dispatchEvent("click", {htmlEvent: e});
        });
        
        apf.addListener(this.$ext, "mouseover", function(e) {
            if (!_self.disabled)
                _self.dispatchEvent("mouseover", {htmlEvent: e});
        });
        
        apf.addListener(this.$ext, "mouseout", function(e) {
            if (!_self.disabled)
                _self.dispatchEvent("mouseout", {htmlEvent: e});
        });
    };
    
    this.$childProperty = "caption";
    
}).call(apf.label.prototype = new apf.BaseSimple());

apf.aml.setElement("label", apf.label);
//#endif
