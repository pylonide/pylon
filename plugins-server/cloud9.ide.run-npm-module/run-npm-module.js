/**
 * NPM Runtime Module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var Plugin = require("../cloud9.core/plugin");
var fsnode = require("vfs-nodefs-adapter");
var util = require("util");

var name = "npm-runtime";
var ProcessManager;
var EventBus;
var VFS;
var AllowShell;
var USER;
var ALLOWEDDIRS;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    VFS = imports.vfs;
    USER = options.user;
    ALLOWEDDIRS = options.allowedDirs;
    AllowShell = !!options.allowShell;
    imports.ide.register(name, NpmRuntimePlugin, register);
};

var NpmRuntimePlugin = function(ide, workspace) {
    this.ide = ide;
    this.pm = ProcessManager;
    this.fs = fsnode(VFS);
    this.eventbus = EventBus;
    this.allowShell = AllowShell;
    this.workspace = workspace;
    this.channel = workspace.workspaceId + "::npm-runtime"; // wtf this should not be needed
    this.children = {};
    this.user = USER;
    
    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
};

util.inherits(NpmRuntimePlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on(this.channel, function(msg) {
            msg.type = msg.type.replace(/^(?:run\-npm|shell)-(start|data|exit)$/, "npm-module-$1");

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
                if (!this.children[message.pid])
                    return true;

                message.line = message.line + '\n';
                this.children[message.pid].child.stdin.write(message.line);
                return true;
        }
        return false;
    };

    this.$run = function(file, args, env, version, message, client) {
        var self = this;

        this.pm.spawn("run-npm", {
            file: file,
            args: args,
            env: env,
            nodeVersion: version,
            extra: message.extra,
            cwd: message.cwd,
            encoding: "ascii"
        }, self.channel, function(err, pid, child) {
            if (err)
                return self.error(err, 1, message, client);

            self.children[pid] = child;
        });
    };

    this.searchAndRunModuleHook = function(message, user, cb) {
        if (!message.command || !message.argv)
            return cb(null, false);
            
        if (!user || !user.permissions) {
            console.error("Error: Couldn't retrieve permissions for user ", user);
            console.trace();
        }

        if (user.permissions && user.permissions.fs != "rw") {
            return cb("Permission denied", false);
        }
            
        // server_exclude is usually empty, resulting in an array with one element: an empty one, let's filter those:
        var server_excludeString = (user.permissions && user.permissions.server_exclude) || "";
        var server_exclude = server_excludeString.split("|").filter(function(cmd) { return !!cmd; });
        server_exclude.forEach(function(command) {
            if (message.command == command || message.argv.join(" ").indexOf(command) > -1) {
                return cb("Permission denied", false);
            }
        });

        if (message.command === "node" && message.argv.length > 1)
            return this.$run(message.argv[1], message.argv.slice(2), message.env || {},  message.version, message, null);
        else if (message.command == "rvm")
            return cb("rvm isn't supported by the console - please use the terminal instead");

        this.searchAndRunShell(message, cb);
    };

    this.searchAndRunShell = function(message, callback) {
        if (!this.allowShell)
            return callback(null, false);

        var self = this;
        var ws   = self.ide.workspaceDir;
        var cwd  = message.cwd || ws;

        this.pm.exec("shell", {
            command: "which",
            args: [message.command],
            cwd: cwd
        }, function(code, out, err) {
            if (code)
                return callback(null, false);
            
            // use resolved command
            message.argv[0] = out.split("\n")[0];
            
            var shellAliases =
                "python() { if [ $# -eq 0 ]; then command python -i; else command python \"$@\"; fi; };" +
                "coffee() { if [ $# -eq 0 ]; then command coffee -i; else command coffee \"$@\"; fi; };" +
                "irb() { command irb --readline \"$@\"; };" +
                "node() {" +
                "  if [ $# -eq 0 ]; then" +
                "    command node -i;" +
                "  else command node \"$@\"; fi;" +
                "};";

            self.pm.spawn("shell", {
                command: "sh",
                args: ["-c", shellAliases + "\n" + message.line],
                cwd: cwd,
                extra: message.extra,
                encoding: "ascii"
            }, self.channel, function(err, pid, child) {
                if (err)
                    return self.error(err, 1, message);
                    
                self.children[pid] = child;
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

}).call(NpmRuntimePlugin.prototype);
