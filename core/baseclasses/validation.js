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

apf.__VALIDATION__ = 1 << 6;

// #ifdef __WITH_VALIDATION

//if checkequal then notnull = true
apf.validator = {
    macro : {
        //#ifdef __PARSER_XSD
        "datatype"  : "apf.xsd.matchType(value, '",
        "datatype_" : "')",
        //#endif

        //var temp
        "pattern"     : "value.match(",
        "pattern_"    : ")",
        "custom"      : "(",
        "custom_"     : ")",
        "min"         : "parseInt(value) >= ",
        "max"         : "parseInt(value) <= ",
        "maxlength"   : "value.toString().length <= ",
        "minlength"   : "value.toString().length >= ",
        "notnull"     : "value.toString().length > 0",
        "checkequal"  : "!(temp = ",
        "checkequal_" : ").isValid() || temp.getValue() == value"
    },
    
    compile : function(options){
        var m = this.macro, s = ["var temp, valid = true; \
            if (!validityState) \
                validityState = new apf.validator.validityState(); "];

        if (options.required) {
            s.push("if (checkRequired && (!value || value.toString().trim().length == 0)) {\
                validityState.$reset();\
                validityState.valueMissing = true;\
                valid = false;\
            }")
        }
        
        s.push("validityState.$reset();\
            if (value) {");
        
        for (prop in options) {
            if (!m[prop]) continue;
            s.push("if (!(", m[prop], options[prop], m[prop + "_"] || "", ")){\
                validityState.$set('", prop, "');\
                valid = false;\
            }");
        }

        s.push("};validityState.valid = valid; return validityState;");
        return new Function('value', 'checkRequired', 'validityState', s.join(""));
    }
}

/**
 * Object containing information about the validation state. It contains
 * properties that specify whether a certain validation was passed.
 * Remarks:
 * This is part of {@link http://www.whatwg.org/specs/web-apps/current-work/multipage/forms.html#validitystatethe HTML 5 specification}.
 */
apf.validator.validityState = function(){
    this.valueMissing    = false,
    this.typeMismatch    = false,
    this.patternMismatch = false,
    this.tooLong         = false,
    this.rangeUnderflow  = false,
    this.rangeOverflow   = false,
    this.stepMismatch    = false,
    this.customError     = false,
    this.valid           = true,

    this.$reset = function(){
        for (var prop in this) {
            if (prop.substr(0,1) == "$") 
                continue;
            this[prop] = false;
        }
        this.valid = true;
    },

    this.$set = function(type) {
        switch (type) {
            case "min"         : this.rangeUnderflow  = true; break;
            case "max"         : this.rangeOverflow   = true; break;
            case "minlength"   : this.tooShort        = true; break;
            case "maxlength"   : this.tooLong         = true; break;
            case "pattern"     : this.patternMismatch = true; break;
            case "datatype"    : this.typeMismatch    = true; break;
            case "notnull"     : this.typeMismatch    = true; break;
            case "checkequal"  : this.typeMismatch    = true; break;
        }
    }
};

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have validation support.
 * Example:
 * <code>
 *  <a:bar validgroup="vgExample">
 *      <a:label>Number</a:label>
 *      <a:textbox required="true" min="3" max="10" 
 *        invalidmsg="Invalid Entry;Please enter a number between 3 and 10" />
 *      <a:label>Name</a:label>
 *      <a:textbox required="true" minlength="3" 
 *        invalidmsg="Invalid Entry;Please enter your name" />
 *      <a:label>Message</a:label>
 *      <a:textarea required="true" 
 *        invalidmsg="Invalid Message;Please enter a message!" />
 *
 *      <a:button onclick="if(vgExample.isValid()) alert('valid!')">
 *          Validate
 *      </a:button>
 *  </a:bar>
 * </code>
 *
 * @event invalid    Fires when this component goes into an invalid state.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.5
 */
