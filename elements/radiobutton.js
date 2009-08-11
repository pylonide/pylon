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
 * @inherits apf.DataBinding
 * @inherits apf.Validation
 * @inherits apf.XForms
 */
apf.radiogroup = apf.component(apf.NODE_HIDDEN, function(){
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
        this.disabled = value;

        if (value) {
            for (var i = 0; i < this.radiobuttons.length; i++) {
                this.radiobuttons[i].disable();
            }
        }
        else {
            for (var i = 0; i < this.radiobuttons.length; i++) {
                this.radiobuttons[i].enable();
            }
        }
    }

    /**
     * @private
     */
    this.addRadio = function(oRB){
        var id = this.radiobuttons.push(oRB) - 1;
        if (!this.visible) {
            oRB.hide();
            //if(oRB.tNode)
            //oRB.tNode.style.display = "none";
        }
        
        if (!oRB.value)
            oRB.value = String(id);

        if (this.value && oRB.value == this.value)
            this.setCurrent(oRB);
    };

    /**
     * @private
     */
    this.removeRadio = function(oRB){
        this.radiobuttons.remove(oRB);
    }

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
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
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.current ? this.current.value : "";
    };
}).implement(
    // #ifdef __WITH_DATABINDING
    apf.DataBinding
    // #endif
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    ,apf.Validation
    //#endif
    //#ifdef __WITH_XFORMS
    ,apf.XForms
    //#endif
);

/**
 * Element displaying a two state button which is one of a grouped set.
 * Only one of these buttons in the set can be checked at the same time.
 * Example:
 * <code>
 *  <a:frame title="Options">
 *      <a:radiobutton>Option 1</a:radiobutton>
 *      <a:radiobutton>Option 2</a:radiobutton>
 *      <a:radiobutton>Option 3</a:radiobutton>
 *      <a:radiobutton>Option 4</a:radiobutton>
 *  </a:frame>
 * </code>
 * Example:
 * This example shows radio buttons with an explicit group set:
 * <code>
 *  <a:label>Options</a:label>
 *  <a:radiobutton group="g1">Option 1</a:radiobutton>
 *  <a:radiobutton group="g1">Option 2</a:radiobutton>
 *
 *  <a:label>Choices</a:label>
 *  <a:radiobutton group="g2">Choice 1</a:radiobutton>
 *  <a:radiobutton group="g2">Choice 2</a:radiobutton>
 * </code>
 *
 * @constructor
 * @define radiobutton
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @inherits apf.Presentation
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the selection based on data loaded into this component.
 * <code>
 *  <a:radiobutton group="g2" bindings="bndExample" value="1">Choice 1</a:radiobutton>
 *  <a:radiobutton group="g2" value="2">Choice 2</a:radiobutton>
 *
 *  <a:bindings id="bndExample">
 *      <a:value select="@value" />
 *  </a:bindings>
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <a:radiobutton group="g2" ref="@value" value="1">Choice 1</a:radiobutton>
 *  <a:radiobutton group="g2" value="2">Choice 2</a:radiobutton>
 * </code>
 *
 * @event click Fires when the user presses a mousebutton while over this element and then let's the mousebutton go. 
 * @see baseclass.amlnode.event.afterchange
 */
