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
var settings = require("ext/settings/settings");
var util = require("ext/vim/maps/util");
var handler = require("ext/vim/keyboard").handler;
var commands = require("ext/vim/commands").commands;
var cliCmds = require("ext/vim/cli");

var onConsoleCommand = function onConsoleCommand(e) {
    var cmd = e.data.command;
    if (cmd && typeof cmd === "string" && cmd[0] === ":") {
        cmd = cmd.substr(1);
        var domEditor = editors.currentEditor.ceEditor;

        if (cliCmds[cmd])
            cliCmds[cmd](domEditor.$editor, e.data);
        else
            console.log("Vim command '" + cmd + "' not implemented.");

        domEditor.focus();
        e.returnValue = false;
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
};

var disableVim = function() {
    if (editors.currentEditor) {
        var editor = editors.currentEditor.ceEditor.$editor;

        removeCommands(editor, commands);
        editor.setKeyboardHandler(null);
        commands.start.exec(editor);
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
        var menuItem = ide.mnuEdit.appendChild(new apf.item({
            caption: "Vim mode",
            type: "check",
            checked : "[{require('ext/settings/settings').model}::editors/code/@vimmode]"
        }));
        this.nodes.push(ide.mnuEdit.appendChild(menuItem));

        var self = this;
        // var _oldChecked = menuItem.$propHandlers.checked;
        // menuItem.$propHandlers.checked = function(v) {
        //     _oldChecked(v);
        //     self.toggle(v);
        // };

        // `prop.checked` gets executed many times.
        // I filed the bug at https://github.com/ajaxorg/apf/issues/28
        menuItem.addEventListener("prop.checked", function(e) {
            self.toggle(e.value);
        });
    },

    toggle: function(show) {
        if (this.inited === true) {
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
        ide.addEventListener("consolecommand", onConsoleCommand);
        this.inited = true;
    },

    enable : function() {
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
