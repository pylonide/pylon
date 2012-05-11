"use strict";

var util = require("util");
var netutil = require("../cloud9.core/netutil");
var JvmRunner = require("../cloud9.run.jvm/jvm").Runner;
var JavaDebugProxy = require("./javadebugproxy"),

var JAVA_DEBUG_PORT = 6000;

/**
 * Debug java apps with restricted user rights
 */
var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var ide = imports.ide.getServer();

    imports.sandbox.getUnixId(function(err, unixId) {
        if (err) return register(err);

        pm.addRunner("jvm-debug", exports.factory(unixId, ide));

        register(null, {
            "run-jvm-debug": {}
        });
    });
};

exports.factory = function(uid, ide) {
    return function(options, eventEmitter, eventName) {
        var cwd = options.cwd || ide.workspaceDir;
        return new Runner(uid, options.file, options.args, cwd, options.env, options.breakOnStart, options.extra, eventEmitter, eventName);
    };
};

var Runner = exports.Runner = function(uid, file, args, cwd, env, breakOnStart, extra, eventEmitter, eventName) {
    JvmRunner.call(this, uid, file, args, cwd, env, extra, eventEmitter, eventName);
    this.breakOnStart = breakOnStart;
    this.extra = extra;
    this.msgQueue = [];
};

util.inherits(Runner, JvmRunner);
mixin(Runner, JvmRunner);

function mixin(Class, Parent) {

    Class.prototype = Class.prototype || {};
    var proto = Class.prototype;

    proto.name = "jvm-debug";

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
            }, 100);
        });
    };

    proto.debugCommand = function(msg) {
        this.msgQueue.push(msg);

        if (!this.nodeDebugProxy)
            return;

        this._flushSendQueue();
    };

    proto._flushSendQueue = function() {
        if (this.msgQueue.length) {
            for (var i = 0; i < this.msgQueue.length; i++) {
                // console.log("SEND", this.msgQueue[i])
                try {
                    this.nodeDebugProxy.send(this.msgQueue[i]);
                } catch(e) {
                    console.log("Sending node debug message failed: " + e.message);
                }
            }
        }

        this.msgQueue = [];
    };

    proto._startDebug = function(port) {
        var self = this;
        function send(msg) {
            self.eventEmitter.emit(self.eventName, msg);
        }

        var appPath = self.cwd;
        var debugOptions = {
            port: port,
            sourcepath: appPath + 'src'
        };

        this.javaDebugProxy = new JavaDebugProxy(port, debugOptions);
        this.javaDebugProxy.on("message", function(body) {
            // console.log("REC", body)
            send({
                "type": "node-debug",
                "pid": self.pid,
                "body": body,
                "extra": self.extra
            });
        });

        this.javaDebugProxy.on("connection", function() {
            send({
                "type": "node-debug-ready",
                "pid": self.pid,
                "extra": self.extra
            });
            self._flushSendQueue();
        });

        this.javaDebugProxy.connect();
    };
}

exports.mixin = mixin;