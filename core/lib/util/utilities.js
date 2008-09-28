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

jpf.formatXml = function(output){
    if (!output) return "";
    output = output.trim();
    
    var lines = output.split("\n");
    for (var i = 0; i < lines.length; i++) 
        lines[i] = lines[i].trim();
    lines = lines.join("\n").replace(/\>\n/g, ">").replace(/\>/g, ">\n")
        .replace(/\n\</g, "<").replace(/\</g, "\n<").split("\n");
    lines.removeIndex(0);//test if this is actually always fine
    lines.removeIndex(lines.length);
    
    for (var depth = 0, i = 0; i < lines.length; i++) 
        lines[i] = "\t".repeat((lines[i].match(/^\s*\<\//)
            ? --depth
            : (lines[i].match(/^\s*\<[^\?][^>]+[^\/]\>/) ? depth++ : depth))) + lines[i];
    
    return lines.join("\n");
};

jpf.formatJS = function(x){
    var d = 0;
    return x.replace(/;+/g, ';').replace(/;}/g, '}').replace(/{;/g, '{').replace(/({)|(})|(;)/g,
        function(m, a, b, c){
            if (a) d++;
            if (b) d--;
            
            var o = '';
            for (var i = 0; i < d; i++) 
                o += '\t\t';
                
            if (a) return '{\n' + o;
            if (b) return '\n' + o + '}';
            if (c) return ';\n' + o;
        }).replace(/\>/g, '&gt;').replace(/\</g, '&lt;');
};

jpf.pasteWindow = function(str){
    var win = window.open("about:blank");
    win.document.write(str);
};

jpf.xmlEntityMap = { 
    'quot': '34', 'amp': '38', 'apos': '39', 'lt': '60', 'gt': '62',
    'nbsp': '160', 'iexcl': '161', 'cent': '162', 'pound': '163', 'curren': '164',
    'yen': '165', 'brvbar': '166', 'sect': '167', 'uml': '168', 'copy': '169',
    'ordf': '170', 'laquo': '171', 'not': '172', 'shy': '173', 'reg': '174', 'macr': '175',
    'deg': '176', 'plusmn': '177', 'sup2': '178', 'sup3': '179', 'acute': '180',
    'micro': '181', 'para': '182', 'middot': '183', 'cedil': '184', 'sup1': '185',
    'ordm': '186', 'raquo': '187', 'frac14': '188', 'frac12': '189', 'frac34': '190',
    'iquest': '191', 'Agrave': '192', 'Aacute': '193', 'Acirc': '194', 'Atilde': '195',
    'Auml': '196', 'Aring': '197', 'AElig': '198', 'Ccedil': '199', 'Egrave': '200',
    'Eacute': '201', 'Ecirc': '202', 'Euml': '203', 'Igrave': '204', 'Iacute': '205',
    'Icirc': '206', 'Iuml': '207', 'ETH': '208', 'Ntilde': '209', 'Ograve': '210',
    'Oacute': '211', 'Ocirc': '212', 'Otilde': '213', 'Ouml': '214', 'times': '215',
    'Oslash': '216', 'Ugrave': '217', 'Uacute': '218', 'Ucirc': '219', 'Uuml': '220',
    'Yacute': '221', 'THORN': '222', 'szlig': '223', 'agrave': '224', 'aacute': '225',
    'acirc': '226', 'atilde': '227', 'auml': '228', 'aring': '229', 'aelig': '230',
    'ccedil': '231', 'egrave': '232', 'eacute': '233', 'ecirc': '234', 'euml': '235',
    'igrave': '236', 'iacute': '237', 'icirc': '238', 'iuml': '239', 'eth': '240',
    'ntilde': '241', 'ograve': '242', 'oacute': '243', 'ocirc': '244', 'otilde': '245',
    'ouml': '246', 'divide': '247', 'oslash': '248', 'ugrave': '249', 'uacute': '250',
    'ucirc': '251', 'uuml': '252', 'yacute': '253', 'thorn': '254', 'yuml': '255',
    'OElig': '338', 'oelig': '339', 'Scaron': '352', 'scaron': '353', 'Yuml': '376',
    'fnof': '402', 'circ': '710', 'tilde': '732', 'Alpha': '913', 'Beta': '914',
    'Gamma': '915', 'Delta': '916', 'Epsilon': '917', 'Zeta': '918', 'Eta': '919',
    'Theta': '920', 'Iota': '921', 'Kappa': '922', 'Lambda': '923', 'Mu': '924',
    'Nu': '925', 'Xi': '926', 'Omicron': '927', 'Pi': '928', 'Rho': '929', 'Sigma': '931',
    'Tau': '932', 'Upsilon': '933', 'Phi': '934', 'Chi': '935', 'Psi': '936', 'Omega': '937',
    'alpha': '945', 'beta': '946', 'gamma': '947', 'delta': '948', 'epsilon': '949',
    'zeta': '950', 'eta': '951', 'theta': '952', 'iota': '953', 'kappa': '954',
    'lambda': '955', 'mu': '956', 'nu': '957', 'xi': '958', 'omicron': '959', 'pi': '960',
    'rho': '961', 'sigmaf': '962', 'sigma': '963', 'tau': '964', 'upsilon': '965',
    'phi': '966', 'chi': '967', 'psi': '968', 'omega': '969', 'thetasym': '977', 'upsih': '978',
    'piv': '982', 'ensp': '8194', 'emsp': '8195', 'thinsp': '8201', 'zwnj': '8204',
    'zwj': '8205', 'lrm': '8206', 'rlm': '8207', 'ndash': '8211', 'mdash': '8212',
    'lsquo': '8216', 'rsquo': '8217', 'sbquo': '8218', 'ldquo': '8220', 'rdquo': '8221',
    'bdquo': '8222', 'dagger': '8224', 'Dagger': '8225', 'bull': '8226', 'hellip': '8230',
    'permil': '8240', 'prime': '8242', 'Prime': '8243', 'lsaquo': '8249', 'rsaquo': '8250',
    'oline': '8254', 'frasl': '8260', 'euro': '8364', 'image': '8465', 'weierp': '8472',
    'real': '8476', 'trade': '8482', 'alefsym': '8501', 'larr': '8592', 'uarr': '8593',
    'rarr': '8594', 'darr': '8595', 'harr': '8596', 'crarr': '8629', 'lArr': '8656',
    'uArr': '8657', 'rArr': '8658', 'dArr': '8659', 'hArr': '8660', 'forall': '8704',
    'part': '8706', 'exist': '8707', 'empty': '8709', 'nabla': '8711', 'isin': '8712',
    'notin': '8713', 'ni': '8715', 'prod': '8719', 'sum': '8721', 'minus': '8722',
    'lowast': '8727', 'radic': '8730', 'prop': '8733', 'infin': '8734', 'ang': '8736',
    'and': '8743', 'or': '8744', 'cap': '8745', 'cup': '8746', 'int': '8747', 'there4': '8756',
    'sim': '8764', 'cong': '8773', 'asymp': '8776', 'ne': '8800', 'equiv': '8801', 'le': '8804',
    'ge': '8805', 'sub': '8834', 'sup': '8835', 'nsub': '8836', 'sube': '8838',
    'supe': '8839', 'oplus': '8853', 'otimes': '8855', 'perp': '8869', 'sdot': '8901',
    'lceil': '8968', 'rceil': '8969', 'lfloor': '8970', 'rfloor': '8971', 'lang': '9001',
    'rang': '9002', 'loz': '9674', 'spades': '9824', 'clubs': '9827', 'hearts': '9829',
    'diams': '9830'
};

jpf.htmlentities = function(str){
    return str.escapeHTML();
};

jpf.xmlentities = function(str) {
    return str.replace(/&([a-z]+);/gi, function(a, m) {
        if (jpf.xmlEntityMap[m])
            return '&#' + jpf.xmlEntityMap[m] + ';';
        return a;
    });
};

jpf.html_entity_decode = function(str){
    return (str || "").replace(/\&\#38;/g, "&").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
};

/**
 * This random number generator has been added to provide a more robust and
 * reliable random number spitter than the native Ecmascript Math.random()
 * function.
 * is an implementation of the Park-Miller algorithm. (See 'Random Number
 * Generators: Good Ones Are Hard to Find', by Stephen K. Park and Keith W.
 * Miller, Communications of the ACM, 31(10):1192-1201, 1988.)
 * @author David N. Smith of IBM's T. J. Watson Research Center.
 * @author Mike de Boer (mdeboer AT javeline DOT com)
 * @class randomGenerator
 */
jpf.randomGenerator = {
    d: new Date(),
    seed: null,
    A: 48271,
    M: 2147483647,
    Q: null,
    R: null,
    oneOverM: null,
    
    /**
     * Generates a random Number between a lower and upper boundary.
     * The algorithm uses the system time, in minutes and seconds, to 'seed'
     * itself, that is, to create the initial values from which it will generate
     * a sequence of numbers. If you are familiar with random number generators,
     * you might have reason to use some other value for the seed. Otherwise,
     * you should probably not change it.
     * @param {Number} lnr Lower boundary
     * @param {Number} unr Upper boundary
     * @result A random number between <i>lnr</i> and <i>unr</i>
     * @type Number
     */
    generate: function(lnr, unr) {
        if (this.seed == null)
            this.seed = 2345678901 + (this.d.getSeconds() * 0xFFFFFF) + (this.d.getMinutes() * 0xFFFF);
        this.Q = this.M / this.A;
        this.R = this.M % this.A;
        this.oneOverM = 1.0 / this.M;
        return Math.floor((unr - lnr + 1) * this.next() + lnr);
    },
    
    /**
     * Returns a new random number, based on the 'seed', generated by the
     * <i>generate</i> method.
     * @type Number
     */
    next: function() {
        var hi = this.seed / this.Q;
        var lo = this.seed % this.Q;
        var test = this.A * lo - this.R * hi;
        if (test > 0)
            this.seed = test;
        else
            this.seed = test + this.M;
        return (this.seed * this.oneOverM);
    }
};

jpf.getNoCacheUrl = function(url){
    return url 
        + (url.indexOf("?") == -1 ? "?" : "&") 
        + "nocache=" + new Date().getTime();
}

//Please optimize the f**k out of this function
jpf.parseExpression = function(str){
    if(!jpf.parseExpression.regexp.test(str))
        return str;
        
    return eval(RegExp.$1);
}
jpf.parseExpression.regexp = /^\{(.*)\}$/;

jpf.extend = function(dest, src){
    var prop, i, x = !dest.notNull;
    if (arguments.length == 2) {
        for (prop in src) {
            if (x || src[prop])
                dest[prop] = src[prop];
        }
        return dest;
    }
    
    for (i = 1; i < arguments.length; i++) {
        src = arguments[i];
        for (prop in src) {
            if (x || src[prop])
                dest[prop] = src[prop];
        }
    }
    return dest;
};

jpf.formatNumber = function(nr){
    var str = new String(Math.round(parseFloat(nr) * 100) / 100).replace(/(\.\d?\d?)$/, function(m1){
        return m1.pad(3, "0", jpf.PAD_RIGHT);
    });
    if (str.indexOf(".") == -1) 
        str += ".00";
    return str;
};

// Serialize Objects
jpf.JSONSerialize = {
    object: function(o){
        //XML support - NOTICE: Javeline PlatForm specific
        if (o.nodeType)
            return "jpf.xmldb.getXml(" 
                + this.string(jpf.xmldb.serializeNode(o)) + ")";
        
        //Normal JS object support
        var str = [];
        for (var prop in o) {
            str.push('"' + prop.replace(/(["\\])/g, '\\$1') + '": '
                + jpf.serialize(o[prop]));
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
        var padd = function(s, p){
            s = p + s;
            return s.substring(s.length - p.length);
        };
        var y   = padd(d.getUTCFullYear(), "0000");
        var m   = padd(d.getUTCMonth() + 1, "00");
        var d   = padd(d.getUTCDate(), "00");
        var h   = padd(d.getUTCHours(), "00");
        var min = padd(d.getUTCMinutes(), "00");
        var s   = padd(d.getUTCSeconds(), "00");
        
        var isodate = y + m + d + "T" + h + ":" + min + ":" + s;
        
        return '{"jsonclass":["sys.ISODate", ["' + isodate + '"]]}';
    },
    
    array: function(a){
        for (var q = [], i = 0; i < a.length; i++) 
            q.push(jpf.serialize(a[i]));
        
        return "[" + q.join(", ") + "]";
    }
}

/**
 * @todo allow for XML serialization
 */
jpf.serialize = function(args){
    if (typeof args == "function" || jpf.isNot(args)) 
        return "null";
    return jpf.JSONSerialize[args.dataType || "object"](args);
}

/**
 * Evaluate a serialized object back to JS with eval(). When the 'secure' flag
 * is set to 'TRUE', the provided string will be validated for being valid
 * JSON.
 * 
 * @param {Object}  str
 * @param {Boolean} secure
 * @type  {Object}
 */
jpf.unserialize = function(str, secure){
    if (!str) return str;
    if (secure && !(/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/)
      .test(str.replace(/\\./g, '@').replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, '')))
        return str;
	return eval('(' + str + ')');
};

/**
 * Execute a script in the global scope.
 * 
 * @param {String} str
 * @type  {String}
 */
jpf.exec = function(str){
    if (!str) 
        return str;
    
    if (window.execScript) {
        window.execScript(str);
    } 
    else {
        var head = document.getElementsByTagName("head")[0];
        if (head) {
            var script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.text = str;
            head.appendChild(script);
            head.removeChild(script);
        } else
            eval(str, window);
    }

    return str;
};

//shorthand for an empty function:
jpf.K = function(){};

// #ifdef __WITH_ECMAEXT

jpf.isNull = function(value){
    if (value) 
        return false;
    return (value == null || !String(value).length);
};

jpf.isArray = function(o){
    return (o && typeof o == "object" && o.length);
};

jpf.isTrue = function(c){
    return (c === true || c === "true" || c === "on" || typeof c == "number" && c > 0 || c === "1");
};

jpf.isFalse = function(c){
    return (c === false || c === "false" || c === "off" || c === 0 || c === "0");
};

jpf.isNot = function(c){
    // a var that is null, false, undefined, Infinity, NaN and c isn't a string
    return (!c && typeof c != "string" && c !== 0 || (typeof c == "number" && !isFinite(c)));
};

jpf.getDirname = function(url){
    return ((url || "").match(/^(.*\/)[^\/]*$/) || {})[1]; //Mike will check out how to optimize this line
}

jpf.getFilename = function(url){
    return ((url || "").split("?")[0].match(/(?:\/|^)([^\/]+)$/) || {})[1];
};

jpf.getAbsolutePath = function(base, src){
    return src.match(/^\w+\:\/\//) ? src : base + src;
};

jpf.removePathContext = function(base, src){
    if (!src)  return "";

    if (src.indexOf(base) > -1)
        return src.substr(base.length);

    return src;
};

jpf.getWindowWidth = function(){
    return (jpf.isIE ? document.documentElement.offsetWidth : window.innerWidth);
};

jpf.getWindowHeight = function(){
    return (jpf.isIE ? document.documentElement.offsetHeight : window.innerHeight);
};

jpf.getElement = function(parent, nr){
    var nodes = parent.childNodes;
    for (var j=0, i=0; i<nodes.length; i++) {
        if (nodes[i].nodeType != 1) continue;
        if (j++ == nr)
            return nodes[i];
    }
};

jpf.cancelBubble = function(e, o){
    e.cancelBubble = true;
    if (o.$focussable && !o.disabled)
        jpf.window.$focus(o);
};

// #ifdef __WITH_APP || __WITH_XMLDATABASE

jpf.getXmlValue = function (xmlNode, xpath){
    if (!xmlNode) return "";
    xmlNode = xmlNode.selectSingleNode(xpath);
    if (xmlNode && xmlNode.nodeType == 1)
        xmlNode = xmlNode.firstChild;
    return xmlNode ? xmlNode.nodeValue : "";
}

jpf.getXmlValues = function(xmlNode, xpath){
    var out = [];
    if (!xmlNode) return out;
    
    var nodes = xmlNode.selectNodes(xpath);
    if (!nodes.length) return out;
    
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.nodeType == 1)
            n = n.firstChild;
        out.push(n.nodeValue || "");
    }
    return out;
}

//#endif

//#ifdef __WITH_APP
//Attempt to fix memory leaks
jpf.removeNode = function (element) {
    if (!element) return;
    
    if (!jpf.isIE) {
        if (element.parentNode)
            element.parentNode.removeChild(element);
        return;
    }
    
    var garbageBin = document.getElementById('IELeakGarbageBin');
    if (!garbageBin) {
        garbageBin    = document.createElement('DIV');
        garbageBin.id = 'IELeakGarbageBin';
        garbageBin.style.display = 'none';
        document.body.appendChild(garbageBin);
    }

    // move the element to the garbage bin
    garbageBin.appendChild(element);
    garbageBin.innerHTML = '';
};

//#ifdef __WITH_SMARTBINDINGS
jpf.getRules = function(node){
    var rules = {};
    
    for (var w = node.firstChild; w; w = w.nextSibling){
        if (w.nodeType != 1)
            continue;
        else {
            if (!rules[w[jpf.TAGNAME]])
                rules[w[jpf.TAGNAME]] = [];
            rules[w[jpf.TAGNAME]].push(w);
        }
    }
    
    return rules;
};
//#endif

jpf.getNumber = function(pos){
    return (/^\d+/.exec(pos) ? parseInt(RegExp.$1) : 0)
};

jpf.getBox = function(value, base){
    if (!base) base = 0;
    
    if (value == null || (!parseInt(value) && parseInt(value) != 0)) 
        return [0, 0, 0, 0];
    
    var x = value.split(" ");
    for (var i = 0; i < x.length; i++) 
        x[i] = parseInt(x[i]) || 0;
    switch (x.length) {
        case 1:
            x[1] = x[0];
            x[2] = x[0];
            x[3] = x[0];
            break;
        case 2:
            x[2] = x[0];
            x[3] = x[1];
            break;
        case 3:
            x[3] = x[1];
            break;
    }
    
    return x;
};

jpf.getNode = function(data, tree){
    var nc = 0;//nodeCount
    //node = 1
    if (data != null) {
        for (var i = 0; i < data.childNodes.length; i++) {
            if (data.childNodes[i].nodeType == 1) {
                if (nc == tree[0]) {
                    data = data.childNodes[i];
                    if (tree.length > 1) {
                        tree.shift();
                        data = this.getNode(data, tree);
                    }
                    return data;
                }
                nc++
            }
        }
    }
    
    return null;
};

jpf.getFirstElement = function(xmlNode){
    // #ifdef __DEBUG
    try {
        xmlNode.firstChild.nodeType == 1
            ? xmlNode.firstChild
            : xmlNode.firstChild.nextSibling
    }
    catch (e) {
        throw new Error(jpf.formatErrorString(1052, null, "Skinning Engine", "Could not find first element for skin:\n" + (xmlNode ? xmlNode.xml : "null")));
    }
    // #endif
    
    return xmlNode.firstChild.nodeType == 1
        ? xmlNode.firstChild
        : xmlNode.firstChild.nextSibling;
};

jpf.getLastElement = function(xmlNode){
    // #ifdef __DEBUG
    try {
        xmlNode.lastChild.nodeType == 1
            ? xmlNode.lastChild
            : xmlNode.lastChild.nextSibling
    } 
    catch (e) {
        throw new Error(jpf.formatErrorString(1053, null, "Skinning Engine", "Could not find last element for skin:\n" + (xmlNode ? xmlNode.xml : "null")));
    }
    // #endif
    
    return xmlNode.lastChild.nodeType == 1
        ? xmlNode.lastChild
        : xmlNode.lastChild.previousSibling;
};

/*
 HTMLElement.prototype.$defineGetter__("runtimeStyle", function() {
 return document.defaultView.getComputedStyle(this, null);
 });
 */
jpf.getStyle = function(el, prop){
    if (typeof document.defaultView != "undefined"
      && typeof document.defaultView.getComputedStyle != "undefined") {
        var cStyle = document.defaultView.getComputedStyle(el, '');
        return !cStyle ? "" : cStyle.getPropertyValue(prop);
    }
    
    return el.currentStyle[prop];
};

jpf.isInRect = function(oHtml, x, y){
    var pos = this.getAbsolutePosition(oHtml);
    if (x < pos[0] || y < pos[1] || x > oHtml.offsetWidth + pos[0] - 10
      || y > oHtml.offsetHeight + pos[1] - 10) 
        return false;
    return true;
};

jpf.getWidthDiff = function(oHtml){
    return jpf.isIE
        ? Math.max(0, (parseInt(jpf.getStyle(oHtml, "paddingLeft")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "paddingRight")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "borderLeftWidth")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "borderRightWidth")) || 0))
        : Math.max(0, oHtml.offsetWidth - parseInt(jpf.getStyle(oHtml, "width")));
};

jpf.getHeightDiff = function(oHtml){
    return jpf.isIE
        ? Math.max(0, (parseInt(jpf.getStyle(oHtml, "paddingTop")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "paddingBottom")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "borderTopWidth")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "borderBottomWidth")) || 0))
        : Math.max(0, oHtml.offsetHeight - parseInt(jpf.getStyle(oHtml, "height")));
};

