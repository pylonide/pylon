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

var __VALIDATION__ = 1 << 6;

// #ifdef __WITH_VALIDATION

/**
 * Baseclass adding validation to this element.
 * Example:
 * <j:bar validgroup="vgExample">
 *      <j:label>Number</j:label>
 *      <j:textbox required="true" min="3" max="10" invalidmsg="Invalid Entry;Please enter a number between 3 and 10" />
 *      <j:label>Name</j:label>
 *      <j:textbox required="true" invalidmsg="Invalid Entry;Please enter your name" minlength="3" />
 *      <j:label>Message</j:label>
 *      <j:textarea required="true" invalidmsg="Invalid Message;Please enter a message!" />
 *          <j:button onclick="if(vgExample.isValid()) alert('valid!')">Validate</j:button>
 *  </j:bar>
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.Validation = function(){
    this.isActive = true;
    this.$regbase = this.$regbase | __VALIDATION__;

    /**
     * Checks if this element's value is valid.
     *
     * @param  {Boolean} [checkRequired] whether this check also adheres to the 'required' ruled.
     * @return  {Boolean} specifying whether the value is valid
     * @see  ValidationGroup
     * @see  Submitform
     */
    this.isValid = function(checkRequired){
        var value = this.getValue();

        if (checkRequired && this.required) {
            if (!value || value.toString().trim().length == 0) {
                //#ifdef __WITH_HTML5
                this.validityState.$reset();
                this.validityState.valueMissing = true;
                this.dispatchEvent("invalid", this.validityState);
                //#endif

                return false;
            }
        }

        //#ifdef __WITH_HTML5
        this.validityState.$reset();
        var isValid = true;
        if (value) {
            for (var type in vIds) {
                if (!eval(vRules[vIds[type]])) {
                    this.validityState.$set(type);
                    isValid = false;
                }
            }
        }
        /*#else
        var isValid = (vRules.length
            ? eval("!value || (" + vRules.join(") && (") + ")")
            : true);
        //#endif

        /* #ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-" + (isValid ? "valid" : "invalid"));
        #endif*/
        
        //#ifdef __WITH_HTML5
        if (!isValid)
            this.dispatchEvent("invalid", this.validityState);
        else {
            this.validityState.valid = true;
            isValid = true;
        }
        //#endif

        return isValid;
    };

    //#ifdef __WITH_HTML5
    this.validityState = {
        valueMissing    : false,
        typeMismatch    : false,
        patternMismatch : false,
        tooLong         : false,
        rangeUnderflow  : false,
        rangeOverflow   : false,
        stepMismatch    : false,
        customError     : false,
        valid           : false,

        "$reset" : function(){
            for (var prop in this) {
                if (prop.substr(0,1) == "$") return;
                this[prop] = false;
            }
        },

        "$set" : function(type) {
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
    }

    this.setCustomValidity = function(message){
        //do stuff
    }
    //#endif

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
     * @see  ValidationGroup
     * @see  Submitform
     * @method
     */
    // #ifdef __WITH_HTML5
    this.checkValidity =
    //#endif
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
            this.$propHandlers["validgroup"].call(this, "vg" + this.parentNode.uniqueId);

        var errBox = this.$validgroup.getErrorBox(this);

        if (!this.$validgroup.allowMultipleErrors)
            this.$validgroup.hideAllErrors();

        errBox.setMessage(this.invalidmsg);
        
        jpf.setStyleClass(this.oExt, this.baseCSSname + "Error");
        this.showMe(); //@todo scroll refHtml into view

        if (this.$validgroup) {
            var refHtml = this.validityState.errorHtml || this.oExt;
            /*var refParent = document != refHtml.ownerDocument
                ? refHtml.ownerDocument.parentWindow.frameElement.parentNode
                : jpf.getPositionedParent(this.oExt);
            
            if (document != refHtml.ownerDocument)
                refParent.appendChild(errBox.oExt);
            else 
                this.oExt.parentNode.insertBefore(errBox.oExt, this.oExt.nextSibling);
                
            if (jpf.getStyle(errBox.oExt, "position") == "absolute") {
                var pos = jpf.getAbsolutePosition(refHtml, refParent);
                errBox.oExt.style.left = pos[0] + "px"; //this.oExt.offsetLeft + "px";
                errBox.oExt.style.top  = pos[1] + "px"; //this.oExt.offsetTop + "px";
            }*/
            
            document.body.appendChild(errBox.oExt);
            var pos = jpf.getAbsolutePosition(refHtml, document.body);
            
            if (document != refHtml.ownerDocument) {
                var pos2 = jpf.getAbsolutePosition(refHtml.ownerDocument.parentWindow.frameElement, document.body);
                pos[0] += pos2[0];
                pos[1] += pos2[1];
            }
            
            errBox.oExt.style.left = pos[0] + "px"; //this.oExt.offsetLeft + "px";
            errBox.oExt.style.top  = pos[1] + "px"; //this.oExt.offsetTop + "px";
            errBox.host = this;
        }
        errBox.show();
        
        if (this.hasFeature(__MULTISELECT__) && this.validityState.errorXml)
            this.select(this.validityState.errorXml);
        
        if (jpf.window.focussed && jpf.window.focussed != this)
            this.focus(null, {mouse:true}); //arguable...
    };

    /**
     *    @private
     */
    this.clearError = function(value){
        if (this.$setStyleClass)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Error"]);

        if (this.$validgroup) {
            var errBox = this.$validgroup.getErrorBox(null, true);
            if (!errBox || errBox.host != this)
                return;

            errBox.hide();
        }
    };

    this.$jmlDestroyers.push(function(){
        if (this.$validgroup)
            this.$validgroup.remove(this);
    });

    var vRules = ["true"];
    var vIds   = {};
    this.addValidationRule = function(rule){
        vRules.push(rule);
    };

    /**
     *
     * @attribute  {Boolean}  required     whether a valid value for this element is required.
     * @attribute  {RegExp}   pattern      the pattern tested against the value of this element to determine it's validity.
     * @attribute  {String}   datatype     the datatype that the value of this element should adhere to. This can be any
     *      of a set of predefined types, or a simple type created by an XML Schema definition.
     *   Possible values:
     *   xsd:dateTime
     *   xsd:time
     *   xsd:date
     *   xsd:gYearMonth
     *   xsd:gYear
     *   xsd:gMonthDay
     *   xsd:gDay
     *   xsd:gMonth
     *   xsd:string
     *   xsd:boolean
     *   xsd:base64Binary
     *   xsd:hexBinary
     *   xsd:float
     *   xsd:decimal
     *   xsd:double
     *   xsd:anyURI
     *   xsd:integer
     *   xsd:nonPositiveInteger
     *   xsd:negativeInteger
     *   xsd:long
     *   xsd:int
     *   xsd:short
     *   xsd:byte
     *   xsd:nonNegativeInteger
     *   xsd:unsignedLong
     *   xsd:unsignedInt
     *   xsd:unsignedShort
     *   xsd:unsignedByte
     *   xsd:positiveInteger
     *   jpf:url
     *   jpf:website
     *   jpf:email
     *   jpf:creditcard
     *   jpf:expdate
     *   jpf:wechars
     *   jpf:phonenumber
     *   jpf:faxnumber
     *   jpf:mobile
     * @attribute  {Integer}  min                 the minimal value for which the value of this element is valid.
     * @attribute  {Integer}  max                   the maximum value for which the value of this element is valid.
     * @attribute  {Integer}  minlength    the minimal length allowed for the value of this element.
     * @attribute  {Integer}  maxlength    the maximum length allowed for the value of this element.
     * @attribute  {Boolean}  notnull           same as {@link #required} but this rule is checked realtime when the element looses the focus, instead of at specific request (for instance when leaving a form page).
     * @attribute  {String}   checkequal   String specifying the id of the element to check if it has the same value as this element.
     * @attribute  {String}   invalidmsg   String specifying the message displayed when this element has an invalid value. Use a ; character to seperate the title from the message.
     * @attribute  {String}   validgroup   String specifying the identifier for a group of items to be validated at the same time. This identifier can be new. It is inherited from a JML node upwards.
     */
    this.$addJmlLoader(function(x){
        //this.addEventListener(this.hasFeature(__MULTISELECT__) ? "onafterselect" : "onafterchange", onafterchange);
        /* Temp disabled, because I don't understand it (RLD)
        this.addEventListener("beforechange", function(){
            if (this.xmlRoot && jpf.xmldb.getBoundValue(this) === this.getValue())
                return false;
        });*/

        // Submitform
        if (!this.form) {
            //Set Form
            var y = this.$jml;
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
        if (!this.form && !x.getAttribute("validgroup")) {
            var vgroup = jpf.xmldb.getInheritedAttribute(x, "validgroup");
            if (vgroup)
                this.$propHandlers["validgroup"].call(this, vgroup);
        }
    });

    this.$booleanProperties["required"] = true;
    this.$supportedProperties.push("validgroup", "required", "datatype",
        "pattern", "min", "max", "maxlength", "minlength", "valid-test",
        "notnull", "checkequal", "invalidmsg", "requiredmsg");

    this.$fValidate = function(){ this.validate(true); };
    this.$propHandlers["validgroup"] = function(value){
        this.removeEventListener("blur", this.$fValidate);
        if (value) {
            this.addEventListener("blur", this.$fValidate);

            var vgroup;
            if (typeof value != "string") {
                this.$validgroup = value.name;
                vgroup = value;
            }
            else {
                vgroup = jpf.nameserver.get("validgroup", value);
            }

            this.$validgroup = vgroup || new jpf.ValidationGroup(value);
            this.$validgroup.add(this);

            /*
                @todo What about children, when created after start
                See button login action
            */
        }
        else {
            this.$validgroup.remove(this);
            this.$validgroup = null;
        }
    };

    this.$setRule = function(type, rule){
        var vId = vIds[type];

        if (!rule) {
            if (vId)
                vRules[vId] = "";
            return;
        }

        if (!vId)
            vIds[type] = vRules.push(rule) - 1;
        else
            vRules[vId] = rule;
    }

    //#ifdef __WITH_XSD
    this.$propHandlers["datatype"] = function(value){
        if (!value)
            return this.$setRule("datatype");

        this.$setRule("datatype", this.multiselect
            ? "this.xmlRoot && jpf.XSDParser.checkType('"
                + value + "', this.getTraverseNodes())"
            : "jpf.XSDParser.matchType(value, '" + value + "')");
        //this.xmlRoot && jpf.XSDParser.checkType('" + value + "', this.xmlRoot) || !this.xmlRoot && 
    };
    //#endif

    this.$propHandlers["pattern"] = function(value){
        if (!value)
            return this.$setRule("pattern");

        if (value.match(/^\/.*\/(?:[gim]+)?$/))
            this.reValidation = eval(value);

        this.$setRule("pattern", this.reValidation
            ? "value.match(this.reValidation)" //RegExp
            : "(" + value + ")"); //JavaScript
    };

    this.$propHandlers["min"] = function(value){
        this.$setRule("min", value
            ? "parseInt(value) >= " + value
            : null);
    };

    this.$propHandlers["max"] = function(value){
        this.$setRule("max", value
            ? "parseInt(value) <= " + value
            : null);
    };

    this.$propHandlers["maxlength"] = function(value){
        this.$setRule("maxlength", value
            ? "value.toString().length <= " + value
            : null);
    };

    this.$propHandlers["minlength"] = function(value){
        this.$setRule("minlength", value
            ? "value.toString().length >= " + value
            : null);
    };

    this.$propHandlers["notnull"] = function(value){
        this.$setRule("notnull", value
            ? "value.toString().length > 0"
            : null);
    };

    this.$propHandlers["checkequal"] = function(value){
        if (!this.required)
            this.required = 2;
        else if (!value && this.required == 2)
            this.required = false;
        
        this.$setRule("checkequal", value
            ? "!" + value + ".isValid() || " + value + ".getValue() == value"
            : null);
    };
    
    this.$propHandlers["valid-test"] = function(value){
        var _self = this, rvCache = {};
        this.removeValidationCache = function(){
            rvCache = {};
        }
        
        this.$checkRemoteValidation = function(){
            var value = this.getValue();
            if(typeof rvCache[value] == "boolean") return rvCache[value];
            if(rvCache[value] == -1) return true;
            rvCache[value] = -1;
            
            var instr = this.$jml.getAttribute('valid-test').split("==");
            jpf.getData(instr[0], this.xmlRoot, {
               value : this.getValue() 
            }, function(data, state, extra){
                  if (state != jpf.SUCCESS) {
                      if (state == jpf.TIMEOUT && extra.retries < jpf.maxHttpRetries)
                          return extra.tpModule.retry(extra.id);
                      else {
                          var commError = new Error(jpf.formatErrorString(0, _self, 
                            "Validating entry at remote source", 
                            "Communication error: \n\n" + extra.message));

                          if (_self.dispatchEvent("error", jpf.extend({
                            error : commError, 
                            state : status
                          }, extra)) !== false)
                              throw commError;
                          return;
                      }
                  }

                  rvCache[value] = instr[1] ? data == instr[1] : jpf.isTrue(data);
                  
                  if(!rvCache[value]){
                    if (!_self.hasFocus())
                        _self.setError();
                  }
                  else _self.clearError();
              });
            
            return true;
        }
              
        this.$setRule("valid-test", value
            ? "this.$checkRemoteValidation()"
            : null);
    };
};

