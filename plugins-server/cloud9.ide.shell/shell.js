/**
 * Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 */

"use strict";

var util = require("util");
var Fs = require("fs");
var Path = require("path");
var Async = require("asyncjs");

var Plugin = require("../cloud9.core/plugin");
var c9util = require("../cloud9.core/util");

var name = "shell";
var ProcessManager;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    imports.ide.register(name, ShellPlugin, register);
};

var ShellPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.pm = ProcessManager;
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
            "cd" : {
                "hint": "change working directory",
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder. Autocomplete with [TAB]"}
                }
            },
            "ls" : {
                "hint": "list directory contents",
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder. Autocomplete with [TAB]"}
                }
            },
            "rm" : {
                "hint": "remove a file",
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder. Autocomplete with [TAB]"}
                }
            },
            "mv": {
                "hint": "move or rename files or directories",
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder. Autocomplete with [TAB]"}
                }
            },
            "pwd": {"hint": "return working directory name"}
        }
    };

    this.command = function(user, message, client) {
        if (!this["command-" + message.command])
            return false;

        this["command-" + message.command.toLowerCase()](message);

        return true;
    };

    this["command-internal-autocomplete"] = function(message) {
        var argv = [].concat(message.argv);
        var cmd = argv.shift();
        var self = this;

        this.getListing(argv.pop(), message.cwd || this.workspaceDir, (cmd == "cd" || cmd == "ls"), function(tail, matches) {
            self.sendResult(0, "internal-autocomplete", {
                matches: matches,
                line   : message.line,
                base   : tail,
                cursor : message.cursor,
                textbox: message.textbox,
                argv   : message.argv
            });
        });
    };

    this["command-internal-isfile"] = function(message) {
        var file  = message.argv.pop();
        var path  = message.cwd || this.workspaceDir;
        var self = this;

        path = Path.normalize(path + "/" + file.replace(/^\//g, ""));

        if (path.indexOf(this.workspaceDir) === -1) {
            this.sendResult();
            return;
        }

        Fs.stat(path, function(err, stat) {
            if (err) {
                return self.sendResult(0, "error",
                    err.toString().replace("Error: ENOENT, ", ""));
            }
            self.sendResult(0, "internal-isfile", {
                cwd: path,
                isfile: (stat && !stat.isDirectory()),
                sender: message.sender || "shell"
            });
        });
    };

    this["command-commandhints"] = function(message) {
        var commands = {},
            _self    = this;

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
                code    : code,
                argv    : message.argv,
                err     : err,
                out     : out,
                extra   : message.extra
            });
        });
    };

    this["command-cd"] = function(message) {
        var to = message.argv.pop();
        var path = message.cwd || this.workspaceDir;
        var self = this;

        path = Path.normalize(path + "/" + to.replace(/^\//g, ""));

        if (path.indexOf(this.workspaceDir) === -1)
            return this.sendResult();

        Fs.stat(path, function(err, stat) {
            if (err) {
                return self.sendResult(0, "error",
                    err.toString().replace("Error: ENOENT, ", ""));
            }

            if (!stat.isDirectory())
                return self.sendResult(0, "error", "Not a directory.");

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
        var procExists = this.pm.kill(message.pid);

        if (!procExists) {
            this.sendResult(0, message.command, {
                argv  : message.argv,
                code  : -1,
                err   : "Process does not exist or already exiting",
                extra : message.extra
            });
        }
    };

    this.getListing = function(tail, path, dirmode, callback) {
        var matches = [];
        tail = (tail || "")
            .trim()
            .split(/\s+/g)
            .pop();

        if (tail.indexOf("/") > -1) {
            path = path.replace(/[\/]+$/, "") + "/" + tail.substr(0, tail.lastIndexOf("/")).replace(/^[\/]+/, "");
            tail = tail.substr(tail.lastIndexOf("/") + 1).replace(/^[\/]+/, "").replace(/[\/]+$/, "");
        }

        Async.readdir(path).stat().each(function(file, next) {
            if (file.name.indexOf(tail) === 0 && (!dirmode || file.stat.isDirectory()))
                matches.push(file.name + (file.stat.isDirectory() ? "/" : ""));
            next();
        })
        .end(function() {
            callback(tail, matches);
        });
    };

    this.canShutdown = function() {
        return this.processCount === 0;
    };

}).call(ShellPlugin.prototype);
