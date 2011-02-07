/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Spawn = require("child_process").spawn;
var sys = require("sys");

function cloud9Plugin() {}

sys.inherits(cloud9Plugin, process.EventEmitter);

(function() {
    this.getHooks = function() {
        return this.hooks || [];
    };

    this.extend = function(dest, src) {
        for (var prop in src) {
            dest[prop] = src[prop];
        }
        return dest;
    };

    this.sendResult = function(sid, type, msg) {
        //console.log("sending result to client: ", type, JSON.stringify(msg));
        this.ide.broadcast(JSON.stringify({
            type   : "result",
            subtype: type || "error",
            sid    : sid  || 0,
            body   : msg  || "Access denied."
        }), this.name);
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
    
}).call(cloud9Plugin.prototype);

module.exports = cloud9Plugin;
