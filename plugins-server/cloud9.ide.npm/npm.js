"use strict";

var util = require("util");

var Plugin = require("../cloud9.core/plugin");
var c9util = require("../cloud9.core/util");

var name = "npm";
var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, NpmPlugin, register);
};

var NpmPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.pm = ProcessManager;
    this.eventbus = EventBus;
    this.workspaceId = workspace.workspaceId;
    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
};

util.inherits(NpmPlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on(this.workspaceId + "::npm", function(msg) {
            if (msg.type == "npm-start")
                self.processCount += 1;

            if (msg.type == "npm-exit")
                self.processCount -= 1;

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function (user, message, client) {
        var cmd = (message.command || "").toLowerCase();

        if (cmd !== "npm")
            return false;

        var self = this;
        this.pm.spawn("npm", {
            args: message.argv.slice(1),
            cwd: message.cwd,
            nodeVersion: message.version,
            extra: message.extra,
            encoding: "ascii"
        }, this.workspaceId + "::npm", function(err, pid) {
            if (err)
                self.error(err, 1, message, client);
        });

        return true;
    };

    var npmhelp = null;
    var commandsMap = {
        "default": {
            "commands": {
                "[PATH]": {"hint": "path pointing to a folder or file. Autocomplete with [TAB]"}
            }
        }
    };

    this.$commandHints = function(commands, message, callback) {
        var self = this;

        if (!npmhelp) {
            this.pm.exec("npm", {
                args: [],
                cwd: message.cwd
            }, function(code, err, out) {
                if (!out && err)
                    out = err;

                if (!out)
                    return callback();

                npmhelp = {"npm": {
                    "hint": "node package manager",
                    "commands": {}
                }};

                /*
                where <command> is one of:
                */
                out.replace(/[\n\s]*([\w]*)\,/g, function(m, sub) {
                    npmhelp.npm.commands[sub] = self.augmentCommand(sub, {"hint": "npm '" + sub + "'"});
                });
                onfinish();
            }, null, null);
        }
        else {
            onfinish();
        }

        function onfinish() {
            c9util.extend(commands, npmhelp);
            callback();
        }
    };

    this.augmentCommand = function(cmd, struct) {
        var map = commandsMap[cmd] || commandsMap["default"];
        return c9util.extend(struct, map || {});
    };

    this.canShutdown = function() {
        return this.processCount === 0;
    };

}).call(NpmPlugin.prototype);