/**
 * Offline Support for Cloud9
 *
 * @copyright 2010, Ajax.org B.V.
 */
define(function(require, exports, module) {

var ide     = require("core/ide");
var ext     = require("core/ext");
var util    = require("core/util");
var Offline = require("ext/offline/lib-offline");
var Sync    = require("ext/offline/lib-sync");
var fs      = require("ext/filesystem/filesystem");
var WebdavWrapper = require("ext/offline/lib-webdav-wrap");

module.exports = ext.register("ext/offline/offline", {
    dev      : "Ajax.org",
    name     : "Offline",
    alone    : true,
    type     : ext.GENERAL,
    deps     : [fs],
    handlers : {},

    offlineStartup : 0,

    /**
     * Test method for going offline/online
     * @param {Boolean} online If the request is to go online or not
     */
    test : function(online){
        ide.testOffline = online ? 2 : 1;
        if (online)
            ide.socket.socket.connect();
        else
            ide.socket.socket.disconnect();
    },

    /**
     * Attach a method to a handler type
     * @param {String} type The handler hash type
     * @param {Function} handler The handler function
     */
    addHandler : function(type, handler){
        this.handlers[type] = handler;
    },

    /**
     * Init method to create the offline logic
     */
    init : function(){
        var _self   = this;
        var offline = this.offline = new Offline("cloud9", "/static/ext/offline/ping.txt");
        var sync    = this.sync    = new Sync("cloud9");

        // preload the offline image programmatically:
        var img = new Image();
        img.src = ide.staticPrefix + "/style/images/offline.png";

        //Replace http checking because we already have a socket
        //offline.isSiteAvailable = function(){};

        //Set events necessary for checking online status using socket poll loop
        //@todo we still need to solve if (!_self.offlineStartup)
        /*ide.addEventListener("socketConnect", function(e){
            if (!_self.offlineStartup)
                offline.goOnline(); //Comment this out to test offline-start
        });

        ide.addEventListener("socketDisconnect", function(e){
            offline.goOffline();
        });*/

        //Forward Events
        offline.dispatchEvent = function(name, e){
            ide.dispatchEvent(name, e);
        };

        ide.onLine = -1;

        //If we are syncing stop sync.
        ide.addEventListener("beforeoffline", function(){
            if (sync.syncing)
                sync.stop();
        });

        ide.addEventListener("afteroffline", function(){
            stServerConnected.deactivate();
            ide.onLine = false;
            logobar.$ext.className = "c9-menu-bar offline";

            _self.bringExtensionsOffline();
        });

        //If we need to sync first, prevent Cloud9 from coming online
        ide.addEventListener("beforeonline", function(){
            if (sync.getLength()) {
                sync.start(function(data, next){
                    var item = data.item;
                    var cb   = function(){
                        if (next() < 0) //End of loop
                            offline.goOnline();
                    };

                    //Execute sync task here
                    var handler = _self.handlers[item.type];
                    if (!handler) {
                        if (self.console)
                            console.warn("Couldn't find handler for offline type '" + item.type + "'");
                        cb();
                    }
                    else
                        handler(item, cb);
                });
                return false;
            }
        });

        ide.addEventListener("afteronline", function(e){
            stServerConnected.activate();
            ide.onLine = true;
            logobar.$ext.className = "c9-menu-bar";

            _self.bringExtensionsOnline();
        });

        // after the IDE connects (either initial or after reconnect)
        ide.addEventListener("socketConnect", function (e) {
            // load the state, which is quite a weird name actually, but it contains
            // info about the debugger. The response is handled by 'noderunner.js'
            // who publishes info for the UI of the debugging controls based on this.
            ide.send({
                command: "state",
                action: "publish"
            });

            // the debugger needs to know that we are going to attach, but that its not a normal state message
            dbg.registerAutoAttach();
        });

        /**** File System ****/
        /**
         * Here, we need to first create the offlineWebdav object in the main scope
         * of the function, then we need to call the file system constructor. This
         * is async operation, so we need to wait on the filesystem becoming available
         * Due to the app starting in offline in this mode, we need to create a fake read
         * function here or an exception is thrown.
         * Once the file system is available, it's attached to the offlinefs instance, and we
         * can call it's methods with the correct filesystem scope
         */

        // fIdent is used for localStorage in Firefox or if local Filesystem is
        // not available
        var fIdent = "cloud9.files." + ide.workspaceId;


        ide.addEventListener("init.ext/filesystem/filesystem", function(){
            // If we don't have the real webdav, we need to use the offline one
            if (!fs.realWebdav)
                fs.realWebdav = fs.webdav;

            // Now we create a fake webdav object
            var fakeWebdav = new WebdavWrapper(fs.realWebdav, sync, fIdent, function(){
                // We need to set if we have offline file system support, and if we
                // do we don't need to disable plugins like tree, save, etc
                ide.offlineFileSystemSupport = fakeWebdav && fakeWebdav.hasFileSystem;
            });

            // Finally set the objects we need to make the calls on
            fs.webdav = fakeWebdav;
            davProject = fakeWebdav; //intended global
        });

        /**
         * Handler for syncing, wedav-write.  This is used when we go back online
         * and we need to sync file writes
         * @param {Object}      item
         * @param {Function}    callback
         */
        this.addHandler("webdav-write", function(item, callback){
            // Set the webdav object
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");

            // Get the properties of the item
            webdav.getProperties(item.path, 0, function(data){
                var xml = apf.getXml(data);
                // Check the date is newwer
                var serverdate = new Date(xml.firstChild
                    ? xml.firstChild.getAttribute("modifieddate")
                    : 0);
                if (serverdate <= new Date(item.date))
                    webdav.write(item.path, item.data, null, callback);
                else {
                    // If the item is older, we need to confirm we want to
                    // overwrite the remote one
                    util.confirm(
                        "File conflict while syncing",
                        "Conflict found in file " + item.path,
                        "Clicking 'OK' will overwrite the online file.<br />"
                        + "Clicking 'Cancel' will save this file as:<br /><br />"
                        + item.path + "_backup",
                        function(){
                            webdav.write(item.path, item.data, null, callback);
                        },
                        function(){
                            webdav.write(item.path + "_backup", item.data, null, callback);
                        });
                }
            });
        });

        /**
         * Handler for the creation of a new file
         */
        this.addHandler("webdav-create", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.writeFile(item.path, item.data, false, null, callback);
        });

        /**
         * Handler for updating an existing file
         */
        this.addHandler("webdav-write", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.writeFile(item.path, item.data, false, null, callback);
        });

        /**
         * Handler for removing a file
         */
        this.addHandler("webdav-rm", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.remove(item.path, false, callback);
        });

        /**
         * Handler for creating a new directory
         */
        this.addHandler("webdav-mkdir", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.mkdir(item.path, false, callback);
        });

        /**
         * Handler for removing a directory
         */
        this.addHandler("webdav-rmdir", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.remove(item.path, false, callback);
        });

        /**
         * Handler for moving a file or directory
         */
        this.addHandler("webdav-move", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.move(item.from, item.to, false, false, callback);
        });

        /**
         * Handler for copying a file or directory
         */
        this.addHandler("webdav-copy", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.copy(item.from, item.to, true, false, callback);
        });

        /**
         * Handler for renaming a file or directory
         */
        this.addHandler("webdav-rename", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.rename(item.from, item.to, false, false, callback);
        });

        var ident = "cloud9.filetree." + ide.workspaceId;
        function saveModel(){
            localStorage[ident] = fs.model.data.xml;
        }

        //@todo after being longer than 5 minutes offline reload tree when coming online

        ide.addEventListener("afteroffline", function(){
            if (!fs.model.data) {
                if (localStorage[ident]) {
                    fs.model.load(localStorage[ident]);
                    fs.projectName = fs.model.queryValue("folder[@root='1']/@name");
                }
            }
            else {
                saveModel();
            }
        });

        fs.model.addEventListener("update", saveModel);
        fs.model.addEventListener("afterload", saveModel);

        //File contents
        /**
         * This is where we save the files if we have offline support
         */
        function saveFiles(e) {
            // Check for offline support
            if (!ide.offlineFileSystemSupport) {
                var pages = tabEditors.getPages();
                var files = {};
                var len = pages.length;
                if (len) {
                    for (var i = 0; i < len; i++) {
                        var node;
                        // Sometimes there is no model for the page, and this
                        // could cause Cloud9 to lose data
                        if (pages[i].$model && pages[i].$model.data)
                            node = pages[i].$model.data;

                        if (node)
                            files[node.getAttribute("path")] = pages[i].$doc.getValue();
                    }
                }

                try {
                    delete localStorage[fIdent];
                    localStorage[fIdent] = JSON.stringify(files);
                } catch(e) {
                    // TODO: What if we cannot store the files?
                }
            }
        }

        ide.addEventListener("savesettings", saveFiles);
        apf.addEventListener("exit", saveFiles);

        /**** Init ****/

        ide.addEventListener("socketConnect", function() {
            offline.goOnline();
            ide.removeEventListener("socketConnect", arguments.callee);
        });

        ide.addEventListener("extload", function() {
            offline.start();
        });

        if (_self.offlineStartup)
            ide.dispatchEvent("afteroffline"); //Faking offline startup
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
        //Remove all events
    },

    bringExtensionsOnline : function(){
        var exts = ext.extensions;
        for (var i = 0, l = exts.length; i < l; i++) {
            var _ext = exts[i];
            if (_ext.offline === false)
                _ext.enable();
        }
    },

    bringExtensionsOffline : function(){
        var exts = ext.extensions;
        for (var i = 0, l = exts.length; i < l; i++) {
            var _ext = exts[i];
            if (_ext.offline === false)
                _ext.disable();
        }
    }
});

/*

//#ifdef __WITH_AUTH
var auth = apf.document.getElementsByTagNameNS(apf.ns.apf, "auth")[0];
if (!auth)
    return;

//First let's log in to the services that need it before syncing changes
if (auth.needsLogin && auth.loggedIn) { // && !auth.loggedIn
    auth.authRequired({
        object : this,
        retry  : callback
    });
}

        //#ifdef __WITH_AUTH
//if (apf.auth.retry) //Don't want to ruin the chances of having a smooth ride on a bad connection
//    apf.auth.loggedIn = false; //we're logged out now, we'll auto-login when going online
//#endif

var _self = this;
apf.addEventListener("exit", function(){
    return _self.dispatchEvent("losechanges");
});
*/

});