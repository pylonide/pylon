"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run ruby scripts with restricted user rights
 */

var exports = module.exports = function (url, listenHint, vfs, pm, sandbox, usePortFlag, callback) {
    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return callback(err);
        
        init(projectDir, url);
    });

    function init(projectDir, url) {
        pm.addRunner("ruby", exports.factory(vfs, sandbox, projectDir, url, listenHint, usePortFlag));

        callback();
    }
};

exports.factory = function(vfs, sandbox, root, url, listenHint, usePortFlag) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
        options.file = args.file;
        options.args = args.args;
        options.cwd = args.cwd;
        options.env = args.env;
        options.rubyVersion = args.rubyVersion;
        options.encoding = args.encoding;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.url = url;
        options.usePortFlag = usePortFlag;
        options.listenHint = listenHint;
        
        options.sandbox = sandbox;
        
        new Runner(vfs, options, callback);
    };
};

var Runner = exports.Runner = function(vfs, options, callback) {
    var self = this;
    
    if (!options.sandbox) {
        return callback("No sandbox specified");
    }
    
    self.root = options.root;
    self.rubyVersion = options.rubyVersion || "auto";

    self.file = options.file || "";

    options.env = options.env || {};
    options.env.ruby_PATH = options.root && (options.root + "/../npm_global/lib/ruby_modules");

    self.scriptArgs = options.args || [];
    self.rubyArgs = [];

    // first we need to get an open port
    options.sandbox.getPort(function (err, port) {
        if (err) {
            return console.error("getPort failed");
        }
        
        // the port flag is only present in the precompiled binaries that we provide
        // in the hosted version, so only add it then
        if (options.usePortFlag) {
            self.rubyArgs.push("--ports=" + port);
        }
        
        // then create a url.
        // this can be passed in as an option, or we can construct it
        // based on the host and the port
        if (!options.url) {
            options.sandbox.getHost(function(err, host) {
                if (err) return console.error(err);
                
                var url = "http://" + host + ":" + port;
                options.url = url;
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
            self.rubyArgs.push("--ports=" + self.port);
        }
    
        // a nice message for our users when we fire up the process
        var messageListener = function (msg) {
            // process dies? then we die as well
            if (msg.type === "ruby-exit") {
                return options.eventEmitter.removeListener(options.eventName, messageListener);
            }
            
            if (msg.type === "ruby-start") {
                var info = [
                    "Your code is running at '" + url + "'.",
                    options.listenHint
                ];
                
                options.eventEmitter.emit(options.eventName, {
                    type: "ruby-data",
                    stream: "stdout",
                    data: info.join("\n"),
                    extra: {tip: true},
                    pid: msg.pid
                });
            }
        };
        options.eventEmitter.on(options.eventName, messageListener);
    
        options.cwd = options.cwd ? options.cwd : options.root;
        options.command = "ruby";
        
        ShellRunner.call(self, vfs, options, callback);
    }
};

util.inherits(Runner, ShellRunner);