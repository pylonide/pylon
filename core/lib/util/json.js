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

//#ifdef __WITH_JSON2XML
/**
 * Creates xml nodes from an JSON string/ object recursively.
 *
 * @param {String}  strJson     the JSON definition.
 * @param {Boolean} [noError]  whether an exception should be thrown by the parser when the xml is not valid.
 * @param {Boolean} [preserveWhiteSpace]  whether whitespace that is present between XML elements should be preserved
 * @return {XMLNode} the created xml document (NOT the root-node).
 */
 
apf.json2xml_Obj  = {};
apf.json2xml_Attr = {};
apf.json2xml_ObjByAttr = {};
 
apf.json2Xml = (function(){
    var jsonToXml = function (v, name, xml, notag) {
        var i, n, m, t; 
        // do an apf warn
        function cleanString(s){
            return s.replace(/&/g,"&amp;").replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
        }
        if(!notag){
            if(name != (m=name.replace(/[^a-zA-Z0-9_-]/g, "_")))
                apf.console.warn("Json2XML, invalid characters found in JSON tagname '" + name, "json2Xml");
            name = m;
        }    
        if (apf.isArray(v)) {
            for (i = 0, n = v.length; i < n; i++)
                jsonToXml(v[i],name,xml);
        }
        else if (typeof v == "object") {
            var hasChild = false, objAttr = null;
            
            if(!notag)xml.push("<", name);
            for (i in v) {
                if ((n=apf.json2xml_Attr[i]) || i.charAt(0)=='@'){
                    if(!n && !objAttr) objAttr = apf.json2xml_ObjByAttr[i.slice(1)];
                    if(!notag)xml.push(" ", n?n:i.slice(1), "=\"", cleanString(v[i].toString()), "\"");
                } else 
                   hasChild = true;
            }
            if (hasChild) {
                if(!notag)xml.push(">");
                if(t=(objAttr || apf.json2xml_Obj[name])){
                    if(t==1) t = { child : name.replace(/(.*)s$/,"$1")||name, key : "name", value: "value"};
                    for (i in v) {
                        if(i.charAt(0)!='@' && !apf.json2xml_Attr[i]){
                            if( typeof(m = v[i]) =='object'){
                                if(apf.json2xml_Obj[i]){
                                    jsonToXml(m,i,xml);
                                }else {
                                    xml.push("<",t.child," ",t.key,"=\"",cleanString(i.toString()),"\" >");
                                    jsonToXml(m, i,xml,true);
                                    xml.push("</",t.child,">\n");
                                }
                            } else {
                                xml.push("<",t.child," ",t.key,"=\"",i,"\" ");
                                if(t.value){
                                    if(t.value==1)
                                        xml.push("/>");
                                    else
                                        xml.push(t.value,"=\"",cleanString(v[i].toString()),"\"/>");
                                }else
                                 xml.push(">",cleanString(v[i].toString()),"</",t.child,">");
                            }
                        }
                    }
                    if(!notag)xml.push("</",name,">\n");
                }else{
                    for (i in v) {
                        if (!apf.json2xml_Attr[i] && i.charAt(0)!='@'){
                           if(i.match(/[^a-zA-Z0-9_-]/g)){
                               apf.console.warn("Json2XML, invalid characters found in JSON tagname: '" + i, "json2Xml");
                           }else
                               jsonToXml(v[i], i, xml,false);
                        }
                    }
                    if(!notag)xml.push("</", name, ">");
                }
            }else if(!notag)xml.push("/>");
        }
        else {
            if(!notag)xml.push("<", name, ">", cleanString(v.toString()), "</", name, ">");
            else xml.push( cleanString(v.toString()));
       }
     
    }
        
    return function(strJson, noError, preserveWhiteSpace) {
        var o   = (typeof strJson == "string" && apf.isJson(strJson))
          ? JSON.parse(strJson.replace(/""/g, '" "'))//eval("(" + strJson + ")")
          : strJson,
            xml = [], i;
        jsonToXml(o,"jsondoc", xml, false);

        return apf.getXmlDom(xml.join("").replace(/\t|\n/g, ""), noError, true);//preserveWhiteSpace);//@todo apf3.0
    };
})();

