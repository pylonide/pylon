/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var DirWatcher = require("./dir_watcher");
var FileWatcher = require("./file_watcher");
var dirname = require("path").dirname;

module.exports = WatcherPool;

/**
 * This class keeps a reference counted set of file watchers. File watchers are
 * created on demand and freed up when they are no longer used
 */
function WatcherPool(vfs) {
    this.vfs = vfs;
    this.watchers = {};
    this.ignored = {};
}

(function() {

    this.ignoreFile = function(path, timeout, skipParent) {
        var self = this;
        
        if (this.ignored[path])
            clearTimeout(this.ignored[path]);
            
        this.ignored[path] = setTimeout(function() {
            delete(self.ignored[path]);
        }, timeout);

        if (skipParent)
            return;
            
        var parentDir = dirname(path);
        if (parentDir)
            this.ignoreFile(parentDir, timeout, true);
    };

    this.watch = function(path, onChange, onClose, callback) {
        var self = this;
        this.vfs.stat(path, {}, function(err, stat) {
            if (err)
                return callback(err);
                
            var isDir = stat.mime == "inode/directory";
            var handle = {
                onRemove: function(e) {
                    if (self.ignored[path]) {
                        return;
                    }
                        
                    e.subtype = "remove";
                    onChange(e);
                },
                onChange: function(e) {
                    if (self.ignored[path]) {
                        return;
                    }
                        
                    e.subtype = isDir ? "directorychange" : "change";
                    onChange(e);
                },
                onClose: function() {
                    delete self.watchers[path];
                    onClose(path);
                },
                path: path
            };

            var watcher = self.watchers[path];
            if (!watcher) {
                if (isDir)
                    watcher = new DirWatcher(self.vfs, path);
                else
                    watcher = new FileWatcher(self.vfs, path);

                self.watchers[path] = watcher;
                watcher.watch();
            }

            watcher.on("change", handle.onChange);
            watcher.on("delete", handle.onRemove);
            watcher.on("close", handle.onClose);

            callback(null, handle);
        });
    };

    this.unwatch = function(handle) {
        var watcher = this.watchers[handle.path];
        if (!watcher)
            return;

        watcher.removeListener("change", handle.onChange);
        watcher.removeListener("delete", handle.onRemove);

        if (!watcher.hasListeners()) {
            watcher.close();
        }
    };

    this.dispose = function() {
        for (var key in this.watchers)
            this.watchers[key].close();
    };

}).call(WatcherPool.prototype);