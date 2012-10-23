/**
 * Filelist module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Os = require("os");

module.exports = function() {
    this.env = {
        findCmd: "find",
        perlCmd: "perl",
        platform: Os.platform(),
        basePath: "",
        workspaceId: ""
    };

    this.filelistCounter = 0;

    this.setEnv = function(newEnv) {
        var self = this;
        Object.keys(this.env).forEach(function(e) {
            if (newEnv[e])
                self.env[e] = newEnv[e];
        });
    };

    this.exec = function(options, pm, eventbus, onStart, onData, onExit) {
        var path = options.path;

        if (options.path === null)
            return true;

        options.uri = path;
        options.path = this.env.basePath + (path ? "/" + path : "");

        var args = this.assembleCommand(options);

        if (!args)
            return false;

        var channel = this.env.workspaceId + "::download_" + this.filelistCounter++;

        pm.spawn("shell", {
            command: args.command,
            extra: "filelist",
            args: args,
            cwd: options.path,
            encoding: "utf8"
        }, channel, function(err, pid, process) {
            var stderr = "";

            var listener = function (msg) {
                switch (msg.type) {
                    case "shell-start":
                        onStart();
                        break;
                    case "shell-data":
                        if (msg.stream === "stderr")
                            stderr += msg.data.toString("ascii");
                        else
                            onData(msg);
                        break;
                    case "shell-exit":
                        eventbus.removeListener(channel, listener);
                        onExit(msg.code, stderr);
                        break;
                }
            };

            eventbus.on(channel, listener);
        });

        return true;
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
        if (options.showHiddenFiles)
            args.push("!", "-regex", "\\/\\.[^\\/]*$");

        if (options.maxdepth)
            args.push("-maxdepth", options.maxdepth);

        excludeExtensions.forEach(function(pattern){
            args.push("!", "-regex", ".*\\/" + pattern + "$");
        });

        excludeDirectories.forEach(function(pattern){
            args.push("!", "-regex", ".*\\/" + pattern + "\\/.*");
        });

        if (this.env.platform !== "darwin")
            args.push("-regextype", "posix-extended", "-print");

        args.command = this.env.findCmd;
        return args;
    };
};
