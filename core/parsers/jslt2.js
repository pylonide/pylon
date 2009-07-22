function _JSLT2(){


    var statement_lut = {
            'var':1,'for':1,'while':1,'do':1,'if':1,'else':1,
            'switch':1,'case':1,'break':1,'continue':1,'default':1,
            'function':1, 'return':1,'try':1,'catch':1,
            'debugger':1,'alert':1,'delete':1,'export':1,'import':1,'label':1,
            'each':1,'node':1,'local':1
        },
        type_lut = {"\n":1,"\r\n":1,'"':4,'\'':4,'//':5,'/*':5,'*/':5,'{':6,'}':7,'[':8,']':9,'(':10,')':11},
        type_close = {'}':'{',']':'[',')':'('},
        xpath_enter = {':':1,'@':1,'#':1,'(':1,'[':1,'=':1,'>':1,'<':1,'{':1,'+':1,'-':1,'/':1,'*':1,'&':1,'!':1, '%':1},
        xpath_lut = {'@':'xcopy','#':'xcount','$':'xcopyall','&':'xnode','*':'xnodes','^':'xmerge'},
        parserx = new RegExp(),
        macro = {
            each   : "for(_t.push(n,_a,_i,_l),_v=(",
            each_  : "),_a=typeof(_v)=='string'?(n?n.selectNodes(_v):[]):(_v?_v:[]),_l=_a.length,n=_a[_i=0];_i<_l||(_l=_t.pop(),_i=_t.pop(),_a=_t.pop(),n=_t.pop(),0);n=_a[++_i])",
            pack   : "(function(){var s=[];",
            pack_  : "return s.join('');})()",
            value  : "((typeof(_v=(",
            value_ : "))=='string'?(_v=n?n.selectSingleNode(_v):0):_v)?((_v.nodeType==1?_v.firstChild:_v).nodeValue):'')",
            xvalue  : "(n?((_v=n.selectSingleNode(",
            xvalue_ : "))?(_v.nodeType==1?_v.firstChild:_v).nodeValue:''):'')",
            values : "(function(){var _a,_i,_l,_n=[];for(_v=(",
            values_: "),_a=typeof(_v)=='string'?(n?n.selectNodes(_v):[]):(_v?_v:[]),_l=_a.length,n=_a[_i=0];_i<_l;n=_a[++_i])_n[_n.length]=(n.nodeType==1?n.firstChild:n).nodeValue;return _n;})()",            
            count  : "(typeof(_v=(",
            count_ : "))=='string'?(n?n.selectNodes(_v).length:0):(_v?_v.length:0))",
            xcount  : "(n?n.selectNodes(",
            xcount_ : ").length:0)",
            node   : "(n?((_v=n.selectSingleNode(",
            node_  : "))?(_v.nodeType==1?_v.firstChild:_v):null):null)",
            nodes  : "(n?n.selectNodes(",
            nodes_ : "):[])",
            copy   : "(n?((_v=n.selectSingleNode(",
            copy_  :  "))?_v.xml:''):'')",
            copyall  : "(function(){var _a,_i,_l,s=[];for(_v=(",
            copyall_ : "),_a=typeof(_v)=='string'?(n?n.selectNodes(_v):[]):_v,_l=_a.length,n=_a[_i=0];_i<_l;n=_a[++_i])s[s.length]=n.xml;return s.join('')})()",            
            merge  : "(function(){var _a,_i,_l,s=[];for(_a=n?n.selectNodes(",
            merge_ : "):[],_l=_a.length,n=_a[_i=0];_i<_l;n=_a[++_i])s[s.length]=(n.nodeType==1?n.firstChild:n).nodeValue;return s.join('')})()",            
            local  : "for(_t.push(n), _i = 0, _v=(",
            local_ : "), n = (typeof(_v)=='string'?n.selectSingleNode(_v):_v);_i<1 || (n=_t.pop(),0);_i++)",
            codeinxpath : " ",
            codeinxpathincode : " ",
        },
         o, ol, code,brace, s_codeinxpath, s_xpathincode, s_xpath, s_block, s_pblock, s_popauto,
        block, bl, stack, xstack, tblock, type, count, last, keepnl, jsobjs, jslast, 
        lineno, linepos,textsegs,codesegs,xpathsegs,complexcode;
        
    macro.xcopy = macro.copy,       macro.xcopy_ = macro.copy_,
    macro.xcopyall = macro.copyall, macro.xcopyall_ = macro.copyall_,
    macro.xnode = macro.node,       macro.xnode_ = macro.node_,
    macro.xmerge = macro.merge,     macro.xmerge_ = macro.merge_;

   parserx.compile("([\"'{(\\[\\])}\\]]|\\r?[\\n]|\\/[/*]|\\*/)|([ \t]+)|([\\w._])+|(\\\\?[\\w._?,:;!=+-\\\\/^&|*\"'[\\]{}()%$#@~`<>])","g");
   
   function parser(m, rx_lut, rx_white, rx_word, rx_misc, pos){
        type  = rx_lut?type_lut[rx_lut]:(rx_white?0:(rx_word?3:2));
        if(!s_block){
            switch(type){
                case 0: // whitespace
                    o[ol++] = ' ';
                    break;
                case 1: // newline
                    lineno++, linepos = pos;
                    break;
                case 2: // misc
                    if( m == '%' ) o[ol++]='s[s.length]=';
                    else o[ol++] = m; 
                    count++;
                    break;
                case 3: // word
                     if(!count++ && !statement_lut[m]) o[ol++] = 's[s.length]=';   
                     if(m.indexOf('.') != -1) // add to object table
                        jsobjs[jslast = m] = 1;
                     o[ol++] = m; 
                     break;
                case 4: // textblock
                    if(!count++) o[ol++] = 's[s.length]=';
                    s_block = 2, block = [tblock=m], bl = 1; 
                    break;
                case 5: // comment 
                    if(m=='*/')
                        throw {t:"Unmatched comment */",p:pos};       
                    s_pblock = 0, s_block = 3, block = [tblock=m], bl = 1; 
                    break;
                case 6: // {
                    // lets see if we should switch to xpath mode
                    if(!count || xpath_enter[last]){
                        xpathsegs++;
                        if(v = xpath_lut[last])o.pop()==' '?(ol = --o.length):ol--; 
                        else v='xvalue';
                        stack.push(v+'_');
                        if(s_popauto = !count++) o[ol++] = 's[s.length]=';
                        o[ol++] = macro[v],o[ol++] = '"';
                        s_block = s_xpath = s_xpathincode = 1;
                        xstack.push(count);
                        count = 1;
                    }else{
                        o[ol++] = m, stack.push(m);
                    }
                    break;
                case 7: // }
                    complexcode = 1;
                    if( (v=stack.pop()) != type_close[o[ol++] = m])// ERROR
                         throw {t:"Cannot close "+v+" with "+m,p:pos};
                    break;                       
                case 8: // [
                    code++;
                    o[ol++] = m, stack.push(m);
                    break;
                case 9: // ]
                    if(!--code){
                        count = 0, s_block =1;
                        if(xstack.length)// ERROR we dont support template mode in xpath
                            throw {t:"Cannot use template mode inside xpath",p:pos};
                     }
                    else if((v=stack.pop()) != type_close[o[ol++] = m])
                         throw {t:"Cannot close "+v+" with "+m,p:pos};                    
                    break;
                case 10: // (
                    if(!count++) o[ol++] = 's[s.length]=';
                    if(n = macro[last]){
                        if(o[ol-1]==' ')ol--;
                        o[ol-1] = n, stack.push(last+'_');
                    }
                    else {
                        o[ol++] = m, stack.push(m);
                        if(last == jslast) delete jsobjs[last];// was a call
                    }
                    break;
                case 11: // )
                    complexcode = 1;
                    if(n = macro[v = stack.pop()]){
                        if(n==" "){// xpath in code
                            s_xpathincode = (v == "codeinxpathincode")?1:0;
                            s_codeinxpath = s_xpath = s_block = s_count = 1;
                        }else o[ol++] = n;
                    }
                    else if(v != type_close[o[ol++]=m] )
                        throw {t:"Cannot close "+v+" with "+m,p:pos};                    
                    break;
            }
        } else {
            if(s_block==1){
                switch(type){
                    case 8:// [
                        if(count) { 
                            if(!xpathsegs && count >= 1 || count > 1)textsegs++;
                            o[ol++] = '");';
                        }
                        s_block = count = 0,code = 1, codesegs++;
                        break;
                    case 4: // textblock
                        if(s_xpathincode && last=='{' && count<3){   // switch back to code mode if we are the first character
                            xpathsegs--;
                            if(count>1) o.length--;
                            if(s_popauto) o.length--;
                            o.length-=2; ol = o.length;
                            o[ol++] = stack[stack.length-1] = '{'; 
                            s_xpath = s_xpathincode = 0, s_block = o[ol++] = m;
                            count = xstack.pop();
                        }else{
                            if(!s_xpath && !count++) o[ol++] = "\ns.push(\"";
                            o[ol++] = "\\"+m;
                        }
                        break;
                    case 5: // comment 
                        if(m=='*/')
                            throw {t:"Unmatched comment */",p:pos};       
                        s_block = 3, block = [tblock=m], bl = 1, s_pblock = 1; 
                    break;                        
                    case 6: // {
                        if(!s_xpath){ // switch to xpath mode
                            xpathsegs++;
                            if(v = xpath_lut[last])ol = --o.length; 
                            else v = 'xvalue';
                            o.push( (count++)?(textsegs++,'",'):"\ns.push(", macro[v], '"');
                            s_xpath = 1, s_xpathincode = 0, ol = o.length;
                            stack.push(v+'_');
                            xstack.push(count);
                            count = 1;
                        }else o[ol++] = (!count++)?"\ns.push(\"{":'{';
                        break;
                    case 7: // }
                        if(s_xpath){ // end xpath mode
                            if(s_xpathincode) o.push(s_codeinxpath?'':'"',macro[v=stack.pop()],"\n"), s_block = 0;
                            else o.push(s_codeinxpath?'':'"',macro[v=stack.pop()],',"');
                            s_codeinxpath = s_xpath = s_xpathincode = 0, ol = o.length;
                            count = 1; xstack.pop();
                        }else o[ol++] = (!count++)?"\ns.push(\"}":'}';
                        break;
                    case 10: // (
                        if(s_xpath && count<2 && last=='{'){ // we are going into inner-code mode. 
                           if(o[ol-1]!='"')
                            throw {t:"Invalid code-in-xpath"+v,p:pos};       
                           ol = --o.length; // remove quote and go into code mode
                           stack.push(s_xpathincode?'codeinxpathincode':'codeinxpath');
                           s_block =  s_xpath =  s_xpathincode = 0, count = 1;
                        }else {
                            if(!count++)o[ol++] = "\ns.push(\"";
                            o[ol++] = "(";
                        }
                        break;
                    case 11: // )
                        if(!count++)o[ol++] = "\ns.push(";
                        o[ol++] = ")";
                        break;
                    case 1: // newline
                        lineno++, linepos = pos;
                        if(keepnl && !s_xpath){
                            if(!count++)o[ol++] = "\ns.push(";
                            o[ol++] = "\\n";
                        }
                        break;
                    default:
                        if(!s_xpath && !count++)o[ol++] = "\ns.push(\"";
                        o[ol++] = m;
                        break;
                }
            } else {
                switch(type){
                    case 1: // newline
                        lineno++, linepos = pos;
                        block[bl++] = "\\n";
                        if(s_block == 3 && tblock == '//') s_block = s_pblock; 
                        break;                    
                    case 4: // textblock
                        block[bl++] = m;
                        if(s_block == 2 && tblock == m) s_block = 0, o[ol++] = block.join('');
                        break;
                    case 5: // comment
                        if(s_block == 3 && tblock == '/*' && m == '*/') s_block = s_pblock; 
                        break;
                    default:
                        block[bl++] = m;
                        break;
                }
            }
        }
        if( type>1 ) last = m;
    };
    this.compile = function(str, vkeepnl){
    
		try{
            o=["var _t=[],_v,_i,_a,_l,s=[];"], ol=1,

            code = brace = s_codeinxpath = s_xpathincode = s_xpath = complexcode = xpathsegs =
            s_popauto = bl = type =  lineno = linepos = codesegs = textsegs = 0, count = 0;
            
            s_block = 1,  block=[], stack=[], xstack=[], jsobjs = {},
            tblock, last = '', keenpl = vkeepnl;
     
            str.replace(parserx, parser);
            if(s_block == 1 && count > 0) o[ol++] = '");';
            if(!xpathsegs && count >= 1 || count > 1)textsegs++;
            o[ol++] = "\nreturn s.join('');";
            
            // check any unclosed errors
            if(s_block != 1){
                var s;
                switch(s_block){
                    case 0: s = 'code block ['; break;
                    case 2: s = 'string quote '+tblock; break;
                    case 3: if(tblock!='//')s = 'comment '+tblock; break;
                }
                if(s)throw {t:"Unclosed "+s+" found at eof",p:str.length};
            }
            if(stack.length){
                // lets check our macro
                var s = stack[stack.length-1]; 
                if(macro[s]) s = s.charAt(0)=='x'?'xpath {':'macro ( from '+s;
                throw {t:"Unclosed "+s+" found at eof",p:str.length};
            }

            // Optimize the code for simple cases
            if(!complexcode){
                if(!xpathsegs){
                    if(!textsegs){ // weonly have one codesegment
                        if(codesegs==1){
                            o.shift();o[0]='return ';
                            if(o.length<2)o[o.length]='""';
                            else o.length--;
                        }else if (!codesegs) o = ['return ""'];
                    }else if(textsegs==1 && !codesegs){
                        o.shift();o[0]='return "';o[--o.length-1]='"';
                    }
               }else if(xpathsegs==1 && textsegs==0 && codesegs==0){
                  o.shift();o[0]='var _v;return ';o.length-=3;
               }
            }
            // TODO outside of try/catch for debugmode or something?
            var func = new Function('n',o = o.join(''));
        }catch(e){
            // TODO: make a proper JPF exception with this information:
            if(e.t){
                logw("Parse exception: "+e.t+" on line:"+lineno+" col:"+(e.p-linepos-2));
            }else{
                logw("Compile exception: "+e.message);
            }
        }
        // TODO check API: xpathsegs counts how many xpaths are in here, jsobjs has all the used jsobjects, o is the compiled string
        return [func,o,xpathsegs,jsobjs];
    };
	this.execute = function(jsltStr, xmlNode){
        // TODO add caching
        var	jsltFunc = compile(jsltStr,1);
        if(!jsltFunc[0]) return false;

        // TODO ifdef for debugmode or something?
        try{
            var ret = jsltFunc[0](xmlNode);
        } catch(e){
            logw("Runtime exception: "+e.message);
        }
	}
}
JSLT2 = new _JSLT2();