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

    syncEnabled: undefined,

    // Only applicable if running in infra.
    syncClients: {},

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
        var _self = this;

        if (message.action === "notify") {
            var event = message.args.event;
            if (event.name === "enabled") {
                _self.syncEnabled = event.value;
                if (_self.syncEnabled === true) {
                    apf.setStyleClass(btnSyncStatus.$ext, "on", ["off"]);  
                    if (!ide.local && typeof message.args.clients !== "undefined") {
                        _self.syncClients = message.args.clients;
                    }
                } else {
                    apf.setStyleClass(btnSyncStatus.$ext, "off", ["on"]);  
                }
            }
            else if (event.name === "status") {
                // TODO: Update global sync status indicator.
                console.log("[SYNC] STATUS", event.value);
            }
        }
        else if (message.action === "notify-file") {
            if (message.args.event === "added") {
                // TODO: Update tree & reload file if open.
                console.log("[SYNC] file added", message.args.path, message.args.mtime);
            }
            else if (message.args.event === "modified") {
                // TODO: Update tree & reload file if open.
                console.log("[SYNC] file modified", message.args.path, message.args.mtime);
            }
            else if (message.args.event === "moved") {
                // TODO: Update tree & reload file if open.
                console.log("[SYNC] file moved", message.args.oldPath, " -> ", message.args.path);
            }
            else if (message.args.event === "removed") {
                // TODO: Update tree & reload file if open.
                console.log("[SYNC] file removed", message.args.path);
            }
        }
    },

    displayMasterStatus: function() {
        var _self = this;

        if (_self.syncEnabled === true) {
            // TODO: Show dialog listing clients (`_self.syncClients`) configured to sync this workspace and their respective sync status (`_self.syncClients[].status`).
            console.log("TODO: Show dialog listing clients configured to sync this workspace and their respective sync status.", _self.syncClients);
        }
        else if (_self.syncEnabled === false) {
            // TODO: Show dialog with instructions on how to setup local version.
            console.log("TODO: Show dialog with instructions on how to setup local version.");
        }
        else {
            // Do nothing as we don't know if sync is enabled or disabled yet
            // (sync toggle should be grayed out and not be clickable at all so we should never get here in the first place).
        }
    },

    enableSync: function() {
        var _self = this;

        if (!ide.local) {
            _self.displayMasterStatus();
            return;
        }

        // User needs to select which project to sync.
        apf.ajax("/api/context/get", {
            method: "POST",
            async: true,
            callback: function( data, state, extra) {
                if (state != apf.SUCCESS) {
                    return util.alert("Unable to get available projects", "An error occurred while getting available projects for sync", extra.http.responseText);
                }

                data = JSON.parse(data);
                mdlSyncPrj.load(apf.getXml(_self.createSyncProjectsXml(data.projects)))
                winSyncPrj.show();
            }
        });        
    },
    
    createSyncProjectsXml: function(projects){
        var xmlStr = "<projects>"; 
        var project;
        for(var i = 0; i < projects.length; i++) {
            project = projects[i];
            xmlStr += '<project name="' + project.name + '" pid="' + (project.pid || "") 
                + '" scm="' + (project.scm || "git") 
                + '" desc="' + (project.desc || "") 
                + '" tagline="' + (project.tagline || "") 
                + '" url="' + (project.url || "") + '" />';
        }
        
        xmlStr += "</projects>";
        return xmlStr;
    },
    
    syncProjecct: function(onlineWorkspaceId){
        apf.ajax("/api/sync/enable", {
                method: "POST",
                data: "payload=" + encodeURIComponent(JSON.stringify({
                    localWorkspaceId: ide.workspaceId,
                    onlineWorkspaceId: onlineWorkspaceId
                })),
                async: true,
                callback: function( data, state, extra) {
                    if (state != apf.SUCCESS) {
                        return util.alert("Unable to enable sync", "An error occurred while sync for project " + onlineWorkspaceId, extra.http.responseText);
                    }
                    
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
                }
            });
    },

    disableSync: function() {
        var _self = this;

        if (!ide.local) {
            _self.displayMasterStatus();
            return;
        }

        // TODO: Show dialog to verify that sync should be disabled. Only disable if "YES". Ignore of "NO".

        apf.ajax("/api/sync/disable", {
            method: "POST",
            data: "payload=" + encodeURIComponent(JSON.stringify({
                localWorkspaceId: ide.workspaceId
            })),
            async: true,
            callback: function( data, state, extra ) {
                if (state != apf.SUCCESS || JSON.parse(data).success !== true) {
                    return util.alert("Unable to disable syncing", "An error occurred while disabling sync", extra.http.responseText);
                }
                // Success. Nothing more to do. (UI sync state will update via socket.io push event)
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