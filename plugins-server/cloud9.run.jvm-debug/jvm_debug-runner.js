"use strict";

var util = require("util");
var Path = require("path");
var netutil = require("../cloud9.core/netutil");
var c9util = require("../cloud9.core/util");
var JavaDebugProxy = require("./javadebugproxy");

var JAVA_DEBUG_PORT = 6000;

/**
 * Debug java apps with restricted user rights
 */
var exports = module.exports = function (url, pm, sandbox, runJvm, usePortFlag, callback) {
    var JvmRunner = runJvm.Runner;

    // create methods on exports, that take a reference from JvmRunner
    setup(JvmRunner);

    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return callback(err);

        sandbox.getUnixId(function(err, unixId) {
            if (err) return callback(err);

            init(projectDir, unixId, url);
        });
    });

    function init(projectDir, unixId, url) {
        pm.addRunner("jvm-debug", exports.factory(sandbox, projectDir, unixId, url, usePortFlag));

        callback();
    }
};

function setup (JvmRunner) {
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
            options.jvmType = args.jvmType;
            options.encoding = args.encoding;
            options.breakOnStart = args.breakOnStart;
            options.eventEmitter = eventEmitter;
            options.eventName = eventName;
            options.url = url;
            options.usePortFlag = usePortFlag;

            options.sandbox = sandbox;

            return new Runner(options, callback);
        };
    };
    
    var Runner = exports.Runner = function(options, callback) {
        var self = this;

        this.breakOnStart = options.breakOnStart;
        this.msgQueue = [];

        netutil.findFreePort(JAVA_DEBUG_PORT, 64000, "localhost", function(err, port) {
            if (err)
                return callback("Could not find a free port");

            var debugParams = "-Xdebug -Xnoagent -Djava.compiler=NONE -Xrunjdwp:transport=dt_socket,address=localhost:"
                    + port + ",server=y,suspend=";

            if (self.breakOnStart)
                debugParams += "y";
            else
                debugParams += "n";

            options.jvmArgs = debugParams.split(" ");

            JvmRunner.call(self, options, function (err) {
                if (err) return callback(err);

                callback.apply(null, arguments);

                // Start debug as soon as the "Listening for socket" message is printed
                var startDebugListener = function (msg) {
                    if ((msg.type == "node-debug-data" || msg.type == "node-data") && /dt_socket/.test(msg.data)) {
                        self._startDebug(port, options);
                        options.eventEmitter.removeListener(options.eventName, startDebugListener);
                    } else if (msg.type === "node-exit") {
                        options.eventEmitter.removeListener(options.eventName, startDebugListener);
                    }
                }
                options.eventEmitter.on(options.eventName, startDebugListener);
            });
        });
    };

    util.inherits(Runner, JvmRunner);

    (function() {

        this.name = "node-debug";

        this.debugCommand = function(msg) {
            this.msgQueue.push(msg);

            if (!this.javaDebugProxy)
                return;

            this._flushSendQueue();
        };

        this._flushSendQueue = function() {
            for (var i = 0; i < this.msgQueue.length; i++) {
                // console.log("\nSEND", this.msgQueue[i])
                try {
                    this.javaDebugProxy.send(this.msgQueue[i]);
                } catch(e) {
                    console.log("Sending jvm debug message failed: " + e.message);
                }
            }

            this.msgQueue = [];
        };

        this._startDebug = function(port, options) {
            var self = this;
            function send(msg) {
                options.eventEmitter.emit(options.eventName, msg);
            }

            var debugOptions = {
                port: port,
                sourcepath: Path.join(options.cwd, "src")
            };

            this.javaDebugProxy = new JavaDebugProxy(JAVA_DEBUG_PORT, debugOptions);
            this.javaDebugProxy.on("message", function(body) {
                // console.log("\nRECV", body);
                send({
                    "type": "node-debug",
                    "pid": self.pid,
                    "body": body,
                    "extra": self.extra
                });
            });

            this.javaDebugProxy.on("connection", function() {
                // console.log("java debug proxy connected");
                send({
                    "type": "node-debug-ready",
                    "pid": self.pid,
                    "extra": self.extra
                });
                self._flushSendQueue();
            });

            this.javaDebugProxy.on("end", function(err) {
                // console.log("javaDebugProxy terminated");
                if (err) {
                    // TODO send the error message back to the client
                    // _self.send({"type": "jvm-exit-with-error", errorMessage: err}, null, _self.name);
                    console.error(err);
                }
                if (self.javaDebugProxy === this)
                    delete self.javaDebugProxy;
            });

            this.javaDebugProxy.connect();
        };

    }).call(Runner.prototype);
}