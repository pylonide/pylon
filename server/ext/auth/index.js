/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("lib/cloud9/plugin");
var sys = require("sys");

var AuthPlugin = module.exports = function(server) {
    this.server = server;
    this.hooks = ["command"];
}

sys.inherits(AuthPlugin, Plugin);

(function() {
    
    this.command = function(message, client) {
        if (message.command != "auth")
            return false;

        client.send('{"type": "attached"}')
        this.server.execHook("connect");        
        return true;
    };
      
}).call(AuthPlugin.prototype);