jpf.getDiff = function(oHtml){
    if (!jpf.isIE && oHtml.tagName == "INPUT") 
        return [6, 6];
    
    var pNode;
    if (!oHtml.offsetHeight) {
        pNode        = oHtml.parentNode;
        var nSibling = oHtml.nextSibling;
        document.body.appendChild(oHtml);
    }
    
    var diff = jpf.isIE
        ? [Math.max(0, (parseInt(jpf.getStyle(oHtml, "paddingLeft")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "paddingRight")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "borderLeftWidth")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "borderRightWidth")) || 0)),
            Math.max(0, (parseInt(jpf.getStyle(oHtml, "paddingTop")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "paddingBottom")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "borderTopWidth")) || 0)
            + (parseInt(jpf.getStyle(oHtml, "borderBottomWidth")) || 0))]
        : [Math.max(0, oHtml.offsetWidth - parseInt(jpf.getStyle(oHtml, "width"))),
            Math.max(0, oHtml.offsetHeight - parseInt(jpf.getStyle(oHtml, "height")))];
    
    if (pNode) 
        pNode.insertBefore(oHtml, nSibling);
    
    return diff;
};

jpf.getOverflowParent = function(o){
    //not sure if this is the correct way. should be tested
    
    var o = o.offsetParent;
    while (o && (this.getStyle(o, "overflow") != "hidden"
      || "absolute|relative".indexOf(this.getStyle(o, "position")) == -1)) {
        o = o.offsetParent;
    }
    return o || document.documentElement;
};

