/**
 * Generic Project Builder Module for Cloud9 IDE projects
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "buildproject"
var EventBus;

module.exports = function setup(options, imports, register) {
    EventBus = imports.eventbus;
    imports.ide.register(name, ProjectBuilderPlugin, register);
};

var ProjectBuilderPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.hooks = ["command"];
    this.name = name;
    this.eventbus = EventBus;
    this.workspaceId = workspace.workspaceId;
};

util.inherits(ProjectBuilderPlugin, Plugin);

(function() {

    this.command = function(user, message, client) {
        if ("buildproject" !== message.command)
            return false;

        var _self = this;
        // JVM projects - The jvm-features plugin will handle its building
        if (!(/^(java|java-web|gae-java)$/.test(message.runner))) {

            var buildCompleteChannel = this.workspaceId + "::jvm-build-complete";

            this.eventbus.on(buildCompleteChannel, function buildComplete(data) {
                _self.eventbus.removeListener(buildCompleteChannel, buildComplete);

                _self.sendResult(0, "buildproject", data);
            });

            _self.eventbus.emit(this.workspaceId + "::jvm-build", {
                channel: buildCompleteChannel
            });
        }
        else {
            // Non-JVM based project - no need to build
            _self.sendResult(0, "buildproject", {
                success: true,
                body: []
            });
        }
    };

}).call(ProjectBuilderPlugin.prototype);