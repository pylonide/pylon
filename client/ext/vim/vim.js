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
var Code = require("ext/code/code");
var handler = require("ext/vim/keyboard").handler;
var cmdModule = require("ext/vim/commands");
var commands = cmdModule.commands;
var cliCmds = require("ext/vim/cli");
var menus = require("ext/menus/menus");
var settings = require("ext/settings/settings");
var markupSettings =  require("text!ext/vim/settings.xml");
var util = require("ext/vim/maps/util");
//var commands = require("ext/commands/commands");

var VIM_ENABLED = false;
var OLD_HANDLER;

var onConsoleCommand = function onConsoleCommand(e) {
    var cmd = e.data.command;
    if (editors && editors.currentEditor && editors.currentEditor.amlEditor &&
      cmd && typeof cmd === "string") {

        var domEditor = editors.currentEditor.amlEditor;
        
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
                console.log("Vim command '" + cmd + "' not implemented.");
            }

            domEditor.focus();
            e.returnValue = false;
        }
        else if (cmd[0] === "/") {
            cmd = cmd.substr(1);
            cmdModule.searchStore.current = cmd;
            domEditor.$editor.find(cmd, cmdModule.searchStore.options);
            domEditor.focus();
            e.returnValue = false;
        }
    }
};

var addCommands = function addCommands(editor, commands) {
    Object.keys(commands).forEach(function(name) {
        var command = commands[name];
        if ("function" === typeof command)
            command = { exec: command };

        if (!command.name)
            command.name = name;

        editor.commands.addCommand(command);
    });
};

var removeCommands = function removeCommands(editor, commands) {
    Object.keys(commands).forEach(function(name) {
        editor.commands.removeCommand(commands[name]);
    });
};

var onCursorMove = function() {
    cmdModule.onCursorMove();
    onCursorMove.scheduled = false;
};

var enableVim = function enableVim() {
    if (!(editors.currentEditor && editors.currentEditor.amlEditor))
        return;
        
    ext.initExtension(this);
    
    //@todo how will new editors be added?
    ide.addEventListener("init.ext/code/code", function(){
        var amlEditors = [editors.currentEditor.amlEditor];
        
        ide.dispatchEvent("ext.vim.toggle", {
            editors: amlEditors,
            enable: true
        });

        amlEditors.forEach(function(amlEditor) {
            var editor = amlEditor.$editor;
            addCommands(editor, commands);
            editor.renderer.container.addEventListener("click", onCursorMove, false);
        
            // Set Vim's own keyboard handle and store the old one.
            OLD_HANDLER = OLD_HANDLER || editor.getKeyboardHandler();
            editor.setKeyboardHandler(handler);
        
            // Set Vim in command (normal) mode
            commands.stop.exec(editor);
            VIM_ENABLED = true;
                
            ide.dispatchEvent("track_action", {type: "vim", action: "enable", mode: util.currentMode});
        });
    });
};

var disableVim = function() {
    //@todo I only see one editor being cleaned.. what gives???
    ide.addEventListener("init.ext/code/code", function(){
        if (!(editors.currentEditor && editors.currentEditor.amlEditor))
            return;

        var amlEditors = [editors.currentEditor.amlEditor];
        ide.dispatchEvent("ext.vim.toggle", {
            editors: amlEditors,
            enable: false
        });
    
        amlEditors.forEach(function(amlEditor) {
            var editor = amlEditor.$editor;
            removeCommands(editor, commands);
            editor.setKeyboardHandler(OLD_HANDLER);
            commands.start.exec(editor);
            editor.renderer.container.removeEventListener("click", onCursorMove, false);
            VIM_ENABLED = false;
        
            ide.dispatchEvent("track_action", { type: "vim", action: "disable" });
        });
    });
};

module.exports = ext.register("ext/vim/vim", {
    name  : "Vim mode",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    deps  : [editors, Code, settings],
    nodes : [],
    alone : true,

    hook : function() {
        var self = this;
        var menuItem = new apf.item({
            type: "check",
            checked: "[{require('core/settings').model}::editors/code/@vimmode]",
            onclick: function() { self.toggle(); }
        });
        
        menus.addItemByPath("View/Vim Mode", menuItem, 150000);
        
        ide.addEventListener("settings.load", function(e){
            settings.setDefaults("editors/code", [
                ["vimmode", "false"]
            ]);
            
            if (apf.isTrue(e.model.queryValue("editors/code/@vimmode")))
                self.enable();
        });

        settings.addSettings("Code Editor", markupSettings);
    },

    toggle: function(show) {
        var enabled = apf.isTrue(e.model.queryValue("editors/code/@vimmode"));
        if (enabled)
            this.disable();
        else
            this.enable();
            
        if (editors.currentEditor && editors.currentEditor.amlEditor)
            editors.currentEditor.amlEditor.focus();
    },

    init: function() {
        require("ext/console/console").showInput();
    },

    // Enable accepts a `doEnable` argument which executes `disable` if false.
    enable: function() {
        ide.removeEventListener("consolecommand", onConsoleCommand);
        ide.addEventListener("consolecommand", onConsoleCommand);
        enableVim.call(this);
    },

    disable: function() {
        ide.removeEventListener("consolecommand", onConsoleCommand);
        disableVim();
    },

    destroy: function() {
        menus.remove("Tools/Vim mode");
        
        this.nodes.forEach(function(item) { item.destroy(); });
        this.nodes = [];
    }
});
});
