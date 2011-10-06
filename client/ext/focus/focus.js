/**
 * Fullscreen focus for the editor tabs
 * 
 * @TODO
 * - Disabling the extension doesn't call the disable() function
 * - Exit focus mode when doing any keybinding operation (except openfiles, quicksearch, gotoline)
 * - While animating, disable ability to toggle focus mode (better: cancel and reverse the operation)
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var canon = require("pilot/canon");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var markup = require("text!ext/focus/focus.xml");
var skin = require("text!ext/focus/skin.xml");

module.exports = ext.register("ext/focus/focus", {
    name     : "Editor Focus",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : skin,
    isFocused : false,
    neverShown : true,

    initialWidth : 0.70,

    handleLeftMove : false,
    handleRightMove : false,

    commands : {
        "focus": {hint: "toggle editor focus mode"},
        "focusslow": {hint: "toggle editor focus mode in slow-motion"}
    },

    nodes : [],

    hook : function(){
        var _self = this;
        ide.addEventListener("openfile", function() {
            if (_self.neverShown) {
                setTimeout(function() {
                    ext.initExtension(_self);
                }, 1000);
                _self.neverShown = false;
            }
        });

        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/focus");
            if (strSettings)
                _self.initialWidth = strSettings;
        });

        ide.addEventListener("savesettings", function(e){
            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/focus/text()");
            xmlSettings.nodeValue = _self.initialWidth;
            return true;
        });
    },

    init : function(amlNode){
        // Create all the elements used here
        this.animateFocus = document.createElement("div");
        this.animateFocus.setAttribute("id", "animateFocus");
        this.animateFocus.setAttribute("style", "display: none");
        document.body.appendChild(this.animateFocus);

        this.animateFocusPosition = document.createElement("div");
        this.animateFocusPosition.setAttribute("id", "animateFocusPosition");
        this.animateFocusPosition.setAttribute("style", "display: none");
        document.body.appendChild(this.animateFocusPosition);

        this.focusHandleLeft = document.createElement("div");
        this.focusHandleLeft.setAttribute("id", "focusHandleLeft");
        this.focusHandleLeft.setAttribute("style", "opacity: 0.0");
        document.body.appendChild(this.focusHandleLeft);

        this.focusHandleRight = document.createElement("div");
        this.focusHandleRight.setAttribute("id", "focusHandleRight");
        this.focusHandleRight.setAttribute("style", "opacity: 0.0");
        document.body.appendChild(this.focusHandleRight);
        
        this.setupHandleListeners();

        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(btnFocusFullscreen);

        // @TODO adjust position based on scrollbar width
        if (!(apf.isChrome && apf.versionChrome >= 14) && !(apf.isSafari && apf.versionSafari >= 5))
            btnFocusFullscreen.setAttribute("right", "26");

        if (apf.isWin)
            btnFocusFullscreen.setAttribute("right", "28");

        this.animateFocus = document.getElementById("animateFocus");
        this.animateFocusPosition = document.getElementById("animateFocusPosition");

        var _self = this;
        vbFocus.addEventListener("resize", function(e) {
            if (_self.isFocused) {
                _self.calculatePositions();
            }
        });
    },

    calculatePositions : function() {
        // Calculate the position
        var _self = this;
        var height = (window.innerHeight-33) + "px";
        tabEditors.parentNode.$ext.style.height = height;
        _self.animateFocus.style.height = window.innerHeight + "px";
        var width = window.innerWidth * _self.initialWidth;
        var widthDiff = (window.innerWidth - width) / 2;
        tabEditors.parentNode.$ext.style.width = _self.animateFocus.style.width = width + "px";
        _self.animateFocus.style.left = widthDiff + "px";

        // Set the resize handle positions
        _self.focusHandleLeft.style.height = window.innerHeight + "px";
        _self.focusHandleLeft.style.left = (widthDiff+0) + "px";
        _self.focusHandleRight.style.height = window.innerHeight + "px";
        _self.focusHandleRight.style.left = ((widthDiff + width) - 5) + "px";
    },

    // @TODO implement removeListeners
    setupHandleListeners : function() {
        var _self = this;

        this.focusHandleLeft.addEventListener("mousedown", function(e) {
            _self.browserWidth = window.innerWidth;
            _self.handleLeftMove = true;
        });

        this.focusHandleRight.addEventListener("mousedown", function(e) {
            _self.browserWidth = window.innerWidth;
            _self.handleRightMove = true;
        });

        document.addEventListener("mousemove", function(e) {
            if (_self.isFocused) {
                // Now resize those love handles!
                function afterCalculation() {
                    if (_self.initialWidth < 0.4)
                        _self.initialWidth = 0.4;
                    else if (_self.initialWidth > 0.95)
                        _self.initialWidth = 1.0;
                    _self.calculatePositions();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }
                if (_self.handleLeftMove) {
                    _self.initialWidth = 1.0 - ((e.clientX * 2)/_self.browserWidth);
                    afterCalculation();
                }
                else if (_self.handleRightMove) {
                    var fakeLeftCalc = _self.browserWidth - e.clientX;
                    _self.initialWidth = 1.0 - ((fakeLeftCalc * 2)/_self.browserWidth);
                    afterCalculation();
                }
            }
        });

        document.addEventListener("mouseup", function() {
            if (!_self.isFocused)
                return;

            if (_self.handleLeftMove || _self.handleRightMove)
                settings.save();
            _self.handleLeftMove = false;
            _self.handleRightMove = false;
            apf.layout.forceResize();
        });
    },

    /**
     * Method attached to key combination (Cmd/Ctrl + E)
     */
    focus : function() {
        this.toggleFullscreenFocus();
    },

    /**
     * Method attached to key combo for slow mode (Shift)
     */
    focusslow : function() {
        this.toggleFullscreenFocus({ htmlEvent : { shiftKey : true }});
    },

    /**
     * Method invoked to do the actual toggling of focus mode
     * Detects if focused or not
     * 
     * @param {amlEvent} e Event from click
     */
    toggleFullscreenFocus : function(e) {
        var shiftKey = false;
        if (e)
            shiftKey = e.htmlEvent.shiftKey;

        if (this.isFocused)
            this.escapeFromFocusMode(shiftKey);
        else
            this.enterIntoFocusMode(shiftKey);
    },

    /**
     * Checks if the current browser supports fancy shmancy animations
     * 
     * @return {boolean} true if supported, false otherwise
     */
    checkBrowserCssTransforms : function() {
        var isWebkitCapable = apf.isWebkit && (apf.versionSafari >= 3.1 || apf.versionChrome >= 11);
        var isGeckoCapable = apf.isGecko && apf.versionGecko >= 4;
        var isOperaCapable = apf.isOpera && apf.versionOpera >= 10;
        return isWebkitCapable || isGeckoCapable || isOperaCapable;
    },

    /**
     * Enters the editor into fullscreen/focus mode
     * 
     * @param {boolean} slow Whether to slow down the animation
     */
    enterIntoFocusMode : function(slow) {
        var _self = this;

        this.saveTabEditorsParentStyles();
        btnFocusFullscreen.setAttribute("class", "full");

        // Calculates the destination position and dimensions of
        // the animated container
        var browserWidth = window.innerWidth;
        var afWidth = browserWidth * this.initialWidth;
        var leftOffset = (browserWidth-afWidth)/2 + "px";
        var afHeight = window.innerHeight + "px";

        // Do fancy animation
        if (this.checkBrowserCssTransforms()) {
            this.matchAnimationWindowPosition();
            this.setAceThemeBackground();

            editors.disableTabResizeEvent();
            this.placeTabIntoAnimationWindow();

            Firmin.animate(this.animateFocus, {
                height: afHeight,
                left: leftOffset,
                top: "0",
                width: afWidth + "px",
                timingFunction: "ease-in-out"
            }, slow ? 3.7 : 0.7, function() {

                _self.isFocused = true;

                // Frustratingly, Firmin does not remove the csstransform attributes
                // after the animation is complete, so we must do it ourselves
                var astyles = "display:block;top:0;height:" + afHeight + ";left:" + leftOffset + ";width:" + afWidth + "px";
                _self.animateFocus.setAttribute("style", astyles);

                apf.layout.forceResize();

                Firmin.animate(_self.focusHandleLeft, {
                    opacity : 1.0,
                    timingFunction: "ease-in-out"
                }, 0.7).animate({
                    opacity : 0.0
                }, 0.5);

                Firmin.animate(_self.focusHandleRight, {
                    opacity : 1.0,
                    timingFunction: "ease-in-out"
                }, 0.7).animate({
                    opacity : 0.0
                }, 0.5);

                setTimeout(function() {
                    ceEditor.focus();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }, 100);
            });

            vbFocus.show();
            Firmin.animate(vbFocus.$ext, {
                opacity: "1"
            }, slow ? 3.5 : 0.5);
        }

        else {
            this.isFocused = true;
            vbFocus.show();
            vbFocus.$ext.style.opacity = "1";

            editors.disableTabResizeEvent();
            this.placeTabIntoAnimationWindow();
            this.animateFocus.style.display = "block";

            var astyles = "display:block;top:0;height:" + afHeight + ";left:" + leftOffset + ";width:" + afWidth + "px";
            this.animateFocus.setAttribute("style", astyles);

            _self.focusHandleLeft.style.opacity = "1.0";
            _self.focusHandleRight.style.opacity = "1.0";

            setTimeout(function() {
                apf.tween.single(_self.focusHandleLeft, {
                    type     : "opacity",
                    anim     : apf.tween.easeInOutCubic,
                    from     : 1.0,
                    to       : 0.0,
                    steps    : 8,
                    interval : 20,
                    control  : (this.control = {}),
                    onfinish : function(){
                    }
                });
                apf.tween.single(_self.focusHandleRight, {
                    type     : "opacity",
                    anim     : apf.tween.easeInOutCubic,
                    from     : 1.0,
                    to       : 0.0,
                    steps    : 8,
                    interval : 20,
                    control  : (this.control = {}),
                    onfinish : function(){
                    }
                });
            }, 700);
            apf.layout.forceResize();

            setTimeout(function() {
                ceEditor.focus();
            }, 100);
        }
    },

    /**
     * Returns the editor to its original, non-focused,
     * non-fullscreen state
     * 
     * @param {boolean} slow Whether to slow down the animation
     */
    escapeFromFocusMode : function(slow) {
        var _self = this;

        btnFocusFullscreen.setAttribute("class", "notfull");
        this.isFocused = false;

        this.focusHandleLeft.style.opacity = "0.0";
        this.focusHandleRight.style.opacity = "0.0";

        tabEditors.parentNode.$ext.style.width = "100%";

        if (this.checkBrowserCssTransforms()) {
            // Get the destination values
            editors.setTabResizeValues(this.animateFocusPosition);
            var left = this.animateFocusPosition.style.left;
            var top = this.animateFocusPosition.style.top;
            var width = this.animateFocusPosition.style.width;
            var height = this.animateFocusPosition.style.height;

            // Set the width to its actual width instead of "85%"
            var afWidth = apf.getHtmlInnerWidth(this.animateFocus);
            this.animateFocus.style.width = afWidth + "px";
            var afHeight = apf.getHtmlInnerHeight(this.animateFocus);
            this.animateFocus.style.height = afHeight + "px";

            Firmin.animate(this.animateFocus, {
                height: height,
                width: width,
                left: left,
                top: top,
                timingFunction: "ease-in-out"
            }, slow ? 3.7 : 0.7, function() {
                _self.animateFocus.style.display = "none";
                // Reset values
                _self.resetTabEditorsParentStyles();
                document.body.appendChild(tabEditors.parentNode.$ext);
                editors.enableTabResizeEvent();
                apf.layout.forceResize(tabEditors.parentNode.$ext);

                setTimeout(function() {
                    ceEditor.focus();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }, 100);
            });

            Firmin.animate(vbFocus.$ext, {
                opacity: "0"
            }, slow ? 3.5 : 0.5, function() {
                vbFocus.hide();
            });
        }
        else {
            this.resetTabEditorsParentStyles();
            document.body.appendChild(tabEditors.parentNode.$ext);
            editors.enableTabResizeEvent();
            this.animateFocus.style.display = "none";
            vbFocus.$ext.style.opacity = "0";
            vbFocus.hide();
            apf.layout.forceResize();
            setTimeout(function() {
                ceEditor.focus();
            }, 100);
        }

    },

    /**
     * Retrieves and saves the styles of tabEditors.parentNode
     * so that when we reset the position of it back to unfocused mode,
     * all those position details remain intact
     */
    saveTabEditorsParentStyles : function() {
        this.teMarginLeft = tabEditors.parentNode.$ext.style.marginLeft;
        this.teMarginRight = tabEditors.parentNode.$ext.style.marginRight;
        this.teLeft = tabEditors.parentNode.$ext.style.left;
        this.teTop = tabEditors.parentNode.$ext.style.top;
    },

    /**
     * Resets the position and style properties of tabEditors.parent
     * to what they were when we saved them in #this.saveTabEditorsParentStyles
     */
    resetTabEditorsParentStyles : function() {
        tabEditors.parentNode.$ext.style.marginLeft = this.teMarginLeft;
        tabEditors.parentNode.$ext.style.marginRight = this.teMarginRight;
        tabEditors.parentNode.$ext.style.left = this.teLeft;
        tabEditors.parentNode.$ext.style.top = this.teTop;
    },

    /**
     * Gets the position and dimensions of tabEditors.parentNode
     * and applies those values to the window that temporarily
     * holds tabEditors.parentNode during the animation
     */
    matchAnimationWindowPosition : function() {
        var tePos = apf.getAbsolutePosition(tabEditors.parentNode.$ext);
        var teWidth = tabEditors.parentNode.getWidth();
        var teHeight = tabEditors.parentNode.getHeight();

        this.animateFocus.style.left = tePos[0] + "px";
        this.animateFocus.style.top = tePos[1] + "px";
        this.animateFocus.style.width = teWidth + "px";
        this.animateFocus.style.height = teHeight + "px";
        this.animateFocus.style.display = "block";
    },
    
    /**
     * Gets the class selectors from the ace_editor element and
     * gets the corresponding bg color for the theme. Then it
     * applies that bg color to the scroller element
     * 
     * Otherwise the default background color is grayish and the
     * animation exposes that bg color - making it look bad
     * 
     * This is hacked and should probably be in Ace already
     */
    setAceThemeBackground : function() {
        // Set the background color so animating doesn't show a dumb gray background
        var ace_editor = document.getElementsByClassName("ace_editor")[0];
        var classNames = ace_editor.getAttribute("class").split(" ");
        for (var cn in classNames) {
            if (classNames[cn].indexOf("ace-") === 0) {
                var selectorString = "." + classNames[cn] + " .ace_scroller";
                var bgColor = apf.getStyleRule(selectorString, "background-color");
                if (!bgColor)
                    bgColor = apf.getStyleRule(".ace_scroller", "background-color");
                ace_editor.style.backgroundColor = bgColor;
                break;
            }
        }
    },

    /**
     * Calls appendChild on the animation window to receive
     * tabEditors.parentNode - then sets the styles of 
     * tabEditors.parentNode so it fits properly into the 
     * animation window
     */
    placeTabIntoAnimationWindow : function() {
        this.animateFocus.appendChild(tabEditors.parentNode.$ext);
        tabEditors.parentNode.$ext.style.width = "100%";
        tabEditors.parentNode.$ext.style.height = "100%";
        tabEditors.parentNode.$ext.style.position = "relative";
        tabEditors.parentNode.$ext.style.left = "0px";
        tabEditors.parentNode.$ext.style.top = "0px";
    },

    /**
     * Called during the onmouseover event from the focus button
     */
    fadeFocusButtonIn : function() {
        apf.tween.single(btnFocusFullscreen, {
            type     : "opacity",
            anim     : apf.tween.easeInOutCubic,
            from     : 0.01,
            to       : 1,
            steps    : 8,
            interval : 20,
            control  : (this.control = {}),
            onfinish : function(){
            }
        });
    },

    /**
     * Called during the onmouseout event from the focus button
     */
    fadeFocusButtonOut : function() {
        apf.tween.single(btnFocusFullscreen, {
            type     : "opacity",
            anim     : apf.tween.easeInOutCubic,
            from     : 1,
            to       : 0.01,
            steps    : 8,
            interval : 20,
            control  : (this.control = {}),
            onfinish : function(){
            }
        });
    },

    enable : function(){
        btnFocusFullscreen.show();
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        if (this.isFocused)
            this.escapeFromFocusMode();
        btnFocusFullscreen.hide();
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});