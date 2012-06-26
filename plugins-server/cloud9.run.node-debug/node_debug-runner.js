"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var NodeDebugProxy = require("./nodedebugproxy");

/**
 * debug node scripts with restricted user rights
 */

var exports = module.exports = function (url, listenHint, vfs, pm, sandbox, runNode, usePortFlag, nodePath, debugPort, callback) {
    var NodeRunner = runNode.Runner;

    debugPort = parseInt(debugPort);

    // create methods on exports, that take a reference from NodeRunner
    setup(NodeRunner);

    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return callback(err);

        init(projectDir, url);
    });

    function init(projectDir, url) {
        pm.addRunner("node-debug", exports.factory(vfs, sandbox, projectDir, url, listenHint, usePortFlag, nodePath, debugPort));

        callback();
    }
};

function setup (NodeRunner) {
    exports.factory = function(vfs, sandbox, root, url, listenHint, usePortFlag, nodePath, debugPort) {
        return function(args, eventEmitter, eventName, callback) {
            var options = {};
            c9util.extend(options, args);
            options.root = root;
            options.file = args.file;
            options.args = args.args;
            options.cwd = args.cwd;
            options.env = args.env;
            options.nodeVersion = args.nodeVersion;
            options.debugPort = debugPort;
            options.nodePath = args.nodePath || nodePath;
            options.encoding = args.encoding;
            options.breakOnStart = args.breakOnStart;
            options.eventEmitter = eventEmitter;
            options.eventName = eventName;
            options.url = url;
            options.usePortFlag = usePortFlag;
            options.sandbox = sandbox;
            options.listenHint = listenHint;

            return new Runner(vfs, options, callback);
        };
    };

    var Runner = exports.Runner = function(vfs, options, callback) {
        this.breakOnStart = options.breakOnStart;
        this.debugPort = options.debugPort;
        this.msgQueue = [];
        
        NodeRunner.call(this, vfs, options, callback);
    };

    util.inherits(Runner, NodeRunner);
    mixin(Runner, NodeRunner);

    function mixin(Class, Parent) {
        
        Class.prototype = Class.prototype || {};
        var proto = Class.prototype;

        proto.name = "node-debug";

        proto.createChild = function(callback) {
             
            var self = this;

            var port = this.debugPort;

            if (self.breakOnStart)
                self.nodeArgs.push("--debug-brk=" + port);
            else
                self.nodeArgs.push("--debug=" + port);
            
            Parent.prototype.createChild.call(self, callback);

            setTimeout(function() {
                self._startDebug(port);
            }, 100);
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
            
            this.nodeDebugProxy = new NodeDebugProxy(this.vfs, port);
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
}
