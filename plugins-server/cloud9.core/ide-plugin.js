var assert = require("assert");
var utils = require("connect").utils;
var error = require("http-error");
var IdeServer = require("./ide");

module.exports = function setup(options, imports, register) {

    assert(options.fsUrl, "option 'fsUrl' is required");

    var log = imports.log;
    var hub = imports.hub;
    var connect = imports.connect;
    var permissions = imports["workspace-permissions"];

    var sandbox = imports.sandbox;
    var baseUrl = options.baseUrl || "";
    var staticPrefix = imports.static.getStaticPrefix();

    var socketUrl = options.socketUrl || "/socket.io";

    var ide;
    var serverPlugins = {};

    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return register(err);
        sandbox.getWorkspaceId(function(err, workspaceId) {
            if (err) return register(err);
            init(projectDir, workspaceId);
        });
    });

    function initUserAndProceed(uid, workspaceId, callback) {
        permissions.getPermissions(uid, workspaceId, function(err, perm) {
            if (err) {
                callback(err);
                return;
            }
            ide.addUser(uid, perm);
            callback(null, ide.$users[uid]);
        });
    }

    function init(projectDir, workspaceId, settingsPath) {
        ide = new IdeServer({
            workspaceDir: projectDir,
            settingsPath: settingsPath,
            davPrefix: baseUrl + "/workspace",
            projectName: options.projectName || "",
            socketIoUrl: socketUrl.replace(/^\//, ""),
            socketIoTransports: options.socketIoTransports,
            baseUrl: baseUrl,
            debug: (options.debug === true) ? true : false,
            staticUrl: staticPrefix,
            workspaceId: workspaceId,
            name: options.name || workspaceId,
            version: options.version || null,
            requirejsConfig: {
                baseUrl: staticPrefix,
                paths: imports.static.getRequireJsPaths()
            },
            plugins: options.clientPlugins || [],
            bundledPlugins: options.bundledPlugins || [],
            hosted: options.hosted,
            packed: (options.packed === true) ? true : false,
            packedName: options.packedName,
            local: options.local
        });

        register(null, {
            ide: {
                register: function(name, plugin, callback) {
                    log.info("IDE SERVER PLUGIN: ", name);
                    serverPlugins[name] = plugin;
                    callback();
                },
                getServer: function() {
                    return ide;
                },
                getSocketUrl: function() {
                    return socketUrl;
                },
                getWorkspaceId: function() {
                    return ide.options.workspaceId.toString();
                },
                canShutdown: ide.canShutdown.bind(ide),
                initUserAndProceed: initUserAndProceed,
                on: ide.on.bind(ide),
                destroy: ide.dispose.bind(ide)
            }
        });
    }

    hub.on("containersDone", function() {
        ide.init(serverPlugins);

        connect.useAuth(baseUrl, function(req, res, next) {
            if (!req.session.uid)
                return next(new error.Unauthorized());

            // NOTE: This gets called multiple times!

            var pause = utils.pause(req);

            initUserAndProceed(req.session.uid, ide.options.workspaceId, function(err) {
                if (err) {
                    next(err);
                    pause.resume();
                    return;
                }
                ide.handle(req, res, next);
                pause.resume();
            });
        });

        log.info("IDE server initialized. Listening on " + connect.getHost() + ":" + connect.getPort());
    });
};