apf.Validation = function(){
    this.$regbase = this.$regbase | apf.__VALIDATION__;

    /**
     * Checks if this element's value is valid.
     *
     * @param  {Boolean} [checkRequired] whether this check also adheres to the 'required' ruled.
     * @return  {Boolean} specifying whether the value is valid
     * @see  baseclass.validationgroup
     * @see  element.submitform
     */
    this.isValid = function(checkRequired){
        if (!this.$vOptions)
            return true;
        
        (this.$vOptions.isValid || (this.$vOptions.isValid
          = apf.validator.compile(this.$vOptions))).call(this,
            typeof this.getValue == "function" ? this.getValue(null, true) : null, 
            checkRequired, this.validityState || 
            (this.validityState = new apf.validator.validityState()));
        
        var valid = this.validityState.valid;
        
        /* #ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-" + (valid ? "valid" : "invalid"));
        #endif*/
        
        this.dispatchEvent(!valid ? "invalid" : "valid", this.validityState);
            
        return valid;
    };

    /**
     * @private
     */
    this.setCustomValidity = function(message){
        //do stuff
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
    };

    /**
     * Puts this element in the error state, optionally showing the
     * error box if this element's is invalid.
     *
     * @param  {Boolean} [ignoreReq]  whether this element required check is turned on.
     * @param  {Boolean} [nosetError] whether the error box is displayed if this component does not validate.
     * @param  {Boolean} [force]      whether this element in the error state and don't check if the element's value is invalid.
     * @return  {Boolean}  boolean specifying whether the value is valid
     * @see  object.validationgroup
     * @see  element.submitform
     * @method
     */
    // #ifdef __WITH_HTML5
    this.checkValidity =
    //#endif
    
    /**
     * Puts this element in the error state, optionally showing the
     * error box if this element is invalid.
     *
     * @param  {Boolean} [ignoreReq]  whether this element required check is turned on.
     * @param  {Boolean} [nosetError] whether the error box is displayed if this component does not validate.
     * @param  {Boolean} [force]      whether this element in the error state and don't check if the element's value is invalid.
     * @return  {Boolean}  boolean specifying whether the value is valid
     * @see  object.validationgroup
     * @see  element.submitform
     * @method
     */
    this.validate = function(ignoreReq, nosetError, force){
        //if (!this.$validgroup) return this.isValid();

        if (force || !this.isValid(!ignoreReq) && !nosetError) {
            this.setError();
            return false;
        }
        else {
            this.clearError();
            return true;
        }
    };

    /**
     *    @private
     */
    this.setError = function(value){
        if (!this.$validgroup)
            this.$propHandlers["validgroup"].call(this, "vg" + this.parentNode.$uniqueId);

        var errBox = this.$validgroup.getErrorBox(this);

        if (!this.$validgroup.allowMultipleErrors)
            this.$validgroup.hideAllErrors();

        errBox.setMessage(this.invalidmsg || value);
        
        apf.setStyleClass(this.$ext, this.$baseCSSname + "Error");
        this.showMe(); //@todo scroll refHtml into view

        if (this.invalidmsg || value)
            errBox.display(this);
        
        //#ifdef __WITH_HTML5
        if (this.hasFeature(apf.__MULTISELECT__) && this.validityState.$errorXml)
            this.select(this.validityState.$errorXml);
        //#endif
        
        if (apf.document.activeElement && apf.document.activeElement != this)
            this.focus(null, {mouse:true}); //arguable...
    };

    /**
     *    @private
     */
    this.clearError = function(value){
        if (this.$setStyleClass)
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Error"]);

        if (this.$validgroup) {
            var errBox = this.$validgroup.getErrorBox(null, true);
            if (!errBox || errBox.host != this)
                return;

            errBox.hide();
        }
    };

    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        if (this.$validgroup)
            this.$validgroup.unregister(this);
    });

    /**
     *
     * @attribute  {Boolean}  required     whether a valid value for this element is required.
     * @attribute  {RegExp}   pattern      the pattern tested against the value of this element to determine it's validity.
     * @attribute  {String}   datatype     the datatype that the value of this element should adhere to. This can be any 
     * of a set of predefined types, or a simple type created by an XML Schema definition.
     *   Possible values:
     *   {String} xsd:dateTime
     *   {String} xsd:time
     *   {String} xsd:date
     *   {String} xsd:gYearMonth
     *   {String} xsd:gYear
     *   {String} xsd:gMonthDay
     *   {String} xsd:gDay
     *   {String} xsd:gMonth
     *   {String} xsd:string
     *   {String} xsd:boolean
     *   {String} xsd:base64Binary
     *   {String} xsd:hexBinary
     *   {String} xsd:float
     *   {String} xsd:decimal
     *   {String} xsd:double
     *   {String} xsd:anyURI
     *   {String} xsd:integer
     *   {String} xsd:nonPositiveInteger
     *   {String} xsd:negativeInteger
     *   {String} xsd:long
     *   {String} xsd:int
     *   {String} xsd:short
     *   {String} xsd:byte
     *   {String} xsd:nonNegativeInteger
     *   {String} xsd:unsignedLong
     *   {String} xsd:unsignedInt
     *   {String} xsd:unsignedShort
     *   {String} xsd:unsignedByte
     *   {String} xsd:positiveInteger
     *   {String} apf:url
     *   {String} apf:website
     *   {String} apf:email
     *   {String} apf:creditcard
     *   {String} apf:expdate
     *   {String} apf:wechars
     *   {String} apf:phonenumber
     *   {String} apf:faxnumber
     *   {String} apf:mobile
     * @attribute  {Integer}  min          the minimal value for which the value of this element is valid.
     * @attribute  {Integer}  max          the maximum value for which the value of this element is valid.
     * @attribute  {Integer}  minlength    the minimal length allowed for the value of this element.
     * @attribute  {Integer}  maxlength    the maximum length allowed for the value of this element.
     * @attribute  {Boolean}  notnull      whether the value is filled. Same as {@link baseclass.validation.attribute.required} but this rule is checked realtime when the element looses the focus, instead of at specific request (for instance when leaving a form page).
     * @attribute  {String}   checkequal   the id of the element to check if it has the same value as this element.
     * @attribute  {String}   invalidmsg   the message displayed when this element has an invalid value. Use a ; character to seperate the title from the message.
     * @attribute  {String}   validgroup   the identifier for a group of items to be validated at the same time. This identifier can be new. It is inherited from a AML node upwards.
     * @attribute  {String}   validtest    the instruction on how to test for success. This attribute is generally used to check the value on the server.
     * Example:
     * This example shows how to check the username on the server. In this case
     * comm.loginCheck is an async rpc function that checks the availability of the
     * username. If it exists it will return 0, otherwise 1. The value variable
     * contains the current value of the element (in this case the textbox). It
     * can be used as a convenience variable.
     * <pre class="code">
     *  <a:label>Username</a:label>
     *  <a:textbox
     *    validtest  = "{comm.loginCheck(value) == 1}"
     *    pattern    = "/^[a-zA-Z0-9_\-. ]{3,20}$/"
     *    invalidmsg = "Invalid username;Please enter a valid username." />
     * </pre>
     */
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //this.addEventListener(this.hasFeature(apf.__MULTISELECT__) ? "onafterselect" : "onafterchange", onafterchange);
        /* Temp disabled, because I don't understand it (RLD)
        this.addEventListener("beforechange", function(){
            if (this.xmlRoot && apf.getBoundValue(this) === this.getValue())
                return false;
        });*/
        
        // validgroup
        if (!this.validgroup)
            this.$setInheritedAttribute("validgroup");
    });
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        pattern   : 1,
        validtest : 3
    }, this.$attrExcludePropBind);

    this.$booleanProperties["required"] = true;
    this.$supportedProperties.push("validgroup", "required", "datatype",
        "pattern", "min", "max", "maxlength", "minlength", "validtest",
        "notnull", "checkequal", "invalidmsg", "requiredmsg");

    this.$fValidate = function(){
        if (this.liveedit)
            return;
        
        if (!this.$validgroup)
            this.validate(true);
        else {
             var errBox = this.$validgroup.getErrorBox(this);
             if (!errBox.visible || errBox.host != this)
                this.validate(true);
        }
    };
    this.addEventListener("blur", this.$fValidate);
    
    this.$propHandlers["validgroup"] = function(value){
        if (value) {
            var vgroup;
            if (typeof value != "string") {
                this.$validgroup = value.name;
                vgroup = value;
            }
            else {
                //#ifdef __WITH_NAMESERVER
                vgroup = apf.nameserver.get("validgroup", value);
                //#endif
            }

            this.$validgroup = vgroup || new apf.ValidationGroup(value);
            this.$validgroup.register(this);
            /*
                @todo What about children, when created after start
                See button login action
            */
        }
        else {
            this.$validgroup.unregister(this);
            this.$validgroup = null;
        }
    };
    
    this.$propHandlers["pattern"]    = function(value, prop){
        if (value.substr(0, 1) != "/")
            value = "/" + value + "/";

        (this.$vOptions || (this.$vOptions = {}))[prop] = value;
        delete this.$vOptions.isValid;
    };
    
    //#ifdef __PARSER_XSD
    this.$propHandlers["datatype"]   =
    //#endif
    this.$propHandlers["required"]   = 
    this.$propHandlers["custom"]     = 
    this.$propHandlers["min"]        = 
    this.$propHandlers["max"]        = 
    this.$propHandlers["maxlength"]  = 
    this.$propHandlers["minlength"]  = 
    this.$propHandlers["notnull"]    = 
    this.$propHandlers["checkequal"] = function(value, prop){
        (this.$vOptions || (this.$vOptions = {}))[prop] = value;
        delete this.$vOptions.isValid;
    };
    
    //@todo rewrite this for apf3.0 - it should just execute a live markup
    this.$propHandlers["validtest"] = function(value){
        var _self = this, rvCache = {};
        /**
         * Removes the validation cache created by the validtest rule.
         */
        this.removeValidationCache = function(){
            rvCache = {};
        }
        
        this.$checkRemoteValidation = function(){
            var value = this.getValue();
            if(typeof rvCache[value] == "boolean") return rvCache[value];
            if(rvCache[value] == -1) return true;
            rvCache[value] = -1;

            apf.getData(this.validtest.toString(), {
               xmlNode : this.xmlRoot,
               value   : this.getValue(),
               callback : function(data, state, extra){
                  if (state != apf.SUCCESS) {
                      if (state == apf.TIMEOUT && extra.retries < apf.maxHttpRetries)
                          return extra.tpModule.retry(extra.id);
                      else {
                          var commError = new Error(apf.formatErrorString(0, _self, 
                            "Validating entry at remote source", 
                            "Communication error: \n\n" + extra.message));

                          if (_self.dispatchEvent("error", apf.extend({
                            error : commError, 
                            state : status
                          }, extra)) !== false)
                              throw commError;
                          return;
                      }
                  }

                  rvCache[value] = apf.isTrue(data);//instr[1] ? data == instr[1] : apf.isTrue(data);
                  
                  if(!rvCache[value]){
                    if (!_self.hasFocus())
                        _self.setError();
                  }
                  else _self.clearError();
              }
            });
            
            return true;
        };
        
        (this.$vOptions || (this.$vOptions = {})).custom = "apf.lookup(" + this.$uniqueId + ").$checkRemoteValidation()";
        delete this.$vOptions.isValid;
    };
};

