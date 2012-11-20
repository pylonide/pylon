"use strict";

var Worker = require('vfs-socket/worker').Worker;
var ERROR = require("http-error");
var dirname = require('path').dirname;



module.exports = function setup(options, imports, register) {

    var IDE = imports.ide.getServer();
    var SESSION = imports.session;
    var PERMISSIONS = imports["workspace-permissions"];
    var TRANSPORT = imports["smith.transport.server"];

    imports.static.addStatics([{
        path: dirname(require.resolve("vfs-socket/consumer")),
        mount: "/vfs-socket",
        rjs: [
            {
                "name": "vfs-socket",
                "location": "vfs-socket",
                "main": "consumer.js"
            }
        ]
    }]);

    TRANSPORT.on("connect", function(connection) {

//        var send = connection.transport.send;
//        connection.transport.send = function (message) {
//            if (Array.isArray(message)) {
//                console.log("-> " + require('util').inspect(message, false, 2, true));
//            }
//            return send.call(this, message);
//        };
//        connection.transport.on("message", function (message) {
//            console.log("<- " + require('util').inspect(message, false, 2, true));
//        });

        var worker = new Worker(imports.vfs);
        worker.connect(connection.transport);
        worker.on("error", function (err) {
            console.error(err.stack);
        });

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
        // TODO: find out if this empty service is needed for anything.
        //   and if not remove it.
        "workspace-socket": {}
    });
};
