/**
 * Filelist module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Path = require("path");
var Fs = require("fs");
Fs.existsSync = Fs.existsSync || Path.existsSync;

module.exports = function() {
    this.env = { };

    this.setEnv = function(newEnv) {
        var self = this;
        Object.keys(newEnv).forEach(function(e) {
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

        var args = this.env.searchType.assembleCommand(options);

        if (!args)
            return onExit(1, "Invalid arguments");

        vfs.spawn(args.command, { args: args, cwd: options.path, stdoutEncoding: "utf8", stderrEncoding: "utf8" }, function(err, meta) {
            if (err || !meta.process)
                return onExit(1, err);

            var stderr = "";
            meta.process.stdout.on("data", function(data) {
                onData(data);
            });

            meta.process.stderr.on("data", function(data) {
                stderr += data;
            });

            meta.process.on("exit", function(code) {
                onExit(code, stderr);
            });
        });
    };
};