//#ifdef __PARSER_XSD
apf.GuiElement.propHandlers["datatype"]   =
//#endif
apf.GuiElement.propHandlers["required"]   = 
apf.GuiElement.propHandlers["pattern"]    = 
apf.GuiElement.propHandlers["min"]        = 
apf.GuiElement.propHandlers["max"]        = 
apf.GuiElement.propHandlers["maxlength"]  = 
apf.GuiElement.propHandlers["minlength"]  = 
apf.GuiElement.propHandlers["notnull"]    = 
apf.GuiElement.propHandlers["checkequal"] = 
apf.GuiElement.propHandlers["validtest"]  = function(value, prop){
    this.implement(apf.Validation);
    this.$propHandlers[prop].call(this, value, prop);
}

/**
 * Object allowing for a set of AML elements to be validated, an element that 
 * is not valid shows the errorbox.
 * Example:
 * <code>
 *  <a:bar validgroup="vgForm">
 *      <a:label>Phone number</a:label>
 *      <a:textbox id="txtPhone"
 *        required   = "true"
 *        pattern    = "(\d{3}) \d{4} \d{4}"
 *        invalidmsg = "Incorrect phone number entered" />
 *
 *      <a:label>Password</a:label>
 *      <a:textbox
 *        required   = "true"
 *        mask       = "password"
 *        minlength  = "4"
 *        invalidmsg = "Please enter a password of at least four characters" />
 *  </a:bar>
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
 * @event validation Fires when the validation group isn't validated.
 *
 * @inherits apf.Class
 * @constructor
 * @default_private
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 */
apf.ValidationGroup = function(name){
    this.$init();
    
    this.childNodes = [];
    
    if (name)
        apf.setReference(name, this);
    
    this.name = name || "validgroup" + this.$uniqueId;
    //#ifdef __WITH_NAMESERVER
    apf.nameserver.register("validgroup", this.name, this);
    //#endif
};

