/**
 * Synching for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var settings = require("ext/settings/settings");

var markup = require("text!ext/sync/sync.xml");
var cssString = require("text!ext/sync/style.css");

module.exports = ext.register("ext/sync/sync", {
    name   : "Sync",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,

    nodes : [],
    markup : markup,

    init : function(amlNode){
        var _self = this;

        ide.addEventListener("socketMessage", function (event) {
            if (event.message.type === "sync") {
                _self.handleMessage(event.message);
            }
        });

        apf.importCssString(cssString);
        
        ide.addEventListener("settings.load", function(e){ 
            settings.setDefaults("general", [
                ["synching", "true"]
            ]);
        });
        
        ide.addEventListener("localUpdateAvailable", function(e) { 
            apf.setStyleClass(logobar.$ext, "updateAvailable");
        });
        
        if (ide.local) {
            apf.setStyleClass(logobar.$ext, "local");
            
            var logoCorner = document.querySelector(".c9-mbar-cont");
            
            apf.setStyleClass(btnSyncStatus.$ext, "on");
            logoCorner.insertBefore(btnSyncStatus.$ext, logoCorner.childNodes[0]);
        }
    },
 
    handleMessage : function(message) {
        if (message.action === "notify") {
            var event = message.args.event;
            if (event.name === "enabled") {
                if (event.value === true) {

                    apf.setStyleClass(btnSyncStatus.$ext, "on", ["off"]);  
                    settings.model.setQueryValue("general/@synching", "true");
                    
                } else {

                    apf.setStyleClass(btnSyncStatus.$ext, "off", ["on"]);  
                    settings.model.setQueryValue("general/@synching", "false");
                    
                }
            }
        }
    },

    enableSync: function() {
        apf.ajax("/api/sync/enable", {
            method: "POST",
            data: "payload=" + encodeURIComponent(JSON.stringify({
                workspaceId: ide.workspaceId
            })),
            async: true,
            callback: function( data, state ) {
                if (state == apf.SUCCESS && JSON.parse(data).success === true) {
                    // Success. Nothing more to do. (UI sync state will update via socket.io push event)
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
                workspaceId: ide.workspaceId
            })),
            async: true,
            callback: function( data, state ) {
                if (state == apf.SUCCESS && JSON.parse(data).success === true) {
                    // Success. Nothing more to do. (UI sync state will update via socket.io push event)
                } else {
                    // TODO: Display error?
                }
            }
        });
    },
    
    setSync : function() {
        if (apf.isTrue(settings.model.queryValue("general/@synching"))) {
            this.disableSync();
        }
        else {
            this.enableSync();
        }
    },

});

});
