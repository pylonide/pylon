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
var fs = require("ext/filesystem/filesystem");

var markup = require("text!ext/sync/sync.xml");
var cssString = require("text!ext/sync/style.css");

module.exports = ext.register("ext/sync/sync", {
    name   : "Sync",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    markup : markup,
    nodes : [],

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

        if (!ide.local)
            return;
            
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
                if (cloud9config.debug)
                    console.log("[SYNC] file added", message.args.path, message.args.mtime);
                
                this.createSyncFile(message.args.path, message.args.mtime);
            }
            else if (message.args.event === "modified") {
                if (cloud9config.debug)
                    console.log("[SYNC] file modified", message.args.path, message.args.mtime);
            }
            else if (message.args.event === "moved") {
                if (cloud9config.debug)
                    console.log("[SYNC] file moved", message.args.oldPath, " -> ", message.args.path);
                
                this.moveSyncFile(message.args.oldPath, message.args.path);
            }
            else if (message.args.event === "removed") {
                if (cloud9config.debug)
                    console.log("[SYNC] file removed", message.args.path);
                
                this.removeSyncFile(message.args.path);
            }
        }
    },

    createSyncFile: function(path, mtime) {
        var ps = path.split("/"); 
        ps.pop();
        var p = ide.davPrefix + ps.join("/");
        
        var newDir = fs.model.queryNode("//node()[@path=" + util.escapeXpathString(p) + "]") === null;
        
        if (newDir) {
            this.createFolderTree(newDir, p);
        }
        
        fs.model.appendXml(fs.createFileNodeFromPath(path, { "modifieddate": mtime }), "//node()[@path=" + util.escapeXpathString(p) + "]");
    },
    
    createFolderTree : function(newDir, p) {
        if (newDir) { // this dir does not exist, keeping checking parents and make them first
            var dirsToMake = [];
            while (newDir) {
                dirsToMake.unshift(p);
                p = p.substr(0, p.lastIndexOf("/"));
                
                newDir = fs.model.queryNode("//node()[@path=" + util.escapeXpathString(p) + "]") === null;
            }
            
            dirsToMake.forEach(function(dir, idx, dirs) {
                var parentDir = "";
                if (idx > 0)
                    parentDir = dirs[idx - 1];
                else {
                    parentDir = dir.substring(0, dir.lastIndexOf("/"));
                }
                fs.model.appendXml(fs.createFolderNodeFromPath(dir), "//node()[@path=" + util.escapeXpathString(parentDir) + "]");
            });
        }
    },
    
    moveSyncFile : function(oldPath, newPath) {
        var root = "";
        
        // newPath is inside oldPath
        if (newPath.indexOf(oldPath) >= 0) {
            root = newPath.substring(0, newPath.indexOf(oldPath));
        }
        
        var prevThing = null;
        var dirs = oldPath.split("/");
        dirs.shift(); // dirs[0] element is blank
        
        // it's a whole list of dirs
        if (dirs.length > 1) {
            dirs.reverse();
            
            var list = oldPath;
            // construct folder heirarchy
            do {
                var newChild = "";
                
                var attr = { "oldpath" : ide.davPrefix + list };
                newChild = list.indexOf(".") >= 0 ? fs.createFileNodeFromPath(ide.davPrefix + list, attr) : newChild = fs.createFolderNodeFromPath(ide.davPrefix + list, attr);
                
                if (prevThing != null) {
                    newChild.appendChild(prevThing);
                    prevThing = newChild;
                }
                else
                    prevThing = newChild;
                    
                list = list.substr(0, list.lastIndexOf("/"));
            } while (list.length > 0);
        }
        else {
            prevThing = fs.createFileNodeFromPath(ide.davPrefix + oldPath);
        }
        
        if (prevThing.parentNode == null) {
            var workspaceNode = fs.createFolderNodeFromPath(ide.davPrefix);
            prevThing = workspaceNode.appendChild(prevThing);
        }
        
        var ps = newPath.split("/"); 
        ps.pop();
        var p = ide.davPrefix + ps.join("/");
        
        var newDir = fs.model.queryNode("//node()[@path=" + util.escapeXpathString(newPath) + "]") === null;
        
        if (newDir) {
            this.createFolderTree(newPath, p);
        }
        
        apf.xmldb.moveNode(fs.createFolderNodeFromPath(ide.davPrefix + root), prevThing);
    },
    
    removeSyncFile: function(path) {
        var p = ide.davPrefix + path;
        fs.model.removeXml("//node()[@path=" + util.escapeXpathString(p) + "]");
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
            if (project.local !== true) {
                xmlStr += '<project name="' + project.name + '" pid="' + (project.pid || "") 
                    + '" scm="' + (project.scm || "git") 
                    + '" desc="' + (project.desc || "") 
                    + '" tagline="' + (project.tagline || "") 
                    + '" url="' + (project.url || "") + '" />';
            }
        }
        xmlStr += "</projects>";
        return xmlStr;
    },
    
    syncProject: function(onlineWorkspaceId){
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
                        winCannotSync.show();
                    }
                }
            });
    },

    removeAndEnableSync: function() {
        alert("TODO");
        /*var workspaceChildren = fs.model.queryNode("//node()[@path='" + ide.davPrefix + "']").childNodes;
        
        workspaceChildren.forEach(function(el) {
            fs.model.removeXml("//node()[@path=" + el.getAttribute("path") + "]");
        });*/
    },
    
    disableSync: function() {
        var _self = this;

        if (!ide.local) {
            _self.displayMasterStatus();
            return;
        }
        
        winConfirmSyncOff.close();
        
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
            winConfirmSyncOff.show();
        }
        else {
            this.enableSync();
        }
    },

});

});