apf.radiobutton = apf.component(apf.NODE_VISIBLE, function(){
    // #ifdef __WITH_EDITMODE
    this.editableParts = {
        "main": [["label", "text()"]]
    };
    // #endif

    this.$focussable = true; // This object can get the focus
    var _self = this;

    /**** Properties and Attributes ****/

    this.$booleanProperties["checked"] = true;
    this.$supportedProperties.push("value", "background", "group",
        "label", "checked", "tooltip", "icon");

    /**
     * @attribute {String} group the name of the group to which this radio
     * button belongs. Only one item in the group can be checked at the same
     * time. When no group is specified the parent container functions as the
     * group; only one radiobutton within that parent can be checked.
     */
    this.$propHandlers["group"] = function(value){
        if (this.radiogroup)
            this.radiogroup.removeRadio(this);

        this.radiogroup = apf.nameserver.get("radiogroup", value);
        if (!this.radiogroup) {
            var rg = new apf.radiogroup(this.pHtmlNode, "radiogroup");
            
            rg.id = rg.name = value;
            rg.errBox     = this.errBox;
            rg.parentNode = this.parentNode; //is this one needed?

            apf.nameserver.register("radiogroup", value, rg);
            apf.setReference(value, rg);

            //x = oRB.$aml;
            //rg.oExt = oRB.oExt;
            rg.$aml = this.$aml;
            rg.loadAml(this.$aml);

            this.radiogroup = rg;
        }
        
        if (this.oInput) {
            this.oInput.setAttribute("name", this.group
                || "radio" + this.radiogroup.uniqueId);
        }

        if (!this.value && this.$aml)
            this.value = this.$aml.getAttribute("value");
        
        this.radiogroup.addRadio(this);
        
        if (this.checked)
            this.radiogroup.setValue(this.value);
    };
    
    /**
     * @attribute {String} tooltip the tooltip of this radio button.
     */
    this.$propHandlers["tooltip"] = function(value){
        this.oExt.setAttribute("title", value);
    };

    /**
     * @attribute {String} icon the icon for this radiobutton
     */
    this.$propHandlers["icon"] = function(value){
        // #ifdef __DEBUG
        if (!this.oIcon)
            return apf.console.warn("No icon defined in the Button skin", "button");
        /* #else
        if (!this.oIcon) return;
        #endif */

        if (value)
            this.$setStyleClass(this.oExt, this.baseCSSname + "Icon");
        else
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Icon"]);

        apf.skins.setIcon(this.oIcon, value, this.iconPath);
    };

    /**
     * @attribute {String} label the label for this radiobutton
     */
    this.$propHandlers["label"] = function(value){
        if (value)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Empty"]);
        else
            this.$setStyleClass(this.oExt, this.baseCSSname + "Empty");
        
        if (this.oLabel)
            this.oLabel.innerHTML = value;
    };

    /**
     * @attribute {String} checked whether this radiobutton is the checked one in the group it belongs to.
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
     * @attribute {string} background sets a multistate background. The arguments
     * are seperated by pipes '|' and are in the order of:
     * 'imagefilename|mapdirection|nrofstates|imagesize'
     * The mapdirection argument may have the value of 'vertical' or 'horizontal'.
     * The nrofstates argument specifies the number of states the iconfile contains:
     * 1 - normal
     * 2 - normal, hover
     * 3 - normal, hover, down
     * 4 - normal, hover, down, disabled
     * The imagesize argument specifies how high or wide each icon is inside the
     * map, depending of the mapdirection argument.
     *
     * Example:
     * A 3 state picture where each state is 16px high, vertically spaced
     * <code>
     * background="threestates.gif|vertical|3|16"
     * </code>
     * @see baseclass.basebutton
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
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.value;
    };

    /**
     *    @private
     */
    this.setError = function(value){
        this.$setStyleClass(this.oExt, this.baseCSSname + "Error");
    };

    /**
     *    @private
     */
    this.clearError = function(value){
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Error"]);
    };

    /**
     * Sets the checked state and related value
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

            apf.setStyleClass(this, _self.baseCSSname + "Down");
        }

        this.oExt.onmouseover = function(e){
            if (!e) e = event;
            if ((e.srcElement || e.target) == this)
                return;

            apf.setStyleClass(this, _self.baseCSSname + "Over");
        }

        this.oExt.onmouseout =
        this.oExt.onmouseup  = function(){
            apf.setStyleClass(this, "", [_self.baseCSSname + "Down", _self.baseCSSname + "Over"]);
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
        this.oIcon  = this.$getLayoutNode("main", "icon", this.oExt);

        this.enable();
    };

    this.$loadAml = function(x){
        if (x.firstChild) {
            var content = x.innerHTML;
            if (!content) {
                content = (x.xml || x.serialize())
                    .replace(/^<[^>]*>/, "")
                    .replace(/<\/\s*[^>]*>$/, "");
            }

            this.setProperty("label", content);
        }

        if (!this.radiogroup) {
            this.$propHandlers["group"].call(this,
                "radiogroup" + this.parentNode.uniqueId);
        }

        if (this.checked && !this.radiogroup.value)
            this.$propHandlers["checked"].call(this, this.checked);
    };
    
    this.$destroy = function(){
        if (this.radiogroup)
            this.radiogroup.removeRadio(this, true);
    }
}).implement(
    apf.Presentation
);

// #endif
