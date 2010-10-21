/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var dav = require("jsdav");
var io = require("socket.io");
var async = require("async");
var Path = require("path");
var Fs = require("fs");
var Spawn = require("child_process").spawn;
var NodeDebugProxy = require("cloud9/nodedebugproxy");
var ChromeDebugProxy = require("cloud9/chromedebugproxy");

module.exports = IdeServer = function(workspaceDir, server) {

    this.workspaceDir = async.abspath(workspaceDir).replace(/\/+$/, "");
    this.server = server;

    this.davPrefix = "workspace/";
    dav.mount(this.workspaceDir, this.davPrefix, server);

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

    this.NODE_DEBUG_PORT = 5858;
    this.CHROME_DEBUG_PORT = 9222;

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

        this.commandState({});
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
        console.log("Socket error: " + description);
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

    this.commandState = function(message) {
        var state = {
            "type": "state",
            "workspaceDir": this.workspaceDir,
            "processRunning": !!this.child,
            "debugClient": !!this.debugClient,
            "davPrefix": this.davPrefix
        };
        this.client.send(JSON.stringify(state));
    };

    this.commandRunDebug = function(message) {
        message.preArgs = ["--debug-brk=" + this.NODE_DEBUG_PORT];
        message.debug = true;
        this.commandRun(message);

        var _self = this;
        setTimeout(function() {
            _self.$startDebug();
        }, 100);
    };

    this.commandRunDebugBrk = function(message) {
        message.preArgs = ["--debug-brk=" + this.NODE_DEBUG_PORT];
        message.debug = true;
        this.commandRun(message);

        var _self = this;
        setTimeout(function() {
            _self.$startDebug();
        }, 100);
    };

    this.commandRun = function(message) {
        var _self = this;

        if (this.child)
            return _self.error("Child process already running!", message);

        var file = _self.workspaceDir + "/" + message.file;

        Path.exists(file, function(exists) {
           if (!exists)
               return _self.error("File does not exist: " + message.file, message);

           var cwd = _self.workspaceDir + "/" + (message.cwd || "");
           Path.exists(cwd, function(exists) {
               if (!exists)
                   return _self.error("cwd does not exist: " + message.cwd, message);

               var args = (message.preArgs || []).concat(file).concat(message.args || []);
               _self.$runNode(args, cwd, message.env || {}, message.debug || false);
           });
        });
    };

    this.commandKill = function(message) {
        if (this.child) {
            try {
                this.child.kill();
            } catch(e) {}
        }
    };

    this.commandTerminal = function(message) {
        var argv = message.argv,
            cmd  = argv.shift();

        switch(cmd) {
            case "git":
            case "ls":
            case "pwd":
                // an allowed command!
                this.spawnCommand(0, cmd, argv, message.cmd);
                break;
            case "cd":
                var to    = argv.pop(),
                    path  = message.cwd || this.workspaceDir,
                    _self = this;
                if (to != "/") {
                    path = Path.normalize(path + "/" + to.replace(/^\//g, ""));
                    if (path.indexOf(this.workspaceDir) === -1)
                        return this.sendTermPacket();
                    Fs.stat(path, function(err, stat) {
                        if (err) {
                            return _self.sendTermPacket(0, "error", 
                                err.toString().replace("Error: ENOENT, ", ""));
                        }
                        if (!stat.isDirectory())
                            return _self.sendTermPacket(0, "error", "Not a directory.");
                        _self.sendTermPacket(0, "result-cd", {cwd: path});
                    });
                }
                break;
            case "check-isfile":
                var file = argv.pop();
                    path  = message.cwd || this.workspaceDir,
                    _self = this;
                    path  = Path.normalize(path + "/" + file.replace(/^\//g, ""));

                if (path.indexOf(this.workspaceDir) === -1)
                    return this.sendTermPacket();
                Fs.stat(path, function(err, stat) {
                    if (err) {
                        return _self.sendTermPacket(0, "error",
                            err.toString().replace("Error: ENOENT, ", ""));
                    }
                    _self.sendTermPacket(0, "result-check-isfile", {
                        cwd: path,
                        isfile: (stat && !stat.isDirectory())
                    });
                });
                break;
            default:
                this.sendTermPacket(0, "error", "This command is not supported.");
                break;
        }
        console.log("command: " + cmd + ", cwd: " + message.cwd);
    };

    this.sendTermPacket = function(sid, type, msg) {
        this.client.send(JSON.stringify({
            type   : "terminal",
            subtype: type || "error",
            sid    : sid  || 0,
            body   : msg  || "Access denied."
        }));
    };

    this.spawnCommand = function(sid, cmd, args, cwd) {
        var child = Spawn(cmd, args, {cwd: cwd || this.workspaceDir}),
            _self = this;
        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function sender(stream) {
            return function(data) {
                if (!_self.client) {
                    try {
                        child.kill();
                    } catch(e) {}
                    return;
                }
                console.log("data coming in: " + data.toString("utf8"));
                var message = {
                    type   : "terminal",
                    subtype: "output",
                    sid    : sid || 0,
                    stream : stream,
                    body   : data.toString("utf8")
                };
                _self.client.send(JSON.stringify(message));
            };
        }

        child.on("exit", function(code) {
            if (!_self.client)
               return;
            _self.client.send(JSON.stringify({
                type   : "terminal",
                subtype: "node-exit",
                sid    : sid || 0,
                code   : code
            }));
        });

        return child;
    };

    this.$runNode = function(args, cwd, env, debug) {
        var _self = this;
        
        // mixin process env
        for (var key in process.env) {
            if (!(key in env))
                env[key] = process.env[key];
        }

        var child = _self.child = Spawn(this.nodeCmd, args, {cwd: cwd, env: env});
        _self.client.send(JSON.stringify({"type": "node-start"}));
        _self.debugClient = args.join(" ").search(/(?:^|\b)\-\-debug\b/) != -1;

        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function sender(stream) {
            return function(data) {
                if (!_self.client) {
                    try {
                        child.kill();
                    } catch(e) {}
                    return;
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

            _self.debugClient = false;
            delete _self.child;
            delete _self.nodeDebugProxy;
        });

        return child;
    };

    this.$startDebug = function(message) {
        var _self = this;

        if (!this.debugClient)
            return this.error("No debuggable application running", message);

        if (this.nodeDebugProxy)
            return this.error("Debug session already running", message);

        this.nodeDebugProxy = new NodeDebugProxy(this.NODE_DEBUG_PORT++);
        this.nodeDebugProxy.on("message", function(body) {
            if (!_self.client) return;

            var msg = {
                "type": "node-debug",
                "body": body
            };
            _self.client.send(JSON.stringify(msg));
        });

        this.nodeDebugProxy.on("connection", function() {
            _self.client && _self.client.send('{"type": "node-debug-ready"}');
        });

        this.nodeDebugProxy.on("end", function() {
            if (_self.nodeDebugProxy == this) {
                delete _self.nodeDebugProxy;
            }
        });

        this.nodeDebugProxy.connect();
    };

    this.commandDebugNode = function(message) {
        if (!this.nodeDebugProxy)
            return this.error("No debug session running!", message);

        this.nodeDebugProxy.send(message.body);
    };

    this.commandDebugAttachNode = function(message) {
        if (this.nodeDebugProxy)
            this.client.send('{"type": "node-debug-ready"}');
    };

    this.commandRunDebugChrome = function(message) {
        if (this.chromeDebugProxy)
            return this.error("Chrome debugger already running!", message);

        this.chromeDebugProxy = new ChromeDebugProxy(this.CHROME_DEBUG_PORT);
        this.chromeDebugProxy.connect();

        var _self = this;
        this.chromeDebugProxy.addEventListener("connection", function() {
            _self.client && _self.client.send('{"type": "chrome-debug-ready"}');
        });
    };
}).call(IdeServer.prototype);