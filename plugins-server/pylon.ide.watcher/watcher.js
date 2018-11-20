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
var WatcherClient = require("./watcher_client");

module.exports = function setup(options, imports, register) {
    var DAV = imports.dav.getServer();
    var vfs = imports.vfs;
    var name = "watcher";

    var IGNORE_TIMEOUT = 100;

    function WatcherPlugin(ide, workspace) {
        Plugin.call(this, ide, workspace);

        this.pool = new WatcherPool(vfs);
        var self = this;

        DAV.plugins.watcher = function (handler) {
            handler.addEventListener("beforeBind", onChange);
            handler.addEventListener("beforeUnbind", onChange);
            handler.addEventListener("beforeWriteContent", onChange);

            // ignore thie changes while the file is being changed
            function onChange(e, uri) {
                var path = handler.server.tree.basePath + "/" + uri;
                var clientId = handler.httpRequest.headers["x-clientid"];
                
                var watcherClient = self.clients[clientId];
                
                if (!watcherClient)
                    return e.next();
                    
                watcherClient.ignoreFile(path);
                
                var end = handler.httpResponse.end;
                handler.httpResponse.end = function() {
                    setTimeout(function() {
                        watcherClient.unignoreFile(path);
                    }, IGNORE_TIMEOUT);
                    end.apply(this, arguments);
                };
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

        this.command = function(user, message, client) {
            var that = this;
            
            if (!message || message.command !== "watcher")
                return false;

            var clientId = message.id;
            if (!clientId)
                return false;
            
            
            if (!this.clients[clientId])
                this.clients[clientId] = new WatcherClient(client, clientId, this.pool);
                
            var watcherClient = this.clients[clientId];
            watcherClient.client = client;
            client.watcherId = clientId;
            
            var paths = (message.paths || []).map(function(path) {
                return that.basePath + (path ? "/" + path : "");
            });
            watcherClient.setWatchers(paths);
        };

        this.disconnect = function(user, client) {
            var clientId = client.watcherId;
            
            var watcherClient = this.clients[clientId];
            if (watcherClient) {
                watcherClient.disconnect();
                delete this.clients[clientId];
            }
        };

        this.dispose = function(callback) {
            for (var clientId in this.clients)
                this.clients[clientId].disconnect();
                
            this.clients = {};
            callback();
        };

    }).call(WatcherPlugin.prototype);

    imports.ide.register(name, WatcherPlugin, register);
};