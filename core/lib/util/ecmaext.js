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

// #ifdef __WITH_ECMAEXT

// start closure:
//(function(){

if (typeof isFinite == "undefined") {
    function isFinite(val){
        return val + 1 != val;
    }
}

apf.NUMBER   = 1;
apf.BOOLEAN  = 2;
apf.STRING   = 3;
apf.ARRAY    = 4;
apf.DATE     = 5;
apf.REGEXP   = 6;
apf.FUNCTION = 7;

Array.prototype.dataType    = apf.ARRAY;
Number.prototype.dataType   = apf.NUMBER;
Date.prototype.dataType     = apf.DATE;
Boolean.prototype.dataType  = apf.BOOLEAN;
String.prototype.dataType   = apf.STRING;
RegExp.prototype.dataType   = apf.REGEXP;
Function.prototype.dataType = apf.FUNCTION;

/**
 * Converts a javascript object to a cgi string.
 * @see core.convertXml
 */
apf.getCgiString = function(args, multicall, mcallname){
    var vars = [];

    function recur(o, stack) {
        var prop;
        if (apf.isArray(o)) {
            for (var j = 0; j < o.length; j++)
                recur(o[j], stack + "%5B%5D");//" + j + "
        } 
        else if (typeof o == "object") {
            for (prop in o) {
                if (apf.isSafariOld && (!o[prop] || typeof p[prop] != "object"))
                    continue;

                if (typeof o[prop] == "function")
                    continue;
                recur(o[prop], stack + "%5B" + encodeURIComponent(prop) + "%5D");
            }
        }
        else
            vars.push(stack + "=" + encodeURIComponent(o));
    };

    if (multicall) {
        vars.push("func=" + mcallname);
        for (var i = 0; i < args[0].length; i++)
            recur(args[0][i], "f%5B" + i + "%5D");
    } else {
        for (prop in args) {
            if (apf.isSafariOld && (!args[prop] || typeof args[prop] == "function"))
                continue;

            recur(args[prop], prop);
        }
    }

    return vars.join("&");
}

/**
 * Converts a cgi string to a javascript object.
 * @see core.convertXml
 */
apf.fromCgiString = function(args) {
    if (!args)
        return false;

    var obj = {};
    args = args.split("&");
    for (var data, i = 0; i < args.length; i++) {
        data = args[i].split("=");
        data[0] = decodeURIComponent(data[0]);
        var path = data[0].replace(/\]/g, "").split("[");

        var spare = obj;
        for (var j = 0; j < path.length; j++) {
            if (spare[path[j]])
                spare = spare[path[j]];
            else if (path.length == j+1) {
                if (path[j])
                    spare[path[j]] = decodeURIComponent(data[1]);
                else
                    spare.push(decodeURIComponent(data[1]));
                break; //assuming last
            }
            else{
                spare[path[j]] = !path[j+1] ? [] : {};
                spare = spare[path[j]];
            }
        }
    }

    return obj;
}

//#ifdef __DEPRECATED
//Mac workaround...
Function.prototype.call = Function.prototype.call || function(obj, arg1, arg2, arg3){
    obj.tf = this;
    var rv = obj.tf(arg1, arg2, arg3);
    obj.tf = null;
    return rv;
};
//#endif


/**
 * Extends a Function object with properties from other objects, specified as
 * arguments.
 *
 * @param {mixed} obj1, obj2, obj3, etc.
 * @type Function
 * @see apf.extend
 */
Function.prototype.extend = function() {
    apf.extend.apply(this, [this].concat(Array.prototype.slice.call(arguments)));
    return this;
};

/**
 * Attach a Function object to an event as handler method. If apf.AbstractEvent
 * is available, the active event is extended with convinience accessors as
 * declared in apf.AbstractEvent
 *
 * @param {Object} The context the execute the Function within
 * @param {Boolean} Whether the passed event object should be extended with AbstractEvent
 * @param {mixed}  param1, param2, param3, etc.
 * @type Function
 * @see apf.AbstractEvent
 */
