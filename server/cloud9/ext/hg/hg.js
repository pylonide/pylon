/**
 * Mercurial Shell Module for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var Util   = require("cloud9/util");
var sys    = require("sys");

var ShellHgPlugin = module.exports = module.exports = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = "hg";
    this.banned = ["serve"];
};

sys.inherits(ShellHgPlugin, Plugin);

(function() {
    var hghelp     = "";
    var commandsMap = {
        "default": {
            "commands": {
                "[PATH]": {"hint": "path pointing to a folder or file. Autocomplete with [TAB]"}
            }
        }
    };

    this.$commandHints = function(commands, message, callback) {
        var _self = this;

        if (!hghelp) {
            this.spawnCommand("hg", null, message.cwd, null, null, function(code, err, out) {
                if (!out)
                    return callback();

                hghelp = {"hg": {
                    "hint": "mercural source control",
                    "commands": {}
                }};

                out.replace(/([\w]+)[\s]{3,5}([\w].+)\n/gi, function(m, sub, hint) {
                    if (_self.banned.indexOf(sub) > -1)
                        return;
                    hghelp.hg.commands[sub] = _self.augmentCommand(sub, {"hint": hint});
                });
                onfinish();
            });
        }
        else {
            onfinish();
        }

        function onfinish() {
            Util.extend(commands, hghelp);
            callback();
        }
    };

    this.augmentCommand = function(cmd, struct) {
        var map = commandsMap[cmd] || commandsMap["default"];
        return Util.extend(struct, map || {});
    };

    this.command = function(user, message, client) {
        if (message.command != "hg")
            return false;
            
        var _self = this;
        var argv = message.argv || [];
        
        // Here we want to ban some commands like serve
        if (argv.slice(1).length > 0 && _self.banned.indexOf(argv.slice(1)[0]) > -1) {    
            _self.sendResult(0, message.command, {
                code: 0,
                argv: message.argv,
                err: 'Command ' + argv.slice(1)[0] + ' is not available in Cloud9',
                out: null
            });
            return false;
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
    
}).call(ShellHgPlugin.prototype);