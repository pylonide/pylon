/**
 * Quick Open for the Cloud9 IDE
 *
 * Traverses the workspace directory and gets all 
 * relative file paths, returns the result to the
 * client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys    = require("sys");
var findIt = require('./node-findit');

var QuickOpenPlugin = module.exports = function(ide) {
    this.ide   = ide;
    this.hooks = ["command"];
    this.name  = "quickopen";
    this.ignoreHidden = true;
};

sys.inherits(QuickOpenPlugin, Plugin);

(function() {
    /**
     * Entry point for hooked command from the Plugin arch.
     * Determines if the primary command is "quickopen" and then
     * handles the subcommand. Assumes the user is passing a
     * file argument in @message to perform a git operation on
     * 
     * @param {object} user
     * @param {object} message User's message to the plugin
     * @param {object} client Client connection to the server
     * @return {boolean} False if message.command != "quickopen" so the Plugin
     *      architecture knows to keep asking other plugins if they handle
     *      message.command
     */
    this.command = function(user, message, client) {
        if (message.command != this.name)
            return false;

        // this.ide.workspaceDir
        switch (message.subcommand) {
            case "load":
                // We do this sync because high-quantity directories will blow the stack
                var finder = findIt.findSync(this.ide.workspaceDir, this.ide.workspaceDir.length, this.ignoreHidden);
                this.sendResult(0, message.command, {
                    code: 0,
                    err: null,
                    subcommand: message.subcommand,
                    out: finder
                });
                break;
            default:
                //console.log("notice: subcommand `" + 
                //    message.subcommand + "` not found");
                break;
        }

        return true;
    };

    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };

}).call(QuickOpenPlugin.prototype);