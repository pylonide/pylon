/**
 * Scala Shell Module for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys    = require("sys");

var ShellScalaPlugin = module.exports = function(ide) {
    this.ide = ide;
    this.hooks = ["command"];
    this.name = "scala";
    this.banned = ["serve"];
};

sys.inherits(ShellScalaPlugin, Plugin);

(function() {
    var scalaHelp     = "",
        commandsMap = {
            "default": {
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder or file. Autocomplete with [TAB]"}
                }
            }
        };

    this.$commandHints = function(commands, message, callback) {
        var _self = this;

        if (!scalaHelp) {
            /*
            this.spawnCommand("scala", null, message.cwd, null, null, function(code, err, out) {
                if (!out)
                    return callback();

                scalaHelp = {"scala": {
                    "hint": "scala",
                    "commands": {}
                }};

                out.replace(/([\w]+)[\s]{3,5}([\w].+)\n/gi, function(m, sub, hint) {
                    if (_self.banned.indexOf(sub) > -1)
                        return;
                    scalaHelp.scala.commands[sub] = _self.augmentCommand(sub, {"hint": hint});
                });
                onfinish();
            });
            */
        }
        else {
            onfinish();
        }

        function onfinish() {
            _self.extend(commands, scalaHelp);
            callback();
        }
    };

    this.augmentCommand = function(cmd, struct) {
        var map = commandsMap[cmd] || commandsMap["default"];
        return this.extend(struct, map || {});
    };

    this.command = function(user, message, client) {
        if (message.command != "scala" && message.command != "fsc")
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
		console.log("code: [" + code +"] err: [" + err + "] out: [" + out +"]");
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
    
}).call(ShellScalaPlugin.prototype);
