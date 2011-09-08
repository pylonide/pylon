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
// #ifdef __AMLSLIDER || __AMLRANGE || __INC_ALL

/**
 * Element allowing the user to select a value from a range of
 * values between a minimum and a maximum value.
 * Example:
 * This example shows a slider that influences the position of a video. The
 * value attribute of the slider is set using property binding. The square
 * brackets imply a {@link term.propertybinding bidirectional binding}.
 * <code>
 *  <a:video id="player1"
 *    src      = "elements/video/demo_video.flv"
 *    autoplay = "true">
 *      Unsupported video codec.
 *  </a:video>
 *
 *  <a:button onclick="player1.play()">play</a:button>
 *  <a:button onclick="player1.pause()">pause</a:button>
 *
 *  <a:slider value="{player1.position}" />
 * </code>
 * Example:
 * This example shows two slider which lets the user indicate a value in a form.
 * <code>
 *  <a:model id="mdlSlider">
 *      <data hours_hd="2" decide_buy="3"></data>
 *  </a:model>
 *  <a:label>How would you grade the opening hours of the helpdesk</a:label>
 *  <a:slider 
 *    model = "mdlSlider" 
 *    value = "[@hours_hd]"
 *    mask  = "no opinion|bad|below average|average|above average|good"
 *    min   = "0"
 *    max   = "5"
 *    step  = "1"
 *    slide = "snap" />
 *  <a:label>How soon will you make your buying decision</a:label>
 *  <a:slider 
 *    model = "mdlSlider" 
 *    value = "[@decide_buy]"
 *    mask  = "undecided|1 week|1 month|6 months|1 year|never"
 *    min   = "0"
 *    max   = "5"
 *    step  = "1"
 *    slide = "snap" />
 *  </code>
 *
 * @constructor
 * @define slider, range
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 *
 * @inherits apf.StandardBinding
 * @inherits apf.XForms
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the slider position based on data loaded into this component.
 * <code>
 *  <a:model id="mdlSlider">
 *      <data value="5"></data>
 *  </a:model>
 *  <a:slider 
 *    model = "mdlSlider" 
 *    min   = "0" 
 *    max   = "10" 
 *    step  = "1" 
 *    mask  = "#" 
 *    value = "[@value]" />
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <a:model id="mdlSlider">
 *      <data value="5"></data>
 *  </a:model>
 *  <a:slider 
 *    min   = "0" 
 *    max   = "10" 
 *    step  = "1" 
 *    mask  = "#" 
 *    value = "[mdlSlider::@value]" />
 * </code>
 */
apf.range  = function(struct, tagName){
    this.$init(tagName || "range", apf.NODE_VISIBLE, struct);
};

