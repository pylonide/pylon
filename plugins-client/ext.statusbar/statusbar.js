/**
 * Editor status bar for Cloud9 IDE
 *
 * @TODO
 *
 * Error icon from acebugs
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var markup = require("text!ext/statusbar/statusbar.xml");
var skin = require("text!ext/statusbar/skin.xml");
var menus = require("ext/menus/menus");
var code = require("ext/code/code");

module.exports = ext.register("ext/statusbar/statusbar", {
    name     : "Status bar",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    deps     : [ code ],
    markup   : markup,
    skin     : {
        id   : "c9statusbar",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/main/style/images/",
        "icon-path"  : ide.staticPrefix + "/ext/main/style/icons/"
    },
    expanded: false,
    nodes : [],
    prefsItems: [],
    horScrollAutoHide : "false",
    edgeDistance : 3,
    offsetWidth : 0,

    hook : function(){
        var _self = this;

        ide.addEventListener("settings.load", function(e){
            if (!e.model.queryNode("auto/statusbar/@show"))
                e.model.setQueryValue("auto/statusbar/@show", "true");

            var codeSettings = e.model.queryNode("//editors/code");
            if (codeSettings && codeSettings.hasAttribute("autohidehorscrollbar")) {
                _self.horScrollAutoHide = codeSettings.getAttribute("autohidehorscrollbar");
            }
            
            if (apf.isTrue(e.model.queryValue("auto/statusbar/@show")))
                _self.preinit();
        });

        this.nodes.push(
            menus.addItemByPath("View/Status Bar", new apf.item({
                test : "1",
                type : "check",
                checked : "[{require('ext/settings/settings').model}::auto/statusbar/@show]",
                "onprop.checked" : function(e){
                    if (apf.isTrue(e.value)) {
                        _self.preinit();
                        if (self.barIdeStatus)
                            barIdeStatus.show();
                    }
                    else {
                        if (self.barIdeStatus)
                            barIdeStatus.hide();
                    }
                }
            }), 600)
        );
    },
    
    preinit : function(){
        if (this.inited || this.$preinit)
            return;
        
        var _self = this;
        ide.addEventListener("init.ext/editors/editors", this.$preinit = function(){
            ext.initExtension(_self);
        });
    },
    
    init : function(){
        var _self = this;
        
        ide.addEventListener("theme_change", function(e){
            var theme = e.theme || "ace/theme/textmate";
            _self.checkTheme(theme);
        });

        ide.addEventListener("vim.changeMode", function(e) {
            if (!window["lblInsertActive"])
                return;

            if (e.mode === "insert")
                lblInsertActive.show();
            else
                lblInsertActive.hide();
        });

        ide.addEventListener("minimap.visibility", function(e) {
            if (e.visibility === "shown")
                _self.offsetWidth = e.width;
            else
                _self.offsetWidth = 0;

            _self.setPosition();
        });
        
        ide.addEventListener("revisions.visibility", function(e) {
            if (e.visibility === "shown")
                _self.offsetWidth = e.width;
            else
                _self.offsetWidth = 0;

            _self.setPosition();
        });
        
        ide.addEventListener("init.ext/editors/editors", function(e){
            tabEditors.addEventListener("afterswitch", function(e){
                var editor = e.nextPage.$editor;
                if (!editor.ceEditor) {
                    barIdeStatus.hide();
                    return;
                }
                
                editor = editor.ceEditor;
                barIdeStatus.show();
            
                _self.setSelectionLength(editor);
                _self.setCursorPosition(editor);
    
                var session = editor.$editor.session;
                if (!session.$hasSBEvents) {
                    session.selection.addEventListener("changeSelection", 
                        _self.$changeEventSelection = function(e) {
                            if (_self._timerselection)
                                return;
        
                            _self._timerselection = setTimeout(function() {
                                _self.setSelectionLength(editor);
                                _self._timerselection = null;
                            }, 50);
                        });
                    
                    session.selection.addEventListener("changeCursor",
                        _self.$changeEventCursor = function(e) {
                            if (_self._timercursor)
                                return;
        
                            _self._timercursor = setTimeout(function() {
                                _self.setCursorPosition(editor);
                                _self._timercursor = null;
                            }, 50);
                        });
                    session.$hasSBEvents = true;
                }
            });
            
            tabEditors.addEventListener("resize", function() {
                _self.setPosition();
            });
        });
        
        ide.addEventListener("init.ext/code/code", function(){
            ceEditor.parentNode.appendChild(barIdeStatus);
            _self.sbWidth = ceEditor.$editor.renderer.scrollBar.width;
            barIdeStatus.setAttribute("right", _self.sbWidth + _self.edgeDistance);
            barIdeStatus.setAttribute("bottom", _self.sbWidth + _self.edgeDistance);
    
            hboxStatusBarSettings.$ext.style.overflow = "hidden";
    
            for (var i = 0, l = _self.prefsItems.length; i < l; i++) {
                var pItem = _self.prefsItems[i];
                if (typeof pItem.pos === "number")
                    mnuStatusBarPrefs.insertBefore(pItem.item, mnuStatusBarPrefs.childNodes[pItem.pos]);
                else
                    mnuStatusBarPrefs.appendChild(pItem.item);
            }
    
            !wrapMode.checked ? wrapModeViewport.disable() : wrapModeViewport.enable();    
            wrapMode.addEventListener("click", function(e) {
                if (e.currentTarget.checked)
                    wrapModeViewport.enable();     
                else
                    wrapModeViewport.disable();
            });
            
            var editor = ceEditor.$editor;
            var theme = editor && editor.getTheme() || "ace/theme/textmate";
            _self.checkTheme(theme);
    
    //        if (this.toggleOnInit)
    //            this.toggleStatusBar();
    
            ceEditor.addEventListener("prop.autohidehorscrollbar", function(e) {
                if (e.changed) {
                    _self.horScrollAutoHide = e.value ? "true" : "false";
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }
            });
        });

        ide.addEventListener("track_action", function(e) {
            if(e.type === "vim" && window["lblInsertActive"]) {
                if(e.action === "disable")
                    lblInsertActive.hide();
                else if (e.mode === "insert")
                    lblInsertActive.show();
            }
        });
    },

    addPrefsItem: function(menuItem, position){
        if(!self["mnuStatusBarPrefs"]) {
            this.prefsItems.push({ item: menuItem, pos : position });
        }
        else {
            if (typeof position === "number")
                mnuStatusBarPrefs.insertBefore(menuItem, mnuStatusBarPrefs.childNodes[position]);
            else
                mnuStatusBarPrefs.appendChild(menuItem);
        }
    },

    setSelectionLength : function(editor) {
        var range = editor.$editor.getSelectionRange();
        if (range.start.row != range.end.row || range.start.column != range.end.column) {
            var doc = editor.getDocument();
            var value = doc.getTextRange(range);
            lblSelectionLength.setAttribute("caption", "(" + value.length + " Bytes)");
            lblSelectionLength.show();
        } else {
            lblSelectionLength.setAttribute("caption", "");
            lblSelectionLength.hide();
        }
    },
    
    setCursorPosition : function(editor){
        var cursor = editor.$editor.getSelection().getCursor();
        lblRowCol.setAttribute("caption", (cursor.row + 1) + ":" + (cursor.column + 1));
    },

    toggleStatusBar: function(){
        if(this.expanded) {
            this.expanded = false;
            apf.setStyleClass(barIdeStatus.$ext, '', ["expanded"]);
            apf.tween.single(hboxStatusBarSettings.$ext, {
                type  : "width",
                anim  : apf.tween.easeOutQuint,
                from  : apf.isWebkit ? 50 : 52,
                to    : 1,
                steps : 8,
                interval : 5,
                onfinish : function(){
                    hboxStatusBarSettings.hide();
                }
            });
        }
        else {
            this.expanded = true;
            apf.setStyleClass(barIdeStatus.$ext, "expanded");
            hboxStatusBarSettings.show();
            apf.tween.single(hboxStatusBarSettings.$ext, {
                type  : "width",
                anim  : apf.tween.easeOutQuint,
                from  : 1,
                to    : apf.isWebkit ? 50 : 52,
                steps : 8,
                interval : 5
            });
        }

        settings.save();
    },

    checkTheme: function(theme){
        require(["require", theme], function (require) {
            var reqTheme = require(theme);
            if(reqTheme.isDark)
                apf.setStyleClass(barIdeStatus.$ext, "ace_dark");
            else
                apf.setStyleClass(barIdeStatus.$ext, '', ["ace_dark"]);

            var aceBg = apf.getStyle(ceEditor.$editor.renderer.scroller, "background-color");
            aceBg = aceBg.replace("rgb", "rgba").replace(")", "");
            apf.setStyleRule(".bar-status", "background-color", aceBg + ", 0.0)");
            apf.setStyleRule(".bar-status:hover", "background-color", aceBg + ", 0.95)");
        });
    },

    setPosition : function() {
        if (self.ceEditor && ceEditor.$editor) {
            var _self = this;
            var cw = ceEditor.$editor.renderer.scroller.clientWidth;
            var sw = ceEditor.$editor.renderer.scroller.scrollWidth;
            var bottom = this.edgeDistance;
            if (cw < sw || this.horScrollAutoHide === "false")
                bottom += this.sbWidth;

            if (this.$barMoveTimer)
                clearTimeout(this.$barMoveTimer);
            this.$barMoveTimer = setTimeout(function() {
                if (typeof barIdeStatus !== "undefined") {
                    barIdeStatus.setAttribute("bottom", bottom);
                    barIdeStatus.setAttribute("right", _self.sbWidth + _self.edgeDistance + _self.offsetWidth);
                }
            }, 50);
        }
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        menus.remove("View/Status Bar");
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});

