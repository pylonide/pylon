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
 apf.JsltImplementation = function(){

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
        "each_" : "xnodes", "local_": "xnode", "value_" : "xnode", 
        "values_" : "xnodes",  "copies_" : "xnodes", "_node_": "xnode",
        "nodes_" : "xnodes", "count_" : "xnodes", "copy_" : "xnode"
    },    
    unesc_lut = { // unescape in code and xpath mode
        "\\\"": "\"", "\\\'": "\'", "\\{": "{", "\\}": "}",
        "\\[": "[", "\\]": "]", "\\(":"(", "\\)":")", "\\\\":"\\"
    },
    unesc_str = { // unescape in string mode
        "\\{": "{", "\\}": "}", "\\[": "[", "\\]": "]", "\\(": "(", "\\)": ")",
        "\\\\": "\\"
    },
    andorlut = { // word to operand lookup table for easy use in xml
        "lte" : "<=", "gte" : ">=", "lt" : "<", "gt" : ">", "and" : "&&", 
        "or": "||", "andbin" : "&", "orbin" : "|", "LTE" : "<=", "GTE" : ">=",
        "LT" : "<", "GT" : ">", "AND" : "&&", "OR": "||", "ANDBIN" : "&",
        "ORBIN" : "|"
    },
    parserx,
    macro_o={},macro_c={},macro_m={},
    // the macro open middle close hashes 
    // _n = {.} noop-xpath optimized, 
    // _m = 3 part xpath on remote model
    // x* : xpath in textblock
    // _a* : macro used in assign {xpath} = operation
    macro_c["("]      = 0,
    macro_o.each      = "\nfor(_t.push(_n,_a,_i,_l),_a=(_a=(",
    macro_c.each      = "))?_a:[],_l=_a.length,_n=_a[_i=0];_i<_l||(_l=_t.pop(),_i=_t.pop(),_a=_t.pop(),_n=_t.pop(),0);_n=_a[++_i])",

    macro_o.pack      = "(function(_o,_n){_o=[];",
    macro_c.pack      = "\nreturn _o.join('');})(_o,_n)",

    macro_o.value     = "((_v=(",
    macro_c.value     = "))?(_v.nodeType==1?_v.firstChild:_v).nodeValue:'')",

    macro_o.value_n   = "",
    macro_c.value_n   = "(_n?(_n.nodeType==1?_n.firstChild:_n).nodeValue:'')",
    macro_c.value_na  = "(_n?(_n.nodeType==1?_n.firstChild:_n):{}).nodeValue",

    macro_o.xvalue    = "(_n?((_v=_n.selectSingleNode(_w=",
    macro_c.xvalue    = "))?(_v.nodeType==1?_v.firstChild:_v).nodeValue:''):'')",
    macro_c.xvalue_a  = "))?(_v.nodeType==1?_v.firstChild:_v):apf.createNodeFromXpath(_n,_w)):{}).nodeValue",

    macro_o.xvalue_m  = "((_v=(_u=_v=(_v=apf.nameserver.lookup.model[\"",
    macro_m.xvalue_m  = "\"])?_v.data:0)?_v.selectSingleNode(_w=",
    macro_c.xvalue_m  = "):0)?(_v.nodeType==1?_v.firstChild:_v).nodeValue:'')",
    macro_c.xvalue_ma = "):0)?(_v.nodeType==1?_v.firstChild:_v):apf.createNodeFromXpath(_u,_w)).nodeValue",

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

    macro_o.xcount_m  = "((_v=(_v=(_v=apf.nameserver.lookup.model[\"",
    macro_m.xcount_m  = "\"])?_v.data:0)?_v.selectNodes(",
    macro_c.xcount_m  = "):0)?v.length:0)",

    macro_o.node      = "(",
    macro_c.node      = ")",
    macro_o.node_n     = "",
    macro_c.node_n     = "(_n)",
    macro_c.node_na   = "(_n?(_n.nodeType==1?_n.firstChild:_n):{}).nodeValue",

    macro_o.xnode     = "(_n?((_v=_n.selectSingleNode(_w=",
    macro_c.xnode     = "))):null)",
    macro_c.xnode_a   = "))?(_v.nodeType==1?_v.firstChild:_v):apf.createNodeFromXpath(_n,_w)):{}).nodeValue",

    macro_o.xnode_m   = "((_v=(_u=_v=(_v=apf.nameserver.lookup.model[\"",
    macro_m.xnode_m   = "\"])?_v.data:0)?_v.selectSingleNode(_w=",
    macro_c.xnode_m   = "):0))",
    macro_c.xnode_ma  = "):0)?(_v.nodeType==1?_v.firstChild:_v):apf.createNodeFromXpath(_u,_w)).nodeValue",        

    macro_o.nodes     = "(",
    macro_c.nodes     = ")",
    macro_o.nodes_n   = "",
    macro_c.nodes_n   = "[_n]",
    macro_o.xnodes    = "(_n?_n.selectNodes(",
    macro_c.xnodes    = "):[])",
    macro_o.xnodes_m  = "((_v=(_v=apf.nameserver.lookup.model[\"",
    macro_m.xnodes_m  = "\"])?_v.data:0)?_v.selectNodes(",
    macro_c.xnodes_m  = "):[])",
    macro_o.copy      = "((_v=(",
    macro_c.copy      = "))?_v.xml:'')",        
    macro_o.copy_n    = "",
    macro_c.copy_n    = "(_n?_n.xml:'')",        
    macro_o.xcopy     = "(_n?((_v=_n.selectSingleNode(",
    macro_c.xcopy     = "))?_v.xml:''):'')",
    macro_o.xcopy_m   = "((_v=(_v=(_v=apf.nameserver.lookup.model[\"",
    macro_m.xcopy_m   = "\"])?_v.data:0)?_v.selectSingleNode(",
    macro_c.xcopy_m   = "):null)?_v.xml:'')",
    macro_o.copies    = "(function(){var _a,_i,_l,_n=[];for(a=(_a=(",
    macro_c.copies    = "))?_a:[],_l=_a.length,_n=_a[_i=0];_i<_l;_n=_a[++_i])_n[_n.length]=_n.xml;return _n;})()",
    macro_o.copies_n  = "",
    macro_c.copies_n  = "(_n?_n.xml:'')",
    macro_o.xcopies   = "(function(){var _a,_i,_l,_o=[];for(_a=_n?_n.selectNodes(",
    macro_c.xcopies   = "):[],_l=_a.length,_n=_a[_i=0];_i<_l;_n=_a[++_i])_o[_o.length]=_n.xml;return _o.join('')})()",
    macro_o.xcopies_m = "(function(){var _a,_i,_l,_o=[];for(_a=((_v=(_v=apf.nameserver.lookup.model[\"",
    macro_m.xcopies_m = "\"])?_v.data:0)?_v.selectNodes(",
    macro_c.xcopies_m = "):[]),_l=_a.length,_n=_a[_i=0];_i<_l;_n=_a[++_i])_o[_o.length]=_n.xml;return _o.join('')})()",
    macro_o.local     = "\nfor(_t.push(_n,_i), _n=(",
    macro_c.local     = ");_i<1 || (_i=_t.pop(),_n=_t.pop(),0);_i++)",
    macro_o.local_n   = "",
    macro_c.local_n   = "",
    macro_o._async    = "((typeof(_v=async[async.id?++async.id:(async.id=2)])!='undefined')?_v:apf.JsltInstance.asyncCall(_n,_lang,_opts,_self,async,this,",
    macro_c._async    = "]))",
    macro_o.xlang     = "apf.$lfind(_lang,",
    macro_c.xlang     = ")",
    
    xpath_assign_lut={}, // used to find the macro used in an {xpath} = 
    async_lut={     // used to figure out if the thing before the. is an async obj
        'comm' :1,
        'rpc'  :1,
        'http' :1
    },
    
    f_node_mode,    // guess 'node' as the type for {} xpaths, 1 = node, 2 = nodes
    f_node_create,  // use create xpaths on xpath fetch in codemode
    f_all_async,    // all calls are async (precalc parse_mode)
    o, ol,          // output and output len
    c, cl,          // scopestack and scopestack len
    c_begin,        // ol where this scope started
    out_begin,      // the ol when [ or ] started text or code
    seg_begin,      // the ol of a text-segment
    start_tok,      // the token a string or comment was started with
    code_level,     // the [] count to switch between code/text
    last_tok,       // last token
    last_type,      // last type
    last_dot,       // . pos when last token was a word
    line_no, line_pos, // line/pos to give nice errors
    v, n,           // random tempvars
    parse_mode,     // the parse parse_mode 
    last_parse_mode,// last parse parse_mode
    async_calls,    // number of async calls
    js_props,       // the js properties found
    js_prop_last,   // last js property found
    has_statements; // the code contains statements (so you cant use it as an expression)
    
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

    this.asyncCall = function(n,_lang,_opts,_self,async,_this,obj,func,args){
        // lets increase the queue
        if(!async) return ''; // JPF ERROR
        var id = async.id, v, n;
        
        if(_opts && _opts.precalc !== undefined){
            if(_opts.precalc){
                // call no-args stuff in precalc only if it is not async
                if(args.length==0 && !obj.exec){
                    return (func)?obj[func].call(obj):obj.call(obj);
                }
                if(!(v = _opts.args))
                    v = _opts.args = [];
                v[id] = args;
                return '';
            }else{
                args = v[id];
            }
        }

        if(!obj.exec)
            return  (func)?obj[func].apply(obj,args):obj.apply(obj,args);
        
        if(!async.queue)async.queue = 0;
        async.queue ++;
        obj.exec(func,args,function(data, state, extra){
            if(async.failed) return;
            if(state!= apf.success){
                // do something. it failed badly
                async.failed = true;
                async(null, state, extra);
            }else{
                async[id] = (data.charAt(0) == '<')?apf.getXml(data):data;
                if(--async.queue == 0){
                    try{
                        _self.call(_this, n,_lang,_opts,_self,async);
                    }catch(x){
                        async.failed = true;
                        throw {t:"Exception in async reentry"};
                    }
                };
            }
        });
        return '';
    };

    parserx = new RegExp("([\"'{(\\[\\])}\\]]|\\r?[\\n]|\\/\\*|\\*\\/|\\<\\!\\-\\-|\\-\\-\\>|==)|([ \t]+)|([\\w._])+|(\\\\?[\\w._?,:;!=+-\\\\/^&|*\"'[\\]{}()%$#@~`<>])", "g");

    function parser(tok, rx_lut, rx_white, rx_word, rx_misc, pos){
        type = rx_lut ? type_lut[rx_lut] : (rx_white ? 0 : (rx_word ? 3 : 2));
        //apf.console.log(type+" "+tok+"\n");
        switch(parse_mode){
        case 0: // ============= code parse_mode =============
            switch (type) {
            case 0: // -------- whitespace --------
                o[ol++] = " ";
                break;
            case 1: // -------- newline --------
                line_no++, line_pos = pos;
                break;
            case 2: // -------- misc --------
                if(tok == '='){
                    if(last_type == 3 && last_dot>0){
                        if(o[--ol]==' ')ol--;
                        o[ol++]='(',o[ol++]=v,
                        o[ol++]=last_tok.substring(0,last_dot),
                        o[ol++]='.$setter?',o[ol++]=v,o[ol++]='.$setter():',
                        o[ol++]=v,o[ol++]=').',
                        o[ol++]=last_tok.slice(last_dot+1),
                        o[ol++]='=';
                    }else if(v = xpath_assign_lut[o[ol-2]!='\n'?o[n=ol-2]:o[n=ol-3]]){
                        // replace the macro by its 'a' variant for supporting assigns.
                        o[ n ] = macro_c[ v ] ;
                        o[ol++] = '=';
                   }else o[ol++] = unesc_lut[tok] || tok;
                }else if (tok == "%")
                    o[ol++] = "\n_o[_o.length]=";
                else o[ol++] = unesc_lut[tok] || tok;
             break;
            case 3: // -------- word --------
                if (ol == out_begin){
                    if (!statement_lut[tok])
                        o[ol++] = "\n_o[_o.length]=";
                    else
                        has_statements = 1;
                }
                else if (!has_statements && statement_lut[tok])
                     has_statements = 1;
                     
                if ((last_dot = tok.lastIndexOf(".")) != -1){
                    js_props[o[ol++] = js_prop_last = tok] = 1;
                }else
                    o[ol++] = andorlut[tok] || tok;
            break;
            case 4: // -------- stringquotes --------
                if (ol == out_begin)
                    o[ol++] = "\n_o[_o.length]=";
                parse_mode = 4, start_tok = tok; 
            break;
            case 5: // -------- comment -------- 
                if (tok == "*/" || tok== "-->")
                    throw {t: "Unmatched comment "+tok, p: pos};
                parse_mode = 5, last_parse_mode = 0, start_tok = tok;
                break;
            case 6: // -------- { --------
                // lets see if we should switch to xpath parse_mode
                //logw("XPATH MODE" +count);
                if(last_tok != ')'){
                    // check what parse_mode to start the xpath in
                    
                    // startup xpath parse_mode
                }
                else {
                    c[cl++] = c_begin, c[cl++] = o[c_begin = ol++] = tok;
                }
                break;
            case 7: // -------- } --------
                if ((v = c[--cl]) != type_close[o[ol++] = tok])// ERROR
                    throw {t: "Cannot close " + v + " with " + tok, p: pos};
                c_begin = c[--cl];
                o[ol++] = "\n";
                break;
            case 8: // -------- [ --------
                c[cl++] = c_begin, c[cl++] = o[c_begin =ol++] = tok;
                break;
            case 9: // -------- ] --------
                if (!--code_level) {
                    if (cl>0 && c[cl-1] != '{') {
                        throw {t: "Cannot go to text mode whilst not in {}", p: pos};
                    }
                    parse_mode = 1;
                    seg_begin = out_begin = ol;
                }
                else {
                    if ((v = c[--cl]) != type_close[o[ol++] = tok]) {
                        throw {t: "Cannot close " + v + " with " + tok, p: pos};
                    }
                    c_begin = c[--cl];
                }
                break;
            case 10: // -------- ( --------
                if (ol == out_begin)
                    o[ol++] = "\n_o[_o.length]=";
                if (n = macro_o[last_tok]) {
                    if(o[ol-1]==" ") ol--;
                    o[ol-1] = n;
                    c[cl++] = c_begin, c_begin = ol, c[cl++] = last_tok;
                }
                else{
                    if(last_type == 3 ){
                        if(o[ol-3]=='function'){
                            c[cl++] = c_begin;
                            o[ol-3] = "var ",o[ol-2]=last_tok,o[ol-1]="=self.",
                            o[ol++] = last_tok, o[c_begin =ol++] = "=function(";
                            c[cl++] = tok;
                        }else if((f_all_async && last_dot!=0) || 
                                 (last_dot>1 && async_lut[v = 
                                  last_tok.substring(0,last_dot)])){
                            if(o[--ol]==' ')ol--;
                            
                            if(f_all_async){
                                o[ol++] = macro_o._async,
                                o[ol++] = last_dot>1
                                    ?(n=last_tok.slice(last_dot+1),
                                     last_tok.substring(0,last_dot))
                                    :(n='',last_tok), 
                                o[ol++] = ",'", o[ol++] = n, 
                                o[ol++] "',_opt.args[async.id]||[");
                            }else{
                                o[ol++] = macro_o._async,
                                o[ol++] = v, o[ol++] = ",'",
                                o[ol++] = last_tok.slice(last_dot+1),
                                o[ol++] = "',[";
                            }
                            c[cl++] = c_begin, c_begin = ol, c[cl++] = '_async';
                            c_async_calls++;
                        }else{
                            c[cl++] = c_begin, c[c_begin = cl++] = o[ol++] = tok;
                        }
                    }else{
                        c[cl++] = c_begin, c[cl++] = o[c_begin = ol++] = tok;
                     }
                     if (last_tok == js_prop_last)
                         delete js_props[last_tok];// was a call
                     
                }
                break;
            case 11: // -------- ) --------
                if (n = macro_c[v = c[--cl]]) {
                    o[ol++] = n;
                }
                else if (v != type_close[o[ol++] = tok]) {
                    throw {t:"Cannot close " + v + " with " + tok, p: pos};
                }
                if((c_begin = c[--cl])&0x7000000){
                    // we have a different parsemode to return to
                    parse_mode = c_begin&0x70000000;
                    c_begin = c_begin&0x0fffffff;
                };
                break;
            }
            break;
        case 1: // =============  text parse_mode =============
            switch (type) {
            case 1: // -------- newline --------
                line_no++, line_pos = pos;
                break;
            case 2: // -------- misc --------
                if(ol == out_begin) o[ol++] = "\n_o.push(\"";
                else if(ol == seg_begin) o[ol++] = ",\"";
                o[ol++] = unesc_lut[tok] || tok;
                break;
            case 4: // -------- stringquotes --------
                if(ol == out_begin) o[ol++] = "\n_o.push(\"";
                else if(ol == seg_begin) o[ol++] = ",\"";
                o[ol++] = "\\";
                o[ol++] = tok;            
                break;
            case 6: // -------- { -------- 
                if(ol == out_begin) o[ol++] = "\n_o.push(";
                else o[ol++] = (ol == seg_begin)?",":"\",";
                break;  
            case 5: // -------- comment --------
                if (tok == "*/" || tok== "-->")
                    throw {t: "Unmatched comment "+tok, p: pos};
                parse_mode = 3, last_parse_mode = 1, start_tok = tok;
                break;
            case 8: // -------- [ --------
                if(ol != seg_begin)
                    o[ol++] = "\"";
                o[ol++] = ")\n";
                parse_mode = 0, out_begin = ol;
                break;                
            default: // -------- default --------
                if(ol == out_begin) o[ol++] = "\n_o.push(\"";
                else if(ol == seg_begin) o[ol++] = ",\"";
                o[ol++] = tok;
            }
            break;
        case 2: // ============= xpath parse_mode =============
            switch(type){
            case 0: // -------- whitespace -------- 
                if(ol!=c_begin) // strip initial spaces
                    o[ol++] = tok;
                break;
            case 1: // -------- newline --------
                line_no++, line_pos = pos;
                break;          
             case 2: // -------- misc --------
                if (tok == ":" && c_begin==ol-3 &&  last_tok == ":" && !xpath_axes[n = o[ol - 2]]){
                    // alternate model
                    // this xpath might be bound on a special node
                }else{
                    if (c_begin==ol)
                        o[ol++] = "\n_o.push(\"";
                    o[ol++] = unesc_lut[tok] || tok;
                }               
            case 4: // -------- stringquotes --------
                if(ol==c_begin && !(c[cl-2]&0x70000000)){
                    // we came from code. pop c and get back to code mode.
                    
                }else{
                    o[ol++] = "\\";
                    o[ol++] = tok;
                }
                break;
            case 5: // -------- comment --------
                if (tok == "*/" || tok== "-->")
                    throw {t: "Unmatched comment "+tok, p: pos};
                last_parse_mode = 2, parse_mode = 4, start_tok = tok;
                break; 
            case 6: // -------- { --------
                // a nested xpath was found
                    // push up a proper xpath macro and a returnmode 2
                break;
            case 7: // -------- } --------
                // lets pop the c and see where to return to
                break;
            case 10: // -------- ( --------
                // perhaps go into code-in-xpath parse_mode
                if(ol == c_begin){
                    //lets push up a ( on the c with a returnmode 2
                    
                }
                break;
            default: // -------- default --------
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
                    parse_mode = last_parse_mode;
                break;
            }
            break;
        }
        /*
        else {
                switch (type) {
                    case 8:// [
                        if(!s_xpath){
                            if (count) {
                                if (!xpathsegs && count >= 1 || count > 1)
                                    textsegs++;
                                o[ol++] = '");';
                            }
                            s_block = count = 0;
                            code    = 1;
                            codesegs++;
                        }else o[ol++] = tok;
                        break;
                    case 4: // textblock
                        // switch back to code parse_mode if we are the first character
                        if (s_xpathincode && last_tok == "{" && count < 3) {
                            if (count>1)
                                o.length--;
                            if (s_popauto) 
                                o.length--;
                            o.length -= 2;
                            ol        = o.length;
                            o[ol++]   = c[c.length-1] = "{";
                            
                            b = [tblock = tok],bl = 1;
                            s_block = 2;
                            s_xpath   = s_xpathincode = 0;
                            count     = xstack.pop();
                        }
                        else {
                            if (!count++ && !s_xpath)
                                o[ol++] = "\ns.push(\"";
                            o[ol++] = "\\" + tok;
                        }
                        break;
                    case 5: // comment
                        if (tok == "*\/")
                            throw {t: "Unmatched comment *\/", p: pos};
                        s_block  = 3;
                        b    = [tblock = tok];
                        bl       = 1;
                        s_pblock = 1;
                        break;
                    case 6: // {
                        if (!s_xpath) { // switch to xpath parse_mode

                            if (v = xpath_intext_lut[last_tok]) {
                                ol = --o.length;
                                if (count < 2) {
                                    o.length--;
                                    count--;
                                }
                            }
                            else {
                                v = xpath_macro_default[c[c.length - 1]]
                                    || "xvalue";
                            }
                            if(v =='xlang')
                                langsegs++;
                            else xpathsegs++; 
                            textsegs++;
                            o.push((count++) ? (textsegs++, '",') : "\ns.push(",
                                macro[v], '"');
                            c.push(v + "_");
                            xstack.push(count);
                            count         = 1;
                            s_xpath       = 1;
                            s_xpathincode = 0;
                            xpathbegin = ol = o.length;
                        }
                        else {
                            // someone put an extra { in our xpath... we might
                            // be in a reference-
                            o[ol++] = (!count++) ? "\ns.push(\"{" : "{";
                        }
                        break;
                    case 7: // }
                        if (s_xpath) { // end xpath parse_mode
                        
                            // optimize the {} case and {.} case
                            if( (count==1 || (count==2 && last_type==6)) && s_xpathincode && !s_codeinxpath){
                               ol = (o.length-=2);
                               o[ol++]="{}";
                               s_block = 0;
                               c.pop();
                            } else {
                                if (last_tok == "." && o[ol-2] == '"') {
                                    ol = (o.length-=3);
                                    o[ol++] = macro[v = "_" + c.pop()
                                        .substring(1, v.length)];
                                    c.push(v + "_");
                                    complexcode = s_codeinxpath = 1; // no " insertion
                                    // make sure it doesnt get optimized as pure xpath also
                                }
                                if (s_xpathincode) {
                                    o.push(s_codeinxpath ? "" : '"', 
                                        macro[v = c.pop()], "\n");
                                    s_block = 0;
                                }
                                else {
                                    if (s_xpathwithmodel) { // add our xpath too
                                        jsmodels[jsmodels.length] =
                                            o.slice(s_xpathwithmodel, ol).join("");
                                        s_xpathwithmodel = 0;
                                    }
                                    o.push(s_codeinxpath ? "" : '"',
                                        macro[v = c.pop()], ',"');
                                }
                            }
                            s_codeinxpath = s_xpath = s_xpathincode = 0;
                            ol            = o.length;
                            count         = 1;
                            xstack.pop();
                        }
                        else {
                            o[ol++] = (!count++) ? "\ns.push(\"}" : "}";
                        }
                        break;
                    case 10: // (
                        // we are going into inner-code parse_mode.
                        if (s_xpath && count < 2 && last_tok=="{") {
                                                                           
                            if (o[ol - 1] != '"')
                                throw {t: "Invalid code-in-xpath" + v, p: pos};
                            // remove quote and go into code parse_mode
                            ol      = --o.length;
                            c.push(s_xpathincode 
                                ? "codeinxpathincode"
                                : "codeinxpath");
                            s_block = s_xpath = s_xpathincode = 0;
                            count   = 1;
                        }
                        else {
                            if (!count++)
                                o[ol++] = "\ns.push(\"";
                            o[ol++] = "(";
                        }
                        break;
                    case 11: // )
                        if (!count++)
                            o[ol++] = "\ns.push(\"";
                        o[ol++] = ")";
                        break;
                    case 1: // newline
                        line_no++;
                        line_pos = pos;
                        break;
                    case 2: // misc
                        if (s_xpath && count > 2 && tok == ":" 
                          && last_tok == ":" && !xpath_axes[n = o[ol - 2]]) {
                            if (xpathbegin <= ol - 3) {
                                n = o.slice(xpathbegin,ol-1).join('');
                            }
                            // we have to skip back to the length when starting
                            // the xpath macro.
                            ol = o.length = xpathbegin - 2;
                            s_xpathwithmodel = ol + 2;
                            (jsmodels || (jsmodels = [])).push(n);
                            // lets find the right macro for our new 3 state
                            // shiznizzleshiz
                            o[ol++] = macro[(v = c.pop()) + "1"] + n
                                + (n = macro[v + "2"]);
                            o[ol++] = "\"";
                            if (!n){
                                if(v.match(/\d+$/))
                                    throw {t: "Found triple or more :: in model connection in xpath " + v, p: pos};
                                throw {t: "Don't support alternative model for this xpath macro: " + v, p: pos};
                            }
                            c.push(v + "3");
                            // this xpath might be bound on a special node
                        }
                        else {
                            if (!count++)
                                o[ol++] = "\ns.push(\"";
                            o[ol++] = unesc_lut[tok] || tok;
                        }
                        break;
                    default:
                        if (!count++ && !s_xpath)
                            o[ol++] = "\ns.push(\"";
                        o[ol++] = tok;
                        break;
                }
            }
            else {
               
            }
        }*/
        if (type > 1)
            last_tok = tok, last_type = type;
    }

    // pass in an extension object for our macro table
    this.extendMacros = function(exts){
        // extend / overwrite the macro table
        for(n in exts) 
            macro[n] = exts[n];
        // MIKE: Example of extension
        // { "xvalue"  : "('<div class=\'editable\'>'+(n?((_v=n.selectSingleNode(",
        //   "xvalue_" : "))?(_v.nodeType==1?_v.firstChild:_v).nodeValue:''):'')+'</div>')" }           
    },
    
    // always_async creates code which always calls the async callback and returns 'null'
    // precalc_calls essentially makes all calls async and uses the options storage area for args and .precalc
    // jslt is optimized to return objects and real values where possible
    
    this.compile = function(str, with_options, is_eventhandler, always_async, precalc_calls){
        try {      
 
            always_async = 1;
            all_async = precalc_calls;
            ol   = 1;
            code = s_codeinxpath = s_xpathincode = s_xpath = complexcode = 
                xpathsegs = s_popauto = bl = type =  line_no = line_pos =
                codesegs = textsegs = count = last_tok = s_xpathwithmodel =
                last_type = jsmodels = async_calls = langsegs = 0;
            s_block = 1;
            
            if(is_eventhandler){
                s_block = 0, code =1,
                codesegs++;
            }
            
            c    = [];
            xstack   = [];
            jsobjs   = {};
            str.replace(parserx, parser);
            
            if (s_block == 1 && count > 0)
                o[ol++] = '");';
//            if (!xpathsegs && count >= 1)
//                textsegs++;

            // lets check our simplification cases
            var s;
            if (s_block != 1) {
                switch (s_block) {
                    case 0:
                        if(is_eventhandler)break;
                        s = "code b [";
                        break;
                    case 2:
                        s = "string quote " + tblock;
                        break;
                    case 3:
                        if (tblock != "//")
                            s = "comment " + tblock;
                        break;
                }
                if (s)
                    throw {t: "Unclosed " + s + " found at eof", p: str.length};
            }
            
            if (c.length) {
                // lets check our macro
                s = c[c.length-1];
                if (macro[s])
                    s = s.charAt(0) == "x" ? "xpath {" : "macro ( from " + s;
                throw {t: "Unclosed " + s + " found at eof", p: str.length};
            }
            
            // pick the right function ending
            if(always_async){
                 o[ol++] = async_calls 
                    ? "\n;async.id=1;if(!async.queue)async(((_v=s.join('')).indexOf('$'))!=-1?(apf.$llut=_lang,_v.replace(apf.$lrx,apf.$lrep)):_v);return null;"
                    : "\n;async((_v=s.join('')).indexOf('$')!=-1?(apf.$llut=_lang,_v.replace(apf.$lrx,apf.$lrep)):_v);return null;";
            }else {
                o[ol++] = async_calls 
                    ? "\n;if(!async)return ((_v=s.join('')).indexOf('$'))!=-1?(apf.$llut=_lang,_v.replace(apf.$lrx,apf.$lrep)):_v;async.id=1;if(!async.queue)async(((_v=s.join('')).indexOf('$'))!=-1?(apf.$llut=_lang,_v.replace(apf.$lrx,apf.$lrep)):_v);return null;"
                    : "\n;return ((_v=s.join('')).indexOf('$'))!=-1?apf.languageParse(_v,_lang):_v;";
            }
            //logw(complexcode +" xpath "+xpathsegs+" code "+codesegs+" text "+textsegs+" language "+langsegs);
            // simplification and optimization cases:            
            if (!complexcode) {
                // we only have one codesegment
                if (!textsegs) {
                    if (codesegs == 1) { // clean up code for async parse_mode
                        if(xpathsegs == 0 && o.length<=3) o = [with_options ? "with(_opts){return '';" : "return '';"];
                        else{
                            if(always_async){
                                o[0] = with_options ? "with(_opts){var _u,_v,_w,ret = " : "var ret = ";
                                if(o[1]=='\ns[s.length]=')o[1]='';
                                o[o.length-1] = "\n;async.id=1;if(!async.queue)async((typeof(ret)=='string')?(ret.indexOf('$')!=-1?(apf.$llut=_lang,ret.replace(apf.$lrx,apf.$lrep)):ret):ret);return null;"
                            }else{
                                if(!async_calls){
                                    o[0] = with_options ? "with(_opts){var _u,_v,_w,ret = " : "var _u,_v,_w, ret = ";
                                    if(o[1]=='\ns[s.length]=')o[1]='';
                                    o[o.length-1] = "\n;return (typeof(ret)=='string')?(ret.indexOf('$')!=-1?(apf.$llut=_lang,ret.replace(apf.$lrx,apf.$lrep)):ret):ret;";
                                }else{
                                    o[0] = with_options ? "with(_opts){var _u,_v,_w,ret = " : "var _u,_v,_w,ret = ";
                                    if(o[1]=='\ns[s.length]=')o[1]='';
                                    o[o.length-1] = "\n;if(!async)return (typeof(ret)=='string')?(ret.indexOf('$')!=-1?(apf.$llut=_lang,ret.replace(apf.$lrx,apf.$lrep)):ret):ret;async.id=1;if(!async.queue)async((typeof(ret)=='string')?(ret.indexOf('$')!=-1?(apf.$llut=_lang,ret.replace(apf.$lrx,apf.$lrep)):ret):ret);return null;"
                                }
                            }
                        }
                    }
                    else if (!codesegs) {
                        return [0, "", 0, null, null];
                    }
                }
                else if (xpathsegs == 0 &&  textsegs == 1 && !codesegs) {
                    // always return text even if you are async
                    return [0, o.slice(2, o.length - 2).join("")
                        .replace(/\\(["'])/g, "$1"), 0, null, jsmodels];
                }
                else if (xpathsegs == 1 && textsegs == 1 && codesegs == 0) {
                    if(always_async){
                        o[0] = with_options ? "with(_opts){var _u,_v,_w,ret = ":"var _u,_v,_w, ret = ";
                        if(o[1]=='\ns.push(')o[1]='';
                        o.length -= 3;
                        o[o.length] = "\n;async.id=1;async((typeof(ret)=='string')?(ret.indexOf('$')!=-1?(apf.$llut=_lang,ret.replace(apf.$lrx,apf.$lrep)):ret):ret);return null;"
                    }
                    else{
                        o[0] = with_options ? "with(_opts){var _u,_v,_w, ret = ":"var _u,_v,_w, ret = ";
                        if(o[1]=='\ns.push(')o[1]='';
                        o.length -= 3;
                        o[o.length] = "\n;return (typeof(ret)=='string')?(ret.indexOf('$')!=-1?(apf.$llut=_lang,ret.replace(apf.$lrx,apf.$lrep)):ret):ret;"
                        /*return [0, o.slice(4, o.length - 5).join('')
                            .replace(/\\(["'])/g, "$1"), 1, null, jsmodels];*/
                    }
                }
            }
            
            if(with_options) o[ol++] = '}'            
            
            var func = is_eventhandler
                ?(with_options
                    ? new Function("e","n", "_lang", "_opts", "_self", "async", o = o.join(""))
                    : new Function("e","n", "_lang", "_self", "async", o = o.join("")))
                :(with_options
                    ? new Function("n", "_lang", "_opts", "_self", "async", o = o.join(""))
                    : new Function("n", "_lang", "_self", "async", o = o.join("")));
        }
        catch(e) {
            // TODO: make a proper JPF exception with this information:
            
            if (e.t) {
                apf.console.error("Parse exception: " + e.t + " on line:"
                    + line_no + " col:" + (e.p - line_pos - 2));
            }
            else {
                apf.console.error("Compile exception: " + e.message + "\nCode: " + o);
            }
            
        }
        // TODO check API: xpathsegs counts how many xpaths are in here,
        // jsobjs has all the used jsobjects, o is the compiled string
        return [func, o, xpathsegs, jsobjs, jsmodels];
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
            apf.console.error(apf.formatJS(jsltFunc[1]));
            throw new Error(apf.formatErrorString(0, null, "JSLT parsing", "Could not execute JSLT with: " + e.message));
        }
        #endif */
    };
};
apf.JsltInstance = new apf.JsltImplementation();

// #endif