apf.slider = function(struct, tagName){
    this.$init(tagName || "slider", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
        //#ifdef __WITH_XFORMS
        //,apf.XForms
        //#endif
    );

    this.$focussable = true; // This object can get the focus

    this.$dragging   = false;
    this.$onlySetXml = false;

    /**** Properties and Attributes ****/
    this.disabled    = false; // Object is enabled
    this.realtime    = true;
    this.balloon     = true;
    this.value       = 0;
    this.mask        = "%";
    this.min         = 0;
    this.max         = 1000001;
    this.isOpened    = false;
    this.$hasTSlider  = false; 

    this.$supportedProperties.push("step", "mask", "min", "max", "slide",
        "value", "markers");

    this.$booleanProperties["realtime"] = true;
    this.$booleanProperties["markers"]  = true;
    this.$booleanProperties["balloon"]  = true;

    /**
     * @attribute {Boolean} realtime whether the slider updates it's value realtime,
     *                               or just when the user stops dragging.
     * @attribute {Boolean} balloon  whether to show the balloon with extra
     *                               information on the position of the slider.
     *                               Default is true when the skin supports it.
     * @attribute {Number}  step     specifying the step size of a discreet slider.
     * Example:
     * <code>
     *  <a:label>How much money do you make annualy.</a:label>
     *  <a:range 
     *    value = "2000"
     *    min   = "0"
     *    max   = "5000"
     *    step  = "1000"
     *    mask  = "#"
     *    slide = "snap" />
     * </code>
     */
    this.$propHandlers["step"] = function(value){
        this.step = parseInt(value) || 0;

        if (!this.$hasLayoutNode("marker"))
            return;

        if (!this.slider)
            this.slideDiscreet = true;
    };
    

    /**
     * @attribute {Boolean} markers whether to display a marker at each discrete step.
     */
    this.$propHandlers["markers"] = function(value){
        //Remove Markers
        var i,
            markers = this.oMarkers.childNodes;
        for (i = markers.length - 1; i >= 0; i--) {
            if (markers[i].tagName == "U" && markers[i].nodeType == 1) //small hack
                apf.destroyHtmlNode(markers[i]);
        }

        if (!this.step && this.$aml)
            this.step = parseInt(this.getAttribute("step")) || 0;

        //Add markers
        if (value && this.step) {
            var pos, o,
                nodes = [],
                max   = (this.max == 1000001) ? 1 : this.max,

                count = (max - this.min) / this.step,
                prop  = this.$dir == "horizontal" ? "left" : "top",
                size  = this.$dir == "horizontal"
                    ? this.oSlider.offsetWidth - this.oKnob.offsetWidth 
                      - apf.getWidthDiff(this.oSlider)
                    : this.oSlider.offsetHeight - this.oKnob.offsetHeight;

            for (i = 0; i < count + 1; i++) {
                this.$getNewContext("marker");
                o = this.$getLayoutNode("marker");
                pos = Math.max(0, (i * (1 / (count))));
                o.setAttribute("style", prop + ":" + Math.round(pos * size) + "px");
                nodes.push(o);
            }
            apf.insertHtmlNodes(nodes, this.oMarkers);
        }
    };
    
    this.$resize = function(){
        this.$propHandlers.value.call(this, this.value);

        var count = (this.max - this.min) / this.step;
        if (!count) return;

        var pos, i,
            prop = this.$dir == "horizontal" ? "left" : "top",
            size = this.$dir == "horizontal"
                ? this.oSlider.offsetWidth - this.oKnob.offsetWidth 
                  - apf.getWidthDiff(this.oSlider)
                : this.oSlider.offsetHeight - this.oKnob.offsetHeight,
            nodes = this.oMarkers.getElementsByTagName("U");//small hack
        for (i = nodes.length - 1; i >= 0; i--) {
            pos = Math.max(0, i * (1 / count));
            nodes[i].style[prop] = Math.round(pos * size) + "px";
        }
    };

    /**
     * @attribute {String} mask a pipe '|' seperated list of strings that are
     * used as the caption of the slider when their connected value is picked. 
     * Or set mask to # to display the numerical value of the position or use %
     * to display the position as percentage of the total.
     * Example:
     * <code>
     *  <a:label>How big is your cat?</a:label>
     *  <a:slider value="2"
     *    mask  = "don't know|20cm|25cm|30cm|35cm|bigger than 35cm"
     *    min   = "0"
     *    max   = "5"
     *    step  = "1"
     *    slide = "snap" />
     * </code>
     */
    this.$propHandlers["mask"] = function(value){
        if (!value)
            this.mask = "%";

        if (!this.mask.match(/^(%|#.?#*)$/)) {
            this.mask = value.split(/\||;/);
        }
    };

    /**
     * @attribute {String} progress a value between 0 and 1 which is visualized
     * inside the slider. This can be used to show a progress indicator for
     * the download of movies or other media.
     * Example:
     * <code>
     *  <a:video id="player1"
     *    src      = "elements/video/demo_video.flv"
     *    autoplay = "true">
     *      Unsupported video codec.
     *  </a:video>
     *
     *  <a:slider value="[player1.position]" progress="{player1.progress}" />
     * </code>
     */
    this.$propHandlers["progress"] = function(value){
        if (!this.oProgress) {
            this.oProgress =
              apf.insertHtmlNode(this.$getLayoutNode("progress"),
                this.$getLayoutNode("main", "progress", this.$ext));
        }

        this.oProgress.style.width = ((value || 0) * 100) + "%";
    };

    /**
     * @attribute {Number} min the minimal value the slider can have. This is
     * the value that the slider has when the grabber is at it's begin position.
     */
    this.$propHandlers["min"] = function(value){
        this.min = parseInt(value) || 0;
        if (this.markers)
            this.$propHandlers["markers"].call(this, this.markers);
        if (this.value < this.min || this.value != this.$value) { //@todo apf3.0
            this.value = -1; //@todo apf3.0
            this.setProperty("value", this.$value);
        }
    };

    /**
     * @attribute {Number} max the maximal value the slider can have. This is
     * the value that the slider has when the grabber is at it's end position.
     */
    this.$propHandlers["max"] = function(value){
        this.max = parseInt(value) || 1;
        if (this.markers)
            this.$propHandlers["markers"].call(this, this.markers);
        if (this.value > this.min || this.value != this.$value) { //@todo apf3.0
            this.value = -1; //@todo apf3.0
            this.setProperty("value", this.$value);
        }
    };

    /**
     * @attribute {String} slide the way the grabber can be handled
     *   Possible values:
     *   normal     the slider moves over a continuous space.
     *   discrete   the slider's value is discrete but the grabber moves over a continuous space and only snaps when the user lets go of the grabber.
     *   snap       the slider snaps to the discrete values it can have while dragging.
     * Remarks:
     * Discrete space is set by the step attribute.
     */
    this.$propHandlers["slide"] = function(value){
        this.slideDiscreet = value == "discrete";
        this.slideSnap     = value == "snap";
    };

    /**
     * @attribute {String} value the value of slider which is represented in
     * the position of the grabber using the following
     * formula: (value - min) / (max - min)
     */
    this.$propHandlers["value"] = function(value, prop, force, animate){
        if (!this.$dir || this.$onlySetXml)
            return; //@todo fix this

        if (this.$dragging && !force && !this.realtime)
            return;

        if (typeof value !== "undefined" && value != this.$value)
            this.dispatchEvent("valuechange");

        this.$value = value;
        var value = Math.max(this.min, Math.min(this.max, value)) || 0;

        var max, min, offset,
            _self      = this,
            multiplier = this.max == this.min
                ? 0
                : (value - this.min) / (this.max - this.min);

        if (this.$dir == "horizontal") {
            max = (this.oSlider.offsetWidth
                - apf.getWidthDiff(this.oSlider))
                - this.oKnob.offsetWidth;
            min = parseInt(apf.getBox(
                apf.getStyle(this.oSlider, "padding"))[3]);

            offset = Math.round(((max - min) * multiplier) + min);
            
            if (animate) {
                apf.tween.single(this.oKnob, {
                    type    : 'left',
                    steps   : 5,
                    interval: 10,
                    from    : this.oKnob.offsetLeft,
                    to      : offset,
                    anim    : apf.tween.NORMAL,
                    oneach  : function(oNode) {
                        if (_self.oFill)
                            _self.oFill.style.width = (oNode.offsetLeft + 3) + "px";
                    }
                });
            }
            else {
                this.oKnob.style.left = offset + "px";
                if (this.oFill)
                    this.oFill.style.width = (offset + 3) + "px";
            }
        }
        else {
            max = (this.oSlider.offsetHeight
                - apf.getHeightDiff(this.oSlider))
                - this.oKnob.offsetHeight;
            min = parseInt(apf.getBox(
                apf.getStyle(this.oSlider, "padding"))[0]);

            offset = (((max - min) * (1 - multiplier)) + min);

            if (animate) {
                apf.tween.single(this.oKnob, {
                    type    : 'top',
                    steps   : 5,
                    interval: 10,
                    from    : this.oKnob.offsetTop,
                    to      : offset,
                    anim    : apf.tween.NORMAL,
                    oneach  : function(oNode) {
                        if (_self.oFill)
                            _self.oFill.style.height = (oNode.offsetTop + 3) + "px";
                    }
                });
            }
            else {
                this.oKnob.style.top = offset + "px";
                if (this.oFill)
                    this.oFill.style.height = (offset + 3) + "px";
            }
        }

        if (this.oLabel) {
            var mask = typeof this.mask == "string" ? this.mask.split(".") : this.mask;
            
            switch(mask[0]) {
                case "%":
                    var inputValue = Math.round(multiplier * 100) + "%";
                    break;
                case "#":
                    var tempValue = (this.step
                        ? (Math.round(value / this.step) * this.step)
                        : value);
                    var inputValue = new Number(tempValue).toFixed(mask[1] ? mask[1].length : 0);
                    break;
                default:
                    var inputValue = this.mask[Math.round(value - this.min) / (this.step || 1)];
                    break;
            }
            
            this.setProperty("valuemask", inputValue);

            if (this.oLabel.nodeValue !== null) {
                this.oLabel.nodeValue = inputValue;
            }
            else {
                this.oLabel.value = inputValue;
            }
            /*
            //Percentage
            if (this.mask == "%") {
                this.oLabel.nodeValue = Math.round(multiplier * 100) + "%";
            }
            //Number
            else if (this.mask == "#") {
                //status = value;
                this.oLabel.nodeValue = this.step
                    ? (Math.round(value / this.step) * this.step)
                    : value;
            }
            //Lookup
            else {
                this.oLabel.nodeValue = this.mask[Math.round(value - this.min)
                    / (this.step || 1)]; //optional floor ??
            }*/
        }
    };
    
    this.$setLabelValue = function(value) {
        var mask = this.mask.split(".");
        
        switch(mask[0]) {
            case "%":
                value = parseInt(value) * (this.max - this.min) / 100;
                break;
            case "#":
                value = new Number(value).toFixed(mask[1] ? mask[1].length : 0);
                break;
        }
        
        this.$propHandlers["value"].call(this, value);
    };

    /**** Public methods ****/

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
        return this.step
            ? Math.round(parseInt(this.value) / this.step) * this.step
            : this.value;
    };
    
    //#endif

    /**** Keyboard support ****/

    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;

        switch (key) {
            case 37:
                //LEFT
                if (this.$dir != "horizontal")
                    return;
                this.change(this.value - this.step);
                break;
            case 38:
                //UP
                if (this.$dir != "vertical")
                    return;
                this.change(this.value + this.step);
                break;
            case 39:
                //RIGHT
                if (this.$dir != "horizontal")
                    return;
                this.change(this.value + this.step);
                break;
            case 40:
                //DOWN
                if (this.$dir != "vertical")
                    return;
                this.change(this.value - this.step);
                break;
            case 13:
                //ENTER
                if (this.$hasTSlider)
                    this.$setLabelValue(this.oLabel.value);
                break;
            default:
                return;
        }

        return false;
    }, true);
    // #endif
    
    this.slideToggle = function(e, userAction) {
        if (!e) e = event;
        if (userAction && this.disabled)
            return;

        if (this.isOpened)
            this.slideUp();
        else
            this.slideDown(e);
    };
    
    this.slideDown = function(e) {
        if (this.dispatchEvent("slidedown") === false)
            return false;

        this.isOpened = true;

        this.oSliderContainer.style.display = "block";
        this.oSliderContainer.style[apf.supportOverflowComponent
            ? "overflowY"
            : "overflow"] = "hidden";
        
        this.oSliderContainer.style.display = "block";
        var scWidth = this.oSliderContainer.offsetWidth;
        var scHeight = this.oSliderContainer.offsetHeight;
        var kWidth = this.oKnob.offsetWidth;
        var diff = apf.getDiff(this.oSliderContainer);
        var right = scWidth - this.$ext.offsetWidth;
        this.$setLabelValue(this.oLabel.value);
        this.oSliderContainer.style.display = "none";
        
        //Place grabber in the same position as button
        if(this.$hasTSlider) {
            right -= scWidth - parseInt(this.oKnob.style.left) - kWidth;
        } 

        this.oSliderContainer.style.display = "";
        this.$setStyleClass(this.$ext, this.$baseCSSname + "Down");

        var _self = this;
        apf.popup.show(this.$uniqueId, {
            x       : -1 * right,
            y       : this.$ext.offsetHeight,
            animate : true,
            ref     : this.$ext,
            width   : scWidth + 1,
            height  : scHeight - diff[1],
            callback: function(container) {
                container.style[apf.supportOverflowComponent
                    ? "overflowY"
                    : "overflow"] = "hidden";
            }
        });
    };
    
    this.slideUp = function() {
        if (!this.isOpened) return false;
        if (this.dispatchEvent("slideup") === false) return false;

        this.isOpened = false;
        if (this.selected) {
            var htmlNode = apf.xmldb.findHtmlNode(this.selected, this);
            if (htmlNode) this.$setStyleClass(htmlNode, '', ["hover"]);
        }

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Down"]);
        apf.popup.hide();
        return false;
    };
    
    this.addEventListener("afterselect", function(e) {
        if (!e) e = event;

        this.slideUp();
        if (!this.isOpened)
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Over"]);
    });
    
    this.$blur = function() {
        this.slideUp();

        if (!this.isOpened)
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Over"])

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus", this.$baseCSSname + "Down"]);
        
        if (this.$hasTSlider)
            this.$setLabelValue(this.oLabel.value);
    };
    
    this.$focus = function(){
        this.$setStyleClass(this.oFocus || this.$ext, this.$baseCSSname + "Focus");
    }

    /**** Init ****/

    this.$draw = function(){
        this.$getNewContext("main");
        
        //Build Main Skin
        this.$ext = this.$getExternal(null, null, function(oExt) {
            var oButton = this.$getLayoutNode("main", "button", oExt);
            if (oButton) {
                oButton.setAttribute("onmousedown",
                    'apf.lookup(' + this.$uniqueId + ').slideToggle(event, true);');
            }
        });
        
        this.$hasTSlider = this.$hasLayoutNode("container");
        if (this.$hasTSlider) {
            this.$getNewContext("container");
            this.oSliderContainer = this.$getExternal("container");
            
            //Allows to select text in IE
            this.$ext.onselectstart = function(e){
                if (!e) e = event;
                e.cancelBubble = true;
            }
        }

        this.oLabel   = this.$getLayoutNode("main", "status", this.$ext);
        this.oFill    = this.$getLayoutNode("main", "fill", this.$ext);
        this.oBalloon = this.$getLayoutNode("main", "balloon", this.$ext);

        if (this.$hasTSlider) {
            this.oMarkers = this.$getLayoutNode("container", "markers", this.oSliderContainer);
            this.oKnob    = this.$getLayoutNode("container", "grabber", this.oSliderContainer);
            this.oSlider  = this.$getLayoutNode("container", "slider", this.oSliderContainer);
            
            //Set up the popup
            this.$pHtmlDoc = apf.popup.setContent(this.$uniqueId, this.oSliderContainer, apf.skins.getCssString(this.skinName));
            document.body.appendChild(this.oSliderContainer);
        }
        else {
            this.oMarkers = this.$getLayoutNode("main", "markers", this.$ext);
            this.oKnob    = this.$getLayoutNode("main", "slider", this.$ext);
            this.oSlider  = this.$ext;
        }

        this.$dir = this.$getOption("main", "direction") || "horizontal";

        this.oKnob.style.left = (parseInt(apf.getBox(
            apf.getStyle(this.oSlider, "padding"))[3])) + "px";

        var _self = this;
        function prepareKnob(e) {
            this.x   = (e.clientX || e.x);
            this.y   = (e.clientY || e.y);
            this.stX = this.offsetLeft;
            this.siX = this.offsetWidth
            this.stY = this.offsetTop;
            this.siY = this.offsetheight
            this.startValue = _self.value;

            if (_self.$dir == "horizontal") {
                this.max = _self.oSlider.offsetWidth 
                    - apf.getWidthDiff(_self.oSlider)
                    - this.offsetWidth;
                this.min = parseInt(apf.getBox(
                    apf.getStyle(_self.oSlider, "padding"))[3]);
            }
            else {
                this.max = _self.oSlider.offsetHeight
                    - apf.getHeightDiff(_self.oSlider)
                    - this.offsetHeight;
                this.min = parseInt(apf.getBox(
                    apf.getStyle(_self.oSlider, "padding"))[0]);
            }
        }

        function getKnobValue(o, e, slideDiscreet){
            var to = (_self.$dir == "horizontal")
                ? (e.clientX || e.x) - o.x + o.stX
                : (e.clientY || e.y) - o.y + o.stY;
            to = (to > o.max ? o.max : (to < o.min ? o.min : to));
            var value = (((to - o.min) * 100 / (o.max - o.min) / 100)
                * (_self.max - _self.min)) + _self.min;

            value = slideDiscreet
                ? (Math.round(value / _self.step) * _self.step)
                : value;
            value = (_self.$dir == "horizontal") ? value : 1 - value;

            return value;
        }

        this.oKnob.onmousedown = function(e){
            if (_self.disabled)
                return false;

            //@todo use start action here

            e = e || window.event;
            document.dragNode = this;

            prepareKnob.call(this, e);

            _self.$setStyleClass(this, "btndown", ["btnover"]);

            apf.dragMode = true;

            _self.$dragging = true;
            
            if (_self.balloon && _self.oBalloon) {
                _self.oBalloon.style.display = "block";
                _self.oBalloon.style.left = (_self.oKnob.offsetLeft 
                    - (_self.oBalloon.offsetWidth 
                    - _self.oKnob.offsetWidth)/2) + "px";
            }
            
            var startValue = this.value;
            document.onmousemove = function(e){
                e = e || window.event;
                var o = this.dragNode;
                if (!o) {
                    apf.dragMode = document.onmousemove = document.onmouseup = null;
                    return; //?
                }

                var knobValue = getKnobValue(o, e, _self.slideSnap);
                if (_self.realtime) {
                    //_self.value = -1; //reset value //@todo apf3.0 please fix this to be not needed. just set a flag to not do change detect
                    if (_self.slideDiscreet) {
                        this.$onlySetXml = true;//blrgh..
                        var rValue = _self.change(Math.round((knobValue / _self.step)
                            * _self.step));
                        this.$onlySetXml = false;
                        
                        if (rValue !== false) {
                            _self.$propHandlers["value"].call(_self, knobValue, 
                                "value", true);
                        }
                    }
                    else {
                        _self.change(knobValue);
                    }
                }
                else {
                    _self.$propHandlers["value"].call(_self, knobValue, "value", true);
                }
                
                if (_self.balloon && _self.oBalloon) {
                    _self.oBalloon.style.left = (_self.oKnob.offsetLeft 
                        - (_self.oBalloon.offsetWidth 
                        - _self.oKnob.offsetWidth)/2) + "px";
                }
                
                /*clearTimeout(timer);
                if (new Date().getTime() - lastTime > 20) {
                    _self.$propHandlers["value"].call(_self, knobValue, true);
                    lastTime = new Date().getTime();
                }
                else {
                    timer = $setTimeout(function(){
                        _self.$propHandlers["value"].call(_self, knobValue, true);
                        lastTime = new Date().getTime();
                    }, 20);
                }*/
            }

            document.onmouseup = function(e){
                var o = this.dragNode;
                if (o)
                    _self.dispatchEvent("mouseup");
                this.dragNode = null;

                o.onmouseout();

                _self.$dragging = false;

                var knobValue = getKnobValue(o, e || window.event,
                    _self.slideDiscreet || _self.slideSnap);

                _self.value = startValue;
                var rValue = startValue != knobValue
                    ? _self.change(knobValue, true) : false;
                
                if (rValue !== false && _self.slideDiscreet)
                    _self.$propHandlers["value"].call(_self, knobValue, "value", true);

                apf.dragMode         = false;
                document.onmousemove = 
                document.onmouseup   = null;

                if (_self.balloon && _self.oBalloon) {
                    _self.oBalloon.style.left = (_self.oKnob.offsetLeft 
                        - (_self.oBalloon.offsetWidth 
                        - _self.oKnob.offsetWidth)/2) + "px";

                    $setTimeout(function(){
                        if (apf.isIE) {
                            _self.oBalloon.style.display = "none";
                        }
                        else {
                            apf.tween.single(_self.oBalloon, {
                                type : "fade",
                                from : 1,
                                to   : 0,
                                steps : 5,
                                onfinish : function(){
                                    _self.oBalloon.style.display = "none";
                                    _self.oBalloon.style.opacity = 1;
                                }
                            })
                        }
                    }, _self.slideDiscreet ? 200 : 0);
                }
            };
            //event.cancelBubble = true;
            return false;
        };

        this.oKnob.onmouseup = this.oKnob.onmouseover = function(){
            if (document.dragNode != this)
                _self.$setStyleClass(this, "btnover", ["btndown"]);
        };

        this.oKnob.onmouseout = function(){
            if (document.dragNode != this)
                _self.$setStyleClass(this, "", ["btndown", "btnover"]);
        };

        this.oSlider.onmousedown = function(e) {
            if (_self.disabled) return false;
            e = e || window.event;

            var o = _self.oKnob;
            if ((e.srcElement || e.target) != o) {
                var p = apf.getAbsolutePosition(o);
                prepareKnob.call(o, {
                    x : p[0] + o.offsetWidth / 2,
                    y : p[1] + o.offsetHeight / 2
                });
                var value = getKnobValue(o, e, _self.slideDiscreet || _self.slideSnap);
                _self.$propHandlers["value"].call(_self, getKnobValue(o, e, _self.slideDiscreet), "value", true, true);
                _self.setValue(value);
            }
        };

        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone)
            apf.iphone.linkEvents(this.oKnob);
        // #endif
    };

    this.$loadAml = function(){
        if (this.max == 1000001)
            this.setProperty("max", 1);
        //this.$propHandlers["value"].call(this, this.value);

        //@todo this goes wrong with skin switching. smartbindings is called again.
        
        //#ifdef __WITH_LAYOUT
        apf.layout.setRules(this.oSlider, "knob",
            "apf.all[" + this.$uniqueId + "].$resize()", true);
        apf.layout.queue(this.$ext);
        //#endif
    };

    this.$destroy = function(){
        this.oKnob.onmousedown =
        this.oKnob.onmouseup   =
        this.oKnob.onmouseover =
        this.oKnob.onmouseout  = null;
        
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.$ext, "knob");
        //#endif
    };
    
    // #ifdef __WITH_UIRECORDER
    this.$getActiveElements = function() {
        // init $activeElements
        if (!this.$activeElements) {
            this.$activeElements = {
                $knob       : this.oKnob,
                $slider     : this.oSlider
            }
        }

        return this.$activeElements;
    }
    //#endif

// #ifdef __WITH_DATABINDING
}).call(apf.slider.prototype = new apf.StandardBinding());
/* #else
}).call(apf.slider.prototype = new apf.Presentation());
#endif*/

apf.range.prototype = apf.slider.prototype;

apf.aml.setElement("range",  apf.range);
apf.aml.setElement("slider", apf.slider);
// #endif
