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
// #ifdef __AMLRADIOBUTTON || __INC_ALL

/**
 * This element displays a two state button which is one of a grouped set.
 * Only one of these buttons in the set can be selected at the same time.
 * 
 * #### Example: Settings Groups
 *
 * ```xml, demo
 * <a:application xmlns:a="http://ajax.org/2005/aml">
 *  <a:table columns="100, 150" cellheight="20">
 *   <!-- startcontent -->
 *     <a:label>Options</a:label> 
 *     <a:label>Choices</a:label> 
 *     <a:radiobutton group="g2">Option 1</a:radiobutton> 
 *     <a:radiobutton group="g3">Choice 1</a:radiobutton> 
 *     <a:radiobutton group="g2">Option 2</a:radiobutton>
 *     <a:radiobutton group="g3">Choice 2</a:radiobutton>
 *   <!-- endcontent -->
 *  </a:table>
 * </a:application>
 * ```
 *
 * @class apf.radiobutton
 * @define radiobutton
 * @allowchild {smartbinding}
 *
 * @form
 * @inherits apf.Presentation
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 */
/**
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * 
 * #### Example
 *
 * Sets the selection based on data loaded into this component.
 * 
 * ```xml
 *  <a:radiobutton group="g2" bindings="bndExample" value="1">Choice 1</a:radiobutton>
 *  <a:radiobutton group="g2" value="2">Choice 2</a:radiobutton>
 *
 *  <a:bindings id="bndExample">
 *      <a:value match="[@value]" />
 *  </a:bindings>
 * ```
 *
 * A shorter way to write this is:
 *
 * ```xml
 *  <a:radiobutton group="g2" value="[@value]" value="1">Choice 1</a:radiobutton>
 *  <a:radiobutton group="g2" value="2">Choice 2</a:radiobutton>
 * ```
 *
 */
/**
 * @event click Fires when the user presses a mousebutton while over this element and then lets the mousebutton go. 
 * @see apf.AmlNode@afterchange
 */
apf.radiobutton = function(struct, tagName){
    this.$init(tagName || "radiobutton", apf.NODE_VISIBLE, struct);
    
    /*this.$constructor = apf.radiobutton;
    var fEl = apf.aml.setElement("radiobutton", function(){
        this.$init(tagName || "radiobutton", apf.NODE_VISIBLE, struct);
    });
    fEl.prototype = apf.radiobutton.prototype;
    apf.radiobutton = fEl;*/
};

