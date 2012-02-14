/**
 * Shell Module for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var sys = require("sys");
var Plugin = require("cloud9/plugin");
var Fs = require("fs");
var Path = require("path");
var Async = require("asyncjs");
var util = require("cloud9/util");

var ShellPlugin = module.exports = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.workspaceDir = workspace.workspaceDir;
    this.hooks = ["command"];
    this.name = "shell";
};

sys.inherits(ShellPlugin, Plugin);

(function() {
    "use strict";

    this.command = function(user, message, client) {
        if (!this[message.command]) {
            return false;
        }

        this[message.command](message);
        return true;
    };

    this["internal-autocomplete"] = function(message) {
        var argv = [].concat(message.argv);
        var cmd = argv.shift();
        var _self = this;
        var isDirCmd = cmd === "cd" || cmd === "ls";

        this.getListing(argv.pop(), message.cwd, isDirCmd, function(tail, matches) {
            _self.sendResult(0, "internal-autocomplete", {
                matches: matches,
                line   : message.line,
                base   : tail,
                cursor : message.cursor,
                textbox: message.textbox,
                argv   : message.argv
            });
        });
    };

    this["internal-isfile"] = function(message) {
        var file  = message.argv.pop();
        var path  = message.cwd || this.workspaceDir;
        var _self = this;

        path = Path.normalize(Path.join(path, file.replace(/^\//g, "")));

        if (path.indexOf(this.workspaceDir) === -1) {
            this.sendResult();
            return;
        }

        Fs.stat(path, function(err, stat) {
            if (err) {
                return _self.sendResult(0, "error",
                    err.toString().replace("Error: ENOENT, ", ""));
            }

            _self.sendResult(0, "internal-isfile", {
                cwd: path,
                isfile: (stat && !stat.isDirectory()),
                sender: message.sender || "shell"
            });
        });
    };

    this.commandhints = function(message) {
        var commands = {};
        var _self = this;

        Async.list(Object.keys(this.workspace.plugins))
             .each(function(sName, next) {
                 var oExt = _self.workspace.getExt(sName);
                 if (oExt["$commandHints"]) {
                     oExt["$commandHints"](commands, message, next);
                 }
                 else {
                     (function(afterMeta) {
                         if (!oExt.metadata) {
                             Fs.readFile(Path.normalize(__dirname + "/../" + sName + "/package.json"), function(err, data) {
                                 if (err) {
                                     return next();
                                 }
                                 var o = JSON.parse(data);
                                 oExt.metadata = o;
                                 afterMeta();
                             });
                         }
                         else {
                             afterMeta();
                         }
                     })(function() {
                         if (oExt.metadata && oExt.metadata.commands)
                             util.extend(commands, oExt.metadata.commands);
                         next();
                     });
                 }
             })
             .end(function() {
                 _self.sendResult(0, message.command, commands);
             });
    };

    this.pwd   =
    this.mkdir =
    this.rm    =
    this.ls    = function(message) {
        var _self = this;
        this.spawnCommand(message.command, message.argv.slice(1), message.cwd, null, null, function(code, err, out) {
            _self.sendResult(0, message.command, {
                code: code,
                argv: message.argv,
                err: err,
                out: out
            });
        });
    };

    this.cd = function(message) {
        var to    = message.argv.pop();
        var path  = message.cwd || this.workspaceDir;
        var _self = this;

        path = Path.normalize(Path.join(path, to.replace(/^\//g, "")));
        if (path.indexOf(this.workspaceDir) === -1) {
            return this.sendResult();
        }

        Fs.stat(path, function(err, stat) {
            if (err) {
                return _self.sendResult(0, "error",
                    err.toString().replace("Error: ENOENT, ", ""));
            }

            if (!stat.isDirectory()) {
                return _self.sendResult(0, "error", "Not a directory.");
            }
            _self.sendResult(0, message.command, { cwd: path });
        });
    };

    this.bash = function(message) {
        var _self = this;
        message.argv.unshift("-c");
        this.spawnCommand("sh", message.argv, message.cwd, null, null, function(code, err, out) {
            _self.sendResult(0, message.command, {
                code: code,
                argv: message.argv,
                err: err,
                out: out
            });
        });
    };

    this.getListing = function(tail, path, dirmode, callback) {
        tail = tail || "";
        // Trim spaces on both sides of the tail, then split by spaces and take
        // the last 'word'.
        tail = tail.trim().split(/\s+/g).pop();
        if (tail.indexOf("/") > -1) {
            // Replace slashes at the beginning of tail
            path = path.replace(/\/+$/, "");
            path = Path.join(path, tail);
            tail = Path.basename(tail);
        }

        var matches = [];
        Async.readdir(path)
            .stat().each(
                function(file, next) {
                    var startsWithTail = file.name.indexOf(tail) === 0;
                    var isDir = file.stat.isDirectory();

                    if (startsWithTail && (!dirmode || isDir)) {
                        matches.push(file.name + (isDir ? "/" : ""));
                    }
                    next();
                }
            )
            .end(function() { callback(tail, matches); });
    };

    this.dispose = function(callback) {
        // TODO kill all running processes! <-- WAT
        callback();
    };
}).call(ShellPlugin.prototype);
