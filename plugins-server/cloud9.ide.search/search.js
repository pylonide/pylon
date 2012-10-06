/**
 * Search module for the Cloud9 IDE.
 * Deals with gotofile and searchinfiles
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Plugin = require("../cloud9.core/plugin");
var util = require("util");
var os = require("os");
var path = require("path"); // changed to fs in node 0.8

var agCmd, ackCmd, platform, arch, useAg = false, perlCmd;
var name = "search";

var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    platform = options.platform || os.platform();
    arch = options.arch || os.arch();
    agCmd = options.agCmd || path.join(__dirname, [platform, arch].join("_"), "/ag");
    useAg = path.existsSync(agCmd);
    ackCmd = options.ackCmd || "perl " + path.join(__dirname, "ack");
    perlCmd = options.perlCmd || "perl";

    if (!useAg)
        console.warn("No ag found for " + [platform, arch].join("_"));

    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, SearchPlugin, register);
};

var SearchPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = name;
    this.processCount = 0;
    this.pm = ProcessManager;
    this.eventbus = EventBus;
    this.basePath = ide.workspaceDir;
};

util.inherits(SearchPlugin, Plugin);

(function() {

    this.init = function() {
        var self = this;
        this.eventbus.on("search::filelist", function(msg) {
            if (msg.type == "shell-start")
                self.processCount += 1;
            else if (msg.type == "shell-exit")
                self.processCount -= 1;
            else if (msg.stream != "stdout")
                return;

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });

        this.eventbus.on("search::codesearch", function(msg) {
            if (msg.type == "shell-start") {
                self.processCount += 1;
                self.filecount = 0;
                self.count = 0;
                self.prevFile = null;
            }
            else if (msg.type == "shell-exit") {
                self.processCount -= 1;
            }

            msg = self.parseSearchResult(msg);

            if (msg)
                self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };

    this.command = function(user, message, client) {
        if (message.command !== "search")
            return false;

        var path = message.path;
        var type = message.type;

        if (message.path === null)
            return true;

        message.uri = path;
        message.path = this.basePath + (path ? "/" + path : "");

        var args;
        if (type === "codesearch")
            args = this.assembleSearchCommand(message);
        else if (type === "filelist")
            args = this.assembleFileListCommand(message);

        if (!args)
            return false;

        console.log(args.command + " " + args.join(" "));
        this.options = message;
        var self = this;
        this.pm.spawn("shell", {
            command: args.command,
            args: args,
            cwd: message.path,
            extra: type,
            encoding: "utf8"
        }, "search::" + type, function(err, pid) {
            if (err)
                self.error(err, 1, "Could not spawn " + args.command + " process for " + type, client);
        });

        return true;
    };

    this.assembleSearchCommand = function(options) {
        var args;

        var query = options.query;

        if (!query)
            return;

        if (useAg) {
            args = ["--nocolor",                             // don't color items
                    "-p", path.join(__dirname, ".agignore"), // use the Cloud9 ignore file
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
            
                // not sure why (perhaps due to piping?), but args must be redirected to
                // bash like this when replacing
                args.unshift(agCmd);
                args = ["-c", args.join(" ")];
                console.log(args)
                args.command = "bash";
            }
            else {
                args.command = agCmd;
            }
        }
        else {

        }

        return args;
    };

    this.parseSearchResult = function(msg) {
        if (msg.type == "shell-exit") {
            msg.data = {
                count: this.count,
                filecount: this.filecount
            };
            return msg;
        }

        var data = msg.data;
        console.log(data)
        if (typeof data !== "string" || data.indexOf("\n") === -1)
            return;

        var parts, file, lineno, result = "";
        var aLines = data.split(/([\n\r]+)/g);
        var count = 0;

        if (this.options) {
            for (var i = 0, l = aLines.length; i < l; ++i) {
                parts = aLines[i].split(":");

                if (parts.length < 3)
                    continue;

                var _path = parts.shift().replace(this.options.path, "").trimRight();
                file = encodeURI(this.options.uri + _path, "/");

                lineno = parseInt(parts.shift(), 10);
                    if (!lineno)
                        continue;

                    count += 1;

                if (file !== this.prevFile) {
                        this.filecount += 1;
                    if (this.prevFile)
                        result += "\n \n";

                    result += file + ":";
                    this.prevFile = file;
                }

                result += "\n\t" + lineno + ": " + parts.join(":");
            }
        }
        else {
            console.error("this.options object doesn't exist", msg);
        }

        this.count += count;
        msg.data = result;

        return msg;
    };

    this.assembleFileListCommand = function(options) {
        var args;

        if (!useAg) {
            args =["--nocolor", 
                   "-p", path.join(__dirname, ".agignore"), // use the Cloud9 ignore file
                   "-U",                                    // skip VCS ignores (.gitignore, .hgignore), but use root .agignore
                   "-l",                                    // filenames only
                   "-f",                                    // follow symlinks
                   "--search-binary"]                       // list binary files
                   
            if (options.showHiddenFiles)
                args.push("--hidden");
    
            if (options.maxdepth)
                args.push("--depth", options.maxdepth);

            args.push(".", options.path);

            args.command = agCmd;
        }
        else {
            args =["--nocolor", 
                   "-l",                                    // filenames only
                   "--follow",                              // follow symlinks
                   "--text",                                // list text files
                   "--binary"]                              // list binary files
                   
           /* if (options.showHiddenFiles)
                args.push("--hidden");
    
            if (options.maxdepth)
                args.push("--depth", options.maxdepth); */

            args.push(".", options.path);
            args.command = ackCmd;
        }

        return args;
    };

}).call(SearchPlugin.prototype);


// util

var escapeRegExp = function(str) {
    return str.replace(/([.*+?\^${}()|\[\]\/\\])/g, "\\$1");
};

var bashEscapeRegExp = function(str) {
    return str.replace(/[[\]{}()*+?.,\\^$|#\s"']/g, "\\$&");
};