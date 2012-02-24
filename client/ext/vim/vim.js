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
var handler = require("ext/vim/keyboard").handler;
var cmdModule = require("ext/vim/commands");
var commands = cmdModule.commands;
var cliCmds = require("ext/vim/cli");
var settings = require("ext/settings/settings");
var util = require("ext/vim/maps/util");

var VIM_ENABLED = false;
var OLD_HANDLER;

var onConsoleCommand = function onConsoleCommand(e) {
    var cmd = e.data.command;
    if (cmd && typeof cmd === "string") {
        
        if (cmd[0] === ":") {
            cmd = cmd.substr(1);

            if (cliCmds[cmd]) {
                cliCmds[cmd](ceEditor.$editor, e.data);
            }
            else if (cmd.match(/^\d+$/)) {
                ceEditor.$editor.gotoLine(parseInt(cmd, 10), 0);
                ceEditor.$editor.navigateLineStart();
            }
            else {
                console.log("Vim command '" + cmd + "' not implemented.");
            }

            ceEditor.focus();
            e.returnValue = false;
        }
        else if (cmd[0] === "/") {
            cmd = cmd.substr(1);
            cmdModule.searchStore.current = cmd;
            ceEditor.$editor.find(cmd, cmdModule.searchStore.options);
            ceEditor.focus();
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
    ext.initExtension(this);

    var editor = ceEditor.$editor;
    addCommands(editor, commands);
    editor.renderer.container.addEventListener("click", onCursorMove, false);

    // Set Vim's own keyboard handle and store the old one.
    OLD_HANDLER = OLD_HANDLER || editor.getKeyboardHandler();
    editor.setKeyboardHandler(handler);

    // Set Vim in command (normal) mode
    commands.stop.exec(editor);
    VIM_ENABLED = true;
        
    ide.dispatchEvent("track_action", {type: "vim", action: "enable", mode: util.currentMode});
};

var disableVim = function() {
    var editor = ceEditor.$editor;
    removeCommands(editor, commands);
    editor.setKeyboardHandler(OLD_HANDLER);
    commands.start.exec(editor);
    editor.renderer.container.removeEventListener("click", onCursorMove, false);
    VIM_ENABLED = false;

    ide.dispatchEvent("track_action", { type: "vim", action: "disable" });
};

module.exports = ext.register("ext/vim/vim", {
    name  : "Vim mode",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    deps  : [editors, code, settings],
    nodes : [],
    alone : true,

    hook : function() {
        var self = this;
        var menuItem = new apf.item({
            caption: "Vim mode",
            type: "check",
            checked: "[{require('ext/settings/settings').model}::editors/code/@vimmode]",
            onclick: function() { self.toggle(); }
        });

        ide.addEventListener("init.ext/statusbar/statusbar", function (e) {
            e.ext.addToolsItem(menuItem.cloneNode(true), 0);
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            e.ext.getHeading("Code Editor").appendChild(new apf.checkbox({
                "class" : "underlined",
                skin  : "checkbox_grey",
                value : "[editors/code/@vimmode]",
                label : "Vim mode",
                onclick: function() { self.toggle(); }
            }));
        });

        var tryEnabling = function () {
            if (settings.model) {
                VIM_ENABLED = apf.isTrue(settings.model.queryNode("editors/code").getAttribute("vimmode"));
            }
            self.enable(VIM_ENABLED === true);
        };
        ide.addEventListener("init.ext/code/code", tryEnabling);
        ide.addEventListener("code.ext:defaultbindingsrestored", tryEnabling);
    },

    toggle: function(show) {
        this.enable(VIM_ENABLED === false);
        if (typeof ceEditor !== "undefined") {
            ceEditor.focus();
        }
    },

    init: function() {
        txtConsoleInput.addEventListener("keydown", function(e) {
            if (e.keyCode === 27 && typeof ceEditor !== "undefined") { // ESC is pressed in the CLI
                ceEditor.focus();
            }
        });
    },

    // Enable accepts a `doEnable` argument which executes `disable` if false.
    enable: function(doEnable) {
        if (doEnable !== false) {
            ide.removeEventListener("consolecommand", onConsoleCommand);
            ide.addEventListener("consolecommand", onConsoleCommand);
            enableVim.call(this);
        }
        else {
            this.disable();
        }
    },

    disable: function() {
        ide.removeEventListener("consolecommand", onConsoleCommand);
        disableVim();
    },

    destroy: function() {
        this.nodes.forEach(function(item) { item.destroy(); });
        this.nodes = [];
    }
});
});
