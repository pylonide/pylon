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

// #ifdef __AMLTEXTBOX || __AMLSECRET || __AMLTEXTAREA || __AMLINPUT || __INC_ALL

//@todo DOCUMENT the modules too

/**
 * Element displaying a rectangular area wich allows a
 * user to type information. The information typed can be
 * restricted by using this.$masking. The information can also
 * be hidden from view when used in password mode. By adding an 
 * {@link element.autocomplete autocomplete element} as a child the 
 * value for the textbox can be looked up as you type. By setting the 
 * {@link element.textbox.attribute.mask mask atribute}, complex data input 
 * validation is done while the users types.
 * 
 * @constructor
 * @define input, secret, textarea, textbox
 * @allowchild autocomplete, {smartbinding}
 * @addnode elements
 *
 * @inherits apf.StandardBinding
 * @inherits apf.XForms
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.1
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the value based on data loaded into this component.
 * <code>
 *  <a:model id="mdlTextbox">
 *      <data name="Lukasz"></data>
 *  </a:model>
 *  <a:textbox model="mdlTextbox" value="[@name]" />
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <a:model id="mdlTextbox">
 *      <data name="Lukasz"></data>
 *  </a:model>
 *  <a:textbox value="[mdlTextbox::@name]" />
 * </code>
 *
 * @event click     Fires when the user presses a mousebutton while over this element and then let's the mousebutton go. 
 * @event mouseup   Fires when the user lets go of a mousebutton while over this element. 
 * @event mousedown Fires when the user presses a mousebutton while over this element. 
 * @event keyup     Fires when the user lets go of a keyboard button while this element is focussed. 
 *   object:
 *   {Number}  keyCode   which key was pressed. This is an ascii number.
 * @event clear     Fires when the content of this element is cleared. 
 */
apf.input    = function(struct, tagName){
    this.$init(tagName || "input", apf.NODE_VISIBLE, struct);
};

apf.secret   = function(struct, tagName){
    this.$init(tagName || "secret", apf.NODE_VISIBLE, struct);
};

apf.password = function(struct, tagName){
    this.$init(tagName || "password", apf.NODE_VISIBLE, struct);
};

apf.textarea = function(struct, tagName){
    this.$init(tagName || "textarea", apf.NODE_VISIBLE, struct);
    
    this.multiline = true;
};

// HTML5 email element
apf.email    = function(struct, tagName){
    this.$init(tagName || "email", apf.NODE_VISIBLE, struct);
};

