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

__VALIDATION__ = 1 << 6;

// #ifdef __WITH_VALIDATION

/**
 * Baseclass adding Validation features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.Validation = function(){
    this.isActive  = true;
    this.__regbase = this.__regbase | __VALIDATION__;
    
    /**
     * Checks if this component's value is valid.
     *
     * @param  {Boolean}  checkRequired  optional  true  also include required check.
     *                                           false  default  do not include required check.
     * @return  {Boolean}  specifying wether the value is valid
     * @see  ValidationGroup
     * @see  Submitform
     */
    this.isValid = function(checkRequired){
        if (checkRequired && this.required) {
            var value = this.getValue();
            if (!value || value.toString().length == 0)
                return false;
        }
        
        //for(var i=0;i<vRules.length;i++) if(!eval(vRules[i])) return false;
        var isValid = (this.vRules.length
            ? eval("(" + this.vRules.join(") && (") + ")") : true);
        
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-" + (isValid ? "valid" : "invalid"));
        //#endif
        
        return isValid;
    }
    
    /**
     * @private
     * @todo This method should also scroll the element into view
     */
    this.showMe = function(){
        var p = this.parentNode;
        while (p) {
            if (p.show)
                p.show();
            p = p.parentNode;
        }
    }
    
    /**
     * Puts this component in the error state, optionally showing the 
     * error box if this component's is invalid.
     *
     * @param  {Boolean}  force  optional  true  set this component in the error state and don't check if the component's value is invalid.
     *                                   false  default  only do this when the component's value is invalid.
     * @return  {Boolean}  boolean specifying wether the value is valid
     * @see  ValidationGroup
     * @see  Submitform
     */
    this.validate = function(force){
        if (!this.validgroup) return;

        var hasError = false;
        if (force || !this.isValid()) {
            this.setError();
            return true;
        }
        else {
            this.clearError();
            return false;
        }
        
        return !hasError;
    }
    
    /**
     *	@private
     */
    this.setError = function(value){
        if (this.__setStyleClass)
            this.__setStyleClass(this.oExt, this.baseCSSname + "Error");
        
        if (this.errBox) {
            if(!this.validgroup.allowMultipleErrors)
                this.validgroup.hideAllErrors();
            
            this.errBox.setMessage(this.invalidmsg);
            this.showMe();
            
            if (this.validgroup) {
                this.oExt.parentNode.insertBefore(this.errBox.oExt,
                    this.oExt.nextSibling);
                
                if (jpf.getStyle(this.errBox.oExt, "position") == "absolute") {
                    var pos = jpf.getAbsolutePosition(this.oExt,
                        jpf.getPositionedParent(this.oExt));
                    this.errBox.oExt.style.left = pos[0] + "px"; //this.oExt.offsetLeft + "px";
                    this.errBox.oExt.style.top  = pos[1] + "px"; //this.oExt.offsetTop + "px";
                }
                this.errBox.host = this;
            }
            this.errBox.show();
            this.focus(); //discutabel
            
            //Drawing Bug fix (ughhh) hack!
            /*if(jpf.isGecko){
                if(this.errBox.pHtmlNode.style.height == "100%")
                    this.errBox.pHtmlNode.style.height = "";
                else
                    this.errBox.pHtmlNode.style.height = "100%";
            }*/
        }
    }
    
    /**
     *	@private
     */
    this.clearError = function(value){
        if (this.__setStyleClass)
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Error"]);
        
        if (this.errBox && this.errBox.host == this) {
            this.errBox.hide();
            
            //Drawing Bug fix (ughhh) hack!
            /*if(jpf.isGecko){
                if(this.errBox.pHtmlNode.style.height == "100%")
                    this.errBox.pHtmlNode.style.height = "";
                else
                    this.errBox.pHtmlNode.style.height = "100%";
            }*/
        }
    }
    
    this.__addJmlDestroyer(function(){
        if (this.validgroup)
            this.validgroup.remove(this);
    });
    
    this.vRules = [];
    this.addValidationRule = function(rule){
        this.vRules.push(rule);
    }
    
    /**
     *
     * @attribute  {Boolean}  required  true  a valid value for this component is required.
     *                                   false  default  a valid value or an empty value is accepted.
     * @attribute  {RegExp}  validation   Regular expression which is tested against the value of this component to determine the validity of it.
     *                          string   String containing one of the predefined validation methods (for example; DATE, EMAIL, CREDITCARD, URL).
     *                          string   String containing javascript code which validates to true or false when executed.
     * @attribute  {Integer}  min-value  the minimal value for which the value of this component is valid.
     * @attribute  {Integer}  max-value  the maximum value for which the value of this component is valid.
     * @attribute  {Integer}  min-length  the minimal length allowed for the value of this component.
     * @attribute  {Integer}  max-length  the maximum length allowed for the value of this component.
     * @attribute  {Boolean}  notnull  same as {@link #required} but this rule is checked realtime when the component looses the focus, instead of at specific request (for instance when leaving a form page).
     * @attribute  {String}  check-equal   String specifying the id of the component to check if it has the same value as this component. 
     * @attribute  {String}  invalidmsg   String specifying the message displayed when this component has an invalid value. Use a ; character to seperate the title from the message.
     * @attribute  {String}  validgroup   String specifying the identifier for a group of items to be validated at the same time. This identifier can be new. It is inherited from a JML node upwards.
     */
    this.__addJmlLoader(function(x){
        //this.addEventListener(this.hasFeature(__MULTISELECT__) ? "onafterselect" : "onafterchange", onafterchange);
        this.addEventListener("onbeforechange", function(){
            if (jpf.xmldb.getBoundValue(this) === this.getValue())
                return false;
        });

        // Submitform
        if (!this.form) {
            //Set Form
            var y = this.jml;
            do {
                y = y.parentNode;
            }
            while (y && y.tagName && !y.tagName.match(/submitform|xforms$/)
              && y.parentNode && y.parentNode.nodeType != 9);
            
            if (y && y.tagName && y.tagName.match(/submitform|xforms$/)) {
                // #ifdef __DEBUG
                if (!y.tagName.match(/submitform|xforms$/))
                    throw new Error(jpf.formatErrorString(1070, this, this.tagName, "Could not find Form element whilst trying to bind to it's Data."));
                if (!y.getAttribute("id"))
                    throw new Error(jpf.formatErrorString(1071, this, this.tagName, "Found Form element but the id attribute is empty or missing."));
                // #endif
                
                this.form = eval(y.getAttribute("id"));
                this.form.addInput(this);
            }
        }
        
        // validgroup
        if (!this.form) {
            var vgroup = x.getAttribute("validgroup") || jpf.xmldb.getInheritedAttribute(x, "validgroup");
            if (vgroup) {
                this.validgroup = self[vgroup] || jpf.setReference(vgroup,
                    new jpf.ValidationGroup());
                this.validgroup.add(this);
            }
        }

        if (this.validgroup)
            this.__initValidation();
    });	
    
    this.__initValidation = function(){
        var x = this.jml;
        
        this.addEventListener("onblur", function(){ this.validate(); });
        
        if (x.getAttribute("required") == "true") {
            //if(this.form) this.form.addRequired(this);
            this.required = true;
        }
        
        //#ifdef __WITH_XSD
        if (x.getAttribute("datatype")) {
            if(this.multiselect)
                this.addValidationRule("!this.getValue() || this.XMLRoot && jpf.XSDParser.checkType('"
                    + x.getAttribute("datatype") + "', this.getTraverseNodes())");
            else
                this.addValidationRule("!this.getValue() || this.XMLRoot && jpf.XSDParser.checkType('"
                    + x.getAttribute("datatype") + "', this.XMLRoot) || !this.XMLRoot && jpf.XSDParser.matchType('"
                    + x.getAttribute("datatype") + "', this.getValue())");
        }
        //#endif

        if (x.getAttribute("validation")) {
            var validation = x.getAttribute("validation");
            if (validation.match(/^\/.*\/(?:[gim]+)?$/))
                this.reValidation = eval(validation);
            
            var vRule = this.reValidation
                ? "this.getValue().match(this.reValidation)" //RegExp
                : "(" + validation + ")"; //JavaScript
                
            this.addValidationRule("!this.getValue() || " + vRule);
        }

        if (x.getAttribute("min-value"))
            this.addValidationRule("!this.getValue() || parseInt(this.getValue()) >= "
                + x.getAttribute("min-value"));
        if (x.getAttribute("max-value"))
            this.addValidationRule("!this.getValue() || parseInt(this.getValue()) <= "
                + x.getAttribute("max-value"));
        if (x.getAttribute("max-length"))
            this.addValidationRule("!this.getValue() || this.getValue().toString().length <= "
                + x.getAttribute("max-length"));
        if (x.getAttribute("min-length"))
            this.addValidationRule("!this.getValue() || this.getValue().toString().length >= "
                + x.getAttribute("min-length"));
        if (x.getAttribute("notnull") == "true")
            this.addValidationRule("this.getValue() && this.getValue().toString().length > 0");
        //if(x.getAttribute("required") == "true")
            //this.addValidationRule("new String(this.getValue()).length != 0");
        if  (x.getAttribute("check-equal"))
            this.addValidationRule("!" + x.getAttribute("check-equal") + ".isValid() || " 
                + x.getAttribute("check-equal") + ".getValue() == this.getValue()");
            
        this.invalidmsg = x.getAttribute("invalidmsg");
        if (this.invalidmsg) {
            if (this.validgroup)
                this.errBox = this.validgroup.getErrorBox(this);
            else {
                var o       = new jpf.errorbox();
                o.pHtmlNode = this.oExt.parentNode;
                o.loadJML(x);
                this.errBox = o;
            }
            //if(this.form) this.form.registerErrorBox(this.name, o); //stupid name requirement
        }
    }
}

