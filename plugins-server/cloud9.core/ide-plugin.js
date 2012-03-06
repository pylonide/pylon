var assert = require("assert");
var IO = require("socket.io");

var IdeServer = require("./ide");
var User = require("./user");

module.exports = function setup(options, imports, register) {

    assert(options.projectDir, "option projectDir required");
    assert(options.fsUrl, "option fsUrl required");
    assert(options.workspaceId, "option workspaceId required");

    var log = imports.log;
    var hub = imports.hub;
    var connect = imports.connect;

    var serverPlugins = {};
    var serverOptions = {
        workspaceDir: options.projectDir,
        davPrefix: "/workspace",
        baseUrl: "",
        debug: false,
        staticUrl: options.staticUrl || "/static",
        workspaceId: options.workspaceId,
        name: options.name || options.workspaceId,
        version: options.version || null,
        requirejsConfig: {
            baseUrl: "/static/",
            paths: imports.static.getRequireJsPaths()
        },
        plugins: options.clientPlugins || []
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
        connect.use(function(req, res, next) {
            if (!req.session.uid)
                req.session.uid = "owner_" + req.sessionID;

            ide.addUser(req.session.uid, User.OWNER_PERMISSIONS);
            ide.handle(req, res, next);
        });

        log.info("IDE server initialized");
    });
};