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

// #ifdef __JBASEBUTTON || __INC_ALL

/**
 * Baseclass of an element that has one or two states and can be clicked on to
 * trigger an action. (i.e. {@link button} or {@link checkbox}).
 *
 * @constructor
 * @baseclass
 * @author      Abe Ginner
 * @version     %I%, %G%
 * @since       0.8
 *
 * @event click     Fires when the user presses a mousebutton while over this element and then let's the mousebutton go. 
 */

jpf.BaseButton = function(pHtmlNode){
    var refKeyDown   = 0;     // Number of keys pressed.
    var refMouseDown = 0;     // Mouse button down?
    var mouseOver    = false; // Mouse hovering over the button?
    var mouseLeft    = false; // Has the mouse left the control since pressing the button.
    var _self        = this;

    /**** Properties and Attributes ****/

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
     * <pre class="code">
     * background="threestates.gif|vertical|3|16"
     * </pre>
     */
    this.$propHandlers["background"] = function(value){
        var oNode = this.$getLayoutNode("main", "background", this.oExt);
        // #ifdef __DEBUG
        if (!oNode)
            return jpf.console.warn("No background defined in the Button skin", "button");
        /* #else
        if (!oNode) return;
        #endif */

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

    /**** Keyboard Support ****/

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;

        switch (key) {
            case 13:
                if (this.tagName != "checkbox")
                    this.oExt.onmouseup(e.htmlEvent, true);
                break;
            case 32:
                if (!e.htmlEvent.repeat) { // Only when first pressed, not on autorepeat.
                    refKeyDown++;
                    return this.$updateState(e.htmlEvent);
                } else
                    return false;
        }
    }, true);

    this.addEventListener("keyup", function(e){
        var key = e.keyCode;

        switch (key) {
            case 32:
                refKeyDown--;

                if (refKeyDown < 0) {
                    refKeyDown = 0;
                    return;
                }

                if (refKeyDown + refMouseDown == 0 && !this.disabled) {
                    this.oExt.onmouseup(e, true);
                }

                return this.$updateState(e);
        }
    }, true);
    //#endif

    /**** Private state handling methods ****/

    this.states = {
        "Out"   : 1,
        "Over"  : 2,
        "Down"  : 3
    };

    this.$updateState = function(e, strEvent) {
        if (this.disabled || e.reset) {
            refKeyDown   = 0;
            refMouseDown = 0;
            mouseOver    = false;
            return false;
        }

        if (refKeyDown > 0
          || (refMouseDown > 0 && mouseOver)
          || (this.isBoolean && this.value)) {
            this.$setState ("Down", e, strEvent);
        }
        else if (mouseOver)
            this.$setState ("Over", e, strEvent);
        else
            this.$setState ("Out", e, strEvent);
    }

    this.$setupEvents = function() {
        this.oExt.onmousedown = function(e) {
            if (!e) e = event;

            if (_self.$notfromext && (e.srcElement || e.target) == this)
                return;

            refMouseDown = 1;
            mouseLeft    = false;
            _self.$updateState(e, "mousedown");
        };
        this.oExt.onmouseup = function(e, force) {
            if (!e) e = event;
            //if (e)  e.cancelBubble = true;

            if (!force && (!mouseOver || !refMouseDown))
                return;

            refMouseDown = 0;
            _self.$updateState (e, "mouseup");

            // If this is coming from a mouse click, we shouldn't have left the button.
            if (_self.disabled || (e && e.type == "click" && mouseLeft == true))
                return false;

            // If there are still buttons down, this is not a real click.
            if (refMouseDown + _self.refKeyDown)
                return false;

            if (_self.$clickHandler && _self.$clickHandler())
                _self.$updateState (e || event, "click");
            else
                _self.dispatchEvent("click", {htmlEvent : e});

            return false;
        };

        this.oExt.onmousemove = function(e) {
            if (!mouseOver) {
                if (!e) e = event;

                if (_self.$notfromext && (e.srcElement || e.target) == this)
                    return;

                mouseOver = true;
                _self.$updateState(e, "mouseover");
            }
        };

        this.oExt.onmouseout = function(e) {
            if(!e) e = event;

            //Check if the mouse out is meant for us
            var tEl = e.explicitOriginalTarget || e.toElement;
            if (this == tEl || jpf.xmldb.isChildOf(this, tEl))
                return;

            mouseOver    = false;
            refMouseDown = 0;
            mouseLeft    = true;
            _self.$updateState (e || event, "mouseout");
        };

        if (jpf.hasClickFastBug)
            this.oExt.ondblclick = this.oExt.onmouseup;
    }

    this.$doBgSwitch = function(nr){
        if (this.bgswitch && (this.$background[2] >= nr || nr == 4)) {
            if (nr == 4)
                nr = this.$background[2] + 1;

            var strBG = this.$background[1] == "vertical"
                ? "0 -" + (parseInt(this.$background[3]) * (nr - 1)) + "px"
                : "-" + (parseInt(this.$background[3]) * (nr - 1)) + "px 0";

            this.$getLayoutNode("main", "background",
                this.oExt).style.backgroundPosition = strBG;
        }
    }

    /**** Focus Handling ****/

    this.$focus = function(){
        if (!this.oExt)
            return;

        this.$setStyleClass(this.oExt, this.baseCSSname + "Focus");
    }

    this.$blur = function(oBtn){
        if (!this.oExt)
            return; //FIREFOX BUG!

        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
        /*refKeyDown   = 0;
        refMouseDown = 0;
        mouseLeft    = true;*/

        //#ifdef __JTOOLBAR || __INC_ALL
        /*if (this.submenu) {
            if (this.value) {
                this.$setState("Down", {}, "mousedown");
                this.$hideMenu();
            }
        }*/
        //#endif

        if (oBtn)
            this.$updateState(oBtn);//, "onblur"
    }

    /*** Clearing potential memory leaks ****/

    this.$destroy = function(skinChange){
        if (!skinChange) {
            this.oExt.onmousedown = this.oExt.onmouseup = this.oExt.onmouseover =
            this.oExt.onmouseout = this.oExt.onclick = this.oExt.ondblclick = null;
        }
    }
}

// #endif
