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

// #ifdef __AMLBASEBUTTON || __INC_ALL

/**
 * Baseclass of an element that has one or two states and can be clicked on to
 * trigger an action. (i.e. {@link element.button} or {@link element.checkbox}).
 *
 * @constructor
 * @baseclass
 * @author      Abe Ginner
 * @version     %I%, %G%
 * @since       0.8
 *
 * @event click     Fires when the user presses a mousebutton while over this element and then let's the mousebutton go. 
 */
apf.BaseButton = function(){
    this.$init(true);
};

(function() {
    //#ifdef __WITH_CHILDVALUE
    this.implement(apf.ChildValue);
    // #endif
    
    this.$refKeyDown   =        // Number of keys pressed.
    this.$refMouseDown = 0;     // Mouse button down?
    this.$mouseOver    =        // Mouse hovering over the button?
    this.$mouseLeft    = false; // Has the mouse left the control since pressing the button.

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
     * <code>
     * background="threestates.gif|vertical|3|16"
     * </code>
     */
    this.$propHandlers["background"] = function(value){
        var oNode = this.$getLayoutNode("main", "background", this.$ext);
        // #ifdef __DEBUG
        if (!oNode)
            return apf.console.warn("No background defined in the Button skin", "button");
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
    };

    /**** Keyboard Support ****/

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        //var ctrlKey  = e.ctrlKey;  << UNUSED
        //var shiftKey = e.shiftKey; << UNUSED

        switch (key) {
            case 13:
                if (this.localName != "checkbox")
                    this.$ext.onmouseup(e.htmlEvent, true);
                break;
            case 32:
                if (!e.htmlEvent.repeat) { // Only when first pressed, not on autorepeat.
                    this.$refKeyDown++;
                    this.$updateState(e.htmlEvent);
                }
                return false;
        }
    }, true);

    this.addEventListener("keyup", function(e){
        var key = e.keyCode;

        switch (key) {
            case 32:
                this.$refKeyDown--;

                if (this.$refKeyDown < 0) {
                    this.$refKeyDown = 0;
                    return false;
                }

                if (this.$refKeyDown + this.$refMouseDown == 0 && !this.disabled)
                    this.$ext.onmouseup(e, true);

                this.$updateState(e);
                return false;
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
        if (e.reset) { //this.disabled || 
            this.$refKeyDown   = 0;
            this.$refMouseDown = 0;
            this.$mouseOver    = false;
            return false;
        }

        if (this.$refKeyDown > 0
          || (this.$refMouseDown > 0 && (this.$mouseOver || (!apf.isIE && this.$ext === e.currentTarget)))
          || (this.isBoolean && this.value)) {
            this.$setState("Down", e, strEvent);
        }
        else if (this.$mouseOver) {
            this.$setState("Over", e, strEvent);
        }
        else
            this.$setState("Out", e, strEvent);
    };

    this.$setupEvents = function() {
        if (this.editable)
            return;
        
        var _self = this;

        this.$ext.onmousedown = function(e) {
            e = e || window.event;

            if (_self.$notfromext && (e.srcElement || e.target) == this)
                return;

            _self.$refMouseDown = 1;
            _self.$mouseLeft    = false;
            
            if (_self.disabled)
                return;

            if (!apf.isIE) { // && (apf.isGecko || !_self.submenu) Causes a focus problem for menus
                if (_self.value)
                    apf.stopEvent(e);
                else
                    apf.cancelBubble(e);
            }
            
            _self.$updateState(e, "mousedown");
        };
        
        this.$ext.onmouseup = function(e, force) {
            e = e || window.event;
            //if (e)  e.cancelBubble = true;
            if (_self.disabled || !force && ((!_self.$mouseOver && (!apf.isIE && this !== e.currentTarget)) || !_self.$refMouseDown))
                return;

            _self.$refMouseDown = 0;
            _self.$updateState(e, "mouseup");

            // If this is coming from a mouse click, we shouldn't have left the button.
            if (_self.disabled || (e && e.type == "click" && _self.$mouseLeft == true))
                return false;

            // If there are still buttons down, this is not a real click.
            if (_self.$refMouseDown + _self.$refKeyDown)
                return false;

            if (_self.$clickHandler && _self.$clickHandler())
                _self.$updateState (e || event, "click");
            else
                _self.dispatchEvent("click", {htmlEvent : e});

            return false;
        };

        this.$ext.onmousemove = function(e) {
            if ((!_self.$mouseOver || _self.$mouseOver == 2)) {
                e = e || window.event;

                if (_self.$notfromext && (e.srcElement || e.target) == this)
                    return;

                _self.$mouseOver = true;
                
                if (!_self.disabled)
                    _self.$updateState(e, "mouseover");
            }
        };

        this.$ext.onmouseout = function(e) {
            e = e || window.event;

            //Check if the mouse out is meant for us
            var tEl = e.explicitOriginalTarget || e.toElement;
            if (apf.isChildOf(this, tEl)) //this == tEl ||
                return;

            _self.$mouseOver    = false;
            _self.$refMouseDown = 0;
            _self.$mouseLeft    = true;
            
            if (!_self.disabled)
                _self.$updateState(e, "mouseout");
        };

        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone)
            apf.iphone.linkEvents(this.$ext, true);
        // #endif

        if (apf.hasClickFastBug)
            this.$ext.ondblclick = this.$ext.onmouseup;
    };

    this.$doBgSwitch = function(nr){
        if (this.background && (this.$background[2] >= nr || nr == 4)) {
            if (nr == 4)
                nr = this.$background[2] + 1;

            var strBG = this.$background[1] == "vertical"
                ? "0 -" + (parseInt(this.$background[3]) * (nr - 1)) + "px"
                : "-"   + (parseInt(this.$background[3]) * (nr - 1)) + "px 0";

            this.$getLayoutNode("main", "background",
                this.$ext).style.backgroundPosition = strBG;
        }
    };

    /**** Focus Handling ****/

    this.$focus = function(){
        if (!this.$ext)
            return;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");
    };

    this.$blur = function(e){
        if (!this.$ext)
            return; //FIREFOX BUG!

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);
        /*this.$refKeyDown   = 0;
        this.$refMouseDown = 0;
        this.$mouseLeft    = true;*/

        //#ifdef __AMLTOOLBAR || __INC_ALL
        /*if (this.submenu) {
            if (this.value) {
                this.$setState("Down", {}, "mousedown");
                this.$hideMenu();
            }
        }*/
        //#endif

        if (e)
            this.$updateState({});//, "onblur"
    };
    
    this.addEventListener("prop.disabled", function(e){
        this.$refKeyDown   =   
        this.$refMouseDown = 0;
        //this.$mouseOver    =   
        //this.$mouseLeft    = false;
    });

    /*** Clearing potential memory leaks ****/

    this.$destroy = function(skinChange){
        if (!skinChange && this.$ext) {
            this.$ext.onmousedown = this.$ext.onmouseup = this.$ext.onmouseover =
            this.$ext.onmouseout = this.$ext.onclick = this.$ext.ondblclick = null;
        }
    };
// #ifdef __WITH_DATABINDING
}).call(apf.BaseButton.prototype = new apf.StandardBinding());
/* #else
}).call(apf.BaseButton.prototype = new apf.Presentation());
#endif */

// #endif