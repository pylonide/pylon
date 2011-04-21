/**
 * @copyright 2011, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var events = require("events");
var Spawn  = require("child_process").spawn;
var sys    = require("sys");

var Plugin  = function(ide, workspace) {
    this.ide = ide;
    this.workspace = workspace;
};

sys.inherits(Plugin, events.EventEmitter);

(function() {
    this.getHooks = function() {
        return this.hooks || [];
    };

    this.sendResult = function(sid, type, msg) {
        this.ide.broadcast(JSON.stringify({
            type   : "result",
            subtype: type || "error",
            sid    : sid  || 0,
            body   : msg  || "Access denied."
        }), this.name);
    };

    this.error = function(description, code, message, client) {
        return this.workspace.error(description, code, message, client);
    };

    this.send = function(msg, replyTo, scope) {
        this.workspace.send(msg, replyTo, scope);
    };
    
    this.spawnCommand = function(cmd, args, cwd, onerror, ondata, onexit) {
        var child = this.activePs = Spawn(cmd, args || [], {cwd: cwd || this.server.workspaceDir}),
            out   = "",
            err   = "",
            _self = this;
        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function sender(stream) {
            return function(data) {
                var s = data.toString("utf8");
                if (stream == "stderr") {
                    err += s;
                    onerror && onerror(s);
                }
                else {
                    out += s;
                    ondata && ondata(s);
                }
            };
        }

        child.on("exit", function(code) {
            delete _self.activePs;
            onexit && onexit(code, err, out);
        });

        return child;
    };

    this.dispose = function(callback) {
        callback();
    };

}).call(Plugin.prototype);

module.exports = Plugin;
