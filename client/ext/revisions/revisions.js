/**
 * Revisions Module for the Cloud9 IDE.
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var fs = require("ext/filesystem/filesystem");
var menus = require("ext/menus/menus");

//var TreeDocument = require("concorde/AceDocument");
var Save = require("ext/save/save");
//var Collab = require("c9/ext/collaborate/collaborate");
var Util = require("ext/revisions/revisions_util");
var settings = require("ext/settings/settings");
var markupSettings = require("text!ext/revisions/settings.xml");

// Ace dependencies
var Range = require("ace/range").Range;
var Anchor = require('ace/anchor').Anchor;
var EditSession = require("ace/edit_session").EditSession;
var Document = require("ace/document").Document;
var ProxyDocument = require("ext/code/proxydocument");

var markup = require("text!ext/revisions/revisions.xml");
var skin = require("text!ext/revisions/skin.xml");

var BAR_WIDTH = 200;

// Faster implementation of `Array.reduce` than the native ones in webkit,
// chrome 18 and Firefox 12
Array.prototype.__reduce = function(func, initial) {
    var value, idx;
    if (initial !== null) {
        value = initial;
        idx = 0;
    }
    else if (this) {
        value = this[0];
        idx = 1;
    }
    else {
        return null;
    }

    var len = this.length;
    for (; idx < len; idx++) { value = func(value, this[idx]); }

    return value;
};

/**
 * addCodeMarker(editor, type, range)
 * - session(Object): Editor session where we should put the markers
 * - doc(Object): Document object where to anchor the markers, passed as
 *   a parameter for convenience in case the function is called in a loop.
 * - type(String): type of the marker. It can be 'add' or 'remove'
 * - range(Object): range of text covered by the marker
 *
 * Adds a code marker to the given document, and puts it in a particular range
 * in the source. The type determines its appearance, since different classes
 * are defined in the CSS.
 **/
var addCodeMarker = function(session, doc, type, range) {
    if (!session.revAnchors) {
        session.revAnchors = [];
    }

    var markerId;
    // var markerStrike
    var anchor = new Anchor(doc, range.fromRow, range.fromCol);
    session.revAnchors.push(anchor);

    var colDiff = range.toCol - range.fromCol;
    var rowDiff = range.toRow - range.fromRow;
    var updateFloat = function() {
        if (markerId) {
            session.removeMarker(markerId);
        }

        var startPoints = anchor.getPosition();
        var endPoints = {
            row: anchor.row + rowDiff,
            column: anchor.column + colDiff
        };

        var range = Range.fromPoints(startPoints, endPoints);
        if (range.isEmpty())
            return;

        markerId = session.addMarker(range, "revision_hl_" + type, "background");
        /*
         * Uncomment the following to get strikethrough on deleted text.
         *
         * if (markerStrike) {
         *     session.removeMarker(markerStrike);
         * }
         *
         * if (type === "delete") {
         *     if (!range.isMultiLine()) {
         *         endPoints.row += 1;
         *         endPoints.column = 0;
         *         range = Range.fromPoints(startPoints, endPoints);
         *     }

         *     markerStrike = session.addMarker(range, "revision_hl_delete_strike", "text");
         * }
        **/
    };

    updateFloat();
    anchor.on("change", updateFloat);
};

var INTERVAL = 60000;
var CHANGE_TIMEOUT = 2000;

