/**
 * Fullscreen focus for the editor tabs
 * 
 * @TODO
 * - 100% height isn't working with firefox
 * - Why doesn't disabling the extension enter into the disable() function??
 * - Animate the window to full, and visa versa; consider this: http://extralogical.net/projects/firmin/
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

    focus : function() {
        this.toggleFullscreenFocus();
    },

    toggleFullscreenFocus : function() {
        if (this.isFocused)
            this.escapeFromFullscreen();
        else
            this.enterIntoFullscreen();
    },
    
    escapeFromFullscreen : function() {
        tabEditors.parentNode.$ext.style.width = this.teWidth;
        tabEditors.parentNode.$ext.style.height = this.teHeight;
        tabEditors.parentNode.$ext.style.marginLeft = this.teMarginLeft;
        tabEditors.parentNode.$ext.style.marginRight = this.teMarginRight;
        tabEditors.parentNode.$ext.style.left = this.teLeft;
        tabEditors.parentNode.$ext.style.top = this.teTop;
        //tabEditors.parentNode.$ext.style.paddingBottom = this.tePaddingBottom;
        tabEditors.parentNode.$ext.style.mozBoxShadow = "none";
        tabEditors.parentNode.$ext.style.webkitBoxShadow = "none";
        document.body.appendChild(tabEditors.parentNode.$ext);
        editors.enableTabResizeEvent();
        btnFocusFullscreen.setAttribute("class", "notfull");

        if(apf.isWebkit && (apf.versionSafari >= 3.1 || apf.versionChrome >= 11)) {
            Firmin.animate(vbFocus.$ext, {
                opacity: "0"
            }, 0.5, function() {
                vbFocus.hide();
            });
        }
        else {
            vbFocus.$ext.style.opacity = "0";
            vbFocus.hide();
        }
        apf.layout.forceResize();
        setTimeout(function() {
            ceEditor.focus();
        }, 100);
        this.isFocused = false;
    },

    enterIntoFullscreen : function() {
        this.teWidth = tabEditors.parentNode.$ext.style.width;
        this.teHeight = tabEditors.parentNode.$ext.style.height;
        this.teMarginLeft = tabEditors.parentNode.$ext.style.marginLeft;
        this.teMarginRight = tabEditors.parentNode.$ext.style.marginRight;
        this.teLeft = tabEditors.parentNode.$ext.style.left;
        this.teTop = tabEditors.parentNode.$ext.style.top;
        btnFocusFullscreen.setAttribute("class", "full");
        // Do fancy animation
        if(apf.isWebkit && (apf.versionSafari >= 3.1 || apf.versionChrome >= 11)) {
            var tePos = apf.getAbsolutePosition(tabEditors.parentNode.$ext);
            var teWidth = tabEditors.parentNode.getWidth();
            var teHeight = tabEditors.parentNode.getHeight();

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

            var animateFocus = document.getElementById("animateFocus");
            animateFocus.style.left = tePos[0] + "px";
            animateFocus.style.top = tePos[1] + "px";
            animateFocus.style.width = teWidth + "px";
            animateFocus.style.height = teHeight + "px";
            animateFocus.style.display = "block";

            editors.disableTabResizeEvent();
            animateFocus.appendChild(tabEditors.parentNode.$ext);
            tabEditors.parentNode.$ext.style.width = "100%";
            tabEditors.parentNode.$ext.style.height = "100%";
            tabEditors.parentNode.$ext.style.position = "relative";
            tabEditors.parentNode.$ext.style.left = "0px";
            tabEditors.parentNode.$ext.style.top = "0px";

            var browserWidth = apf.getHtmlInnerWidth(document.body);
            var afWidth = browserWidth * 0.85;
            var leftOffset = (browserWidth-afWidth)/2;
            Firmin.animate(animateFocus, {
                height: "100%",
                left: leftOffset + "px",
                top: "0",
                width: afWidth + "px",
                timingFunction: "ease-in-out"
            }, 1.0, function() {
                animateFocus.style.display = "none";
                vbFocus.appendChild(tabEditors.parentNode);

                tabEditors.parentNode.$ext.style.width = "85%";
                tabEditors.parentNode.$ext.style.height = "100%";
                tabEditors.parentNode.$ext.style.marginLeft = "auto";
                tabEditors.parentNode.$ext.style.marginRight = "auto";
                tabEditors.parentNode.$ext.style.left = "0";
                tabEditors.parentNode.$ext.style.top = "0";
                tabEditors.parentNode.$ext.style.mozBoxShadow = "0px 0px 25px #000";
                tabEditors.parentNode.$ext.style.webkitBoxShadow = "0px 0px 25px #000";
                apf.layout.forceResize();
                setTimeout(function() {
                    ceEditor.focus();
                }, 100);
            });
            vbFocus.show();
            Firmin.animate(vbFocus.$ext, {
                opacity: "1"
            }, 0.5);
        }
        else {
            vbFocus.show();
            vbFocus.$ext.style.opacity = "1";
            vbFocus.appendChild(tabEditors.parentNode);
            editors.disableTabResizeEvent();

            tabEditors.parentNode.$ext.style.width = "85%";
            tabEditors.parentNode.$ext.style.height = "100%";
            tabEditors.parentNode.$ext.style.marginLeft = "auto";
            tabEditors.parentNode.$ext.style.marginRight = "auto";
            tabEditors.parentNode.$ext.style.left = "0";
            tabEditors.parentNode.$ext.style.top = "0";
            tabEditors.parentNode.$ext.style.mozBoxShadow = "0px 0px 25px #000";
            tabEditors.parentNode.$ext.style.webkitBoxShadow = "0px 0px 25px #000";
            btnFocusFullscreen.setAttribute("class", "full");
            apf.layout.forceResize();
            setTimeout(function() {
                ceEditor.focus();
            }, 100);
        }

        this.isFocused = true;
    },

    fadeButtonIn : function() {
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

    fadeButtonOut : function() {
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
            this.escapeFromFullscreen();
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