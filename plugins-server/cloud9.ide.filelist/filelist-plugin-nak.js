/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Path = require("path");

module.exports = function(nakCmd) {
    this.assembleCommand = function(options) {
        var args;

        args = ["-l",                                                     // filenames only   
                "-p", Path.join(__dirname, "..", "cloud9.ide.search", ".agignore")]; // use the Cloud9 ignore file                     
        
        if (options.showHiddenFiles)
            args.push("-H");

        if (options.maxdepth)
            args.push("-m", options.maxdepth);

        args.push(options.path);

        args.unshift(nakCmd);
        args = ["-c", args.join(" ")];

        args.command = "bash";

        return args;
    }
};