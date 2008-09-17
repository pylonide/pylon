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

if (!self.isFinite) {
    function isFinite(val){
        return val + 1 != val;
    }
}

//#ifdef __DEPRECATED
//Mac workaround...
Function.prototype.call = Function.prototype.call || function(obj, arg1, arg2, arg3){
    obj.tf = this;
    var rv = obj.tf(arg1, arg2, arg3);
    obj.tf = null;
    return rv;
}
//#endif

Function.prototype.extend = function() {
    jpf.extend.apply(this, [this].concat(Array.prototype.slice.call(arguments)));
}

Function.prototype.bindWithEvent = function(o) {
    var __method = this, args = Array.prototype.slice.call(arguments), o = args.shift();
    return function(event) {
        if (!event) event = window.event;
        // #ifdef __WITH_ABSTRACTEVENT
        event = new jpf.AbstractEvent(event, window);
        // #endif
        return __method.apply(o, [event].concat(args)
            .concat(Array.prototype.slice.call(arguments)));
    }
}

Array.prototype.copy = function(){
    var ar = [];
    for (var i = 0; i < this.length; i++) 
        ar[i] = this[i] && this[i].copy ? this[i].copy() : this[i];
    
    return ar;
};

Array.prototype.merge = function(){
    for (var i = 0; i < arguments.length; i++) {
        for (var j = 0; j < arguments[i].length; j++) {
            this.push(arguments[i][j]);
        }
    }
};

Array.prototype.arrayAdd = function(){
    var s = this.copy();
    for (var i = 0; i < arguments.length; i++) {
        for (var j = 0; j < s.length; j++) {
            s[j] += arguments[i][j];
        }
    }
    
    return s;
};

Array.prototype.equals = function(obj){
    for (var i = 0; i < this.length; i++) 
        if (this[i] != obj[i]) 
            return false;
    return true;
};

Array.prototype.makeUnique = function(){
    var newArr = [];
    for (var i = 0, length = this.length; i < length; i++) 
        if (!newArr.contains(this[i])) 
            newArr.push(this[i]);
    
    this.length = 0;
    for (var i = 0, length = newArr.length; i < length; i++) 
        this.push(newArr[i]);
};

Array.prototype.contains = function(obj, from){
    return this.indexOf(obj, from) != -1;
};

//July 29, 2008: added 'from' argument support to indexOf()
Array.prototype.indexOf = Array.prototype.indexOf || function(obj, from){
    var len = this.length;
	for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++) {
		if (this[i] === obj)
            return i;
	}
	return -1;
};

Array.prototype.lastIndexOf = Array.prototype.lastIndexOf || function(obj, from) {
    //same as indexOf(), but in reverse loop, JS spec 1.6
    var len = this.length;
    for (var i = (from >= len) ? len - 1 : (from < 0) ? from + len : len - 1; i >= 0; i--) {
        if (this[i] === obj)
            return i;
    }
    return -1;
};

Array.prototype.pushUnique = function(item){
    if (!this.contains(item)) 
        this.push(item);
};

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

Array.prototype.each = 
Array.prototype.forEach = Array.prototype.forEach || function(fn) {
    for (var i = 0, l = this.length; i < l; i++)
		fn.call(this, this[i], i, this);
}

//TBD: explain the inner workings of this function please...
Array.prototype.remove = function(obj){
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] != obj) 
            continue;

        this.splice(i, 1);
    }
};

Array.prototype.removeIndex = function(i){
    if (!this.length) return;
    this.splice(i, 1);
};

Array.prototype.insertIndex = function(obj, i){
    this.splice(i, 0, obj);
};


//TBD: rename this function to reverse() - JS 1.5 spec
Array.prototype.invert = function(){
    var l = this.length - 1;
    for (var temp, i = 0; i < Math.ceil(0.5 * l); i++) {
        temp        = this[i];
        this[i]     = this[l - i]
        this[l - i] = temp;
    }
    
    return this;
};
Array.prototype.reverse = Array.prototype.reverse || Array.prototype.invert;

//#ifdef __DEPRECATED

/*
    These functions are really old, is there any browser that
    doesn't support them? I don't think so. Lets opt for 
    removal
*/

Array.prototype.push = Array.prototype.push || function(){
    for (var i = arguments.length - 1; i >= 0; i--)
        this[this.length] = arguments[i];
    return this.length;
}

Array.prototype.pop = Array.prototype.pop || function(item){
    var item = this[this.length - 1];
    delete this[this.length - 1];
    this.length--;
    return item;
}

Array.prototype.shift = Array.prototype.shift || function(){
    var item = this[0];
    for (var i = 0, l = this.length; i < l; i++) 
        this[i] = this[i + 1];
    this.length--;
    return item;
}

Array.prototype.join = Array.prototype.join || function(connect){
    for (var str = "", i = 0, l = this.length; i < l; i++) 
        str += this[i] + (i < l - 1 ? connect : "");
    return str;
}

//#endif

