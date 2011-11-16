/**
 * Git Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys = require("sys");
var util = require("cloud9/util");
//var c9wd = require("./c9wd");

var ShellSeleniumPlugin = module.exports = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = "selenium";
};

sys.inherits(ShellSeleniumPlugin, Plugin);

(function() {
    this.$commandHints = function(commands, message, callback) {
        util.extend(commands, {"git": {
            "hint": "the stupid content tracker",
            "commands": {}
        }});
        callback();
    };

    this.command = function(user, message, client) {
        if (message.command != "selenium")
            return false;

        var _self = this;
        var argv = message.argv || [];
        var args = argv.slice(0);
        
        if (!args.length) {
            //Display help message
            
            _self.sendResult(0, message.command, {
                code: code,
                argv: message.argv,
                err: null,
                out: null
            });
            
            return;
        }
        else {
            c9wd.init();
        }

        return true;
    };
    
    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };
    
}).call(ShellSeleniumPlugin.prototype);
