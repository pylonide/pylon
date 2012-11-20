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

/*global barIdeStatus lblInsertActive lblSelectionLength lblRowCol lblEditorStatus hboxStatusBarSettings mdlStatusBar*/

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var settings = require("ext/settings/settings");
var markup = require("text!ext/statusbar/statusbar.xml");
var skin = require("text!ext/statusbar/skin.xml");
var menus = require("ext/menus/menus");
var code = require("ext/code/code");
var editors = require("ext/editors/editors");

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
    viewStatusBarMenuItem: null,

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
        
        this.viewStatusBarMenuItem = new apf.item({
            test : "1",
            type : "check",
            checked : "[{require('ext/settings/settings').model}::auto/statusbar/@show]",
            // -> if you're looking for disabled, check the init function :-)
            // the moment that someone clicks this thing well call preinit 
            // (its already called if the user has it checked on IDE load)
            "onprop.checked": function (ev) {
                if (ev.value) {
                    _self.preinit();
                }
                // if weve already been loaded, then update the status here
                // otherwise it'll be done in init
                if (window.mdlStatusBar) {
                    apf.xmldb.setAttribute(mdlStatusBar.data.selectSingleNode("//state"), "showStatusbar", ev.value);
                }
            }
        });
        
        this.nodes.push(menus.addItemByPath("View/Status Bar", this.viewStatusBarMenuItem, 600));
    },
    
    preinit : function(){
        if (this.inited || this.$preinit)
            return;
        
        var _self = this;
        
        var doIt = function () {
            // if we called ourselves directly there is no event handler
            // but the IDE doesnt really care
            ide.removeEventListener("init.ext/code/code", doIt);
            ext.initExtension(_self);
        };
        
        // code editor not loaded yet? then wait for it...
        if (!code.inited) {
            ide.addEventListener("init.ext/code/code", doIt);
        }
        else {
            doIt();
        }
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
            if (!window.lblInsertActive)
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
                _self.onAfterSwitch(editor);
            });
        });

        this.sbWidth = code.amlEditor.$editor.renderer.scrollBar.width;
        barIdeStatus.setAttribute("right", this.sbWidth + this.edgeDistance);
        barIdeStatus.setAttribute("bottom", this.sbWidth + this.edgeDistance);
        code.amlEditor.$ext.parentNode.appendChild(barIdeStatus.$ext);

        code.amlEditor.addEventListener("prop.autohidehorscrollbar", function(e) {
            if (e.changed) {
                _self.horScrollAutoHide = !!e.value;
                _self.setPosition();
            }
        });
        
        // load model with initial values
        var state = mdlStatusBar.data.selectSingleNode("//state");
        apf.xmldb.setAttribute(state, "isCodeEditor", !!(editors.currentEditor && editors.currentEditor.path == "ext/code/code"));
        apf.xmldb.setAttribute(state, "showStatusbar", apf.isTrue(settings.model.queryValue("auto/statusbar/@show")));
        
        // if we assign this before the plugin has been init'ed it will create some empty model
        // itself because we reference a non existing model
        _self.viewStatusBarMenuItem.setAttribute("disabled", '{apf.isFalse([mdlStatusBar::state/@isCodeEditor])}');
        
        // if we have an editor, make sure to update the UI
        if (editors.currentEditor) {
            _self.onAfterSwitch(editors.currentEditor);
        }
    },
    
    onAfterSwitch : function (editor) {
        var _self = this;
        
        if (!editor)
            return;
        
        // update the model so we can use this info in the XML
        apf.xmldb.setAttribute(mdlStatusBar.data.selectSingleNode("//state"), "isCodeEditor", editor.path === "ext/code/code");
        
        // if we dont have a code editor then continue
        if (editor.path != "ext/code/code")
            return;
        
        editor = editor.amlEditor.$editor;
    
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
    },

    updateStatus : function(ace) {
        if (!ace.selection.isEmpty()) {
            var selectionLength;
            var range = ace.getSelectionRange();
            if (this.$showRange) {
                selectionLength = "(" +
                    (range.end.row - range.start.row) + ":" +
                    (range.end.column - range.start.column) + ")";
            } 
            else {
                var value = ace.session.getTextRange(range);
                selectionLength = "(" + value.length + " Bytes)";
            }
            
            lblSelectionLength.setAttribute("caption", selectionLength);
        } 
        else {
            lblSelectionLength.setAttribute("caption", "");
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
            
        lblEditorStatus.setAttribute("caption", status);
    },
    
    toggleSelectionLength: function(){
        this.$showRange = !this.$showRange;
        this.updateStatus(code.amlEditor.$editor);
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

    destroy : function(){
        menus.remove("View/Status Bar");
        this.$destroy();
    }
});

});
