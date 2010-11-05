/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var jsDAV = require("jsdav"),
    IO    = require("socket.io"),
    Async = require("async");

module.exports = IdeServer = function(workspaceDir, server, exts) {
    this.workspaceDir = Async.abspath(workspaceDir).replace(/\/+$/, "");
    this.server = server;

    this.davPrefix = "workspace/";
    jsDAV.mount(this.workspaceDir, this.davPrefix, server);

    var _self = this;
    var options = {
        transports:  ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
    };
    this.socketIo = IO.listen(server, options);
    this.socketIo.on("connection", function(client) {
        _self.onClientConnection(client);
    });

    this.client  = null;
    this.nodeCmd = process.argv[0];

    this.registerExts(exts);
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

        this.execHook("connect", {});
    };

    this.onClientMessage = function(message) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            return this.error("Error parsing message: " + e, 8);
        }

        this.execHook("command", message);
    };

    this.registerExts = function(exts) {
        this.exts = {}
        for (var ext in exts)
            this.exts[ext] = new exts[ext](this);
        for (ext in this.exts) {
            if (this.exts[ext].init)
                this.exts[ext].init();
        }
    }

    this.getExt = function(name) {
       return this.exts[name] || null;
    };

    this.execHook = function() {
        var ext, hooks,
            args = Array.prototype.slice.call(arguments),
            hook = args.shift().toLowerCase().replace(/^[\s]+/, "").replace(/[\s]+$/, "");
        for (var name in this.exts) {
            ext   = this.exts[name];
            hooks = ext.getHooks();
            if (hooks.indexOf(hook) > -1 && ext[hook].apply(ext, args) === true)
                return;
        }
        // if we get here, no hook function was successfully delegated to an
        // extension.
        //this.error("Error: no handler found for hook '" + hook + "'. Arguments: "
        //    + JSON.stringify(args), 9, args[0]);
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
}).call(IdeServer.prototype);