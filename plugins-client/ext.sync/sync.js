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
var util = require("core/util");

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
                    
                } else {

                    apf.setStyleClass(btnSyncStatus.$ext, "off", ["on"]);  
                    
                }
            }
        }
    },

    enableSync: function() {

        if (!ide.local) {
            console.error("You should never get here as sync toggle can only be switched if `ide.local === true` for now. i.e. Sync toggle should not show if `ide.local !== true`.");
            return;
        }

        // User needs to select which project to sync.
        apf.ajax("/api/context/get", {
            method: "POST",
            async: true,
            callback: function( data, state ) {
                if (state == apf.SUCCESS) {
                    data = JSON.parse(data);

                    // console.log("Projects", data.projects);

                    // TODO: In dialog present list of cloned online projects.
                    //       Once user selects close dialog and call `enable(onlineWorkspaceId)`
                    //       where `onlineWorkspaceId` is `data.projects[<selected>].label`.
                    //       User can also cancel dialog to abort.

                    enable("sync-test");

                } else {
                    // TODO: Display error?
                }
            }
        });        
        
        function enable(onlineWorkspaceId) {
            apf.ajax("/api/sync/enable", {
                method: "POST",
                data: "payload=" + encodeURIComponent(JSON.stringify({
                    localWorkspaceId: ide.workspaceId,
                    onlineWorkspaceId: onlineWorkspaceId
                })),
                async: true,
                callback: function( data, state ) {
                    if (state == apf.SUCCESS) {
                        data = JSON.parse(data);
                        if (data.success === true) {
                            // Success. Nothing more to do. (UI sync state will update via socket.io push event)
                        }
                        else if (data.workspaceNotEmpty === true) {
                            // TODO: Make dialog look better.
                            util.alert(
                                "Sync Error",
                                "Your workspace must be empty in order to start syncing with an online project! (Workspace dir may only contain settings file)"
                            );
                        }
                    } else {
                        // TODO: Display error?
                    }
                }
            });
        }
    },

    disableSync: function() {

        if (!ide.local) {
            console.error("You should never get here as sync toggle can only be switched if `ide.local === true` for now. i.e. Sync toggle should not show if `ide.local !== true`.");
            return;
        }

        // TODO: Show dialog to verify that sync should be disabled. Only disable if "YES". Ignore of "NO".

        apf.ajax("/api/sync/disable", {
            method: "POST",
            data: "payload=" + encodeURIComponent(JSON.stringify({
                localWorkspaceId: ide.workspaceId
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
        if (btnSyncStatus.$ext.getAttribute("class").indexOf("on") > -1) {
            this.disableSync();
        }
        else {
            this.enableSync();
        }
    },

});

});