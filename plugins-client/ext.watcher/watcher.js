/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global trFiles winQuestion tabEditors btnQuestionYesToAll btnQuestionNoToAll
 *winWatcher btnWatcherMerge winWatcherHeader winWatcherMsg btnWatcherLocal
 *btnWatcherRemote btnWatcherMerge cbWatcherAll
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var tree = require("ext/tree/tree");
var fs = require("ext/filesystem/filesystem");
var settings = require("ext/settings/settings");

var markupSettings = require("text!./settings.xml");
var markup = require("text!./markup.xml");
var merge = require("./three_way_merge").merge;

function getPagePath (page) {
    return page.$model && page.$model.data && page.$model.data.getAttribute("path");
}

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
        this.removedPaths = {};
        this.changedPaths = {};
        this.mergePaths = {};
        this.ignorePaths = {};

        var _self = this;

        this.isAutoMergeEnabled = false;

        settings.addSettings("General", markupSettings);
        ide.addEventListener("settings.load", function(e){
            e.ext.setDefaults("general", [
                ["automergeenabled", "false"],
                ["dontaskautomerge", "false"]
            ]);
            _self.isAutoMergeEnabled = apf.isTrue(e.model.queryValue("general/@automergeenabled")) || false;
        });

        ide.addEventListener("settings.save", function(e) {
            if (!e.model.data)
                return;

            _self.isAutoMergeEnabled = apf.isTrue(e.model.queryValue("general/@automergeenabled")) || false;
        });

        function checkPage() {
            var page = ide.getActivePage();
            var data = page && page.$model && page.$model.data;
            if (!data || !data.getAttribute)
                return;
                
            var path = getPagePath(page);
            
            resolveFileDelete(page, data, path);
            resolveFileChange(page, data, path);
        }

        function resolveFileDelete(page, data, path) {
            if (!_self.removedPaths[path])
                return;

            var file = path.slice(ide.davPrefix.length + 1);
            util.question(
                "File removed, keep tab open?",
                file + " has been deleted, or is no longer available.",
                "Do you wish to keep the file open in the editor?",
                function() { // Yes
                    delete _self.removedPaths[path];
                    page.$at.undo_ptr = {}; // set undo pointer to non existing change
                    page.$at.dispatchEvent("afterchange");
                    winQuestion.hide();
                },
                function() { // Yes to all
                    _self.removedPaths = {};
                    tabEditors.getPages().forEach(function (page) {
                        page.$at.undo_ptr = {}; // set undo pointer to non existing change
                        page.$at.dispatchEvent("afterchange");
                    });                    
                    winQuestion.hide();
                },
                function() { // No
                    tabEditors.remove(page);
                    delete _self.removedPaths[path];
                    winQuestion.hide();
                },
                function() { // No to all
                    var pages = tabEditors.getPages();

                    pages.forEach(function(page) {
                        var path = getPagePath(page);
                        if (!path)
                            return;
                        ide.dispatchEvent("afterFileRemove");
                        if (_self.removedPaths[path])
                            tabEditors.remove(page);
                    });
                    _self.removedPaths = {};
                    winQuestion.hide();
                }
            );
            btnQuestionYesToAll.setAttribute("visible", Object.keys(_self.removedPaths).length > 1);
            btnQuestionNoToAll.setAttribute("visible", Object.keys(_self.removedPaths).length > 1);
        }

        function resolveFileChange(page, data, path) {
            if (!_self.changedPaths[path] && !_self.mergePaths[path])
                return;

            function resolve(path) {
                delete _self.changedPaths[path];
                delete _self.mergePaths[path];
            }

            var doc = page.$doc;
            
            // only do this for 'normal' text files
            var session = doc.acesession;
            if (
                !session ||
                !page.$model ||
                !page.$model.data ||
                page.$model.data.getAttribute("newfile") === "1" ||
                page.$model.data.getAttribute("debug") === "1" ||
                page.$model.data.getAttribute("ignore") === "1"
            ) {
                return resolve(path);
            }

            var newData;
            fs.readFile(path, function(data, state, extra) {
                if (state != apf.SUCCESS)
                    return dialog();

                newData = data;
                // false alarm. File content didn't change
                if (newData === doc.saveValue)
                    return resolve(path);
                
                // short cut: remote value is the same as the current value
                if (newData === doc.getValue()) {
                    doc.saveValue = newData;
                    _self.updateChanged(page);
                    resolve(path);
                    return;
                }

                if (_self.mergePaths[path] || _self.isAutoMergeEnabled) {
                    var root = doc.saveValue;
                    if (typeof root === "string") {
                        merge(root, newData, session.getDocument());
                        doc.saveValue = newData;
                        if (doc.getValue() === newData) {
                            page.$at.addEventListener("afterchange", function onAfterChange() {
                                page.$at.removeEventListener("afterchange", onAfterChange);
                                _self.updateChanged(page);
                            });
                        }
                        resolve(path);
                        return;
                    }
                }

                dialog();
            });

            var file = path.slice(ide.davPrefix.length + 1);
            function dialog() {
                question(
                    "File Changed",
                    file + " has been changed on disk.",
                    function() { // Local
                        page.$at.undo_ptr = {}; // set undo pointer to non existing change
                        page.$at.dispatchEvent("afterchange");
                        resolve(path);
                        winWatcher.hide();
                    },
                    function() { // Local to all
                        _self.changedPaths = {};
                        _self.mergePaths = {};
                        tabEditors.getPages().forEach(function (page) {
                            page.$at.undo_ptr = {}; // set undo pointer to non existing change
                            page.$at.dispatchEvent("afterchange");
                        });
                        winWatcher.hide();
                    },
                    function() { // Remote
                        ide.dispatchEvent("reload", {doc : page.$doc});
                        resolve(path);
                        winWatcher.hide();
                    },
                    function() { // Remote to all
                        tabEditors.getPages().forEach(function (page) {
                            var path = getPagePath(page);
                            if (path && _self.changedPaths[path])
                                ide.dispatchEvent("reload", {doc : page.$doc});
                        });
                        _self.changedPaths = {};
                        _self.mergePaths = {};
                        winWatcher.hide();
                    },
                    function() { // Merge
                        winWatcher.hide();
                        askAutoMerge();

                        _self.mergePaths[path] = 1;
                        checkPage();
                    },
                    function() { // Merge to all
                        winWatcher.hide();
                        askAutoMerge();

                        for (var path in _self.changedPaths)
                            _self.mergePaths[path] = 1;
                        
                        checkPage();
                    }
                );
                btnWatcherMerge.setAttribute("visible", typeof doc.saveValue === "string");
            }

            function askAutoMerge() {
                var ask = !(apf.isTrue(settings.model.queryValue("general/@dontaskautomerge")) || false);

                if (!ask)
                    return;

                if (!_self.cbAutoMerge) {
                    _self.cbAutoMerge = new apf.checkbox({
                        skin: "checkbox_black",
                        label: "Don't ask again",
                        id: "cbWatcherDontAsk"
                    });
                }

                util.question(
                    "Always merge?",
                    "Always merge on file changes?",
                    "Enabling 'auto merge' makes it very easy to collaborate on files with other people, especially when combined with 'auto save'. This setting can be controlled from the settings panel as well.",
                    function() { // on yes
                        if (_self.cbAutoMerge.checked)
                            settings.model.setQueryValue("general/@dontaskautomerge", "true");
                            
                        settings.model.setQueryValue("general/@automergeenabled", "true");
                        settings.save();
                        winQuestion.hide();
                        _self.cbAutoMerge.parentNode.removeChild(_self.cbAutoMerge);
                    },
                    function() {}, // on yes to all
                    function() { // on no
                        if (_self.cbAutoMerge.checked)
                            settings.model.setQueryValue("general/@dontaskautomerge", "true");
                            
                        settings.save();
                        winQuestion.hide();
                        _self.cbAutoMerge.parentNode.removeChild(_self.cbAutoMerge);
                    }
                );
                
                btnQuestionYesToAll.parentNode.insertBefore(_self.cbAutoMerge, btnQuestionYesToAll);
                btnQuestionYesToAll.setAttribute("visible", false);
                btnQuestionNoToAll.setAttribute("visible", false);
            }
        }

        ide.addEventListener("openfile", this.watchAll.bind(this));

        tabEditors.getPages().forEach(function(page) {
            var doc = page.$doc;
            if (doc && !doc.saveValue)
                doc.saveValue = doc.getValue();
        });

        ide.addEventListener("fs.beforefilesave", function(e) {
            e.doc.nextSaveValue = e.doc.getValue();
            // keep our own client side ignore list
            _self.ignorePaths[e.path] = 1;
        });
        
        ide.addEventListener("afterfilesave", function(e) {
            e.doc.saveValue = e.doc.nextSaveValue;
            delete _self.ignorePaths[e.oldpath];
            delete e.doc.nextSaveValue;
        });

        ide.addEventListener("afteronline", function() {
            _self.watchAll();
    
            // assume all files have changed
            _self.changedPaths = {};
            tabEditors.getPages().forEach(function(page) {
                var path = getPagePath(page);
                 if (path)
                    _self.changedPaths[path] = 1;
            });
            
            checkPage();
        });

        ide.addEventListener("afteropenfile", onAfterFileOpen);
        ide.addEventListener("afterreload", onAfterFileOpen);

        function onAfterFileOpen(e) {
            if (e.type == "nofile")
                return;

            e.doc.saveValue = e.doc.getValue();
        }

        ide.addEventListener("closefile", this.watchAll.bind(this));

        ide.addEventListener("socketMessage", function(e) {
            var message = e.message;
            if (_self.disabled || (message.type && message.type !== "watcher") || !message.path) {
                return;
            }

            var path = ide.davPrefix + message.path.slice(ide.workspaceDir.length);
            path = path.replace(/\/$/, "");

            if (message.subtype === "directorychange") {
                return ide.dispatchEvent("treechange", {
                    path: path,
                    files: message.files
                });
            }

            var checkPagePath = function(page) {
                return getPagePath(page) === path;
            };

            var pages = tabEditors.getPages();

            if (!pages.some(checkPagePath)) {
                return;
            }

            // allow another plugin to change the watcher behavior
            var eventData = {
                path: path,
                message: message,
                action: message.subtype,
                isFolder: message.subtype === "directorychange"
            };

            if (ide.dispatchEvent("beforewatcherchange", eventData) === false) {
                return;
            }

            switch (message.subtype) {
                case "remove":
                    if (!_self.removedPaths[path]) {
                        _self.removedPaths[path] = path;
                        checkPage();
                    }
                    break;
                case "change":
                    if (_self.ignorePaths[path])
                        break;
                        
                    if (!_self.changedPaths[path]) {
                        delete _self.mergePaths[path];
                        _self.changedPaths[path] = path;
                        checkPage();
                    }
                    break;
                default:
                    break;
            }
        });

        ide.addEventListener("init.ext/editors/editors", function(e) {
            ide.addEventListener("tab.afterswitch", function(e) {
                if (_self.disabled) return;
                
                checkPage();
            });
        });

        ide.addEventListener("init.ext/tree/tree", function() {
            trFiles.addEventListener("expand", function(e) {
                if (_self.disabled) return;
                    
                _self.watchAll();
            });
        });
    },

    updateChanged: function(page) {
        var at = page.$at;
        at.undo_ptr = at.$undostack[at.$undostack.length-1];
        page.$at.dispatchEvent("afterchange");
    },

    watchAll: function() {
        if (this.disabled) return;
        
        var paths = [];
        
        tabEditors.getPages().forEach(function(page) {
            var path = getPagePath(page);
            if (path)
                paths.push(path);
        });

        if (window.trFiles) {
            trFiles.$model.queryNodes("//folder/@path").forEach(function(node) {
                paths.push(node.nodeValue);
            });
        }

        paths = paths.map(function(path) {
            return path.slice(ide.davPrefix.length).replace(/^\//, "");
        });

        ide.send({
            "command": "watcher",
            "id": ide.clientId,
            "paths": paths
        });
    },

    disable: function() {
        this.disabled = true;
        clearInterval(this.watcherId);
    },

    enable : function() {
        this.disabled = false;
        
        // sync watchers eyery 10 sec
        this.watcherId = setInterval(this.watchAll.bind(this), 10000);
        this.watchAll();
    }
});

function question(title, header, onlocal, onlocaltoall, onremote, onremotetoall, onmerge, onmergetoall) {
    if (!window.winWatcher)
        apf.document.documentElement.insertMarkup(markup);

    
    winWatcher.show();
    winWatcher.setAttribute("title", title);
    winWatcherHeader.$ext.innerHTML = util.escapeXml(header);
    btnWatcherLocal.onclick = function(e) {
        if (cbWatcherAll.checked)
            onlocaltoall(e);
        else
            onlocal(e);
    };

    btnWatcherRemote.onclick = function(e) {
        if (cbWatcherAll.checked)
            onremotetoall(e);
        else
            onremote(e);
    };
    btnWatcherMerge.onclick = function(e) {
        if (cbWatcherAll.checked)
            onmergetoall(e);
        else
            onmerge(e);
    };
}

});
