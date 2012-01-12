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
var extSettings = require("ext/settings/settings");
var cmdModule = require("ext/vim/commands");
var commands = cmdModule.commands;
var cliCmds = require("ext/vim/cli");
var util = require("ext/vim/maps/util");

var VIM_ENABLED = false;
var OLD_HANDLER;

var onConsoleCommand = function onConsoleCommand(e) {
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
                console.log("Vim command '" + cmd + "' not implemented.");
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
    if (editors.currentEditor && editors.currentEditor.ceEditor) {
        ext.initExtension(this);

        var editor = editors.currentEditor.ceEditor.$editor;
        addCommands(editor, commands);
        editor.renderer.container.addEventListener("click", onCursorMove, false);

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
};

var disableVim = function() {
    if (editors.currentEditor && editors.currentEditor.ceEditor) {
        var editor = editors.currentEditor.ceEditor.$editor;

        removeCommands(editor, commands);
        editor.setKeyboardHandler(OLD_HANDLER);
        commands.start.exec(editor);
        editor.renderer.container.removeEventListener("click", onCursorMove, false);
        VIM_ENABLED = false;

        ide.dispatchEvent("track_action", {type: "vim", action: "disable"});
    }
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
        // In order to behave like a code extension (i.e. hiding when we are not
        // in a code editor) we import it into the code plugin nodes instead of
        // ours.
        require("ext/code/code").nodes.push(mnuView.appendChild(menuItem));

        var self = this;
        this.afterOpenFileFn = function() {
            enableVim.call(self);
        };

        ide.addEventListener("init.ext/settings/settings", function (e) {
            var heading = e.ext.getHeading("Code Editor");
            heading.appendChild(new apf.checkbox({
                "class" : "underlined",
                skin  : "checkbox_grey",
                value : "[editors/code/@vimmode]",
                label : "Vim mode"
            }))
        });

        ide.addEventListener("code.ext:defaultbindingsrestored", function(e) {
            if (VIM_ENABLED === true) {
                enableVim.call(self);
            }
        });

        extSettings.model.addEventListener("update", function(e) {
            var vimEnabled = e.currentTarget.queryValue("editors/code/@vimmode");
            self.toggle(vimEnabled === "true");
        });
    },

    toggle: function(show) {
        if (show === true && VIM_ENABLED === false)
            this.enable();
        else if (show === false && VIM_ENABLED === true)
            this.disable();
    },

    init : function() {
        txtConsoleInput.addEventListener("keydown", cliKeyDown);
    },

    enable : function() {
        ide.addEventListener("consolecommand", onConsoleCommand);
        enableVim.call(this);
    },

    disable : function() {
        ide.removeEventListener("consolecommand", onConsoleCommand);
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
