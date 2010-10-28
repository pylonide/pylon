/**
 * Terminal Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Fs     = require("fs"),
    Path   = require("path"),
    Async  = require("async"),
    Spawn  = require("child_process").spawn,
    Plugin = require("lib/cloud9/plugin");

function cloud9TerminalPlugin(server) {
    this.server = server;
    this.hooks  = ["command"];
}

(function() {
    this.command = function(e, message) {
        if (message.command != "terminal")
            return false;

        var _self = this,
            argv  = message.argv,
            cmd   = argv.shift();

        switch(cmd) {
            case "git":
            case "ls":
            case "pwd":
                // an allowed command!
                this.spawnCommand(0, cmd, argv, message.cwd);
                break;
            case "cd":
                var to    = argv.pop(),
                    path  = message.cwd || this.server.workspaceDir;
                if (to && to != "/") {
                    path = Path.normalize(path + "/" + to.replace(/^\//g, ""));
                    if (path.indexOf(this.server.workspaceDir) === -1) {
                        this.sendTermPacket(0, "error", "Invalid input.");
                        break;
                    }
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
                else {
                    this.sendTermPacket(0, "error", "Invalid input.");
                }
                break;
            case "check-isfile":
                var file = argv.pop();
                    path = message.cwd || this.server.workspaceDir,
                    path = Path.normalize(path + "/" + file.replace(/^\//g, ""));

                if (path.indexOf(this.workspaceDir) === -1) {
                    this.sendTermPacket();
                    break;
                }
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
            case "internal-killps":
                // @todo: check for multi-user
                if (this.activePs && this.activePs.kill) {
                    try {
                        this.activePs.kill();
                    }
                    catch (ex) {}
                }
                _self.sendTermPacket(0, "result-internal-killps", {
                    code: 0,
                    body: "OK"
                });
                break;
            case "internal-autocomplete":
                var tail    = (argv[0] || "").replace(/^[\s]+/g, "").replace(/[\s]+$/g, "").split(/[\s]+/g).pop(),
                    matches = [],
                    path    = message.cwd,
                    dirMode = false;
                if (tail.indexOf("/") > -1) {
                    path = path.replace(/[\/]+$/, "") + "/" + tail.substr(0, tail.lastIndexOf("/")).replace(/^[\/]+/, "");
                    tail = tail.substr(tail.lastIndexOf("/") + 1).replace(/^[\/]+/, "").replace(/[\/]+$/, "");
                    dirMode = true;
                }
                Async.readdir(path).stat().each(function(file, next) {
                    if (file.name.indexOf(tail) === 0 && (!dirMode || file.stat.isDirectory()))
                        matches.push(file.name + (file.stat.isDirectory() ? "/" : ""));
                    next();
                })
                .end(function() {
                    _self.sendTermPacket(0, "result-internal-autocomplete", matches);
                });
                break;
            default:
                this.sendTermPacket(0, "error", "This command is not supported.");
                break;
        }
        //console.log("command: " + cmd + ", cwd: " + message.cwd);
        return true;
    };

    this.sendTermPacket = function(sid, type, msg) {
        this.server.client.send(JSON.stringify({
            type   : "terminal",
            subtype: type || "error",
            sid    : sid  || 0,
            body   : msg  || "Access denied."
        }));
    };

    this.spawnCommand = function(sid, cmd, args, cwd) {
        var child = this.activePs = Spawn(cmd, args, {cwd: cwd || this.server.workspaceDir}),
            _self = this;
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
                    type   : "terminal",
                    subtype: "output",
                    sid    : sid || 0,
                    stream : stream,
                    body   : data.toString("utf8")
                };
                _self.server.client.send(JSON.stringify(message));
            };
        }

        child.on("exit", function(code) {
            delete _self.activePs;
            if (!_self.server.client)
               return;
            _self.server.client.send(JSON.stringify({
                type   : "terminal",
                subtype: "node-exit",
                sid    : sid || 0,
                code   : code
            }));
        });

        return child;
    };
}).call(cloud9TerminalPlugin.prototype = new Plugin());

module.exports = cloud9TerminalPlugin;
