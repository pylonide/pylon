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

//#ifdef __PARSER_JS

/**
 * Object returning an implementation of a JavaScript parser.
 *
 * @constructor
 * @parser
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 */
apf.JSImplementation = function(){
    //------------------------------------------------------------------------------------
    
    var types = ['[', '{', '(', 'text', 'xpath', 'word', 'sep', 'ws', 'semi', 'sh', 'op', 'col', 'str', 'regex', 'comment'];
    var closes = [']', '}', ')'];
    var reParse = new RegExp();
    reParse.compile("([\\w_\\.]+)|([\\s]*,[\\s]*)|([\\s]*;[\\s]*)|(\\/\\*)|(\\*\\/)|(\\/\\/)|([\\r\\n])|((?:[\\s]*)[\\$\\@\\#\\%\\^\\&\\*\\?\\!](?:[\\s]*))|([\\s]*[\\+\\-\\<\\>\\|\\=]+[\\s]*)|(\\s*\\:\\s*)|(\\s+)|(\\\\[\\\\\\{\\}\\[\\]\\\"\\'\\/])|(\\[)|(\\])|([\\s]*\\([\\s]*)|([\\s]*\\)[\\s]*)|([\\s]*\\{[\\s]*)|([\\s]*\\}[\\s]*)|(\\')|(\\\")|(\\/)", "g");
    
    //------------------------------------------------------------------------------------
    
    this.dump_tree = function(n, s, w){
        for (var i = 0; i < n.length; i++) {
            var m = n[i], t = m[0];
            if (t < 3) {
                s.push(w + types[t]);
                this.dump_tree(m[1], s, '  ' + w);
                s.push(closes[t]);
                s.push('\n');
            }
            else {
                s.push(w + types[t] + ': ' + m[1] + '\n');
            }
        }
        return s;
    };
    
    this.parse = function(str, trim_startspace){
        var err    = []; // error list
        var tree   = []; // parse tree
        var stack  = []; // scopestack
        var node   = tree;
        var blevel = 0, tpos = 0;
        var istr   = 0, icc = 0;
        var lm     = 0;
        var count  = [0, 0, 0];
        
        //tokenize
        //return str;
        //str = str.replace(/\/\*[\s\S]*?\*\//gm,"");
        str.replace(reParse, function(m, word, sep, semi, c1, c2, c3, nl, sh,
          op, col, ws, bs1, bo, bc, po, pc, co, cc, q1, q2, re, pos){
            // stack helper functions
            function add_track(t){
                var txt = trim_startspace
                    ? str.substr(tpos, pos - tpos)
                        .replace(/[\r\n]\s*/, '').replace(/^\s*[\r\n]/, '')
                        .replace(/[\r\n\t]/g, '')
                    : str.substr(tpos, pos - tpos).replace(/[\r\n\t]/g, '');
                if (txt.length > 0) {
                    node[node.length] = [t, txt, tpos, pos];
                }
            }
            
            function add_node(t, data){
                node[node.length] = [t, data, pos];
            }
            
            function add_sub(t){
                count[t]++;
                var n = [];
                node[node.length] = [t, n, pos];
                stack[stack.length] = node;
                node = n;
            }
            
            function pop_sub(t){
                count[t]--;
                if (stack.length == 0) {
                    err[err.length] = ["extra " + closes[t], pos];
                }
                else {
                    node = stack.pop();
                    var ot = node[node.length - 1][0];
                    if (ot != t) {
                        err[err.length] = ["scope mismatch " + types[ot] + " with " + types[t], pos];
                    }
                }
            }
            
            if (!istr) {
                if (word) {
                    add_node(5, m);
                    if (m == 'macro') 
                        lm = 1;
                    else 
                        if (lm) 
                            macros[m] = 1, lm = 0;
                }
                if (sep) 
                    add_node(6, ',');
                if (ws) 
                    add_node(7, m);
                if (semi) 
                    add_node(8, m);
                if (sh) 
                    add_node(9, m);
                if (op) 
                    add_node(10, m);
                if (col) 
                    add_node(11, m);
                if (bo) {
                    add_sub(0);
                }
                if (bc) {
                    pop_sub(0);
                }
                if (co) 
                    add_sub(1);
                if (cc) 
                    pop_sub(1);
                if (po) 
                    add_sub(2);
                if (pc) 
                    pop_sub(2);
            }
            if (c3) {
                if (istr == 0) {
                    istr = 5;
                    tpos = pos + 2;
                }
            };
            if (nl) {
                if (istr == 5) {
                    istr = 0;
                    pos += 1;
                    add_track(14);
                }
            }
            if (q1) {
                if (istr == 0) {
                    istr = 1;
                    tpos = pos;
                } else 
                    if (istr == 1) {
                        istr = 0;
                        pos += 1;
                        add_track(12);
                    }
            }
            if (q2) {
                if (istr == 0) {
                    istr = 2;
                    tpos = pos;
                } else 
                    if (istr == 2) {
                        istr = 0;
                        pos += 1;
                        add_track(12);
                    }
            }
            if (c1) {
                if (istr == 0) {
                    istr = 4;
                    tpos = pos + 2;
                };
                            }
            if (c2) {
                if (istr == 4) {
                    istr = 0;
                    add_track(14);
                }
            }
            if (re) {
                if (istr == 0) {
                    // only allow regex mode if we have no previous siblings or we have a , before us
                    if (node.length == 0 || node[node.length - 1][0] == 6) {
                        istr = 3;
                        tpos = pos;
                    } else 
                        add_node(10, m);
                }
                else 
                    if (istr == 3) {
                        istr = 0;
                        pos += 1;
                        add_track(13);
                    }
            }
            return m;
        });
        //return parse tree
        if (stack.length > 0) 
            for (var i = stack.length - 1; i >= 0; i--) {
                var j = stack[i][stack[i].length - 1];
                err[err.length] = ["unclosed tag " + types[j[0]], j[2]];
            }
        return {
            'tree' : tree,
            'stack': stack,
            'err'  : err,
            'count': count
        };
    };
};
apf.JavascriptParser = new apf.JSImplementation();

//#endif
