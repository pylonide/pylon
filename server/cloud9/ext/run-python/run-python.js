/**
 * Python Runtime Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Path             = require("path"),
    Spawn            = require("child_process").spawn,
    Plugin           = require("cloud9/plugin"),
    sys              = require("sys"),
    netutil          = require("cloud9/netutil");

var PythonRuntimePlugin = module.exports = function(ide, workspace) {
    this.ide = ide;
    this.workspace = workspace;
    this.hooks = ["command"];
    this.name = "python-runtime";
};

sys.inherits(PythonRuntimePlugin, Plugin);

(function() {
    this.init = function() {
        var _self = this;
        this.workspace.getExt("state").on("statechange", function(state) {
            state.pythonProcessRunning = !!_self.child;
        });
    };

    this.PYTHON_DEBUG_PORT = 7984;

    this.command = function(user, message, client) {
        if (!(/py/.test(message.runner)))
        return false;

        var _self = this;

        var cmd = (message.command || "").toLowerCase(),
            res = true;
        switch (cmd) {
            case "run": case "rundebug": case "rundebugbrk": // We don't debug python just yet.
                this.$run(message, client);
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

    this.$kill = function() {
        var child = this.child;
        if (!child)
            return;
        try {
            child.kill();
            // check after 2sec if the process is really dead
            // If not kill it harder
            setTimeout(function() {
                if (child.pid > 0)
                    child.kill("SIGKILL");
            }, 2000)
        }
        catch(e) {}
    };

    this.$run = function(message, client) {
        var _self = this;

        if (this.child)
            return _self.ide.error("Child process already running!", 1, message);

        var file = _self.ide.workspaceDir + "/" + message.file;
        
        Path.exists(file, function(exists) {
           if (!exists)
               return _self.ide.error("File does not exist: " + message.file, 2, message);
            
           var cwd = _self.ide.workspaceDir + "/" + (message.cwd || "");
           Path.exists(cwd, function(exists) {
               if (!exists)
                   return _self.ide.error("cwd does not exist: " + message.cwd, 3, message);
                // lets check what we need to run
                var args = [].concat(file).concat(message.args || []);
                _self.$runProc('python', args, cwd, message.env || {}, message.debug || false);
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

        console.log("Executing python "+proc+" "+args.join(" ")+" "+cwd);

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
            _self.ide.broadcast(JSON.stringify({"type": "node-exit"}), _self.name);

            _self.debugClient = false;
            delete _self.child;
        });

        return child;
    };
    
    this.dispose = function(callback) {
        this.$kill();
        callback();
    };
    
}).call(PythonRuntimePlugin.prototype);