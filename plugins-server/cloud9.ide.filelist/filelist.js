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

    this.isAgAvailable = function() {
        return Fs.existsSync(this.env.agCmd);
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

    this.assembleCommand = function(options) {
        var args;
        
        if (this.env.useAg) {
            args = ["--nocolor", 
                   "-p", Path.join(__dirname, "..", "cloud9.ide.search", ".agignore"), // use the Cloud9 ignore file
                   "-U",                                    // skip VCS ignores (.gitignore, .hgignore), but use root .agignore
                   "-l",                                    // filenames only
                   "--search-binary"]                       // list binary files

            if (options.showHiddenFiles)
                args.push("--hidden");

            if (options.maxdepth)
                args.push("--depth", options.maxdepth);

            // any non-null file
            args.push("[^\\0]", options.path);

            args.command = this.env.agCmd;
        }
        else {
            args = ["--nocolor", 
                    "-l",                                                     // filenames only   
                    "-p", Path.join(__dirname, "..", "cloud9.ide.search", ".agignore")]; // use the Cloud9 ignore file                     
            
            if (options.showHiddenFiles)
                args.push("-H");

            if (options.maxdepth)
                args.push("-m", options.maxdepth);

            args.push(options.path);

            args.unshift(this.env.nakCmd);
            args = ["-c", args.join(" ")];

            args.command = "bash";
        }

        return args;
    };
};