(function(){
    this.implement(apf.ChildValue);
    this.$childProperty = "label";
    
    this.$focussable = apf.KEYBOARD; // This object can get the focus
    
    //1 = force no bind rule, 2 = force bind rule
    /*this.$attrExcludePropBind = apf.extend({
        selected: 1
    }, this.$attrExcludePropBind);*/

    // *** Properties and Attributes *** //

    this.$booleanProperties["selected"] = true;
    this.$supportedProperties.push("value", "background", "group",
        "label", "selected", "tooltip", "icon");

    /**
     * @attribute {String} group Sets or gets the name of the group to which this radio
     * button belongs. Only one item in the group can be selected at the same
     * time. 
     * When no group is specified the parent container functions as the
     * group; only one radiobutton within that parent can be selected.
     */
    this.$propHandlers["group"] = function(value){
        if (!this.$ext)
            return;
        
        if (this.$group && this.$group.$removeRadio)
            this.$group.$removeRadio(this);
            
        if (!value) {
            this.$group = null;
            return;
        }

        var group = typeof value == "string"
            ?
            //#ifdef __WITH_NAMESERVER
            apf.nameserver.get("group", value)
            /* #else
            self[value]
            #endif */
            : value;
        if (!group) {
            //#ifdef __WITH_NAMESERVER
            group = apf.nameserver.register("group", value, 
                new apf.$group());
            group.setAttribute("id", value);
            group.dispatchEvent("DOMNodeInsertedIntoDocument");
            group.parentNode = this;
            //#endif
        }
        this.$group = group;
        
        if (this.oInput)
            this.oInput.setAttribute("name", value);
        
        this.$group.$addRadio(this);
    };
    
    /**
     * @attribute {String} tooltip Sets or gets the tooltip of this radio button.
     */
    this.$propHandlers["tooltip"] = function(value){
        this.$ext.setAttribute("title", value);
    };

    /**
     * @attribute {String} icon Sets or gets the icon for this radiobutton
     */
    this.$propHandlers["icon"] = function(value){
        // #ifdef __DEBUG
        if (!this.oIcon)
            return apf.console.warn("No icon defined in the Button skin", "button");
        /* #else
        if (!this.oIcon) return;
        #endif */

        if (value)
            this.$setStyleClass(this.$ext, this.$baseCSSname + "Icon");
        else
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Icon"]);

        apf.skins.setIcon(this.oIcon, value, this.iconPath);
    };

    /**
     * @attribute {String} label Sets or gets the label for this radiobutton
     */
    this.$propHandlers["label"] = function(value){
        if (value)
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Empty"]);
        else
            this.$setStyleClass(this.$ext, this.$baseCSSname + "Empty");
        
        if (this.oLabel)
            this.oLabel.innerHTML = value;
    };

    /**
     * @attribute {Boolean} selected Sets or gets  whether this radiobutton is the selected one in the group it belongs to.
     */
    this.$propHandlers["selected"] = function(value){
        if (!this.$group)
            return;

        if (value)
            this.$group.setProperty("value", this.value);
        //else if (this.$group.value == this.value)
            //this.$group.setProperty("value", "");
    };
    
    this.addEventListener("prop.model", function(e){
        if (this.$group)
            this.$group.setProperty("model", e.value);
    });

    /**
     * @attribute {String} background Sets a multistate background. The arguments
     * are seperated by pipes (`'|'`) and are in the order of: `'imagefilename|mapdirection|nrofstates|imagesize'`
     * 
     * {:multiStateDoc}
     *
     * 
     * #### Example
     * 
     * Here's a three state picture where each state is 16px high, vertically spaced:
     * 
     * ```xml
     * background="threestates.gif|vertical|3|16"
     * ```
     * @see apf.BaseButton
     */
    this.$propHandlers["background"] = function(value){
        var oNode = this.$getLayoutNode("main", "background", this.$ext);
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
    };

    // *** Public methods *** //

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the `values` attribute.
     * @param {String} value The new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value, false, true);
    };

    /**
     * Returns the current value of this element.
     * @return {String} The current value
     */
    this.getValue = function(){
        return this.value;
    };
    
    this.select = function(){
        this.setProperty("selected", true, false, true);
    };
    
    /*this.uncheck = function(){
        this.setProperty("selected", false, false, true);
    }*/
    
    this.getGroup = function(){
        return this.$group;
    };
    
    //#endif

    /*
     * Sets the selected state and related value
     */
    this.$check = function(visually){
        this.$setStyleClass(this.$ext, this.$baseCSSname + "Selected");
        this.selected = true;
        if (this.oInput)
            this.oInput.selected = true;
        this.doBgSwitch(2);
    };

    this.$uncheck = function(){
        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Selected"]);
        this.selected = false;
        if (this.oInput)
            this.oInput.selected = false;
        this.doBgSwitch(1);
    };

    // *** Private methods *** //

    this.$enable = function(){
        if (this.oInput)
            this.oInput.disabled = false;

        var _self = this;
        this.$ext.onclick = function(e){
            if (!e) e = event;
            if ((e.srcElement || e.target) == this)
                return;

            _self.dispatchEvent("click", {
                htmlEvent: e
            });
            _self.$group.change(_self.value);
        }

        this.$ext.onmousedown = function(e){
            if (!e) e = event;
            if ((e.srcElement || e.target) == this)
                return;

            apf.setStyleClass(this, _self.$baseCSSname + "Down");
        }

        this.$ext.onmouseover = function(e){
            if (!e) e = event;
            if ((e.srcElement || e.target) == this)
                return;

            apf.setStyleClass(this, _self.$baseCSSname + "Over");
        }

        this.$ext.onmouseout =
        this.$ext.onmouseup  = function(){
            apf.setStyleClass(this, "", [_self.$baseCSSname + "Down", _self.$baseCSSname + "Over"]);
        }
    };

    this.$disable = function(){
        if (this.oInput)
            this.oInput.disabled = true;

        this.$ext.onclick     =
        this.$ext.onmousedown =
        this.$ext.onmouseover =
        this.$ext.onmouseout  =
        this.$ext.onmouseup   = null;
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

            this.$getLayoutNode("main", "background", this.$ext)
                .style.backgroundPosition = strBG;
        }
    };

    this.$focus = function(){
        if (!this.$ext)
            return;
        if (this.oInput && this.oInput.disabled)
            return false;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");
    };

    this.$blur = function(){
        if (!this.$ext)
            return;
        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);
    };

    // *** Keyboard support *** //

    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key = e.keyCode;

        if (key == 13 || key == 32) {
            //this.check();
            //this.$group.current = this;
            this.$group.change(this.value);
            return false;
        }
        //Up
        else if (key == 38) {
            var node = this;
            while (node && node.previousSibling) {
                node = node.previousSibling;
                if (node.localName == "radiobutton" && !node.disabled
                  && node.$group == this.$group) {
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
                if (node.localName == "radiobutton" && !node.disabled
                  && node.$group == this.$group) {
                    node.check();
                    node.focus();
                    return;
                }
            }
        }
    }, true);
    // #endif

    // *** Init *** //

    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();
        this.oInput = this.$getLayoutNode("main", "input", this.$ext);
        this.oLabel = this.$getLayoutNode("main", "label", this.$ext);
        this.oIcon  = this.$getLayoutNode("main", "icon", this.$ext);

        if (this.oLabel && this.oLabel.nodeType != 1)
            this.oLabel = this.oLabel.parentNode;

        //Set events
        this.$enable();
    };

    this.$childProperty = "label";
    this.$loadAml = function(x){
        if (this.group)
            this.$propHandlers["group"].call(this, this.group);
        
        else if (this.parentNode.localName == "group")
            this.$propHandlers["group"].call(this, this.parentNode);

        if (!this.$group) {
            this.$propHandlers["group"].call(this,
                "group" + this.parentNode.$uniqueId);
        }
    };
    
    this.$destroy = function(){
        if (this.$group)
            this.$group.$removeRadio(this);
    };
    
    // #ifdef __ENABLE_UIRECORDER_HOOK
    this.$getActiveElements = function() {
        // init $activeElements
        if (!this.$activeElements) {
            this.$activeElements = {
                oInput       : this.oInput
            }
        }

        return this.$activeElements;
    };
    //#endif
}).call(apf.radiobutton.prototype = new apf.Presentation());

