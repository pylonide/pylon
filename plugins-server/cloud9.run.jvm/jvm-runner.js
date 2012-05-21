"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

var jvm = require("jvm-run");
var JVMInstance = jvm.JVMInstance;
var ScriptJVMInstance = jvm.ScriptJVMInstance;
var WebJVMInstance = jvm.WebJVMInstance;

var WEBAPP_START_PORT = 10000;

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function (url, pm, sandbox, usePortFlag, callback) {
    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return callback(err);
        
        sandbox.getPort(function(err, port) {
            if (err) return callback(err);
            
            sandbox.getUnixId(function(err, unixId) {
                if (err) return callback(err);
                
                if (!url) {
                    sandbox.getHost(function(err, host) {
                        if (err) return callback(err);
                        
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
        pm.addRunner("jvm", exports.factory(projectDir, port, unixId, url, usePortFlag));

        callback();
    }
};

exports.factory = function(root, port, uid, url, usePortFlag) {
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
        options.jvmType = args.jvmType;
        options.encoding = args.encoding;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.url = url;
        options.usePortFlag = usePortFlag;
        
        return new Runner(options);
    };
};

var Runner = exports.Runner = function(options) {

    this.root = options.root;
    this.port = options.port;
    this.uid = options.uid;

    this.file = options.file || "";

    this.jvmArgs = [];
    this.scriptArgs = options.args || [];

    options.env = options.env || {};

    if (options.port) {
        options.env.C9_PORT = options.port;
        options.env.PORT = options.port;
    }

    this.cwd = options.cwd = options.cwd ? options.cwd : options.root;
    options.command = "java"; 
    this.jvmType = options.jvmType;

    // a nice debug message for our users when we fire up the process
    var debugMessageListener = function (msg) {
        // process dies? then we die as well
        if (msg.type === "node-exit") {
            return options.eventEmitter.removeListener(options.eventName, debugMessageListener);
        }

        if (msg.type === "node-start") {
            var info = "Tip: you can access long running processes, like a server, at '" + options.url + "'.";
            
            options.eventEmitter.emit(options.eventName, {
                type: "node-debug-data",
                stream: "stdout",
                data: info,
                extra: null,
                pid: msg.pid
            });
        }
    };
    options.eventEmitter.on(options.eventName, debugMessageListener);

    ShellRunner.call(this, options);
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "node";

    this.createChild = function(callback) {
        var _self = this;
        this.getJVMInstance(function (err, jvmInstance) {
            if (err) return console.error(err);

            jvmInstance.runArgs(function (runArgs) {
                _self.args = _self.jvmArgs.concat(runArgs).concat(_self.scriptArgs);

                ShellRunner.prototype.createChild.call(_self, callback);
            });
        });
    };

    function srcToJavaClass(file) {
        return file.substring("src/".length)
            .replace(new RegExp("/", "g"), ".")
            .replace(/\.java$/, "");
    }

    this.getJVMInstance = function (callback) {
        var jvmType = this.jvmType;
        var cwd = this.cwd;
        var file = this.file;
        switch (jvmType) {
            case "java":
                var javaClass = srcToJavaClass(file);
                return buildApp(new JVMInstance(cwd, javaClass));

            case "java-web":    
                return buildApp(new WebJVMInstance(cwd, 'j2ee', this.port));

            case "jpy":
                return callback(null, new ScriptJVMInstance(cwd, "jython", file));

            case "jrb":
                return callback(null, new ScriptJVMInstance(cwd, "jruby1.8.7", file));

            case "groovy":
                return callback(null, new ScriptJVMInstance(cwd, "groovy", file));

            case "js-rhino":
                return callback("JS-Rhino not tested yet");

            default:
                return callback("Unsupported JVM runtime environment '" + jvmType + "' !!");
        }

        function buildApp(jvmInstance) {
            jvm.build(cwd, function(err, compilationProblems) {
                if (err)  return callback(err);

                // If no errors found, we can start
                if (compilationProblems.filter(function (problem) {
                    return problem.type == "error"; }).length == 0) {
                    callback(null, jvmInstance);
                }
                else {
                    console.log("Found " + compilationProblems.length + " compilation errors");
                    // send compilation errors to the user
                    runner.eventEmitter.emit(runner.eventName, {
                        type: "jvm-build",
                        code: 0,
                        body: {
                            success: true,
                            body: compilationProblems
                        }
                    });
                }
            }, "build");
        }
    };

}).call(Runner.prototype);