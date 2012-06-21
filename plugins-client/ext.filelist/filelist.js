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

    init : function(){
    },

    onMessage : function(e) {
        var message = e.message;
        if (message.extra != "filelist")
            return false;

        if (message.type == "shell-data") {
            this.cached += message.data;
            return true;
        } else if (message.type == "shell-exit") {
            var state = message.code == 0 ? apf.SUCCESS : apf.ERROR;
            var data = this.cached;

            var queue = this.queue;
            this.queue = [];
            this.retrieving = false;

            queue.forEach(function(cb){ cb(data, state) });

            ide.removeEventListener("socketMessage", this.$onMessage);
            this.$onMessage = null;
        }
        return true;
    },

    getFileList : function(retrieveNewFromServer, callback){
        if (!retrieveNewFromServer && this.cached)
            return callback(this.cached, apf.SUCCESS);

        this.queue.push(callback);
        if (this.retrieving)
            return;

        if (!this.$onMessage) {
            this.$onMessage = this.onMessage.bind(this)
            ide.addEventListener("socketMessage", this.$onMessage);
        }

        this.cached = "";
        ide.send({
            command: "search",
            type: "filelist",
            path: ide.davPrefix,
            showHiddenFiles: true //apf.isTrue(settings.model.queryValue("auto/projecttree/@showhidden"))
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
