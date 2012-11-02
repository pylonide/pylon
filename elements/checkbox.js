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

// #ifdef __AMLCHECKBOX || __INC_ALL

/**
 * This element displays a clickable rectangle with two states that
 * can be toggled by user interaction.
 * 
 * #### Example: Setting and Retrieving Values
 *
 * ```xml, demo
 * <a:application xmlns:a="http://ajax.org/2005/aml">
 *   <!-- startcontent -->
 *   <a:checkbox 
 *   id      = "ch1" 
 *   values  = "full|empty" 
 *   checked = "true">Full</a:checkbox>
 *   <a:textbox value="the glass is {ch1.value}"></a:textbox>
 *   <!-- endcontent -->
 * </a:application>
 * ```
 *
 * #### Example: Disabled Values
 *
 * ```xml, demo
 * <a:application xmlns:a="http://ajax.org/2005/aml">
 *   <!-- startcontent -->
 *   <a:checkbox checked="true">Option 1</a:checkbox>
 *   <a:checkbox>Option 2</a:checkbox>
 *   <a:checkbox checked="true" disabled="true">Option 3</a:checkbox>
 *   <a:checkbox disabled="true">Option 4</a:checkbox>
 *   <a:checkbox label="Option 5" />
 *   <a:checkbox label="Option 6" />
 *   <!-- endcontent -->
 * </a:application>
 * ```
 * 
 * @class apf.checkbox
 *
 * @define checkbox
 *
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 * @form
 * @inherits apf.BaseButton
 * @inheritsElsewhere apf.XForms
 *
 */
/**
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * 
 * #### Example
 *
 * Sets the value of the checkbox based on data loaded into this component.
 * ```xml
 *  <a:model id="mdlCheckbox">
 *      <data answer="Something"></data>
 *  </a:model>
 *  <a:checkbox 
 *    model = "mdlCheckbox" 
 *    value = "[@answer]">Caption</a:checkbox>
 * ```
 *
 * A shorter way to write this is:
 * 
 * ```xml
 *  <a:model id="mdlCheckbox">
 *      <data answer="Something"></data>
 *  </a:model>
 *  <a:checkbox value="[mdlCheckbox::@answer]">Caption</a:checkbox>
 * ```
 */
apf.checkbox = function(struct, tagName){
    this.$init(tagName || "checkbox", apf.NODE_VISIBLE, struct);
};

(function() {
    this.implement(
        //#ifdef __WITH_XFORMS
        //apf.XForms
        //#endif
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
    );

    //Options
    this.$focussable = apf.KEYBOARD; // This object can get the focus
    this.checked     = false;

    // *** Properties and Attributes *** //

    this.$booleanProperties["checked"] = true;
    this.$supportedProperties.push("value", "checked", "label", "values");

    /**
     * @attribute {String}  value   Sets or gets the value of this element.
     */
    this.$propHandlers["value"] = function(value){
        value = (typeof value == "string" ? value.trim() : value);

        if (value == "" && this["default"])
            value = this.value = apf.isTrue(this["default"]);

        if (this.$values) {
            this.checked = (typeof value != "undefined" && value !== null
                && value.toString() == this.$values[0].toString());
        }
        else {
            this.checked = apf.isTrue(value);
        }
        
        if (this.checked)
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Checked");
        else
            apf.setStyleClass(this.$ext, "", [this.$baseCSSname + "Checked"]);
    };

    /**
     * @attribute {Boolean} checked  Sets or gets whether the element is in the checked state.
     */
    this.$propHandlers["checked"] = function(value) {
        if (!this.$values) {
            if (this.getAttribute("values"))
                this.$propHandler["values"].call(this, this.getAttribute("values"));
            //else
                //this.$values = [true, false];
        }
        this.setProperty("value", this.$values ? this.$values[value ? 0 : 1] : true);
    };

    /**
     * @attribute {String}  label Sets or gets the caption of the label explaining what
     * the meaning of the checked state of this element is.
     */
    this.$propHandlers["label"] = function(value){
        if (!this.$ext)
            return;

        var lbl = this.$getLayoutNode("main", "label", this.$ext);
        if (!lbl)
            return;
        
        if (lbl.nodeType == 1)
            lbl.innerHTML = value;
        else
            lbl.nodeValue = value;
    };

    /**
     * @attribute {String}  values Sets or gets a pipe seperated list of two values which
     * correspond to the two states of the checkbox. The first for the checked
     * state, the second for the unchecked state.
     */
    this.$propHandlers["values"] = function(value){
        this.$values = typeof value == "string"
            ? value.split("\|")
            : (value || [1, 0]);

        this.$propHandlers["value"].call(this, this.value);
    };

    // *** Public Methods *** //

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the [[apf.checkbox.values]] attribute.
     * @param {String} value The new value of this element
     */
    this.setValue = function(value){
        if (!this.$values) return;
        this.setProperty("value", value, false, true);
    };

    /**
     * Returns the current value.
     */
    this.getValue = function(){
        return this.xmlRoot ? (this.$values 
            ? this.$values[this.checked ? 0 : 1]
            : this.checked) : this.value;
    };

    /**
     * Sets the checked state (and related value).
     */
    this.check = function(){
        this.setProperty("value", this.$values
            ? this.$values[0]
            : true, false, true);
    };

    /**
     * Sets the unchecked state (and related value).
     */
    this.uncheck = function(){
        this.setProperty("value", this.$values
            ? this.$values[1]
            : false, false, true);
    };
    
    //#endif

    // *** Private state handling methods *** //

    this.addEventListener("$clear", function(){
        this.setProperty("value", this.$values ? this.$values[1] : false);
    });

    this.$enable = function(){
        if (this.$input) this.$input.disabled = false;
        this.$doBgSwitch(1);
    };

    this.$disable = function(){
        if (this.$input) this.$input.disabled = true;
        this.$doBgSwitch(4);
    };

    this.$setState = function(state, e, strEvent){
        //if (this.disabled) return;

        this.$doBgSwitch(this.states[state]);
        this.$setStyleClass(this.$ext, (state != "Out" ? this.$baseCSSname + state : ""),
            [this.$baseCSSname + "Down", this.$baseCSSname + "Over"]);
        this.state = state; // Store the current state so we can check on it coming here again.

        if (strEvent)
            this.dispatchEvent(strEvent, {htmlEvent: e});

        /*if (state == "Down")
            apf.cancelBubble(e, this);
        else
            e.cancelBubble = true;*/
    };

    this.$clickHandler = function(){
        //this.checked = !this.checked;
        this.change(this.$values
            ? this.$values[(!this.checked) ? 0 : 1]
            : !this.checked);

        //#ifdef __WITH_VALIDATION
        if (this.validate) //@todo rewrite button
            this.validate(true);
        //#endif

        return true;
    };

    // *** Init *** //

    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$input = this.$getLayoutNode("main", "input", this.$ext);
        this.$notfromext = this.$input && this.$input != this.$ext;

        this.$setupEvents();
    };

    this.$childProperty = "label";

    //#ifdef __WITH_SKIN_CHANGE
    this.addEventListener("$skinchange", function(){
        if (this.label)
            this.$propHandlers["label"].call(this, this.label);
    })
    //#endif
    
    // #ifdef __ENABLE_UIRECORDER_HOOK
    this.$getActiveElements = function() {
        // init $activeElements
        if (!this.$activeElements) {
            this.$activeElements = {
                $input       : this.$input
            }
        }

        return this.$activeElements;
    }
    //#endif
}).call(apf.checkbox.prototype = new apf.BaseButton());

apf.aml.setElement("checkbox", apf.checkbox);
// #endif
