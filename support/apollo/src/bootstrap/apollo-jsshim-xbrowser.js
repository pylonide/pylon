/*
 * Oni Apollo JS cross-browser shim code
 *
 * Part of the Oni Apollo StratifiedJS Runtime
 * http://onilabs.com/apollo
 *
 * (c) 2011 Oni Labs, http://onilabs.com
 *
 * This file is licensed under the terms of the MIT License:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/*

Cross-browser compatibility shims for the following ECMA-262 Edition 5 functions:

Array.isArray
Array.prototype.indexOf
Array.prototype.lastIndexOf
Object.keys
Function.prototype.bind

XXX The following could also be done:

String.prototype.trim
Date.now
Date.parse (for ISO parsing)
Date.prototype.toISOString
Date.prototype.toJSON


The following functions don't have well defined semantics for SJS, so
we probably won't do them:

Array.prototype.forEach
Array.prototype.map
Array.prototype.filter
Array.prototype.every
Array.prototype.some
Array.prototype.reduce
Array.prototype.reduceRight


And these ones probably don't make sense to emulate at all:

Object.getOwnPropertyNames
Object.getPrototypeOf
Object.getOwnPropertyDescriptor
Object.create
Object.defineProperty
Object.defineProperties
Object.seal
Object.freeze
Object.preventExtensions
Object.isSealed
Object.isFrozen
Object.isExtensible


*/

// Array.isArray
if (!Array.isArray) {
  // http://ajaxian.com/archives/isarray-why-is-it-so-bloody-hard-to-get-right  
  Array.isArray = function(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  };
}

// Array.prototype.indexOf
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(val /*, fromIndex */) {
    var len = this.length >>> 0;
    var i = Math.floor(arguments[1] || 0); // XXX not quite correct
    if (i<0) i = Math.max(len - Math.abs(i), 0);

    for (; i<len; ++i) {
      if (i in this && this[i] === val)
        return i;
    }
    return -1;
  };
}

// Array.prototype.lastIndexOf
if (!Array.prototype.lastIndexOf) {
  Array.prototype.lastIndexOf = function(val /*, fromIndex */) {
    var len = this.length >>> 0;
    var i = arguments[1] === undefined ? len : Math.floor(arguments[1]); // XXX not quite correct
    if (i>=0) 
      i = Math.min(i, len-1);
    else
      i += len;

    for (; i>=0; --i) {
      if (i in this && this[i] === val)
        return i;
    }
    return -1;
  };
}

// Object.keys
if(!Object.keys) {
  // This implementation will not fix IE's DontEnum bug, like the
  // solution presented at
  // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation,
  // but at least behaviour is consistent with for-in
  Object.keys = function(o){
    var rv = [], p;
    for(p in o) 
      if(Object.prototype.hasOwnProperty.call(o, p)) 
        rv.push(p);
    return rv;
  };
}

// Function.prototype.bind
if (!Function.prototype.bind) {
  // Implementation taken from
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
  // and coming with all the caveats listed there.
  // XXX We should fix simple things like 'length'
  Function.prototype.bind = function(obj) {
    var slice = [].slice,
        args = slice.call(arguments, 1), 
        self = this, 
        nop = function () {}, 
        bound = function () {
          return self.apply(this instanceof nop ? this : ( obj || {} ), 
                            args.concat( slice.call(arguments) ) );    
    };
    // we insert nop into the prototype chain so that we can detect
    // 'new bound()':
    nop.prototype = self.prototype;
    bound.prototype = new nop();
    return bound;
  };
}

// WRITEME:
// String.prototype.trim
// Date.now
// Date.parse (for ISO parsing)
// Date.prototype.toISOString
// Date.prototype.toJSON
