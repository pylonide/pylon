/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var util = require("util");
var Plugin = require("../cloud9.core/plugin");

var IGNORE_TIMEOUT = 50;
var ignoredPaths = {};
var ignoreTimers = {};

var name = "watcher";
var DAV;
var vfs;

module.exports = function setup(options, imports, register) {
    DAV = imports.dav.getServer();
    imports.ide.register(name, WatcherPlugin, register);
    vfs = imports.vfs;
};

var WatcherPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    DAV.plugins['watcher'] = function (handler) {
        handler.addEventListener('beforeWriteContent', function (e, uri) {
            var path = handler.server.tree.basePath + '/' + uri;
            ignoredPaths[path] = 1;
            e.next();
        });
    };

    this.hooks = ["disconnect", "command"];
    this.name = name;
    this.fileWatchers = {};
    this.directoryWatchers = {};
    this.basePath = ide.workspaceDir;
};

util.inherits(WatcherPlugin, Plugin);

(function() {

    this.addFileWatcher = function(path) {
        var self = this;

        this.fileWatchers[path] = {
            count : 1
        };

        vfs.watch(path, {file: true, persistent: false}, function (err, meta) {
            if (err)
                return console.error("can't add file watcher for " + path, err);

            var watcher = meta.watcher;
            if (!self.fileWatchers[path]) {
                if (watcher)
                    watcher.close();
                return;
            }
 
            watcher.on("change", function (currStat, prevStat) {
                self.onFileChange(path, currStat, prevStat);
            });

            self.fileWatchers[path].watcher = watcher;
        });
    };

    this.addDirectoryWatcher = function(path) {
        var self = this;
        this.directoryWatchers[path] = {
            count : 1
        };

        vfs.watch(path, {file: false, persistent: false}, function (err, meta) {
            if (err)
                return console.error("can't add directory watcher for " + path, err);

            var watcher = meta.watcher;
            if (!self.directoryWatchers[path]) {
                if (watcher)
                    watcher.close();
                return;
            }

            watcher.on("change", function (event, filename) {
                self.onDirectoryChange(path, event, filename);
            });

            self.directoryWatchers[path].watcher = watcher;
        });
    };

    this.removeFileWatcher = function(path) {
        this.fileWatchers[path].watcher.close();
        delete this.fileWatchers[path];
    };

    this.unwatchFile = function(path) {
        if (this.fileWatchers[path] && --this.fileWatchers[path].count === 0)
            this.removeFileWatcher(path);
    };

    this.removeDirectoryWatcher = function(path) {
        this.directoryWatchers[path].watcher.close();
        delete this.directoryWatchers[path];
    };

    this.unwatchDirectory = function(path) {
        if (this.directoryWatchers[path] && --this.directoryWatchers[path].count === 0)
            this.removeDirectoryWatcher(path);
    };

    this.command = function(user, message, client) {
        if (!message || message.command !== "watcher")
            return false;

        var path = this.basePath + (message.path ? "/" + message.path : "");

        switch (message.type) {
            case "watchFile":
                if (this.fileWatchers[path])
                    ++this.fileWatchers[path].count;
                else
                    this.addFileWatcher(path);
                return true;
            case "watchDirectory":
                if (this.directoryWatchers[path])
                    ++this.directoryWatchers[path].count;
                else
                    this.addDirectoryWatcher(path);
                return true;
            case "unwatchFile":
                return this.unwatchFile(path);
            case "unwatchDirectory":
                return this.unwatchDirectory(path);
            default:
                return false;
        }
    };

    this.disconnect = function() {
        this.dispose(function() {});
        return true;
    };

    this.dispose = function(callback) {
        for (var filePath in this.fileWatchers)
            this.removeFileWatcher(filePath);

        for (var dirPath in this.directoryWatchers)
            this.removeDirectoryWatcher(dirPath);

        callback();
    };

    this.onDirectoryChange = function (path, event, filename) {
        var self = this;
        vfs.stat(path, {}, function(err, stat) {
            if (err)
                return;

            if (!stat) {
                self.removeDirectoryWatcher(path);
                self.send({
                    "type"    : "watcher",
                    "subtype" : "remove",
                    "path"    : path,
                    "files"   : files
                });
                return;
            }

            var files = {};
            vfs.readdir(path, {encoding: null}, function(err, meta) {
                if (err)
                    return console.error(err);

                var stream = meta.stream;

                stream.on("data", function(stat) {
                    if (!stat || !stat.mime || !stat.name)
                        return;

                    files[stat.name] = {
                        type : stat.mime.search(/directory|file/) != -1 ? "folder" : "file",
                        name : stat.name
                    };
                });

                var called;
                stream.on("error", function(err) {
                    if (called)
                        return;
                    called = true;
                    console.error(err);
                });

                stream.on("end", function() {
                if (called)
                    return;
                    called = true;
                    self.send({
                        "type"    : "watcher",
                        "subtype" : "directorychange",
                        "path"    : path,
                        "files"   : files,
                        "lastmod" : stat.mtime
                    });
                });
            });
        });
    };

    this.onFileChange = function (path, currStat, prevStat) {
        if (ignoredPaths[path]) {
            clearTimeout(ignoreTimers[path]);
            ignoreTimers[path] = setTimeout(function() {
                delete ignoreTimers[path];
                delete ignoredPaths[path];
            }, IGNORE_TIMEOUT);
            return;
        }

        if (!currStat) {
            this.removeFileWatcher(path);
            this.send({
                "type"    : "watcher",
                "subtype" : "remove",
                "path"    : path
            });

            return;
        }

        this.send({
            "type"    : "watcher",
            "subtype" : "change",
            "path"    : path,
            "lastmod" : currStat.mtime
        });
    }

}).call(WatcherPlugin.prototype);
