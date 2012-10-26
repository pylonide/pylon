"use strict";

var assert = require("assert");
var EventEmitter = require("events").EventEmitter;
var ProcessManager = require("./process_manager");
var shell = require("../cloud9.run.shell/shell");
var vfsLocal = require("vfs-local");

module.exports = {

    setUp: function() {
        this.eventEmitter = new EventEmitter();
        var vfs = vfsLocal({ root: "/" });
        this.pm = new ProcessManager({
            "shell": shell.factory(vfs)
        }, this.eventEmitter);
    },

    tearDown: function() {
        this.pm.destroy();
    },

    "test spawn shell process": function(next) {
        var self = this;
        this.pm.spawn("shell", {
            command: "ls",
            args: ["-l"],
            cwd: __dirname,
            env: {}
        }, "shell", function(err, pid) {
            assert.equal(err, null);
            assert.ok(pid);

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
        });
    },

    // try to break spawn

    "test child should show up in process list and be removed after exit": function(next) {
        var self = this;
        this.pm.spawn("shell", {
            command: "ls",
            args: ["-l"],
            cwd: __dirname,
            env: {}
        }, "shell", function(err, pid) {
            assert.equal(err, null);

            var processes = self.pm.ps();
            assert.equal(processes[pid].command, "ls -l");
            assert.equal(processes[pid].type, "shell");

            self.eventEmitter.on("shell", function(msg) {
                if (msg.type == "shell-exit") {
                    var processes = self.pm.ps();
                    assert.equal(processes[pid], null);
                    return next();
                }
            });
        });
    },

    "test kill child process": function(next) {
        var self = this;
        this.pm.spawn("shell", {
            command: "sleep",
            args: ["60"],
            cwd: __dirname,
            env: {}
        }, "shell", function(err, pid) {
            assert.equal(err, null);

            var processes = self.pm.ps();
            assert.equal(processes[pid].command, "sleep 60");

            self.pm.kill(pid);

            self.eventEmitter.on("shell", function(msg) {
                if (msg.type == "shell-exit") {
                    var processes = self.pm.ps();
                    assert.equal(processes[pid], null);
                    return next();
                }
            });
        });
    }

};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();