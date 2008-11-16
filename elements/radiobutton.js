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
 *
 * @inherits jpf.DataBinding
 * @inherits jpf.Validation
 * @inherits jpf.XForms
 */
jpf.radiogroup = jpf.component(jpf.NODE_HIDDEN, function(){
    this.radiobuttons = [];
    this.visible = true;
    
    this.$supportedProperties.push("value", "visible", "zindex", "disabled");
    this.$propHandlers["value"] = function(value){
        for (var i = 0; i < this.radiobuttons.length; i++) {
            if (this.radiobuttons[i].value == value) 
                return this.setCurrent(this.radiobuttons[i]);
        }
    };
    
    this.$propHandlers["zindex"] = function(value){
        for (var i = 0; i < this.radiobuttons.length; i++) {
            this.radiobuttons[i].setZIndex(value);
        }
    };
    
    this.$propHandlers["visible"] = function(value){
        if (value) {
            for (var i = 0; i < this.radiobuttons.length; i++) {
                this.radiobuttons[i].show();
            }
        }
        else {
            for (var i = 0; i < this.radiobuttons.length; i++) {
                this.radiobuttons[i].hide();
            }
        };
    }
    
    this.$propHandlers["disabled"] = function(value){
        this.disabled = false;
        /*
        if (value) {
            for (var i = 0; i < this.radiobuttons.length; i++) {
                this.radiobuttons[i].disable();
            }
        }
        else {
            for (var i = 0; i < this.radiobuttons.length; i++) {
                this.radiobuttons[i].enable();
            }
        }*/
    }
    
    /**
     * @private
     */
    this.addRadio = function(oRB){
        this.radiobuttons.push(oRB);
        if (!this.visible) {
            oRB.hide();
            //if(oRB.tNode)
            //oRB.tNode.style.display = "none";
        }
    };
    
    /**
     * @private
     */
    this.removeRadio = function(oRB){
        this.radiobuttons.remove(oRB);
    }
    
    /**
     * @copy Widget#setValue
     */
    this.setValue = function(value){
        for (var i = 0; i < this.radiobuttons.length; i++) {
            if (this.radiobuttons[i].value == value) {
                var oRB = this.radiobuttons[i];
                if (this.current && this.current != oRB) 
                    this.current.$uncheck();
                oRB.check(true);
                this.current = oRB;
                break;
            }
        }
        
        return this.setProperty("value", value);
        //return false;
    };
    
    /**
     * @private
     */
    this.setCurrent = function(oRB){
        if (this.current && this.current != oRB) 
            this.current.$uncheck();
        this.value = oRB.value;
        oRB.check(true);
        this.current = oRB;
    };
    
    /**
     * @copy Widget#getValue
     */
    this.getValue = function(){
        return this.current ? this.current.value : "";
    };
}).implement(
    // #ifdef __WITH_DATABINDING
    jpf.DataBinding,
    // #endif
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    jpf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    jpf.XForms
    //#endif
);

