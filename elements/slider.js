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
// #ifdef __JSLIDER || __JRANGE || __INC_ALL

/**
 * Element allowing the user to select a value from a range of
 * values between a minimum and a maximum value.
 * Example:
 * This example shows a slider that influences the position of a video. The
 * value attribute of the slider is set using property binding. The square
 * brackets imply a bidirectional binding.
 * <code>
 *  <j:video id="player1"
 *    src      = "elements/video/demo_video.flv"
 *    autoplay = "true">
 *      Unsupported video codec.
 *  </j:video>
 *
 *  <j:button onclick="player1.play()">play</j:button>
 *  <j:button onclick="player1.pause()">pause</j:button>
 *
 *  <j:slider value="[player1.position]" />
 * </code>
 * Example:
 * This example shows two slider which lets the user indicate a value in a form.
 * <code>
 *  <j:label>How would you grade the opening hours of the helpdesk</j:label>
 *  <j:slider ref="hours_hd"
 *    mask  = "no opinion|bad|below average|average|above average|good"
 *    min   = "0"
 *    max   = "5"
 *    step  = "1"
 *    slide = "snap" />
 *
 *  <j:label>How soon will you make your buying decision</j:label>
 *  <j:slider ref="decide_buy"
 *    mask  = "undecided|1 week|1 month|6 months|1 year|never"
 *    min   = "0"
 *    max   = "5"
 *    step  = "1"
 *    slide = "snap" />
 * </code>
 *
 * @constructor
 * @define slider, range
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.Validation
 * @inherits jpf.XForms
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the slider position based on data loaded into this component.
 * <pre class="code">
 *  <j:slider>
 *      <j:bindings>
 *          <j:value select="@value" />
 *      </j:bindings>
 *  </j:slider>
 * </pre>
 * Example:
 * A shorter way to write this is:
 * <pre class="code">
 *  <j:slider ref="@value" />
 * </pre>
 */
