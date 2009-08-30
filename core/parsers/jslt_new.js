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

/**
 * Object returning an implementation of a JSLT parser.
 * @todo Rik: please document this one extensively!
 *
 * @constructor
 * @parser
 *
 * @author      Rik Arends
 * @version     %I%, %G%
 * @since       3.0
 */
 apf.jslt = new (function(){

    var statement_lut = { // all js statements to see its NOT an expression
        "var": 1, "for": 1, "while": 1, "do": 1, "if": 1, "else": 1,
        "switch": 1, "case": 1, "break": 1, "continue": 1, "default": 1,
        "function": 1, "return": 1, "try": 1, "catch": 1, "debugger": 1,
        "alert": 1, "delete": 1, "export": 1, "import": 1, "label": 1,
        "each": 1, "node": 1, "local": 1
    },
    type_lut = { // used for optimizing the parse regexp
        "\n": 1, "\r\n": 1, '"': 4, "'": 4, "<!--": 5,"-->": 5, "/*": 5, "==":2,
        "*/": 5, "{": 6, "}": 7, "[": 8, "]": 9, "(": 10, ")": 11
    },
    type_close = {"}": "{", "]": "[", ")": "("}, // handy
    xpath_axes = { // used to detect xpath axes or model
        "ancestor": 1, "ancestor-or-self": 1, "attribute": 1, "child": 1,
        "descendant": 1, "descendant-or-self": 1, "following": 1,
        "following-sibling": 1, "namespace": 1, "parent": 1, "preceding": 1,
        "self": 1
    },
    xpath_incode_lut = { // which autoxpath to use when doing macro({xpath})
        "&": "xnode", "*": "xnodes", "#": "xcount", "$": "xlang"
    },
    xpath_intext_lut = { // which autoxpath to use when doing macro({xpath})
        "&": "xcopy", "*": "xcopies", "#": "xcount", "$": "xlang"
    },
    xpath_macro_default = { // which autoxpath to use when doing macro({xpath})
        "each" : "xnodes", "local": "xnode", "value_n" : "xnode", 
        "values" : "xnodes",  "copies" : "xnodes", "node_n": "xnode",
        "nodes" : "xnodes", "count" : "xnodes", "copy" : "xnode"
    },    
    unesc_lut = { // unescape in code and xpath mode
        "\\\"": "\"", "\\\'": "\'", "\\{": "{", "\\}": "}",
        "\\[": "[", "\\]": "]", "\\(":"(", "\\)":")", "\\\\":"\\"
    },
    unesc_str = { // unescape in string mode
        "\\{": "{", "\\}": "}", "\\[": "[", "\\]": "]", "\\(": "(", "\\)": ")",
    },
    unesc_txt = { // unescape in text mode
        "\\{": "{", "\\}": "}", "\\[": "[", "\\]": "]", "\\(": "(", "\\)": ")",
        "\\\\": "\\\\\\\\", "\\":"\\\\",
    },
    andorlut = { // word to operand lookup table for easy use in xml
        "lte" : "<=", "gte" : ">=", "lt" : "<", "gt" : ">", "and" : "&&", 
        "or": "||", "andbin" : "&", "orbin" : "|", "LTE" : "<=", "GTE" : ">=",
        "LT" : "<", "GT" : ">", "AND" : "&&", "OR": "||", "ANDBIN" : "&",
        "ORBIN" : "|"
    },
    parserx,selfrx,
    macro_o={},macro_c={},macro_m={},
    xpath_assign_lut={}, // used to find the macro used in an {xpath} = 
    async_lut={          // used to figure out if the thing before the. is an async obj
        'comm' :1,
        'rpc'  :1,
        'http' :1
    },
    
    c_output,       // output code
    c_node_mode,    // guess 'node' as the type for {} xpaths, 1 = node, 2 = nodes
    c_node_create,  // use create xpaths on xpath fetch in codemode
    c_precalc,      // all calls are async (precalc parse_mode)
    c_allow_template,  // if we allow switching to template mode
    c_inject_self,  // inject self:: in some xpaths
    o, ol,          // output and output len
    s, sl,          // scopestack and scopestack len
    s_begin,        // ol where this scope started
    out_begin,      // the ol when [ or ] started text or code
    seg_begin,      // the ol of a text-segment
    start_tok,      // the token a string or comment was started with
    code_level,     // the [] count to switch between code/text
    last_tok,       // last token
    last_type,      // last type
    last_dot,       // . pos when last token was a word
    last_model,     // last model found
    line_no, line_pos, // line/pos to give nice errors
    u, v, n,           // random tempvars
    parse_mode,     // the parse parse_mode 
    str_len,        // length of the input string
    comment_parse_mode,// the parse mode outside the comment
    async_calls,    // number of async calls
    prop_last,       // last js property found
    has_statements,  // the code contains statements (so you cant use it as an expression)
    xpaths,    // all xpaths and their models in pairs
    texts,     // all pure text chunks
    props,     // the js properties found
    func;
    // the macro open middle close hashes 
    // _n = {.} noop-xpath optimized, 
    // _m = 3 part xpath on remote model
    // x* : xpath in textblock
    // _a* : macro used in assign {xpath} = operation
    macro_c["("]      = 0,
    macro_o.each      = "\nfor(_t.push(_n,_a,_i,_l),_a=(_a=(",
    macro_c.each      = "))?_a:[],_l=_a.length,_n=_a[_i=0];_i<_l||(_l=_t.pop(),_i=_t.pop(),_a=_t.pop(),_n=_t.pop(),0);_n=_a[++_i])",

    macro_o.pack      = "(function(_n,_o,_lo){_o=[],_ol=0;",
    macro_c.pack      = "\nreturn _o.join('');})(_n)",

    macro_o.value     = "((_v=(",
    macro_c.value     = "))?(_v.nodeType==1?_v.firstChild:_v).nodeValue:'')",

    macro_o.value_n   = "",
    macro_c.value_n   = "(_n?(_n.nodeType==1?_n.firstChild:_n).nodeValue:'')",
    macro_c.a_value_n  = "(_n?(_n.nodeType==1?_n.firstChild:_n):{}).nodeValue",

    macro_o.xvalue    = "(_n?((_v=_n.selectSingleNode(_w=",
    macro_c.xvalue    = "))?(_v.nodeType==1?_v.firstChild:_v).nodeValue:''):'')",
    macro_c.a_xvalue  = "))?(_v.nodeType==1?_v.firstChild:_v):apf.createNodeFromXpath(_n,_w)):{}).nodeValue",

    macro_o.xvalue_m  = "(((_v=(_v=(_v=apf.$modelnslut[\"",
    macro_m.xvalue_m  = "\"])?_v.data:0)?[_v,_v.selectSingleNode(_w=",
    macro_c.xvalue_m  =  ")]:0) && (_v=_v[1]))?(_v.nodeType==1?_v.firstChild:_v).nodeValue:'')",
    macro_c.a_xvalue_m = ")]:0) && _v[1])?(_v[1].nodeType==1?_v[1].firstChild:_v[1]):apf.createNodeFromXpath(_v[0],_w)).nodeValue",

    macro_o.values    = "(function(){var _a,_i,_l,_n=[];for(a=(_a=(",
    macro_c.values    = "))?_a:[],_l=_a.length,_n=_a[_i=0];_i<_l;_n=_a[++_i])_n[_n.length]=(_n.nodeType==1?_n.firstChild:_n).nodeValue;return _n;})()",
    macro_o.values_n  = "",
    macro_c.values_n  = "((_n.nodeType==1?_n.firstChild:_n).nodeValue:'')",

    macro_o.count     = "((_v=(",
    macro_c.count     = "))?_v.length:0)",

    macro_o.count_n   = "",
    macro_c.count_n   = "(_n?1:0)",

    macro_o.xcount    = "(_n?_n.selectNodes(",
    macro_c.xcount    = ").length:0)",
    macro_o.xcount_m  = "((_v=(_v=(_v=apf.$modelnslut[\"",
    macro_m.xcount_m  = "\"])?_v.data:0)?_v.selectNodes(",
    macro_c.xcount_m  = "):0)?v.length:0)",

    macro_o.node      = "(",
    macro_c.node      = ")",
    macro_o.node_n    = "",
    macro_c.node_n    = "(_n)",
    macro_c.a_node_n  = "(_n?(_n.nodeType==1?_n.firstChild:_n):{}).nodeValue",

    macro_o.xnode     = "(_n?((_v=_n.selectSingleNode(_w=",
    macro_c.xnode     = "))):null)",
    macro_c.a_xnode   = "))?(_v.nodeType==1?_v.firstChild:_v):apf.createNodeFromXpath(_n,_w)):{}).nodeValue",
    macro_c.c_xnode   = "))?_v:apf.createNodeFromXpath(_n,_w)):{})",
    
    macro_o.xnode_m   = "(((_v=(_v=(_v= apf.$modelnslut[\"",
    macro_m.xnode_m   = "\"])?_v.data:0)?[_v,_v.selectSingleNode(_w=",
    macro_c.xnode_m   = ")]:0)?_v[1]:0))",
    macro_c.a_xnode_m = ")]:0) && _v[1])?(_v[1].nodeType==1?_v[1].firstChild:_v[1]):apf.createNodeFromXpath(_v[0],_w)).nodeValue",        
    macro_c.c_xnode_m = ")]:0) && _v[1])?_v[1]:apf.createNodeFromXpath(_v[0],_w))",        

    macro_o.nodes     = "(",
    macro_c.nodes     = ")",
    macro_o.nodes_n   = "",
    macro_c.nodes_n   = "[_n]",
    
    macro_o.xnodes    = "(_n?_n.selectNodes(",
    macro_c.xnodes    = "):[])",
    macro_o.xnodes_m  = "((_v=(_v= apf.$modelnslut[\"",
    macro_m.xnodes_m  = "\"])?_v.data:0)?_v.selectNodes(",
    macro_c.xnodes_m  = "):[])",
    
    macro_o.copy      = "((_v=(",
    macro_c.copy      = "))?_v.xml:'')",        
    macro_o.copy_n    = "",
    macro_c.copy_n    = "(_n?_n.xml:'')",        
    
    macro_o.xcopy     = "(_n?((_v=_n.selectSingleNode(",
    macro_c.xcopy     = "))?_v.xml:''):'')",
    macro_o.xcopy_m   = "((_v=(_v=(_v= apf.$modelnslut[\"",
    macro_m.xcopy_m   = "\"])?_v.data:0)?_v.selectSingleNode(",
    macro_c.xcopy_m   = "):null)?_v.xml:'')",
    
    macro_o.copies    = "(function(){var _a,_i,_l,_n=[];for(a=(_a=(",
    macro_c.copies    = "))?_a:[],_l=_a.length,_n=_a[_i=0];_i<_l;_n=_a[++_i])_n[_n.length]=_n.xml;return _n;})()",
    macro_o.copies_n  = "",
    macro_c.copies_n  = "(_n?_n.xml:'')",
    
    macro_o.xcopies   = "(function(){var _a,_i,_l,_o=[],_ol=0;for(_a=_n?_n.selectNodes(",
    macro_c.xcopies   = "):[],_l=_a.length,_n=_a[_i=0];_i<_l;_n=_a[++_i])_o[_ol++]=_n.xml;return _o.join('')})()",
    macro_o.xcopies_m = "(function(){var _a,_i,_l,_o=[],_ol=0;for(_a=((_v=(_v= apf.$modelnslut[\"",
    macro_m.xcopies_m = "\"])?_v.data:0)?_v.selectNodes(",
    macro_c.xcopies_m = "):[]),_l=_a.length,_n=_a[_i=0];_i<_l;_n=_a[++_i])_o[_ol++]=_n.xml;return _o.join('')})()",
    
    macro_o.local     = "\nfor(_t.push(_n,_i), _n=(",
    macro_c.local     = ");_i<1 || (_i=_t.pop(),_n=_t.pop(),0);_i++)",
    macro_o.local_n   = "",
    macro_c.local_n   = "",

    macro_o.async_    = "((typeof(_v=_st[_st.async_id++])!='undefined')?_v:apf.$async(_n,_self,_st,this,",
    macro_c.async_    = "]))",

    macro_o.xlang     = "apf.$lfind(_st.lang,",
    macro_c.xlang     = ") ";
    
    xpath_assign_lut[macro_c.xvalue_]  = 'xvalue_a'
    xpath_assign_lut[macro_c.xvalue_3] = 'xvalue_3a';
    xpath_assign_lut[macro_c.xnode]    = 'xnode_a';
    xpath_assign_lut[macro_c.xnode_m]  = 'xnode_3a';
    xpath_assign_lut[macro_c.node_n]   = 'node_na';
    xpath_assign_lut[macro_c.value_n]  = 'value_na';

    // apf language functions
    apf.$lrx  = new RegExp("\\$\\{(.*?)\\}", "g");
    apf.$lrep = function(tok,x){
        return "TEXT SYMBOL: ("+x+")";
    };
    apf.$lfind = function(lut,x){
        return "JSLT SYMBOL:("+x+")";
    };
    apf.$llut = 0;
    
    // shortcuts for fast access:
    apf.$modelnslut = apf.nameserver.lookup.model;
    
    apf.$async = function(_n,_self,_st,_this,obj,func,args){
        // lets increase the queue
        if(!_st) return ''; // JPF ERROR
        var id = _st.async_id, v;
        
        if(_st && _st.precalc !== undefined){
            if(_st.precalc){
                // call no-args stuff in precalc only if it is not async
                if(args.length==0 && !obj.exec){
                    return (func)?obj[func].call(obj):obj.call(obj);
                }
                if(!(v = _st.precalc_args))
                    v = _st.precalc_args = [];
                v[id] = args;
                return '';
            }else{
                args = v[id];
            }
        }

        if(!obj.exec)
            return  (func)?obj[func].apply(obj,args):obj.apply(obj,args);
        
        if(!_st.async_queue)_st.async_queue = 0;
        _st.async_queue ++;
        obj.exec(func,args,function(data, state, extra){
            if(_st.failed) return;
            if(state!= apf.success){
                // do something. it failed badly
                _st.failed = true;
                _st(null, state, extra);
            }else{
                _st[id] = (data.charAt(0) == '<')?apf.getXml(data):data;
                if(--_st.queue == 0){
                    try{
                        _self.call(_this,_n,_st,_self);
                    }catch(x){
                        _st.failed = true;
                        throw {t:"Exception in async reentry"};
                    }
                };
            }
        });
        return '';
    };

    parserx = new RegExp("([\"'{(\\[\\])}\\]]|\\r?[\\n]|\\/\\*|\\*\\/|\\<\\!\\-\\-|\\-\\-\\>|==|$)|([ \t]+)|([\\w._])+|(\\\\?[\\w._?,:;!=+-\\\\/^&|*\"'[\\]{}()%$#@~`<>]?)", "g");
    selfrx = new RegExp("(^|\\|)(?!\\@|[\\w-]+:)", "g");

    function parser(tok, rx_lut, rx_white, rx_word, rx_misc, pos){
        type = rx_lut ? type_lut[rx_lut] : (rx_white ? 0 : (rx_word ? 3 : (tok?2:12)));
        //apf.console.log(type+" "+tok+"\n");
        switch(parse_mode){
        case 0: // ============= code parse_mode =============
            switch (type) {
            case 0: // -------- whitespace --------
                o[ol++] = " ";
                break;
            case 1: // -------- newline --------
                line_no++, line_pos = pos;
                o[ol++] = "\n";
                break;
            case 2: // -------- misc --------
                if(tok == '='){
                    if(last_type == 3){
                        if(last_dot>0){
                            if(o[--ol]==' ')ol--;
                            if(out_begin==ol-1) // remove output-insert
                                o[ol-1]="";                        
                            o[ol++]='(',
                            o[ol++]=v=last_tok.substring(0,last_dot),
                            o[ol++]='.$setter?',o[ol++]=v,o[ol++]='.$setter():',
                            o[ol++]=v,o[ol++]=').',
                            o[ol++]=last_tok.slice(last_dot+1),
                            o[ol++]='=';
                        }else{
                          if(o[--ol]==' ')ol--;
                            if(out_begin==ol-1) // remove output-insert
                                o[ol-1]="";     
                            o[ol++] = last_tok;
                            o[ol++] = '=';
                        }
                    }else if(v = xpath_assign_lut[o[ol-2]!='\n'?o[n=ol-2]:o[n=ol-3]]){
                        // replace the macro by its 'a' variant for supporting assigns.
                        o[ n ] = macro_c[ v ] ;
                        o[ol++] = '=';
                   }else o[ol++] = unesc_lut[tok] || tok;
                }else if (tok == "%")
                    o[ol++] = c_output;
                else o[ol++] = unesc_lut[tok] || tok;
             break;
            case 3: // -------- word --------
                if (ol == out_begin){
                    if (!statement_lut[tok])
                        o[ol++] = c_output;
                    else
                        o[ol++] = "\n",has_statements = 1;
                }
                else if (!has_statements && statement_lut[tok])
                     has_statements = 1;
                     
                if ((last_dot = tok.lastIndexOf(".")) != -1){
                    props[o[ol++] = prop_last = tok] = 1;
                }else
                    o[ol++] = andorlut[tok] || tok;
            break;
            case 4: // -------- stringquotes --------
                if (ol == out_begin)
                    o[ol++] = c_output;
                o[ol++] = tok;
                parse_mode = 3, start_tok = tok;
                break;
            case 5: // -------- comment -------- 
                if (tok == "*/" || tok== "-->")
                    throw {t: "Unmatched comment "+tok, p: pos};
                parse_mode = 4, comment_parse_mode = 0, start_tok = tok;
                break;
            case 6: // -------- { --------
                if(last_tok != ')'){
                    if (ol == out_begin)
                        o[ol++] = c_output;                
                    if( v = xpath_incode_lut[last_tok] ){
                        if(--ol == out_begin) o[ol++] = "\n";
                    }else {
                        v = xpath_macro_default[s[sl-1]] || ((ol-1==out_begin && !c_node_mode) || last_tok=='+')
                            ?'xvalue':(c_node_mode==2?'xnodes':'xnode');
                    }

                    o[ol++] = macro_o[v];
                    s[sl++] = s_begin, 
                    s[sl++] = v, seg_begin = s_begin = ol;
                    parse_mode = 2;
                }
                else {
                    s[sl++] = s_begin, s[sl++] = o[ol++] = tok, s_begin = ol;
                }
                break;
            case 7: // -------- } --------
                if ((v = s[--sl]) != type_close[o[ol++] = tok])// ERROR
                    throw {t: "Cannot close " + v + " with " + tok, p: pos};
                s_begin = s[--sl];
                o[ol++] = "\n";
                break;
            case 8: // -------- [ --------
                code_level++;
                if(c_allow_template || ol != out_begin)
                    s[sl++] = s_begin, s[sl++] = o[ol++] = tok,seg_begin = s_begin = ol;
                break;
            case 9: // -------- ] --------
                if (!--code_level) {
                    if(c_allow_template){
                        if (sl>0 && s[sl-1] != '{') {
                            throw {t: "Cannot go to text mode whilst not in {}", p: pos};
                        }
                        parse_mode = 1;
                        seg_begin = out_begin = ol;
                    }else{
                        if(pos != str_len-1){
                            throw {t: "Dont support text mode", p: pos};
                        }
                    }
                }
                else {
                    if ((code_level<0 && (v = "nothing")) || (v = s[--sl]) != type_close[o[ol++] = tok]) {
                        throw {t: "Cannot close " + v + " with " + tok, p: pos};
                    }
                    s_begin = s[--sl];
                }
                break;
            case 10: // -------- ( --------
                if (ol == out_begin)
                    o[ol++] = c_output;
                if (n = macro_o[last_tok]) {
                    if(o[ol-1]==" ") ol--;
                    o[ol-1] = n;
                    s[sl++] = s_begin, s[sl++] = last_tok, s_begin = ol;
                }
                else{
                    if(last_type == 3 ){
                        if(o[ol-3]=='function'){
                            o[ol-3] = "var ",o[ol-2]=last_tok,o[ol-1]="=self.",
                            o[ol++] = last_tok, o[ol++] = "=function(";
                            s[sl++] = s_begin, s_begin = ol, s[sl++] = tok;
                        }else if((c_precalc && last_dot!=0) || 
                                 (last_dot>1 && async_lut[v = 
                                  last_tok.substring(0,last_dot)])){
                            if(o[--ol]==' ')ol--;
                            
                            if(c_precalc){
                                o[ol++] = macro_o.async_;
                                if(last_dot>1) o[ol++] = (n=last_tok.slice(last_dot+1),
                                                          last_tok.substring(0,last_dot))
                                else o[ol++] = (n='',last_tok);
                                o[ol++] = ",'", o[ol++] = n;
                                o[ol++] = "',(_st.precalc_args&&_st.precalc_args[_st.async_id])||[";
                            }else{
                                o[ol++] = macro_o.async_;
                                o[ol++] = v, o[ol++] = ",'";
                                o[ol++] = last_tok.slice(last_dot+1);
                                o[ol++] = "',[";
                            }
                            s[sl++] = s_begin, s[sl++] = 'async_', s_begin = ol;
                            async_calls++;
                        }else{
                            s[sl++] = s_begin, s[sl++] = o[ol++] = tok, s_begin = ol;
                        }
                    }else{
                        s[sl++] = s_begin, s[sl++] = o[ol++] = tok, s_begin = ol;
                     }
                     if (last_tok == prop_last)
                         delete props[last_tok];// was a call
                }
                break;
            case 11: // -------- ) --------
                if (n = macro_c[v = s[--sl]]) {
                    o[ol++] = n;
                }
                else if (v != type_close[o[ol++] = tok]) {
                    throw {t:"Cannot close " + v + " with " + tok, p: pos};
                }
                if((s_begin = s[--sl])&0x70000000){
                    // we have a different parsemode to return to
                    parse_mode = s_begin>>28;
                    s_begin = s_begin&0x0fffffff;
                    seg_begin = ol;
                };
                break;
            case 12: // -------- end --------
                if(sl)
                    throw {t: "Unclosed " + s[sl-1] + " found at end in codemode", p: pos};
                break;
            }
            break;
        case 1: // =============  text parse_mode =============
            switch (type) {
            case 1: // -------- newline --------
                line_no++, line_pos = pos;
                // only if we want newlines in text output...
                if(ol != out_begin && ol != seg_begin)
                   o[ol++] = "\\n";
                break;
            case 2: // -------- misc --------
                if(ol == out_begin)
                    o[ol++] = "\n_o[_ol++]=\"";
                else if(ol == seg_begin)
                    o[ol++] = ",\n_o[_ol++]=\"";
                logw(unesc_txt[tok]);
                o[ol++] = unesc_txt[tok] || tok;
                break;
            case 4: // -------- stringquotes --------
                if(ol == out_begin)
                    o[ol++] = "\n_o[_ol++]=\"";
                else if(ol == seg_begin)
                    o[ol++] = ",\n_o[_ol++]=\"";
                if(tok=='"')o[ol++] = "\\\"";
                else o[ol++] = "'";            
                break;
            case 5: // -------- comment --------
                if (tok == "*/" || tok== "-->")
                    throw {t: "Unmatched comment "+tok, p: pos};
                parse_mode = 3, comment_parse_mode = 1, start_tok = tok;
                break;
            case 6: // -------- { -------- 
                if( v = xpath_intext_lut[last_tok] ){
                    ol--;
                    if(ol-1 == out_begin) ol --;
                }else 
                    v = xpath_macro_default[s[sl-1]] || 'xvalue';
            
                if(ol == out_begin)     
                    o[ol++] = "\n_o[_ol++]=";
                else
                    texts++, o[ol++] = (ol == seg_begin)?",\n_o[_ol++]=":"\",\n_o[_ol++]=";
                
                o[ol++] = macro_o[v];
                s[sl++] = s_begin|0x10000000, s[sl++] = v, seg_begin = s_begin = ol;
                parse_mode = 2;
                break;
            case 12: // -------- end --------
                if(sl)
                    throw {t: "Unclosed " + s[sl-1] + " found at end in textmode", p: pos};
                if(ol != out_begin && ol != seg_begin)
                    o[ol++] = "\"", texts++;                
                break;
            case 8:  // -------- [ --------
                if(ol != out_begin && ol != seg_begin)
                    o[ol++] = "\"", texts++;
                parse_mode = 0, seg_begin = out_begin = ol, code_level=1;
                break;
            default: // -------- default --------
                if(ol == out_begin)
                    o[ol++] = "\n_o[_ol++]=\"";
                else if(ol == seg_begin)
                    o[ol++] = ",\n_o[_ol++]=\"";
                o[ol++] = tok;
            }
            break;
        case 2: // ============= xpath parse_mode =============
            switch(type){
            case 0: // -------- whitespace -------- 
                
                if(ol != s_begin){ // strip initial spaces
                    if(ol == seg_begin) 
                        o[ol++] = "+\n  \"";
                    o[ol++] = tok;
                }
                break;
            case 1: // -------- newline --------
                line_no++, line_pos = pos;
                break;          
             case 2: // -------- misc --------
                if (tok == ":" && s_begin == ol-3 &&  last_tok == ":" && !xpath_axes[n = o[ol - 2]]){
                    ol -=4;
                    // lets output a new macro with our _m extension for model
                    o[ol++] = macro_o[v=(s[sl-1]+="_m") ];
                    o[ol++] = last_model = n;
                    o[ol++] = macro_m[v];
                    seg_begin = s_begin = ol;
                    
                }else{
                    if (s_begin == ol)
                        o[ol++] = "\"";
                    else if(ol == seg_begin)
                        o[ol++] = "+\n  \"";
                    o[ol++] = unesc_lut[tok] || tok;
                }
                break;                
            case 4: // -------- stringquotes --------
                if(ol == s_begin && !(s[sl-2]&0x70000000)){
                    // we came from code. pop s and get back to code mode.
                    ol--, sl -= 2, s_begin = s[sl], parse_mode = 0, last_model = 0;
                    if (ol == out_begin-1) // pop auto-output off
                        ol--;
                    o[ol++] = '{';
                }else{
                    if (s_begin == ol)
                        o[ol++] = "\"";
                    else if(ol == seg_begin) 
                        o[ol++] = "+\n  \"";
                    o[ol++] = "\\";
                    o[ol++] = tok;
                }
                break;
            case 5: // -------- comment --------
                if (tok == "*/" || tok== "-->")
                    throw {t: "Unmatched comment "+tok, p: pos};
                comment_parse_mode = 2, parse_mode = 4, start_tok = tok;
                break; 
            case 6: // -------- { --------
                // nested xpath
                if (s_begin != ol)
                    o[ol++] = (ol == seg_begin)?"+\n  ":"\"+\n  ";

                s[sl++] = s_begin|0x20000000;
                o[ol++] = macro_o[s[sl++] ='xvalue'];
                seg_begin = s_begin = ol;
                parse_mode = 2;             
                if(last_model)
                    xpaths[xpaths.length] = [last_model,0, s[sl-3]], last_model = 0;
                break;
            case 7: // -------- } --------
                // lets pop the s and see where to return to
                if( ol == s_begin ) // todo optimize this?
                    o[ol++] = "\"\"";
                else if( ol != seg_begin)
                    o[ol++] = "\"";
  
                o[ol++] = macro_c[n=s[--sl]];

                if(seg_begin == s_begin){
                    v = o.slice(s_begin+1,-2).join('');
                    if(c_inject_self && !last_model && v != (u = v.replace(selfrx, "$1self::"))){
                        o[s_begin+1] = u;
                        for(u = s_begin+2;u<ol-2;u++)o[u]="";
                    }
                    xpaths[xpaths.length] = [last_model,v,n], last_model = 0;
                }
                else xpaths[xpaths.length] = [last_model,0,n], last_model = 0;

                parse_mode = (s_begin = s[--sl])>>28;
                s_begin    = s_begin&0x0fffffff;
                seg_begin  = ol;

                if(c_node_create && parse_mode == 0 && (n == 'xnode' || n == 'xnode_m')){
                    o[ol-1] = macro_c[ 'c_'+n ];
                }

                break;
            case 10: // -------- ( --------
                // perhaps go into code-in-xpath parse_mode
                if(ol == s_begin){ // accept code-in-xpath here
                    s[sl++] = s_begin|0x20000000, s[sl++] = o[ol++] = '(', s_begin = ol;
                    parse_mode = 0;
                }else{
                    if (ol == s_begin)
                        o[ol++] = "\"";
                    else if(ol == seg_begin)
                        o[ol++] = "+\n  \"";            
                    o[ol++] = tok;
                }
                break;
            case 12: // -------- end --------
                throw {t: "Unexpected end whilst parsing xpath", p: pos};
                break;
            default: // -------- default --------
                if (ol == s_begin)
                    o[ol++] = "\"";
                else if(ol == seg_begin)
                    o[ol++] = "+\n  \"";            
                o[ol++] = tok;
                break;
            }
            break;
        case 3: // ============= string parse_mode =============
            switch (type) {
            case 1: // -------- newline --------
                line_no++, line_pos = pos;
                o[ol++] = "\\n";
                break;
            case 2: // -------- misc --------
                o[ol++] = unesc_str[tok] || tok;
                break;
            case 4: // -------- stringquotes --------
                o[ol++] = tok;
                if (start_tok == tok)
                    parse_mode = 0;// go back to code parse_mode
                break;
            case 12: // -------- end --------
                throw {t: "Unexpected end whilst parsing string", p: pos};
                break;
            default: // -------- default --------
                o[ol++] = tok;
                break;
            }
            break;
        case 4: // ============= comment parse_mode =============
            switch (type) {
            case 1: // -------- newline --------
                line_no++, line_pos = pos;
                break;            
            case 5: // -------- comment --------
                if ((start_tok == "/*" && tok == "*/") ||
                   (start_tok == "<!--" && tok == "-->"))
                    parse_mode = comment_parse_mode;
                break;
            }
            case 12: // -------- end --------
                throw {t: "Unexpected end whilst parsing comment", p: pos};
                break;
            break;
        }
        if (type > 1)
            last_tok = tok, last_type = type;
    }
    
    this.lastCode = function(){
        return o;
    }

    function handleError(e,line_pos,part){
        // TODO: make a proper JPF exception with this information:
        if (e.t) {
            apf.console.error("Parse exception: " + e.t + " on line:"
                + line_no + " col:" + (e.p - line_pos - 2) + (part?(" part: "+part):"") );
        }
        else {
            apf.console.error("Compile exception: " + e.message + "\nCode: " + o);
        }
    }

    this.compileValue = function(str, with_options, precalc){
       try {
            c_output = "\n_o[_ol++]=", c_precalc = precalc,
            c_node_mode =  c_node_create =  c_inject_self =
            sl = code_level = last_tok = last_model = last_type = last_dot = line_no = 
            line_pos = async_calls = has_statements = texts = func = 0, 
            s = [], props = {}, xpaths = [];
            c_allow_template = parse_mode = 1;
            s_begin = out_begin = seg_begin = ol = 2;            
            
            o = with_options?["with(_st.opts){"]:[""];

            str.replace(parserx, parser);
            // string only
            if(!(u=xpaths.length) && out_begin == 2 && parse_mode==1){
                return o.slice(3,-1).join('');
            }// simple statement code
            else if(u==0 && !texts && !has_statements){
                o[1] = "var _u,_v,_w, _r = ", o[2] = "";
                o[ol++] = (async_calls)
                  ?";\nif(!_st.async_queue && (_u=_st.async))_u((typeof(_r)=='string' && _r.indexOf('$')!=-1)?(apf.$llut=_st.lang,_r.replace(apf.$lrx,apf.$lrep)):_r);return null;"
                  :";\nif(typeof(_r)=='string' && _r.indexOf('$')!=-1)apf.$llut=_st.lang,_r=_r.replace(apf.$lrx,apf.$lrep);return (_u=_st.async)?(_u(_r),null):_r;"                
            }// xpath only
            else{
                if(u==1 && !texts && out_begin == 2){
                    o[1] = "var _u,_v,_w, _r = ", o[2] = "";
                }// other code
                else {
                    o[1] = (async_calls)
                    ?"var _t=[],_u,_v,_w,_i,_a,_l,_r,_o=[],_ol=0;_st.async_id=1;"
                    :"var _t=[],_u,_v,_w,_i,_a,_l,_r,_o=[],_ol=0;";
                    o[ol++] = ";\n_r = _o.join('');";
                }
                o[ol++] = (async_calls)
                  ?"\n;if(!_st.async_queue&&_st.async)_st.async(_r.indexOf('$')!=-1?(apf.$llut=_st.lang,_r.replace(apf.$lrx,apf.$lrep)):_r);return null;"
                  :";\nif(_r.indexOf('$')!=-1)apf.$llut=_st.lang,_r=_r.replace(apf.$lrx,apf.$lrep);return (_u=_st.async)?(_u(_r),null):_r;"
            }
            if(with_options)o[ol++]="}";
            func = new Function("_n", "_self", "_st", o = o.join(""));          
        } catch(e) {
            handleError(e,line_pos);
        }
        return [func, xpaths, props];
    }
    
    this.compileNode = function(str, multiple, node_create, inject_self ){
       try {
            c_output = "\n_r=", c_node_mode = multiple?2:1, c_node_create = node_create, 
            c_inject_self = inject_self, c_precalc = c_allow_template = parse_mode = 
            sl = code_level = last_tok = last_model = last_type = last_dot = line_no = 
            line_pos = async_calls = has_statements = texts = func = 0;
            str_len = str.length, s = [], props = {}, xpaths = [];
            s_begin = out_begin = seg_begin = ol = 1;
            
            if(multiple && node_create){
                throw {t: "Cannot do multiple and node_create", p:0};
            }
            
            o = ["var _t=[],_u,_v,_w,_i,_a,_l,_r;"];
            
            str.replace(parserx, parser);
            
            if(async_calls)
                 throw {t: "Async calls not supported in node-JSLT"};
            
            o[ol++] = ";\nreturn _r;";
            
            func = new Function("_n", "_self", "_st", o = o.join(""));
        }
        catch(e) {
            handleError(e,line_pos);
        }
        return [func, xpaths, props];
    };
       
   this.compileMatch = function( str ){
       try {    
            s = [], props = {}, xpaths = [];
            sl = code_level = async_calls = has_statements = texts = func = 0;
            ol = 1;

            o = ["var _t=[],_u,_v,_w,_i,_a,_l,_r,_o=[],_ol=0;"];
            
            var old_xpaths, old_ol;
            
            for(var i = 0,l = str.length,sv,sp = str[0];i<l;sp=str[++i]){
                // compile the match
                if(sv = sp[0]){
                    c_output = "\n_r=", c_node_mode = c_inject_self = 1, str_len = sv.length,
                    c_node_create = c_precalc = c_allow_template = parse_mode = 
                    last_tok = last_model = last_type = last_dot = line_no = has_statements = 
                    line_pos = 0;
                    
                    s_begin = out_begin = seg_begin = ol;
                    
                    sv.replace( parserx, parser );
                    
                    o[ol++] = ";\nif(_r){";
                }
                // compile value
                if(sv = sp[1]){
                    c_output = "\n_o[_ol++]=", 
                    c_node_mode = c_node_create =  c_precalc = c_inject_self = 
                    last_tok = last_model = last_type = last_dot = line_no = 
                    line_pos = has_statements = 0, c_allow_template =  parse_mode = 1;
                    old_xpaths = xpaths.length, texts = 0,
                    s_begin = out_begin = seg_begin = old_ol = ol;
                    
                    sv.replace( parserx, parser );
                    // string only
                    if((u=xpaths.length) == old_xpaths && out_begin == old_ol && parse_mode==1){
                        o[old_ol] = "\nreturn \"";
                    }// simple expression
                    else if(u==old_xpaths && !texts && !has_statements){
                        o[old_ol] = "\n_r=";
                        o[ol++] = ";\nreturn (typeof(_r)=='string' && _r.indexOf('$')!=-1)?(apf.$llut=_st.lang,_r.replace(apf.$lrx,apf.$lrep)):_r;";
                    }// xpath only
                    else if(u==old_xpaths+1 && !texts && out_begin == old_ol){
                        o[old_ol] = "\n_r=";
                        o[ol++] = ";\nreturn (_r.indexOf('$')!=-1)?(apf.$llut=_st.lang,_r.replace(apf.$lrx,apf.$lrep)):_r;";
                    }else{
                        o[ol++] = ";\nreturn ((_r=_o.join('')).indexOf('$')!=-1)?(apf.$llut=_st.lang,_r.replace(apf.$lrx,apf.$lrep)):_r;";
                    }  
                    if(!sp[0]) break; // was terminating value since it had no match
                    o[ol++] = "\n}";

                } else { // no value
                    if(!sp[0]) // no match either
                        throw {t: "No match and value specified", p: 0};
                    // use value from match
                    o[ol++] = ";\nreturn ((_r="
                    o[ol++] = macro_o.value;
                    o[ol++] = "_r";
                    o[ol++] = macro_c.value;
                    o[ol++] = ").indexOf('$')!=-1)?(apf.$llut=_st.lang,_r.replace(apf.$lrx,apf.$lrep)):_r;\n}"; 
                }
            }
            if(async_calls)
                throw {t: "Async calls not supported in match-JSLT",p: 0};                

            func = new Function("_n", "_self", "_st", o = o.join(""));
        } catch(e) {
            handleError(e,line_pos,i);
        }
        return [func, xpaths, props];
    }    
    
    this.compileEvent = function(str ){
        try {   
            c_output = "", c_node_mode = 1, c_node_create = 
            c_inject_self = c_precalc = c_allow_template = parse_mode = 
            sl = code_level = last_tok = last_model = last_type = last_dot = line_no = 
            line_pos = async_calls = has_statements = texts = func = 0;
            str_len = str.length, s = [], props = {}, xpaths = [];
            s_begin = out_begin = seg_begin = ol = 1;

            o = ["var _t=[],_u,_v,_w,_i,_a,_l,_r;"];
            
            str.replace(parserx, parser);
            
            if(async_calls)
                 throw {t: "Async calls not supported in events? why not?"};
                       
            func = new Function("e", "_n", "_self", "_st", o = o.join(""));
        } catch(e) {
            handleError(e,line_pos);
        }
        return [func]; // no xpaths no nothing.
    }
    
   /* ***********************************************
     //you can interchange nodes and strings
     apply(jsltStr, xmlStr);
     apply(jsltNode, xmlNode);
     
     returns string or false
     ************************************************/
    
    /*
    // RUBEN: please rewrite this / change this to match what you want.
    this.cache = [];
    
    
    this.apply = function(jsltNode, xmlNode){
        var jsltFunc, cacheId, jsltStr, doTest;
        
        //Type detection xmlNode
        if (typeof xmlNode != "object")
            xmlNode = apf.getXmlDom(xmlNode);
        if (xmlNode.nodeType == 9)
            xmlNode = xmlNode.documentElement;
        if (xmlNode.nodeType == 3 || xmlNode.nodeType == 4)
            xmlNode = xmlNode.parentNode;
        if (xmlNode.nodeType == 2)
            xmlNode = xmlNode.ownerElement 
                || xmlNode.parentNode 
                || xmlNode.selectSingleNode("..");
        
        //Type detection jsltNode
        if (typeof jsltNode == "object") {
            // #ifdef __DEBUG
            doTest = apf.isTrue(jsltNode.getAttribute("test"));
            // #endif
            
            //check the jslt node for cache setting
            cacheId  = jsltNode.getAttribute("cache");
            jsltFunc = this.cache[cacheId];
            if (!jsltFunc) {
                jsltStr       = [];
                var textNodes = jsltNode.selectNodes('text()');
                for (var i = 0; i < textNodes.length; i++) {
                    jsltStr = textNodes[i].nodeValue;
                    if (jsltStr.trim()) 
                        break;
                }
            }
        }
        else {
            cacheId  = jsltNode;
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
        //if this crashes here there is something seriously wrong:
        this.lastJs   = jsltFunc[0];

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
         /*   if (!xmlNode) 
                return '';
            
            // #ifdef __DEBUG
            var str = jsltFunc[0](xmlNode);
            if (doTest) 
                apf.getObject("XMLDOM", "<root>" + str.replace(/>/g, ">\n") + "</root>");
            return str;*/
            /* #else
            return jsltFunc[0](xmlNode);
            #endif */
        /* #ifndef __DEBUG
        }
        catch (e) {
            apf.console.error(apf.formatJS(jsltFunc[1]));
            throw new Error(apf.formatErrorString(0, null, "JSLT parsing", "Could not execute JSLT with: " + e.message));
        }
        #endif */
    /*};*/
})();

// #endif