apf.textbox  = function(struct, tagName){
    this.$init(tagName || "textbox", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
        //#ifdef __WITH_XFORMS
        //,apf.XForms
        //#endif
    );

    this.$focussable       = true; // This object can get the focus
    this.$masking          = false;
    this.$autoComplete     = false;

    this.$childProperty    = "value";

    //this.realtime        = false;
    this.value             = "";
    this.readonly          = false;
    this.$isTextInput      = true;
    this.multiline         = false;

    /**
     * @attribute {Boolean} realtime whether the value of the bound data is
     * updated as the user types it, or only when this element looses focus or
     * the user presses enter.
     */
    this.$booleanProperties["readonly"]    = true;
    this.$booleanProperties["focusselect"] = true;
    this.$booleanProperties["realtime"]    = true;
    this.$supportedProperties.push("value", "mask", "initial-message",
        "focusselect", "realtime", "type");

    /**
     * @attribute {String} value the text of this element
     * @todo apf3.0 check use of this.$propHandlers["value"].call
     */
    this.$propHandlers["value"] = function(value, prop, force, initial){
        if (!this.$input || !initial && this.getValue() == value)
            return;

        // Set Value
        if (!initial && !value && !this.hasFocus()) //@todo apf3.x research the use of clear
            return this.$clear();
        else if (this.isHTMLBox) {
            if (this.$input.innerHTML != value)
                this.$input.innerHTML = value;
        }
        else if (this.$input.value != value)
            this.$input.value = value;
        
        if (!initial)
            apf.setStyleClass(this.$ext, "", [this.$baseCSSname + "Initial"]);
        
        if (this.$button)
            this.$button.style.display = value && !initial ? "block" : "none";
    };

    //See validation
    //var oldPropHandler = this.$propHandlers["maxlength"];
    this.addEventListener("prop.maxlength", function(e){
        //Special validation support using nativate max-length browser support
        if (this.$input.tagName.toLowerCase().match(/input|textarea/))
            this.$input.maxLength = parseInt(e.value) || null;
    });
    
    this.addEventListener("prop.editable", function(e){
        if (apf.isIE)
            this.$input.unselectable = e.value ? "On" : "Off";
        else {
            if (e.value) 
                apf.addListener(this.$input, "mousedown", apf.preventDefault);
            else
                apf.removeListener(this.$input, "mousedown", apf.preventDefault);
        }
    });

    /**
     * @attribute {String} mask a complex input pattern that the user should
     * adhere to. This is a string which is a combination of special and normal
     * characters. Then comma seperated it has two options. The first option
     * specifies whether the non input characters (the chars not typed by the
     * user) are in the value of this element. The second option specifies the
     * character that is displayed when the user hasn't yet filled in a
     * character.
     *   Characters:
     *   0  Any digit
     *   1  The number 1 or 2.
     *   9  Any digit or a space.
     *   #  User can enter a digit, space, plus or minus sign.
     *   L  Any alpha character, case insensitive.
     *   ?  Any alpha character, case insensitive or space.
     *   A  Any alphanumeric character.
     *   a  Any alphanumeric character or space.
     *   X  Hexadecimal character, case insensitive.
     *   x  Hexadecimal character, case insensitive or space.
     *   &  Any whitespace.
     *   C  Any character.
     *   !  Causes the input mask to fill from left to right instead of from right to left.
     *   '  The start or end of a literal part.
     *   "  The start or end of a literal part.
     *   >  Converts all characters that follow to uppercase.
     *   <  Converts all characters that follow to lowercase.
     *   \  Cancel the special meaning of a character.
     * Example:
     * An american style phone number.
     * <code>
     *  <a:textbox mask="(000)0000-0000;;_" />
     * </code>
     * Example:
     * A dutch postal code
     * <code>
     *  <a:textbox mask="0000 AA;;_" />
     * </code>
     * Example:
     * A date
     * <code>
     *  <a:textbox mask="00-00-0000;;_" datatype="xsd:date" />
     * </code>
     * Example:
     * A serial number
     * <code>
     *  <a:textbox mask="'WCS74'0000-00000;1;_" />
     * </code>
     * Example:
     * A MAC address
     * <code>
     *  <a:textbox mask="XX-XX-XX-XX-XX-XX;;_" />
     * </code>
     */
    this.$propHandlers["mask"] = function(value){
        if (this.mask.toLowerCase() == "password")// || !apf.hasMsRangeObject)
            return;

        if (!value) {
            throw new Error("Not Implemented");
        }

        if (!this.$masking) {
            this.$masking = true;
            this.implement(apf.textbox.masking);
            this.focusselect = false;
            //this.realtime    = false;
        }

        this.setMask(this.mask);
    };

    //this.$propHandlers["ref"] = function(value) {
    //    this.$input.setAttribute("name",  value.split("/").pop().split("::").pop()
    //        .replace(/[\@\.\(\)]*/g, ""));
    //};

    /**
     * @attribute {String} initial-message the message displayed by this element
     * when it doesn't have a value set. This property is inherited from parent
     * nodes. When none is found it is looked for on the appsettings element.
     */
    this.$propHandlers["initial-message"] = function(value){
        if (value) {
            //#ifdef __WITH_WINDOW_FOCUS
            if (apf.hasFocusBug)
                this.$input.onblur();
            //#endif
            
            //this.$propHandlers["value"].call(this, value, null, true);
        }
        
        if (!this.value)
            this.$clear(true);
            
        if (this.type == "password" && this.$inputInitFix) {
            this.$inputInitFix.innerHTML = value;
            apf.setStyleClass(this.$inputInitFix, "initFxEnabled");
        } 
    };

    /**
     * @attribute {Boolean} focusselect whether the text in this element is
     * selected when this element receives focus.
     */
    this.$propHandlers["focusselect"] = function(value){
        var _self = this;
        this.$input.onmousedown = function(){
            _self.focusselect = false;
        };

        this.$input.onmouseup  =
        this.$input.onmouseout = function(){
            _self.focusselect = value;
        };
    };

    /**
     * @attribute {String} type the type or function this element represents.
     * This can be any arbitrary name. Although there are some special values.
     *   Possible values:
     *   username   this element is used to type in the name part of login credentials.
     *   password   this element is used to type in the password part of login credentials.
     */
    this.$propHandlers["type"] = function(value){
        if (value && "password|username".indexOf(value) > -1
          && typeof this.focusselect == "undefined") {
            this.focusselect = true;
            this.$propHandlers["focusselect"].call(this, true);
        }
    };

    this.$isTextInput = function(e){
        return true;
    };

    /**** Public Methods ****/

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        return this.setProperty("value", value, false, true);
    };
    
    this.clear = function(){
        this.setProperty("value", "");
    }
    
    //@todo cleanup and put initial-message behaviour in one location
    this.$clear = function(noEvent){
        if (this["initial-message"]) {
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Initial");
            this.$propHandlers["value"].call(this, this["initial-message"], null, null, true);
        }
        else {
            this.$propHandlers["value"].call(this, "", null, null, true);
        }
        
        if (!noEvent)
            this.dispatchEvent("clear");//@todo this should work via value change
    }

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        var v = this.isHTMLBox ? this.$input.innerHTML : this.$input.value;
        return v == this["initial-message"] ? "" : v.replace(/\r/g, "");
    };
    
    //#endif

    /**
     * Selects the text in this element.
     */
    this.select   = function(){ 
        try {
            this.$input.select(); 
        }
        catch(e){}
    };

    /**
     * Deselects the text in this element.
     */
    this.deselect = function(){this.$input.deselect();};

    /**** Private Methods *****/

    this.$enable  = function(){this.$input.disabled = false;};
    this.$disable = function(){this.$input.disabled = true;};

    this.$insertData = function(str){
        return this.setValue(str);
    };

    /**
     * @private
     */
    this.insert = function(text){
        if (apf.hasMsRangeObject) {
            try {
                this.$input.focus();
            }
            catch(e) {}
            var range = document.selection.createRange();
            if (this.oninsert)
                text = this.oninsert(text);
            range.pasteHTML(text);
            range.collapse(true);
            range.select();
        }
        else {
            this.$input.value += text;
        }
    };

    this.addEventListener("$clear", function(){
        this.value = "";//@todo what about property binding?
        
        if (this["initial-message"] && apf.document.activeElement != this) {
            this.$propHandlers["value"].call(this, this["initial-message"], null, null, true);
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Initial");
        }
        else {
            this.$propHandlers["value"].call(this, "");
        }
        
        if (!this.$input.tagName.toLowerCase().match(/input|textarea/i)) {
            if (apf.hasMsRangeObject) {
                try {
                    var range = document.selection.createRange();
                    range.moveStart("sentence", -1);
                    //range.text = "";
                    range.select();
                }
                catch(e) {}
            }
        }
        
        this.dispatchEvent("clear"); //@todo apf3.0
    });

    this.$keyHandler = function(key, ctrlKey, shiftKey, altKey, e){
        if (this.$button && key == 27) {
            //this.$clear();
            if (this.value) {
                this.change("");
                e.stopPropagation();
            }
            //this.focus({mouse:true});
        }
        
        /*if (this.dispatchEvent("keydown", {
            keyCode   : key,
            ctrlKey   : ctrlKey,
            shiftKey  : shiftKey,
            altKey    : altKey,
            htmlEvent : e}) === false)
                return false;

        // @todo: revisit this IF statement - dead code?
        if (false && apf.isIE && (key == 86 && ctrlKey || key == 45 && shiftKey)) {
            var text = window.clipboardData.getData("Text");
            if ((text = this.dispatchEvent("keydown", {
                text : this.onpaste(text)}) === false))
                    return false;
            if (!text)
                text = window.clipboardData.getData("Text");

            this.$input.focus();
            var range = document.selection.createRange();
            range.text = "";
            range.collapse();
            range.pasteHTML(text.replace(/\n/g, "<br />").replace(/\t/g, "&nbsp;&nbsp;&nbsp;"));

            return false;
        }*/
    };

    this.$registerElement = function(oNode) {
        if (!oNode) return;
        if (oNode.localName == "autocomplete")
            this.$autoComplete = oNode;
    };

    var fTimer;
    this.$focus = function(e){
        if (!this.$ext || this.$ext.disabled)
            return;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");

        if (this["initial-message"] && this.$input.value == this["initial-message"]) {
            this.$propHandlers["value"].call(this, "", null, null, true);
            apf.setStyleClass(this.$ext, "", [this.$baseCSSname + "Initial"]);
        }
        
        var _self = this;
        function delay(){
            try {
                if (!fTimer || document.activeElement != _self.$input) {
                    _self.$input.focus();
                }
                else {
                    clearInterval(fTimer);
                    return;
                }
            }
            catch(e) {}

            if (_self.$masking)
                _self.setPosition();

            if (_self.focusselect)
                _self.select();
        };

        if ((!e || e.mouse) && apf.isIE) {
            clearInterval(fTimer);
            fTimer = setInterval(delay, 1);
        }
        else
            delay();
    };

    this.$blur = function(e){
        if (!this.$ext)
            return;
        
        if (!this.realtime)
            this.change(this.getValue());
    
        if (e)
            e.cancelBubble = true;

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus", "capsLock"]);

        if (this["initial-message"] && this.$input.value == "") {
            this.$propHandlers["value"].call(this, this["initial-message"], null, null, true);
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Initial");
        }

        /*if (apf.hasMsRangeObject) {
            var r = this.$input.createTextRange();
            r.collapse();
            r.select();
        }*/

        try {
            if (apf.isIE || !e || e.srcElement != apf.window)
                this.$input.blur();
        }
        catch(e) {}

        // check if we clicked on the oContainer. ifso dont hide it
        if (this.oContainer) {
            $setTimeout("var o = apf.lookup(" + this.$uniqueId + ");\
                o.oContainer.style.display = 'none'", 100);
        }
        
        clearInterval(fTimer);
    };

    /**** Init ****/

    this.$draw = function(){
        var _self       = this,
            typedBefore = false;
        
        //#ifdef __AMLCODEEDITOR
        if (this.localName == "codeeditor") {
            this.skin = "textarea";
            this.$loadSkin();
        }
        //#endif
        
        //Build Main Skin
        this.$ext = this.$getExternal(null, null, function(oExt){
            var mask = this.getAttribute("mask");

            if ((typeof mask == "string" && mask.toLowerCase() == "password")
              || "secret|password".indexOf(this.localName) > -1) {
                this.type = "password";
                this.$getLayoutNode("main", "input").setAttribute("type", "password");
            }
            
            //#ifdef __WITH_HTML5
            else if (this.localName == "email") {
                this.datatype = (this.prefix ? this.prefix + ":" : "") + "email";
                this.$propHandlers["datatype"].call(this, this.datatype, "datatype");
            }
            else if (this.localName == "url") {
                this.datatype = (this.prefix ? this.prefix + ":" : "") + "url";
                this.$propHandlers["datatype"].call(this, this.datatype, "datatype");
            }
            //#endif

            oExt.setAttribute("onmousedown", "if (!this.host.disabled) \
                this.host.dispatchEvent('mousedown', {htmlEvent : event});");
            oExt.setAttribute("onmouseup",   "if (!this.host.disabled) \
                this.host.dispatchEvent('mouseup', {htmlEvent : event});");
            oExt.setAttribute("onclick",     "if (!this.host.disabled) \
                this.host.dispatchEvent('click', {htmlEvent : event});");
        });
        this.$input        = this.$getLayoutNode("main", "input", this.$ext);
        this.$button       = this.$getLayoutNode("main", "button", this.$ext);
        this.$inputInitFix = this.$getLayoutNode("main", "initialfix", this.$ext);
        
        if (this.type == "password")
            this.$propHandlers["type"].call(this, "password");

        if (!apf.hasContentEditable && "input|textarea".indexOf(this.$input.tagName.toLowerCase()) == -1) {
            var node  = this.$input;
            this.$input = node.parentNode.insertBefore(document.createElement("textarea"), node);
            node.parentNode.removeChild(node);
            this.$input.className = node.className;
            if (this.$ext == node)
                this.$ext = this.$input;
        }
        
        if (this.$button) {
            this.$button.onmousedown = function(){
                _self.$clear(); //@todo why are both needed for doc filter
                _self.change(""); //@todo only this one should be needed
                _self.focus({mouse:true});
            }
        }

        //@todo for skin switching this should be removed
        if (this.$input.tagName.toLowerCase() == "textarea") {
            this.addEventListener("focus", function(e){
                //if (this.multiline != "optional")
                    //e.returnValue = false
            });
        }
        
        this.$input.onselectstart = function(e){
            if (!e) e = event;
            e.cancelBubble = true;
        }
        this.$input.host = this;

        this.$input.onkeydown = function(e){
            e = e || window.event;
            
            if (this.host.disabled) {
                e.returnValue = false;
                return false;
            }

            //Change
            if (!_self.realtime) {
                var value = _self.getValue();
                if (e.keyCode == 13 && value != _self.value)
                    _self.change(value);
            }
            else if (apf.isWebkit && _self.xmlRoot && _self.getValue() != _self.value) //safari issue (only old??)
                $setTimeout("var o = apf.lookup(" + _self.$uniqueId + ");\
                    o.change(o.getValue())");

            if (_self.readonly || _self.multiline == "optional" && e.keyCode == 13 && !e.shiftKey
              || e.ctrlKey && (e.keyCode == 66 || e.keyCode == 73
              || e.keyCode == 85)) {
                e.returnValue = false;
                return false;
            }

            if (typedBefore && this.getAttribute("type") == "password" && this.value != "") {
                var hasClass = (_self.$ext.className.indexOf("capsLock") > -1),
                    capsKey  = (e.keyCode === 20);
                if (capsKey) // caps off
                    apf.setStyleClass(_self.$ext, hasClass ? null : "capsLock", hasClass ? ["capsLock"] : null);
            }

            //Autocomplete
            if (_self.$autoComplete || _self.oContainer) {
                var keyCode = e.keyCode;
                $setTimeout(function(){
                    if (_self.$autoComplete)
                        _self.$autoComplete.fillAutocomplete(keyCode);
                    else
                        _self.fillAutocomplete(keyCode);
                });
            }

            //Non this.$masking
            if (!_self.mask) {
                return _self.$keyHandler(e.keyCode, e.ctrlKey,
                    e.shiftKey, e.altKey, e);
            }
        };

        this.$input.onkeyup = function(e){
            if (!e)
                e = event;
                
            if (this.host.disabled)
                return false;

            var keyCode = e.keyCode;
            
            if (_self.$button)
                _self.$button.style.display = this.value ? "block" : "none";

            if (_self.realtime) {
                $setTimeout(function(){
                    var v;
                    if (!_self.mask && (v = _self.getValue()) != _self.value)
                        _self.change(v); 
                     if (apf.isIE) 
                        _self.dispatchEvent("keyup", {keyCode : keyCode});//@todo
                });
            }
            else if (apf.isIE) {
                _self.dispatchEvent("keyup", {keyCode : keyCode});//@todo
            }

            //#ifdef __WITH_VALIDATION
            if (_self.isValid && _self.isValid() && e.keyCode != 13 && e.keyCode != 17)
                _self.clearError();
            //#endif
        };

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug)
            apf.sanitizeTextbox(this.$input);
        //#endif

        if (apf.hasAutocompleteXulBug)
            this.$input.setAttribute("autocomplete", "off");

        if ("INPUT|TEXTAREA".indexOf(this.$input.tagName) == -1) {
            this.isHTMLBox = true;

            this.$input.unselectable    = "Off";
            this.$input.contentEditable = true;
            this.$input.style.width     = "1px";

            this.$input.select = function(){
                var r = document.selection.createRange();
                r.moveToElementText(this);
                r.select();
            }
        };

        this.$input.deselect = function(){
            if (!document.selection) return;

            var r = document.selection.createRange();
            r.collapse();
            r.select();
        };

        var f;
        apf.addListener(this.$input, "keypress", f = function(e) {
            if (_self.$input.getAttribute("type") != "password")
                return apf.removeListener(_self.$input, "keypress", f);
            e = e || window.event;
            // get key pressed
            var which = -1;
            if (e.which)
                which = e.which;
            else if (e.keyCode)
                which = e.keyCode;

            // get shift status
            var shift_status = false;
            if (e.shiftKey)
                shift_status = e.shiftKey;
            else if (e.modifiers)
                shift_status = !!(e.modifiers & 4);

            if (((which >= 65 && which <=  90) && !shift_status) ||
                ((which >= 97 && which <= 122) && shift_status)) {
                // uppercase, no shift key
                apf.setStyleClass(_self.$ext, "capsLock");
            }
            else {
                apf.setStyleClass(_self.$ext, null, ["capsLock"]);
            }
            typedBefore = true;
        });
    };

    this.$loadAml = function() {
        if (typeof this["initial-message"] == "undefined")
            this.$setInheritedAttribute("initial-message");

        if (typeof this.realtime == "undefined")
            this.$setInheritedAttribute("realtime");
    }

    this.addEventListener("DOMNodeRemovedFromDocument", function(){
        if (this.$button)
            this.$button.onmousedown = null;
        
        if (this.$input) {
            this.$input.onkeypress     =
            this.$input.onmouseup      =
            this.$input.onmouseout     =
            this.$input.onmousedown    =
            this.$input.onkeydown      =
            this.$input.onkeyup        =
            this.$input.onselectstart  = null;
        }
    });
// #ifdef __WITH_DATABINDING
}).call(apf.textbox.prototype = new apf.StandardBinding());
/* #else
}).call(apf.textbox.prototype = new apf.Presentation());
#endif*/

apf.config.$inheritProperties["initial-message"] = 1;
apf.config.$inheritProperties["realtime"]        = 1;

apf.input.prototype    =
apf.secret.prototype   =
apf.password.prototype =
apf.textarea.prototype =
apf.email.prototype    = apf.textbox.prototype;

apf.aml.setElement("input",    apf.input);
apf.aml.setElement("secret",   apf.secret);
apf.aml.setElement("password", apf.password);
apf.aml.setElement("textarea", apf.textarea);
apf.aml.setElement("textbox",  apf.textbox);
// #endif
