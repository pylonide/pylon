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
// #ifdef __JRADIOBUTTON || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * @constructor
 * @private
 */
jpf.radiogroup = function(oChild){
    jpf.register(this, "radiogroup", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = oChild.pHtmlNode
    
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    
    this.radiobuttons = [];
    this.isShowing    = true;
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.addRadio = function(oRB){
        this.radiobuttons.push(oRB);
        if (!this.isShowing) {
            oRB.hide();
            //if(oRB.tNode)
            //oRB.tNode.style.display = "none";
        }
    }
    
    this.setValue = function(value){
        for (var i = 0; i < this.radiobuttons.length; i++) {
            if (this.radiobuttons[i].check_value == value) {
                var oRB = this.radiobuttons[i];
                if (this.current && this.current != oRB) 
                    this.current.uncheck();
                oRB.check();
                this.current = oRB;
                break;
            }
        }
        
        return this.setProperty("value", value);
        //return false;
    }
    
    this.setCurrent = function(oRB){
        if (this.current && this.current != oRB) 
            this.current.uncheck();
        this.value = oRB.check_value;
        oRB.check();
        this.current = oRB;
    }
    
    this.getValue = function(){
        return this.current ? this.current.check_value : "";
    }
    
    this.__setCurrent = function(oRB){
        if (this.current) 
            this.current.uncheck();
        this.current = oRB;
        this.value = oRB.check_value;
        this.change(oRB.check_value);
    }
    
    this.disable = function(){
        for (var i = 0; i < this.radiobuttons.length; i++) {
            this.radiobuttons[i].disable();
        }
    }
    
    this.enable = function(){
        for (var i = 0; i < this.radiobuttons.length; i++) {
            this.radiobuttons[i].enable();
        }
    }
    
    this.setZIndex = function(value){
        for (var i = 0; i < this.radiobuttons.length; i++) {
            this.radiobuttons[i].setZIndex(value);
        }
    }
    
    this.show = function(){
        this.isShowing = true;
        for (var i = 0; i < this.radiobuttons.length; i++) {
            this.radiobuttons[i].show();
            //if(this.radiobuttons[i].tNode)
            //this.radiobuttons[i].tNode.style.display = "block";
        }
    }
    
    this.hide = function(){
        this.isShowing = false;
        for (var i = 0; i < this.radiobuttons.length; i++) {
            this.radiobuttons[i].hide();
            //if(this.radiobuttons[i].tNode)
            //this.radiobuttons[i].tNode.style.display = "none";
        }
    }
    
    this.focus = this.blur = function(){};
    
    //These should be moved to inside the form
    this.isValid = function(checkRequired){
        if (checkRequired && this.required) {
            var value = this.getValue();
            if (!value || value.toString().length == 0) 
                return false;
        }
        
        //for(var i=0;i<vRules.length;i++) if(!eval(vRules[i])) return false;
        //if(this.vRules.length) return eval("(" + this.vRules.join(") && (") + ")");
        return true;
    }
    
    this.init = function(oRB){
        if (this.inited) 
            return;
        
        x = oRB.jml;//.cloneNode(true);//.parentNode.insertBefore(oRB.jml.cloneNode(true), oChild.jml);
        //x.removeAttribute("value");
        this.oExt = oRB.oExt;
        
        // #ifdef __WITH_DATABINDING
        //this.processBindclass = oRB.processBindclass;
        //this.processBindclass(x);
        // #endif
        
        this.jml = x;
        
        //this.setCurrent(oRB);
        this.inited = true;
        
        return this;
    }
    
    this.init(oChild);
    
    this.__supportedProperties.push("value");
    this.__propHandlers["value"] = function(value){
        // Set Value
        for (var i = 0; i < this.radiobuttons.length; i++) {
            if (this.radiobuttons[i].check_value == value) 
                return this.setCurrent(this.radiobuttons[i]);
        }
    }
    
    this.draw = function(){};
    
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    //if(self.Validation) this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    this.loadJml(this.jml);
}

/**
 * Component displaying a rectangle which is one of a set of options
 * the user can choose to represent a value.
 *
 * @classDescription		This class creates a new radiobutton
 * @return {Radiobutton} Returns a new radiobutton
 * @type {Radiobutton}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:radiobutton
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.radiobutton = function(pHtmlNode){
    jpf.register(this, "radiobutton", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     Inheritance
     ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {
        "Main": [["label", "text()"]]
    };
    // #endif
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.__focussable = true; // This object can get the focus
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    //this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value){
        this.check_value = value;
    }
    
    this.getValue = function(){
        return this.checked ? this.check_value : null;
    }
    
    this.setError = function(value){
        this.__setStyleClass(this.oExt, this.baseCSSname + "Error");
    }
    
    this.clearError = function(value){
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Error"]);
    }
    
    this.__enable = function(){
        if (this.oInt) 
            this.oInt.disabled = false;
        
        if (this.oExt.tagName.toLowerCase() == "input") {
            this.oExt.onclick = function(e){
                this.host.dispatchEvent("onclick", {
                    htmlEvent: e || event
                });
                if (this.host.oInt.checked) {
                    //this.host.oContainer.setValue(this.host.check_value);
                    //this.host.oContainer.current = this.host;
                    this.host.oContainer.change(this.host.check_value);
                    //this.host.oContainer.setProperty("value", this.host.check_value);
                }
                //if(this.checked) this.host.oContainer.__setCurrent(this.host);
            }
        }
        else {
            this.oExt.onclick = function(e){
                this.host.dispatchEvent("onclick", {
                    htmlEvent: e || event
                });
                //this.host.oContainer.setValue(this.host.check_value);
                //this.host.oContainer.__setCurrent(this.host);
                //this.host.oContainer.current = this.host;
                this.host.oContainer.change(this.host.check_value);
                //this.host.oContainer.setProperty("value", this.host.check_value);
            }
        }
    }
    
    this.__disable = function(){
        if (this.oInt) 
            this.oInt.disabled = true;
        this.oExt.onclick = null
    }
    
    this.doBgSwitch = function(nr){
        if (this.bgswitch && (this.bgoptions[1] >= nr || nr == 4)) {
            if (nr == 4) 
                nr = this.bgoptions[1] + 1;
            
            var strBG = this.bgoptions[0] == "vertical" 
                ? "0 -" + (parseInt(this.bgoptions[2]) * (nr - 1)) + "px" 
                : "-"   + (parseInt(this.bgoptions[2]) * (nr - 1)) + "px 0";
            
            this.__getLayoutNode("main", "background", this.oExt)
                .style.backgroundPosition = strBG;
        }
    }
    
    this.check = function(){
        this.__setStyleClass(this.oExt, this.baseCSSname + "Checked");
        this.checked = true;
        if (this.oInt.tagName.toLowerCase() == "input") 
            this.oInt.checked = true;
        this.doBgSwitch(2);
    }
    
    this.uncheck = function(){
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Checked"]);
        this.checked = false;
        if (this.oInt.tagName.toLowerCase() == "input") 
            this.oInt.checked = false;
        this.doBgSwitch(1);
    }
    
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    /* ***********************
     Keyboard Support
     ************************/
    // #ifdef __WITH_KBSUPPORT
    this.keyHandler = function(key){
        this.dispatchEvent("onkeypress", {
            keyCode: key
        });
        
        if (key == 13 || key == 32) {
            //this.check();
            //this.oContainer.current = this;
            this.oContainer.change(this.check_value);
            return false;
        }
    }
    // #endif
    
    /* ***********************
     Focus
     ************************/
    this.__focus = function(){
        if (!this.oExt) 
            return;
        if (this.oInt && this.oInt.disabled) 
            return false;
        
        this.__setStyleClass(this.oExt, this.baseCSSname + "Focus");
    }
    
    this.__blur = function(){
        if (!this.oExt) 
            return;
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    }
    
    this.__focussable = true;
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(null, null, function(oExt){
            var oInt = this.__getLayoutNode("main", "input", oExt);
            if (oInt.tagName.toLowerCase() == "input") 
                oInt.setAttribute("name", this.jml.getAttribute("id"));
        });
        this.oInt = this.__getLayoutNode("main", "input", this.oExt);
        
        if (this.jml.firstChild) {
            this.tNode = this.__getLayoutNode("main", "label", this.oExt);
            if (!this.tNode) {
                this.tNode = document.createElement("span");
                this.tNode.className = "labelfont";
                pHtmlNode.insertBefore(this.tNode, this.oExt.nextSibling);
            }
            
            this.tNode.innerHTML = this.jml.xml 
                || (this.jml.serialize ? this.jml.serialize() : this.jml.innerHTML);
        }
        
        /* #ifdef __WITH_EDITMODE
         if(this.editable)
         #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
        this.__makeEditable("main", this.oExt, this.jml);
        // #endif
        
        this.enable();
        
        if (self[this.jml.getAttribute("id")].tagName != "radiogroup") {
            var oC        = new jpf.radiogroup(this);
            oC.name       = this.jml.getAttribute("id");
            oC.labelEl    = this.labelEl;
            oC.errBox     = this.errBox;
            oC.parentNode = this.parentNode;
            
            self[oC.name] = oC;
        }
        
        this.oContainer       = self[this.jml.getAttribute("id")];
        this.oContainer.addRadio(this);
        this.processBindclass = function(){};
    }
    
    this.__loadJml = function(x){
        this.name = x.getAttribute("id");
        this.check_value = x.getAttribute("value");
        
        this.bgswitch = x.getAttribute("bgswitch") ? true : false;
        if (this.bgswitch) {
            var oNode = this.__getLayoutNode("main", "background", this.oExt);
            oNode.style.backgroundImage  = "url(" + this.mediaPath 
                + x.getAttribute("bgswitch") + ")";
            oNode.style.backgroundRepeat = "no-repeat";
            
            this.bgoptions = x.getAttribute("bgoptions") 
                ? x.getAttribute("bgoptions").split("\|") 
                : ["vertical", 2, 16];
            if (!this.bgoptions[2]) 
                this.bgoptions[2] = parseInt(this.jml.getAttribute("height"));
        }
        
        this.form = this.oContainer.form;
        
        if (x.getAttribute("checked") == "true") 
            this.oContainer.setValue(this.check_value);//setCurrent(this);
    }
}

// #endif
