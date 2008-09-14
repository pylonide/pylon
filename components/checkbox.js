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

// #ifdef __JCHECKBOX || __INC_ALL
// #define __WITH_PRESENTATION 1
// #define __JBASEBUTTON 1

/**
 * Component displaying a clickable rectangle having two states which
 * can be toggled by user interaction.
 *
 * @classDescription		This class creates a new checkbox
 * @return {Checkbox} Returns a new checkbox
 * @type {Checkbox}
 * @constructor
 * @addnode components:checkbox
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.checkbox = function(pHtmlNode){
    jpf.register(this, "checkbox", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.BaseButton
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.Presentation, jpf.BaseButton, jpf.JmlNode);
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Main" : [["label","text()"]]};
    // #endif
    
    //Options
    this.__focussable = true; // This object can get the focus
    this.checked = false;
    this.values = [1, 0];
    
    // PUBLIC METHODS
    this.setValue = function(value){
        if (!this.values) return;
        this.setProperty("value", value);
    }
    
    this.getValue = function(){
        return this.XMLRoot ? this.values[this.checked ? 0 : 1] : this.value;
    }
    
    this.check = function(){
        this.setProperty("value", this.values[0]);
    }
    
    this.uncheck = function(){
        this.setProperty("value", this.values[1]);
    }
    
    this.setError = function(value){
        this.__setStyleClass(this.oExt, this.baseCSSname + "Error");
    }
    
    this.clearError = function(value){
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Error"]);
    }
    
    this.__enable = function(){
        if (this.oInt) this.oInt.disabled = false;
        this.__doBgSwitch(1);
    }
    
    this.__disable = function(){
        if (this.oInt) this.oInt.disabled = true;
        this.__doBgSwitch(4);
    }
    
    this.__doBgSwitch = function(nr){
        if (this.bgswitch && (this.bgoptions[1] >= nr || nr == 4)) {
            if (nr == 4) nr = this.bgoptions[1] + 1;
            
            var strBG = (this.bgoptions[0] == "vertical")
                ? "0 -" + (parseInt(this.bgoptions[2])*(nr-1)) + "px"
                : "-" + (parseInt(this.bgoptions[2])*(nr-1)) + "px 0";

            this.__getLayoutNode("Main", "background", this.oExt)
                .style.backgroundPosition = strBG;
        }
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/

    this.__supportedProperties.push("value");
    this.__propHandlers["value"] = function(value){
        this.value = 
        value      = (typeof value == "string" ? value.trim() : value);
        
        this.checked = (value !== undefined 
            && value.toString() == this.values[0].toString());

        if (!jpf.isNull(value) && value.toString() == this.values[0].toString())
            this.__setStyleClass(this.oExt, this.baseCSSname + "Checked");
        else
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Checked"]);
    }
    
    this.__setState = function(state, e, strEvent){
        if (this.disabled) return;

        this.__doBgSwitch(this.states[state]);
        this.__setStyleClass(this.oExt, (state != "Out" ? this.baseCSSname + state : ""),
            [this.baseCSSname + "Down", this.baseCSSname + "Over"]);
        this.state = state; // Store the current state so we can check on it coming here again.
        
        this.dispatchEvent(strEvent, e);
        
        if (state == "Down")
            jpf.cancelBubble(e, this);
        else
            e.cancelBubble = true;
    }
    
    this.__clickHandler = function(){
        this.checked = !this.checked;
        this.change(this.values[(this.checked) ? 0 : 1]);
        if (this.validate) this.validate();
        return true;		
    }
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oInt = this.__getLayoutNode("Main", "input", this.oExt);
        
        this.__setupEvents();
    }
    
    this.__loadJML = function(x){
        //this.value = x.getAttribute("value");
        if (x.getAttribute("checked") == "true")
            this.check();
        if (x.firstChild) {
            jpf.xmldb.setNodeValue(this.__getLayoutNode("Main", "label",
                this.oExt), x.firstChild.nodeValue);
        }
        
        /* #ifdef __WITH_EDITMODE
        if(this.editable)
        #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
        this.__makeEditable("Main", this.oExt, this.jml);
        // #endif
        
        this.bgswitch = x.getAttribute("bgswitch") ? true : false;
        if (this.bgswitch) {
            this.__getLayoutNode("Main", "background", this.oExt).style
                .backgroundImage = "url(" + this.mediaPath 
                + x.getAttribute("bgswitch") + ")";
            this.__getLayoutNode("Main", "background", this.oExt).style
                .backgroundRepeat = "no-repeat";

            this.bgoptions = x.getAttribute("bgoptions")
                ? x.getAttribute("bgoptions").split("\|")
                : ["vertical", 2, 16];
        }
        
        this.values = x.getAttribute("values")
            ? x.getAttribute("values").split("\|")
            : [1, 0];
    }
}

// #endif
