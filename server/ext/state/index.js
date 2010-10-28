/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("lib/cloud9/plugin");

function cloud9StatePlugin(server) {
    this.server = server;
    this.hooks = ["connect", "command"];
}

(function() {
    this.command =
    this.connect = function(message) {
        if (message && message.command != "state")
            return false;

        var state = {
            "type": "state",
            "workspaceDir": this.server.workspaceDir,
            "davPrefix": this.server.davPrefix
        };
        this.emit("statechange", state);

        this.server.client.send(JSON.stringify(state));
        return true;
    };
}).call(cloud9StatePlugin.prototype = new Plugin());

module.exports = cloud9StatePlugin;
