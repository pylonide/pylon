"use strict";

var util = require("util");

var Plugin = require("../cloud9.core/plugin");
var c9util = require("../cloud9.core/util");

var name = "hg";
var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, HgPlugin, register);
};

var HgPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.pm = ProcessManager;
    this.eventbus = EventBus;

    this.workspaceId = workspace.workspaceId;
    this.channel = this.workspaceId + "::hg";

    this.hooks      = ["command"];
    this.name       = name;
    this.banned     = ["serve"];

    this.processCount = 0;
};

util.inherits(HgPlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on(this.channel, function(msg) {
            if (msg.type == "shell-start")
                self.processCount += 1;

            if (msg.type == "shell-exit")
                self.processCount -= 1;

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function (user, message, client) {
        var self = this;
        var cmd = (message.command || "").toLowerCase();

        if (cmd != "hg")
            return false;

        if (message.argv[1] == "commit" && message.argv[2] == "-m") {
            if (message.argv[3].indexOf("\\n") > -1) {
                message.argv[3] = message.argv[3].replace(/\\n/g,"\n");
            }
        }

        if (message.argv[1] == "commit" && message.argv[2] == "-m") {
            if (message.argv[3].indexOf("\\n") > -1) {
                message.argv[3] = message.argv[3].replace(/\\n/g,"\n");
            }
        }

        this.pm.spawn("shell", {
            command: "hg",
            args: message.argv.slice(1),
            cwd: message.cwd,
            extra: message.extra,
            encoding: "ascii"
        }, this.channel, function(err, pid) {
            if (err)
                self.error(err, 1, message, client);
        });

        return true;
    };

    var hghelp = null;
    var commandsMap = {
        "default": {
            "commands": {
                "[PATH]": {"hint": "path pointing to a folder or file. Autocomplete with [TAB]"}
            }
        }
    };

    this.$commandHints = function(commands, message, callback) {
        var self = this;

        if (!hghelp) {
            hghelp = {};

            this.pm.exec("shell", {
                command: "hg",
                args: [],
                cwd: message.cwd
            }, function(code, out, err) {
                if (!out && err)
                    out = err;

                if (!out)
                    return callback();

                hghelp = {
                    "hg": {
                        "hint": "mercurial source control",
                        "commands": {}
                    }
                };

                out.replace(/([\w]+)[\s]{3,5}([\w].+)\n/gi, function(m, sub, hint) {
                    if (self.banned.indexOf(sub) > -1)
                        return;
                    hghelp.hg.commands[sub] = self.augmentCommand(sub, {"hint": hint});
                });
                onfinish();
            }, null, null);
        }
        else {
            onfinish();
        }

        function onfinish() {
            c9util.extend(commands, hghelp);
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

}).call(HgPlugin.prototype);
