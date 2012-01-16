/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys = require("sys");

var AuthPlugin = module.exports = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = "auth";
};

sys.inherits(AuthPlugin, Plugin);

(function() {
    
    this.command = function(user, message, client) {
        if (message.command != "attach")
            return false;

        if (message.workspaceId != this.workspace.workspaceId) {
            this.error("Unable to attach web socket!", 10, message, client);
            return true;
        }

        client.send('{"type": "attached"}');
        this.workspace.execHook("connect", user, client);
        return true;
    };
      
}).call(AuthPlugin.prototype);