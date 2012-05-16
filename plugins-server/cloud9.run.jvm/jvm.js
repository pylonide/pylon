"use strict";

var util = require("util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var netutil = require("../cloud9.core/netutil");

var jvm = require("jvm-run");
var JVMInstance = jvm.JVMInstance;
var ScriptJVMInstance = jvm.ScriptJVMInstance;
var WebJVMInstance = jvm.WebJVMInstance;

var WEBAPP_START_PORT = 10000;

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var ide = imports.ide.getServer();

    imports.sandbox.getUnixId(function(err, unixId) {
        if (err) return register(err);

        pm.addRunner("jvm", exports.factory(unixId, ide));

        register(null, {
            "run-jvm": {}
        });
    });
};

exports.factory = function(uid, ide) {
    return function(options, eventEmitter, eventName) {
        var cwd = options.cwd || ide.workspaceDir;
        
        return new Runner(uid, options.type, options.file, options.args, cwd, options.env, options.extra, eventEmitter, eventName);
    };
};

function srcToJavaClass(file) {
    return file.substring("src/".length)
        .replace(new RegExp("/", "g"), ".")
        .replace(/\.java$/, "");
}

var Runner = exports.Runner = function(uid, jvmType, file, args, cwd, env, extra, eventEmitter, eventName) {
    this.uid = uid;
    this.file = file;
    this.cwd = cwd;
    this.extra = extra;
    this.jvmType = jvmType;
    this.jvmArgs = [];

    this.scriptArgs = args || [];

    env = env || {};
    ShellRunner.call(this, uid, "java", [], cwd, env, extra, eventEmitter, eventName);
};

function getJVMInstance (jvmType, cwd, file, callback) {
    switch (jvmType) {
        case "java":
            var javaClass = srcToJavaClass(file);
            return buildApp(new JVMInstance(cwd, javaClass));

        case "java-web":
            netutil.findFreePort(WEBAPP_START_PORT, 64000, "localhost",
                function(err, port) {
                if (err) return callback(err);

                return buildApp(new WebJVMInstance(cwd, 'j2ee', port));
            });

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
                _self.sendResult(0, "jvmfeatures:build", {
                    success: true,
                    body: compilationProblems
                });
            }
        }, "build");
    }
}

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "jvm";

    this.createChild = function(callback) {
        var _self = this;
        getJVMInstance(this.jvmType, this.cwd, this.file, function (err, jvmInstance) {
            if (err) return console.error(err);

            jvmInstance.runArgs(function (runArgs) {
                _self.args = _self.jvmArgs.concat(runArgs).concat(_self.scriptArgs);

                ShellRunner.prototype.createChild.call(_self, callback);
            });
        });
    };

}).call(Runner.prototype);