Function.prototype.bindWithEvent = function() {
    var __method = this, 
        args     = Array.prototype.slice.call(arguments),
        o        = args.shift(),
        ev       = args.shift();
    return function(event) {
        if (!event)
            event = window.event;
        // #ifdef __WITH_ABSTRACTEVENT
        if (ev === true)
            event = new apf.AbstractEvent(event, window);
        // #endif
        return __method.apply(o, [event].concat(args)
            .concat(Array.prototype.slice.call(arguments)));
    }
};

/**
 * The bind function creates a new function (a bound function) that calls the
 * function that is its this value (the bound function's target function) with 
 * a specified this parameter, which cannot be overridden. bind also accepts 
 * leading default arguments to provide to the target function when the bound 
 * function is called.  A bound function may also be constructed using the new 
 * operator: doing so acts as though the target function had instead been 
 * constructed.  The provided this value is ignored, while prepended arguments 
 * are provided to the emulated function.
 * 
 * @param {Object} context The 'this' context of the bound function
 * @type Function
 */
if (!Function.prototype.bind)  
    Function.prototype.bind = function(context /*, arg1, arg2... */) {  
        if (typeof this !== 'function') throw new TypeError();  
        var _arguments = Array.prototype.slice.call(arguments, 1),  
            _this = this,  
            _concat = Array.prototype.concat,  
            _function = function() {  
                return _this.apply(this instanceof _dummy ? this : context,  
                    _concat.apply(_arguments, arguments));  
            },  
            _dummy = function() {};  
        _dummy.prototype = _this.prototype;  
        _function.prototype = new _dummy();  
        return _function;  
};

/**
 * Copy an array, like this statement would: 'this.concat([])', but then do it
 * recursively.
 */
Array.prototype.copy = function(){
    var ar = [];
    for (var i = 0, j = this.length; i < j; i++)
        ar[i] = this[i] && this[i].copy ? this[i].copy() : this[i];

    return ar;
};

/**
 * Concatenate the current Array instance with one (or more) other Arrays, like
 * Array.concat(), but return the current Array instead of a new one that
 * results from the merge.
 *
 * @param {Array} array1, array2, array3, etc.
 * @type  {Array}
 */
Array.prototype.merge = function(){
    for (var i = 0, k = arguments.length; i < k; i++) {
        for (var j = 0, l = arguments[i].length; j < l; j++) {
            this.push(arguments[i][j]);
        }
    }
};

/**
 * Add the values of one or more arrays to the current instance by using the
 * '+=' operand on each value.
 *
 * @param {Array} array1, array2, array3, etc.
 * @type  {Array}
 * @see Array.copy
 */
Array.prototype.arrayAdd = function(){
    var s = this.copy();
    for (var i = 0, k = arguments.length; i < k; i++) {
        for (var j = 0, l = s.length; j < l; j++) {
            s[j] += arguments[i][j];
        }
    }

    return s;
};

/**
 * Check if an object is contained within the current Array instance.
 *
 * @param {mixed}   obj The value to check for inside the Array
 * @type  {Boolean}
 */
Array.prototype.equals = function(obj){
    for (var i = 0, j = this.length; i < j; i++)
        if (this[i] != obj[i])
            return false;
    return true;
};

/**
 * Make sure that an array instance contains only unique values (NO duplicates).
 *
 * @type {Array}
 */
Array.prototype.makeUnique = function(){
    var i, length, newArr = [];
    for (i = 0, length = this.length; i < length; i++)
        if (newArr.indexOf(this[i]) == -1)
            newArr.push(this[i]);

    this.length = 0;
    for (i = 0, length = newArr.length; i < length; i++)
        this.push(newArr[i]);

    return this;
};

/**
 * Check if this array instance contains a value 'obj'.
 *
 * @param {mixed}  obj    The value to check for inside the array
 * @param {Number} [from] Left offset index to start the search from
 * @type  {Boolean}
 * @see Array.indexOf
 */
