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
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __AMLSPINNER || __INC_ALL
/** 
 * This element is used to choosing number by plus/minus buttons.
 * When plus button is clicked longer, number growing up faster. The same
 * situation is for minus button. It's possible to increment and decrement
 * value by moving mouse cursor up or down with clicked input. Max and
 * min attributes define range with allowed values.
 * 
 * Example:
 * Spinner element with start value equal 6 and allowed values from range
 * (-100, 200)
 * <code>
 *  <a:spinner value="6" min="-99" max="199" width="200"></a:spinner>
 * </code>
 * 
 * Example:
 * Sets the value based on data loaded into this component.
 * <code>
 *  <a:model id="mdlSpinner">
 *      <data value="56"></data>
 *  </a:model>
 *  <a:spinner value="[@value]" model="mdlSpinner" />
 * </code>

 * Example:
 * Is showing usage of model in spinner connected with textbox
 * <code>
 *  <a:model id="mdlTest">
 *      <overview page="1" pages="50" />
 *  </a:model>
 *  <a:spinner 
 *    id      = "spinner" 
 *    min     = "0" 
 *    max     = "[@pages]" 
 *    model   = "mdlTest" 
 *    value   = "[@page]" 
 *    caption = "[@page] of [@pages]">
 *  </a:spinner>
 *  <a:textbox value="{spinner.caption}"></a:textbox>
 * </code>
 * 
 * @attribute {Number}   max       maximal allowed value, default is 64000
 * @attribute {Number}   min       minimal allowed value, default is -64000
 * @attribute {Number}   value     actual value displayed in component
 * 
 * @classDescription     This class creates a new spinner
 * @return {Spinner}     Returns a new spinner
 *
 * @author      
 * @version     %I%, %G%
 * 
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
 * @inherits apf.XForms
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 */
apf.spinner = function(struct, tagName){
    this.$init(tagName || "spinner", apf.NODE_VISIBLE, struct);
    
    this.max     = 64000;
    this.min     = -64000;
    this.focused = false;
    this.value   = 0;
    
    this.realtime = false;
};

