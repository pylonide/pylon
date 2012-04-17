"use strict";

var Socket = require("./socket");

module.exports = function setup(options, imports, register) {
    var ide = imports.ide.getServer();
    var session = imports.session;
    var permissions = imports["workspace-permissions"];

    var socket = new Socket(session, session.getKey(), imports.ide.getSocketUrl());
    socket.listen(imports.http.getServer());
    socket.on("attach", function(client, message) {
        var uid = message.session.uid;
        permissions.getPermissions(uid, function(err, userPermissions) {
            if (err) {
                return client.send(JSON.stringify({
                    "type": "error",
                    "code": err.code || 500,
                    "message": err.message || err
                }));
            }

            ide.addUser(uid, userPermissions);
            ide.addClientConnection(uid, client, message);
        });
    });

    register(null, {
        "workspace-socket": {}
    });
};