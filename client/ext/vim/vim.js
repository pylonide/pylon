/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var utils = require("ext/vim/commands").util;
var handler = require("ext/vim/keyboard").handler;
var commands = require("ext/vim/commands").commands;
var cliCmds = require("ext/vim/cli");

module.exports = ext.register("ext/vim/vim", {
    name    : "Vim mode",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors],
    nodes   : [],
    alone   : true,

    hook : function() {
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

        var self = this;
        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.divider()), ide.mnuEdit.appendChild(new apf.item({
                caption: "Enable Vim mode",
                onclick: function () {
                    ext.initExtension(self);

                    var editor = editors.currentEditor.ceEditor.$editor;
                    addCommands(editor, commands);
                    editor.setKeyboardHandler(handler);
                    utils.normalMode(editor);
                }
            }))
        );

        ide.addEventListener("consolecommand", function(e) {
            var cmd = e.data.command;
            if (cmd && typeof cmd === "string" && cmd[0] === ":") {
                cmd = cmd.substr(1);
                if (cliCmds[cmd]) {
                    var editor = editors.currentEditor.ceEditor.$editor;
                    cliCmds[cmd](editor, e.data);
                }
                else
                    console.log("Vim command '" + cmd + "' not implemented.");

                e.returnValue = false;
            }
        });
    },

    init : function() {},

    enable : function() {},

    disable : function() {},

    destroy : function() {}
});

});