/**
 * Element displaying a two state button which is one of a grouped set.
 * Only one of these buttons in the set can be checked at the same time.
 * Example:
 * <code>
 *  <j:frame title="Options">
 *      <j:radiobutton>Option 1</radiobutton>
 *      <j:radiobutton>Option 2</radiobutton>
 *      <j:radiobutton>Option 3</radiobutton>
 *      <j:radiobutton>Option 4</radiobutton>
 *  </j:frame>
 * </code>
 * Example:
 * This example shows radio buttons with an explicit group set:
 * <code>
 *  <j:label>Options</j:label>
 *  <j:radiobutton group="g1">Option 1</radiobutton>
 *  <j:radiobutton group="g1">Option 2</radiobutton>
 *
 *  <j:label>Choices</j:label>
 *  <j:radiobutton group="g2">Choice 1</radiobutton>
 *  <j:radiobutton group="g2">Choice 2</radiobutton>
 * </code>
 *
 * @constructor
 * @define radiobutton
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @inherits jpf.Presentation
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.radiobutton = jpf.component(jpf.NODE_VISIBLE, function(){
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {
        "main": [["label", "text()"]]
    };
    // #endif
    
    this.$focussable = true; // This object can get the focus
    this.value       = this.uniqueId;
    var _self = this;
    
    /**** Properties and Attributes ****/
    
    this.$booleanProperties["checked"] = true;
    this.$supportedProperties.push("value", "background", "group", 
        "label", "checked");

    /**
     * @attribute {String} group the name of the group to which this radio 
     * button belongs. Only one item in the group can be checked at the same
     * time. When no group is specified the parent container functions as the
     * group; only one radiobutton within that parent can be checked.
     */
    this.$propHandlers["group"] = function(value){
        if (this.radiogroup)
            this.radiogroup.removeRadio(this);
        
        this.radiogroup = jpf.nameserver.get("radiogroup", value);
        if (!this.radiogroup) {
            var rg = new jpf.radiogroup(this.pHtmlNode, "radiogroup");
            
            rg.errBox     = this.errBox;
            rg.parentNode = this.parentNode; //is this one needed?
            
            jpf.nameserver.register("radiogroup", value, rg);
            jpf.setReference(value, rg);
            
            //x = oRB.$jml;
            //rg.oExt = oRB.oExt;
            rg.$jml = this.$jml;
            rg.loadJml(this.$jml);
            
            this.radiogroup = rg;
        }

        if (this.oInput) {
            this.oInput.setAttribute("name", this.group 
                || "radio" + this.radiogroup.uniqueId);
        }
        
        this.radiogroup.addRadio(this);
    };
    
    /**
     * @copy checkbox#label
     */
    this.$propHandlers["label"] = function(value){
        this.oLabel.innerHTML = value;
    };
    
    /**
     * @copy checkbox#checked
     */
    this.$propHandlers["checked"] = function(value){
        if (!this.radiogroup)
            return;
        
        if (value)
            this.radiogroup.setValue(this.value);
        else {
            //uncheck...
        }
    };
    
    /**
     * @copy basebutton#background
     */
    this.$propHandlers["background"] = function(value){
        var oNode = this.$getLayoutNode("main", "background", this.oExt);
        if (value) {
            var b = value.split("|");
            this.$background = b.concat(["vertical", 2, 16].slice(b.length - 1));
            
            oNode.style.backgroundImage  = "url(" + this.mediaPath + b[0] + ")";
            oNode.style.backgroundRepeat = "no-repeat";
        }
        else {
            oNode.style.backgroundImage  = "";
            oNode.style.backgroundRepeat = "";
            this.$background = null;
        }
    }
    
    /**** Public methods ****/
    
    /**
     * @copy Widget#setValue
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };
    
    /**
     * @copy Widget#getValue
     */
    this.getValue = function(){
        return this.value;
    };
    
    /**
     * @copy validation#setError
     */
    this.setError = function(value){
        this.$setStyleClass(this.oExt, this.baseCSSname + "Error");
    };
    
    /**
     * @copy validation#clearError
     */
    this.clearError = function(value){
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Error"]);
    };
    
    /**
     * @copy checkbox#check
     */
    this.check = function(visually){
        if (visually) {
            this.$setStyleClass(this.oExt, this.baseCSSname + "Checked");
            this.checked = true;
            if (this.oInput) 
                this.oInput.checked = true;
            this.doBgSwitch(2);
        }
        else
            this.radiogroup.change(this.value);
    };
    
    this.$uncheck = function(){
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Checked"]);
        this.checked = false;
        if (this.oInput) 
            this.oInput.checked = false;
        this.doBgSwitch(1);
    };
    
    /**** Private methods ****/
    
    this.$enable = function(){
        if (this.oInput) 
            this.oInput.disabled = false;

        this.oExt.onclick = function(e){
            if (!e) e = event;
            if ((e.srcElement || e.target) == this)
                return;
            
            _self.dispatchEvent("click", {
                htmlEvent: e
            });
            _self.radiogroup.change(_self.value);
        }
        
        this.oExt.onmousedown = function(e){
            if (!e) e = event;
            if ((e.srcElement || e.target) == this)
                return;
            
            jpf.setStyleClass(this, _self.baseCSSname + "Down");
        }
        
        this.oExt.onmouseout = 
        this.oExt.onmouseup  = function(){
            jpf.setStyleClass(this, "", [_self.baseCSSname + "Down"]);
        }
    };
    
    this.$disable = function(){
        if (this.oInput) 
            this.oInput.disabled = true;
        this.oExt.onclick = null
        this.oExt.onmousedown = null
    };
    
    /**
     * @private
     */
    this.doBgSwitch = function(nr){
        if (this.bgswitch && (this.bgoptions[1] >= nr || nr == 4)) {
            if (nr == 4) 
                nr = this.bgoptions[1] + 1;
            
            var strBG = this.bgoptions[0] == "vertical" 
                ? "0 -" + (parseInt(this.bgoptions[2]) * (nr - 1)) + "px" 
                : "-"   + (parseInt(this.bgoptions[2]) * (nr - 1)) + "px 0";
            
            this.$getLayoutNode("main", "background", this.oExt)
                .style.backgroundPosition = strBG;
        }
    };
    
    this.$focus = function(){
        if (!this.oExt) 
            return;
        if (this.oInput && this.oInput.disabled) 
            return false;
        
        this.$setStyleClass(this.oExt, this.baseCSSname + "Focus");
    };
    
    this.$blur = function(){
        if (!this.oExt) 
            return;
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    };
    
    /**** Keyboard support ****/
    
    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key = e.keyCode;
        
        if (key == 13 || key == 32) {
            //this.check();
            //this.radiogroup.current = this;
            this.radiogroup.change(this.value);
            return false;
        }
        //Up
        else if (key == 38) {
            var node = this;
            while (node && node.previousSibling) {
                node = node.previousSibling;
                if (node.tagName == "radiobutton" && !node.disabled 
                  && node.radiogroup == this.radiogroup) {
                    node.check();
                    node.focus();
                    return;
                }
            }
        }
        //Down
        else if (key == 40) {
            var node = this;
            while (node && node.nextSibling) {
                node = node.nextSibling;
                if (node.tagName == "radiobutton" && !node.disabled 
                  && node.radiogroup == this.radiogroup) {
                    node.check();
                    node.focus();
                    return;
                }
            }
        }
    }, true);
    // #endif
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInput = this.$getLayoutNode("main", "input", this.oExt);
        this.oLabel = this.$getLayoutNode("main", "label", this.oExt);
        
        /* #ifdef __WITH_EDITMODE
         if(this.editable)
         #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
        this.$makeEditable("main", this.oExt, this.$jml);
        // #endif
        
        this.enable();
    };
    
    this.$loadJml = function(x){
        if (x.firstChild) {
            var content = x.innerHTML;
            if (!content) {
                content = (x.xml || x.serialize())
                    .replace(/^<[^>]*>/, "")
                    .replace(/<\/\s*[^>]*>$/, "");
            }

            this.$handlePropSet("label", content);
        }

        if (!this.radiogroup) {
            this.$propHandlers["group"].call(this, 
                "radiogroup" + this.parentNode.uniqueId);
        }
        
        if (this.checked && !this.radiogroup.value)
            this.$propHandlers["checked"].call(this, this.checked);
    };
}).implement(
    jpf.Presentation
);

// #endif
