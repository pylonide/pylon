/**
 * Syncing for the Cloud9 IDE
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
var watcher = require("ext/watcher/watcher");

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
        
        if (ide.local) {
            apf.setStyleClass(logobar.$ext, "local");
        }
        
        apf.importCssString(util.replaceStaticPrefix(cssString));

        if (ide.local || cloud9config.hosted) {
            this.nodes.push(
                this.lblSyncState = menus.$insertByIndex(barExtras, new apf.label({
                    "class"  : "c9-sync-state-info" 
                                + (ide.local ? " available-online" : ""),
                    "margin" : "3 2 0 0"
                }), 10),
                this.btnSyncStatus = menus.$insertByIndex(barExtras, new apf.button({
                    id      : "btnSync",
                    margin  : "3 0 0 0" ,
                    width   : "60",
                    height  : "19",
                    "class" : "c9-sync",
                    state   : "true",
                    disabled : true,
                    onclick : function() {
                        ext.initExtension(_self);
                        
                        if (this.value) {
                            winThisIsBeta.show();
                        }
                        else {
                            mnuSyncPrj.hide();
                            mnuInstallLocal.hide();
                            if (_self.syncIntervalId) {
                                clearInterval(_self.syncIntervalId);
                                _self.syncIntervalId = null;
                            }
                        }
                    }
                }), 11)
            );
            
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
            
//            ide.addEventListener("init.ext/tree/tree", function(){
//                _self.btnSyncStatus.addEventListener("onprop.value", function(e){
//                    if (e.value) {
//                        if (!_self.cssBindRule) {
//                            _self.cssBindRule = apf.document.createElementNS(apf.ns.aml, "css");
//                            _self.cssBindRule.setAttribute("match", "[node()[@syncstate]]");
//                            _self.cssBindRule.setAttribute("value", "[@syncstate]");
//                        }
//                        trFiles.firstChild.appendChild(_self.cssBindRule);
//                    }
//                    else {
//                        if (_self.cssBindRule)
//                            _self.cssBindRule.parentNode.removeChild(_self.cssBindRule);
//                    }
//                });
//                
//                trFiles.addEventListener("beforeinsert", function(e){
//                    if (!_self.btnSyncStatus)
//                        return;
//                    
//                    var nodes = e.xmlNode.childNodes;
//                    for (var i = 0, l = nodes.length; i < l; i++) {
//                        nodes[i].setAttribute("syncstatus", 
//                            _self.getSyncStatus(nodes[i]));
//                    }
//                });
//            });
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
                _self.btnSyncStatus.setValue(true);  
                
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
                    _self.syncProject(name);
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
        
        _self.syncInfoTimer = setTimeout(function(){
            mnuSyncInfo.display(null, null, true, _self.btnSyncStatus);
            
//            if (!force)
//                _self.hideSyncInfo(true);
                
            delete _self.syncInfoTimer;
        }, force ? 0 : 1000);
    },
    
    updateSyncInfo : function(info){
        document.getElementById("syncFileName").innerHTML = info.path;
        syncProgressBar.setValue(info.progress || 0);
    },
    
    hideSyncInfo : function(long){
        this.syncInfoAvailable = false;
        
        clearTimeout(this.syncInfoHideTimer);
        clearTimeout(this.syncInfoTimer);
        
        //if (mnuSyncInfo.visible)
        //   return;
        
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
                            for (var macAddress in _self.syncClients) {
                                if (macAddress === localId) {
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
                if (event.value == "synced" && self.mnuSyncInfo) {
                    _self.hideSyncInfo();
                    
                    //Reset all syncstate attributes in the tree.
                    /*var nodes = fs.model.queryNode("//node()[not(@syncstate='synced')]");
                    Array.protototype.forEach.call(nodes, function(node){
                        apf.xmldb.setAttribute(node, "syncstate", "synced");
                    });*/
                }
                
                if (cloud9config.debug)
                    console.log("[SYNC] STATUS", event.value);
            }
        }
        else if (message.action === "notify-file") {
            var options = message.args;
            
            if (ide.dispatchEvent("beforewatcherchange", {
                subtype : ({"added":"create","removed":"remove","modified":"change"})[options.event],
                path    : options.path,
                //@todo Why are these messages in a different format from the watcher's?
            }) === false)
                return;
            
            var state = options.status;
            
            _self.showSyncInfo();
            _self.updateSyncInfo(options);
            
            var fileNode;
            if (options.event === "added") {
                fileNode = fs.getFileNode(ide.davPrefix + options.path);
                if (cloud9config.debug) {
                    if (fileNode)
                        console.log("[SYNC] file already exists", options.path, options.mtime);
                    else
                        console.log("[SYNC] file added", options.path, options.mtime);
                }
                        
                if (!fileNode)
                    this.createSyncFile(options.path, options.mtime);
            }
            else if (options.event === "modified") {
                if (cloud9config.debug)
                    console.log("[SYNC] file modified", options.path, options.mtime);
                
                if (tabEditors.getPage(options.path) && state != "syncing") //@todo do this with an event
                    watcher.confirmReload.call(this, options.path);
            }
            else if (options.event === "moved" && state != "syncing") {
                if (cloud9config.debug)
                    console.log("[SYNC] file moved", options.oldPath, " -> ", options.path);
                
                fileNode = this.moveSyncFile(options.oldPath, options.path);
            }
            else if (options.event === "removed" && state != "syncing") {
                if (cloud9config.debug)
                    console.log("[SYNC] file removed", options.path);
                
                this.removeSyncFile(options.path);
                
                if (tabEditors.getPage(options.path)) //@todo do this with an event
                    watcher.confirmRemoved.call(this, options.path);
            }
            
//            this.updateSyncStatus(options.path, 
//                options.event == "added" && state == "syncing" 
//                    ? "syncing_added" 
//                    : state, fileNode);
        }
    },
    
