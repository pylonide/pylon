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

jpf.spinner = function(pHtmlNode, tagName){
    jpf.register(this, tagName || "spinner", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     Inheritance
     ************************/
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.DataBinding
     */
    this.inherit(jpf.Presentation, jpf.DataBinding);
   
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.__focussable = true; // This object can get the focus
    this.nonSizingHeight = true;
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    var focusSelect = false;
    var masking = false;
    
    this.maximum    = 64000;
    this.minimum    = -64000;
    this.startValue = 0;
    
    this.counter = {
        cy      : 0,
        interval: 200,
        start   : false,
        type    : "plus"
    };
    
    var _self = this;
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value){
        return this.setProperty("value", value);
    }
    
    this.__clear = function(){
        this.value = "";
        
        if (this.oInput.tagName.toLowerCase().match(/input|textarea/i)) 
            this.oInput.value = "";
        else {
            this.oInput.innerHTML = "";
            //try{this.oInput.focus();}catch(e){}
            
            if (!jpf.hasMsRangeObject) 
                return;
            
            //will fail when object isn't visible
            //N.B. why a select in a clear function.. isn't consistent...
            try {
                var range = document.selection.createRange();
                range.moveStart("sentence", -1);
                //range.text = "";
                range.select();
            } 
            catch (e) {}
        }
    }
    
    this.getValue = function(){
        return this.isHTMLBox ? this.oInput.innerHTML : this.oInput.value;
    }
    
    this.insert = function(text){
        if (jpf.hasMsRangeObject) {
            try {
                this.oInput.focus();
            } 
            catch (e) {}
            var range = document.selection.createRange();
            if (this.oninsert) 
                text = this.oninsert(text);
            range.pasteHTML(text);
            range.collapse(true);
            range.select();
        }
        else {
            this.oInput.value += text;
        }
    }
    
    this.__enable = function(){
        this.oInput.disabled = false;
    }
    this.__disable = function(){
        this.oInput.disabled = true;
    }
    this.select = function(){
        this.oInput.select();
    }
    this.deselect = function(){
        this.oInput.deselect();
    }
    
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    this.__insertData = function(str){
        return this.setValue(str);
    }
    
    /* ***********************
     Keyboard Support
     ************************/
    this.keyHandler = function(key){
        if (key < 8 || (key > 8 && key < 37) || (key > 40 && key < 46) 
          || (key > 46 && key < 48) || (key > 57 && key < 109) || key > 109) 
            return false;
        /* Allow: ARROWS, DEL, NUMBERS, MINUS, BACKSPACE */
    }
    
    //Normal
    this.keyHandlerWA = function(key, ctrlKey, shiftKey, altKey, e){
        if (this.dispatchEvent("onkeydown", {
            keyCode  : key,
            ctrlKey  : ctrlKey,
            shiftKey : shiftKey,
            altKey   : altKey,
            htmlEvent: e
        }) === false) 
            return false;
        
        //Mike - August 15, 2008: should we keep this in then? DEAD CODE
        if (false && jpf.isIE && (key == 86 && ctrlKey || key == 45 && shiftKey)) {
            var text = window.clipboardData.getData("Text");
            if ((text = this.dispatchEvent("onkeydown", {
                text: this.onpaste(text)
            }) === false)) 
                return false;
            if (!text) 
                text = window.clipboardData.getData("Text");
            
            this.oInput.focus();
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
        if (!this.oInput || this.oInput.disabled) 
            return;
        this.__setStyleClass(this.oInput, this.baseCSSname + "Focus");
        
        if (this.oExt)
            this.__setStyleClass(this.oExt, this.baseCSSname + "Focus");
        
        try {
            this.oInput.focus();
        } 
        catch (e) {}
        if (masking) 
            this.setPosition();
        
        if (this.selectFocus) {
            focusSelect = true;
            this.select();
        }
    }
    
    this.__blur = function(){
        if (!this.oInput) 
            return;
        this.__setStyleClass(this.oInput, "", [this.baseCSSname + "Focus"]);
        
        if (this.oExt)
            this.__setStyleClass(this.oExt, this.baseCSSname + "Focus");
        
        if (masking) {
            var r = this.oInput.createTextRange();
            r.collapse();
            r.select();
        }
        
        try {
            this.oInput.blur();
            document.body.focus();
        } 
        catch (e) {}
        
        if (this.changeTrigger == "enter") 
            this.change(this.getValue());
        
        focusSelect = false;
        // check if we clicked on the oContainer. ifso dont hide it
        if (this.oContainer) 
            setTimeout('var o = jpf.lookup(' + this.uniqueId + ');o.oContainer.style.display = "none"', 100);
    }
    
    this.__supportedProperties.push("value");
    this.__propHandlers["value"] = function(value){
        // Set Value
        if (this.isHTMLBox) {
            if (this.oInput.innerHTML != value) 
                this.oInput.innerHTML = value;
        }
        else if (this.oInput.value != value) {
            this.oInput.value = value;
        }
    }
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(null, null, function(oExt){
            oExt.setAttribute("onmousedown", 'this.host.dispatchEvent("onmousedown", {htmlEvent : event});');
            oExt.setAttribute("onmouseup",   'this.host.dispatchEvent("onmouseup", {htmlEvent : event});');
            oExt.setAttribute("onclick",     'this.host.dispatchEvent("onclick", {htmlEvent : event});');
        });
        this.oInput       = this.__getLayoutNode("Main", "input", this.oExt);
        this.oButtonPlus  = this.__getLayoutNode("Main", "buttonplus", this.oExt);
        this.oButtonMinus = this.__getLayoutNode("Main", "buttonminus", this.oExt);
        
        this.oInput.value       = this.startValue;
        this.oInput.style.width = this.oInput.parentNode.offsetWidth - 6 
            - Math.max(this.oButtonPlus.offsetWidth, this.oButtonMinus.offsetWidth) + "px";
        
        var timer, z = 0;
        
        this.oInput.onmousedown = function(e){
            var e = (e || event);
            
            var value = parseInt(this.value) || 0, step = 0, cy = e.clientY, cx = e.clientX;
            var input = this;
            var ot    = (input.offsetTop || 33);
            var ol    = (input.offsetLeft || 9);
            var ow    = input.offsetWidth;
            var oh    = input.offsetHeight;
            
            clearInterval(timer);
            timer = setInterval(function(){
                if (!step) {                    
                    return;
                }                
                value += step;
                _self.oInput.value = Math.round(value);
            }, 10);
            
            document.onmousemove = function(e){
                var e = (e || event);
                var y = e.clientY;
                var x = e.clientX;
                
                var nrOfPixels = cy - y;
                
                if ((y > ot && x > ol) && (y < ot + oh && x < ol + ow)) {
                    step = 0;
                    return;
                }
                
                step = Math.pow(Math.min(200, Math.abs(nrOfPixels)) / 10, 2) / 10;
                if (nrOfPixels < 0) 
                    step = -1 * step;
            }
            
            document.onmouseup = function(e){
                clearInterval(timer);
                //_self.change(Math.round(value));
                if (_self.oInput.value != _self.getValue()) 
                    _self.change(_self.oInput.value);
                document.onmousemove = null;
            }
        }
        
        
        this.oButtonPlus.onmousedown = function(e){
            var e = (e || event);
            
            var value = (parseInt(_self.oInput.value) || 0) + 1;
            
            clearInterval(timer);
            timer = setInterval(function(){
                z++;
                value += Math.pow(Math.min(200, z) / 10, 2) / 10;
                _self.oInput.value = Math.round(value);
            }, 50);
        }
        
        this.oButtonMinus.onmousedown = function(e){
            var e = (e || event);
            
            var value = (parseInt(_self.oInput.value) || 0) - 1;
            
            clearInterval(timer);
            timer = setInterval(function(){
                z++;
                value -= Math.pow(Math.min(200, z) / 10, 2) / 10;
                _self.oInput.value = Math.round(value);
            }, 50);
        }
        
        this.oButtonMinus.onmouseout =
        this.oButtonPlus.onmouseout  = function(e){
            clearInterval(timer);
            z = 0;
            
            if (_self.oInput.value != _self.getValue()) 
                _self.change(_self.oInput.value);
            
            _self.__setStyleClass(this, "", ["hover"]);
        }
        
        this.oButtonMinus.onmouseover =
        this.oButtonPlus.onmouseover  = function(e){
            _self.__setStyleClass(this, "hover");
        }
        
        this.oButtonPlus.onmouseup  =
        this.oButtonMinus.onmouseup = function(e){
            clearInterval(timer);
            z = 0;
            
            if (_self.oInput.value != _self.getValue()) 
                _self.change(_self.oInput.value);
        }
        
        
        if (!jpf.hasContentEditable && !this.oInput.tagName.toLowerCase().match(/input|textarea/)) {
            var node = this.oInput;
            this.oInput = node.parentNode.insertBefore(document.createElement("textarea"), node);
            node.parentNode.removeChild(node);
            this.oInput.className = node.className;
            if (this.oExt == node) 
                this.oExt = this.oInput;
        }
        
        this.oInput.onselectstart = function(e){
            if (!e) 
                e = event;
            e.cancelBubble = true
        }
        
        this.oInput.host = this;
        
        //temp fix
        this.oInput.onkeydown = function(e){
            if (this.disabled) 
                return false;
            
            if (!e) 
                e = event;
            
            //Change
            if (this.host.changeTrigger == "enter") 
                if (e.keyCode == 13) 
                    this.host.change(this.host.getValue());
                else 
                    if (jpf.isSafari && this.host.XMLRoot) //safari issue (only old??)
                        setTimeout('var o = jpf.lookup(' + this.host.uniqueId + ');o.change(o.getValue())');
            
            if (e.ctrlKey && (e.keyCode == 66 || e.keyCode == 73 || e.keyCode == 85)) 
                return false;
            
            //Non masking
            if (!this.host.mask) 
                return this.host.keyHandlerWA(e.keyCode, e.ctrlKey, e.shiftKey, e.altKey, e);
        }
        
        this.oInput.onkeyup = function(e){
            var keyCode = (e || event).keyCode, jmlNode = this.host;
            
            if (this.host.changeTrigger != "enter") {
                setTimeout(function(){
                    if (!jmlNode.mask) 
                        jmlNode.change(jmlNode.getValue()); //this is a hack
                    jmlNode.dispatchEvent("onkeyup", {
                        keyCode: keyCode
                    });
                });
            }
            else {
                jmlNode.dispatchEvent("onkeyup", {
                    keyCode: keyCode
                });
            }
        }
        
        this.oInput.onfocus = function(){
            if (this.host.initial && this.value == this.host.initial) {
                this.value = "";
                this.host.__setStyleClass(this.host.oExt, "", [this.host.baseCSSname + "Initial"]);
            }
        }
        
        this.oInput.onblur = function(){
            if (this.host.initial && this.value == "") {
                this.value = this.host.initial;
                this.host.__setStyleClass(this.host.oExt, this.host.baseCSSname + "Initial");
            }
        }
        
        if (!this.oInput.tagName.toLowerCase().match(/input|textarea/)) {
            this.isHTMLBox = true;
            
            this.oInput.unselectable    = "Off";
            this.oInput.contentEditable = true;
            this.oInput.style.width     = "1px";
            
            this.oInput.select = function(){
                var r = document.selection.createRange();
                r.moveToElementText(this);
                r.select();
            }
        }
        
        this.oInput.deselect = function(){
            if (!document.selection) 
                return;
            
            var r = document.selection.createRange();
            r.collapse();
            r.select();
        }
    }
    
    this.__loadJml = function(x){
        //Masking
        if (jpf.hasMsRangeObject) {
            this.mask = x.getAttribute("mask");
            if (this.mask) {
                masking = true;
                this.inherit(jpf.TextboxMask); /** @inherits jpf.TextboxMask */
                if (!this.mask.match(/PASSWORD/)) 
                    this.setMask(this.mask);
                this.maskmsg = x.getAttribute("maskmsg");
            }
        }
        
        //Initial Message
        this.initial = x.getAttribute("initial") || "";
        if (this.initial) {
            this.oInput.onblur();
            this.setValue(this.initial);
        }
        
        //Triggering and Focus
        this.changeTrigger = jpf.xmldb.getInheritedAttribute(x, "change") || "realtime";
        this.selectFocus   = x.getAttribute("focusselect") == "true";
        if (this.mask) {
            this.selectFocus   = false;
            this.changeTrigger = "enter";
        }
        
        if (this.selectFocus) {
            this.oInput.onmouseup = function(){
                if (focusSelect) {
                    this.select();
                    focusSelect = false;
                }
                
                this.host.dispatchEvent("onmouseup");
                return false;
            }
        }
        
        //Special validation support using nativate max-length browser support
        if (x.getAttribute("maxlength") && this.oInput.tagName.toLowerCase().match(/input|textarea/)) 
            this.oInput.maxLength = parseInt(x.getAttribute("maxlength"));
        
        //Autocomplete
        var ac = $xmlns(x, "autocomplete", jpf.ns.jpf)[0];
        if (ac) {
            this.inherit(jpf.TextboxAutocomplete); /** @inherits jpf.TextboxAutocomplete */
            this.initAutocomplete(ac);
        }
        
        if (x.getAttribute("width")) {
            this.oInput.style.width = this.oInput.parentNode.offsetWidth - 6 
                - Math.max(this.oButtonPlus.offsetWidth, this.oButtonMinus.offsetWidth) + "px";
        }
        
        jpf.JmlParser.parseChildren(this.jml, null, this);
    }
    
    this.__destroy = function(){
        this.oInput.onkeypress = this.oInput.onmousedown = 
        this.oInput.onkeydown = this.oInput.onkeyup = 
        this.oButtonPlus.onmouseover = this.oButtonPlus.onmouseout = 
        this.oButtonPlus.onmousedown = this.oButtonPlus.onmouseup = 
        this.oButtonMinus.onmouseover = this.oButtonMinus.onmouseout = 
        this.oButtonMinus.onmousedown = this.oButtonMinus.onmouseup = 
        this.oInput.onselectstart = null;
    }
    
    this.setMaximum = function(max){
        this.maximum = max;
    }
    
    this.setMinimum = function(min){
        this.minimum = min;
    }
}
