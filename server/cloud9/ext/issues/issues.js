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

    this.ghUrlTest = {
         "ssh": {
             re: /[\w]+@github\.com:([\w\.\d-_]+)\/([\w\.\d-_]+)$/,
             pattern: "git@github.com:{context}/{name}"
         },
         "http": {
             re: /^https\:\/\/([\w\.\d-_]+)@github\.com\/(\1|[\w\.\d-_]+)\/([\w\.\d-_]+)$/,
             pattern: "https://{context}@github.com/{context_or_organization}/{name}"
         },
         "httpalt": {
             re: /^https\:\/\/github\.com\/(\1|[\w\.\d-_]+)\/([\w\.\d-_]+)$/,
             pattern: "https://github.com/{context_or_organization}/{name}"
         },
         "readonly": {
             re: /^git\:\/\/github\.com\/([\w\.\d-_]+)\/([\w\.\d\-\_]+)$/,
             pattern: "git://github.com/{context}/{name}"
         }
     }
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
            case "init":
                this.initIssues(message, client);
                break;
            case "list":
                this.getIssuesList(message, client);
                break;
            case "getcomments":
                this.getIssueComments(message, client);
                break;
            default:
                console.log("Issues Manager warning: subcommand `" + 
                    message.subcommand + "` not found");
                break;
        }

        return true;
    };
    
    this.initIssues = function(message, client) {
        var self = this;
        this.getOriginUrl(function(err, url) {
            if (err) {
                return self.sendResult(client.id, message.command, {
                            code: 0,
                            subcommand: message.subcommand,
                            argv: message.argv,
                            err: err,
                            out: null
                        });
            }

            if (!url) {
                return self.sendResult(client.id, message.command, {
                            code: 0,
                            subcommand: message.subcommand,
                            argv: message.argv,
                            err: "nourl",
                            out: null
                        });
            }

            function returnInitOk(type, urlMatch) {
                self.type = type;
                if (type === "http") {
                    self.cloneUrl = urlMatch[0];
                    self.userContext = urlMatch[1];
                    self.contextName = urlMatch[2];
                    self.projectName = urlMatch[3].substr(0, urlMatch[3].length-4);
                } else {
                    self.cloneUrl = urlMatch[0];
                    self.contextName = urlMatch[1];
                    self.projectName = urlMatch[2].substr(0, urlMatch[2].length-4);;
                }

                self.urlMatch = urlMatch;
                return self.sendResult(client.id, message.command, {
                            code: 0,
                            subcommand: message.subcommand,
                            argv: message.argv,
                            err: null,
                            out: "ok",
                            project : {
                                "name" : self.projectName,
                                "context" : self.contextName
                            }
                        });
            }

            // Trim the string
            url = url.replace(/^\s*([\S\s]*?)\s*$/, '$1');

            // Now test for GitHub URLs
            var urlTest = url.match(self.ghUrlTest["ssh"].re);
            if (urlTest)
                return returnInitOk("ssh", urlTest);

            urlTest = url.match(self.ghUrlTest["http"].re);
            if (urlTest)
                return returnInitOk("http", urlTest);

            urlTest = url.match(self.ghUrlTest["httpalt"].re);
            if (urlTest)
                return returnInitOk("httpalt", urlTest);

            urlTest = url.match(self.ghUrlTest["readonly"].re);
            if (urlTest)
                return returnInitOk("readonly", urlTest);

            // If we get to this point, it isn't a GitHub URL
            return self.sendResult(client.id, message.command, {
                        code: 0,
                        argv: message.argv,
                        subcommand: message.subcommand,
                        err: null,
                        out: "notgithuburl"
                    });
        });
    };

    this.getOriginUrl = function(callback) {
        var argv = ["config", "--get", "remote.origin.url"];

        this.spawnCommand("git", argv, this.ide.workspaceDir,
            function(err) { // Error
                return callback(err);
            },
            function(out) { // Data
                return callback(null, out);
            },
            function(code, err, out) {
                // Exit
            }
        );
    };
    
    this.getIssuesList = function(message, client) {
        var self = this;
        this.issuesApi.getList(this.contextName, this.projectName, "open", function(err, issues) {
            if (err) {
                return self.sendResult(client.id, message.command, {
                    code: 0,
                    subcommand: message.subcommand,
                    err: err,
                    out: null
                });
            }

            self.sendResult(client.id, message.command, {
                err: null,
                subcommand : message.subcommand,
                out: issues
            });
        });
    };

    this.getIssueComments = function(message, client) {
        var self = this;
        this.issuesApi.getIssueComments(this.contextName, this.projectName, message.extra, function(err, comments) {
            if (err) {
                return self.sendResult(client.id, message.command, {
                    code: 0,
                    subcommand: message.subcommand,
                    issue_num: message.extra,
                    err: err,
                    out: null
                });
            }
            
            self.sendResult(client.id, message.command, {
                err: null,
                subcommand : message.subcommand,
                issue_num: message.extra,
                out: comments
            });
        });
    }

    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };

}).call(IssuesPlugin.prototype);