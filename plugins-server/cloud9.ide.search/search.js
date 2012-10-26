/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Os = require("os");
var Path = require("path");
var Fs = require("fs");

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
                    filecount: filecount
                });
            });
        });

        return true;
    };

    this.assembleCommand = function(options) {
        var args, query = options.query;

        if (!query)
            return;

        if (!this.env.useAg) {
            args = ["--nocolor",                             // don't color items
                    "-p", Path.join(__dirname, ".agignore"), // use the Cloud9 ignore file
                    "-U",                                    // skip VCS ignores (.gitignore, .hgignore), but use root .agignore
                     "--search-files"];                      // formats output in "grep-like" manner                               
            
            if (!options.casesensitive)
                args.push("-i");

            if (options.wholeword)
                args.push("-w");

            if (!options.regexp)
                args.push("-Q");
            else {
                // avoid bash weirdness
                if (options.replaceAll) {
                    query = bashEscapeRegExp(query);
                }
            }

            args.push(query, options.path);

            if (options.replaceAll) {
                if (!options.replacement)
                    options.replacement = "";

                // pipe the results into perl
                args.push("-l | xargs " + perlCmd +
                          // print the grep result to STDOUT (to arrange in parseSearchResult())
                          " -pi -e 'print STDOUT \"$ARGV:$.:$_\"" +
                          // do the actual replace; intentionally using unescape query here
                          " if s/" + options.query + "/" + options.replacement + "/mg" + (!options.casesensitive ? "" : "i" ) + ";'");
            
                // args must be redirected to bash like this when replacing
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
                    "-p", Path.join(__dirname, ".agignore")]; // use the Cloud9 ignore file

            if (!options.casesensitive)
                args.push("-i");

            if (options.wholeword)
                args.push("-w");

            if (!options.regexp)
                args.push("-Q");
            else {
                // avoid bash weirdness
                if (options.replaceAll) {
                    query = bashEscapeRegExp(query);
                }
            }

            args.push(query, options.path);

            if (options.replaceAll) {
                if (!options.replacement)
                    options.replacement = "";

                // pipe the results into perl
                args.push("-l | xargs " + perlCmd +
                          // print the grep result to STDOUT (to arrange in parseSearchResult())
                          " -pi -e 'print STDOUT \"$ARGV:$.:$_\"" +
                          // do the actual replace; intentionally using unescape query here
                          " if s/" + options.query + "/" + options.replacement + "/mg" + (!options.casesensitive ? "" : "i" ) + ";'");
            
                // args must be redirected to bash like this when replacing
                args.unshift(this.env.nakCmd);
                args = ["-c", args.join(" ")];

                args.command = "bash";
            }
            else {
                args.command = this.env.nakCmd;
            }
        }

        return args;
    };

    this.parseResult = function(prevFile, options, data) {
        if (typeof data !== "string" || data.indexOf("\n") === -1)
            return { count: 0, filecount: 0, data: "" };

        var parts, file, lineno, result = "";
        var aLines = data.split(/([\n\r]+)/g);
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

    // util
    var makeUnique = function(arr){
        var i, length, newArr = [];
        for (i = 0, length = arr.length; i < length; i++) {
            if (newArr.indexOf(arr[i]) == -1)
                newArr.push(arr[i]);
        }

        arr.length = 0;
        for (i = 0, length = newArr.length; i < length; i++)
            arr.push(newArr[i]);

        return arr;
    };

    var escapeRegExp = function(str) {
        return str.replace(/([.*+?\^${}()|\[\]\/\\])/g, "\\$1");
    };

    // taken from http://xregexp.com/
    var grepEscapeRegExp = function(str) {
        return str.replace(/[[\]{}()*+?.,\\^$|#\s"']/g, "\\$&");
    };

    var escapeShell = function(str) {
        return str.replace(/([\\"'`$\s\(\)<>])/g, "\\$1");
    };
};
