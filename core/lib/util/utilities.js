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

// #ifdef __WITH_UTILITIES

/**
 * Formats an xml string with good indentation. Also known as pretty printing.
 * @param {String} strXml the xml to format.
 * @return {String} the formatted string.
 */
jpf.formatXml = function(strXml){
    if (!strXml) return "";
    strXml = strXml.trim();
    
    var lines = strXml.split("\n");
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

/**
 * Syntax highlights an xml string using html.
 * @param {String} strXml the xml to highlight.
 * @return {String} the highlighted string.
 */
jpf.highlightXml = function(str){
	return str.replace(/^[\r\n]/g,"").replace(/</g, "_@A@_")
	   .replace(/>/g, "_@B@_")
	   .replace(/(\s[\w-]+)(\s*=\s*)("[^"]*")/g, '<span style="color:#e61414">$1</span>$2<span style="color:black">$3</span>')
	   .replace(/(\s[\w-]+)(\s*=\s*)('[^']*')/g, "<span style='color:#e61414'>$1</span>$2<span style='color:black'>$3</span>")
	   .replace(/\t/g, "&nbsp;&nbsp;&nbsp;")
	   .replace(/\n/g, "<br />")
	   .replace(/_@B@_/g, "<span style='color:#0866ab'>&gt;</span>")
	   .replace(/_@A@_([\-\!\[\\/\w:\.]+)?/g, "<span style='color:#0866ab'>&lt;$1</span>");
}

/**
 * Syntax highlights a code string using html.
 * @param {String} strCode the code to highlight.
 * @return {String} the highlighted string.
 */
jpf.highlightCode = function(strCode){
	return strCode.replace(/^[\r\n]/g,"").replace(/</g, "_@A@_")
	   .replace(/>/g, "_@B@_")
	   .replace(/((?:\s|^)[\w-]+)(\s*=\s*)("[^"]*")/g, '<span style="color:red">$1</span>$2<span style="color:black">$3</span>')
	   .replace(/((?:\s|^)[\w-]+)(\s*=\s*)('[^']*')/g, "<span style='color:red'>$1</span>$2<span style='color:black'>$3</span>")
	   .replace(/(_@A@_[\s\S]*?_@B@_|<[\s\S]*?>)|(\/\/.*)$|("(?:[^"]+|\\.)*")|('(?:[^']+|\\.)*')|(\W)(break|continue|do|for|import|new|this|void|case|default|else|function|in|return|typeof|while|comment|delete|export|if|label|switch|var|with|abstract|implements|protected|boolean|instanceOf|public|byte|int|short|char|interface|static|double|long|synchronized|false|native|throws|final|null|transient|float|package|true|goto|private|catch|enum|throw|class|extends|try|const|finally|debugger|super)(\W)|(\W)(\w+)(\s*\()/gm, 
	        function(m, tag, co, str1, str2, nw, kw, nw2, fW, f, fws) {
	            if (tag) return tag;
	            else if (f)
	                return fW + '<span style="color:#ff8000">' + f + '</span>' + fws;
	            else if (co)
	                return '<span style="color:green">' + co + '</span>';
	            else if (str1 || str2)
	                return '<span style="color:#808080">' + (str1 || str2) + '</span>';
	            else if (nw)
	                return nw + '<span style="color:#127ac6">' + kw + '</span>' + nw2;
            })
       .replace(/_@A@_(!--[\s\S]*?--)_@B@_/g, '<span style="color:green">&lt;$1&gt;</span>')
	   .replace(/\t/g, "&nbsp;&nbsp;&nbsp;")
	   .replace(/\n/g, "<br />")
	   .replace(/_@B@_/g, "<span style='color:#127ac6'>&gt;</span>")
	   .replace(/_@A@_([\-\!\[\\/\w:\.]+)?/g, "<span style='color:#127ac6'>&lt;$1</span>")
}

/**
 * Formats a javascript string with good indentation. Also known as pretty printing.
 * @param {String} strJs the javascript to format.
 * @return {String} the formatted string.
 */
jpf.formatJS = function(strJs){
    var d = 0;
    return strJs.replace(/;+/g, ';').replace(/;}/g, '}').replace(/{;/g, '{').replace(/({)|(})|(;)/g,
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

/**
 * Opens a window with the string in it
 * @param {String} str the html string displayed in the new window.
 */
jpf.pasteWindow = function(str){
    var win = window.open("about:blank");
    win.document.write(str);
};

//#ifdef __WITH_ENTITY_ENCODING

/**
 * @private
 */
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

/**
 * see string#escapeHTML
 * @param {String} str the html to be escaped.
 * @return {String} the escaped string.
 */
jpf.htmlentities = function(str){
    return str.escapeHTML();
};

/**
 * Escape an xml string making it ascii compatible.
 * @param {String} str the xml string to escape.
 * @return {String} the escaped string.
 */
jpf.xmlentities = function(str) {
    return str.replace(/&([a-z]+);/gi, function(a, m) {
        if (jpf.xmlEntityMap[m])
            return '&#' + jpf.xmlEntityMap[m] + ';';
        return a;
    });
};

/**
 * Unescape an html string.
 * @param {String} str the string to unescape.
 * @return {String} the unescaped string.
 */
jpf.html_entity_decode = function(str){
    return (str || "").replace(/\&\#38;/g, "&").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
};

//#endif

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

/**
 * Adds a time stamp to the url to prevent the browser from caching it.
 * @param {String} url the url to add the timestamp to.
 * @return {String} the url with timestamp.
 */
jpf.getNoCacheUrl = function(url){
    return url 
        + (url.indexOf("?") == -1 ? "?" : "&") 
        + "nocache=" + new Date().getTime();
};

/**
 * Checks if the string contains curly braces at the start and end. If so it's
 * processed as javascript, else the original string is returned.
 * @param {String} str the string to parse.
 * @return {String} the result of the parsing.
 */
jpf.parseExpression = function(str){
    if(!jpf.parseExpression.regexp.test(str))
        return str;
        
    return eval(RegExp.$1);
};
jpf.parseExpression.regexp = /^\{(.*)\}$/;

/**
 * @private
 */
jpf.formatNumber = function(num, prefix){
    var nr = parseFloat(num);
    if (!nr) return num;
    
    var str = new String(Math.round(nr * 100) / 100).replace(/(\.\d?\d?)$/, function(m1){
        return m1.pad(3, "0", jpf.PAD_RIGHT);
    });
    if (str.indexOf(".") == -1) 
        str += ".00";
    
    return prefix + str;
};

// Serialize Objects
/**
 * @private
 */
jpf.JSONSerialize = {
    object: function(o){
        //XML support - NOTICE: Javeline PlatForm specific
        if (o.nodeType && o.cloneNode)
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
        var D   = padd(d.getUTCDate(), "00");
        var h   = padd(d.getUTCHours(), "00");
        var min = padd(d.getUTCMinutes(), "00");
        var s   = padd(d.getUTCSeconds(), "00");
        
        var isodate = y + m + D + "T" + h + ":" + min + ":" + s;
        
        return '{"jsonclass":["sys.ISODate", ["' + isodate + '"]]}';
    },
    
    array: function(a){
        for (var q = [], i = 0; i < a.length; i++) 
            q.push(jpf.serialize(a[i]));
        
        return "[" + q.join(", ") + "]";
    }
};

/**
 * Creates a json string from a javascript object.
 * @param {mixed} the javascript object to serialize.
 * @return {String} the json string representation of the object.
 * @todo allow for XML serialization
 */
jpf.serialize = function(args){
    if (typeof args == "function" || jpf.isNot(args)) 
        return "null";
    return jpf.JSONSerialize[args.dataType || "object"](args);
};

/**
 * Evaluate a serialized object back to JS with eval(). When the 'secure' flag
 * is set to 'TRUE', the provided string will be validated for being valid
 * JSON.
 * 
 * @param {String}  str     the json string to create an object from.
 * @param {Boolean} secure  wether the json string should be checked to prevent malice.
 * @return {Object} the object created from the json string.
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
 * @param {String} str  the javascript code to execute.
 * @return {String} the javascript code executed.
 */
jpf.exec = function(str, win){
    if (!str) 
        return str;
    if (!win)
        win = self;
    
    if (jpf.hasExecScript) {
        win.execScript(str);
    } 
    else {
        var head = win.document.getElementsByTagName("head")[0];
        if (head) {
            var script = win.document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.text = str;
            head.appendChild(script);
            head.removeChild(script);
        } else
            eval(str, win);
    }

    return str;
};

/**
 * Shorthand for an empty function.
 */
jpf.K = function(){};

// #ifdef __WITH_ECMAEXT

/**
 * Determines wether a variable is null or empty string.
 * @param {mixed} value the variable to check
 * @return {Boolean}
 */
jpf.isNull = function(value){
    if (value) 
        return false;
    return (value == null || !String(value).length);
};

/**
 * Determines wether a string is true in the html attribute sense.
 * @param {mixed} value the variable to check
 *   Possible values:
 *   true   The function returns true.
 *   'true' The function returns true.
 *   'on'   The function returns true.
 *   1      The function returns true.
 *   '1'    The function returns true.
 * @return {Boolean} wether the string is considered to imply truth.
 */
jpf.isTrue = function(c){
    return (c === true || c === "true" || c === "on" || typeof c == "number" && c > 0 || c === "1");
};

/**
 * Determines wether a string is false in the html attribute sense.
 * @param {mixed} value the variable to check
 *   Possible values:
 *   false   The function returns true.
 *   'false' The function returns true.
 *   'off'   The function returns true.
 *   0       The function returns true.
 *   '0'     The function returns true.
 * @return {Boolean} wether the string is considered to imply untruth.
 */
jpf.isFalse = function(c){
    return (c === false || c === "false" || c === "off" || c === 0 || c === "0");
};

/** 
 * Determines wether a value should be considered false. This excludes amongst
 * others the number 0.
 * @param {mixed} value the variable to check
 * @return {Boolean} wether the variable is considered false.
 */
jpf.isNot = function(c){
    // a var that is null, false, undefined, Infinity, NaN and c isn't a string
    return (!c && typeof c != "string" && c !== 0 || (typeof c == "number" && !isFinite(c)));
};

/**
 * Returns the directory portion of a url
 * @param {String} url the url to retrieve from.
 * @return {String} the directory portion of a url.
 */
jpf.getDirname = function(url){
    return ((url || "").match(/^(.*\/)[^\/]*$/) || {})[1]; //Mike will check out how to optimize this line
};

/**
 * Returns the file portion of a url
 * @param {String} url the url to retrieve from.
 * @return {String} the file portion of a url.
 */
jpf.getFilename = function(url){
    return ((url || "").split("?")[0].match(/(?:\/|^)([^\/]+)$/) || {})[1];
};

/**
 * Returns an absolute url based on url.
 * @param {String} base the start of the url to which relative url's work.
 * @param {String} url  the url to transform.
 * @return {String} the absolute url.
 */
jpf.getAbsolutePath = function(base, url){
    return url.match(/^\w+\:\/\//) ? url : base + url;
};

/**
 * Creates a relative url based on an absolute url.
 * @param {String} base the start of the url to which relative url's work.
 * @param {String} url  the url to transform.
 * @return {String} the relative url.
 */
jpf.removePathContext = function(base, url){
    if (!url)  return "";

    if (url.indexOf(base) > -1)
        return url.substr(base.length);

    return url;
};

/**
 * @private
 * @todo why is this done like this?
 */
jpf.cancelBubble = function(e, o){
    e.cancelBubble = true;
    if (o.$focussable && !o.disabled)
        jpf.window.$focus(o);
};

// #endif

// #ifdef __WITH_XMLDATABASE

/**
 * Queries an xml node using xpath for a string value. 
 * @param {XMLElement} xmlNode the xml element to query.
 * @param {String}     xpath   the xpath query.
 * @return {String} the value of the query result or empty string.
 */
jpf.getXmlValue = function (xmlNode, xpath){
    if (!xmlNode) return "";
    xmlNode = xmlNode.selectSingleNode(xpath);
    if (xmlNode && xmlNode.nodeType == 1)
        xmlNode = xmlNode.firstChild;
    return xmlNode ? xmlNode.nodeValue : "";
};

/**
 * Queries an xml node using xpath for a string value. 
 * @param {XMLElement} xmlNode the xml element to query.
 * @param {String}     xpath   the xpath query.
 * @return {Arary} list of values which are a result of the query.
 */
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
};

//#endif

/**
 * Attempt to fix memory leaks
 * @private
 */
jpf.removeNode = function (element) {
    if (!element) return;
    
    if (!jpf.isIE || element.ownerDocument != document) {
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
/**
 * @private
 */
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

/**
 * @private
 */
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

/**
 * @private
 */
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

/**
 * Retrieves the first xml node with nodeType 1 from the children of an xml element.
 * @param {XMLElement} xmlNode the xml element that is the parent of the element to select.
 * @return {XMLElement} the first child element of the xml parent.
 * @throw error when no child element is found.
 */
jpf.getFirstElement = function(xmlNode){
    // #ifdef __DEBUG
    try {
        xmlNode.firstChild.nodeType == 1
            ? xmlNode.firstChild
            : xmlNode.firstChild.nextSibling
    }
    catch (e) {
        throw new Error(jpf.formatErrorString(1052, null, 
            "Xml Selection", 
            "Could not find element:\n" 
            + (xmlNode ? xmlNode.xml : "null")));
    }
    // #endif
    
    return xmlNode.firstChild.nodeType == 1
        ? xmlNode.firstChild
        : xmlNode.firstChild.nextSibling;
};

/**
 * Retrieves the last xml node with nodeType 1 from the children of an xml element.
 * @param {XMLElement} xmlNode the xml element that is the parent of the element to select.
 * @return {XMLElement} the last child element of the xml parent.
 * @throw error when no child element is found.
 */
jpf.getLastElement = function(xmlNode){
    // #ifdef __DEBUG
    try {
        xmlNode.lastChild.nodeType == 1
            ? xmlNode.lastChild
            : xmlNode.lastChild.nextSibling
    } 
    catch (e) {
        throw new Error(jpf.formatErrorString(1053, null, 
            "Xml Selection", 
            "Could not find last element:\n" 
            + (xmlNode ? xmlNode.xml : "null")));
    }
    // #endif
    
    return xmlNode.lastChild.nodeType == 1
        ? xmlNode.lastChild
        : xmlNode.lastChild.previousSibling;
};

/**
 * Selects the content of an html element. Currently only works in 
 * internet explorer.
 * @param {HTMLElement} oHtml the container in which the content receives the selection.
 */
jpf.selectTextHtml = function(oHtml){
    if (!jpf.hasMsRangeObject) return;// oHtml.focus();
    
    var r = document.selection.createRange();
    try {r.moveToElementText(oHtml);} catch(e){}
    r.select();
};

// #endif
