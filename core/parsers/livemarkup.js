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

//#ifdef __PARSER_LM

/**
 * @term livemarkup
 * Live Markup is an extension to Javascript, and it allows APF to have
 * a simple consistent syntax for all attribute values and templates.
 * Live markup is used for templating, rpc, data binding,
 * property binding, formatting and even events.
 * Live Markup generates text-output via the default-output of statements,
 * and APF maintains knowledge of all properties and data used to create
 * this output allowing for a Live update when any of this information changes.
 * Nearly all attributes in APF are processed as a live markup " " string
 * Some attributes (like events) and <?lm ?> blocks are processed as code.
 * LiveMarkup features:
 * <ol>
 *  <li>inline xpaths</li>
 *  <li>E4X-like xml literals</li>
 *  <li>automatic statement/expression output and concat</li>
 *  <li>code and xpath expansion in-strings</li>
 *  <li>virtual-sync of async calls</li>
 * </ol>
 * Examples:
 * <code>
 *    var x = [folder/@name]; // value of xpath
 *    [folder/@name] = 'hello'; // set an attribute
 *    [folder/file] += <file/>; // add a new file node to folder/file list
 *    var y = <folder><file name={x}/></folder> // e4x-style xml
 *    x; //automatic output
 *    <xml/>; // automatic output
 *    if(a)func(); // automatic output of function returnvalue
 *    x = 15; // not outputted, assignments are never output.
 *    var z = "string with jsvars: {x} and xpath: [folder/@name]";
 *    alert(comm.someRpcCall(x)); // async call returns sync value
 * </code>
 * LiveMarkup syntax has one conflict with normal JS syntax; an array of 1 item vs xpath.
 * Arrays are recognised if there is atleast one , present: [1,2] and 1 item: [,1]
 *
 * Another important feature of LiveMarkup is that its infinitely nestable:
 * Outer construct: inner constructs
 * <ol>
 *  <li>string: xpath, code</li>
 *  <li>xpath: code, xpath(its a sub-xpath when NOT after [)\w] or IS inside "str" or 'str' )</li>
 *  <li>code: xpath, code, string, xml</li>
 *  <li>xml: xpath, code</li>
 * </ol>
 * Example of code in xpath in xml in code in string, for the sake of argument:
 * <code>
 * var x = "str{<xml id=[xp{y}]/>}"
 * </code>
 * since code has an auto-output, it is also possible to use scope { } delimiters holding a value
 * and used as an expression.
 * var x = {..code with auto output..}
 * The ^ character at the beginning of a statement can force 'no output' but is very rarely needed.
 *
 * It is important to realise that Live Markup is converted to normal Javascript
 * in a single compile pass, and does not constitute black-magic.
 * As rarely debugging might force you to look at generated code, its useful to know it exists.
 * For instance:
 * XML literals are turned into normal JS strings: <xml/> becomes "<xml/>"
 * in generated code. This is different from E4X where they are special type of object.
 * xpaths and operators are turned into functioncalls: [xpath] becomes _val(_n,"xpath")
 * and nesting becomes concatenation: "a{x}b" becomes ("str"+(x)+"str")
 *
 * Live markup xpath reference
 * Different xpath types:
 * [xpath] - value xpath (string)
 * %[xpath] - single node
 * *[xpath] - node set
 * #[xpath] - number of nodes selected by xpath
 * $[symbol] - language 'xpath', fetches value from language symbol library
 * [model::xpath] - xpath value on model with name 'model'
 * [{x}::xpath] - xpath value on xml node or model with js variable x
 * [{rpc.thing()}::xpath] - xpath value on an rpc call
 * [xpath] = 'value' - assign text-value to xpath (nodeValue = ..)
 * [xpath] = <xml/> - replace node with right hand xml
 * [xpath] = xmlNode - replace node with right hand node, removing xmlNode from its old position
 * [xpath] += 'value' - appends text-value to nodeValue
 * [xpath] += <xml/> - appends the <xml/> after the selected node
 * [xpath] += xmlNode - appends the node and removes from its old position
 *
 * Macro reference
 * localName(n) - returns the localName of the context node or supplied argument
 * tagName(n) - tagName of context node or supplied argument
 * nodeValue(n) - value of context nore or supplied argment similar to [.]
 * local(n){..code..} - a codeblock with a new context node n, n can be xml-string too
 * each(set){..code..) iterates over the set. usually used as: each(*[xpath]){}
 *
 */

/**
 * @constructor
 * @parser
 *
 * @author      Rik Arends
 * @version     %I%, %G%
 * @since       3.0
 */
