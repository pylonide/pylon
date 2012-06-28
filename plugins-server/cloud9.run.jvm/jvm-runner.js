"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

var jvm = require("jvm-run");
var JVMInstance = jvm.JVMInstance;
var ScriptJVMInstance = jvm.ScriptJVMInstance;
var WebJVMInstance = jvm.WebJVMInstance;

/**
 * Run JVM apps
 */

var exports = module.exports = function (url, vfs, pm, sandbox, callback) {
    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return callback(err);
        
        init(projectDir, url);
    });

    function init(projectDir, url) {
        pm.addRunner("jvm", exports.factory(vfs, sandbox, projectDir, url));

        callback();
    }
};

exports.factory = function(vfs, sandbox, root, url) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
        options.file = args.file;
        options.args = args.args;
        options.cwd = args.cwd;
        options.env = args.env;
        options.jvmType = args.jvmType;
        options.encoding = args.encoding;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.url = url;

        options.sandbox = sandbox;

        return new Runner(vfs, options, callback);
    };
};

function srcToJavaClass(file) {
    return file.substring("src/".length)
        .replace(new RegExp("/", "g"), ".")
        .replace(/\.java$/, "");
}

function getJVMInstance(options, callback) {
    var jvmType = options.jvmType;
    var cwd = options.cwd;
    var file = options.file;
    switch (jvmType) {
        case "java":
            var javaClass = srcToJavaClass(file);
            return buildApp(new JVMInstance(cwd, javaClass));

        case "java-web":
            return buildApp(new WebJVMInstance(cwd, 'j2ee', options.port));

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
        jvm.build(cwd, options.uid, "build", function(err, compilationProblems) {
            if (err)  return callback(err);

            // If no errors found, we can start
            var numErrors = compilationProblems.filter(function (problem) {
                return problem.type == "error"; }).length;
            if (numErrors === 0) {
                callback(null, jvmInstance);
            }
            else {
                console.log("Found " + numErrors + " compilation errors !");
                // send compilation errors to the user
                options.eventEmitter.emit(options.eventName, {
                    type: "jvm-build",
                    code: 0,
                    body: {
                        success: true,
                        body: compilationProblems
                    }
                });
            }
        });
    }
}

var Runner = exports.Runner = function(vfs, options, callback) {
    var self = this;

    this.options = options;

    if (!options.sandbox) {
        return callback("No sandbox specified");
    }

    this.vfs = vfs;
    this.root = options.root;
    this.uid = options.uid;

    this.file = options.file || "";

    this.jvmArgs = options.jvmArgs || [];

    self.scriptArgs = [];

        // first we need to get an open port
    options.sandbox.getPort(function (err, port) {
        if (err) {
            return console.error("getPort failed");
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

        // a nice debug message for our users when we fire up the process
        var debugMessageListener = function (msg) {
            // process dies? then we die as well
            if (msg.type === "node-exit") {
                return options.eventEmitter.removeListener(options.eventName, debugMessageListener);
            }

            if (msg.type === "node-start") {
                options.eventEmitter.emit(options.eventName, {
                    type: "node-data",
                    stream: "stdout",
                    data: "Tip: you can access long running processes, like a server, at '" + url + "'.",
                    extra: null,
                    pid: msg.pid
                });
            }
        };
        options.eventEmitter.on(options.eventName, debugMessageListener);

        options.cwd = options.cwd ? options.cwd : options.root;
        options.command = "java";
        options.port = port;

        getJVMInstance(options, function (err, jvmInstance) {
            if (err) return console.error(err);

            jvmInstance.runArgs(function (runArgs) {
                self.args = options.args = self.jvmArgs.concat(runArgs).concat(self.scriptArgs);
                ShellRunner.call(self, vfs, options, callback);
            });
        });
    }
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "node";

}).call(Runner.prototype);