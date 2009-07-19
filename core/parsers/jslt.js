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

//#ifdef __PARSER_JSLT

//eval("var x = function(a){" + "alert(ruben)" + "}");

/**
 * Object returning an implementation of an JSLT parser.
 * @todo Rik: please document this one extensively!
 *
 * Note: you cannot declare a variable with name node it is a deserved word
 *
 * @constructor
 * @parser
 *
 * @author      Rik Arends
 * @version     %I%, %G%
 * @since       0.9
 */
apf.JsltImplementation = function(){
    //@todo compile this one please!
    var bigRegExp = /([\w_\.]+)|(\s*,\s*)|(\s*;\s*)|((?:\s*)[\$\@\#\%\^\&\*\?\!](?:\s*))|(\s*[\+\-\<\>\|\=]+\s*)|(\s*\:\s*)|(\\[\\\{\}\[\]\"\'\/])|(\[)|(\])|(\s*\(\s*)|(\s*\)\s*)|(\s*\{\s*)|(\s*\}\s*)|(\')|(\")|(\/)|(\s+)/g;

    //------------------------------------------------------------------------------------
    // compile functions
    function isString(){
        if (typeof arguments[0] == 'string') 
            return true;
        if (typeof arguments[0] == 'object' && arguments[0].constructor) 
            return (arguments[0].constructor.toString().match(/string/i) != null);
        return false;
    }
    
    function jesc(s, esc){
        if (!esc) 
            return s;
        if (!s) 
            return '';
        if (esc.toLowerCase() == 'q') 
            return s.replace(/&/g, "&amp;").replace(/\'/g, "\\&squot")
                .replace(/\"/g, "\\&quot").replace(/\r?\n/g, "\\n");
        return s;
    }
    
    function jcpy(s, n, p){
        if (!n) 
            return;
        if (p) {

            // #ifdef __DEBUG
            try {
            //#endif
                var t = n.selectNodes(p);
            // #ifdef __DEBUG
            } catch(e) {
                throw new Error(apf.formatErrorString(0, this,
                    "Selecting node for 'copy' JSLT ",
                    "unxpected character in xpath \n" + e.message + "'"));
            }
            // #endif
            
            if (!t || t.length == 0) 
                return;
            for (var i = 0; i < t.length; i++) 
                s[s.length] = t[i].xml;
        }
        else 
            s[s.length] = n.xml;
    }
    
    function jxml(n, p){
        if (!n) 
            return;
        if (p) {
            var o = [];

            // #ifdef __DEBUG
            try {
            //#endif
                var t = n.selectNodes(p);
            // #ifdef __DEBUG
            } catch(e) {
                throw new Error(apf.formatErrorString(0, this,
                    "Selecting node for 'xml' JSLT ",
                    "unxpected character in xpath \n" + e.message + "'"));
            }
            // #endif
            
            if (!t || t.length == 0) 
                return;
            for (var i = 0; i < t.length; i++) 
                o[o.length] = t[i].xml;
        }
        else 
            return n.xml;
        return o.join('');
    }
    
    function jval(n, p){
        if (!n) 
            return '';

        if (p) {
            // #ifdef __DEBUG
            try {
            //#endif
                n = n.selectSingleNode(p);
            // #ifdef __DEBUG
            } catch(e) {
                throw new Error(apf.formatErrorString(0, this,
                    "Selecting node in JSLT",
                    "unexpected character in xpath '" + p + "' \n" + e.message + "'"));
            }
            // #endif
        }
        

        if (!n) 
            return '';
        if (n.nodeType == 1) 
            n = n.firstChild;
        return n ? n.nodeValue : '';
    }
    
    function jloc(n, f, p){
        if (!n || !p) 
            return;
        n = isString(p) ? n.selectSingleNode(p) : p;
        if (!n) 
            return;
        f(n);
    }
    
    function jdbg(a){
        apf.console.info(a)
    }
    
    function jnod(n, p){
        if (!n) 
            return '';
        if (p) {
            // #ifdef __DEBUG
            try {
            //#endif
                n = n.selectSingleNode(p);
            // #ifdef __DEBUG
            } catch(e) {
                throw new Error(apf.formatErrorString(0, this,
                    "Selecting node in JSLT ",
                    "unxpected character in xpath \n" + e.message + "'"));
            }
            // #endif 
        }
        if (!n) 
            return null;
        return n;
    }
    
    function jnds(n, p){
        if (!n) 
            return '';
        if (p) {
            // #ifdef __DEBUG
            try {
            //#endif
                n = n.selectNodes(p);
            // #ifdef __DEBUG
            } catch(e) {
                throw new Error(apf.formatErrorString(0, this,
                    "Selecting nodes in JSLT ",
                    "unxpected character in xpath \n" + e.message + "'"));
            }
            // #endif 
        }
        if (!n) 
            return null;
        return n;
    }
    
    function jexs(n, p){
        if (!n) 
            return false;
        if (p) {
            // #ifdef __DEBUG
            try {
            //#endif
                n = n.selectSingleNode(p);
            // #ifdef __DEBUG
            } catch(e) {
                throw new Error(apf.formatErrorString(0, this,
                    "Selecting a node to check if it 'exists' in JSLT ",
                    "unxpected character in xpath \n" + e.message + "'"));
            }
            // #endif
        }
        return n != null;
    }
    
    function jemp(n, p){
        if (!n) 
            return false;
        if (p) {
            // #ifdef __DEBUG
            try {
            //#endif
                n = n.selectSingleNode(p);
            // #ifdef __DEBUG
            } catch(e) {
                throw new Error(apf.formatErrorString(0, this,
                    "Selecting a node to check if is 'empty' JSLT ",
                    "unxpected character in xpath \n" + e.message + "'"));
            }
            // #endif
        }
        if (!n) 
            return true;
        if (n.nodeType == 1) 
            n = n.firstChild;
        return (n ? n.nodeValue : '').match(/^[\s\r\n\t]*$/) != null;
    }
    
    function jcnt(n, p){
        if (!n) 
            return 0;

        // #ifdef __DEBUG
        try {
        //#endif
            var t = n.selectNodes(p);
        // #ifdef __DEBUG
        } catch(e) {
            throw new Error(apf.formatErrorString(0, this,
                "Selecting nodes for 'count' JSLT ",
                "unxpected character in xpath \n" + e.message + "'"));
        }
        // #endif
        
        return t ? t.length : 0;
    }
    
    function jpak(n, f, p){
        var s = [];
        f(s, n);
        return s.join('');
    }
    
    function jstore(n, pk, f, p){
        if (!p) 
            p = 'def';
        if (!pk[p]) 
            pk[p] = [];
        f(pk[p], n);
        return;
    }
    
    function jfetch(pk, p){
        if (!p) 
            p = 'def';
        if (pk[p]) 
            return pk[p].join('');
        return '';
    }
    
    function jfra(f, t, sp, ep){
        if (!t) 
            return;
        var end = ep == null ? t.length : Math.min(t.length, (sp + ep));
        for (var i = (sp == null) ? 0 : sp; i < end; i++) 
            f(i, end, t[i]);
    }
    
    function jvls(n, p){
        var r = [];
        if (!n) 
            return r;

        // #ifdef __DEBUG
        try {
        //#endif
            var t = n.selectNodes(p);
        // #ifdef __DEBUG
        } catch(e) {
            throw new Error(apf.formatErrorString(0, this,
                "Selecting nodes for 'values' JSLT ",
                "unxpected character in xpath \n" + e.message + "'"));
        }
        // #endif
        
        if (!t) 
            return r;
        for (var i = 0; i < t.length; i++) {
            n = t[i];
            if (n.nodeType == 1) 
                n = n.firstChild;
            r[i] = n ? n.nodeValue : '';
        }
        return r;
    }
    
    function jpar(f, str){
        f ((typeof str != "string")
           ? str
           : parseXML(str).documentElement);
    }
    
    function jfor(n, f, p, sp, ep){
        if (!n) 
            return;

        // #ifdef __DEBUG
        try {
        //#endif
            var t = n.selectNodes(p);
        // #ifdef __DEBUG
        } catch(e) {
            throw new Error(apf.formatErrorString(0, this,
                "Selecting nodes in 'foreach' JSLT ",
                "unxpected character in xpath \n" + e.message + "'"));
        }
        // #endif

        
        var end = ep == null ? t.length : Math.min(t.length, (sp + ep));
        for (var i = (sp == null) ? 0 : sp; i < end; i++) 
            f(i, end, t[i]);
    }
    
    // Sorting helpers
    var sort_intmask = ["", "0", "00", "000", "0000", "00000", "000000",
        "0000000", "00000000", "000000000", "0000000000", "00000000000",
        "000000000000", "0000000000000", "00000000000000"];
    var sort_dateFmtStr;
    var sort_dateFormat;
    var sort_dateReplace;
    function sort_dateFmt(str){
        sort_dateFmtStr = str;
        var result = str.match(/(D+|Y+|M+|h+|m+|s+)/g);
        if (!result) 
            return;
        for (var pos = {}, i = 0; i < result.length; i++) 
            pos[result[i].substr(0, 1)] = i + 1;
        sort_dateFormat = new RegExp(str.replace(/[^\sDYMhms]/g, '\\$1')
            .replace(/YYYY/, "(\\d\\d\\d\\d)")
            .replace(/(DD|YY|MM|hh|mm|ss)/g, "(\\d\\d)"));
        sort_dateReplace = "$" + pos["M"] + "/$" + pos["D"] + "/$" + pos["Y"];
        if (pos["h"]) 
            sort_dateReplace += " - $" + pos["h"] + ":$" + pos["m"] + ":$" + pos["s"];
    }
    
    // Sorting methods for sort()
    function sort_alpha(n){
        if (!n) 
            return '';
        if (n.nodeType == 1) 
            n = n.firstChild;
        return n ? n.nodeValue : '';
    }
    
    function sort_number(n){
        var t = sort_alpha(n);
        return (t.length < sort_intmask.length
            ? sort_intmask[sort_intmask.length - t.length]
            : "") + t;
    }
    
    function sort_date(n, args){
        if (!sort_dateFormat || (args && sort_dateFmtStr != args[0])) 
            sort_dateFmt(args ? args[0] : "*");
        var t = sort_alpha(n), d;
        if (sort_dateFmtStr == '*') 
            d = Date.parse(t);
        else 
            d = (new Date(t.replace(sort_dateFormat, sort_dateReplace))).getTime();
        t = "" + parseInt(d);
        if (t == "NaN") 
            t = "0";
        return (t.length < sort_intmask.length
            ? sort_intmask[sort_intmask.length - t.length]
            : "") + t;
    }
    
    function jsort(n, f, p, ps, sm, desc, sp, ep){
        sm = sm ? sm : sort_alpha;
        var sa = [], t = n.selectNodes(p), i = t.length, args = null;
        if (typeof sm != "function") {
            var m = sm.shift();
            args = sm;
            sm = m;
        }
        
        // build string-sortable list with sort method
        while (i--) {
            n = t[i].selectSingleNode(ps);
            if (n) 
                sa[sa.length] = {
                    toString: function(){
                        return this.v;
                    },
                    pn: t[i],
                    v: sm(n, args)
                };
            else 
                sa[sa.length] = {
                    toString: function(){
                        return this.v;
                    },
                    pn: t[i],
                    v: ''
                };
        }
        // sort it
        sa.sort();
        
        //iterate like foreach
        var end = ep == null ? sa.length : Math.min(sa.length, (sp + ep));
        var start = (sp == null) ? 0 : sp;
        if (desc) {
            for (i = end - 1; i >= start; i--) 
                f(end - i - 1, end, sa[i].pn, sa[i].v);
        }
        else {
            for (i = start; i < end; i++) 
                f(i, end, sa[i].pn, sa[i].v);
        }
    }
    
    function japl(s, n, ma, p){
        if (!n) 
            return;
        var m = n.selectNodes(p || 'node()');
        for (var i = 0; i < m.length; i++) {
            n = m[i];
            var f = ma[0][n.tagName];
            if (f) 
                f(s, n);
            else {
                for (var k = 1; k < ma.length; k++) {
                    var sn = n.selectSingleNode(ma[k][0]);
                    if (sn) {
                        ma[k][1](s, sn);
                        break;
                    }
                }
            }
        }
    }
    
    function jmat(ma, f, p){
        var s = p.split(/\|/), all = true;
        for (var i = 0; i < s.length; i++) {
            if (!s[i].match(/^[\w_]+$/)) 
                all = false;
            ma[0][s[i]] = f;
        }
        if (!all) {
            p = "self::" + p.replace(/\|/g, "|self::");
            ma[ma.length] = [p, f];
        }
    }
    
    function joff(n){
      for (var p = n.parentNode.childNodes, i = p.length-1; i>=0; i--)
            if (p[i] == n)
                return i;
      return '';
    }
    
    //------------------------------------------------------------------------------------
    
    var types = ['[', '{', '(', 'text', 'xpath', 'word', 'sep', 'ws', 'semi',
        'sh', 'op', 'col', 'str', 'regex'];
    var closes = [']', '}', ')'];
    
    var func = {
        'last'    : [0, '(i==len-1)'],
        'first'   : [0, '(i==0)'],
        'offset'  : [0, 'joff(n)'],
        'out'     : [0, 's[s.length]'],
        'apply'   : [1, ';japl(s,n,ma,', ');'],
        'copy'    : [1, ';jcpy(s,n,', ');'],
        'xml'     : [1, 'jxml(n,', ')'],
        'value'   : [1, 'jval(n,', ')'],
        'exists'  : [1, 'jexs(n,', ')'],
        'empty'   : [1, 'jemp(n,', ')'],
        'values'  : [1, 'jvls(n,', ')'],
        'node'    : [1, 'jnod(n,', ')'],
        'nodes'   : [1, 'jnds(n,', ')'],
        'count'   : [1, 'jcnt(n,', ')'],
        'context' : [1, '(n=n.selectSingleNode(', '))'],
        'foreach' : [2, ';jfor(n,function(i,len,n){', '},', ');'],
        'sort'    : [2, ';jsort(n,function(i,len,n,sv){', '},', ');'],
        'local'   : [2, ';jloc(n,function(n){', '},', ');'],
        'match'   : [2, ';jmat(ma,function(s,n){', '},', ');'],
        'pack'    : [2, 'jpak(n,function(s,n){', '},', ')'],
        'store'   : [2, 'jstore(n,os,function(s,n){', '},', ');'],
        'fetch'   : [1, 'jfetch(os,', ')'],
        
        'parse'   : [2, 'jpar(function(n){', '},', ');'],
        'forarray': [3],
        'macro'   : [4],
        'pragma'  : [5],
        '_'       : [6]
    };
    // s,n,i,len
    
    var short_0 = {
        '%': 's[s.length]='
    };
    var short_1 = {
        '$': ['jval(n,', ')'],
        '&': ['jnod(n,', ')'],
        '@': ['(n=n.selectSingleNode(', '))'],
        '~': ['jexs(n,', ')'],
        '!': ['!jexs(n,', ')'],
        '#': ['jcnt(n,', ')'],
        '^': [';japl(s,n,ma,', ');']
    };
    var short_2 = {
        '*': [';jfor(n,function(i,len,n){', '},', ')']
    };
    
    //------------------------------------------------------------------------------------
    
    function dump_tree(n, s, w){
        for (var i = 0; i < n.length; i++) {
            var m = n[i], t = m[0];
            if (t < 3) {
                s.push(w + types[t]);
                dump_tree(m[1], s, '&nbsp;&nbsp;' + w);
                s.push(closes[t]);
                s.push('\n');
            } else {
                s.push(w + types[t] + ': ' + m[1] + '\n');
            }
        }
    }
    
    this.jslt_inline = [];  
    
    this.compile = function(str, trim_startspace){
        var pre;
        
        if (pre=str.match(/^var s\=\[(\d*)\]/)){
            if (pre[1] != '')
                return [this.jslt_inline[pre[1]], str];
            
            // #ifdef __DEBUG
            try {
            //#endif
                eval("var f = function(n){" + str + "};");
            // #ifdef __DEBUG
            } catch(e) {
                //apf.console.info(apf.formatJS(str));
                throw new Error(apf.formatErrorString(0, this,
                    "Selecting node in JSLT",
                    "Could not parse Precompiled JSLT with: \n" + e.message + "'"));
            }
            // #endif


            return [f, str];
        }
        
        var err    = []; // error list
        var tree   = []; // parse tree
        var stack  = []; // scopestack
        var node   = tree;
        var blevel = 0, tpos = 0;
        var istr   = 0, icc = 0;
        var lm     = 0;
        var macros = {};
        //tokenize
        str        = str.replace(/\/\*[\s\S]*?\*\//gm, "");
        str.replace(bigRegExp,
          function(m, word, sep, semi, sh, op, col, bs1, bo, bc, po, pc, co, cc, q1, q2, re, ws, pos){
            // stack helper functions
            function add_track(t){
                var txt = trim_startspace ? str.substr(tpos, pos - tpos).replace(/[\r\n]\s*/, '').replace(/^\s*[\r\n]/, '').replace(/\\s/g, ' ').replace(/[\r\n\t]/g, '') : str.substr(tpos, pos - tpos).replace(/[\r\n\t]/g, '');
                if (txt.length > 0) {
                    node[node.length] = [t, txt, tpos, pos];
                }
            }
            
            function add_node(t, data){
                node[node.length] = [t, data, pos];
            }
            
            function add_sub(t){
                var n = [];
                node[node.length] = [t, n, pos];
                stack[stack.length] = node;
                node = n;
            }
            
            function pop_sub(t){
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
            
            // are we in textmode or entering textmode?
            if (blevel == 0 || (bc && blevel == 1 && !istr)) {
                if (icc == 0) {
                    if (bo) {
                        add_track(3);
                        blevel++;
                    } // begin codeblock
                    if (bc) {
                        if (blevel == 0) 
                            err[err.length] = ["extra ]", pos];
                        else {
                            blevel--;
                            tpos = pos + 1;
                        }
                    } // end codeblock
                }
                if (co) {
					pos+=co.indexOf('{');
                    add_track(3);
                    tpos = pos + 1;
                    icc++;
                } // add last text chunk
                if (cc) {
                    add_track(4);
                    tpos = pos + cc.indexOf('}') + 1;
                    icc--;
                    if (icc < 0) 
                        err[err.length] = ["extra }", pos];
                } // xpath chunk
            }
            else {
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
                        blevel++;
                        add_sub(0);
                    }
                    if (bc) {
                        blevel--;
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
                if (q1) {
                    if (istr == 0) {
                        istr = 1;
                        tpos = pos;
                    }
                    else 
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
                    }
                    else 
                        if (istr == 2) {
                            istr = 0;
                            pos += 1;
                            add_track(12);
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
            }
            return m;
          });
        if (blevel == 0) {
            var txt = str.substr(tpos, str.length - tpos).replace(/[\r\n\t]/g, '');
            if (txt.length > 0) {
                node[node.length] = [3, txt, tpos, str.length];
            }
        }
        if (stack.length > 0) 
            for (var i = stack.length - 1; i >= 0; i--) {
                var j = stack[i][stack[i].length - 1];
                err[err.length] = ["unclosed tag " + types[j[0]], j[2]];
            }
        
        var s = ['var s=[],ma=[{}],os={};'];
        
        var pragma_trace = 0;
        function line_pos(cpos){
            var l = 0;
            str.replace(/\n/g, function(m, pos){
                if (pos < cpos) 
                    l++;
                return m;
            });
            return l;
        }
        
        //recursive compile
        function compile_recur(s, n, offset){
        
            var k = n.length;
            var d, e;
            //	var lt=14;
            for (var i = ((offset == null) ? 0 : offset); i < k; i++) {
                var t = n[i][0];
                // function expansion
                if (t == 5) {
                    var nt1 = (i < k - 1) ? n[i + 1][0] : -1, nt2 = (i < k - 2) ? n[i + 2][0] : -1;
                    var m = n[i][1];
                    var d = func[m];
                    // also dont insert ;'s
                    if (d) {
                        switch (d[0]) {
                            case 0:
                                s[s.length] = d[1];
                                break;
                            case 1: // () type function
                                if (nt1 != 2) {
                                    err[err.length] = ["Function " + m + " syntax error", n[i][2]];
                                }
                                else {
                                    s[s.length] = d[1];
                                    if (!compile_recur(s, n[i + 1][1])) 
                                        s[s.length] = 'null';
                                    s[s.length] = d[2];
                                    i++;
                                }
                                break;
                            case 2: // () {} type function
                                if (nt1 != 2 || nt2 != 1) {
                                    err[err.length] = ["Function " + m + " syntax error", n[i][2]];
                                }
                                else {
                                    s[s.length] = d[1];
                                    compile_recur(s, n[i + 2][1]);
                                    s[s.length] = d[2];
                                    if (!compile_recur(s, n[i + 1][1])) 
                                        s[s.length] = 'null';
                                    s[s.length] = d[3];
                                    i += 2;
                                }
                                break;
                            case 3://forarray
                                //we should have ( word ws in .... , .. , ..  ) {}
                                var o, ok;
                                if (i > k - 3 || n[i + 1][0] != 2 || n[i + 2][0] != 1 || (o = n[i + 1][1])[0][0] != 5 ||
                                (ok = o.length) < 5 ||
                                o[1][0] != 7 ||
                                o[2][0] != 5 ||
                                o[2][1] != 'in') {
                                    err[err.length] = ["forarray syntax error", n[i][2]];
                                }
                                else {
                                    s[s.length] = ';jfra(function(i,len,' + o[0][1] + '){';
                                    compile_recur(s, n[i + 2][1]);
                                    s[s.length] = '},';
                                    compile_recur(s, o, 3);
                                    s[s.length] = ');';
                                    i += 2;
                                }
                                break;
                            case 4://macro
                                //we should have ws, word, quote, code
                                if (i >= k - 4 || n[i + 1][0] != 7 || n[i + 2][0] != 5 || n[i + 3][0] != 2 || n[i + 4][0] != 1) {
                                    err[err.length] = ["macro syntax error at", n[0][2]];
                                }
                                else {
                                    s[s.length] = 'function ' + n[i + 2][1] + '(s,n,';
                                    if (!compile_recur(s, n[i + 3][1])) 
                                        s[s.length] = 'null';
                                    s[s.length] = '){';
                                    compile_recur(s, n[i + 4][1]);
                                    s[s.length] = '}';
                                    i += 4;
                                }
                                break;
                            case 5://pragma
                            {
                                if (i >= k - 3 || n[i + 1][0] != 7 || n[i + 2][0] != 5 || n[i + 3][0] != 2) {
                                    err[err.length] = ["macro syntax error at", n[0][2]];
                                }
                                else {
                                    switch (n[i + 2][1]) {
                                        case 'trace':{
                                            var ts = [];
                                            compile_recur(ts, n[i + 3][1]);
                                            pragma_trace = eval(ts.join(''));
                                        }
                                        break;
                                    }
                                }
                                i += 3;
                            }
                            case 6://trace
                            {
                                s[s.length] = ';alert("Trace: ' + line_pos(n[i][2]) + '");';
                            }
                        }
                    }
                    else {
                        if (macros[m] && nt1 == 2) {
                            s[s.length] = m + '(s,n,';
                            if (!compile_recur(s, n[i + 1][1])) 
                                s[s.length] = 'null';
                            s[s.length] = ')';
                            i++;
                        }
                        else 
                            s[s.length] = m;
                    }
                    // check our type
                }
                else //shorthand expansion
                    if (t == 9) {
                        var nt1 = (i < k - 1) ? n[i + 1][0] : -1, nt2 = (i < k - 2) ? n[i + 2][0] : -1;
                        var m = n[i][1];
                        
                        if (nt1 == 12) {
                            if (nt2 == 1) {
                                if (d = short_2[m]) {
                                    s[s.length] = d[0];
                                    compile_recur(s, n[i + 2][1]);
                                    s[s.length] = d[1] + n[i + 1][1] + d[2];
                                    i += 2;
                                    lt = 1;
                                } else 
                                    s[s.length] = m;
                            }
                            else {
                                if (d = short_1[m]) {
                                    if (nt2 == 11) 
                                        s[s.length] = m;
                                    else {
                                        s[s.length] = d[0] + n[i + 1][1] + d[1];
                                        i++;
                                    }
                                } else {
                                    if (d = short_0[m]) 
                                        s[s.length] = d;
                                    else 
                                        s[s.length] = m;
                                }
                            }
                        }
                        else {
                            if (d = short_0[m]) 
                                s[s.length] = d;
                            else 
                                s[s.length] = m;
                        }
                    }
                    else { // normal add
                        if (t < 3) {
                            s[s.length] = types[t];
                            compile_recur(s, n[i][1]);
                            s[s.length] = closes[t];
                            
                            // ; insertion code
                            if ((t == 1 && i < k - 1 && n[i + 1][0] == 5 && n[i + 1][1] != 'else') || // }word
                            (t == 2 && i < k - 1 && n[i + 1][0] == 5 && !n[i + 1][1].match(/^\./) && // )word
                            (i == 0 || n[i - 1][0] != 5 || !n[i - 1][1].match(/^(if|for)$/)))) {
                                s[s.length] = ';';
                            }
                        }
                        else {
                            if (t == 3) 
                                s[s.length] = ';s[s.length]="' + n[i][1]
                                    .replace(/\"/g, "\\\"").replace(/\n/g, "\\n") + '";';
                            else 
                                if (t == 4) {
                                    var m = n[i][1].match(/^\^([\w])\s?/);
                                    if (m) {
                                        s[s.length] = ';s[s.length]=jesc(jval(n,"'
                                            + n[i][1].substr(2)
                                            .replace(/"/g, "\\\"") + '"),"' + m[1] + '");';
                                    } else {
                                        s[s.length] = ';s[s.length]=jval(n,"'
                                            + n[i][1].replace(/"/g, "\\\"") + '");';
                                    }
                                }
                                else 
                                    s[s.length] = n[i][1];
                        }
                    }
                //lt = n[i][0];
            }
            return k;
        }
        if (err.length == 0) 
            compile_recur(s, tree);
        
        // return all parse errors
        if (err.length > 0) {
            var e = [];
            for (var i = 0; i < err.length; i++) {
                e[e.length] = 'Parse error(' + line_pos(err[i][1]) + '): ' + err[i][0] + '\n';
            }
            // lets spit out our parse tree
            
            //var out=[];
            //dump_tree(tree,out,'');
            
            throw new Error("Could not parse JSLT with: " + e.join('') + "\n");
        }
        
        s[s.length] = ";return s.join('');";
        var strJS = s.join('');
        
        try {
            eval("var f = function(n){" + strJS + "};");
        }
        catch (e) {
            //var treedump=[];
            //dump_tree(tree,treedump,'');	
            //apf.console.info(apf.formatJS(strJS));
            throw new Error("Could not parse JSLT with: " + e.message /*+ "\n" + treedump.join('')*/);
        }
        
        return [f, strJS];
    };
    
    /* ***********************************************
     //you can interchange nodes and strings
     apply(jsltStr, xmlStr);
     apply(jsltNode, xmlNode);
     
     returns string or false
     ************************************************/
    this.cache = [];
    
    this.apply = function(jsltNode, xmlNode){
        var jsltFunc, cacheId, jsltStr, doTest;
        
        //Type detection xmlNode
        xmlNode = this.$getBindXmlNode(xmlNode);
        
        //Type detection jsltNode
        if (typeof jsltNode == "object") {
            // #ifdef __DEBUG
            doTest = apf.isTrue(jsltNode.getAttribute("test"));
            // #endif
            
            //check the jslt node for cache setting
            cacheId = jsltNode.getAttribute("cache");
            jsltFunc = this.cache[cacheId];
            if (!jsltFunc) {
                var jsltStr = [], textNodes = jsltNode.selectNodes('text()');
                for (var i = 0; i < textNodes.length; i++) {
                    jsltStr = textNodes[i].nodeValue;
                    if (jsltStr.trim()) 
                        break;
                }
            }
        }
        else {
            cacheId = jsltNode;
            jsltFunc = this.cache[cacheId];
            if (!jsltFunc) {
                jsltStr = jsltNode;
                cacheId = null;
            }
        }
        
        //Compile string
        if (!jsltFunc) 
            jsltFunc = this.compile(jsltStr);
        
        this.lastJslt = jsltStr;
        this.lastJs   = jsltFunc[0]; //if it crashes here there is something seriously wrong

        //Invalid code - Syntax Error
        if (!jsltFunc[0]) 
            return false;
        
        //Caching
        if (!cacheId) {
            if (typeof jsltNode == "object") {
                cacheId = this.cache.push(jsltFunc) - 1
                jsltNode.setAttribute("cache", cacheId);
            }
            else 
                this.cache[jsltStr] = jsltFunc;
        }
        
        //Execute JSLT
        /* #ifndef __DEBUG
        try {
        #endif */
            if (!xmlNode) 
                return '';
            
            // #ifdef __DEBUG
            var str = jsltFunc[0](xmlNode);
            if (doTest) 
                apf.getObject("XMLDOM", "<root>" + str.replace(/>/g, ">\n") + "</root>");
            return str;
            /* #else
             return jsltFunc[0](xmlNode);
             #endif */
        /* #ifndef __DEBUG
        }
        catch (e) {
            apf.console.info(apf.formatJS(jsltFunc[1]));
            throw new Error(apf.formatErrorString(0, null, "JSLT parsing", "Could not execute JSLT with: " + e.message));
        }
        #endif */
    };
};
apf.JsltInstance = new apf.JsltImplementation();

//#endif