//    syncState : {},
//
//    getSyncStatus : function(){
//        
//    },
//    
//    updateStatus : function(path, state, fileNode){
//        var paths = path.split("/");
//        
//        if (state == "synced")
//            state = "";
//        
//        if (state)
//            this.syncState[path] = [1, state];
//        else 
//            delete this.syncState[path];
//        
//        if (fileNode) {
//            apf.xmldb.setAttribute(fileNode, "syncstate", state);
//            paths.pop();
//        }
//        
//        var oState;
//        var parentNode = fileNode && fileNode.parentNode;
//        while (!parentNode && paths.length) {
//            path = paths.join("/");
//            parentNode = fs.getFileNode(ide.davPrefix + path);
//            if (!oState, this.syncState[path])
//                oState = this.syncState[path] = {};
//            else
//                oState[
//            
//            apf.xmldb.setAttribute(fileNode, "syncstate", oState[1]);
//            paths.pop();
//        }
//        
//        var pstate = parentNode.getAttribute("syncstate");
//        if (pstate != state) {
//            
//        }
//    },

    createSyncFile: function(path, mtime) {
        var parentPath = ide.davPrefix + path.substring(0, path.lastIndexOf("/"));
        
        if (this.isFSNodeInModel(parentPath)) {
            if (!fs.getFileNode(parentPath))
                fs.createFolderTree(parentPath);
                
            return fs.model.appendXml(fs.createFileNodeFromPath(ide.davPrefix + path, 
                { "modifieddate": mtime }), 
                "//node()[@path=" + util.escapeXpathString(parentPath) + "]");
        }
        else {
            this.createFolderInModelIfLoaded(parentPath);
        }
    },    
    
    moveSyncFile : function(oldPath, newPath) {
        var parentPath = ide.davPrefix + newPath.substring(0, newPath.lastIndexOf("/"));
        
        if (this.isFSNodeInModel(parentPath)) {
            if (!fs.getFileNode(parentPath))
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
                
                return file;
            }
            else
                return apf.xmldb.appendChild(parent, 
                    fs.createFileNodeFromPath(newPath));
        }
        else {
            this.createFolderInModelIfLoaded(parentPath);
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
                
                if (ide.local) {
                xmlNode = apf.xmldb.appendChild(mdlSyncPrj.data,
                    xmlNode, mdlSyncPrj.data.firstChild);
                }
                _self.btnSyncStatus.setValue(true);
            }
            ddSyncPrj.select(xmlNode);
            
            if (_self.syncIntervalId) {
                clearInterval(_self.syncIntervalId);
                _self.syncIntervalId = null;
            }
        });
    },
    
    isFSNodeInModel : function(path) {
        var xmlNode = fs.model.queryNode("//node()[@path=" 
            + util.escapeXpathString(path) + "]")
        if (!xmlNode) return false;
        
//        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, trFiles);
//        if (!htmlNode) return false;
//        
//        return apf.getStyle(htmlNode.nextElementSibling, "display") == "block";

        return true;
    },
    
    createFolderInModelIfLoaded : function(path) {
        var file, li;
        do {
            li   = path.lastIndexOf("/");
            file = path.substr(li + 1);
            path = path.substr(0, li);
            
            if (this.isFSNodeInModel(path)) {
                if (!fs.model.queryNode("//node()[@path=" 
                  + util.escapeXpathString(path + "/" + file) + "]")) {
                   fs.model.appendXml(fs.createFolderNodeFromPath(path + "/" + file), 
                        "//node()[@path=" + util.escapeXpathString(path) + "]");
                }
                  
                  break;
            }
        } while (path && path != ide.davPrefix);
    },
    
    disableSync: function() {
        var _self = this;

        winConfirmSyncOff.hide();

        var payload = {};

        if (ide.local) {
            payload.localWorkspaceId = ide.workspaceId;
        } else {
            payload.onlineWorkspaceId = ide.workspaceId.split("/").pop();
        }

        this.sendMessageToLocal("/api/sync/disable", {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            data: "payload=" + encodeURIComponent(JSON.stringify(payload)),
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
    
    
    callbacks : [],
    queue : [],
    sendMessageToLocal : function(url, message){
        var _self = this;
        
        if (ide.local)
            return apf.ajax(url, message);
        
        message.type = "api";
        message.url  = url;
        
        if (message.callback) {
            message.uid = this.callbacks.push(message.callback) - 1;
            delete message.callback;
        }
        
        this.hasLocalInstalled(function(isInstalled){
            if (isInstalled) {
                _self.$iframe.contentWindow.postMessage(message, "*");
            }
            else {
                _self.showInstallLocal();
                delete _self.callbacks[message.uid];
            }
        });
    },
    
    sendMessageAboutLocal : function(url, message){
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
        var _self = this;
        var xml = new apf.getXml("<clients />"), doc = xml.ownerDocument, c;
        var found = false;
        for (var macAddress in this.syncClients) {
            c = xml.appendChild(doc.createElement("client"));
            c.setAttribute("name", macAddress);
            c.setAttribute("label", macAddress + " (" + this.syncClients[macAddress].hostname + ")");
            found = true;
        }
        mdlSyncClients.load(xml);
        
        vboxSyncRemoveLocal.setAttribute("visible", found);
        vboxSyncInstall.setAttribute("visible", !found);
        
        mnuInstallLocal.display(null, null, true, this.btnSyncStatus);
        
        if (!this.syncIntervalId) {
            this.syncIntervalId = setInterval(function() {
                if (cloud9config.debug)
                    console.log("Checking C9Local CLI....");
                _self.setSync();
            }, 5000);
        }
        
        mnuInstallLocal.addEventListener("blur", function(e) {
            _self.btnSyncStatus.setValue(false);
            clearInterval(_self.syncIntervalId);
            _self.syncIntervalId = null;
        });
    },
    
    /**
     * This function retrieves the mac address of the local client that is 
     * installed. This function caches the result so that the callback is only
     * called async once when the client was already running. If it wasn't 
     * running it will retry until the client is running.
     */
    getLocalId : function(callback){
        var _self = this;
        
        var message = {
            type: "macAddress",
            uid: this.callbacks.push(function( data, state, extra ) {
                if (state != apf.SUCCESS) {
                    callback(new Error("Unable to fetch mac address of local runtime."));
                    return;
                }
                data = JSON.parse(data);
                if (!data.macAddress) {
                    callback(new Error("Error fetching mac address of local runtime. `macAddress` not in response"));
                    return;
                }
                callback(null, data.macAddress);
            }) - 1
        };
        
        this.hasLocalInstalled(function(isInstalled){
            if (isInstalled) {
                _self.$iframe.contentWindow.postMessage(message, "*");
            }
            else {
                _self.showInstallLocal();
                delete _self.handler[message.uid];
            }
        });
    },

    hasLocalInstalled : function(callback){
        var _self = this;
        
        if (!this.$iframe) {
            this.$createIframeToLocal(function(isConnected){
                _self.queue.forEach(function(func){
                    func(isConnected);
                });
                _self.queue = [];
            });
        }
        
        if (this.$iframe.connecting) {
            //Wait for iframe to connect
            this.queue.push(function(isConnected){
                callback(isConnected);
            }) - 1;
            return;
        }
        
        callback(this.$iframe.connected);
    },
    
    $createIframeToLocal : function(callback){
        var _self = this;
        var timer;

        window.addEventListener("message", function(e) {
            try {
                var json = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
            } catch (e) { return; }

            switch (json.type) {
                case "connect":
                    clearTimeout(timer);
                    
                    _self.$iframe.connected = true;
                    _self.$iframe.connecting = false;
                    
                    callback(true);
                break;
                case "response":
                    if (_self.callbacks[json.uid])
                        _self.callbacks[json.uid](json.data, json.state, json.extra);
                break;
            }
        });
        
        function cleanup(){
            _self.$iframe.removeEventListener("load", startTimeout);
            _self.$iframe.removeEventListener("error", errorHandler);
            _self.$iframe.parentNode.removeChild(_self.$iframe);
            _self.$iframe = null;
        }

        //Main timeout for initial connect
        clearTimeout(timer);
        timer = setTimeout(function(){
            _self.$iframe.connecting = false;
            callback(false);
            cleanup();
        }, 10000);

        //Sub timeout for after html is loaded
        var startTimeout = function(){
            clearTimeout(timer);
            timer = setTimeout(function(){
                _self.$iframe.connecting = false;
                callback(false);
                cleanup();
            }, 1000);
        }
        
        var errorHandler = function(){
            callback(false);
        };

        this.$iframe = document.body.appendChild(document.createElement("iframe"));
        this.$iframe.addEventListener("load", startTimeout);
        this.$iframe.addEventListener("error", errorHandler);

        this.$iframe.connecting = true;
        this.$iframe.connected = false;
        this.$iframe.src = "http://localhost:13338/c9local/api-proxy.html?sid=" + cloud9config.sessionId;
        this.$iframe.style.width = "1px";
        this.$iframe.style.height = "1px";
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
                
                if (ide.local) {
                    mdlSyncPrj.load(apf.getXml(_self.createSyncProjectsXml(data.projects)));
                    
                    mnuSyncPrj.display(null, null, false, _self.btnSyncStatus);
                    
                    mnuSyncPrj.addEventListener("prop.visible", function(e){
                        if (!e.value)
                            _self.btnSyncStatus.setValue(false);
                        mnuSyncPrj.removeEventListener("prop.visible", arguments.callee);
                    });
                }
                callback(data);
            }
        });
    },
    
    createProject : function(name, type, scm, callback){
        var _self = this;
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
                
                if (data == "Exists") {
                    _self.btnSyncStatus.setValue(false);
                    _self.btnSyncStatus.enable();
                    return util.alert("Unable to enable sync", 
                        "The project with name '" 
                            + name + "' already exists", "Please try a different project name");
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
                master: master // this is "local" or "remote".
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
                else if (data.workspacesNotEmpty === true) {
                    winCannotSync.show();
                }
            }
        });
    },

    setSync : function() {
        var _self = this;
        
        if (this.syncEnabled) {
            ext.initExtension(this);
            
            if (ide.local)  {
                winConfirmSyncOff.show();
            }
            else {
                this.getLocalId(function(err, localId){
                    if (err) {
                        _self.showInstallLocal();
                        _self.btnSyncStatus.setValue(true);
                    }
                    else if (!mnuInstallLocal.visible) {
                        winConfirmSyncOff.show();
                        winLocalId.$ext.innerHTML = winLocalId.$ext.innerHTML.replace("{MACADD}", _self.syncClients[localId].hostname + " (" + localId + ")");
                    }
                });
            }
        }
        else {
            this.enableSync();
        }
    },

});

});