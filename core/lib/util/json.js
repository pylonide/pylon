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
 
apf.jsonObjectConvert  = {};
apf.jsonAttrConvert = {};

 
apf.json2Xml = (function(){
    var jsonToXml = function (v, name, xml, notag) {
        var i, n, m, t; 
        // do an apf warn

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
            var hasChild = false;
            if(!notag)xml.push("<", name);
            for (i in v) {
                if (n=apf.jsonAttrConvert[i]){
                    if(!notag)xml.push(" ", n, "=\"", v[i], "\"");
                } else 
                   hasChild = true;
            }
            if (hasChild) {
                if(!notag)xml.push(">");
                if(t=apf.jsonObjectConvert[name]){
                    if(t==1) t = { child : name.replace(/(.*)s$/,"$1")||name, key : "name", value: "value"};
                    for (i in v) {
                        if( typeof(m = v[i]) =='object'){
                            xml.push("<",t.child," ",t.key,"=\"",i,"\" >");
                            jsonToXml(m, i,xml,true);
                            xml.push("</",t.child,">");
                        } else {
                            xml.push("<",t.child," ",t.key,"=\"",i,"\" ");
                            if(t.value){
                             xml.push(t.value,"=\"",v[i],"\"/>");
                            }else
                             xml.push(">",v[i],"</",t.child,">");
                        }
                    }
                    if(!notag)xml.push("</",name,">");
                }else{
                    for (i in v) {
                        if (!apf.jsonAttrConvert[i]){
                           if(i.match(/[^a-zA-Z0-9_-]/g)){
                               apf.console.warn("Json2XML, invalid characters found in JSON tagname '" + i, "json2Xml");
                           }else
                               jsonToXml(v[i], i, xml,false);
                        }
                    }
                    if(!notag)xml.push("</", name, ">");
                }
            }else if(!notag)xml.push("/>");
        }
        else {
            if(!notag)xml.push("<", name, ">", v.toString().escapeHTML(), "</", name, ">");
            else xml.push( v.toString().escapeHTML());
       }
    }
        
    return function(strJson, noError, preserveWhiteSpace) {
        var o   = (typeof strJson == "string" && apf.isJson(strJson))
          ? JSON.parse(strJson)//eval("(" + strJson + ")")
          : strJson,
            xml = [], i;
        jsonToXml(o,"jsondoc", xml, false);
        return apf.getXmlDom(xml.join("").replace(/\t|\n/g, ""), noError, preserveWhiteSpace);
    };
})();

apf.xml2json = function (xml, noattrs) {
        // alright! lets go and convert our xml back to json.
        var filled, out = {}, o, nodes = xml.childNodes, cn, i,j, n,m, u,v,w, s,t; 
        
        if(!noattrs){
            if(m = (xml.attributes))
            for(u = 0,v = m.length; u < v; u++){
              if(t=apf.jsonAttrConvert[m[u].nodeName])
                 out[t] = m[u].nodeValue;
            }        
        }

        for (var i = 0, j = nodes.length;i<j; i++) {
            if ((n = nodes[i]).nodeType != 1)
                continue;
            var name = n.tagName;
            filled = true;
            
            if(t = apf.jsonObjectConvert[name]){
                o = {};
                if(t==1)t={key:'name',value:'value'};
                // lets enumerate the children
                for(cn = n.childNodes, u=0,v = cn.length;u<v;u++){
                    if(w=(s=cn[u]).getAttribute(t.key))
                        o[w] = s.getAttribute(t.value||'value') || apf.xml2json(s,1);
                }
            }else{
                o =  apf.xml2json( n );
            }
            if(out[name] !== undefined){
                if((s=out[name]).dataType!='array')
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

if (!window["JSON"]) {
    window["JSON"] = (function() {
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
            object: function(o){
                //XML support - NOTICE: Ajax.org Platform specific
                if (o.nodeType && o.cloneNode)
                    return "apf.xmldb.getXml("
                        + this.string(apf.getXmlString(o)) + ")";

                //Normal JS object support
                var str = [];
                for (var prop in o) {
                    str.push('"' + prop.replace(/(["\\])/g, '\\$1') + '": '
                        + JSON.stringify(o[prop]));
                }

                return "{" + str.join(", ") + "}";
            },

            string: function(s){
                s = '"' + s.replace(/(["\\])/g, '\\$1') + '"';
                return s.replace(/(\n)/g, "\\n").replace(/\r/g, "");
            },

            number: function(i){
                return i.toString();
            },

            "boolean": function(b){
                return b.toString();
            },

            date: function(d){
                return '{"jsonclass":["sys.ISODate", ["'
                    + padd(d.getUTCFullYear(), "0000")
                    + padd(d.getUTCMonth() + 1, "00") 
                    + padd(d.getUTCDate(), "00") + "T" 
                    + padd(d.getUTCHours(), "00") + ":" 
                    + padd(d.getUTCMinutes(), "00") + ":" 
                    + padd(d.getUTCSeconds(), "00")
                    + '"]]}';
            },

            array: function(a){
                for (var q = [], i = 0; i < a.length; i++)
                    q.push(JSON.stringify(a[i]));

                return "[" + q.join(", ") + "]";
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
            return jsonSerialize[o.dataType || "object"](o);
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
    return JSON.stringify(o);
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
    return JSON.parse(str);
};

// #endif
