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
        this.expandedPaths = {};

        var removedPaths = {};
        var removedPathCount = 0;
        var changedPaths = {};
        var changedPathCount = 0;
        var _self = this;

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
            if (ide.dispatchEvent("beforewatcherchange", { path: path }) === false) {
                return;
            }

            switch (message.subtype) {
                case "create":
                    break;
                case "remove":
                    if (!removedPaths[path]) {
                        removedPaths[path] = path;
                        removedPathCount += 1;
                        checkPage();
                    }
                    break;
                case "change":
                    var messageLastMod = new Date(message.lastmod).getTime();
                    var currentPageLastMod = new Date(tabEditors.getPage().$model.queryValue('@modifieddate')).getTime();
                    if (!changedPaths[path] && (messageLastMod !== currentPageLastMod)) {
                        changedPaths[path] = path;
                        changedPathCount += 1;
                        checkPage();
                    }
                    break;
            }
        });

        ide.addEventListener("init.ext/editors/editors", function(e) {
            tabEditors.addEventListener("afterswitch", function(e) {
                if (_self.disabled) {
                    return;
                }
                checkPage();
            });
        });

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
