"use strict";

var Path = require("path");
var assert = require("assert");
var Async = require("asyncjs");

var EventEmitter = require("events").EventEmitter;
var JVMDebug = require("./jvm_debug-runner");
var JVM = require("../cloud9.run.jvm/jvm-runner");

var V8Debugger = require("v8debug").V8Debugger;
var WSV8DebuggerService = require("v8debug").WSV8DebuggerService;
var ProcessManager = require("../cloud9.process-manager/process_manager");
var vfsLocal = require("vfs/local");

module.exports = {
    
    timeout: 15000,

    appPath: __dirname + "/../../node_modules/javadebug/test",

    setUpSuite : function(next) {
        next();
    },

    setUp: function(next) {
        var _self = this;
        this.eventEmitter = new EventEmitter();
        var pm = this.pm = new ProcessManager({}, this.eventEmitter);
        pm.addRunner = function (name, runner) {
            pm.runners[name] = runner;
        };
        var sandbox = {
            getProjectDir: function(callback) {
                callback(null, _self.appPath);
            },
            getUnixId: function(callback) {
                callback(null, null);
            },
            getPort: function(callback) {
                callback(null, null);
            },
            getHost: function(callback) {
                callback(null, null);
            }
        };
        var vfs = vfsLocal({
            root: "/"
        }); // TODO: Test with VFS
        new JVMDebug("App URL", vfs, pm, sandbox, JVM, 5858, function () {
            next();
        });
    },

    createDebugClient: function(child, event) {
        var _self = this;
        var service = new WSV8DebuggerService({
            send: function(msg) {
                msg = JSON.parse(msg);
                if (msg.runner === "java" && msg.body) {
                    // console.log("send", msg);
                    child.debugCommand(msg.body);
                }
            },
            removeListener: function() {
            },
            on: function(type, listener) {
                _self.eventEmitter.on(event, function(msg) {
                    // console.log("rec", msg);
                    listener(JSON.stringify(msg));
                });
            }
        }, "java");
        service.attach(0, function() {});
        return new V8Debugger(0, service);
    },

    "test connect debugger": function(next) {
        var _self = this;

        this.pm.spawn("jvm-debug", {
            file: "src/timeloop.java",
            args: [],
            env: {},
            cwd: _self.appPath,
            jvmType: "java",
            breakOnStart: true,
            eventEmitter: _self.eventEmitter
        }, "jvm-d", function(err, pid, child) {
            if (err)
                return console.error(err);

            var debug = _self.createDebugClient(child, "jvm-d");

            var continueCalled = false;

            setTimeout(function() {
                debug.continueScript(null, null, function() {
                    console.log("continue called");
                    continueCalled = true;
                    console.log("Kill called");
                    _self.pm.kill(pid);
                });
            }, 5000);
    
            _self.eventEmitter.on("jvm-d", function(msg) {
                if (msg.type == "node-debug-exit") {
                    assert.ok(continueCalled);
                    next();
                }
            });
            
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();