/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var util = require("util");
var EventEmitter = require("events").EventEmitter;

module.exports = FileWatcher;

function FileWatcher(vfs, path) {
    EventEmitter.call(this);

    this.vfs = vfs;
    this.path = path;
}

util.inherits(FileWatcher, EventEmitter);

(function() {

    this.watch = function() {
        var self = this;
        this.vfs.watch(this.path, {file:false, persistent: true}, function(err, meta) {
            if (err) {
                return process.nextTick(function() {
                    self.emit("close");
                });
            }

            self.watcher = meta.watcher;
            self.watcher.on("error", function() {
                self.emit("close");
            });

            self.watcher.on("change", self._onChange.bind(self));
        });
    };

    this._onChange = function(event) {
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
            } else {
                self.emit("change", {
                    path: self.path,
                    lastmod: stat.mtime
                });
            }
        });
    };

    this.hasListeners = function() {
        return this.listeners("delete").length || this.listeners("change").length;
    };

    this.close = function() {
        if (this.watcher) {
            this.watcher.removeAllListeners();
            this.watcher.close();
            this.emit("close");
        }
        this.watcher = null;
    };

}).call(FileWatcher.prototype);