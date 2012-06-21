/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var assert = require("assert");
var connect = require("connect");
var User = require("./user");
var fs = require("fs");
var util = require("util");
var template = require("simple-template");
var Workspace = require("./workspace");
var EventEmitter = require("events").EventEmitter;
var c9util = require("./util");
var Path = require("path");

var Ide = module.exports = function(options) {
    EventEmitter.call(this);

    assert(options.workspaceId, "option 'workspaceId' is required");
    assert(options.workspaceDir, "option 'workspaceDir' is required");
    assert(options.requirejsConfig, "option 'requirejsConfig' is required");
    assert(options.socketIoUrl, "option 'socketIoUrl' is required");
    assert(options.socketIoTransports, "option 'socketIoTransports' is required");
   // assert.equal(options.workspaceDir.charAt(0), "/", "option 'workspaceDir' must be an absolute path");

    var staticUrl = options.staticUrl || "/static";

    this.workspaceDir = options.workspaceDir;

    options.plugins = options.plugins || [];
    this.options = {
        workspaceDir: this.workspaceDir,
        mountDir: options.mountDir || this.workspaceDir,
        socketIoUrl: options.socketIoUrl,
        socketIoTransports: options.socketIoTransports,
        davPrefix: options.davPrefix,
        davPlugins: options.davPlugins || exports.DEFAULT_DAVPLUGINS,
        debug: (options.debug === true) ? true : false,
        staticUrl: staticUrl,
        workspaceId: options.workspaceId,
        plugins: options.plugins,
        bundledPlugins: options.bundledPlugins || [],
        requirejsConfig: options.requirejsConfig,
        projectName: options.projectName || this.workspaceDir.split("/").pop(),
        version: options.version,
        extra: options.extra,
        packed: (options.packed === true) ? true : false,
        packedName: options.packedName,
        hosted: !!options.hosted
    };

    this.$users = {};
    this.nodeCmd = options.exec || process.execPath;

    this.workspace = new Workspace(this);
    
    var _self = this;
    this.router = connect.router(function(app) {
        app.get(/^(\/|\/index.html?)$/, function(req, res, next) {
            _self.$serveIndex(req, res, next);
        });
    });
};

util.inherits(Ide, EventEmitter);

