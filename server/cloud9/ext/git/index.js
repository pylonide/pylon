/**
 * Git Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys    = require("sys");

var ShellGitPlugin = module.exports = function(ide) {
    this.ide = ide;
    this.hooks = ["command"];
    this.name = "git";
};

sys.inherits(ShellGitPlugin, Plugin);

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

    this.command = function(user, message, client) {
        if (message.command != "git")
            return false;

        var _self = this;
        var argv = message.argv || [];

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