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

// #ifdef __WITH_SYNTAX

/**
 * Syntax highlights a code string using html.
 * @param {String} strCode the code to highlight.
 * @return {String} the highlighted string.
 */
apf.highlightXml = 
apf.highlightCode = function(strCode){
    var lines = strCode.split(/\n\r?/);
    for (var min = 1000, i = 0, l = lines.length; i < l; i++){
        min = Math.min(min, lines[i].match(/^(\s+)?[^\s]/) && RegExp.$1.length || 1000);
        if (!min) break;
    }

    strCode = strCode.replace(new RegExp("^ {" + min + "}", "gm"), "")
      .replace(/<!doctype([\s\S]+?)>|<!--([\s\S]+?)-->|<\?([\w\-]+)([\s\S]+?)\?>|<\!\[CDATA\[([\s\S]*?)\]\]>|<(\w+:)?script([\s\S]*?)>([\s\S]*?)<\/(?:\w+:)?script>|<([\/\w\:\-]+)([\s\S]*?)(\/?)>/g, 
        function(m, doctype, comment, ptarget, pcontents, cdata, sprefix, sattr, scontent, tagName, attrs, bl){
            if (doctype) {
                return "<span style=\"color:gray\">&lt;!doctype" + doctype.replace(/</g, "&lt;") + "&gt;</span>";
            }
            else if (comment) {
                return "<span style=\"color:green\">&lt;!--" + comment.replace(/</g, "&lt;") + "--&gt;</span>";
            }
            else if (ptarget) {
                return "<span style=\"color:orange\">&lt;?" + ptarget + "</span>" 
                    + apf.highlightJs(pcontents, true) 
                    + "<span style=\"color:orange\">?&gt;</span>";
            }
            else if (cdata) {
                return "<span style=\"color:gray\">&lt;![CDATA[" + cdata + "]]&gt;</span>";
            }
            else if (sprefix) {
                return "<span style=\"color:#127ac6\">&lt;" + sprefix + "script" + (attrs 
                      ? "</span>" + attrs.replace(/("[\s\S]*?")|([\w\-\:]+)/g, function(m, s, w){
                            if (s) return s;
                            return "<span style=\"color:red\">" + w + "</span>";
                        }) + "<span style=\"color:#127ac6\">&gt;</span>"
                      : "&gt;</span>")
                    + apf.highlightJs(scontent, true) 
                    + "<span style=\"color:#127ac6\">&lt;/" + sprefix + "script&gt;</span>";
            }
            else if (tagName) {
                return "<span style=\"color:#127ac6\">&lt;" 
                    + (tagName.substr(0, 2) == "a:" 
                        ? "<a href='element." + tagName.substr(2) + "'>" + tagName + "</a>" 
                        : tagName)
                    + (attrs 
                      ? "</span>" + attrs.replace(/("[\s\S]*?")|([\w\-\:]+)/g, function(m, s, w){
                            if (s) return s;
                            return "<span style=\"color:red\">" + w + "</span>";
                        }) + "<span style=\"color:#127ac6\">" + bl + "&gt;</span>"
                      : "&gt;</span>");
            }
        });

    return strCode;//.replace(/&lt;/g, "&amp;lt;");
}

/**
 * @private
 */
apf.removeStartWhitespaces = function(strCode){
    var lines = strCode.split(/\n\r?/);
    for (var min = 1000, i = 0, l = lines.length; i < l; i++){
        min = Math.min(min, lines[i].match(/^(\s+)?[^\s]/) && RegExp.$1.length || 1000);
        if (!min) break;
    }

    return strCode.replace(new RegExp("^ {" + min + "}", "gm"), "");
}

/**
 * @private
 */
