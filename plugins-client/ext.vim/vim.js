/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {
"use strict";

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var code = require("ext/code/code");
var cli = require("ext/vim/cli");
var menus = require("ext/menus/menus");
var settings = require("ext/settings/settings");
var markupSettings =  require("text!ext/vim/settings.xml");
var themes = require("ext/themes/themes");
//var commands = require("ext/commands/commands");


module.exports = ext.register("ext/vim/vim", {
    name  : "Vim mode",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    deps  : [editors, code, settings],
    nodes : [],
    alone : true,

    hook : function() {
        var _self = this;
        var mnuKbModes = menus.addItemByPath("View/Keyboard Mode/", new apf.menu({
            "onprop.visible" : function(e){
                if (e.value)
                    mnuKbModes.select(null, settings.model.queryValue("editors/code/@keyboardmode"));
            }
        }), 150000);
        var c = 1000;
        function addItem(label) {
            menus.addItemByPath("View/Keyboard Mode/" + label, new apf.item({
                type: "radio",
                value: label.toLowerCase(), 
                onclick : function(e) {
                    _self.setMode(mnuKbModes.getValue());
                }
            }), c+=100);
        }
        window.mnuKbModes=mnuKbModes
        
        addItem("Default");
        addItem("Vim");
        addItem("Emacs");

        ide.addEventListener("settings.load", function(){
            // remove old setting
            var codeSettings = settings.model.queryNode("editors/code");
            if (codeSettings.hasAttribute("vimmode")) {
                codeSettings.removeAttribute("vimmode");
            }
            settings.setDefaults("editors/code", [
                ["keyboardmode", "default"]
            ]);
        });

        //settings.addSettings("Code Editor", markupSettings);

        var tryEnabling = function () {
            _self.setMode();
        };
        ide.addEventListener("init.ext/code/code", tryEnabling);
        ide.addEventListener("code.ext:defaultbindingsrestored", tryEnabling);
        
        ide.addEventListener("theme.change", this.updateTheme.bind(this));

    },

    setMode: function(mode) {
        if (!settings.model)
            return;
            
        var codeSettings = settings.model.queryNode("editors/code");
        if (mode == undefined) {
            mode = codeSettings.getAttribute("keyboardmode");
        } else {
            codeSettings.setAttribute("keyboardmode", mode);
            settings.save();
        }

        ext.initExtension(this);
               
        var editor = code.amlEditor.$editor
        if (mode == "emacs" || mode == "vim")
            mode = "ace/keyboard/" + mode
        else
            mode = null;

        editor.setKeyboardHandler(mode);
   
        if (mode) {
            this.getCommandLine().show();
            editor.cmdLine = this.cmdLine.ace;
            editor.showCommandLine = function(val) {
                editor.cmdLine.editor = editor;
                module.exports.cmdLine.show();
                editor.cmdLine.focus();
                if (typeof val == "string")
                    editor.cmdLine.setValue(val, 1);
            }
        } else if (this.cmdLine) {
            this.cmdLine.hide();
        }
    },

    init: function() {
    },

    enable: function() {
    },

    getCommandLine: function() {
        if (!this.cmdLine) {
            this.cmdLine = new apf.codebox();
            this.cmdLine.setHeight(19);
            colMiddle.appendChild(this.cmdLine);
            this.cmdLine.$ext.className = "searchbox tb_console";
            this.updateTheme();
            cli.initCmdLine(this.cmdLine.ace);
        }
        return this.cmdLine;
    },
    
    updateTheme: function() {
        if (!this.cmdLine)
            return;
        var style = this.cmdLine.ace.container.parentNode.style;
        style.padding = "2px 1px 1px 3px";
        style.border = "none";
        style.borderTop = "1px solid rgba(0, 0, 0, .3)";
        style.boxShadow = "inset 0 3px 10px 0 rgba(0, 0, 0, .1)";
        var activeTheme = themes.getActiveTheme();
        if (!activeTheme)
            return;
        this.cmdLine.ace.setTheme(activeTheme);
        style.background = activeTheme.textBg;
    },

    disable: function() {
        var editor = code.amlEditor.$editor;
        if (editor) {
            editor.keyBinding.removeKeyboardHandler(editor.$vimModeHandler);
            editor.keyBinding.removeKeyboardHandler(editor.$emacsModeHandler);
        }
        this.cmdLine && this.cmdLine.hide()
    },

    destroy: function() {
        menus.remove("Tools/Keyboard Mode");
        if (this.cmdLine) {
            this.cmdLine.hide();
            this.cmdLine.removeNode();
            this.cmdLine = null;
        }
        this.$destroy();
    }
});
});



