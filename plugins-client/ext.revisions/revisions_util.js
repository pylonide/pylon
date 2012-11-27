/*global winQuestionRev winQuestionRevHeader winQuestionRevMsg btnQuestionRevYesAll
 * btnQuestionRevNoAll tabEditors
 */
define(function(require, exports, module) {

var Range = require("ace/range").Range;
var Anchor = require("ace/anchor").Anchor;

var TIMELAPSE = 10 * 60 * 1000;
exports.compactRevisions = function(timestamps) {
    if (!timestamps.length) {
        return [];
    }
    else if (timestamps.length === 1) {
        return [timestamps];
    }

    return timestamps.reduce(function(prev, curr) {
        var p = [prev];
        var c = [curr];

        if (prev.length) {
            var last = prev[prev.length - 1];
            if (curr < (last[0] + TIMELAPSE)) {
                last.push(curr);
            }
            else {
                prev.push(c);
            }
            return prev;
        }
        else {
            if (curr < (prev + TIMELAPSE)) {
                p.push(curr);
                return [[prev, curr]];
            }
            else {
                return [p, c];
            }
        }
    });
};

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
exports.generateCompactRevisions = function(revObj) {
    if (!revObj || !revObj.allRevisions) return;

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
        else {
            prev.push([id]);
        }
        return prev;
    };

    var timestamps = exports.keysToSortedArray(revObj.allRevisions);
    exports.compactRevisions(timestamps).forEach(function(ts) {
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
};

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

var lineType = {
    "0": "equal",
    "1": "insert",
    "-1": "delete"
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
exports.addCodeMarker = function(session, doc, type, range) {
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

        markerId = session.addMarker(range, "revision_hl_" + lineType[type.toString()], "background");
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

exports.question = function(title, header, msg, onyesall, onnoall) {
    winQuestionRev.show();
    winQuestionRev.setAttribute("title", title);
    winQuestionRevHeader.$ext.innerHTML = header;
    winQuestionRevMsg.$ext.innerHTML = msg;
    btnQuestionRevYesAll.onclick = onyesall;
    btnQuestionRevNoAll.onclick = onnoall;
};

exports.keysToSortedArray = function(obj) {
    return Object.keys(obj)
        .map(function(key) { return parseInt(key, 10); })
        .sort(function(a, b) { return a - b; });
};

});
