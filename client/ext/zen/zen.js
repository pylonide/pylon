/**
 * Zen mode
 *
 * @TODO
 * - Disabling the extension doesn't call the disable() function
 * - Exit zen mode when doing any keybinding operation (except openfiles, quicksearch, gotoline)
 * - While animating, disable ability to toggle zen mode (better: cancel and reverse the operation)
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

require("ext/zen/firmin-all-min");

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var markup = require("text!ext/zen/zen.xml");
var skin = require("text!ext/zen/skin.xml");

module.exports = ext.register("ext/zen/zen", {
    name     : "Zen mode",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : {
        id   : "zen",
        data : skin,
        "media-path" : ide.staticPrefix + "/style/images/",
        "icon-path"  : ide.staticPrefix + "/style/icons/"
    },
    isFocused : false,
    neverShown : true,

    initialWidth : 0.70,

    handleLeftMove : false,
    handleRightMove : false,

    commands : {
        "zen": {hint: "toggle zen mode"},
        "zenslow": {hint: "toggle zen mode in slow-motion"}
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
            var strSettings = e.model.queryValue("auto/zen");
            if (strSettings)
                _self.initialWidth = strSettings;
        });

        ide.addEventListener("savesettings", function(e){
            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/zen/text()");
            xmlSettings.nodeValue = _self.initialWidth;
            return true;
        });
    },

    init : function(amlNode){
        // Create all the elements used here
        this.animateZen = document.createElement("div");
        this.animateZen.setAttribute("id", "animateZen");
        this.animateZen.setAttribute("style", "display: none");
        document.body.appendChild(this.animateZen);

        this.animateZenPosition = document.createElement("div");
        this.animateZenPosition.setAttribute("id", "animateZenPosition");
        this.animateZenPosition.setAttribute("style", "display: none");
        document.body.appendChild(this.animateZenPosition);

        this.zenHandleLeft = document.createElement("div");
        this.zenHandleLeft.setAttribute("id", "zenHandleLeft");
        this.zenHandleLeft.setAttribute("style", "opacity: 0.0");
        document.body.appendChild(this.zenHandleLeft);

        this.zenHandleRight = document.createElement("div");
        this.zenHandleRight.setAttribute("id", "zenHandleRight");
        this.zenHandleRight.setAttribute("style", "opacity: 0.0");
        document.body.appendChild(this.zenHandleRight);

        this.setupHandleListeners();

        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(btnZenFullscreen);

        vbMain.parentNode.appendChild(new apf.vbox({
            anchors: "0 0 0 0",
            id: "vbZen",
            "class": "vbZen",
            visible: false
        }));

        // @TODO adjust position based on scrollbar width
        if (!(apf.isChrome && apf.versionChrome >= 14) && !(apf.isSafari && apf.versionSafari >= 5))
            btnZenFullscreen.setAttribute("right", "26");

        if (apf.isWin)
            btnZenFullscreen.setAttribute("right", "28");

        this.animateZen = document.getElementById("animateZen");
        this.animateZenPosition = document.getElementById("animateZenPosition");

        var _self = this;
        vbZen.addEventListener("resize", function(e) {
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
        _self.animateZen.style.height = window.innerHeight + "px";
        var width = window.innerWidth * _self.initialWidth;
        var widthDiff = (window.innerWidth - width) / 2;
        tabEditors.parentNode.$ext.style.width = _self.animateZen.style.width = width + "px";
        _self.animateZen.style.left = widthDiff + "px";

        // Set the resize handle positions
        _self.zenHandleLeft.style.height = window.innerHeight + "px";
        _self.zenHandleLeft.style.left = (widthDiff+0) + "px";
        _self.zenHandleRight.style.height = window.innerHeight + "px";
        _self.zenHandleRight.style.left = ((widthDiff + width) - 5) + "px";
    },

    // @TODO implement removeListeners
    setupHandleListeners : function() {
        var _self = this;

        apf.addListener(this.zenHandleLeft, "mousedown", function(e) {
            _self.browserWidth = window.innerWidth;
            _self.handleLeftMove = true;
        });

        apf.addListener(this.zenHandleRight, "mousedown", function(e) {
            _self.browserWidth = window.innerWidth;
            _self.handleRightMove = true;
        });

        apf.addListener(document, "mousemove", function(e) {
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

        apf.addListener(document, "mouseup", function() {
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
    zen : function() {
        this.toggleFullscreenZen();
    },

    /**
     * Method attached to key combo for slow mode (Shift)
     */
    zenslow : function() {
        this.toggleFullscreenZen({ htmlEvent : { shiftKey : true }});
    },

    /**
     * Method invoked to do the actual toggling of zen mode
     * Detects if zened or not
     *
     * @param {amlEvent} e Event from click
     */
    toggleFullscreenZen : function(e) {
        var shiftKey = false;
        if (e)
            shiftKey = e.htmlEvent.shiftKey;

        if (this.isFocused)
            this.escapeFromZenMode(shiftKey);
        else
            this.enterIntoZenMode(shiftKey);
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
     * Enters the editor into fullscreen/zen mode
     *
     * @param {boolean} slow Whether to slow down the animation
     */
    enterIntoZenMode : function(slow) {
        var _self = this;

        this.saveTabEditorsParentStyles();
        if (self.btnZenFullscreen)
            btnZenFullscreen.setAttribute("class", "full");

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

            Firmin.animate(this.animateZen, {
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
                _self.animateZen.setAttribute("style", astyles);

                apf.layout.forceResize();

                Firmin.animate(_self.zenHandleLeft, {
                    opacity : 1.0,
                    timingFunction: "ease-in-out"
                }, 0.7).animate({
                    opacity : 0.0
                }, 0.5);

                Firmin.animate(_self.zenHandleRight, {
                    opacity : 1.0,
                    timingFunction: "ease-in-out"
                }, 0.7).animate({
                    opacity : 0.0
                }, 0.5);

                setTimeout(function() {
                    if (self.ceEditor)
                        ceEditor.focus();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }, 100);
            });

            vbZen.show();
            Firmin.animate(vbZen.$ext, {
                opacity: "1"
            }, slow ? 3.5 : 0.5);
        }

        else {
            this.isFocused = true;
            vbZen.show();
            vbZen.$ext.style.opacity = "1";

            editors.disableTabResizeEvent();
            this.placeTabIntoAnimationWindow();
            this.animateZen.style.display = "block";

            var astyles = "display:block;top:0;height:" + afHeight + ";left:" + leftOffset + ";width:" + afWidth + "px";
            this.animateZen.setAttribute("style", astyles);

            _self.zenHandleLeft.style.opacity = "1.0";
            _self.zenHandleRight.style.opacity = "1.0";

            setTimeout(function() {
                apf.tween.single(_self.zenHandleLeft, {
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
                apf.tween.single(_self.zenHandleRight, {
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
     * Returns the editor to its original, non-zen,
     * non-fullscreen state
     *
     * @param {boolean} slow Whether to slow down the animation
     */
    escapeFromZenMode : function(slow) {
        var _self = this;

        btnZenFullscreen.setAttribute("class", "notfull");
        this.isFocused = false;

        this.zenHandleLeft.style.opacity = "0.0";
        this.zenHandleRight.style.opacity = "0.0";

        tabEditors.parentNode.$ext.style.width = "100%";

        if (this.checkBrowserCssTransforms()) {
            // Get the destination values
            editors.setTabResizeValues(this.animateZenPosition);
            var left = this.animateZenPosition.style.left;
            var top = this.animateZenPosition.style.top;
            var width = this.animateZenPosition.style.width;
            var height = this.animateZenPosition.style.height;

            // Set the width to its actual width instead of "85%"
            var afWidth = apf.getHtmlInnerWidth(this.animateZen);
            this.animateZen.style.width = afWidth + "px";
            var afHeight = apf.getHtmlInnerHeight(this.animateZen);
            this.animateZen.style.height = afHeight + "px";

            Firmin.animate(this.animateZen, {
                height: height,
                width: width,
                left: left,
                top: top,
                timingFunction: "ease-in-out"
            }, slow ? 3.7 : 0.7, function() {
                _self.animateZen.style.display = "none";
                // Reset values
                _self.resetTabEditorsParentStyles();

                apf.document.body.appendChild(tabEditors.parentNode);

                editors.enableTabResizeEvent();
                apf.layout.forceResize(tabEditors.parentNode.$ext);

                tabEditors.parentNode.$ext.style.position = "absolute";

                setTimeout(function() {
                    if (self.ceEditor)
                        ceEditor.focus();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }, 100);
            });

            Firmin.animate(vbZen.$ext, {
                opacity: "0"
            }, slow ? 3.5 : 0.5, function() {
                vbZen.hide();
            });
        }
        else {
            this.resetTabEditorsParentStyles();

            apf.document.body.appendChild(tabEditors.parentNode);

            editors.enableTabResizeEvent();
            this.animateZen.style.display = "none";
            vbZen.$ext.style.opacity = "0";
            vbZen.hide();

            tabEditors.parentNode.$ext.style.position = "absolute";

            apf.layout.forceResize();
            setTimeout(function() {
                ceEditor.focus();
            }, 100);
        }

    },

    /**
     * Retrieves and saves the styles of tabEditors.parentNode
     * so that when we reset the position of it back to unzen mode,
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

        this.animateZen.style.left = tePos[0] + "px";
        this.animateZen.style.top = tePos[1] + "px";
        this.animateZen.style.width = teWidth + "px";
        this.animateZen.style.height = teHeight + "px";
        this.animateZen.style.display = "block";
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
        if (!ace_editor)
            return;

        var classNames = ace_editor.getAttribute("class").split(" ");
        for (var cn = 0; cn < classNames.length; cn++) {
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
        var reappendlist = [];
        var iframelist   = apf.getArrayFromNodelist(
            tabEditors.parentNode.$ext.getElementsByTagName("iframe"));

        for (var i = 0; i < iframelist.length; i++) {
            reappendlist[i] = [
                iframelist[i].parentNode,
                iframelist[i].nextSibling,
                document.adoptNode(iframelist[i]),
            ]
        }

        this.animateZen.appendChild(tabEditors.parentNode.$ext);

        for (var i = reappendlist.length - 1; i >= 0; i--) {
            reappendlist[i][0].insertBefore(
                reappendlist[i][2],
                reappendlist[i][1]);
        }

        //this.animateZen.appendChild(tabEditors.parentNode.$ext);
        tabEditors.parentNode.$ext.style.width = "100%";
        tabEditors.parentNode.$ext.style.height = "100%";
        tabEditors.parentNode.$ext.style.position = "relative";
        tabEditors.parentNode.$ext.style.left = "0px";
        tabEditors.parentNode.$ext.style.top = "0px";
    },

    /**
     * Called during the onmouseover event from the zen button
     */
    fadeZenButtonIn : function() {
        apf.tween.single(btnZenFullscreen, {
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
     * Called during the onmouseout event from the zen button
     */
    fadeZenButtonOut : function() {
        if (self["btnZenFullscreen"]) {// for the guided tour
            apf.tween.single(btnZenFullscreen, {
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
        } 
    },

    enable : function(){
        btnZenFullscreen.show();
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        if (this.isFocused)
            this.escapeFromZenMode();
        btnZenFullscreen.hide();
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