/**
 * Object allowing for a set of JML components to be validated.
 *
 * @classDescription		This class creates a new validation group
 * @return {ValidationGroup} Returns a new validation group
 * @type {ValidationGroup}
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.ValidationGroup = function(){
    jpf.makeClass(this);
    
    this.validateVisibleOnly = false;
    this.allowMultipleErrors = false;
    
    this.childNodes = [];
    this.add        = function(o){ this.childNodes.push(o); };
    this.remove     = function(o){ this.childNodes.remove(o); };
    
    /**
     * @copy   JmlNode#toString
     */
    this.toString = function(){
        return "[Javeline Validation Group]";
    }
    
    var errbox;
    /**
     * Gets the {@link Errorbox} component used for a specified component.
     *
     * @param  {JmlNode}  oComponent  required  JmlNode specifying the component for which the Errorbox should be found. If none is found, an Errobox is created. Use the {@link #allowMultipleErrors} property to influence when Errorboxes are created.
     * @return  {Errorbox}  the found or created Errorbox;
     */
    this.getErrorBox = function(o){
        if (this.allowMultipleErrors || !errbox) {
            errbox           = new jpf.errorbox();
            errbox.pHtmlNode = o.oExt.parentNode;
            var cNode        = o.jml.ownerDocument.createElement("Errorbox");
            errbox.loadJML(cNode);
        }
        return errbox;
    }
    
    /**
     * Hide all Errorboxes for the components using this component as it's validation group.
     *
     */
    this.hideAllErrors = function(){
        for (var i = 0; i < this.childNodes.length; i++) {
            if (this.childNodes[i].errBox)
                this.childNodes[i].errBox.hide();
        }
    }
    
    function checkValidChildren(oParent, ignoreReq, nosetError){
        var found;
        
        //Per Element
        for (var i = 0; i < oParent.childNodes.length; i++) {
            var oEl = oParent.childNodes[i];

            if (!oEl)
                continue;
            if (!oEl.disabled
              && (!this.validateVisibleOnly && oEl.visible || !oEl.oExt || oEl.oExt.offsetHeight)
              && (oEl.hasFeature(__VALIDATION__) && oEl.isValid && !oEl.isValid()
                || !ignoreReq && oEl.required && new String(oEl.getValue()).length == 0)) {
                if (!nosetError) {
                    if (!found) {
                        oEl.validate(true);
                        found = true;
                        if (!this.allowMultipleErrors)
                            return true; //Added (again)
                    }
                    else if (oEl.errBox && oEl.errBox.host == oEl)
                        oEl.errBox.hide();
                }
                else if (!this.allowMultipleErrors)
                    return true;
            }
            if (oEl.childNodes.length) {
                found = checkValidChildren.call(this, oEl, ignoreReq, nosetError) || found;
                if (found && !this.allowMultipleErrors)
                    return true; //Added (again)
            }
        }
        
        return found;
    }
    
    /**
     * Checks if (part of) the set of component's registered to this component are
     * valid. When a component is found with an invalid value the error state can
     * be set for that component. 
     *
     * @param  {Boolean}  ignoreReq  optional  true  do not include required check.
     *                                        false  default  include required check.
     * @param  {Boolean}  nosetError  optional  true  do not set the error state of the component with an invalid value
     *                                        false  default  set the error state of the component with an invalid value
     * @param  {TabPage}  page  optional  the page of which the component's will be checked instead of checking them all.
     * @return  {Boolean}  specifying wether all components have valid values
     */
    this.isValid = function(ignoreReq, nosetError, page){
        var found = checkValidChildren.call(this, page || this, ignoreReq,
            nosetError);
        
        if (page) {
            //#ifdef __DEBUG
            try {
            //#endif
                if (page.validation && !eval(page.validation)) {
                    alert(page.invalidmsg);
                    found = true;
                }
            //#ifdef __DEBUG
            } catch(e) {
                throw new Error(jpf.formatErrorString(0, this, 
                    "Validating Page", 
                    "Error in javascript validation string of page: '" 
                    + page.validation + "'", page.jml));
            }
            //#endif
        }
        
        //Global Rules
        //
        if (!found)
            found = this.dispatchEvent("onvalidation");
        
        return !found;
    }
}


// #endif
