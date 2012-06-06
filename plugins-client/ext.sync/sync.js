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
        window.tmpDisableSync = this.disableSync.bind(this);
    },

    enableSync: function() {
        apf.ajax("/api/sync/enable", {
            method: "POST",
            data: "payload=" + encodeURIComponent(JSON.stringify({
                workspaceId: window.cloud9config.workspaceId
            })),
            async: true,
            callback: function( data, state ) {
                if (state == apf.SUCCESS && JSON.parse(data).success === true) {
                    // Success. Nothing more to do.
                } else {
                    // TODO: Display error?
                }
            }
        });
    },

    disableSync: function() {
        apf.ajax("/api/sync/disable", {
            method: "POST",
            data: "payload=" + encodeURIComponent(JSON.stringify({
                workspaceId: window.cloud9config.workspaceId
            })),
            async: true,
            callback: function( data, state ) {
                if (state == apf.SUCCESS && JSON.parse(data).success === true) {
                    // Success. Nothing more to do.
                } else {
                    // TODO: Display error?
                }
            }
        });
    }

});

});
