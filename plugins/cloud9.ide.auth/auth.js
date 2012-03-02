/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "auth";

module.exports = function setup(options, imports, register) {
    imports.ide.register(name, AuthPlugin, register);
};

var AuthPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = name;
};

util.inherits(AuthPlugin, Plugin);

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