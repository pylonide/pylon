var assert = require("assert");
var utils = require("connect").utils;
var error = require("http-error");
var IdeServer = require("./ide");
var parseUrl = require("url").parse;
var middleware = require("./middleware");

module.exports = function setup(options, imports, register) {

    assert(options.fsUrl, "option 'fsUrl' is required");
    assert.equal(typeof options.hosted, "boolean", "option 'hosted' is required");

    var log = imports.log;
    var hub = imports.hub;
    var connect = imports.connect;
    var permissions = imports["workspace-permissions"];

    var sandbox = imports.sandbox;
    var baseUrl = options.baseUrl || "";
    var staticPrefix = imports.static.getStaticPrefix();
    var workerPrefix = imports.static.getWorkerPrefix() || "/static";

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
        permissions.getPermissions(uid, workspaceId, "cloud9.core.ide-plugin", function(err, perm) {
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
            smithIo: options.smithIo,
            baseUrl: baseUrl,
            debug: (options.debug === true) ? true : false,
            workerUrl: workerPrefix,
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
            env: options.env,
            packed: options.packed,
            packedName: options.packedName,
            local: options.local
        });

        var server = connect.getModule()();
        connect.useAuth(baseUrl, server);

        server.use(function(req, res, next) {
            req.parsedUrl = parseUrl(req.url);

            if (!(req.session.uid || req.session.anonid))
                return next(new error.Unauthorized());
            // NOTE: This gets called multiple times!

            var pause = utils.pause(req);

            initUserAndProceed(req.session.uid || req.session.anonid, ide.options.workspaceId, function(err) {
                if (err) {
                    next(err);
                    pause.resume();
                    return;
                }

                next();
                pause.resume();
            });
        });

        hub.on("ready", function() {
            ide.init(serverPlugins);
            server.use(ide.handle.bind(ide));
            server.use(middleware.errorHandler());
            log.info("IDE server initialized. Listening on " + connect.getHost() + ":" + connect.getPort());
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
                    console.error(new Error("ide.getSocketUrl() is DEPRECATED").stack);
                },
                getBaseUrl: function() {
                    return baseUrl;
                },
                getWorkspaceId: function() {
                    return ide.options.workspaceId.toString();
                },
                use: function(route, handle) {
                    var last = server.stack.pop();
                    server.use(route, handle);
                    server.stack.push(last);
                },
                canShutdown: ide.canShutdown.bind(ide),
                initUserAndProceed: initUserAndProceed,
                on: ide.on.bind(ide),
                destroy: ide.dispose.bind(ide)
            }
        });
    }
};