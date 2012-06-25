"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run apache scripts with restricted user rights
 */

var exports = module.exports = function (url, vfs, pm, sandbox, usePortFlag, callback) {
    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return callback(err);
        
        sandbox.getUnixId(function(err, unixId) {
            if (err) return callback(err);
            
            init(projectDir, unixId, url);
        });
    });

    function init(projectDir, unixId, url) {
        pm.addRunner("apache", exports.factory(vfs, sandbox, projectDir, unixId, url, usePortFlag));

        callback();
    }
};

exports.factory = function(vfs, sandbox, root, uid, url, usePortFlag) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
        options.uid = uid;
        options.file = args.file;
        options.args = args.args;
        options.cwd = args.cwd;
        options.env = args.env;
        options.apacheVersion = args.apacheVersion;
        options.encoding = args.encoding;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.url = url;
        options.usePortFlag = usePortFlag;
        
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
    self.uid = options.uid;
    self.apacheVersion = options.apacheVersion || "auto";

    self.file = options.file || "";

    options.env = options.env || {};
    options.env.apache_PATH = options.root && (options.root + "/../npm_global/lib/apache_modules");

    self.scriptArgs = options.args || [];
    self.apacheArgs = [];

    if (options.uid) {
        self.apacheArgs.push("--setuid=" + options.uid);    
    }
    
    // first we need to get an open port
    options.sandbox.getPort(function (err, port) {
        if (err) {
            return console.error("getPort failed");
        }
        
        // the port flag is only present in the precompiled binaries that we provide
        // in the hosted version, so only add it then
        if (options.usePortFlag) {
            self.apacheArgs.push("--ports=" + port);
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
            self.apacheArgs.push("--ports=" + self.port);
        } else {
            self.apacheArgs.push('-d $HOME/app-root/data/httpd -c "Listen $OPENSHIFT_INTERNAL_IP:$OPENSHIFT_INTERNAL_PORT" -c "DocumentRoot $HOME/app-root/data/1" -D ONE_PROCESS');
        }
    
        // a nice debug message for our users when we fire up the process
        var debugMessageListener = function (msg) {
            // process dies? then we die as well
            if (msg.type === "run-exit") {
                return options.eventEmitter.removeListener(options.eventName, debugMessageListener);
            }
            
            if (msg.type === "run-start") {
                var info = [];
                
                options.eventEmitter.emit(options.eventName, {
                    type: "debug-data",
                    stream: "stdout",
                    data: info.join("\n"),
                    extra: null,
                    pid: msg.pid
                });
            }
        };
        options.eventEmitter.on(options.eventName, debugMessageListener);
    
        options.cwd = options.cwd ? options.cwd : options.root;
        options.command = "httpd";
        
        ShellRunner.call(self, vfs, options, callback);
    }
};

util.inherits(Runner, ShellRunner);