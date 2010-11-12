/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("lib/cloud9/plugin");
var sys = require("sys");

var cloud9StatePlugin = module.exports = function(server) {
    this.server = server;
    this.hooks = ["connect", "command"];
}

sys.inherits(cloud9StatePlugin, Plugin);

(function() {
    this.command =
    this.connect = function(message) {
        if (message && message.command != "state")
            return false;

        this.publishState();
        return true;
    };
    
    this.publishState = function() {
		var state = {
		    "type": "state",
		    "workspaceDir": this.server.workspaceDir,
		    "davPrefix": this.server.davPrefix
		};
		this.emit("statechange", state);
		
        this.server.broadcast(JSON.stringify(state));
    };
    
}).call(cloud9StatePlugin.prototype);