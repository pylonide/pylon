/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 

define(function(require, exports, module) {
var BkTreeNode = require("./bktree");

this.bkTree = null;
this.suffix = null;

/**
 * @todo There is much more sorting we can do. This function is now fast
 *       enough to apply weighed searching. 
 */
module.exports = function(nodes, keyword, cache) {
    if (!this.bkTree) {        
        var bkTree = new BkTreeNode("server.js");
        
        for (var ix = 0; ix < nodes.length; ix++) {
            var path = nodes[ix].toLowerCase();
            var parts = path.split(/[\/]/);
            
            var item = {
                path: path,
                parents: parts.slice(0, parts.length -1)
            };
            
            parts.forEach(function (part) {
                bkTree.Add(part, item);
                
                var dot = part.indexOf(".");
                if (dot > -1) {
                    bkTree.Add(part.substr(0, dot), item);
                }
            });
        }
        
        this.bkTree = bkTree;
    }
    
    var diff = 1;
    
    // when searching, we can divide it by spaces or slashes
    var keywords = keyword.split(/[\/\s]/);
    var poss = {};
    
    for (var k = 0; k < keywords.length; k++) {
        poss[keywords[k]] = this.bkTree.Query(keywords[k], diff);
    }
    
    
    // iterate over the last possibilities
    var res = (poss && poss[keywords[keywords.length -1]].filter(function (possibility) {
        var path = possibility.path;
        
        var doesntMatch = false;
        for (var p = 0; p < keywords.length - 1; p++) {
            if (!poss[keywords[p]].some(function (parent) {
                return path.indexOf(parent.path) === 0;
            })) {
                doesntMatch = true;
                break;
            }
        }
        
        return !doesntMatch;
    })) || [];
    
    var results = [];
    // do some sorting
    for (var rix = 0; rix < res.length; rix++) {
        results.push( "<d:href>" + res[rix].path + "</d:href>");
    }
    
    return "<d:multistatus  xmlns:d='DAV:'><d:response>"
        + results.join("") + "</d:response></d:multistatus>";
}

});