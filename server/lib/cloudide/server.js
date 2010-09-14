var dav = require("jsdav");
var io = require("socket.io");
var async = require("async");
var Path = require("path");
var spawn = require("child_process").spawn;

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

    this.child = null;
    this.client = null;
    this.nodeCmd = process.argv[0];
};

(function () {

    this.DEBUG_PORT = 5858;

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
    };

    this.onClientMessage = function(message) {
        try {
            var message = JSON.parse(message);
        } catch (e) {
            return this.error("Error parsing message: " + e);
        }

        var command = "command" + this.$firstUp(message.command);
        if (!this[command])
            return this.error("Error: unknown command: " + message.command, message);

        this[command](message);
    };

    this.error = function(description, message) {
        console.log(description);
        var sid = (message || {}).sid || -1;
        var error = {
            "type": "error",
            "sid": sid,
            "message": description
        };
        this.client.send(JSON.stringify(error));
    };

    this.$firstUp = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    this.commandDebug = function(message) {
        message.preArgs = ["--debug=" + this.DEBUG_PORT];
        this.commandRun(message);
    };

    this.commandDebugBrk = function(message) {
        message.preArgs = ["--debug-brk=" + this.DEBUG_PORT];
        this.commandRun(message);
    };

    this.commandRun = function(message) {
        var _self = this;

        if (this.child)
            return _self.error("Child process already running!", message);

        var file = _self.projectDir + "/" + message.file;
        Path.exists(file, function(exists) {
           if (!exists)
               return _self.error("File does not exist: " + message.file, message)

           var cwd = _self.projectDir + "/" + (message.cwd || "")
           Path.exists(cwd, function(exists) {
               if (!exists)
                   return _self.error("cwd does not exist: " + message.cwd, message)

               var args = (message.preArgs || []).concat(file).concat(message.args || [])
               _self.$runNode(args, cwd);
           });
        });
    };

    this.commandKill = function(message) {
        if (this.child)
            this.child.kill();
    };

    this.$runNode = function(args, cwd) {
        var _self = this;
        var child = _self.child = spawn(this.nodeCmd, args, {cwd: cwd});
        _self.client.send(JSON.stringify({"type": "node-start"}));

        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function sender(stream) {
            return function(data) {
                if (!_self.client) {
                    return child.kill();
                }
                var message = {
                    "type": "node-data",
                    "stream": stream,
                    "data": data.toString("utf8")
                };
                _self.client.send(JSON.stringify(message));
            };
        }

        child.on("exit", function(code) {
            if (_self.client)
                _self.client.send(JSON.stringify({"type": "node-exit"}));
            delete _self.child;
        });

        return child;
    };

}).call(IdeServer.prototype);

