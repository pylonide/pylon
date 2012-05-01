/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

//var codeExt = require("ext/code/code").fileExtensions;
//var imgExt = require("ext/imgview/imgview").fileExtensions;

/**
 * @todo There is much more sorting we can do. This function is now fast
 *       enough to apply weighed searching. 
 */
module.exports = function(nodes, keyword, cache) {
    keyword = keyword.toLowerCase();
    var klen = keyword.length;
    
    var name, cname, res = [], first = [], second = [], third = [];
    for (var i = 0, l = nodes.length, j, k, q; i < l; i++) {
        name = (cname = nodes[i]).toLowerCase();
        
        // We only add items that have the keyword in it's path
        if ((j = name.lastIndexOf(keyword)) > -1) {
            
            cache.push(cname);
            
            // We prioritize ones that have the keyword in the filename
            if (klen > 1 && j > (q = name.lastIndexOf("/"))) {
                k = name.lastIndexOf("/" + keyword);

                if (k > -1) {
                    // We give first prio to full filename matches
                    if (name.length == klen + 1 + k) {
                        first.push(cname);
                        continue;
                    }
                    
                    // Then to matches from the start of the filename
                    else if (k == q) {
                        second.push(cname);
                        continue;
                    }
                }
                // Then anywhere in the filename
                else {
                    third.push(cname);
                    continue;
                }
            }
            
            // Then the rest
            res.push(cname);
        }
    }

    var start = "<d:href>";
    var end   = "</d:href>";
    var glue  = end + start;
    var results = cache.length 
        ? (first.length ? start + first.join(glue) + end : "")
          + (second.length ? start + second.join(glue) + end : "")
          + (third.length ? start + third.join(glue) + end : "")
          + (res.length ? start + res.join(glue) + end : "")
        : "";
    
    return "<d:multistatus  xmlns:d='DAV:'><d:response>"
        + results + "</d:response></d:multistatus>";
}

});