/*global require module exports process __dirname*/
/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var assert = require("assert");
var User = require("./user");
var fs = require("fs");
var util = require("util");
var template = require("simple-template");
var Workspace = require("./workspace");
var EventEmitter = require("events").EventEmitter;
var c9util = require("./util");
var Path = require("path");

var INDEX_TMPL = fs.readFileSync(__dirname + "/view/ide.tmpl.html", "utf8");

var Ide = module.exports = function(options) {
    EventEmitter.call(this);

    assert(options.workspaceId, "option 'workspaceId' is required");
    assert(options.workspaceDir, "option 'workspaceDir' is required");
    assert(options.requirejsConfig, "option 'requirejsConfig' is required");
    assert(options.smithIo, "option 'smithIo' is required");
   // assert.equal(options.workspaceDir.charAt(0), "/", "option 'workspaceDir' must be an absolute path");

    var staticUrl = options.staticUrl || "/static";
    var workerUrl = options.workerUrl || "/static";

    this.workspaceDir = options.workspaceDir;

    options.plugins = options.plugins || [];

    this.options = {
        workspaceDir: this.workspaceDir,
        mountDir: options.mountDir || this.workspaceDir,
        smithIo: options.smithIo,
        davPrefix: options.davPrefix,
        davPlugins: options.davPlugins || exports.DEFAULT_DAVPLUGINS,
        debug: (options.debug === true) ? true : false,
        workerUrl: workerUrl,
        staticUrl: staticUrl,
        workspaceId: options.workspaceId,
        runners: options.runners,
        plugins: options.plugins,
        bundledPlugins: options.bundledPlugins || [],
        requirejsConfig: options.requirejsConfig,
        projectName: options.projectName || Path.basename(this.workspaceDir),
        version: options.version,
        extra: options.extra,
        hosted: !!options.hosted,
        env: options.env,
        local: options.local,
        packed: options.packed,
        packedName: options.packedName
    };

    this.$users = {};
    this.nodeCmd = options.exec || process.execPath;

    this.workspace = new Workspace(this);
};

util.inherits(Ide, EventEmitter);

(function () {

    this.init = function(exts) {
        this.workspace.createPlugins(exts);
        var statePlugin = this.workspace.getExt("state");
        if (statePlugin) {
            statePlugin.on("statechange", function(state) {
                state.workspaceDir = statePlugin.workspace.workspaceDir;
                state.davPrefix = statePlugin.ide.davPrefix;
            });
        }
    };

    this.handle = function(req, res, next) {
        if (req.method == "GET" && req.parsedUrl.pathname.match(/^(\/|\/index.html?)$/))
            this.$serveIndex(req, res, next);
        else
            next();
    };

    this.$serveIndex = function(req, res, next) {
        res.writeHead(200, {
            "cache-control": "no-transform",
            "Content-Type": "text/html"
        });

        var permissions = this.getPermissions(req);
        var plugins = c9util.arrayToMap(this.options.plugins);
        var bundledPlugins = c9util.arrayToMap(this.options.bundledPlugins);

        var client_exclude = c9util.arrayToMap(permissions.client_exclude.split("|"));
        for (var plugin in client_exclude)
            delete plugins[plugin];

        // TODO: Exclude applicable bundledPlugins

        var client_include = c9util.arrayToMap((permissions.client_include || "").split("|"));
        for (var plugin in client_include) {
            if (plugin)
                plugins[plugin] = 1;
        }

        var staticUrl = this.options.staticUrl;
        var workerUrl = this.options.workerUrl;
        var aceScripts = '<script type="text/javascript" data-ace-worker-path="/static/js/worker" src="'
            + staticUrl + '/ace/build/ace'
            + (this.options.debug ? "-uncompressed" : "") + '.js"></script>\n';

        var loadedDetectionScript = "";
        if (this.options.local) {
            loadedDetectionScript = '<script type="text/javascript" src="/c9local/ui/connected.js?workspaceId=' +
                this.options.workspaceId + '"></script>';
        }

        var replacements = {
            davPrefix: this.options.davPrefix,
            workspaceDir: this.options.workspaceDir,
            debug: this.options.debug,
            workerUrl: workerUrl,
            staticUrl: staticUrl,
            smithIo: JSON.stringify(this.options.smithIo),
            sessionId: req.sessionID, // set by connect
            uid: req.session.uid || req.session.anonid || 0,
            pid: this.options.pid || process.pid || 0,
            workspaceId: this.options.workspaceId,
            plugins: Object.keys(plugins),
            bundledPlugins: Object.keys(bundledPlugins),
            readonly: (permissions.fs !== "rw"),
            requirejsConfig: this.options.requirejsConfig,
            settingsXml: "",
            runners: this.options.runners,
            scripts: (this.options.debug || this.options.packed) ? "" : aceScripts,
            projectName: this.options.projectName,
            version: this.options.version,
            hosted: this.options.hosted.toString(),
            env: this.options.env || "local",
            packed: this.options.packed,
            packedName: this.options.packedName,
            local: this.options.local,
            loadedDetectionScript: loadedDetectionScript,
            _csrf: req.csrfToken() || ""
        };

        var settingsPlugin = this.workspace.getExt("settings");
        var user = this.getUser(req);

        if (!settingsPlugin || !user) {
            var index = template.fill(INDEX_TMPL, replacements);
            res.end(index);
        }
        else {
            settingsPlugin.loadSettings(user, function(err, settings) {
                replacements.settingsXml = err || !settings ? "defaults" : settings.replace(/]]>/g, '&#093;&#093;&gt;');
                var index = template.fill(INDEX_TMPL, replacements);
                res.end(index);
            });
        }
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
                _self.emit("message", msg);
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
        var uid = req.session.uid || req.session.anonid;
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
            return user.getPermissions() || User.VISITOR_PERMISSIONS;
    };

    this.hasUser = function(username) {
        return !!this.$users[username];
    };

    this.addClientConnection = function(username, client, message) {
        var user = this.$users[username];
        if (!user)
            return this.workspace.error("No session for user " + username, 401, message, client);

        user.addClientConnection(client, message);
        this.emit("clientConnection", client);
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
