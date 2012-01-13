/**
 * Node Runtime Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "node-runtime";
var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, NodeRuntimePlugin, register);
};

var NodeRuntimePlugin = function(ide, workspace) {
    this.ide = ide;
    this.pm = ProcessManager;
    this.eventbus = EventBus;
    this.workspace = workspace;
    this.workspaceId = workspace.workspaceId;

    this.channel = this.workspaceId + "::node-runtime";
    
    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
};

util.inherits(NodeRuntimePlugin, Plugin);

(function() {
    
    this.debugInitialized = {};

    this.init = function() {
        var self = this;
        this.eventbus.on(this.channel, function(msg) {
            msg.type = msg.type.replace(/^node-debug-(start|data|exit)$/, "node-$1");
            var type = msg.type;

            if (type == "node-start" || type == "node-exit") {
                self.workspace.getExt("state").publishState();
            }

            if (msg.type == "node-start") {
                self.processCount += 1;
            }

            if (msg.type == "node-exit") {
                delete self.debugInitialized[msg.pid];
                
                self.processCount -= 1;
            }
                
            if (msg.type == "node-debug-ready") {
                self.debugInitialized[msg.pid] = true;
            }

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function(user, message, client) {
        var cmd = (message.command || "").toLowerCase();
        if (!(/node/.test(message.runner)))
            return false;
        
        var res = true;
        switch (cmd) {
            case "run":
                this.$run(message.file, message.args || [], message.env || {}, message.version, message, client);
                break;
            case "rundebug":
                this.$debug(message.file, message.args || [], message.env || {}, false, message.version, message, client);
                break;
            case "rundebugbrk":
                this.$debug(message.file, message.args || [], message.env || {}, true, message.version, message, client);
                break;
            case "kill":
                this.$kill(message.pid, message, client);
                break;
            case "debugnode":
                this.pm.debug(message.pid, message.body, function(err) {
                    if (err) {
                        // uncommenting this helps with debugging, but we keep it
                        // commented out for the moment, because it throws at the moment
                        // that you stop the debugger, so we have to fix that some day
                        // console.error("debugnode threw error", err)
                    }
                });
                break;
            default:
                res = false;
        }
        return res;
    };

    this.$run = function(file, args, env, version, message, client) {
        var self = this;
        this.workspace.getExt("state").getState(function(err, state) {
            if (err)
                return self.error(err, 1, message, client);

            if (state.processRunning)
                return self.error("Child process already running!", 1, message);

            self.pm.spawn("node", {
                file: file,
                args: args,
                env: env,
                nodeVersion: version,
                extra: message.extra,
                encoding: "ascii"
            }, self.channel, function(err, pid, child) {
                if (err)
                    self.error(err, 1, message, client);
            });
        });
    };

    this.$debug = function(file, args, env, breakOnStart, version, message, client) {
        var self = this;
        this.workspace.getExt("state").getState(function(err, state) {
            if (err)
                return self.error(err, 1, message, client);

            if (state.processRunning)
                return self.error("Child process already running!", 1, message);

            self.pm.spawn("node-debug", {
                file: file,
                args: args,
                env: env,
                breakOnStart: breakOnStart,
                nodeVersion: version,
                extra: message.extra,
                encoding: "ascii"
            }, self.channel, function(err, pid) {
                if (err)
                    self.error(err, 1, message, client);
            });
        });
    };

    this.$kill = function(pid, message, client) {
        var self = this;
        this.pm.kill(pid, function(err) {
            if (err)
                return self.error(err, 1, message, client);
        });
    };

    this.canShutdown = function() {
        return this.processCount === 0;
    };

}).call(NodeRuntimePlugin.prototype);