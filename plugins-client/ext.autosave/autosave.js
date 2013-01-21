/*global btnSave:true, tabEditors:true */
/*
 * Autosave Module for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var Util = require("core/util");

var Save = require("ext/save/save");
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
    nodes: [ ],

    docChangeTimeout: null,
    docChangeListeners: {},

    hook: function() {
        var _self = this;
        settings.addSettings("General", markupSettings);
        ide.addEventListener("settings.load", function(e){
            e.ext.setDefaults("general", [["autosaveenabled", "false"]]);
            _self.isAutoSaveEnabled = apf.isTrue(e.model.queryValue("general/@autosaveenabled")) || _self.tempEnableAutoSave;
        });

        ide.addEventListener("settings.save", function(e) {
            if (!e.model.data)
                return;

            _self.isAutoSaveEnabled = apf.isTrue(e.model.queryValue("general/@autosaveenabled")) || _self.tempEnableAutoSave;
        });

        // when we're back online we'll trigger an autosave if enabled
        ide.addEventListener("afteronline", function() {
            // the autosave thing will update the UI
            _self.doAutoSave();
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
        this.$onBeforeSaveWarning = this.onBeforeSaveWarning.bind(this);

        ide.addEventListener("afteropenfile", this.$onOpenFileFn);
        ide.addEventListener("closefile", this.$onCloseFileFn);
        ide.addEventListener("beforesavewarn", this.$onBeforeSaveWarning);
    },

    /////////////////////
    // Event listeners //
    /////////////////////

    onBeforeSaveWarning: function(e) {
        var isNewFile = apf.isTrue(e.doc.getNode().getAttribute("newfile"));
        if (!isNewFile && this.isAutoSaveEnabled) {
            this.save(e.doc.$page);
            return false;
        }
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

        (doc.acedoc || doc).addEventListener("change", this.docChangeListeners[path]);
    },

    onCloseFile: function(e) {
        if (tabEditors.getPages().length == 1)
            btnSave.hide();

        this.save(e.page);
    },

    onDocChange: function(e, doc) {
        var page = doc.$page;
        if (page && this.isAutoSaveEnabled && !Util.isNewPage(page)) {
            clearTimeout(this.docChangeTimeout);
            this.docChangeTimeout = setTimeout(function(self) {
                stripws.disable();
                self.save(page);
            }, CHANGE_TIMEOUT, this);
        }
    },

    doAutoSave: function() {
        // Take advantage of the interval and dump our offlineQueue into
        // localStorage.
        localStorage.offlineQueue = JSON.stringify(this.offlineQueue);

        if (typeof tabEditors === "undefined" || !this.isAutoSaveEnabled)
            return;

        this.save(ide.getActivePage());
    },

    /**
     * Autosave#save([page])
     * - page(Object): Page that contains the document to be saved. In case it is
     * not provided, the current one will be used
     *
     * Prompts a save of the desired document.
     **/
    save: function(page, forceSave) {
        var _self = this;

        if (!page || !page.$at)
            page = ide.getActivePage();

        if (!page)
            return;

        if ((forceSave !== true) && (!Util.pageHasChanged(page) || !Util.pageIsCode(page)))
            return;

        // not online? then we're not going to save it
        if (ide.onLine === false) {
            Save.setUiStateOffline();
            return;
        }

        var node = page.$doc.getNode();
        if (node.getAttribute("newfile") || node.getAttribute("debug"))
            return;

        Save.quicksave(page, function() {
            stripws.enable();
        }, true);
    },

    disableEventListeners: function() {
        if (this.$onOpenFileFn)
            ide.removeEventListener("afteropenfile", this.$onOpenFileFn);

        if (this.$onCloseFileFn)
            ide.removeEventListener("closefile", this.$onCloseFileFn);

        if (this.$onBeforeSaveWarning)
            ide.removeEventListener("beforesavewarn", this.$onBeforeSaveWarning);
    },

    enableEventListeners: function() {
        if (this.$onOpenFileFn)
            ide.addEventListener("afteropenfile", this.$onOpenFileFn);

        if (this.$onCloseFileFn)
            ide.addEventListener("closefile", this.$onCloseFileFn);

        if (this.$onBeforeSaveWarning)
            ide.addEventListener("beforesavewarn", this.$onBeforeSaveWarning);
    },

    enable: function() {
        this.$enable();

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
        this.$disable();

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

        this.$destroy();
    }
});
});
