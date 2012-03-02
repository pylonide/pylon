/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Plugin = require("cloud9/plugin");
var util = require("util");

var name = "state";

module.exports = function setup(options, imports, register) {
    imports.ide.register(name, StatePlugin, register);
};

var StatePlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["connect", "command"];
    this.name = name;
};

util.inherits(StatePlugin, Plugin);

(function() {
    this.connect = function(user, message, client) {
        this.publishState();
    };

    this.command = function(user, message, client) {
        if (message && message.command !== "state")
            return false;

        // we need to be able to re-publish state when we request that
        // use: ide.send({ command: "state", action: "publish" })
        if (message && message.action && message.action === "publish") {
            this.publishState();
        }

        return true;
    };

    this.publishState = function() {
        var state = {
            "type": "state"
        };
        this.emit("statechange", state);

        this.send(state, null, this.name);
    };

}).call(StatePlugin.prototype);
