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
var markup = require("text!ext/statusbar/statusbar.xml");
var skin = require("text!ext/statusbar/skin.xml");

module.exports = ext.register("ext/statusbar/statusbar", {
    name     : "Status bar",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : {
        id   : "statusbar",
        data : skin,
        "media-path" : ide.staticPrefix + "/style/images/",
        "icon-path"  : ide.staticPrefix + "/style/icons/"
    },
    expanded: false,
    nodes : [],
    toolItems: [],
    prefsItems: [],
    horScrollAutoHide : "false",
    edgeDistance : 3,
    hook : function(){
        var _self = this;
        ide.addEventListener("afteropenfile", this.$aofListener = function() {
            ext.initExtension(_self);
            ide.removeEventListener("afteropenfile", _self.$aofListener);
        });

        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/statusbar");
            if (strSettings === "true") {
                if (_self.inited)
                    _self.toggleStatusBar();
                else
                    _self.toggleOnInit = true;
            }

            var codeSettings = e.model.queryNode("//editors/code");
            if (codeSettings && codeSettings.hasAttribute("autohidehorscrollbar")) {
                _self.horScrollAutoHide = codeSettings.getAttribute("autohidehorscrollbar");
            }
        });

        ide.addEventListener("savesettings", function(e){
            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/statusbar/text()");
            xmlSettings.nodeValue = _self.expanded;
            return true;
        });

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

        tabEditors.addEventListener("afterswitch", function() {
            if (_self.$changeEvent)
                _self.editorSession.selection.removeEventListener("changeSelection", _self.$changeEvent);

            setTimeout(function() {
                if(editors.currentEditor.ceEditor) {
                    _self.editorSession = editors.currentEditor.ceEditor.$editor.session;
                    _self.editorSession.selection.addEventListener("changeSelection", _self.$changeEvent = function(e) {
                        if (typeof lblSelectionLength === "undefined")
                            return;
    
                        var range = ceEditor.$editor.getSelectionRange();
                        if (range.start.row != range.end.row || range.start.column != range.end.column) {
                            var doc = ceEditor.getDocument();
                            var value = doc.getTextRange(range);
                            lblSelectionLength.setAttribute("caption", "(" + value.length + " Bytes)");
                            lblSelectionLength.show();
                        } else {
                            lblSelectionLength.setAttribute("caption", "");
                            lblSelectionLength.hide();
                        }
                    });
                }
            }, 200);
        });

        tabEditors.addEventListener("resize", function() {
            if (ceEditor && ceEditor.$editor) {
                var cw = ceEditor.$editor.renderer.scroller.clientWidth;
                var sw = ceEditor.$editor.renderer.scroller.scrollWidth;
                var bottom = _self.edgeDistance;
                if (cw < sw || _self.horScrollAutoHide === "false")
                    bottom += _self.sbWidth;

                if (_self.$barMoveTimer)
                    clearTimeout(_self.$barMoveTimer);
                _self.$barMoveTimer = setTimeout(function() {
                    if (typeof barIdeStatus !== "undefined") {
                        barIdeStatus.setAttribute("bottom", bottom);
                        barIdeStatus.setAttribute("right", _self.sbWidth + _self.edgeDistance);
                    }
                }, 50);
            }
        });
    },

    init : function(){
        var _self = this;
        var editor = editors.currentEditor;
        if (editor && editor.ceEditor) {
            editor.ceEditor.parentNode.appendChild(barIdeStatus);
            this.sbWidth = ceEditor.$editor.renderer.scrollBar.width;
            barIdeStatus.setAttribute("right", this.sbWidth + this.edgeDistance);
            barIdeStatus.setAttribute("bottom", this.sbWidth + this.edgeDistance);
        }

        hboxStatusBarSettings.$ext.style.overflow = "hidden";

        for(var i = 0, l = this.toolItems.length; i < l; i++) {
            var tItem = this.toolItems[i];
            if (typeof tItem.pos === "number")
                mnuStatusBarTools.insertBefore(tItem.item, mnuStatusBarPrefs.childNodes[tItem.pos]);
            else
                mnuStatusBarTools.appendChild(tItem.item);
        }

        for(var i = 0, l = this.prefsItems.length; i < l; i++) {
            var pItem = this.prefsItems[i];
            if (typeof pItem.pos === "number")
                mnuStatusBarPrefs.insertBefore(pItem.item, mnuStatusBarPrefs.childNodes[pItem.pos]);
            else
                mnuStatusBarPrefs.appendChild(pItem.item);
        }

        var editor = ceEditor.$editor;
        var theme = editor && editor.getTheme() || "ace/theme/textmate";
        this.checkTheme(theme);

        if (this.toggleOnInit)
            this.toggleStatusBar();

        ceEditor.addEventListener("prop.autohidehorscrollbar", function(e) {
            if (e.changed) {
                _self.horScrollAutoHide = e.value ? "true" : "false";
                apf.layout.forceResize(tabEditors.parentNode.$ext);
            }
        });

        ide.addEventListener("track_action", function(e) {
            if(e.type === "vim" && window["lblInsertActive"]) {
                if(e.action === "disable")
                    lblInsertActive.hide();
                else if (e.mode === "insert")
                    lblInsertActive.show();
            }
        });

        this.inited = true;
    },

    addToolsItem: function(menuItem, position){
        if(!self["mnuStatusBarTools"]) {
            this.toolItems.push({ item : menuItem, pos : position });
        }
        else {
            if (typeof position === "number")
                mnuStatusBarTools.insertBefore(menuItem, mnuStatusBarTools.childNodes[position]);
            else
                mnuStatusBarTools.appendChild(menuItem);
        }
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
