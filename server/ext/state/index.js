/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
function cloud9StatePlugin(server) {
    this.server = server;
    server.addEventListener("clientConnect",  this.connectHandler.bind(this));
    server.addEventListener("unknownCommand", this.connectHandler.bind(this));
}

(function() {
    this.connectHandler = function(e, message) {
        if (message && message.command != "state")
            return e.next();
        // successful fire
        e.stop();

        var state = {
            "type": "state",
            "workspaceDir": this.server.workspaceDir,
            "processRunning": !!this.server.child,
            "debugClient": !!this.server.getExt("debugger").debugClient,
            "davPrefix": this.server.davPrefix
        };
        this.server.client.send(JSON.stringify(state));
    };
}).call(cloud9StatePlugin.prototype);

module.exports = cloud9StatePlugin;