(function(){
    /**
     * When set to true, only visible elements are validated. Default is false.
     * @type Boolean
     */
    this.validateVisibleOnly = false;
    
    /**
     * When set to true, validation doesn't stop at the first invalid element. Default is false.
     * @type Boolean
     */
    this.allowMultipleErrors = false;

    /**
     * Adds a aml element to this validation group.
     */
    this.register   = function(o){ 
        if (o.hasFeature(apf.__VALIDATION__)) 
            this.childNodes.push(o);
    };
    
    /**
     * Removes a aml element from this validation group.
     */
    this.unregister = function(o){
        this.childNodes.remove(o); 
    };

    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[APF Validation Group]";
    };

    //Shared among all validationgroups
    var errbox;
    /**
     * Retrieves {@link element.errorbox} used for a specified element.
     *
     * @param  {AmlNode}  o  required  AmlNode specifying the element for which the Errorbox should be found. If none is found, an Errorbox is created. Use the {@link object.validationgroup.property.allowMultipleErrors} to influence when Errorboxes are created.
     * @param  {Boolean}  no_create    Boolean that specifies whether new Errorbox may be created when it doesn't exist already
     * @return  {Errorbox}  the found or created Errorbox;
     */
    this.getErrorBox = function(o, no_create){
        if (this.allowMultipleErrors || !errbox && !no_create) {
            errbox            = new apf.errorbox();
            errbox.$pHtmlNode = o.$ext.parentNode;
            errbox.skinset    = apf.getInheritedAttribute(o.parentNode, "skinset"); //@todo use skinset here. Has to be set in presentation
            errbox.dispatchEvent("DOMNodeInsertedIntoDocument");
        }
        return errbox;
    };

    /**
     * Hide all Errorboxes for the elements using this element as their validation group.
     *
     */
    this.hideAllErrors = function(){
        if (errbox && errbox.host)
            errbox.host.clearError();
    };

    function checkValidChildren(oParent, ignoreReq, nosetError){
        var found;
        //Per Element
        for (var v, i = 0; i < oParent.childNodes.length; i++) {
            var oEl = oParent.childNodes[i];

            if (!oEl)
                continue;
            if (!oEl.disabled
              && (!this.validateVisibleOnly && oEl.visible || !oEl.$ext || oEl.$ext.offsetHeight)
              && (oEl.hasFeature(apf.__VALIDATION__) && oEl.isValid && !oEl.isValid(!ignoreReq))) {
                //|| !ignoreReq && oEl.required && (!(v = oEl.getValue()) || new String(v).trim().length == 0)
                
                if (!nosetError) {
                    if (!found) {
                        oEl.validate(true, null, true);
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
            if (oEl.canHaveChildren && oEl.childNodes.length) {
                found = checkValidChildren.call(this, oEl, ignoreReq, nosetError) || found;
                if (found && !this.allowMultipleErrors)
                    return true; //Added (again)
            }
        }
        return found;
    }

    /**
     * Checks if (part of) the set of element's registered to this element are
     * valid. When an element is found with an invalid value the error state can
     * be set for that element.
     *
     * @param  {Boolean}    [ignoreReq]  whether to adhere to the 'required' check.
     * @param  {Boolean}    [nosetError  whether to not set the error state of the element with an invalid value
     * @param  {AMLElement} [page]           the page for which the children will be checked. When not specified all elements of this validation group will be checked.
     * @return  {Boolean}  specifying whether the checked elements are valid.
     * @method isValid, validate, checkValidity
     */
    // #ifdef __WITH_HTML5
    this.checkValidity =
    //#endif
    
    /**
     * Checks if (part of) the set of element's registered to this element are
     * valid. When an element is found with an invalid value the error state can
     * be set for that element.
     *
     * @param  {Boolean}    [ignoreReq]  whether to adhere to the 'required' check.
     * @param  {Boolean}    [nosetError  whether to not set the error state of the element with an invalid value
     * @param  {AMLElement} [page]           the page for which the children will be checked. When not specified all elements of this validation group will be checked.
     * @return  {Boolean}  specifying whether the checked elements are valid.
     * @method isValid, validate, checkValidity
     */
    this.validate =
    
    /**
     * Checks if (part of) the set of element's registered to this element are
     * valid. When an element is found with an invalid value the error state can
     * be set for that element.
     *
     * @param  {Boolean}    [ignoreReq]  whether to adhere to the 'required' check.
     * @param  {Boolean}    [nosetError  whether to not set the error state of the element with an invalid value
     * @param  {AMLElement} [page]           the page for which the children will be checked. When not specified all elements of this validation group will be checked.
     * @return  {Boolean}  specifying whether the checked elements are valid.
     * @method isValid, validate, checkValidity
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
            }
            catch(e) {
                throw new Error(apf.formatErrorString(0, this,
                    "Validating Page",
                    "Error in javascript validation string of page: '"
                    + page.validation + "'", page.$aml));
            }
            //#endif
        }

        //Global Rules
        //
        //if (!found)
            //found = this.dispatchEvent("validation");

        return !found;
    };
}).call(apf.ValidationGroup.prototype = new apf.Class());

apf.config.$inheritProperties["validgroup"] = 1;

// #endif