apf.xml2json = function (xml, noattrs) {
    // alright! lets go and convert our xml back to json.
    var filled, out = {}, o, nodes = xml.childNodes, cn, i,j, n,m, u,v,w, s,t,cn1,u1,v1,t1,name; 

    if(!noattrs){
        if(m = (xml.attributes))for(u = 0,v = m.length; u < v; u++){
          t = apf.json2xml_Attr[w=m[u].nodeName] || ('@'+w);
          if(t.indexOf('@a_')!=0)out[t] = m[u].nodeValue, filled = true;
        }
    }

    for (var i = 0, j = nodes.length;i<j; i++) {
        if ((n = nodes[i]).nodeType != 1)
            continue;
         name = n.tagName;
        filled = true;

        // scan for our special attribute
        t = s = null,o = {};

        if(m = (n.attributes))for(u = 0,v = m.length; u < v; u++){
            o['@'+(w = m[u].nodeName)] = m[u].nodeValue;
            if(!s)s = apf.json2xml_ObjByAttr[w];
        }
        if(t = s || apf.json2xml_Obj[name]){
            if(t==1)t={key:'name',value:'value'};
            // lets enumerate the children
            for(cn = n.childNodes, u=0,v = cn.length;u<v;u++){
                if ((s = cn[u]).nodeType != 1) continue;
                
                if(t1 = apf.json2xml_Obj[s.nodeName]){
                    var o2={};
                    for(cn1 = s.childNodes, u1=0,v1 = cn1.length;u1<v1;u1++){
                        if ((s1 = cn1[u1]).nodeType != 1) continue;
                         if(w=s1.getAttribute(t1.key)){
                            o2[w] = (t1.value==1?(s1.childNodes.length?apf.xml2json(s1,1):1):(s1.getAttribute(t1.value||'value')) || apf.xml2json(s1,1));
                        }
                    }
                    o[s.nodeName]=o2;
                } else {
                    if(w=s.getAttribute(t.key)){
                        o[w] = (t.value==1?(s.childNodes.length?apf.xml2json(s,1):1):(s.getAttribute(t.value||'value')) || apf.xml2json(s,1));
                    }
               }
            }
        }else{
            o =  apf.xml2json( n );
        }
        if(out[name] !== undefined){
            if((s=out[name]).dataType!=apf.ARRAY)
                out[name]=[s,o];
            else out[name].push(o);
        }else out[name] = o;
   }
   return filled ? out : apf.queryValue(xml, "text()");
};

//#endif

//#ifdef __WITH_JSON_API
/**
 * Reliably determines whether a variable is a string of JSON.
 * @see http://json.org/
 *
 * @param {mixed}   value The variable to check
 * @type  {Boolean}
 */
