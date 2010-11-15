/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys = require("sys");

var AuthPlugin = module.exports = function(ide) {
    this.ide = ide;
    this.hooks = ["command"];
}

sys.inherits(AuthPlugin, Plugin);

(function() {
    
    this.command = function(message, client) {
        if (message.command != "attach")
            return false;

        if (message.workspaceId != this.ide.options.workspaceId) {
            this.ide.error("Unable to attach web socket!", 10, message, client)
            return true;
        }

        client.send('{"type": "attached"}')
        this.ide.execHook("connect");        
        return true;
    };
      
}).call(AuthPlugin.prototype);