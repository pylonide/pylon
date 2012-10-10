/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var util = require("util");
var FileWatcher= require("./file_watcher");

module.exports = DirWatcher;

function DirWatcher(vfs, path) {
    FileWatcher.call(this, vfs, path);
}

util.inherits(DirWatcher, FileWatcher);

(function() {

    this._onChange = function(event, path) {
        var self = this;

        if (!this.watcher)
            return;

        this.vfs.stat(this.path, {}, function(err, stat) {
            var exists = !err && stat && !stat.err;

            if (!exists) {
                self.emit("delete", {
                    path: self.path
                });
                self.close();
            }
            else if (event == "rename") {
                self.readdir(function(err, files) {
                    if (err) return console.error(err);

                    self.emit("change", {
                        path: self.path,
                        files: files,
                        lastmod : stat.mtime
                    });
                });
            }
        });
    };

    this.readdir = function(callback) {
        this.vfs.readdir(this.path, {encoding: null}, function(err, meta) {
            if (err)
                return callback(err);

            var stream = meta.stream;
            var files = [];

            stream.on("data", function(stat) {
                files.push({
                    type: stat.mime == "inode/directory" ? "folder" : "file",
                    name: stat.name
                });
            });

            var called;
            stream.on("error", function(err) {
                if (called) return;
                called = true;
                callback(err);
            });

            stream.on("end", function() {
                if (called) return;
                called = true;
                callback(null, files);
            });
        });
    };

}).call(DirWatcher.prototype);