"use strict";

var ERROR = require("http-error");

module.exports = function setup(options, imports, register) {

    var IDE = imports.ide.getServer();
    var SESSION = imports.session;
    var PERMISSIONS = imports["workspace-permissions"];
    var TRANSPORT = imports["smith.transport.server"];


    TRANSPORT.on("connect", function(connection) {

        connection.on("message", function(message) {

            if (message.command === "attach" && typeof message.workspaceId !== "undefined") {

                getSession(message.sessionId, function(err, session) {
                    if (err) {
                        return connection.send({
                            "type": "error",
                            "code": err.code,
                            "message": err.message
                        });
                    }

                    message.session = session;
                    var uid = session.uid || session.anonid;
                    PERMISSIONS.getPermissions(uid, message.workspaceId, "cloud9.socket", function(err, userPermissions) {
                        if (err) {
                            connection.send(err.toJSON ? err.toJSON() : {
                                "type": "error",
                                "code": err.code || 500,
                                "message": err.message || err
                            });
                        }

                        IDE.addUser(uid, userPermissions);
                        IDE.addClientConnection(uid, connection, message);
                    });
                });            
            }
        });
    });


    function getSession(sessionId, callback) {
        SESSION.get(sessionId, function(err, session) {
            if (err)
                return callback(new ERROR.InternalServerError(err));

            if (!session || !(session.uid || session.anonid))
                return callback(new ERROR.Unauthorized("Session ID missing"));

            return callback(null, session);
        });
    };


    register(null, {
        "workspace-socket": {}
    });
};
