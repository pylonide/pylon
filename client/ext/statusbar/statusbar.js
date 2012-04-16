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

module.exports = ext.register("ext/statusbar/statusbar", {
    name     : "Status bar",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : {
        id   : "statusbar",
        data : skin,
        "media-path" : ide.staticPrefix + "ext/main/style/images/",
        "icon-path"  : ide.staticPrefix + "ext/main/style/icons/"
    },
    expanded: false,
    nodes : [],
    prefsItems: [],
    horScrollAutoHide : "false",
    edgeDistance : 3,
    offsetWidth : 0,

    hook : function(){
        var _self = this;

        ide.addEventListener("loadsettings", function(e){
            /*var strSettings = e.model.queryValue("auto/statusbar");
            if (strSettings === "true") {
                if (_self.inited)
                    _self.toggleStatusBar();
                else
                    _self.toggleOnInit = true;
            }*/
            
            if (!e.model.queryNode("auto/statusbar/@show"))
                e.model.setQueryValue("auto/statusbar/@show", "true");

            var codeSettings = e.model.queryNode("//editors/code");
            if (codeSettings && codeSettings.hasAttribute("autohidehorscrollbar")) {
                _self.horScrollAutoHide = codeSettings.getAttribute("autohidehorscrollbar");
            }
            
            if (apf.isTrue(e.model.queryValue("auto/statusbar/@show")))
                _self.preinit();
        });

//        ide.addEventListener("savesettings", function(e){
//            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/statusbar/text()");
//            xmlSettings.nodeValue = _self.expanded;
//            return true;
//        });

        this.nodes.push(
            menus.addItemByPath("View/Status Bar", new apf.item({
                test : "1",
                type : "check",
                checked : "[{require('ext/settings/settings').model}::auto/statusbar/@show]",
                "onprop.checked" : function(e){
                    if (apf.isTrue(e.value))
                        _self.preinit();
                }
            }), 600)
        );
    },
    
    preinit : function(){
        var _self = this;
        
        ide.addEventListener("init.ext/editors/editors", function(e){
            if (!_self.inited && e.ext 
              && e.ext.currentEditor && e.ext.currentEditor.ceEditor)
                ext.initExtension(_self);
                
            tabEditors.addEventListener("afterswitch", function(e){
                if (e.nextPage.type != "ext/code/code") {
                    if (self.barIdeStatus)
                        barIdeStatus.hide();
                    return;
                }
    
                ext.initExtension(_self);
                barIdeStatus.show();
            });
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
        
        ide.addEventListener("init.ext/editors/editors", function(){
            tabEditors.addEventListener("afterswitch", function(e) {
                if (e.nextPage.type != "ext/code/code")
                    return;
    
                if (!_self.inited) {
                    // Wait a moment for the editor to get into place
                    setTimeout(function() {
                        ext.initExtension(_self);
                    });
                }
    
                if (_self.$changeEvent)
                    _self.editorSession.selection.removeEventListener("changeSelection", _self.$changeEvent);
    
                setTimeout(function() {
                    if(editors.currentEditor.ceEditor) {
                        _self.setSelectionLength();
    
                        _self.editorSession = editors.currentEditor.ceEditor.$editor.session;
                        _self.editorSession.selection.addEventListener("changeSelection", _self.$changeEvent = function(e) {
                            _self.setSelectionLength();
                        });
                    }
                }, 200);
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
                if (e.currentTarget.checked) {    
                    wrapModeViewport.enable();     
                 }
                else {
                    wrapModeViewport.disable();
                 }      
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

    setSelectionLength : function() {
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

