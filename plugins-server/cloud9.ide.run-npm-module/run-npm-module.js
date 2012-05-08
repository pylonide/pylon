/**
 * NPM Runtime Module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var Plugin = require("../cloud9.core/plugin");
var util   = require("util");
var fs     = require("fs");

var name = "npm-runtime";
var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, NpmRuntimePlugin, register);
};

var NpmRuntimePlugin = function(ide, workspace) {
    this.ide = ide;
    this.pm = ProcessManager;
    this.eventbus = EventBus;
    this.workspace = workspace;
    this.workspaceId = workspace.workspaceId;
    this.child = null;

    this.channel = this.workspaceId + "::npm-runtime";

    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
};

util.inherits(NpmRuntimePlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on(this.channel, function(msg) {
            msg.type = msg.type.replace(/^node-(start|data|exit)$/, "npm-module-$1");
            var type = msg.type;

            if (type == "npm-module-start" || type == "npm-module-exit") {
                //self.workspace.getExt("state").publishState();
            }

            if (msg.type == "npm-module-start")
                self.processCount += 1;

            if (msg.type == "npm-module-exit")
                self.processCount -= 1;

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function(user, message, client) {
        var cmd = (message.command || "").toLowerCase();
        switch(cmd) {
            case "npm-module-stdin":
                this.child.child.stdin.write(message.line);
                return true;
        }
        return false;
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
                extra: message.extra
            }, self.channel, function(err, pid, child) {
                if (err)
                    return self.error(err, 1, message, client);
                self.child = child;
            });
        });
    };

    this.searchAndRunModuleHook = function(message, cb) {
        if (this.child && this.child.pid)
            return cb("NPM module already running.");

        var self = this;
        this.searchForModuleHook(message.command, function(found, filePath) {
            if (!found)
                return cb(null, found);

            if (message.argv.length)
                message.argv.shift();

            self.$run(filePath, message.argv || [], message.env || {},  message.version, message, null);
        });
    };

    this.searchForModuleHook = function(command, cb) {
        var baseDir = this.ide.workspaceDir + "/node_modules";

        function searchModules(dirs, it) {
            if (!dirs[it])
                return cb(false);

            var currentDir = baseDir + "/" + dirs[it];
            fs.readFile(currentDir + "/package.json", "utf-8", function(err, file) {
                if (err)
                    return searchModules(dirs, it+1);

                try {
                    file = JSON.parse(file);
                }
                catch (ex) {
                    return searchModules(dirs, it+1);
                }

                if (!file.bin)
                    return searchModules(dirs, it+1);

                for (var binIdent in file.bin) {
                    if (binIdent === command)
                        return cb(true, currentDir + "/" + file.bin[binIdent]);
                }

                searchModules(dirs, it+1);
            });
        }

        fs.readdir(baseDir, function(err, res) {
            if (err)
                return cb(false);

            searchModules(res, 0);
        });
    };

    this.$kill = function(pid, message, client) {
        this.pm.kill(pid, function(err) {
            if (err)
                return this.error(err, 1, message, client);
        });
    };

    this.canShutdown = function() {
        return this.processCount === 0;
    };

}).call(NpmRuntimePlugin.prototype);