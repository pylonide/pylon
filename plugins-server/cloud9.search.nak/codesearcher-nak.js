/**
 * Codesearcher module for the Cloud9 IDE that uses nak
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var path = require("path");

module.exports = function setup(options, imports, register) {

  var codesearcher = {
      assembleFilelistCommand: function (options) {
        var args;

        args = ["-l",                                                     // filenames only   
                "-a", path.join(__dirname, "..", "cloud9.ide.search", ".nakignore")]; // use the Cloud9 ignore file                     
        
        if (options.showHiddenFiles)
            args.push("-H");

        if (options.maxdepth)
            args.push("-m", options.maxdepth);

        args.push(options.path);

        return args;
    },

      assembleSearchCommand: function(options) {
        var args, query = options.query;

        if (!query)
            return;

        args = ["-a", path.join(__dirname, "..", "cloud9.ide.search", ".nakignore")];  // use the Cloud9 ignore file

        if (!options.casesensitive)
            args.push("-i");

        if (options.wholeword)
            args.push("-w");

        if (options.hidden)
            args.push("-H");
            
        if (!options.regexp)
            args.push("-q");

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
                args.push("-G", options.pattern);

            if (excludes.length)
                args.push("--ignore", excludes.join(", "));
        }

        args.push( query );

        if (options.replaceAll && options.replacement)
            args.push( options.replacement );
        
        args.push(options.path);
        
        return args;
      }
   };

  if (!options.test)
    register(null, {codesearcher: codesearcher});
  else
    return codesearcher;
};