"use strict";

var util = require("util");
var netutil = require("../cloud9.core/netutil");
var c9util = require("../cloud9.core/util");
var NodeRunner = require("../cloud9.run.node/node").Runner;
var NodeDebugProxy = require("./nodedebugproxy");

/**
 * debug node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var ide = imports.ide.getServer();

    imports.sandbox.getUnixId(function(err, unixId) {
        if (err) return register(err);

        pm.addRunner("node-debug", exports.factory(unixId, ide));

        register(null, {
            "run-node-debug": {}
        });
    });
};

exports.factory = function(uid, ide) {
    return function(args, eventEmitter, eventName) {
        var cwd = args.cwd || ide.workspaceDir;
        var options = {};
        c9util.extend(options, args);
        options.uid = uid;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.args = args;
        options.command = process.execPath;
        options.cwd = cwd;
        return new Runner(options);
    };
};

var Runner = exports.Runner = function(options) {
    NodeRunner.call(this, options);
    this.breakOnStart = options.breakOnStart;
    this.extra = options.extra;
    this.msgQueue = [];
};

util.inherits(Runner, NodeRunner);
mixin(Runner, NodeRunner);

function mixin(Class, Parent) {

    Class.prototype = Class.prototype || {};
    var proto = Class.prototype;

    proto.name = "node-debug";
    proto.NODE_DEBUG_PORT = 5858;

    proto.createChild = function(callback) {
        var self = this;

        netutil.findFreePort(this.NODE_DEBUG_PORT, 64000, "localhost", function(err, port) {
            if (err)
                return callback("Could not find a free port");
                

            if (self.breakOnStart)
                self.nodeArgs.push("--debug-brk=" + port);
            else
                self.nodeArgs.push("--debug=" + port);

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

        this.nodeDebugProxy = new NodeDebugProxy(port);
        this.nodeDebugProxy.on("message", function(body) {
            // console.log("REC", body)
            send({
                "type": "node-debug",
                "pid": self.pid,
                "body": body,
                "extra": self.extra
            });
        });

        this.nodeDebugProxy.on("connection", function() {
            send({
                "type": "node-debug-ready",
                "pid": self.pid,
                "extra": self.extra
            });
            self._flushSendQueue();
        });

        this.nodeDebugProxy.connect();
    };
}

exports.mixin = mixin;