jpf.getPositionedParent = function(o){
    var o = o.offsetParent;
    while (o && o.tagName.toLowerCase() != "body"
      && "absolute|relative".indexOf(this.getStyle(o, "position")) == -1) {
        o = o.offsetParent;
    }
    return o || document.documentElement;
};

jpf.getAbsolutePosition = function(o, refParent, inclSelf){
    var s, wt = inclSelf ? 0 : o.offsetLeft, ht = inclSelf ? 0 : o.offsetTop;
    var o = inclSelf ? o : o.offsetParent;

    var b;
    while (o && o != refParent) {//&& o.tagName.toLowerCase() != "html" 
        b = jpf.isOpera ? 0 : this.getStyle(o, jpf.descPropJs 
            ? "borderLeftWidth" : "border-left-width");

        wt += (b == "medium" ? 2 : parseInt(b)) + o.offsetLeft;
        b = jpf.isOpera ? 0 : this.getStyle(o, jpf.descPropJs 
            ? "borderLeftWidth" : "border-left-width");
        ht += (b == "medium" ? 2 : parseInt(b)) + o.offsetTop;
        
        if (o.tagName.toLowerCase() == "table") {
            ht -= parseInt(o.border || 0) + parseInt(o.cellSpacing || 0);
            wt -= parseInt(o.border || 0) + parseInt(o.cellSpacing || 0) * 2;
        } else if (o.tagName.toLowerCase() == "tr") {
            ht -= (cp = parseInt(o.parentNode.parentNode.cellSpacing));
            while (o.previousSibling) 
                ht -= (o = o.previousSibling).offsetHeight + cp;
        }
        
        o = o.offsetParent;
    }
    
    return [wt, ht];
};

jpf.selectTextHtml = function(oHtml){
    if (!jpf.hasMsRangeObject) return;// oHtml.focus();
    
    var r = document.selection.createRange();
    try {r.moveToElementText(oHtml);} catch(e){}
    r.select();
};

// #endif
