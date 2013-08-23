/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var dirname = require("path").dirname;
require("colors");

module.exports = WatcherClient;

function WatcherClient(client, clientId, pool) {
    this.client = client;
    this.clientId = clientId;
    this.pool = pool;
    
    this.paths = {};
    this.ignored = {};
}

(function() {

    this.setWatchers = function(paths) {
        //console.log("set watchers".yellow, this.clientId, paths);
        var that = this;
        
        var newPathsMap = paths.reduce(function(obj, path) {
            obj[path] = 1;
            return obj;
        }, {});
        
        // 1. remove paths not in the new paths
        for (var path in this.paths) {
            if (!newPathsMap.hasOwnProperty(path))
                this.removeWatcher(path);
        }
        
        // 2. add paths not yet in this.paths
        paths.forEach(function(path) {
            if (!that.hasOwnProperty(path))
                that.addWatcher(path);
        });
    };

    this.ignoreFile = function(path, skipParent) {
        // console.log("ignore".blue, this.clientId, path);

        if (!this.ignored[path])
            this.ignored[path] = 1;
        else 
            this.ignored[path] += 1;

        if (skipParent)
            return;

        var parentDir = dirname(path);
        if (parentDir)
            this.ignoreFile(parentDir, true);
    };
    
    this.unignoreFile = function(path, skipParent) {
        // console.log("unignore".blue, this.clientId, path);
        
        if (this.ignored[path]) {
            this.ignored[path] -= 1;
            if (this.ignored[path] <= 0)
                delete this.ignored[path];
        }
            
        if (skipParent)
            return;

        var parentDir = dirname(path);
        if (parentDir)
            this.unignoreFile(parentDir, true);
    };
    
    this.addWatcher = function(path) {
        if (this.paths[path])
            return;

        var self = this;
        // console.log("add watcher".yellow, this.clientId, path);

        // claim this slot until pool.watch returns
        this.paths[path] = {
            async: 1
        };
        
        this.pool.watch(
            path,
            this.onChange.bind(this),
            self.removeWatcher.bind(this, path),
            function(err, handle) {
                if (err)
                    return; // return console.error("can't add watcher for " + path, err);

                self.paths[path] = handle;
            }
        );
    };
    
    this.onChange = function(e) {
        // console.log("on change".green, this.clientId, e);
        if (this.ignored[e.path]) {
            // console.log("ignored".blue, this.clientId, e.path);
            return;
        }

        e.type = "watcher";
        this.client.send(JSON.stringify(e));
    };
    
    this.removeWatcher = function(path) {
        // console.log("remove watcher".yellow, this.clientId, path);
        if (this.paths[path]) {
            if (!this.paths[path].async)
                this.pool.unwatch(this.paths[path]);
            delete this.paths[path];
        }
    };

    this.disconnect = function() {
        for (var path in this.paths)
            this.removeWatcher(path);

        // console.log("DISCONNECT".red, this.clientId);
        this.paths = {};
    };

}).call(WatcherClient.prototype);