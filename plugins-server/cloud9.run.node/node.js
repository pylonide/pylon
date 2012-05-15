"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var path = require("path");
var spawn = require("child_process").spawn;
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var c9Node = require("node-c9-builds");
var assert = require("assert");

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    
    var url = options.url;

    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return register(err);
        
        sandbox.getPort(function(err, port) {
            if (err) return register(err);
            
            sandbox.getUnixId(function(err, unixId) {
                if (err) return register(err);
                
                if (!url) {
                    sandbox.getHost(function(err, host) {
                        if (err) return register(err);
                        
                        url = "http://" + host + ":" + port;
                        
                        init(projectDir, port, unixId, url);
                    });
                }
                else {
                    init(projectDir, port, unixId, url);
                }
            });
        });
    });

    function init(projectDir, port, unixId, url) {
        pm.addRunner("node", exports.factory(projectDir, port, unixId, url));

        register(null, {
            "run-node": {}
        });
    }
};

exports.factory = function(root, port, uid, url) {
    return function(args, eventEmitter, eventName) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
        options.port = port;
        options.uid = uid;
        options.file = args.file;
        options.args = args.args;
        options.cwd = args.cwd;
        options.env = args.env;
        options.nodeVersion = args.nodeVersion;
        options.encoding = args.encoding;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.url = url;
        return new Runner(options);
    };
};

var Runner = exports.Runner = function(options) {
    this.root = options.root;
    this.port = options.port;
    this.uid = options.uid;
    this.nodeVersion = options.nodeVersion || "auto";

    this.file = options.file || "";

    options.env = options.env || {};
    options.env.NODE_PATH = options.root && (options.root + "/../npm_global/lib/node_modules");

    this.scriptArgs = options.args || [];
    this.nodeArgs = [];

    if (options.uid)
        this.nodeArgs.push("--setuid=" + options.uid);

    if (options.port) {
        options.env.C9_PORT = options.port;
        options.env.PORT = options.port;
        this.nodeArgs.push("--ports=" + options.port);
    }

    // a nice debug message for our users when we fire up the process
    var debugMessageListener = function (msg) {
        // process dies? then we die as well
        if (msg.type === "node-exit") {
            return options.eventEmitter.removeListener(options.eventName, debugMessageListener);
        }
        
        if (msg.type === "node-start") {
            var info = [
                "Tip: you can access long running processes, like a server, at '" + options.url + "'.",
                "Important: in your scripts, use 'process.env.PORT' as port and '0.0.0.0' as host."
            ];
            
            options.eventEmitter.emit(options.eventName, {
                type: "node-debug-data",
                stream: "stdout",
                data: info.join("\n"),
                extra: null,
                pid: msg.pid
            });
        }
    };
    options.eventEmitter.on(options.eventName, debugMessageListener);

    options.cwd = options.cwd ? options.cwd : options.root;
    options.command = "node"; 
    
    console.log("FORWARDING TO SHELLRUNNER", options);
    ShellRunner.call(this, options);
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "node";

    this.createChild = function(callback) {
        var self = this;
        if (this.file.split("/").indexOf("..") != -1)
            return callback("Invalid file name: " + this.file);

        var absoluteFile = this.root + "/" + this.file;

        path.exists(absoluteFile, function(exists) {
            if (!exists)
                return callback("Script does not exist: " + self.file);

            self.runNode(self.nodeArgs, absoluteFile, self.scriptArgs, callback);
        });
    };

    this.runNode = function(nodeArgs, script, scriptArgs, callback) {
        var self = this;

        this.getNodeVersion(path.dirname(script), function(err, version) {
            if (err)
                return callback(err);

            try {
                self.command = c9Node.nodeBinary(version, process.platform, true);
                self.args = nodeArgs.concat(script).concat(scriptArgs);

                console.log("NODE RUNNER SPAWNING", self.command + " " + self.nodeArgs.join(" ") + " " + script + " " + self.scriptArgs.join(" "))
                var child = spawn(self.command, self.args, self.runOptions);
            } catch (e) {
                return callback(e);
            }

            callback(null, child);
        });
    };

    this.getNodeVersion = function(path, callback) {
        if (this.nodeVersion && this.nodeVersion !== "auto")
            return callback(null, this.nodeVersion);

        c9Node.detectVersion(this.root, path, callback);
    };

}).call(Runner.prototype);