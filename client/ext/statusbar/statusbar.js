/**
 * The editor status bar for the Cloud9 IDE
 * 
 * @BUGS
 * 
 * Menu alignment is off
 * Right-clicking on bar shows the file tabs contextmenu
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
    hook : function(){
        var _self = this;
        ide.addEventListener("openfile", function() {
            setTimeout(function() {
                ext.initExtension(_self);
            }, 1000);
        });

        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/statusbar");
            if (strSettings === "true") {
                if (_self.inited)
                    _self.toggleStatusBar();
                else
                    _self.toggleOnInit = true;
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
            if (e.mode === "insert") {
                lblInsertActive.show();
                divInsertActive.show();
            } else {
                lblInsertActive.hide();
                divInsertActive.hide();
            }
        });

        tabEditors.addEventListener("afterswitch", function() {
            if (_self.$changeEvent)
                _self.editorSession.selection.removeEventListener("changeSelection", _self.$changeEvent);

            setTimeout(function() {
                _self.editorSession = editors.currentEditor.ceEditor.$editor.session;
                _self.editorSession.selection.addEventListener("changeSelection", _self.$changeEvent = function(e) {
                    var range = ceEditor.$editor.getSelectionRange();
                    if (range.start.row != range.end.row || range.start.column != range.end.column) {
                        var doc = ceEditor.getDocument();
                        var value = doc.getTextRange(range);
                        lblSelectionLength.setAttribute("caption", "(" + value.length + " B)");
                        lblSelectionLength.show();
                        divSelLength.show();
                    } else {
                        lblSelectionLength.setAttribute("caption", "");
                        lblSelectionLength.hide();
                        divSelLength.hide();
                    }
                });
            }, 200);
        });
    },

    init : function(){
        var editor = editors.currentEditor;
        if (editor && editor.ceEditor) {
            editor.ceEditor.parentNode.appendChild(barIdeStatus);
            var sbWidth = ceEditor.$editor.renderer.scrollBar.width;
            barIdeStatus.setAttribute("right", sbWidth + 5);
        }

        hboxStatusBarSettings.$ext.style.overflow = "hidden";

        for(var i = 0, l = this.toolItems.length; i < l; i++) {
            mnuStatusBarTools.appendChild(this.toolItems.shift());
        }

        for(var i = 0, l = this.prefsItems.length; i < l; i++) {
            mnuStatusBarPrefs.appendChild(this.prefsItems.shift());
        }

        var editor = ceEditor.$editor;
        var theme = editor && editor.getTheme() || "ace/theme/textmate";
        this.checkTheme(theme);

        if (this.toggleOnInit)
            this.toggleStatusBar();

        this.inited = true;
    },

    addToolsItem: function(menuItem){
        if(!self["mnuStatusBarTools"])
            this.toolItems.push(menuItem);
        else
            mnuStatusBarTools.appendChild(menuItem);
    },

    addPrefsItem: function(menuItem){
        if(!self["mnuStatusBarPrefs"])
            this.prefsItems.push(menuItem);
        else
            mnuStatusBarPrefs.appendChild(menuItem);
    },

    toggleStatusBar: function(){
        if(this.expanded) {
            this.expanded = false;
            apf.setStyleClass(barIdeStatus.$ext, '', ["expanded"]);
            apf.tween.single(hboxStatusBarSettings.$ext, {
                type  : "width",
                anim  : apf.tween.easeOutQuint,
                from  : 49,
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
                to    : 49,
                steps : 8,
                interval : 5
            });
        }
    },

    checkTheme: function(theme){
        require(["require", theme], function (require) {
            if(require(theme).isDark)
                apf.setStyleClass(barIdeStatus.$ext, "ace_dark");
            else
                apf.setStyleClass(barIdeStatus.$ext, '', ["ace_dark"]);
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
