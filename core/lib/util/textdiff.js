/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __WITH_TEXTDIFF

/**
 * @fileoverview Computes the difference between two texts to create a patch.
 * Applies the patch onto another text, allowing for errors.
 * @author fraser AT google DOT com (Neil Fraser)
 */

/**
 * Class containing the diff, match and patch methods.
 * @constructor
 */
apf.diff_match_patch = new (function() {

    // Defaults.
    // Redefine these in your program to override the defaults.

    // Number of seconds to map a diff before giving up (0 for infinity).
    this.diffTimeout          = 1.0;
    // Cost of an empty edit operation in terms of edit characters.
    this.diffEditCost         = 4;
    // The size beyond which the double-ended diff activates.
    // Double-ending is twice as fast, but less accurate.
    this.diffDualThreshold    = 32;
    // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
    this.matchThreshold       = 0.5;
    // How far to search for a match (0 = exact location, 1000+ = broad match).
    // A match this many characters away from the expected location will add
    // 1.0 to the score (0.0 is a perfect match).
    this.matchDistance        = 1000;
    // When deleting a large block of text (over ~64 characters), how close does
    // the contents have to match the expected contents. (0.0 = perfection,
    // 1.0 = very loose).  Note that matchThreshold controls how closely the
    // end points of a delete need to match.
    this.patchDeleteThreshold = 0.5;
    // Chunk size for context length.
    this.patchMargin          = 4;

    /**
     * The data structure representing a diff is an array of tuples:
     * [[DIFF_DELETE, "Hello"], [DIFF_INSERT, "Goodbye"], [DIFF_EQUAL, " world."]]
     * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
     */
    var DIFF_DELETE = -1,
        DIFF_INSERT = 1,
        DIFF_EQUAL  = 0,
        /*
         * Compute the number of bits in an int.
         * The normal answer for JavaScript is 32.
         * @return {number} Max bits
         */
        getMaxBits = function() {
            var maxbits = 0,
                oldi    = 1,
                newi    = 2;
            while (oldi != newi) {
                maxbits++;
                oldi = newi;
                newi = newi << 1;
            }
            return maxbits;
        },
        /**
         * Class representing one patch operation.
         * @constructor
         */
        patch_obj = function () {
            /** @type {Array.<Array.<number|string>>} */
            this.diffs   = [];
            /** @type {number?} */
            this.start1  = null;
            /** @type {number?} */
            this.start2  = null;
            /** @type {number} */
            this.length1 = 0;
            /** @type {number} */
            this.length2 = 0;
        },
        opMap = [];
    opMap[DIFF_INSERT] = "+";
    opMap[DIFF_DELETE] = "-";
    opMap[DIFF_EQUAL]  = " ";

    /**
     * Emmulate GNU diff's format.
     * Header: @@ -382,8 +481,9 @@
     * Indicies are printed as 1-based, not 0-based.
     * @return {string} The GNU diff string.
     */
    patch_obj.prototype.toString = function() {
        var coords1 = (this.length1 === 0)
                ? this.start1 + ",0"
                : (this.length1 == 1)
                    ? this.start1 + 1
                    : (this.start1 + 1) + "," + this.length1,

            coords2 = (this.length2 === 0) 
                ? this.start2 + ",0"
                : (this.length2 == 1)
                    ?  this.start2 + 1
                    :  (this.start2 + 1) + "," + this.length2,

            text = ["@@ -" + coords1 + " +" + coords2 + " @@\n"],
            x    = 0,
            l    = this.diffs.length;
        // Escape the body of the patch with %xx notation.
        for (; x < l; x++)
            text[x + 1] = opMap[this.diffs[x][0]] + encodeURI(this.diffs[x][1]) + "\n";
        // Opera doesn't know how to encode char 0.
        return text.join("").replace(/\x00/g, "%00").replace(/%20/g, " ");
    };

    // How many bits in a number?
    this.matchMaxBits = getMaxBits();


    /**
     * Find the differences between two texts.  Simplifies the problem by stripping
     * any common prefix or suffix off the texts before diffing.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @param {boolean} opt_checklines Optional speedup flag.  If present and false,
     *     then don't run a line-level diff first to identify the changed areas.
     *     Defaults to true, which does a faster, slightly less optimal diff
     * @return {Array.<Array.<number|string>>} Array of diff tuples.
     */
    this.diff_main = function(text1, text2, opt_checklines) {
        // Check for equality (speedup)
        if (text1 == text2)
            return [[DIFF_EQUAL, text1]];

        if (typeof opt_checklines == "undefined")
            opt_checklines = true;
        
        var checklines = opt_checklines,
            // Trim off common prefix (speedup)
            commonlength = this.diff_commonPrefix(text1, text2),
            commonprefix = text1.substring(0, commonlength);

        text1 = text1.substring(commonlength);
        text2 = text2.substring(commonlength);

        // Trim off common suffix (speedup)
        commonlength = this.diff_commonSuffix(text1, text2);
        var commonsuffix = text1.substring(text1.length - commonlength);
        text1 = text1.substring(0, text1.length - commonlength);
        text2 = text2.substring(0, text2.length - commonlength);

        // Compute the diff on the middle block
        var diffs = diff_compute.call(this, text1, text2, checklines);

        // Restore the prefix and suffix
        if (commonprefix)
            diffs.unshift([DIFF_EQUAL, commonprefix]);
        if (commonsuffix)
            diffs.push([DIFF_EQUAL, commonsuffix]);
        this.diff_cleanupMerge(diffs);
        return diffs;
    };


    /**
     * Find the differences between two texts.  Assumes that the texts do not
     * have any common prefix or suffix.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @param {boolean} checklines Speedup flag.  If false, then don't run a
     *     line-level diff first to identify the changed areas.
     *     If true, then run a faster, slightly less optimal diff
     * @return {Array.<Array.<number|string>>} Array of diff tuples.
     * @private
     */
    var diff_compute = function(text1, text2, checklines) {
        var diffs;

        if (!text1) // Just add some text (speedup)
            return [[DIFF_INSERT, text2]];

        if (!text2) // Just delete some text (speedup)
            return [[DIFF_DELETE, text1]];

        var longtext  = text1.length > text2.length ? text1 : text2,
            shorttext = text1.length > text2.length ? text2 : text1,
            i         = longtext.indexOf(shorttext);
        if (i != -1) {
            // Shorter text is inside the longer text (speedup)
            diffs = [[DIFF_INSERT, longtext.substring(0, i)],
                     [DIFF_EQUAL,  shorttext],
                     [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
            // Swap insertions for deletions if diff is reversed.
            if (text1.length > text2.length)
                diffs[0][0] = diffs[2][0] = DIFF_DELETE;
            return diffs;
        }
        longtext = shorttext = null;  // Garbage collect

        // Check to see if the problem can be split in two.
        var a, linearray,
            hm = this.diff_halfMatch(text1, text2);
        if (hm) {
            // A half-match was found, sort out the return data.
            //text1_a    = hm[0],
            //text1_b    = hm[1],
            //text2_a    = hm[2],
            //text2_b    = hm[3],
            //mid_common = hm[4],
            // Send both pairs off for separate processing.
            //var diffs_a = this.diff_main(hm[0], hm[2], checklines),
            //    diffs_b = this.diff_main(hm[1], hm[3], checklines);
            // Merge the results.
            return this.diff_main(hm[0], hm[2], checklines)
                .concat([[DIFF_EQUAL, hm[4]]], this.diff_main(hm[1], hm[3], checklines));
        }

        // Perform a real diff.
        if (checklines && (text1.length < 100 || text2.length < 100)) // Too trivial for the overhead.
            checklines = false;

        if (checklines) {
            // Scan the text on a line-by-line basis first.
            a         = this.diff_linesToChars(text1, text2);
            text1     = a[0];
            text2     = a[1];
            linearray = a[2];
        }
        diffs = this.diff_map(text1, text2);
        if (!diffs) // No acceptable result.
            diffs = [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
        if (checklines) {
            // Convert the diff back to original text.
            this.diff_charsToLines(diffs, linearray);
            // Eliminate freak matches (e.g. blank lines)
            this.diff_cleanupSemantic(diffs);

            // Rediff any replacement blocks, this time character-by-character.
            // Add a dummy entry at the end.
            diffs.push([DIFF_EQUAL, ""]);
            var pointer      = 0,
                count_delete = 0,
                count_insert = 0,
                text_delete  = "",
                text_insert  = "";
            while (pointer < diffs.length) {
                switch (diffs[pointer][0]) {
                    case DIFF_INSERT:
                        count_insert++;
                        text_insert += diffs[pointer][1];
                        break;
                    case DIFF_DELETE:
                        count_delete++;
                        text_delete += diffs[pointer][1];
                        break;
                    case DIFF_EQUAL:
                        // Upon reaching an equality, check for prior redundancies.
                        if (count_delete >= 1 && count_insert >= 1) {
                            // Delete the offending records and add the merged ones.
                            a = this.diff_main(text_delete, text_insert, false);
                            diffs.splice(pointer - count_delete - count_insert,
                            count_delete + count_insert);
                            pointer = pointer - count_delete - count_insert;
                            for (var j = a.length - 1; j >= 0; j--) {
                                diffs.splice(pointer, 0, a[j]);
                            }
                            pointer = pointer + a.length;
                        }
                        count_insert = 0;
                        count_delete = 0;
                        text_delete = "";
                        text_insert = "";
                        break;
                }
                pointer++;
            }
            diffs.pop();  // Remove the dummy entry at the end.
        }
        return diffs;
    };

    /**
     * Split two texts into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {Array.<string|Array.<string>>} Three element Array, containing the
     *     encoded text1, the encoded text2 and the array of unique strings.  The
     *     zeroth element of the array of unique strings is intentionally blank.
     * @private
     */
    this.diff_linesToChars = function(text1, text2) {
        // '\x00' is a valid character, but various debuggers don't like it.
        // So we'll insert a junk entry to avoid generating a null character.
        var lineArray = [""], // e.g. lineArray[4] == "Hello\n"
            lineHash  = {};   // e.g. lineHash["Hello\n"] == 4
        
        /**
         * Split a text into an array of strings.  Reduce the texts to a string of
         * hashes where each Unicode character represents one line.
         * Modifies linearray and linehash through being a closure.
         * @param {string} text String to encode
         * @return {string} Encoded string
         * @private
         */
        function diff_linesToCharsMunge(text) {
            var chars           = "",
                // Walk the text, pulling out a substring for each line.
                // text.split("\n") would would temporarily double our memory footprint.
                // Modifying text would create many large strings to garbage collect.
                lineStart       = 0,
                lineEnd         = -1,
                // Keeping our own length variable is faster than looking it up.
                lineArrayLength = lineArray.length;
            while (lineEnd < text.length - 1) {
                lineEnd = text.indexOf("\n", lineStart);
                if (lineEnd == -1)
                    lineEnd = text.length - 1;
                var line  = text.substring(lineStart, lineEnd + 1);
                lineStart = lineEnd + 1;

                if (lineHash.hasOwnProperty
                  ? lineHash.hasOwnProperty(line)
                  : (lineHash[line] !== undefined)) {
                    chars += String.fromCharCode(lineHash[line]);
                }
                else {
                    chars += String.fromCharCode(lineArrayLength);
                    lineHash[line] = lineArrayLength;
                    lineArray[lineArrayLength++] = line;
                }
            }
            return chars;
        }

        return [diff_linesToCharsMunge(text1), diff_linesToCharsMunge(text2),
            lineArray];
    };

    /**
     * Rehydrate the text in a diff from a string of line hashes to real lines of
     * text.
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     * @param {Array.<string>} lineArray Array of unique strings.
     * @private
     */
    this.diff_charsToLines = function(diffs, lineArray) {
        var x = 0,
            chars, text, y;
        for (; x < diffs.length; x++) {
            chars = diffs[x][1];
            text  = [];
            for (y = 0; y < chars.length; y++)
                text[y] = lineArray[chars.charCodeAt(y)];
            diffs[x][1] = text.join("");
        }
    };

    /**
     * Explore the intersection points between the two texts.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @return {Array.<Array.<number|string>>?} Array of diff tuples or null if no
     *     diff available.
     * @private
     */
    this.diff_map = function(text1, text2) {
        // Don't run for too long.
        var ms_end         = (new Date()).getTime() + this.diffTimeout * 1000,
            // Cache the text lengths to prevent multiple calls.
            text1_length   = text1.length,
            text2_length   = text2.length,
            d              = 0,
            max_d          = text1_length + text2_length - 1,
            doubleEnd      = this.diffDualThreshold * 2 < max_d,
            v_map1         = [],
            v_map2         = [],
            v1             = {},
            v2             = {},
            footsteps      = {},
            done           = false,
            // Safari 1.x doesn't have hasOwnProperty
            hasOwnProperty = !!(footsteps.hasOwnProperty),
            // If the total number of characters is odd, then the front path will collide
            // with the reverse path.
            front          = (text1_length + text2_length) % 2,
            x, y, k, a, footstep;  // Used to track overlapping paths.
        v1[1] = 0;
        v2[1] = 0;
        for (; d < max_d; d++) {
            // Bail out if timeout reached.
            if (this.diffTimeout > 0 && (new Date()).getTime() > ms_end)
                return null;

            // Walk the front path one step.
            v_map1[d] = {};
            for (k = -d; k <= d; k += 2) {
                if (k == -d || k != d && v1[k - 1] < v1[k + 1])
                    x = v1[k + 1];
                else
                    x = v1[k - 1] + 1;
                y = x - k;
                if (doubleEnd) {
                    footstep = x + "," + y;
                    if (front && (hasOwnProperty
                      ? footsteps.hasOwnProperty(footstep)
                      : (footsteps[footstep] !== undefined))) {
                        done = true;
                    }
                    if (!front)
                        footsteps[footstep] = d;
                }
                while (!done && x < text1_length && y < text2_length &&
                  text1.charAt(x) == text2.charAt(y)) {
                    x++;
                    y++;
                    if (doubleEnd) {
                        footstep = x + "," + y;
                        if (front && (hasOwnProperty
                          ? footsteps.hasOwnProperty(footstep)
                          : (footsteps[footstep] !== undefined))) {
                            done = true;
                        }
                        if (!front)
                            footsteps[footstep] = d;
                    }
                }
                v1[k] = x;
                v_map1[d][x + "," + y] = true;
                if (x == text1_length && y == text2_length) {
                    // Reached the end in single-path mode.
                    return this.diff_path1(v_map1, text1, text2);
                }
                else if (done) {
                    // Front path ran over reverse path.
                    v_map2 = v_map2.slice(0, footsteps[footstep] + 1);
                    a      = this.diff_path1(v_map1, text1.substring(0, x),
                    text2.substring(0, y));
                    return a.concat(this.diff_path2(v_map2, text1.substring(x),
                        text2.substring(y)));
                }
            }

            if (doubleEnd) {
                // Walk the reverse path one step.
                v_map2[d] = {};
                for (k = -d; k <= d; k += 2) {
                    x = (k == -d || k != d && v2[k - 1] < v2[k + 1])
                        ? v2[k + 1]
                        : v2[k - 1] + 1;
                    y = x - k;
                    footstep = (text1_length - x) + "," + (text2_length - y);
                    if (!front && (hasOwnProperty
                      ? footsteps.hasOwnProperty(footstep)
                      : (footsteps[footstep] !== undefined))) {
                        done = true;
                    }
                    if (front)
                        footsteps[footstep] = d;
                    while (!done && x < text1_length && y < text2_length
                      && text1.charAt(text1_length - x - 1) == text2.charAt(text2_length - y - 1)) {
                        x++;
                        y++;
                        footstep = (text1_length - x) + "," + (text2_length - y);
                        if (!front && (hasOwnProperty
                          ? footsteps.hasOwnProperty(footstep)
                          : (footsteps[footstep] !== undefined))) {
                            done = true;
                        }
                        if (front)
                            footsteps[footstep] = d;
                    }
                    v2[k] = x;
                    v_map2[d][x + "," + y] = true;
                    if (done) {
                        // Reverse path ran over front path.
                        v_map1 = v_map1.slice(0, footsteps[footstep] + 1);
                        a      = this.diff_path1(v_map1, text1.substring(0, text1_length - x),
                        text2.substring(0, text2_length - y));
                        return a.concat(this.diff_path2(v_map2,
                            text1.substring(text1_length - x),
                            text2.substring(text2_length - y)));
                    }
                }
            }
        }
        // Number of diffs equals number of characters, no commonality at all.
        return null;
    };

    /**
     * Work from the middle back to the start to determine the path.
     * @param {Array.<Object>} v_map Array of paths.
     * @param {string} text1 Old string fragment to be diffed.
     * @param {string} text2 New string fragment to be diffed.
     * @return {Array.<Array.<number|string>>} Array of diff tuples.
     * @private
     */
    this.diff_path1 = function(v_map, text1, text2) {
        var path    = [],
            x       = text1.length,
            y       = text2.length,
            /** @type {number?} */
            last_op = null,
            d       = v_map.length - 2;
        for (; d >= 0; d--) {
            while (1) {
                if (v_map[d].hasOwnProperty
                  ? v_map[d].hasOwnProperty((x - 1) + "," + y)
                  : (v_map[d][(x - 1) + "," + y] !== undefined)) {
                    x--;
                    if (last_op === DIFF_DELETE)
                        path[0][1] = text1.charAt(x) + path[0][1];
                    else
                        path.unshift([DIFF_DELETE, text1.charAt(x)]);
                    last_op = DIFF_DELETE;
                    break;
                }
                else if (v_map[d].hasOwnProperty 
                  ? v_map[d].hasOwnProperty(x + "," + (y - 1))
                  : (v_map[d][x + "," + (y - 1)] !== undefined)) {
                    y--;
                    if (last_op === DIFF_INSERT)
                        path[0][1] = text2.charAt(y) + path[0][1];
                    else
                        path.unshift([DIFF_INSERT, text2.charAt(y)]);
                    last_op = DIFF_INSERT;
                    break;
                }
                else {
                    x--;
                    y--;
                    //if (text1.charAt(x) != text2.charAt(y)) {
                    //    throw new Error("No diagonal.  Can't happen. (diff_path1)");
                    //}
                    if (last_op === DIFF_EQUAL)
                        path[0][1] = text1.charAt(x) + path[0][1];
                    else
                        path.unshift([DIFF_EQUAL, text1.charAt(x)]);
                    last_op = DIFF_EQUAL;
                }
            }
        }
        return path;
    };

    /**
     * Work from the middle back to the end to determine the path.
     * @param {Array.<Object>} v_map Array of paths.
     * @param {string} text1 Old string fragment to be diffed.
     * @param {string} text2 New string fragment to be diffed.
     * @return {Array.<Array.<number|string>>} Array of diff tuples.
     * @private
     */
    this.diff_path2 = function(v_map, text1, text2) {
        var path       = [],
            pathLength = 0,
            x          = text1.length,
            y          = text2.length,
            /** @type {number?} */
            last_op    = null,
            d          = v_map.length - 2;
        for (; d >= 0; d--) {
            while (1) {
                if (v_map[d].hasOwnProperty
                  ? v_map[d].hasOwnProperty((x - 1) + "," + y)
                  : (v_map[d][(x - 1) + "," + y] !== undefined)) {
                    x--;
                    if (last_op === DIFF_DELETE) {
                        path[pathLength - 1][1] += text1.charAt(text1.length - x - 1);
                    }
                    else {
                        path[pathLength++] =
                            [DIFF_DELETE, text1.charAt(text1.length - x - 1)];
                    }
                    last_op = DIFF_DELETE;
                    break;
                }
                else if (v_map[d].hasOwnProperty 
                  ? v_map[d].hasOwnProperty(x + "," + (y - 1))
                  : (v_map[d][x + "," + (y - 1)] !== undefined)) {
                    y--;
                    if (last_op === DIFF_INSERT) {
                        path[pathLength - 1][1] += text2.charAt(text2.length - y - 1);
                    }
                    else {
                        path[pathLength++] =
                            [DIFF_INSERT, text2.charAt(text2.length - y - 1)];
                    }
                    last_op = DIFF_INSERT;
                    break;
                }
                else {
                    x--;
                    y--;
                    //if (text1.charAt(text1.length - x - 1) !=
                    //    text2.charAt(text2.length - y - 1)) {
                    //  throw new Error("No diagonal.  Can't happen. (diff_path2)");
                    //}
                    if (last_op === DIFF_EQUAL) {
                        path[pathLength - 1][1] += text1.charAt(text1.length - x - 1);
                    }
                    else {
                        path[pathLength++] =
                            [DIFF_EQUAL, text1.charAt(text1.length - x - 1)];
                    }
                    last_op = DIFF_EQUAL;
                }
            }
        }
        return path;
    };

    /**
     * Determine the common prefix of two strings
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {number} The number of characters common to the start of each
     *     string.
     */
    this.diff_commonPrefix = function(text1, text2) {
        // Quick check for common null cases.
        if (!text1 || !text2 || text1.charCodeAt(0) !== text2.charCodeAt(0))
            return 0;
        // Binary search.
        // Performance analysis: http://neil.fraser.name/news/2007/10/09/
        var pointermin   = 0,
            pointermax   = Math.min(text1.length, text2.length),
            pointermid   = pointermax,
            pointerstart = 0;
        while (pointermin < pointermid) {
            if (text1.substring(pointerstart, pointermid)
              == text2.substring(pointerstart, pointermid)) {
                pointermin   = pointermid;
                pointerstart = pointermin;
            }
            else {
                pointermax = pointermid;
            }
            pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
        }
        return pointermid;
    };

    /**
     * Determine the common suffix of two strings
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {number} The number of characters common to the end of each string.
     */
    this.diff_commonSuffix = function(text1, text2) {
        // Quick check for common null cases.
        if (!text1 || !text2 || text1.charCodeAt(text1.length - 1)
          !== text2.charCodeAt(text2.length - 1)) {
            return 0;
        }
        // Binary search.
        // Performance analysis: http://neil.fraser.name/news/2007/10/09/
        var pointermin = 0,
            pointermax = Math.min(text1.length, text2.length),
            pointermid = pointermax,
            pointerend = 0;
        while (pointermin < pointermid) {
            if (text1.substring(text1.length - pointermid, text1.length - pointerend)
              == text2.substring(text2.length - pointermid, text2.length - pointerend)) {
                pointermin = pointermid;
                pointerend = pointermin;
            }
            else {
                pointermax = pointermid;
            }
            pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
        }
        return pointermid;
    };

    /**
     * Do the two texts share a substring which is at least half the length of the
     * longer text?
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {Array.<string>?} Five element Array, containing the prefix of
     *     text1, the suffix of text1, the prefix of text2, the suffix of
     *     text2 and the common middle.  Or null if there was no match.
     */
    this.diff_halfMatch = function(text1, text2) {
        var longtext  = text1.length > text2.length ? text1 : text2,
            shorttext = text1.length > text2.length ? text2 : text1,
            _self     = this;
        if (longtext.length < 10 || shorttext.length < 1)
            return null;  // Pointless.

        /**
         * Does a substring of shorttext exist within longtext such that the substring
         * is at least half the length of longtext?
         * Closure, but does not reference any external variables.
         * @param {string} longtext Longer string.
         * @param {string} shorttext Shorter string.
         * @param {number} i Start index of quarter length substring within longtext
         * @return {Array.<string>?} Five element Array, containing the prefix of
         *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
         *     of shorttext and the common middle.  Or null if there was no match.
         * @private
         */
        function diff_halfMatchI(longtext, shorttext, i) {
            // Start with a 1/4 length substring at position i as a seed.
            var seed        = longtext.substring(i, i + Math.floor(longtext.length / 4)),
                j           = -1,
                best_common = "",
                best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b,
                prefixLength, suffixLength;
            while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
                prefixLength = _self.diff_commonPrefix(longtext.substring(i),
                    shorttext.substring(j));
                suffixLength = _self.diff_commonSuffix(longtext.substring(0, i),
                    shorttext.substring(0, j));
                if (best_common.length < suffixLength + prefixLength) {
                    best_common = shorttext.substring(j - suffixLength, j) 
                                + shorttext.substring(j, j + prefixLength);
                    best_longtext_a  = longtext.substring(0, i - suffixLength);
                    best_longtext_b  = longtext.substring(i + prefixLength);
                    best_shorttext_a = shorttext.substring(0, j - suffixLength);
                    best_shorttext_b = shorttext.substring(j + prefixLength);
                }
            }
            if (best_common.length >= longtext.length / 2) {
                return [best_longtext_a, best_longtext_b, best_shorttext_a,
                        best_shorttext_b, best_common];
            }
            else {
                return null;
            }
        }

        // First check if the second quarter is the seed for a half-match.
        var hm1 = diff_halfMatchI(longtext, shorttext, Math.ceil(longtext.length / 4)),
            // Check again based on the third quarter.
            hm2 = diff_halfMatchI(longtext, shorttext, Math.ceil(longtext.length / 2)),
            hm;
        if (!hm1 && !hm2)
            return null;
        else if (!hm2)
            hm = hm1;
        else if (!hm1)
            hm = hm2;
        else // Both matched.  Select the longest.
            hm = hm1[4].length > hm2[4].length ? hm1 : hm2;

        // A half-match was found, sort out the return data.
        var text1_a, text1_b, text2_a, text2_b;
        if (text1.length > text2.length) {
            text1_a = hm[0];
            text1_b = hm[1];
            text2_a = hm[2];
            text2_b = hm[3];
        }
        else {
            text2_a = hm[0];
            text2_b = hm[1];
            text1_a = hm[2];
            text1_b = hm[3];
        }
        //var mid_common = hm[4];
        return [text1_a, text1_b, text2_a, text2_b, hm[4]];
    };

    /**
     * Reduce the number of edits by eliminating semantically trivial equalities.
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     */
    this.diff_cleanupSemantic = function(diffs) {
        var changes          = false,
            equalities       = [],   // Stack of indices where equalities are found.
            equalitiesLength = 0,    // Keeping our own length var is faster in JS.
            lastequality     = null, // Always equal to equalities[equalitiesLength-1][1]
            pointer          = 0,    // Index of current position.
            // Number of characters that changed prior to the equality.
            length_changes1  = 0,
            // Number of characters that changed after the equality.
            length_changes2  = 0;
        while (pointer < diffs.length) {
            if (diffs[pointer][0] == DIFF_EQUAL) {  // equality found
                equalities[equalitiesLength++] = pointer;
                length_changes1 = length_changes2;
                length_changes2 = 0;
                lastequality    = diffs[pointer][1];
            }
            else {  // an insertion or deletion
                length_changes2 += diffs[pointer][1].length;
                if (lastequality !== null && (lastequality.length <= length_changes1)
                  && (lastequality.length <= length_changes2)) {
                    // Duplicate record
                    diffs.splice(equalities[equalitiesLength - 1], 0,
                        [DIFF_DELETE, lastequality]);
                    // Change second copy to insert.
                    diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
                    // Throw away the equality we just deleted.
                    equalitiesLength--;
                    // Throw away the previous equality (it needs to be reevaluated).
                    equalitiesLength--;
                    pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
                    length_changes1 = 0;  // Reset the counters.
                    length_changes2 = 0;
                    lastequality    = null;
                    changes         = true;
                }
            }
            pointer++;
        }
        if (changes)
            this.diff_cleanupMerge(diffs);
        this.diff_cleanupSemanticLossless(diffs);
    };

    /**
     * Look for single edits surrounded on both sides by equalities
     * which can be shifted sideways to align the edit to a word boundary.
     * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     */
    this.diff_cleanupSemanticLossless = function(diffs) {
        // Define some regex patterns for matching boundaries.
        var punctuation    = /[^a-zA-Z0-9]/,
            whitespace     = /\s/,
            linebreak      = /[\r\n]/,
            blanklineEnd   = /\n\r?\n$/,
            blanklineStart = /^\r?\n\r?\n/;

        /**
         * Given two strings, compute a score representing whether the internal
         * boundary falls on logical boundaries.
         * Scores range from 5 (best) to 0 (worst).
         * Closure, makes reference to regex patterns defined above.
         * @param {string} one First string
         * @param {string} two Second string
         * @return {number} The score.
         */
        function diff_cleanupSemanticScore(one, two) {
            if (!one || !two) // Edges are the best.
                return 5;

            // Each port of this function behaves slightly differently due to
            // subtle differences in each language's definition of things like
            // 'whitespace'.  Since this function's purpose is largely cosmetic,
            // the choice has been made to use each language's native features
            // rather than force total conformity.
            var score = 0;
            // One point for non-alphanumeric.
            if (one.charAt(one.length - 1).match(punctuation) 
              || two.charAt(0).match(punctuation)) {
                score++;
                // Two points for whitespace.
                if (one.charAt(one.length - 1).match(whitespace)
                  || two.charAt(0).match(whitespace)) {
                    score++;
                    // Three points for line breaks.
                    if (one.charAt(one.length - 1).match(linebreak)
                      || two.charAt(0).match(linebreak)) {
                        score++;
                        // Four points for blank lines.
                        if (one.match(blanklineEnd) || two.match(blanklineStart))
                            score++;
                    }
                }
            }
            return score;
        }

        var pointer = 1,
            equality1, edit, equality2, commonOffset, commonString, bestEquality1,
            bestEdit, bestEquality2, bestScore, score;
        // Intentionally ignore the first and last element (don't need checking).
        while (pointer < diffs.length - 1) {
            if (diffs[pointer - 1][0] == DIFF_EQUAL && diffs[pointer + 1][0] == DIFF_EQUAL) {
                // This is a single edit surrounded by equalities.
                equality1 = diffs[pointer - 1][1];
                edit      = diffs[pointer][1];
                equality2 = diffs[pointer + 1][1];

                // First, shift the edit as far left as possible.
                commonOffset = this.diff_commonSuffix(equality1, edit);
                if (commonOffset) {
                    commonString = edit.substring(edit.length - commonOffset);
                    equality1    = equality1.substring(0, equality1.length - commonOffset);
                    edit         = commonString + edit.substring(0, edit.length - commonOffset);
                    equality2    = commonString + equality2;
                }

                // Second, step character by character right, looking for the best fit.
                bestEquality1 = equality1;
                bestEdit      = edit;
                bestEquality2 = equality2;
                bestScore     = diff_cleanupSemanticScore(equality1, edit) +
                    diff_cleanupSemanticScore(edit, equality2);
                while (edit.charAt(0) === equality2.charAt(0)) {
                    equality1 += edit.charAt(0);
                    edit = edit.substring(1) + equality2.charAt(0);
                    equality2 = equality2.substring(1);
                    score = diff_cleanupSemanticScore(equality1, edit) +
                    diff_cleanupSemanticScore(edit, equality2);
                    // The >= encourages trailing rather than leading whitespace on edits.
                    if (score >= bestScore) {
                        bestScore = score;
                        bestEquality1 = equality1;
                        bestEdit = edit;
                        bestEquality2 = equality2;
                    }
                }

                if (diffs[pointer - 1][1] != bestEquality1) {
                    // We have an improvement, save it back to the diff.
                    if (bestEquality1) {
                        diffs[pointer - 1][1] = bestEquality1;
                    }
                    else {
                        diffs.splice(pointer - 1, 1);
                        pointer--;
                    }
                    diffs[pointer][1] = bestEdit;
                    if (bestEquality2) {
                        diffs[pointer + 1][1] = bestEquality2;
                    }
                    else {
                        diffs.splice(pointer + 1, 1);
                        pointer--;
                    }
                }
            }
            pointer++;
        }
    };

    /**
     * Reduce the number of edits by eliminating operationally trivial equalities.
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     */
    this.diff_cleanupEfficiency = function(diffs) {
        var changes          = false,
            equalities       = [], // Stack of indices where equalities are found.
            equalitiesLength = 0,  // Keeping our own length var is faster in JS.
            lastequality     = "", // Always equal to equalities[equalitiesLength-1][1]
            pointer          = 0,  // Index of current position.
            // Is there an insertion operation before the last equality.
            pre_ins          = false,
            // Is there a deletion operation before the last equality.
            pre_del          = false,
            // Is there an insertion operation after the last equality.
            post_ins         = false,
            // Is there a deletion operation after the last equality.
            post_del         = false;
        while (pointer < diffs.length) {
            if (diffs[pointer][0] == DIFF_EQUAL) {  // equality found
                if (diffs[pointer][1].length < this.diffEditCost
                  && (post_ins || post_del)) {
                    // Candidate found.
                    equalities[equalitiesLength++] = pointer;
                    pre_ins = post_ins;
                    pre_del = post_del;
                    lastequality = diffs[pointer][1];
                }
                else {
                    // Not a candidate, and can never become one.
                    equalitiesLength = 0;
                    lastequality     = "";
                }
                post_ins = post_del = false;
            }
            else {  // an insertion or deletion
                if (diffs[pointer][0] == DIFF_DELETE)
                    post_del = true;
                else
                    post_ins = true;
                /*
                 * Five types to be split:
                 * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
                 * <ins>A</ins>X<ins>C</ins><del>D</del>
                 * <ins>A</ins><del>B</del>X<ins>C</ins>
                 * <ins>A</del>X<ins>C</ins><del>D</del>
                 * <ins>A</ins><del>B</del>X<del>C</del>
                 */
                if (lastequality && ((pre_ins && pre_del && post_ins && post_del) 
                  || ((lastequality.length < this.diffEditCost / 2)
                  && (pre_ins + pre_del + post_ins + post_del) == 3))) {
                    // Duplicate record
                    diffs.splice(equalities[equalitiesLength - 1], 0,
                        [DIFF_DELETE, lastequality]);
                    // Change second copy to insert.
                    diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
                    equalitiesLength--;  // Throw away the equality we just deleted;
                    lastequality = "";
                    if (pre_ins && pre_del) {
                        // No changes made which could affect previous entry, keep going.
                        post_ins = post_del = true;
                        equalitiesLength = 0;
                    }
                    else {
                        equalitiesLength--;  // Throw away the previous equality;
                        pointer = equalitiesLength > 0 
                            ? equalities[equalitiesLength - 1]
                            : -1;
                        post_ins = post_del = false;
                    }
                    changes = true;
                }
            }
            pointer++;
        }

        if (changes)
            this.diff_cleanupMerge(diffs);
    };

    /**
     * Reorder and merge like edit sections.  Merge equalities.
     * Any edit section can move as long as it doesn't cross an equality.
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     */
    this.diff_cleanupMerge = function(diffs) {
        diffs.push([DIFF_EQUAL, ""]);  // Add a dummy entry at the end.
        var pointer      = 0,
            count_delete = 0,
            count_insert = 0,
            text_delete  = "",
            text_insert  = "",
            commonlength;
        while (pointer < diffs.length) {
            switch (diffs[pointer][0]) {
                case DIFF_INSERT:
                    count_insert++;
                    text_insert += diffs[pointer][1];
                    pointer++;
                    break;
                case DIFF_DELETE:
                    count_delete++;
                    text_delete += diffs[pointer][1];
                    pointer++;
                    break;
                case DIFF_EQUAL:
                    // Upon reaching an equality, check for prior redundancies.
                    if (count_delete !== 0 || count_insert !== 0) {
                        if (count_delete !== 0 && count_insert !== 0) {
                            // Factor out any common prefixies.
                            commonlength = this.diff_commonPrefix(text_insert, text_delete);
                            if (commonlength !== 0) {
                                if ((pointer - count_delete - count_insert) > 0 
                                  && diffs[pointer - count_delete - count_insert - 1][0]
                                  == DIFF_EQUAL) {
                                    diffs[pointer - count_delete - count_insert - 1][1] +=
                                    text_insert.substring(0, commonlength);
                                }
                                else {
                                    diffs.splice(0, 0, [DIFF_EQUAL,
                                    text_insert.substring(0, commonlength)]);
                                    pointer++;
                                }
                                text_insert = text_insert.substring(commonlength);
                                text_delete = text_delete.substring(commonlength);
                            }
                            // Factor out any common suffixies.
                            commonlength = this.diff_commonSuffix(text_insert, text_delete);
                            if (commonlength !== 0) {
                                diffs[pointer][1] = text_insert.substring(text_insert.length 
                                    - commonlength) + diffs[pointer][1];
                                text_insert = text_insert.substring(0, text_insert.length 
                                    - commonlength);
                                text_delete = text_delete.substring(0, text_delete.length 
                                    - commonlength);
                            }
                        }
                        // Delete the offending records and add the merged ones.
                        if (count_delete === 0) {
                            diffs.splice(pointer - count_delete - count_insert,
                                count_delete + count_insert, [DIFF_INSERT, text_insert]);
                        }
                        else if (count_insert === 0) {
                            diffs.splice(pointer - count_delete - count_insert,
                                count_delete + count_insert, [DIFF_DELETE, text_delete]);
                        }
                        else {
                            diffs.splice(pointer - count_delete - count_insert,
                                count_delete + count_insert, [DIFF_DELETE, text_delete],
                                [DIFF_INSERT, text_insert]);
                        }
                        pointer = pointer - count_delete - count_insert 
                            + (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
                    }
                    else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
                        // Merge this equality with the previous one.
                        diffs[pointer - 1][1] += diffs[pointer][1];
                        diffs.splice(pointer, 1);
                    }
                    else {
                        pointer++;
                    }
                    count_insert = 0;
                    count_delete = 0;
                    text_delete  = "";
                    text_insert  = "";
                    break;
            }
        }
        if (diffs[diffs.length - 1][1] === "")
            diffs.pop();  // Remove the dummy entry at the end.

        // Second pass: look for single edits surrounded on both sides by equalities
        // which can be shifted sideways to eliminate an equality.
        // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
        var changes = false;
        pointer = 1;
        // Intentionally ignore the first and last element (don't need checking).
        while (pointer < diffs.length - 1) {
            if (diffs[pointer - 1][0] == DIFF_EQUAL
              && diffs[pointer + 1][0] == DIFF_EQUAL) {
                // This is a single edit surrounded by equalities.
                if (diffs[pointer][1].substring(diffs[pointer][1].length
                  - diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
                    // Shift the edit over the previous equality.
                    diffs[pointer][1] = diffs[pointer - 1][1] 
                        + diffs[pointer][1].substring(0, diffs[pointer][1].length
                        - diffs[pointer - 1][1].length);
                    diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
                    diffs.splice(pointer - 1, 1);
                    changes = true;
                }
                else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length)
                  == diffs[pointer + 1][1]) {
                    // Shift the edit over the next equality.
                    diffs[pointer - 1][1] += diffs[pointer + 1][1];
                    diffs[pointer][1] = diffs[pointer][1]
                        .substring(diffs[pointer + 1][1].length) + diffs[pointer + 1][1];
                    diffs.splice(pointer + 1, 1);
                    changes = true;
                }
            }
            pointer++;
        }
        // If shifts were made, the diff needs reordering and another shift sweep.
        if (changes)
            this.diff_cleanupMerge(diffs);
    };

    /**
     * loc is a location in text1, compute and return the equivalent location in
     * text2.
     * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     * @param {number} loc Location within text1.
     * @return {number} Location within text2.
     */
    this.diff_xIndex = function(diffs, loc) {
        var chars1      = 0,
            chars2      = 0,
            last_chars1 = 0,
            last_chars2 = 0,
            x           = 0,
            l           = diffs.length;
        for (; x < l; x++) {
            if (diffs[x][0] !== DIFF_INSERT)  // Equality or deletion.
                chars1 += diffs[x][1].length;
            if (diffs[x][0] !== DIFF_DELETE)  // Equality or insertion.
                chars2 += diffs[x][1].length;
            if (chars1 > loc)  // Overshot the location.
                break;
            last_chars1 = chars1;
            last_chars2 = chars2;
        }
        // Was the location was deleted?
        if (diffs.length != x && diffs[x][0] === DIFF_DELETE)
            return last_chars2;
        // Add the remaining character length.
        return last_chars2 + (loc - last_chars1);
    };

    /**
     * Convert a diff array into a pretty HTML report.
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     * @return {string} HTML representation.
     */
    this.diff_prettyHtml = function(diffs) {
        var html = [],
            i    = 0,
            x    = 0,
            l    = diffs.length,
            op, data, text;
        for (; x < l; x++) {
            op   = diffs[x][0];  // Operation (insert, delete, equal)
            data = diffs[x][1];  // Text of change.
            text = data.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                       .replace(/>/g, "&gt;").replace(/\n/g, "&para;<BR>");
            switch (op) {
                case DIFF_INSERT:
                    html[x] = "<INS STYLE=\"background:#E6FFE6;\" TITLE=\"i=" + i
                            + "\">" + text + "</INS>";
                    break;
                case DIFF_DELETE:
                    html[x] = "<DEL STYLE=\"background:#FFE6E6;\" TITLE=\"i=" + i
                            + "\">" + text + "</DEL>";
                    break;
                case DIFF_EQUAL:
                    html[x] = "<SPAN TITLE=\"i=" + i + "\">" + text + "</SPAN>";
                    break;
            }
            if (op !== DIFF_DELETE)
                i += data.length;
        }
        return html.join("");
    };

    /**
     * Compute and return the source text (all equalities and deletions).
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     * @return {string} Source text.
     */
    this.diff_text1 = function(diffs) {
        var text = [],
            x    = 0,
            l    = diffs.length;
        for (; x < l; x++) {
            if (diffs[x][0] !== DIFF_INSERT)
                text[x] = diffs[x][1];
        }
        return text.join("");
    };

    /**
     * Compute and return the destination text (all equalities and insertions).
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     * @return {string} Destination text.
     */
    this.diff_text2 = function(diffs) {
        var text = [],
            x    = 0,
            l    = diffs.length;
        for (; x < l; x++) {
            if (diffs[x][0] !== DIFF_DELETE)
                text[x] = diffs[x][1];
        }
        return text.join("");
    };

    /**
     * Compute the Levenshtein distance; the number of inserted, deleted or
     * substituted characters.
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     * @return {number} Number of changes.
     */
    this.diff_levenshtein = function(diffs) {
        var levenshtein = 0,
            insertions  = 0,
            deletions   = 0,
            x           = 0,
            l           = diffs.length,
            op, data;
        for (; x < l; x++) {
            op   = diffs[x][0];
            data = diffs[x][1];
            switch (op) {
                case DIFF_INSERT:
                    insertions += data.length;
                    break;
                case DIFF_DELETE:
                    deletions += data.length;
                    break;
                case DIFF_EQUAL:
                    // A deletion and an insertion is one substitution.
                    levenshtein += Math.max(insertions, deletions);
                    insertions  = 0;
                    deletions   = 0;
                    break;
            }
        }
        return levenshtein + Math.max(insertions, deletions);
    };

    /**
     * Crush the diff into an encoded string which describes the operations
     * required to transform text1 into text2.
     * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
     * Operations are tab-separated.  Inserted text is escaped using %xx notation.
     * @param {Array.<Array.<number|string>>} diffs Array of diff tuples.
     * @return {string} Delta text.
     */
    this.diff_toDelta = function(diffs) {
        var text = [],
            x    = 0,
            l    = diffs.length;
        for (; x < l; x++) {
            switch (diffs[x][0]) {
                case DIFF_INSERT:
                    text[x] = "+" + encodeURI(diffs[x][1]);
                    break;
                case DIFF_DELETE:
                    text[x] = "-" + diffs[x][1].length;
                    break;
                case DIFF_EQUAL:
                    text[x] = "=" + diffs[x][1].length;
                    break;
            }
        }
        // Opera doesn't know how to encode char 0.
        return text.join("\t").replace(/\x00/g, "%00").replace(/%20/g, " ");
    };


    /**
     * Given the original text1, and an encoded string which describes the
     * operations required to transform text1 into text2, compute the full diff.
     * @param {string} text1 Source string for the diff.
     * @param {string} delta Delta text.
     * @return {Array.<Array.<number|string>>} Array of diff tuples.
     * @throws {Error} If invalid input.
     */
    this.diff_fromDelta = function(text1, delta) {
        var diffs       = [],
            diffsLength = 0,  // Keeping our own length var is faster in JS.
            pointer     = 0;  // Cursor in text1
        // Opera doesn't know how to decode char 0.
        delta = delta.replace(/%00/g, "\0");
        var tokens = delta.split(/\t/g),
            x      = 0,
            l      = tokens.length,
            param, n, text;
        for (; x < l; x++) {
            // Each token begins with a one character parameter which specifies the
            // operation of this token (delete, insert, equality).
            param = tokens[x].substring(1);
            switch (tokens[x].charAt(0)) {
                case "+":
                    try {
                        diffs[diffsLength++] = [DIFF_INSERT, decodeURI(param)];
                    }
                    catch (ex) {
                        // Malformed URI sequence.
                        throw new Error("Illegal escape in diff_fromDelta: " + param);
                    }
                    break;
                case "-":
                // Fall through.
                case "=":
                    n = parseInt(param, 10);
                    if (isNaN(n) || n < 0)
                        throw new Error("Invalid number in diff_fromDelta: " + param);

                    text = text1.substring(pointer, pointer += n);
                    if (tokens[x].charAt(0) == "=")
                        diffs[diffsLength++] = [DIFF_EQUAL, text];
                    else
                        diffs[diffsLength++] = [DIFF_DELETE, text];
                    break;
                default:
                    // Blank tokens are ok (from a trailing \t).
                    // Anything else is an error.
                    if (tokens[x]) {
                        throw new Error("Invalid diff operation in diff_fromDelta: " +
                        tokens[x]);
                    }
            }
        }
        if (pointer != text1.length) {
            throw new Error("Delta length (" + pointer
                + ") does not equal source text length (" + text1.length + ").");
        }
        return diffs;
    };


    //  MATCH FUNCTIONS

    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc'.
     * @param {string} text The text to search.
     * @param {string} pattern The pattern to search for.
     * @param {number} loc The location to search around.
     * @return {number} Best match index or -1.
     */
    this.match_main = function(text, pattern, loc) {
        loc = Math.max(0, Math.min(loc, text.length));
        // Shortcut (potentially not guaranteed by the algorithm)
        if (text == pattern)
            return 0;
        else if (!text.length) // Nothing to match.
            return -1;
        // Perfect match at the perfect spot!  (Includes case of null pattern)
        else if (text.substring(loc, loc + pattern.length) == pattern)
            return loc;
        else // Do a fuzzy compare.
            return this.match_bitap(text, pattern, loc);
    };

    /**
     * Locate the best instance of 'pattern' in 'text' near 'loc' using the
     * Bitap algorithm.
     * @param {string} text The text to search.
     * @param {string} pattern The pattern to search for.
     * @param {number} loc The location to search around.
     * @return {number} Best match index or -1.
     * @private
     */
    this.match_bitap = function(text, pattern, loc) {
        if (pattern.length > this.matchMaxBits)
            throw new Error("Pattern too long for this browser.");

        // Initialise the alphabet.
        var s     = this.match_alphabet(pattern),
            _self = this;

        /*
         * Compute and return the score for a match with e errors and x location.
         * Accesses loc and pattern through being a closure.
         * @param {number} e Number of errors in match.
         * @param {number} x Location of match.
         * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
         * @private
         */
        function match_bitapScore(e, x) {
            var accuracy  = e / pattern.length,
                proximity = Math.abs(loc - x);
            if (!_self.matchDistance) // Dodge divide by zero error.
                return proximity ? 1.0 : accuracy;
            return accuracy + (proximity / _self.matchDistance);
        }

        // Highest score beyond which we give up.
        var score_threshold = this.matchThreshold,
            // Is there a nearby exact match? (speedup)
            best_loc = text.indexOf(pattern, loc);
        if (best_loc != -1)
            score_threshold = Math.min(match_bitapScore(0, best_loc), score_threshold);
        // What about in the other direction? (speedup)
        best_loc = text.lastIndexOf(pattern, loc + pattern.length);
        if (best_loc != -1)
            score_threshold = Math.min(match_bitapScore(0, best_loc), score_threshold);
        best_loc = -1;

        // Initialise the bit arrays.
        var matchmask = 1 << (pattern.length - 1),
            bin_max   = pattern.length + text.length,
            d         = 0,
            l         = pattern.length,
            bin_min, bin_mid, last_rd, start, finish, rd, j, charMatch, score;
        for (; d < l; d++) {
            // Scan for the best match; each iteration allows for one more error.
            // Run a binary search to determine how far from 'loc' we can stray at this
            // error level.
            bin_min = 0;
            bin_mid = bin_max;
            while (bin_min < bin_mid) {
                if (match_bitapScore(d, loc + bin_mid) <= score_threshold)
                    bin_min = bin_mid;
                else
                    bin_max = bin_mid;
                bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
            }
            // Use the result from this iteration as the maximum for the next.
            bin_max = bin_mid;
            start   = Math.max(1, loc - bin_mid + 1);
            finish  = Math.min(loc + bin_mid, text.length) + pattern.length;

            rd      = Array(finish + 2);
            rd[finish + 1] = (1 << d) - 1;
            for (j = finish; j >= start; j--) {
                // The alphabet (s) is a sparse hash, so the following line generates
                // warnings.
                charMatch = s[text.charAt(j - 1)];
                if (d === 0) {  // First pass: exact match.
                    rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
                }
                else {  // Subsequent passes: fuzzy match.
                    rd[j] = ((rd[j + 1] << 1) | 1) & charMatch 
                          | (((last_rd[j + 1] | last_rd[j]) << 1) | 1)
                          | last_rd[j + 1];
                }
                if (rd[j] & matchmask) {
                    score = match_bitapScore(d, j - 1);
                    // This match will almost certainly be better than any existing match.
                    // But check anyway.
                    if (score <= score_threshold) {
                        // Told you so.
                        score_threshold = score;
                        best_loc = j - 1;
                        // When passing loc, don't exceed our current distance from loc.
                        if (best_loc > loc)
                            start = Math.max(1, 2 * loc - best_loc);
                        else // Already passed loc, downhill from here on in.
                            break;
                    }
                }
            }
            // No hope for a (better) match at greater error levels.
            if (match_bitapScore(d + 1, loc) > score_threshold)
                break;
            last_rd = rd;
        }
        return best_loc;
    };

    /**
     * Initialise the alphabet for the Bitap algorithm.
     * @param {string} pattern The text to encode.
     * @return {Object} Hash of character locations.
     * @private
     */
    this.match_alphabet = function(pattern) {
        var s = {},
            i = 0,
            l = pattern.length;
        for (; i < l; i++)
            s[pattern.charAt(i)] = 0;
        for (i = 0; i < pattern.length; i++)
            s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
        return s;
    };

    //  PATCH FUNCTIONS

    /**
     * Increase the context until it is unique,
     * but don't let the pattern expand beyond matchMaxBits.
     * @param {patch_obj} patch The patch to grow.
     * @param {string} text Source text.
     * @private
     */
    this.patch_addContext = function(patch, text) {
        var pattern = text.substring(patch.start2, patch.start2 + patch.length1),
            padding = 0;
        while (text.indexOf(pattern) != text.lastIndexOf(pattern) 
          && pattern.length < this.matchMaxBits - this.patchMargin
          - this.patchMargin) {
            padding += this.patchMargin;
            pattern  = text.substring(patch.start2 - padding,
                patch.start2 + patch.length1 + padding);
        }
        // Add one chunk for good luck.
        padding += this.patchMargin;
        // Add the prefix.
        var prefix = text.substring(patch.start2 - padding, patch.start2);
        if (prefix)
            patch.diffs.unshift([DIFF_EQUAL, prefix]);
        // Add the suffix.
        var suffix = text.substring(patch.start2 + patch.length1,
            patch.start2 + patch.length1 + padding);
        if (suffix)
            patch.diffs.push([DIFF_EQUAL, suffix]);

        // Roll back the start points.
        patch.start1  -= prefix.length;
        patch.start2  -= prefix.length;
        // Extend the lengths.
        patch.length1 += prefix.length + suffix.length;
        patch.length2 += prefix.length + suffix.length;
    };

    /**
     * Compute a list of patches to turn text1 into text2.
     * Use diffs if provided, otherwise compute it ourselves.
     * There are four ways to call this function, depending on what data is
     * available to the caller:
     * Method 1:
     * a = text1, b = text2
     * Method 2:
     * a = diffs
     * Method 3 (optimal):
     * a = text1, b = diffs
     * Method 4 (deprecated, use method 3):
     * a = text1, b = text2, c = diffs
     *
     * @param {string|Array.<Array.<number|string>>} a text1 (methods 1,3,4) or
     * Array of diff tuples for text1 to text2 (method 2).
     * @param {string|Array.<Array.<number|string>>} opt_b text2 (methods 1,4) or
     * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
     * @param {string|Array.<Array.<number|string>>} opt_c Array of diff tuples for
     * text1 to text2 (method 4) or undefined (methods 1,2,3).
     * @return {Array.<patch_obj>} Array of patch objects.
     */
    this.patch_make = function(a, opt_b, opt_c) {
        var text1, diffs;
        if (typeof a == "string" && typeof opt_b == "string"
          && typeof opt_c == "undefined") {
            // Method 1: text1, text2
            // Compute diffs from text1 and text2.
            text1 = a;
            diffs = this.diff_main(text1, opt_b, true);
            if (diffs.length > 2) {
                this.diff_cleanupSemantic(diffs);
                this.diff_cleanupEfficiency(diffs);
            }
        }
        else if (typeof a == "object" && typeof opt_b == "undefined"
          && typeof opt_c == "undefined") {
            // Method 2: diffs
            // Compute text1 from diffs.
            diffs = a;
            text1 = this.diff_text1(diffs);
        }
        else if (typeof a == "string" && typeof opt_b == "object"
          && typeof opt_c == "undefined") {
            // Method 3: text1, diffs
            text1 = a;
            diffs = opt_b;
        }
        else if (typeof a == "string" && typeof opt_b == "string"
          && typeof opt_c == "object") {
            // Method 4: text1, text2, diffs
            // text2 is not used.
            text1 = a;
            diffs = opt_c;
        }
        else {
            throw new Error("Unknown call format to patch_make.");
        }

        if (diffs.length === 0)
            return [];  // Get rid of the null case.

        var patches         = [],
            patch           = new patch_obj(),
            patchDiffLength = 0,  // Keeping our own length var is faster in JS.
            char_count1     = 0,  // Number of characters into the text1 string.
            char_count2     = 0,  // Number of characters into the text2 string.
            // Start with text1 (prepatch_text) and apply the diffs until we arrive at
            // text2 (postpatch_text).  We recreate the patches one by one to determine
            // context info.
            prepatch_text   = text1,
            postpatch_text  = text1,
            x               = 0,
            l               = diffs.length,
            diff_type, diff_text;
        for (; x < l; x++) {
            diff_type = diffs[x][0];
            diff_text = diffs[x][1];

            if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
                // A new patch starts here.
                patch.start1 = char_count1;
                patch.start2 = char_count2;
            }

            switch (diff_type) {
                case DIFF_INSERT:
                    patch.diffs[patchDiffLength++] = diffs[x];
                    patch.length2 += diff_text.length;
                    postpatch_text = postpatch_text.substring(0, char_count2)
                                   + diff_text
                                   + postpatch_text.substring(char_count2);
                    break;
                case DIFF_DELETE:
                    patch.length1 += diff_text.length;
                    patch.diffs[patchDiffLength++] = diffs[x];
                    postpatch_text = postpatch_text.substring(0, char_count2) 
                                   + postpatch_text.substring(char_count2 
                                   + diff_text.length);
                    break;
                case DIFF_EQUAL:
                    if (diff_text.length <= 2 * this.patchMargin
                      && patchDiffLength && l != x + 1) {
                        // Small equality inside a patch.
                        patch.diffs[patchDiffLength++] = diffs[x];
                        patch.length1 += diff_text.length;
                        patch.length2 += diff_text.length;
                    }
                    else if (diff_text.length >= 2 * this.patchMargin) {
                        // Time for a new patch.
                        if (patchDiffLength) {
                            this.patch_addContext(patch, prepatch_text);
                            patches.push(patch);
                            patch           = new patch_obj();
                            patchDiffLength = 0;
                            // Unlike Unidiff, our patch lists have a rolling context.
                            // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
                            // Update prepatch text & pos to reflect the application of the
                            // just completed patch.
                            prepatch_text   = postpatch_text;
                            char_count1     = char_count2;
                        }
                    }
                    break;
            }

            // Update the current character count.
            if (diff_type !== DIFF_INSERT)
                char_count1 += diff_text.length;
            if (diff_type !== DIFF_DELETE)
                char_count2 += diff_text.length;
        }
        // Pick up the leftover patch if not empty.
        if (patchDiffLength) {
            this.patch_addContext(patch, prepatch_text);
            patches.push(patch);
        }

        return patches;
    };

    /**
     * Given an array of patches, return another array that is identical.
     * @param {Array.<patch_obj>} patches Array of patch objects.
     * @return {Array.<patch_obj>} Array of patch objects.
     * @private
     */
    var patch_deepCopy = function(patches) {
        // Making deep copies is hard in JavaScript.
        var patchesCopy = [],
            x           = 0,
            l           = patches.length,
            patch, patchCopy, y;
        for (; x < l; x++) {
            patch           = patches[x];
            patchCopy       = new patch_obj();
            patchCopy.diffs = [];
            for (y = 0; y < patch.diffs.length; y++)
                patchCopy.diffs[y] = patch.diffs[y].slice();
            patchCopy.start1  = patch.start1;
            patchCopy.start2  = patch.start2;
            patchCopy.length1 = patch.length1;
            patchCopy.length2 = patch.length2;
            patchesCopy[x]    = patchCopy;
        }
        return patchesCopy;
    };

    /**
     * Merge a set of patches onto the text.  Return a patched text, as well
     * as a list of true/false values indicating which patches were applied.
     * @param {Array.<patch_obj>} patches Array of patch objects.
     * @param {string} text Old text.
     * @return {Array.<string|Array.<boolean>>} Two element Array, containing the
     *      new text and an array of boolean values.
     */
    this.patch_apply = function(patches, text) {
        if (patches.length == 0)
            return [text, []];

        // Deep copy the patches so that no changes are made to originals.
        patches = patch_deepCopy(patches);

        var nullPadding = this.patch_addPadding(patches);
        text = nullPadding + text + nullPadding;

        this.patch_splitMax(patches);
        // delta keeps track of the offset between the expected and actual location
        // of the previous patch.  If there are patches expected at positions 10 and
        // 20, but the first patch was found at 12, delta is 2 and the second patch
        // has an effective expected position of 22.
        var delta   = 0,
            results = [],
            x       = 0,
            l       = patches.length,
            patch, expected_loc, text1, start_loc, end_loc, text2, diffs, index1,
            index2, y, mod, l2;
        for (; x < l; x++) {
            patch        = patches[x];
            expected_loc = patch.start2 + delta;
            text1        = this.diff_text1(patch.diffs);
            end_loc      = -1;
            if (text1.length > this.matchMaxBits) {
                // patch_splitMax will only provide an oversized pattern in the case of
                // a monster delete.
                start_loc = this.match_main(text, text1.substring(0, this.matchMaxBits),
                    expected_loc);
                if (start_loc != -1) {
                    end_loc = this.match_main(text,
                        text1.substring(text1.length - this.matchMaxBits),
                        expected_loc + text1.length - this.matchMaxBits);
                    // Can't find valid trailing context.  Drop this patch.
                    if (end_loc == -1 || start_loc >= end_loc)
                        start_loc = -1;
                }
            }
            else {
                start_loc = this.match_main(text, text1, expected_loc);
            }

            if (start_loc == -1) {
                // No match found.  :(
                results[x] = false;
                // Subtract the delta for this failed patch from subsequent patches.
                delta -= patch.length2 - patch.length1;
            }
            else {
                // Found a match.  :)
                results[x] = true;
                delta = start_loc - expected_loc;
                if (end_loc == -1)
                    text2 = text.substring(start_loc, start_loc + text1.length);
                else
                    text2 = text.substring(start_loc, end_loc + this.matchMaxBits);

                if (text1 == text2) {
                    // Perfect match, just shove the replacement text in.
                    text = text.substring(0, start_loc) +
                    this.diff_text2(patch.diffs) +
                    text.substring(start_loc + text1.length);
                }
                else {
                    // Imperfect match.  Run a diff to get a framework of equivalent
                    // indices.
                    diffs = this.diff_main(text1, text2, false);
                    if (text1.length > this.matchMaxBits
                      && this.diff_levenshtein(diffs) / text1.length
                       > this.patchDeleteThreshold) {
                        // The end points match, but the content is unacceptably bad.
                        results[x] = false;
                    }
                    else {
                        this.diff_cleanupSemanticLossless(diffs);
                        index1 = 0;
                        for (y = 0, l2 = patch.diffs.length; y < l2; y++) {
                            mod = patch.diffs[y];
                            if (mod[0] !== DIFF_EQUAL)
                                index2 = this.diff_xIndex(diffs, index1);
                            if (mod[0] === DIFF_INSERT) {  // Insertion
                                text = text.substring(0, start_loc + index2) 
                                     + mod[1] + text.substring(start_loc + index2);
                            }
                            else if (mod[0] === DIFF_DELETE) {  // Deletion
                                text = text.substring(0, start_loc + index2) 
                                     + text.substring(start_loc
                                     + this.diff_xIndex(diffs, index1 + mod[1].length));
                            }
                            if (mod[0] !== DIFF_DELETE)
                                index1 += mod[1].length;
                        }
                    }
                }
            }
        }
        // Strip the padding off.
        text = text.substring(nullPadding.length, text.length - nullPadding.length);
        return [text, results];
    };

    /**
     * Add some padding on text start and end so that edges can match something.
     * Intended to be called only from within patch_apply.
     * @param {Array.<patch_obj>} patches Array of patch objects.
     * @return {string} The padding string added to each side.
     */
    this.patch_addPadding = function(patches) {
        var paddingLength = this.patchMargin,
            nullPadding   = "",
            x             = 1,
            l             = patches.length;
        for (; x <= paddingLength; x++)
            nullPadding += String.fromCharCode(x);

        // Bump all the patches forward.
        for (x = 0; x < l; x++) {
            patches[x].start1 += paddingLength;
            patches[x].start2 += paddingLength;
        }

        // Add some padding on start of first diff.
        var patch = patches[0],
            diffs = patch.diffs,
            extraLength;
        if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
            // Add nullPadding equality.
            diffs.unshift([DIFF_EQUAL, nullPadding]);
            patch.start1  -= paddingLength;  // Should be 0.
            patch.start2  -= paddingLength;  // Should be 0.
            patch.length1 += paddingLength;
            patch.length2 += paddingLength;
        }
        else if (paddingLength > diffs[0][1].length) {
            // Grow first equality.
            extraLength     = paddingLength - diffs[0][1].length;
            diffs[0][1]     = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
            patch.start1   -= extraLength;
            patch.start2   -= extraLength;
            patch.length1  += extraLength;
            patch.length2  += extraLength;
        }

        // Add some padding on end of last diff.
        patch = patches[patches.length - 1];
        diffs = patch.diffs;
        if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
            // Add nullPadding equality.
            diffs.push([DIFF_EQUAL, nullPadding]);
            patch.length1 += paddingLength;
            patch.length2 += paddingLength;
        }
        else if (paddingLength > diffs[diffs.length - 1][1].length) {
            // Grow last equality.
            extraLength = paddingLength - diffs[diffs.length - 1][1].length;
            diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
            patch.length1 += extraLength;
            patch.length2 += extraLength;
        }

        return nullPadding;
    };

    /**
     * Look through the patches and break up any which are longer than the maximum
     * limit of the match algorithm.
     * @param {Array.<patch_obj>} patches Array of patch objects.
     */
    this.patch_splitMax = function(patches) {
        var x = 0,
            bigpatch, patch_size, start1, start2, precontext, patch, empty,
            diff_type, diff_text, postcontext;
        for (; x < patches.length; x++) {
            if (patches[x].length1 <= this.matchMaxBits) continue;

            bigpatch   = patches[x];
            // Remove the big old patch.
            patches.splice(x--, 1);
            patch_size = this.matchMaxBits;
            start1     = bigpatch.start1;
            start2     = bigpatch.start2;
            precontext = "";
            while (bigpatch.diffs.length !== 0) {
                // Create one of several smaller patches.
                patch = new patch_obj();
                empty = true;
                patch.start1 = start1 - precontext.length;
                patch.start2 = start2 - precontext.length;
                if (precontext !== "") {
                    patch.length1 = patch.length2 = precontext.length;
                    patch.diffs.push([DIFF_EQUAL, precontext]);
                }
                while (bigpatch.diffs.length !== 0 
                  && patch.length1 < patch_size - this.patchMargin) {
                    diff_type = bigpatch.diffs[0][0];
                    diff_text = bigpatch.diffs[0][1];
                    if (diff_type === DIFF_INSERT) {
                        // Insertions are harmless.
                        patch.length2 += diff_text.length;
                        start2 += diff_text.length;
                        patch.diffs.push(bigpatch.diffs.shift());
                        empty = false;
                    }
                    else if (diff_type === DIFF_DELETE
                      && patch.diffs.length == 1
                      && patch.diffs[0][0] == DIFF_EQUAL
                      && diff_text.length > 2 * patch_size) {
                        // This is a large deletion.  Let it pass in one chunk.
                        patch.length1 += diff_text.length;
                        start1 += diff_text.length;
                        empty = false;
                        patch.diffs.push([diff_type, diff_text]);
                        bigpatch.diffs.shift();
                    }
                    else {
                        // Deletion or equality.  Only take as much as we can stomach.
                        diff_text = diff_text.substring(0, patch_size 
                            - patch.length1 - this.patchMargin);
                        patch.length1 += diff_text.length;
                        start1        += diff_text.length;
                        if (diff_type === DIFF_EQUAL) {
                            patch.length2 += diff_text.length;
                            start2        += diff_text.length;
                        }
                        else {
                            empty = false;
                        }
                        patch.diffs.push([diff_type, diff_text]);
                        if (diff_text == bigpatch.diffs[0][1]) {
                            bigpatch.diffs.shift();
                        }
                        else {
                            bigpatch.diffs[0][1] =
                                bigpatch.diffs[0][1].substring(diff_text.length);
                        }
                    }
                }
                // Compute the head context for the next patch.
                precontext = this.diff_text2(patch.diffs)
                    .substring(precontext.length - this.patchMargin);
                // Append the end context for this patch.
                postcontext = this.diff_text1(bigpatch.diffs)
                    .substring(0, this.patchMargin);
                if (postcontext !== "") {
                    patch.length1 += postcontext.length;
                    patch.length2 += postcontext.length;
                    if (patch.diffs.length !== 0 &&
                        patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
                        patch.diffs[patch.diffs.length - 1][1] += postcontext;
                    }
                    else {
                        patch.diffs.push([DIFF_EQUAL, postcontext]);
                    }
                }
                if (!empty)
                    patches.splice(++x, 0, patch);
            }
        }
    };

    /**
     * Take a list of patches and return a textual representation.
     * @param {Array.<patch_obj>} patches Array of patch objects.
     * @return {string} Text representation of patches.
     */
    this.patch_toText = function(patches) {
        var text = [],
            x    = 0,
            l    = patches.length;
        for (; x < l; x++)
            text[x] = patches[x];
        return text.join("");
    };

    /**
     * Parse a textual representation of patches and return a list of patch objects.
     * @param {string} textline Text representation of patches.
     * @return {Array.<patch_obj>} Array of patch objects.
     * @throws {Error} If invalid input.
     */
    this.patch_fromText = function(textline) {
        var patches = [];
        if (!textline)
            return patches;
        // Opera doesn"t know how to decode char 0.
        textline = textline.replace(/%00/g, "\0");
        var text        = textline.split("\n"),
            textPointer = 0,
            len         = text.length,
            re          = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/,
            m, patch, sign, line;
        while (textPointer < len) {
            m = text[textPointer].match(re);
            if (!m)
                throw new Error("Invalid patch string: " + text[textPointer]);

            patch = new patch_obj();
            patches.push(patch);
            patch.start1 = parseInt(m[1], 10);
            if (m[2] === "") {
                patch.start1--;
                patch.length1 = 1;
            }
            else if (m[2] == "0") {
                patch.length1 = 0;
            }
            else {
                patch.start1--;
                patch.length1 = parseInt(m[2], 10);
            }

            patch.start2 = parseInt(m[3], 10);
            if (m[4] === "") {
                patch.start2--;
                patch.length2 = 1;
            }
            else if (m[4] == "0") {
                patch.length2 = 0;
            }
            else {
                patch.start2--;
                patch.length2 = parseInt(m[4], 10);
            }
            textPointer++;

            while (textPointer < len) {
                sign = text[textPointer].charAt(0);
                try {
                    line = decodeURI(text[textPointer].substring(1));
                } catch (ex) {
                    // Malformed URI sequence.
                    throw new Error("Illegal escape in patch_fromText: " + line);
                }
                if (sign == "-") // Deletion.
                    patch.diffs.push([DIFF_DELETE, line]);
                else if (sign == "+") // Insertion.
                    patch.diffs.push([DIFF_INSERT, line]);
                else if (sign == " ") // Minor equality.
                    patch.diffs.push([DIFF_EQUAL, line]);
                else if (sign == "@") // Start of next patch.
                    break;
                else if (sign === "")
                    ;// Blank line?  Whatever.
                else // WTF?
                    throw new Error("Invalid patch mode '" + sign + "' in: " + line);
                textPointer++;
            }
        }
        return patches;
    };
})();

// #endif
