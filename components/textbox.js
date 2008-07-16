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
    jpf.register(this, tagName || "textbox", GUI_NODE);/** @inherits jpf.Class */

    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
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
    this.focussable = true; // This object can get the focus
    this.nonSizingHeight = true;
    //#ifdef __WITH_VALIDATIOn
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    
    var focusSelect = false;
    var masking = false;
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/

    this.setValue = function(value){
        return this.setProperty("value", value);
    }
    
    this.__clear = function(){
        this.value = "";
        
        if(this.oInt.tagName.toLowerCase().match(/input|textarea/i)) this.oInt.value = "";
        else{
            this.oInt.innerHTML = "";
            //try{this.oInt.focus();}catch(e){}
            
            if(!jpf.hasMsRangeObject) return;
            
            //will fail when object isn't visible
            //N.B. why a select in a clear function.. isn't consistent...
            try{
                var range = document.selection.createRange();
                range.moveStart("sentence", -1);
                //range.text = "";
                range.select();
            }catch(e){}
        }
    }
    
    this.getValue = function(){
        return this.isHTMLBox ? this.oInt.innerHTML : this.oInt.value;
    }
    
    this.insert = function(text){
        if(jpf.hasMsRangeObject){
            try{this.oInt.focus();}catch(e){}
            var range = document.selection.createRange();
            if(this.oninsert) text = this.oninsert(text);
            range.pasteHTML(text);
            range.collapse(true);
            range.select();
        }
        else{
            this.oInt.value += text;
        }
    }
    
    this.__enable = function(){this.oInt.disabled = false;}
    this.__disable = function(){this.oInt.disabled = true;}
    this.select = function(){this.oInt.select();}
    this.deselect = function(){this.oInt.deselect();}
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/

    this.__insertData = function(str){
        return this.setValue(str);
    }	
    
    /* ***********************
        Keyboard Support
    ************************/
    this.keyHandler = function(){}
    
    //Normal
    this.keyHandlerWA = function(key, ctrlKey, shiftKey, altKey, e){
        if(this.dispatchEvent("onkeydown", {keyCode : key, ctrlKey : ctrlKey, shiftKey : shiftKey, altKey : altKey, htmlEvent : e}) === false) return false;
        
        if(false && jpf.isIE && (key == 86 && ctrlKey || key == 45 && shiftKey)){
            var text = window.clipboardData.getData("Text");
            if((text = this.dispatchEvent("onkeydown", {text : this.onpaste(text)}) === false)) return false;
            if(!text) text = window.clipboardData.getData("Text");
            
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
        if(!this.oExt || this.oExt.disabled) return;
        this.__setStyleClass(this.oExt, this.baseCSSname + "Focus");
        
        try{this.oInt.focus();}catch(e){}
        if(masking) this.setPosition();
        
        if(this.selectFocus){
            focusSelect = true;
            this.select();
        }
    }
    
    this.__blur = function(){
        if(!this.oExt) return;
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
        
        if(masking){
            var r = this.oExt.createTextRange();
            r.collapse();
            r.select();
        }
        
        try{
            this.oExt.blur();
            document.body.focus();
        }catch(e){}
        
        if(this.changeTrigger == "enter")
            this.change(this.getValue());
            
        focusSelect = false;
        // check if we clicked on the oContainer. ifso dont hide it
        if(this.oContainer)
            setTimeout('var o = jpf.lookup(' + this.uniqueId + ');o.oContainer.style.display = "none"', 100);
    }
    
    this.__supportedProperties = ["value"];
    this.__handlePropSet = function(prop, value){
        switch(prop){
            case "value":
                // Set Value
                if(this.isHTMLBox){
                    if(this.oInt.innerHTML != value)
                        this.oInt.innerHTML = value;
                }
                else if(this.oInt.value != value){
                    this.oInt.value = value;
                }
            break;
        }
    }
    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(null, null, function(oExt){
            if(this.jml.getAttribute("mask") == "PASSWORD" || this.tagName == "secret"){
                this.jml.removeAttribute("mask");
                this.__getLayoutNode("main", "input").setAttribute("type", "password");
            }
            
            oExt.setAttribute("onmousedown", 'this.host.dispatchEvent("onmousedown", {htmlEvent : event});');
            oExt.setAttribute("onmouseup", 'this.host.dispatchEvent("onmouseup", {htmlEvent : event});');
            oExt.setAttribute("onclick", 'this.host.dispatchEvent("onclick", {htmlEvent : event});');
        }); 
        this.oInt = this.__getLayoutNode("main", "input", this.oExt);	
        
        if(!jpf.hasContentEditable && !this.oInt.tagName.toLowerCase().match(/input|textarea/)){
            var node = this.oInt;
            this.oInt = node.parentNode.insertBefore(document.createElement("textarea"), node);
            node.parentNode.removeChild(node);
            this.oInt.className = node.className;
            if(this.oExt == node) this.oExt = this.oInt;
        }
        
        this.oInt.onselectstart = function(e){if(!e) e = event;e.cancelBubble = true}
        this.oInt.host = this;
        
        //temp fix
        this.oInt.onkeydown = function(e){
            if(this.disabled) return false;
            
            if(!e) e = event;
            
            //Change
            if(this.host.changeTrigger == "enter")
                if(e.keyCode == 13) this.host.change(this.host.getValue());
            else if(jpf.isSafari && this.host.XMLRoot) //safari issue (only old??)
                setTimeout('var o = jpf.lookup(' + this.host.uniqueId + ');o.change(o.getValue())');
            
            if(e.ctrlKey && (e.keyCode == 66 || e.keyCode == 73 || e.keyCode == 85)) return false; 
            
            //Autocomplete
            if(this.host.oContainer){
                var oTxt = this.host;
                var keyCode = e.keyCode;
                setTimeout(function(){oTxt.fillAutocomplete(keyCode);});
            }
            
            //Non masking
            if(!this.host.mask) return this.host.keyHandlerWA(e.keyCode, e.ctrlKey, e.shiftKey, e.altKey, e);
        }
        
        this.oInt.onkeyup = function(e){
            var keyCode = (e||event).keyCode, jmlNode = this.host;

            if(this.host.changeTrigger != "enter") {
                setTimeout(function(){
                    if(!jmlNode.mask) jmlNode.change(jmlNode.getValue()); //this is a hack
                    jmlNode.dispatchEvent("onkeyup", {keyCode : keyCode});
                });
            }
            else{
                jmlNode.dispatchEvent("onkeyup", {keyCode : keyCode});
            }
        }

        this.oInt.onfocus = function(){
            if(this.host.initial && this.value == this.host.initial){
                this.value = "";
                this.host.__setStyleClass(this.host.oExt, "", [this.host.baseCSSname + "Initial"]);
            }
        }
        
        this.oInt.onblur = function(){
            if(this.host.initial && this.value == ""){
                this.value = this.host.initial;
                this.host.__setStyleClass(this.host.oExt, this.host.baseCSSname + "Initial");
            }
        }

        if(!this.oInt.tagName.toLowerCase().match(/input|textarea/)){
            this.isHTMLBox = true;
            
            this.oInt.unselectable = "Off";
            this.oInt.contentEditable = true;
            this.oInt.style.width = "1px";
            
            this.oInt.select = function(){
                var r = document.selection.createRange();
                r.moveToElementText(this);
                r.select();
            }
        }
        
        this.oInt.deselect = function(){
            if(!document.selection) return;
            
            var r = document.selection.createRange();
            r.collapse();
            r.select();
        }
    }

    this.__loadJML = function(x){
        //Masking
        if(jpf.hasMsRangeObject){
            this.mask = x.getAttribute("mask");
            if(this.mask){
                masking = true;
                this.inherit(jpf.TextboxMask); /** @inherits jpf.TextboxMask */
                if(!this.mask.match(/PASSWORD/)) this.setMask(this.mask);
                this.maskmsg = x.getAttribute("maskmsg");
            }
        }
        
        //Initial Message
        this.initial = x.getAttribute("initial") || "";
        if(this.initial){
            this.oInt.onblur();
            this.setValue(this.initial);
        }
        
        //Triggering and Focus
        this.changeTrigger = jpf.XMLDatabase.getInheritedAttribute(x, "change") || "realtime";
        this.selectFocus = x.getAttribute("focusselect") == "true";
        if(this.mask){
            this.selectFocus = false;
            this.changeTrigger = "enter";
        }

        if(this.selectFocus){
            this.oInt.onmouseup = function(){
                if(focusSelect){
                    this.select();
                    focusSelect=false;
                }
                
                this.host.dispatchEvent("onmouseup");
                return false;
            }
        }
        
        //Special validation support using nativate max-length browser support
        if(x.getAttribute("maxlength") && this.oInt.tagName.toLowerCase().match(/input|textarea/))
            this.oInt.maxLength = parseInt(x.getAttribute("maxlength"));
        
        //Autocomplete
        var ac = $xmlns(x, "autocomplete", jpf.ns.jpf)[0];
        if(ac){
            this.inherit(jpf.TextboxAutocomplete); /** @inherits jpf.TextboxAutocomplete */
            this.initAutocomplete(ac);
        }
        
        jpf.JMLParser.parseChildren(this.jml, null, this);
    }
    
    this.__destroy = function(){
        this.oInt.onkeypress = 
        this.oInt.onmouseup = 
        this.oInt.onkeydown = 
        this.oInt.onkeyup = 
        this.oInt.onselectstart = null;
    }
}

