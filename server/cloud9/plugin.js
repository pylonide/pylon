/**
 * @copyright 2011, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var events = require("events");
var Spawn  = require("child_process").spawn;
var util   = require("util");

var Plugin  = function(ide, workspace) {
    this.ide = ide;
    this.workspace = workspace;
};

util.inherits(Plugin, events.EventEmitter);

(function() {
    this.getHooks = function() {
        return this.hooks || [];
    };

    this.sendResult = function(sid, type, msg) {
        var error = {
            type   : "result",
            subtype: type || "error",
            sid    : sid  || 0,
            body   : msg  || "Access denied."
        };

        // We check for the ide variable in order to know if we are in a cloud9
        // plugin or in a infra plugin. Pretty nasty, but it will hopefully go
        // away soon.
        if (this.ide)
            this.ide.broadcast(JSON.stringify(error), this.name);
        else
            this.send(error);
    };

    this.error = function(description, code, message, client) {
        return this.workspace.error(description, code, message, client);
    };

    this.send = function(msg, replyTo, scope) {
        this.workspace.send(msg, replyTo, scope);
    };

    this.spawnCommand = function(cmd, args, cwd, onerror, ondata, onexit) {
        var child = this.activePs = Spawn(cmd, args || [], {
            cwd: cwd || this.server.workspaceDir
        });

        var out   = "";
        var err   = "";
        var _self = this;

        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function sender(stream) {
            return function(data) {
                var s = data.toString("utf8");
                if (stream == "stderr") {
                    err += s;
                    onerror && onerror(s);
                } else {
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

    this.canShutdown = function() {
        return true;
    };

    this.dispose = function(callback) {
        callback();
    };

}).call(Plugin.prototype);

module.exports = Plugin;
