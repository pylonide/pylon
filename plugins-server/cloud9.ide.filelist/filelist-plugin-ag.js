/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Path = require("path");

module.exports = function(agCmd) {
    this.assembleCommand = function(options) {
        var args;

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

        args.command = agCmd;

        return args;
    }
};