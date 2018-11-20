"use strict";

var assert = require("assert");
var DirWatcher = require("./dir_watcher");
var execFile = require("child_process").execFile;
var localFs = require("vfs-local");
var fs = require("fs");

var base = __dirname + "/assets";

module.exports = {

    setUp: function(done) {
        this.vfs = localFs({
            root: "/"
        });
        execFile("mkdir", ["-p", base], {}, done);
    },

    tearDown: function(done) {
        execFile("rm", ["-rf", base], {}, done);
    },

    "test non existing dir should emit close directly": function(done) {
        var w = new DirWatcher(this.vfs, base + "/juhu");
        w.watch();
        w.on("close", done);
    },

    "test file changes should not trigger an event": function(done) {
        var self = this;
        var file = base + "/change.txt";

        fs.writeFile(file, "123", function(err) {
            assert.equal(err, null);

            var w = new DirWatcher(self.vfs, base);
            w.watch();

            var changed = false;

            // trigger change
            fs.writeFile(file, "1234", function() {});

            w.on("change", function() {
                changed = true;
                w.close();
            });

            w.on("close", function() {
                assert.ok(!changed);
                done();
            });

            setTimeout(function() {
                w.close();
            }, 200);
        });
    },

    "test new file": function(done) {
        var file = base + "/new.txt";

        var w = new DirWatcher(this.vfs, base);
        w.watch();

        var changed = false;

        // create new file
        fs.writeFile(file, "1234", function() {});

        w.on("change", function() {
            changed = true;
            w.close();
        });

        w.on("close", function() {
            assert.ok(changed);
            done();
        });
    },

    "test detect file deletion": function(done) {
        var self = this;
        var file = base + "/delete.txt";

        fs.writeFile(file, "123", function(err) {
            assert.equal(err, null);

            var w = new DirWatcher(self.vfs, base);
            w.watch();

            var changed = false;

            // trigger change
            fs.unlink(file, function() {});

            w.on("change", function() {
                changed = true;
                w.close();
            });

            w.on("close", function() {
                assert.ok(changed);
                done();
            });
        });
    },

    "test removing the directory itself should cleanup and emit close": function(done) {
        var w = new DirWatcher(this.vfs, base);
        w.watch();

        execFile("rm", ["-rf", base], {}, function() {});

        w.on("close", done);
    },

    "test change event should contain directory listing, path and last modified time": function(done) {
        var file = base + "/new.txt";

        var w = new DirWatcher(this.vfs, base);
        w.watch();

        // create new file
        fs.writeFile(file, "1234", function() {});

        w.on("change", function(e) {
            assert.equal(e.files.length, 1);
            assert.equal(e.files[0].name, "new.txt");
            assert.equal(e.files[0].type, "file");
            assert.equal(e.path, base);
            assert.ok(e.lastmod);

            w.close();
        });

        w.on("close", function() {
            done();
        });
    }

};

!module.parent && require("asyncjs").test.testcase(module.exports, "Project").exec();