jpf.range  =
jpf.slider = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$focussable = true; // This object can get the focus

    var _self    = this;
    var dragging = false;

    /**** Properties and Attributes ****/
    this.disabled = false; // Object is enabled
    this.realtime = true;
    this.value    = 0;
    this.mask     = "%";
    this.min      = 0;
    this.max      = 1;

    this.$supportedProperties.push("step", "mask", "min",
        "max", "slide", "value");

    this.$booleanProperties["realtime"] = true;

    /**
     * @attribute {Boolean} realtime whether the slider updates it's value realtime, or just when the user stops dragging.
     * @attribute {Number}  step     specifying the step size of a discreet slider.
     * Example:
     * <code>
     *  <j:label>How much money do you make annualy.</j:label>
     *  <j:range ref="salary"
     *    min   = "0"
     *    max   = "50000"
     *    step  = "1000"
     *    slide = "snap" />
     * </code>
     */
    this.$propHandlers["step"] = function(value){
        this.step = parseInt(value) || 0;

        if (!this.$hasLayoutNode("marker"))
            return;

        //Remove Markers
        var markers = this.oMarkers.childNodes;
        for (var i = markers.length - 1; i >= 0; i--) {
            if (markers[i].nodeType == 1)
                jpf.removeNode(markers[i]);
        }

        //Add markers
        if (this.step) {
            var leftPos, count = (this.max - this.min) / this.step;
            for (var o, nodes = [], i = 0; i < count + 1; i++) {
                this.$getNewContext("marker");
                o = this.$getLayoutNode("marker");

                leftPos = Math.max(0, (i * (1 / count) * 100) - 1);
                o.setAttribute("style", "left:" + leftPos + "%");
                nodes.push(o);
            }

            jpf.xmldb.htmlImport(markers, this.oMarkers);
        }
    }

    /**
     * @attribute {String} mask a pipe '|' seperated list of strings that are
     * used as the caption of the slider when their connected value is picked.
     * Example:
     * <code>
     *  <j:label>How big is your cat?</j:label>
     *  <j:slider ref="decide_buy"
     *    mask  = "don't know|20cm|25cm|30cm|35cm|&gt; 35cm"
     *    min   = "0"
     *    max   = "5"
     *    step  = "1"
     *    slide = "snap" />
     * </code>
     * </code>
     */
    this.$propHandlers["mask"] = function(value){
        if (!value)
            this.mask = "%";

        if (!this.mask.match(/^(%|#)$/))
            this.mask = value.split("|");
    }

    /**
     * @attribute {String} progress a value between 0 and 1 which is visualized
     * inside the slider. This can be used to show a progress indicator for
     * the download of movies or other media.
     * Example:
     * <code>
     * </code>
     */
    this.$propHandlers["progress"] = function(value){
        if (!this.oProgress) {
            this.oProgress =
              jpf.xmldb.htmlImport(this.$getLayoutNode("progress"),
                this.$getLayoutNode("main", "progress", this.oExt));
        }

        this.oProgress.style.width = ((value || 0) * 100) + "%";
    }

    /**
     * @attribute {Number} min the minimal value the slider can have. This is
     * the value that the slider has when the grabber is at it's begin position.
     */
    this.$propHandlers["min"] = function(value){
        this.min = parseInt(value) || 0;
    }

    /**
     * @attribute {Number} max the maximal value the slider can have. This is
     * the value that the slider has when the grabber is at it's end position.
     */
    this.$propHandlers["max"] = function(value){
        this.max = parseInt(value) || 1;
    }

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
    }

    /**
     * @attribute {String} value the value of slider which is represented in
     * the position of the grabber using the following
     * formula: (value - min) / (max - min)
     */
    this.$propHandlers["value"] = function(value, force){
        if (!this.$dir)
            return; //@todo fix this

        if (dragging && !force)
            return;

        this.value = Math.max(this.min, Math.min(this.max, value)) || 0;
        var max, min, multiplier = (this.value - this.min) / (this.max - this.min);

        if (this.$dir == "horizontal") {
            max = (this.oContainer.offsetWidth
                - jpf.getWidthDiff(this.oContainer))
                - this.oSlider.offsetWidth;
            min = parseInt(jpf.getBox(
                jpf.getStyle(this.oContainer, "padding"))[3]);

            this.oSlider.style.left = (((max - min) * multiplier) + min) + "px";
        }
        else {
            max = (this.oContainer.offsetHeight
                - jpf.getHeightDiff(this.oContainer))
                - this.oSlider.offsetHeight;
            min = parseInt(jpf.getBox(
                jpf.getStyle(this.oContainer, "padding"))[0]);
            this.oSlider.style.top = (((max - min) * (1 - multiplier)) + min) + "px";
        }

        if (this.oLabel) {
            //Percentage
            if (this.mask == "%") {
                this.oLabel.nodeValue = Math.round(multiplier * 100) + "%";
            }
            //Number
            else
                if (this.mask == "#") {
                    status = this.value;
                    this.oLabel.nodeValue = this.step
                        ? (Math.round(this.value / this.step) * this.step)
                        : this.value;
                }
                //Lookup
                else {
                    this.oLabel.nodeValue = this.mask[Math.round(this.value - this.min)
                        / (this.step || 1)]; //optional floor ??
                }

        }
    };

    /**** Public methods ****/

    /**
     * @copy Widget#setValue
     */
    this.setValue = function(value, onlySetXml){
        this.$onlySetXml = onlySetXml;//blrgh..
        this.setProperty("value", value);
        this.$onlySetXml = false;
    };

    /**
     * @copy Widget#getValue
     */
    this.getValue = function(){
        return this.step
            ? Math.round(parseInt(this.value) / this.step) * this.step
            : this.value;
    };

    /**** Keyboard support ****/

    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;

        switch (key) {
            case 37:
                //LEFT
                if (this.$dir != "horizontal")
                    return;
                this.setValue(this.value - (ctrlKey ? 0.01 : 0.1));
                break;
            case 38:
                //UP
                if (this.$dir != "vertical")
                    return;
                this.setValue(this.value + (ctrlKey ? 0.01 : 0.1));
                break;
            case 39:
                //RIGHT
                if (this.$dir != "horizontal")
                    return;
                this.setValue(this.value + (ctrlKey ? 0.01 : 0.1));
                break;
            case 40:
                //DOWN
                if (this.$dir != "vertical")
                    return;
                this.setValue(this.value - (ctrlKey ? 0.01 : 0.1));
                break;
            default:
                return;
        }

        return false;
    }, true);
    // #endif

    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.oExt         = this.$getExternal();
        this.oLabel       = this.$getLayoutNode("main", "status", this.oExt);
        this.oMarkers     = this.$getLayoutNode("main", "markers", this.oExt);
        this.oSlider      = this.$getLayoutNode("main", "slider", this.oExt);
        this.oInt         = this.oContainer = this.$getLayoutNode("main",
            "container", this.oExt);

        this.$dir         = this.$getOption("main", "direction") || "horizontal";

        this.oSlider.style.left = (parseInt(jpf.getBox(
            jpf.getStyle(this.oExt, "padding"))[3])) + "px";

        this.oSlider.onmousedown = function(e){
            if (_self.disabled)
                return false;

            //@todo use start action here

            if (!e)
                e = event;
            document.dragNode = this;

            this.x   = (e.clientX || e.x);
            this.y   = (e.clientY || e.y);
            this.stX = this.offsetLeft;
            this.siX = this.offsetWidth
            this.stY = this.offsetTop;
            this.siY = this.offsetheight
            this.startValue = _self.value;

            if (_self.$dir == "horizontal") {
                this.max = parseInt(jpf.getStyle(_self.oContainer, "width"))
                    - this.offsetWidth;
                this.min = parseInt(jpf.getBox(
                    jpf.getStyle(_self.oContainer, "padding"))[3]);
            }
            else {
                this.max = parseInt(jpf.getStyle(_self.oContainer, "height"))
                    - this.offsetHeight;
                this.min = parseInt(jpf.getBox(
                    jpf.getStyle(_self.oContainer, "padding"))[0]);
            }

            _self.$setStyleClass(this, "btndown", ["btnover"]);

            jpf.dragmode.mode = true;

            function getValue(o, e, slideDiscreet){
                var to = (_self.$dir == "horizontal")
                    ? (e.clientX || e.x) - o.x + o.stX
                    : (e.clientY || e.y) - o.y + o.stY;
                to = (to > o.max ? o.max : (to < o.min ? o.min : to));
                var value = (((to - o.min) * 100 / (o.max - o.min) / 100)
                    * (_self.max - _self.min)) + _self.min;

                value = slideDiscreet
                    ? (Math.round(value / slideDiscreet) * slideDiscreet)
                    : value;
                value = (_self.$dir == "horizontal") ? value : 1 - value;

                return value;
            }

            dragging = true;

            document.onmousemove = function(e){
                var o = this.dragNode;

                if (!o) {
                    document.onmousemove =
                    document.onmouseup   =
                    jpf.dragmode.mode    = null;

                    return; //?
                }

                if (_self.realtime) {
                    _self.value = -1; //reset value
                    _self.setValue(getValue(o, e || event, _self.slideDiscreet));
                }

                _self.$propHandlers["value"].call(_self, getValue(o, e || event, _self.slideDiscreet), true);
            }

            document.onmouseup = function(e){
                var o = this.dragNode;
                this.dragNode = null;
                o.onmouseout();

                dragging = false;

                /*if (_self.realtime) {
                    _self.value = -1; //reset value
                    _self.setValue(o.startValue, true);
                }*/

                _self.$ignoreSignals = _self.realtime;
                _self.change(getValue(o, e || event,
                    _self.slideDiscreet || _self.slideSnap));
                _self.$ignoreSignals = false;

                document.onmousemove =
                document.onmouseup   =
                jpf.dragmode.mode    = null;
            }

            //event.cancelBubble = true;
            return false;
        };

        this.oSlider.onmouseup = this.oSlider.onmouseover = function(){
            if (document.dragNode != this)
                _self.$setStyleClass(this, "btnover", ["btndown"]);
        };

        this.oSlider.onmouseout = function(){
            if (document.dragNode != this)
                _self.$setStyleClass(this, "", ["btndown", "btnover"]);
        };

        //#ifdef __WITH_LAYOUT
        jpf.layout.setRules(this.oExt, "knob", "var o = jpf.all[" + this.uniqueId + "];\
            o.$propHandlers.value.call(o, o.value);", true);
        //#endif
    };

    this.$loadJml = function(x){
        this.$propHandlers["value"].call(this, this.value);

        //@todo this goes wrong with skin switching. smartbindings is called again.
        jpf.JmlParser.parseChildren(this.$jml, null, this);
    };

    this.$destroy = function(){
        this.oSlider.onmousedown =
        this.oSlider.onmouseup   =
        this.oSlider.onmouseover =
        this.oSlider.onmouseout  = null;
    };
}).implement(
    // #ifdef __WITH_DATABINDING
    jpf.DataBinding,
    // #endif
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    jpf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    jpf.XForms,
    //#endif
    jpf.Presentation
);

// #endif
