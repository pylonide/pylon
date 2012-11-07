/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var util = require("util");
var Plugin = require("../cloud9.core/plugin");

var WatcherPool = require("./watcher_pool");

module.exports = function setup(options, imports, register) {
    var DAV = imports.dav.getServer();
    var vfs = imports.vfs;
    var name = "watcher";

    var IGNORE_TIMEOUT = 200;

    function WatcherPlugin(ide, workspace) {
        Plugin.call(this, ide, workspace);

        var pool = this.pool = new WatcherPool(vfs);

        DAV.plugins["watcher"] = function (handler) {
            handler.addEventListener("beforeBind", onChange);
            handler.addEventListener("beforeUnbind", onChange);
            handler.addEventListener("beforeWriteContent", onChange);

            function onChange(e, uri) {
                var path = handler.server.tree.basePath + "/" + uri;
                pool.ignoreFile(path, IGNORE_TIMEOUT);
                e.next();
            }
        };

        this.hooks = ["disconnect", "command"];
        this.name = name;
        this.clients = {};
        this.basePath = ide.workspaceDir;
    }

    util.inherits(WatcherPlugin, Plugin);

    (function() {

        this.addWatcher = function(clientId, path, client) {
            // console.log("add watcher".yellow, clientId, path);
            if (!this.clients[clientId])
                this.clients[clientId] = {};

            if (this.clients[clientId][path])
                return;

            var self = this;

            // claim this slot until pool.watch returns
            this.clients[clientId][path] = {
                async: 1
            };

            this.pool.watch(path, self.onChange.bind(this, client), self.removeWatcher.bind(this, clientId), function(err, handle) {
                if (err)
                    return console.error("can't add watcher for " + path, err);

                self.clients[clientId][path] = handle;
            });
        };

        this.onChange = function(client, e) {
            //console.log("on change".green, e);
            e.type = "watcher";
            client.send(JSON.stringify(e));
        };

        this.removeWatcher = function(clientId, path) {
            var watchers = this.clients[clientId];
            if (watchers && watchers[path]) {
                if (!watchers[path].async)
                    this.pool.unwatch(watchers[path]);
                delete watchers[path];
            }
        };

        this.command = function(user, message, client) {
            if (!message || message.command !== "watcher")
                return false;

            var clientId = client.id;

            if (!this.clients[clientId]) {
                this.clients[clientId] = {};
            }

            var path = this.basePath + (message.path ? "/" + message.path : "");
            switch (message.type) {
                case "watchFile":
                case "watchDirectory":
                    this.addWatcher(clientId, path, client);
                    return true;
                case "unwatchFile":
                case "unwatchDirectory":
                    return this.removeWatcher(clientId, path);
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

            for (var path in this.clients[clientId])
                this.removeWatcher(clientId, path);

            delete this.clients[clientId];
        };

        this.dispose = function(callback) {
            for (var clientId in this.clients) {
                for (var path in this.clients[clientId]) {
                    this.removeWatcher(clientId, path);
                }
            }

            callback();
        };

    }).call(WatcherPlugin.prototype);

    imports.ide.register(name, WatcherPlugin, register);
};