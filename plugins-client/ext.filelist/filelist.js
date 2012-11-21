/**
 * File list for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");

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

    getFileList : function(retrieveNewFromServer, callback){
        var _self = this;

        if (!retrieveNewFromServer && this.cached)
            return callback(this.cached, apf.SUCCESS);

        this.queue.push(callback);
        if (this.retrieving)
            return;

        this.cached = "";
        apf.ajax(ide.apiPrefix + "/fs/list?path=&showHiddenFiles=0", {
            method: "GET",
            callback: function(data, state, extra) {
                _self.cached = data || extra.http.responseText;
                _self.retrieving = false;

                var queue = _self.queue;
                queue.forEach(function(cb){ cb(data, state) });

                _self.queue = [];
            }
        });
        this.retrieving = true;
    }
});
});
