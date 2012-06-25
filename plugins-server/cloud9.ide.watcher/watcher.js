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

            // console.log('Detected save', path);
            ignoredPaths[path] = 1;
            e.next();
        });
    };

    this.hooks = ["disconnect", "command"];
    this.name = name;
    this.filenames = {};
    this.watchers = {};
    this.basePath  = ide.workspaceDir;
}

util.inherits(WatcherPlugin, Plugin);

(function() {

    this.addWatcher = function(path) {
        if (this.watchers[path])
            return;
        var self = this;
        vfs.watch(path, {persistent:false}, function (err, meta) {
            if (err) {
                // console.log("can't add watcher for " + path);
                return
            }
            if (!self.filenames[path]) {
				if (watcher)
                    watcher.close();
                return;
            }
            var watcher = meta.watcher;
            watcher.on("change", function (event, filename) {
                if (watcher.timeout)
                    return;
                watcher.timeout = setTimeout(function() {
                    watcher.timeout = null;
                    self.onChange(path);
                }, 150);
            });
            self.watchers[path] = watcher;
        });
    };

    this.removeWatcher = function(path) {
        if (!this.watchers[path])
            return;
        this.watchers[path].close();
        delete this.watchers[path];
    }

    this.disconnect = function() {
        for (var filename in this.filenames)
            this.unwatchFile(filename);
        return true;
    };

    this.unwatchFile = function(filename) {
        // console.log("No longer watching file " + filename);
        if (filename in this.filenames && --this.filenames[filename] === 0) {
            delete this.filenames[filename];
            this.removeWatcher(filename);
        }
        return true;
    };

    this.command = function(user, message, client) {
        if (!message || message.command !== "watcher")
            return false;

        var path = message.path;
        var type = message.type;

        path = this.basePath + (path ? "/" + path : "");

        switch (type) {
            case "watchFile":
                if (this.filenames[path]) {
                    ++this.filenames[path];
                    // console.log("Already watching file " + path);
                } else {
                    // console.log("Watching file " + path);
                    this.addWatcher(path)
                    this.filenames[path] = 1;
                    return;
                }
                return true;
            case "unwatchFile":
                return this.unwatchFile(path);
            default:
                return false;
            }
    };

    this.dispose = function(callback) {
        for (var filename in this.filenames) {
            delete this.filenames[filename];
            this.removeWatcher(filename);
        }
        callback();
    };

    this.onChange = function (path, isDirectory) {
        // console.log('Detected event', path, ignoredPaths);
        if (ignoredPaths[path]) {
            clearTimeout(ignoreTimers[path]);
            ignoreTimers[path] = setTimeout(function() {
                delete ignoreTimers[path];
                delete ignoredPaths[path];
            }, IGNORE_TIMEOUT);
            return;
        }

        var subtype = "change";
        var self = this;

        vfs.stat(path, {}, function(err, stat) {
            if (err || !stat) {
                self.send({
                    "type"      : "watcher",
                    "subtype"   : "remove",
                    "path"      : path,
                    "files"     : files,
                });
            } if (stat.mime.search(/directory|file/) != -1) {
                var files = {};

                // vfs statdir?
                /*vfs.readdir(path)
                    .stat()
                    .each(function(file) {
                        files[file.name] = {
                            type : file.stat.isDirectory() ? "folder" : "file",
                            name : file.name
                        };
                    })
                    .end(function(err) {
                        if (err)
                            return;

                        self.send({
                            "type"      : "watcher",
                            "subtype"   : subtype,
                            "path"      : path,
                            "files"     : files,
                            "lastmod"   : stat.mtime
                        });
                        //console.log("Sent " + subtype + " notification for file " + path);
                    });*/
            } else {
                self.send({
                    "type"      : "watcher",
                    "subtype"   : subtype,
                    "path"      : path,
                    "files"     : files,
                    "lastmod"   : stat.mtime
                });
            }
        });
    }

}).call(WatcherPlugin.prototype);




