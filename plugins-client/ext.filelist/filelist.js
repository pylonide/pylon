/**
 * HTML Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

/**
 * Keeps a record of all files in the repository
 * 
 * In the future the filelist could keep track of all changes from the watcher
 * and locally to update the file list. It would then only need to refresh 
 * after CLI commands and other running processs. This would be purely an 
 * optimization.
 */
module.exports = ext.register("ext/filelist/filelist", {
    name  : "File List",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    alone : true,
    queue : [],
    autodisable : ext.ONLINE | ext.LOCAL,
    
    init : function(){
        var _self = this;
    },
    
    getFileList : function(retrieveNewFromServer, callback){
        if (!retrieveNewFromServer && this.cached)
            return callback(this.cached, apf.SUCCESS);
    
        if (this.retrieving)
            return this.queue.push(callback);
    
        var _self = this;
        davProject.report(ide.davPrefix, 'filelist', {
            showHiddenFiles: "1" //apf.isTrue(settings.model.queryValue("auto/projecttree/@showhidden"));
          }, 
          function(data, state, extra){
            if (state == apf.ERROR) {
                if (data && data.indexOf("jsDAV_Exception_FileNotFound") > -1) {
                    return callback(null, state);
                }

                //@todo
                return;
            }
            if (state == apf.TIMEOUT)
                return callback(null, state); //@todo

            _self.cache = data;
            callback(data, state);
            
            var queue = _self.queue;
            _self.queue = [];
            _self.retrieving = false;
            
            queue.forEach(function(cb){ cb(data, state) });
        });
        
        this.retrieving = true;
    },

    enable : function() {
    },

    disable : function(){
    },

    destroy : function(){
    }
});
});
