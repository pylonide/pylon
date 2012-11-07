/*global diff_match_patch */
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
    "0": "  ",
    "-1": "- ",
    "1": "+ "
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

var loadLibs = function(prefix) {
    if (!self.dmp) {
        importScripts(prefix + "/ext/revisions/diff_match_patch.js");
        self.dmp = new diff_match_patch();
    }
};

function diffLineMode(text1, text2) {
    var dmp = self.dmp;
    var a = dmp.diff_linesToChars_(text1, text2);
    var diffs = dmp.diff_main(a.chars1, a.chars2, false);

    dmp.diff_charsToLines_(diffs, a.lineArray);
    return diffs;
}

self.onmessage = function(e) {
    var packet = {};
    var afterRevision, beforeRevision, lastContent, patch;
    switch (e.data.type) {
        case "preloadlibs":
            loadLibs(e.data.prefix);
            break;

        case "closefile":
            docContentsOnRev[e.data.path] = null;
            break;

        case "preview":
            var str = "";
            var ranges = [];
            var extraCounter = 0;

            // Takes an array of lines, processes them by adding the proper sign
            // at the beginning of each one for the diff, and pushes the metadata
            // of the lines into the ranges, which will be used to mark the lines.
            var process = function(lines, type) {
                var counterBefore = extraCounter;
                str += lines.map(function(line) {
                    extraCounter = extraCounter + 1; // Keep a count for current line
                    return (extraCounter === 1 ? "" : "\n") + startChar[type] + line;
                }).join("");

                // If this range of lines is unchanged, we don't need metadata.
                if (type === "0")
                    return;

                ranges.push([counterBefore + 1, 0, extraCounter + 1, 0, type]);
            };

            var results = getLastAndAfterRevisions(e.data);
            beforeRevision = results[0];
            afterRevision = results[1];

            var ops = diffLineMode(beforeRevision, afterRevision);
            ops.forEach(function(op) {
                // Get rid of a newline at the end of the block and split.
                var lines = op[1].replace(/\n$/, "").split(rNL);
                process(lines, op[0].toString());
            });

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
                    return self.postMessage({
                        type: "newRevision.error",
                        path: e.data.path
                    });
                }
            }

            try {
                patch = self.dmp.patch_make(beforeRevision, lastContent);
            }
            catch (e) {
                // Log the error. This is probably an instance of `Unknown call
                // format to patch_make`. Passing types of `beforeRevision` and
                // `lastContent` because it is likely that any of those is null.
                debug(e, typeof beforeRevision, typeof lastContent);
                return self.postMessage({
                    type: "newRevision.error",
                    path: e.data.path
                });
            }
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
            try {
                patch = self.dmp.patch_make(currentContent, realContent);
            }
            catch (e) {
                // Log the error. This is probably an instance of `Unknown call
                // format to patch_make`. Passing types of `beforeRevision` and
                // `lastContent` because it is likely that any of those is null.
                return debug(e, typeof currentContent, typeof realContent);
            }

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
