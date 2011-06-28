/**
 * Groovy Shell Module for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys    = require("sys");

var ShellGroovyPlugin = module.exports = function(ide) {
    this.ide = ide;
    this.hooks = ["command"];
    this.name = "groovy";
    this.banned = ["serve"];
};

sys.inherits(ShellGroovyPlugin, Plugin);

(function() {
    var groovyHelp     = "",
        commandsMap = {
            "default": {
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder or file. Autocomplete with [TAB]"}
                }
            }
        };

    this.$commandHints = function(commands, message, callback) {
        var _self = this;
        
        if (!groovyHelp) {
            /*        
            this.spawnCommand("groovy", null, message.cwd, null, null, function(code, err, out) {
                if (!out)
                    return callback();

                groovyHelp = {"groovy": {
                    "hint": "groovy",
                    "commands": {}
                }};

                out.replace(/([\w]+)[\s]{3,5}([\w].+)\n/gi, function(m, sub, hint) {
                    if (_self.banned.indexOf(sub) > -1)
                        return;
                    groovyHelp.groovy.commands[sub] = _self.augmentCommand(sub, {"hint": hint});
                });
                onfinish();
            });
            */
        }
        else {
            onfinish();
        }

        function onfinish() {
            _self.extend(commands, groovyHelp);
            callback();
        }
    };

    this.augmentCommand = function(cmd, struct) {
        var map = commandsMap[cmd] || commandsMap["default"];
        return this.extend(struct, map || {});
    };

    this.command = function(user, message, client) {
        if (message.command != "groovy")
            return false;
            
        var _self = this;
        var argv = message.argv || [];
        
        
        //sys.puts("Spawning groovy");
        this.spawnCommand(message.command, argv.slice(1), message.cwd, 
            function(err) { // Error
                //console.log(err);
                _self.sendResult(0, message.command, {
                    code: 0,
                    argv: message.argv,
                    err: err,
                    out: null
                });
            }, 
            function(out) { // Data
                //console.log(out);
                _self.sendResult(0, message.command, {
                    code: 0,
                    argv: message.argv,
                    err: null,
                    out: out
                });
            }, 
            function(code, err, out) {
                //console.log("code:" + code + " err:" + err + " out:" + out);
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
    
}).call(ShellGroovyPlugin.prototype);