apf.convertAmlToJson = function(strCode){
    var xml = apf.getXml("<a:app xmlns:a='" + apf.ns.apf + "'>" + strCode + "</a:app>", null, true);

    var script = [], bool = {"true":1, "false":1};
    var x = (function recur(nodes, depth, paout){
        var pre = new Array(depth+2).join("  "), output = [];
        
        for (var node, i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];
            if (node.nodeType == 3 || node.nodeType == 4) {
                if (node.nodeValue.replace(/[\s]*$/, "").replace(/^[\s]*/, "")) {
                    (paout || output).push("data", '"' + node.nodeValue.trim().replace(/"/g, "\\\"").replace(/\n/g, "\\\n") + '"');
                }
                continue;
            }
            else if (node.nodeType == 8) {
                output.push(pre + "//" + node.nodeValue);
                continue;
            }
            else if (node.nodeType != 1)
                continue; //ignore
            else if (node[apf.TAGNAME] == "script") {
                var s = node.childNodes;
                for (var j = 0, jl = s.length; j < jl; j++) {
                    if (s[j].nodeValue.trim() != "//")
                        script.push(s[j].nodeValue.replace(/^ {16}/gm, "").replace(/\/\/$/, "") + "\n");
                }
                continue;
            }
            
            var attr, childLength = node.childNodes.length + (attr = node.attributes).length;
            var max = 0, aout = [];
            output.push(pre + "new apf." + node[apf.TAGNAME] + (childLength || !depth ? "({" : "()" + (depth == 0 ? ";" : (i == l - 1 ? "" : ","))));
            if (!depth) {
                aout.push("htmlNode", "document.body");
                max = Math.max(8, max);
            }
            
            for (var a, j = 0, jl = attr.length; j < jl; j++) {
                aout.push((a = attr[j]).nodeName, a.nodeName.substr(0,2) == "on"
                    ? "function(){" + a.nodeValue + "}"
                    : (parseInt(a.nodeValue) == a.nodeValue || bool[a.nodeValue]
                        ? a.nodeValue
                        : '"' + a.nodeValue.replace(/"/g, "\\\"") + '"'));
                max = Math.max(a.nodeName.length, max);
            }
            
            var c = "";
            if (node[apf.TAGNAME] == "model" && node.childNodes.length) {
                aout.push("data", '"' + apf.serializeChildren(node).trim().replace(/"/g, "\\\"").replace(/\r?\n/g, "\\\n") + '"');
            }
            else if (childLength)
                var c = recur(node.childNodes, depth+2, aout);
            
            max = Math.max(c ? 10 : 4, max);
            
            max++;
            
            for (j = 0, jl = aout.length; j < jl; j+=2) {
                output.push(pre + "  " + aout[j].pad(max, " ", apf.PAD_RIGHT) 
                    + ": " + aout[j+1] + (j != jl - 2 || c ? "," : ""));
            }
            
            if (c) {
                output.push(pre + "  " + "childNodes".pad(max, " ", apf.PAD_RIGHT) + ": [");
                output.push(c.substr(0, c.length - 1));
                output.push(pre + "  ]");
            }

            if (childLength || !depth)
                output.push(pre + "})" + (depth == 0 ? ";" : (i == l - 1 ? "" : ",")))
        }

        return output.join("\n") + (depth == 0 ? "\n\n" + script.join("").trim() : "");
    })(xml.childNodes, 0);

    return x + "\n\n";
}

apf.highlightJs = function(x, notrim){
    if (!notrim) {
        var lines = x.split(/\n\r?/);
        for (var min = 1000, i = 0, l = lines.length; i < l; i++){
            min = Math.min(min, lines[i].match(/^(\s+)?[^\s]/) && RegExp.$1.length || 1000);
            if (!min) break;
        }
        x = x.replace(new RegExp("^ {" + min + "}", "gm"), "");
    }
    
    return x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/(\/\*[\s\S]+\*\/)|(\/\/.*)$|("(?:[^"\\]+|\\[\s\S])*")|('(?:[^'\\]+|\\[\s\S])*')|(\W)(apf|break|continue|do|for|import|new|this|void|case|default|else|function|in|return|typeof|while|comment|delete|export|if|label|switch|var|with|abstract|implements|protected|boolean|instanceOf|public|byte|int|short|char|interface|static|double|long|synchronized|false|native|throws|final|null|transient|float|package|true|goto|private|catch|enum|throw|class|extends|try|const|finally|debugger|super)(\W)|(\W)(\w+)(\s*\()/gm,
        function(m, colong, co, str1, str2, nw, kw, nw2, fW, f, fws) {
            if (f)
                return fW + '<span style="color:#ff8000">' + f + '</span>' + fws;
            else if (co || colong)
                return '<span style="color:green">' + (co || colong) + '</span>';
            else if (str1 || str2)
                return '<span style="color:#808080">' + (str1 || str2) + '</span>';
            else if (nw)
                return nw + '<span style="color:#127ac6">' + kw + '</span>' + nw2;
        });
}

