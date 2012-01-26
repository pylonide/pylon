/**
 * Node Runtime Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Path             = require("path"),
    Spawn            = require("child_process").spawn,
    NodeDebugProxy   = require("./nodedebugproxy"),
    ChromeDebugProxy = require("./chromedebugproxy"),
    Plugin           = require("cloud9/plugin"),
    sys              = require("sys"),
    netutil          = require("cloud9/netutil");

var NodeRuntimePlugin = module.exports = function(ide, workspace) {
    this.ide = ide;
    this.workspace = workspace;
    this.hooks = ["command"];
    this.name = "node-runtime";
};

sys.inherits(NodeRuntimePlugin, Plugin);

(function() {
    this.init = function() {
        var _self = this;
        this.workspace.getExt("state").on("statechange", function(state) {
            state.nodeDebugClient    = !!_self.debugClient;
            state.nodeProcessRunning = !!_self.child;
        });
    };

    this.NODE_DEBUG_PORT = 5858;
    this.CHROME_DEBUG_PORT = 9222;

    this.command = function(user, message, client) {
        var cmd = (message.command || "").toLowerCase();
        if (!(/node/.test(message.runner)) && !(cmd.indexOf("debug") > -1 && cmd.indexOf("node") > -1))
            return false;

        var _self = this;

        var res = true;
                
        switch (cmd) {
            case "run":
                this.$run(message);
                break;
            case "rundebug":
                netutil.findFreePort(this.NODE_DEBUG_PORT, this.NODE_DEBUG_PORT + 1000, "localhost", function(err, port) {
                    if (err)
                        return _self.$error("Could not find a free port", 9, err);

                    message.preArgs = ["--debug=" + port];
                    message.debug = true;
                    _self.$run(message);

                    _self.$startDebug(null, port);
                });
                break;
            case "rundebugbrk":
                netutil.findFreePort(this.NODE_DEBUG_PORT, this.NODE_DEBUG_PORT + 1000, "localhost", function(err, port) {
                    if (err)
                        return _self.$error("Could not find a free port", 9, err);

                    message.preArgs = ["--debug-brk=" + port];
                    message.debug = true;
                    _self.$run(message);

                    // in parallel (both operations translate to async processes):
                    // * execute a node process that executes the source file (with debug)
                    // * start a debug proxy process to handle communication with the debugger.
                    //   note: the debug proxy has a builtin retry functionality, this will
                    //         resolve incidents when the debugger is not ready yet for the
                    //         proxy
                    _self.$startDebug(null, port);
                });
                break;
            case "rundebugchrome":
                if (this.chromeDebugProxy) {
                    this.$error("Chrome debugger already running!", 7, message);
                    break;
                }
                this.chromeDebugProxy = new ChromeDebugProxy(this.CHROME_DEBUG_PORT);
                this.chromeDebugProxy.connect();

                this.chromeDebugProxy.on("connection", function() {
                    _self.ide.broadcast('{"type": "chrome-debug-ready"}', _self.name);
                });
                break;
            case "debugnode":
                if (!this.nodeDebugProxy)
                    this.$error("No debug session running!", 6, message);
                else
                    this.nodeDebugProxy.send(message.body);
                break;
            case "debugattachnode":
                if (this.nodeDebugProxy)
                    this.ide.broadcast('{"type": "node-debug-ready"}', _self.name);
                break;
            case "kill":
                this.$kill();
                break;
            default:
                res = false;
                break;
        }
        return res;
    };
    
    this.$error = function(message, code, data) {
        this.ide.broadcast(JSON.stringify({
            "type": "error",
            "message": message,
            "code": code || 0,
            "data": data || ""
        }), this.name);
    };

    this.$kill = function() {
        var child = this.child;
        if (!child)
            return;
        try {
            child.removeAllListeners("exit");
            child.kill();
            this.$procExit();
            // check after 2sec if the process is really dead
            // If not kill it harder
            setTimeout(function() {
                if (child.pid > 0)
                    child.kill("SIGKILL");
            }, 2000)
        }
        catch(e) {}
    };

    this.$run = function(message) {
        var _self = this;

        if (this.child)
            return _self.$error("Child process already running!", 1, message);

        var file = _self.ide.workspaceDir + "/" + message.file;
        
        Path.exists(file, function(exists) {
           if (!exists)
               return _self.$error("File does not exist: " + message.file, 2, message);
            
           var cwd = _self.ide.workspaceDir + "/" + (message.cwd || "");
           Path.exists(cwd, function(exists) {
               if (!exists)
                   return _self.$error("cwd does not exist: " + message.cwd, 3, message);
                // lets check what we need to run
                var args = (message.preArgs || []).concat(file).concat(message.args || []);
                _self.$runProc(_self.ide.nodeCmd, args, cwd, message.env || {}, message.debug || false);
           });
        });
    };

    this.$runProc = function(proc, args, cwd, env, debug) {
        var _self = this;

        // mixin process env
        for (var key in process.env) {
            if (!(key in env))
                env[key] = process.env[key];
        }

        console.log("Executing node " + proc + " " + args.join(" ") + " " + cwd); 

        var child = _self.child = Spawn(proc, args, {cwd: cwd, env: env});
        _self.debugClient = args.join(" ").search(/(?:^|\b)\-\-debug\b/) != -1;
        _self.workspace.getExt("state").publishState();
        _self.ide.broadcast(JSON.stringify({"type": "node-start"}), _self.name);

        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function sender(stream) {
            return function(data) {
                var message = {
                    "type": "node-data",
                    "stream": stream,
                    "data": data.toString("utf8")
                };
                _self.ide.broadcast(JSON.stringify(message), _self.name);
            };
        }

        child.on("exit", function(code) {
            _self.$procExit();
        });

        return child;
    };
    
    this.$procExit = function(noBroadcast) {
        if (!noBroadcast)
            this.ide.broadcast(JSON.stringify({"type": "node-exit"}), this.name);

        this.debugClient = false;
        delete this.child;
        delete this.nodeDebugProxy;
    };

    this.$startDebug = function(message, port) {
        var _self = this;

        /*
         this is not a good test, because:
         1. the startDebug function is only used together with execution of
            debug process
         2. the value of this.debugClient is changed upon events, thus
            making this inspection suseptible to race condition
        if (!this.debugClient)
            return this.$error("No debuggable application running", 4, message);
        */

        if (this.nodeDebugProxy)
            return this.$error("Debug session already running", 4, message);

        this.nodeDebugProxy = new NodeDebugProxy(port);
        this.nodeDebugProxy.on("message", function(body) {
            var msg = {
                "type": "node-debug",
                "body": body
            };
            _self.ide.broadcast(JSON.stringify(msg), _self.name);
        });

        this.nodeDebugProxy.on("connection", function() {
            _self.ide.broadcast('{"type": "node-debug-ready"}', _self.name);
        });

        this.nodeDebugProxy.on("end", function(err) {
            // in case an error occured, send a message back to the client
            if (err) {
                // TODO: err should be an exception instance with more fields
                // TODO: in theory a "node-start" event might be sent after this event (though
                //       extremely unlikely). Deal with all this event mess
                _self.send({"type": "node-exit-with-error", errorMessage: err}, null, _self.name);
                // the idea is that if the "node-exit-with-error" event is dispatched, 
                // then the "node-exit" event is not.
                if (_self.child)
                    _self.child.removeAllListeners("exit");
                // in this case the debugger process is still running. We need to 
                // kill that process, while not interfering with other parts of the source.
                _self.$kill();
                _self.$procExit(true);
            }
            if (_self.nodeDebugProxy === this)
                delete _self.nodeDebugProxy;
        });

        this.nodeDebugProxy.connect();
    };
    
    this.dispose = function(callback) {
        this.$kill();
        callback && callback();
    };
    
}).call(NodeRuntimePlugin.prototype);