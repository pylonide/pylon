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

    DAV.plugins["watcher"] = function (handler) {
        handler.addEventListener("beforeWriteContent", function (e, uri) {
            var path = handler.server.tree.basePath + "/" + uri;
            ignoredPaths[path] = 1;
            e.next();
        });
    };

    this.hooks = ["disconnect", "command"];
    this.name = name;
    this.clients = {};
    this.basePath = ide.workspaceDir;
};

util.inherits(WatcherPlugin, Plugin);

(function() {

    this.addFileWatcher = function(clientId, path, client) {
        if (this.clients[clientId].fileWatchers[path])
            return;

        var self = this;

        this.clients[clientId].fileWatchers[path] = {};

        vfs.watch(path, {file: true, persistent: false}, function (err, meta) {
            if (err)
                return console.error("can't add file watcher for " + path, err);

            var watcher = meta.watcher;
            if (!self.clients[clientId].fileWatchers[path]) {
                if (watcher) {
                    console.log("close1", path);
                    watcher.close();
                }
                return;
            }

            watcher.on("change", function (currStat, prevStat) {
                console.log("changeFile", path, currStat, prevStat);
                self.onFileChange(clientId, path, currStat, prevStat, client);
            });

            self.clients[clientId].fileWatchers[path].watcher = watcher;
        });
    };

    this.addDirectoryWatcher = function(clientId, path, client) {
        if (this.clients[clientId].directoryWatchers[path])
            return;

        var self = this;

        this.clients[clientId].directoryWatchers[path] = {};

        vfs.watch(path, {file: false, persistent: false}, function (err, meta) {
            if (err)
                return console.error("can't add directory watcher for " + path, err);

            var watcher = meta.watcher;
            if (!self.clients[clientId].directoryWatchers[path]) {
                if (watcher) {
                    console.log("close2", path);
                    watcher.close();
                }
                return;
            }

            watcher.on("change", function (event, filename) {
                console.log("changeDir", filename);
                self.onDirectoryChange(clientId, path, event, filename, client);
            });

            self.clients[clientId].directoryWatchers[path].watcher = watcher;
        });
    };

    this.onFileChange = function (clientId, path, currStat, prevStat, client) {
        if (ignoredPaths[path]) {
            clearTimeout(ignoreTimers[path]);
            ignoreTimers[path] = setTimeout(function() {
                delete ignoreTimers[path];
                delete ignoredPaths[path];
            }, IGNORE_TIMEOUT);
            return;
        }

        if (prevStat && prevStat.mtime && currStat && currStat.mtime && prevStat.mtime.getTime() === currStat.mtime.getTime()) {
            console.log("prevStat");
            return;
        }

        if (!currStat) {
            console.log("!curStat");
            this.removeFileWatcher(clientId, path);
            client.send(JSON.stringify({
                "type"    : "watcher",
                "subtype" : "remove",
                "path"    : path
            }));
            return;
        }

        client.send(JSON.stringify({
            "type"    : "watcher",
            "subtype" : "change",
            "path"    : path,
            "lastmod" : currStat.mtime
        }));
    };

    this.onDirectoryChange = function (clientId, path, event, filename, client) {
        var self = this;
        vfs.stat(path, {}, function(err, stat) {
            if (err)
                return;

            if (!stat) {
                self.removeDirectoryWatcher(clientId, path);
                client.send(JSON.stringify({
                    "type"    : "watcher",
                    "subtype" : "remove",
                    "path"    : path,
                    "files"   : files
                }));
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
                    client.send(JSON.stringify({
                        "type"    : "watcher",
                        "subtype" : "directorychange",
                        "path"    : path,
                        "files"   : files,
                        "lastmod" : stat.mtime
                    }));
                });
            });
        });
    };

    this.removeFileWatcher = function(clientId, path) {
        if (this.clients[clientId].fileWatchers[path]) {
            console.log("close", this.clients[clientId].fileWatchers[path]);
            this.clients[clientId].fileWatchers[path].watcher.close();
            delete this.clients[clientId].fileWatchers[path];
        }
    };

    this.removeDirectoryWatcher = function(clientId, path) {
        if (this.clients[clientId].directoryWatchers[path]) {
            this.clients[clientId].directoryWatchers[path].watcher.close();
            delete this.clients[clientId].directoryWatchers[path];
        }
    };

    this.command = function(user, message, client) {
        if (!message || message.command !== "watcher")
            return false;

        var clientId = client.id;

        if (!this.clients[clientId]) {
            this.clients[clientId] = {
                fileWatchers : {},
                directoryWatchers : {}
            };
        }

        var path = this.basePath + (message.path ? "/" + message.path : "");

        switch (message.type) {
            case "watchFile":
                this.addFileWatcher(clientId, path, client);
                return true;
            case "watchDirectory":
                this.addDirectoryWatcher(clientId, path, client);
                return true;
            case "unwatchFile":
                return this.removeFileWatcher(clientId, path);
            case "unwatchDirectory":
                return this.removeDirectoryWatcher(clientId, path);
            default:
                return false;
        }
    };

    /**
     * A client has disconnected
     */
    this.disconnect = function(user, client) {
        var clientId = client.id;
        if (!this.clients[clientId])
            return;

        for (var filePath in this.clients[clientId].fileWatchers)
            this.removeFileWatcher(clientId, filePath);
        for (var dirPath in this.clients[clientId].directoryWatchers)
            this.removeDirectoryWatcher(clientId, dirPath);
        delete this.clients[clientId];
    };

    this.dispose = function(callback) {
        for (var clientId in this.clients) {
            for (var filePath in this.clients[clientId].fileWatchers)
                this.removeFileWatcher(clientId, filePath);

            for (var dirPath in this.clients[clientId].directoryWatchers)
                this.removeDirectoryWatcher(clientId, dirPath);
        }

        callback();
    };

}).call(WatcherPlugin.prototype);
