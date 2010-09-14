var dav = require("jsdav");
var io = require("socket.io");
var async = require("async");

module.exports = IdeServer = function(projectDir, server) {

    this.projectDir = projectDir;
    this.server = server;

    dav.mount(async.abspath(projectDir), "/workspace", server);

    var _self = this;
    var options = {
        transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
    };
    this.socketIo = io.listen(server, options);
    this.socketIo.on("connection", function(client) {
        _self.onClientConnection(client);
    });

    this.client = null;
};

(function () {

    this.onClientConnection = function(client) {
        // we allow only one client at the moment
        if (this.client) return;

        console.log("Client " + client.sessionId + " connected");

        var _self = this;
        this.client = client;
        client.on("message", function(message) {
            _self.onClientMessage(message);
        });

        client.on("disconnect", function() {
            console.log("Client " + client.sessionId + " disconnected");
            delete _self.client;
        });
    };

}).call(IdeServer.prototype);

