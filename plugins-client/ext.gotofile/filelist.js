define(function(require, module, exports) {
    // lended the score algorithm from github
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
        this.fileList = fileList;
        
        this.normalize = function (a) {
            a = a.toLowerCase();
            a = a.replace("-", "_");
            return a;
        };
        
        this.findOneChar = function (needle) {
            return this.fileList.filter(function (l) {
                return l.indexOf("/" + needle) === 0;
            });
        };
        
        this.findMultipleChar = function(needle) {   
            var needleParts = needle.split(/[ \/\\]/).filter(function (p) {
                return !!(p.trim());
            });
            
            var matches = [];
            
            for (var i = 0; i < this.fileList.length; i++) {
                var f = this.normalize(this.fileList[i]);
                
                if (!needleParts.every(function (part) { 
                    return f.indexOf(part) > -1;
                })) {
                    continue;
                }
                
                matches.push(this.fileList[i]);
            }
            
            return matches;
        };
        
        this.findMatchingFiles = function(a) {
            var needle = this.normalize(a.toLowerCase());
            var matches = {};
            
            var needleHasSlash = needle.indexOf("/") > -1;
            
            var filtered;
            
            if (needle.length === 1) {
                filtered = this.findOneChar(needle);
            }
            else {
                filtered = this.findMultipleChar(needle);
            }
            
            var needleScore = needle;
            
            for (var ix = 0; ix < filtered.length; ix++) {
                var f = filtered[ix];
                var base = score(f, needleScore);
                if (base <= 0) continue; // score needs to be over 0
                
                if (!needleHasSlash) {
                    if (f.indexOf("/") > -1) {
                        base += score(f.replace(/^.*\//, ""), needleScore);
                    }
                    else {
                        base *= 2;
                    }
                }
                
                var item = [ base, f ];
                
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
    };    
});