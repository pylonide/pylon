/*global btnSave:true, tabEditors:true, winCloseConfirm:true, btnYesAll:true, btnNoAll:true*/
/*global btnSaveCancel:true, btnSaveYes:true, btnSaveNo:true, saveStatus:true*/
/*global trSaveAs:true, winSaveAs:true, fileDesc:true, barTools:true*/
/*global trFiles:true, txtSaveAs:true, lblPath:true, winConfirm:true, btnConfirmOk:true*/

/**
 * Save Module for the Cloud9 IDE
 *
 * @copyright 2010-2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var css = require("text!ext/save/save.css");
var menus = require("ext/menus/menus");
var markup = require("text!ext/save/save.xml");
var commands = require("ext/commands/commands");

var SAVING = 0;
var SAVED = 1;
var OFFLINE = 2;

module.exports = ext.register("ext/save/save", {
    dev         : "Ajax.org",
    name        : "Save",
    alone       : true,
    type        : ext.GENERAL,
    markup      : markup,
    css         : css,
    deps        : [fs],
    offline     : true,

    nodes       : [ ],
    saveBuffer  : {},

    hook : function(){
        var _self = this;

        commands.addCommand({
            name: "quicksave",
            hint: "save the currently active file to disk",
            bindKey: {mac: "Command-S", win: "Ctrl-S"},
            isAvailable : function(editor){
                return !!editor;
            },
            exec: function () {
                _self.quicksave();
            }
        });

        commands.addCommand({
            name: "saveas",
            hint: "save the file to disk with a different filename",
            bindKey: {mac: "Command-Shift-S", win: "Ctrl-Shift-S"},
            isAvailable : function(editor){
                return !!editor;
            },
            exec: function () {
                _self.saveas();
            }
        });

        commands.addCommand({
            name: "saveall",
            hint: "downgrade the currently active file to the last saved version",
            isAvailable : function(editor){
                return !!editor;
            },
            exec: function () {
                _self.saveall();
            }
        });

        commands.addCommand({
            name: "reverttosaved",
            bindKey: {mac: "Ctrl-Shift-Q", win: "Ctrl-Shift-Q"},
            isAvailable : function(editor){
                return !!editor;
            },
            exec: function () {
                _self.reverttosaved();
            }
        });

        ide.addEventListener("init.ext/editors/editors", function(){
            tabEditors.addEventListener("close", _self.$close = function(e) {
                var at = e.page.$at;
                var node = e.page.$doc.getNode();

                if (node.getAttribute("deleted"))
                    return;

                if (node && (at && at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr
                  || !at.undo_ptr && node.getAttribute("changed") == 1)
                  && (!node.getAttribute("newfile") || e.page.$doc.getValue())) {
                    ext.initExtension(_self);

                    if (ide.dispatchEvent("beforesavewarn", {
                        page : e.page,
                        doc  : e.page.$doc
                    }) === false)
                        return;

                    var pages   = tabEditors.getPages(),
                    currIdx = pages.indexOf(e.page);
                    tabEditors.set(pages[currIdx].id); //jump to file

                    var filename = node.getAttribute("path").replace(ide.workspaceDir, "").replace(ide.davPrefix, "");

                    winCloseConfirm.page = e.page;
                    winCloseConfirm.all  = -100;
                    winCloseConfirm.show();

                    fileDesc.replaceMarkup("<div><h3>Save " + apf.escapeXML(filename) + "?</h3><div>This file has unsaved changes. Your changes will be lost if you don't save them.</div></div>", {"noLoadingMsg": false});

                    winCloseConfirm.addEventListener("hide", function(){
                        if (winCloseConfirm.all != -100) {
                            var f = function(resetUndo){
                                var page;
                                if (!(page=winCloseConfirm.page))
                                    return;
                                delete winCloseConfirm.page;
                                delete page.noAnim;

                                page.dispatchEvent("aftersavedialogclosed");

                                tabEditors.remove(page, true, page.noAnim);
                                if (resetUndo)
                                    page.$at.undo(-1);
                            };

                            if (winCloseConfirm.all == -200)
                                _self.quicksave(winCloseConfirm.page, f);
                            else
                                f(true);
                            /*winSaveAs.page = winCloseConfirm.page;*/
                        }
                        else
                            tabEditors.dispatchEvent("aftersavedialogcancel");

                        winCloseConfirm.removeEventListener("hide", arguments.callee);
                    });

                    btnYesAll.hide();
                    btnNoAll.hide();

                    e.preventDefault();
                }
            }, true);
        });

        this.nodes.push(
            menus.$insertByIndex(barTools, new apf.button({
                id       : "btnSave",
                icon     : "save.png",
                caption  : "Save",
                tooltip  : "Save",
                skin     : "c9-toolbarbutton-glossy",
                disabled : "{!!!tabEditors.activepage}",
                command  : "quicksave"
            }), 1000)
        );

        var saveItem, saveAsItem, itmRevertToSaved;
        this.nodes.push(
            saveItem = menus.addItemByPath("File/Save", new apf.item({
                command : "quicksave",
                disabled : "{!!!tabEditors.activepage}"
            }), 1000),

            saveAsItem = menus.addItemByPath("File/Save As...", new apf.item({
                command : "saveas",
                disabled : "{!!!tabEditors.activepage}"
            }), 1100),

            menus.addItemByPath("File/Save All", new apf.item({
                command : "saveall",
                disabled : "{!!!tabEditors.activepage}"
            }), 1200),

            itmRevertToSaved = menus.addItemByPath("File/Revert to Saved", new apf.item({
                command : "reverttosaved",
                disabled : "{!!!tabEditors.activepage}"
            }), 700)
        );

        ide.addEventListener("afterreload", function(e){
            var doc = e.doc;
            var at = doc.$page.$at;

            at.addEventListener("afterchange", function(){
                at.undo_ptr = at.$undostack[at.$undostack.length-1];
                apf.xmldb.removeAttribute(doc.getNode(), "changed");
            });
        });

        // when we're going offline we'll disable the UI
        ide.addEventListener("afteroffline", function() {
            _self.disable();
        });

        // when we're back online we'll first update the UI and then trigger an autosave if enabled
        ide.addEventListener("afteronline", function() {
            _self.enable();
        });

        // if we retrieve an actual 'real' file save event then we'll set the UI state to 'saving'
        ide.addEventListener("fs.beforefilesave", function () {
            _self.setUiStateSaving();
        });

        // and afterwards we'll show 'SAVED' or 'NOT SAVED' depending on whether it succeeded
        ide.addEventListener("fs.afterfilesave", function (e) {
            if (e.success) {
                _self.setUiStateSaved();
            }
            else {
                _self.setUiStateOffline();
            }
        });
    },

    init : function(amlNode){
        this.fileDesc = winCloseConfirm.selectSingleNode("a:vbox");

        apf.importCssString((this.css || ""));
        winCloseConfirm.onafterrender = function(){
            btnYesAll.addEventListener("click", function(){
                winCloseConfirm.all = 1;
                winCloseConfirm.hide();
            });
            btnNoAll.addEventListener("click", function(){
                winCloseConfirm.all = -1;
                winCloseConfirm.hide();
            });
            btnSaveYes.addEventListener("click", function(){
                winCloseConfirm.all = -200;
                winCloseConfirm.hide();
            });
            btnSaveNo.addEventListener("click", function(){
                winCloseConfirm.all = 0;
                winCloseConfirm.hide();
            });
            btnSaveCancel.addEventListener("click", function(){
                winCloseConfirm.all = -100;
                winCloseConfirm.hide();
            });
        };

        winSaveAs.addEventListener("hide", function(){
            if (winSaveAs.page) {
                tabEditors.remove(winSaveAs.page, true);
                winSaveAs.page.$at.undo(-1);
                delete winSaveAs.page;
            }
        });

        trSaveAs.addEventListener("beforerename", this.$beforerename = function(e){
            if (!ide.onLine && !ide.offlineFileSystemSupport) return false;

            if (trSaveAs.$model.data.firstChild == trSaveAs.selected)
                return false;

            // check for a path with the same name, which is not allowed to rename to:
            var path = e.args[0].getAttribute("path"),
                newpath = path.replace(/^(.*\/)[^\/]+$/, "$1" + e.args[1]).toLowerCase();

            var exists, nodes = trSaveAs.getModel().queryNodes(".//node()");
            for (var i = 0, len = nodes.length; i < len; i++) {
                var pathLwr = nodes[i].getAttribute("path").toLowerCase();
                if (nodes[i] != e.args[0] && pathLwr === newpath) {
                    exists = true;
                    break;
                }
            }

            if (exists) {
                util.alert("Error", "Unable to Rename",
                    "That name is already taken. Please choose a different name.");
                trSaveAs.getActionTracker().undo();
                return false;
            }

            fs.beforeRename(e.args[0], e.args[1]);
        });
    },

    reverttosaved : function(){
        ide.dispatchEvent("reload", {doc : ide.getActivePage().$doc});
    },

    saveall : function() {
        // previous version of this function used
        // .forEach(this.quicksave), but that also passes the index parameter (2nd one)
        // of forEach to the quicksave function.
        var _self = this;
        tabEditors.getPages().forEach(function (page) {
            _self.quicksave(page);
        });
    },

    saveAllInteractive : function(pages, callback){
        ext.initExtension(this);

        winCloseConfirm.all = 0;

        var _self = this;
        apf.asyncForEach(pages, function(item, next) {
            var at = item.$at;
            if (at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr) {
                if (winCloseConfirm.all == 1)
                    _self.quicksave(item);

                if (winCloseConfirm.all)
                    return next();

                tabEditors.set(item);
                winCloseConfirm.page = item;
                winCloseConfirm.show();
                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all == 1)
                        _self.quicksave(item);

                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                    next();
                });

                btnYesAll.setProperty("visible", pages.length > 1);
                btnNoAll.setProperty("visible", pages.length > 1);
            }
            else
                next();
        },
        function() {
            callback(winCloseConfirm.all);
        });
    },

    ideIsOfflineMessage: function() {
        util.alert("Could not save",
            "Please check your connection",
            "When your connection has been restored you can try to save the file again.");
    },

    // `silentsave` indicates whether the saving of the file is forced by the user or not.
    quicksave : function(page, callback, silentsave) {
        if (!page || !page.$at)
            page = ide.getActivePage();

        if (!page)
            return;

        if (typeof callback !== "function") {
            callback = null;
        }

        var corrected = ide.dispatchEvent("correctactivepage", {page: page});
        if (corrected)
            page = corrected;

        var doc  = page.$doc;
        var node = doc.getNode();
        var path = node.getAttribute("path");

        if (node.getAttribute("debug"))
            return;

        if (ide.dispatchEvent("beforefilesave", {node: node, doc: doc }) === false)
            return;

        if (node.getAttribute("newfile") && !node.getAttribute("cli") && !node.getAttribute("ignore") !== "1"){
            this.saveas(page, callback);
            return;
        }

        if (!ide.onLine) {
            return this.ideIsOfflineMessage();
        }

        if (callback) {
            ide.addEventListener("afterfilesave", function(e) {
                if (e.node == node) {
                    callback();
                    ide.removeEventListener("afterfilesave", arguments.callee);
                }
            });
        }

        // check if we're already saving!
        var saving = parseInt(node.getAttribute("saving"), 10);
        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }

        apf.xmldb.setAttribute(node, "saving", "1");

        var _self = this;

        var value = doc.getValue();

        // raw fs events
        ide.dispatchEvent("fs.beforefilesave", { path: path });

        fs.saveFile(path, value, function(data, state, extra){

            ide.dispatchEvent("track_action", {
                type: "save as filetype",
                fileType: node.getAttribute("name").split(".").pop().toLowerCase(),
                success: state != apf.SUCCESS ? "false" : "true"
            });
            apf.xmldb.removeAttribute(node, "saving");

            ide.dispatchEvent("fs.afterfilesave", { path: path, success: state == apf.SUCCESS });

            if (state != apf.SUCCESS) {
                // ide is not online, or away??
                if (!ide.onLine || ide.connection.away) {
                    // if we're doing a silent save, we'll ignore it
                    // because its a not user triggered action
                    if (silentsave) {
                        return;
                    }
                    // otherwise we show a message that saving failed unfortunately
                    return _self.ideIsOfflineMessage();
                }

                // all other error cases
                return util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + extra.message));
            }

            page.$at.dispatchEvent("afterchange");

            ide.dispatchEvent("afterfilesave", {
                node: node,
                doc: doc,
                value: value,
                oldpath: path,
                silentsave: silentsave
            });

            apf.xmldb.removeAttribute(node, "new");
            apf.xmldb.removeAttribute(node, "changed");
            apf.xmldb.setAttribute(node, "modifieddate", apf.queryValue(extra.data, "//d:getlastmodified"));

            if (_self.saveBuffer[path]) {
                delete _self.saveBuffer[path];
                _self.quicksave(page);
            }
        });

        var at = page.$at;
        at.undo_ptr = at.$undostack[at.$undostack.length-1];
        return false;
    },

    _saveAsNoUI: function(page, path, newPath, isReplace) {
        if (!page || !path)
            return;

        newPath = newPath || path;

        var file = page.$model.data;
        var oldFile = file;
        var oldPath = oldFile.getAttribute("path");
        var saving = parseInt(file.getAttribute("saving"), 10);

        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }
        apf.xmldb.setAttribute(file, "saving", "1");

        var _self = this;
        var value = page.$doc.getValue();
        fs.saveFile(newPath, value, function(value, state, extra) {
            if (state !== apf.SUCCESS) {
                apf.xmldb.removeAttribute(file, "saving")
                return util.alert("Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again." +
                    "The server responded with status " + extra.status + ".");
            }

            var model = page.$model;
            var node = model.getXml();
            var doc = page.$doc;

            if (path !== newPath || parseInt(node.getAttribute("newfile") || 0, 10) === 1) {
                file = apf.getCleanCopy(node);
                fs.beforeRename(file, null, newPath, false, isReplace);
                doc.setNode(file);
                model.load(file);
                tabEditors.set(ide.getActivePage());
            }

            apf.xmldb.removeAttribute(oldFile, "saving");
            apf.xmldb.removeAttribute(file, "saving");

            if (_self.saveBuffer[path]) {
                delete _self.saveBuffer[path];
                _self._saveAsNoUI(page);
            }

            if (parseInt(file.getAttribute("newfile") || "0", 10) === 1) {
                apf.xmldb.removeAttribute(file, "newfile");
                apf.xmldb.removeAttribute(file, "changed");
                var xpath = newPath.replace(new RegExp("\/" + window.cloud9config.davPrefix.split("/")[1]), "")
                                    .replace(new RegExp("\/" + file.getAttribute("name")), "")
                                    .replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                                    .replace(/\/node\(\)\[@name="workspace"\]/, "")
                                    .replace(/\//, "") || "node()";
                if (self.trFiles && xpath) {
                    var oNode = trFiles.queryNode(xpath);
                    if (oNode && !trFiles.queryNode('//node()[@path=' + util.escapeXpathString(newPath) + ']'))
                        apf.xmldb.appendChild(oNode, file);
                }
            }

            ide.dispatchEvent("afterfilesave", {
                node: node,
                doc: doc,
                value: value,
                oldpath: oldPath,
                silentsave: false // It is a forced save, comes from UI
            });
        });

        var at = page.$at
        at.undo_ptr = at.$undostack[at.$undostack.length-1];
        page.$at.dispatchEvent("afterchange", {
            newPath: newPath
        });
    },

    choosePath : function(path, select) {
        fs.list((path.match(/(.*)\/[^/]*/) || {})[1] || path, function (data, state, extra) {
            if (new RegExp("<folder.*" + path + ".*>").test(data)) {
                path  = path.replace(new RegExp("\/" + window.cloud9config.davPrefix.split("/")[1]), "")
                            .replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                            .replace(/\/node\(\)\[@name="workspace"\]/, "")
                            .replace(/\//, "");

                trSaveAs.expandList([path], function() {
                    var node = trSaveAs.getModel().data.selectSingleNode(path);
                    trSaveAs.select(node);
                });
            }
        });
    },

    // Function called from the 'Save As' menu dialog, and from the C9 CLI.
    // It saves a file with a different name, involving UI.
    saveas : function(page, callback){
        if (!page || !page.$at)
            page = ide.getActivePage();

        if (!page)
            return;

        var path = page ? page.$model.data.getAttribute("path") : false;
        if (!path)
            return;

        ext.initExtension(this);

        if (callback) {
            var doc = page.$doc;
            ide.addEventListener("afterfilesave", function(e){
                if (e.doc == doc) {
                    callback();
                    ide.removeEventListener("afterfilesave", arguments.callee);
                }
            });
        }

        var fooPath = path.split("/");
        txtSaveAs.setValue(fooPath.pop());
        lblPath.setProperty("caption", fooPath.join("/") + "/");
        winSaveAs.show();
    },

    // Called by the UI 'confirm' button in winSaveAs.
    confirmSaveAs : function(page) {
        page = page || ide.getActivePage();
        var file = page.$model.data;
        var path = file.getAttribute("path");
        var newPath = lblPath.getProperty("caption") + txtSaveAs.getValue();

        var isReplace = false;
        // check if we're already saving!
        var saving = parseInt(file.getAttribute("saving"), 10);
        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }

        //apf.xmldb.setAttribute(file, "saving", "1");

        var _self = this;
        var doSave = function() {
            winSaveAs.hide();
            _self._saveAsNoUI(page, path, newPath, isReplace);

            if (window.winConfirm) {
                winConfirm.hide();

                if (window.btnConfirmOk && btnConfirmOk.caption == "Yes")
                    btnConfirmOk.setCaption("Ok");
            }
        };

        var doCancel = function() {
            if (window.winConfirm && btnConfirmOk.caption == "Yes")
                btnConfirmOk.setCaption("Ok");
        };
        if (path !== newPath || parseInt(file.getAttribute("newfile") || 0, 10) === 1) {
            fs.exists(newPath, function (exists) {
                if (exists) {
                    var name = newPath.match(/\/([^/]*)$/)[1];

                    isReplace = true;
                    util.confirm(
                        "A file with this name already exists",
                        "\"" + name + "\" already exists, do you want to replace it?",
                        "A file with the same name already exists at this location." +
                        "Selecting Yes will overwrite the existing document.",
                        doSave,
                        doCancel);
                    btnConfirmOk.setCaption("Yes");
                }
                else {
                    doSave();
                }
            });
        }
        else {
            doSave();
        }
    },

    expandTree : function(){
        var _self = this;

        function expand(){
            var tabPage = ide.getActivePage(),
                path    = tabPage ? tabPage.$model.data.getAttribute('path') : false,
                isNew   = tabPage ? tabPage.$model.data.getAttribute('newfile') : false;
            if (!isNew)
                _self.choosePath(path);
            else
                trSaveAs.slideOpen(null, trSaveAs.getModel().data.selectSingleNode('//folder'));
        }

        if (trSaveAs.getModel()) {
            expand();
        }
        else {
            trSaveAs.addEventListener("afterload", expand);
        }
    },

    renameFile : function(node) {
        var path = node.getAttribute("path");
        var oldpath = node.getAttribute("oldpath");
        davProject.rename(oldpath, path, true, false, function(data, state, extra) {
            if (state !== apf.SUCCESS) {
                // TODO: revert the rename!!
                return;
            }

            ide.dispatchEvent("afterupdatefile", {
                path: oldpath,
                newPath: path,
                xmlNode: node,
                isFolder: node.getAttribute("type") === "folder"
            });
        });
    },

    /**
     * Set the UI state to 'saving'
     */
    setUiStateSaving: function () {
        btnSave.show();

        apf.setStyleClass(btnSave.$ext, "saving", ["saved", "error"]);
        apf.setStyleClass(saveStatus, "saving", ["saved"]);
        btnSave.currentState = SAVING;
        btnSave.setCaption("Saving");
    },

    $uiStateSavedTimeout: null,
    /**
     * Set the UI state to 'saved'
     */
    setUiStateSaved: function () {
        var _self = this;

        btnSave.show();

        apf.setStyleClass(btnSave.$ext, "saved", ["saving", "error"]);
        apf.setStyleClass(saveStatus, "saved", ["saving"]);
        btnSave.currentState = SAVED;
        btnSave.setCaption("Changes saved");

        // after 4000 ms. we'll hide the label (clear old timeout first)
        if (_self.$uiS$uiStateSavedTimeout)
            clearTimeout(_self.$ui$uiStateSavedTimeout);

        _self.$uiStateSavedTimeout = setTimeout(function () {
            if (btnSave.currentState === SAVED) {
                btnSave.hide();
            }
        }, 4000);
    },

    setUiStateOffline: function () {
        btnSave.show();

        // don't blink!
        apf.setStyleClass(btnSave.$ext, "saved");
        apf.setStyleClass(btnSave.$ext, "error", ["saving"]);

        btnSave.currentState = OFFLINE;
        btnSave.setCaption("Not saved");
    },

    destroy : function(){
        menus.remove("File/~", 1100);
        menus.remove("File/Save All");
        menus.remove("File/Save As...");
        menus.remove("File/Save");
        menus.remove("File/~", 800);
        menus.remove("File/Revert to Saved");

        commands.removeCommandsByName(
            ["quicksave", "saveas", "saveall", "reverttosaved"]);

        tabEditors.removeEventListener("close", this.$close, true);
        this.$destroy();
    }
});

});
