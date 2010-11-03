/**
 * Git Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("lib/cloud9/plugin");

function cloud9ShellGitPlugin(server) {
    this.server = server;
    this.hooks = ["command"];
}

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
                    "hint": "the stupid content tracker",
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
            _self.extend(commands, githelp);
            callback();
        }
    };

    this.augmentCommand = function(cmd, struct) {
        var map = commandsMap[cmd] || commandsMap["default"];
        return this.extend(struct, map || {});
    };

    this.command = function(message) {
        if (!message && message.command != "git")
            return false;

        var _self = this;
        this.spawnCommand(message.command, message.argv.slice(1), message.cwd, null, null, function(code, err, out) {
            if (!_self.server.client)
               return;
            _self.sendResult(0, message.command, {
                code: code,
                err: err,
                out: out
            });
        });

        return true;
    };
}).call(cloud9ShellGitPlugin.prototype = new Plugin());

module.exports = cloud9ShellGitPlugin;