Number.prototype.toPrettyDigit = Number.prototype.toPrettyDigit || function() {
    var n = this.toString();
    return (n.length == 1) ? "0" + n : n;
}

/**
 * Attempt to fully comply (in terms of functionality) with the JS specification,
 * up till version 1.7: 
 * @link http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array
 */
Array.prototype.filter = Array.prototype.filter || function(fn, bind){
    var results = [];
    for (var i = 0, l = this.length; i < l; i++) {
        if (fn.call(bind, this[i], i, this))
            results.push(this[i]);
    }
    return results;
};

Array.prototype.every = Array.prototype.every || function(fn, bind){
    for (var i = 0, l = this.length; i < l; i++) {
        if (!fn.call(bind, this[i], i, this))
            return false;
    }
    return true;
};

Array.prototype.map = Array.prototype.map || function(fn, bind){
    var results = [];
    for (var i = 0, l = this.length; i < l; i++)
        results[i] = fn.call(bind, this[i], i, this);
    return results;
};

Array.prototype.some = Array.prototype.some || function(fn, bind){
    for (var i = 0, l = this.length; i < l; i++) {
        if (fn.call(bind, this[i], i, this))
            return true;
    }
    return false;
};

Math.hexlist  = "0123456789ABCDEF";
Math.decToHex = function(value){
    var hex = this.floor(value / 16);
    hex = (hex > 15 ? this.decToHex(hex) : this.hexlist.charAt(hex));
    
    return hex + "" + this.hexlist.charAt(this.floor(value % 16));
};

Math.hexToDec = function(value){
    if (!/(.)(.)/.exec(value.toUpperCase())) 
        return false;
    return this.hexlist.indexOf(RegExp.$1) * 16 + this.hexlist.indexOf(RegExp.$2);
};

String.prototype.uCaseFirst = function(str){
    return this.substr(0, 1).toUpperCase() + this.substr(1)
};

String.prototype.trim = function(){
    return this.replace(/\s*$/, "").replace(/^\s*/, "");
};

String.prototype.repeat = function(times){
    return Array(times + 1).join(this);
};

String.prototype.count = function(str){
    return this.split(str).length - 1;
};

String.prototype.stripTags = function() {
    return this.replace(/<\/?[^>]+>/gi, '');
};

String.prototype.escape = function() {
    return escape(this);
};

String.prototype.escapeHTML = function() {
    var div  = document.createElement('div');
    var text = document.createTextNode(this);
    div.appendChild(text);
    return div.innerHTML;
};

String.prototype.unescapeHTML = function() {
    var div = document.createElement('div');
    div.innerHTML = this.stripTags();
    if (div.childNodes[0]) {
        if (div.childNodes.length > 1) {
            var out = [];
            for (var i = 0; i < div.childNodes.length; i++)
                out.push(div.childNodes[i].nodeValue);
            return out.join('');
        }
        else
            return div.childNodes[0].nodeValue;
    }
    return "";
};

String.prototype.truncate = function(nr, ellipsis){
    return this.length >= nr
        ? this.substring(0, nr - (ellipsis ? 4 : 1)) + (ellipsis ? "..." : "")
        : this;
}

String.prototype.pad = function(l, s, t){
    return s || (s = " "), (l -= this.length) > 0
        ? (s = new Array(Math.ceil(l / s.length) + 1).join(s)).substr(0,
              (t = !t) ? l : (t == 1) ? 0 : Math.ceil(l / 2))
              + this + s.substr(0, l - t)
        : this;
};
PAD_LEFT  = 0;
PAD_RIGHT = 1;
PAD_BOTH  = 2;

/**
 * Appends a random number with a specified length to this String instance.
 * @see randomGenerator
 * @param {Number} length
 * @type String
 */
String.prototype.appendRandomNumber = function(length) {
    // Create a new string from the old one, don't just create a copy
    var source = this.toString();
    for (var i = 1; i <= length; i++) {
        source += jpf.randomGenerator.generate(1, 9);
    }
    return source;
};

/**
 * Prepends a random number with a specified length to this String instance.
 * @see randomGenerator
 * @param {Number} length
 * @type String
 */
String.prototype.prependRandomNumber = function(length) {
    // Create a new string from the old one, don't just create a copy
    var source = this.toString();
    for (var i = 1; i <= length; i++) {
        source = jpf.randomGenerator.generate(1, 9) + source;
    }
    return source;
};

/**
 * Returns a string produced according to the formatting string. It replaces
 * all <i>%s</i> occurrences with the arguments provided.
 * @link http://www.php.net/sprintf
 * @type String
 */
String.prototype.sprintf = function() {
    // Create a new string from the old one, don't just create a copy
    var str = this.toString();
	var i = 0, inx = str.indexOf('%s');
	while (inx >= 0) {
        var replacement = arguments[i++] || ' ';
		str = str.substr(0, inx) + replacement + str.substr(inx + 2);
		inx = str.indexOf('%s');
	}
	return str;
};

// #endif
