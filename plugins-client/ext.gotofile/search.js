/**
 * File name and definition search for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var Heap = require("./heap");

var fileTypes = {
    "js": 1, "json": 11, "css": 5, "less": 5, "scss": 5, "sass": 5, "xml": 11, 
    "rdf": 15, "rss": 15, "svg": 5, "wsdl": 11, "xslt": 5, "atom": 5, 
    "mathml": 5, "mml": 5, "php": 1, "phtml": 1, "html": 5, "xhtml": 5, 
    "coffee": 1, "py": 1, "ru": 1, "gemspec": 5, "rake": 5, "rb": 1, "c": 1, 
    "cc": 1, "cpp": 1, "cxx": 1, "h": 2, "hh": 2, "hpp": 2, "cs": 1, "java": 1, 
    "clj": 1, "groovy": 1, "scala": 1, "ml": 1, "mli": 1, "md": 2, 
    "markdown": 2, "textile": 5, "latex": 5, "tex": 5, "ltx": 5, "lua": 1, 
    "pl": 1, "pm": 2, "ps1": 1, "cfm": 1, "sql": 2, "sh": 1, "bash": 1, 
    "bmp": 10, "djv": 10, "djvu": 10, "gif": 10, "ico": 10, "jpg": 10, 
    "jpeg": 10, "pbm": 10, "pgm": 10, "png": 10, "pnm": 10, "ppm": 10, 
    "psd": 10, "tiff": 10, "xbm": 10, "xpm": 10,
    "go": 5, "hx": 5, "yaml": 5, "psql": 2
};

/**
 * Search through a list of filenames.
 */
module.exports.fileSearch = function(filelist, keyword) {
    var klen = keyword.length;

    /**
     * FULL MATCHES                              >= 50
     *   full filename with extension             1000
     *   name part without the extension           201
     *   start of filename                         200
     *   part of filename                          100
     *   depth of path (or length to optimize)     200 - 10 * count("/")
     *   full part of path                          50
     *
     * SCATTERED MATCHES                         <= 45
     *   number of match groups                     20 - 3 * #groups
     *   path depth                                 15 - 2 * count("/")
     *   match diff                                 10 - len(diff)
     *
     * Extension weight                             -1 * lut[ext]
     */

    var dt = new Date();

    var type = "value";
    var toS = function(){
        return this[type];
    };

    var name, res = klen < 3 ? [] : new Heap(), value, ext;
    for (var i = 0, l = filelist.length, s, j, k, q, p, m, n; i < l; i++) {
        name = filelist[i];

        // We only add items that have the keyword in it's path
        value = 0;
        if ((j = name.lastIndexOf(keyword)) > -1) {
            if (klen < 3) {
                res.push(name);
                continue;
            }
            // We prioritize ones that have the name in the filename
            if (j > (q = name.lastIndexOf("/"))) {
                k = name.lastIndexOf("/" + keyword);
                if (k > -1) {
                    // We give first prio to full filename matches
                    if (name.length == klen + 1 + k)
                        value += 1000;

                    // Then to match of name prior to extension
                    else if (name.lastIndexOf(".") == k + klen + 1)
                        value += 201;

                    // Then to matches from the start of the filename
                    else if (k == q)
                        value += 200;

                    // Then anywhere in the filename
                    else
                        value += 100;
                }

                // The shorter the path depth, the higher prio we give
                value += 200 - Math.min(name.split("/").length * 10, 150);
            }
            // Then the rest
            else
                value += 50;
        }
        // Check for spatial matches
        else {
            if (klen < 4 || name.split("/").length > 5)
                continue;
            var path = "";
            var result;
            result = matchPath(name, keyword);
            if (!result.length || result.length > 10)
                continue;
            var matched = name.substring(result[0].val.length);
            // The less the number of groups matched, the higher prio we give
            value += 20 - Math.min((result.length-2)*3, 19);
            // The shorter the path depth, the higher prio we give
            value += 15 - Math.min(name.split("/").length*2, 14);
            // The shorter the match diff, the higher prio we give
            value += 10 - Math.min(matched.length - keyword.length, 9);
            value += 20; // extension
        }

        if (value > 0) {
            // Check extension
            s = name.lastIndexOf(".");
            if (s > -1)
                value -= 10 * (fileTypes[name.substr(s+1)] || 0) || 20;
            else
                value -= 20;

            if (res.size() === 100 && value > res.min().value)
                res.pop();
            if (res.size() < 100)
                res.push({
                    toString : toS,
                    value : value,
                    name  : name
                });
        }
    }

    if (klen < 3)
        return res;

    var ret = [];
    while (res.size())
        ret.unshift(res.pop().name);

    return ret;
};

var treeSearch = module.exports.treeSearch = function(tree, keyword, caseInsensitive, results, head) {
    if (caseInsensitive)
        keyword = keyword.toLowerCase();
    results = results || [];
    head = head || 0;
    for (var i = 0; i < tree.length; i++) {
        var node = tree[i];
        var name = node.name;
        if (caseInsensitive)
            name = name.toLowerCase();
        var index = name.indexOf(keyword);
        if (index === -1) {
            if (node.items)
                results = treeSearch(node.items, keyword, caseInsensitive, results, head);
            continue;
        }
        var result = {
            items: node.items ? treeSearch(node.items, keyword, caseInsensitive) : []
        };
        for (var p in node) {
            if (node.hasOwnProperty(p) && p !== "items")
                result[p] = node[p];
        }
        if (index === 0) {
            results.splice(head, 0, result);
            head++;
        }
        else {
            results.push(result);
        }
    }
    return results;
};

var matchPath = module.exports.matchPath = function (path, keyword) {
    var result = [];
    var pathSplits = path.split("/");
    // Optimization
    if (pathSplits.length > 4)
        pathSplits = [pathSplits.slice(0, pathSplits.length - 4).join("/") + "/"]
            .concat(pathSplits.slice(pathSplits.length - 4, pathSplits.length));
    var value = "";
    var k, i, j = -1;
    for (k = pathSplits.length-1; k >= 0  && !result.length; k--) {
        value = (k > 0 ? "/" : "") + pathSplits[k] + value;
        // find matched parts
        var matchI = null;
        var missI = null;
        for (i = 0, j = 0; i < value.length && j < keyword.length; i++) {
            if (value[i] === keyword[j]) {
                matchI = matchI === null ? i : matchI;
                j++;
                if (missI !== null) {
                    result.push({ val: value.substring(missI, i) });
                    missI = null;
                }
            }
            else {
                missI = missI === null ? i : missI;
                if (matchI !== null) {
                    result.push({ match: true, val: value.substring(matchI, i)});
                    matchI = null;
                }
            }
        }
        if (j !== keyword.length) {
            result = [];
            continue;
        }

        if (missI !== null)
            result.push({ val: value.substring(missI, i) });
        if (matchI !== null)
            result.push({ match: true, val: value.substring(matchI, i)});
        result.push({ val: value.substring(i, value.length) });
        // Add the first non matched part if exists
        if (k)
            result.unshift({ val: pathSplits.slice(0, k).join('/') });
    }
    return result;
};

});