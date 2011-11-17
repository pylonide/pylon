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
var canon = require("pilot/canon");
var dom = require("pilot/dom");
var StateHandler = require("ace/keyboard/state_handler").StateHandler;
var utils = require("ext/vim/commands").util;
var commands = require("ext/vim/commands").commands;
var handler = require("ext/vim/keyboard").handler;
var cliCmds = require("ext/vim/cli");

module.exports = ext.register("ext/vim/vim", {
    name    : "Vim mode",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors],
    nodes   : [],
    alone   : true,

    hook : function() {
        canon.addCommands = function addCommands(commands) {
            Object.keys(commands).forEach(function(name) {
                var command = commands[name];
                if ("function" === typeof command)
                    command = { exec: command };

                if (!command.name)
                    command.name = name;

                canon.addCommand(command);
            });
        };

        canon.removeCommands = function removeCommands(commands) {
            Object.keys(commands).forEach(function(name) {
                canon.removeCommand(commands[name]);
            });
        };

        var self = this;
        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.divider()), ide.mnuEdit.appendChild(new apf.item({
                caption: "Enable Vim mode",
                onclick: function () {
                    ext.initExtension(self);
                    canon.addCommands(commands);

                    var editor = editors.currentEditor.ceEditor.$editor;
                    editor.setKeyboardHandler(handler);
                    utils.normalMode({ editor: editor });
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