/**
 * Syntax highlights a code string using html.
 * @param {String} strCode the code to highlight.
 * @return {String} the highlighted string.
 */
apf.highlightCode2 = function(strCode){
  var comment=[],str=[];
  return strCode
        .replace(/(\/\*[\s\S]*?\*\/|\/\/.*)/g, function(a){ comment.push(a); return '###n'+(comment.length-1)+'###';})   
         .replace(/\"([\s\S]*?)\"/g, function(a,b){ str.push(b); return '###s'+(str.length-1)+'###';})         
         .replace(/\'([\s\S]*?)\'/g, function(a,b){ str.push(b); return '###q'+(str.length-1)+'###';}) 
         .replace(/(\<)|(\>)/g,function(n,a,b){ return "<span stylecolorwhite>"+(a?'@lt@':'@gt@')+"</span>"})
         .replace(/(\W)-?([\d\.]+)(\W)/g, "$1<span stylecolor#127ac6>$2</span>$3")
         .replace(/([\|\&\=\;\,\:\?\+\*\-]+)/g, "<span stylecolorwhite>$1</span>")
         .replace(/(\W)(break|continue|do|for|import|new|this|void|case|default|else|function|in|return|typeof|while|comment|delete|export|if|label|switch|var|with|abstract|implements|protected|boolean|instanceOf|public|byte|int|short|char|interface|static|double|long|synchronized|false|native|throws|final|null|transient|float|package|true|goto|private|catch|enum|throw|class|extends|try|const|finally|debugger|super)(\W)/g,
    "$1<span stylecolorgreen>$2</span>$3")
         .replace(/([\(\)\{\}\[\]])/g, "<span stylecoloryellow>$1</span>")
         .replace(/###n(\d+)###/g,function(a,b){ return "<span stylecolorpurple>"+comment[b].escapeHTML()+"</span>"; } )
         .replace(/###s(\d+)###/g,function(a,b){ return "<span stylecolorgray>\""+str[b].escapeHTML()+"\"</span>"; } )
         .replace(/###q(\d+)###/g,function(a,b){ return "<span stylecolorgray>'"+str[b].escapeHTML()+"'</span>"; } )
         .replace(/stylecolor(.*?)\>/g,"style='color:$1'>")
         .replace(/@(.*?)@/g,"&$1;");
}

/**
 * Formats a javascript string with good indentation. Also known as pretty printing.
 * @param {String} strJs the javascript to format.
 * @return {String} the formatted string.
 */
apf.formatJS = function(strJs){
    var d = 0, r = 0;
    var comment=[],str=[];
    return strJs
        .replace(/(\/\*[\s\S]*?\*\/|\/\/.*)/g, function(a){ comment.push(a); return '###n'+(comment.length-1)+'###';}) 
        .replace(/\"([\s\S]*?)\"/g, function(a,b){ str.push(b); return '###s'+(str.length-1)+'###';})         
        .replace(/\'([\s\S]*?)\'/g, function(a,b){ str.push(b); return '###q'+(str.length-1)+'###';}) 
        .replace(/;+/g, ';').replace(/{;/g, '{').replace(/({)|(})|(\()|(\))|(;)/g,
        function(m, co, cc, ro, rc, e){
            if (co) d++;
            if (cc) d--;
            if (ro){ r++; return ro;}
            if (rc){ r--; return rc;}

            var o = '';
            for (var i = 0; i < d; i++)
                o += '\t';
            if (co) return '{\n' + o;
            if (cc) return '\n' + o + '}';
            if (e) return (r>0)?e:(';\n' + o);
        }).replace(/;\s*\n\s*\n/g, ';\n').replace(/}var/g, '}\nvar')
        .replace(/([\n\s]*)###n(\d+)###[\n\s]*/g,function(a,b,c){ return b+comment[c]+b; } )
        .replace(/###s(\d+)###/g,function(a,b,c){ return "\""+str[b]+"\""; } )
        .replace(/###q(\d+)###/g,function(a,b,c){ return "'"+str[b]+"'"; } );
};

//#endif