/**
 * Filelist module for the Cloud9 IDE
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
            return onExit(1, "Invalid path");

        options.uri = path;
        options.path = Path.normalize(this.env.basePath + (path ? "/" + path : ""));
        // if the relative path FROM the workspace directory TO the requested path
        // is outside of the workspace directory, the result of Path.relative() will
        // start with '../', which we can trap and use:
        if (Path.relative(this.env.basePath, options.path).indexOf("../") === 0)
            return onExit(1, "Invalid path");

        var args = this.env.searchType.assembleFilelistCommand(options);

        if (!args)
            return onExit(1, "Invalid arguments");

        var nakstream = Fs.createReadStream(Path.normalize(__dirname + "/../../node_modules/nak/build/nak.vfs_concat.js"));

        vfs.extend("nak_filelist", {stream: nakstream, redefine: true}, function (err, meta) {
            if (err) throw err;
            var api = meta.api;
            
            api.execute(args, function (err, result) {
                if (err) return onExit(1, err);

                onData(result);
                onExit(0, null);
            });
        });
    };
};
