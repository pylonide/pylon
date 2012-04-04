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

    var ide;
    var serverPlugins = {};

    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return register(err);
        sandbox.getWorkspaceId(function(err, workspaceId) {
            if (err) return register(err);
            sandbox.getSettingsPath(function(err, settingsPath) {
                if (err) return register(err);
                init(projectDir, workspaceId, settingsPath);
            });
        });
    });

    function init(projectDir, workspaceId, settingsPath) {
        ide = new IdeServer({
            workspaceDir: projectDir,
            settingsPath: settingsPath,
            davPrefix: baseUrl + "/workspace",
            baseUrl: baseUrl,
            debug: false,
            staticUrl: staticPrefix,
            workspaceId: workspaceId,
            name: options.name || workspaceId,
            version: options.version || null,
            requirejsConfig: {
                baseUrl: staticPrefix,
                paths: imports.static.getRequireJsPaths()
            },
            plugins: options.clientPlugins || [],
            bundledPlugins: options.bundledPlugins || []
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
                }
            }
        });
    }

    hub.on("containersDone", function() {
        ide.init(serverPlugins);
        connect.useAuth(baseUrl, function(req, res, next) {
            if (!req.session.uid) {
//                return next(new error.Unauthorized());
                req.session.uid = "owner_" + req.sessionID;
            }

            var pause = utils.pause(req);
            permissions.getPermissions(req.session.uid, function(err, perm) {
                if (err) {
                    next(err);
                    pause.resume();
                    return;
                }

                ide.addUser(req.session.uid, perm);
                ide.handle(req, res, next);
                pause.resume();
            });
        });

        log.info("IDE server initialized");
    });
};