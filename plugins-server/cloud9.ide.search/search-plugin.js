/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Plugin = require("../cloud9.core/plugin");
var util = require("util");
var os = require("os");
var path = require("path");
var SearchLib = require("./search");

var name = "search";

module.exports = function setup(options, imports, register) {
    var Search = new SearchLib(),
        platform = options.platform || os.platform(),
        arch = options.arch || os.arch();
    Search.setEnv({
        platform:  platform,
        arch:  arch,
        agCmd:  options.agCmd || path.join(__dirname, [platform, arch].join("_"), "ag"),
        nakCmd: options.nakCmd || "node " + path.join(__dirname, "..", "..", "node_modules/nak/bin/nak")
    });

    if (!Search.isAgAvailable())
        console.warn("No ag found for " + [platform, arch].join("_"));
    else 
        Search.setEnv({
            useAg: true
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
                    msg.code = code;
                    msg.stderr = stderr;
                    msg.extra = "codesearch";
                    msg.type = "exit";
                    self.ide.broadcast(JSON.stringify(msg), self.name);
                }
            );
        };

    }).call(SearchPlugin.prototype);

    imports.ide.register(name, SearchPlugin, register);
};
