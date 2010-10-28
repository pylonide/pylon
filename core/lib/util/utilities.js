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
 * Opens a window with the string in it
 * @param {String} str the html string displayed in the new window.
 */
apf.pasteWindow = function(str){
    var win = window.open("about:blank");
    win.document.write(str);
};

//#ifdef __WITH_ENTITY_ENCODING

/**
 * @private
 */
apf.xmlEntityMap = {
    "quot": "34", "amp": "38", "apos": "39", "lt": "60", "gt": "62",
    "nbsp": "160", "iexcl": "161", "cent": "162", "pound": "163", "curren": "164",
    "yen": "165", "brvbar": "166", "sect": "167", "uml": "168", "copy": "169",
    "ordf": "170", "laquo": "171", "not": "172", "shy": "173", "reg": "174",
    "macr": "175", "deg": "176", "plusmn": "177", "sup2": "178", "sup3": "179",
    "acute": "180", "micro": "181", "para": "182", "middot": "183", "cedil": "184",
    "sup1": "185", "ordm": "186", "raquo": "187", "frac14": "188", "frac12": "189",
    "frac34": "190", "iquest": "191", "agrave": "192", "aacute": "193",
    "acirc": "194", "atilde": "195", "auml": "196", "aring": "197", "aelig": "198",
    "ccedil": "199", "egrave": "200", "eacute": "201", "ecirc": "202",
    "euml": "203", "igrave": "204", "iacute": "205", "icirc": "206", "iuml": "207",
    "eth": "208", "ntilde": "209", "ograve": "210", "oacute": "211", "ocirc": "212",
    "otilde": "213", "ouml": "214", "times": "215", "oslash": "216", "ugrave": "217",
    "uacute": "218", "ucirc": "219", "uuml": "220", "yacute": "221", "thorn": "222",
    "szlig": "223", "agrave": "224", "aacute": "225", "acirc": "226", "atilde": "227",
    "auml": "228", "aring": "229", "aelig": "230", "ccedil": "231", "egrave": "232",
    "eacute": "233", "ecirc": "234", "euml": "235", "igrave": "236", "iacute": "237",
    "icirc": "238", "iuml": "239", "eth": "240", "ntilde": "241", "ograve": "242",
    "oacute": "243", "ocirc": "244", "otilde": "245", "ouml": "246", "divide": "247",
    "oslash": "248", "ugrave": "249", "uacute": "250", "ucirc": "251", "uuml": "252",
    "yacute": "253", "thorn": "254", "yuml": "255", "oelig": "338", "oelig": "339",
    "scaron": "352", "scaron": "353", "yuml": "376", "fnof": "402", "circ": "710",
    "tilde": "732", "alpha": "913", "beta": "914", "gamma": "915", "delta": "916",
    "epsilon": "917", "zeta": "918", "eta": "919", "theta": "920", "iota": "921",
    "kappa": "922", "lambda": "923", "mu": "924", "nu": "925", "xi": "926",
    "omicron": "927", "pi": "928", "rho": "929", "sigma": "931", "tau": "932",
    "upsilon": "933", "phi": "934", "chi": "935", "psi": "936", "omega": "937",
    "alpha": "945", "beta": "946", "gamma": "947", "delta": "948", "epsilon": "949",
    "zeta": "950", "eta": "951", "theta": "952", "iota": "953", "kappa": "954",
    "lambda": "955", "mu": "956", "nu": "957", "xi": "958", "omicron": "959",
    "pi": "960", "rho": "961", "sigmaf": "962", "sigma": "963", "tau": "964",
    "upsilon": "965", "phi": "966", "chi": "967", "psi": "968", "omega": "969",
    "thetasym": "977", "upsih": "978", "piv": "982", "ensp": "8194", "emsp": "8195",
    "thinsp": "8201", "zwnj": "8204", "zwj": "8205", "lrm": "8206", "rlm": "8207",
    "ndash": "8211", "mdash": "8212", "lsquo": "8216", "rsquo": "8217",
    "sbquo": "8218", "ldquo": "8220", "rdquo": "8221", "bdquo": "8222",
    "dagger": "8224", "dagger": "8225", "bull": "8226", "hellip": "8230",
    "permil": "8240", "prime": "8242", "prime": "8243", "lsaquo": "8249",
    "rsaquo": "8250", "oline": "8254", "frasl": "8260", "euro": "8364",
    "image": "8465", "weierp": "8472", "real": "8476", "trade": "8482",
    "alefsym": "8501", "larr": "8592", "uarr": "8593", "rarr": "8594",
    "darr": "8595", "harr": "8596", "crarr": "8629", "larr": "8656", "uarr": "8657",
    "rarr": "8658", "darr": "8659", "harr": "8660", "forall": "8704", "part": "8706",
    "exist": "8707", "empty": "8709", "nabla": "8711", "isin": "8712",
    "notin": "8713", "ni": "8715", "prod": "8719", "sum": "8721", "minus": "8722",
    "lowast": "8727", "radic": "8730", "prop": "8733", "infin": "8734",
    "ang": "8736", "and": "8743", "or": "8744", "cap": "8745", "cup": "8746",
    "int": "8747", "there4": "8756", "sim": "8764", "cong": "8773", "asymp": "8776",
    "ne": "8800", "equiv": "8801", "le": "8804", "ge": "8805", "sub": "8834",
    "sup": "8835", "nsub": "8836", "sube": "8838", "supe": "8839", "oplus": "8853",
    "otimes": "8855", "perp": "8869", "sdot": "8901", "lceil": "8968",
    "rceil": "8969", "lfloor": "8970", "rfloor": "8971", "lang": "9001",
    "rang": "9002", "loz": "9674", "spades": "9824", "clubs": "9827",
    "hearts": "9829", "diams": "9830"
};

