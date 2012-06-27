/**
 * Automatic Runtime Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "automatic-runner";
var NODE_RUNTIME = "node-runtime";
var JVM_RUNTIME = "jvm-runtime";

var IdeCore;
var Fs;

module.exports = function setup(options, imports, register) {
    IdeCore = imports.ide;
    Fs = imports["sandbox.fs"];
    imports.ide.register(name, AutomaticRunnerPlugin, register);
};

var AutomaticRunnerPlugin = function(ide, workspace) {
    this.hooks = ["command"];
    this.name = name;
    this.projectTypes = [
        {file: "web/WEB-INF/web.xml", runner: "java-web", runtime: JVM_RUNTIME},
        {file: "bin", runner: "java", runtime: JVM_RUNTIME}
    ];
};

util.inherits(AutomaticRunnerPlugin, Plugin);

(function() {

    this.command = function(user, message, client) {
        if (!(/^(default|auto)$/.test(message.runner)))
            return false;

        async.list(this.projectTypes)
            .some(function checkProject(pType, next) {
                Fs.exists(pType.file, function (err, exists) {
                    if (err || ! exists)
                        return next();
                    next(null, pType);
                });
            })
            .end(function(err, pType) {
                if (err || !pType) {
                    IdeCore.getPlugin(NODE_RUNTIME, function(err, runnerPlugin) {
                        message.runner = "node-0.6.x";
                        runnerPlugin.command(user, message, client);
                    });
                } else {
                    IdeCore.getPlugin(pType.runtime, function(err, runnerPlugin) {
                        message.runner = pType.runner;
                        runnerPlugin.command(user, message, client);
                    });
                }
            });
    };

}).call(AutomaticRunnerPlugin.prototype);