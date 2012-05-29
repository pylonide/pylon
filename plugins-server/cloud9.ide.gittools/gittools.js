/**
 * Git Tools for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "gittools";

module.exports = function setup(options, imports, register) {
    imports.ide.register(name, GitToolsPlugin, register);
};

var GitToolsPlugin = function(ide) {
    this.ide   = ide;
    this.hooks = ["command"];
    this.name  = "gittools";
};

util.inherits(GitToolsPlugin, Plugin);

(function() {

    // TODO place these two functions in a separate file
    // Could be useful for others
    this.getGitTopDir = function(dirPath, absoluteFilePath, callback) {
        var _self = this;
        this.getGitTopDirProc(dirPath, function(err, gitRoot) {
            if (err || !gitRoot)
                return callback("Error getting git top dir: " + err +
                    " | " + absoluteFilePath + " | " + dirPath);

            gitRoot = gitRoot.replace("\n", "");
            var relativeFilePath = absoluteFilePath.substr(gitRoot.length + 1);
            callback(null, relativeFilePath, gitRoot);
        });
    };

    this.getGitTopDirProc = function(path, callback) {
        // @TODO SECURITY
        var argv  = ["rev-parse", "--show-toplevel"];

        this.spawnCommand("git", argv, this.ide.workspaceDir + path,
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

    /**
     * Entry point for hooked command from the Plugin arch.
     * Determines if the primary command is "gittools" and then
     * handles the subcommand. Assumes the user is passing a
     * file argument in @message to perform a git operation on
     *
     * @param {object} user
     * @param {object} message User's message to the plugin
     * @param {object} client Client connection to the server
     * @return {boolean} False if message.command != "gittools" so the Plugin
     *      architecture knows to keep asking other plugins if they handle
     *      message.command
     */
    this.command = function(user, message, client) {
        if (message.command != "gittools" || !message.file)
            return false;

        var _self = this;

        // Cleanup the file path
        if (message.file.indexOf("/workspace/" >= 0))
            message.file = message.file.substr(11);

        // Get the file's parent directory path
        var lastSlash = message.file.lastIndexOf("/");
        var dirPath = "/" + message.file.substr(0, lastSlash);

        // Get the absolute system path to the file (as opposed to the
        // relative file path passed to us by the user)
        var absoluteFilePath = _self.ide.workspaceDir + "/" + message.file;

        // Given the path to the file's parent directory and the
        // absolute file path, determine the top-level directory
        // location of the git repository holding the file
        this.getGitTopDir(dirPath, absoluteFilePath, function(err, relativeFilePath, gitRoot) {
            if (err)
                return _self.sendResult(0, message.command, {
                            code: 0,
                            argv: message.argv,
                            err: err ? err : "No git root found for file",
                            out: null
                        });

            switch (message.subcommand) {
                case "blame":
                    _self.gitBlame(message, relativeFilePath, gitRoot);
                    break;
                case "log":
                    _self.gitLog(message, relativeFilePath, gitRoot);
                    break;
                case "show":
                    _self.gitShow(message, relativeFilePath, gitRoot, message.hash);
                    break;
                default:
                    console.log("Git Tools warning: subcommand `" +
                        message.subcommand + "` not found");
                    break;
            }
        });

        return true;
    };

    this.gitBlame = function(message, relativeFilePath, gitRoot) {
        var gitCommand = "blame";
        var argv;
        if (message.hash)
            argv = [gitCommand, "-p", message.hash, "--", relativeFilePath];
        else
            argv = [gitCommand, "-p", relativeFilePath];

        var _self = this;
        this.spawnCommand("git", argv, gitRoot,
            function(err) { // Error
                _self.sendResult(0, message.command, {
                    code: 0,
                    err: err,
                    gitcommand: gitCommand,
                    file: message.file,
                    out: null
                });
            },
            function(out) { }, // Data
            function(code, err, out) { // Exit
                _self.sendResult(0, message.command, {
                    code: code,
                    err: null,
                    gitcommand: gitCommand,
                    file: message.file,
                    out: out
                });
            }
        );
    };

    this.gitLog = function(message, relativeFilePath, gitRoot) {
        var gitCommand = "log";
        var argv  = [gitCommand, "--format=raw", "--reverse", "--", relativeFilePath];

        var _self = this;
        this.spawnCommand("git", argv, gitRoot,
            function(err) { // Error
                _self.sendResult(0, message.command, {
                    code: 0,
                    err: err,
                    gitcommand: gitCommand,
                    file: message.file,
                    out: null
                });
            },
            function(out) { }, // Data
            function(code, err, out) { // Exit
                _self.sendResult(0, message.command, {
                    code: code,
                    err: null,
                    gitcommand: gitCommand,
                    file: message.file,
                    out: out
                });
            }
        );
    };

    this.gitShow = function(message, relativeFilePath, gitRoot, hash) {
        var gitCommand = "show";
        var argv  = [gitCommand, hash + ":" + relativeFilePath];

        var _self = this;
        this.spawnCommand("git", argv, gitRoot,
            function(err) { // Error
                _self.sendResult(0, message.command, {
                    code: 0,
                    err: err,
                    gitcommand: gitCommand,
                    hash: hash,
                    file: message.file,
                    out: null
                });
            },
            function(out) { }, // Data
            function(code, err, out) { // Exit
                _self.sendResult(0, message.command, {
                    code: code,
                    err: null,
                    gitcommand: gitCommand,
                    hash: hash,
                    file: message.file,
                    out: out
                });
            }
        );
    };

    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };

}).call(GitToolsPlugin.prototype);