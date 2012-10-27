/**
 * Search module for the Cloud9 IDE
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
            return true;
            
        options.uri = path;
        options.path = Path.normalize(this.env.basePath + (path ? "/" + path : ""));
        // if the relative path FROM the workspace directory TO the requested path
        // is outside of the workspace directory, the result of Path.relative() will
        // start with '../', which we can trap and use:
        if (Path.relative(this.env.basePath, options.path).indexOf("../") === 0)
            return false;

        var args = this.assembleCommand(options);

        if (!args)
            return false;

        this.options = options;
        var self = this;

        if (this.activeProcess)
            this.activeProcess.kill("SIGKILL");

        vfs.spawn(args.command, { args: args, cwd: options.path, stdoutEncoding: "utf8", stderrEncoding: "utf8" }, function(err, meta) {
            if (err || !meta.process)
                return onExit(1, err);

            var child = meta.process;
            self.activeProcess = child;

            var stderr = "";
            var prevFile = null;
            var filecount = 0;
            var count = 0;
        
            child.stdout.on("data", function(data) {
                var msg = self.parseResult(prevFile, options, data);
                count += msg.count;
                filecount += msg.filecount;
                prevFile = msg.prevFile;

                if (msg)
                    onData(msg);
            });

            child.stderr.on("data", function(data) {
                stderr += data;
            });

            child.on("exit", function(code) {
                self.processCount -= 1;
                onExit(code, stderr, {
                    count: count,
                    filecount: filecount,
                    command: args.command + " " + args.join(" ")
                });
            });
        });

        return true;
    };

    this.assembleCommand = function(options) {
        var args, query = options.query;

        if (!query)
            return;

        if (this.env.useAg) {
            args = ["--nocolor",                             // don't color items
                    "-p", Path.join(__dirname, ".agignore"), // use the Cloud9 ignore file
                    "-U",                                    // skip VCS ignores (.gitignore, .hgignore), but use root .agignore
                    "--search-files"];                       // formats output in "grep-like" manner                               
            
            if (!options.casesensitive)
                args.push("-i");

            if (options.wholeword)
                args.push("-w");

            if (options.hidden)
                args.push("--hidden");
                
            if (!options.regexp)
                args.push("-Q");
            else {
                // avoid bash weirdness
                if (options.replaceAll) {
                    query = $escapeRegExp(query);
                }
            }

            args.push(query, options.path);

            if (options.replaceAll) {
                if (!options.replacement)
                    options.replacement = "";

                // pipe the results into nak, which we can do the replace/format and is guaranteed to exist
                args.push("-l | ", this.env.nakCmd + " --c9Format --piped '" + options.query + "' '" + options.replacement + "'");
                      
                // see note for "nodeception" below on why we do this
                args.unshift(this.env.agCmd);
                args = ["-c", args.join(" ")];
                args.command = "bash";
            }
            else {
                args.command = this.env.agCmd;
            }
        }
        else {
            args = ["--nocolor",                              // don't color items
                    "-p", Path.join(__dirname, ".agignore"),  // use the Cloud9 ignore file
                    "--c9Format"];                            // format for parseResult to consume

            if (!options.casesensitive)
                args.push("-i");

            if (options.wholeword)
                args.push("-w");

            if (options.hidden)
                args.push("-H");
                
            if (!options.regexp)
                args.push("-q");

            args.push("'" + query + "'");

            if (options.replaceAll && options.replacement) {
                if (!options.replacement)
                    options.replacement = "";

                // nak naturally suports find/replace, so no piping needed!
                args.push("'" + options.replacement + "'");
            }
            
            args.push(options.path);
            
            // since we're actually calling try to call a node binary (from a node program--nodeception!)
            // we need to launch the script via bash and act as though the command is a string
            args.unshift(this.env.nakCmd);
            args = ["-c", args.join(" ")];
            args.command = "bash";
        }
        
        return args;
    };

    this.parseResult = function(prevFile, options, data) {
        if (typeof data !== "string" || data.indexOf("\n") === -1)
            return { count: 0, filecount: 0, data: "" };

        var parts, file, lineno, result = "";
        var aLines = data.split(/([\n\r\u0000]+)/g);
        var count = 0;
        var filecount = 0;
        
        if (options) {
            for (var i = 0, l = aLines.length; i < l; ++i) {
                parts = aLines[i].split(":");

                if (parts.length < 3)
                    continue;

                var _path = parts.shift().replace(options.path, "").trimRight();
                file = encodeURI(options.uri + _path, "/");

                lineno = parseInt(parts.shift(), 10);
                if (!lineno)
                    continue;

                ++count;
                if (file !== prevFile) {
                    ++filecount;
                    if (prevFile)
                        result += "\n \n";

                    result += file + ":";
                    prevFile = file;
                }

                result += "\n\t" + lineno + ": " + parts.join(":");
            }
        }
        else {
            console.error("options object doesn't exist", data);
        }

        return {
            count: count,
            filecount: filecount,
            prevFile: prevFile,
            data: result
        };
    };
    
    // taken from http://xregexp.com/
    var $escapeRegExp = function(str) {
        return str.replace(/[[\]{}()*+?.,\\^$|#\s"']/g, "\\$&");
    };
};
