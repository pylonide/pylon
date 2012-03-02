var path = require("path");
var IO = require("socket.io");
var Connect = require("connect");

var IdeServer = require("./ide");
var User = require("./user");
var middleware = require("./middleware");

module.exports = function setup(options, imports, register) {
    var log = imports.log;
    var hub = imports.hub;
    var connect = imports.connect;
    var http = imports.http;

    var plugins = {};

    register(null, {
        ide: {
            register: function(name, plugin, callback) {
                plugins[name] = plugin;
                callback();
            }
        }
    });

    hub.on("containersDone", function() {

        var projectDir = __dirname + "/../";

        connect.addMiddleware(Connect.cookieParser());

        var sessionStore = new Connect.session.MemoryStore({ reapInterval: -1 });
        connect.addMiddleware(Connect.session({
            store: sessionStore,
            key: "cloud9.sid",
            secret: "1234"
        }));

        //connect.addMiddleware(middleware.staticProvider(path.normalize(__dirname + "/../../support"), "/static/support"));
        connect.addMiddleware(middleware.staticProvider(path.normalize(__dirname + "/www"), "/static"));

        var aceBase = require.resolve("ace/package.json").slice(0, -13);
        connect.addMiddleware(middleware.staticProvider(aceBase + "/lib", "/static/ace/lib"));
        connect.addMiddleware(middleware.staticProvider(aceBase + "/build/src", "/static/ace/build"));

        var v8debugBase = require.resolve("v8debug/package.json").slice(0, -13);
        connect.addMiddleware(middleware.staticProvider(v8debugBase + "/lib", "/static/v8debug/lib"));

        var treehuggerBase = require.resolve("treehugger/package.json").slice(0, -13);
        connect.addMiddleware(middleware.staticProvider(treehuggerBase + "/lib", "/static/treehugger/lib"));

        connect.addMiddleware(ideProvider(projectDir, http.getServer(), sessionStore));
        log.info("IDE server initialized");
    });
};

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

function ideProvider(projectDir, server, sessionStore) {
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
            paths: {
                "ace": "/static/ace/lib/ace",
                "debug": "/static/v8debug/lib/v8debug",
                "treehugger": "/static/treehugger/lib/treehugger"
            }
        }
    };

    var ide = new IdeServer(serverOptions, server, []);
    initSocketIo(server, sessionStore, ide);

    return function(req, res, next) {
        if (!req.session.uid)
            req.session.uid = "owner_" + req.sessionID;

        ide.addUser(req.session.uid, User.OWNER_PERMISSIONS);
        ide.handle(req, res, next);
    };
}

