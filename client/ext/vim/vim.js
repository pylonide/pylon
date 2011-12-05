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
var util = require("ext/vim/maps/util");

var enabled;

var onConsoleCommand = function onConsoleCommand(e) {
    var cmd = e.data.command;
    var domEditor = editors.currentEditor.ceEditor;
    if (cmd && typeof cmd === "string") {
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
        var editor = editors.currentEditor.ceEditor.$editor;

        addCommands(editor, commands);
        if (!enabled)
            ceEditor.$editor.renderer.container.addEventListener("click", onCursorMove, false);

        editor.setKeyboardHandler(handler);
        // So, apparently 'prop.checked' can't be trusted, since it happens
        // a million times. Since that will trigger execution of this very
        // function, we can't put a fix that checks for an already enabled vim
        // mode, because the editor might not be ready yet. This is a problem
        // in our core and it has to be fixed. For now, we add extra checks in
        // case we are already in insert mode, and not drive the user crazy by
        // randomly switching to normal mode.
        if (util.currentMode !== "insert") {
            commands.stop.exec(editor);
        }
        enabled = true;
    }
};

var disableVim = function() {
    if (editors.currentEditor && editors.currentEditor.ceEditor) {
        var editor = editors.currentEditor.ceEditor.$editor;

        removeCommands(editor, commands);
        editor.setKeyboardHandler(null);
        commands.start.exec(editor);
        ceEditor.$editor.renderer.container.removeEventListener("click", onCursorMove, false);
        enabled = false;
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
        txtConsoleInput.addEventListener("keydown", cliKeyDown);
        this.inited = true;
    },

    enable : function() {
        ide.addEventListener("consolecommand", onConsoleCommand);
        ide.addEventListener("afteropenfile",  enableVim);
        enableVim();
    },

    disable : function() {
        ide.removeEventListener("consolecommand", onConsoleCommand);
        ide.removeEventListener("afteropenfile",  enableVim);
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
