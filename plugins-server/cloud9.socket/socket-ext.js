var IO = require("socket.io");

module.exports = function setup(options, imports, register) {

    var ide = imports.ide.getServer();
    var sessionStore = imports["session-store"];

    var socketIo = IO.listen(imports.http.getServer());
    socketIo.enable("browser client minification");
    socketIo.set("log level", 1);
    socketIo.set("close timeout", 7);
    socketIo.set("heartbeat timeout", 2.5);
    socketIo.set("heartbeat interval", 5);
    socketIo.set("polling duration", 5);

    socketIo.sockets.on("connection", function(client) {
        client.on("message", function listener(data) {
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

                    // If we don't have a user instance for our session.uid in the ide
                    // we need to create one. This happens when the server runtime restarts
                    // and the browser tries to reconnect with previous session.
                    if (!ide.getUser({
                        session: session
                    })) {
                        imports.ide.initUserAndProceed(session.uid, function(err) {
                            if (err) {
                                next(err);
                                return;
                            }
                            ide.addClientConnection(session.uid, client, data);
                        });
                    }
                    else {
                        ide.addClientConnection(session.uid, client, data);
                    }
                });
            }
        });
    });

    register(null, {
        "workspace-socket": {}
    });
};