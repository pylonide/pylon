/**
 * Issues for the Cloud9 IDE
 *
 * @copyright 2011, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var Fs     = require("fs");
var sys    = require("sys");
var nodegh = require("github").GitHubApi;

var IssuesPlugin = module.exports = function(ide) {
    this.ide       = ide;
    this.hooks     = ["command"];
    this.name      = "issues";
    this.api       = new nodegh();
    this.issuesApi = this.api.getIssueApi();
};

sys.inherits(IssuesPlugin, Plugin);

(function() {
    /* Entry point for hooked command from the Plugin arch.
     * Determines if the primary command is "issues" and then
     * handles the subcommand.
     * 
     * @param {object} user
     * @param {object} message User's message to the plugin
     * @param {object} client Client connection to the server
     * @return {boolean} False if message.command != "issues" so the Plugin
     *      architecture knows to keep asking other plugins if they handle
     *      message.command
     */
    this.command = function(user, message, client) {
        if (message.command != "issues")
            return false;

        switch (message.subcommand) {
            case "list":
                this.getIssuesList(message);
                break;
            default:
                console.log("Issues Manager warning: subcommand `" + 
                    message.subcommand + "` not found");
                break;
        }

        return true;
    };
    
    this.getIssuesList = function(message) {
        var self = this;
        this.issuesApi.getList("ajaxorg", "cloud9", "open", function(err, issues) {
            if (err) {
                return self.sendResult(0, message.command, {
                    code: 0,
                    err: err,
                    out: null
                });
            }
            
            self.sendResult(0, message.command, {
                err: null,
                out: issues
            });
        });
    };

    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };

}).call(IssuesPlugin.prototype);