/**
 * Object allowing for a set of JML elements to be validated. an element that goes into an error state will
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
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.ValidationGroup = function(name){
    jpf.makeClass(this);

    this.validateVisibleOnly = false;
    this.allowMultipleErrors = false;

    this.childNodes = [];
    this.add        = function(o){ this.childNodes.push(o); };
    this.remove     = function(o){ this.childNodes.remove(o); };

    if (name)
        jpf.setReference(name, this);

    this.name = name || "validgroup" + this.uniqueId;
    jpf.nameserver.register("validgroup", this.name, this);

    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[Javeline Validation Group]";
    };

    var errbox; //@todo think about making this global jpf.ValidationGroup.errbox
    /**
     * Gets the {@link Errorbox} element used for a specified element.
     *
     * @param  {JmlNode}  o  required  JmlNode specifying the element for which the Errorbox should be found. If none is found, an Errobox is created. Use the {@link #allowMultipleErrors} property to influence when Errorboxes are created.
     * @param  {Boolean}  no_create
     * @return  {Errorbox}  the found or created Errorbox;
     */
    this.getErrorBox = function(o, no_create){
        if (this.allowMultipleErrors || !errbox && !no_create) {
            errbox           = new jpf.errorbox(null, "errorbox");
            errbox.pHtmlNode = o.oExt.parentNode;
            var cNode        = o.$jml.ownerDocument.createElement("errorbox");
            errbox.loadJml(cNode);
        }
        return errbox;
    };

    /**
     * Hide all Errorboxes for the elements using this element as it's validation group.
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
              && (!this.validateVisibleOnly && oEl.visible || !oEl.oExt || oEl.oExt.offsetHeight)
              && (oEl.hasFeature(__VALIDATION__) && oEl.isValid && !oEl.isValid(!ignoreReq))) {
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
     * @param  {JMLElement} [page]           the page for which the children will be checked. When not specified all elements of this validation group will be checked.
     * @return  {Boolean}  specifying whether the checked elements are valid.
     * @method isValid, validate, checkValidity
     */
    // #ifdef __WITH_HTML5
    this.checkValidity =
    //#endif
    this.validate =
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
                    + page.validation + "'", page.$jml));
            }
            //#endif
        }

        //Global Rules
        //
        if (!found)
            found = this.dispatchEvent("validation");

        return !found;
    };
};

// #endif
