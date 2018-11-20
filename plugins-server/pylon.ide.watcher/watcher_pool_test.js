"use strict";

var assert = require("assert");
var WatcherPool = require("./watcher_pool");
var execFile = require("child_process").execFile;
var localFs = require("vfs-local");
var fs = require("fs");

var base = __dirname + "/assets";

var DirWatcher = require("./dir_watcher");
var FileWatcher = require("./file_watcher");

module.exports = {

    setUp: function(done) {
        this.vfs = localFs({
            root: "/"
        });
        this.pool = new WatcherPool(this.vfs);
        execFile("mkdir", ["-p", base], {}, done);
    },

    tearDown: function(done) {
        this.pool.dispose();
        execFile("rm", ["-rf", base], {}, done);
    },

    "test watching file should create FileWatcher": function(done) {
        var self = this;
        var file = base + "/juhu.txt";
        fs.writeFile(file, "123", function(err) {
            assert.equal(err, null);

            self.pool.watch(file, onChange, onClose, function(err, handle) {
                assert.equal(err, null);
                assert.ok(self.pool.watchers[file] instanceof FileWatcher);

                done();
            });

            function onChange() {};
            function onClose() {};
        });
    },
    
    "test watching die should create DirWatcher": function(done) {
        var self = this;
        var file = base + "/kinners";
        fs.mkdir(file, function(err) {
            assert.equal(err, null);

            self.pool.watch(file, onChange, onClose, function(err, handle) {
                assert.equal(err, null);
                assert.ok(self.pool.watchers[file] instanceof DirWatcher);

                done();
            });

            function onChange() {};
            function onClose() {};
        });
    },
    
    "test ref counting": function(done) {
        var self = this;
        var file = base + "/juhu.txt";
        fs.writeFile(file, "123", function(err) {
            assert.equal(err, null);
    
            self.pool.watch(file, onChange, onClose, function(err, h1) {
                assert.equal(err, null);
                
                self.pool.watch(file, onChange, onClose, function(err, h2) {
                    assert.equal(err, null);
                
                    
                    assert.ok(self.pool.watchers[file]);
                    self.pool.unwatch(h1);
                    assert.ok(self.pool.watchers[file]);
                    self.pool.unwatch(h2);
                    assert.ok(!self.pool.watchers[file]);
                    
                    done();
                });
            });
            
            function onChange() {};
            function onClose() {};
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports, "Project").exec();