/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Plugin = require("../cloud9.core/plugin");
var util = require("util");
var Search = require("./search");

var name = "search";

var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    Search.setEnv({
        grepCmd: options.grepCmd || "grep",
        perlCmd: options.perlCmd || "perl",
        platform: options.platform || require("os").platform()
    });

    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, SearchPlugin, register);
};

var SearchPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
    this.pm = ProcessManager;
    this.eventbus = EventBus;
    Search.setEnv({ basePath: ide.workspaceDir });
};

util.inherits(SearchPlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on("codesearch", function(msg) {
            if (msg.type == "shell-start") {
                self.processCount += 1;
                self.filecount = 0;
                self.count = 0;
                self.prevFile = null;
            }
            else if (msg.type == "shell-exit") {
                self.processCount -= 1;
            }

            msg = Search.parseResult(msg);
            if (msg)
                self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function(user, message, client) {
        if (message.command !== "codesearch")
            return false;

        return Search.exec(message, this.pm, client, function(err, pid) {
            if (err)
                self.error(err, 1, "Could not spawn grep process for codesearch", client);
        });
    };

}).call(SearchPlugin.prototype);
