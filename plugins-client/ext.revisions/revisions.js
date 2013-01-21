/*global winQuestionRev winQuestionRevMsg revisionsPanel mnuContextTabs
 * mnuCtxEditor tabEditors mnuCtxEditorCut pgRevisions lstRevisions revisionsInfo
 */

/**
 * Revisions Module for the Cloud9 IDE!
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

define(function(require, exports, module) {

//Core dependencies
var ide = require("core/ide");
var ext = require("core/ext");
var CoreUtil = require("core/util");

// APF dependencies
var editors = require("ext/editors/editors");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var settings = require("ext/settings/settings");

// Ace dependencies
var EditSession = require("ace/edit_session").EditSession;
var Document = require("ace/document").Document;
var ProxyDocument = require("ext/code/proxydocument");

// Revision dependencies
var markup = require("text!ext/revisions/revisions.xml");
markup = markup.replace("{ide.staticPrefix}", ide.staticPrefix);
var skin = require("text!ext/revisions/skin.xml");
var Util = require("ext/revisions/revisions_util");
var cssString = require("text!ext/revisions/style.css");
var Code = require("ext/code/code");

var beautify = require("ext/beautify/beautify");
var statusbar = require("ext/statusbar/statusbar");
var stripws = require("ext/stripws/stripws");
var language = require("ext/language/language");

// postfix with plugin because its a pretty generic term...
var savePlugin = require("ext/save/save");

// Constants
var BAR_WIDTH = 200;
var INTERVAL = 60000;
var isInfoActive = false;

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
    /**
     * Revisions#revisionQueue -> Object
     * Contains the revisions that have been sent to the server, but not yet
     * confirmed to be saved.
     */
    revisionQueue: {},

    /** related to: Revisions#onExternalChange
     * Holds the list of filepaths that have ben changed in the server from an
     * external source.
     **/
    changedPaths: [],

    /** related to: Revisions#show
     * Revisions#toggle() -> Void
     *
     * Initializes the plugin if it is not initialized yet, and shows/hides its UI.
     **/
    toggle: function() {
        if (editors.currentEditor.path !== "ext/code/code")
            return;

        ext.initExtension(this);
        if (this.panel.visible)
            this.hide();
        else
            this.show();
    },

    hook: function() {
        // We don't want to have revisions for guests.
        if (ide.readonly) {
            return;
        }

        var self = this;
        commands.addCommand({
            name: "revisionpanel",
            hint: "File Revision History...",
            bindKey: { mac: "Command-B", win: "Ctrl-B" },
            isAvailable: function(editor) {
                return editor && editor.path == "ext/code/code";
            },
            exec: function () { self.toggle(); }
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

        ide.addEventListener("init.ext/tabbehaviors/tabbehaviors", function() {
            menus.addItemByPath("~", new apf.divider(), 2000, mnuContextTabs);
            menus.addItemByPath("File Revision History...", new apf.item({
                command : "revisionpanel"
            }), 2100, mnuContextTabs);
        });

        ide.addEventListener("init.ext/code/code", function() {
            self.nodes.push(
                mnuCtxEditor.insertBefore(new apf.item({
                    id : "mnuCtxEditorRevisions",
                    caption : "File Revision History...",
                    command: "revisionpanel"
                }), mnuCtxEditorCut),
                mnuCtxEditor.insertBefore(new apf.divider({
                    visible : "{mnuCtxEditorRevisions.visible}"
                }), mnuCtxEditorCut)
            );
        });

        // Declaration of event listeners
        this.$onMessageFn = this.onMessage.bind(this);
        this.$onOpenFileFn = this.onOpenFile.bind(this);
        this.$onCloseFileFn = this.onCloseFile.bind(this);
        this.$onFileSaveFn = this.onFileSave.bind(this);
        this.$onAfterOnline = this.onAfterOnline.bind(this);
        this.$onRevisionSaved = this.onRevisionSaved.bind(this);
        this.$onExternalChange = this.onExternalChange.bind(this);

        ide.addEventListener("socketMessage", this.$onMessageFn);
        ide.addEventListener("afteropenfile", this.$onOpenFileFn);
        ide.addEventListener("afterfilesave", this.$onFileSaveFn);
        ide.addEventListener("closefile", this.$onCloseFileFn);
        ide.addEventListener("afteronline", this.$onAfterOnline);
        ide.addEventListener("revisionSaved", this.$onRevisionSaved);
        ide.addEventListener("beforewatcherchange", this.$onExternalChange);

        // Remove the revision file if the file is removed.
        ide.addEventListener("removefile", this.onFileRemove.bind(this));

        // Rename/move the revision file if the file is renamed/moved
        ide.addEventListener("updatefile", this.onFileUpdate.bind(this));

        // Retrieve the current user email in case we are not in Collab mode
        // (where we can retrieve the participants' email from the server) or
        // in OSS Cloud9.
        if (window.cloud9config.hosted || !this.isCollab()) {
            if (ide.loggedIn) {
                apf.ajax("/api/context/getemail", {
                    method: "get",
                    callback: function(data, state, extra) {
                        if (state === 200 && data) {
                            self.defaultUser = { email: data };
                        }
                    }
                });
            }
        }

        this.defaultUser = { email: null };
        this.offlineQueue = [];

        // Contains the revisions that have been saved during Cloud9 being offline.
        // Its items are not revision objects, but hold their own format (for
        // example, they have a generated timestamp of the moment of saving).
        if (localStorage.offlineQueue) {
            try {
                this.offlineQueue = JSON.parse(localStorage.offlineQueue);
            }
            catch(e) {
                this.offlineQueue = [];
            }
        }

        this.$initWorker();
    },

    $initWorker: function() {
        this.worker = new Worker(ide.workerPrefix + "/ext/revisions/revisions_worker.js");
        this.worker.onmessage = this.onWorkerMessage.bind(this);
        this.worker.onerror = function(error) {
            throw(new Error("Error from worker:\n" + error.message));
        };
        // Preload diff libraries so they are available to the worker in case we
        // go offline.
        this.worker.postMessage({ type: "preloadlibs", prefix: ide.workerPrefix });
    },

    init: function() {
        var self = this;
        var page = ide.getActivePage();
        if (page) {
            this.$switchToPageModel(page);
        }

        apf.importCssString(cssString);

        this.nodes.push(this.panel = new apf.bar({
                id: "revisionsPanel",
                visible: false,
                top: 6,
                bottom: 0,
                right: 0,
                width: BAR_WIDTH,
                height: "100%",
                "class": "revisionsBar"
            })
        );

        ide.addEventListener("init.ext/code/code", function(e) {
            self.panel = e.ext.amlEditor.parentNode.appendChild(self.panel);
            revisionsPanel.appendChild(pgRevisions);
        });

        apf.addEventListener("exit", function() {
            localStorage.offlineQueue = JSON.stringify(self.offlineQueue);
        });

        this.$afterSelectFn = this.afterSelect.bind(this);
        this.$afterModelUpdate = this.afterModelUpdate.bind(this);
        this.$onSwitchFileFn = this.onSwitchFile.bind(this);

        lstRevisions.addEventListener("afterselect", this.$afterSelectFn);
        ide.addEventListener("tab.afterswitch", this.$onSwitchFileFn);

        this.$setRevisionListClass();
    },

    $switchToPageModel: function(page) {
        if (!CoreUtil.pageIsCode(page)) {
            return;
        }
        if (!page.$mdlRevisions) {
            page.$mdlRevisions = new apf.model();
        }

        // Commented the line below out because it would try to select
        // and update nodes in the cached representation.
        //this.$restoreSelection(page, page.$mdlRevisions);
        this.model = page.$mdlRevisions;
        this.model.addEventListener("afterload", this.$afterModelUpdate);
    },

    $restoreSelection: function(page, model) {
        if (page.$showRevisions !== true || !window.lstRevisions || CoreUtil.isNewPage(page) || !model.data)
            return;

        var selection = lstRevisions.selection;
        var node = model.data.firstChild;

        if (selection && selection.length === 0 && page.$selectedRevision)
            node = model.queryNode("revision[@id='" + page.$selectedRevision + "']");

        lstRevisions.select(node);
    },

    $getRevisionObject: function(path) {
        var revObj = this.rawRevisions[path];
        if (!revObj) {
            revObj = this.rawRevisions[path] = {};
            revObj.useCompactList = true;
            revObj.groupedRevisionIds = [];
            revObj.previewCache = {};
            revObj.usersChanged = [];
        }
        return revObj;
    },

    hideRevisionsInfo : function() {
        if (isInfoActive || !window.revisionsInfo)
            return;

        setTimeout(function(e) {
            if (!isInfoActive) {
                apf.tween.single(revisionsInfo, {
                    from:1,
                    to:0,
                    steps: 10,
                    type: "opacity",
                    anim: apf.tween.easeInOutCubic,
                    interval: 30
                });
            }
        }, 200);
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
        if (e.action == "remove")
            return;

        // We want to prevent autosave to keep saving while we are resolving
        // this query.
        this.prevAutoSaveValue = this.isAutoSaveEnabled;
        settings.model.setQueryValue("general/@autosaveenabled", false);

        var path = CoreUtil.stripWSFromPath(e.path);
        this.changedPaths.push(path);

        // Force initialization of extension (so that UI is available)
        ext.initExtension(this);

        if (winQuestionRev.visible === true || this.isCollab())
            return;

        ide.send({
            command: "revisions",
            subCommand: "getRealFileContents",
            path: path
        });

        return false;
    },

    onOpenFile: function(data) {
        if (!data || !data.doc)
            return;

        var doc = data.doc;
        if (!doc.acedoc)
            return;

        var page = doc.$page || ide.getActivePage();

        this.$switchToPageModel(page);
        if (!CoreUtil.isNewPage(page)) {
            ide.send({
                command: "revisions",
                subCommand: "getRevisionHistory",
                path: CoreUtil.getDocPath(page)
            });
        }

        var _self = this;
        (doc.acedoc || doc).addEventListener("change", function(e) {
            _self.onDocChange(e, doc);
        });
    },

    onDocChange: function(e, doc) {
        if (!e.data || !e.data.delta || !e.data.delta[0])
            return;

        var _self = this;
        setTimeout(function() {
            var suffix = e.data.delta[0].suffix;
            if (!suffix)
                return;

            var user = _self.getUser(suffix, doc);
            if (!user)
                return;

            _self.addUserToDocChangeList(user, doc);
        }, 50);
    },

    onFileUpdate: function(data) {
        if (!data || !data.path || !data.newPath)
            return;

        var path = CoreUtil.stripWSFromPath(data.path);
        var newPath = CoreUtil.stripWSFromPath(data.newPath);

        // Remove reference by path to old path in `rawRevisions` and
        // create reference with the new path.
        if (this.rawRevisions[path]) {
            this.rawRevisions[newPath] = this.rawRevisions[path];
            delete this.rawRevisions[path];
        }

        ide.send({
            command: "revisions",
            subCommand: "moveRevision",
            path: path,
            newPath: newPath
        });
    },

    onFileRemove: function(data) {
        ide.send({
            command: "revisions",
            subCommand: "removeRevision",
            isFolder: data.isFolder,
            path: CoreUtil.stripWSFromPath(data.path)
        });
    },

    onSwitchFile: function(e) {
        var page = ide.getActivePage();
        this.$switchToPageModel(page);

        if (!CoreUtil.pageIsCode(page) || !this.panel) {
            return;
        }

        if (page.$showRevisions === true) {
            this.show();
        }
        else {
            this.hide();
        }
    },

    onFileSave: function(e) {
        this.saveRevision(e.doc, e.silentsave);
    },

    onCloseFile: function(e) {
        var self = this;
        setTimeout(function() {
            var path = CoreUtil.getDocPath(e.page);
            if (self.rawRevisions[path]) {
                delete self.rawRevisions[path];
            }

            self.worker.postMessage({
                type: "closefile",
                path: path
            });

            for (var rev in self.revisionQueue) {
                var _path = self.revisionQueue[rev].path;
                if (_path && _path === path) {
                    delete self.revisionQueue[rev];
                }
            }
        }, 100);
    },

    $makeNewRevision: function(rev) {
        var revObj = this.$getRevisionObject(rev.path);
        rev.revisions = revObj.allRevisions;
        this.worker.postMessage(rev);
    },

    onRevisionSaved: function(data) {
        if (typeof data.ts !== "number")
            throw new Error("Expected number, but got " + typeof data.ts);

        var queue = this.offlineQueue;
        for (var i = 0, l = queue.length; i < l; i++) {
            var rev = queue[i];
            if (rev && rev.applyOn === data.ts) {
                this.$makeNewRevision(rev);
                break;
            }
        }
    },

    onAfterOnline: function(e) {
        if (!this.offlineQueue.length) {
            return;
        }

        this.offlineQueue.forEach(function(rev, ind, _queue) {
            var prev = _queue[ind - 1];
            if (prev) {
                rev.applyOn = prev.ts;
            }
        });
        this.$makeNewRevision(this.offlineQueue.shift()); // First item doesn't depend on anything

        localStorage.offlineQueue = "[]"; // Empty local storage
        this.offlineQueue = [];
    },

    afterSelect: function(e) {
        var node = e.currentTarget.selected;
        if (!node || e.currentTarget.selection.length > 1) {
            return;
        }

        var revObj = this.$getRevisionObject(CoreUtil.getDocPath());
        var id = parseInt(node.getAttribute("id"), 10);
        var cache = revObj.previewCache;
        if (cache[id]) {
            this.previewRevision(id, null, cache[id][1], cache[id][0]);
        }
        else {
            this.loadRevision(id, "preview");
        }
        ide.getActivePage().$selectedRevision = id;
    },

    // Gets called twice. Why??
    afterModelUpdate: function(e) {
        var model = e.currentTarget;
        if (!model || !model.data || model.data.childNodes.length === 0) {
            return;
        }

        if (typeof lstRevisions !== "undefined") {
            lstRevisions.setModel(model);
            this.$restoreSelection(ide.getActivePage(), model);
        }
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
            case "newRevision.error":
                var revObj = this.$getRevisionObject(e.data.path);
                if (revObj) {
                    revObj.hasBeenSentToWorker = false;
                }
                break;
            case "recovery":
                if (e.data.revision.nextAction === "storeAsRevision") {
                    // No need to send these over the wire.
                    delete e.data.revision.finalContent;
                    delete e.data.revision.realContent;

                    ide.send({
                        command: "revisions",
                        subCommand: "saveRevision",
                        path: e.data.path,
                        revision: e.data.revision,
                        forceRevisionListResponse: true
                    });
                }
                else if (e.data.revision.inDialog === true && winQuestionRev.visible !== true) {
                    this.showQuestionWindow(e.data);
                }
                break;
            case "debug":
                console.log("WORKER DEBUG\n", e.data.content);
                break;
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
            var path = CoreUtil.stripWSFromPath(_page.$model.data.getAttribute("path"));
            var index = self.changedPaths.indexOf(path);
            if (self.changedPaths.indexOf(path) > -1) {
                ide.addEventListener("afterreload", function onDocReload(e) {
                    if (e.doc !== _page.$doc)
                        return;

                    // doc.setValue is redundant here, but it ensures that
                    // the proper value will be saved.
                    e.doc.setValue(e.data);

                    // Force-save the current page
                    var node = e.doc.getNode();
                    if (!node.getAttribute("newfile") && !node.getAttribute("debug")) {
                        savePlugin.quicksave(_page, function() {
                                stripws.enable();
                            }, true);
                    }

                    ide.removeEventListener("afterreload", onDocReload);
                });
                ide.dispatchEvent("reload", { doc : _page.$doc });
            }
            return index;
        };

        var dontReloadAndStore = function(_page) {
            var path = CoreUtil.stripWSFromPath(_page.$model.data.getAttribute("path"));
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

    $saveExistingRevision: function(path, revision) {
        ide.send({
            command: "revisions",
            subCommand: "saveRevision",
            path: path,
            revision: revision
        });
    },

    onMessage: function(e) {
        var self = this;
        var message = e.message;
        if (message.type !== "revision") {
            return;
        }

        var page = ide.getActivePage();
        var revObj = this.$getRevisionObject(message.path);

        // guided tour magic conflicts with revisions--skip it
        if (page && apf.isTrue(page.$model.data.getAttribute("guidedtour")))
            return;

        switch (message.subtype) {
            case "confirmSave":
                var ts = message.ts;
                // This could happen in edge cases, like the user having two browsers
                // opened and active on the same file, and then saving. Only one
                // of them will have the revision in the queue (in single user mode).
                // In that case, we understand that there is some problem and
                // request the entire revision history to the server.
                if (!this.revisionQueue[ts]) {
                    return this.getRevisionHistory({
                        path: message.path,
                        id: ts
                    });
                }

                var revision = this.revisionQueue[ts].revision;
                if (revision) {
                    revision.saved = true;
                    // In the case that a new file has just been created and saved
                    // `allRevisions` won't be there (since there has never been
                    // a `getRevisionhistory` that creates it), so we create it.
                    if (!revObj.allRevisions) {
                        revObj.allRevisions = {};
                    }

                    revObj.allRevisions[ts] = revision;
                    delete this.revisionQueue[ts];

                    revObj.compactRevisions = Util.generateCompactRevisions(revObj);
                    ide.dispatchEvent("revisionSaved", {
                        ts: ts,
                        path: message.path,
                        revision: revision
                    });

                    // The following code inserts the confirmed revision as the
                    // first (most recent) revision in the list, only if the model
                    // has been populated before already
                    var revisionString = this.getXmlStringFromRevision(revision);
                    var page = tabEditors.getPage(ide.davPrefix + "/" + message.path);
                    if (page) {
                        var model = page.$mdlRevisions;
                        if (model && model.data && model.data.childNodes.length) {
                            var revisionNode = apf.getXml(revisionString);
                            apf.xmldb.appendChild(model.data, revisionNode, model.data.firstChild);
                        }
                    }
                }
                break;

            case "getRevisionHistory":
                if (message.body && message.body.revisions) {
                    revObj.allRevisions = message.body.revisions;
                }
                revObj.compactRevisions = Util.generateCompactRevisions(revObj);
                if (!message.nextAction || !message.id) {
                    if (page && CoreUtil.getDocPath(page) === message.path &&
                        page.$showRevisions === true) {
                        this.populateModel(revObj, this.model);
                    }
                    break;
                }

                var data = {
                    id: message.id,
                    group: {},
                    type: message.nextAction
                };

                var len = revObj.groupedRevisionIds.length;
                if (revObj.useCompactList && len > 0) {
                    for (var i = 0; i < len; i++) {
                        var groupedRevs = revObj.groupedRevisionIds[i];
                        if (groupedRevs.indexOf(parseInt(message.id, 10)) !== -1) {
                            groupedRevs.forEach(function(ts) {
                                data.group[ts] = this.getRevision(ts);
                            }, this);
                            break;
                        }
                    }

                    if (Object.keys(data.group).length > 1) {
                        this.worker.postMessage(data);
                        break;
                    }
                }

                data.group[message.id] = this.getRevision(message.id);
                this.worker.postMessage(data);
                this.waitingForRevisionHistory = false;
                break;

            case "getRealFileContents":
                var pages = tabEditors.getPages();
                pages.forEach(function(page) {
                    var path = CoreUtil.stripWSFromPath(page.$model.data.getAttribute("path"));
                    if (message.path === path) {
                        var data = {
                            inDialog: true,
                            type: "recovery",
                            lastContent: page.$doc.getValue(),
                            realContent: message.contents,
                            path: message.path
                        };

                        if (message.nextAction === "storeAsRevision") {
                            data.nextAction = "storeAsRevision";
                        }
                        self.worker.postMessage(data);
                    }
                });
                break;

            case "serverError":
                if (console && console.error)
                    console.error("Server error in " + message.body.fromMethod + ": " + message.body.msg);
        }
    },

    toggleListView: function(model) {
        var revObj = this.$getRevisionObject(CoreUtil.getDocPath());
        revObj.useCompactList = !revObj.useCompactList;

        // We don't want to mix up compact/detailed preview caches
        revObj.previewCache = {};
        this.$setRevisionListClass();

        model = model || ide.getActivePage().$mdlRevisions;
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
        var page = ide.getActivePage();
        if (CoreUtil.isNewPage(page) || !CoreUtil.pageIsCode(page)) {
            return;
        }

        if (!revObj || !model) {
            console.error("Expected a parameter and a model");
            return;
        }

        var revisions;
        if (revObj.useCompactList && revObj.compactRevisions) {
            revisions = revObj.compactRevisions;
        }
        else {
            revisions = revObj.allRevisions;
        }

        var timestamps = Util.keysToSortedArray(revisions);
        var revsXML = "";
        for (var i = timestamps.length - 1; i >= 0; i--) {
            revsXML += this.getXmlStringFromRevision(revisions[timestamps[i]]);
        }
        this.model.load("<revisions>" + revsXML + "</revisions>");
    },

    getXmlStringFromRevision: function(revision) {
        if (!revision) { return; }

        var contributorToXml = function(c) {
            return apf.n("<contributor />").attr("email", c).node().xml;
        };

        var friendlyDate = (new Date(revision.ts)).toString("MMM d, h:mm tt");
        var restoring = revision.restoring || "";

        var xmlString = CoreUtil.toXmlTag("revision", {
            id: revision.ts,
            name: friendlyDate,
            silentsave: revision.silentsave,
            restoring: restoring
        }, true);

        var contributors = "";
        if (revision.contributors && revision.contributors.length) {
            contributors = revision.contributors.map(contributorToXml).join("");
        }

        xmlString += "<contributors>" + contributors + "</contributors></revision>";
        return xmlString;
    },

    /**
     * Revisions#isCollab(doc) -> Boolean
     * - doc(Object): Document object
     *
     * Returns true if this document is part of a collaborations session, false
     * otherwise
     **/
    isCollab: function(doc) {
        if(!doc && !ide.getActivePage())
            return false;

        var doc = (doc || ide.getActivePage().$doc);
        return doc.acedoc && doc.acedoc.doc.$isTree;
    },

    /**
     * Revisions#iAmMaster(path) -> Boolean
     * - fullPath(String): Path for the document to be checked
     *
     * Returns true if the current user is the "master" document in a collab
     * session. That means that the contents of his document will be the ones
     * saved in the collab session.
     **/
    isMaster: function(fullPath) {
        return this.getConcorde().isMaster(fullPath);
    },

    getRevision: function(id, content) {
        id = parseInt(id, 10);

        var revObj = this.$getRevisionObject(CoreUtil.getDocPath());
        var tstamps = Util.keysToSortedArray(revObj.allRevisions);
        var revision = tstamps.indexOf(id);

        if (revision === -1)
            return;

        var data = {
            content: content,
            id: id,
            revision: revision,
            patchesByTS: {}
        };

        for (var t = 0, l = tstamps.length; t < l; t++) {
            data.patchesByTS[tstamps[t]] = revObj.allRevisions[tstamps[t]].patch[0];
        }
        return data;
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

        var path = CoreUtil.getDocPath();
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
        this.getRevisionHistory({
            nextAction: nextAction,
            path: path,
            id: id
        });
    },

    getRevisionHistory: function(options) {
        this.waitingForRevisionHistory = true;

        options.command = "revisions";
        options.subCommand = "getRevisionHistory";

        ide.send(options);
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
        var doc = ide.getActivePage().$doc;
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
        var editor = Code.amlEditor.$editor;
        var session = editor.getSession();
        var revObj = this.$getRevisionObject(CoreUtil.getDocPath());

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
                    fromRow: range[0] - 1,
                    fromCol: range[1],
                    toRow: range[2] - 1,
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

        editor.setReadOnly(true);
        editor.selection.clearSelection();

        // Look for the node that references the revision we are loading and
        // update its state to loaded.
        this.$setRevisionNodeAttribute(id, "loading_preview", "false");
        if (!revObj.previewCache) {
            revObj.previewCache = {};
        }
        revObj.previewCache[id] = [newSession, ranges];
    },

    /**
     * Revisions#goToEditView()
     *
     * Ensures that the editor is in edit view (i.e. not read-only), and that it
     * contains the latest content.
     **/
    goToEditView: function() {
        if (!Code.amlEditor)
            return;

        var revObj = this.$getRevisionObject(CoreUtil.getDocPath());
        if (revObj.realSession) {
            Code.amlEditor.$editor.setSession(revObj.realSession);
        }
        Code.amlEditor.$editor.setReadOnly(false);
        Code.amlEditor.show();
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
        if (!CoreUtil.pageIsCode(page)) {
            return;
        }

        var docPath = CoreUtil.getDocPath(page);
        var contributors = this.$getEditingUsers(docPath);
        if (contributors.length === 0 && this.defaultUser.email) {
            contributors.push(this.defaultUser.email);
        }

        var data = {
            path: docPath,
            silentsave: !!silentsave,
            restoring: restoring,
            contributors: contributors,
            type: "newRevision",
            lastContent: doc.getValue()
        };

        if (ide.onLine === false) {
            data.ts = Date.now();
            this.offlineQueue.push(data);
        }
        else {
            if (this.isCollab() && !this.isMaster(page.name)) {
                // We are not master, so we want to tell the server to tell
                // master to save for us. For now, since the master is saving
                // every .5 seconds and auto-save is mandatory, we are not
                // taking care of it
                return;
            }

            // We should get here if we are in collab AND we are master, OR if
            // we are in single mode. In both situations, we just want the
            // current user to save its docs contents
            var revObj = this.$getRevisionObject(docPath);
            if (revObj.hasBeenSentToWorker === true) {
                this.worker.postMessage({
                    type: "newRevision",
                    path: docPath,
                    lastContent: data.lastContent,
                    hasBeenSentToWorker: true
                });
            }
            else {
                data.revisions = revObj.allRevisions;
                this.worker.postMessage(data);
                revObj.hasBeenSentToWorker = true;
            }
        }

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
            var path = CoreUtil.getDocPath(doc.$page);
            var stack = this.rawRevisions[path];
            if (stack && (stack.usersChanged.indexOf(user.email) === -1)) {
                stack.usersChanged.push(user.email);
            }
        }
    },

    getCollab: function() {
        return require("core/ext").extLut["ext/collaborate/collaborate"];
    },

    getConcorde: function() {
        return require("core/ext").extLut["ext/concorde/concorde"];
    },

    getUser: function(suffix, doc) {
        if (doc && doc.users && doc.users[suffix]) {
            var uid = doc.users[suffix].split("-")[0];
            var collab = this.getCollab();
            if (collab && collab.users[uid]) {
                return collab.users[uid];
            }
        }
    },

    getUserColorByEmail: function(email) {
        var collab = this.getCollab();
        if (!collab)
            return;

        var color;
        var user = collab.model.queryNode("group[@name='members']/user[@email='" + email + "']");
        if (user) {
            color = user.getAttribute("color");
        }

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
        if (this.rawRevisions[path] && this.rawRevisions[path].usersChanged) {
            users = this.rawRevisions[path].usersChanged;
        }
        return users;
    },

    $resetEditingUsers: function(path) {
        if (this.rawRevisions[path]) {
            this.rawRevisions[path].usersChanged = [];
        }
        return this.rawRevisions[path].usersChanged;
    },

    $setRevisionListClass: function() {
        var revObj = this.rawRevisions[CoreUtil.getDocPath()];
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
        var page = ide.getActivePage();
        if (!CoreUtil.pageIsCode(page)) {
            return;
        }

        ext.initExtension(this);

        settings.model.setQueryValue("general/@revisionsvisible", true);

        if (!this.panel.visible) {
            if (ide.dispatchEvent("ext.revisions.show", { barWidth: BAR_WIDTH }) !== false)
                Code.amlEditor.$ext.style.right = BAR_WIDTH + "px";
            page.$showRevisions = true;
            this.panel.show();
            ide.dispatchEvent("revisions.visibility", {
                visibility: "shown",
                width: BAR_WIDTH
            });

            beautify.disable();
            statusbar.offsetWidth = BAR_WIDTH;
            statusbar.setPosition();
            stripws.disable();
            language.disable();
        }

        var model = page.$mdlRevisions;
        if (model) {
            if (lstRevisions && (lstRevisions.getModel() !== model)) {
                lstRevisions.setModel(model);
            }

            // If there is no revision object for the current doc, we should
            // retrieve if it is not being retrieved right now. After retrieval,
            // `populateModel` will take care of setting model.data.
            var docPath = CoreUtil.getDocPath();
            var currentDocRevision = this.rawRevisions[docPath];
            if (!currentDocRevision && !this.waitingForRevisionHistory) {
                this.model = model;
                this.getRevisionHistory({ path: docPath });
            }
            else {
                this.populateModel(currentDocRevision, model);
                this.$restoreSelection(page, model);
            }
        }
    },

    hide: function() {
        settings.model.setQueryValue("general/@revisionsvisible", false);
        if (ide.dispatchEvent("ext.revisions.hide", { barWidth: BAR_WIDTH }) !== false)
            Code.amlEditor.$ext.style.right = "0";
        var page = ide.getActivePage();
        if (!page) {
            return;
        }

        page.$showRevisions = false;
        this.panel.hide();

        beautify.enable();
        statusbar.offsetWidth = 0;
        statusbar.setPosition();
        stripws.enable();
        language.enable();

        if (lstRevisions) {
            lstRevisions.selectList([]); // Unselect everything
        }

        this.goToEditView();
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
            ide.removeEventListener("tab.afterswitch", this.$onSwitchFileFn);

        if (this.$afterSelectFn)
            lstRevisions.removeEventListener("afterselect", this.$afterSelectFn);

        if (this.$onAfterOnline)
            ide.removeEventListener("onafteronline", this.$onAfterOnline);

        if (this.$onRevisionSaved)
            ide.removeEventListener("revisionSaved", this.$onRevisionSaved);

        if (this.$onExternalChange)
            ide.removeEventListener("beforewatcherchange", this.$onExternalChange);
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
            ide.addEventListener("tab.afterswitch", this.$onSwitchFileFn);

        if (this.$afterSelectFn)
            lstRevisions.addEventListener("afterselect", this.$afterSelectFn);

        if (this.$onAfterOnline)
            ide.addEventListener("onafteronline", this.$onAfterOnline);

        if (this.$onRevisionSaved)
            ide.addEventListener("revisionSaved", this.$onRevisionSaved);

        if (this.$onExternalChange)
            ide.addEventListener("beforewatcherchange", this.$onExternalChange);
    },

    enable: function() {
        this.enableEventListeners();
        this.$enable();
    },

    disable: function() {
        this.hide();
        tabEditors.getPages().forEach(function(page) {
            if (page.$mdlRevisions) {
                delete page.$mdlRevisions;
            }
        }, this);
        this.disableEventListeners();
        this.$disable();
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
            if (page.$mdlRevisions) {
                delete page.$mdlRevisions;
            }
        }, this);

        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.$destroy();
    }
});
});
