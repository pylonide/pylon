/**
 * Autosave Module for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

var Save = require("ext/save/save");
var Util = require("ext/revisions/revisions_util");
var settings = require("ext/settings/settings");
var markupSettings = require("text!ext/autosave/settings.xml");
var stripws = require("ext/stripws/stripws");
var tooltip = require("ext/tooltip/tooltip");

var INTERVAL = 60000;
var CHANGE_TIMEOUT = 500;

module.exports = ext.register("ext/autosave/autosave", {
    name: "Autosave",
    dev: "Cloud9",
    alone: true,
    type: ext.GENERAL,
    offline: true,
    nodes: [],

    docChangeTimeout: null,
    docChangeListeners: {},

    hook: function() {
        var self = this;

        settings.addSettings("General", markupSettings);
        ide.addEventListener("settings.load", function(e){
            e.ext.setDefaults("general", [["autosaveenabled", "false"]]);
            self.isAutoSaveEnabled = apf.isTrue(e.model.queryValue("general/@autosaveenabled")) || self.tempEnableAutoSave;
        });

        ide.addEventListener("settings.save", function(e) {
            if (!e.model.data)
                return;

            self.isAutoSaveEnabled = apf.isTrue(e.model.queryValue("general/@autosaveenabled")) || self.tempEnableAutoSave;
        });

        btnSave.setAttribute("caption", "");
        btnSave.setAttribute("margin", "0 20");
        btnSave.removeAttribute("tooltip");
        btnSave.removeAttribute("command");
        apf.setStyleClass(btnSave.$ext, "btnSave");

        tooltip.add(btnSave, {
            message : "Changes to your file are automatically saved.<br />\
                View all your changes through <a href='javascript:void(0)' \
                onclick='require(\"ext/revisions/revisions\").toggle();' \
                class='revisionsInfoLink'>the Revision History pane</a>. \
                Rollback to a previous state, or make comparisons.",
            width : "250px",
            hideonclick : true
        });

        this.$onOpenFileFn = this.onOpenFile.bind(this);
        this.$onCloseFileFn = this.onCloseFile.bind(this);
        this.$onExternalChange = this.onExternalChange.bind(this);
        this.$onBeforeSaveWarning = this.onBeforeSaveWarning.bind(this);

        ide.addEventListener("afteropenfile", this.$onOpenFileFn);
        ide.addEventListener("closefile", this.$onCloseFileFn);
        ide.addEventListener("afteronline", this.$onAfterOnline);
        ide.addEventListener("beforewatcherchange", this.$onExternalChange);
        ide.addEventListener("beforesavewarn", this.$onBeforeSaveWarning);
    },

    /////////////////////
    // Event listeners //
    /////////////////////

    onBeforeSaveWarning: function(e) {
        var isNewFile = apf.isTrue(e.doc.getNode().getAttribute("newfile"));
        if (!isNewFile && this.isAutoSaveEnabled) {
            this.save();
            return false;
        }
    },

    /** related to: Revisions#showQuestionWindow
     * Revisions#onExternalChange(e) -> Boolean
     * - e(Object): Event object
     *
     * This is the listener to the file watcher event. It is fired when a file is
     * modified by an external application, and it starts the chain of messaging
     * events, starting with asking the server to send over the contents of the
     * modified file as it is after the external changes.
     **/
    onExternalChange: function(e) {
        // We want to prevent autosave to keep saving while we are resolving
        // this query.
        this.prevAutoSaveValue = this.isAutoSaveEnabled;
        settings.model.setQueryValue("general/@autosaveenabled", false);

        var path = Util.stripWSFromPath(e.path);
        this.changedPaths.push(path);

        return false;
    },

    onOpenFile: function(data) {
        if (!data || !data.doc)
            return;

        var self = this;
        var doc = data.doc;
        var page = doc.$page;
        if (!page || !Util.pageIsCode(page)) {
            return;
        }

        // Add document change listeners to an array of functions so that we
        // can clean up on disable plugin.
        var path = Util.getDocPath(page);
        if (path && !this.docChangeListeners[path]) {
            this.docChangeListeners[path] = function(e) {
                self.onDocChange.call(self, e, doc);
            };
        }

        if (!this.isNewPage(page)) {
            this.setSaveButtonCaption();
        }

        (doc.acedoc || doc).addEventListener("change", this.docChangeListeners[path]);
    },

    onCloseFile: function(e) {
        if (tabEditors.getPages().length == 1)
            btnSave.hide();
        else
            this.setSaveButtonCaption(e.page);

        this.save(e.page);
    },

    onDocChange: function(e, doc) {
        var page = doc.$page;
        if (page && this.isAutoSaveEnabled && !this.isNewPage(page)) {
            clearTimeout(this.docChangeTimeout);
            this.docChangeTimeout = setTimeout(function(self) {
                self.setSaveButtonCaption();
                stripws.disable();
                self.save(page);
            }, CHANGE_TIMEOUT, this);
        }
    },

    isNewPage: function(page) {
        return parseInt(page.$model.data.getAttribute("newfile"), 10) === 1;
    },

    setSaveButtonCaption: function(page) {
        if (!self.btnSave)
            return;

        var SAVING = 0;
        var SAVED = 1;

        btnSave.show();
        var page = page || tabEditors.getPage();
        if (page) {
            var hasChanged = Util.pageHasChanged(page);
            if (this.isAutoSaveEnabled && hasChanged) {
                if (btnSave.currentState !== SAVING) {
                apf.setStyleClass(btnSave.$ext, "saving", ["saved"]);
                apf.setStyleClass(document.getElementById("saveStatus"), "saving", ["saved"]);
                    btnSave.currentState = SAVING;
                    btnSave.setCaption("Saving");
                }
            }
            else if (!hasChanged) {
                if (btnSave.currentState !== SAVED) {
                apf.setStyleClass(btnSave.$ext, "saved", ["saving"]);
                apf.setStyleClass(document.getElementById("saveStatus"), "saved", ["saving"]);
                    btnSave.currentState = SAVED;
                    btnSave.setCaption("Changes saved");
                }
            }
        }
        else {
            btnSave.setCaption("");
        }
    },
    /**
     * Autosave#showQuestionWindow(data) -> Void
     * - data (Object): Data about the revision to be potentially submitted, and
     * the contents of the file before and after the external edit.
     *
     * Shows a dialog that lets the user choose whether to keep the current state
     * of the document or to reload it to get the external changes.
     **/
    showQuestionWindow: function(data) {
        if (typeof winQuestionRev === "undefined") {
            return;
        }

        // No need to send these over the wire.
        delete data.revision.finalContent;
        delete data.revision.realContent;

        var self = this;
        var finalize = function() {
            self.changedPaths = [];
            winQuestionRev.hide();
            settings.model.setQueryValue("general/@autosaveenabled", this.prevAutoSaveValue || true);
        };

        // Reload page if it has been changed. Once reloaded, the page is saved
        // with the new content.
        var reloadAndSave = function(_page) {
            var path = Util.stripWSFromPath(_page.$model.data.getAttribute("path"));
            var index = self.changedPaths.indexOf(path);
            if (self.changedPaths.indexOf(path) > -1) {
                ide.addEventListener("afterreload", function onDocReload(e) {
                    if (e.doc === _page.$doc) {
                        // doc.setValue is redundant here, but it ensures that
                        // the proper value will be saved.
                        e.doc.setValue(e.data);
                        setTimeout(function() {
                            self.save(_page, true);
                        });
                        ide.removeEventListener("afterreload", onDocReload);
                    }
                });
                ide.dispatchEvent("reload", { doc : _page.$doc });
            }
            return index;
        };

        var dontReloadAndStore = function(_page) {
            var path = Util.stripWSFromPath(_page.$model.data.getAttribute("path"));
            var index = self.changedPaths.indexOf(path);
            if (index > -1) {
                ide.send({
                    command: "revisions",
                    subCommand: "getRealFileContents",
                    path: path,
                    nextAction: "storeAsRevision"
                });
            }
            return index;
        };

        var pages = tabEditors.getPages();
        Util.question(
            "File changed, reload tab?",
            "'" + data.path + "' has been modified while you were editing it.",
            "Do you want to reload it?",
            function YesReloadAll() {
                pages.forEach(reloadAndSave);
                setTimeout(finalize);
            },
            function NoDontReloadAll() {
                pages.forEach(dontReloadAndStore);
                setTimeout(finalize);
            }
        );
    },

    doAutoSave: function() {
        // Take advantage of the interval and dump our offlineQueue into
        // localStorage.
        localStorage.offlineQueue = JSON.stringify(this.offlineQueue);

        if (typeof tabEditors === "undefined" || !this.isAutoSaveEnabled)
            return;
            
        this.save(tabEditors.getPage());
    },

    /**
     * Revisions#save([page])
     * - page(Object): Page that contains the document to be saved. In case it is
     * not provided, the current one will be used
     * 
     * Prompts a save of the desired document.
     **/
    save: function(page, forceSave) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        if ((forceSave !== true) && (!Util.pageHasChanged(page) || !Util.pageIsCode(page)))
            return;

        var node = page.$doc.getNode();
        if (node.getAttribute("newfile") || node.getAttribute("debug"))
            return;

        Save.quicksave(page, function() {
            stripws.enable();
        }, true);
    },

    disableEventListeners: function() {
        if (this.$onMessageFn)
            ide.removeEventListener("socketMessage", this.$onMessageFn);

        if (this.$onOpenFileFn)
            ide.removeEventListener("afteropenfile", this.$onOpenFileFn);

        if (this.$onCloseFileFn)
            ide.removeEventListener("closefile", this.$onCloseFileFn);

        if (this.$onFileSaveFn)
            ide.removeEventListener("afterfilesave", this.$onFileSaveFn);

        if (this.$onSwitchFileFn)
            ide.removeEventListener("tab.beforeswitch", this.$onSwitchFileFn);

        if (this.$onAfterSwitchFn)
            ide.removeEventListener("tab.afterswitch", this.$onAfterSwitchFn);

        if (this.$afterSelectFn)
            lstRevisions.removeEventListener("afterselect", this.$afterSelectFn);

        if (this.$onExternalChange)
            ide.removeEventListener("beforewatcherchange", this.$onExternalChange);

        if (this.$onBeforeSaveWarning)
            ide.removeEventListener("beforesavewarn", this.$onBeforeSaveWarning);
    },

    enableEventListeners: function() {
        if (this.$onMessageFn)
            ide.addEventListener("socketMessage", this.$onMessageFn);

        if (this.$onOpenFileFn)
            ide.addEventListener("afteropenfile", this.$onOpenFileFn);

        if (this.$onCloseFileFn)
            ide.addEventListener("closefile", this.$onCloseFileFn);

        if (this.$onFileSaveFn)
            ide.addEventListener("afterfilesave", this.$onFileSaveFn);

        if (this.$onSwitchFileFn)
            ide.addEventListener("tab.beforeswitch", this.$onSwitchFileFn);

        if (this.$onAfterSwitchFn)
            ide.addEventListener("tab.afterswitch", this.$onAfterSwitchFn);

        if (this.$afterSelectFn)
            lstRevisions.addEventListener("afterselect", this.$afterSelectFn);

        if (this.$onExternalChange)
            ide.addEventListener("beforewatcherchange", this.$onExternalChange);

        if (this.$onBeforeSaveWarning)
            ide.addEventListener("beforesavewarn", this.$onBeforeSaveWarning);
    },

    enable: function() {
        this.nodes.each(function(item) {
            item.enable();
        });

        tabEditors.getPages().forEach(function(page) {
            var listener = this.docChangeListeners[page.name];
            if (listener) {
                page.$doc.removeEventListener("change", listener);
                if (page.$doc.acedoc) {
                    page.$doc.acedoc.removeEventListener("change", listener);
                }

                (page.$doc.acedoc || page.$doc).addEventListener("change", listener);
            }
        }, this);

        this.enableEventListeners();
    },

    disable: function() {
        this.hide();
        this.nodes.each(function(item){
            item.disable();
        });

        tabEditors.getPages().forEach(function(page) {
            var listener = this.docChangeListeners[page.name];
            if (listener) {
                page.$doc.removeEventListener("change", listener);
                if (page.$doc.acedoc) {
                    page.$doc.acedoc.removeEventListener("change", listener);
                }
            }
            if (page.$mdlRevisions) {
                delete page.$mdlRevisions;
            }
        }, this);

        this.disableEventListeners();
    },

    destroy: function() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }

        this.disableEventListeners();

        tabEditors.getPages().forEach(function(page) {
            var listener = this.docChangeListeners[page.name];
            if (listener) {
                page.$doc.removeEventListener("change", listener);
                if (page.$doc.acedoc) {
                    page.$doc.acedoc.removeEventListener("change", listener);
                }
            }
            if (page.$mdlRevisions) {
                delete page.$mdlRevisions;
            }
        }, this);

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});

