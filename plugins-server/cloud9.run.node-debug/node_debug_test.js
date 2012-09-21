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
var vfsLocal = require("vfs/local");

var home = __dirname + "/../fixtures/node_env";

module.exports = {

    timeout: 15000,

    setUpSuite : function(next) {
        async.rmtree(home, next);
    },

    setUp: function(next) {
        this.eventEmitter = new EventEmitter();
        var vfs = vfsLocal({
            root: "/"
        });
        var pm = this.pm = new ProcessManager({}, this.eventEmitter);
        pm.addRunner = function (name, runner) {
            pm.runners[name] = runner;
        };
        var sandbox = {
            getProjectDir: function (callback) {
                callback(null, home);
            },
            getPort: function (callback) {
                callback(null, 3000);
            }
        };
        // fake setup
        node_debug("http://localhost:5858", null, vfs, pm,
            sandbox, node_runner, false, null, 5858,
            function () {});
        async.makePath(home, next);
    },

    createDebugClient: function(child, event, callback) {
        var self = this;
        var service = new WSV8DebuggerService({
            send: function(msg) {
                msg = JSON.parse(msg);
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
        fs.writeFile(home + "/hello.js", "console.log('hello')", function(err) {
            assert.equal(err, null);

            _self.pm.spawn("node-debug", {
                file: "hello.js",
                args: [],
                env: {},
                cwd: home,
                breakOnStart: true,
                eventEmitter: this.eventEmitter
            }, "node-d", function(err, pid, child) {
                assert.ok(pid);
                assert.equal(err, null);
                console.log("Runner created");

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
            });
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();