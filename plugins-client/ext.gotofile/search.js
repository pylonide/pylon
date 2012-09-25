/**
 * File name and definition search for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

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
module.exports.fileSearch = function(filelist, keyword, cache) {
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
     *   path depth                                 20 - count("/")
     *   match diff                                 15 - len(diff)
     *   path depth diff                            10 - (match.count("/") - keyword.count("/"))
     *
     * Extension weight                             -1 * lut[ext]
     */

    var dt = new Date();

    var type = "value";
    var toS = function(){
        return this[type];
    };

    var name, res = [], value, ext;
    for (var i = 0, l = filelist.length, s, j, k, q, p, m, n; i < l; i++) {
        name = filelist[i];

        // We only add items that have the keyword in it's path
        value = 0;
        if ((j = name.lastIndexOf(keyword)) > -1) {
            if (klen < 3) {
                cache.push(name); res.push(name);
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
            if (klen < 3)
                continue;
            var result = matching(name, keyword);
            if (! result)
                continue;
            if (name.indexOf("node-runner") > 0 && keyword === "noderunner")
                console.log("HERE");
            cache.push(name);
            var matched = name.substring(result[0].val.length);
            // The shorter the match diff, the higher prio we give
            value += 20 - Math.min(matched.length - keyword.length, 20);
            // The shorter the path depth, the higher prio we give
            value += 15 - Math.min(name.split("/").length, 15);
            // The shorter path depth diff, the higher prio we give
            value += 10 - Math.min(Math.abs(matched.split("/").length - keyword.split("/").length), 10);
        }

        if (value > 0) {
            // Check extension
            s = name.lastIndexOf(".");
            if (s > -1)
                value -= 10 * (fileTypes[name.substr(s+1)] || 0) || 20;
            else
                value -= 20;

            res.push({
                toString : toS,
                value : 2000000 - value,
                //name  : value + ", " + name
                name  : name
            });
        }
    }

    if (klen < 3)
        return res;

    if (klen > 2 && res.length < 10000)
        res.sort();

    var type = "name";
    res = res.join("\n").split("\n");

    return res;
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

var matching = module.exports.matching = function (value, keyword) {
    // find matched parts
    var matchI = null;
    var missI = null;
    var result = [];
    for (i = value.length-1, j = keyword.length-1; i >= 0 && j >= 0; i--) {
        if (value[i] === keyword[j]) {
            matchI = matchI || i;
            j--;
            if (missI) {
                result.unshift({ val: value.substring(i+1, missI+1) });
                missI = null;
            }
        }
        else {
            missI = missI || i;
            if (matchI) {
                result.unshift({ match: true, val: value.substring(i+1, matchI+1)});
                matchI = null;
            }
        }
    }
    if (j !== -1)
        return null;

    if (missI)
        result.unshift({ val: value.substring(i+1, missI+1) });
    if (matchI)
        result.unshift({ match: true, val: value.substring(i+1, matchI+1)});
    if (i > -1)
        result.unshift({ val: value.substring(0, i+1) });

    return result;
};

});