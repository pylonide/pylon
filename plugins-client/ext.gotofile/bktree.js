/**
 * BK tree implementation based on the C# implementation by Jan Jongboom
 */

define(function(require, exports, module) {
    function calcDistance(s1, s2) {
        // http://kevin.vanzonneveld.net
        // +            original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
        // +            bugfixed by: Onno Marsman
        // +             revised by: Andrea Giammarchi (http://webreflection.blogspot.com)
        // + reimplemented by: Brett Zamir (http://brett-zamir.me)
        // + reimplemented by: Alexander M Beedie
        // *                example 1: levenshtein('Kevin van Zonneveld', 'Kevin van Sommeveld');
        // *                returns 1: 3
        if (s1 == s2) {
            return 0;
        }
        
        var s1_len = s1.length;
        var s2_len = s2.length;
        if (s1_len === 0) {
            return s2_len;
        }
        if (s2_len === 0) {
            return s1_len;
        }
        
        // BEGIN STATIC
        var split = false;
        try {
            split = !('0')[0];
        }
        catch (e) {
            split = true; // Earlier IE may not support access by string index
        }
        // END STATIC
        if (split) {
            s1 = s1.split('');
            s2 = s2.split('');
        }
        
        var v0 = new Array(s1_len + 1);
        var v1 = new Array(s1_len + 1);
        
        var s1_idx = 0,
            s2_idx = 0,
            cost = 0;
        for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++) {
            v0[s1_idx] = s1_idx;
        }
        var char_s1 = '',
            char_s2 = '';
        for (s2_idx = 1; s2_idx <= s2_len; s2_idx++) {
            v1[0] = s2_idx;
            char_s2 = s2[s2_idx - 1];
        
            for (s1_idx = 0; s1_idx < s1_len; s1_idx++) {
                char_s1 = s1[s1_idx];
                cost = (char_s1 == char_s2) ? 0 : 1;
                var m_min = v0[s1_idx + 1] + 1;
                var b = v1[s1_idx] + 1;
                var c = v0[s1_idx] + cost;
                if (b < m_min) {
                    m_min = b;
                }
                if (c < m_min) {
                    m_min = c;
                }
                v1[s1_idx + 1] = m_min;
            }
            var v_tmp = v0;
            v0 = v1;
            v1 = v_tmp;
        }
        return v0[s1_len];
    }
    
    module.exports = function BkTreeNode (identifier, item) {
    this.Key = ""; // root node
    this.Nodes = {};
    this.Items = [];
    
    // @ctor
    this.Key = identifier;
    if (item) {
        this.Items.push(item);
    }
    
    this.Add = function (identifier, item) {
        var self = this;
        
        var ix = calcDistance(identifier, self.Key);
        
        if (ix === 0) {
            self.Items.push(item);
            return;
        }
        
        // if the distance doesnt exist yet
        if (!self.Nodes[ix]) {
            // add a new node to the tree
            self.Nodes[ix] = new BkTreeNode(identifier, item);
        }
        else {
            // otherwise jump to the tree and re-do this magic
            self.Nodes[ix].Add(identifier, item);
        }
    };
    
    this.Query = function (searchTerm, maxDistance) {
        var nodes = [];
        
        var levenshteinDiff = calcDistance(searchTerm, this.Key);
        
        if (levenshteinDiff <= maxDistance) {
            nodes = nodes.concat(this.Items);
        }
    
        // get all leaves that have a distance where
        // dist BETWEEN diff - maxDiff AND diff + maxDiff
        var start = levenshteinDiff - maxDistance;
        var end = start + ((maxDistance * 2) + 1);
        for (var distance = start; distance < end; distance++) {
            if (this.Nodes[distance]) {
                nodes = nodes.concat(this.Nodes[distance].Query(searchTerm, maxDistance));
            }
        }
        
        return nodes;
    };
    
    this.toString = function () {
        return this.Key + " (" + this.Nodes.length + ")";
    };
}
});