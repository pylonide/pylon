/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys = require("sys");

var cloud9StatePlugin = module.exports = function(ide) {
    this.ide = ide;
    this.hooks = ["connect", "command"];
    this.name = "state";
};

sys.inherits(cloud9StatePlugin, Plugin);

(function() {
    this.connect = function(user, message, client) {
        this.publishState();
    };
    
    this.command = function(user, message, client) {
        if (message && message.command !== "state")
            return false;

        return true;
    };
    
    this.publishState = function() {
        var state = {
            "type": "state",
            "workspaceDir": this.ide.workspaceDir,
            "davPrefix": this.ide.davPrefix
        };
        this.emit("statechange", state);

        console.log("publish state" + JSON.stringify(state))
        this.ide.broadcast(JSON.stringify(state));
    };
    
}).call(cloud9StatePlugin.prototype);
