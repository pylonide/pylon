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
//var anims = require("ext/anims/anims");
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
                "class"  : "c9-sync-state-info",
                "margin" : "0 2 0 0"
            }), this.btnSyncStatus);
        }
        
        ext.initExtension(_self);
    },

    init : function(amlNode){
        var _self = this;
        
        var c = 0;
        this.nodes.push(
            menus.addItemByPath("Workspace/Pause Syncing", new apf.item({
                onclick : function(){
                    _self.setSync();
                }
            }), c += 100),
            menus.addItemByPath("Workspace/Open Synced Workspace", new apf.item({
                onclick : function(){
                    _self.setSync();
                }
            }), c += 100)
        );

        ide.addEventListener("socketMessage", function (event) {
            if (event.message.type === "sync") {
                _self.handleMessage(event.message);
            }
        });

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
                    _self.createProjectOnline(name, 0, 0, function(){
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
    },
    
    hideSyncInfo : function(long){
        this.syncInfoAvailable = false;
        
        clearTimeout(this.syncInfoHideTimer);
        this.syncInfoHideTimer = setTimeout(function(){
//            anims.animate(mnuSyncInfo, {
//                opacity : 0,
//                timingFunction : "linear",
//                duration : 0.2
//            }, function(){
//                apf.setOpacity(mnuSyncInfo.$ext, 1);
//                mnuSync.hide();
//            });
            mnuSyncInfo.hide();
        }, long ? 5000 : 500);
    },

	isFSNodeVisibleInTree : function(path){
		var xmlNode = fs.model.queryNode("//node()[@path=" 
            + util.escapeXpathString(path) + "]")
		if (!xmlNode) return false;
		
		var htmlNode = apf.xmldb.findHtmlNode(xmlNode, trFiles);
		if (!htmlNode) return false;
		
		return apf.getStyle(htmlNode.nextElementSibling, "display") == "block";
	},
	
	createFolderInTreeIfVisible : function(path){
		var file, li;
        do {
        	li   = path.lastIndexOf("/");
        	file = path.substr(li + 1);
        	path = path.substr(0, li);
        	
            if (this.isFSNodeVisibleInTree(path)) {
            	if (!fs.model.queryNode("//node()[@path=" 
            	  + util.escapeXpathString(path + "/" + file) + "]")) {
	            	fs.model.appendXml(fs.createFolderNodeFromPath(path + "/" + file), 
	              		"//node()[@path=" + util.escapeXpathString(path) + "]");
            	}
              	
              	break;
            }
        } while (path && path != ide.davPrefix);
	},

    handleMessage : function(message) {
        var _self = this;
            
        if (message.action === "notify") {
            var event = message.args.event;
            if (event.name === "enabled") {
                _self.syncEnabled = event.value;
                _self.btnSyncStatus.enable();
                
                if (_self.syncEnabled === true) {
                    _self.btnSyncStatus.setValue(true);
                    
                    if (!ide.local && typeof message.args.clients !== "undefined") {
                        _self.syncClients = message.args.clients;
                    }
                } 
                else {
                    _self.btnSyncStatus.setValue(false);
                }
            }
            else if (event.name === "status") {
                if (event.value == "synced" && mnuSyncInfo.visible) {
                    _self.hideSyncInfo();
                }
                
                // TODO: Update global sync status indicator.
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
        
        if (this.isFSNodeVisibleInTree(parentPath)) {
	        if (!fs.pathExists(parentPath))
	            fs.createFolderTree(parentPath);
	            
	        fs.model.appendXml(fs.createFileNodeFromPath(ide.davPrefix + path, 
	            { "modifieddate": mtime }), 
	            "//node()[@path=" + util.escapeXpathString(parentPath) + "]");
        }
        else {
        	this.createFolderInTreeIfVisible(parentPath);
        }
    },    
    
    moveSyncFile : function(oldPath, newPath) {
        var parentPath = ide.davPrefix + newPath.substring(0, newPath.lastIndexOf("/"));
        
        if (this.isFSNodeVisibleInTree(parentPath)) {
	        if (!fs.pathExists(parentPath))
	            fs.createFolderTree(parentPath);
	        
	        var file = fs.model.queryNode("//node()[@path=" 
	            + util.escapeXpathString(ide.davPrefix + oldPath) + "]");
	        var parent = fs.model.queryNode("//node()[@path=" 
	                + util.escapeXpathString(parentPath) + "]");
	
	        if (file) {
	            apf.xmldb.moveNode(parent, file);
	            fs.beforeMove(parent, file);
	        }
	        else
	            apf.xmldb.appendChild(parent, fs.createFileNodeFromPath(newPath));
        }
        else {
        	this.createFolderInTreeIfVisible(parentPath);
        }
    },
    
    removeSyncFile: function(path) {
        var p = ide.davPrefix + path;
        fs.model.removeXml("//node()[@path=" + util.escapeXpathString(p) + "]");
    },
    
    enableSync: function() {
        var _self = this;

        if (!ide.local) {
            // TODO: Show dialog with instructions on how to setup local version.
            console.log("TODO: Show dialog with instructions on how to setup local version.");
        }
        else {
            this.showSyncDialog(function(data){
                var found = false, name = cloud9config.projectName;
                var projects = data.projects;
                for (var i = 0, l = projects.length; i < l; i++) {
                    if (projects[i].name == name && !projects[i].local) {
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
        }
    },
    
    disableSync: function() {
        var _self = this;

        winConfirmSyncOff.close();
        
        var message = {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            data: "payload=" + encodeURIComponent(JSON.stringify({
	            localWorkspaceId: ide.workspaceId
	        })),
            async: true,
            callback: function( data, state, extra ) {
                if (state != apf.SUCCESS || JSON.parse(data).success !== true) {
                    return util.alert("Unable to disable syncing", "An error occurred while disabling sync", extra.http.responseText);
                }
                // Success. Nothing more to do. (UI sync state will update via socket.io push event)
                
                _self.btnSyncStatus.setValue(false);
            }
        };
        
        var url = "/api/sync/disable";
        
        if (!ide.local) {
        	message.type = "api";
        	message.url = "/api/sync/disable";

            console.error("TODO: Disable of sync when running in infra must call infra API instead of using `postMessage` as local runtime may not be connected. Otherwise disable event will get lost. Will implement once UI is finalized. If no `clientId` provided (from_self.syncClients) will disable sync for this project for all clients.");
            // this.sendMessageToLocal(message);
        }
        else
        	apf.ajax(url, message);
    },
    
    callbacks : [],
    queue : [],
    sendMessageToLocal : function(message){
    	var _self = this;
    	
    	if (message.callback) {
    		message.uid = this.callbacks.push(message.callback) - 1;
    		delete message.callback;
    	}
    	
    	if (!this.$iframe) {
    		window.addEventListener("message", function(e) {
    			try {
                    var json = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
                } catch (e) { return; }
                
                switch (json.type) {
                	case "connect":
                		_self.$iframe.connected = true;
                		_self.queue.forEach(function(message){
                			_self.$iframe.contentWindow.postMessage(message, "*");
                		});
                	break;
                	case "response":
                		if (_self.callbacks[json.uid])
                			_self.callbacks[json.uid](json.data, json.state, json.extra);
                	break;
                }
    		});
    		
    		this.$iframe = document.body.appendChild(document.createElement("iframe"));
    		this.$iframe.src = "http://localhost:13338/c9local/api-proxy.html";
    	}
    	
    	if (!this.$iframe.connected) {
    		this.queue.push(message);
    		return;
    	}
    	
    	this.$iframe.contentWindow.postMessage(message, "*");
    },
    
    showSyncDialog : function(callback){
        var _self = this;
        
        // User needs to select which project to sync.
        apf.ajax("/api/context/get", {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            async: true,
            callback: function( data, state, extra) {
                if (state != apf.SUCCESS) {
                    return util.alert("Unable to get available projects", "An error occurred while getting available projects for sync", extra.http.responseText);
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
    
    createProjectOnline : function(name, type, scm, callback){
        apf.ajax("/api/" + cloud9config.davPrefix.split("/")[1] 
          + "/" + name + "/create", {
            method: "PUT",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            data: "type=" + (type || "opensource") 
                + "&scm=" + (scm || "git")
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
    
    syncProject: function(onlineWorkspaceId){
    	var _self = this;
    	
        apf.ajax("/api/sync/enable", {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
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
                    
                    _self.showSyncInfo(true);
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
    
    setSync : function() {
        if (this.syncEnabled) {
            winConfirmSyncOff.show();
        }
        else {
            this.enableSync();
        }
    },

});

});