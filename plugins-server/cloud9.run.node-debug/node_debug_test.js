"use strict";

var assert = require("assert");
var async = require("asyncjs");
var fs = require("fs");

var EventEmitter = require("events").EventEmitter;
 // wire up the NodeRunner with appropriate createChild version
require("../cloud9.run.node/node-plugin");
var node_runner = require("../cloud9.run.node/node-runner");
var node_debug = require("./node_debug-runner");

var V8Debugger = require("v8debug").V8Debugger;
var WSV8DebuggerService = require("v8debug").WSV8DebuggerService;
var ProcessManager = require("../cloud9.process-manager/process_manager");
var vfsLocal = require("vfs-local");
var fsnode = require("vfs-nodefs-adapter");

module.exports = {

    timeout: 5000,
    vfs: null,
    home: __dirname + "/../fixtures/node_env",

    setUpSuite : function(next) {
        var _self = this;
        async.rmtree(this.home, function (err) {
            if (err) return next(err);
            async.makePath(_self.home, next);
        });
    },

    setUp: function(next) {
        var _self = this;
        this.eventEmitter = new EventEmitter();
        var vfs = this.vfs || vfsLocal({ root: "/" });
        this.fs = fsnode(vfs);
        var pm = this.pm = new ProcessManager({}, this.eventEmitter);
        pm.addRunner = function (name, runner) {
            pm.runners[name] = runner;
        };
        var sandbox = {
            getProjectDir: function (callback) {
                callback(null, _self.home);
            },
            getPort: function (callback) {
                callback(null, 8080);
            }
        };
        // fake setup
        node_debug("http://localhost:5858", null, vfs, pm,
            sandbox, node_runner, false, null, null, 5858,
            function () { next(); });
    },

    createDebugClient: function(child, event, callback) {
        var self = this;
        var service = new WSV8DebuggerService({
            send: function(msg) {
                msg = JSON.parse(msg);
                // Fix the race condition between the debug client waiting
                // for the event and the start time of the debug process
                if (msg.command === "DebugAttachNode")
                    return service.$onMessage('{"type": "node-debug-ready"}');
                if (msg.runner === "node" && msg.body) {
                    // console.log("send", msg);
                    child.debugCommand(msg.body);
                }
            },
            removeListener: function() {
            },
            on: function(type, listener) {
                self.eventEmitter.on(event, function(msg) {
                    if (msg.data)
                        msg.data = msg.data.toString();
                    // console.log("rec", msg);
                    listener(JSON.stringify(msg));
                });
            }
        });
        service.attach(0, function() {
            callback(null, new V8Debugger(0, service));
        });
    },

    "test connect debugger": function(next) {
        var _self = this;
        this.fs.writeFile(this.home + "/hello.js", "console.log('hello')", function(err) {
            assert.equal(err, null);

            _self.pm.spawn("node-debug", {
                file: "hello.js",
                args: [],
                env: {},
                cwd: _self.home,
                breakOnStart: true,
                eventEmitter: _self.eventEmitter
            }, "node-d", function(err, pid, child) {
                assert.ok(pid);
                assert.equal(err, null);
                console.log("Runner created");

                // patiently wait for the debugee process to init
                setTimeout(function () {
                    _self.createDebugClient(child, "node-d", function (err, debug) {
                        debug.version(function(version) {
                            assert.ok(version.V8Version);
                        });

                        debug.continueScript(null, null, function() {
                        });

                        _self.eventEmitter.on("node-d", function(msg) {
                            console.log("MSG:", msg.type);
                            if (msg.type === "node-debug-exit") {
                                next();
                            }
                        });
                    });
                }, 1000);
            });
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();