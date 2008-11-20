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

// #ifdef __JSPINNER || __INC_ALL
/** 
 * This element is used to choosing number by plus/minus buttons.
 * When plus button is clicked longer, number growing up faster. The same
 * situation is for minus button. It's possible to increment and decrement
 * value by moving mouse cursor up or down with clicked input. Maximum and
 * minimum attribute creates range with allowed values.
 * 
 * Example:
 * Spinner element with start value equal 6 and allowed values from range
 * (-100, 200)
 * <j:spinner value="6" minimum="-99" maximum="199" />
 * 
 * @attribute {Number}   maximum   maximal allowed value, default is 64000
 * @attribute {Number}   minimum   minimal allowed value, default is -64000
 * @attribute {Number}   width     spinner element horizontal size, default is 200
 * @attribute {Number}   value     actual value displayed in component
 * 
 * @classDescription     This class creates a new spinner
 * @return {Spinner}     Returns a new spinner
 *
 * @author      
 * @version     %I%, %G%
 * 
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 */
jpf.spinner = jpf.component(jpf.NODE_VISIBLE, function() {
    this.pHtmlNode  = document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;

    this.$supportedProperties.push("width", "value", "maximum", "minimum",
        "focused");

    this.maximum = 64000;
    this.minimum = -64000;
    this.width   = 200;
    this.value   = 0;
    this.focused = false;

    var _self    = this;

    this.$propHandlers["value"] = function(value) {
        this.oInput.value = parseInt(value) || 0;
    };

    this.$propHandlers["minimum"] = function(value) {
        if (parseInt(value))
            this.minimum = parseInt(value);
    };

    this.$propHandlers["maximum"] = function(value) {
        if (parseInt(value))
            this.maximum = parseInt(value);
    };

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/

    this.setValue = function(value) {
        value = parseInt(value);
        if (value && value <= _self.maximum && value >= _self.minimum) {
            this.setProperty("value", value);
            this.value = this.oInput.value = value;
        }
    };

    this.getValue = function() {
        return this.value;
    };

    this.$enable = function() {
        this.oInput.disabled = false;
    };

    this.$disable = function() {
        this.oInput.disabled = true;
    };

    this.$focus = function(e){
        if (!this.oExt || this.oExt.disabled || this.focused) 
            return;
        
        //#ifdef __WITH_WINDOW_FOCUS
        if (jpf.hasFocusBug)
            jpf.sanitizeTextbox(this.oInput);
        //#endif
        
        this.focused = true;
        this.$setStyleClass(this.oFirst, "focus");
        this.$setStyleClass(this.oInput, "focus");
        this.$setStyleClass(this.oButtonPlus, "plusFocus");
        this.$setStyleClass(this.oButtonMinus, "minusFocus");
        jpf.console.info("focus")
    };
    
    this.$blur = function(e) {
        if (!this.oExt && !this.focused) 
            return;
        this.$setStyleClass(this.oFirst, "", ["focus"]);
        this.$setStyleClass(this.oInput, "", ["focus"]);
        this.$setStyleClass(this.oButtonPlus, "", ["plusFocus"]);
        this.$setStyleClass(this.oButtonMinus, "", ["minusFocus"]);
        this.focused = false;
    }


    /* ***********************
     Keyboard Support
     ************************/
    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        var key = e.keyCode;

        /* Allow: ARROWS, DEL, NUMBERS, MINUS, BACKSPACE */
        if (key < 8 || (key > 8 && key < 37) || (key > 40 && key < 46)
          || (key > 46 && key < 48) || (key > 57 && key < 109) || key > 109)
            return false;
    }, true);
    //#endif

    this.$draw = function() {
        //Build Main Skin
        this.oExt = this.$getExternal(null, null, function(oExt) {
            oExt.setAttribute("onmousedown",
                'this.host.dispatchEvent("mousedown", {htmlEvent : event});');
            oExt.setAttribute("onmouseup",
                'this.host.dispatchEvent("mouseup", {htmlEvent : event});');
            oExt.setAttribute("onclick",
                'this.host.dispatchEvent("click", {htmlEvent : event});');
        });

        this.oInt         = this.$getLayoutNode("main", "container", this.oExt);
        this.oInput       = this.$getLayoutNode("main", "input", this.oExt);
        this.oButtons     = this.$getLayoutNode("main", "buttons", this.oExt);
        this.oButtonPlus  = this.$getLayoutNode("main", "buttonplus", this.oExt);
        this.oButtonMinus = this.$getLayoutNode("main", "buttonminus", this.oExt);
        this.oFirst       = this.$getLayoutNode("main", "first", this.oExt);

        var timer, z = 0;

        this.oInput.onmousedown = function(e) {
            e = e || window.event;

            var value = parseInt(this.value) || 0, step = 0,
                cy = e.clientY, cx = e.clientX,
                ot = (this.offsetTop || 33), ol = (this.offsetLeft || 9),
                ow = this.offsetWidth, oh = this.offsetHeight;

            clearInterval(timer);
            timer = setInterval(function() {
                if (!step)
                    return;

                if (value + step <= _self.maximum
                    && value + step >= _self.minimum) {
                    value += step;
                    _self.oInput.value = Math.round(value);
                }
                else {
                    _self.oInput.value = step < 0 
                        ? _self.minimum
                        : _self.maximum;
                }
            }, 10);

            document.onmousemove = function(e) {
                e = e || window.event;
                var y = e.clientY, x = e.clientX, nrOfPixels = cy - y;

                if ((y > ot && x > ol) && (y < ot + oh && x < ol + ow)) {
                    step = 0;
                    return;
                }

                step = Math.pow(Math.min(200, Math.abs(nrOfPixels)) / 10, 2) / 10;
                if (nrOfPixels < 0)
                    step = -1 * step;
            };

            document.onmouseup = function(e) {
                clearInterval(timer);

                var value = parseInt(_self.oInput.value);

                if (value != _self.value) {
                    _self.value = value;
                    _self.change(value);
                }
                document.onmousemove = null;
            };
        };

        this.oButtonPlus.onmousedown = function(e) {
            e = e || window.event;

            var value = (parseInt(_self.oInput.value) || 0) + 1;
            
            jpf.setStyleClass(_self.oButtonPlus, "plusDown", ["plusHover"]);

            clearInterval(timer);
            timer = setInterval(function() {
                z++;
                value += Math.pow(Math.min(200, z) / 10, 2) / 10;
                value = Math.round(value);

                _self.oInput.value = value <= _self.maximum
                    ? value
                    : _self.maximum;
            }, 50);
        };

        this.oButtonMinus.onmousedown = function(e) {
            e = e || window.event;

            var value = (parseInt(_self.oInput.value) || 0) - 1;
            
            jpf.setStyleClass(_self.oButtonMinus, "minusDown", ["minusHover"]);

            clearInterval(timer);
            timer = setInterval(function() {
                z++;
                value -= Math.pow(Math.min(200, z) / 10, 2) / 10;
                value = Math.round(value);

                _self.oInput.value = value >= _self.minimum
                    ? value
                    : _self.minimum;
            }, 50);
        };

        this.oButtonMinus.onmouseout = function(e) {
            window.clearInterval(timer);
            z = 0;

            var value = parseInt(_self.oInput.value);

            if (value != _self.value) {
                _self.value = value;
                _self.change(value);
            }
            jpf.setStyleClass(_self.oButtonMinus, "", ["minusHover"]);
            
            if (!_self.focused) {
               _self.$blur(e);
            }
        };
        
        this.oButtonPlus.onmouseout  = function(e) {
            window.clearInterval(timer);
            z = 0;

            var value = parseInt(_self.oInput.value);

            if (value != _self.value) {
                _self.value = value;
                _self.change(value);
            }
            jpf.setStyleClass(_self.oButtonPlus, "", ["plusHover"]);
            
            if (!_self.focused) {
               _self.$blur(e);
            }
        };

        this.oButtonMinus.onmouseover = function(e) {
            jpf.setStyleClass(_self.oButtonMinus, "minusHover");
            jpf.setStyleClass(_self.oButtonPlus, "plusFocus");
            jpf.setStyleClass(_self.oFirst, "focus");
            jpf.setStyleClass(_self.oInput, "focus");
        };

        this.oButtonPlus.onmouseover  = function(e) {
            jpf.setStyleClass(_self.oButtonPlus, "plusHover");
            jpf.setStyleClass(_self.oButtonMinus, "minusFocus");
            jpf.setStyleClass(_self.oFirst, "focus");
            jpf.setStyleClass(_self.oInput, "focus");
        };

        this.oButtonPlus.onmouseup  = function(e) {
            e = e || event;
            e.cancelBubble = true;

            jpf.setStyleClass(_self.oButtonPlus, "plusHover", ["plusDown"]);

            window.clearInterval(timer);
            z = 0;

            var value = parseInt(_self.oInput.value);

            if (value != _self.value) {
                _self.value = value;
                _self.change(value);
            }
        };
        
        this.oButtonMinus.onmouseup = function(e) {
            e = e || event;
            e.cancelBubble = true;

            jpf.setStyleClass(_self.oButtonMinus, "minusHover", ["minusDown"]);

            window.clearInterval(timer);
            z = 0;

            var value = parseInt(_self.oInput.value);

            if (value != _self.value) {
                _self.value = value;
                _self.change(value);
            }
        };

        this.oInput.onselectstart = function(e) {
            e = e || event;
            e.cancelBubble = true
        };

        this.oInput.host = this;
    };

    this.$loadJml = function(x) {
        jpf.JmlParser.parseChildren(this.$jml, null, this);
        var size = parseInt(this.width) - this.oButtonPlus.offsetWidth
                 - this.oFirst.offsetWidth
                 - jpf.getDiff(this.oInput)[0]
                 - jpf.getDiff(this.oInt)[0];
        this.oInput.style.width = (size > 0 ? size : 1) + "px";
    };

    this.$destroy = function() {
        this.oInput.onkeypress =
        this.oInput.onmousedown =
        this.oInput.onkeydown =
        this.oInput.onkeyup =
        this.oInput.onselectstart =
        this.oButtonPlus.onmouseover =
        this.oButtonPlus.onmouseout =
        this.oButtonPlus.onmousedown =
        this.oButtonPlus.onmouseup =
        this.oButtonMinus.onmouseover =
        this.oButtonMinus.onmouseout =
        this.oButtonMinus.onmousedown =
        this.oButtonMinus.onmouseup = null;
    };
}).implement(jpf.Presentation, jpf.DataBinding);

// #endif
