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

// #ifdef __JTEXTBOX || __JSECRET || __JTEXTAREA || __JINPUT || __INC_ALL
// #define __WITH_PRESENTATION 1

//@todo DOCUMENT the modules too

/**
 * Element displaying a rectangular area wich allows a
 * user to type information. The information typed can be
 * restricted by using masking. The information can also
 * be hidden from view when used in password mode. Furthermore
 * by supplying a dataset information typed can autocomplete.
 *
 * @constructor
 * @define input, secret, textarea, textbox
 * @allowchild autocomplete, {smartbinding}
 * @addnode elements
 *
 * @inherits jpf.DataBinding
 * @inherits jpf.Presentation
 * @inherits jpf.Validation
 * @inherits jpf.XForms
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.1
 */
jpf.input    =
jpf.secret   =
jpf.textarea = 
jpf.textbox  = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$focussable       = true; // This object can get the focus
    var masking            = false;
    var _self              = this;
    
    /**** Properties and Attributes ****/
    
    this.realtime          = false;
    this.isContentEditable = true;
    this.multiline         = this.tagName == "textarea" ? true : false;
    
    this.$booleanProperties["focusselect"] = true;
    this.$booleanProperties["realtime"]    = true;
    this.$supportedProperties.push("value", "mask", "initial", 
        "focusselect", "realtime", "type");

    /**
     * @attribute {String} value the text of this element
     */
    this.$propHandlers["value"] = function(value){
        // Set Value
        if (this.isHTMLBox) {
            if (this.oInt.innerHTML != value)
                this.oInt.innerHTML = value;
        }
        else
            if (this.oInt.value != value) {
                this.oInt.value = value;
            }
    };
    
    //See validation
    this.$propHandlers["maxlength"] = function(value){
        this.$setRule("maxlength", value
            ? "value.toString().length <= " + value
            : null);
        
        //Special validation support using nativate max-length browser support
        if (this.oInt.tagName.toLowerCase().match(/input|textarea/))
            this.oInt.maxLength = parseInt(value) || null;
    };
    
    /**
     * @attribute {String} mask a complex input pattern that the user should
     * adhere to. This is a string which is a combination of special and normal
     * characters. Then comma seperated it has two options. The first option 
     * specifies wether the non input characters (the chars not typed by the 
     * user) are in the value of this element. The second option specifies the 
     * character that is displayed when the user hasn't yet filled in a 
     * character.
     *   Special Characters:
     *   0  Any digit
     *   1  The number 1 or 2.
     *   9  Any digit or a space.
     *   #  Any digit, space, plus or minus.
     *   L  Any alpha character, case insensitive.
     *   ?  Any alpha character, case insensitive or space.
     *   A  Any alphanumeric character.
     *   a  Any alphanumeric character or space.
     *   X  Hexadecimal character, case insensitive.
     *   x  Hexadecimal character, case insensitive or space.
     *   &  Any whitespace.
     *   C  Any character.
     *   !  The string is right aligned.
     *   '  The start or end of a literal part.
     *   "  The start or end of a literal part.
     *   <  The following characters will be lowercase, event though typed uppercase.
     *   >  The following characters will be uppercase, event though typed lowercase.
     *   \  Cancel the special meaning of a character.
     * Example:
     * An american style phone number.
     * <code>
     *  <j:textbox mask="(000)0000-0000;;_" />
     * </code>
     * Example:
     * A dutch postal code
     * <code>
     *  <j:textbox mask="0000 AA;;_" />
     * </code>
     * Example:
     * A date
     * <code>
     *  <j:textbox mask="00-00-0000;;_" datatype="xsd:date" />
     * </code>
     * Example:
     * A serial number
     * <code>
     *  <j:textbox mask="'WCS74'0000-00000;1;_" />
     * </code>
     * Example:
     * A MAC address
     * <code>
     *  <j:textbox mask="XX-XX-XX-XX-XX-XX;;_" />
     * </code>
     * Remarks:
     * This currently only works in internet explorer.
     */
    this.$propHandlers["mask"] = function(value){
        if (jpf.hasMsRangeObject || this.mask == "PASSWORD")
            return;
        
        if (!value) {
            throw new Error("Not Implemented");
        }
            
        if (!masking) {
            masking = true;
            this.inherit(jpf.textbox.masking); /** @inherits jpf.textbox.masking */
            this.focusselect = false;
            this.realtime    = false;
        }
        
        this.setMask(this.mask);
    };

    /**
     * @attribute {String} initial-message the message displayed by this element
     * when it doesn't have a value set. This property is inherited from parent 
     * nodes. When none is found it is looked for on the appsettings element. 
     */
    this.$propHandlers["initial-message"] = function(value){
        this.initialMsg = value 
            || jpf.xmldb.getInheritedAttribute(this.$jml, "initial-message");
        
        if (this.initialMsg) {
            this.oInt.onblur();
            this.setValue(this.initialMsg);
        }
    };

    /**
     * @attribute {Boolean} realtime wether the value of the bound data is 
     * updated as the user types it, or only when this element looses focus or
     * the user presses enter.
     */
    this.$propHandlers["realtime"] = function(value){
        this.realtime = value 
            || jpf.xmldb.getInheritedAttribute(x, "value") || false;
    };
    
    /**
     * @attribute {Boolean} focusselect wether the text in this element is
     * selected when this element receives focus.
     */
    this.$propHandlers["focusselect"] = function(value){
        this.oInt.onmousedown = function(){
            _self.focusselect = false;
        };
        
        this.oInt.onmouseup  = 
        this.oInt.onmouseout = function(){
            _self.focusselect = value;
        };
    };
    
    /**
     * @attribute {String} type the meaning or function this element represents.
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
    
    /**** Public Methods ****/

    /**
     * @copy Widget#setValue
     */
    this.setValue = function(value){
        return this.setProperty("value", value);
    };
    
    /**
     * @copy Widget#getValue
     */
    this.getValue = function(){
        return this.isHTMLBox ? this.oInt.innerHTML : this.oInt.value;
    };
    
    /**
     * Selects the text in this element.
     */
    this.select   = function(){ this.oInt.select(); };
    
    /**
     * Deselects the text in this element.
     */
    this.deselect = function(){ this.oInt.deselect(); };
    
    /**** Private Methods *****/
    
    this.$enable  = function(){ this.oInt.disabled = false; };
    this.$disable = function(){ this.oInt.disabled = true; };

    this.$insertData = function(str){
        return this.setValue(str);
    };
    
    /**
     * @private
     */
    this.insert = function(text){
        if (jpf.hasMsRangeObject) {
            try {
                this.oInt.focus();
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
            this.oInt.value += text;
        }
    };
    
    this.$clear = function(){
        this.value = "";
        
        if (this.oInt.tagName.toLowerCase().match(/input|textarea/i))
            this.oInt.value = "";
        else {
            this.oInt.innerHTML = "";
            //try{this.oInt.focus();}catch(e){}
            
            if (!jpf.hasMsRangeObject) return;
            
            //will fail when object isn't visible
            //N.B. why a select in a clear function.. isn't consistent...
            try {
                var range = document.selection.createRange();
                range.moveStart("sentence", -1);
                //range.text = "";
                range.select();
            }
            catch(e) {}
        }
    };
    
    this.$keyHandler = function(key, ctrlKey, shiftKey, altKey, e){
        if (this.dispatchEvent("keydown", {
            keyCode   : key,
            ctrlKey   : ctrlKey,
            shiftKey  : shiftKey,
            altKey    : altKey,
            htmlEvent : e}) === false)
                return false;

        // @todo: revisit this IF statement - dead code?
        if (false && jpf.isIE && (key == 86 && ctrlKey || key == 45 && shiftKey)) {
            var text = window.clipboardData.getData("Text");
            if ((text = this.dispatchEvent("keydown", {
                text : this.onpaste(text)}) === false))
                    return false;
            if (!text)
                text = window.clipboardData.getData("Text");
            
            this.oInt.focus();
            var range = document.selection.createRange();
            range.text = "";
            range.collapse();
            range.pasteHTML(text.replace(/\n/g, "<br />").replace(/\t/g, "&nbsp;&nbsp;&nbsp;"));
            
            return false;
        }
    };
    
    var fTimer;
    this.$focus = function(e){
        if (!this.oExt || this.oExt.disabled) 
            return;
            
        this.$setStyleClass(this.oExt, this.baseCSSname + "Focus");
        
        function delay(){
            try {
                if (!fTimer || document.activeElement != _self.oInt) {
                    _self.oInt.focus();
                }
                else {
                    clearInterval(fTimer);
                    return;
                }
            }
            catch(e) {}
            
            if (masking)
                _self.setPosition();
    
            if (_self.focusselect)
                _self.select();
        };

        if (e && e.mouse && jpf.isIE) {
            clearInterval(fTimer);
            fTimer = setInterval(delay, 1);
        }
        else
            delay();
    };
    
    this.$blur = function(e){
        if (!this.oExt) 
            return;

        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);

        if (jpf.hasMsRangeObject) {
            var r = this.oInt.createTextRange();
            r.collapse();
            r.select();
        }

        try {
            if (jpf.isIE || !e || e.srcElement != jpf.window)
                this.oInt.blur();
        }
        catch(e) {}
        
        if (!this.realtime)
            this.change(this.getValue());
            
        // check if we clicked on the oContainer. ifso dont hide it
        if (this.oContainer) {
            setTimeout("var o = jpf.lookup(" + this.uniqueId + ");\
                o.oContainer.style.display = 'none'", 100);
        }
    };
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal(null, null, function(oExt){
            if (this.$jml.getAttribute("mask") == "PASSWORD"
              || "secret|password".indexOf(this.tagName) > -1
              || this.$jml.getAttribute("type") == "password") {
                this.$jml.removeAttribute("mask");
                this.$getLayoutNode("main", "input").setAttribute("type", "password");
            }
            //#ifdef __WITH_HTML5
            else if (this.tagName == "email") {
                this.datatype = "jpf:email";
                this.$propHandlers["datatype"].call(this, "jpf:email");
            }
            else if (this.tagName == "url") {
                this.datatype = "jpf:url";
                this.$propHandlers["datatype"].call(this, "jpf:url");
            }
            //#endif
            
            oExt.setAttribute("onmousedown", "this.host.dispatchEvent('mousedown', {htmlEvent : event});");
            oExt.setAttribute("onmouseup",   "this.host.dispatchEvent('mouseup', {htmlEvent : event});");
            oExt.setAttribute("onclick",     "this.host.dispatchEvent('click', {htmlEvent : event});");
        }); 
        this.oInt = this.$getLayoutNode("main", "input", this.oExt);	
        
        if (!jpf.hasContentEditable && "input|textarea".indexOf(this.oInt.tagName.toLowerCase()) == -1) {
            var node  = this.oInt;
            this.oInt = node.parentNode.insertBefore(document.createElement("textarea"), node);
            node.parentNode.removeChild(node);
            this.oInt.className = node.className;
            if (this.oExt == node)
                this.oExt = this.oInt;
        }
        
        //@todo for skin switching this should be removed
        if (this.oInt.tagName.toLowerCase() == "textarea") {
            this.addEventListener("focus", function(e){
                //if (this.multiline != "optional")
                    //e.returnValue = false
            });
        }
        
        this.oInt.onselectstart = function(e){
            if (!e) e = event;
            e.cancelBubble = true;
        }
        this.oInt.host = this;
        
        //temp fix
        this.oInt.onkeydown = function(e){
            if (this.disabled) return false;
            
            e = e || window.event;
            
            //Change
            if (!_self.realtime)
                if (e.keyCode == 13)
                    _self.change(_self.getValue());
            else
                if (jpf.isSafari && _self.xmlRoot) //safari issue (only old??)
                    setTimeout("var o = jpf.lookup(" + _self.uniqueId + ");\
                        o.change(o.getValue())");
            
            if (_self.multiline == "optional" && e.keyCode == 13 && !e.ctrlKey)
                return false;
            
            if (e.ctrlKey && (e.keyCode == 66 || e.keyCode == 73
              || e.keyCode == 85))
                return false; 
            
            //Autocomplete
            if (_self.oContainer) {
                var oTxt    = _self;
                var keyCode = e.keyCode;
                setTimeout(function(){
                    oTxt.fillAutocomplete(keyCode);
                });
            }
            
            //Non masking
            if (!_self.mask) {
                return _self.$keyHandler(e.keyCode, e.ctrlKey,
                    e.shiftKey, e.altKey, e);
            }
        };
        
        this.oInt.onkeyup = function(e){
            if (!e)
                e = event;
            
            var keyCode = e.keyCode;

            if (_self.realtime) {
                setTimeout(function(){
                    if (!_self.mask)
                        _self.change(_self.getValue()); //this is a hack
                    _self.dispatchEvent("keyup", {keyCode : keyCode});
                });
            }
            else {
                _self.dispatchEvent("keyup", {keyCode : keyCode});
            }
            
            //#ifdef __WITH_VALIDATION
            if (_self.isValid() && e.keyCode != 13 && e.keyCode != 17)
                _self.clearError();
            //#endif
        };
        
        this.oInt.onfocus = function(){
            if (_self.initialMsg && this.value == _self.initialMsg) {
                this.value = "";
                jpf.setStyleClass(_self.oExt, "", [_self.baseCSSname + "Initial"]);
            }
            
            //#ifdef __WITH_WINDOW_FOCUS
            if (jpf.hasFocusBug)
                jpf.window.$focusfix2();
            //#endif
        };
        
        this.oInt.onblur = function(){
            if (_self.initialMsg && this.value == "") {
                this.value = _self.initialMsg;
                jpf.setStyleClass(_self.oExt, _self.baseCSSname + "Initial");
            }
            
            //#ifdef __WITH_WINDOW_FOCUS
            if (jpf.hasFocusBug)
                jpf.window.$blurfix();
            //#endif
        };
        
        if (jpf.hasAutocompleteXulBug)
            this.oInt.setAttribute("autocomplete", "off");

        if (!this.oInt.tagName.toLowerCase().match(/input|textarea/)) {
            this.isHTMLBox = true;
            
            this.oInt.unselectable    = "Off";
            this.oInt.contentEditable = true;
            this.oInt.style.width     = "1px";
            
            this.oInt.select = function(){
                var r = document.selection.createRange();
                r.moveToElementText(this);
                r.select();
            }
        };
        
        this.oInt.deselect = function(){
            if (!document.selection) return;
            
            var r = document.selection.createRange();
            r.collapse();
            r.select();
        };
    };

    this.$loadJml = function(x){
        //Autocomplete
        var ac = $xmlns(x, "autocomplete", jpf.ns.jpf)[0];
        if (ac) {
            this.inherit(jpf.textbox.autocomplete); /** @inherits jpf.textbox.autocomplete */
            this.initAutocomplete(ac);
        }
        
        if (typeof this.realtime == "undefined")
            this.$propHandlers["realtime"].call(this);
        
        if (jpf.xmldb.isOnlyChild(x.firstChild, [3,4]))
            this.$handlePropSet("value", x.firstChild.nodeValue.trim());
        else
            jpf.JmlParser.parseChildren(this.$jml, null, this);
    };
    
    this.$destroy = function(){
        this.oInt.onkeypress    = 
        this.oInt.onmouseup     = 
        this.oInt.onmouseout    = 
        this.oInt.onmousedown   = 
        this.oInt.onkeydown     = 
        this.oInt.onkeyup       = 
        this.oInt.onselectstart = null;
    };
}).implement(
    //#ifdef __WITH_DATABINDING
    jpf.DataBinding,
    //#endif
    //#ifdef __WITH_VALIDATION
    jpf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    jpf.XForms,
    //#endif
    jpf.Presentation
);

// #endif
