/**
 * State Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "state";
var ProcessManager;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];

    imports.ide.register(name, StatePlugin, function(err) {
        if (err)
            return register(err);

        register(null, {
            "ide.ext.state": {}
        });
    });
};

var StatePlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.pm = ProcessManager;

    this.workspaceId = workspace.workspaceId;

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
            this.publishState(message, client);
        }

        return true;
    };

    this.publishState = function(message, client) {
        var self = this;
        this.getState(function(err, state) {
            if (err)
                return self.error(err, 1, message, client);

            self.send(state, null, self.name);
        });
    };

    this.getState = function(callback) {
        var self = this;
        this.pm.ps(function(err, ps) {
            if (err)
                return callback(err);

            self.pm.runnerTypes(function(err, runners) {
                if (err)
                    return callback(err);
                    
                var state = {
                    "type": "state"
                };
                
                // TODO could we just send all ps?
                for (var pid in ps) {
                    var processType = ps[pid].type;
                    if (runners.indexOf(processType) >= 0) {
                        state[processType] = parseInt(pid, 10);
                        state.processRunning = pid;
                        if (processType.substr(-5) == "debug")
                            state.debugClient = pid;
                    }
                }
    
                // give other plugins the chance to add to the state
                self.emit("statechange", state);
                callback(null, state);
            });
        });
    };

}).call(StatePlugin.prototype);