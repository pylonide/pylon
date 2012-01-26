/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var css = require("text!ext/save/save.css");
var markup = require("text!ext/save/save.xml");

module.exports = ext.register("ext/save/save", {
    dev         : "Ajax.org",
    name        : "Save",
    alone       : true,
    type        : ext.GENERAL,
    markup      : markup,
    css         : css,
    deps        : [fs],
    offline     : true,

    commands     : {
        "quicksave": {hint: "save the currently active file to disk"},
        "saveas": {hint: "save the file to disk with a different filename"},
        "reverttosaved": {hint: "downgrade the currently active file to the last saved version"}
    },
    hotitems    : {},
    nodes       : [],
    saveBuffer  : {},

    hook : function(){
        if (!self.tabEditors) return;

        var _self = this;

        tabEditors.addEventListener("close", this.$close = function(e) {
            var at = e.page.$at;
            if (!at.undo_ptr)
                at.undo_ptr = at.$undostack[0];
            var node = e.page.$doc.getNode();
            if (node && at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr
              || !at.undo_ptr && node.getAttribute("changed") == 1
              && e.page.$doc.getValue()) {
                ext.initExtension(_self);

                winCloseConfirm.page = e.page;
                winCloseConfirm.all  = -100;
                winCloseConfirm.show();

                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all != -100) {
                        var f = function(resetUndo){
                            var page;
                            if (!(page=winCloseConfirm.page))
                                return;

                            tabEditors.remove(page, true, page.noAnim);
                            delete page.noAnim;
                            if (resetUndo)
                                page.$at.undo(-1);
                            delete winCloseConfirm.page;
                            page.dispatchEvent("aftersavedialogclosed");
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
        });

        this.nodes.push(ide.barTools.appendChild(new apf.button({
            id       : "btnSave",
            icon     : "save.png",
            tooltip  : "Save",
            skin     : "c9-toolbarbutton",
            disabled : "{!!!tabEditors.activepage}",
            onclick  : this.quicksave.bind(this)
        })));

        var saveItem, saveAsItem;
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save All",
                onclick : function(){
                    _self.saveall();
                },
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),

            saveAsItem = ide.mnuFile.insertBefore(new apf.item({
                caption : "Save As...",
                onclick : function () {
                    _self.saveas();
                },
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),

            saveItem = ide.mnuFile.insertBefore(new apf.item({
                caption : "Save",
                onclick : this.quicksave.bind(this),
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.item({
                caption : "Revert to Saved",
                onclick : function(){
                    _self.reverttosaved();
                },
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild)
        );

        this.hotitems.quicksave = [saveItem];
        this.hotitems.saveas = [saveAsItem];
    },

    init : function(amlNode){
        var _self = this;

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
    },

    reverttosaved : function(){
        ide.dispatchEvent("reload", {doc : tabEditors.getPage().$doc});
    },

    saveall : function(){
        var pages = tabEditors.getPages();
        for (var i = 0; i < pages.length; i++) {
            this.quicksave(pages[i]);
        }
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

    quicksave : function(page, callback) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        var doc  = page.$doc;
        var node = doc.getNode();
        var path = node.getAttribute("path");

        if (node.getAttribute("debug"))
            return;

        if (ide.dispatchEvent("beforefilesave", {node: node, doc: doc }) === false)
            return;

        if (node.getAttribute("newfile")){
            this.saveas(page, callback);
            return;
        }

        if (callback) {
            ide.addEventListener("afterfilesave", function(e){
                if (e.node == node) {
                    callback();
                    this.removeEventListener("afterfilesave", arguments.callee);
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

        var _self = this, panel = sbMain.firstChild;
        panel.setAttribute("caption", "Saving file " + path);

        var value = doc.getValue();

        fs.saveFile(path, value, function(data, state, extra){
            if (state != apf.SUCCESS) {
                util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + extra.message));
            }

            panel.setAttribute("caption", "Saved file " + path);
            ide.dispatchEvent("afterfilesave", {node: node, doc: doc, value: value});
            ide.dispatchEvent("track_action", {
                type: "save as filetype",
                fileType: node.getAttribute("name").split(".").pop(),
                success: state != apf.SUCCESS ? "false" : "true"
            });

            apf.xmldb.removeAttribute(node, "saving");
            apf.xmldb.removeAttribute(node, "new");
            apf.xmldb.setAttribute(node, "modifieddate", apf.queryValue(extra.data, "//d:getlastmodified"));

            if (_self.saveBuffer[path]) {
                delete _self.saveBuffer[path];
                _self.quicksave(page);
            }
        });

        var at = page.$at
        at.undo_ptr = at.$undostack[at.$undostack.length-1];
        page.$at.dispatchEvent("afterchange");
        return false;
    },

    _saveAsNoUI: function(page, path, newPath) {
        if (!page || !path)
            return;

        newPath = newPath || path;

        var file = page.$model.data;
        var saving = parseInt(file.getAttribute("saving"), 10);

        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }
        apf.xmldb.setAttribute(file, "saving", "1");

        var self = this;
        var panel = sbMain.firstChild;
        var value = page.$doc.getValue();
        fs.saveFile(newPath, value, function(value, state, extra) {
            if (state != apf.SUCCESS) {
                util.alert("Could not save document",
                  "An error occurred while saving this document",
                  "Please see if your internet connection is available and try again.");
            }
            panel.setAttribute("caption", "Saved file " + newPath);

            var model = page.$model;
            var node = model.getXml();
            var doc = page.$doc;

            if (path !== newPath || parseInt(node.getAttribute("newfile") || 0, 10) === 1) {
                model.load(node);
                file = model.data;
                fs.beforeRename(file, null, newPath, false);
                doc.setNode(file);
            }

            apf.xmldb.removeAttribute(node, "saving");

            if (self.saveBuffer[path]) {
                delete self.saveBuffer[path];
                self._saveAsNoUI(page);
            }

            if (parseInt(file.getAttribute("newfile") || "0", 10) === 1) {
                apf.xmldb.removeAttribute(file, "newfile");
                apf.xmldb.removeAttribute(file, "changed");
                var xpath = newPath.replace(new RegExp("\/" + cloud9config.davPrefix.split("/")[1]), "")
                                    .replace(new RegExp("\/" + file.getAttribute("name")), "")
                                    .replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                                    .replace(/\/node\(\)\[@name="workspace"\]/, "")
                                    .replace(/\//, "");
                if (xpath) {
                    var oNode  = trFiles.queryNode(xpath);
                    if (oNode && !trFiles.queryNode('//node()[@path="' + newPath + '"]'))
                        apf.xmldb.appendChild(oNode, file);
                }
            }

            ide.dispatchEvent("afterfilesave", {
                node: node,
                doc: doc,
                value: value
            });
        });

        var at = page.$at
        at.undo_ptr = at.$undostack[at.$undostack.length-1];
        page.$at.dispatchEvent("afterchange");
    },

    choosePath : function(path, select) {
        fs.list((path.match(/(.*)\/[^/]*/) || {})[1] || path, function (data, state, extra) {
            if (new RegExp("<folder.*" + path + ".*>").test(data)) {
                path  = path.replace(new RegExp('\/' + cloud9config.davPrefix.split('/')[1]), '')
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
            page = tabEditors.getPage();

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
                    this.removeEventListener("afterfilesave", arguments.callee);
                }
            });
        }

        var fooPath = path.split('/');
        txtSaveAs.setValue(fooPath.pop());
        lblPath.setProperty('caption', fooPath.join('/') + '/');
        winSaveAs.show();
    },

    // Called by the UI 'confirm' button in winSaveAs.
    confirmSaveAs : function(page) {
        page = page || tabEditors.getPage();
        var file = page.$model.data;
        var path = file.getAttribute("path");
        var newPath = lblPath.getProperty('caption') + txtSaveAs.getValue();

        // check if we're already saving!
        var saving = parseInt(file.getAttribute("saving"), 10);
        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }

        //apf.xmldb.setAttribute(file, "saving", "1");

        var self = this;
        var doSave = function() {
            winConfirm.hide();
            winSaveAs.hide();
            self._saveAsNoUI(page, path, newPath);
        };

        if (path !== newPath || parseInt(file.getAttribute("newfile") || 0, 10) === 1) {
            fs.exists(newPath, function (exists) {
                if (exists) {
                    var name = newPath.match(/\/([^/]*)$/)[1];
                    var folder = newPath.match(/\/([^/]*)\/[^/]*$/)[1];

                    util.confirm(
                        "Are you sure?",
                        "\"" + name + "\" already exists, do you want to replace it?",
                        "A file or folder with the same name already exists in the folder "
                        + folder + ". "
                        + "Replacing it will overwrite it's current contents.",
                        doSave);
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
        setTimeout(function(){
            var tabPage = tabEditors.getPage(),
                path    = tabPage ? tabPage.$model.data.getAttribute('path') : false,
                isNew   = tabPage.$model.data.getAttribute('newfile');
            if(!isNew)
                _self.choosePath(path);
            else
                trSaveAs.slideOpen(null, trSaveAs.getModel().data.selectSingleNode('//folder'));
        });
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        tabEditors.removeEventListener("close", this.$close);
    }
});

});
