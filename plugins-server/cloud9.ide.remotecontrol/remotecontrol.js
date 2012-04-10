/**
 * Remote Control Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var ASSERT = require("assert");
var UTIL = require("util");
var PLUGIN = require("../cloud9.core/plugin");

var NAME = "remotecontrol";

// TODO: When ide/workspace is closed remove RemoteControlPlugin instance.
var plugins = {};


module.exports = function setup(options, imports, register) {


    imports.ide.register(NAME, RemoteControlPlugin, function() {
        register(null, {
            remotecontrol: {
                // TODO: 'selector' should be used to send to specific workspace or IDE.
                triggerAction: function(selector, name, args, callback) {

                    ASSERT(selector === "*", "'selector' must be '*' for now!");

                    // TODO: Remove timeout and buffer events until all client IDEs have finished initializing.
                    setTimeout(function() {
                        // TODO: Wait for all until triggering callback
                        for (var workspace in plugins) {
                            plugins[workspace].triggerAction(name, args);
                        }
                    }, 2000);

                    callback(null);
                }
            }
        });
    });
};

var RemoteControlPlugin = function(ide, workspace) {
    PLUGIN.call(this, ide, workspace);
    this.name = NAME;
    plugins[workspace.workspaceDir] = this;
};

UTIL.inherits(RemoteControlPlugin, PLUGIN);

(function() {

    this.triggerAction = function(name, args) {
        if (name === "openfile" || name === "opendir") {
            this.send({
                "type": NAME,
                "action": name,
                "args": {
                    "path": this.ide.options.davPrefix + args.path
                }
            });
        }
    }

}).call(RemoteControlPlugin.prototype);
