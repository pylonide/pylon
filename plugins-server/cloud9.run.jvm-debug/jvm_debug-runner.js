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
        pm.addRunner("jvm-debug", exports.factory(projectDir, port, unixId, url, usePortFlag));

        callback();
    }
};

function setup (JvmRunner) {
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
            options.breakOnStart = args.breakOnStart;
            options.eventEmitter = eventEmitter;
            options.eventName = eventName;
            options.url = url;
            options.usePortFlag = usePortFlag;
            
            return new Runner(options);
        };
    };
    
    var Runner = exports.Runner = function(options) {
        JvmRunner.call(this, options);
        this.breakOnStart = options.breakOnStart;
        this.msgQueue = [];
    };

    util.inherits(Runner, JvmRunner);
    mixin(Runner, JvmRunner);

    function mixin(Class, Parent) {

        Class.prototype = Class.prototype || {};
        var proto = Class.prototype;

        proto.name = "node-debug";

        proto.createChild = function(callback) {
            var self = this;

            netutil.findFreePort(JAVA_DEBUG_PORT, 64000, "localhost", function(err, port) {
                if (err)
                    return callback("Could not find a free port");

                var debugParams = '-Xdebug -Xnoagent -Djava.compiler=NONE -Xrunjdwp:transport=dt_socket,address=localhost:'
                        + port + ',server=y,suspend=';

                if (self.breakOnStart)
                    debugParams += "y";
                else
                    debugParams += "n";

                self.jvmArgs = debugParams.split(' ').concat(self.jvmArgs);

                Parent.prototype.createChild.call(self, callback);

                setTimeout(function() {
                    self._startDebug(port);
                }, 2000);
            });
        };

        proto.debugCommand = function(msg) {
            this.msgQueue.push(msg);

            if (!this.javaDebugProxy)
                return;

            this._flushSendQueue();
        };

        proto._flushSendQueue = function() {
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

        proto._startDebug = function(port) {
            var self = this;
            function send(msg) {
                self.eventEmitter.emit(self.eventName, msg);
            }

            var debugOptions = {
                port: port,
                sourcepath: Path.join(self.cwd, 'src')
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
                // console.log('debug proxy connected');
                send({
                    "type": "node-debug-ready",
                    "pid": self.pid,
                    "extra": self.extra
                });
                self._flushSendQueue();
            });

            this.javaDebugProxy.on("end", function(err) {
                // console.log('javaDebugProxy terminated');
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
    }

    exports.mixin = mixin;
}