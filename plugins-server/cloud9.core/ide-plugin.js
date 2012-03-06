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
    var http = imports.http;
    var session = imports.session;

    var serverPlugins = {};

    register(null, {
        ide: {
            register: function(name, plugin, callback) {
                log.info("IDE SERVER PLUGIN: ", name);
                serverPlugins[name] = plugin;
                callback();
            }
        }
    });

    hub.on("containersDone", function() {

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

        var server = http.getServer();
        var ide = new IdeServer(serverOptions, serverPlugins);
        initSocketIo(server, session, ide);

        connect.use(function(req, res, next) {
            if (!req.session.uid)
                req.session.uid = "owner_" + req.sessionID;

            ide.addUser(req.session.uid, User.OWNER_PERMISSIONS);
            ide.handle(req, res, next);
        });

        log.info("IDE server initialized");
    });
};

function initSocketIo(server, session, ide) {
    var socketIo = IO.listen(server);
    socketIo.enable("browser client minification");
    socketIo.set("log level", 1);
    socketIo.set("close timeout", 7);
    socketIo.set("heartbeat timeout", 2.5);
    socketIo.set("heartbeat interval", 5);
    socketIo.set("polling duration", 5);
    socketIo.sockets.on("connection", function(client) {
        client.on("message", function(data) {
            var message = data;
            if (typeof data == "string") {
                try {
                    message = JSON.parse(data);
                } catch(e) {
                    return;
                }
            }
            if (message.command === "attach") {
                session.get(message.sessionId, function(err, session) {
                    if (err || !session || !session.uid)
                        return;

                    ide.addClientConnection(session.uid, client, data);
                });
            }
        });
    });
}