Array.prototype.contains = function(obj, from){
    return this.indexOf(obj, from) != -1;
};

/**
 * Search for the index of the first occurence of a value 'obj' inside an array
 * instance.
 * July 29, 2008: added 'from' argument support to indexOf()
 *
 * @param {mixed}  obj    The value to search for inside the array
 * @param {Number} [from] Left offset index to start the search from
 * @type  {Number}
 */
Array.prototype.indexOf = Array.prototype.indexOf || function(obj, from){
    var len = this.length;
    for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++) {
        if (this[i] === obj)
            return i;
    }
    return -1;
};

/**
 * Search for the index of the last occurence of a value 'obj' inside an array
 * instance.
 *
 * @param {mixed}  obj    The value to search for inside the array
 * @param {Number} [from] Left offset index to start the search from
 * @type  {Number}
 */
Array.prototype.lastIndexOf = Array.prototype.lastIndexOf || function(obj, from) {
    //same as indexOf(), but in reverse loop, JS spec 1.6
    var len = this.length;
    for (var i = (from >= len) ? len - 1 : (from < 0) ? from + len : len - 1; i >= 0; i--) {
        if (this[i] === obj)
            return i;
    }
    return -1;
};

/**
 * Like Array.push, but only invoked when the value 'item' is already present
 * inside the array instance.
 *
 * @param {mixed} item, item, ...
 * @type  {Array}
 */
Array.prototype.pushUnique = function(){
    var item,
        i = 0,
        l = arguments.length;
    for (; i < l; ++i) {
        item = arguments[i];
    if (this.indexOf(item) == -1)
        this.push(item);
    }
    return this;
};

/**
 * @todo: Ruben: could you please comment on this function? Seems to serve a very
 * specific purpose...
 *
 * I also could not find an occurrence in our codebase.
 */
Array.prototype.search = function(){
    for (var i = 0, length = arguments.length; i < length; i++) {
        if (typeof this[i] != "array")
            continue;
        for (var j = 0; j < length; j++) {
            if (this[i][j] != arguments[j])
                break;
            else if (j == (length - 1))
                return this[i];
        }
    }
};

/**
 * Iterate through each value of an array instance from left to right (front to
 * back) and execute a callback Function for each value.
 *
 * @param {Function} fn
 * @type  {Array}
 */
Array.prototype.each =
Array.prototype.forEach = Array.prototype.forEach || function(fn) {
    for (var i = 0, l = this.length; i < l; i++)
        fn.call(this, this[i], i, this) === false
    return this;
}

/**
 * Search for a value 'obj' inside an array instance and remove it when found.
 *
 * @type {mixed} obj
 * @type {Array}
 */
Array.prototype.remove = function(obj){
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] != obj)
            continue;

        this.splice(i, 1);
    }

    return this;
};

/**
 * Remove an item from an array instance which can be identified with key 'i'
 *
 * @param  {Number} i
 * @return {mixed}  The removed item
 */
Array.prototype.removeIndex = function(i){
    if (!this.length) return null;
    return this.splice(i, 1);
};

/**
 * Insert a new value at a specific object; alias for Array.splice.
 *
 * @param {mixed}  obj Value to insert
 * @param {Number} i   Index to insert 'obj' at
 * @type  {Number}
 */
Array.prototype.insertIndex = function(obj, i){
    this.splice(i, 0, obj);
};

/**
 * Reverses the order of the elements of an array; the first becomes the last,
 * and the last becomes the first.
 *
 * @type {Array}
 */
Array.prototype.invert =
Array.prototype.reverse = Array.prototype.reverse || function(){
    var l = this.length - 1;
    for (var temp, i = 0; i < Math.ceil(0.5 * l); i++) {
        temp        = this[i];
        this[i]     = this[l - i]
        this[l - i] = temp;
    }

    return this;
};

//#ifdef __DEPRECATED

