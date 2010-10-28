/**
 * Debugger Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Path             = require("path"),
    Spawn            = require("child_process").spawn,
    NodeDebugProxy   = require("./nodedebugproxy"),
    ChromeDebugProxy = require("./chromedebugproxy"),
    Plugin           = require("lib/cloud9/plugin");

function cloud9DebuggerPlugin(server) {
    this.server = server;
    this.hooks = ["command"];
}

(function() {
    this.init = function() {
        var _self = this;
        this.server.getExt("state").on("statechange", function(state) {
            state.debugClient    = !!_self.debugClient;
            state.processRunning = !!_self.child;
        });
    };

    this.NODE_DEBUG_PORT = 5858;
    this.CHROME_DEBUG_PORT = 9222;

    this.command = function(message) {
        var _self = this;

        var cmd = (message.command || "").toLowerCase(),
            res = true;
        switch (cmd) {
            case "run":
                this.$run(message);
                break;
            case "rundebug":
                message.preArgs = ["--debug-brk=" + this.NODE_DEBUG_PORT];
                message.debug = true;
                this.$run(message);

                setTimeout(function() {
                    _self.$startDebug();
                }, 100);
                break;
            case "rundedugbrk":
                message.preArgs = ["--debug-brk=" + this.NODE_DEBUG_PORT];
                message.debug = true;
                this.$run(message);

                setTimeout(function() {
                    _self.$startDebug();
                }, 100);
                break;
            case "rundebugchrome":
                if (this.chromeDebugProxy) {
                    this.server.error("Chrome debugger already running!", 7, message);
                    break;
                }
                this.chromeDebugProxy = new ChromeDebugProxy(this.CHROME_DEBUG_PORT);
                this.chromeDebugProxy.connect();

                this.chromeDebugProxy.addEventListener("connection", function() {
                    _self.server.client && _self.server.client.send('{"type": "chrome-debug-ready"}');
                });
                break;
            case "debugnode":
                if (!this.nodeDebugProxy)
                    this.server.error("No debug session running!", 6, message);
                else
                    this.nodeDebugProxy.send(message.body);
                break;
            case "debugattachnode":
                if (this.nodeDebugProxy)
                    this.server.client.send('{"type": "node-debug-ready"}');
                break;
            case "kill":
                if (!this.child)
                    break;
                try {
                    this.child.kill();
                }
                catch(e) {}
                break;
            default:
                res = false;
                break;
        }
        return res;
    };

    this.$run = function(message) {
        var _self = this;

        if (this.child)
            return _self.server.error("Child process already running!", 1, message);

        var file = _self.server.workspaceDir + "/" + message.file;

        Path.exists(file, function(exists) {
           if (!exists)
               return _self.server.error("File does not exist: " + message.file, 2, message);

           var cwd = _self.server.workspaceDir + "/" + (message.cwd || "");
           Path.exists(cwd, function(exists) {
               if (!exists)
                   return _self.server.error("cwd does not exist: " + message.cwd, 3, message);

               var args = (message.preArgs || []).concat(file).concat(message.args || []);
               _self.$runNode(args, cwd, message.env || {}, message.debug || false);
           });
        });
    };

    this.$runNode = function(args, cwd, env, debug) {
        var _self = this;

        // mixin process env
        for (var key in process.env) {
            if (!(key in env))
                env[key] = process.env[key];
        }

        var child = _self.child = Spawn(this.server.nodeCmd, args, {cwd: cwd, env: env});
        _self.server.client.send(JSON.stringify({"type": "node-start"}));
        _self.debugClient = args.join(" ").search(/(?:^|\b)\-\-debug\b/) != -1;

        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function sender(stream) {
            return function(data) {
                if (!_self.server.client) {
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
                _self.server.client.send(JSON.stringify(message));
            };
        }

        child.on("exit", function(code) {
            if (_self.server.client)
                _self.server.client.send(JSON.stringify({"type": "node-exit"}));

            _self.debugClient = false;
            delete _self.child;
            delete _self.nodeDebugProxy;
        });

        return child;
    };

    this.$startDebug = function(message) {
        var _self = this;

        if (!this.debugClient)
            return this.server.error("No debuggable application running", 4, message);

        if (this.nodeDebugProxy)
            return this.server.error("Debug session already running", 5, message);

        this.nodeDebugProxy = new NodeDebugProxy(this.NODE_DEBUG_PORT++);
        this.nodeDebugProxy.on("message", function(body) {
            if (!_self.server.client) return;

            var msg = {
                "type": "node-debug",
                "body": body
            };
            _self.server.client.send(JSON.stringify(msg));
        });

        this.nodeDebugProxy.on("connection", function() {
            _self.server.client && _self.server.client.send('{"type": "node-debug-ready"}');
        });

        this.nodeDebugProxy.on("end", function() {
            if (_self.nodeDebugProxy == this) {
                delete _self.nodeDebugProxy;
            }
        });

        this.nodeDebugProxy.connect();
    };
}).call(cloud9DebuggerPlugin.prototype = new Plugin());

module.exports = cloud9DebuggerPlugin;