apf.isJson = (function() {
    var escapes  = /\\["\\\/bfnrtu]/g,
        values   = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
        brackets = /(?:^|:|,)(?:\s*\[)+/g,
        invalid  = /^[\],:{}\s]*$/;

    return function(value) {
        if (!value) return false;
        return invalid.test(
            value.replace(escapes, '@').replace(values, ']').replace(brackets, '')
        );
    }
})();

if (!self["JSON"]) {
    self["JSON"] = (function() {
    // Will match a value in a well-formed JSON file.
    // If the input is not well-formed, may match strangely, but not in an
    // unsafe way.
    // Since this only matches value tokens, it does not match whitespace,
    // colons, or commas.
    // The second line of the regex string matches numbers, lines number 4,
    // 5 and 6 match a string and line number 5 specifically matches one
    // character.
    var jsonToken       = new RegExp(
'(?:false|true|null|[\\{\\}\\[\\]]|\
(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)\
|\
(?:\"\
(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))\
*\"))', "g"),
        // Matches escape sequences in a string literal
        escapeSequence  = new RegExp("\\\\(?:([^u])|u(.{4}))", "g"),
        // Decodes escape sequences in object literals
        escapes         = {
            "\"": "\"",
            "/": "/",
            "\\": "\\",
            "b": "\b",
            "f": "\f",
            "n": "\n",
            "r": "\r",
            "t": "\t"
        },
        unescapeOne     = function(_, ch, hex) {
            return ch ? escapes[ch] : String.fromCharCode(parseInt(hex, 16));
        },
        // A non-falsy value that coerces to the empty string when used as a key.
        EMPTY_STRING    = new String(""),
        SLASH           = "\\",
        // Constructor to use based on an open token.
        firstTokenCtors = { "{": Object, "[": Array },
        hop             = Object.hasOwnProperty,
        padd            = function(s, p){
            s = p + s;
            return s.substring(s.length - p.length);
        },
        jsonSerialize   = {
            //Object
            0: function(o){
                //XML support - NOTICE: Ajax.org Platform specific
                if (o.nodeType && o.ownerDocument && o.cloneNode(true)) // was o.nodeType && o.cloneNode
                    return "apf.xmldb.getXml("
                        + JSON.stringify(apf.getXmlString(o)) + ")"; // was this.string()

                //Normal JS object support
                var str = [];
                for (var prop in o) {
                    str.push('"' + prop.replace(/(["\\])/g, '\\$1') + '": '
                        + JSON.stringify(o[prop]));
                }

                return "{" + str.join(", ") + "}";
            },
            
            //String
            5: function(s){
                s = '"' + s.replace(/(["\\])/g, '\\$1') + '"';
                return s.replace(/(\n)/g, "\\n").replace(/\r/g, "");
            },

            //Number
            2: function(i){
                return i.toString();
            },

            //Boolean
            4: function(b){
                return b.toString();
            },

            //Date
            3: function(d){
                return '{"jsonclass":["sys.ISODate", ["'
                    + padd(d.getUTCFullYear(), "0000")
                    + padd(d.getUTCMonth() + 1, "00") 
                    + padd(d.getUTCDate(), "00") + "T" 
                    + padd(d.getUTCHours(), "00") + ":" 
                    + padd(d.getUTCMinutes(), "00") + ":" 
                    + padd(d.getUTCSeconds(), "00")
                    + '"]]}';
            },

            //Array
            1: function(a){
                for (var q = [], i = 0; i < a.length; i++)
                    q.push(JSON.stringify(a[i]));

                return "[" + q.join(", ") + "]";
            },
            
            // Method
            7: function(f){
                return;
            }
        };


    return {
        parse: function(json, opt_reviver) {
            // Split into tokens
            var toks = json.match(jsonToken),
                // Construct the object to return
                result;
            var tok  = toks[0];
            if ("{" == tok)
                result = {};
            else if ("[" == tok)
                result = [];
            else
                throw new Error(tok);

            // If undefined, the key in an object key/value record to use for the next
            // value parsed.
            var key, cont,
                stack = [result];
            // Loop over remaining tokens maintaining a stack of uncompleted objects and
            // arrays.
            for (var i = 1, n = toks.length; i < n; ++i) {
                tok = toks[i];
                switch (tok.charCodeAt(0)) {
                    default:  // sign or digit
                        cont = stack[0];
                        cont[key || cont.length] = +(tok);
                        key = void 0;
                        break;
                    case 0x22:  // '"'
                        tok = tok.substring(1, tok.length - 1);
                        if (tok.indexOf(SLASH) !== -1) {
                            tok = tok.replace(escapeSequence, unescapeOne);
                        }
                        cont = stack[0];
                        if (!key) {
                            if (cont instanceof Array) {
                                key = cont.length;
                            }
                            else {
                                key = tok || EMPTY_STRING;  // Use as key for next value seen.
                                break;
                            }
                        }
                        cont[key] = tok;
                        key = void 0;
                        break;
                    case 0x5b:  // '['
                        cont = stack[0];
                        stack.unshift(cont[key || cont.length] = []);
                        key = void 0;
                        break;
                    case 0x5d:  // ']'
                        stack.shift();
                        break;
                    case 0x66:  // 'f'
                        cont = stack[0];
                        cont[key || cont.length] = false;
                        key = void 0;
                        break;
                    case 0x6e:  // 'n'
                        cont = stack[0];
                        cont[key || cont.length] = null;
                        key = void 0;
                        break;
                    case 0x74:  // 't'
                        cont = stack[0];
                        cont[key || cont.length] = true;
                        key = void 0;
                        break;
                    case 0x7b:  // '{'
                        cont = stack[0];
                        stack.unshift(cont[key || cont.length] = {});
                        key = void 0;
                        break;
                    case 0x7d:  // '}'
                        stack.shift();
                        break;
                }
            }
            // Fail if we've got an uncompleted object.
            if (stack.length)
                throw new Error();

            if (opt_reviver) {
                // Based on walk as implemented in http://www.json.org/json2.js
                var walk = function(holder, key) {
                    var value = holder[key];
                    if (value && typeof value == "object") {
                        var toDelete = null;
                        for (var k in value) {
                            if (hop.call(value, k) && value !== holder) {
                                // Recurse to properties first.  This has the effect of causing
                                // the reviver to be called on the object graph depth-first.
                                // Since 'this' is bound to the holder of the property, the
                                // reviver can access sibling properties of k including ones
                                // that have not yet been revived.
                                // The value returned by the reviver is used in place of the
                                // current value of property k.
                                // If it returns undefined then the property is deleted.
                                var v = walk(value, k);
                                if (v !== void 0) {
                                    value[k] = v;
                                }
                                else {
                                    // Deleting properties inside the loop has vaguely defined
                                    // semantics in ES3 and ES3.1.
                                    if (!toDelete)
                                        toDelete = [];
                                    toDelete.push(k);
                                }
                            }
                        }
                        if (toDelete) {
                            for (var i = toDelete.length; --i >= 0;)
                                delete value[toDelete[i]];
                        }
                    }
                    return opt_reviver.call(holder, key, value);
                };
                result = walk({ "": result }, "");
            }
            return result;
        },
        stringify: function(o) {
            if (typeof args == "function" || apf.isNot(o))
                return "null";
            return jsonSerialize[o.dataType || 0](o);
        }
    };

    })();
}

/**
 * Creates a json string from a javascript object.
 * @param  {mixed}  o the javascript object to serialize.
 * @return {String} the json string representation of the object.
 * @todo allow for XML serialization
 */
apf.serialize = function(o){
    return self.JSON.stringify(o);
};

/**
 * Evaluate a serialized object back to JS with eval(). When the 'secure' flag
 * is set to 'TRUE', the provided string will be validated for being valid
 * JSON.
 *
 * @param  {String} str the json string to create an object from.
 * @return {Object} the object created from the json string.
 */
apf.unserialize = function(str){
    if (!str) return str;
    return self.JSON.parse(str);
};

// #endif
