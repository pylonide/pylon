/**
 * Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 */

"use strict";

var util = require("util");
var Path = require("path");
var Async = require("asyncjs");

var Plugin = require("../cloud9.core/plugin");
var c9util = require("../cloud9.core/util");

var name = "shell";
var ProcessManager;
var VFS;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    VFS = imports.vfs;
    imports.ide.register(name, ShellPlugin, register);
};

var ShellPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.pm = ProcessManager;
    this.vfs = VFS;
    this.workspaceId = workspace.workspaceId;
    this.workspaceDir = ide.workspaceDir;
    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
};

util.inherits(ShellPlugin, Plugin);

(function() {

    this.metadata = {
        "commands": {
            "cd" : { "hint": "change working directory" },
            "ls" : { "hint": "list directory contents" },
            "rm" : { "hint": "remove a file" },
            "mv" : { "hint": "move or rename files or directories" },
            "pwd": {"hint": "return working directory name"}
        }
    };

    this.command = function(user, message, client) {
        var cmdName = "command-" + message.command.toLowerCase();
        if (!this[cmdName])
            return false;

        if (message.runner && message.runner !== "shell")
            return false;

        this[cmdName](message);

        return true;
    };

    this._isDir = function(stat) {
        return (
            stat.mime === "inode/directory" ||
            (stat.linkStat && stat.linkStat.mime === "inode/directory")
        );
    };

    this["command-internal-isfile"] = function(message) {
        var file = message.argv.pop();
        var path = message.cwd || this.workspaceDir;
        var self = this;

        path = Path.normalize(path + "/" + file);

        if (path.indexOf(this.workspaceDir) === -1) {
            this.sendResult();
            return;
        }

        this.vfs.stat(path, {}, function(err, stat) {
            if (err || stat.err) {
                return self.sendResult(0, "error", {
                    errmsg: "Problem opening file; it does not exist or something else failed. More info: " +
                        err.toString().replace("Error: ENOENT, ", ""),
                    extra: message.extra
                });
            }
            self.sendResult(0, "internal-isfile", {
                cwd: path,
                isfile: (stat && !self._isDir(stat)),
                sender: message.sender || "shell",
                extra: message.extra
            });
        });
    };

    this["command-commandhints"] = function(message) {
        var commands = {};
        var _self = this;

        Async.list(Object.keys(this.workspace.plugins))
             .each(function(sName, next) {
                 var oExt = _self.workspace.getExt(sName);
                 if (oExt.$commandHints) {
                     oExt.$commandHints(commands, message, next);
                 }
                 else {
                     if (oExt.metadata && oExt.metadata.commands)
                         c9util.extend(commands, oExt.metadata.commands);
                     next();
                 }
             })
             .end(function() {
                 _self.sendResult(0, message.command, commands);
             });
    };

    this["command-mv"] =
    this["command-mkdir"] =
    this["command-rm"] =
    this["command-pwd"] =
    this["command-ls"] = function(message) {
        var self = this;
        this.processCount += 1;
        this.pm.exec("shell", {
            command: message.command,
            args: message.argv.slice(1),
            cwd: message.cwd || this.workspaceDir,
            extra: message.extra
        }, function(code, out, err) {
            self.processCount -= 1;

            self.sendResult(0, message.command, {
                code : code,
                argv : message.argv,
                err  : err,
                out  : out,
                extra: message.extra
            });
        });
    };

    this["command-cd"] = function(message) {
        var to = message.argv.pop();
        var path = message.cwd || this.workspaceDir;
        var self = this;

        path = Path.normalize(path + "/" + to);

        if (path.indexOf(this.workspaceDir) === -1)
            return this.sendResult();

        this.vfs.stat(path, {}, function(err, stat) {
            if (err || stat.err) {
                return self.sendResult(0, "error", {
                    errmsg: "Problem changing directory; it does not exist or something else failed. More info: " +
                        err.toString().replace("Error: ENOENT, ", ""),
                    extra: message.extra
                });
            }

            if (!self._isDir(stat)) {
                return self.sendResult(0, "error", {
                    errmsg: "Not a directory.",
                    extra: message.extra
                });
            }

            self.sendResult(0, message.command, {
                cwd: path,
                extra: message.extra
            });
        });
    };

    this["command-ps"] = function(message) {
        var self = this;
        this.pm.ps(function(err, procs) {
            self.sendResult(0, message.command, {
                argv    : message.argv,
                err     : null,
                out     : procs,
                extra   : message.extra
            });
        });
    };

    this["command-kill"] = function(message) {
        var self = this;
        this.pm.kill(message.pid, function(err) {
            if (!err) return;

            self.sendResult(0, message.command, {
                argv  : message.argv,
                code  : -1,
                err   : err || "There was a problem exiting the process",
                extra : message.extra,
                pid   : message.pid
            });
        });
    };

    this.canShutdown = function() {
        return this.processCount === 0;
    };

}).call(ShellPlugin.prototype);
