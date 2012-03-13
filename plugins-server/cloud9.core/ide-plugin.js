var assert = require("assert");
var utils = require("connect").utils;

var IdeServer = require("./ide");

module.exports = function setup(options, imports, register) {

    assert(options.fsUrl, "option 'fsUrl' is required");

    var log = imports.log;
    var hub = imports.hub;
    var connect = imports.connect;
    var permissions = imports["workspace-permissions"];

    var sandbox = imports.sandbox;
    var projectDir = sandbox.getProjectDir();
    var workspaceId = sandbox.getWorkspaceId();
    var baseUrl = options.baseUrl || "";

    var serverPlugins = {};
    var serverOptions = {
        workspaceDir: projectDir,
        davPrefix: baseUrl + "/workspace",
        baseUrl: baseUrl,
        debug: false,
        staticUrl: options.staticUrl || "/static",
        workspaceId: workspaceId,
        name: options.name || workspaceId,
        version: options.version || null,
        requirejsConfig: {
            baseUrl: "/static/",
            paths: imports.static.getRequireJsPaths()
        },
        plugins: options.clientPlugins || [],
        bundledPlugins: [
            "helloworld"
        ]
    };
    var ide = new IdeServer(serverOptions);

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

    hub.on("containersDone", function() {
        ide.init(serverPlugins);
        connect.use(baseUrl, function(req, res, next) {
            if (!req.session.uid)
                req.session.uid = "owner_" + req.sessionID;

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
            })
        });

        log.info("IDE server initialized");
    });
};