/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require("../../support/paths");

var Connect = require("connect");
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

    var ideProvider = function(projectDir, server) {
        var uid = "owner" + Math.random().toString().slice(2);
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
            ide.addUser(uid, User.OWNER_PERMISSIONS);
            ide.addClientConnection(uid, client, null);
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
            req.session.uid = uid;
            ide.addUser(uid, User.OWNER_PERMISSIONS);
            ide.handle(req, res, next);
        };
    };

    var server = Connect.createServer();
    //server.use(Connect.logger());
    server.use(Connect.conditionalGet());
    server.use(Connect.cookieDecoder());
    server.use(Connect.session({
        key: "cloud9.sid"
    }));
    server.use(ideProvider(projectDir, server));
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