/*
    These functions are really old, is there any browser that
    doesn't support them? I don't think so. Lets opt for
    removal
*/
/**
 * Adds one or more elements to the end of an array and returns the new length
 * of the array.
 *
 * @param {mixed} value1, value2, value3, etc.
 * @type  {Number}
 */
Array.prototype.push = Array.prototype.push || function(){
    for (var i = arguments.length - 1; i >= 0; i--)
        this[this.length] = arguments[i];
    return this.length;
};

/**
 * Removes the last element from an array and returns that element.
 *
 * @type {mixed}
 */
Array.prototype.pop = Array.prototype.pop || function(){
    var item = this[this.length - 1];
    delete this[this.length - 1];
    this.length--;
    return item;
};

/**
 * Removes the first element from an array and returns that element.
 *
 * @type {mixed}
 */
Array.prototype.shift = Array.prototype.shift || function(){
    var item = this[0];
    for (var i = 0, l = this.length; i < l; i++)
        this[i] = this[i + 1];
    this.length--;
    return item;
};

/**
 * Joins all elements of an array into a string.
 *
 * @param {String} connect
 * @type  {String}
 */
Array.prototype.join = Array.prototype.join || function(connect){
    for (var str = "", i = 0, l = this.length; i < l; i++)
        str += this[i] + (i < l - 1 ? connect : "");
    return str;
};

//#endif

/*
 * Attempt to fully comply (in terms of functionality) with the JS specification,
 * up 'till version 1.7:
 * @link http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array
 */

/**
 * Creates a new array with all of the elements of this array for which the
 * provided filtering function returns true.
 *
 * @param {Function} fn   Function to test each element of the array.
 * @param {Object}   bind Object to use as this when executing callback.
 * @type  {Array}
 */
Array.prototype.filter = Array.prototype.filter || function(fn, bind){
    var results = [];
    for (var i = 0, l = this.length; i < l; i++) {
        if (fn.call(bind, this[i], i, this))
            results.push(this[i]);
    }
    return results;
};

/**
 * Returns true if every element in this array satisfies the provided testing
 * function.
 *
 * @param {Function} fn   Function to test for each element.
 * @param {Object}   bind Object to use as this when executing callback.
 * @type  {Boolean}
 */
Array.prototype.every = Array.prototype.every || function(fn, bind){
    for (var i = 0, l = this.length; i < l; i++) {
        if (!fn.call(bind, this[i], i, this))
            return false;
    }
    return true;
};

/**
 * Creates a new array with the results of calling a provided function on every
 * element in this array.
 *
 * @param {Function} fn   Function that produces an element of the new Array from an element of the current one.
 * @param {Object}   bind Object to use as this when executing callback.
 * @type  {Array}
 */
Array.prototype.map = Array.prototype.map || function(fn, bind){
    var results = [];
    for (var i = 0, l = this.length; i < l; i++)
        results[i] = fn.call(bind, this[i], i, this);
    return results;
};

/**
 * Tests whether some element in the array passes the test implemented by the
 * provided function.
 *
 * @param {Function} fn   Function to test for each element.
 * @param {Object}   bind Object to use as this when executing callback.
 * @type  {Boolean}
 */
Array.prototype.some = Array.prototype.some || function(fn, bind){
    for (var i = 0, l = this.length; i < l; i++) {
        if (fn.call(bind, this[i], i, this))
            return true;
    }
    return false;
};

// #ifdef __WITH_UUID
/**
 * Generate a random uuid. Usage: Math.uuid(length, radix)
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 *
 * @param {Number} [len]   The desired number of characters. Defaults to rfc4122, version 4 form
 * @param {Number} [radix] The number of allowable values for each character.
 * @type  {String}
 */
Math.uuid = function(len, radix) {
    var i,
        chars = Math.uuid.CHARS,
        uuid  = [],
        rnd   = Math.random;
    radix     = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++)
            uuid[i] = chars[0 | rnd() * radix];
    }
    else {
        // rfc4122, version 4 form
        var r;
        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
        uuid[14] = "4";

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | rnd() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
            }
        }
    }

    return uuid.join("");
};
//Public array of chars to use
Math.uuid.CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");

