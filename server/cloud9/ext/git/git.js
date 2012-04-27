/**
 * Git Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var Cloud9Util = require("cloud9/util");
var util = require("util");

var ShellGitPlugin = module.exports = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = "git";
};

util.inherits(ShellGitPlugin, Plugin);

(function() {
    var githelp     = "",
        commandsMap = {
            "default": {
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder or file. Autocomplete with [TAB]"}
                }
            }
        };

    this.$commandHints = function(commands, message, callback) {
        var _self = this;

        if (!githelp) {
            this.spawnCommand("git", null, message.cwd, null, null, function(code, err, out) {
                if (!out)
                    return callback();

                githelp = {"git": {
                    "hint": "Fast Version Control System",
                    "commands": {}
                }};

                out.replace(/[\s]{3,4}([\w]+)[\s]+(.*)\n/gi, function(m, sub, hint) {
                    githelp.git.commands[sub] = _self.augmentCommand(sub, {"hint": hint});
                });
                onfinish();
            });
        }
        else {
            onfinish();
        }

        function onfinish() {
            Cloud9Util.extend(commands, githelp);
            callback();
        }
    };

    this.augmentCommand = function(cmd, struct) {
        var map = commandsMap[cmd] || commandsMap["default"];
        return Cloud9Util.extend(struct, map || {});
    };

    this.command = function(user, message, client) {
        if (message.command != "git")
            return false;

        var _self = this;
        var argv = message.argv || [];

        // git encourages newlines in commit messages; see also #678
        // so if a \n is detected, treat them properly as newlines
        if (message.argv[1] == "commit" && message.argv[2] == "-m") {
            if (message.argv[3].indexOf("\\n") > -1) {
                message.argv[3] = message.argv[3].replace(/\\n/g,"\n");
            }
        }
        
        this.spawnCommand(message.command, argv.slice(1), message.cwd,
            function(err) { // Error
                _self.sendResult(0, message.command, {
                    code: 0,
                    argv: message.argv,
                    err: err,
                    out: null
                });
            },
            function(out) { // Data
                _self.sendResult(0, message.command, {
                    code: 0,
                    argv: message.argv,
                    err: null,
                    out: out
                });
            },
            function(code, err, out) {
                _self.sendResult(0, message.command, {
                    code: code,
                    argv: message.argv,
                    err: null,
                    out: null
                });
            });

        return true;
    };

    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };

}).call(ShellGitPlugin.prototype);
