/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");

module.exports = ext.register("ext/sync/sync", {
    dev    : "Ajax.org",
    name   : "Sync",
    alone  : true,
    type   : ext.GENERAL,

    nodes : [],

    init : function(amlNode){
        var _self = this;

        // TEMPORARY
        window.tmpEnableSync = this.enableSync.bind(this);
        window.tmpDisableSync = this.enableSync.bind(this);
    },

    enableSync: function() {
        
//console.log("enable sync");



    },
    
    disableSync: function() {

//console.log("disable sync");
        
    }

});

});
