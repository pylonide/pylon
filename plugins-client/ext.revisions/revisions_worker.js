/**
 * Revisions Worker for the Cloud9 IDE.
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

var debug = function() {
    var args = Array.prototype.slice.call(arguments);
    self.postMessage({
        type: "debug",
        content: args
    });
};

var keysToSortedArray = function(obj) {
    return Object.keys(obj)
        .map(function(key) { return parseInt(key, 10); })
        .sort(function(a, b) { return a - b; });
};

var rNL = /\r?\n/;
var startChar = {
    "equal" : "  ",
    "delete": "- ",
    "insert": "+ "
};

var docContentsOnRev = {};

var getLastAndAfterRevisions = function(data) {
    var group = data.group;
    // Ordered timestamps
    var keys = keysToSortedArray(data.group);
    var minKey = keys[0];
    var maxKey = keys[keys.length - 1];
    var revision = group[minKey];
    var beforeRevision = "";

    var i, l, ts;
    var patches = [];
    var timestamps = keysToSortedArray(revision.patchesByTS);
    for (i = 0; i <= timestamps.length; i++) {
        ts = timestamps[i];
        if (minKey == ts) {
            break;
        }
        patches = patches.concat(revision.patchesByTS[ts]);
    }
    beforeRevision = self.dmp.patch_apply(patches, beforeRevision)[0];

    patches = [];
    var afterRevision = beforeRevision;
    for (i = 0, l = keys.length; i <= l; i++) {
        ts = keys[i];
        var rev = group[ts];
        patches = patches.concat(rev.patchesByTS[ts]);

        if (maxKey == ts) {
            break;
        }
    }
    afterRevision = self.dmp.patch_apply(patches, afterRevision)[0];

    return [beforeRevision, afterRevision];
};

var loadLibs = function() {
    if (!self.dmp) {
        importScripts("/static/ext/revisions/diff_match_patch.js");
        self.dmp = new diff_match_patch();
    }

    if (!self.difflib) {
        importScripts("/static/ext/revisions/difflib.js");
        self.difflib = difflib;
    }
};

self.onmessage = function(e) {
    var packet = {};
    var afterRevision, beforeRevision, lastContent, patch;
    switch (e.data.type) {
        case "preloadlibs":
            loadLibs();
            break;
        case "closefile":
            docContentsOnRev[e.data.path] = null;
            break;
        case "preview":
            var results = getLastAndAfterRevisions(e.data);
            beforeRevision = results[0];
            afterRevision = results[1];

            var lines1 = beforeRevision.split(rNL);
            var lines2 = afterRevision.split(rNL);

            var ops = new self.difflib.SequenceMatcher(lines1, lines2).get_opcodes();
            var str = "";
            var ranges = [];
            var extraCounter = 0;

            var processLine = function(line, row, type) {
                extraCounter = extraCounter + 1;
                str += startChar[type] + line + "\n";
                if (type === "equal")
                    return;

                var prev = ranges[ranges.length - 1];
                // If there is a previous non-neutral change and this change is
                // of the same kind as the current one and the last line of the
                // previous change is the line before the first line of the
                // current one.
                if (prev && prev[4] === type && (prev[2] === (row - 1))) {
                    prev[2] = row + 1;
                    prev[3] = 0;
                    return;
                }
                ranges.push([row, 0, row, 1, type]);
            };

            var j;
            for (i = 0, l = ops.length; i < l; i++) {
                var op = ops[i];
                switch (op[0]) {
                    case "equal":
                        for (j = op[1]; j < op[2]; j++) {
                            processLine(lines1[j], j, op[0]);
                        }
                        break;
                    case "insert":
                        for (j = op[3]; j < op[4]; j++) {
                            processLine(lines2[j], extraCounter, op[0]);
                        }
                        break;
                    case "delete":
                        for (j = op[1]; j < op[2]; j++) {
                            processLine(lines1[j], extraCounter, op[0]);
                        }
                        break;
                    case "replace":
                        for (j = op[1]; j < op[2]; j++) {
                            processLine(lines1[j], extraCounter, "delete");
                        }

                        for (j = op[3]; j < op[4]; j++) {
                            processLine(lines2[j], extraCounter, "insert");
                        }
                        break;
                }
            }

            packet.type = "preview";
            packet.content = {
                id: e.data.id,
                value: str,
                ranges: ranges
            };
            break;

        case "apply":
            afterRevision = getLastAndAfterRevisions(e.data)[1];

            packet.type = "apply";
            packet.content = {
                id: e.data.id,
                value: afterRevision
            };
            break;

        case "newRevision":
            lastContent = e.data.lastContent;
            // That means that the main thread has already sent the revisions to
            // the worker before, thus the latter has the data and the previous 
            // content of the document, so we don't have to calculate again, and 
            // more important, the amount of data the main thread has to sent is
            // MUCH smaller.
            if (e.data.hasBeenSentToWorker === true) {
                // Assuming it always is the previous revision, which could be wrong
                beforeRevision = docContentsOnRev[e.data.path];
            }
            else {
                try {
                    beforeRevision = "";
                    var tss = keysToSortedArray(e.data.revisions);
                    for (var i = 0, l = tss.length; i < l; i++) {
                        patch = e.data.revisions[tss[i]].patch[0];
                        beforeRevision = self.dmp.patch_apply(patch, beforeRevision)[0];
                    }
                }
                catch(err) {
                    self.postMessage({
                        type: "newRevision.error",
                        path: e.data.path
                    });
                }
            }
            
            patch = self.dmp.patch_make(beforeRevision, lastContent);
            docContentsOnRev[e.data.path] = lastContent;

            // If there is no actual changes, let's return
            if (patch.length === 0) {
                return;
            }

            packet = {
                type: "newRevision",
                path: e.data.path,
                revision: {
                    contributors: e.data.contributors,
                    silentsave: e.data.silentsave,
                    restoring: e.data.restoring,
                    ts: e.data.ts || Date.now(),
                    patch: [patch],
                    length: lastContent.length,
                    saved: false
                }
            };
            break;

        // Recovery is a special case for when a external application modifies
        // the file the user is working on.
        case "recovery":
            var currentContent = e.data.lastContent;
            var realContent = e.data.realContent;
            patch = self.dmp.patch_make(currentContent, realContent);

            // If there is no actual changes, let's return
            if (patch.length === 0) {
                return;
            }

            packet = {
                type: "recovery",
                path: e.data.path,
                revision: {
                    contributors: e.data.contributors,
                    silentsave: e.data.silentsave,
                    restoring: e.data.restoring,
                    ts: Date.now(),
                    patch: [patch],
                    finalContent: currentContent,
                    realContent: realContent,
                    saved: false,
                    inDialog: true,
                    nextAction: e.data.nextAction
                }
            };
            break;
    }
    self.postMessage(packet);
};
