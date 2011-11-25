/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var handler = require("ext/vim/keyboard").handler;
var settings = require("text!ext/vim/settings.xml");
var extSettings = require("ext/settings/settings");
var cmdModule = require("ext/vim/commands");
var commands = cmdModule.commands;
var cliCmds = require("ext/vim/cli");

var enabled;

var onConsoleCommand = function onConsoleCommand(e) {
    var cmd = e.data.command;
    var domEditor = editors.currentEditor.ceEditor;
    if (cmd && typeof cmd === "string") {
        if (cmd[0] === ":") {
            cmd = cmd.substr(1);

            if (cliCmds[cmd])
                cliCmds[cmd](domEditor.$editor, e.data);
            else
                console.log("Vim command '" + cmd + "' not implemented.");

            domEditor.focus();
            e.returnValue = false;
        }
        else if (cmd[0] === "/") {
            cmd = cmd.substr(1);
            cmdModule.searchStore.current = cmd;
            domEditor.$editor.find(cmd, cmdModule.searchStore.options);
            txtConsoleInput.blur();
            domEditor.focus();
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

var enableVim = function enableVim() {
    if (editors.currentEditor) {
        var editor = editors.currentEditor.ceEditor.$editor;

        addCommands(editor, commands);
        editor.setKeyboardHandler(handler);
        commands.stop.exec(editor);
    }
    enabled = true;
};

var disableVim = function() {
    if (editors.currentEditor) {
        var editor = editors.currentEditor.ceEditor.$editor;

        removeCommands(editor, commands);
        editor.setKeyboardHandler(null);
        commands.start.exec(editor);
    }
    enabled = false;
};

var cliKeyDown = function(e) {
    if (e.keyCode === 27) { // ESC is pressed in the CLI
        txtConsoleInput.blur();
        editors.currentEditor.ceEditor.focus();
    }
};

module.exports = ext.register("ext/vim/vim", {
    name    : "Vim mode",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors],
    nodes   : [],
    alone   : true,

    hook : function() {
        var menuItem = new apf.item({
            caption: "Vim mode",
            type: "check",
            checked : "[{require('ext/settings/settings').model}::editors/code/@vimmode]"
        });
        this.nodes.push(mnuView.appendChild(menuItem));

        var self = this;

        // `prop.checked` gets executed many times.
        // I filed the bug at https://github.com/ajaxorg/apf/issues/28
        menuItem.addEventListener("prop.checked", function(e) {
            self.toggle(e.value);
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            setTimeout(function() { barSettings.insertMarkup(settings); }, 0);
        });

        extSettings.model.addEventListener("update", function(e) {
            var vimEnabled = e.currentTarget.queryValue("editors/code/@vimmode");
            self.toggle(vimEnabled === "true");
        });

        txtConsoleInput.addEventListener("keydown", cliKeyDown);
    },

    toggle: function(show) {
        if (this.inited === true) {
            if (show && show == enabled)
                return;

            if (show)
                this.enable();
            else
                this.disable();
        }
        else {
            ext.initExtension(this);
        }
    },

    init : function() {
        this.inited = true;
    },

    enable : function() {
        ide.addEventListener("consolecommand", onConsoleCommand);
        ide.addEventListener('afteropenfile',  enableVim);
        enableVim();
    },

    disable : function() {
        ide.removeEventListener("consolecommand", onConsoleCommand);
        ide.removeEventListener('afteropenfile',  enableVim);
        disableVim();
    },

    destroy : function() {
        this.nodes.forEach(function(item) {
            item.destroy();
        });
        this.nodes = [];
    }
});
});
