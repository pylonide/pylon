/*global winQuestionRev winQuestionRevMsg ceEditor revisionsPanel mnuContextTabs
 * mnuCtxEditor tabEditors mnuCtxEditorCut pgRevisions lstRevisions revisionsInfo
 * Blob webkitURL URL
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

// Ace dependencies
var EditSession = require("ace/edit_session").EditSession;
var Document = require("ace/document").Document;
var ProxyDocument = require("ext/code/proxydocument");

// Revision dependencies
var Util = require("ext/revisions/revisions_util");

// Constants
var INTERVAL = 60000;
var isInfoActive = false;
/*
var RunOnBgThread = function (fn, then) {
    var _blob = new Blob(['onmessage = ' + fn.toString()], { "type" : "text/javascript" });
    var _worker = new Worker((webkitURL.createObjectURL || URL.createObjectURL)(_blob));
    _worker.onmessage = then;
    _worker.postMessage();
};

var _test = function () {
  postMessage((1+1).toString());
}

RunOnBgThread(_test, function(e){
  alert(e.data);
});
*/

var RevisionedDoc = function(doc) {
    this.doc = doc;
    this.page = doc.$page;
    this.path = CoreUtil.getDocPath(this.page);
};

RevisionedDoc.prototype = {
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

    offlineQueue: [],
    defaultUser: { email: null },
    useCompactList: true,
    groupedRevisionIds: [],
    previewCache: {},
    usersChanged: [],

    /////////////////////
    // Event listeners //
    /////////////////////

    /** related to: Revisions#offlineQueue
     * Makes a new revision from an object with relevant properties. The data is
     * sent to the worker, who will reply back with a "newRevision" message.
     *
     * - o(Object): Object with some revision properties
     */
    $makeRevisionFromObj: function(o) {
        // This is not particularly relevant to the revision being created, but
        // we use it to pass this data to the worker, who needs it
        o.revisions = this.revObj.allRevisions;
        o.type = "newRevision";
        this.worker.postMessage(o);
    },

    onRevisionSaved: function(data) {
        if (typeof data.ts !== "number")
            throw new Error("Expected number, but got " + typeof data.ts);

        var queue = this.offlineQueue;
        for (var i = 0, l = queue.length; i < l; i++) {
            var rev = queue[i];
            if (rev && rev.applyOn === data.ts) {
                this.$makeRevisionFromObj(rev);
                break;
            }
        }
    },

    afterModelUpdate: function(e) {
        var model = e.currentTarget;
        if (!model || !model.data || !model.data.childNodes
            || model.data.childNodes.length === 0
            || typeof lstRevisions === "undefined") {
                return;
        }

        lstRevisions.setModel(model);
        this.$restoreSelection(tabEditors.getPage(), model);
    },

    $msgNewRevision: function(data) {
        var revision = data.revision;
        // We don't save revision if it doesn't contain any patches
        // (i.e. nothing new was saved)
        if (revision.patch[0].length === 0) {
            return;
        }

        if (!revision.ts) {
            return;
        }

        this.revisionQueue[revision.ts] = {
            path: this.path, //data.path,
            revision: revision
        };

        this.$saveExistingRevision(this.path, /*data.path, */revision);
    },
/*
    $msgRecovery: function(data) {
        if (data.revision.nextAction === "storeAsRevision") {
            // No need to send these over the wire.
            delete data.revision.finalContent;
            delete data.revision.realContent;

            ide.send({
                command: "revisions",
                subCommand: "saveRevision",
                path: data.path,
                revision: data.revision,
                forceRevisionListResponse: true
            });
        }
        else if (data.revision.inDialog === true && winQuestionRev.visible !== true) {
            this.showQuestionWindow(data);
        }
    },
*/
    onWorkerMessage: function(e) {
        if (!e.data.type)
            return;

        var self = this;
        var c = e.data.content;
        var responses = {
            apply: function() {
                self.applyRevision.call(self, c.id, c.value);
            },
            preview: function() {
                self.previewRevision(c.id, c.value, c.ranges);
            },
            newRevision: function() {
                self.$msgNewRevision.call(self, e.data);
            },
            "newRevision.error": function() {
                var revObj = self.$getRevisionObject.call(self, e.data.path);
                if (revObj)
                    revObj.hasBeenSentToWorker = false;
            },
            recovery: function() {
                self.$msgRecovery.call(self, e.data);
            },
            debug: function() {
                console.log("WORKER DEBUG\n", c);
            }
        };

        if (responses[e.data.type])
            responses[e.data.type]();
    },

    $saveExistingRevision: function(path, revision) {
        ide.send({
            command: "revisions",
            subCommand: "saveRevision",
            path: this.path,
            revision: revision
        });
    },

    onMessage: function(e) {
        var message = e.message;
        if (message.type !== "revision")
            return;

        var page = tabEditors.getPage();

        // guided tour magic conflicts with revisions--skip it
        if (page && page.$model.data.getAttribute("guidedtour") === "1")
            return;

        var self = this;
        switch (message.subtype) {
            case "confirmSave":
                self.$msgConfirmSave.call(self, message);
                break;

            case "getRevisionHistory":
                self.$msgGetRevisionHistory.call(self, message);
                break;

            case "getRealFileContents":
                self.$msgGetRealFileContents.call(self, message);
                break;

            case "serverError":
                if (console && console.error)
                    console.error("Server error in " + message.body.fromMethod +
                        ": " + message.body.msg);
        }
    },

    $msgConfirmSave: function(message) {
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

        var revObj = this.$getRevisionObject(message.path);
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

            this.generateCompactRevisions(revObj);
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
    },

    $msgGetRealFileContents: function(message) {
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
    },

    $msgGetRevisionHistory: function(message) {
        var revObj = this.$getRevisionObject(message.path);
        if (message.body && message.body.revisions) {
            revObj.allRevisions = message.body.revisions;
        }

        this.generateCompactRevisions(revObj);
        if (!message.nextAction || !message.id) {
            if (this.page && this.page.$showRevisions === true) {
                this.populateModel(revObj, this.model);
            }
            return;
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
                    return;
                }
            }

            if (Object.keys(data.group).length > 1) {
                this.worker.postMessage(data);
                return;
            }
        }

        data.group[message.id] = this.getRevision(message.id);
        this.worker.postMessage(data);
        this.waitingForRevisionHistory = false;
    },

    /**
     * Revisions#populateModel()
     *
     * Populates the revisions model with the current revision list and attributes.
     **/
    populateModel: function(revObj, model) {
        var page = tabEditors.getPage();
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
            return "<contributor email='" + c + "' />";
        };

        var friendlyDate = (new Date(revision.ts)).toString("MMM d, h:mm tt");
        var restoring = revision.restoring || "";

        var xmlString = "<revision " +
                "id='" + revision.ts + "' " +
                "name='" + friendlyDate + "' " +
                "silentsave='" + revision.silentsave + "' " +
                "restoring='" + restoring + "'>";

        var contributors = "";
        if (revision.contributors && revision.contributors.length) {
            contributors = revision.contributors.map(contributorToXml).join("");
        }

        xmlString += "<contributors>" + contributors + "</contributors></revision>";
        return xmlString;
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
     * Revisions#generateCompactRevisions() -> Object
     *
     * Creates a compacted revisions object from the extended revisions object
     * returned from the server. A compacted revisions object (CRO) is a revision
     * object with less detailed revisions, and it does that by grouping revisions
     * that are close in time. That lapse in time is determined by the `TIMELAPSE`
     * constant.
     *
     * Assumes that `allRevisions` is populated at this point.
     **/
    generateCompactRevisions: function(revObj) {
        var all = revObj.allRevisions;
        if (!all)
            return;

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

        var timestamps = Util.keysToSortedArray(revObj.allRevisions);
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

        revObj.compactRevisions = compactRevisions;
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

        //CoreUtil.getDocPath(page);
        var contributors = this.$getEditingUsers(this.path);
        if (contributors.length === 0 && this.defaultUser.email) {
            contributors.push(this.defaultUser.email);
        }

        var data = {
            path: this.path,
            silentsave: !!silentsave,
            restoring: restoring,
            contributors: contributors,
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
            var revObj = this.$getRevisionObject(this.path);
            if (revObj.hasBeenSentToWorker === true) {
                this.worker.postMessage({
                    type: "newRevision",
                    path: this.path,
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

        this.$resetEditingUsers(this.path);
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
        if (!user || !doc)
            return;

        if (this.revObj.usersChanged.indexOf(user.email) === -1) {
            this.revObj.usersChanged.push(user.email);
        }
    },

    getCollab: function() {
        return require("core/ext").extLut["ext/collaborate/collaborate"];
    },

    getConcorde: function() {
        return require("core/ext").extLut["ext/concorde/concorde"];
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
        return this.revObj.usersChanged || [];
    },

    $resetEditingUsers: function() {
        return this.revObj.usersChanged = [];
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
            ide.addEventListener("tab.beforeswitch", this.$onSwitchFileFn);

        if (this.$onAfterSwitchFn)
            ide.addEventListener("tab.afterswitch", this.$onAfterSwitchFn);

        if (this.$afterSelectFn)
            lstRevisions.addEventListener("afterselect", this.$afterSelectFn);

        if (this.$onAfterOnline)
            ide.addEventListener("onafteronline", this.$onAfterOnline);

        if (this.$onRevisionSaved)
            ide.addEventListener("revisionSaved", this.$onRevisionSaved);

        if (this.$onExternalChange)
            ide.addEventListener("beforewatcherchange", this.$onExternalChange);
    },

    destroy: function() {
        this.disableEventListeners();

        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
};
});
