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
        var _self = this;
        
        this.expandedPaths = {};

        this.removedPaths = {};
        this.changedPaths = {};

        this.removedPathCount = 0;
        this.changedPathCount = 0;

         //@todo do this with an event
        function checkPage(path) {
            var page = tabEditors.getPage(path);
            var data = page && page.$model && page.$model.data;
            if (!data || !data.getAttribute)
                return;

            var path = data.getAttribute("path");
            if (_self.removedPaths[path])
                _self.confirmRemoved(path, _self.removedPathCount > 1);
            else if (_self.changedPaths[path])
                _self.confirmReload(path, _self.changedPathCount > 1);
        }

        ide.addEventListener("openfile", function(e) {
            var path = e.doc.getNode().getAttribute("path");
            _self.sendWatchFile(path);
        });

        ide.addEventListener("closefile", function(e) {
            if (_self.disabled) return;

            var path = e.xmlNode.getAttribute("path");
            _self.sendUnwatchFile(path);
        });

        ide.addEventListener("socketMessage", function(e) {
            var message = e.message;
            if (_self.disabled || (message.type && message.type !== "watcher") || !message.path) {
                return;
            }

            var path = ide.davPrefix + message.path.slice(ide.workspaceDir.length);
            path = path.replace(/\/$/, "");

            if (_self.expandedPaths[path]) {
                return ide.dispatchEvent("treechange", {
                    path: path,
                    files: message.files
                });
            }

            var getPagePath = function(page) {
                return page.$model.data.getAttribute("path") === path;
            };

            var pages = tabEditors.getPages();
            if (!pages.some(getPagePath)) {
                return;
            }

            // allow another plugin to change the watcher behavior
            var eventData = {
                path: path
            };

            if (ide.dispatchEvent("beforewatcherchange", eventData) === false) {
                return;
            }

            switch (message.subtype) {
                case "create":
                    break;
                case "remove":
                    if (!_self.removedPaths[path]) {
                        _self.removedPaths[path] = path;
                        _self.removedPathCount += 1;
                        checkPage(path);
                    }
                    break;
                case "change":
                    var messageLastMod = new Date(message.lastmod).getTime();
                    var currentPageLastMod = new Date(tabEditors.getPage().$model.queryValue('@modifieddate')).getTime();
                    if (!_self.changedPaths[path] && (messageLastMod !== currentPageLastMod)) {
                        _self.changedPaths[path] = path;
                        _self.changedPathCount += 1;
                        checkPage(path);
                    }
                    break;
            }
        });

//        ide.addEventListener("init.ext/editors/editors", function(e) {
//            ide.addEventListener("tab.afterswitch", function(e) {
//                if (_self.disabled) {
//                    return;
//                }
//                checkPage();
//            });
//        });

        ide.addEventListener("init.ext/tree/tree", function() {
            var watcherFn = function(node, shouldWatch) {
                if (node && (node.getAttribute("type") === "folder" || node.tagName === "folder")) {
                    var path = node.getAttribute("path");

                    _self.expandedPaths[path] = path;
                    _self[shouldWatch ? "sendWatchFile" : "sendUnwatchFile"](path);
                }
            };
            trFiles.addEventListener("expand", function(e) {
                if (_self.disabled) {
                    return;
                }
                watcherFn(e.xmlNode, true);
            });

            trFiles.addEventListener("collapse", function (e) {
                if (_self.disabled) {
                    return;
                }
                watcherFn(e.xmlNode, true);
            });
        });
    },
    
    confirmRemoved : function(path, multiple){
        var _self = this;
        
        util.question(
            "File removed, keep tab open?",
            path + " has been deleted, or is no longer available.",
            "Do you wish to keep the file open in the editor?",
            function() { // Yes
                apf.xmldb.setAttribute(data, "changed", "1");
                delete _self.removedPaths[path];
                --_self.removedPathCount;
                winQuestion.hide();
            },
            function() { // Yes to all
                var pages = tabEditors.getPages();

                pages.forEach(function(page) {
                   apf.xmldb.setAttribute(page.$model.data, "changed", "1");
                });
                _self.removedPaths = {};
                _self.removedPathCount = 0;
                winQuestion.hide();
            },
            function() { // No
                tabEditors.remove(page);
                delete _self.removedPaths[path];
                --_self.removedPathCount;
                winQuestion.hide();
            },
            function() { // No to all
                var pages = tabEditors.getPages();

                pages.forEach(function(page) {
                    if (_self.removedPaths[page.$model.data.getAttribute("path")])
                        tabEditors.remove(page);
                });
                this.removedPaths = {};
                _self.removedPathCount = 0;
                winQuestion.hide();
            }
        );
        btnQuestionYesToAll.setAttribute("visible", multiple);
        btnQuestionNoToAll.setAttribute("visible", multiple);
    },
    
    confirmReload : function(path, multiple){
        var _self = this;
        
        util.question(
            "File changed, reload tab?",
            path + " has been changed by another application.",
            "Do you want to reload it?",
            function() { // Yes
                ide.dispatchEvent("reload", {doc : page.$doc});
                delete _self.changedPaths[path];
                --_self.changedPathCount;
                winQuestion.hide();
            },
            function() { // Yes to all
                var pages = tabEditors.getPages();

                pages.forEach(function (page) {
                    if (_self.changedPaths[page.$model.data.getAttribute("path")])
                        ide.dispatchEvent("reload", {doc : page.$doc});
                });
                _self.changedPaths = {};
                _self.changedPathCount = 0;
                winQuestion.hide();
            },
            function() { // No
                delete _self.changedPaths[path];
                --_self.changedPathCount;
                winQuestion.hide();
            },
            function() { // No to all
                _self.changedPaths = {};
                _self.changedPathCount = 0;
                winQuestion.hide();
            }
        );
        btnQuestionYesToAll.setAttribute("visible", multiple);
        btnQuestionNoToAll.setAttribute("visible", multiple);
    },

    sendWatchFile : function(path) {
        ide.send({
            "command"     : "watcher",
            "type"        : "watchFile",
            "path"        : path.slice(ide.davPrefix.length).replace(/^\//, "")
        });
    },

    sendUnwatchFile : function(path) {
        ide.send({
            "command"     : "watcher",
            "type"        : "unwatchFile",
            "path"        : path.slice(ide.davPrefix.length).replace(/^\//, "")
        });
    },

    enable : function() {
        this.disabled = false;

        var _self = this;
        var pages = tabEditors.getPages();
        pages.forEach(function(page) {
            if (page.$model) {
                _self.sendWatchFile(page.$model.data.getAttribute("path"));
            }
        });

        for (var path in this.expandedPaths) {
            this.sendWatchFile(path);
        }
    },

    disable : function() {
        this.disabled = true;
    },

    destroy : function() {}
});

});
