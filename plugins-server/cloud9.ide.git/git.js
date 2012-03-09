"use strict";

var util = require("util");

var Plugin = require("../cloud9.core/plugin");
var c9util = require("../cloud9.core/util");

var name = "git";
var ProcessManager;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    imports.ide.register(name, GitPlugin, register);
};

var GitPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.pm = ProcessManager;
    this.workspaceId = workspace.workspaceId;
    this.channel = this.workspaceId + "::git";

    this.hooks = ["command"];
    this.name = "git";

    this.gitEnv = {
        GIT_ASKPASS: "/bin/echo",
        EDITOR: "",
        GIT_EDITOR: ""
    };
};

util.inherits(GitPlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.pm.on(this.channel, function(msg) {
            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function (user, message, client) {
        var self = this;
        var cmd = message.command ? message.command.toLowerCase() : "";

        if (cmd !== "git")
            return false;

        if (typeof message.protocol == "undefined")
            message.protocol = "client";

        // git encourages newlines in commit messages; see also #678
        // so if a \n is detected, treat them properly as newlines
        if (message.argv[1] == "commit" && message.argv[2] == "-m") {
            if (message.argv[3].indexOf("\\n") > -1) {
                message.argv[3] = message.argv[3].replace(/\\n/g,"\n");
            }
        }

        this.pm.spawn("shell", {
            command: "git",
            args: message.argv.slice(1),
            cwd: message.cwd,
            env: this.gitEnv,
        }, this.channel, function(err, pid) {
            if (err)
                self.error(err, 1, message, client);
        });

        return true;
    };

    var githelp     = null;
    var commandsMap = {
            "default": {
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder or file. Autocomplete with [TAB]"}
                }
            }
        };

    this.$commandHints = function(commands, message, callback) {
        var self = this;

        if (!githelp) {
            githelp = {};
            this.pm.exec("shell", {
                command: "git",
                args: [],
                cwd: message.cwd,
                env: this.gitEnv
            }, function(code, out, err) {
                if (!out && err)
                    out = err;

                if (!out)
                    return callback();

                githelp = {"git": {
                    "hint": "the stupid content tracker",
                    "commands": {}
                }};
                out.replace(/[\s]{3,4}([\w]+)[\s]+(.*)\n/gi, function(m, sub, hint) {
                    githelp.git.commands[sub] = self.augmentCommand(sub, {"hint": hint});
                });
                onfinish();
            }, null, null);
        }
        else {
            onfinish();
        }

        function onfinish() {
            c9util.extend(commands, githelp);
            callback();
        }
    };

    this.augmentCommand = function(cmd, struct) {
        var map = commandsMap[cmd] || commandsMap["default"];
        return c9util.extend(struct, map || {});
    };

    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };

}).call(GitPlugin.prototype);