(function() {
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
        //#ifdef __WITH_XFORMS
        //,apf.XForms
        //#endif
    );

    this.$supportedProperties.push("width", "value", "max", "min", "caption", "realtime");

    this.$booleanProperties["realtime"] = true;

    this.$propHandlers["value"] = function(value) {
        value = parseInt(value) || 0;
        
        this.value = this.oInput.value = (value > this.max
            ? this.max
            : (value < this.min
                ? this.min
                : value));
    };

    this.$propHandlers["min"] = function(value) {
        if (!(value = parseInt(value))) return;
        this.min = value;
        if (value > this.value)
            this.change(value);
    };

    this.$propHandlers["max"] = function(value) {
        if (!(value = parseInt(value))) return;
        this.max = value;

        if (value < this.value)
            this.change(value);
    };

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value) {
       this.setProperty("value", value, false, true);
    };

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function() {
        return this.value;
    };
    
    this.increment = function() {
        this.change(parseInt(this.oInput.value) + 1);
    };
    
    this.decrement = function() {
        this.change(parseInt(this.oInput.value) - 1);
    };
    
    //#endif

    this.$enable = function() {
        this.oInput.disabled = false;
        this.$setStyleClass(this.oInput, "", ["inputDisabled"]);
    };

    this.$disable = function() {
        this.oInput.disabled = true;
        this.$setStyleClass(this.oInput, "inputDisabled");
    };

    this.$focus = function(e) {
        if (!this.$ext || this.focused) //this.disabled || 
            return;

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug)
            apf.sanitizeTextbox(this.oInput);
        //#endif

        this.focused = true;
        this.$setStyleClass(this.oInput, "focus");
        this.$setStyleClass(this.$buttonPlus, "plusFocus");
        this.$setStyleClass(this.$buttonMinus, "minusFocus");
        
        if (this.oLeft)
            this.$setStyleClass(this.oLeft, "leftFocus");
    };

    this.$blur = function(e) {
        if (!this.$ext && !this.focused)
            return;

        this.$setStyleClass(this.oInput, "", ["focus"]);
        this.$setStyleClass(this.$buttonPlus, "", ["plusFocus"]);
        this.$setStyleClass(this.$buttonMinus, "", ["minusFocus"]);
        
        if (this.oLeft)
            this.$setStyleClass(this.oLeft, "" ["leftFocus"]);
        
        this.setValue(this.oInput.value);
        
        this.focused = false;
    };

    /* ***********************
     Keyboard Support
     ************************/
    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        var key = e.keyCode,

        keyAccess = (key < 8 || (key > 9 && key < 37 && key !== 12)
            || (key > 40 && key < 46) || (key > 46 && key < 48)
            || (key > 57 && key < 96) || (key > 105 && key < 109 && key !== 107)
            || (key > 109 && key !== 189));

        if (keyAccess)
            return false;
           
        switch(key) {
            case 38://Arrow up
                this.increment();
                break;
            case 40://Arrow down
                this.decrement();
                break;
        }
    }, true);

    this.addEventListener("keyup", function(e) {
        //this.setValue(this.oInput.value);
    }, true);
    //#endif
    
    this.increment = function() {
        this.change(parseInt(this.oInput.value) + 1);
    };
    
    this.decrement = function() {
        this.change(parseInt(this.oInput.value) - 1);
    };
    
    /**
     * @event click     Fires when the user presses a mousebutton while over this element and then let's the mousebutton go. 
     * @event mouseup   Fires when the user lets go of a mousebutton while over this element. 
     * @event mousedown Fires when the user presses a mousebutton while over this element. 
     */
    this.$draw = function() {
        var _self = this;

        //Build Main Skin
        this.$ext = this.$getExternal(null, null, function(oExt) {
            oExt.setAttribute("onmousedown",
                'if (!this.host.disabled) \
                    this.host.dispatchEvent("mousedown", {htmlEvent : event});');
            oExt.setAttribute("onmouseup",
                'if (!this.host.disabled) \
                    this.host.dispatchEvent("mouseup", {htmlEvent : event});');
            oExt.setAttribute("onclick",
                'if (!this.host.disabled) \
                    this.host.dispatchEvent("click", {htmlEvent : event});');
        });

        this.$int         = this.$getLayoutNode("main", "container",   this.$ext);
        this.oInput       = this.$getLayoutNode("main", "input",       this.$ext);
        this.$buttonPlus  = this.$getLayoutNode("main", "buttonplus",  this.$ext);
        this.$buttonMinus = this.$getLayoutNode("main", "buttonminus", this.$ext);
        this.oLeft = this.$getLayoutNode("main", "left", this.$ext);

        //#ifdef __WITH_WINDOW_FOCUS
        apf.sanitizeTextbox(this.oInput);
        //#endif

        var timer,
            doc = (!document.compatMode || document.compatMode == 'CSS1Compat')
                ? document.html : document.body,
            z   = 0;

        /* Setting start value */
        this.oInput.value = this.value;

        this.oInput.onmousedown = function(e) {
            if (_self.disabled)
                return;
            
            e = e || window.event;

            clearTimeout(timer);

            var newval,
                value = parseInt(this.value) || 0,
                step  = 0,
                cy    = e.clientY,
                ot    = _self.$int.offsetTop, ol = _self.$int.offsetLeft,
                ow    = _self.$int.offsetWidth, oh = _self.$int.offsetHeight,
                func  = function() {
                    clearTimeout(timer);
                    timer = $setTimeout(func, 10);
                    if (!step)
                        return;

                    newval = value + step;
                    if (newval <= _self.max && newval >= _self.min) {
                        value += step;
                        value = Math.round(value);
                        _self.oInput.value = value;
                        
                        if (_self.realtime)
                            _self.change(value);
                    }
                    else {
                        _self.oInput.value = step < 0
                            ? _self.min
                            : _self.max;
                    }
                };
            func();

            function calcStep(e) {
                e = e || window.event;
                var x = e.pageX || e.clientX + (doc ? doc.scrollLeft : 0),
                    y = e.pageY || e.clientY + (doc ? doc.scrollTop  : 0),
                    nrOfPixels = cy - y;

                if ((y > ot && x > ol) && (y < ot + oh && x < ol + ow)) {
                    step = 0;
                    return;
                }

                step = Math.pow(Math.min(200, Math.abs(nrOfPixels)) / 10, 2) / 10;
                if (nrOfPixels < 0)
                    step = -1 * step;
            }
            
            document.onmousemove = calcStep;

            document.onmouseup = function(e) {
                clearTimeout(timer);

                var value = parseInt(_self.oInput.value);

                if (value != _self.value)
                    _self.change(value);
                document.onmousemove = document.onmouseup = null;
            };
        };

        /* Fix for mousedown for IE */
        var buttonDown = false;
        this.$buttonPlus.onmousedown = function(e) {
            if (_self.disabled)
                return;
            
            e = e || window.event;
            buttonDown = true;

            var value = (parseInt(_self.oInput.value) || 0) + 1,
                func  = function() {
                    clearTimeout(timer);
                    timer = $setTimeout(func, 50);
                    z++;
                    value += Math.pow(Math.min(200, z) / 10, 2) / 10;
                    value = Math.round(value);

                    _self.oInput.value = value <= _self.max
                        ? value
                        : _self.max;
                    
                    if (_self.realtime)
                       _self.change(value <= _self.max ? value : _self.max);
                };

            apf.setStyleClass(this, "plusDown", ["plusHover"]);

            func();
        };

        this.$buttonMinus.onmousedown = function(e) {
            if (_self.disabled)
                return;
            
            e = e || window.event;
            buttonDown = true;

            var value = (parseInt(_self.oInput.value) || 0) - 1,
                func  = function() {
                    clearTimeout(timer);
                    timer = $setTimeout(func, 50);
                    z++;
                    value -= Math.pow(Math.min(200, z) / 10, 2) / 10;
                    value = Math.round(value);

                    _self.oInput.value = value >= _self.min
                        ? value
                        : _self.min;
                    
                    if (_self.realtime)
                       _self.change(value >= _self.min ? value : _self.min);
                };

            apf.setStyleClass(this, "minusDown", ["minusHover"]);

            func();
        };

        this.$buttonMinus.onmouseout = function(e) {
            if (_self.disabled)
                return;
            
            clearTimeout(timer);
            z = 0;

            var value = parseInt(_self.oInput.value);

            if (value != _self.value)
                _self.change(value);

            apf.setStyleClass(this, "", ["minusHover"]);

            if (!_self.focused)
               _self.$blur(e);
        };

        this.$buttonPlus.onmouseout  = function(e) {
            if (_self.disabled)
                return;
            
            clearTimeout(timer);
            z = 0;

            var value = parseInt(_self.oInput.value);

            if (value != _self.value)
                _self.change(value);

            apf.setStyleClass(this, "", ["plusHover"]);

            if (!_self.focused)
               _self.$blur(e);
        };

        this.$buttonMinus.onmouseover = function(e) {
            if (_self.disabled)
                return;
                
            apf.setStyleClass(this, "minusHover");
        };

        this.$buttonPlus.onmouseover  = function(e) {
            if (_self.disabled)
                return;
                
            apf.setStyleClass(this, "plusHover");
        };

        this.$buttonPlus.onmouseup = function(e) {
            if (_self.disabled)
                return;
            
            e = e || event;
            //e.cancelBubble = true;
            apf.cancelBubble(e, this);

            apf.setStyleClass(this, "plusHover", ["plusDown"]);

            clearTimeout(timer);
            z = 0;

            var value = parseInt(_self.oInput.value);

            if (!buttonDown) {
                value++;
                _self.oInput.value = value;
            }
            else {
                buttonDown = false;
            }

            if (value != _self.value)
                _self.change(value);
        };

        this.$buttonMinus.onmouseup = function(e) {
            if (_self.disabled)
                return;
            
            e = e || event;
            //e.cancelBubble = true;
            apf.cancelBubble(e, this);

            apf.setStyleClass(this, "minusHover", ["minusDown"]);

            clearTimeout(timer);
            z = 0;

            var value = parseInt(_self.oInput.value);

            if (!buttonDown) {
                value--;
                _self.oInput.value = value;
            }
            else {
                buttonDown = false;
            }


            if (value != _self.value)
                _self.change(value);
        };

        this.oInput.onselectstart = function(e) {
            e = e || event;
            e.cancelBubble = true;
        };

        this.oInput.host = this;
    };

    this.$destroy = function() {
        this.oInput.onkeypress =
        this.oInput.onmousedown =
        this.oInput.onkeydown =
        this.oInput.onkeyup =
        this.oInput.onselectstart =
        this.$buttonPlus.onmouseover =
        this.$buttonPlus.onmouseout =
        this.$buttonPlus.onmousedown =
        this.$buttonPlus.onmouseup =
        this.$buttonMinus.onmouseover =
        this.$buttonMinus.onmouseout =
        this.$buttonMinus.onmousedown =
        this.$buttonMinus.onmouseup = null;
    };
    
    // #ifdef __WITH_UIRECORDER
    this.$getActiveElements = function() {
        // init $activeElements
        if (!this.$activeElements) {
            this.$activeElements = {
                $input          : this.oInput,
                $buttonPlus     : this.$buttonPlus,
                $buttonMinus    : this.$buttonMinus
            }
        }

        return this.$activeElements;
    }
    //#endif

// #ifdef __WITH_DATABINDING
}).call(apf.spinner.prototype = new apf.StandardBinding());
/* #else
}).call(apf.spinner.prototype = new apf.Presentation());
#endif */

apf.aml.setElement("spinner", apf.spinner);
// #endif