apf.aml.setElement("radiobutton", apf.radiobutton);

/**
 * An element that defines groups for radio buttons.
 * 
 * #### Example
 *
 * This example shows radio buttons with an explicit group set:
 *
 * ```xml
 *  <a:label>Options</a:label>
 *  <a:radiobutton group="g1">Option 1</a:radiobutton>
 *  <a:radiobutton group="g1">Option 2</a:radiobutton>
 *
 *  <a:label>Choices</a:label>
 *  <a:group id="g2" value="[mdlForm::choice]">
 *      <a:radiobutton value="c1">Choice 1</a:radiobutton>
 *      <a:radiobutton value="c2">Choice 2</a:radiobutton>
 *  </a:group>
 * ```
 *
 * @class apf.group
 * @define group
 */
apf.$group = apf.group = function(struct, tagName){
    this.$init(tagName || "group", apf.NODE_VISIBLE, struct);
    
    this.implement(
        apf.StandardBinding,
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
        //#ifdef __WITH_XFORMS
        //,apf.XForms
        //#endif
    );

    var radiobuttons = [];

    this.$supportedProperties.push("value", "selectedItem");
    this.$propHandlers["value"] = function(value){
        for (var i = 0; i < radiobuttons.length; i++) {
            if (radiobuttons[i].value == value) {
                return this.setProperty("selectedItem", radiobuttons[i]);
            }
        }
        return this.setProperty("selectedItem", null);
    };
    
    var lastSelected;
    this.$propHandlers["selectedItem"] = function(rb){
        if (lastSelected)
            lastSelected.$uncheck();
        if (!rb)
            return;
            
        rb.$check();
        lastSelected = rb;
        
        for (var i = 0; i < radiobuttons.length; i++)
            radiobuttons[i].setProperty("selectedItem", rb);
    };

    this.$addRadio = function(rb){
        var id = radiobuttons.push(rb) - 1;
        
        if (!rb.value)
            rb.setProperty("value", id);
        
        var _self = this;
        rb.addEventListener("prop.value", function(e){
            if (this.selected)
                _self.setProperty("value", e.value);
            else if (_self.value == e.value)
                this.select();
        });
        
        if (this.value && rb.value == this.value)
            this.setProperty("selectedItem", rb);
        else if (rb.selected)
            this.setProperty("value", rb.value);
    };

    this.$removeRadio = function(rb){
        radiobuttons.remove(rb);
        
        if (rb.value === rb.id)
            rb.setProperty("value", "");
        
        if (rb.selectedItem == rb)
            this.setProperty("value", null);
    };

    /**
     * Sets the current value of this element.
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };
    
    /**
     * Returns the current value of this element.
     * @return {String} The current value.
     */
    this.getValue = function(){
        return this.value;
    };

    this.$draw = function(){
        this.$ext = this.$int = this.$pHtmlNode;
    };
};
apf.$group.prototype = new apf.GuiElement();

apf.aml.setElement("group", apf.$group);

// #endif