// #endif

/**
 * Transform a number to a string and pad it with a zero digit its length is one.
 *
 * @type {String}
 */
Number.prototype.toPrettyDigit = Number.prototype.toPrettyDigit || function() {
    var n = this.toString();
    return (n.length == 1) ? "0" + n : n;
};

RegExp.prototype.getNativeFlags = function() {
    return (this.global     ? "g" : "") +
           (this.ignoreCase ? "i" : "") +
           (this.multiline  ? "m" : "") +
           (this.extended   ? "x" : "") +
           (this.sticky     ? "y" : "");
};

/**
 * Accepts flags; returns a new XRegExp object generated by recompiling
 * the regex with the additional flags (may include non-native flags).
 * the original regex object is not altered.
 */
RegExp.prototype.addFlags = function(flags){
    return new RegExp(this.source, (flags || "") + this.getNativeFlags());
};

/**
 * Casts the first character in a string to uppercase.
 *
 * @type {String}
 */
String.prototype.uCaseFirst = function(){
    return this.substr(0, 1).toUpperCase() + this.substr(1)
};

/**
 * Removes spaces and other space-like characters from the left and right ends
 * of a string
 *
 * @type {String}
 */
String.prototype.trim = function(){
    return this.replace(/[\s\n\r]*$/, "").replace(/^[\s\n\r]*/, "");
};

/**
 * Concatenate a string with itself n-times.
 *
 * @param {Number} times Number of times to repeat the String concatenation
 * @type  {String}
 */
String.prototype.repeat = function(times){
    return Array(times + 1).join(this);
};

/**
 * Count the number of occurences of substring 'str' inside a string
 *
 * @param {String} str
 * @type  {Number}
 */
String.prototype.count = function(str){
    return this.split(str).length - 1;
};

/**
 * Remove HTML or any XML-like tags from a string
 *
 * @type {String}
 */
String.prototype.stripTags = function() {
    return this.replace(/<\/?[^>]+>/gi, "");
};

/**
 * Wrapper for the global 'escape' function for strings
 *
 * @type {String}
 */
String.prototype.escape = function() {
    return escape(this);
};

/**
 * Returns an xml document
 * @type {XMLElement}
 */
String.prototype.toXml = function(){
    var node = apf.getXml("<root>" + this + "</root>");
    if (node.childNodes.length == 1) {
        return node.childNodes[0];
    }
    else {
        var docFrag = node.ownerDocument.createDocumentFragment(),
            nodes   = node.childNodes;
        while (nodes.length)
            docFrag.appendChild(nodes[0]);
        return docFrag;
    }
};


if (typeof window != "undefined" && typeof window.document != "undefined" 
  && typeof window.document.createElement == "function") {
    /**
     * Encode HTML entities to its HTML equivalents, like '&amp;' to '&amp;amp;'
     * and '&lt;' to '&amp;lt;'.
     *
     * @type {String}
     * @todo is this fast?
     */
    String.prototype.escapeHTML = function() {
        this.escapeHTML.text.data = this;
        return this.escapeHTML.div.innerHTML;
    };

    /**
     * Decode HTML equivalent entities to characters, like '&amp;amp;' to '&amp;'
     * and '&amp;lt;' to '&lt;'.
     *
     * @type {String}
     */
    String.prototype.unescapeHTML = function() {
        var div = document.createElement("div");
        div.innerHTML = this.stripTags();
        if (div.childNodes[0]) {
            if (div.childNodes.length > 1) {
                var out = [];
                for (var i = 0; i < div.childNodes.length; i++)
                    out.push(div.childNodes[i].nodeValue);
                return out.join("");
            }
            else
                return div.childNodes[0].nodeValue;
        }
        return "";
    };

    String.prototype.escapeHTML.div  = document.createElement("div");
    String.prototype.escapeHTML.text = document.createTextNode("");
    String.prototype.escapeHTML.div.appendChild(String.prototype.escapeHTML.text);

    if ("<\n>".escapeHTML() !== "&lt;\n&gt;")
        String.prototype.escapeHTML = null;

    if ("&lt;\n&gt;".unescapeHTML() !== "<\n>")
        String.prototype.unescapeHTML = null;
}

