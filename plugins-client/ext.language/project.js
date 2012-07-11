/**
 * Cloud9 Language Foundation, project analysis support
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var ide = require("core/ide");
var filelist = require("ext/filelist/filelist");
var filesystem = require("ext/filesystem/filesystem");

define(function(require, exports, module) {
    
    var isFSReady = false;
    var isSettingsReady = false;
    
    module.exports.hook = function() {
        var _self = this;

        ide.addEventListener("init.ext/filesystem/filesystem", function(e) {
            _self.model = e.ext.model;
            isFSReady = true;
            if (isSettingsReady)
                _self.initTree();
        });

        ide.addEventListener("settings.load", function(e) {
            isSettingsReady = true;
            // TODO: save/load settings
            if (isFSReady)
                _self.initTree();
        });
        
        ide.addEventListener("beforewatcherchange", function(){
            _self.dirty = true;
        });
    };

    var initTree = module.exports.initTree = function() {
        
        filelist.getFileList(true, function(data, state) {
            var files = data.split("\n");
            files.pop(); // remove trailing empty split() element
            var pathPrefix = ide.davPrefix.replace(/[\/]+$/, "");
            for (var i = 0; i < 1 /*files.length*/; i++) {
                var fullPath = pathPrefix + "/" + files[i];
                filesystem.readFile(fullPath, function(contents, response) {
                    console.log("the data", contents);
                });
            }
        });
        
    };
});