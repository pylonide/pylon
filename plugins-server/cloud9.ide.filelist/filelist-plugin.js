/**
 * Filelist module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Plugin = require("../cloud9.core/plugin");
var Filelist = require("./filelist");
var util = require("util");

var name = "filelist";

var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    Filelist.setEnv({
        findCmd: options.findCmd,
        platform: options.platform
    });

    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, FilelistPlugin, register);
};

var FilelistPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
    this.pm = ProcessManager;
    this.eventbus = EventBus;
    Filelist.setEnv({ basePath: ide.workspaceDir });
};

util.inherits(FilelistPlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on("filelist", function(msg) {
            if (msg.type == "shell-start")
                self.processCount += 1;
            else if (msg.type == "shell-exit")
                self.processCount -= 1;
            else if (msg.stream != "stdout")
                return;

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function(user, message, client) {
        if (message.command !== "filelist")
            return false;

        var self = this;
        return Filelist.exec(message, this.pm, client, function(err, pid) {
            if (err)
                self.error(err, 1, "Could not spawn find process for filelist", client);
        });
    };

}).call(FilelistPlugin.prototype);
