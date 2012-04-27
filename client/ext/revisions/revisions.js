/**
 * Revisions Module for the Cloud9 IDE.
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");

//var TreeDocument = require("concorde/AceDocument");
var Save = require("ext/save/save");
//var Collab = require("c9/ext/collaborate/collaborate");
var Util = require("ext/revisions/revisions_util");
var settings = require("ext/settings/settings");
var markupSettings = require("text!ext/revisions/settings.xml");

// Ace dependencies
var EditSession = require("ace/edit_session").EditSession;
var Document = require("ace/document").Document;
var ProxyDocument = require("ext/code/proxydocument");

var markup = require("text!ext/revisions/revisions.xml");
var skin = require("text!ext/revisions/skin.xml");

var BAR_WIDTH = 200;
var INTERVAL = 60000;
var CHANGE_TIMEOUT = 5000;

module.exports = ext.register("ext/revisions/revisions", {
    name: "Revisions",
    dev: "Cloud9",
    alone: true,
    type: ext.GENERAL,
    markup: markup,
    offline: true,
    nodes: [],
    skin: skin,

    /**
     * Revisions#rawRevisions -> Object
     * Holds the cached revisions and some meta-data about them so Cloud9 can 
     * access them fast in the client-side. It also minimizes the amount of communication 
     * needed with the server in single-user mode.
     */ 
    rawRevisions: {},
    revisionsData: {},
    docChangeTimeout: null,
    docChangeListeners: {},
    /**
     * Revisions#revisionQueue -> Object
     * Contains the revisions that have been sent to the server, but not yet
     * confirmed to be saved.
     */ 
    revisionQueue: {},
    /**
     * Revisions#offlineQueue -> Array
     * Contains the revisions that have been saved during Cloud9 being offline.
     * Its items are not revision objects, but hold their own format (for
     * example, they have a generated timestamp of the moment of saving).
     */ 
    offlineQueue: [],

    /** related to: Revisions#show
     * Revisions#toggle() -> Void
     *
     * Initializes the plugin if it is not initialized yet, and shows/hides its UI.
     **/
    toggle: function() {
        if (!editors.currentEditor.ceEditor) {
            return;
        }

        ext.initExtension(this);
        if (this.panel.visible)
            this.hide();
        else
            this.show();
    },

    hook: function() {
        var self = this;

        commands.addCommand({
            name: "revisionpanel",
            hint: "File Revision History...",
            bindKey: { mac: "Command-B", win: "Ctrl-B" },
            isAvailable: function(editor) {
                return editor && !!editor.ceEditor;
            },
            exec: function () {
                self.toggle();
            }
        });

        this.nodes.push(
            this.mnuSave = new apf.menu({ id: "mnuSave" }),
            menus.addItemByPath("File/~", new apf.divider(), 800),
            menus.addItemByPath("File/File Revision History...", new apf.item({
                type: "check",
                checked: "[{require('ext/settings/settings').model}::general/@revisionsvisible]",
                disabled: "{!tabEditors.length}",
                command: "revisionpanel"
            }), 900),
            menus.addItemByPath("File/~", new apf.divider(), 910)
        );

        settings.addSettings("General", markupSettings);
        ide.addEventListener("settings.load", function(e){
            e.ext.setDefaults("general", [["autosaveenabled", "false"]]);
        });

        btnSave.removeAttribute("icon");
        btnSave.setAttribute("caption", "");
        btnSave.removeAttribute("tooltip");
        btnSave.setAttribute("margin", "0 20 0 20");
        btnSave.setAttribute("submenu", "mnuSave");
        btnSave.removeAttribute("command");

        this.$onMessageFn = this.onMessage.bind(this);
        this.$onOpenFileFn = this.onOpenFile.bind(this);
        this.$onCloseFileFn = this.onCloseFile.bind(this);
        this.$onFileSaveFn = this.onFileSave.bind(this);

        ide.addEventListener("socketMessage", this.$onMessageFn);
        ide.addEventListener("afteropenfile", this.$onOpenFileFn);
        ide.addEventListener("afterfilesave", this.$onFileSaveFn);
        ide.addEventListener("closefile", this.$onCloseFileFn);

        var c = 0;
        menus.addItemToMenu(this.mnuSave, new apf.item({
            caption: "Save Now",
            onclick: function() { Save.quicksave(); }
        }), c += 100);

        menus.addItemToMenu(this.mnuSave, new apf.item({
            caption : "Enable Auto-Save",
            type    : "check",
            checked : "{[{require('core/settings').model}::general/@autosaveenabled] != '' ? [{require('core/settings').model}::general/@autosaveenabled] : 'true'}"
        }), c += 100);

        menus.addItemToMenu(this.mnuSave, new apf.divider(), c += 100);
        menus.addItemToMenu(this.mnuSave, new apf.item({
            caption : "About Auto-Save",
            onclick: function(e) {
                self.toggleInfoDiv(1);
            }
        }), c += 100);

        this.defaultUser = { email: null };

        // This is the main interval. Whatever it happens, every `INTERVAL`
        // milliseconds, the plugin will attempt to save every file that is
        // open and dirty.
        this.saveInterval = setInterval(this.doAutoSave.bind(this), INTERVAL);

        // Retrieve the current user email in case we are not in Collab mode
        // (where we can retrieve the participants' email from the server) or
        // in OSS Cloud9.
        if (!this.isCollab || ide.workspaceId !== ".") {
            apf.ajax("/api/context/getemail", {
                method: "get",
                callback: function(data, state, extra) {
                    if (state === 200 && data) {
                        self.defaultUser = {
                            email: data
                        };
                    }
                }
            });
        }

        this.$onExternalChange = this.onExternalChange.bind(this);
        ide.addEventListener("beforewatcherchange", this.$onExternalChange);

        ide.addEventListener("beforesavewarn", function(e){
            var isNewFile = apf.isTrue(e.doc.getNode().getAttribute("newfile"));
            if (!isNewFile && Util.isAutoSaveEnabled()) {
                self.save();
                return false;
            }
        });

        this.$onAfterOnline = this.onAfterOnline.bind(this);
        ide.addEventListener("onafteronline", this.$onAfterOnline);
        this.$onRevisionSaved = this.onRevisionSaved.bind(this);
        ide.addEventListener("revisionSaved", this.$onRevisionSaved);
        this.$initWorker();
    },

    setSaveButtonCaption: function(caption) {
        if (caption) {
            return btnSave.setCaption(caption);
        }

        if (!tabEditors.activepage) {
            btnSave.setCaption("");
        }

        var hasChanged = Util.pageHasChanged(tabEditors.getPage());
        if (Util.isAutoSaveEnabled() && hasChanged) {
            btnSave.setCaption("Saving...");
        }
        else if (!hasChanged) {
            btnSave.setCaption("All changes saved");
        }
        else {
            btnSave.setCaption("");
        }
    },

    init: function() {
        var self = this;
        var page = tabEditors.getPage();
        if (page) {
            this.$switchToPageModel(page);
        }

        this.panel = new apf.bar({
            id: "revisionsPanel",
            visible: false,
            top: 2,
            bottom: 0,
            right: 0,
            width: BAR_WIDTH,
            height: "100%",
            "class": "revisionsBar"
        });
        this.nodes.push(this.panel);

        apf.document.documentElement.appendChild(winQuestionRev);

        /**
         * @todo the panel should move to the active editor tab using
         *       afterselect
         */
        ide.addEventListener("init.ext/code/code", function(e) {
            self.panel = ceEditor.parentNode.appendChild(self.panel);
            revisionsPanel.appendChild(pgRevisions);
        });

        this.$afterSelectFn = this.afterSelect.bind(this);
        lstRevisions.addEventListener("afterselect", this.$afterSelectFn);

        this.$onSwitchFileFn = this.onSwitchFile.bind(this);
        ide.addEventListener("editorswitch", this.$onSwitchFileFn);

        this.$onAfterSwitchFn = this.onAfterSwitch.bind(this);
        tabEditors.addEventListener("afterswitch", this.$onAfterSwitchFn);

        this.$setRevisionListClass();
    },

    $initWorker: function() {
        var worker = this.worker = new Worker("/static/ext/revisions/revisions_worker.js");
        worker.onmessage = this.onWorkerMessage.bind(this); //!
        worker.onerror = function(error) {
            throw(new Error("Error from worker:\n" + error.message));
        };
        // Preload diff libraries so they are available to the worker in case we
        // go offline.
        worker.postMessage({ type: "preloadlibs" });
    },

    $switchToPageModel: function(page) {
        if (!page || !Util.pageIsCode(page)) {
            return;
        }

        if (!page.$mdlRevisions) {
            page.$mdlRevisions = new apf.model();
        }

        this.$restoreSelection(page, page.$mdlRevisions);
        this.$afterModelUpdate = this.afterModelUpdate.bind(this);
        this.model = page.$mdlRevisions;
        this.model.addEventListener("afterload", this.$afterModelUpdate);
        return this.model;
    },

    $restoreSelection: function(page, model) {
        if (page.$showRevisions === true && lstRevisions) {
            var selection = lstRevisions.selection;
            var node = model.data.firstChild;
            if (selection && selection.length === 0 && page.$selectedRevision) {
                node = model.queryNode("revision[@id='" + page.$selectedRevision + "']");
            }
            lstRevisions.select(node);
        }
    },

    $getRevisionObject: function(path) {
        var revObj = this.rawRevisions[path];
        if (!revObj) {
            revObj = this.rawRevisions[path] = {};
            revObj.useCompactList = true;
            revObj.groupedRevisionIds = [];
            revObj.previewCache = {};
        }
        return revObj;
    },
    
    /////////////////////
    // Event listeners //
    /////////////////////

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
        // It could happen early, when `winQuestionRev` hasn't yet been defined
        ext.initExtension(this);
        var page = tabEditors.getPage();
        var doc = page.$doc;

        // We want to prevent autosave to keep saving while we are resolving
        // this query.
        this.prevAutoSaveValue = Util.isAutoSaveEnabled();
        settings.model.setQueryValue("general/@autosaveenabled", false);

        if (!this.isCollab(doc)) {
            ide.send({
                command: "revisions",
                subCommand: "getRealFileContents",
                path: Util.getDocPath(page)
            });
        }
        return false;
    },

    onOpenFile: function(data) {
        if (!data || !data.doc)
            return;

        var self = this;
        var doc = data.doc;
        var page = doc.$page;
        if (!Util.pageIsCode(page)) {
            return;
        }

        // Add document change listeners to an array of functions so that we
        // can clean up on disable plugin.
        var path = Util.getDocPath(doc.$page);
        if (path && !this.docChangeListeners[path]) {
            this.docChangeListeners[path] = function(e) {
                self.onDocChange.call(self, e, doc);
            };
        }

        this.$switchToPageModel(doc.$page);

        ide.send({
            command: "revisions",
            subCommand: "getRevisionHistory",
            path: path
        });

        (doc.acedoc || doc).addEventListener("change", this.docChangeListeners[path]);

        this.setSaveButtonCaption();
    },

    onSwitchFile: function(e) {
        this.$switchToPageModel(e.nextPage);
    },

    onAfterSwitch: function(e) {
        if (!Util.pageIsCode(e.nextPage)) {
            return;
        }

        if (e.nextPage.$showRevisions === true) {
            return this.show();
        }

        return this.hide();
    },

    onFileSave: function(e) {
        this.saveRevision(e.doc, e.silentsave);
    },

    onCloseFile: function(e) {
        var self = this;
        setTimeout(function() { self.setSaveButtonCaption(); });
        setTimeout(function() {
            var path = Util.getDocPath(e.page);
            if (self.rawRevisions[path]) {
                delete self.rawRevisions[path];
            }

            if (self.docChangeListeners[path]) {
                delete self.docChangeListeners[path];
            }

            for (var rev in self.revisionQueue) {
                var _path = self.revisionQueue[rev].path;
                if (_path && _path === path) {
                    delete self.revisionQueue[rev];
                }
            }
        }, 100);

        this.save(e.page);
    },

    $makeNewRevision: function(rev) {
        var revObj = this.$getRevisionObject(rev.path);
        rev.revisions = revObj.allRevisions;
        // To not have to extract and sort timestamps from allRevisions
        rev.timestamps = revObj.allTimestamps;
        this.worker.postMessage(rev);
    },

    onRevisionSaved: function(data) {
        var savedTS = parseInt(data.ts, 10);
        var matches = this.offlineQueue.filter(function(rev) { 
            return rev && (parseInt(rev.applyOn, 10) === savedTS);
        });
        
        if (matches.length) {
            this.$makeNewRevision(matches[0]);
        }
    },

    onAfterOnline: function(e) {
        var queue = this.offlineQueue;
        if (!queue || !queue.length) {
            return;
        }

        queue.forEach(function(rev, ind, _queue) {
            var prev = _queue[ind - 1];
            if (prev) {
                rev.applyOn = prev.ts;
            }
        });
        this.$makeNewRevision(queue.shift()); // First item doesn't depend on anything
    },

    afterSelect: function(e) {
        var node = e.currentTarget.selected;
        if (!node || e.currentTarget.selection.length > 1) {
            return;
        }

        var revObj = this.$getRevisionObject(Util.getDocPath());
        var id = parseInt(node.getAttribute("id"), 10);
        var cache = revObj.previewCache;
        if (cache[id]) {
            this.previewRevision(id, null, cache[id][1], cache[id][0]);
        }
        else {
            this.loadRevision(id, "preview");
        }
        tabEditors.getPage().$selectedRevision = id;
    },

    afterModelUpdate: function(e) {
        var model = e.currentTarget;
        if (!model || !model.data || model.data.childNodes.length === 0) {
            return;
        }

        if (typeof lstRevisions !== "undefined") {
            lstRevisions.setModel(model);
            this.$restoreSelection(tabEditors.getPage(), model);
        }
    },

    onDocChange: function(e, doc) {
        if (e.data && e.data.delta) {
            var suffix = e.data.delta.suffix;
            var user = this.getUser(suffix, doc);
            if (suffix && user) {
                this.addUserToDocChangeList(user, doc);
            }
        }

        clearTimeout(this.docChangeTimeout);
        this.docChangeTimeout = setTimeout(function(self) {
            if (doc.$page && Util.isAutoSaveEnabled()) {
                self.setSaveButtonCaption();
                self.save(doc.$page);
            }
        }, CHANGE_TIMEOUT, this);
    },

    onWorkerMessage: function(e) {
        if (!e.data.type)
            return;

        switch (e.data.type) {
            case "apply":
                this.applyRevision(e.data.content.id, e.data.content.value);
                break;
            case "preview":
                var content = e.data.content;
                this.previewRevision(content.id, content.value, content.ranges);
                break;
            case "newRevision":
                var revision = e.data.revision;
                // We don't save revision if it doesn't contain any patches
                // (i.e. nothing new was saved)
                if (revision.patch[0].length === 0) {
                    return;
                }

                this.revisionQueue[revision.ts] = {
                    path: e.data.path,
                    revision: revision
                };

                this.$saveExistingRevision(e.data.path, revision);
                break;
            case "recovery":
                if (e.data.revision.inDialog === true) {
                    this.showQuestionWindow(e.data);
                }
                break;
            case "debug":
                console.log("WORKER DEBUG\n", e.data.content);
                break;
        }
    },

    $saveExistingRevision: function(path, revision) {
        ide.send({
            command: "revisions",
            subCommand: "saveRevision",
            path: path,
            revision: revision
        });
    },

    onMessage: function(e) {
        var message = e.message;
        if (message.type !== "revision")
            return;

        var page = tabEditors.getPage();
        var revObj = this.$getRevisionObject(message.path);
        switch (message.subtype) {
            case "confirmSave":
                revObj = this.$getRevisionObject(message.path);
                var ts = message.ts;
                if (!this.revisionQueue[ts])
                    return;

                var revision = this.revisionQueue[ts].revision;
                if (revision) {
                    revision.saved = true;
                    revObj.allRevisions[ts] = revision;
                    delete this.revisionQueue[ts];

                    this.generateCache(revObj);
                    ide.dispatchEvent("revisionSaved", {
                        ts: ts,
                        path: message.path,
                        revision: revision
                    });

                    // If we are on the page for the doc, let's populate the model,
                    // otherwise it is a waste of resources
                    if (Util.getDocPath() === message.path) {
                        this.populateModel(revObj, this.model);
                    }
                }
                break;

            case "getRevisionHistory":
                if (message.body && message.body.revisions) {
                    revObj.allRevisions = message.body.revisions;
                }

                this.generateCache(revObj);
                if (!message.nextAction || !message.id) {
                    if (Util.getDocPath(page) === message.path &&
                        page.$showRevisions === true) {
                        this.populateModel(revObj, this.model);
                    }
                    break;
                }

                var group = {};
                var data = {
                    id: message.id,
                    group: group,
                    type: message.nextAction
                };

                var len = revObj.groupedRevisionIds.length;
                if (revObj.useCompactList && len > 0) {
                    for (var i = 0; i < len; i++) {
                        var groupedRevs = revObj.groupedRevisionIds[i];
                        if (groupedRevs.indexOf(parseInt(message.id, 10)) !== -1) {
                            groupedRevs.forEach(function(ts) {
                                group[ts] = this.getRevision(ts);
                            }, this);
                            break;
                        }
                    }

                    var keys = Object.keys(group)
                        .map(function(key) { return parseInt(key, 10); })
                        .sort(function(a, b) { return a - b; });

                    if (keys.length > 1) {
                        data.groupKeys = keys;
                        data.data = this.getRevision(keys[0]);
                        this.worker.postMessage(data);
                        break;
                    }
                }

                group[message.id] = this.getRevision(message.id);
                data.groupKeys = [parseInt(message.id, 10)];
                this.worker.postMessage(data);
                break;

            case "getRealFileContents":
                this.worker.postMessage({
                    inDialog: true,
                    type: "recovery",
                    lastContent: page.$doc.getValue(),
                    realContent: message.contents,
                    revisions: revObj.allRevisions,
                    path: message.path,
                    // To not have to extract and sort timestamps from allRevisions
                    timestamps: revObj.allTimestamps
                });
        }
    },


    /**
     * Revisions#showQuestionWindow(data) -> Void
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

        var self = this;
        var c9DocContent = data.revision.finalContent;
        var serverContent = data.revision.realContent;
        var page = tabEditors.getPage();
        var doc = page.$doc;
        var path = data.path;

        // No need to send these over the wire.
        delete data.revision.finalContent;
        delete data.revision.realContent;

        var dataToSend = {
            command: "revisions",
            subCommand: "saveRevision",
            path: path,
            revision: data.revision,
            forceRevisionListResponse: true
        };

        var finalize = function() {
            winQuestionRev.hide();
            settings.model.setQueryValue("general/@autosaveenabled", this.prevAutoSaveValue || true);
        };

        Util.question(
            "File changed, reload tab?",
            path + " has been modified while you were editing it.",
            "Do you want to reload it?",
            function YesReload() { // Yes
                doc.setValue(serverContent);
                self.save(page);
                finalize();
            },
            function NoDontReload() { // No
                doc.setValue(c9DocContent);
                ide.send(dataToSend);
                finalize();
            }
        );
    },

    toggleInfoDiv : function(show) {
    	ext.initExtension(this);
    	if (show == true)
        	revisionsInfo.$ext.style.display = "block";
        else
        	revisionsInfo.$ext.style.display = "none";
    },
    
    /**
     * Revisions#generateTimestamps(page)
     * - revObj(Object): Body of the message coming from the server
     *
     * This function is called every time the server sends an `update` message.
     * It generates the revision objects and the revision timestamp arrays used
     * throughout the extension.
     **/
    generateCache: function(revObj) {
        if (!revObj.allRevisions)
            return;

        var getTsAndSort = function(obj) {
            return Object.keys(obj)
                .map(function(ts) { return parseInt(ts, 10); })
                .sort(function(a, b) { return a - b; });
        };

        // Create an array of the numeric timestamps. `allTimestamps` will store
        // the numeric array. This is the only place where `allTimestamps should
        // be modified.
        revObj.allTimestamps = getTsAndSort(revObj.allRevisions);

        // Generate a compacted version of the revision list, where revisions are
        // grouped by close periods of time. Changes `compactTimestamps` to
        // reflect the ones in the compact list.
        revObj.compactRevisions = this.getCompactRevisions(revObj);
        revObj.compactTimestamps = getTsAndSort(revObj.compactRevisions);
    },

    toggleListView: function(model) {
        var revObj = this.$getRevisionObject(Util.getDocPath());
        revObj.useCompactList = !!!revObj.useCompactList;

        // We don't want to mix up compact/detailed preview caches
        revObj.previewCache = {};
        this.$setRevisionListClass();

        // Select first child upon change of list view
        setTimeout(function() {
            var node = model.data.firstChild;
            if (node) {
                lstRevisions.select(node);
            }
        });
    },

    /**
     * Revisions#populateModel()
     *
     * Populates the revisions model with the current revision list and attributes.
     **/
    populateModel: function(revObj, model) {
        if (!revObj || !model) { 
            console.error("Expected a parameter and a model");
            return; 
        }

        var revisions, timestamps;
        if (revObj.useCompactList && revObj.compactRevisions && revObj.compactTimestamps) {
            revisions = revObj.compactRevisions;
            timestamps = revObj.compactTimestamps;
        }
        else {
            revisions = revObj.allRevisions;
            timestamps = revObj.allTimestamps;
        }

        var contributorToXml = function(c) {
            return "<contributor email='" + c + "' />";
        };
        var revsXML = "";
        for (var i = timestamps.length - 1; i >= 0; i--) {
            var ts = timestamps[i];
            var rev = revisions[ts];
            var friendlyDate = Util.localDate(ts).toString("MMM d, h:mm tt");
            var restoring = rev.restoring || "";
            var savedToDisk = rev.saved !== false;

            revsXML += "<revision " +
                "id='" + rev.ts + "' " +
                "name='" + friendlyDate + "' " +
                "saved='" + savedToDisk + "' " +
                "silentsave='" + rev.silentsave + "' " +
                "restoring='" + restoring + "'>";

            var contributors = "";
            if (rev.contributors && rev.contributors.length) {
                contributors = rev.contributors.map(contributorToXml).join("");
            }

            revsXML += "<contributors>" + contributors + "</contributors></revision>";
        }

        this.model.load("<revisions>" + revsXML + "</revisions>");
    },

    /**
     * Revisions#isCollab(doc) -> Boolean
     * - doc(Object): Document object
     *
     * Returns true if this document is part of a collaborations session, false
     * otherwise
     **/
    isCollab: function(doc) {
        //var doc = (doc || tabEditors.getPage().$doc);
        //return doc.acedoc.doc instanceof TreeDocument;
        return false;
    },

    getRevision: function(id, content) {
        id = parseInt(id, 10);

        var revObj = this.$getRevisionObject(Util.getDocPath());
        var tstamps = revObj.allTimestamps.slice(0);
        var revision = tstamps.indexOf(id);

        if (revision !== -1) {
            var data = {
                content: content,
                id: id,
                revision: revision,
                ts: tstamps,
                tsValues: {}
            };

            for (var t = 0, l = tstamps.length; t < l; t++) {
                data.tsValues[tstamps[t]] = revObj.allRevisions[tstamps[t]].patch;
            }
            return data;
        }
    },

    /**
     * Revisions#loadRevision(id, nextAction)
     * - id(Number): Timestamp id of the revision to load
     * - nextAction(String): Action to perform when loaded (currently either "preview" or "apply")
     *
     * Retrieves the original contents of a particular revision. It might be that
     * the original contents were cached, in which case the round trip to the
     * server is avoided. The `nextAction` parameter will eventually tell the client
     * what to do once everything is loaded.
     **/
    loadRevision: function(id, nextAction) {
        if (nextAction === "preview") {
            this.$setRevisionNodeAttribute(id, "loading_preview", "true");
        }
        else {
            this.$setRevisionNodeAttribute(id, "loading", "true");
        }

        var path = Util.getDocPath();
        var revObj = this.rawRevisions[path];
        if (revObj) {
            return this.onMessage({
                message: {
                    id: id,
                    type: "revision",
                    subtype: "getRevisionHistory",
                    path: path,
                    nextAction: nextAction
                }
            });
        }

        // We haven't cached the original content. Let's load it from the server.
        ide.send({
            command: "revisions",
            subCommand: "getRevisionHistory",
            nextAction: nextAction,
            path: path,
            id: id
        });
    },

    /**
     * Revisions#getCompactRevisions() -> Object
     *
     * Creates a compacted revisions object from the extended revisions object
     * returned from the server. A compacted revisions object (CRO) is a revision
     * object with less detailed revisions, and it does that by grouping revisions
     * that are close in time. That lapse in time is determined by the `TIMELAPSE`
     * constant.
     *
     * Assumes that `allRevisions` is populated at this point.
     **/
    getCompactRevisions: function(revObj) {
        var timestamps = revObj.allTimestamps.slice(0);
        var all = revObj.allRevisions;
        var compactRevisions = {};
        var finalTS = [];
        var isRestoring = function(id) { return all[id] && all[id].restoring; };

        // This extracts the timestamps that belong to 'restoring' revisions to
        // put them in their own slot, since we don't want them to be grouped in
        // the compacted array. They should be independent of the compacting to
        // not confuse the user.
        var repack = function(prev, id) {
            var last = prev[prev.length - 1];
            if (last.length === 0 || (!isRestoring(id) && !isRestoring(last[0]))) {
                last.push(id);
            }
            else { prev.push([id]); }
            return prev;
        };

        Util.compactRevisions(timestamps).forEach(function(ts) {
            finalTS.push.apply(finalTS, ts.__reduce(repack, [[]]));
        });

        revObj.groupedRevisionIds = finalTS;

        finalTS.forEach(function(tsGroup) {
            // The property name will be the id of the last timestamp in the group.
            var id = tsGroup[tsGroup.length - 1];
            var groupObj = finalTS[id] = {
                // Store first timestamp in the group, for future nextActions
                first: tsGroup[0],
                patch: []
            };

            // We get all the properties from the revision that has the last
            // timestamp in the group
            Object.keys(all[id]).forEach(function(key) {
                if (key !== "patch") { groupObj[key] = all[id][key]; }
            });

            var contributors = [];
            tsGroup.forEach(function(ts) {
                if (all[ts]) {
                    // Add the patch to the list. In this case, and because of
                    // the Diff format nature, it will just work by concatenating
                    // strings.
                    groupObj.patch.push(all[ts].patch);

                    // Add the contributors to every revision in the group to the
                    // contributors in the head revision `contributors` array.
                    if (all[ts].contributors) {
                        all[ts].contributors.forEach(function(ct) {
                            if (contributors.indexOf(ct) === -1) {
                                contributors.push(ct);
                            }
                        });
                    }
                }
            });
            groupObj.contributors = contributors;
            compactRevisions[id] = groupObj;
        });

        return compactRevisions;
    },

    /**
     * Revisions#applyRevision(id, value)
     * - id(Number): Numeric timestamp identifier of the revision
     * - value(String): Contents of the document at the time of the revision
     *
     * Applies the revision to the current document. That will trigger the client
     * to replace the contents of the document by the ones of the state of the
     * document when that revision was saved. It adds a 'recovery' revision to
     * the list of revisions.
     **/
    applyRevision: function(id, value) {
        // Assuming that we are applying the revision to the current page. Could
        // it happen any other way?
        var doc = tabEditors.getPage().$doc;
        doc.setValue(value);

        this.$setRevisionNodeAttribute(id, "loading", "false");
        this.saveRevision(doc, true, id);
        this.hide();
    },

    /**
     * Revisions#previewRevision(id, value, ranges[, newSession])
     * - id(Number): Numeric timestamp identifier of the revision
     * - value(String): Contents of the document at the time of the revision
     * - ranges(Array): Range of differences showing what changes were introduced by this revision
     *
     * Previews changes made to the document by that particular revision. It
     * creates a new temporary Ace session and replaces the real document by this
     * read-only session.
     **/
    previewRevision: function(id, value, ranges, newSession) {
        var editor = ceEditor.$editor;
        var session = editor.getSession();
        var revObj = this.$getRevisionObject(Util.getDocPath());

        if (session.previewRevision !== true && !revObj.realSession) {
            revObj.realSession = session;
        }

        var doc;
        if (!newSession) {
            doc = new ProxyDocument(new Document(value || ""));
            newSession = new EditSession(doc, revObj.realSession.getMode());
            newSession.previewRevision = true;

            ranges.forEach(function(range) {
                Util.addCodeMarker(newSession, doc, range[4], {
                    fromRow: range[0],
                    fromCol: range[1],
                    toRow: range[2],
                    toCol: range[3]
                });
            });

            editor.setSession(newSession);
            var firstChange = 0;
            if (ranges.length > 0) {
                // Retrieve the first row of the first change in the changeset.
                firstChange = ranges[0][0];
            }
            // Scroll to the first change, leaving it in the middle of the screen.
            editor.renderer.scrollToRow(firstChange - (editor.$getVisibleRowCount() / 2));
        }
        else {
            editor.setSession(newSession);
            doc = newSession.doc;
        }

        editor.selection.clearSelection();

        // Look for the node that references the revision we are loading and
        // update its state to loaded.
        this.$setRevisionNodeAttribute(id, "loading_preview", "false");
        if (!revObj.previewCache) {
            revObj.previewCache = {};
        }
        if (!revObj.previewCache[id]) {
            revObj.previewCache[id] = [newSession, ranges];
        }
    },

    /**
     * Revisions#goToEditView()
     *
     * Ensures that the editor is in edit view (i.e. not read-only), and that it
     * contains the latest content.
     **/
    goToEditView: function() {
        if (typeof ceEditor === "undefined")
            return;

        var revObj = this.$getRevisionObject(Util.getDocPath());
        if (revObj.realSession) {
            ceEditor.$editor.setSession(revObj.realSession);
        }
        ceEditor.$editor.setReadOnly(false);
        ceEditor.show();
    },

    doAutoSave: function() {
        if (!self.tabEditors || !Util.isAutoSaveEnabled())
            return;

        tabEditors.getPages().forEach(this.save, this);
    },

    /**
     * Revisions#save([page])
     * - page(Object): Page that contains the document to be saved. In case it is
     * not provided, the current one will be used
     *
     * Prompts a save of the desired document.
     **/
    save: function(page) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page || !Util.pageHasChanged(page) || !Util.pageIsCode(page))
            return;

        var node = page.$doc.getNode();
        if (node.getAttribute("newfile") || node.getAttribute("debug"))
            return;

        ext.initExtension(this); //Why???
        Save.quicksave(page, function(){}, true);
    },

    /**
     * Revisions#saveRevision(doc, silentsave, restoring) -> Void
     * - doc (Object): Document Object that refers to the document we want to save a revision for
     * - silentsave (Boolean): Indicates whether the save is automatic or forced
     * - restoring (Boolean): Indicates whether we are saving a previous revision retrieval
     *
     * Sends the necessary data for the server so it can save a revision of the
     * current document.
     **/
    saveRevision: function(doc, silentsave, restoring) {
        var page = doc.$page;
        if (!Util.pageIsCode(page)) {
            return;
        }

        var docPath = Util.getDocPath(page);
        var contributors = this.$getEditingUsers(docPath);
        if (contributors.length === 0 && this.defaultUser.email) {
            contributors.push(this.defaultUser.email);
        }

        var data = {
            command: "revisions",
            subCommand: "saveRevisionFromMsg",
            path: docPath,
            silentsave: !!silentsave,
            restoring: restoring,
            contributors: contributors
        };

        this.setSaveButtonCaption();

        // If we are not in a collaboration document we do all the processing
        // in a worker istead of sending over to the server. Later on, we'll
        // send the new revision to the server.
        if (!this.isCollab(doc)) {
            data.type = "newRevision";
            data.lastContent = doc.getValue();

            if (ide.onLine === false) {
                data.ts = Date.now();
                this.offlineQueue.push(data);
                return;
            }
            else {
                var revObj = this.$getRevisionObject(docPath);
                data.revisions = revObj.allRevisions;
                // To not have to extract and sort timestamps from allRevisions
                data.timestamps = revObj.allTimestamps;
                this.worker.postMessage(data);
                return;
            }
        }

        ide.send(data);
        this.$resetEditingUsers(docPath);
    },

    /**
     * Revisions#addUserToDocChangeList(user, doc)
     * - user(Object): User object
     * - doc(Object): Document that has been changed
     *
     * Appends a new user to the list of people who has made changes in the
     * document since the last revision was saved.
     **/
    addUserToDocChangeList: function(user, doc) {
        if (user && doc) {
            var path = Util.getDocPath(doc.$page);
            var stack = this.revisionsData[path];
            if (stack && (stack.usersChanged.indexOf(user.user.email) === -1)) {
                stack.usersChanged.push(user.user.email);
            }
        }
    },

    getUser: function(suffix, doc) {
        return null;

        /*
        if (doc && doc.users && doc.users[suffix]) {
            var uid = doc.users[suffix].split("-")[0];
            if (Collab.users[uid]) {
                return Collab.users[uid];
            }
        }
        */
    },

    getUserColorByEmail: function(email) {
        var color;
        /*
        var user = Collab.model.queryNode("group[@name='members']/user[@email='" + email + "']");
        if (user) {
            color = user.getAttribute("color");
        }
        */
        return color;
    },

    /**
     * Revisions#$setRevisionNodeAttribute()
     *
     * Sets an attribute on a revision apf node object in the model.
     **/
    $setRevisionNodeAttribute: function(id, attr, value) {
        var node = this.model.queryNode("revision[@id='" + id + "']");
        if (node) {
            apf.xmldb.setAttribute(node, attr, value);
        }
    },

    $getEditingUsers: function(path) {
        var users = [];
        var rev = this.revisionsData[path];
        if (rev && rev.usersChanged) {
            users = rev.usersChanged;
        }
        return users;
    },

    $resetEditingUsers: function(path) {
        if (this.revisionsData[path]) {
            this.revisionsData[path] = [];
        }
        return this.revisionsData[path];
    },

    $setRevisionListClass: function() {
        var revObj = this.rawRevisions[Util.getDocPath()];
        if (!revObj) {
            return;
        }

        if (revObj.useCompactList === true) {
            apf.setStyleClass(lstRevisions.$ext, "compactView");
        }
        else {
            apf.setStyleClass(lstRevisions.$ext, null, ["compactView"]);
        }

        this.populateModel(revObj, this.model);
    },

    show: function() {
        var page = tabEditors.getPage();
        if (!Util.pageIsCode(page)) {
            return;
        }

        ext.initExtension(this);

        settings.model.setQueryValue("general/@revisionsvisible", true);

        if (!this.panel.visible) {
            ceEditor.$ext.style.right = BAR_WIDTH + "px";
            page.$showRevisions = true;
            this.panel.show();
            ide.dispatchEvent("revisions.visibility", {
                visibility: "shown",
                width: BAR_WIDTH
            });
        }

        var model = page.$mdlRevisions;
        if (lstRevisions && model && (lstRevisions.getModel() !== model)) {
            lstRevisions.setModel(model);
        }

        if (model) {
            if (!model.data || model.data.length === 0) {
                this.populateModel(this.rawRevisions[Util.getDocPath()], model);
            }
            else {
                this.$restoreSelection(page, model);
            }
        }
    },

    hide: function() {
        settings.model.setQueryValue("general/@revisionsvisible", false);
        ceEditor.$ext.style.right = "0";
        tabEditors.getPage().$showRevisions = false;
        this.panel.hide();
        ide.dispatchEvent("revisions.visibility", { visibility: "hidden" });

        if (lstRevisions) {
            lstRevisions.selectList([]); // Unselect everything
        }

        this.goToEditView();
    },

    disableEventListeners: function() {
        if (this.$onMessageFn) {
            ide.removeEventListener("socketMessage", this.$onMessageFn);
        }

        if (this.$onOpenFileFn) {
            ide.removeEventListener("afteropenfile", this.$onOpenFileFn);
        }

        if (this.$onCloseFileFn) {
            ide.removeEventListener("closefile", this.$onCloseFileFn);
        }

        if (this.$onFileSaveFn) {
            ide.removeEventListener("afterfilesave", this.$onFileSaveFn);
        }

        if (this.$onSwitchFileFn) {
            ide.removeEventListener("editorswitch", this.$onSwitchFileFn);
        }

        if (this.$onAfterSwitchFn) {
            ide.removeEventListener("afterswitch", this.$onAfterSwitchFn);
        }

        if (this.$afterSelectFn) {
            lstRevisions.removeEventListener("afterselect", this.$afterSelectFn);
        }
    },

    enableEventListeners: function() {
        if (this.$onMessageFn) {
            ide.addEventListener("socketMessage", this.$onMessageFn);
        }

        if (this.$onOpenFileFn) {
            ide.addEventListener("afteropenfile", this.$onOpenFileFn);
        }

        if (this.$onCloseFileFn) {
            ide.addEventListener("closefile", this.$onCloseFileFn);
        }

        if (this.$onFileSaveFn) {
            ide.addEventListener("afterfilesave", this.$onFileSaveFn);
        }

        if (this.$onSwitchFileFn) {
            ide.addEventListener("editorswitch", this.$onSwitchFileFn);
        }

        if (this.$onAfterSwitchFn) {
            ide.addEventListener("afterswitch", this.$onAfterSwitchFn);
        }

        if (this.$afterSelectFn) {
            lstRevisions.addEventListener("afterselect", this.$afterSelectFn);
        }
    },

    enable: function() {
        this.nodes.each(function(item) {
            item.enable();
        });

        tabEditors.getPages().forEach(function(page) {
            var listener = this.docChangeListeners[page.name];
            if (listener) {
                page.$doc.removeEventListener(listener);
                if (page.$doc.acedoc) {
                    page.$doc.acedoc.removeEventListener(listener);
                }

                (page.$doc.acedoc || page.$doc).addEventListener(listener);
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
                page.$doc.removeEventListener(listener);
                if (page.$doc.acedoc) {
                    page.$doc.acedoc.removeEventListener(listener);
                }
            }
            if (page.$mdlRevisions) {
                delete page.$mdlRevisions;
            }
        }, this);

        this.disableEventListeners();
    },

    destroy: function() {
        menus.remove("File/File revisions");
        menus.remove("File/~", 1000);

        commands.removeCommandByName("revisionpanel");

        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }

        this.disableEventListeners();

        tabEditors.getPages().forEach(function(page) {
            var listener = this.docChangeListeners[page.name];
            if (listener) {
                page.$doc.removeEventListener(listener);
                if (page.$doc.acedoc) {
                    page.$doc.acedoc.removeEventListener(listener);
                }
            }
            if (page.$mdlRevisions) {
                delete page.$mdlRevisions;
            }
        }, this);

        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});
