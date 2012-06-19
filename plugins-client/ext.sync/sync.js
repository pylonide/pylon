/**
 * Synching for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var util = require("core/util");
var settings = require("ext/settings/settings");
var menus = require("ext/menus/menus");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var anims = require("ext/anims/anims");
var tooltip = require("ext/tooltip/tooltip");

var markup = require("text!ext/sync/sync.xml");
var cssString = require("text!ext/sync/style.css");

cssString = cssString;

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
    
    hook : function(){
        var _self = this;
        
        if (ide.local || cloud9config.hosted) {
            apf.setStyleClass(logobar.$ext, "local");
            
            apf.importCssString(util.replaceStaticPrefix(cssString));
            
            this.btnSyncStatus = barExtras.appendChild(new apf.button({
                margin  : "1 0 0 0" ,
                "class" : "c9-sync" ,
                state   : "true",
                disabled : true,
                onclick : function(){
                    ext.initExtension(_self);
                    
                    if (this.value || _self.syncEnabled) {
                        _self.setSync();
                        
                        if (_self.syncEnabled)
                            this.setValue(true);
                    }
                    else
                        mnuSyncPrj.hide();
                }
            }));
            
            this.lblSyncState = barExtras.appendChild(new apf.label({
                "class"  : "c9-sync-state-info" 
                            + (ide.local ? " available-online" : ""),
                "margin" : "0 2 0 0"
            }), this.btnSyncStatus);
            
            ide.addEventListener("localOffline", function(){
                _self.btnSyncStatus.disable();
            });
            
            ide.addEventListener("localOnline", function(){
                _self.btnSyncStatus.enable();
            });
            
            ide.addEventListener("socketMessage", function (event) {
                if (event.message.type === "sync") {
                    _self.handleMessage(event.message);
                }
            });
        }
    },

    init : function(amlNode){
        var _self = this;
        
//        var c = 0;
//        this.nodes.push(
//            menus.addItemByPath("Workspace/Pause Syncing", new apf.item({
//                onclick : function(){
//                    _self.setSync();
//                }
//            }), c += 100),
//            menus.addItemByPath("Workspace/Open Synced Workspace", new apf.item({
//                onclick : function(){
//                    _self.setSync();
//                }
//            }), c += 100)
//        );

        tooltip.add(this.btnSyncStatus, {
            hideonclick : true,
            tooltip : mnuSyncInfo.$ext,
            getPosition : function(){
            	mnuSyncInfo.show();
            	
            	var pos = apf.getAbsolutePosition(_self.btnSyncStatus.$ext);
            	pos[0] -= mnuSyncInfo.getWidth() - _self.btnSyncStatus.getWidth();
            	pos[1] += _self.btnSyncStatus.getHeight();
            	return pos;
            },
            isAvailable : function(){
            	return !!_self.syncInfoAvailable;
            }
        });

        btnSyncOK.addEventListener("click", function(){
            if (ddSyncPrj.selected) {
                var xmlNode = ddSyncPrj.selected;
                var isNew = apf.isTrue(xmlNode.getAttribute("newws"));
                var name = xmlNode.getAttribute('name');
                
                cloud9config.syncProjectName = name;
                mnuSyncPrj.hide();
                
                if (isNew) {
                    _self.btnSyncStatus.disable();
                    
                    //Create Project
                    _self.createProject(name, 0, 0, function(){
                        //@todo if the user would refresh the browser in between
                        //      these two calls the sync information is lost
                        //      this might not be a problem because the project
                        //      will appear in the project list.
                        
                        //Start Sync
                        _self.syncProject(name);
                        
                        _self.btnSyncStatus.enable();
                    });
                }
                else {
                    _self.syncProject(name);;
                }
            }
        });
    },
    
    showSyncInfo : function(force){
        var _self = this;

        ext.initExtension(_self);

        if (_self.syncInfoTimer && !force || mnuSyncInfo.visible)
            return;
        
        clearTimeout(_self.syncInfoHideTimer);
        clearTimeout(_self.syncInfoTimer);
        _self.syncInfoAvailable = true;
        
        //_self.syncInfoTimer = setTimeout(function(){
            mnuSyncInfo.display(null, null, true, _self.btnSyncStatus);
            
//            if (!force)
//                _self.hideSyncInfo(true);
                
            delete _self.syncInfoTimer;
        //}, force ? 0 : 0);
    },
    
    updateSyncInfo : function(info){
        document.getElementById("syncFileName").innerHTML = info.path;
        syncProgressBar.setValue(info.progress || 0);
    },
    
    hideSyncInfo : function(long){
        this.syncInfoAvailable = false;
        
        clearTimeout(this.syncInfoHideTimer);
        this.syncInfoHideTimer = setTimeout(function(){
            anims.animate(mnuSyncInfo, {
                opacity : 0,
                timingFunction : "linear",
                duration : 0.2
            }, function(){
                apf.setOpacity(mnuSyncInfo.$ext, 1);
                mnuSyncInfo.hide();
            });
            mnuSyncInfo.hide();
        }, long ? 5000 : 500);
    },
	
    handleMessage : function(message) {
        var _self = this;
            
        if (message.action === "notify") {
            var event = message.args.event;
            if (event.name === "enabled") {
                _self.btnSyncStatus.enable();
                
                if (!event.value) {
                    _self.btnSyncStatus.setValue(_self.syncEnabled = false);
                    return;
                }
                
                if (ide.local)
                    _self.btnSyncStatus.setValue(_self.syncEnabled = true);
                else {
                    _self.syncClients = message.args.clients;
                    
                    this.getLocalId(function(err, localId){
                        if (err) {
                            // We can't determine which client is connected 
                            // so we'll show as connected
                            _self.btnSyncStatus.setValue(_self.syncEnabled = true);
                        }
                        else {
                            for (var name in _self.syncClients) {
                                if (_self.syncClients[name].mac == localId) {
                                    _self.btnSyncStatus.setValue(_self.syncEnabled = true);
                                    return;
                                }
                            }
                            _self.btnSyncStatus.setValue(_self.syncEnabled = false);
                        }
                    });
                }
            }
            else if (event.name === "status") {
                if (event.value == "synced" && self.mnuSyncInfo && self.mnuSyncInfo.visible) {
                    _self.hideSyncInfo();
                }
                
                if (cloud9config.debug)
                    console.log("[SYNC] STATUS", event.value);
            }
        }
        else if (message.action === "notify-file") {
            _self.showSyncInfo();
            _self.updateSyncInfo(message.args);
            
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
        var parentPath = ide.davPrefix + path.substring(0, path.lastIndexOf("/"));
        
        if (fs.isFSNodeVisibleInTree(parentPath)) {
	        if (!fs.pathExists(parentPath))
	            fs.createFolderTree(parentPath);
	            
	        fs.model.appendXml(fs.createFileNodeFromPath(ide.davPrefix + path, 
	            { "modifieddate": mtime }), 
	            "//node()[@path=" + util.escapeXpathString(parentPath) + "]");
        }
        else {
        	fs.createFolderInTreeIfVisible(parentPath);
        }
    },    
    
    moveSyncFile : function(oldPath, newPath) {
        var parentPath = ide.davPrefix + newPath.substring(0, newPath.lastIndexOf("/"));
        
        if (fs.isFSNodeVisibleInTree(parentPath)) {
	        if (!fs.pathExists(parentPath))
	            fs.createFolderTree(parentPath);
	        
	        var file = fs.model.queryNode("//node()[@path=" 
	            + util.escapeXpathString(ide.davPrefix + oldPath) + "]");
	        var parent = fs.model.queryNode("//node()[@path=" 
	                + util.escapeXpathString(parentPath) + "]");
	
			if (apf.getFilename(oldPath) != apf.getFilename(newPath))
				fs.beforeRename(file, null, newPath);
	
	        if (file) {
	            apf.xmldb.moveNode(parent, file);
	            fs.beforeMove(parent, file);
	        }
	        else
	            apf.xmldb.appendChild(parent, fs.createFileNodeFromPath(newPath));
        }
        else {
        	fs.createFolderInTreeIfVisible(parentPath);
        }
    },
    
    removeSyncFile: function(path) {
        var p = ide.davPrefix + path;
        fs.model.removeXml("//node()[@path=" + util.escapeXpathString(p) + "]");
    },
    
    enableSync: function() {
        var _self = this;

        this.showSyncDialog(function(data){
            var found = false, name = cloud9config.projectName;
            var projects = data.projects;
            for (var i = 0, l = projects.length; i < l; i++) {
                if (projects[i].name == name && projects[i].local == ide.local) {
                    found = projects[i];
                    break;
                }
            }
            
            if (found) {
                var xmlNode = ddSyncPrj.queryNode("node()[@name='" + name + "']");
            }
            else {
                var xmlNode = apf.getXml(_self.createSyncProjectXml({
                    name : name
                }));
                xmlNode.setAttribute("newws", "true");
                
                xmlNode = apf.xmldb.appendChild(mdlSyncPrj.data,
                    xmlNode, mdlSyncPrj.data.firstChild);
            }
            ddSyncPrj.select(xmlNode);
        });
    },
    
    disableSync: function() {
        var _self = this;

        winConfirmSyncOff.close();
        
        this.sendMessageToLocal("/api/sync/disable", {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            data: "payload=" + encodeURIComponent(JSON.stringify({
	            localWorkspaceId: ide.workspaceId
	        })),
            async: true,
            callback: function( data, state, extra ) {
                if (state != apf.SUCCESS || JSON.parse(data).success !== true) {
                    return util.alert("Unable to disable syncing", 
                        "An error occurred while disabling sync", 
                        extra.http.responseText);
                }
                // Success. Nothing more to do. (UI sync state will update via socket.io push event)
                
                _self.btnSyncStatus.setValue(false);
            }
        });
    },
    
    sendMessageToLocal : function(url, message){
        var _self = this;
        
        if (ide.local)
            return apf.ajax(url, message);
        
        this.getLocalId(function(err, localId){
            if (err) {
                _self.showInstallLocal();
            }
            else if (localId) {
                apf.ajax(url + "?localid=" + encodeURIComponent(localId), message);
            }
        });
    },
    
    showInstallLocal : function(){
        var xml = new apf.getXml("<clients />"), doc = xml.ownerDocument, c;
        var found = false;
        for (var prop in this.syncClients) {
            c = xml.appendChild(doc.createElement("client"));
            c.setAttribute("name", prop);
            c.setAttribute("mac", this.syncClients.mac);
            found = true;
        }
        mdlSyncClients.load(xml);
        
        vboxSyncRemoveLocal.setAttribute("visible", found);
        vboxSyncInstall.setAttribute("visible", !found);
        
        mnuInstallLocal.display(null, null, true, this.btnSyncStatus);
    },
    
    /**
     * This function retrieves the mac address of the local client that is 
     * installed. This function cashes the result so that the callback is only
     * called async once when the client was already running. If it wasn't 
     * running it will retry until the client is running.
     */
    getLocalId : function(callback){
        //callback(null, "this-is-my-mac-address");
        
        callback(new Error("message"));
    },
    
    showSyncDialog : function(callback){
        var _self = this;
        
        // User needs to select which project to sync.
        this.sendMessageToLocal("/api/context/get", {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            async: true,
            callback: function( data, state, extra) {
                if (state != apf.SUCCESS) {
                    return util.alert("Unable to get available projects", 
                        "An error occurred while getting available projects for sync", 
                        extra.http.responseText);
                }

                data = JSON.parse(data);
                mdlSyncPrj.load(apf.getXml(_self.createSyncProjectsXml(data.projects)));
                
                mnuSyncPrj.display(null, null, false, _self.btnSyncStatus);
                
                mnuSyncPrj.addEventListener("prop.visible", function(e){
                    if (!e.value && !cloud9config.syncProjectName)
                        _self.btnSyncStatus.setValue(false);
                    mnuSyncPrj.removeEventListener("prop.visible", arguments.callee);
                });
                
                callback(data);
            }
        });
    },
    
    createProject : function(name, type, scm, callback){
        this.sendMessageToLocal("/api/" + cloud9config.davPrefix.split("/")[1] 
          + "/" + name + "/create", {
            method: "PUT",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            data: "type=" + (type || "opensource") 
                + "&scm=" + (scm || "git")
                + "&local=" + (!ide.local)
                + "&servertype=shared&members=1", //&visibility=public
            async: true,
            callback: function( data, state, extra) {
                if (state != apf.SUCCESS) {
                    return util.alert("Unable to enable sync", 
                        "An error occurred while creating new workspace '" 
                            + name + "'", extra.http.responseText);
                }
                
                data = JSON.parse(data);
                
                callback();
            }
        });
    },
    
    createSyncProjectsXml: function(projects){
        var xmlStr = "<projects>"; 
        var project;
        for (var i = 0; i < projects.length; i++) {
            project = projects[i];
            if (project.local !== true && project.syncEnabled !== true) {
                xmlStr += this.createSyncProjectXml(project);
            }
        }
        xmlStr += "</projects>";
        return xmlStr;
    },
    
    createSyncProjectXml : function(project) {
       return '<project name="' + project.name + '" pid="' + (project.pid || "") 
                    + '" scm="' + (project.scm || "git") 
                    + '" desc="' + (project.desc || "") 
                    + '" tagline="' + (project.tagline || "") 
                    + '" url="' + (project.url || "") + '" />';
    },
    
    syncProject: function(onlineWorkspaceId, master){
    	var _self = this;
    	
        if (!onlineWorkspaceId)
            onlineWorkspaceId = this.lastOnlineWorkspaceId;
        else
            this.lastOnlineWorkspaceId = onlineWorkspaceId;
        
        this.sendMessageToLocal("/api/sync/enable", {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            data: "payload=" + encodeURIComponent(JSON.stringify({
                localWorkspaceId: ide.workspaceId,
                onlineWorkspaceId: onlineWorkspaceId,
                master: master /* this is "local" or "remote" */
            })),
            async: true,
            callback: function( data, state, extra) {
                if (state != apf.SUCCESS) {
                    return util.alert("Unable to enable sync", "An error occurred while sync for project " + onlineWorkspaceId, extra.http.responseText);
                }
                
                data = JSON.parse(data);
                if (data.success === true) {
                    // Success. Nothing more to do. (UI sync state will update via socket.io push event)
                    
                    _self.showSyncInfo(true);
                    syncProgressBar.setValue(0)
                }
                //@todo I propose to rename to workspacesNotEmpty
                else if (data.workspaceNotEmpty === true) {
                    winCannotSync.show();
                    _self.btnSyncStatus.setValue(false);
                }
            }
        });
    },

    setSync : function() {
        var _self = this;
        
        if (this.syncEnabled) {
            if (ide.local) 
                winConfirmSyncOff.show();
            else {
                this.getLocalId(function(err, localId){
                    if (err) {
                        _self.showInstallLocal();
                        _self.btnSyncStatus.setValue(true);
                    }
                    else
                        winConfirmSyncOff.show();
                });
            }
        }
        else {
            this.enableSync();
        }
    },

});

});