/**
 * Codesearcher module for the Cloud9 IDE that uses ag
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var path = require("path");

module.exports = function setup(options, imports, register) {
  var agCmd = options.agCmd, nakCmd = options.nakCmd,

  // taken from http://xregexp.com/
  $escapeRegExp = function(str) {
    return str.replace(/[[\]{}()*+?.,\\^$|#\s"']/g, "\\$&");
  },

  $convertFromWildcard = function(pattern) {
    // remove all whitespace
    pattern = pattern.replace(/\s/g, "");

    pattern = $escapeRegExp(pattern);

    // convert wildcard norms to regex ones     
    pattern = pattern.replace(/\\\*/g, ".*");
    pattern = pattern.replace(/\\\?/g, ".");

    // we wants pipe seperation, not commas
    // (this is a regexp list with ORs)
    pattern = pattern.replace(/\\,/g, "|");

    return pattern;
  }

  var codesearcher = {
      assembleFilelistCommand: function (options) {
        var args;

        args = ["--nocolor", 
               "-p", path.join(__dirname, "..", "cloud9.ide.search", ".agignore"), // use the Cloud9 ignore file
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
    
      },
      assembleSearchCommand: function(options) {
        var args, query = options.query;

        if (!query)
            return;

        args = ["--nocolor",                             // don't color items
                "-p", path.join(__dirname, "..", "cloud9.ide.search", ".agignore"), // use the Cloud9 ignore file
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

            // the user gives us a wildcard pattern,
            // but ag uses regexps for matching includes; convert them!
            // (we're not using regexps here because it's too
            // complicated to convey to the user--most people will try
            // "*.txt" instead of ".*\.txt")
            if (includes.length > 0)
                args.push("-G", $convertFromWildcard(includes.join(",")));

            // frustratingly, ag's rules for excludes DO use
            // wildcards...
            if (excludes.length) {
                excludes.forEach(function (exclude) {
                    args.push("--ignore", exclude);
                });
            }
        }    

        args.push(query, options.path);

        if (options.replaceAll) {
            if (!options.replacement)
                options.replacement = "";

            // pipe the results into nak, which we can do the replace/format and is guaranteed to exist
            args.push("-l | ", nakCmd + " --c9Format --piped '" + options.query + "' '" + options.replacement + "'");
                  
            // see "nodeception" note below on why we do this
            args.unshift(agCmd);
            args = ["-c", args.join(" ")];
            args.command = "bash";
        }
        else {
            args.command = agCmd;
        }

        return args;
      }
   };

  if (!options.test) {
    register(null, {codesearcher: codesearcher});
  }
  else
    return codesearcher;
};