apf.lm = new (function(){

    var statement_lut = { // all js statements to see its NOT an expression
            "var": 1, "for": 1, "while": 1, "do": 1, "if": 1, "else": 1,
            "switch": 1, "case": 1, "break": 1, "continue": 1, "default": 1,
            "function":2, "return": 1, "try": 1, "catch": 1, "throw":1,
            "debugger": 1, "alert": 1, "confirm": 1,"setTimeout": 1,"setInterval": 1,"delete": 1, "export": 1, "import": 1,
            "label": 1, "foreach":1, "each": 1, "eachrev":1, "foreachrev":1, "node": 1, "local": 1, "yield": 1,
            "let":1, "finally":1, "delete":1
        },
        type_lut = { // used for optimizing the parse regexp
            "\n": 1, "\r\n": 1, "==":2, "++":2, "--":2, '"': 5, "'": 5,
            "<!--": 6, "-->": 6, "/*": 6, "//": 6, "*/": 6, "{": 7, "}": 8,
            "[": 9, "]": 10, "(": 11, ")": 12, "<": 13, ">": 14, "+=":2,
            "-=":2, "/=":2, "*=":2, "!=":2
        },
        type_close = { // handy
            "{": "}", "[": "]", "(": ")", "{{":"}"
        },
        xpath_axes = { // used to detect xpath axes or model
            "ancestor": 1, "ancestor-or-self": 1, "attribute": 1, "child": 1,
            "descendant": 1, "descendant-or-self": 1, "following": 1,
            "following-sibling": 1, "namespace": 1, "parent": 1, "preceding": 1,
            "self": 1
        },
        misc_tok = { // misc token lookup
            ";":1, ",":2, "^":3, "=":4, "+=":4, "-=":4, "/=":4, "*=":4, "/":5, ":":6
        },
        xpath_lut_code = { // which autoxpath to use when doing macro({xpath})
            "~": "_val(_n,", "%": "_nod(_n,", "*": "_nods(_n,", "#": "_cnt(_n,", "$": "_lng("
        },
        xpath_lut_text = { // which autoxpath to use when doing xpath macros in textmode
            "~": "_val(_n,", "%": "_xml(_n,", "*": "_xmls(_n,", "#": "_cnt(_n,", "$": "_lng("
        },
        xpath_lut_attr = { // xpath lut for node attributes
            "~": "_val(_n,", "%": "_val(_n,", "*": "_val(_n,", "#": "_cnt(_n,", "$": "_lng("
        },
        xpath_lut_node,
        xpath_lut_node_normal = { // normal xpath lookup
            "~": "_val(_n,", "%": "_xml(_n,", "*": "_xmls(_n,", "#": "_cnt(_n,", "$": "_lng("
        },
        xpath_lut_node_langedit = { // language edit xpath lookup
            "~": "_val(_n,", "%": "_xml(_n,", "*": "_xmls(_n,", "#": "_cnt(_n,", "$": "_lnged("
        },
        pre_regexp = {
            "[":1, "(":1, ",":1, "=":1, "return":1, "throw":1
        },
        pre_xpath = {
            "else":1, "return":1, "delete":1
        },
        pre_plain = {
            "do":1, "else":1, "try":1
        },
        op_lut = { // obj.prop += operator lut
            "=" : "_asn(", "+=": "_add(", "-=": "_sub(", "/=": "_div(", "*=": "_mul("
        },
        new_block = {
            "+":1, "%":1, "-":1, "/":1, "=":1, "(":1, "?":1, "|":1, "^":1, "[":1,
            "&":1, "*":1, "!":1, ":":1, "<":1, ",":1
        },
        out_context_word = { // token preceeding a word signalling a new output
            "{":1, "} ":1, ")":1, ")   ":1, ";":1, "\n":1, "else":1
        },
        out_context_paren = { // token preceeding a paren signalling a new output
            "{":1, ";":1, "\n":1, "else":1
        }, // special markers: ') ' tail of xpath macro. ')  ' func def, tok=')    ' its not an if while etc.
        markup_in_code_lut = {
            "} ":1, ")   ":1,// the } used when it wasnt a code-expression
            "(":1, /*")":1,*/ ";":1, "&":1, "^":1, "|":1, ",":1, '"':1, "'":1, "=":1,
            "!=":2,"+=":2, "-=":2, "/=":2, "*=":2, "?":1, "{":1, "}":1, ">":1, "[":1,
            /*"]":1,*/ "+":1, ":":1, "else":1, "return":1
        },
        block_autoappend = { // token preceeding block signalling auto append
            '"':1, "'":1, ">":1, "]":1, "}":1
        },
        unesc_lut = { // unescape in code and xpath mode
            "\\\"": "\"", "\\\'": "\'", "\\{": "{", "\\}": "}", "\\[": "[",
            "\\]": "]", "\\(":"(", "\\)":")", "\\\\":"\\"
        },
        call_exclusion = {
            "alert": 1, "confirm" :1, "setTimeout":1, "setInterval":1, "switch":1,
            "call":1, "return":1, "throw":1, "case":1, "catch":1,
            "abs":1,"acos":1,"asin":1,"atan":1,"atan2":1,"ceil":1,
            "cos":1,"exp":1,"floor":1,"log":1,"max":1,"min":1,
            "pow":1,"random":1,"round":1,"sin":1,"sqrt":1,"tan":1,"lin":1,"linear":1,
            "idx":1,"sort":1,"typeof":1
        },
        is_out_space = {
            " ":1, "\n":1
        },
        newline_notallowed = {
            "{":1, ";":1, "(":1, "\n":1
        },//@todo !verify and document! character escaping system
        unesc_str = { // unescape in string mode
            "\\{": "{", "\\}": "}", "\\[": "[", "\\]": "]", "\\(": "(", "\\)": ")"
        },
        unesc_txt = { // unescape in text mode
            "\\{" : "{", "\\}" : "}", "\\[" : "[", "\\]" : "]", "\\(" : "(",
            "\\)" : ")", "\\\\": "\\\\\\\\", "\\"  :"\\\\", "\\<" : "<", "\\>" : ">"
        },
        xml_code_operators = { // word to operand lookup table for easy use in xml
            "lte": "<=", "gte": ">=", "lt": "<", "gt": ">", "and": "&&", "or": "||",
            "andbin": "&", "orbin": "|", "LTE": "<=", "GTE": ">=", "LT": "<",
            "GT": ">", "AND": "&&", "OR": "||", "ANDBIN": "&", "ORBIN": "|"
        },
        xpath_macro = { // which autoxpath to use when doing macro({xpath})
            0 : "_val(_n,",
            1 : "_valcr(_n,_cr,",
            2 : "_nod(_n,",
            3 : "_nodcr(_n,_cr,",
            4 : "_nods(_n,",
            5 : "_xpt(_n,",
            6 : "_valst(_n,",
            7 : "_valed(_n,",
            8 : "_valattr(_n,",
            "foreach"   : "_nods(_n,",
            "each"      : "_nods(_n,",
            "foreachrev": "_nods(_n,",
            "eachrev"   : "_nods(_n,",
            "xabs"      : "_valst(_n,",
           // "edit"      : "_argwrap(_n,", 
           // "edit"      : "_val(_n,", // toggled by liveedit
            "local"     : "_nod(_n,",
            "tagName"   : "_nod(_n,",
            "localName" : "_nod(_n,",
            "xml"       : "_xmlq(",
            "_call"     : "_val(_n,"
        },
        xpath_model = { // which autoxpath to use when doing macro({xpath})
            "_val(_n,"      : "_valm(",
            "_valcr(_n,_cr,": "_valcr(0,_cr,",
            "_nod(_n,"      : "_nodm(",
            "_nodcr(_n,_cr,": "_nodcr(0,_cr,",
            "_nods(_n,"     : "_nodsm(",
            "_argwrap(_n,"  : "_argwrapm(",
            "_xml(_n,"      : "_xml(0,",
            "_xmls(_n,"     : "_xmls(0,",
            "_cnt(_n,"      : "_cntm(",
            "_xpt(_n,"      : "_xptm(",
            "_valst(_n,"    : "_valm(",
            "_valed(_n,"    : "_valed(0,",
            "_lng("         : "_lng(",
            "_lnged("       : "_lnged("
        },
        parserx = /(\r?[\n]|\/\*|\*\/|\/\/|\<\!\-\-|\-\-\>|[=\!+\/\*-]=|\+\+|\-\-|["'{(\[\])}\]\<\>]|$)|([ \t]+)|([a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF.$_][\w.$_]*)|(\d[x\d.]*)|(\\?[\w._?,:;!=+-\\\/^&|*"'[\]{}()%$#@~`<>]?)/g,
        selfrx = /(^|\|)(?!\@|text\(\)|\.\.|[\w\-\:]+?\:\:)/g, // inject self regexp
        macro_o = {},
        macro_c = {},
        macro_m = {},
        // config vars
        c_async_lut = apf.$asyncObjects || { // used to figure out if the thing before the. is an async obj
            "comm" :1,
            "rpc"  :1,
            "http" :1,
            "apf.ajax" :1
        },
        c_process_async,
        c_xpathmode,    // guess 'node' as the type for {} o_xpathpairs, 1 = node, 2 = nodes
        c_elemxpath,    // which xpath macro to use inside an element
        c_statexpath,   // which xpath to use for the stateful value
        c_injectself,   // add self:: in some o_xpathpairs
        c_propassign,   // support property assigns
        c_export,       // export function to some object
        // outputs
        o, ol,          // output and output len
        o_asyncs,       // number of async calls
        o_xpathpairs,   // all xpaths and their models in pairs
        o_props,        // the js properties found
        o_segs,         // segments at groundlevel
        o_xpaths,       // xpaths at groundlevel
        o_models,       // number of xpaths with models
        // temp and state vars
        s = [], sl,     // scopestack and scopestack len
        bt = [],        // backtrack lut
        bts = [],       // backtrack string stack
        parse_mode,     // the parse parse_mode
        scope,          // ol of a scope begni
        segment,        // the ol of a segment begin
        start_tok,      // the token a string or comment was started with
        str,str_len,           // length of the input string
        line_no,        // line number we are at
        nesting,        // nesting count
        // last state vars
        last_tok,       // last token
        last_type,      // last type
        last_dot,       // . pos when last token was a word
        last_model,     // last model found
        last_prop,      // last property found
        last_cmt_mode,  // the parse mode outside the comment
        last_cmt_tok,   // last token before comment
        last_cmt_type,  // last type before comment
        last_line,      // offset of last newline
        last_ns,        // last namespace found
        last_word;      // last word in code mode
    // macros used in code()
    macro_o["if"]       = "if(",
    macro_c["if"]       = ")",
    macro_o["while"]    = "while(",
    macro_c["while"]    = ")",
    macro_o["for"]      = "for(",
    macro_c["for"]      = ")",
    macro_o["switch"]   = "switch(",
    macro_c["switch"]   = ")",
    macro_o["catch"]    = "catch(",
    macro_c["catch"]    = ")",
    macro_c["function"] = ")  ";

    macro_o.foreach     =
    macro_o.each        = "\nfor(var _t=_t||[],_t=(_t.push(_n,0,(",
    macro_c.foreach     =
    macro_c.each        = ")||[]),_t);(_n=_t[_t.length-1][_t[_t.length-2]++])||(_t.length-=2,_n=_t.pop(),0);)",
    macro_o.foreachrev  =
    macro_o.eachrev     = "\nfor(var _t=_t||[],_t=(_t.push(_n,0,(",
    macro_c.foreachrev  =
    macro_c.eachrev     = ")||[]),_t);(_n=_t[_t.length-1][_t[_t.length-1].length-(_t[_t.length-2]++)-1])||(_t.length-=2,_n=_t.pop(),0);)",

    macro_o.local       = "\nfor(var _t=_t||[],_t=(_t.push(_n,((_n=_local(",
    macro_c.local       = ")),1)),_t);(_t[_t.length-1]--&&_n)||(_t.length--,_n=_t.pop(),0);)",
    macro_o._editlm     = "_valedx(true, ", // only serves to switch default xpath in edit([xpath])
    macro_o._editnormal = "_valedx(false, ", // only serves to switch default xpath in edit([xpath])
    macro_c.edit        = ")",
    macro_o.xabs        = "  (  ",
    macro_c.xabs        = "  )  ",
    
    macro_o.localName   = "_localName(_n",
    macro_c.localName   = ")",
    macro_o.output      = "_o.join(''",
    macro_c.output      = ")",
    macro_o.reset       = "(_o=[],l=0",
    macro_c.reset       = ")",
    macro_o.index       = "apf.getChildNumber.call(apf",
    macro_c.index       = ")",
    macro_o.item        = "(_t[_t.length-1][_t[_t.length-2]-1]",
    macro_c.item        = ")",
    macro_o.first       = "(_t[_t.length-2]==1",
    macro_c.first       = ")",
    macro_o.last        = "(_t[_t.length-2]==_t[_t.length-1].length",
    macro_c.last        = ")",
    macro_o.total       = "(_t[_t.length-1].length",
    macro_c.total       = ")",
    macro_o.pos         = "(_t[_t.length-2]-1",
    macro_c.pos         = ")",

    macro_o.tagName     = "_tagName(_n",
    macro_c.tagName     = ")",
    macro_o._nodeValue  = "_nodeValue(_n",
    macro_c._nodeValue  = ")",
    macro_c.async       = "])",
    macro_c.precall     = "])",
    macro_c._call       = ")";

    var call_args_lut = {
            _call     : ".call(_n",
            localName : macro_o.localName,
            tagName   : macro_o.tagName,
            nodeValue : macro_o.nodeValue,
            index : macro_o.index
        },

        // centralized code fragments used in parser/generator
        cf_block_o     = "(function(){var _o=[],_l=0;\n",
        cf_block_c     = ";return _l==1?_o[0]:_o.join('');})()",
        cf_async_o     = "_async(_n,_c,_a,_w,_f,this,",
        cf_async_m     = "',_a[++_a.i]||[",
        cf_obj_output  = "_r=",
        cf_mode_output,
        cf_str_output  = "_o[_l++]=",
        cf_def_output  = "",
        cf_func_o      = "{var _o=[],_l=0,_n=this;\n",
        cf_func_c      = ";\nreturn _l==1?_o[0]:_o.join('');}",

        // compile chunks used in compile/match
        cc_async_o     = "(_a=_a||{}).i=0;try{\n",
        cc_async_c     = "}catch(_e){if(_e.x)return;throw(_e);}\n",
        //cc_async_o     = "(_a=_a||{}).i=0;",
        //cc_async_c     = "",
        cc_pc_o        = "(_a=_a||{}).i=0;try{_precall(_w);",
        cc_pc_c        = "}catch(_e){if(_e.x)return;throw(_e);}",
        cc_opt_o       = "with(_w){",
        cc_opt_c       = "}",
        cc_v_blk_o     = "var _o=[],_l=0;_o[_l++]=",
        cc_v_blk_ob    = "var _o=[],_l=0;\n",
        cc_v_blk_c     = ";\nreturn _ret(_l==1?_o[0]:_o.join(''));",
        cc_v_blk_cb    = ";\n_c(_ret(_l==1?_o[0]:_o.join('')),apf.SUCCESS,apf.$lmx);apf.$lmx=null;",
        cc_v_ret_o     = "return _ret(",
        cc_v_ret_c     = ");",
        cc_v_cb_o      = "_c(_ret(",
        cc_v_cb_c      = "),apf.SUCCESS,apf.$lmx);apf.$lmx=null;\n",

        cc_o_blk_o     = "var _r=",
        cc_o_blk_ob    = "var _r;",

        cc_o_blk_c     = ";\nreturn _r;",
        cc_o_blk_cb    = ";\n_c(_r,apf.SUCCESS,apf.$lmx);apf.$lmx=null;",
        cc_o_blk_ce    = ";\n_c(0,apf.SUCCESS,apf.$lmx);apf.$lmx=null;;",
        cc_o_ret_o     = "return ",
        cc_o_ret_c     = "",
        cc_o_cb_o      = "_c(",
        cc_o_cb_c      = ",apf.SUCCESS);",
        cc_f_async_o   = "var _f=function(_n,_c,_w,_a){",
        cc_f_opt_o     = "var _f=function(_n,_w){",
        cc_f_o         = "var _f=function(_n){",
        cc_fc_async_o  = "var _f=function(_n,_c,_w,_cr,_a){",
        cc_fc_opt_o    = "var _f=function(_n,_w,_cr,){",
        cc_fc_o        = "var _f=function(_n,_cr){",
        cc_fe_async_o  = "var _f=function(event,_c,_w,_a,_n){",
        cc_fe_opt_o    = "var _f=function(event,_w,_n){",
        cc_fe_o        = "var _f=function(event,_n){",
        cc_f_c         = "}",
        cc_f_match_o   = "var _f=function(_m){",

        cc_m_m_blk     = ";\nif(_n=_r){if(!_n.nodeType)_n=_m;",
        cc_m_m_value_o = ";\nif(_n=",
        cc_m_m_value_c = "){if(!_n.nodeType)_n=_m;",
        cc_m_v_string  = "\nreturn ",
        cc_m_v_o       = "\nreturn _ret(",
        cc_m_v_c       = ");",
        cc_m_n_string  = "\nreturn _n;",
        cc_m_n_o       = "\nreturn (_r = (",
        // decision point for compileMatch node-mode for the return type
        cc_m_n_c       = "))?(_r.nodeType?_r:_n):(_r===null?null:_n);",

        cc_m_o         = "var _r, _n = _m;",
        cc_m_brk       = ";\n_n = _m;",
        cc_m_v_ret     = "\nreturn _ret(_nodeValue(_n));" ,
        cc_m_n_ret     = "\nreturn _n;" ,
        cc_m_c         = "\n}";

    function switchToBlock(no_output){ // used to switch expression mode to block mode
        var u, v;
        if (o[scope-1] == "{{")
            u = scope-1; // scan for our root expression block to switch to block
        else
            for (v = sl - 2, u = 0; v >= 0 && o[u=(s[v] & 0xfffffff) - 1] != "{{"; v -=2 ){};
        
        if (!no_output && ol > u + 1)  // inject auto output unless no output or nothing to output in buffer
            o[u] = cf_block_o + cf_str_output
        else
            o[u] = cf_block_o;
        parse_mode = 1;
    }

    function parser(tok, rx_lut, rx_white, rx_word, rx_num, rx_misc, pos){
        var u, v, w,
            type = rx_lut ? type_lut[rx_lut] : (rx_white ? 0 : (rx_word ? 3 : (rx_num ? 4 : (tok ? 2 : 15))));
        switch (parse_mode) {
            case 0: // =====================  expression parse_mode =========================
            case 1: // ==========================  block parse_mode =========================
                switch (type) {
                    case 0: // -------- whitespace --------
                        if ((last_type == 3 && last_tok!='$') || last_type == 4)
                            o[ol++] = " ";
                        else if(xpath_lut_code[last_tok])
                            last_type = 0;// make last_type visible to xpathmode select
                        break;
                    case 1: // -------- newline --------
                        line_no++,
                        last_line = pos;
                        if (o[ol-1] != "\n" && !newline_notallowed[last_tok])
                            o[ol++] = "\n";
                        if (xpath_lut_code[last_tok])
                            last_type = 0;// make last_type visible to xpathmode select
                        break;
                    case 2: // -------- misc --------
                        if (v = misc_tok[tok]) {
                            switch (v) {
                                case 1: // ';'
                                    if (!s[sl-1]) {// close = macro
                                        o[ol++] = ")",
                                        sl     -= 2;
                                    }

                                    if (!parse_mode) { // dont do ; inject newline instead
                                        if (o[ol-1] != "\n" && last_tok != "{" && last_tok != ";")
                                            o[ol++] = "\n";
                                    }
                                    else if(!sl || s[sl - 1]) // dont inject ; if we are in nested assignment macros
                                        o[ol++] = ";";
                                    break;
                                case 2: // ','
                                    if (!s[sl - 1]) { // close = macro
                                        o[ol++] = ")",
                                        sl     -= 2;
                                    }
                                    o[ol++] = ",";
                                    break;
                                case 3: //'^' // dont output
                                    if (o[ol-1] == "\n" || o[ol - 1] == ";" || last_tok=="{"
                                      || last_tok == "} " || ol == scope) { // dont output-shortcut requirements
                                        if (!parse_mode)
                                            switchToBlock();
                                        o[ol++] = "  "; // two spaces make it modify the output-ifs outcome
                                    }
                                    else
                                        o[ol++] = "^";
                                    break;
                                case 4: //'= += -= assignment macro mode
                                    if(last_tok!='<' && last_tok!='>'){
                                        // we should only switch to block when we are not in a ( ) scope
                                        if (!parse_mode && o[scope-1]!='(')
                                            switchToBlock(true);
                                        o[ol++] = tok;
                                        // lets scan in reverse to see if we have an output or a non-output

                                        for (v = ol; v >= scope && !statement_lut[o[v]] && !((o[v] == "  " 
                                            || o[v] == (nesting ? cf_str_output : cf_mode_output)) && (o[v]="",1)); v--){};

                                        if (last_type == 3 && last_dot>0 && last_tok.charAt(0)!="."){ // prop = macro
                                            if(c_propassign){
                                                ol -= 2;
                                                while (is_out_space[o[ol]])
                                                    ol--;
                                                w = last_tok;
                                                o[ol++] = op_lut[tok], o[ol++] = w.slice(0,last_dot), 
                                                o[ol++] = ",'", o[ol++] = w.slice(last_dot+1),
                                                o[ol++] = "',", s[sl++] = scope | (parse_mode << 28),
                                                s[sl++] = ""; // notabene, this stored item is checked everywhere
                                            }
                                        }
                                     }else{
                                        o[ol++] = tok;
                                    }break;
                                case 5: // '/' // regexp mode
                                    if (pre_regexp[last_tok]) {
                                        s[sl++] = scope | (parse_mode << 28);
                                        s[sl++] = o[ol++] = tok;
                                        scope   = segment = ol - 1;
                                        nesting++, parse_mode = 5, start_tok = tok;
                                    }
                                    else
                                        o[ol++] = "/";
                                    break;
                                case 6: // ':' // switch to {x:1} object mode
                                    if (sl > 2 && s[sl - 1] == "{{" && (ol < scope + 4 && last_type == 5)
                                      || (ol < scope + 3 && (last_type == 3 || last_type == 4))) {
                                        o[scope-1] = s[sl-1] = "{"
                                        parse_mode = (v = s[sl - 2]) >> 28;
                                        s[sl-2]    = v & 0xfffffff,
                                        nesting--;
                                    }
                                    else if(o[ol - 3] == "case" || (last_type == 5 && last_word == "case"))
                                        tok = ";"; //fixes auto output problem
                                    o[ol++] = ":";
                                    break;
                                default:
                                     o[ol++] = tok;
                                    break;
                            }
                        }
                        else
                            o[ol++] = unesc_lut[tok] || tok;
                        break;
                    case 3: // -------- word --------
                    case 4: // ------- number -------
                        if( v = xml_code_operators[tok] ){
                            o[ol++] = tok = v, type = 2;
                        } else {
                            v = u = w = 0;// last_word used for case 'bla bla':
                            last_dot = (last_word = tok).lastIndexOf(".");
                            if (tok.charAt(0) != '.' // .obj shouldnt trigger block
                              && ((v = (u = ((out_context_word[last_tok]  // check if we need to switch
                                    || o[ol - 1] == "\n")  && !new_block[last_tok]))
                                    && !s[sl - 1].indexOf("{") && ol > scope)
                                    || (w = statement_lut[tok])) && !parse_mode){ // check statement
                                if(w == 2 && s[sl - 1].indexOf("{")) w = 0; // (function() shouldnt trigger blockmode
                                switchToBlock(w);  // pass in statement_lut[tok] as outputflag
                            }
                            if (u && !s[sl - 1]) { // assign macro close
                                o[ol-1] == "\n" && (o[ol - 1] = ""), o[ol++] = ")",
                                o[ol++] = "\n", v = 1, sl -= 2;
                            }
                            if (v && parse_mode && !statement_lut[tok] && !call_exclusion[tok]) // inject output
                                o[ol++] = (nesting ? cf_str_output : cf_mode_output);

                            if (last_dot > 0 && tok.charAt(0) != ".") // store property
                                o_props[o[ol++] = last_prop = tok] = 1;
                            else o[ol++] =  tok;
                        }
                        break;
                    case 5: // -------- stringquotes --------
                        if ((v = (u = ((out_context_word[last_tok] || o[ol - 1]== "\n" )
                          && !new_block[last_tok])) && !s[sl - 1].indexOf("{")
                          && ol > scope) && !parse_mode) // check if we need to switch to block mode
                            switchToBlock();

                        if (u && !s[sl - 1]) { // close = macro
                            o[ol - 1] == "\n" && (o[ol - 1] = ""), o[ol++] = ")",
                            o[ol++] = "\n", v = 1, sl -= 2;
                        }
                        if (v) { // generate output
                            o[ol++] = (o[ol-2] != "\n" && block_autoappend[last_tok])
                                ? "+"
                                : (nesting ? cf_str_output : cf_mode_output);
                        }
                        else if (block_autoappend[last_tok])
                            o[ol++] = "+";

                        s[sl++] = scope | (parse_mode << 28), s[sl++] = o[ol++] = tok;
                        scope   = segment = ol - 1, nesting++, parse_mode = 5, start_tok = tok;
                        break;
                    case 6: // -------- comment --------
                        if (tok == "*/" || tok== "-->")
                            throw {
                                t: "Unmatched comment "+tok,
                                p: pos
                            };
                        last_cmt_mode = parse_mode, last_cmt_tok = last_tok,
                        last_cmt_type = last_type, parse_mode = 6, start_tok = tok;
                        break;
                    case 7: // -------- { --------
                        if (o[ol - 1] == ")  " || (o[ol - 2] == ")  " && ol--)) { // ')  ' is function def
                            if (s[sl - 1] != "(" && s[sl - 1] != "[") {
                                s[sl++] = scope | (parse_mode << 28),
                                s[sl++] = "{{", o[ol++] = cf_func_o,
                                scope = ol, parse_mode = 1, nesting++, o[ol++] = ""; // make the scope check pass
                            }
                            else {
                                s[sl++] = scope, s[sl++] = o[ol++] = tok, scope = ol;
                                parse_mode = 1;
                            }// for do else..etc below
                        }
                        else if ((macro_o[s[sl + 1]] && last_tok == ")   ") || pre_plain[last_tok]) {
                            s[sl++] = scope, s[sl++] = o[ol++] = tok, scope = ol;
                            o[ol++] = "";
                        }
                        else {
                            if ((v = (u = ((out_context_word[last_tok]||o[ol - 1] == "\n")
                              && !new_block[last_tok]))
                              && !s[sl - 1].indexOf("{") && ol > scope) && !parse_mode)
                                switchToBlock(); // block mode detection

                            if (u && !s[sl - 1]) { // close = macro
                                o[ol - 1] == "\n" && (o[ol - 1] = ""),
                                o[ol++] = ")", o[ol++] = "\n", v = 1, sl -= 2;
                            }
                            if (v) { // inject output, +''+ is when between two { } { } (supposedly)
                                o[ol++] = (o[ol - 2] != "\n" && block_autoappend[last_tok])
                                    ? "+''+"
                                    : (nesting ? cf_str_output : cf_mode_output);
                            }
                            else if (block_autoappend[last_tok]) // inject append
                                o[ol++] = (last_tok == "}") ? "+''+" : "+";

                            s[sl++] = scope | (parse_mode << 28), s[sl++] = o[ol++] = "{{";

                            if (!nesting && scope != ol) // count output segments on nesting 0
                                o_segs++;

                            nesting++, segment = scope = ol, parse_mode = 0;
                        }
                        break;
                    case 8: // -------- } --------
                        if (!s[sl - 1]) // close = macro
                            o[ol++] = ")", o[ol++] = "\n",sl -= 2;

                        if (type_close[v = s[--sl]] != (o[ol++] = tok))
                            throw {
                                t: "Cannot close " + v + " with " + tok,
                                p: pos
                            };

                        if (v == "{{") { // closing code block
                            if (scope == ol - 1) {
                                if( (s[sl - 1] >> 28) <= 1) // empty code in code
                                    o[scope-1] = "{", o[ol - 1] = "}";
                                else // empty code elsewhere
                                    o[scope - 1] = o[ol - 1] = "'";
                            }
                            else {
                                if (!parse_mode) { // expression wraps in ()
                                    o[scope - 1] = "(",
                                    o[ol - 1]    = ")";
                                }
                                else { // codeblock wraps in (function(){})()
                                    if (o[scope - 1] == cf_func_o) {
                                        if (scope == ol - 2)
                                            o[scope - 1] = "{", o[ol - 1] = "}";
                                        else
                                            o[ol - 1] = cf_func_c;
                                    }
                                    else
                                        o[ol - 1] = cf_block_c;
                                }
                            }
                            parse_mode = (v=s[--sl])>>28, scope = v&0x0fffffff;
                            segment = ol, nesting--;

                            if(!nesting) // count segs on nesting level 0
                                o_segs++;

                            if (parse_mode == 7) // attribute hack
                                o[ol++] = "+\"\\\"", parse_mode = 4;
                        } else scope = s[--sl]; // was object def or if(){}

                        break;
                    case 9: // -------- [ --------
                        if (((last_type == 3 && !pre_xpath[last_tok] && last_tok!='$') || last_tok == ")" || last_tok == "]") && o[ol - 1] != "\n") {
                            o[ol++] = "[", s[sl++] = scope | (parse_mode << 28), //was array index
                            s[sl++] = tok, segment = scope = ol;
                        }
                        else {
                            last_model = null;

                            if ((w = xpath_lut_code[last_tok])) {
                                ol--, last_tok = o[ol-1]; // xpath with *%$#
                            }
                            else {
                                w = xpath_macro[s[sl - 1]] || xpath_macro[nesting ? 0 : c_xpathmode];
                            }
                            if ((v = (u = ((out_context_word[last_tok] || o[ol - 1] == "\n")
                              && !new_block[last_tok])) && !s[sl - 1].indexOf("{")
                              && (ol > scope || s[sl - 1].length == 1)) && !parse_mode)
                                switchToBlock(); // check if we need to switch to block mode

                            if (u && !s[sl - 1]) { // close = macro
                                o[ol - 1] == "\n" && (o[ol - 1] = ""), o[ol++] = ")",
                                o[ol++] = "\n", v = 1, sl -= 2;
                            }

                            if (v) { // inject output
                                o[ol++] = (o[ol - 2] != "\n" && block_autoappend[last_tok])
                                    ? "+"
                                    : (nesting ? cf_str_output : cf_mode_output);
                            }
                            else if (block_autoappend[last_tok]) // inject append
                                o[ol++] = "+";

                            if(!nesting && ol!=scope)
                                o_segs++;
                            // store scope in bt for reparse of array
                            nesting++, s[sl++] = scope|(parse_mode<<28), s[sl++] = o[ol++] = w,
                            segment = scope = ol, bt[scope] = pos, parse_mode = 3;
                        }
                        break;
                    case 10: // -------- ] --------
                        if(!s[sl-1]) // close = macro
                            o[ol++]=")",sl -=2;

                        if ( type_close[v = s[--sl]] != (o[ol++] = tok))
                            throw {
                                t: "Cannot close " + v + " with " + tok,
                                p: pos
                            };

                        scope = s[--sl]&0xfffffff; // clean scope of possible parse_mode 1
                        break;
                    case 11: // -------- ( --------
                        if ( ((v = (u=((out_context_paren[last_tok]||o[ol-1]=="\n") &&
                            !new_block[last_tok])) && !s[sl-1].indexOf("{") &&
                            ol>scope)) && !parse_mode)
                            switchToBlock();

                        if (u && !s[sl-1]) // close = macro
                            o[ol-1]=="\n"&&(o[ol-1]=""),o[ol++]=")", o[ol++]="\n",v = 1,sl -=2;
                        
                        if (v && parse_mode) // inject output
                            o[ol++] = (nesting?cf_str_output:cf_mode_output), last_type = 0;

                        if (w = macro_o[last_tok]) {
                            if (o[ol-1]==" ") ol--; // support func ()
                            o[ol-1] = w, s[sl++] = scope, s[sl++] = last_tok, scope = segment = ol;
                        }
                        else {
                            if (last_type == 3) { // word(
                                if (last_dot < 0) { // no dot
                                    v = 0;
                                    if (last_tok == "function" || o[ol - 3] == "function" || o[ol - 4] == "function") {
                                        s[sl++] = scope, s[sl++] = "function", //func def
                                        o[ol++] = "(", scope = segment = ol;
                                        //TODO! check the depth with which functions are made global
                                        if(last_tok!="function" && c_export && sl==4){
                                            o[v=(o[ol - 4] == "function")?(ol-4):(ol-5)] =
                                                "var "+last_tok+" = "+c_export+"."+last_tok+" = function";
                                            o[v+2] = "";
                                        }
                                    }
                                    else { // its a call and not a new
                                        if (!call_exclusion[last_tok] && o[ol-3]!="new") {
                                            o[ol++] = ".call(_n", s[sl++] = scope,
                                            s[sl++] = "_call", scope = segment = ol;
                                        }
                                        else { // its an excluded call
                                            s[sl++] = scope, s[sl++] = o[ol++] = tok,
                                            scope = segment = ol;
                                        }
                                    }
                                }
                                else {
                                    if (last_dot > 1 && c_process_async && (c_async_lut[v = last_tok.substring(0,last_dot)] || c_async_lut[v = last_tok])) {// its an async call
                                    if (o[--ol] == " ")
                                        ol--;
                                    o[ol++] = cf_async_o, o[ol++] = v, o[ol++] = ",'";
                                    o[ol++] = last_tok.slice(last_dot + 1);
                                    o[ol++] = cf_async_m, s[sl++] = scope, s[sl++] = "async",
                                    scope = segment = ol, o_asyncs++;
                                    }
                                    else { // its a obj.prop() type call
                                        if(last_tok.indexOf('.')!=last_dot) // obj.prop.call();
                                            o_props[last_tok.slice(0,last_dot)] = 1;
                                            
                                        s[sl++] = scope, s[sl++] = o[ol++] = tok,
                                        scope = segment = ol;
                                    }
                                }
                            }
                            else { // function object call
                                s[sl++] = scope, s[sl++] = o[ol++] = tok,
                                scope = segment = ol;
                            } // dont store calls as props
                            if (last_tok == last_prop)
                                delete o_props[last_tok];
                        }
                        break;
                    case 12: // -------- ) --------
                        if (!s[sl - 1]) { // close = macro
                            o[ol-1] == "\n" && (o[ol-1] = ""), o[ol++] = ")",
                            o[ol++]="\n", v = 1, sl -= 2;
                        }

                        if (w = macro_c[v = s[--sl]]) { // closing a macro
                            if (v != "_call")
                                tok = ")   "; // make sure any [ ] doesnt get interpreted as array index
                            if ((u = call_args_lut[v]) && u != o[ol - 1])
                                o[scope - 1] = u + ",";// do , insertion for argless macros
                            o[ol++] = w; // write close-end of macro
                        }
                        else if (type_close[v] != (o[ol++] = tok)) {
                            throw {
                                t:"Cannot close " + v + " with " + tok,
                                p: pos
                            };
                        }
                        scope = s[--sl] & 0xfffffff; // scope should be unimpacted
                        break;
                    case 13: // -------- < --------
                        // check if < is markup or not
                        if (ol == scope || markup_in_code_lut[last_tok] || o[ol - 1] == "\n"){
                            if ((v = (u = ((out_context_word[last_tok] || o[ol - 1] == "\n")
                              && !new_block[last_tok])) && !s[sl - 1].indexOf("{")
                              && ol > scope) && !parse_mode)
                                switchToBlock(); // switch to block mode

                            if (u && !s[sl - 1]) { // close = macro
                                o[ol - 1] == "\n" && (o[ol - 1] = ""), o[ol++] = ")",
                                o[ol++] = "\n", v = 1, sl -= 2;
                            }
                            if (v) {
                                o[ol++] = (o[ol - 2] != "\n" && block_autoappend[last_tok])
                                    ? "+''+"
                                    : (nesting ? cf_str_output : cf_mode_output);
                            }
                            else if (block_autoappend[last_tok])
                                o[ol++] = "+";
                            // start markup mode with the markup-stack counting
                            last_ns = null, o[ol++] = '"', o[ol++] = "<", nesting++,
                            s[sl++] = scope | (parse_mode << 28), sl += 3,
                            s[sl - 2] = s[sl - 1] = 0;

                            segment = scope = ol - 1, parse_mode = 4;
                        }
                        else
                            o[ol++] = "<";
                        break;
                    case 14: // -------- < --------
                        o[ol++] = ">";
                        break;
                    case 15: // end
                        if (sl && !s[sl - 1]) { // close = macro
                            o[ol - 1] == "\n" && (o[ol - 1] = ""), o[ol++] = ")",
                            o[ol++] = "\n", v = 1, sl -= 2;
                        }
                        break;
                }
                break;
            case 2: // ==========================  text parse_mode ==========================
                switch (type) {
                    case 1: // -------- newline --------
                        line_no++, last_line = pos;
                        if (ol != scope && ol != segment) // only output when not first
                            o[ol++] = "\\n";
                        break;
                    case 2: // -------- misc --------
                        if (ol == segment) // segment connectors
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";

                        o[ol++] = unesc_txt[tok] || tok;
                        break;
                    case 3: // word
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";
                        if(tok.charAt(tok.length-1)=='$'){
                            o[ol++] = tok.slice(0,-1);
                            o[ol++] = tok = '$';// fix word$[xpath] 
                        }else o[ol++] = tok;
                        break;
                    case 5: // -------- stringquotes --------
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";

                        o[ol++] = (tok == '"') ? "\\\"" : "'";
                        break;
                    case 7: // -------- { -------- code mode
                        if (ol == segment){
                            if (ol != scope )
                                o[ol++] =  "+";
                        }
                        else
                            o[ol++] = "\"+", nesting || o_segs++;
                        s[sl++] = scope | 0x20000000, s[sl++] = o[ol++] = "{{",
                        nesting++, segment = scope = ol, parse_mode = 0;
                        break;
                    case 9:  // -------- [ --------  xpath mode
                        last_model = null; // get xpath macro
                        if ((w = xpath_lut_text[last_tok]) && o[ol - 1] == last_tok) {
                            if (--ol - 1 == scope)
                                ol --; // remove first ""
                        }
                        else // only select c_xpathmode when nesting == 0
                            w = xpath_macro[(nesting || scope != ol) ? 0 : c_xpathmode];

                        if (ol != scope) {
                            o[ol] = (ol++ == segment) ? "+" : (nesting || o_segs++, "\"+");

                            if (!nesting)
                                o_segs++;
                        }

                        s[sl++] = scope | 0x20000000, s[sl++] = o[ol++] = w,
                        segment = scope = ol, nesting++, parse_mode = 3;
                        break;
                    case 15: // -------- end --------
                        if (sl)
                            throw {
                                t: "Unclosed " + s[sl-1] + " found at end in textmode",
                                p: pos
                            };
                        if (ol != scope && ol != segment)
                            o[ol++] = "\"", nesting || o_segs++;
                        break;
                    default: // -------- default --------
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";
                        o[ol++] = tok;
                }
                break;
            case 3: // ==========================  xpath parse_mode =========================
                switch(type){
                    case 0: // -------- whitespace --------
                        if (ol != scope){ // strip initial spaces\l
                            if (ol == segment)
                                o[ol++] = "+\"";
                            o[ol++] = tok;
                        }
                        break;
                    case 1: // -------- newline --------
                        line_no++, last_line = pos;
                        break;
                    case 2: // -------- misc --------
                        if (tok == ":" && last_tok == ":" && !xpath_axes[w = o[ol - 2]] 
                          && ((v = s[sl - 2]) >> 28) != 6) { // found model::xpath split
                            if (o[ol - 2] == '+"') // model is calculated
                                o[ol - 2] = o[ol - 1] = "", last_model = "#";
                            else {
                                o[ol - 1] = '"';
                                if (segment == scope) // model is normal name
                                    last_model = o.slice(segment + 1, ol - 1).join("");
                                else // model is calculated
                                    last_model = "#";
                            }
                            if (!(w = xpath_model[o[scope - 1]]))
                                throw {
                                    t: "Invalid model found for: "+o[scope-1],
                                    p: pos
                                };

                            o[scope - 1] = w, o[ol++] = ",", segment = scope = ol;
                        }
                        else {
                            if (tok == "," && (v = (s[sl - 2] >> 28)) <= 1) { // xpath is an array in code
                                ol = scope-1, u = str.slice(bt[scope] + 1, pos + 1);
                                // fix up stack to not be an xpath but an array
                                last_type = 9, parse_mode = v, o[ol++] = last_tok = "[";
                                s[sl - 2] = (s[sl - 2] & 0xfffffff) | (parse_mode << 28),
                                s[sl - 1] = last_tok, segment = scope = ol, nesting--;

                                if (!nesting)
                                    o_xpaths--;
                                if (u.length > 1) { // ignore [, optimized escaping
                                    bts.push(str); // push str so str always is the string in replace
                                    (str = u).replace(parserx, parser); // reparse it
                                    str = bts.pop(); // pop it again
                                }
                            }
                            else {
                                if (ol == segment)
                                    o[ol] = (ol++ == scope) ? "\"" : "+\"";
                                o[ol++] = unesc_lut[tok] || tok;
                            }
                        }
                        break;
                    case 3: // word
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";                 
                        if(tok.charAt(tok.length-1)=='$'){
                            o[ol++] = tok.slice(0,-1);
                            o[ol++] = tok = '$';// fix word$[xpath] 
                        }else o[ol++] = tok;
                        break
                    case 5: // -------- stringquotes --------
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";
                        if (s[sl - 1] == "[") // strings only are used in [ ]
                            s[sl - 1] = tok;
                        else if(s[sl - 1] == tok) // close string
                            s[sl - 1] = "[";

                        if (tok == '"')
                            o[ol++] = "\\";
                        o[ol++] = tok;
                        break;
                    case 7: // -------- { --------
                        if (ol == segment) {
                            if (ol != scope)
                                o[ol++] = "+''+";
                        }
                        else
                            o[ol++] = "\"+";

                        s[sl++] = scope | 0x30000000, s[sl++] = o[ol++] = "{{",
                        nesting++, segment = scope = ol, parse_mode = 0;

                        if (last_model && s[sl - 3] != xpath_lut_text["$"]) {
                            o_xpathpairs.push(last_model, "#");
                            last_model = null, o_models++;
                        }
                        break;
                    case 9: // -------- [ --------
                        // lets see if we are an xpath
                        if (s[sl - 1] == "'" || s[sl - 1] == '"' || 
                            ((last_type != 3 || last_tok=='$') && last_tok != ")" && last_tok != "]") ) {
                            if (last_model)
                                o_xpathpairs.push(last_model, "#"), o_models++;
                            last_model = null;

                            if ((w = xpath_lut_text[last_tok]) && o[ol - 1] == last_tok)
                                ol--;
                            else
                                w = xpath_macro[0];

                            if (ol == segment){
                                if (ol != scope)
                                    o[ol++] = "+";
                            }
                            else o[ol++] = "\"+";

                            s[sl++] = scope | 0x30000000, s[sl++] = o[ol++] = w, nesting++,
                            segment = scope = ol, parse_mode = 3;
                        }
                        else {
                            if (ol == segment)
                                o[ol] = (ol++ == scope) ? "\"" : "+\"";

                            s[sl++] = scope|0x60000000, s[sl++] = o[ol++] = "["; // keep track of [, abuse mode 6
                        }
                        break;
                    case 10: // -------- ] --------
                        sl--, parse_mode = (w = s[--sl]) >> 28, w = w & 0x0fffffff;

                        if (parse_mode == 6){ // was part of [] internally to xpath, see above
                            if (s[sl + 1] != "[")
                                throw {
                                    t:"In xpath, cannot close " + s[sl + 1] + " with " + tok,
                                    p: pos
                                };
                            if (ol == segment)
                                o[ol] = (ol++ == scope) ? "\"" : "+\"";

                            o[ol++] = "]";
                            parse_mode = 3;
                        }
                        else {
                            if (ol == scope ) {
                                if ((s[sl] >> 28) <= 1) // empty array in code
                                    o[scope - 1] = "[", o[ol++] = "]";
                                else // empty xpath elsewhere
                                    o[scope - 1] = o[ol++] = "\"" ;
                                segment = ol;
                            }
                            else {
                                //if( s[sl+1] != '[' )
                                //    throw {t:"Unclosed string in xpath"+s[sl+1], p: pos};
                                if (ol != segment)
                                    o[ol++] = "\"";
                                if (segment == scope){ // we might have an xpath name
                                    v = o.slice(segment + 1, ol - 1).join("");
                                    if (c_injectself && o[scope - 1] != "," // inject self
                                      && v != (u = v.replace(selfrx, "$1self::"))
                                      && s[sl + 1] != xpath_lut_text["$"]) {
                                        o[scope+1] = v = u;
                                        for (u = scope + 2; u < ol - 1; u++)
                                            o[u] = "";
                                    }
                                }
                                else {
                                    if ((u = o[scope - 1]) != ",") {
                                        v = "#";
                                        if (c_injectself)// inject dyn self if dyn xpath
                                            o[scope - 1] = u + "_injself(", o[ol++] = ")";
                                    } 
                                    else
                                        v = "";
                                }
                                if (s[sl + 1] != xpath_lut_text["$"] && v) {
                                    o_xpathpairs.push(last_model, v);  // only store if not _lng
                                    if (last_model)
                                        o_models++;
                                }
                                o[ol++] = ") ", segment = ol; // close xpath with ') ' marker
                                //logw("CLOSING XPATH"+o.join('#')+nesting);
                                if (parse_mode == 7) // attribute assign in xml mode
                                    o[ol++] = "+\"\\\"", parse_mode = 4;
                            }
                            // lets output an xpath if we werent a language symbol
                            nesting--, last_model = null;
                            if (!nesting)
                                o_segs++, o_xpaths++;
                        }
                        scope = w;
                        break;
                    case 11: // -------- ( --------
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";
                        s[sl++] = scope | 0x30000000, // keep track of () in xpath
                        s[sl++] = o[ol++] =  "(";//, last_model = null;
                        break;
                    case 12: // -------- ) --------
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";

                        if (type_close[v = s[--sl]] != (o[ol++] = tok))
                            throw {
                                t:"Cannot close " + v + " with " + tok,
                                p: pos
                            };

                        scope = s[--sl] & 0xfffffff;
                        break;
                    case 15: // -------- end --------
                        throw {
                            t: "Unexpected end whilst parsing xpath",
                            p: pos
                        };
                        break;
                    default: // -------- default --------
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";
                        o[ol++] = tok;
                        break;
                }
                break;
            case 4: // ===========================  xml parse_mode ==========================
                switch (type) {// stack: '<'sl+4,outside=0, '</'sl-4  '>'sl-2,outside=1 '/>'sl-4,outside=1
                    case 0: // -------- whitespace --------
                        if (ol == segment)
                            o[ol++] = "+\"";

                        o[ol++] = " ", last_type = 0;
                        break;
                    case 1: // -------- newline --------
                        if (ol == segment)
                            o[ol++] = "+\"";

                        line_no++, last_line = pos, o[ol++] = "\\n", last_type = 1;
                        break;
                    case 2: // -------- misc --------
                        if (ol == segment)
                            o[ol++] = "+\"";
                        if (tok == "/" && last_tok == "<") {
                            sl -= 4; // </ closing tag, drop stacklevel by 4
                            if (s[sl] || s[sl + 2])
                                throw {
                                    t: "Unexpected closing tag whilst parsing xml",
                                    p: pos
                                };
                        }
                        else if (tok == ":" && last_type == 3 && o[ol - 2] == "<")
                            last_ns = last_tok; // found a namespace item in a tag
                        o[ol++] = unesc_txt[tok] || tok;
                        break;
                    case 3: // word
                        if (ol == segment)
                            o[ol++] = "+\"";        
                        if(tok.charAt(tok.length-1)=='$'){
                            o[ol++] = tok.slice(0,-1);
                            o[ol++] = tok = '$';// fix word$[xpath] 
                        }else o[ol++] = tok;
                        break                       
                    case 5: // -------- stringquotes --------
                        if (ol == segment)
                            o[ol++] = "+\"";

                        if (tok == '"')
                            o[ol++] = "\\";
                        o[ol++] = tok;
                        break;
                    case 6: // -------- comment --------
                        if (tok == "//" && !s[sl - 1]) {
                            if (ol == segment)
                                o[ol++] = "+\"";  // < char ups stack by 4, outside= 0
                            o[ol++] = tok;
                        }
                        else {
                            if (tok == "*/")
                                throw {
                                    t: "Unmatched comment "+tok,
                                    p: pos
                                };
                            last_cmt_mode = parse_mode, last_cmt_tok = last_tok,
                            last_cmt_type = last_type, parse_mode = 6, start_tok = tok;
                        }
                        break;
                    case 13: // -------- < --------
                        last_ns = null;
                        if (ol == segment)
                            o[ol++] = "+\"";  // < char ups stack by 4, outside= 0
                        o[ol++] = tok, s[sl] = s[sl + 2] = 0, sl += 4, s[sl - 1]=0;
                        break;
                    case 14: // -------- > --------
                        if (ol == segment)
                            o[ol++] = "+\"";

                        o[ol++] = tok;
                        if (last_tok != "<") {
                            if (last_tok == "/") {
                                sl -= 4; // self close tag /> drops stack -4
                                if (s[sl + 2])
                                    throw {
                                        t: "Unexpected / whilst parsing xml",
                                        p: pos
                                    }
                                if (o[ol - 3] == "<") // remove empty </> from output
                                    ol -= 2, o[ol - 1] = "";
                            }
                            else
                                sl -= 2; // <tag> nets stackdepth of 2
                            if (s[sl]) { // end of xml mode
                                nesting--, o[ol++] = "\"", scope = s[sl], segment = ol,
                                parse_mode = scope >> 28, scope = scope & 0x0fffffff;
                            }
                            else
                                s[sl - 1] = 1; // we are outside a tag, flag it on the stack
                        }
                        else // remove empty <> from output
                            ol--, o[ol - 1] = "";
                        break;
                    case 9:  // -------- [ --------  xpath mode
                        last_model = null;

                        if (last_tok == "!" && o[ol - 2] == "<" && !s[sl - 1]) { // CDATA mode
                            o[ol++] = tok, s[sl++] = scope | (parse_mode << 28);
                            s[sl++] = "]]>", scope = segment = ol - 1;
                            nesting++, parse_mode = 5;
                        }
                        else {
                            if (s[sl - 1]) { // we are outside a tag
                                if((v = xpath_lut_node[last_tok]))
                                    ol --;
                                else
                                    v = xpath_macro[c_elemxpath];
                                    
                                s[sl++] = scope | 0x40000000
                            }
                            else {
                                s[sl++] = scope | 0x40000000
                                if ((v = xpath_lut_attr[last_tok])) {
                                    ol--;
                                    if (o[ol - 1] == "=")
                                        last_tok = "=";
                                }
                                else
                                    v = xpath_macro[last_ns ? c_statexpath : 8];
                                
                                if (last_tok == "=")//0x7 flags xpath-in-missing-quotes <a i=[xp]/>
                                    o[ol++] = "\\\"", s[sl - 1] = scope | 0x70000000;
                            }
                            o[ol] = (ol++ == segment) ? "+''+" : "\"+";
                            nesting++, s[sl++] = o[ol++] = v,
                            segment = scope = ol, parse_mode = 3;
                        }
                        break;
                    case 7: // -------- { -------- code mode
                        if ( !s[sl - 1] && last_tok == "=") // 0x7 flags code-in-missing-quotes <a i={x}/>
                            o[ol++] = "\\\"", s[sl++] = scope | 0x70000000;
                        else
                            s[sl++] = scope | 0x40000000

                        o[ol] = (ol++ == segment) ? "+''+" : "\"+";
                        s[sl++] = o[ol++] = "{{", nesting++;
                        segment = scope = ol, parse_mode = 0;
                        break;
                    default:
                        if (ol == segment)
                            o[ol++] = "+\"";
                        o[ol++] = tok;
                        break;
                    case 15: // -------- end --------
                        throw {
                            t: "Unexpected end whilst parsing xml",
                            p: pos
                        };
                        break;
                }break
            case 5: // ==========================  string parse_mode ========================
                switch (type) {
                    case 1: // -------- newline --------
                        line_no++, last_line = pos;
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "\"" : "+\"";
                        o[ol++] = "\\n";
                        break;
                    case 2: // -------- misc --------
                        if (tok == "/" && s[sl - 1] == "/") { // regexp closing character
                            o[ol++]    = "/", scope = s[sl -= 2], segment = ol,
                            parse_mode = scope >> 28,
                            scope      = scope & 0x0fffffff, nesting--;
                        }
                        else {
                            if (ol == segment)
                                o[ol] = (ol++ == scope) ? "\"" : "+\"";
                            o[ol++] = (s[sl - 1] != "/" && unesc_str[tok]) || tok;
                        }
                        break;
                    case 3: // word
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "" : "+\"";       
                        if(tok.charAt(tok.length-1)=='$'){
                            o[ol++] = tok.slice(0,-1);
                            o[ol++] = tok = '$';// fix word$[xpath] 
                        }else o[ol++] = tok;
                        break                           
                    case 5: // -------- stringquotes --------
                        if (s[sl - 1] == tok) { // closed by matching quote
                            if (scope != segment) // string is segmented, output )
                                o[ol] = (ol++ != segment) ? (tok + ")") : ")";
                            else
                                o[ol++] = tok; // else just close
                            scope = s[sl -= 2], segment = ol, parse_mode = scope >> 28;
                            scope = scope & 0x0fffffff, nesting--;
                        }
                        else {
                            if (ol == segment)
                                o[ol] = (ol++ == scope) ? "\"" : "+\"";
                            o[ol++] = tok == '"' ? "\\\"" : tok;
                        }
                        break;
                    case 6: // -------- default --------
                        if (s[sl - 1] == "/" && tok == "*/") { // caught faux comment in regexp /a*/, is close
                            o[ol++] = "*/", scope = s[sl -= 2], segment = ol,
                            parse_mode = scope >> 28, scope = scope & 0x0fffffff, nesting--;
                        }
                        else {
                            if (ol == segment)
                                o[ol] = (ol++ == scope) ? "" : "+\"";
                            o[ol++] = tok;
                        }
                        break;
                    case 7: // -------- { -------- code mode
                        if (s[sl - 1] != "'" && s[sl - 1] != "/") {
                            if (s[sl - 1] == '"')
                                o[scope] = '("';
                            if (ol == segment) {
                                if (ol != scope)
                                    o[ol++] = "+";
                            }
                            else
                                o[ol++] = "\"+";
                            s[sl++] = scope | 0x50000000, o[ol++] =  s[sl++] = "{{",
                            nesting++, segment = scope = ol, parse_mode = 0;
                        }
                        else
                            o[ol++] = tok;
                        break;
                    case 9:  // -------- [ --------  xpath mode
                        if (s[sl - 1] != "'" && s[sl - 1] != "/" // ignore in '' and CDATA[, else xpath
                          && (s[sl - 1] == '"' && (o[scope] = '("') || ol != scope + 2
                          || last_tok != "CDATA") ) {
                            last_model = null;
                            if ((w = xpath_lut_text[last_tok])  && o[ol - 1] == last_tok)
                                ol--;
                            else
                                w = xpath_macro[0]

                            if (ol != scope)
                                o[ol] = (ol++ == segment) ? "+" : "\"+";

                            s[sl++] = scope | 0x50000000, s[sl++] = o[ol++] = w,
                            segment = scope = ol, nesting++, parse_mode = 3;
                        }
                        else
                            o[ol++] = tok;
                        break;
                    case 14: // -------- > --------
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "" : "+\"";
                        o[ol++] = tok;

                        if (s[sl - 1] == "]]>" && last_tok == "]" && o[ol - 3]=="]") { // check if CDATA close
                            scope = s[sl -= 2], parse_mode = scope >> 28;
                            scope = scope & 0x0fffffff, nesting--;
                            sl -= 4; // close the tag since we came from XML mode
                            if (s[sl]) // was last tag, jump up the stack one more.
                                nesting--, o[ol++] = "\"", scope = s[sl], segment = ol,
                                parse_mode = scope >> 28, scope = scope & 0x0fffffff;
                            else
                                s[sl - 1] = 1;
                        }
                        break;
                    case 15: // -------- end --------
                        throw {
                            t: "Unexpected end whilst parsing string",
                            p: pos
                        };
                        break;
                    default: // -------- default --------
                        if (ol == segment)
                            o[ol] = (ol++ == scope) ? "" : "+\"";
                        o[ol++] = tok;
                        break;
                }
                break;
            case 6: // =========================  comment parse_mode ========================
                switch (type) {
                    case 1: // -------- newline --------
                        line_no++, last_line = pos;
                        if (start_tok == "//")
                            parse_mode = last_cmt_mode,
                            tok = last_tok = last_cmt_tok,
                            type = last_type = last_cmt_type;
                        break;
                    case 6: // -------- comment --------
                        if ((start_tok == "/*" && tok == "*/") 
                          || (start_tok == "<!--" && tok == "-->")) {
                            parse_mode = last_cmt_mode,
                            tok = last_tok = last_cmt_tok,
                            type = last_type = last_cmt_type;
                        }
                        break;
                    case 15: // -------- end --------
                        if(start_tok != "//"){
                            throw {
                                t: "Unexpected end whilst parsing comment",
                                p: pos
                            }
                        } else {
                            parse_mode = last_cmt_mode,
                            tok = last_tok = last_cmt_tok,
                            type = last_type = last_cmt_type;                        
                            if (sl && !s[sl - 1]) { // close = macro
                                o[ol - 1] == "\n" && (o[ol - 1] = ""), o[ol++] = ")",
                                o[ol++] = "\n", v = 1, sl -= 2;
                            }  
                        };
                        break;
                }
                break;
        }
        if (type > 1)
            last_tok = tok, last_type = type;
    }

    this.lastCode = function(){
        if (typeof(o) == "object")
            return o.join("");
        return o;
    };

    function handleError(e, last_line, part, linenr){
        // TODO: make a proper APF exception with this information:
        if (e.t) {
            throw new Error(apf.formatErrorString(0, null,
                "Parsing live markup source",
                "Error whilst parsing: " + e.t + " on line:"+ line_no
                + " col:" + (e.p - last_line - 2)
                + (part ? (" part: " + part) : "") + "\n" + str));
        }
        else {
            throw new Error(apf.formatErrorString(0, null,
                "Compiling live markup function on line " + linenr,
                "Error whilst compiling: " + e.message 
                //+ "\nStack Trace:\n" + e.stack
                + "\nInput:\n" + str
                + "\nGenerated:\n" + apf.lm.lastCode()));
        }
    }

    /**
     * description of the method.
     * Remarks:
     *   function{type:1,xpaths:[ model,name], props: ['obj.propname','obj2.otherpropname'], asyncs=1}
     *   this is a normal compiled function with extra properties
     *   if the xpath model and/or name is '#' it means it is a runtime calculated modelname or xpath.
     *   obj{type:2, str:str} it was single string by cfg option !alwayscode
     *   obj{type:3, xpaths:[ model, name ] } it was a single xpath  by cfg simplexpath
     *
     * @param  {String}  str      the code to compile
     * @param  {Object}  options
     *   Properties:
     *   {Boolean} withopt     creates with(_w){  code using an options block. (reqd for precall)
     *   {Boolean} precall     wraps 1 async call into precallstore. call with _w._pc = 1 to precall, second time to execute.
     *   {Boolean} alwayscb    always call callback function, even if not async
     *   {Boolean} nostring    even generate code for a simple string
     *   {Number} xpathmode    default type of root level xpath in code mode
     *      Possible values:
     *      0: value
     *      1: value with createnode
     *      2: node
     *      3: node with createnode
     *      4: nodes
     *      5: xpathobj        returns a {model:model,xpath:xpath} object from xpaths
     *   {Boolean} parsecode   start in codemode. if 0 its textmode.
      *  {Boolean} nostate       dont' use _valst macro on [xpath] in namespaced xml.
     *   {Boolean} liveedit    use the _valed macro for <xml>[xpath]</xml> in namespaced xml.
     *   {Boolean} langedit    use of language items in namespaced xml text.
     *   {Boolean} injectself  injects self:: to suitable xpaths
     *   {Boolean} event       its an event thats being compiled, results in no returnvalue for this function.
     *                         and the first argument is now an 'e' for the event object.
     *   {Boolean} funcglobal  all functions defined in LM are made global

     *
     * @return  {Function} returns a function with extra properties
     *   Properties:
     *   {Number}  type         description
     *      Possible values:
     *      1  Function return type
     *      2  Parsed data is a pure string
     *      3  Function return type, but its a single xpath
     *      4  Function return type, but single propxs
     *   {Array}   xpaths       array of [model,xpath, model,xpath] pairs if model
     *                          or xpath is '#', its dynamic if model is null its a local xpath
     *   {Number}  models        number of models
     *   {Array}   props        description
     *   {Number}  asyncs       description
     *   {String]  str            optional, returned with type 2
     */
    var cache    = {},
        emptyCfg = {};
    this.resetCache = function(){
        cache = {};
    };
    var lmcache_rx = /^\s*~~(c\d+)~~/;
    this.compile = function(istr, cfg){
        if (!cfg)
            cfg = emptyCfg;
        if(istr == null || !istr.length){
            return (cfg.nostring || cfg.event)?function(){return istr}:{
                type: 2,
                str :istr
            };
        }
        // lets see if we need to fetch precompiled cachemarker
        var c, f, is_single_prop;
        if(istr.charAt(0)=="~" && (c=istr.match(lmcache_rx))){
            if(c=apf.lm_exec[c[1]]) return c;
            alert("ERROR, undefined live markup cache marker found:"+istr);
            return {type:2,str:istr};
        }
            
        var key = (cfg.xpathmode | (cfg.withopt && 0x10) | (cfg.precall && 0x20)
                | (cfg.alwayscb && 0x40) | (cfg.nostring && 0x80)  | (cfg.parsecode && 0x100)
                | (cfg.nostate && 0x200) | (cfg.liveedit && 0x400)| (cfg.langedit && 0x800)
                | (cfg.injectself && 0x1000) | (cfg.event && 0x2000) | (cfg.funcglobal && 0x4000)) + istr;
                
        if (c = cache[key])
            return c;

            
        c_injectself = cfg.injectself,  c_xpathmode = cfg.xpathmode||0,
        c_statexpath = cfg.nostate ? 0 : 6, c_elemxpath = 0;
        c_export = cfg.funcglobal?"self":(cfg.withopt?"_w":null);
        c_process_async = !cfg.event;

        xpath_macro.edit = cfg.liveedit ? "_argwrap(_n," : "_argwrap(_n,";//"_val(_n,";
        macro_o.edit     = cfg.liveedit ? macro_o._editlm : macro_o._editnormal;
        
        xpath_lut_node = cfg.langedit ? xpath_lut_node_langedit : xpath_lut_node_normal;

        o_props = {}, o_xpathpairs = [], s = [], o = ["","","",""], str = istr,
        str_len = str.length;
        ol = scope = segment = o.length,
        o_segs = o_xpaths = o_asyncs = o_models = nesting = line_no = last_type = last_line = 0;

        if (cfg.parsecode) {
            parse_mode = 0, sl = 2, s[0] = ol, s[1]  = "{{", last_tok = "{",
            cf_mode_output = cfg.event ? "" : (c_xpathmode <= 1 ? cf_str_output : cf_obj_output);
        }
        else
            parse_mode = 2, sl = last_tok = 0, cf_mode_output = cf_str_output;

        if (cfg.nothrow) {
            str.replace(parserx, parser);
        }
        else {
            try {
                str.replace(parserx, parser);
            }
            catch(e) {
                handleError(e, last_line);
                return null;
            }
        }
        
        if (cfg.parsecode) {
            if (nesting || s[sl - 1].length == 1)
                handleError({
                    t: "Unclosed " + s[sl-1] + " found at end in codemode",
                    p: str_len
                },last_line);
            if (segment!=ol)
                o_segs++
        }else if( (ol==7 || ol==8) && o_segs == 1){
            is_single_prop = 0;
            for(c in o_props)is_single_prop++;
            if(is_single_prop!=1)is_single_prop = 0;  
        }
        if ((!cfg.nostring && !cfg.event)&& (parse_mode == 2 && segment == 4 || ol == 4)) {
            return {
                type: 2,
                str : o.slice(5, -1).join("").replace(/\\n/g, "\n").replace(/\\"/g, '"')
            }; // string only
        }
        if (o_asyncs || cfg.alwayscb) {

            if (cfg.event) { // event
                if (parse_mode == 1)
                    o[3] = "";
                o[ol++] = cc_o_blk_ce;
            }
            else if (c_xpathmode) { // object return
                if (parse_mode == 1) {
                    o[3]    = (o[3] != cf_block_o) ? cc_o_blk_o : cc_o_blk_ob,
                    o[ol++] = cc_o_blk_cb; 
                }
                else
                    o[3] = cc_o_cb_o, o[ol++] = cc_o_cb_c;
            }
            else { // value return
                if (parse_mode == 1)
                    o[3] = (o[3] != cf_block_o) ? cc_v_blk_o : cc_v_blk_ob,
                    o[ol++] = cc_v_blk_cb;
                else
                    o[3] = cc_v_cb_o, o[ol++] = cc_v_cb_c;
            }
            
            if (o_asyncs) { 
                // for parse_mode == 1 we can squeeze in before [3] and cb close
                // else we put var _r= in 3 and put our ending last and put
                // the cb at the end
                if(parse_mode==1){
                    if (cfg.precall)
                        o[2] = cc_pc_o, o[ol-1] = cc_pc_c + o[ol-1];
                    else
                        o[2] = cc_async_o, o[ol-1] = cc_async_c + o[ol-1];
                }else{
                    o[ol++] = o[3] + '_r' + o[ol-2];
                    if (cfg.precall)
                        o[2] = cc_pc_o, o[3] = cc_o_blk_o, o[ol-2] = cc_pc_c;
                    else
                        o[2] = cc_async_o, o[3] = cc_o_blk_o, o[ol-2] = cc_async_c;
                }
             }

            if (cfg.withopt)
                o[1] = cc_opt_o, o[ol++] = cc_opt_c;
                
            o[0] = cfg.event 
                ? cc_fe_async_o
                : ((c_xpathmode == 1 || c_xpathmode == 3) ? cc_fc_async_o : cc_f_async_o);
            o[ol++] = cc_f_c;
        }
        else {
            if (cfg.event) { // event
                if (parse_mode == 1)
                    o[3] = "";
            }
            else if(c_xpathmode) { // object return
                if (parse_mode == 1) {
                    o[3]    = (o[3] != cf_block_o) ? cc_o_blk_o : cc_o_blk_ob,
                    o[ol++] = cc_o_blk_c;
                }
                else
                    o[3] = cc_o_ret_o, o[ol++] = cc_o_ret_c;
            }
            else { // value return
                if (parse_mode == 1) {
                    o[3]    = (o[3] != cf_block_o) ? cc_v_blk_o : cc_v_blk_ob,
                    o[ol++] = cc_v_blk_c;
                }
                else
                    o[3] = cc_v_ret_o, o[ol++] = cc_v_ret_c;
            }
            if (cfg.withopt)
                o[2] = cc_opt_o, o[ol++] = cc_opt_c;

            o[0] = cfg.event
                ? (cfg.withopt ? cc_fe_opt_o : cc_fe_o)
                : (cfg.withopt
                    ? ((c_xpathmode == 1 || c_xpathmode == 3) ? cc_fc_opt_o : cc_f_opt_o)
                    : ((c_xpathmode == 1 || c_xpathmode == 3) ? cc_fc_o : cc_f_o));
            o[ol++] = cc_f_c;
        }

        if (cfg.nothrow) {
            f = apf.lm_exec.compile(o.join(""));
        }
        else {
            try {
                f = apf.lm_exec.compile(o.join(""));
            }
            catch(e){
                if (!apf.isIE) {
                    var oErr = window.onerror;
                    window.onerror = function(x,y,line){
                        window.onerror = oErr;
                        handleError(e, last_line, null, line);
                        return true;
                    }
                    apf.include("", "", null, o.join(""));
                    window.onerror = oErr;
                }
                else {
                    handleError(e,last_line);
                }
                return null;
            }
        }
        f.type   = (o_segs == 1 && o_xpaths == 1) ? 3 : (is_single_prop?4:1);
        f.xpaths = o_xpathpairs, f.models = o_models,
        f.props  = o_props, f.asyncs = o_asyncs;

        cache[key] = f;
        return f;
    };

    /**
     * description of the method.
     * Remarks:
     * @param  {String}  str      the code to compile
     * @param  {Object}  options
     *   Properties:
     *   {Boolean} node      tries to return a node, used as a dual-compile with 'normal mode'
     *
     * @return  {Function} returns a function with extra properties
     *   Properties:
     *   {Number}  type         description
     *      Possible values:
     *      1  Function return type
     *      2  Parsed data is a pure string
     *      3  Function return type, but its a single xpath
     *   {Array}   xpaths       array of [model,xpath, model,xpath] pairs if model
     *                          or xpath is '#', its dynamic if model is null its a local xpath
     *   {Number}  models        number of models
     *   {Array}   props        description
     *   {Number}  asyncs       description
     *   {String]  str          optional, returned with type 2
     */
    
    this.compileMatch = function(strarray, cfg){
        if (!cfg)
            cfg = emptyCfg;

        o_props = {}, o_xpathpairs = [], o = [cc_f_match_o, cc_m_o], s = [],
        nesting = 0, ol = o.length, xpath_lut_node = xpath_lut_node_normal;

        for (var st, ob, i = 0, j = strarray.length; i < j; i += 2) {
            if (str = strarray[i]) {
                str_len = s.length, c_xpathmode = 2;
                if (i)
                    o[ol++] = cc_m_brk;
                o[ol++] = "";
                s[0] = ob = ol = scope = segment = o.length, cf_mode_output = cf_obj_output;
                line_no = last_type = o_segs = o_xpaths = o_asyncs = parse_mode = last_line = 0;
                sl = 2, s[1]  = "{{", last_tok = "{";
                c_injectself = 1;

                if (cfg.nothrow) {
                    str.replace(parserx, parser);
                }
                else {
                    try {
                        str.replace(parserx, parser);
                    }
                    catch(e) {
                        handleError(e,last_line);
                        return null;
                    }
                }

                if (nesting || s[sl - 1].length == 1)
                    handleError({
                        t: "Unclosed " + s[sl - 1] + " found at end in codemode",
                        p: str_len
                    });

                if (o_asyncs)
                    handleError({t:"Asynchronous calls not supported in match/value"});

                if (parse_mode == 1) { // block mode
                    o[ob - 1] = (o[ob - 1] != cf_block_o) ? cf_mode_output : "",
                    o[ol++]   = cc_m_m_blk;
                }
                else // value mode
                    o[ob-1] = cc_m_m_value_o, o[ol++] = cc_m_m_value_c;
            }
            if (str = strarray[i + 1]) {
                str_len = s.length;
                if(!strarray[i] && i)
                    o[ol++] = cc_m_brk;
                o[ol++] = "";
                ob = ol = scope = segment = o.length, cf_mode_output = cf_str_output;
                c_xpathmode = c_injectself = last_tok = sl = line_no = o_segs = o_xpaths =
                last_type = o_asyncs = last_line = 0;
                if(cfg.node)
                    c_xpathmode = 2;
                parse_mode = 2, c_injectself = 0;
                
                if (cfg.nothrow) {
                    str.replace(parserx, parser);
                }
                else {
                    try {
                        str.replace(parserx, parser);
                    }
                    catch(e) {
                        handleError(e,last_line);
                        return null;
                    }
                }

                if (o_asyncs)
                    handleError({t:"Asynchronous calls not supported in match/value"});
                
                if(cfg.node){
                    if (parse_mode == 2 && segment == ob || ol == ob)
                        o[ob-1] = cc_m_n_string;
                    else
                        o[ob-1] = cc_m_n_o, o[ol++] = cc_m_n_c;
                }else{
                    if (parse_mode == 2 && segment == ob || ol == ob)
                        o[ob-1] = cc_m_v_string;
                    else
                        o[ob-1] = cc_m_v_o, o[ol++] = cc_m_v_c;
                }

                if (strarray[i])
                    o[ol++] = cc_m_c;
                else
                    break;
            }
            else {
                if (!strarray[i])
                    handleError({t:"Both match and value are empty"});

                if(cfg.node)
                    o[ol++] = cc_m_n_ret;               
                else
                    o[ol++] = cc_m_v_ret;               
                
                c_xpathmode = 2;
                    
                o[ol++] = cc_m_c;
            }
        }
        o[ol++] = cc_f_c;

        var f;
        if (cfg.nothrow) {
            f = apf.lm_exec.compile(o.join(""));
        }
        else {
            try{
                f = apf.lm_exec.compile(o.join(""));
            }
            catch(e){
                handleError(e,last_line);
                return null;
            }
        }

        f.type  = 1, f.xpaths = o_xpathpairs,
        f.props = o_props, f.asyncs = o_asyncs;
        return f;
    };

    this.setWarnLevel = function(lvl){
        apf.lm_exec.setWarnLevel(lvl);
    };
    
    this.parseExpression = function(istr, cfg){
        if (!cfg)
            cfg = emptyCfg;

        o_props = {}, o_xpathpairs = [], o = [], s = [],
        nesting = 0, xpath_lut_node = xpath_lut_node_normal;
        str = istr, str_len = str.length;
        ob = ol = scope = segment = o.length, cf_mode_output = cf_str_output;
        c_xpathmode = c_injectself = last_tok = sl = line_no = o_segs = o_xpaths =
        last_type = o_asyncs = last_line = 0;
        parse_mode = 2;
        
        if (cfg.nothrow) {
            str.replace(parserx, parser);
        }
        else {
            try {
                str.replace(parserx, parser);
            }
            catch(e) {
                handleError(e,last_line);
                return null;
            }
        }
        return o.join('');
    }

    
})();

// apf lm_exec makes sure there is no scope pollution for eval'ed live markup.
apf.lm_exec = new (function(){
    //#ifdef __WITH_NAMESERVER
    var wlvl = 1; // 0: no warnings 1: language/models missing, 2:nodes missing, 3:all failed xpaths

    //warning functions
    this.setWarnLevel = function(lvl){
        wlvl = lvl;
    };

    function wxpath(x, t){
        apf.console.warn("Live Markup warning in " + t + ", no results for xpath: '" + x + "'");
    }

    function wnode(x, t){
        apf.console.warn("Live Markup warning in " + t + ", xpath on null node: '" + x + "'");
    }

    function wmodel(m, x, t){
        apf.console.log("Live Markup warning in " + t + ", xpath on empty model: '" + m + "' xpath: '" + x + "'");
    }

    function wlang(x, t){
        apf.console.log("Live Markup warning in " + t + ", language symbol not found: '" + x + "'");
    }

    // xml parse function used by all livemarkup objects
    function xmlParse(str){
        var n = apf.getXmlDom("<_apflmlist_>" + str + "</_apflmlist_>");
        if (!n || !(n = n.documentElement))
            return null;
        return (n.firstChild == n.lastChild) ? n.firstChild : n;
    }

    // value of node by xpath
    function __val(n, x){
        if (!n)
            return (/*#ifdef __DEBUG*/wlvl > 1 && wnode(x),/*#endif*/"")
        return (n = (!n.nodeType && n || (n = n.selectSingleNode(x)) //!= 1 
          && (n.nodeType != 1 && n || (n = n.firstChild) && n.nodeType!=1 && n)))
          && n.nodeValue || (/*#ifdef __DEBUG*/wlvl > 2 && wxpath(x, "_val"),/*#endif*/"");
    }

    var __valattrrx = /(["'])/g;
    function __valattrrp(m,a){
        return m=='"'?"&quot;":"&apos;";
    }
    function __valattr(n, x){
        if (!n)
            return (/*#ifdef __DEBUG*/wlvl > 1 && wnode(x),/*#endif*/"")
        return (n = (n.nodeType != 1 && n || (n = n.selectSingleNode(x)) 
          && (n.nodeType != 1 && n || (n = n.firstChild) && n.nodeType!=1 && n)))
          &&  n.nodeValue.replace(__valattrrx,__valattrrp) || (/*#ifdef __DEBUG*/wlvl > 2 && wxpath(x, "_val"),/*#endif*/"");
    }

    
    // value of model node by xpath
    function __valm(m, x){
        var n;
        if (!m || !(n = (m.charAt && ((m.charAt(0) == "<" && xmlParse(m))
          || ((n = apf.nameserver.lookup.model[m]) && n.data)))
          || (m.$isModel ? m.data : (m.charAt ? 0 : m))))
            return (/*#ifdef __DEBUG*/wlvl > 0 && wmodel(m, x, "_valm"),/*#endif*/"");
        return (n = (n.nodeType != 1 && n || (n = n.selectSingleNode(x)) 
          && (n.nodeType != 1 && n || (n = n.firstChild) && n.nodeType!=1 && n)))
          && n.nodeValue || (/*#ifdef __DEBUG*/wlvl > 2 && wxpath(x),/*#endif*/"");
    }

    function __nod(n, x){           // node by xpath
        return n ? n.selectSingleNode(x) : (/*#ifdef __DEBUG*/wlvl > 1 && wnode(x, "_nod"),/*#endif*/null);
    }

    function _nods(n, x){           // array of nodes by xpath
        return n ? n.selectNodes(x) : (/*#ifdef __DEBUG*/wlvl > 1 && wnode(x, "_nods"),/*#endif*/[]);
    }

    function __nodm(m, x){          // node of model by xpath
        var n;
        if (!m || !(n = (m.charAt && ((m.charAt(0) == "<" && xmlParse(m))
          || ((n = apf.nameserver.lookup.model[m]) && n.data)))
          || (m.$isModel ? m.data : (m.charAt ? 0 : m))))
            return (/*#ifdef __DEBUG*/wlvl > 0 && wmodel(m, x, "_nodm"),/*#endif*/null);

        return n.selectSingleNode(x);
    }

    function _nodsm(m, x){          // array of nodes from model by xpath
        var n;
        if (!m || !(n = (m.charAt && ((m.charAt(0) == "<" && xmlParse(m))
          || ((n = apf.nameserver.lookup.model[m]) && n.data)))
          || (m.$isModel ? m.data : (m.charAt ? 0 : m))))
            return (/*#ifdef __DEBUG*/wlvl > 0 && wmodel(m, x, "_nodsm"),/*#endif*/[]);

        return n.selectNodes(x);
    }

    function __cnt(n, x){        // count nodes by xpath
        return n ? n.selectNodes(x).length:(/*#ifdef __DEBUG*/wlvl > 1 && wnode(x, "_cnt"),/*#endif*/0);
    }

    function __cntm(m, x){      // count nodes from model by xpath
        var n;
        if (!m || !(n = (m.charAt && ((m.charAt(0) == "<" && xmlParse(m))
          || ((n = apf.nameserver.lookup.model[m]) && n.data)))
          || (m.$isModel ? m.data : (m.charAt ? 0 : m))))
            return (/*#ifdef __DEBUG*/wlvl>0&&wmodel(m,x,"_cntm"),/*#endif*/0);

        return n.selectNodes(x).length;
    }

    function _xpt(n, x){        // return the query wrapped in an object
        return {
            xpath   : x,
            toString: function(){
                return "LM Xpath object: " + this.x
            }
        };
    }

    function _xptm(m, x){       // return the query with model wrapped in an object
        if (m && !m.$isModel) {
            var node = m;
            m = apf.xmldb.findModel(m);
            x = apf.xmlToXpath(node, m.data) + "/" + x;
        }
        
        return {
            model:    m,
            xpath:    x,
            toString: function(){
                return "LM Xpath object with model: " + this.x
            }
        };
    }

    //----- the following functions are combined model and normal mode ------

    function _xml(n, m, x){     // serialize node by xpath via .xml
        if(n) x = m;
        else if(!m || !(n=(m.charAt && ((m.charAt(0)=="<" && xmlParse(m)) ||
            ((n = apf.nameserver.lookup.model[m]) && n.data))) ||
        (m.$isModel?m.data:(m.charAt?0:m))))
            return (/*#ifdef __DEBUG*/wlvl>0&&wmodel(m,x,"_xml"),/*#endif*/"");

        return (n && (n = n.selectSingleNode(x))) && n.xml ||
        (/*#ifdef __DEBUG*/wlvl>0&&!n&&wnode(x,"_xml"),/*#endif*/"");
    }

    function _xmls(n, m, x){    // serialize nodes by xpath with .xml concatenated
        if(n) x = m;
        else if(!m || !(n=(m.charAt && ((m.charAt(0)=="<" && xmlParse(m)) ||
            ((n = apf.nameserver.lookup.model[m]) && n.data))) ||
        (m.$isModel?m.data:(m.charAt?0:m))))
            return (/*#ifdef __DEBUG*/wlvl>0&&wmodel(m,x,"_xmls"),/*#endif*/"");
        for(var i = 0,j = ((n=n.selectNodes(x))).length,o = [];i<j;i++)
            o[i] = n[i].xml;
        return o.join("");
    }

    function _valcr(n, cr, m, x){ // value with a create flag
        if(n) x = m;
        else if(!m || !(n=(m.charAt && ((m.charAt(0)=="<" && xmlParse(m)) ||
            ((n = apf.nameserver.lookup.model[m]) && n.data))) ||
        (m.$isModel?m.data:(m.charAt?0:m))))
            return (/*#ifdef __DEBUG*/wlvl>0&&wmodel(m,x,"_valcr"),/*#endif*/"");

        if(cr){
            apf.createNodeFromXpath( ni, x );
        }else
        if( n = ni.selectSingleNode(x) ){
            return (n = (n.nodeType != 1 && n || (n = n.selectSingleNode(x)) &&
                (n.nodeType != 1 && n || (n = n.firstChild) && n.nodeType!=1 && n))) && n.nodeValue || ""
        }
        return (/*#ifdef __DEBUG*/wlvl>2&&wxpath(x,"_valcr"),/*#endif*/"");
    }

    function _nodcr(n, cr, m, x){ // node with create flag
        if(n) x = m;
        else if(!m || !(n=(m.charAt && ((m.charAt(0)=="<" && xmlParse(m)) ||
            ((n = apf.nameserver.lookup.model[m]) && n.data))) ||
        (m.$isModel?m.data:(m.charAt?0:m))))
            return (/*#ifdef __DEBUG*/wlvl>0&&wmodel(m,x,"_nodcr"),/*#endif*/null);
        return n.selectSingleNode(x) || (cr && apf.createNodeFromXpath( n, x ));
    }

    function _valst(n, x){      // a value with state holding
        var m = apf.xmldb.findModel(n);
        if(!m)
            return (/*#ifdef __DEBUG*/wlvl>0&&wmodel(m,x,"_valst"),/*#endif*/"");
        return "[" + m.id + "::" + apf.xmlToXpath(n, m.data, true) + (!x || x == "." ? "" : "/" + x) + "]";
    }

    function _asn(o, p, v){     // assign propert
        if(!o || typeof(o)!="object")
            throw new Error(apf.formatErrorString(0,0,"LM Property Assign",
                "Cannot assign property on non object, property:"+p));

        if(o.setAttribute)
            o.setAttribute(p,v);
        else
            o[p] = v;
        return v;
    }

    function _add(o, p, v){     // += property
        return _asn(o,p,o && o[p]+v);
    }

    function _sub(o, p, v){     // -= propery
        return _asn(o,p,o && o[p]-v);
    }

    function _div(o, p, v){     // /= property
        return _asn(o,p,o && o[p]/v);
    }

    function _mul(o, p, v){     // *= property
        return _asn(o,p,o && o[p]*v);
    }

    // macro implementations
    function _local(n){         // local(x) for local n
        // check what n is.. if string parse
        if(n && n.charAt && n.charAt(0)=="<")
            return apf.getXmlDom(n).documentElement;
        /*#ifdef __DEBUG*/if(!n && wlvl>1)wnode("-","_local");/*#endif*/
        return n;
    }

    function _tagName(n1, n2){  // tagname macro
        return (n2 && n2.tagName) || (n1 && n1.tagName);
    }

    function _localName(n1, n2){    // localname macro
        return (n2 && n2[apf.TAGNAME]) || (n1 && n1[apf.TAGNAME]);
    }

    function _nodeValue(n,n2){      // value of a node, or localnode.
        if(n2) n = n2;
        return (n = (n.nodeType != 1 && n ||
            (n.nodeType != 1 && n || (n = n.firstChild) && n.nodeType!=1 && n))) && n.nodeValue || ""
    }

    // Language processing
//#ifdef __WITH_MULTI_LANG    
    var langrx = /(\\*)\$\[(.*?)\]/g;
    var lang = apf.language;

    apf.$lm_has_lang = 0;

    function _lngrx(tok,esc,x){ // language replacement regex callback
        apf.$lm_has_lang = 1;
        if(esc)
            return "$["+x+"]";
        return lang.words[x] || (/*#ifdef __DEBUG*/wlvl>1&&wlang(x,"_lngrx"),/*#endif*/"");
    }
//#endif            

    function __ret(r){          // return function, translates $[lang] things in data
//#ifdef __WITH_MULTI_LANG    
        if(r && r.indexOf && r.indexOf("$[")!=-1)
            return r.replace(langrx, _lngrx);
//#endif            
        return r;
    }

    function __lng(x,x2){           // the language macro
//#ifdef __WITH_MULTI_LANG    
        apf.$lm_has_lang = 1;
        return lang.words[x] || (/*#ifdef __DEBUG*/wlvl>1&&wlang(x,"_lng"),/*#endif*/"");
/*#else
        return "$["+x+"]"; 
#endif*/        
    }

    function _lnged(x,x2){          // editable language macro
//#ifdef __WITH_MULTI_LANG    
        apf.$lm_has_lang = 1;
        return lang.words[x] || (/*#ifdef __DEBUG*/wlvl>1&&wlang(x,"_lnged"),/*#endif*/"");
/*#else
        return "$["+x+"]"; 
#endif*/        
    }
    
    function _(n, m, x){   // wrap a value with editable div
        return '<span class="liveEdit" xpath="' + (n 
            ? (m.substr(0,1) != "/" 
                ? apf.xmlToXpath(n, null, false) 
                : "") + "/" + m 
            : "") + '">' + ((n?__val(n,m):__valm(m,x)) || "&#32;") + '</span>';
    }

//    function _edit(n, opts){
//        return '<span class="liveEdit" xpath="' + (apf.xmlToXpath(n, null, false)  '">' + ((n?__val(n,m):__valm(m,x)) || "&nbsp;") + '</span>';        
//    }
    
    function _argwrap(n,x){
        return [n,x];
    }
    
    function _argwrapm(m,x){
        return [0,m,x];
    }
    
    function _valedx(editMode, args, opt){   // wrap a value with editable div
        args[3] = opt;
        args[4] = editMode;
        return _valed.apply(this, args);
    }
    
    function _valed(n, m, x, options, editMode){   // wrap a value with editable div
        var res = (n?__val(n,m):__valm(m,x));

        if (options && options.multiline && options.editor != "richtext")
            res = res.replace(/\n/g, "<br />");
        
        if (editMode !== false) {
            var value = res || options && options.initial || "&#32;";
            if (!options || !options.richtext) 
                value = apf.htmlentities(value);
            if (options && options.multiline)
                value = value
                    .replace(/&lt;br ?\/?&gt;/g, "<br />")
                    .replace(/&lt;(\/?div)&gt;/g, "<$1>");

            return '<div' 
              + ' onmousedown="apf.LiveEdit.mousedown(this, event)" class="liveEdit' + (options && options.multiline ? ' liveeditMultiline' : '') + (!res && options && options.initial ? ' liveEditInitial' : '') + '" xpath="' + (n 
                ? ((m.substr(0,1) != "/" 
                    ? apf.xmlToXpath(n, null, false) 
                    : "") + "/" + m).replace(/([\[\{\}\]])/g, "\\$1")
                : (self[m] 
                    ? (m + ".queryNode('" + x.replace(/'/g, "\\'") + "')").replace(/([\[\{\}\]])/g, "\\$1")
                    : "")) + '"' 
              + (options
                ? ' options="' + apf.serialize(options).escapeHTML()
                                  .replace(/"/g, "&quot;")
                                  .replace(/([\[\{\}\]])/g, "\\$1") + '"'
                    + (options.editor ? ' editor="' + options.editor + '"' : "")
                : "") + '>' + value 
              + '</div>';
        }
        else {
            return res;
        }
    }
    
    var selfrx = /(^|\|)(?!\@|text\(\)|\.\.|[\w\-\:]+?\:\:)/g; // inject self regexp
    
    function _injself(s){           // self inject helper func
        return s.charAt?s.replace(selfrx, "$1self::"):s;
    }

    apf.$lmx = null;

    function _async(_n,_c,_a,_w,_f,_this,obj,func,args){ // Async handling
        var i = _a.i, v;

        if(!_a.ret)_a.ret = [];

        if (_a[i])
            return _a.ret[i];

        _a[i] = true;   // flag this ID so args dont get computed again

        if (!obj.exec)
            return  _a.ret[i]=(func)?obj[func].apply(obj,args):obj.apply(obj,args);

        var cb = function(data, state, extra){
            if (_w)
                delete _w._pc;
            
            if (state != apf.SUCCESS){
                _c(null, state, extra);
            }
            else{
                apf.$lmx = extra;
                _a.ret[i] = data;

                if (_w)
                    _f.call(_this,_n,_c,_w,_a);
                else
                    _f.call(_this,_n,_c,_a);
            }
        };

        if(_w && _w._pc){
            _w._pc = {
                obj     : obj,
                func    : func,
                args    : args,
                message : obj.createMessage && obj.createMessage(func, args),
                _c      : _c,
                cb      : cb
            };
        }else{
            obj.exec(func, args, cb);
        }
        throw({
            x:1
        });
    }

    function _precall(_w){ // precall
        var o;
        if (typeof(o = _w._pc) != "object" || !o)
            return;

        o.obj.exec(o.func, o.args, o.cb, {message: o.message});

        throw({x:1});
    }

    var _clut = apf.color?apf.color.colorshex:{}, _cparse = /^(rgb|hsv|hsb)\(\s+(\d+)\s+,\s+(\d+)\s+,\s+(\d+)\)/

    function sort(set, xpath, options){
        var s = new apf.Sort();
        options = options || {};
        if(!xpath.charAt)xpath = "";
        if(xpath.charAt(0)=='@'){
            xpath = xpath.slice(1);
            options.getValue = function(n){
                return n.getAttribute(xpath);
            }
        }else{
            options.getValue = function(n){
                return apf.queryValue(n,xpath);
            }
        }
        s.set(options);
        return s.apply(apf.getArrayFromNodelist(set));
    }
    
    function _cthex(c){
        var t;
        if((t=typeof(c))=='string'){
            if(c.indexOf('#')==0){
                if(c.length==7) return parseInt(c.slice(-1),16);
                return parseInt(c.slice(-1),16); // compute repeat
            }
            if(t = _clut[a])return t;
            if(c=c.match(_cparse)){
                if((t=c[1]) == 'rgb'){
                    return (((t=c[2])<0?0:(t>255?255:parseInt(t)))<<16)+
                            (((t=c[3])<0?0:(t>255?255:parseInt(t)))<<8)+
                            (((t=c[4])<0?0:(t>255?255:parseInt(t))));
                } else { // hsv
                    var h=parseFloat(c[2]),s=parseFloat(c[3]),v=parseFloat(c[4]),
                        i,m=v*(1-s),n=v*(1-s*((i=floor(((h<0?-h:h)%1)*6))?h-i:1-(h-i))); 
                    switch(i){
                      case 6:case 0: return ((v&0xff)<<16)+((n&0xff)<<8)+(m&0xff);  
                      case 1: return ((n&0xff)<<16)+((v&0xff)<<8)+(m&0xff); 
                      case 2: return ((m&0xff)<<16)+((v&0xff)<<8)+(n&0xff); 
                      case 3: return ((m&0xff)<<16)+((n&0xff)<<8)+(v&0xff); 
                      case 4: return ((n&0xff)<<16)+((m&0xff)<<8)+(v&0xff); 
                      default:case 5: return ((v&0xff)<<16)+((m&0xff)<<8)+(n&0xff); 
                    }
                }
            }
        } else if(t=='number')return t;
        return null;
    }

    function lin(f, a, b){
        var fa = parseFloat(a), fb = parseFloat(b), fm = 1-(f = f<0?0:(f>1?1:f));
        if(fa!=a || fb!=b)
            return (((fa=_cthex(a))&0xff0000)*f+((fb=_cthex(b))&0xff0000)*fm)&0xff0000|
                   ((fa&0xff00)*f+(fb&0xff00)*fm)&0xff00 |
                   ((fa&0xff)*f+(fb&0xff)*fm)&0xff;
        return f*fa+fm*fb;
    }
    
    var abs = Math.abs, acos = Math.acos, asin = Math.asin,
       atan = Math.atan, atan2 = Math.atan2, ceil = Math.ceil,
       cos = Math.cos, exp = Math.exp, floor = Math.floor,
       log = Math.log, max = Math.max, min = Math.min,
       pow = Math.pow, random = Math.random, round = Math.round, 
       sin = Math.sin, sqrt = Math.sqrt, tan = Math.tan, linear = lin;

    function tsin(x){ return 0.5*sin(x)+0.5;}
    function tcos(x){ return 0.5*cos(x)+0.5;}
    function usin(x){ return 0.5-0.5*sin(x);}
    function ucos(x){ return 0.5-0.5*cos(x);}
    function snap(a,b){ return round(a/b)*b; }
    function clamp(a,b,c){ return a<b?b:(a>c?c:a); }
    
    this.compile = function(code){
        // up-scope much used functions
        var _ret = __ret, _val = __val,_valm = __valm, _nod = __nod,
        _nodm = __nodm, _cnt = __cnt, _cntm = __cntm, _lng = __lng, _valattr = __valattr;

        eval(code);
        
        return _f;
    }
    
    this.compileWith = function(code, withs){
        // up-scope much used functions
        var _ret = __ret, _val = __val,_valm = __valm, _nod = __nod,
        _nodm = __nodm, _cnt = __cnt, _cntm = __cntm, _lng = __lng, _valattr = __valattr;

        eval(code);
        
        return _f;
    }

    var LMBEGINCACHE;
    /*LIVEMARKUP BEGIN CACHE
    var _ret = __ret, _val = __val,_valm = __valm, _nod = __nod,
    _nodm = __nodm, _cnt = __cnt, _cntm = __cntm, _lng = __lng, _valattr = __valattr;
    this.c342 = function(_n,_a,_w){
        ..cached LM function..
    }
    this.c342.type = 2; 
    this.c342.xpaths = {...}; 
    this.c342.props = {...};
    this.c723 = function(....){
    
    }
    // replace
    d.replace(/var_LMBEGINCACHE;[\s\S]*var_LMBEGINCACHE;/,"code");
    _async(_n,_c,_a,_w,_f,this,
    _async(_n,_c,_a,_w,apf.lm_exec.c342,this,
    LIVEMARKUP END CACHE*/
    var LMENDCACHE;
    // #endif
})();
// #endif
