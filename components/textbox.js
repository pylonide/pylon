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

// #ifdef __JTEXTBOX || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a rectangular area wich allows a
 * user to type information. The information typed can be
 * restricted by using masking. The information can also
 * be hidden from view when used in password mode. Furthermore
 * by supplying a dataset information typed can autocomplete.
 *
 * @classDescription		This class creates a new textbox
 * @return {Textbox} Returns a new textbox
 * @type {Textbox}
 * @constructor
 * @alias jpf.input
 * @alias jpf.secret
 * @alias jpf.textarea
 * @allowchild autocomplete
 * @addnode components:textbox, components:secret, components:input, components:textarea
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.1
 */
//XForms support
jpf.input = 
jpf.secret = 
jpf.textarea = 
jpf.textbox = function(pHtmlNode, tagName){
    jpf.register(this, tagName || "textbox", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    //#ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    //#endif

    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    //Options
    this.__focussable    = true; // This object can get the focus
    this.realtime        = false;
    this.nonSizingHeight = true;
    
    //#ifdef __WITH_VALIDATION
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    
    var hasSelectedOnFocus = false;
    var masking            = false;
    var _self              = this;
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/

    this.setValue = function(value){
        return this.setProperty("value", value);
    }
    
    this.__clear = function(){
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
    }
    
    this.getValue = function(){
        return this.isHTMLBox ? this.oInt.innerHTML : this.oInt.value;
    }
    
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
    }
    
    this.__enable  = function(){ this.oInt.disabled = false; };
    this.__disable = function(){ this.oInt.disabled = true; };
    this.select    = function(){ this.oInt.select(); };
    this.deselect  = function(){ this.oInt.deselect(); };
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/

    this.__insertData = function(str){
        return this.setValue(str);
    }	
    
    /* ***********************
        Keyboard Support
    ************************/
    this.keyHandler = function(){};
    
    //Normal
    this.keyHandlerWA = function(key, ctrlKey, shiftKey, altKey, e){
        if (this.dispatchEvent("onkeydown", {
            keyCode   : key,
            ctrlKey   : ctrlKey,
            shiftKey  : shiftKey,
            altKey    : altKey,
            htmlEvent : e}) === false)
                return false;
        
        if (false && jpf.isIE && (key == 86 && ctrlKey || key == 45 && shiftKey)) {
            var text = window.clipboardData.getData("Text");
            if ((text = this.dispatchEvent("onkeydown", {
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
    }
    
    /* ***********************
                Focus
    ************************/
    
    this.__focus = function(){
        if (!this.oExt || this.oExt.disabled) return;
        this.__setStyleClass(this.oExt, this.baseCSSname + "Focus");
        
        try {
            this.oInt.focus();
        }
        catch(e) {}
        
        if (masking)
            this.setPosition();
        
        if (this.focusselect) {
            hasSelectedOnFocus = true;
            this.select();
        }
    }
    
    this.__blur = function(){
        if (!this.oExt) return;
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
        
        if (masking) {
            var r = this.oExt.createTextRange();
            r.collapse();
            r.select();
        }
        
        try {
            this.oExt.blur();
            document.body.focus();
        }
        catch(e) {}
        
        if (!this.realtime)
            this.change(this.getValue());
            
        hasSelectedOnFocus = false;
        // check if we clicked on the oContainer. ifso dont hide it
        if (this.oContainer)
            setTimeout("var o = jpf.lookup(" + this.uniqueId + ");\
                o.oContainer.style.display = 'none'", 100);
    }
    
    /* ***********************
          Properties
    ************************/
    
    this.__booleanProperties["focusselect"] = true;
    this.__supportedProperties.push("value", "mask", "initial", 
        "focusselect", "realtime");

    this.__propHandlers["value"] = function(value){
        // Set Value
        if (this.isHTMLBox) {
            if (this.oInt.innerHTML != value)
                this.oInt.innerHTML = value;
        }
        else
            if (this.oInt.value != value) {
                this.oInt.value = value;
            }
    }
    this.__propHandlers["maxlength"] = function(value){
        this.__setRule("maxlength", value
            ? "value.toString().length <= " + value
            : null);
        
        //Special validation support using nativate max-length browser support
        if (this.oInt.tagName.toLowerCase().match(/input|textarea/))
            this.oInt.maxLength = parseInt(value) || null;
    }
    this.__propHandlers["mask"] = function(value){
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
    }
    this.__propHandlers["initial"] = function(value){
        if (value) {
            this.oInt.onblur();
            this.setValue(value);
        }
    }
    this.__propHandlers["realtime"] = function(value){
        this.realtime = value || jpf.xmldb.getInheritedAttribute(x, "value") || false;
    }
    this.__propHandlers["focusselect"] = function(value){
        this.oInt.onmouseup = value 
            ? function(){
                if (hasSelectedOnFocus) {
                    this.select();
                    hasSelectedOnFocus = false;
                }
                
                this.host.dispatchEvent("onmouseup");
                return false;
            }
            : null;
    }

    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(null, null, function(oExt){
            if (this.jml.getAttribute("mask") == "PASSWORD"
              || this.tagName == "secret" 
              || this.jml.getAttribute("type") == "password") {
                this.jml.removeAttribute("mask");
                this.__getLayoutNode("main", "input").setAttribute("type", "password");
            }
            
            oExt.setAttribute("onmousedown", "this.host.dispatchEvent('onmousedown', {htmlEvent : event});");
            oExt.setAttribute("onmouseup",   "this.host.dispatchEvent('onmouseup', {htmlEvent : event});");
            oExt.setAttribute("onclick",     "this.host.dispatchEvent('onclick', {htmlEvent : event});");
        }); 
        this.oInt = this.__getLayoutNode("main", "input", this.oExt);	
        
        if (!jpf.hasContentEditable && !this.oInt.tagName.toLowerCase().match(/input|textarea/)) {
            var node  = this.oInt;
            this.oInt = node.parentNode.insertBefore(document.createElement("textarea"), node);
            node.parentNode.removeChild(node);
            this.oInt.className = node.className;
            if (this.oExt == node)
                this.oExt = this.oInt;
        }
        
        this.oInt.onselectstart = function(e){
            if (!e) e = event;
            e.cancelBubble = true;
        }
        this.oInt.host          = this;
        
        //temp fix
        this.oInt.onkeydown = function(e){
            if (this.disabled) return false;
            
            if (!e)
                e = event;
            
            //Change
            if (!this.host.realtime)
                if (e.keyCode == 13)
                    this.host.change(this.host.getValue());
            else
                if (jpf.isSafari && this.host.XMLRoot) //safari issue (only old??)
                    setTimeout("var o = jpf.lookup(" + this.host.uniqueId + ");\
                        o.change(o.getValue())");
            
            if (e.ctrlKey && (e.keyCode == 66 || e.keyCode == 73
              || e.keyCode == 85))
                return false; 
            
            //Autocomplete
            if (this.host.oContainer) {
                var oTxt    = this.host;
                var keyCode = e.keyCode;
                setTimeout(function(){
                    oTxt.fillAutocomplete(keyCode);
                });
            }
            
            //Non masking
            if (!this.host.mask)
                return this.host.keyHandlerWA(e.keyCode, e.ctrlKey,
                    e.shiftKey, e.altKey, e);
        }
        
        this.oInt.onkeyup = function(e){
            var keyCode = (e||event).keyCode;

            if (this.host.realtime) {
                setTimeout(function(){
                    if (!_self.mask)
                        _self.change(_self.getValue()); //this is a hack
                    _self.dispatchEvent("onkeyup", {keyCode : keyCode});
                });
            }
            else {
                _self.dispatchEvent("onkeyup", {keyCode : keyCode});
            }
            
            //#ifdef __WITH_VALIDATION
            this.host.validate();
            //#endif
        }

        this.oInt.onfocus = function(){
            if (this.host.initial && this.value == this.host.initial) {
                this.value = "";
                this.host.__setStyleClass(this.host.oExt, "", 
                    [this.host.baseCSSname + "Initial"]);
            }
        }
        
        this.oInt.onblur = function(){
            if (this.host.initial && this.value == "") {
                this.value = this.host.initial;
                this.host.__setStyleClass(this.host.oExt,
                    this.host.baseCSSname + "Initial");
            }
        }

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
        }
        
        this.oInt.deselect = function(){
            if (!document.selection) return;
            
            var r = document.selection.createRange();
            r.collapse();
            r.select();
        }
    }

    this.__loadJml = function(x){
        //Autocomplete
        var ac = $xmlns(x, "autocomplete", jpf.ns.jpf)[0];
        if (ac) {
            this.inherit(jpf.textbox.autocomplete); /** @inherits jpf.textbox.autocomplete */
            this.initAutocomplete(ac);
        }
        
        if (jpf.xmldb.isOnlyChild(x.firstChild, [3,4]))
            this.handlePropSet("value", x.firstChild.nodeValue.trim());
        else
            jpf.JmlParser.parseChildren(this.jml, null, this);
    }
    
    this.__destroy = function(){
        this.oInt.onkeypress = this.oInt.onmouseup = this.oInt.onkeydown = 
            this.oInt.onkeyup = this.oInt.onselectstart = null;
    }
}

// #endif