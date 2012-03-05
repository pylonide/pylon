var IO = require("socket.io");
var Connect = require("connect");

var IdeServer = require("./ide");
var User = require("./user");

module.exports = function setup(options, imports, register) {
    var log = imports.log;
    var hub = imports.hub;
    var connect = imports.connect;
    var http = imports.http;

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

        var rjsPaths = imports.static.getRequireJsPaths();
        var projectDir = __dirname + "/../";

        connect.use(Connect.cookieParser());

        var sessionStore = new Connect.session.MemoryStore({ reapInterval: -1 });
        connect.use(Connect.session({
            store: sessionStore,
            key: "cloud9.sid",
            secret: "1234"
        }));

        var clientPlugins = options.clientPlugins || [];
        connect.use(ideProvider(serverPlugins, clientPlugins, rjsPaths, projectDir, http.getServer(), sessionStore));
        log.info("IDE server initialized");
    });
};

function ideProvider(plugins, clientPlugins, rjsPaths, projectDir, server, sessionStore) {
    var name = projectDir.split("/").pop();
    var serverOptions = {
        workspaceDir: projectDir,
        davPrefix: "/workspace",
        baseUrl: "",
        debug: false,
        staticUrl: "/static",
        workspaceId: name,
        name: name,
        version: "0.7.0",
        requirejsConfig: {
            baseUrl: "/static/",
            paths: rjsPaths
        },
        plugins: clientPlugins
    };

    var ide = new IdeServer(serverOptions, server, plugins);
    initSocketIo(server, sessionStore, ide);

    return function(req, res, next) {
        if (!req.session.uid)
            req.session.uid = "owner_" + req.sessionID;

        ide.addUser(req.session.uid, User.OWNER_PERMISSIONS);
        ide.handle(req, res, next);
    };
}

function initSocketIo(server, sessionStore, ide) {
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
                sessionStore.get(message.sessionId, function(err, session) {
                    if (err || !session || !session.uid)
                        return;

                    ide.addClientConnection(session.uid, client, data);
                });
            }
        });
    });
}
