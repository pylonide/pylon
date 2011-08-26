/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var tree = require("ext/tree/tree");

module.exports = ext.register("ext/watcher/watcher", {
    name    : "Watcher",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : null,
    visible : true,
    deps    : [tree],
    
    init : function() {
        // console.log("Initializing watcher");
        
        var removedPaths        = {},
            removedPathCount    = 0,
            changedPaths        = {},
            changedPathCount    = 0,
            expandedPaths       = {},
            _self               = this;
            
        function sendWatchFile(path) {
            ide.socket.send(JSON.stringify({
                "command"     : "watcher",
                "type"        : "watchFile",
                "path"        : ide.workspaceDir + path.slice(ide.davPrefix.length)
            }));
        }
        
        function sendUnwatchFile(path) {
            ide.socket.send(JSON.stringify({
                "command"     : "watcher",
                "type"        : "unwatchFile",
                "path"        : ide.workspaceDir + path.slice(ide.davPrefix.length)
            }));
        }           
       
        function checkPage() {
            var page = tabEditors.getPage(),
                data = page.$model.data;
            if (!data || !data.getAttribute)
                return;

            var path = data.getAttribute("path");
            if (removedPaths[path]) {
                util.question(
                    "File removed, keep tab open?",
                    path + " has been deleted, or is no longer available.",
                    "Do you wish to keep the file open in the editor?",
                    function() { // Yes
                        apf.xmldb.setAttribute(data, "changed", "1");
                        delete removedPaths[path];
                        --removedPathCount;
                        winQuestion.hide();
                    },
                    function() { // Yes to all
                        var pages = tabEditors.getPages();
                        
                        pages.forEach(function(page) {
                           apf.xmldb.setAttribute(page.$model.data, "changed", "1");
                        });
                        removedPaths = {};
                        removedPathCount = 0;
                        winQuestion.hide();
                    },
                    function() { // No
                        tabEditors.remove(page);
                        delete removedPaths[path];
                        --removedPathCount;
                        winQuestion.hide();
                    },
                    function() { // No to all
                        var pages = tabEditors.getPages();
                        
                        pages.forEach(function(page) {
                            if (removedPaths[page.$model.data.getAttribute("path")])
                                tabEditors.remove(page);
                        });
                        removedPaths = {};
                        removedPathCount = 0;
                        winQuestion.hide();
                    }
                );
                btnQuestionYesToAll.setAttribute("visible", removedPathCount > 1);
                btnQuestionNoToAll.setAttribute("visible", removedPathCount > 1);
            } else if (changedPaths[path]) {
                util.question(
                    "File changed, reload tab?",
                    path + " has been changed by another application.",
                    "Do you want to reload it?",
                    function() { // Yes
                        ide.dispatchEvent("reload", {doc : page.$doc});
                        delete changedPaths[path];
                        --changedPathCount;
                        winQuestion.hide();
                    },
                    function() { // Yes to all
                        var pages = tabEditors.getPages();
                        
                        pages.forEach(function (page) {
                            if (changedPaths[page.$model.data.getAttribute("path")])
                                ide.dispatchEvent("reload", {doc : page.$doc});
                        });
                        changedPaths = {};
                        changedPathCount = 0;
                        winQuestion.hide();
                    },
                    function() { // No
                        delete changedPaths[path];
                        --changedPathCount;
                        winQuestion.hide();
                    },
                    function() { // No to all
                        changedPaths = {};
                        changedPathCount = 0;
                        winQuestion.hide();
                    }
                );
                btnQuestionYesToAll.setAttribute("visible", changedPathCount > 1);
                btnQuestionNoToAll.setAttribute("visible", changedPathCount > 1);
            }
        }
        
        stServerConnected.addEventListener("activate", function() {
            if (_self.disabled) return;
            
            var pages = tabEditors.getPages();
            pages.forEach(function (page) {
                sendWatchFile(page.$model.data.getAttribute("path"));
            });
            for (var path in expandedPaths)
                sendWatchFile(path);
        });
        
        ide.addEventListener("openfile", function(e) {
            var path = e.doc.getNode().getAttribute("path");

            // console.log("Opened file " + path);
            if (ide.socket)
                sendWatchFile(path);
            else
                stServerConnected.addEventListener("activate", function () {
                    sendWatchFile(path);
                    stServerConnected.removeEventListener("activate", arguments.callee);
                });
        });        

        ide.addEventListener("closefile", function(e) {
            if (_self.disabled) return;
            
            var path = e.xmlNode.getAttribute("path");
            if (ide.socket)
                sendUnwatchFile(path);
            else
                stServerConnected.addEventListener("activate", function () {
                    sendUnwatchFile(path);
                    stServerConnected.removeEventListener("activate", arguments.callee);
                });
        });
        
        ide.addEventListener("socketMessage", function(e) {
            if (_self.disabled) return;
            
            var pages = tabEditors.getPages();
            var message = e.message;
            if ((message.type && message.type != "watcher") || !message.path)
                return;
                
            var path = ide.davPrefix + message.path.slice(ide.workspaceDir.length);

            if (expandedPaths[path])
                return ide.dispatchEvent("treechange", {
                    path    : path,
                    files   : message.files
                });
            if (!pages.some(function (page) {
                return page.$model.data.getAttribute("path") == path;
            }))
                return;
            switch (message.subtype) {
            case "create":
                break;
            case "remove":
                if (!removedPaths[path]) {
                    removedPaths[path] = path;
                    ++removedPathCount;
                    checkPage();
                    /*
                    ide.dispatchEvent("treeremove", {
                        path : path
                    });
                    */
                }
                break;
            case "change":
                if (!changedPaths[path]) {
                    changedPaths[path] = path;
                    ++changedPathCount;
                    checkPage();
                }
                break;
            }
        });
        
        tabEditors.addEventListener("afterswitch", function(e) {
            if (_self.disabled) return;
            
            checkPage();
        });
        
        trFiles.addEventListener("expand", function(e) {
            if (_self.disabled) return;
            
            var node = e.xmlNode;
            if (node && node.getAttribute("type") == "folder") {
                var path = node.getAttribute("path");
                
                expandedPaths[path] = path;
                sendWatchFile(path);
            }
        });
        
        trFiles.addEventListener("collapse", function (e) {
            if (_self.disabled) return;

            var node = e.xmlNode;
            if (node && node.getAttribute("type") == "folder") {
                var path = node.getAttribute("path");
                
                delete expandedPaths[path];
                sendUnwatchFile(path);
            }
        });
    },
    
    enable : function(){
        this.disabled = false;
        
        //@todo add code here to set watchers again based on the current state
    },
    
    disable : function(){
        this.disabled = true;
    },
    
    destroy : function(){
        
    }
});

});
