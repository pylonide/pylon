"use strict";

var assert = require("assert");
var EventEmitter = require("events").EventEmitter;
var shell = require("./shell");
var vfsLocal = require("vfs-local");

module.exports = {

    setUp: function() {
        this.eventEmitter = new EventEmitter();
        var vfs = vfsLocal({ root: "/" });
        this.factory = shell.factory(vfs);
    },

    "test spawn ls": function(next) {
        var child = this.factory({
            command: "ls",
            args: ["-l"],
            cwd: __dirname,
            env: {}
        }, this.eventEmitter, "shell", function () {});

        var self = this;
        var pid;

        child.spawn(function(err, _pid) {
            pid = _pid;
            assert.equal(err, null);
            assert.ok(pid);
        });

        var events = [];
        self.eventEmitter.on("shell", function(msg) {
            events.push(msg);

            if (events.length > 3)
                assert.fail();

            if (events.length == 3) {
                assert.equal(events[0].type, "shell-start");
                assert.equal(events[0].pid, pid);

                assert.equal(events[1].type, "shell-data");
                assert.equal(events[1].stream, "stdout");
                assert.ok(events[1].data.toString().indexOf(__filename.split("/").pop()) !== -1);
                assert.equal(events[1].pid, pid);

                assert.equal(events[2].type, "shell-exit");
                assert.equal(events[2].code, 0);
                assert.equal(events[2].pid, pid);

                next();
            }
        });
    },

    "test exec ls": function(next) {
        var child = this.factory({
            command: "ls",
            args: ["-l"],
            cwd: __dirname,
            env: {}
        }, this.eventEmitter, "shell", function () {});

        child.exec(function(err, pid) {
            assert.equal(err, null);
            assert.ok(pid);
        }, function(code, stdout, stderr) {
            assert.equal(code, 0);
            assert.ok(stdout.indexOf(__filename.split("/").pop()) !== -1);
            assert.equal(stderr, "");
            next();
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();