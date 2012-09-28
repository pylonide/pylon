"use strict";

var assert = require("assert");
var async = require("asyncjs");
var fs = require("fs");

var EventEmitter = require("events").EventEmitter;
var node = require("./node_debug");

var V8Debugger = require("v8debug").V8Debugger;
var WSV8DebuggerService = require("v8debug").WSV8DebuggerService;

var vfsLocal = require("vfs-local");
var home = __dirname + "/../fixtures/node_env";

module.exports = {

    setUpSuite : function(next) {
        async.rmtree(home, next);
    },

    setUp: function(next) {
        this.eventEmitter = new EventEmitter();
        var vfs = vfsLocal({
            root: "/"
        });
        this.factory = node.factory(vfs, home);
        async.makePath(home, next);
    },

    createDebugClient: function(child, event) {
        var self = this;
        var service = new WSV8DebuggerService({
            send: function(msg) {
                msg = JSON.parse(msg);
                if (msg.command == "debugNode") {
                    console.log("send", msg);
                    child.debugCommand(msg.body);
                }
            },
            removeListener: function() {
            },
            on: function(type, listener) {
                self.eventEmitter.on(event, function(msg) {
                    console.log("rec", msg);
                    listener(JSON.stringify(msg));
                });
            }
        });
        service.attach(0, function() {});
        return new V8Debugger(0, service);
    },

    "test connect debugger": function(next) {

        var child = this.factory({
            file: "hello.js",
            args: [],
            env: {},
            cwd: home,
            breakOnStart: true
        }, this.eventEmitter, "node");

        var self = this;
        fs.writeFile(home + "/hello.js", "console.log('hello')", function(err) {
            assert.equal(err, null);

            child.spawn(function(err, pid) {
                assert.ok(pid);
                assert.equal(err, null);
            });

            var debug = self.createDebugClient(child, "node");

            debug.version(function(version) {
                assert.ok(version.V8Version);
            });

            var continueCalled = false;
            debug.on("break", function() {
                debug.continueScript(null, null, function() {
                    continueCalled = true;
                });
            });

            self.eventEmitter.on("node", function(msg) {
                if (msg.type == "node-debug-exit") {
                    assert.ok(continueCalled);
                    next();
                }
            });
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();