/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require("../../support/paths");

var Connect = require("connect");
var MemoryStore = require("connect/middleware/session/memory");
var IO = require("socket.io");
var Fs = require("fs");
var Path = require("path");
var IdeServer = require("./ide");
var User = require("./user");
var middleware = require("./middleware");

exports.main = function(options) {
    var projectDir = options.workspace,
        port = options.port,
        ip = options.ip,
        user = options.user,
        group = options.group;

    if (!Path.existsSync(projectDir))
        throw new Error("Workspace directory does not exist: " + projectDir);

    var ideProvider = function(projectDir, server, sessionStore) {
        // load plugins:
        var exts = {};
        Fs.readdirSync(Path.normalize(__dirname + "/ext")).forEach(function(name){
            if (name[0] !== ".")
                exts[name] = require("./ext/" + name + "/" + name);
        });

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


        var name = projectDir.split("/").pop();
        var serverOptions = {
            workspaceDir: projectDir,
            davPrefix: "/workspace",
            baseUrl: "",
            debug: options.debug,
            staticUrl: "/static",
            workspaceId: name,
            name: name,
            version: options.version
        };
        var ide = new IdeServer(serverOptions, server, exts);

        return function(req, res, next) {
            if (!req.session.uid)
                req.session.uid = "owner_" + req.sessionID;

            ide.addUser(req.session.uid, User.OWNER_PERMISSIONS);
            ide.handle(req, res, next);
        };
    };

    var server = Connect.createServer();

    server.use(Connect.cookieDecoder());

    var sessionStore = new MemoryStore({ reapInterval: -1 });
    server.use(Connect.session({
        store: sessionStore,
        key: "cloud9.sid"
    }));

    server.use(ideProvider(projectDir, server, sessionStore));
    server.use(middleware.staticProvider(Path.normalize(__dirname + "/../../support"), "/static/support"));
    server.use(middleware.staticProvider(Path.normalize(__dirname + "/../../client"), "/static"));

    //obfuscate process rights if configured
    if (group)
        process.setgid(group);
    if (user)
        process.setuid(user);

    server.listen(port, ip);
};

process.on("uncaughtException", function(e) {
    console.log("uncaught exception:");
    console.log(e.stack + "");
});

if (module === require.main) {
    exports.main({workspace: ".", port: 3000, ip: '127.0.0.1'});
}
