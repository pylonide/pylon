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
    horScrollAutoHide : true,
    edgeDistance : 3,
    offsetWidth : 0,

    hook : function(){
        var _self = this;

        ide.addEventListener("settings.load", function(e){
            if (!e.model.queryNode("auto/statusbar/@show"))
                e.model.setQueryValue("auto/statusbar/@show", "true");

            var codeSettings = e.model.queryNode("//editors/code");
            if (codeSettings && codeSettings.hasAttribute("autohidehorscrollbar")) {
                _self.horScrollAutoHide = apf.isTrue(codeSettings.getAttribute("autohidehorscrollbar"));
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
        ide.addEventListener("init.ext/code/code", this.$preinit = function(){
            ext.initExtension(_self);
        });
    },
    
    init : function(){
        var _self = this;
        
        ide.addEventListener("theme.init", function(e){
            var cssClass = e.theme.cssClass;
            
            var bg = apf.getStyleRule("." + cssClass + " .ace_scroller", "background-color");
            apf.importStylesheet([
                ["." + cssClass + " .bar-status", "background-color", bg + ", 0.0)"],
                ["." + cssClass + " .bar-status:hover", "background-color", bg + ", 0.95)"]
            ]);
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
        
        ide.addEventListener("init.ext/editors/editors", function(e){
            ide.addEventListener("tab.afterswitch", function(e){
                var editor = e.nextPage.$editor;
                if (!editor.ceEditor) {
                    barIdeStatus.hide();
                    return;
                }
                
                editor = editor.ceEditor.$editor;
                barIdeStatus.show();
            
                _self.updateStatus(editor);
    
                if (!editor.$hasSBEvents) {
                    _self.$onChangeStatus = function(e) {
                        if (_self._timerstatus)
                            return;
    
                        _self._timerselection = setTimeout(function() {
                            _self.updateStatus(editor);
                            _self._timerselection = null;
                        }, 80);
                    };
                    editor.addEventListener("changeSelection", _self.$onChangeStatus);                    
                    editor.addEventListener("changeStatus", _self.$onChangeStatus);
                    editor.$hasSBEvents = true;
                }
            });
        });

        this.sbWidth = ceEditor.$editor.renderer.scrollBar.width;
        barIdeStatus.setAttribute("right", this.sbWidth + this.edgeDistance);
        barIdeStatus.setAttribute("bottom", this.sbWidth + this.edgeDistance);
        ceEditor.$ext.parentNode.appendChild(barIdeStatus.$ext)

        ceEditor.addEventListener("prop.autohidehorscrollbar", function(e) {
            if (e.changed) {
                _self.horScrollAutoHide = !!e.value;
                _self.setPosition();
            }
        });
    },

    updateStatus : function(ace) {
        if (!ace.selection.isEmpty()) {
            var range = ace.getSelectionRange();
            if (this.$showRange) {
                this.$lblSelectionLength = "(" +
                    (range.end.row - range.start.row) + ":" +
                    (range.end.column - range.start.column) + ")";
            } else {
                var value = ace.session.getTextRange(range);
                this.$lblSelectionLength = "(" + value.length + " Bytes)";
            }
            lblSelectionLength.$ext.textContent = this.$lblSelectionLength;
        } else if (this.$lblSelectionLength) {            
            lblSelectionLength.$ext.textContent = this.$lblSelectionLength = "";
        }

        var cursor = ace.selection.lead;
        lblRowCol.setAttribute("caption", (cursor.row + 1) + ":" + (cursor.column + 1));
        
        if (ace.renderer.$horizScroll != this.$horizScroll) {
            this.$horizScroll = ace.renderer.$horizScroll;
            this.setPosition();
        }
    
        var status = "";
        if (ace.$vimModeHandler)
            status = ace.$vimModeHandler.getStatusText();
        else if (ace.commands.recording)
            status = "REC";
        lblEditorStatus.$ext.textContent = status;
    },
    
    toggleSelectionLength: function(){
        this.$showRange = !this.$showRange;
        this.updateStatus(ceEditor.$editor);
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

    setPosition : function() {
        var _self = this;
        var bottom = this.edgeDistance;
        if (this.$horizScroll || !this.horScrollAutoHide)
            bottom += this.sbWidth;

        if (this.$barMoveTimer)
            clearTimeout(this.$barMoveTimer);
                
        this.$barMoveTimer = setTimeout(function() {
            if (typeof barIdeStatus !== "undefined") {
                barIdeStatus.setAttribute("bottom", bottom);
                barIdeStatus.setAttribute("right", _self.sbWidth + _self.edgeDistance + _self.offsetWidth);
            }
        }, 50);
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

