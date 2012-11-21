/**
 * auto test Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var noderunner = require("ext/noderunner/noderunner");
var fs = require("ext/filesystem/filesystem");

module.exports = ext.register("ext/autotest/autotest", {
    name    : "autotest",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    autodisable : ext.ONLINE | ext.LOCAL,
    
    hook : function() {
        ide.addEventListener("afterfilesave", function(e) {
            // We don't want to run tests if it is an auto-save.
            if (e.silentsave === true) {
                return;
            }
            
            var node = e.node;
            var path = node.getAttribute("path");
            var m = path.match(/^.*(_test|Test)\.js$/);
            
            if (m) {
                run(path);
            }
            else {
                var testPath = path.replace(/\.js$/, "_test.js");
                if (path == testPath) {
                    return;
                }
                
                fs.exists(testPath, function(exists) {
                    if (exists)
                        run(testPath);
                        
                    testPath = path.replace(/\.js$/, "Test.js");
                    if (path == testPath) return;
                    fs.exists(testPath, function(exists) {
                        if (exists)
                            run(testPath);
                    });
                });
            }
            
            function run(path) {
                path = path.slice(ide.davPrefix.length + 1).replace("//", "/");
                noderunner.run(path, [], false);
            }
        });
    }
});

});