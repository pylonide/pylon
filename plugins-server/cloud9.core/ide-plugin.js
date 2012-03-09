var assert = require("assert");

var IdeServer = require("./ide");
var User = require("./user");

module.exports = function setup(options, imports, register) {

    assert(options.projectDir, "option projectDir required");
    assert(options.fsUrl, "option fsUrl required");
    assert(options.workspaceId, "option workspaceId required");

    var log = imports.log;
    var hub = imports.hub;
    var connect = imports.connect;
    var permissions = imports["workspace-permissions"];

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
        connect.use(function(req, res, next) {
            if (!req.session.uid)
                req.session.uid = "owner_" + req.sessionID;

            permissions.getPermissions(req.session.uid, function(err, perm) {
                if (err)
                    return next(err);

                ide.addUser(req.session.uid, perm);
                ide.handle(req, res, next);
            })
        });

        log.info("IDE server initialized");
    });
};