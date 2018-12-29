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
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 */
apf.JsParser = new (function(){
    var tok_lut = {
            '"': 4, '\'': 4, '[': 2, ']': 3, '{': 2, '}': 3, '(': 2, ')': 3,
            '\n': 6, '\r\n': 6, '//': 7, '/*': 7, '*/': 7, '/':8
        },
        tok_close = {'}': '{', ']': '[', ')': '('},
        tokenizerx    = /(\r?[\n]|\/[\/*]|\*\/|["'{(\[\])}\]\/])|([ \t]+)|([\w\$._])+|(\\?[\w._?,:;!=+-\\\/^&|*"'[\]{}()%$#@~`<>])/g;    
    
    function errToString(){
        return this.t + '[' + this.pos + ']';
    }
    
    function posToString(){
        return 'Ln : ' + this.line + ', Col : ' + this.col;
    }
    
    function argToString(){
        return this.type + ' ' + this.name
            + (this.def !== undefined ? '=' + this.def : '');
    }
    
    function markerToString(){
        return 'Marker:' + this.type + '  [' + this.pos + '] '+ (this.args ? '('
            + this.args.join(',') + ')' : '');
    }
    
    function funcToString(){
        return this.type + ' ' + this.ret + ' ' + this.name + (this.args ? '('
            + this.args.join(',') + ')' : '') + '  [' + this.pos + ']'
            + (this.doc ? (' Doc: ' + this.doc) : '');
    }
    
    function concat(t, b, e, m){
        for (var s = [], sl = 0, i = b; i < e; i += 3) {
            s[sl++] = (t[i] == 2)
                ? concat(t[i + 2], 0, t[i + 2].length)
                : t[i + 2];
            if(m && i<e-3) s[sl++] = m;    
        }
        return s.join('');
    }    
    
    function formatPos(l,pos){
        return JsParser.line(l, pos).toString();
    }

    var pre_regex = {
        'throw': 1, 'return': 1, '(': 1, '[': 1, ',': 1, '=': 1, ":": 1
    }        
    
    this.parse = function(str){
        var t = [],     // parse tree
            b = 0,      // block output
            stack = [], // tree stack
            type = 0,   // token type
            mode_tok = 0, // parsemode, contains char of block we parse
            n,          // tempvar
            lines = [], // array of linepositions
            err = [];   // tokenize array
        var last_tok = null;
        str.replace(tokenizerx, function(tok, rx_lut, rx_ws, rx_word, rx_misc, pos){
            type = rx_lut ? tok_lut[rx_lut] : (rx_ws ? 9 : (rx_word ? 5 : 0)); //5 = word
            //logw( type+" "+pos+"\n");
            if (!mode_tok) {
                switch (type) {
                    case 8: // regex
                        // previous is: throw return ( , [
                        if (pre_regex[last_tok] || pre_regex[t[t.length-1]]) {
                            if (t[t.length-3] == "[") {
                                mode_tok = "objRgx";
                                var openTags = 1;
                            } else
                                mode_tok = tok;
                            
                            t[n = t.length] = type,
                            t[++n] = pos;
                            
                            b = [tok];
                        } else {
                            t[n = t.length] = 0;
                            t[++n] = pos;
                            t[++n] = tok; 
                        }
                        //debugger;
                        break;                
                    case 4: //String 
                    case 7: //Comment
                        t[n=t.length] = type,
                        t[++n] = pos;
                        mode_tok = tok;
                        b = [tok];
                        break;
                    case 2: //[ ( {
                        t[n = t.length] = type;
                        t[++n] = pos;
                        stack.push(t);
                        t = t[++n] = [0, pos, tok];
                        break;
                    case 3: // } ) ]
                        if (t[2] != tok_close[tok])  {                            
                            err.push({t: "Error closing " + tok + " (opened with: " + t[2] + ")", pos: pos, toString: errToString});                                                                                                                            
                        }
                        else {
                            t[n = t.length] = type;
                            t[++n] = pos;
                            t[++n] = tok;
                            t      = stack.pop();
                        }
                        break;
                    case 6: // \n
                        lines[lines.length] = pos;
                        break;
                    case 9: // white space
                        break;
                    default: // word
                        t[n = t.length] = type;
                        t[++n] = pos;
                        t[++n] = tok;
                        break;
                }
            }
            else { //In comment or string mode
                b[b.length] = tok;
                if (mode_tok == "objRgx") {
                    if (tok == "[") { 
                        openTags++;
                    } else if (tok == "]") {
                        openTags--;
                    }
                    if (openTags == 0) {
                        mode_tok = 0;
                        t[++n] = b.join('');
                    }
                    //debugger;
                }
                switch (type) {
                    case 4: //String
                        if (mode_tok == tok){
                            mode_tok = 0;
                            t[++n] = b.join('');
                        }
                        break;
                    case 7: //Comment
                        if (tok == '*/' && mode_tok == '/*') {
                            mode_tok = 0;
                            t[++n] = b.join('');
                        } else if (tok == '*/' && mode_tok == '/') {
                            mode_tok = 0;
                            t[++n] = b.join('');
                        }
                        break;
                    case 8: // regex
                        if(mode_tok == '/'){
                            mode_tok = 0;
                            t[++n] = b.join('');
                        }
                        break;
                    case 6: //New line
                        lines[lines.length] = pos;
                        if (mode_tok == '//'){
                            mode_tok = 0;
                            b.pop();
                            t[++n] = b.join('');
                        }
                        break;
                }
            }
            if(type<9)last_tok = tok;
        });
        while (stack.length)
            err.push({t: "Not closed: " + (n = t[2], t = stack.pop(), n), pos: formatPos(lines,t[t.length - 2]), toString: errToString});
        if (mode_tok)
            err.push({t: "Blockmode not closed of " + b[0], pos: formatPos(lines,t[t.length - 1]), toString: errToString});
                        
        return {tree: t, lines: lines, err: err};
    };
    
    this.dump = function(s, t, level){
        for (var i = 0; i < t.length; i += 3) {
            var type = t[i];
            if (type ==2)
                this.dump(s, t[i + 2], level + 1);
            else 
                s.push(Array(level).join('----'), type, " ", t[i + 2], "\n");
        }
    };
    
    this.line = function(lines,pos){
        for (var i = 0, j = lines.length; i < j && lines[i] < pos; i++);
        return {line: i+1, col: pos - lines[i - 1], toString: posToString};
    };
    
    this.scan = function(t, tag_prefix, classes, err, in_struct, scope, outer, base_class){
        
    }    
})();

//#endif