if (!String.prototype.escapeHTML) {
    String.prototype.escapeHTML = function() {
        return this.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    };
}

if (!String.prototype.unescapeHTML) {
    String.prototype.unescapeHTML = function() {
        return this.stripTags().replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
    };
}

/**
 * Trim a string down to a specific number of characters. Optionally, append an
 * ellipsis ('...') as a suffix.
 *
 * @param {Number}  nr
 * @param {Boolean} [ellipsis] Append an ellipsis
 * @type  {String}
 */
String.prototype.truncate = function(nr, ellipsis){
    return this.length >= nr
        ? this.substring(0, nr - (ellipsis ? 4 : 1)) + (ellipsis ? "..." : "")
        : this;
};

/**
 * Pad a string at the right or left end with a string 'pad' to a specific
 * number of characters. Highly optimized version for speed, not readability.
 *
 * @param {Number}  len   Specifies the amount of characters required to pad to.
 * @param {String}  pad   Specifies the character(s) to pad the string with
 * @param {Boolean} [dir] Specifies at which end to append the 'pad' character (left or right).
 * @type  {String}
 */
String.prototype.pad = function(len, pad, dir) {
    return dir ? (this + Array(len).join(pad)).slice(0, len)
        : (Array(len).join(pad) + this).slice(-len);
};

apf.PAD_LEFT  = false;
apf.PAD_RIGHT = true;

/**
 * Special String.split; optionally lowercase a string and trim all results from
 * the left and right.
 *
 * @param {String}  separator
 * @param {Number}  limit      Maximum number of items to return
 * @param {Boolean} bLowerCase Flag to lowercase the string prior to split
 * @type  {String}
 */
String.prototype.splitSafe = function(separator, limit, bLowerCase) {
    return (bLowerCase && this.toLowerCase() || this)
        .replace(/(?:^\s+|\n|\s+$)/g, "")
        .split(new RegExp("[\\s ]*" + separator + "[\\s ]*", "g"), limit || 999);
};

/**
 * Appends a random number with a specified length to this String instance.
 *
 * @see randomGenerator
 * @param {Number} length
 * @type  {String}
 */
String.prototype.appendRandomNumber = function(length) {
    for (var arr = [], i = 1; i <= length; i++)
        arr.push(apf.randomGenerator.generate(1, 9));
    // Create a new string from the old one, don't just create a copy
    return this.toString() + arr.join("");
};

/**
 * Prepends a random number with a specified length to this String instance.
 *
 * @see randomGenerator
 * @param {Number} length
 * @type  {String}
 */
String.prototype.prependRandomNumber = function(length) {
    for (var arr = [], i = 1; i <= length; i++)
        arr.push(apf.randomGenerator.generate(1, 9));
    // Create a new string from the old one, don't just create a copy
    return arr.join("") + this.toString();
};

/**
 * Returns a string produced according to the formatting string. It replaces
 * all <i>%s</i> occurrences with the arguments provided.
 *
 * @link http://www.php.net/sprintf
 * @type {String}
 */
String.prototype.sprintf = function() {
    // Create a new string from the old one, don't just create a copy
    var str = this.toString(),
        i   = 0,
        inx = str.indexOf("%s");
    while (inx >= 0) {
        var replacement = arguments[i++] || " ";
        str = str.substr(0, inx) + replacement + str.substr(inx + 2);
        inx = str.indexOf("%s");
    }
    return str;
};

/**
 * The now method returns the milliseconds elapsed since 
 * 1 January 1970 00:00:00 UTC up until now as a number.
 * 
 * @type {Number}
 */
if (!Date.now) {
    Date.now = function now() {
        return +new Date();
    };
}

//})(); //end closure

// #endif
