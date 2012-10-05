"use strict";

var assert = require("assert");
var FileWatcher = require("./file_watcher");
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

    // watch dir
      // detect new files/dir
      // detect deleted files/dir
      // ignore file/dir changes
      // detect rm dir itself

    "test non existing file should emit close directly": function(done) {
        var w = new FileWatcher(this.vfs, base + "/juhu.txt");
        w.watch();
        w.on("close", done);
    },

    "test detect file (date) changes": function(done) {
        var self = this;
        var file = base + "/change.txt";

        fs.writeFile(file, "123", function(err) {
            assert.equal(err, null);

            var w = new FileWatcher(self.vfs, file);
            w.watch();

            var changed = false;

            // trigger change
            fs.writeFile(file, "1234", function() {});

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

    "test detect file deletion": function(done) {
        var self = this;
        var file = base + "/delete.txt";

        fs.writeFile(file, "123", function(err) {
            assert.equal(err, null);

            var w = new FileWatcher(self.vfs, file);
            w.watch();

            var changed = false;

            // trigger change
            fs.unlink(file, function() {});

            w.on("delete", function() {
                changed = true;
            });

            w.on("close", function() {
                assert.ok(changed);
                done();
            });
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports, "Project").exec();