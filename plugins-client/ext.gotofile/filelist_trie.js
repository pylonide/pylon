
define(function(require, module, exports) {
    var aho = require("./aho-corasick").exports.ahoCorasick;
    var TrieNode = require("./trie").exports;
    function score (e, term) {
        var c = 0,
            d = term.length,
            f = e.length,
            g, h, i = 1,
            j;
        if (e == term) return 1;
        for (var k = 0, l, m, n, o, p, q; k < d; ++k) {
            n = term[k], o = e.indexOf(n.toLowerCase()), p = e.indexOf(n.toUpperCase()), q = Math.min(o, p), m = q > -1 ? q : Math.max(o, p);
            if (m === -1) {
                return 0
            }
            l = .1, e[m] === n && (l += .1), m === 0 ? (l += .6, k === 0 && (g = 1)) : e.charAt(m - 1) === " " && (l += .8), e = e.substring(m + 1, f), c += l
        }
        return h = c / d, j = (h * (d / f) + h) / 2, j /= i, g && j + .15 < 1 && (j += .15), j
    };
    
module.exports = function Searcher (fileList) {
    var self = this;
    
    this.fileList = fileList;
    
    this.trieNodes = {};
    
    this.normalize = function (a) {
        a = a.toLowerCase();
        a = a.replace("-", "_");
        return a;
    };
    
    this.fileList.forEach(function (l) {
        var chrs = self.normalize(l).split("");
        
        var trie = new TrieNode();
        for (var c = 0; c < chrs.length; c++) {
            trie.add(chrs[c]);
        }
        
        self.trieNodes[l] = trie;
    });
    
    
    this.findMatchingFiles = function(a) {
        var needle = this.normalize(a.toLowerCase());
        var matches = {};
        
        var needleParts = needle.split(/[ \/\\]/).filter(function (p) {
            return !!(p.trim());
        });
        
        var needleHasSlash = needle.indexOf("/") > -1;
        
        var oKeys = Object.keys(this.trieNodes);
        for (var i = 0; i < oKeys.length; i++) {
            var fileName = oKeys[i];
            var trie = this.trieNodes[fileName];
            
            if (!needleParts.every(function (part) { 
                return aho(trie, part);
            })) {
                continue;
            }
            
            var base = score(fileName, needle);
            if (base <= 0) continue; // score needs to be over 0
            
            if (!needleHasSlash) {
                if (aho(trie,"/")) {
                    base += score(fileName.replace(/^.*\//, ""), needle);
                }
                else {
                    base *= 2;
                }
            }
            
            var item = [ base, this.fileList[i] ];
            
            var key = (base * 10 | 0);
            matches[key] = matches[key] || [];
            matches[key].push(item);
        }
        
        var all = [];
        
        // quickly sort all the keys on the score lo-hi
        var allKeys = Object.keys(matches).splice(0);
        allKeys.sort(function (a, b) {
            return a - b;
        });
        
        // this way we only grab items that are significant
        while(all.length < 20 && allKeys.length > 0) {
            all = all.concat(matches[allKeys.pop()]);
        }

        var c = all;
        
        c = c.sort(function (a, b) {
            return b[0] - a[0];
        });
        return c.map(function (a) {
            return a[1];
        });
    };

    this.regexpForQuery = function(a) {
        var parts = a.split(/[\s\/\\]/);
        var pattern = parts.join(".*");
        return new RegExp(pattern);
        
        
        var b = "+.*?[]{}()^$|\\".replace(/(.)/g, "\\$1"),
            c = new RegExp("\\(([" + b + "])\\)", "g");
        return new RegExp("(.*)" + a.toLowerCase().replace(/(.)/g, "($1)(.*?)").replace(c, "(\\$1)") + "$", "i")
    };
};   
});