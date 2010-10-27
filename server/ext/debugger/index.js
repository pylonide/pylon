/**
 * Debugger Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
function cloud9DebuggerPlugin(server) {
    this.server = server;
    server.addEventListener("unknownCommand", this.commandHandler.bind(this));
}

(function() {
    this.commandHandler = function(e, message) {
        e.next();
    };
}).call(cloud9DebuggerPlugin.prototype);

module.exports = cloud9DebuggerPlugin;
