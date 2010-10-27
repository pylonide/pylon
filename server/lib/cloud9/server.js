/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var jsDAV = require("jsdav");
var IO = require("socket.io");
var Async = require("async");
var Path = require("path");
var Fs = require("fs");
var Events = require("util/events");
var Spawn = require("child_process").spawn;

module.exports = IdeServer = function(workspaceDir, server, exts) {
    this.workspaceDir = Async.abspath(workspaceDir).replace(/\/+$/, "");
    this.server = server;

    this.davPrefix = "workspace/";
    jsDAV.mount(this.workspaceDir, this.davPrefix, server);

    var _self = this;
    var options = {
        transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
    };
    this.socketIo = IO.listen(server, options);
    this.socketIo.on("connection", function(client) {
        _self.onClientConnection(client);
    });

    this.child = null;
    this.client = null;
    this.nodeCmd = process.argv[0];

    this.exts = {}
    for (var ext in exts)
        this.exts[ext] = new exts[ext](this);
};

(function () {

    this.onClientConnection = function(client) {
        // we allow only one client at the moment
        if (this.client) return;

        var _self = this;
        this.client = client;
        client.on("message", function(message) {
            _self.onClientMessage(message);
        });

        client.on("disconnect", function() {
            delete _self.client;
        });

        this.dispatchEvent("clientConnect", function(stop) {
            if (stop === true)
                return;
            _self.error("Error: no clientConnect handler found!", 10);
        })
    };

    this.onClientMessage = function(message) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            return this.error("Error parsing message: " + e, 8);
        }

        var command = "command" + this.$firstUp(message.command);
        if (this[command]) {
            this[command](message);
        }
        else {
            var _self = this;
            this.dispatchEvent("unknownCommand", message, function(stop) {
                if (stop === true)
                    return;
                // Unsupported method
                _self.error("Error: unknown command: " + message.command, 9, message);
            });
        }
    };

    this.getExt = function(name) {
       return this.exts[name] || null;
    };

    this.error = function(description, code, message) {
        console.log("Socket error: " + description);
        var sid = (message || {}).sid || -1;
        var error = {
            "type": "error",
            "sid": sid,
            "code": code,
            "message": description
        };
        this.client.send(JSON.stringify(error));
    };

    this.$firstUp = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
}).call(IdeServer.prototype = new Events.EventEmitter());