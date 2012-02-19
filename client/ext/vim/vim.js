/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

"use strict";

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var handler = require("ext/vim/keyboard").handler;
var cmdModule = require("ext/vim/commands");
var commands = cmdModule.commands;
var cliCmds = require("ext/vim/cli");
var util = require("ext/vim/maps/util");

var VIM_ENABLED = false;
var OLD_HANDLER;

module.exports = ext.register("ext/vim/vim", {
    name    : "Vim mode",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors],
    nodes   : [],
    alone   : true,

    hook : function() {
        var self = this;
        var menuItem = new apf.item({
            caption: "Vim mode",
            type: "check",
            checked : "[{require('ext/settings/settings').model}::editors/code/@vimmode]",
            onclick : function() {
                self.toggle();
            }
        });

        require("ext/code/code").nodes.push(mnuView.appendChild(menuItem));

        ide.addEventListener("loadsettings", function(e) {
            var vimStateEnabled = false;
            if (apf.isTrue(e.model.queryNode("editors/code").getAttribute("vimmode")))
                vimStateEnabled = true;

            if (editors.currentEditor && editors.currentEditor.ceEditor) {
                if (vimStateEnabled)
                    self.enable();
                else
                    self.disable();
            }
            else {
                self.deferredStateEnabled = vimStateEnabled;
            }
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            var heading = e.ext.getHeading("Code Editor");
            heading.appendChild(new apf.checkbox({
                "class" : "underlined",
                skin  : "checkbox_grey",
                value : "[editors/code/@vimmode]",
                label : "Vim mode",
                onclick : function() {
                    self.toggle();
                }
            }));
        });
        
        ide.addEventListener("afteropenfile", this.$aofListener = function(e) {
            if(self.deferredStateEnabled)
                self.enable();
            else
                self.disable();

            ide.removeEventListener("afteropenfile", self.$aofListener);
        });

        ide.addEventListener("code.ext:defaultbindingsrestored", function(e) {
            if (VIM_ENABLED === true) {
                self.enableVim();
            }
        });
    },

    toggle: function() {
        if (VIM_ENABLED === false)
            this.enable();
        else
            this.disable();

        if (editors && editors.currentEditor && editors.currentEditor.ceEditor) {
            var domEditor = editors.currentEditor.ceEditor;
            domEditor.focus();
        }
    },

    init : function() {
        txtConsoleInput.addEventListener("keydown", function(e) {
            if (e.keyCode === 27) { // ESC is pressed in the CLI
                txtConsoleInput.blur();
                editors.currentEditor.ceEditor.focus();
            }
        });
    },

    enableVim : function() {
        if (editors.currentEditor && editors.currentEditor.ceEditor) {
            ext.initExtension(this);
    
            var editor = editors.currentEditor.ceEditor.$editor;
            this.addCommands(editor, commands);
            editor.renderer.container.addEventListener("click", this.onCursorMove, false);
    
            if (!OLD_HANDLER)
                OLD_HANDLER = editor.getKeyboardHandler();
    
            // Set Vim's own keyboard handle
            editor.setKeyboardHandler(handler);
    
            if (util.currentMode !== "insert") {
                commands.stop.exec(editor);
            }
            VIM_ENABLED = true;
    
            ide.dispatchEvent("track_action", {type: "vim", action: "enable"});
        }
    },
    
    disableVim : function() {
        if (editors.currentEditor && editors.currentEditor.ceEditor) {
            var editor = editors.currentEditor.ceEditor.$editor;
    
            this.removeCommands(editor, commands);
            editor.setKeyboardHandler(OLD_HANDLER);
            commands.start.exec(editor);
            editor.renderer.container.removeEventListener("click", this.onCursorMove, false);
            VIM_ENABLED = false;
    
            ide.dispatchEvent("track_action", {type: "vim", action: "disable"});
        }
    },
    
    addCommands : function(editor, commands) {
        Object.keys(commands).forEach(function(name) {
            var command = commands[name];
            if ("function" === typeof command)
                command = { exec: command };
    
            if (!command.name)
                command.name = name;
    
            editor.commands.addCommand(command);
        });
    },
    
    removeCommands : function(editor, commands) {
        Object.keys(commands).forEach(function(name) {
            editor.commands.removeCommand(commands[name]);
        });
    },
    
    onCursorMove : function() {
        cmdModule.onCursorMove();
    },
    
    onConsoleCommand : function(e) {
        var cmd = e.data.command;
        if (editors && editors.currentEditor && editors.currentEditor.ceEditor &&
            cmd && typeof cmd === "string") {
    
            var domEditor = editors.currentEditor.ceEditor;
            if (cmd[0] === ":") {
                cmd = cmd.substr(1);
    
                if (cliCmds[cmd]) {
                    cliCmds[cmd](domEditor.$editor, e.data);
                }
                else if (cmd.match(/^\d+$/)) {
                    domEditor.$editor.gotoLine(parseInt(cmd, 10), 0);
                    domEditor.$editor.navigateLineStart();
                }
                else {
                    //console.log("Vim command '" + cmd + "' not implemented.");
                }
    
                domEditor.focus();
                e.returnValue = false;
            }
            else if (cmd[0] === "/") {
                cmd = cmd.substr(1);
                cmdModule.searchStore.current = cmd;
                domEditor.$editor.find(cmd, cmdModule.searchStore.options);
                txtConsoleInput.blur();
                domEditor.focus();
                e.returnValue = false;
            }
        }
    },

    enable : function() {
        ide.addEventListener("consolecommand", this.onConsoleCommand);
        this.enableVim();
    },

    disable : function() {
        ide.removeEventListener("consolecommand", this.onConsoleCommand);
        this.disableVim();
    },

    destroy : function() {
        this.nodes.forEach(function(item) {
            item.destroy();
        });
        this.nodes = [];
    }
});
});
