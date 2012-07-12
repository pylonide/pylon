/**
 * Cloud9 Language Foundation, project analysis support
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var ide = require("core/ide");
var filelist = require("ext/filelist/filelist");

define(function(require, exports, module) {
    
    var isFSReady = false;
    var isSettingsReady = false;
    
    module.exports.hook = function(oExt, worker) {
        this.worker = worker;
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
        var _self = this;
        
        filelist.getFileList(true, function(data, state) {
            var files = data.split("\n");
            files.pop(); // remove trailing empty split() element
            var pathPrefix = ide.davPrefix.replace(/[\/]+$/, "");
            var filtered = [];
            for (var i = 0; i < files.length; i++) {
                var path = files[i];
                if (path[1] && path[0] === "." && path[1] === "/")
                    path = path.substr(2);
                path = pathPrefix + "/" + path;
                // TODO: filter; determine if already "seen"
                filtered.push({ path: path, eventType: "init"});
            }
            _self.worker.emit("onFileUpdates", { data : { paths: filtered } });
        });
        
    };
});