/**
 * @constructor
 * @private
 */
jpf.TextboxMask = function(){
    /*
        Special Masking Values:
        - PASSWORD
        
        <j:Textbox name="custref" mask="CS20999999" maskmsg="" validation="/CS200[3-5]\d{4}/" invalidmsg="" bind="custref/text()" />
    */
    
    var _FALSE_ = 9128748732;

    var _REF = {
        "0" : "\\d",
        "1" : "[12]",
        "9" : "[\\d ]",
        "#" : "[\\d +-]",
        "L" : "[A-Za-z]",
        "?" : "[A-Za-z ]",
        "A" : "[A-Za-z0-9]",
        "a" : "[A-Za-z0-9 ]",
        "X" : "[0-9A-Fa-f]",
        "V" : "[0-9A-Fa-fV]", //Vonage virtual mac address
        "x" : "[0-9A-Fa-f ]",
        "&" : "[^\s]",
        "C" : "."
    };

    var lastPos = -1;
    var masking = false;
    var initial, pos, myvalue, format, fcase, replaceChar, oExt = this.oExt;

    this.setPosition = function(setpos){
        setPosition(setpos || lastPos || 0);
    }

    this.__clear = function(){
        this.value = "";
        if(this.mask) return this.setValue("");
    }
    
    this.__supportedProperties = ["value"];
    this.__handlePropSet = function(prop, value){
        switch(prop){
            case "value":
                var data = "";
                if(this.includeNonTypedChars){
                    for(var i=0;i<initial.length;i++){
                        if(initial.substr(i,1) != value.substr(i,1)) data += value.substr(i,1);//initial.substr(i,1) == replaceChar
                    }
                }
                
                this.__insertData(data || value);
            break;
        }
    }
    
    /* ***********************
            Keyboard Support
    ************************/
    
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey, e){
        if(this.dispatchEvent("onkeydown", {keyCode : key, ctrlKey : ctrlKey, shiftKey : shiftKey, altKey : altKey, htmlEvent : e}) === false) return false;

        switch(key){
            case 39:	
            //RIGHT
                setPosition(lastPos+1);
            break;
            case 37:
            //LEFT
                setPosition(lastPos-1);
            break;
            case 35:
            case 34:
                setPosition(myvalue.length);
            break;
            case 33:
            case 36:
                setPosition(0);
            break;
            case 8:
            //BACKSPACE
                deletePosition(lastPos-1);
                setPosition(lastPos-1);
            break;
            case 46:
            //DEL
                deletePosition(lastPos);
                setPosition(lastPos);
            break;
            default:
                if(key == 67 && ctrlKey)
                    window.clipboardData.setData("Text", this.getValue());  
                /*else if((key == 86 && ctrlKey) || (shiftKey && key == 45)){
                    this.setValue(window.clipboardData.getData("Text"));
                    setPosition(lastPos);
                }*/
                else return;
            break;
        }
            
        return false
    }
    
    /* ***********************
            Init
    ************************/
    
    this.__initMasking = function(){
        ///this.keyHandler = this._keyHandler;
        this.keyHandlerWA = this._keyHandler; //temp solution
        masking = true;

        this.oInt.onkeypress = function(){
            var chr = String.fromCharCode(self.event.keyCode);
            chr = (self.event.shiftKey ? chr.toUpperCase() : chr.toLowerCase());
            if(setCharacter(chr)) setPosition(lastPos + 1);

            return false;
        }
        
        this.oInt.onmouseup = function(){
         var pos = Math.min(calcPosFromCursor(), myvalue.length);
         setPosition(pos);
         return false;
     }
        
        this.oInt.onpaste = function(){
            event.returnValue = false;
            this.host.setValue(window.clipboardData.getData("Text") || "");
            //setPosition(lastPos);
            setTimeout(function(){setPosition(lastPos);}, 1); //HACK good enough for now...
        }
        
        this.getValue = function(){
            if(this.includeNonTypedChars) return initial == this.oInt.value ? "" : this.oInt.value.replace(new RegExp(replaceChar, "g"), "");
            else return myvalue.join("");
        }
        
        this.setValue = function(value){
            if(this.includeNonTypedChars){
                for(var data="",i=0;i<initial.length;i++){
                    if(initial.substr(i,1) != value.substr(i,1)) data += value.substr(i,1);//initial.substr(i,1) == replaceChar
                }
            }
            this.__insertData(data);
        }
    }
    
    this.setMask = function(m){
        if(!masking) this.__initMasking();
        
        var m = m.split(";");
        replaceChar = m.pop();
        this.includeNonTypedChars = parseInt(m.pop()) !== 0, mask = m.join(""); //why a join here???
        var validation = "", visual="", mode_case="-", strmode = false, startRight = false, chr;
        pos=[], format="", fcase="";
        
        for(var looppos=-1,i=0;i<mask.length;i++){
            chr = mask.substr(i,1);
            
            if(!chr.match(/[\!\'\"\>\<\\]/)) looppos++;
            else{
                if(chr == "!") startRight = true;
                else if(chr == "<" || chr == ">") mode_case = chr;
                else if(chr == "'" || chr == "\"") strmode = !strmode;
                continue;
            }
            
            if(!strmode && _REF[chr]){
                pos.push(looppos);
                visual += replaceChar;
                format += chr;
                fcase += mode_case;
                validation += _REF[chr];
            }
            else visual += chr;
        }

        this.oInt.value = visual;
        initial = visual;
        //pos = pos;
        myvalue = [];
        //format = format;
        //fcase = fcase;
        replaceChar = replaceChar;
        
        //setPosition(0);//startRight ? pos.length-1 : 0);
        
        //validation..
        //forgot \ escaping...
    }
    
    function checkChar(chr, p){
        var f = format.substr(p, 1);
        var c = fcase.substr(p, 1);
    
        if(chr.match(new RegExp(_REF[f])) == null) return _FALSE_;
        if(c == ">") return chr.toUpperCase();
        if(c == "<") return chr.toLowerCase();
        return chr;
    }
    
    function setPosition(p){
        if(p < 0) p = 0;

        var range = oExt.createTextRange();
        range.expand("textedit");
        range.select();
        
        if(pos[p] == null){
            range.collapse(false);
            range.select();
            lastPos = pos.length;
            return false;
        }
        
        range.collapse();
        range.moveStart("character", pos[p]);
        range.moveEnd("character", 1);
        range.select();

        lastPos = p;
    }
    
    function setCharacter(chr){
        if(pos[lastPos] == null) return false;
        
        var chr = checkChar(chr, lastPos);
        if(chr == _FALSE_) return false;

        var range = oExt.createTextRange();
        range.expand("textedit");
        range.collapse();
        range.moveStart("character", pos[lastPos]);
        range.moveEnd("character", 1);
        range.text = chr;
        if(jpf.window.getFocussedObject == this) range.select();
        
        myvalue[lastPos] = chr;
        
        return true;
    }
    
    function deletePosition(p){
        if(pos[p] == null) return false;
        
        var range = oExt.createTextRange();
        range.expand("textedit");
        range.collapse();
        range.moveStart("character", pos[p]);
        range.moveEnd("character", 1);
        range.text = replaceChar;
        range.select();
        
        //ipv lastPos
        myvalue[p] = " ";
    }
    
    this.__insertData = function(str){
        if(str == this.getValue()) return;
        str = this.dispatchEvent("oninsert", {data : str}) || str;
        
        if(!str){
            if(!this.getValue()) return; //maybe not so good fix... might still flicker when content is cleared
            for(var i=this.getValue().length-1;i>=0;i--) deletePosition(i);
            setPosition(0);	
            return;
        }
        
        for(var i=0;i<str.length;i++){
            lastPos = i;
            setCharacter(str.substr(i,1));
        }
        if(str.length) lastPos++;
    }
    
    function calcPosFromCursor(){
        var range = document.selection.createRange();
        r2 = range.duplicate();
        r2.expand("textedit");
        r2.setEndPoint("EndToStart", range);
        var lt = r2.text.length;
    
        for(var i=0;i<pos.length;i++)
            if(pos[i] > lt) return i == 0 ? 0 : i-1;
    }
}

/**
 * @constructor
 * @private
 */
jpf.TextboxAutocomplete = function(){
    /*
        missing features:
        - web service based autocomplete
    */
    var autocomplete = {};
    
    this.initAutocomplete = function(ac){
        ac.parentNode.removeChild(ac);
        autocomplete.nodeset = ac.getAttribute("nodeset").split(":");
        autocomplete.method = ac.getAttribute("method");
        autocomplete.value = ac.getAttribute("value");
        autocomplete.count = parseInt(ac.getAttribute("count")) || 5;
        autocomplete.sort = ac.getAttribute("sort");
        autocomplete.lastStart = -1;
        
        this.oContainer = jpf.XMLDatabase.htmlImport(this.__getLayoutNode("container"), this.oExt.parentNode, this.oExt.nextSibling);	
    }
    
    this.fillAutocomplete = function(keyCode){
        if(keyCode){
            switch(keyCode){
                case 9:
                case 27: 
                case 13:  
                    return this.oContainer.style.display = "none";
                case 40: //DOWN
                    if(autocomplete.suggestData && autocomplete.lastStart < autocomplete.suggestData.length){
                        this.clear();
                        var value = autocomplete.suggestData[autocomplete.lastStart++];
                        this.oInt.value = value; //hack!
                        this.change(value);
                        //this.oInt.select(); this.oInt.focus();
                        this.oContainer.style.display = "none";
                        return;
                    }
                break;
                case 38: //UP
                    if(autocomplete.lastStart > 0){
                        if(autocomplete.lastStart >= autocomplete.suggestData.length) 
                            autocomplete.lastStart = autocomplete.suggestData.length - 1;

                        this.clear();
                        var value = autocomplete.suggestData[autocomplete.lastStart--];
                        this.oInt.value = value; //hack!
                        this.change(value);
                        //this.oInt.select(); this.oInt.focus();
                        this.oContainer.style.display = "none";
                        return;
                    }
                break;
            }
            
            if(keyCode > 10 && keyCode < 20) return;
        }
        
        if(autocomplete.method){
            var start=0, suggestData = self[autocomplete.method]();
            autocomplete.count = suggestData.length;
        }
        else{
            if(this.oInt.value.length==0){
                this.oContainer.style.display = "none";
                return;
            }
            if(!autocomplete.suggestData){
                //Get data from model
                var nodes = self[autocomplete.nodeset[0]].data.selectNodes(autocomplete.nodeset[1]);
                for(var value, suggestData=[],i=0;i<nodes.length;i++){
                    value = jpf.getXmlValue(nodes[i], autocomplete.value);
                    if(value) suggestData.push(value.toLowerCase());
                }
                if(autocomplete.sort) suggestData.sort();
                autocomplete.suggestData = suggestData;
            }
            else{
                suggestData = autocomplete.suggestData;
            }
            
            //Find Startpoint in lookup list
            var value = this.oInt.value.toUpperCase();
            for(var start=suggestData.length-autocomplete.count,i=0;i<suggestData.length;i++){
                if(value <= suggestData[i].toUpperCase()){
                    start = i;
                    break;
                }
            }
            
            autocomplete.lastStart = start;
        }
        
        //Create html items
        this.oContainer.innerHTML = "";
        
        for(var arr=[],j=start;j<Math.min(start+autocomplete.count, suggestData.length);j++){
            this.__getNewContext("item")
            var oItem = this.__getLayoutNode("item");
            jpf.XMLDatabase.setNodeValue(this.__getLayoutNode("item", "caption"), suggestData[j]);
            
            oItem.setAttribute("onmouseover", 'this.className = "hover"');
            oItem.setAttribute("onmouseout", 'this.className = ""');
            oItem.setAttribute("onmousedown", 'event.cancelBubble = true');
            oItem.setAttribute("onclick", 'var o = jpf.lookup(' + this.uniqueId + ');o.oInt.value = this.innerHTML;o.change(this.innerHTML);o.oInt.select();o.oInt.focus();o.oContainer.style.display = "none";');
            
            arr.push(this.__getLayoutNode("item"));
        }
        jpf.XMLDatabase.htmlImport(arr, this.oContainer);
        
        this.oContainer.style.display = "block";
    }
    
    this.setAutocomplete = function(model, traverse, value){
        autocomplete.lastStart = -1;
        autocomplete.suggestData = null;
        
        autocomplete.nodeset = [model, traverse];
        autocomplete.value = value;
        this.oContainer.style.display = "none";
    }
}

// #endif