module.exports = ext.register("ext/revisions/revisions", {
    name: "Revisions",
    dev: "Cloud9",
    alone: true,
    type: ext.GENERAL,
    markup: markup,
    deps: [fs],
    offline: true,
    nodes: [],

    skin: skin,
    model: new apf.model(),

    commands : {
        "revisions": {hint: "Show revisions panel"}
    },
    hotitems: {},

    realSession: {},
    originalContents: {},
    revisionsData: {},
    docChangeTimeout: null,
    allTimestamps: [],
    allRevisions: {},
    compactRevisions: {},
    useCompactList: true,
    groupedRevisionIds: [],
    docChangeListeners: {},

    toggle: function() {
        ext.initExtension(this);

        if (this.panel.visible)
            this.hide();
        else
            this.show();
    },

    hook: function() {
        var _self = this;

        var mnuItem;
        this.nodes.push(
            this.mnuSave = new apf.menu({ id : "mnuSave" }),
            menus.addItemByPath("File/~", new apf.divider(), 800),
            mnuItem = menus.addItemByPath("File/File Revision History...", new apf.item({
                type: "check",
                checked: "[{require('ext/settings/settings').model}::general/@revisionsvisible]",
                disabled: "{!tabEditors.length}",
                onclick: function() { _self.toggle(); }
            }), 900),
            menus.addItemByPath("File/~", new apf.divider(), 910)
        );
        
        settings.addSettings("General", markupSettings);
        ide.addEventListener("loadsettings", function(e) {
            var revisionVisible = e.model.queryValue("general/@revisionsvisible");
            if (apf.isTrue(revisionVisible)) {
                ide.addEventListener("init.ext/editors/editors", function (e) {
                    tabEditors.addEventListener("afterswitch", function() {
                        if (self.ceEditor)
                            _self.show();
                        tabEditors.removeEventListener("afterswitch", arguments.callee);
                    });
                });
            }
        });

        btnSave.removeAttribute("icon");
        btnSave.setAttribute("caption", "");
        btnSave.removeAttribute("tooltip");
        btnSave.setAttribute("margin", "0 20 0 20");
        btnSave.setAttribute("submenu", "mnuSave");
        btnSave.removeAttribute("onclick");

        this.$onOpenFileFn = this.onOpenFile.bind(this);
        this.$onCloseFileFn = this.onCloseFile.bind(this);
        this.$onFileSaveFn = this.onFileSave.bind(this);

        ide.addEventListener("afteropenfile", this.$onOpenFileFn);
        ide.addEventListener("afterfilesave", this.$onFileSaveFn);
        ide.addEventListener("closefile", this.$onCloseFileFn);

        var c = 0;
        menus.addItemToMenu(this.mnuSave, new apf.item({
            caption : "Save Now",
            onclick : function(){
                Save.quicksave();
            }
        }), c += 100);
        menus.addItemToMenu(this.mnuSave, new apf.item({
            caption : "Enable Auto-Save",
            type    : "check",
            checked : "[{require('core/settings').model}::general/@autosaveenabled]"
        }), c += 100);
        menus.addItemToMenu(this.mnuSave, new apf.divider(), c += 100);
        menus.addItemToMenu(this.mnuSave, new apf.item({
            caption : "About Auto-Save",
            onclick : function(){

            }
        }), c += 100);

        this.hotitems.revisions = [mnuItem];

        this.defaultUser = {
            email: null
        };

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
                        _self.defaultUser = {
                            email: data
                        };
                    }
                }
            });
        }

        this.$initWorker();
    },

    setSaveButtonCaption: function(caption) {
        if (caption) {
            return btnSave.setCaption(caption);
        }
        
        if (!tabEditors.activepage) {
            btnSave.setCaption("");
        }
        
        var autoSaveEnabled = apf.isTrue(settings.model.queryValue("general/@autosaveenabled"));
        var hasChanged = tabEditors.getPage().getModel().queryValue("@changed") == 1;
        
        if (autoSaveEnabled && hasChanged) {
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

        this.$onMessageFn = this.onMessage.bind(this);
        ide.addEventListener("socketMessage", this.$onMessageFn);

        ide.send({
            command: "revisions",
            subCommand: "getRevisionHistory",
            path: self.$getDocPath(),
            // Send over the original revision of the file as well. This is
            // only for the first time and won't ever change.
            getOriginalContent: true
        });

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

        /**
         * @todo the panel should move to the active editor tab using
         *       afterselect
         */
        ide.addEventListener("init.ext/code/code", function (e) {
            self.panel = ceEditor.parentNode.appendChild(self.panel);
            revisionsPanel.appendChild(pgRevisions);
        });

        this.$afterSelectFn = function(e) {
            var node = this.selected;
            if (!node || this.selection.length > 1) {
                return;
            }

            self.loadRevision(node.getAttribute("id"), "preview");
        };

        lstRevisions.addEventListener("afterselect", this.$afterSelectFn);

        this.$onSwitchFileFn = this.onSwitchFile.bind(this);
        ide.addEventListener("editorswitch", this.$onSwitchFileFn);

        this.$onAfterSwitchFn = this.onAfterSwitch.bind(this);
        tabEditors.addEventListener("afterswitch", this.$onAfterSwitchFn);

        this.$setRevisionListClass();
    },

    $initWorker: function() {
        var worker = this.worker = new Worker("/static/ext/revisions/revisions_worker.js");
        worker.onmessage = this.onWorkerMessage.bind(this);
        worker.onerror = function(error) {
            console.log("Worker error: " + error.message + "\n");
            throw error;
        };
    },

    /////////////////////
    // Event listeners //
    /////////////////////

    onOpenFile: function(data) {
        if (!data || !data.doc)
            return;

        var self = this;
        var doc = data.doc;
        // TODO: Unregister events on unloading file

        // Add document change listeners to an array of functions so that we
        // can clean up on disable plugin.
        var path = data.node.getAttribute("path");
        if (path && !this.docChangeListeners[path]) {
            this.docChangeListeners[path] = function(e) {
                self.onDocChange.call(self, e, doc);
            };
        }

        (doc.acedoc || doc).addEventListener("change", this.docChangeListeners[path]);

        this.setSaveButtonCaption();
    },

    onSwitchFile: function(e) {
        var self = this;

        // This is the wrong way to do it. We should assume than when switching
        // the revisions are already there.
        // We should cache the revisions for each file and destroy them when
        // closing. Otherwise there is a communication overhead
        ide.send({
            command: "revisions",
            subCommand: "getRevisionHistory",
            path: self.$getDocPath(e.nextPage),
            // Send over the original revision of the file as well. This is
            // only for the first time and won't ever change.
            getOriginalContent: true
        });
    },

    onAfterSwitch: function(e) {
        if (e.nextPage.$showRevisions === true) {
            this.show();
        }
        else {
            this.hide();
        }
    },

    onCloseFile: function(e) {
        var self = this;

        setTimeout(function() {
            self.setSaveButtonCaption();
        });

        var path = this.$getDocPath();
        if (this.originalContents[path]) {
            delete this.originalContents[path];
        }

        var path = e.page.name;
        if (path && this.docChangeListeners[path]) {
            delete this.docChangeListeners[path];
        }

        this.save(e.page);
    },

    onDocChange: function(e, doc) {
        if (e.data && e.data.delta) {
            var suffix = e.data.delta.suffix;
            var user = this.getUser(suffix, doc);
            if (suffix && user) {
                this.addUserToDocChangeList(user, doc);
            }
        }

        var self = this;
        clearTimeout(this.docChangeTimeout);
        this.docChangeTimeout = setTimeout(function() {
            var autoSaveEnabled = apf.isTrue(settings.model.queryValue("general/@autosaveenabled"));
            if (doc.$page && autoSaveEnabled) {
                self.setSaveButtonCaption();
                self.save(doc.$page);
            }
        }, CHANGE_TIMEOUT);
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
                var data = {
                    command: "revisions",
                    subCommand: "saveRevision",
                    path: this.$getDocPath(),
                    revision: e.data.revision
                };

                ide.send(data);
                break;
            case "debug":
                console.log("WORKER DEBUG\n", e.data.content);
                break;
        }
    },

    onMessage: function(e) {
        var message = e.message;
        if (message.type !== "revision")
            return;

        switch (message.subtype) {
            case "getRevisionHistory":
                if (message.originalContent) {
                    this.originalContents[message.path] = message.originalContent;
                }

                this.buildRevisionsList(message.body);
                this.populateModel();

                break;

            // The server is sending us the original value of the current doc,
            // which we will send to the worker to process.
            case "getOriginalContent":
                var revision = this.getRevision(message.id);
                if (!revision)
                    return;

                this.originalContents[message.path] = message.body; // WTF alert

                // If there is no further actions such as "preview" or "apply",
                // we have nothing else to do here.
                if (!message.nextAction)
                    return;

                var data;
                var self = this;
                var len = this.groupedRevisionIds.length;
                if (this.useCompactList && len > 0) {
                    var group = {};
                    for (var i = 0; i < len; i++) {
                        var groupedRevs = this.groupedRevisionIds[i];
                        if (groupedRevs.indexOf(parseInt(message.id, 10)) !== -1) {
                            groupedRevs.forEach(function(ts) {
                                group[ts] = self.getRevision.call(self, ts);
                            });
                            break;
                        }
                    }

                    var keys = Object.keys(group)
                        .map(function(key) { return parseInt(key, 10); })
                        .sort(function(a, b) { return a - b; });

                    if (keys.length > 1) {
                        data = {
                            id: message.id,
                            group: group,
                            groupKeys: keys,
                            type: message.nextAction,
                            data: this.getRevision(keys[0]),
                            content: message.body
                        };
                        this.worker.postMessage(data);
                        break;
                    }
                }

                var groupData = {};
                groupData[message.id] = revision;
                data = {
                    id: message.id,
                    group: groupData,
                    groupKeys: [parseInt(message.id, 10)],
                    type: message.nextAction,
                    data: revision,
                    content: message.body
                };

                this.worker.postMessage(data);
                break;
        }
    },

    onFileSave: function(e) {
        this.saveRevision(e.doc, e.silentsave);
    },

    /**
     * Revisions#buildRevisionsList(revObj)
     * - revObj(Object): Body of the message coming from the server
     *
     * This function is called every time the server sends an `update` message.
     * It generates the revision objects and the revision timestamp arrays used
     * throughout the extension.
     **/
    buildRevisionsList: function(revObj) {
        this.allRevisions = {};
        this.compactRevisions = {};

        // Create an array of the numeric timestamps and populate `allRevisions`
        // with the timestamps as keys and the revObjs as values.
        // `allTimestamps` will store the numeric array. This is the only place
        // where `allTimestamps should be modified.
        this.allTimestamps = revObj.revisions
            .map(function(rev) {
                this.allRevisions[rev.ts] = rev;
                return rev.ts;
            }, this)
            .sort(function(a, b) { return a - b; });

        // `generateCompactList` will generate `compactTimestamps` on its own
        this.generateCompactList();
    },

    /**
     * Revisions#generateCompactList()
     *
     * Generate a compacted version of the revision list, where revisions are
     * grouped by close periods of time.
     **/
    generateCompactList: function() {
        // Generate compact revisions. Change `compactTimestamps` to
        // reflect the ones in the compact list.
        this.compactRevisions = this.getCompactRevisions();
        this.compactTimestamps =
            Object
                .keys(this.compactRevisions)
                .map(function(ts) { return parseInt(ts, 10); })
                .sort(function(a, b) { return a - b; });
    },

    toggleListView: function() {
        this.useCompactList = !!!this.useCompactList;
        this.$setRevisionListClass();
    },

    /**
     * Revisions#populateModel()
     *
     * Populates the revisions model with the current revision list and attributes.
     **/
    populateModel: function() {
        var revisions, timestamps;

        if (this.useCompactList && this.compactRevisions && this.compactTimestamps) {
            revisions = this.compactRevisions;
            timestamps = this.compactTimestamps;
        }
        else {
            revisions = this.allRevisions;
            timestamps = this.allTimestamps;
        }

        var revsXML = "";
        for (var i = timestamps.length - 1; i >= 0; i--) {
            var ts = timestamps[i];
            var rev = revisions[ts];
            var friendlyDate = Util.localDate(ts).toString("MMM d, h:mm tt");
            var restoring = rev.restoring || "";

            revsXML += "<revision " +
                "id='" + rev.ts + "' " +
                "name='" + friendlyDate + "' " +
                "silentsave='" + rev.silentsave + "' " +
                "restoring='" + restoring + "'>";

            var contributors = rev.contributors.map(function(c) {
                return "<contributor email='" + c + "' />";
            }).join("");

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

        /*
        if (this.useCompactList) {
            // In case we have compacted revisions as the view, we must retrieve
            // the first revision in the group, because we want to go back to the
            // first revision of the grouped revisions.
            id = this.compactRevisions[id].first;
        }*/

        var tstamps = this.allTimestamps.slice(0);
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
                data.tsValues[tstamps[t]] = this.allRevisions[tstamps[t]].patch;
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

        var path = this.$getDocPath();
        if (this.originalContents[path]) {
            return this.onMessage({
                message: {
                    id: id,
                    type: "revision",
                    subtype: "getOriginalContent",
                    nextAction: nextAction,
                    body: this.originalContents[path]
                }
            });
        }

        // We haven't cached the original content. Let's load it from the server.
        ide.send({
            command: "revisions",
            subCommand: "getOriginalContent",
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
    getCompactRevisions: function() {
        var timestamps = this.allTimestamps.slice(0);
        if (!this.allRevisions || timestamps.length === 0) {
            return {};
        }

        var all = this.allRevisions;
        var compactRevisions = {};
        var finalTS = [];
        var isResto = function(id) { return all[id] && all[id].restoring; };

        // This extracts the timestamps that belong to 'restoring' revisions to
        // put them in their own slot, since we don't want them to be grouped in
        // the compacted array. They should be independent of the compacting to
        // not confuse the user.
        var repack = function(prev, id) {
            var last = prev[prev.length - 1];
            if (last.length === 0 || (!isResto(id) && !isResto(last[0]))) {
                last.push(id);
            }
            else { prev.push([id]); }
            return prev;
        };

        Util.compactRevisions(timestamps).forEach(function(ts) {
            finalTS.push.apply(finalTS, ts.__reduce(repack, [[]]));
        });

        this.groupedRevisionIds = finalTS;

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
     * Revisions#previewRevision(id, value, ranges)
     * - id(Number): Numeric timestamp identifier of the revision
     * - value(String): Contents of the document at the time of the revision
     * - ranges(Array): Range of differences showing what changes were introduced by this revision
     *
     * Previews changes made to the document by that particular revision. It
     * creates a new temporary Ace session and replaces the real document by this
     * read-only session.
     **/
    previewRevision: function(id, value, ranges) {
        var editor = ceEditor.$editor;
        var session = editor.getSession();
        var path = this.$getDocPath();

        if (session.previewRevision !== true && !this.realSession[path]) {
            this.realSession[path] = session;
        }

        var doc = new ProxyDocument(new Document(value || ""));
        var newSession = new EditSession(doc, this.realSession[path].getMode());
        newSession.previewRevision = true;
        editor.setSession(newSession);
        editor.setReadOnly(true);

        var firstChange = 0;
        if (ranges.length > 0) {
            // Retrieve the first row of the first change in the changeset.
            firstChange = ranges[0][0];
        }

        ranges.forEach(function(range) {
            addCodeMarker(newSession, doc, range[4], {
                fromRow: range[0],
                fromCol: range[1],
                toRow: range[2],
                toCol: range[3]
            });
        });

        // Scroll to the first change, leaving it in the middle of the screen.
        editor.renderer.scrollToRow(firstChange - (editor.$getVisibleRowCount() / 2));
        editor.selection.clearSelection()

        // Look for the node that references the revision we are loading and
        // update its state to loaded.
        this.$setRevisionNodeAttribute(id, "loading_preview", "false");
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

        var realSession = this.realSession[this.$getDocPath()];
        if (realSession) {
            ceEditor.$editor.setSession(realSession);
            ceEditor.$editor.setReadOnly(false);
            ceEditor.show();
        }
    },

    doAutoSave: function() {
        var autoSaveEnabled = apf.isTrue(settings.model.queryValue("general/@autosaveenabled"));
        if (!tabEditors || !autoSaveEnabled)
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

        if (!page || !this.$pageHasChanged(page))
            return;

        ext.initExtension(this);

        var node = page.$doc.getNode();
        if (node.getAttribute("newfile") || node.getAttribute("debug")) {
            return;
        }
        Save.quicksave(page, function(){}, true);
    },

    /**
     * Revisions#saveRevision(doc, silentsave, restoring)
     * - doc (Object): Document Object that refers to the document we want to save a revision for
     * - silentsave (Boolean): Indicates whether the save is automatic or forced
     * - restoring (Boolean): Indicates whether we are saving a previous revision retrieval
     *
     * Sends the necessary data for the server so it can save a revision of the
     * current document.
     **/
    saveRevision: function(doc, silentsave, restoring) {
        var page = doc.$page;
        var docPath = this.$getDocPath(page);
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
            data.originalContent = this.originalContents[docPath];
            data.revisions = this.allRevisions;
            // To not have to extract and sort timestamps from allRevisions
            data.timestamps = this.allTimestamps;

            return this.worker.postMessage(data);
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
            var origPath = doc.getNode().getAttribute("path");
            var stack = this.revisionsData[origPath];
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

    $getRevisionNode: function(id) {
        return this.model.queryNode("revision[@id='" + id + "']");
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

    /**
     * Revisions#$pageHasChanged(page) -> Boolean
     *
     * Check to see if the page has been actually modified since the last
     * save.
     **/
    $pageHasChanged: function(page) {
        var model = page.getModel();
        return model && model.data.getAttribute("changed") === "1";
    },

    $getDocPath: function(page) {
        if (!page && tabEditors)
            page = tabEditors.getPage();

        // Can we rely on `name`?
        // What follows is a hacky way to get a path that we can use on
        // the server. I am sure that these workspace string manipulation
        // functions are somewhere...to be fixed.
        var docPath = page.name.replace(ide.davPrefix, "");
        docPath = docPath.charAt(0) === "/" ? docPath.substr(1) : docPath;
        return docPath;
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
        if (this.useCompactList === true) {
            apf.setStyleClass(lstRevisions.$ext, "compactView");
        }
        else {
            apf.setStyleClass(lstRevisions.$ext, null, ["compactView"]);
        }

        this.populateModel();
    },

    show: function() {
        ext.initExtension(this);

        settings.model.setQueryValue("general/@revisionsvisible", true);

        ide.dispatchEvent("revisions.visibility", {
            visibility: "shown",
            width: BAR_WIDTH
        });

        ceEditor.$editor.container.style.right = BAR_WIDTH + "px";

        this.panel.show();

        this.populateModel();

        var all = this.allTimestamps;
        var cmp = this.compactTimestamps;

        var lastTimeStamp;
        if (this.useCompactList === true && cmp && cmp.length > 0) {
            lastTimeStamp = cmp[cmp.length - 1];
        }
        else if (all && all.length > 0) {
            lastTimeStamp = all[all.length - 1];
        }

        if (lastTimeStamp) {
            var node = this.model.queryNode("revision[@id='" + lastTimeStamp + "']");
            if (node) {
                lstRevisions.select(node);
            }
        }
        tabEditors.getPage().$showRevisions = true;
    },

    hide: function() {
        settings.model.setQueryValue("general/@revisionsvisible", false);
        ceEditor.$editor.container.style.right = "0";
        this.panel.hide();

        this.goToEditView();

        ide.dispatchEvent("revisions.visibility", { visibility: "hidden" });
        tabEditors.getPage().$showRevisions = false;
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

        if (this.$afterSelectFn) {
            lstRevisions.addEventListener("afterselect", this.$afterSelectFn);
        }
    },

    enable: function() {
        this.nodes.each(function(item){
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
        }, this);

        this.disableEventListeners();
    },

    destroy : function() {
        menus.remove("File/File revisions");
        menus.remove("File/~", 1000);

        if (this.saveInterval)
            clearInterval(this.saveInterval);

        this.disableEventListeners();

        tabEditors.getPages().forEach(function(page) {
            var listener = this.docChangeListeners[page.name];
            if (listener) {
                page.$doc.removeEventListener(listener);
                if (page.$doc.acedoc) {
                    page.$doc.acedoc.removeEventListener(listener);
                }
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