/**
 * see string#escapeHTML
 * @param {String} str the html to be escaped.
 * @return {String} the escaped string.
 */
apf.htmlentities = function(str){
    return str.escapeHTML();
};

/**
 * Escape an xml string making it ascii compatible.
 * @param {String} str the xml string to escape.
 * @return {String} the escaped string.
 *
 * @todo This function does something completely different from htmlentities, 
 *       the name is confusing and misleading.
 */
apf.xmlentities = function(str) {
    return str.replace(/&([a-z]+);/gi, function(a, m) {
        if (apf.xmlEntityMap[m = m.toLowerCase()])
            return '&#' + apf.xmlEntityMap[m] + ';';
        return a;
    });
};

/**
 * Unescape an html string.
 * @param {String} str the string to unescape.
 * @return {String} the unescaped string.
 */
apf.html_entity_decode = function(str){
    return (str || "").replace(/\&\#38;/g, "&").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
};

//#endif

/**
 * Determines whether the keyboard input was a character that can influence
 * the value of an element (like a textbox).
 * @param {Number} charCode The ascii character code.
 */
apf.isCharacter = function(charCode){
    return (charCode < 112 || charCode > 122)
      && (charCode == 32 || charCode > 42 || charCode == 8);
};

/**
 * This random number generator has been added to provide a more robust and
 * reliable random number spitter than the native Ecmascript Math.random()
 * function.
 * is an implementation of the Park-Miller algorithm. (See 'Random Number
 * Generators: Good Ones Are Hard to Find', by Stephen K. Park and Keith W.
 * Miller, Communications of the ACM, 31(10):1192-1201, 1988.)
 * @author David N. Smith of IBM's T. J. Watson Research Center.
 * @author Mike de Boer (mike AT javeline DOT com)
 * @class randomGenerator
 */
apf.randomGenerator = {
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
apf.getNoCacheUrl = function(url){
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
apf.parseExpression = function(str){
    if (!apf.parseExpression.regexp.test(str))
        return str;

    //#ifdef __DEBUG
    try {
    //#endif
        return eval(RegExp.$1);
    //#ifdef __DEBUG
    }
    catch(e) {
        throw new Error(apf.formatErrorString(0, null,
            "Parsing Expression",
            "Invalid expression given '" + str + "'"));
    }
    //#endif
};
apf.parseExpression.regexp = /^\{([\s\S]*)\}$/;

/**
 * @private
 */
apf.formatNumber = function(num, prefix){
    var nr = parseFloat(num);
    if (!nr) return num;

    var str = new String(Math.round(nr * 100) / 100).replace(/(\.\d?\d?)$/, function(m1){
        return m1.pad(3, "0", apf.PAD_RIGHT);
    });
    if (str.indexOf(".") == -1)
        str += ".00";

    return prefix + str;
};

/**
 * Execute a script in the global scope.
 *
 * @param {String} str  the javascript code to execute.
 * @return {String} the javascript code executed.
 */
apf.jsexec = function(str, win){
    if (!str)
        return str;
    if (!win)
        win = self;

    if (apf.isO3)
        eval(str, self);
    else if (apf.hasExecScript) {
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
apf.K = function(){};

// #ifdef __WITH_ECMAEXT

/**
 * Reliably determines whether a variable is a Number.
 *
 * @param {mixed}   value The variable to check
 * @type  {Boolean}
 */
apf.isNumber = function(value){
    return parseFloat(value) == value;
};

/**
 * Reliably determines whether a variable is an array.
 * @see http://thinkweb2.com/projects/prototype/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
 *
 * @param {mixed}   value The variable to check
 * @type  {Boolean}
 */
apf.isArray = function(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
};

/**
 * Determines whether a string is true in the html attribute sense.
 * @param {mixed} value the variable to check
 *   Possible values:
 *   true   The function returns true.
 *   'true' The function returns true.
 *   'on'   The function returns true.
 *   1      The function returns true.
 *   '1'    The function returns true.
 * @return {Boolean} whether the string is considered to imply truth.
 */
apf.isTrue = function(c){
    return (c === true || c === "true" || c === "on" || typeof c == "number" && c > 0 || c === "1");
};

/**
 * Determines whether a string is false in the html attribute sense.
 * @param {mixed} value the variable to check
 *   Possible values:
 *   false   The function returns true.
 *   'false' The function returns true.
 *   'off'   The function returns true.
 *   0       The function returns true.
 *   '0'     The function returns true.
 * @return {Boolean} whether the string is considered to imply untruth.
 */
apf.isFalse = function(c){
    return (c === false || c === "false" || c === "off" || c === 0 || c === "0");
};

/**
 * Determines whether a value should be considered false. This excludes amongst
 * others the number 0.
 * @param {mixed} value the variable to check
 * @return {Boolean} whether the variable is considered false.
 */
apf.isNot = function(c){
    // a var that is null, false, undefined, Infinity, NaN and c isn't a string
    return (!c && typeof c != "string" && c !== 0 || (typeof c == "number" && !isFinite(c)));
};

/**
 * Creates a relative url based on an absolute url.
 * @param {String} base the start of the url to which relative url's work.
 * @param {String} url  the url to transform.
 * @return {String} the relative url.
 */
apf.removePathContext = function(base, url){
    if (!url)  return "";

    if (url.indexOf(base) > -1)
        return url.substr(base.length);

    return url;
};

/**
 * @private
 * @todo why is this done like this?
 */
apf.cancelBubble = function(e, o, noPropagate){
    if (e.stopPropagation)
        e.stopPropagation()
    else 
        e.cancelBubble = true;
    // #ifdef __WITH_FOCUS
    //if (o.$focussable && !o.disabled)
        //apf.window.$focus(o);
    // #endif
    
    /*if (apf.isIE)
        o.$ext.fireEvent("on" + e.type, e);
    else 
        o.$ext.dispatchEvent(e.name, e);*/
    
    if (!noPropagate) {
        if (o && o.$ext && o.$ext["on" + (e.type || e.name)])
            o.$ext["on" + (e.type || e.name)](e);
        apf.window.$mousedown(e);
    }
    //if (apf.isGecko)
        //apf.window.$mousedown(e);
    
    //#ifdef __WITH_UIRECORDER
    if (apf.uirecorder && apf.uirecorder.captureDetails 
      && (apf.uirecorder.isRecording || apf.uirecorder.isTesting)) {
        apf.uirecorder.capture[e.type](e);
    }
    //#endif
};

// #endif

/**
 * Attempt to fix memory leaks
 * @private
 */
apf.destroyHtmlNode = function (element) {
    if (!element) return;

    if (!apf.isIE || element.ownerDocument != document) {
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
apf.getRules = function(node){
    var rules = {};

    for (var w = node.firstChild; w; w = w.nextSibling){
        if (w.nodeType != 1)
            continue;
        else {
            if (!rules[w[apf.TAGNAME]])
                rules[w[apf.TAGNAME]] = [];
            rules[w[apf.TAGNAME]].push(w);
        }
    }

    return rules;
};
//#endif

apf.isCoord = function (n){
    return n || n === 0;
}

apf.getCoord = function (n, other){
    return n || n === 0 ? n : other;
}

/**
 * @private
 */
apf.getBox = function(value, base){
    if (!base) base = 0;

    if (value == null || (!parseInt(value) && parseInt(value) != 0))
        return [0, 0, 0, 0];

    var x = String(value).splitSafe(" ");
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
apf.getNode = function(data, tree){
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
apf.getFirstElement = function(xmlNode){
    // #ifdef __DEBUG
    try {
        xmlNode.firstChild.nodeType == 1
            ? xmlNode.firstChild
            : xmlNode.firstChild.nextSibling
    }
    catch (e) {
        throw new Error(apf.formatErrorString(1052, null,
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
apf.getLastElement = function(xmlNode){
    // #ifdef __DEBUG
    try {
        xmlNode.lastChild.nodeType == 1
            ? xmlNode.lastChild
            : xmlNode.lastChild.nextSibling
    }
    catch (e) {
        throw new Error(apf.formatErrorString(1053, null,
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
apf.selectTextHtml = function(oHtml){
    if (!apf.hasMsRangeObject) return;// oHtml.focus();

    var r = document.selection.createRange();
    try {r.moveToElementText(oHtml);} catch(e){}
    r.select();
};

// #endif
