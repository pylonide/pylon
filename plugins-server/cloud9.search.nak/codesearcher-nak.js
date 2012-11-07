/**
 * Codesearcher module for the Cloud9 IDE that uses nak
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var path = require("path");

module.exports = function setup(options, imports, register) {
  var nakCmd = options.nakCmd;

  var codesearcher = {
      assembleFilelistCommand: function (options) {
        var args;

        args = ["-l",                                                     // filenames only   
                "-p", path.join(__dirname, "..", "cloud9.ide.search", ".agignore")]; // use the Cloud9 ignore file                     
        
        if (options.showHiddenFiles)
            args.push("-H");

        if (options.maxdepth)
            args.push("-m", options.maxdepth);

        args.push(options.path);

        args.unshift(nakCmd);
        args = ["-c", args.join(" ")];

        args.command = "bash";

        return args;
    },

      assembleSearchCommand: function(options) {
        var args, query = options.query;

        if (!query)
            return;

        args = ["-p", path.join(__dirname, "..", "cloud9.ide.search", ".agignore"),  // use the Cloud9 ignore file
                "--c9Format"];                            // format for parseResult to consume

        if (!options.casesensitive)
            args.push("-i");

        if (options.wholeword)
            args.push("-w");

        if (options.hidden)
            args.push("-H");
            
        if (!options.regexp)
            args.push("-q");

        // see above notes on ag for discussion about pattern handling
        if (options.pattern) {
            var includes = [], excludes = [];

            // strip whitespace, grab out exclusions
            options.pattern.split(",").forEach(function (p) {
                // strip whitespace
                p = p.replace(/\s*/g, "");

                if (/^\-/.test(p))
                    excludes.push(p.substring(1));
                else
                    includes.push(p);
            });

            // wildcard handling will be done in nak
            if (includes.length)
                args.push("-G", "'" + options.pattern + "'");

            if (excludes.length) {
                args.push("--ignore", "'" + excludes + "'");
            }
        }

        args.push("'" + query + "'");

        if (options.replaceAll && options.replacement) {
            if (!options.replacement)
                options.replacement = "";

            // nak naturally suports find/replace, so no piping needed!
            args.push("'" + options.replacement + "'");
        }
        
        args.push(options.path);
        
        // since we're actually calling a node binary (from a node program--nodeception!)
        // we need to launch the script via bash and act as though the command is a string
        args.unshift(nakCmd);
        args = ["-c", args.join(" ")];
        args.command = "bash";

        return args;
      }
   };

  if (!options.test) {
    register(null, {codesearcher: codesearcher});
  }
  else
    return codesearcher;
};