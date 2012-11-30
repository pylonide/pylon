/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Fs = require("fs");
var Path = require("path");

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
            return true;
            
        options.uri = path;
        options.path = Path.normalize(this.env.basePath + (path ? "/" + path : ""));
        // if the relative path FROM the workspace directory TO the requested path
        // is outside of the workspace directory, the result of Path.relative() will
        // start with '../', which we can trap and use:
        if (Path.relative(this.env.basePath, options.path).indexOf("../") === 0)
            return false;

        var args = this.env.searchType.assembleSearchCommand(options);

        if (!args)
            return false;

        this.options = options;
        var self = this;

        if (this.activeProcess)
            this.activeProcess.kill("SIGKILL");


        var nakstream = Fs.createReadStream(Path.normalize(__dirname + "/../../node_modules/nak/build/nak.vfs_concat.js"));

        vfs.extend("nak_search", {stream: nakstream, redefine: true}, function (err, meta) {
            if (err) throw err;
            var api = meta.api;
            
            api.execute(args, function (err, result) {
                if (err) return onExit(1, err);

                if (/^Found/.test(result)) {
                    // fetch the "Found %d matches in %d files" result
                    var tally = result.match(/\d+/g);

                    onExit(0, null, {data: result, count: tally[0], filecount: tally[1]});
                }
                    
                else
                    onData({data: result});
            });
        });

        return true;
    };
};
