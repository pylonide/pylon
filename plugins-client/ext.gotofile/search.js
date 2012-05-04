/**
 * Code Editor for the Cloud9 IDE
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
    "psd": 10, "tiff": 10, "xbm": 10, "xpm": 10
};

/**
 * @todo There is much more sorting we can do. This function is now fast
 *       enough to apply weighed searching. 
 */
module.exports = function(nodes, keyword, cache) {
    var klen = keyword.length;
    
    /**
     * full filename with extension             1000
     * start of filename                         200
     * part of filename                          100
     * full part of path                          50
     * start of part of path                      40
     * part of part of path                       20
     * extension weight
     * - known extension for code.js               0
     * - image                                   -10
     * - other                                   -20
     * depth of path (or length to optimize)     200 - 10 * char (or part)
     */
    
    var dt = new Date();
    
    var type = "value";
    var toS = function(){
        return this[type];
    };
     
    var name, res = [], value, ext;
    for (var i = 0, l = nodes.length, s, j, k, q, p; i < l; i++) {
        name = nodes[i];
        
        // We only add items that have the keyword in it's path
        if ((j = name.lastIndexOf(keyword)) > -1) {
            cache.push(name);
            
            if (klen > 2) {
                value = 0;
                
                // We prioritize ones that have the name in the filename
                if (j > (q = name.lastIndexOf("/"))) {
                    k = name.lastIndexOf("/" + keyword);
                    p = name.lastIndexOf(".");
    
                    if (k > -1) {
                        // We give first prio to full filename matches
                        if (name.length == klen + 1 + k)
                            value += 1000;
                        
                        // Then to match of name prior to extension
                        else if (p == k + klen + 1)
                            value += 201;
                        
                        // Then to matches from the start of the filename
                        else if (k == q)
                            value += 200;
                        
                        // Then anywhere in the filename
                        else
                            value += 100;
                    }
                    
                    // The shorter the path depth, the higher prio we give
                    value += 200 - (name.split("/").length * 10);
                }
                // Then the rest
                else
                    value += 50;
            
                //Check extension
                s = name.lastIndexOf(".");
                if (s > -1)
                    value -= fileTypes[name.substr(s+1)] || 20;
                else
                    value -= 20;
            
                res.push({
                    toString : toS,
                    value : 2000000 - value,
                    //name  : value + ", " + name
                    name  : name
                })
            }
            else {
                res.push(name);
            }
        }
    }

    if (klen > 2 && res.length < 10000)
        res.sort();
    
    console.log(new Date() - dt);
    
    var type = "name";

    var start = "<d:href>";
    var end   = "</d:href>";
    var glue  = end + start;
    var results = res.length 
        ? start + res.join(glue) + end
        : "";
    
    return "<d:multistatus  xmlns:d='DAV:'><d:response>"
        + results + "</d:response></d:multistatus>";
}

});