/**
 * Apache Runtime Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Runner = require("ext/runner/runner");
var name = "apache-runtime";

var ApacheRuntimePlugin = function(ide, workspace) {
    this.ide = ide;
    this.workspace = workspace;
    this.workspaceId = workspace.workspaceId;

    this.channel = this.workspaceId + "::apache-runtime";

    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
};

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on(this.channel, function(msg) {
            msg.type = msg.type.replace(/^apache-debug-(start|data|exit)$/, "apache-$1");
            var type = msg.type;

            if (type == "apache-start" || type == "apache-exit")
                self.workspace.getExt("state").publishState();

            if (msg.type == "apache-start")
                self.processCount += 1;

            if (msg.type == "apache-exit")
                self.processCount -= 1;

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function(user, message, client) {
        if (!message.command || typeof message.command !== "string")
            return false;

        if (!(/apache/.test(message.runner)))
            return false;

        var cmd = message.command.toLowerCase();
        var res = true;

        switch (cmd) {
            case "run":
            case "rundebug":
            case "rundebugbrk":
                this.$run(message, client);
                break;
            case "kill":
                this.$kill(message.pid, message, client);
                break;
            default:
                res = false;
        }
        return res;
    };

    this.$run = function(message, client) {
        var self = this;
        var runningProcesses = Runner.getIdeProcesses();

        if (runningProcesses.length > 0) {
            return self.error("Child process already running!", 1, message);
        }

        self.pm.spawn("apache", {
            file: message.file,
            args: message.args,
            env: message.env,
            nodeVersion: message.version,
            extra: message.extra,
            encoding: "ascii"
        }, self.channel, function(err, pid, child) {
            if (err)
                return self.error(err, 1, message, client);
        });
    };

    this.$debug = function(file, args, env, breakOnStart, version, message, client) {
        var self = this;
        this.workspace.getExt("state").getState(function(err, state) {
            if (err)
                return self.error(err, 1, message, client);

            if (state.processRunning)
                return self.error("Child process already running!", 1, message);

            self.pm.spawn("apache-debug", {
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

}).call(ApacheRuntimePlugin.prototype);