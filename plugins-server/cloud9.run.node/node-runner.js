"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function (url, pm, sandbox, usePortFlag, callback) {
    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return callback(err);
        
        sandbox.getUnixId(function(err, unixId) {
            if (err) return callback(err);
            
            init(projectDir, unixId, url);
        });
    });

    function init(projectDir, unixId, url) {
        pm.addRunner("node", exports.factory(sandbox, projectDir, unixId, url, usePortFlag));

        callback();
    }
};

exports.factory = function(sandbox, root, uid, url, usePortFlag) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
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
        options.usePortFlag = usePortFlag;
        
        options.sandbox = sandbox;
        
        new Runner(options, callback);
    };
};

var Runner = exports.Runner = function(options, callback) {
    var self = this;
    
    if (!options.sandbox) {
        return callback("No sandbox specified");
    }
    
    self.root = options.root;
    self.uid = options.uid;
    self.nodeVersion = options.nodeVersion || "auto";

    self.file = options.file || "";

    options.env = options.env || {};
    options.env.NODE_PATH = options.root && (options.root + "/../npm_global/lib/node_modules");

    self.scriptArgs = options.args || [];
    self.nodeArgs = [];

    if (options.uid) {
        self.nodeArgs.push("--setuid=" + options.uid);    
    }
    
    // first we need to get an open port
    options.sandbox.getPort(function (err, port) {
        if (err) {
            return console.error("getPort failed");
        }
        
        // the port flag is only present in the precompiled binaries that we provide
        // in the hosted version, so only add it then
        if (options.usePortFlag) {
            self.nodeArgs.push("--ports=" + port);
        }
        
        // then create a url.
        // this can be passed in as an option, or we can construct it
        // based on the host and the port
        if (!options.url) {
            options.sandbox.getHost(function(err, host) {
                if (err) return console.error(err);
                
                var url = "http://" + host + ":" + port;
                
                startProcess(url, port);
            });
        }
        else {
            startProcess(options.url, port);
        }        
    });
    
    function startProcess (url, port) {
        self.port = port;
        
        if (self.port) {
            options.env.C9_PORT = self.port;
            options.env.PORT = self.port;
        }
        
        if (options.usePortFlag) {
            self.nodeArgs.push("--ports=" + self.port);
        }
    
        // a nice debug message for our users when we fire up the process
        var debugMessageListener = function (msg) {
            // process dies? then we die as well
            if (msg.type === "node-exit") {
                return options.eventEmitter.removeListener(options.eventName, debugMessageListener);
            }
            
            if (msg.type === "node-start") {
                var info = [
                    "Tip: you can access long running processes, like a server, at '" + url + "'.",
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
        
        ShellRunner.call(self, options, callback);
    }
};

util.inherits(Runner, ShellRunner);