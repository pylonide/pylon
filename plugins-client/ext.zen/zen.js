/**
 * Zen mode
 *
 * @TODO
 * - Disabling the extension doesn't call the disable() function
 * - While animating, disable ability to toggle zen mode (better: cancel and reverse the operation)
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global Firmin vbZen tabEditors btnZenFullscreen vbMain */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var markup = require("text!ext/zen/zen.xml");
var skin = require("text!ext/zen/skin.xml");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");

module.exports = ext.register("ext/zen/zen", {
    name     : "Zen mode",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : {
        id   : "zen",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/main/style/images/",
        "icon-path"  : ide.staticPrefix + "/ext/main/style/icons/"
    },
    isFocused : false,
    neverShown : true,

    defaultOffset : 11,
    offsetWidth : 11,
    initialWidth : 0.70,

    handleLeftMove : false,
    handleRightMove : false,

    entered: false,

    nodes : [],

    hook : function(){
        var _self = this;

        commands.addCommand({
            name: "zen",
            hint: "toggle zen mode",
            bindKey: {mac: "Option-Z", win: "Alt-Z"},
            isAvailable : function(editor){
                return !!editor;
            },
            exec: function () {
                _self.zen();
            }
        });

        commands.addCommand({
            name: "zenslow",
            hint: "toggle zen mode in slow-motion",
            bindKey: {mac: "Shift-Option-Z", win: "Shift-Alt-Z"},
            isAvailable : function(editor){
                return !!editor;
            },
            exec: function () {
                _self.zenslow();
            }
        });

        ide.addEventListener("settings.load", function(e){
            var strSettings = e.model.queryValue("auto/zen");
            if (strSettings)
                _self.initialWidth = strSettings;
        });

        ide.addEventListener("minimap.visibility", function(e) {
            if (e.visibility === "shown")
                _self.offsetWidth = _self.defaultOffset + e.width;
            else
                _self.offsetWidth = _self.defaultOffset;

            _self.updateButtonPosition();
        });

        ide.addEventListener("ext.revisions.show", function(e) {
            _self.offsetWidth = _self.defaultOffset + e.barWidth;
            _self.updateButtonPosition();
        });

        ide.addEventListener("ext.revisions.hide", function(e) {
            _self.offsetWidth = _self.defaultOffset;
            _self.updateButtonPosition();
        });

        ide.addEventListener("init.ext/editors/editors", function(){
            ide.addEventListener("tab.afterswitch", function(e){
                if (e.nextPage.type != "ext/code/code")
                    return;

                if (!_self.inited) {
                    // Wait a moment for the editor to get into place
                    setTimeout(function() {
                        ext.initExtension(_self); //@matt this can be optimized (Ruben)
                    });
                }

                tabEditors.removeEventListener("afterswitch", arguments.callee);
            });
        });

        this.mnuItem = menus.addItemByPath("View/Zen Mode", new apf.item({
            caption : "Zen Mode",
            type    : "check",
            command : "zen"
        }), 200000);
    },

    init : function(){
        var _self = this;

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

        var button = btnZenFullscreen;
        var page = tabEditors && ide.getActivePage();
        if (page.fake)
            page = page.relPage;
        page.appendChild(button);
        ide.addEventListener("tab.afterswitch", function(e) {
            var page = e.nextPage ? e.nextPage.fake ? e.nextPage.relPage : e.nextPage : null;
            if (page && button.parentNode != page)
                page.appendChild(button);
        });

        ide.addEventListener("enterzen", function() {
            // prevent adding vbZen every time the button is clicked
            if (!_self.entered) {
                _self.entered = true;
                vbMain.parentNode.appendChild(new apf.vbox({
                    anchors: "0 0 0 0",
                    id: "vbZen",
                    "class": "vbZen",
                    visible: false
                }));

                vbZen.addEventListener("resize", function(e) {
                    if (_self.isFocused) {
                        _self.calculatePositions();
                    }
                });
            }
        });

        setTimeout(function() {
            _self.updateButtonPosition();
        });

        this.animateZen = document.getElementById("animateZen");
        this.animateZenPosition = document.getElementById("animateZenPosition");

        ide.addEventListener("exitfullscreen", function() {
            _self.escapeFromZenMode(false, true);
        });
    },

    updateButtonPosition : function() {
        if (!window.btnZenFullscreen)
            return;

        // Extra safe default width
        var sbWidth = 20;
        if (editors.currentEditor.name === "Code Editor")
            sbWidth = editors.currentEditor.amlEditor.$editor.renderer.scrollBar.width;

        btnZenFullscreen.setAttribute("right", sbWidth + this.offsetWidth);
    },

    calculatePositions : function() {
        // Calculate the position
        var _self = this;
        _self.animateZen.style.height = window.innerHeight + "px";
        var width = window.innerWidth * _self.initialWidth;
        var widthDiff = (window.innerWidth - width) / 2;
        _self.animateZen.style.width = _self.animateZen.style.width = width + "px";
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
            apf.dragMode = true;
        });

        apf.addListener(this.zenHandleRight, "mousedown", function(e) {
            _self.browserWidth = window.innerWidth;
            _self.handleRightMove = true;
            apf.dragMode = true;
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
                settings.model.setQueryValue("auto/zen/text()", _self.initialWidth);

            _self.handleLeftMove = false;
            _self.handleRightMove = false;
            apf.layout.forceResize();

            apf.dragMode = false;
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
            this.escapeFromZenMode(shiftKey, false);
        else
            this.enterIntoZenMode(shiftKey);
    },

    /**
     * Enters the editor into fullscreen/zen mode
     *
     * @param {boolean} slow Whether to slow down the animation
     */
    enterIntoZenMode : function(slow) {
        ide.dispatchEvent("enterzen");

        var _self = this;

        var activeElement = apf.document.activeElement;

        if (self.btnZenFullscreen)
            btnZenFullscreen.setAttribute("class", "full");

        this.mnuItem.check();

        // Calculates the destination position and dimensions of
        // the animated container
        var browserWidth = window.innerWidth;
        var afWidth = browserWidth * this.initialWidth;
        var leftOffset = (browserWidth-afWidth)/2 + "px";
        var afHeight = window.innerHeight + "px";

        // Do fancy animation
        this.matchAnimationWindowPosition();
        this.setAceThemeBackground();

        this.placeTabIntoAnimationWindow();

        Firmin.animate(this.animateZen, {
            height: afHeight,
            left: leftOffset,
            top: "0",
            width: afWidth + "px",
            timingFunction: "ease-in-out"
        }, slow ? 3.7 : 0.7,
        function() {
            _self.isFocused = true;

            // Frustratingly, Firmin does not remove the csstransform attributes
            // after the animation is complete, so we must do it ourselves
            var astyles = "display:block;top:0;height:" + afHeight + ";left:" + leftOffset + ";width:" + afWidth + "px";
            _self.animateZen.setAttribute("style", astyles);

            apf.layout.forceResize();

            _self.zenHandleLeft.style.display = "block";
            _self.zenHandleRight.style.display = "block";

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
                if (activeElement && activeElement.$focus
                  && activeElement.getHeight())
                    activeElement.$focus();
            }, 100);
        });

        vbZen.show();
        Firmin.animate(vbZen.$ext, {
            opacity: "1"
        }, slow ? 3.5 : 0.5);
    },

    /**
     * Returns the editor to its original, non-zen,
     * non-fullscreen state
     *
     * @param {boolean} slow Whether to slow down the animation
     * @param {boolean} fromExitEvent Whether the call came from an "exitfullscreen" event
     */
    escapeFromZenMode : function(slow, fromExitEvent) {
        if (this.isFocused === false)
            return;

        ide.dispatchEvent("escapezen");

        var _self = this;

        var activeElement = apf.document.activeElement;

        btnZenFullscreen.setAttribute("class", "notfull");
        this.isFocused = false;

        this.mnuItem.uncheck();

        this.zenHandleLeft.style.display = "none";
        this.zenHandleRight.style.display = "none";

        // Get the destination values
        var container = tabEditors.parentNode.parentNode.$ext;
        var pos = apf.getAbsolutePosition(container);
        var left = pos[0];
        var top = pos[1];
        var width = container.offsetWidth;
        var height = container.offsetHeight;

        // Set the width to its actual width instead of "85%"
        var afWidth = apf.getHtmlInnerWidth(this.animateZen);
        this.animateZen.style.width = afWidth + "px";
        var afHeight = apf.getHtmlInnerHeight(this.animateZen);
        this.animateZen.style.height = afHeight + "px";

        Firmin.animate(this.animateZen, {
            height: height + "px",
            width: width + "px",
            left: left + "px",
            top: top + "px",
            timingFunction: "ease-in-out"
        }, slow ? 3.7 : 0.7, function() {
            _self.animateZen.style.display = "none";

            container.appendChild(tabEditors.parentNode.$ext);

            apf.layout.forceResize(tabEditors.parentNode.$ext);

            setTimeout(function() {
                if (activeElement && activeElement.getHeight()
                  && fromExitEvent === false)
                    activeElement.$focus();
            }, 100);
        });

        Firmin.animate(vbZen.$ext, {
            opacity: "0"
        }, slow ? 3.5 : 0.5, function() {
            vbZen.hide();
        });
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
            ];
        }

        this.animateZen.appendChild(tabEditors.parentNode.$ext);

        for (i = reappendlist.length - 1; i >= 0; i--) {
            reappendlist[i][0].insertBefore(
                reappendlist[i][2],
                reappendlist[i][1]);
        }
    },

    /**
     * Called during the onmouseover event from the zen button
     */
    fadeZenButtonIn : function() {
        apf.tween.single(btnZenFullscreen, {
            type     : "opacity",
            anim     : apf.tween.easeInOutCubic,
            from     : 0,
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
        if (window.btnZenFullscreen) {// for the guided tour
            apf.tween.single(btnZenFullscreen, {
                type     : "opacity",
                anim     : apf.tween.easeInOutCubic,
                from     : 1,
                to       : 0,
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
        this.$enable();
    },

    disable : function(){
        if (this.isFocused)
            this.escapeFromZenMode(false, false);
        btnZenFullscreen.hide();
        this.$disable();
    },

    destroy : function(){
        menus.remove("View/Zen");
        commands.removeCommandsByName(["zen", "zenslow"]);
        this.$destroy();
    }
});

});
