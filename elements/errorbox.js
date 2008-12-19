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

// #ifdef __JERRORBOX || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Element showing an error message when the attached element 
 * is in erroneous state and has the invalidmsg="" attribute specified.
 * In most cases the errorbox element is implicit and will be created 
 * automatically. 
 * Example:
 * <code>
 *  <j:errorbox>
 *      Invalid e-mail address entered.
 *  </j:errorbox>
 * </code>
 * Remarks:
 * In most cases the errorbox element is not created directly but implicitly
 * by a validationgroup. an element that goes into an error state will
 * show the errorbox.
 * <code>
 *  <j:bar validgroup="vgForm">
 *      <j:label>Phone number</j:label>
 *      <j:textbox id="txtPhone"
 *          required   = "true" 
 *          pattern    = "(\d{3}) \d{4} \d{4}" 
 *          invalidmsg = "Incorrect phone number entered" />
 *
 *      <j:label>Password</j:label>
 *      <j:textbox 
 *          required   = "true" 
 *          mask       = "password"
 *          minlength  = "4"
 *          invalidmsg = "Please enter a password of at least four characters" />
 *  </j:bar>
 * </code>
 *
 * To check if the element has valid information entered, leaving the textbox
 * (focussing another element) will trigger a check. Programmatically a check
 * can be done using the following code:
 * <code>
 *  txtPhone.validate();
 * 
 *  //Or use the html5 syntax
 *  txtPhone.checkValidity();
 * </code>
 *
 * To check for the entire group of elements use the validation group. For only 
 * the first non-valid element the errorbox is shown. That element also receives
 * focus.
 * <code>
 *  vgForm.validate();
 * </code>
 *
 * @constructor
 * @define errorbox
 * 
 * @allowchild {anyxhtml}
 * @addnode elements
 *
 * @inherits jpf.Presentation
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */

jpf.errorbox = jpf.component(jpf.NODE_VISIBLE, function(){
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"main" : [["container","@invalidmsg"]]};
    // #endif
    
    var _self = this;
    
    /**
     * Sets the message of the errorbox.
     * @param {String} value 
     */
    this.setMessage = function(value){
        // #ifndef __WITH_EDITMODE
        if(value.indexOf(";")>-1){
            value = value.split(";");
            value = "<strong>" + value[0] + "</strong>" + value[1];
        }
        this.oInt.innerHTML = value;
        //#endif
    };
    
    /* #ifdef __WITH_EDITMODE
    this.hide = function(){}
    #endif */
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt   = this.$getExternal(); 
        this.oInt   = this.$getLayoutNode("main", "container", this.oExt);
        this.oClose = this.$getLayoutNode("main", "close", this.oExt);
        
        if (this.oClose) {
            this.oClose.onclick = function(){
                _self.hide();
                
                if (_self.host)
                    _self.host.focus(null, {mouse:true});
            };
        }
        
        this.oExt.onmousedown = function(e){
            (e || event).cancelBubble = true;
            
            //#ifdef __WITH_WINDOW_FOCUS
            if (jpf.hasFocusBug)
                jpf.window.$focusfix();
            //#endif
        }
        
        this.hide();
    };
    
    this.$loadJml = function(x){
        jpf.JmlParser.parseChildren(this.$jml, this.oInt, this);
        
        /* #ifdef __WITH_EDITMODE
        if (this.editable && this.form.elements[x.getAttribute("for")]) {
            this.oInt.innerHTML = this.form.elements[x.getAttribute("for")]
                .$jml.getAttribute("invalidmsg");
            
            this.$makeEditable("main", this.oExt, 
                this.form.elements[x.getAttribute("for")].$jml);
            
            this.show();
        }
        #endif */
    };
    
    this.$destroy = function(){
        if (this.oClose)
            this.oClose.onclick = null;
        
        this.oExt.onmousedown = null;
    }
}).implement(
    jpf.Presentation
);
// #endif