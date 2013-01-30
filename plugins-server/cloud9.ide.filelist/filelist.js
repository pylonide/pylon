/**
 * Filelist module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Os = require("os");
var Path = require("path");

module.exports = function() {
    this.env = {
        findCmd: "find",
        perlCmd: "perl",
        platform: Os.platform(),
        basePath: "",
        workspaceId: ""
    };

    this.setEnv = function(newEnv) {
        var self = this;
        Object.keys(this.env).forEach(function(e) {
            if (newEnv[e])
                self.env[e] = newEnv[e];
        });
    };

    this.exec = function(options, vfs, onData, onExit) {
        var path = options.path;

        if (options.path === null)
            return onExit(1, "Invalid path");

        options.uri = path;
        options.path = Path.normalize(this.env.basePath + (path ? "/" + path : ""));
        // if the relative path FROM the workspace directory TO the requested path
        // is outside of the workspace directory, the result of Path.relative() will
        // start with '../', which we can trap and use:
        if (Path.relative(this.env.basePath, options.path).indexOf("../") === 0)
            return onExit(1, "Invalid path");

        var args = this.assembleCommand(options);

        if (!args)
            return onExit(1, "Invalid arguments");

        vfs.spawn(args.command, { args: args, cwd: options.path, stdoutEncoding: "utf8", stderrEncoding: "utf8" }, function(err, meta) {
            if (err || !meta.process)
                return onExit(1, err);

            var stderr = "", gotExitCode = false, gotClose = false;
            meta.process.stdout.on("data", function(data) {
                onData(data);
            });

            meta.process.stderr.on("data", function(data) {
                stderr += data;
            });

            meta.process.on("exit", function(code) {
                if (gotClose) {
                    onExit(code, stderr);
                }
                else {
                    gotExitCode = code;
                }
            });

            meta.process.stdout.on("close", function(code) {
                if (gotExitCode !== false) {
                    onExit(gotExitCode, stderr);
                }
                else {
                    gotClose = true;
                }
            });
        });
    };

    this.assembleCommand = function(options) {
        var excludeExtensions = [
            "\\.gz", "\\.bzr", "\\.cdv", "\\.dep", "\\.dot", "\\.nib",
            "\\.plst", "_darcs", "_sgbak", "autom4te\\.cache", "cover_db",
            "_build", "\\.tmp"
        ];

        var excludeDirectories = [
            "\\.c9revisions", "\\.architect", "\\.sourcemint",
            "\\.git", "\\.hg", "\\.pc", "\\.svn", "blib",
            "CVS", "RCS", "SCCS", "\\.DS_Store"
        ];

        var args = ["-L", ".", "-type", "f", "-a"];

        if (this.env.platform === "darwin")
            args.unshift("-E");

        //Hidden Files
        if (!options.showHiddenFiles)
            args.push("(", "!", "-regex", ".*/\\..*", ")");

        if (options.maxdepth)
            args.push("-maxdepth", options.maxdepth);

        excludeExtensions.forEach(function(pattern){
            args.push("(", "!", "-regex", ".*\\/" + pattern + "$", ")");
        });

        excludeDirectories.forEach(function(pattern){
            args.push("(", "!", "-regex", ".*\\/" + pattern + "\\/.*", ")");
        });

        if (this.env.platform !== "darwin")
            args.push("-regextype", "posix-extended", "-print");

        args.command = this.env.findCmd;
        return args;
    };
};
