/**
 * Filelist module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Os = require("os");

module.exports = new (function() {
    this.env = {
        findCmd: "find",
        perlCmd: "perl",
        platform: Os.platform(),
        basePath: ""
    };

    this.setEnv = function(newEnv) {
        var self = this;
        Object.keys(this.env).forEach(function(e) {
            if (newEnv[e])
                self.env[e] = newEnv[e];
        });
    };

    this.exec = function(options, pm, client, callback) {
        var path = options.path;

        if (options.path === null)
            return true;

        options.uri = path;
        options.path = this.env.basePath + (path ? "/" + path : "");

        var args = this.assembleCommand(options);

        if (!args)
            return false;

        pm.spawn("shell", {
            command: args.command,
            extra: "filelist",
            args: args,
            cwd: options.path,
            encoding: "utf8"
        }, "filelist", callback || function(err) {
            if (err)
                console.error(err);
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
})();
