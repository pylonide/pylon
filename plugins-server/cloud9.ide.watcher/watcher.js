/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var fs = require("fs");
var util = require("util");
var Plugin = require("../cloud9.core/plugin");
var async = require("asyncjs");

var name = "watcher";
var DAV;

module.exports = function setup(options, imports, register) {	
    DAV = imports.dav.getServer();
    imports.ide.register(name, WatcherPlugin, register);	
};

var IGNORE_TIMEOUT = 50,
    ignoredPaths = {},
    ignoreTimers = {};

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
    this.basePath  = ide.workspaceDir;
}

util.inherits(WatcherPlugin, Plugin);

(function() {
    this.unwatchFile = function(filename) {
        // console.log("No longer watching file " + filename);
        if (filename in this.filenames && --this.filenames[filename] === 0) {
            delete this.filenames[filename];
            fs.unwatchFile(filename);
        }
        return true;
    };

    this.disconnect = function() {
        for (var filename in this.filenames)
            this.unwatchFile(filename);
        return true;
    };

    this.command = function(user, message, client) {
        var that, subtype, files;

        if (!message || message.command !== "watcher")
            return false;

        var path = message.path;
        var type = message.type;

        path = this.basePath + (path ? "/" + path : "");
return
        switch (type) {
            case "watchFile":
                if (this.filenames[path])
                    ++this.filenames[path]; // console.log("Already watching file " + path);
                else {
                    // console.log("Watching file " + path);
                    that = this;
                    fs.watchFile(path, function (curr, prev) {
                        //console.log('Detected event', path, ignoredPaths);
                        if (ignoredPaths[path]) {
                            clearTimeout(ignoreTimers[path]);
                            ignoreTimers[path] = setTimeout(function() {
                                delete ignoreTimers[path];
                                delete ignoredPaths[path];
                            }, IGNORE_TIMEOUT);
                            return;
                        }
                        
                        if (curr.nlink == 1 && prev.nlink == 0)
                            subtype = "create";
                        else if (curr.nlink == 0 && prev.nlink == 1)
                            subtype = "remove";
                        else if (curr.mtime.toString() != prev.mtime.toString())
                            subtype = "change";
                        else
                            return;
                            
                        if (curr.isDirectory()) {
                            files = {};

                            async.readdir(path)
                                .stat()
//                                .filter(function(file) {
//                                    return file.name.charAt(0) != '.'
//                                })
                                .each(function(file) {
                                    files[file.name] = {
                                        type : file.stat.isDirectory() ? "folder" : "file",
                                        name : file.name
                                    };
                                })
                                .end(function(err) {
                                    if (err)
                                        return;

                                    that.send({
                                        "type"      : "watcher",
                                        "subtype"   : subtype,
                                        "path"      : path,
                                        "files"     : files,
                                        "lastmod"   : curr.mtime
                                    });
                                    //console.log("Sent " + subtype + " notification for file " + path);
                                });
                        } else
                            that.send({
                                "type"      : "watcher",
                                "subtype"   : subtype,
                                "path"      : path,
                                "files"     : files,
                                "lastmod"   : curr.mtime
                            });

                    });
                    this.filenames[path] = 1;
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
            fs.unwatchFile(filename);
        }
        callback();
    };

}).call(WatcherPlugin.prototype);
