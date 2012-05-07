"use strict";

var EventEmitter = require("events").EventEmitter;
var util = require("util");
var socketIo = require("socket.io");
var connectUtil = require("connect/lib/utils");
var error = require("http-error");

var Socket = module.exports = function(sessionStore, sessionKey, mountDir) {
    EventEmitter.call(this);

    this.mountDir = mountDir || "/socket.io";
    this.sessionKey = sessionKey;
    this.sessionStore = sessionStore;
};

util.inherits(Socket, EventEmitter);

(function() {
    
    var $stringify = function (err) {
        if (typeof err === "undefined") return err;
        
        if (typeof err === "string") return err;
        
        try {
            return JSON.stringify(err);
        }
        catch (e) {
            console.log("Stringifying ", err, "failed");
            return "Error occured";
        }
    };    

    this.listen = function(server) {
        var io = this.io = socketIo.listen(server, {
            resource: this.mountDir
        });

        io.enable("browser client minification");
        io.set("log level", 0);
        io.disable("destroy upgrade");
        io.set("transports", ["websocket", "htmlfile", "xhr-polling"]);
        io.set("authorization", this._auth.bind(this));

        io.sockets.on("connection", this._onConnection.bind(this));
    };
    
    this._auth = function(req, callback) {
        if (!req.headers.cookie)
            return callback("Session ID missing");

        var cookies = connectUtil.parseCookie(req.headers.cookie);
        var sessionId = cookies[this.sessionKey];

        if (!sessionId)
            return callback("Session ID missing");

        this._getSession(sessionId, function(err, session) {
            callback($stringify(err), !err);
        });
    };

    this._onConnection = function(client) {
        var self = this;
        client.on("message", function onMessage(message) {
            if (typeof message == "string") {
                //console.warn("got non JSON message!", message);
                try {
                    message = JSON.parse(message);
                }
                catch (ex) {
                    return console.error(ex);
                }
            }

            if (message.command !== "attach")
                return;

            client.removeListener("attach", onMessage);

            self._getSession(message.sessionId, function(err, session) {
                if (err) {
                    return client.send({
                        "type": "error",
                        "code": err.code,
                        "message": err.message
                    });
                }

                message.session = session;
                self.emit("attach", client, message);
            });
        });
    };

    this._getSession = function(sessionId, callback) {
        this.sessionStore.get(sessionId, function(err, session) {
            if (err)
                return callback($stringify(err));

            if (!session || !session.uid)
                return callback("Session ID missing");

            return callback(null, session);
        });
    };

}).call(Socket.prototype);