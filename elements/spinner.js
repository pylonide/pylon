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

/** 
 * This element is used to choosing number by plus/minus buttons.
 * When plus button is clicked longer, number growing up faster. The same
 * situation is for minus button. It's possible to increment and decrement
 * value by moving mouse cursor up or down with clicked input.
 * 
 * @classDescription        This class creates a new spinner
 * @return {Spinner}        Returns a new spinner
 *
 * @author      
 * @version     %I%, %G% 
 */

jpf.spinner = jpf.component(jpf.NODE_VISIBLE, function() {
    this.pHtmlNode  = document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;

    this.$supportedProperties.push("width", "value");

    this.maximum    = 64000;
    this.minimum    = -64000;
    this.width      = 200;
    this.value      = 0;

    var _self      = this;

    this.$propHandlers["value"] = function(value) {
        this.oInput.value = parseInt(value) || 0;
    };
    
    this.$propHandlers["maximum"] = function(value) {
        alert(value)
        if(parseInt(value))
            this.maximum = parseInt(value);
    };

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value) {
        return this.setProperty("value", value);
    };

    this.getValue = function() {
        return this.isHTMLBox ? this.oInput.innerHTML : this.oInput.value;
    };

    this.$enable = function() {
        this.oInput.disabled = false;
    };

    this.$disable = function() {
        this.oInput.disabled = true;
    };

    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    this.$insertData = function(str) {
        return this.setValue(str);
    };

    /* ***********************
     Keyboard Support
     ************************/
    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        var key      = e.keyCode;

        /* Allow: ARROWS, DEL, NUMBERS, MINUS, BACKSPACE */
        if (key < 8 || (key > 8 && key < 37) || (key > 40 && key < 46)
          || (key > 46 && key < 48) || (key > 57 && key < 109) || key > 109)
            return false;
    }, true);
    //#endif

    /* *********
     INIT
     **********/
    this.$draw = function() {
        //Build Main Skin
        this.oExt = this.$getExternal(null, null, function(oExt) {
            oExt.setAttribute("onmousedown", 'this.host.dispatchEvent("mousedown", {htmlEvent : event});');
            oExt.setAttribute("onmouseup",   'this.host.dispatchEvent("mouseup", {htmlEvent : event});');
            oExt.setAttribute("onclick",     'this.host.dispatchEvent("click", {htmlEvent : event});');
        });
        this.oInt         = this.$getLayoutNode("main", "container", this.oExt);
        this.oInput       = this.$getLayoutNode("main", "input", this.oExt);
        this.oButtonPlus  = this.$getLayoutNode("main", "buttonplus", this.oExt);
        this.oButtonMinus = this.$getLayoutNode("main", "buttonminus", this.oExt);

        var timer, z = 0;

        this.oInput.onmousedown = function(e) {
            e = e || window.event;

            var value = parseInt(this.value) || 0, step = 0, cy = e.clientY, cx = e.clientX;
            var input = this;
            var ot    = (input.offsetTop || 33);
            var ol    = (input.offsetLeft || 9);
            var ow    = input.offsetWidth;
            var oh    = input.offsetHeight;

            clearInterval(timer);
            timer = setInterval(function() {
                if (!step) {
                    return;
                }
                value += step;
                _self.oInput.value = Math.round(value);
            }, 10);

            document.onmousemove = function(e) {
                e = e || window.event;
                var y = e.clientY;
                var x = e.clientX;

                var nrOfPixels = cy - y;

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
                //_self.change(Math.round(value));
                if (_self.oInput.value != _self.getValue()) 
                    _self.change(_self.oInput.value);
                document.onmousemove = null;
            };
        };

        this.oButtonPlus.onmousedown = function(e) {
            e = e || window.event;

            var value = (parseInt(_self.oInput.value) || 0) + 1;

            clearInterval(timer);
            timer = setInterval(function() {
                z++;
                value += Math.pow(Math.min(200, z) / 10, 2) / 10;
                value = Math.round(value);
                
                _self.oInput.value = value <= _self.maximum
                    ? Math.round(value)
                    : _self.maximum;
            }, 50);
        };

        this.oButtonMinus.onmousedown = function(e) {
            e = e || window.event;

            var value = (parseInt(_self.oInput.value) || 0) - 1;

            clearInterval(timer);
            timer = setInterval(function() {
                z++;
                value -= Math.pow(Math.min(200, z) / 10, 2) / 10;
                value = Math.round(value);

                _self.oInput.value = value >= _self.minimum
                    ? Math.round(value)
                    : _self.minimum;

            }, 50);
        };

        this.oButtonMinus.onmouseout =
        this.oButtonPlus.onmouseout  = function(e) {
            window.clearInterval(timer);
            z = 0;
            
            if (_self.oInput.value != _self.getValue())
                _self.change(_self.oInput.value);

            _self.$setStyleClass(this, "", ["hover"]);
        };

        this.oButtonMinus.onmouseover =
        this.oButtonPlus.onmouseover  = function(e) {
            _self.$setStyleClass(this, "hover");
        };

        this.oButtonPlus.onmouseup  =
        this.oButtonMinus.onmouseup = function(e) {
            window.clearInterval(timer);
            z = 0;

            if (_self.oInput.value != _self.getValue())
                _self.change(_self.oInput.value);
        };

        this.oInput.onselectstart = function(e) {
            if (!e)
                e = event;
            e.cancelBubble = true
        };

        this.oInput.host = this;

    };

    this.$loadJml = function(x) {
        jpf.JmlParser.parseChildren(this.$jml, null, this);
        this.oInput.style.width = parseInt(this.width )
                                - this.oButtonPlus.offsetWidth
                                - jpf.getDiff(this.oInput)[1]
                                - jpf.getDiff(this.oInt)[1] + "px";
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

    /**
     * Change maximal number (default 64000)
     * 
     * @param {Number} max  Maximal number who could be in spinner
     */
    this.setMaximum = function(max) {
        this.maximum = max;
    };

    /**
     * Change minimal number (default -64000)
     * 
     * @param {Number} min  Minimal number who could be in spinner
     */
    this.setMinimum = function(min) {
        this.minimum = min;
    };
}).implement(jpf.Presentation, jpf.DataBinding, jpf.JmlElement);