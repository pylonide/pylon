/**
 * Fullscreen focus for the editor tabs
 * 
 * @TODO
 * - 100% height isn't working with firefox
 * - Why doesn't disabling the extension call the disable() function??
 * - Animate the window out of focused mode
 * - Exit focus mode when doing any keybinding operation (except openfiles, quicksearch, gotoline)
 * - Ability to modify width of container (a la Lion Safari)
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var canon = require("pilot/canon");
var editors = require("ext/editors/editors");
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
    
    commands : {
        "focus": {hint: "toggle editor focus mode"}
    },

    nodes : [],

    init : function(amlNode){
        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(btnFocusFullscreen);
        
        // @TODO adjust position based on scrollbar width
        if (!(apf.isChrome && apf.versionChrome >= 14) && !(apf.isSafari && apf.versionSafari >= 5))
            btnFocusFullscreen.setAttribute("right", "26");

        if (apf.isWin)
            btnFocusFullscreen.setAttribute("right", "28");

        this.animateFocus = document.getElementById("animateFocus");
    },

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
    },

    /**
     * Method attached to key combination (Cmd/Ctrl + E)
     */
    focus : function() {
        this.toggleFullscreenFocus();
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

        // Do fancy animation
        if (this.checkBrowserCssTransforms()) {
            this.matchAnimationWindowPosition();
            this.setAceThemeBackground();

            editors.disableTabResizeEvent();
            this.placeTabIntoAnimationWindow();

            // Calculates the anticipated width and left placement position
            // of the tabEditors.parentNode after it's done being animated,
            // so there is an un-noticeable transition from the end of the
            // animation to where the tabEditors.parentNode eventually rests
            var browserWidth = apf.getHtmlInnerWidth(document.body);
            var afWidth = browserWidth * 0.85;
            var leftOffset = (browserWidth-afWidth)/2;
            Firmin.animate(this.animateFocus, {
                height: "100%",
                left: leftOffset + "px",
                top: "0",
                width: afWidth + "px",
                timingFunction: "ease-in-out"
            }, slow ? 3.7 : 0.7, function() {
                _self.animateFocus.style.display = "none";
                vbFocus.appendChild(tabEditors.parentNode);

                _self.setFocusedTabParentStyles();

                setTimeout(function() {
                    ceEditor.focus();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }, 100);
            });

            // Not sure why but if we don't use setTimeout here
            // the animation happens instantaneously
            setTimeout(function() {
                vbFocus.show();
                Firmin.animate(vbFocus.$ext, {
                    opacity: "1"
                }, slow ? 3.5 : 0.5);
            }, 0);
        }
        else {
            vbFocus.show();
            vbFocus.$ext.style.opacity = "1";
            vbFocus.appendChild(tabEditors.parentNode);
            editors.disableTabResizeEvent();

            this.setFocusedTabParentStyles();

            btnFocusFullscreen.setAttribute("class", "full");

            setTimeout(function() {
                ceEditor.focus();
            }, 0);
        }

        this.isFocused = true;
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

        if (this.checkBrowserCssTransforms()) {
            // Get the destination values
            editors.setTabResizeValues(this.animateFocus);
            var left = this.animateFocus.style.left;
            var top = this.animateFocus.style.top;
            var width = this.animateFocus.style.width;
            var height = this.animateFocus.style.height;

            this.matchAnimationWindowPosition();
            this.placeTabIntoAnimationWindow();

            // Not sure why but setTimeout seems to be the only
            // way to get the animation to not happen instantaneously
            setTimeout(function() {
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
            }, 0);
        }
        else {
            this.resetTabEditorsParentStyles();
            document.body.appendChild(tabEditors.parentNode.$ext);
            editors.enableTabResizeEvent();
            vbFocus.$ext.style.opacity = "0";
            vbFocus.hide();
            apf.layout.forceResize();
            setTimeout(function() {
                ceEditor.focus();
            }, 100);
        }

        this.isFocused = false;
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
        tabEditors.parentNode.$ext.style.mozBoxShadow = "none";
        tabEditors.parentNode.$ext.style.webkitBoxShadow = "none";
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
     * This is hacked and should be in Ace already
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
     * After the tabEditors.parentNode has been transplanted into
     * vbFocus, this sets the styles so it looks and resizes
     * in a normal way within its new parent
     * 
     * After all the styles are set it resizes the layout so all the
     * tab headers get resized and the ace highlight line extens all
     * the way
     */
    setFocusedTabParentStyles : function() {
        tabEditors.parentNode.$ext.style.width = "85%";
        tabEditors.parentNode.$ext.style.height = "100%";
        tabEditors.parentNode.$ext.style.marginLeft = "auto";
        tabEditors.parentNode.$ext.style.marginRight = "auto";
        tabEditors.parentNode.$ext.style.left = "0";
        tabEditors.parentNode.$ext.style.top = "0";
        tabEditors.parentNode.$ext.style.mozBoxShadow = "0px 0px 25px #000";
        tabEditors.parentNode.$ext.style.webkitBoxShadow = "0px 0px 25px #000";

        apf.layout.forceResize();
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