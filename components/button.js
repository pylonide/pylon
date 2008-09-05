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

// #ifdef __JBUTTON || __INC_ALL
// #define __WITH_PRESENTATION 1
// #define __JBASEBUTTON 1

/**
 * Component displaying a clickable rectangle that visually confirms the
 * user interaction and executes a command when clicked.
 *
 * @classDescription		This class creates a new button
 * @return {Button} Returns a new button
 * @type {Button}
 * @constructor
 * @addnode components:button, components:trigger, components:submit
 * @alias submit
 * @alias trigger
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.submit  = 
jpf.trigger = 
jpf.button  = function(pHtmlNode, tagName){
    jpf.register(this, tagName || "button", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     Inheritance
     ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {
        "Main": [["caption", "text()"]]
    };
    // #endif
    /* #ifdef __WITH_EDITMODE
     this.editableEvents = {"onclick":true}
     #endif */
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.focussable = true; // This object can get the focus
    this.value      = null;
    
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    this.setActive = this.__enable = function(){
        this.__doBgSwitch(1);
    }
    
    this.setInactive = this.__disable = function(){
        this.__doBgSwitch(4);
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Over",
            this.baseCSSname + "Down"]);
    }
    
    this.__doBgSwitch = function(nr){
        if (this.bgswitch && (this.bgoptions[1] >= nr || nr == 4)) {
            if (nr == 4) 
                nr = this.bgoptions[1] + 1;
            
            var strBG = this.bgoptions[0] == "vertical" 
                ? "0 -" + (parseInt(this.bgoptions[2]) * (nr - 1)) + "px" 
                : "-" + (parseInt(this.bgoptions[2]) * (nr - 1)) + "px 0";
            
            this.__getLayoutNode("Main", "background", 
                this.oExt).style.backgroundPosition = strBG;
        }
    }
    
    this.__setStateBehaviour = function(value){
        this.value     = value || false;
        this.isBoolean = true;
        this.__setStyleClass(this.oExt, this.baseCSSname + "Bool");
        
        if (this.value) {
            this.__setStyleClass(this.oExt, this.baseCSSname + "Down");
            this.__doBgSwitch(this.states["Down"]);
        }
    }
    
    this.__setNormalBehaviour = function(){
        this.value     = null;
        this.isBoolean = false;
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Bool"]);
    }
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    /**
     * @copy   Widget#setValue
     */
    this.setValue = function(value){
        if (value === undefined) 
            value = !this.value;
        this.value = value;
        
        if (this.value) 
            this.__setStyleClass(this.oExt, this.baseCSSname + "Down", 
                [this.baseCSSname + "Over"]);
        else 
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Down"]);
        
        this.dispatchEvent("onclick");
    }
    
    /**
     * Sets the text displayed as caption of this component.
     *
     * @param  {String}  value  required  The string to display.
     * @see    Validation
     */
    this.setCaption = function(value){
        if (this.oCaption) 
            this.oCaption.nodeValue = value;
    }
    
    /**
     * Sets the URL of the icon displayed on this component.
     *
     * @param  {String}  value  required  The URL to the location of the icon.
     * @see    Button
     * @see    ModalWindow
     */
    this.setIcon = function(url){
        if (!this.oIcon) return;
        
        if (this.oIcon.tagName == "img") 
            this.oIcon.setAttribute("src", this.iconPath + url);
        else 
            this.oIcon.style.backgroundImage = "url(" + this.iconPath + url + ")";
    }
    
    /**
     * @inherits jpf.JmlNode
     * @inherits jpf.BaseButton
     */
    this.inherit(jpf.JmlNode, jpf.BaseButton);
   
    this.__setState = function(state, e, strEvent){
        if (this.disabled) 
            return;
        
        this.__doBgSwitch(this.states[state]);
        this.__setStyleClass(this.oExt, (state != "Out" ? this.baseCSSname + state : ""),
            [(this.value ? "" : this.baseCSSname + "Down"), this.baseCSSname + "Over"]);
        this.dispatchEvent(strEvent, e);
        
        if (state != "Down") 
            e.cancelBubble = true;
    }
    
    this.draw = function(clear, parentNode, Node, transform){
        //Build Main Skin
        this.oExt     = this.__getExternal();
        this.oIcon    = this.__getLayoutNode("main", "icon", this.oExt);
        this.oCaption = this.__getLayoutNode("main", "caption", this.oExt);
        
        this.__setupEvents();
    }
    
    this.__clickHandler = function(){
        // This handles the actual OnClick action. Return true to redraw the button.
        if (this.isBoolean) {
            this.value = !this.value;
            return true;
        }
    }
    
    this.__supportedProperties = ["icon", "value", "tooltip", "state", "color", "caption", "action", "target"];
    this.__handlePropSet = function(prop, value){
        if (prop == "icon") 
            this.setIcon(value);
        else 
            if (prop == "value") 
                this.sValue = value;
            else 
                if (prop == "tooltip") 
                    this.oExt.setAttribute("title", value);
                else 
                    if (prop == "state") 
                        this.__setStateBehaviour(value == 1);
                    else 
                        if (prop == "color") 
                            this.oCaption.parentNode.style.color = value;
                        else 
                            if (prop == "caption") 
                                this.setCaption(value);
    }
    
    this.__loadJML = function(x){
        this.setCaption(x.firstChild ? x.firstChild.nodeValue : "");
        
        /* #ifdef __WITH_EDITMODE
         if(this.editable)
         #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
        this.__makeEditable("Main", this.oExt, this.jml);
        // #endif
        
        
        this.bgswitch = x.getAttribute("bgswitch") ? true : false;
        if (this.bgswitch) {
            var oNode = this.__getLayoutNode("main", "background", this.oExt);
            oNode.style.backgroundImage  = "url(" + this.mediaPath + x.getAttribute("bgswitch") + ")";
            oNode.style.backgroundRepeat = "no-repeat";
            
            this.bgoptions = x.getAttribute("bgoptions") 
                ? x.getAttribute("bgoptions").split("\|") 
                : ["vertical", 2, 16];
        }
        
        //this.__focus();
        
        // #ifdef __WITH_XFORMS
        
        //XForms support
        if (this.tagName == "trigger") {
            this.addEventListener("onclick", function(e){
                this.dispatchXFormsEvent("DOMActivate", e);
            });
        }
        
        //XForms support
        this.action = (this.tagName == "submit") 
            ? "submit" 
            : x.getAttribute("action");
        this.target = x.getAttribute("target");
        if (this.action == "submit") 
            this.submission = x.getAttribute("submission");
        
        this.addEventListener("onclick", function(e){
            if (!this.action) 
                return;
            var target;
            
            if (this.submission) {
                var submission = self[this.submission];
                if (!submission) 
                    throw new Error(jpf.formatErrorString(0, this, "Submission", "Could not find submission to execute action on '" + this.submission + "'", this.jml));
                
                submission.dispatchXFormsEvent("xforms-submit");
                
                return;
            }
            else 
                if (this.target) {
                    //#ifdef __DEBUG
                    if (!self[this.target]) 
                        throw new Error(jpf.formatErrorString(0, this, "Clicking on Button", "Could not find target to execute action on '" + this.target + "' with action '" + this.action + "'", this.jml));
                    //#endif
                    
                    target = self[this.target]
                }
                else {
                    var p = this;
                    while (p.parentNode) {
                        if (p[this.action]) {
                            target = p;
                            break;
                        }
                        p = p.parentNode;
                    };
                    
                    if (!target) {
                        target = this.getModel();
                        //#ifdef __DEBUG
                        if (!target) 
                            throw new Error(jpf.formatErrorString(0, this, "Clicking on Button", "Could not find target to for action '" + this.action + "'", this.jml));
                        //#endif
                    }
                }
            
            //#ifdef __DEBUG
            if (!target[this.action])
                throw new Error(jpf.formatErrorString(0, this, "Clicking on Button", "Could not find action on target.", this.jml));
            //#endif
            
            target[this.action]();
        });
        
        //if(x.getAttribute("condition")) this.condition = x.getAttribute("condition");
        //this.form.registerButton(this.action, this);
        
        // #endif
        
        jpf.JMLParser.parseChildren(this.jml, null, this);
        
        // #ifdef __DESKRUN
        // this.doOptimize(false);
        // #endif
    }
}
// #endif
