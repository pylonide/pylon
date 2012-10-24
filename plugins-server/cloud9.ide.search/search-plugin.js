/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Plugin = require("../cloud9.core/plugin");
var util = require("util");
var SearchLib = require("./search");

var name = "search";

module.exports = function setup(options, imports, register) {
    var Search = new SearchLib();
    Search.setEnv({
        grepCmd: options.grepCmd || "grep",
        perlCmd: options.perlCmd || "perl",
        platform: options.platform || require("os").platform()
    });

    var Vfs = imports["vfs"];

    var SearchPlugin = function(ide, workspace) {
        Plugin.call(this, ide, workspace);
        this.hooks = ["command"];
        this.name = name;
        this.processCount = 0;
        Search.setEnv({ basePath: ide.workspace.workspaceDir });
    };

    util.inherits(SearchPlugin, Plugin);

    (function() {

        this.init = function() {};

        this.command = function(user, message, client) {
            if (message.command !== "codesearch")
                return false;

            var self = this;
            return Search.exec(message, Vfs,
                // data
                function(msg) {
                    msg.extra = "codesearch";
                    self.ide.broadcast(JSON.stringify(msg), self.name);
                },
                // exit
                function(code, stderr, msg) {
                    if (code)
                        self.error(stderr, 1, "Could not spawn grep process for codesearch", client);
                    msg.extra = "codesearch";
                    msg.type = "exit";
                    self.ide.broadcast(JSON.stringify(msg), self.name);
                }
            );
        };

    }).call(SearchPlugin.prototype);

    imports.ide.register(name, SearchPlugin, register);
};