(function () {

    this.init = function(exts) {
        this.workspace.createPlugins(exts);
        var statePlugin = this.workspace.getExt("state");
        if (statePlugin) {
            statePlugin.on("statechange", function(state) {
                state.workspaceDir = this.workspace.workspaceDir;
                state.davPrefix =  this.ide.davPrefix;
            });
        }
    };

    this.handle = function(req, res, next) {
        this.router(req, res, next);
    };

    this.$serveIndex = function(req, res, next) {
        var _self = this;

        var indexFile = "ide.tmpl.html";

        fs.readFile(Path.join(__dirname, "/view/", indexFile), "utf8", function(err, index) {
            if (err)
                return next(err);

            res.writeHead(200, {
                "cache-control": "no-transform",
                "Content-Type": "text/html"
            });
            
            var permissions = _self.getPermissions(req);
            var plugins = c9util.arrayToMap(_self.options.plugins);
            var bundledPlugins = c9util.arrayToMap(_self.options.bundledPlugins);

            var client_exclude = c9util.arrayToMap(permissions.client_exclude.split("|"));
            for (var plugin in client_exclude)
                delete plugins[plugin];

            // TODO: Exclude applicable bundledPlugins

            var client_include = c9util.arrayToMap((permissions.client_include || "").split("|"));
            for (var plugin in client_include)
                if (plugin)
                    plugins[plugin] = 1;

            var staticUrl = _self.options.staticUrl;
            var aceScripts = '<script type="text/javascript" data-ace-worker-path="/static/js/worker" src="'
                + staticUrl + '/ace/build/ace'
                + (_self.options.debug ? "-uncompressed" : "") + '.js"></script>\n';

            var replacements = {
                davPrefix: _self.options.davPrefix,
                workspaceDir: _self.options.workspaceDir,
                debug: _self.options.debug,
                staticUrl: staticUrl,
                socketIoUrl: _self.options.socketIoUrl,
                socketIoTransports: _self.options.socketIoTransports,
                sessionId: req.sessionID, // set by connect
                workspaceId: _self.options.workspaceId,
                plugins: Object.keys(plugins),
                bundledPlugins: Object.keys(bundledPlugins),
                readonly: (permissions.fs !== "rw"),
                requirejsConfig: _self.options.requirejsConfig,
                settingsXml: "",
                scripts: (_self.options.debug || _self.options.packed) ? "" : aceScripts,
                projectName: _self.options.projectName,
                version: _self.options.version,
                hosted: _self.options.hosted.toString(),
                packed: _self.options.packed,
                packedName: _self.options.packedName
            };

            var settingsPlugin = _self.workspace.getExt("settings");
            var user = _self.getUser(req);
            if (!settingsPlugin || !user) {
                index = template.fill(index, replacements);
                res.end(index);
            }
            else {
                settingsPlugin.loadSettings(user, function(err, settings) {
                    replacements.settingsXml = err || !settings ? "defaults" : settings.replace(/]]>/g, '&#093;&#093;&gt;');
                    index = template.fill(index, replacements);
                    res.end(index);
                });
            }
        });
    };

    this.addUser = function(username, permissions, userData) {
        var user = this.$users[username];
        if (user) {
            user.setPermissions(permissions);
        }
        else {
            user = this.$users[username] = new User(username, permissions, userData);

            var _self = this;
            user.on("message", function(msg) {
                if(_self.$users[msg.user.uid]) {
                    _self.$users[msg.user.uid].last_message_time = new Date().getTime();
                }
                _self.onUserMessage(msg.user, msg.message, msg.client);
            });
            user.on("disconnectClient", function(msg) {
                _self.workspace.execHook("disconnect", msg.user, msg.client);
            });
            user.on("disconnectUser", function(user) {
                console.log("Running user disconnect timer...");

                setTimeout(function() {
                    var now = new Date().getTime();
                    if ((now - user.last_message_time) > 10000) {
                        console.log("User fully disconnected", username);
                        _self.removeUser(user);
                    }
                }, 10000);
            });

            this.onUserCountChange();
            this.emit("userJoin", user);
        }
        return user;
    };

    this.getUser = function(req) {
        var uid = req.session.uid;
        if (!uid || !this.$users[uid])
            return null;
        else
            return this.$users[uid];
    };

    this.removeUser = function(user) {
        if (!this.$users[user.uid])
            return;

        delete this.$users[user.uid];
        this.onUserCountChange();
        this.emit("userLeave", user);
    };

    this.getPermissions = function(req) {
        var user = this.getUser(req);
        
        if (!user)
            return User.VISITOR_PERMISSIONS;
        else
            return user.getPermissions();
    };
    
    this.hasUser = function(username) {
        return !!this.$users[username];
    };

    this.addClientConnection = function(username, client, message) {
        var user = this.$users[username];
        if (!user)
            return this.workspace.error("No session for user " + username, 401, message, client);

        user.addClientConnection(client, message);
    };

    this.onUserMessage = function(user, message, client) {
        this.workspace.execHook("command", user, message, client);
    };

    this.onUserCountChange = function() {
        this.emit("userCountChange", Object.keys(this.$users).length);
    };

    this.broadcast = function(msg, scope) {
        try {
            for (var username in this.$users) {
                var user = this.$users[username];
                user.broadcast(msg, scope);
            }
        }
        catch (e) {
            var ex = new Error("Stack overflow just happened");
            ex.original = e;
            throw ex;
        }
    };

    this.sendToUser = function(username, msg) {
        this.$users[username] && this.$users[username].broadcast(msg);
    };

    this.canShutdown = function() {
        return this.workspace.canShutdown();
    };

    this.dispose = function(callback) {
        this.emit("destroy");
        
        this.workspace.dispose(callback);
    };
}).call(Ide.prototype);