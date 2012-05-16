"use strict";

var util = require("util");
var Path = require("path");
var netutil = require("../cloud9.core/netutil");
var JvmRunner = require("../cloud9.run.jvm/jvm").Runner;
var JavaDebugProxy = require("./javadebugproxy");

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
        return new Runner(uid, options.type, options.file, options.args, cwd, options.env, options.breakOnStart, options.extra, eventEmitter, eventName);
    };
};

var Runner = exports.Runner = function(uid, jvmType, file, args, cwd, env, breakOnStart, extra, eventEmitter, eventName) {
    JvmRunner.call(this, uid, jvmType, file, args, cwd, env, extra, eventEmitter, eventName);
    this.breakOnStart = breakOnStart;
    this.extra = extra;
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
        console.log("debugCommand called");
        this.msgQueue.push(msg);

        if (!this.javaDebugProxy)
            return;

        this._flushSendQueue();
    };

    proto._flushSendQueue = function() {
        for (var i = 0; i < this.msgQueue.length; i++) {
            console.log("\nSEND", this.msgQueue[i])
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

        console.log('debug proxy created: port: ', port, ' \r\nopts: ', debugOptions);

        this.javaDebugProxy = new JavaDebugProxy(JAVA_DEBUG_PORT, debugOptions);
        this.javaDebugProxy.on("message", function(body) {
            console.log("\nRECV", body);
            send({
                "type": "node-debug",
                "pid": self.pid,
                "body": body,
                "extra": self.extra
            });
        });

        this.javaDebugProxy.on("connection", function() {
            console.log('debug proxy connected');
            send({
                "type": "node-debug-ready",
                "pid": self.pid,
                "extra": self.extra
            });
            self._flushSendQueue();
        });

        this.javaDebugProxy.on("end", function(err) {
            console.log('javaDebugProxy terminated');
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