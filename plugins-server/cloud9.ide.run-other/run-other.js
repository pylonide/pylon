/**
 * Ruby Runtime Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "other-runtime";
var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, OtherRuntimePlugin, register);
};

var OtherRuntimePlugin = function(ide, workspace) {
    this.ide = ide;
    this.pm = ProcessManager;
    this.eventbus = EventBus;
    this.workspace = workspace;
    this.workspaceId = workspace.workspaceId;

    this.channel = this.workspaceId + "::other-runtime";

    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
};

util.inherits(OtherRuntimePlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on(this.channel, function(msg) {
            msg.type = msg.type.replace(/^[\w]*-debug-(start|data|exit)$/, "other-$1");
            var type = msg.type;

            if (type == "other-start" || type == "other-exit")
                self.workspace.getExt("state").publishState();

            if (msg.type == "other-start")
                self.processCount += 1;

            if (msg.type == "other-exit")
                self.processCount -= 1;

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function(user, message, client) {
        var cmd = (message.command || "").toLowerCase();
        if (!(/other/.test(message.runner)))
            return false;

        var res = true;
        switch (cmd) {
            case "run":
            case "rundebug":
            case "rundebugbrk":
                this.$run(message.file, message.args || [], message.env || {}, message.version, message, client);
                break;
            /*case "rundebug":
                this.$debug(message.file, message.args || [], message.env || {}, false, message.version, message, client);
                break;
            case "rundebugbrk":
                this.$debug(message.file, message.args || [], message.env || {}, true, message.version, message, client);
                break;*/
            case "kill":
                this.$kill(message.pid, message, client);
                break;
            default:
                res = false;
        }
        return res;
    };

    this.$run = function(file, args, env, runner, message, client) {
        var self = this;
        this.workspace.getExt("state").getState(function(err, state) {
            if (err)
                return self.error(err, 1, message, client);

            if (state.processRunning)
                return self.error("Child process already running!", 1, message);

            var ideOptions = self.ide.options;
            args.unshift(file);
            args = args.map(function(arg) {
                var checkArg = arg.charAt(0) !== "/" ? "/" + arg : arg;
                if (checkArg.indexOf(ideOptions.davPrefix) === 0)
                    return checkArg.replace(ideOptions.davPrefix, ideOptions.workspaceDir);
                return arg;
            });
            self.pm.spawn("other", {
                command: runner,
                file: file,
                args: args,
                env: env,
                extra: message.extra,
                encoding: "ascii"
            }, self.channel, function(err, pid, child) {
                if (err)
                    self.error(err, 1, message, client);
            });
        });
    };

    this.$debug = function(file, args, env, breakOnStart, version, message, client) {
        this.$run(file, args, env, version, message, client);
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

}).call(OtherRuntimePlugin.prototype);
