"no use strict";

var console = {
    log: function(msg) {
        postMessage({type: "log", data: msg});
    }
};
var window = {
    console: console
};

var normalizeModule = function(parentId, moduleName) {
    // normalize plugin requires
    if (moduleName.indexOf("!") !== -1) {
        var chunks = moduleName.split("!");
        return normalizeModule(parentId, chunks[0]) + "!" + normalizeModule(parentId, chunks[1]);
    }
    // normalize relative requires
    if (moduleName.charAt(0) == ".") {
        var base = parentId.split("/").slice(0, -1).join("/");
        var moduleName = base + "/" + moduleName;
        
        while(moduleName.indexOf(".") !== -1 && previous != moduleName) {
            var previous = moduleName;
            var moduleName = moduleName.replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
        }
    }
    
    return moduleName;
};

var require = function(parentId, id) {
    var id = normalizeModule(parentId, id);
    
    var module = require.modules[id];
    if (module) {
        if (!module.initialized) {
            module.exports = module.factory().exports;
            module.initialized = true;
        }
        return module.exports;
    }
    
    var chunks = id.split("/");
    chunks[0] = require.tlns[chunks[0]] || chunks[0];
    var path = chunks.join("/") + ".js";
    
    require.id = id;
    importScripts(path);
    return require(parentId, id);    
};

require.modules = {};
require.tlns = {};

var define = function(id, deps, factory) {
    if (arguments.length == 2) {
        factory = deps;
    } else if (arguments.length == 1) {
        factory = id;
        id = require.id;
    }

    if (id.indexOf("text!") === 0) 
        return;
    
    var req = function(deps, factory) {
        return require(id, deps, factory);
    };

    require.modules[id] = {
        factory: function() {
            var module = {
                exports: {}
            };
            var returnExports = factory(req, module.exports, module);
            if (returnExports)
                module.exports = returnExports;
            return module;
        }
    };
};

function initBaseUrls(topLevelNamespaces) {
    require.tlns = topLevelNamespaces;
}

function initSender() {

    var EventEmitter = require(null, "ace/lib/event_emitter").EventEmitter;
    var oop = require(null, "ace/lib/oop");
    
    var Sender = function() {};
    
    (function() {
        
        oop.implement(this, EventEmitter);
                
        this.callback = function(data, callbackId) {
            postMessage({
                type: "call",
                id: callbackId,
                data: data
            });
        };
    
        this.emit = function(name, data) {
            postMessage({
                type: "event",
                name: name,
                data: data
            });
        };
        
    }).call(Sender.prototype);
    
    return new Sender();
}

var main;
var sender;

onmessage = function(e) {
    var msg = e.data;
    if (msg.command) {
        main[msg.command].apply(main, msg.args);
    }
    else if (msg.init) {        
        initBaseUrls(msg.tlns);
        require(null, "ace/lib/fixoldbrowsers");
        sender = initSender();
        var clazz = require(null, msg.module)[msg.classname];
        main = new clazz(sender);
    } 
    else if (msg.event && sender) {
        sender._emit(msg.event, msg.data);
    }
};
// vim:set ts=4 sts=4 sw=4 st:
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)
// -- dantman Daniel Friesen Copyright(C) 2010 XXX No License Specified
// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License
// -- Irakli Gozalishvili Copyright (C) 2010 MIT License

/*!
    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/

define('ace/lib/fixoldbrowsers', ['require', 'exports', 'module' , 'ace/lib/regexp', 'ace/lib/es5-shim'], function(require, exports, module) {
"use strict";

require("./regexp");
require("./es5-shim");

});/**
 *  Based on code from:
 *
 * XRegExp 1.5.0
 * (c) 2007-2010 Steven Levithan
 * MIT License
 * <http://xregexp.com>
 * Provides an augmented, extensible, cross-browser implementation of regular expressions,
 * including support for additional syntax, flags, and methods
 */
 
define('ace/lib/regexp', ['require', 'exports', 'module' ], function(require, exports, module) {
"use strict";

    //---------------------------------
    //  Private variables
    //---------------------------------

    var real = {
            exec: RegExp.prototype.exec,
            test: RegExp.prototype.test,
            match: String.prototype.match,
            replace: String.prototype.replace,
            split: String.prototype.split
        },
        compliantExecNpcg = real.exec.call(/()??/, "")[1] === undefined, // check `exec` handling of nonparticipating capturing groups
        compliantLastIndexIncrement = function () {
            var x = /^/g;
            real.test.call(x, "");
            return !x.lastIndex;
        }();

    //---------------------------------
    //  Overriden native methods
    //---------------------------------

    // Adds named capture support (with backreferences returned as `result.name`), and fixes two
    // cross-browser issues per ES3:
    // - Captured values for nonparticipating capturing groups should be returned as `undefined`,
    //   rather than the empty string.
    // - `lastIndex` should not be incremented after zero-length matches.
    RegExp.prototype.exec = function (str) {
        var match = real.exec.apply(this, arguments),
            name, r2;
        if ( typeof(str) == 'string' && match) {
            // Fix browsers whose `exec` methods don't consistently return `undefined` for
            // nonparticipating capturing groups
            if (!compliantExecNpcg && match.length > 1 && indexOf(match, "") > -1) {
                r2 = RegExp(this.source, real.replace.call(getNativeFlags(this), "g", ""));
                // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
                // matching due to characters outside the match
                real.replace.call(str.slice(match.index), r2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined)
                            match[i] = undefined;
                    }
                });
            }
            // Attach named capture properties
            if (this._xregexp && this._xregexp.captureNames) {
                for (var i = 1; i < match.length; i++) {
                    name = this._xregexp.captureNames[i - 1];
                    if (name)
                       match[name] = match[i];
                }
            }
            // Fix browsers that increment `lastIndex` after zero-length matches
            if (!compliantLastIndexIncrement && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
        }
        return match;
    };

    // Don't override `test` if it won't change anything
    if (!compliantLastIndexIncrement) {
        // Fix browser bug in native method
        RegExp.prototype.test = function (str) {
            // Use the native `exec` to skip some processing overhead, even though the overriden
            // `exec` would take care of the `lastIndex` fix
            var match = real.exec.call(this, str);
            // Fix browsers that increment `lastIndex` after zero-length matches
            if (match && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
            return !!match;
        };
    }

    //---------------------------------
    //  Private helper functions
    //---------------------------------

    function getNativeFlags (regex) {
        return (regex.global     ? "g" : "") +
               (regex.ignoreCase ? "i" : "") +
               (regex.multiline  ? "m" : "") +
               (regex.extended   ? "x" : "") + // Proposed for ES4; included in AS3
               (regex.sticky     ? "y" : "");
    };

    function indexOf (array, item, from) {
        if (Array.prototype.indexOf) // Use the native array method if available
            return array.indexOf(item, from);
        for (var i = from || 0; i < array.length; i++) {
            if (array[i] === item)
                return i;
        }
        return -1;
    };

});
// vim: ts=4 sts=4 sw=4 expandtab
// -- kriskowal Kris Kowal Copyright (C) 2009-2011 MIT License
// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)
// -- dantman Daniel Friesen Copyright (C) 2010 XXX TODO License or CLA
// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License
// -- Gozala Irakli Gozalishvili Copyright (C) 2010 MIT License
// -- kitcambridge Kit Cambridge Copyright (C) 2011 MIT License
// -- kossnocorp Sasha Koss XXX TODO License or CLA
// -- bryanforbes Bryan Forbes XXX TODO License or CLA
// -- killdream Quildreen Motta Copyright (C) 2011 MIT Licence
// -- michaelficarra Michael Ficarra Copyright (C) 2011 3-clause BSD License
// -- sharkbrainguy Gerard Paapu Copyright (C) 2011 MIT License
// -- bbqsrc Brendan Molloy (C) 2011 Creative Commons Zero (public domain)
// -- iwyg XXX TODO License or CLA
// -- DomenicDenicola Domenic Denicola Copyright (C) 2011 MIT License
// -- xavierm02 Montillet Xavier XXX TODO License or CLA
// -- Raynos Raynos XXX TODO License or CLA
// -- samsonjs Sami Samhuri Copyright (C) 2010 MIT License
// -- rwldrn Rick Waldron Copyright (C) 2011 MIT License
// -- lexer Alexey Zakharov XXX TODO License or CLA

/*!
    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/

define('ace/lib/es5-shim', ['require', 'exports', 'module' ], function(require, exports, module) {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 *
 * @module
 */

/*whatsupdoc*/

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function")
            throw new TypeError(); // TODO message
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal 
                //   method of target providing args as the arguments.

                var F = function(){};
                F.prototype = target.prototype;
                var self = new F;

                var result = target.apply(
                    self,
                    args.concat(slice.call(arguments))
                );
                if (result !== null && Object(result) === result)
                    return result;
                return self;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the 
                //   list boundArgs in the same order followed by the same 
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method 
                //   of target providing boundThis as the this value and 
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        // XXX bound.length is never writable, so don't even try
        //
        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is 
        //       larger.
        // 16. Else set the length own property of F to 0.
        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.
        
        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with 
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and 
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with 
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower, 
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not 
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    };
}

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
var toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}

//
// Array
// =====
//

// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return toString(obj) == "[object Array]";
    };
}

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var self = toObject(this),
            thisp = arguments[1],
            i = 0,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object context
                fun.call(thisp, self[i], i, self);
            }
            i++;
        }
    };
}

// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var self = toObject(this),
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, self);
        }
        return result;
    };
}

// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            result = [],
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, self))
                result.push(self[i]);
        }
        return result;
    };
}

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, self))
                return false;
        }
        return true;
    };
}

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, self))
                return true;
        }
        return false;
    };
}

// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var self = toObject(this),
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        // no value to return if no initial value and an empty array
        if (!length && arguments.length == 1)
            throw new TypeError(); // TODO message

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length)
                    throw new TypeError(); // TODO message
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self)
                result = fun.call(void 0, result, self[i], i, self);
        }

        return result;
    };
}

// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var self = toObject(this),
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        // no value to return if no initial value, empty array
        if (!length && arguments.length == 1)
            throw new TypeError(); // TODO message

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError(); // TODO message
            } while (true);
        }

        do {
            if (i in this)
                result = fun.call(void 0, result, self[i], i, self);
        } while (i--);

        return result;
    };
}

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = toObject(this),
            length = self.length >>> 0;

        if (!length)
            return -1;

        var i = 0;
        if (arguments.length > 1)
            i = toInteger(arguments[1]);

        // handle negative indices
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}

// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = toObject(this),
            length = self.length >>> 0;

        if (!length)
            return -1;
        var i = length - 1;
        if (arguments.length > 1)
            i = Math.min(i, toInteger(arguments[1]));
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i])
                return i;
        }
        return -1;
    };
}

//
// Object
// ======
//

// ES5 15.2.3.2
// http://es5.github.com/#x15.2.3.2
if (!Object.getPrototypeOf) {
    // https://github.com/kriskowal/es5-shim/issues#issue/2
    // http://ejohn.org/blog/objectgetprototypeof/
    // recommended by fschaefer on github
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor ?
            object.constructor.prototype :
            prototypeOfObject
        );
    };
}

// ES5 15.2.3.3
// http://es5.github.com/#x15.2.3.3
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
                         "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT + object);
        // If object does not owns property return undefined immediately.
        if (!owns(object, property))
            return;

        var descriptor, getter, setter;

        // If object has a property then it's for sure both `enumerable` and
        // `configurable`.
        descriptor =  { enumerable: true, configurable: true };

        // If JS engine supports accessor properties then property may be a
        // getter or setter.
        if (supportsAccessors) {
            // Unfortunately `__lookupGetter__` will return a getter even
            // if object has own non getter property along with a same named
            // inherited getter. To avoid misbehavior we temporary remove
            // `__proto__` so that `__lookupGetter__` will return getter only
            // if it's owned by an object.
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);

            // Once we have getter and setter we can put values back.
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) descriptor.get = getter;
                if (setter) descriptor.set = setter;

                // If it was accessor property we're done and return here
                // in order to avoid adding `value` to the descriptor.
                return descriptor;
            }
        }

        // If we got this far we know that object has an own property that is
        // not an accessor so we set it as a value and return descriptor.
        descriptor.value = object[property];
        return descriptor;
    };
}

// ES5 15.2.3.4
// http://es5.github.com/#x15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5
// http://es5.github.com/#x15.2.3.5
if (!Object.create) {
    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = { "__proto__": null };
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            // IE has no built-in implementation of `Object.getPrototypeOf`
            // neither `__proto__`, but this manually setting `__proto__` will
            // guarantee that `Object.getPrototypeOf` will work as expected with
            // objects created using `Object.create`
            object.__proto__ = prototype;
        }
        if (properties !== void 0)
            Object.defineProperties(object, properties);
        return object;
    };
}

// ES5 15.2.3.6
// http://es5.github.com/#x15.2.3.6

// Patch for WebKit and IE8 standard mode
// Designed by hax <hax.github.com>
// related issue: https://github.com/kriskowal/es5-shim/issues#issue/5
// IE8 Reference:
//     http://msdn.microsoft.com/en-us/library/dd282900.aspx
//     http://msdn.microsoft.com/en-us/library/dd229916.aspx
// WebKit Bugs:
//     https://bugs.webkit.org/show_bug.cgi?id=36423

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
        // returns falsy
    }
}

// check whether defineProperty works if it's given. Otherwise,
// shim partially.
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);

        // make a valiant attempt to use the real defineProperty
        // for I8's DOM elements.
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }

        // If it's a data property.
        if (owns(descriptor, "value")) {
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(owns(descriptor, "writable") ? descriptor.writable : true) ||
                !(owns(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(owns(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                // As accessors are supported only on engines implementing
                // `__proto__` we can safely override `__proto__` while defining
                // a property to make sure that we don't hit an inherited
                // accessor.
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                // Deleting a property anyway since getter / setter may be
                // defined on object itself.
                delete object[property];
                object[property] = descriptor.value;
                // Setting original `__proto__` back now.
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors)
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            // If we got that far then getters and setters can be defined !!
            if (owns(descriptor, "get"))
                defineGetter(object, property, descriptor.get);
            if (owns(descriptor, "set"))
                defineSetter(object, property, descriptor.set);
        }

        return object;
    };
}

// ES5 15.2.3.7
// http://es5.github.com/#x15.2.3.7
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}

// ES5 15.2.3.8
// http://es5.github.com/#x15.2.3.8
if (!Object.seal) {
    Object.seal = function seal(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.9
// http://es5.github.com/#x15.2.3.9
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// detect a Rhino bug and patch it
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}

// ES5 15.2.3.10
// http://es5.github.com/#x15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.11
// http://es5.github.com/#x15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}

// ES5 15.2.3.12
// http://es5.github.com/#x15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}

// ES5 15.2.3.13
// http://es5.github.com/#x15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        // 1. If Type(O) is not Object throw a TypeError exception.
        if (Object(object) === object) {
            throw new TypeError(); // TODO message
        }
        // 2. Return the Boolean value of the [[Extensible]] internal property of O.
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14
if (!Object.keys) {
    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null})
        hasDontEnumBug = false;

    Object.keys = function keys(object) {

        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError("Object.keys called on a non-object");

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }

        return keys;
    };

}

//
// Date
// ====
//

// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time 
// represented by this Date object. The format of the String is the Date Time 
// string format defined in 15.9.1.15. All fields are present in the String. 
// The time zone is always UTC, denoted by the suffix Z. If the time value of 
// this object is not a finite Number a RangeError exception is thrown.
if (!Date.prototype.toISOString || (new Date(-62198755200000).toISOString().indexOf('-000001') === -1)) {
    Date.prototype.toISOString = function toISOString() {
        var result, length, value, year;
        if (!isFinite(this))
            throw new RangeError;

        // the date time string format is specified in 15.9.1.15.
        result = [this.getUTCMonth() + 1, this.getUTCDate(),
            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
        year = this.getUTCFullYear();
        year = (year < 0 ? '-' : (year > 9999 ? '+' : '')) + ('00000' + Math.abs(year)).slice(0 <= year && year <= 9999 ? -4 : -6);

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two digits.
            if (value < 10)
                result[length] = "0" + value;
        }
        // pad milliseconds to have three digits.
        return year + "-" + result.slice(0, 2).join("-") + "T" + result.slice(2).join(":") + "." +
            ("000" + this.getUTCMilliseconds()).slice(-3) + "Z";
    }
}

// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by 
// JSON.stringify (15.12.3).
if (!Date.prototype.toJSON) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following 
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ToPrimitive(O, hint Number).
        // 3. If tv is a Number and is not finite, return null.
        // XXX
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof this.toISOString != "function")
            throw new TypeError(); // TODO message
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return this.toISOString();

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (Date.parse("+275760-09-13T00:00:00.000Z") !== 8.64e15) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        var Date = function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length == 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp("^" +
            "(\\d{4}|[\+\-]\\d{6})" + // four-digit year capture or sign + 6-digit extended year
            "(?:-(\\d{2})" + // optional month capture
            "(?:-(\\d{2})" + // optional day capture
            "(?:" + // capture hours:minutes:seconds.milliseconds
                "T(\\d{2})" + // hours capture
                ":(\\d{2})" + // minutes capture
                "(?:" + // optional :seconds.milliseconds
                    ":(\\d{2})" + // seconds capture
                    "(?:\\.(\\d{3}))?" + // milliseconds capture
                ")?" +
            "(?:" + // capture UTC offset component
                "Z|" + // UTC capture
                "(?:" + // offset specifier +/-hours:minutes
                    "([-+])" + // sign capture
                    "(\\d{2})" + // hours offset capture
                    ":(\\d{2})" + // minutes offset capture
                ")" +
            ")?)?)?)?" +
        "$");

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate)
            Date[key] = NativeDate[key];

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        Date.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                match.shift(); // kill match[0], the full match
                // parse months, days, hours, minutes, seconds, and milliseconds
                for (var i = 1; i < 7; i++) {
                    // provide default values if necessary
                    match[i] = +(match[i] || (i < 3 ? 1 : 0));
                    // match[1] is the month. Months are 0-11 in JavaScript
                    // `Date` objects, but 1-12 in ISO notation, so we
                    // decrement.
                    if (i == 1)
                        match[i]--;
                }

                // parse the UTC offset component
                var minuteOffset = +match.pop(), hourOffset = +match.pop(), sign = match.pop();

                // compute the explicit time zone offset if specified
                var offset = 0;
                if (sign) {
                    // detect invalid offsets and return early
                    if (hourOffset > 23 || minuteOffset > 59)
                        return NaN;

                    // express the provided time zone offset in minutes. The offset is
                    // negative for time zones west of UTC; positive otherwise.
                    offset = (hourOffset * 60 + minuteOffset) * 6e4 * (sign == "+" ? -1 : 1);
                }

                // Date.UTC for years between 0 and 99 converts year to 1900 + year
                // The Gregorian calendar has a 400-year cycle, so 
                // to Date.UTC(year + 400, .... ) - 12622780800000 == Date.UTC(year, ...),
                // where 12622780800000 - number of milliseconds in Gregorian calendar 400 years
                var year = +match[0];
                if (0 <= year && year <= 99) {
                    match[0] = year + 400;
                    return NativeDate.UTC.apply(this, match) + offset - 12622780800000;
                }

                // compute a new UTC date value, accounting for the optional offset
                return NativeDate.UTC.apply(this, match) + offset;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

//
// String
// ======
//

// ES5 15.5.4.20
// http://es5.github.com/#x15.5.4.20
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

//
// Util
// ======
//

// ES5 9.4
// http://es5.github.com/#x9.4
// http://jsperf.com/to-integer
var toInteger = function (n) {
    n = +n;
    if (n !== n) // isNaN
        n = 0;
    else if (n !== 0 && n !== (1/0) && n !== -(1/0))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    return n;
};

var prepareString = "a"[0] != "a",
    // ES5 9.9
    // http://es5.github.com/#x9.9
    toObject = function (o) {
        if (o == null) { // this matches both null and undefined
            throw new TypeError(); // TODO message
        }
        // If the implementation doesn't support by-index access of
        // string characters (ex. IE < 7), split the string
        if (prepareString && typeof o == "string" && o) {
            return o.split("");
        }
        return Object(o);
    };
});/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Irakli Gozalishvili <rfobic@gmail.com> (http://jeditoolkit.com)
 *      Mike de Boer <mike AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/lib/event_emitter', ['require', 'exports', 'module' ], function(require, exports, module) {
"use strict";

var EventEmitter = {};

EventEmitter._emit =
EventEmitter._dispatchEvent = function(eventName, e) {
    this._eventRegistry = this._eventRegistry || {};
    this._defaultHandlers = this._defaultHandlers || {};

    var listeners = this._eventRegistry[eventName] || [];
    var defaultHandler = this._defaultHandlers[eventName];
    if (!listeners.length && !defaultHandler)
        return;

    e = e || {};
    e.type = eventName;
    
    if (!e.stopPropagation) {
        e.stopPropagation = function() {
            this.propagationStopped = true;
        };
    }
    
    if (!e.preventDefault) {
        e.preventDefault = function() {
            this.defaultPrevented = true;
        };
    }

    for (var i=0; i<listeners.length; i++) {
        listeners[i](e);
        if (e.propagationStopped)
            break;
    }
    
    if (defaultHandler && !e.defaultPrevented)
        defaultHandler(e);
};

EventEmitter.setDefaultHandler = function(eventName, callback) {
    this._defaultHandlers = this._defaultHandlers || {};
    
    if (this._defaultHandlers[eventName])
        throw new Error("The default handler for '" + eventName + "' is already set");
        
    this._defaultHandlers[eventName] = callback;
};

EventEmitter.on =
EventEmitter.addEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        var listeners = this._eventRegistry[eventName] = [];

    if (listeners.indexOf(callback) == -1)
        listeners.push(callback);
};

EventEmitter.removeListener =
EventEmitter.removeEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        return;

    var index = listeners.indexOf(callback);
    if (index !== -1)
        listeners.splice(index, 1);
};

EventEmitter.removeAllListeners = function(eventName) {
    if (this._eventRegistry) this._eventRegistry[eventName] = [];
};

exports.EventEmitter = EventEmitter;

});/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/lib/oop', ['require', 'exports', 'module' ], function(require, exports, module) {
"use strict";

exports.inherits = (function() {
    var tempCtor = function() {};
    return function(ctor, superCtor) {
        tempCtor.prototype = superCtor.prototype;
        ctor.super_ = superCtor.prototype;
        ctor.prototype = new tempCtor();
        ctor.prototype.constructor = ctor;
    };
}());

exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
};

exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
};

});
/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
/**
 * Language Worker
 * This code runs in a WebWorker in the browser. Its main job is to
 * delegate messages it receives to the various handlers that have registered
 * themselves with the worker.
 */
define('ext/language/worker', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/worker/mirror', 'treehugger/tree'], function(require, exports, module) {

var oop = require("ace/lib/oop");
var Mirror = require("ace/worker/mirror").Mirror;
var tree = require('treehugger/tree');


// Leaking into global namespace of worker, to allow handlers to have access
disabledFeatures = {};

var LanguageWorker = exports.LanguageWorker = function(sender) {
    var _self = this;
    this.handlers = [];
    this.currentMarkers = [];
    this.$lastAggregateActions = {};
    
    Mirror.call(this, sender);
    this.setTimeout(500);
    
    sender.on("complete", function(pos) {
        _self.complete(pos);
    });
    sender.on("documentClose", function(event) {
        _self.documentClose(event);
    });
    sender.on("analyze", function(event) {
        _self.analyze(event);
    });
    sender.on("cursormove", function(event) {
        _self.onCursorMove(event);
    });
    
    sender.on("inspect", function(event) {
        _self.inspect(event);
    });
    
    sender.on("change", function() {
        _self.scheduledUpdate = true;
    });
    
    sender.on("fetchVariablePositions", function(event) {
        _self.sendVariablePositions(event);
    });
};

oop.inherits(LanguageWorker, Mirror);

(function() {
    
    this.getLastAggregateActions = function() {
        if(!this.$lastAggregateActions[this.$path])
            this.$lastAggregateActions[this.$path] = {markers: [], hint: null};
        return this.$lastAggregateActions[this.$path];
    };
    
    this.setLastAggregateActions = function(actions) {
        this.$lastAggregateActions[this.$path] = actions;
    };
    
    this.enableFeature = function(name) {
        disabledFeatures[name] = false;
    };

    this.disableFeature = function(name) {
        disabledFeatures[name] = true;
    };
    
    /**
     * Registers a handler by loading its code and adding it the handler array
     */
    this.register = function(path) {
        var handler = require(path);
        this.handlers.push(handler);
    };

    this.parse = function() {
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language)) {
                try {
                    var ast = handler.parse(this.doc.getValue());
                    if(ast) {
                        this.cachedAst = ast;
                        return ast;
                    }
                } catch(e) {
                    // Ignore parse errors
                }
            }
        }
        // No parser available
        this.cachedAst = null;
        return null;
    };

    this.scheduleEmit = function(messageType, data) {
        this.sender.emit(messageType, data);
    };
    
    /**
     * If the program contains a syntax error, the parser will try its best to still produce
     * an AST, although it will contain some problems. To avoid that those problems result in
     * invalid warning, let's filter out warnings that appear within a line or too after the
     * syntax error. 
     */
    function filterMarkersAroundError(ast, markers) {
        if(!ast)
            return;
        var error = ast.getAnnotation("error");
        if(!error)
            return;
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            if(marker.type !== 'error' && marker.pos.sl >= error.line && marker.pos.el <= error.line + 2) {
                markers.splice(i, 1);
                i--;
            }
        }
    }
    
    this.analyze = function() {
        var ast = this.parse();
        var markers = [];
        var handlerCount = 0;
        for(var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language) && (ast || !handler.analysisRequiresParsing())) {
                var result = handler.analyze(this.doc, ast);
                if (result)
                    markers = markers.concat(result);
                handlerCount++;
            }
        }
        var extendedMakers = markers;
        filterMarkersAroundError(ast, markers);
        if (this.getLastAggregateActions().markers.length > 0)
            extendedMakers = markers.concat(this.getLastAggregateActions().markers);
        if(handlerCount > 0)
            this.scheduleEmit("markers", extendedMakers);
        this.currentMarkers = markers;
        if (this.postponedCursorMove) {
            this.onCursorMove(this.postponedCursorMove);
        }
    };

    this.checkForMarker = function(pos) {
        var astPos = {line: pos.row, col: pos.column};
        for (var i = 0; i < this.currentMarkers.length; i++) {
            var currentMarker = this.currentMarkers[i];
            if (currentMarker.message && tree.inRange(currentMarker.pos, astPos)) {
                return currentMarker.message;
            }
        }
    };
    
    /**
     * Request the AST node on the current position
     */
    this.inspect = function (event) {
        var _self = this;
        
        if (this.cachedAst) {
            // find the current node based on the ast and the position data
            var ast = this.cachedAst;
            var node = ast.findNode({ line: event.data.row, col: event.data.col });
            
            // find a handler that can build an expression for this language
            var handler = this.handlers.filter(function (h) { 
                return h.handlesLanguage(_self.$language) && h.buildExpression;
            });
            
            // then invoke it and build an expression out of this
            if (handler && handler.length) {
                var expression = handler[0].buildExpression(node);
                this.scheduleEmit("inspect", expression);
            }
        }
    };

    this.onCursorMove = function(event) {
        if(this.scheduledUpdate) {
            // Postpone the cursor move until the update propagates
            this.postponedCursorMove = event;
            return;
        }
        var pos = event.data;
        var hintMessage = this.checkForMarker(pos) || "";
        // Not going to parse for this, only if already parsed successfully
        var aggregateActions = {markers: [], hint: null, enableRefactorings: []};
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            if (currentNode !== this.lastCurrentNode || pos.force) {
                for (var i = 0; i < this.handlers.length; i++) {
                    var handler = this.handlers[i];
                    if (handler.handlesLanguage(this.$language)) {
                        var response = handler.onCursorMovedNode(this.doc, ast, pos, currentNode);
                        if (!response)
                            continue;
                        if (response.markers && response.markers.length > 0) {
                            aggregateActions.markers = aggregateActions.markers.concat(response.markers);
                        }
                        if (response.enableRefactorings && response.enableRefactorings.length > 0) {
                            aggregateActions.enableRefactorings = aggregateActions.enableRefactorings.concat(response.enableRefactorings);
                        }
                        if (response.hint) {
                            // Last one wins, support multiple?
                            aggregateActions.hint = response.hint;
                        }
                    }
                }
                if (aggregateActions.hint && !hintMessage) {
                    hintMessage = aggregateActions.hint;
                }
                this.scheduleEmit("markers", this.currentMarkers.concat(aggregateActions.markers));
                this.scheduleEmit("enableRefactorings", aggregateActions.enableRefactorings);
                this.lastCurrentNode = currentNode;
                this.setLastAggregateActions(aggregateActions);
            }
        } else {
            this.setLastAggregateActions(aggregateActions);
        }
        this.scheduleEmit("hint", hintMessage);
    };
    
    this.sendVariablePositions = function(event) {
        var pos = event.data;
        // Not going to parse for this, only if already parsed successfully
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            for (var i = 0; i < this.handlers.length; i++) {
                var handler = this.handlers[i];
                if (handler.handlesLanguage(this.$language)) {
                    var response = handler.getVariablePositions(this.doc, ast, pos, currentNode);
                    if (response)
                        this.sender.emit("variableLocations", response);
                }
            }
        }
    };

    this.onUpdate = function() {
        this.scheduledUpdate = false;
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language)) {
                handler.onUpdate(this.doc);
            }
        }
        this.analyze();
    };
    
    this.switchFile = function(path, language, code) {
        var oldPath = this.$path;
        code = code || "";
        this.$path = path;
        this.$language = language;
        this.cachedAst = null;
        this.lastCurrentNode = null;
        this.setValue(code);
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            handler.path = path;
            handler.language = language;
            handler.onDocumentOpen(path, this.doc, oldPath);
        }
    };
    
    this.documentClose = function(event) {
        var path = event.data;
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            handler.onDocumentClose(path);
        }
    };
    
    // For code completion
    function removeDuplicateMatches(matches) {
        // First sort
        matches.sort(function(a, b) {
            if (a.name < b.name)
                return 1;
            else if (a.name > b.name)
                return -1;
            else
                return 0;
        });
        for (var i = 0; i < matches.length - 1; i++) {
            var a = matches[i];
            var b = matches[i + 1];
            if (a.name === b.name) {
                // Duplicate!
                if (a.priority < b.priority)
                    matches.splice(i, 1);
                else if (a.priority > b.priority)
                    matches.splice(i+1, 1);
                else if (a.score < b.score)
                    matches.splice(i, 1);
                else if (a.score > b.score)
                    matches.splice(i+1, 1);
                else
                    matches.splice(i, 1);
                i--;
            }
        }
    }
    
    this.complete = function(event) {
        var pos = event.data;
        // Check if anybody requires parsing for its code completion
        var ast, currentNode;
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language) && handler.completionRequiresParsing()) {
                ast = this.parse();
                currentNode = ast.findNode({line: pos.row, col: pos.column});
                break;
            }
        }
        
        var matches = [];
        
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language)) {
                var completions = handler.complete(this.doc, ast, pos, currentNode);
                if (completions)
                    matches = matches.concat(completions);
            }
        }

        removeDuplicateMatches(matches);
        // Sort by priority, score
        matches.sort(function(a, b) {
            if (a.priority < b.priority)
                return 1;
            else if (a.priority > b.priority)
                return -1;
            else if (a.score < b.score)
                return 1;
            else if (a.score > b.score)
                return -1;
            else
                return 0;
        });
        
        matches = matches.slice(0, 50); // 50 ought to be enough for everybody
        this.sender.emit("complete", matches);
    };

}).call(LanguageWorker.prototype);

});
define('ace/worker/mirror', ['require', 'exports', 'module' , 'ace/document', 'ace/lib/lang'], function(require, exports, module) {
"use strict";

var Document = require("../document").Document;
var lang = require("../lib/lang");
    
var Mirror = exports.Mirror = function(sender) {
    this.sender = sender;
    var doc = this.doc = new Document("");
    
    var deferredUpdate = this.deferredUpdate = lang.deferredCall(this.onUpdate.bind(this));
    
    var _self = this;
    sender.on("change", function(e) {
        doc.applyDeltas([e.data]);        
        deferredUpdate.schedule(_self.$timeout);
    });
};

(function() {
    
    this.$timeout = 500;
    
    this.setTimeout = function(timeout) {
        this.$timeout = timeout;
    };
    
    this.setValue = function(value) {
        this.doc.setValue(value);
        this.deferredUpdate.schedule(this.$timeout);
    };
    
    this.getValue = function(callbackId) {
        this.sender.callback(this.doc.getValue(), callbackId);
    };
    
    this.onUpdate = function() {
        // abstract method
    };
    
}).call(Mirror.prototype);

});/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/document', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter', 'ace/range', 'ace/anchor'], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var Range = require("./range").Range;
var Anchor = require("./anchor").Anchor;

var Document = function(text) {
    this.$lines = [];

    if (Array.isArray(text)) {
        this.insertLines(0, text);
    }
    // There has to be one line at least in the document. If you pass an empty
    // string to the insert function, nothing will happen. Workaround.
    else if (text.length == 0) {
        this.$lines = [""];
    } else {
        this.insert({row: 0, column:0}, text);
    }
};

(function() {

    oop.implement(this, EventEmitter);

    this.setValue = function(text) {
        var len = this.getLength();
        this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        this.insert({row: 0, column:0}, text);
    };

    this.getValue = function() {
        return this.getAllLines().join(this.getNewLineCharacter());
    };

    this.createAnchor = function(row, column) {
        return new Anchor(this, row, column);
    };

    // check for IE split bug
    if ("aaa".split(/a/).length == 0)
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        }
    else
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };


    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r\n|\r|\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };

    this.getNewLineCharacter = function() {
      switch (this.$newLineMode) {
          case "windows":
              return "\r\n";

          case "unix":
              return "\n";

          case "auto":
              return this.$autoNewLine;
      }
    };

    this.$autoNewLine = "\n";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode)
            return;

        this.$newLineMode = newLineMode;
    };

    this.getNewLineMode = function() {
        return this.$newLineMode;
    };

    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };

    /**
     * Get a verbatim copy of the given line as it is in the document
     */
    this.getLine = function(row) {
        return this.$lines[row] || "";
    };

    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow + 1);
    };

    /**
     * Returns all lines in the document as string array. Warning: The caller
     * should not modify this array!
     */
    this.getAllLines = function() {
        return this.getLines(0, this.getLength());
    };

    this.getLength = function() {
        return this.$lines.length;
    };

    this.getTextRange = function(range) {
        if (range.start.row == range.end.row) {
            return this.$lines[range.start.row].substring(range.start.column,
                                                         range.end.column);
        }
        else {
            var lines = [];
            lines.push(this.$lines[range.start.row].substring(range.start.column));
            lines.push.apply(lines, this.getLines(range.start.row+1, range.end.row-1));
            lines.push(this.$lines[range.end.row].substring(0, range.end.column));
            return lines.join(this.getNewLineCharacter());
        }
    };

    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length-1).length;
        }
        return position;
    };

    this.insert = function(position, text) {
        if (text.length == 0)
            return position;

        position = this.$clipPosition(position);

        if (this.getLength() <= 1)
            this.$detectNewLine(text);

        var lines = this.$split(text);
        var firstLine = lines.splice(0, 1)[0];
        var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];

        position = this.insertInLine(position, firstLine);
        if (lastLine !== null) {
            position = this.insertNewLine(position); // terminate first line
            position = this.insertLines(position.row, lines);
            position = this.insertInLine(position, lastLine || "");
        }
        return position;
    };

    this.insertLines = function(row, lines) {
        if (lines.length == 0)
            return {row: row, column: 0};

        var args = [row, 0];
        args.push.apply(args, lines);
        this.$lines.splice.apply(this.$lines, args);

        var range = new Range(row, 0, row + lines.length, 0);
        var delta = {
            action: "insertLines",
            range: range,
            lines: lines
        };
        this._emit("change", { data: delta });
        return range.end;
    };

    this.insertNewLine = function(position) {
        position = this.$clipPosition(position);
        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column);
        this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));

        var end = {
            row : position.row + 1,
            column : 0
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: this.getNewLineCharacter()
        };
        this._emit("change", { data: delta });

        return end;
    };

    this.insertInLine = function(position, text) {
        if (text.length == 0)
            return position;

        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column) + text
                + line.substring(position.column);

        var end = {
            row : position.row,
            column : position.column + text.length
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: text
        };
        this._emit("change", { data: delta });

        return end;
    };

    this.remove = function(range) {
        // clip to document
        range.start = this.$clipPosition(range.start);
        range.end = this.$clipPosition(range.end);

        if (range.isEmpty())
            return range.start;

        var firstRow = range.start.row;
        var lastRow = range.end.row;

        if (range.isMultiLine()) {
            var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;
            var lastFullRow = lastRow - 1;

            if (range.end.column > 0)
                this.removeInLine(lastRow, 0, range.end.column);

            if (lastFullRow >= firstFullRow)
                this.removeLines(firstFullRow, lastFullRow);

            if (firstFullRow != firstRow) {
                this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);
                this.removeNewLine(range.start.row);
            }
        }
        else {
            this.removeInLine(firstRow, range.start.column, range.end.column);
        }
        return range.start;
    };

    this.removeInLine = function(row, startColumn, endColumn) {
        if (startColumn == endColumn)
            return;

        var range = new Range(row, startColumn, row, endColumn);
        var line = this.getLine(row);
        var removed = line.substring(startColumn, endColumn);
        var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
        this.$lines.splice(row, 1, newLine);

        var delta = {
            action: "removeText",
            range: range,
            text: removed
        };
        this._emit("change", { data: delta });
        return range.start;
    };

    /**
     * Removes a range of full lines
     *
     * @param firstRow {Integer} The first row to be removed
     * @param lastRow {Integer} The last row to be removed
     * @return {String[]} The removed lines
     */
    this.removeLines = function(firstRow, lastRow) {
        var range = new Range(firstRow, 0, lastRow + 1, 0);
        var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);

        var delta = {
            action: "removeLines",
            range: range,
            nl: this.getNewLineCharacter(),
            lines: removed
        };
        this._emit("change", { data: delta });
        return removed;
    };

    this.removeNewLine = function(row) {
        var firstLine = this.getLine(row);
        var secondLine = this.getLine(row+1);

        var range = new Range(row, firstLine.length, row+1, 0);
        var line = firstLine + secondLine;

        this.$lines.splice(row, 2, line);

        var delta = {
            action: "removeText",
            range: range,
            text: this.getNewLineCharacter()
        };
        this._emit("change", { data: delta });
    };

    this.replace = function(range, text) {
        if (text.length == 0 && range.isEmpty())
            return range.start;

        // Shortcut: If the text we want to insert is the same as it is already
        // in the document, we don't have to replace anything.
        if (text == this.getTextRange(range))
            return range.end;

        this.remove(range);
        if (text) {
            var end = this.insert(range.start, text);
        }
        else {
            end = range.start;
        }

        return end;
    };

    this.applyDeltas = function(deltas) {
        for (var i=0; i<deltas.length; i++) {
            var delta = deltas[i];
            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.insertLines(range.start.row, delta.lines);
            else if (delta.action == "insertText")
                this.insert(range.start, delta.text);
            else if (delta.action == "removeLines")
                this.removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "removeText")
                this.remove(range);
        }
    };

    this.revertDeltas = function(deltas) {
        for (var i=deltas.length-1; i>=0; i--) {
            var delta = deltas[i];

            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "insertText")
                this.remove(range);
            else if (delta.action == "removeLines")
                this.insertLines(range.start.row, delta.lines);
            else if (delta.action == "removeText")
                this.insert(range.start, delta.text);
        }
    };

}).call(Document.prototype);

exports.Document = Document;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/range', ['require', 'exports', 'module' ], function(require, exports, module) {
"use strict";

var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
        row: startRow,
        column: startColumn
    };

    this.end = {
        row: endRow,
        column: endColumn
    };
};

(function() {
    this.isEequal = function(range) {
        return this.start.row == range.start.row &&
            this.end.row == range.end.row &&
            this.start.column == range.start.column &&
            this.end.column == range.end.column
    };

    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };

    /**
     * Compares this range (A) with another range (B), where B is the passed in
     * range.
     *
     * Return values:
     *  -2: (B) is infront of (A) and doesn't intersect with (A)
     *  -1: (B) begins before (A) but ends inside of (A)
     *   0: (B) is completly inside of (A) OR (A) is complety inside of (B)
     *  +1: (B) begins inside of (A) but ends outside of (A)
     *  +2: (B) is after (A) and doesn't intersect with (A)
     *
     *  42: FTW state: (B) ends in (A) but starts outside of (A)
     */
    this.compareRange = function(range) {
        var cmp,
            end = range.end,
            start = range.start;

        cmp = this.compare(end.row, end.column);
        if (cmp == 1) {
            cmp = this.compare(start.row, start.column);
            if (cmp == 1) {
                return 2;
            } else if (cmp == 0) {
                return 1;
            } else {
                return 0;
            }
        } else if (cmp == -1) {
            return -2;
        } else {
            cmp = this.compare(start.row, start.column);
            if (cmp == -1) {
                return -1;
            } else if (cmp == 1) {
                return 42;
            } else {
                return 0;
            }
        }
    }

    this.comparePoint = function(p) {
        return this.compare(p.row, p.column);
    }

    this.containsRange = function(range) {
        return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    }

    this.isEnd = function(row, column) {
        return this.end.row == row && this.end.column == column;
    }

    this.isStart = function(row, column) {
        return this.start.row == row && this.start.column == column;
    }

    this.setStart = function(row, column) {
        if (typeof row == "object") {
            this.start.column = row.column;
            this.start.row = row.row;
        } else {
            this.start.row = row;
            this.start.column = column;
        }
    }

    this.setEnd = function(row, column) {
        if (typeof row == "object") {
            this.end.column = row.column;
            this.end.row = row.row;
        } else {
            this.end.row = row;
            this.end.column = column;
        }
    }

    this.inside = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column) || this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    }

    this.insideStart = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    }

    this.insideEnd = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    }

    this.compare = function(row, column) {
        if (!this.isMultiLine()) {
            if (row === this.start.row) {
                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
            };
        }

        if (row < this.start.row)
            return -1;

        if (row > this.end.row)
            return 1;

        if (this.start.row === row)
            return column >= this.start.column ? 0 : -1;

        if (this.end.row === row)
            return column <= this.end.column ? 0 : 1;

        return 0;
    };

    /**
     * Like .compare(), but if isStart is true, return -1;
     */
    this.compareStart = function(row, column) {
        if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    }

    /**
     * Like .compare(), but if isEnd is true, return 1;
     */
    this.compareEnd = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else {
            return this.compare(row, column);
        }
    }

    this.compareInside = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    }

    this.clipRows = function(firstRow, lastRow) {
        if (this.end.row > lastRow) {
            var end = {
                row: lastRow+1,
                column: 0
            };
        }

        if (this.start.row > lastRow) {
            var start = {
                row: lastRow+1,
                column: 0
            };
        }

        if (this.start.row < firstRow) {
            var start = {
                row: firstRow,
                column: 0
            };
        }

        if (this.end.row < firstRow) {
            var end = {
                row: firstRow,
                column: 0
            };
        }
        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.extend = function(row, column) {
        var cmp = this.compare(row, column);

        if (cmp == 0)
            return this;
        else if (cmp == -1)
            var start = {row: row, column: column};
        else
            var end = {row: row, column: column};

        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
        return (this.start.row == this.end.row && this.start.column == this.end.column);
    };

    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };

    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };

    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };

    this.toScreenRange = function(session) {
        var screenPosStart =
            session.documentToScreenPosition(this.start);
        var screenPosEnd =
            session.documentToScreenPosition(this.end);

        return new Range(
            screenPosStart.row, screenPosStart.column,
            screenPosEnd.row, screenPosEnd.column
        );
    };

}).call(Range.prototype);


Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
};

exports.Range = Range;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/anchor', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter'], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;

/**
 * An Anchor is a floating pointer in the document. Whenever text is inserted or
 * deleted before the cursor, the position of the cursor is updated
 */
var Anchor = exports.Anchor = function(doc, row, column) {
    this.document = doc;
    
    if (typeof column == "undefined")
        this.setPosition(row.row, row.column);
    else
        this.setPosition(row, column);

    this.$onChange = this.onChange.bind(this);
    doc.on("change", this.$onChange);
};

(function() {

    oop.implement(this, EventEmitter);
    
    this.getPosition = function() {
        return this.$clipPositionToDocument(this.row, this.column);
    };
    
    this.getDocument = function() {
        return this.document;
    };
    
    this.onChange = function(e) {
        var delta = e.data;
        var range = delta.range;
            
        if (range.start.row == range.end.row && range.start.row != this.row)
            return;
            
        if (range.start.row > this.row)
            return;
            
        if (range.start.row == this.row && range.start.column > this.column)
            return;
    
        var row = this.row;
        var column = this.column;
        
        if (delta.action === "insertText") {
            if (range.start.row === row && range.start.column <= column) {
                if (range.start.row === range.end.row) {
                    column += range.end.column - range.start.column;
                }
                else {
                    column -= range.start.column;
                    row += range.end.row - range.start.row;
                }
            }
            else if (range.start.row !== range.end.row && range.start.row < row) {
                row += range.end.row - range.start.row;
            }
        } else if (delta.action === "insertLines") {
            if (range.start.row <= row) {
                row += range.end.row - range.start.row;
            }
        }
        else if (delta.action == "removeText") {
            if (range.start.row == row && range.start.column < column) {
                if (range.end.column >= column)
                    column = range.start.column;
                else
                    column = Math.max(0, column - (range.end.column - range.start.column));
                
            } else if (range.start.row !== range.end.row && range.start.row < row) {
                if (range.end.row == row) {
                    column = Math.max(0, column - range.end.column) + range.start.column;
                }
                row -= (range.end.row - range.start.row);
            }
            else if (range.end.row == row) {
                row -= range.end.row - range.start.row;
                column = Math.max(0, column - range.end.column) + range.start.column;
            }
        } else if (delta.action == "removeLines") {
            if (range.start.row <= row) {
                if (range.end.row <= row)
                    row -= range.end.row - range.start.row;
                else {
                    row = range.start.row;
                    column = 0;
                }
            }
        }

        this.setPosition(row, column, true);
    };

    this.setPosition = function(row, column, noClip) {
        var pos;
        if (noClip) {
            pos = {
                row: row,
                column: column
            };
        }
        else {
            pos = this.$clipPositionToDocument(row, column);
        }
        
        if (this.row == pos.row && this.column == pos.column)
            return;
            
        var old = {
            row: this.row,
            column: this.column
        };
        
        this.row = pos.row;
        this.column = pos.column;
        this._emit("change", {
            old: old,
            value: pos
        });
    };
    
    this.detach = function() {
        this.document.removeEventListener("change", this.$onChange);
    };
    
    this.$clipPositionToDocument = function(row, column) {
        var pos = {};
    
        if (row >= this.document.getLength()) {
            pos.row = Math.max(0, this.document.getLength() - 1);
            pos.column = this.document.getLine(pos.row).length;
        }
        else if (row < 0) {
            pos.row = 0;
            pos.column = 0;
        }
        else {
            pos.row = row;
            pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
        }
        
        if (column < 0)
            pos.column = 0;
            
        return pos;
    };
    
}).call(Anchor.prototype);

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/lib/lang', ['require', 'exports', 'module' ], function(require, exports, module) {
"use strict";

exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
     return new Array(count + 1).join(string);
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
};

exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = this.copyObject( array[i] );
        else 
            copy[i] = array[i];
    }
    return copy;
};

exports.deepCopy = function (obj) {
    if (typeof obj != "object") {
        return obj;
    }
    
    var copy = obj.constructor();
    for (var key in obj) {
        if (typeof obj[key] == "object") {
            copy[key] = this.deepCopy(obj[key]);
        } else {
            copy[key] = obj[key];
        }
    }
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

/**
 * splice out of 'array' anything that === 'value'
 */
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.deferredCall = function(fcn) {

    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var deferred = function(timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
        this.cancel();
        fcn();
        return deferred;
    };

    deferred.cancel = function() {
        clearTimeout(timer);
        timer = null;
        return deferred;
    };

    return deferred;
};

});
define('treehugger/tree', ['require', 'exports', 'module' ], function(require, exports, module) {

function inRange(p, pos) {
    if(p && p.sl <= pos.line && p.el >= pos.line) {
        if(p.sl < pos.line && p.el > pos.line)
            return true;
        else if(p.sl == pos.line && p.el > pos.line)
            return p.sc <= pos.col;
        else if(p.sl == pos.line && p.el === pos.line)
            return p.sc <= pos.col && p.ec >= pos.col;
        else if(p.sl < pos.line && p.el === pos.line)
            return p.ec >= pos.col;
    }
}

/**
 * Base 'class' of every tree node
 */
function Node() {
}

Node.prototype.toPrettyString = function(prefix) {
    prefix = prefix || "";
    return prefix + this.toString();
};

Node.prototype.setAnnotation = function(name, value) {
    this.annos = this.annos || {};
    this.annos[name] = value;
};

Node.prototype.getAnnotation = function(name) {
    return this.annos ? this.annos[name] : undefined;
};

Node.prototype.getPos = function() {
    if(this.annos && this.annos.pos) {
        return this.annos.pos;
    } else {
        return null;
    }
};

Node.prototype.findNode = function(pos) {
    var p = this.getPos();
    if(inRange(p, pos)) {
        return this;
    } else {
        return null;
    }
};

/**
 * Represents a constructor node
 * 
 * Example: Add(Num("1"), Num("2")) is constucted
 *    using new ConsNode(new ConsNode("Num", [new StringNode("1")]),
 *                                         new ConsNode("Num", [new StringNode("2")]))
 *    or, more briefly:
 *        tree.cons("Add", [tree.cons("Num", [ast.string("1"), ast.string("2")])])
 */
function ConsNode(cons, children) {
    this.cons = cons;
    for(var i = 0; i < children.length; i++) {
        this[i] = children[i];
    }
    this.length = children.length;
}

ConsNode.prototype = new Node();

/**
 * Simple human-readable string representation (no indentation)
 */
ConsNode.prototype.toString = function(prefix) {
    try {
        var s = this.cons + "(";
        for ( var i = 0; i < this.length; i++) {
            s += this[i].toString() + ",";
        }
        if (this.length > 0) {
            s = s.substring(0, s.length - 1);
        }
        return s + ")";
    } catch(e) {
        console.error("Something went wrong: ", this, e);
    }
};

/**
 * Human-readable string representation (indentented)
 * @param prefix is for internal use
 */
ConsNode.prototype.toPrettyString = function(prefix) {
    prefix = prefix || "";
    try {
        if(this.length === 0) {
            return prefix + this.cons + "()";
        }
        if(this.length === 1 && (this[0] instanceof StringNode || this[0] instanceof NumNode)) {
            return prefix + this.cons + "(" + this[0].toString() + ")";
        }
        var s = prefix + this.cons + "(\n";
        for ( var i = 0; i < this.length; i++) {
            s += this[i].toPrettyString(prefix + "    ") + ",\n";
        }
        s = s.substring(0, s.length - 2);
        s += "\n";
        return s + prefix + ")";
    } catch(e) {
        console.error("Something went wrong: ", this, e);
    }
};

/**
 * Matches the current term against `t`, writing matching placeholder values to `matches`
 * @param t the node to match against
 * @param matches the object to write placeholder values to
 * @returns the `matches` object if it matches, false otherwise
 */
ConsNode.prototype.match = function(t, matches) {
    matches = matches || {};
    if (t instanceof ConsNode) {
        if (this.cons === t.cons) {
            if (this.length === t.length) {
                for ( var i = 0; i < this.length; i++) {
                    if (!this[i].match(t[i], matches)) {
                        return false;
                    }
                }
                return matches;
            }
        }
    }
    return false;
};

/**
 * Builds a node, based on values (similar to `matches` object),
 * replacing placeholder nodes with values from `values`
 * @returns resulting cons node
 */
ConsNode.prototype.build = function(values) {
    var children = [];
    for ( var i = 0; i < this.length; i++) {
        children.push(this[i].build(values));
    }
    return new ConsNode(this.cons, children);
};

/**
 * Prettier JSON representation of constructor node.
 */
ConsNode.prototype.toJSON = function() {
    var l = [];
    for(var i = 0; i < this.length; i++) {
        l.push(this[i]);
    }
    return {cons: this.cons, children: l};
};

ConsNode.prototype.getPos = function() {
    var pos = {sl : 9999999999,
               sc : 9999999999,
               el : 0,
               ec : 0};
    if (this.getAnnotation("pos")) {
        var nodePos = this.getAnnotation("pos");
        pos = {sl : nodePos.sl,
               sc : nodePos.sc,
               el : nodePos.el,
               ec : nodePos.ec};
    }
    for (var i = 0; i < this.length; i++) {
        var p = this[i].getPos();

        if (p) {
            var oldSl = pos.sl;
            pos.sl = Math.min(pos.sl, p.sl);
            if(pos.sl !== oldSl)
                pos.sc = p.sc;
            else
                pos.sc = Math.min(pos.sc, p.sc);
            var oldEl = pos.el;
            pos.el = Math.max(pos.el, p.el);
            if(pos.el !== oldEl)
                pos.ec = p.ec;
            else
                pos.ec = Math.max(pos.ec, p.ec);
        }
    }
    return pos;
};

ConsNode.prototype.findNode = function(pos) {
    var p = this.getPos();

    if(inRange(p, pos)) {
        for(var i = 0; i < this.length; i++) {
            var p2 = this[i].getPos();
            if(inRange(p2, pos)) {
                var node = this[i].findNode(pos);
                if(node)
                    return node instanceof StringNode ? this : node;
                else
                    return this[i];
            }
        }
    } else {
        return null;
    }
};

/**
 * Constructor node factory.
 */
exports.cons = function(name, children) {
    return new ConsNode(name, children);
};

/**
 * AST node representing a list
 * e.g. for constructors with variable number of arguments, e.g. in
 *      Call(Var("alert"), [Num("10"), Num("11")])
 * 
 */
function ListNode (children) {
    for(var i = 0; i < children.length; i++)
        this[i] = children[i];
    this.length = children.length;
}

ListNode.prototype = new Node();

ListNode.prototype.toString = function() {
    var s = "[";
    for (var i = 0; i < this.length; i++)
        s += this[i].toString() + ",";
    if (this.length > 0)
        s = s.substring(0, s.length - 1);
    return s + "]";
};

ListNode.prototype.toPrettyString = function(prefix) {
    prefix = prefix || "";
    try {
        if(this.length === 0)
            return prefix + "[]";
        var s = prefix + "[\n";
        for ( var i = 0; i < this.length; i++)
            s += this[i].toPrettyString(prefix + "  ") + ",\n";
        s = s.substring(0, s.length - 2);
        s += "\n";
        return s + prefix + "]";
    } catch(e) {
        console.error("Something went wrong: ", this);
    }
};

ListNode.prototype.match = function(t, matches) {
    matches = matches || {};
    if (t instanceof ListNode) {
        if (this.length === t.length) {
            for ( var i = 0; i < this.length; i++)
                if (!this[i].match(t[i], matches))
                    return false;
            return matches;
        }
        else
            return false;
    }
    else
        return false;
};

ListNode.prototype.build = function(values) {
    var children = [];
    for (var i = 0; i < this.length; i++)
        children.push(this[i].build(values));
    return new ListNode(children);
};

ListNode.prototype.getPos = ConsNode.prototype.getPos;
ListNode.prototype.findNode = ConsNode.prototype.findNode;

/**
 * forEach implementation, similar to Array.prototype.forEach
 */
ListNode.prototype.forEach = function(fn) {
    for(var i = 0; i < this.length; i++) {
        fn.call(this[i], this[i], i);
    }
};

/**
 * Whether the list is empty (0 elements)
 */
ListNode.prototype.isEmpty = function() {
    return this.length === 0;
};

/**
 * Performs linear search, performing a match
 * with each element in the list
 * @param el the element to search for
 * @returns true if found, false if not
 */
ListNode.prototype.contains = function(el) {
    for(var i = 0; i < this.length; i++)
        if(el.match(this[i]))
            return true;
    return false;
};

/**
 * Concatenates list with another list, similar to Array.prototype.concat
 */
ListNode.prototype.concat = function(l) {
    var ar = [];
    for(var i = 0; i < this.length; i++)
        ar.push(this[i]);
    for(i = 0; i < l.length; i++)
        ar.push(l[i]);
    return exports.list(ar);
};

ListNode.prototype.toJSON = function() {
    var l = [];
    for(var i = 0; i < this.length; i++)
        l.push(this[i]);
    return l;
};

/**
 * Returns a new list node, with all duplicates removed
 * Note: cubic complexity algorithm used
 */
ListNode.prototype.removeDuplicates = function() {
    var newList = [];
    lbl: for(var i = 0; i < this.length; i++) {
        for(var j = 0; j < newList.length; j++)
            if(newList[j].match(this[i]))
                continue lbl;
        newList.push(this[i]);
    }
    return new exports.list(newList);
};

ListNode.prototype.toArray = ListNode.prototype.toJSON;

/**
 * ListNode factory
 */
exports.list = function(elements) {
    return new ListNode(elements);
};

function NumNode (value) {
    this.value = value;
}

NumNode.prototype = new Node();

NumNode.prototype.toString = function() {
    return ""+this.value;
};

NumNode.prototype.match = function(t, matches) {
    matches = matches || {};
    if (t instanceof NumNode)
        return this.value === t.value ? matches : false;
    else
        return false;
};

NumNode.prototype.build = function(values) {
    return this;
};

exports.num = function(value) {
    return new NumNode(value);
};

function StringNode (value) {
    this.value = value;
}

StringNode.prototype = new Node();

StringNode.prototype.toString = function() {
    return '"' + this.value + '"';
};

StringNode.prototype.match = function(t, matches) {
    matches = matches || {};
    if (t instanceof StringNode)
        return this.value === t.value ? matches : false;
    else
        return false;
};

StringNode.prototype.build = function(values) {
    return this;
};

exports.string = function(value) {
    return new StringNode(value);
};

function PlaceholderNode(id) {
    this.id = id;
}

PlaceholderNode.prototype = new Node();

PlaceholderNode.prototype.toString = function() {
    return this.id;
};

PlaceholderNode.prototype.match = function(t, matches) {
    matches = matches || {};
    if(this.id === '_')
        return matches;
    if(matches[this.id]) // already bound
        return matches[this.id].match(t);
    else {
        matches[this.id] = t;
        return matches;
    }
};

PlaceholderNode.prototype.build = function(values) {
    return values[this.id];
};

exports.placeholder = function(n) {
    return new PlaceholderNode(n);
};

var parseCache = {};

function parse (s) {
    var idx = 0;
    function accept (str) {
        for ( var i = 0; i < str.length && idx + i < s.length; i++) {
            if (str[i] != s[idx + i]) {
                return false;
            }
        }
        return i == str.length;
    }
    function lookAheadLetter() {
        return s[idx] >= 'a' && s[idx] <= 'z' || s[idx] >= 'A' && s[idx] <= 'Z' || s[idx] === '_' || s[idx] >= '0' && s[idx] <= '9';
    }
    function skipWhitespace () {
        while (idx < s.length && (s[idx] === " " || s[idx] === "\n" || s[idx] === "\r" || s[idx] === "\t")) {
            idx++;
        }
    }
    function parseInt () {
        var pos = idx;
        if (s[idx] >= '0' && s[idx] <= '9') {
            var ns = s[idx];
            idx++;
            while (idx < s.length && s[idx] >= '0' && s[idx] <= '9') {
                ns += s[idx];
                idx++;
            }
            skipWhitespace();
            return new NumNode(+ns, pos);
        } else {
            return null;
        }
    }
    function parseString () {
        var pos = idx;
        if (accept('"')) {
            var ns = "";
            idx++;
            while (!accept('"') || (accept('"') && s[idx - 1] == '\\')) {
                ns += s[idx];
                idx++;
            }
            var ns2 = '';
            for ( var i = 0; i < ns.length; i++) {
                if (ns[i] == "\\") {
                    i++;
                    switch (ns[i]) {
                        case 'n':
                            ns2 += "\n";
                            break;
                        case 't':
                            ns2 += "\t";
                            break;
                        default:
                            ns2 += ns[i];
                    }
                } else {
                    ns2 += ns[i];
                }
            }
            idx++;
            skipWhitespace();
            return new StringNode(ns2, pos);
        } else {
          return null;
        }
    }
    function parsePlaceholder() {
        var pos = idx;
        if (lookAheadLetter() && s[idx].toLowerCase() === s[idx]) {
            var ns = "";
            while (lookAheadLetter() && idx < s.length) {
                ns += s[idx];
                idx++;
            }
            skipWhitespace();
            return new PlaceholderNode(ns, pos);
        }
        else {
            return null;
        }
    }
    function parseList() {
        var pos = idx;
        if (accept('[')) {
            var items = [];
            idx++;
            skipWhitespace();
            while (!accept(']') && idx < s.length) {
                items.push(parseExp());
                if (accept(',')) {
                    idx++; // skip comma
                    skipWhitespace();
                }
            }
            idx++;
            skipWhitespace();
            return new ListNode(items, pos);
        }
        else {
            return null;
        }
    }
    function parseCons () {
        var pos = idx;
        // assumption: it's an appl
        var ns = "";
        while (!accept('(')) {
            ns += s[idx];
            idx++;
        }
        idx++; // skip (
        var items = [];
        while (!accept(')') && idx < s.length) {
            items.push(parseExp());
            if (accept(',')) {
                idx++; // skip comma
                skipWhitespace();
            }
        }
        idx++;
        skipWhitespace();
        return new ConsNode(ns, items, pos);
    }

    function parseExp() {
        var r = parseInt();
        if (r) return r;
        r = parseString();
        if (r) return r;
        r = parseList();
        if (r) return r;
        r = parsePlaceholder();
        if (r) return r;
        return parseCons();
    }
  
    if(typeof s !== 'string') {
        return null;
    }
  
    if(s.length < 200 && !parseCache[s]) {
        parseCache[s] = parseExp();
    } else if(!parseCache[s]) {
        return parseExp();
    }
    return parseCache[s];
}

exports.Node = Node;
exports.ConsNode = ConsNode;
exports.ListNode = ListNode;
exports.NumNode = NumNode;
exports.StringNode = StringNode;
exports.PlaceholderNode = PlaceholderNode;
exports.parse = parse;
exports.inRange = inRange;

});
define('ext/codecomplete/local_completer', ['require', 'exports', 'module' , 'ext/language/base_handler', 'ext/codecomplete/complete_util'], function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var completeUtil = require("ext/codecomplete/complete_util");

var SPLIT_REGEX = /[^a-zA-Z_0-9\$]+/;

var completer = module.exports = Object.create(baseLanguageHandler);
    
completer.handlesLanguage = function(language) {
    return true;
};

// For the current document, gives scores to identifiers not on frequency, but on distance from the current prefix
function wordDistanceAnalyzer(doc, pos, prefix) {
    var text = doc.getValue().trim();
    
    // Determine cursor's word index
    var textBefore = doc.getLines(0, pos.row-1).join("\n") + "\n";
    var currentLine = doc.getLine(pos.row);
    textBefore += currentLine.substr(0, pos.column);
    var prefixPosition = textBefore.trim().split(SPLIT_REGEX).length;
    
    // Split entire document into words
    var identifiers = text.split(SPLIT_REGEX);
    var identDict = {};
    
    // Find prefix to find other identifiers close it
    for (var i = 0; i < identifiers.length; i++) {
        var ident = identifiers[i];
        var distance = Math.max(prefixPosition, i) - Math.min(prefixPosition, i);
        // Score substracted from 100000 to force descending ordering
        if (Object.prototype.hasOwnProperty.call(identDict, ident))
            identDict[ident] = Math.max(1000000-distance, identDict[ident]);
        else
            identDict[ident] = 1000000-distance;
        
    }
    return identDict;
}

function analyze(doc, pos) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    
    var analysisCache = wordDistanceAnalyzer(doc, pos, identifier);
    // Remove the word to be completed
    delete analysisCache[identifier];
    return analysisCache;
}

/**
 * Returns whether the completion engine requires an AST representation of the code
 */
completer.completionRequiresParsing = function() {
    return false;
};
    
completer.complete = function(doc, fullAst, pos, currentNode) {
    var identDict = analyze(doc, pos);
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    
    var allIdentifiers = [];
    for (var ident in identDict) {
        allIdentifiers.push(ident);
    }
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);

    return matches.map(function(m) {
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          score       : identDict[m],
          meta        : "",
          priority    : 1
        };
    });
};

});
/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
/**
 * This module implements the base handler object that other language handlers
 * can override.
 */
define('ext/language/base_handler', ['require', 'exports', 'module' ], function(require, exports, module) {

module.exports = {
    
    path: null,
    
    // UTILITIES
    
    isFeatureEnabled: function(name) {
        return !disabledFeatures[name];
    },

    // OVERRIDABLE METHODS

    /**
     * Returns whether this language handler should be enabled for the given file
     * @param path the file path of the file
     */
    handlesLanguage: function(language) {
        return false;
    },

    /**
     * If the language handler implements parsing, this function should take
     * the source code and turn it into an AST (in treehugger format)
     * @param code code to parse
     * @return treehugger AST or null if not implemented
     */
    parse: function(doc) {
        return null;
    },
    
    /**
     * Whether this language handler relies on continuous parsing (on an interval basis).
     * This will result in `onParse` being invoked after every successful parse
     */
    requiresContinuousParsing: function() {
        return false;
    },
    
    /**
     * Invoked on a successful parse
     * @param ast the resulting AST in treehugger format
     */
    onParse: function(ast) {
    },
    
    /**
     * Invoked when the document has been updated (possibly after a certain interval)
     * @param doc the document object
     */
    onUpdate: function(doc) {
    },
    
    /**
     * Invoked when a new document has been opened
     * @param path the path of the newly opened document
     * @param doc the document object
     * @param oldPath the path of the document that was active before
     */
    onDocumentOpen: function(path, doc, oldPath) {
    },
    
    /**
     * Invoked when a document is closed in the IDE
     * @param path the path of the file
     */
    onDocumentClose: function(path) {
    },
    
    /**
     * Invoked when the cursor has been moved inside to a different AST node
     * @return a JSON object with three optional keys: {markers: [...], hint: {message: ...}, enableRefactoring: [...]}
     */
    onCursorMovedNode: function(doc, fullAst, cursorPos, currentNode) {
    },
    
    /**
     * Invoked when an outline is required
     * @return a JSON outline structure or null if not supported
     */
    outline: function(ast) {
        return null;
    },
    
    /**
     * Returns whether the completion engine requires an AST representation of the code
     */
    completionRequiresParsing: function() {
        return false;
    },
    
    /**
     * Performs code completion for the user based on the current cursor position
     * @param doc the entire source code as string
     * @param fullAst the entire AST of the current file
     * @param cursorPos the current cursor position (object with keys 'row' and 'column')
     * @param currentNode the AST node the cursor is currently at
     */
    complete: function(doc, fullAst, cursorPos, currentNode) {
        return null;
    },

    /**
     * Returns whether the analysis engine requires an AST representation of the code
     */
    analysisRequiresParsing: function() {
        return true;
    },
    
    /**
     * Enables the handler to do analysis of the AST and annotate as desired
     */
    analyze: function(doc, fullAst) {
        return null;
    },
    
    /**
     * Invoked when inline variable renaming is activated
     * @return an array of positions of the currently selected variable
     */
    getVariablePositions: function(doc, fullAst, pos, currentNode) {
        return null;
    }
};

});define('ext/codecomplete/complete_util', ['require', 'exports', 'module' ], function(require, exports, module) {

var ID_REGEX = /[a-zA-Z_0-9\$]/;

function retrievePreceedingIdentifier(text, pos) {
    var buf = [];
    for (var i = pos-1; i >= 0; i--) {
        if(ID_REGEX.test(text[i]))
            buf.push(text[i]);
        else
            break;
    }
    return buf.reverse().join("");
}

function prefixBinarySearch(items, prefix) {
    var startIndex = 0;
    var stopIndex = items.length - 1;
    var middle = Math.floor((stopIndex + startIndex) / 2);
    
    while (stopIndex > startIndex && middle >= 0 && items[middle].indexOf(prefix) !== 0) {
        if (prefix < items[middle]) {
            stopIndex = middle - 1;
        }
        else if (prefix > items[middle]) {
            startIndex = middle + 1;
        }
        middle = Math.floor((stopIndex + stopIndex) / 2);
    }
    
    // Look back to make sure we haven't skipped any
    while (middle > 0 && items[middle-1].indexOf(prefix) === 0)
        middle--;
    return middle >= 0 ? middle : 0; // ensure we're not returning a negative index
}

function findCompletions(prefix, allIdentifiers) {
    allIdentifiers.sort();
    var startIdx = prefixBinarySearch(allIdentifiers, prefix);
    var matches = [];
    for (var i = startIdx; i < allIdentifiers.length &&
                          allIdentifiers[i].indexOf(prefix) === 0; i++) {
        matches.push(allIdentifiers[i]);
    }
    return matches;
}

exports.retrievePreceedingIdentifier = retrievePreceedingIdentifier;
exports.findCompletions = findCompletions;

});var globalRequire = require;

define('ext/codecomplete/snippet_completer', ['require', 'exports', 'module' , 'ext/codecomplete/complete_util', 'ext/language/base_handler'], function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");
var baseLanguageHandler = require('ext/language/base_handler');

var completer = module.exports = Object.create(baseLanguageHandler);

var snippetCache = {}; // extension -> snippets
    
completer.handlesLanguage = function(language) {
    return true;
};

completer.fetchText = function(path) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "/static/" + path, false);
    xhr.send();
    if(xhr.status === 200)
        return xhr.responseText;
    else
        return false;
};

completer.complete = function(doc, fullAst, pos, currentNode) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);

    var snippets = snippetCache[this.language];
    
    if (snippets === undefined) {
        var text = this.fetchText('ext/codecomplete/snippets/' + this.language + '.json');
        snippets = text ? JSON.parse(text) : {};
        // Cache
        snippetCache[this.language] = snippets;
    }
    
    var allIdentifiers = Object.keys(snippets);
    
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);
    return matches.map(function(m) {
        return {
          name        : m,
          replaceText : snippets[m],
          icon        : null,
          meta        : "snippet",
          priority    : 2
        };
    });
};


});define('ext/codecomplete/open_files_local_completer', ['require', 'exports', 'module' , 'ext/codecomplete/complete_util', 'ext/language/base_handler'], function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");

var baseLanguageHandler = require('ext/language/base_handler');

var analysisCache = {}; // path => {identifier: 3, ...}
var globalWordIndex = {}; // word => frequency
var globalWordFiles = {}; // word => [path]

var completer = module.exports = Object.create(baseLanguageHandler);

completer.handlesLanguage = function(language) {
    return true;
};

function frequencyAnalyzer(path, text, identDict, fileDict) {
    var identifiers = text.split(/[^a-zA-Z_0-9\$]+/);
    for (var i = 0; i < identifiers.length; i++) {
        var ident = identifiers[i];
        if (!ident)
            continue;
            
        if (Object.prototype.hasOwnProperty.call(identDict, ident)) {
            identDict[ident]++;
            fileDict[ident][path] = true;
        }
        else {
            identDict[ident] = 1;
            fileDict[ident] = {};
            fileDict[ident][path] = true;
        }
    }
    return identDict;
}

function removeDocumentFromCache(path) {
    var analysis = analysisCache[path];
    if (!analysis) return;

    for (var id in analysis) {
        globalWordIndex[id] -= analysis[id];
        delete globalWordFiles[id][path];
        if (globalWordIndex[id] === 0) {
            delete globalWordIndex[id];
            delete globalWordFiles[id];
        }
    }
    delete analysisCache[path];
}

function analyzeDocument(path, allCode) {
    if (!analysisCache[path]) {
        // Delay this slightly, because in Firefox document.value is not immediately filled
        analysisCache[path] = frequencyAnalyzer(path, allCode, {}, {});
        // may be a bit redundant to do this twice, but alright...
        frequencyAnalyzer(path, allCode, globalWordIndex, globalWordFiles);
    }
}

completer.onDocumentOpen = function(path, doc) {
    if (!analysisCache[path]) {
        analyzeDocument(path, doc.getValue());
    }
};
    
completer.onDocumentClose = function(path) {
    removeDocumentFromCache(path);
};

completer.onUpdate = function(doc) {
    removeDocumentFromCache(this.path);
    analyzeDocument(this.path, doc.getValue());
};

completer.complete = function(doc, fullAst, pos, currentNode) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    var identDict = globalWordIndex;
    
    var allIdentifiers = [];
    for (var ident in identDict) {
        allIdentifiers.push(ident);
    }
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);
    
    var currentPath = this.path;
    matches = matches.filter(function(m) {
        return !globalWordFiles[m][currentPath];
    });

    return matches.map(function(m) {
        var path = Object.keys(globalWordFiles[m])[0] || "[unknown]";
        var pathParts = path.split("/");
        var foundInFile = pathParts[pathParts.length-1];
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          score       : identDict[m],
          meta        : foundInFile,
          priority    : 0
        };
    });
};

});
/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define('ext/jslanguage/parse', ['require', 'exports', 'module' , 'treehugger/js/parse', 'ext/language/base_handler'], function(require, exports, module) {

var parser = require("treehugger/js/parse");
var baseLanguageHandler = require('ext/language/base_handler');

var handler = module.exports = Object.create(baseLanguageHandler);

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};
    
handler.parse = function(code) {
    code = code.replace(/^(#!.*\n)/, "//$1");
    return parser.parse(code);
};

/* Ready to be enabled to replace Narcissus, when mature

handler.analyze = function(doc, ast) {
    var error = ast.getAnnotation("error");
    if (error)
        return [{
            pos: {sl: error.line},
            type: 'error',
            message: error.message || "Parse error."
        }];
    else
        return [];
};
*/

});define('treehugger/js/parse', ['require', 'exports', 'module' , 'treehugger/js/uglifyparser', 'treehugger/tree'], function(require, exports, module) {

var parser = require("treehugger/js/uglifyparser");
var tree = require('treehugger/tree');

exports.parse = function(s) {
    var result = parser.parse(s, false, true);
    var node = exports.transform(result.ast);
    if(result.error)
        node.setAnnotation("error", result.error);
    return node;
};


function setIdPos(oNode, node) {
    if(!oNode.name)
        oNode.name = "";
    node.setAnnotation("pos", {
        sl: oNode.start.line,
        sc: oNode.start.col,
        // Let's not rely on what Uglify is telling us here
        el: oNode.start.line,
        ec: oNode.start.col + oNode.name.length
    });
    return node;
}

exports.transform = function(n) {
    if (!n) {
        return tree.cons("None", []);
    }
    var transform = exports.transform; 
    var nodeName = typeof n[0] === 'string' ? n[0] : n[0].name;
    
    var resultNode;
    
    switch(nodeName) {
        case "toplevel":
            resultNode = tree.list(n[1].map(transform));
            break;
        case "var":
            resultNode = tree.cons("VarDecls", [tree.list(n[1].map(function(varNode) {
                var idNode = tree.string(varNode[0].name);
                setIdPos(varNode[0], idNode);
                if(varNode[1])
                    return tree.cons("VarDeclInit", [idNode, transform(varNode[1])]);
                else
                    return tree.cons("VarDecl", [idNode]);
            }))]);
            break;
        case "let":
            resultNode = tree.cons("LetDecls", [tree.list(n[1].map(function(varNode) {
                var idNode = tree.string(varNode[0].name);
                setIdPos(varNode[0], idNode);
                if(varNode[1])
                    return tree.cons("LetDeclInit", [idNode, transform(varNode[1])]);
                else
                    return tree.cons("LetDecl", [idNode]);
            }))]);
            break;
        case "const":
            resultNode = tree.cons("ConstDecls", [tree.list(n[1].map(function(varNode) {
                return tree.cons("ConstDeclInit", [tree.string(varNode[0]), transform(varNode[1])]);
            }))]);
            break;
        case "num":
            resultNode = tree.cons("Num", [tree.string(n[1])]);
            break;
        case "string":
            resultNode = tree.cons("String", [tree.string(n[1])]);
            break;
        case "stat":
            return transform(n[1]);
        case "call":
            resultNode = tree.cons("Call", [transform(n[1]), tree.list(n[2].map(transform))]);
            break;
        case "return":
            resultNode = tree.cons("Return", [transform(n[1])]);
            break;
        case "new":
            resultNode = tree.cons("New", [transform(n[1]), tree.list(n[2].map(transform))]);
            break;
        case "object":
            resultNode = tree.cons("ObjectInit", [tree.list(n[1].map(function(propInit) {
                return tree.cons("PropertyInit", [tree.string(propInit[0]), transform(propInit[1])]);
            }))]);
            break;
        case "array":
            resultNode = tree.cons("Array", [tree.list(n[1].map(transform))]);
            break;
        case "conditional":
            resultNode = tree.cons("TernaryIf", [transform(n[1]), transform(n[2]), transform(n[3])]);
            break;
        case "label":
            resultNode = tree.cons("Label", [tree.string(n[1]), transform(n[2])]);
            break;
        case "continue":
            resultNode = tree.cons("Continue", [tree.string(n[1])]);
            break;
        case "assign":
            if(typeof n[1] === 'string') {
                resultNode = tree.cons("OpAssign", [tree.string(n[1]), transform(n[2]), transform(n[3])]);
            } else {
                resultNode = tree.cons("Assign", [transform(n[2]), transform(n[3])]);
            }
            break;
        case "dot":
            resultNode = tree.cons("PropAccess", [transform(n[1]), tree.string(n[2])]);
            break;
        case "name":
            resultNode = tree.cons("Var", [tree.string(n[1])]);
            break;
        case "defun":
            resultNode = tree.cons("Function", [setIdPos(n[1], tree.string(n[1].name || "")), tree.list(n[2].map(function(arg) {
                return setIdPos(arg, tree.cons("FArg", [tree.string(arg.name)]));
            })), tree.list(n[3].map(transform))]);
            break;
        case "function":
            var funName = tree.string(n[1].name || "");
            if(n[1].name)
                setIdPos(n[1], funName);
            var fargs = tree.list(n[2].map(function(arg) {
                return setIdPos(arg, tree.cons("FArg", [tree.string(arg.name)]));
            }));
            /*if(fargs.length > 0) {
                fargs.setAnnotation("pos", {
                    sl: fargs[0].getPos().sl,
                    sc: fargs[0].getPos().sl,
                    el: fargs[fargs.length - 1].getPos().el,
                    ec: fargs[fargs.length - 1].getPos().ec
                });
            }*/
            resultNode = tree.cons("Function", [funName, fargs, tree.list(n[3].map(transform))]);
            break;
        case "binary":
            resultNode = tree.cons("Op", [tree.string(n[1]), transform(n[2]), transform(n[3])]);
            break;
        case "unary-postfix":
            resultNode = tree.cons("PostfixOp", [tree.string(n[1]), transform(n[2])]);
            break;
        case "unary-prefix":
            resultNode = tree.cons("PrefixOp", [tree.string(n[1]), transform(n[2])]);
            break;
        case "sub":
            resultNode = tree.cons("Index", [transform(n[1]), transform(n[2])]);
            break;
        case "for":
            resultNode = tree.cons("For", [transform(n[1]), transform(n[2]), transform(n[3]), transform(n[4])]);
            break;
        case "for-in":
            resultNode = tree.cons("ForIn", [transform(n[1]), transform(n[3]), transform(n[4])]);
            break;
        case "while":
            resultNode = tree.cons("While", [transform(n[1]), transform(n[2])]);
            break;
        case "do": 
            resultNode = tree.cons("Do", [transform(n[2]), transform(n[1])]);
            break;
        case "switch":
            resultNode = tree.cons("Switch", [transform(n[1]), tree.list(n[2].map(function(opt) {
                return tree.cons("Case", [transform(opt[0]), tree.list(opt[1].map(transform))]);
            }))]);
            break;
        case "break":
            resultNode = tree.cons("Break", []);
            break;
        case "seq":
            resultNode = tree.cons("Seq", [transform(n[1]), transform(n[2])]);
            break;
        case "if":
            resultNode = tree.cons("If", [transform(n[1]), transform(n[2]), transform(n[3])]);
            break;
        case "block":
            resultNode = tree.cons("Block", [tree.list(n[1] ? n[1].map(transform) : [])]);
            break;
        case "regexp":
            resultNode = tree.cons("RegExp", [tree.string(n[1]), tree.string(n[2])]);
            break;
        case "throw":
            resultNode = tree.cons("Throw", [transform(n[1])]);
            break;
        case "try":
            resultNode = tree.cons("Try", [tree.list(n[1].map(transform)),
                 tree.list(n[2] ? [tree.cons("Catch", [tree.string(n[2][0]), tree.list(n[2][1].map(transform))])] : []),
                 n[3] ? tree.list(n[3].map(transform)) : tree.cons("None", [])]);
            break;
        case "with":
            resultNode = tree.cons("With", [transform(n[1]), tree.list(n[2][1].map(transform))]);
            break;
        case "atom":
            resultNode = tree.cons("Atom", []);
            break;
        case "ERROR":
            resultNode = tree.cons("ERROR", []);
            break;
        default:
            console.log("Not yet supported: "+ nodeName);
            console.log("Current node: "+ JSON.stringify(n));
    }

    resultNode.setAnnotation("origin", n);
    if(n[0].start) {
        if(resultNode.length === 1 && resultNode[0] instanceof tree.StringNode && resultNode[0].value) {
            resultNode.setAnnotation("pos", {sl: n[0].start.line, sc: n[0].start.col,
                                             el: n[0].start.line, ec: n[0].start.col + resultNode[0].value.length});
            
        } else {
            resultNode.setAnnotation("pos", {sl: n[0].start.line, sc: n[0].start.col,
                                             el: n[0].end.line,   ec: n[0].end.col});
        }
    }
    return resultNode;
};

});
/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.

  This version is suitable for Node.js.  With minimal changes (the
  exports stuff) it should work on any JS platform.

  This file contains the tokenizer/parser.  It is a port to JavaScript
  of parse-js [1], a JavaScript parser library written in Common Lisp
  by Marijn Haverbeke.  Thank you Marijn!

  [1] http://marijn.haverbeke.nl/parse-js/

  Exported functions:

    - tokenizer(code) -- returns a function.  Call the returned
      function to fetch the next token.

    - parse(code) -- returns an AST of the given JavaScript code.

  ----------------------------------------------------------------------
  
  This is an updated version of UglifyJS, adapted by zef@c9.io with error
  recovery, to keep  parsing code when errors are encountered

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>
    Based on parse-js (http://marijn.haverbeke.nl/parse-js/).

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/
 
define('treehugger/js/uglifyparser', ['require', 'exports', 'module' ], function(require, exports, module) {

/* -----[ Tokenizer (constants) ]----- */

var KEYWORDS = array_to_hash([
    "break",
    "case",
    "catch",
    "const",
    "continue",
    "default",
    "delete",
    "do",
    "else",
    "finally",
    "for",
    "function",
    "if",
    "in",
    "instanceof",
    "new",
    "return",
    "switch",
    "throw",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "let"
]);

var RESERVED_WORDS = array_to_hash([
    "abstract",
    "boolean",
    "byte",
    "char",
    "class",
    "debugger",
    "double",
    "enum",
    "export",
    "extends",
    "final",
    "float",
    "goto",
    "implements",
    "import",
    "int",
    "interface",
    "long",
    "native",
    "package",
    "private",
    "protected",
    "public",
    "short",
    "static",
    "super",
    "synchronized",
    "throws",
    "transient",
    "volatile"
]);

var KEYWORDS_BEFORE_EXPRESSION = array_to_hash([
    "return",
    "new",
    "delete",
    "throw",
    "else",
    "case"
]);

var KEYWORDS_ATOM = array_to_hash([
    "false",
    "null",
    "true",
    "undefined"
]);

var OPERATOR_CHARS = array_to_hash(characters("+-*&%=<>!?|~^"));

var RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;
var RE_OCT_NUMBER = /^0[0-7]+$/;
var RE_DEC_NUMBER = /^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i;

var OPERATORS = array_to_hash([
    "in",
    "instanceof",
    "typeof",
    "new",
    "void",
    "delete",
    "++",
    "--",
    "+",
    "-",
    "!",
    "~",
    "&",
    "|",
    "^",
    "*",
    "/",
    "%",
    ">>",
    "<<",
    ">>>",
    "<",
    ">",
    "<=",
    ">=",
    "==",
    "===",
    "!=",
    "!==",
    "?",
    "=",
    "+=",
    "-=",
    "/=",
    "*=",
    "%=",
    ">>=",
    "<<=",
    ">>>=",
    "|=",
    "^=",
    "&=",
    "&&",
    "||"
]);

var WHITESPACE_CHARS = array_to_hash(characters(" \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000"));

var PUNC_BEFORE_EXPRESSION = array_to_hash(characters("[{}(,.;:"));

var PUNC_CHARS = array_to_hash(characters("[]{}(),;:"));

var REGEXP_MODIFIERS = array_to_hash(characters("gmsiy"));

/* -----[ Tokenizer ]----- */

// regexps adapted from http://xregexp.com/plugins/#unicode
var UNICODE = {
    letter: new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u0523\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971\\u0972\\u097B-\\u097F\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3D\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC\\u0EDD\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8B\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10D0-\\u10FA\\u10FC\\u1100-\\u1159\\u115F-\\u11A2\\u11A8-\\u11F9\\u1200-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u1676\\u1681-\\u169A\\u16A0-\\u16EA\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u1900-\\u191C\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19A9\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u2094\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2183\\u2184\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2C6F\\u2C71-\\u2C7D\\u2C80-\\u2CE4\\u2D00-\\u2D25\\u2D30-\\u2D65\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005\\u3006\\u3031-\\u3035\\u303B\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31B7\\u31F0-\\u31FF\\u3400\\u4DB5\\u4E00\\u9FC3\\uA000-\\uA48C\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA65F\\uA662-\\uA66E\\uA67F-\\uA697\\uA717-\\uA71F\\uA722-\\uA788\\uA78B\\uA78C\\uA7FB-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA90A-\\uA925\\uA930-\\uA946\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAC00\\uD7A3\\uF900-\\uFA2D\\uFA30-\\uFA6A\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),
    non_spacing_mark: new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065E\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0900-\\u0902\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0955\\u0962\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2\\u09E3\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC\\u0CCD\\u0CE2\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86\\u0F87\\u0F90-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085\\u1086\\u108D\\u109D\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927\\u1928\\u1932\\u1939-\\u193B\\u1A17\\u1A18\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80\\u1B81\\u1BA2-\\u1BA5\\u1BA8\\u1BA9\\u1C2C-\\u1C33\\u1C36\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1DC0-\\u1DE6\\u1DFD-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA67C\\uA67D\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),
    space_combining_mark: new RegExp("[\\u0903\\u093E-\\u0940\\u0949-\\u094C\\u094E\\u0982\\u0983\\u09BE-\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B3E\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0B57\\u0BBE\\u0BBF\\u0BC1\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0F3E\\u0F3F\\u0F7F\\u102B\\u102C\\u1031\\u1038\\u103B\\u103C\\u1056\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A19-\\u1A1B\\u1A55\\u1A57\\u1A61\\u1A63\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1C24-\\u1C2B\\u1C34\\u1C35\\u1CE1\\u1CF2\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4-\\uA8C3\\uA952\\uA953\\uA983\\uA9B4\\uA9B5\\uA9BA\\uA9BB\\uA9BD-\\uA9C0\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D\\uAA7B\\uABE3\\uABE4\\uABE6\\uABE7\\uABE9\\uABEA\\uABEC]"),
    connector_punctuation: new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]")
};

function is_letter(ch) {
    return UNICODE.letter.test(ch);
}

function is_digit(ch) {
    ch = ch.charCodeAt(0);
    return ch >= 48 && ch <= 57; //XXX: find out if "UnicodeDigit" means something else than 0..9
}

function is_alphanumeric_char(ch) {
    return is_digit(ch) || is_letter(ch);
}

function is_unicode_combining_mark(ch) {
    return UNICODE.non_spacing_mark.test(ch) || UNICODE.space_combining_mark.test(ch);
}

function is_unicode_connector_punctuation(ch) {
    return UNICODE.connector_punctuation.test(ch);
}

function is_identifier_start(ch) {
    return ch == "$" || ch == "_" || is_letter(ch);
}

function is_identifier_char(ch) {
    return is_identifier_start(ch)
            || is_unicode_combining_mark(ch)
            || is_digit(ch)
            || is_unicode_connector_punctuation(ch)
            || ch == "\u200c" // zero-width non-joiner <ZWNJ>
            || ch == "\u200d"; // zero-width joiner <ZWJ> (in my ECMA-262 PDF, this is also 200c)
}

function parse_js_number(num) {
    if (RE_HEX_NUMBER.test(num)) {
        return parseInt(num.substr(2), 16);
    }
    else if (RE_OCT_NUMBER.test(num)) {
        return parseInt(num.substr(1), 8);
    }
    else if (RE_DEC_NUMBER.test(num)) {
        return parseFloat(num);
    }
}

function JS_Parse_Error(message, line, col, pos) {
    this.message = message;
    this.line = line;
    this.col = col;
    this.pos = pos;
    this.stack = new Error().stack;
}

JS_Parse_Error.prototype.toString = function() {
    return this.message + " (line: " + this.line + ", col: " + this.col + ", pos: " + this.pos + ")" + "\n\n" + this.stack;
}

function js_error(message, line, col, pos) {
    throw new JS_Parse_Error(message, line, col, pos);
}

function is_token(token, type, val) {
    return token.type == type && (val == null || token.value == val);
}

var EX_EOF = {};

function tokenizer($TEXT) {
    
    var S = {
        text            : $TEXT.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/^\uFEFF/, ''),
        pos             : 0,
        tokpos          : 0,
        line            : 0,
        tokline         : 0,
        col             : 0,
        tokcol          : 0,
        newline_before  : false,
        regex_allowed   : false,
        comments_before : []
    };
    
    function peek() {
        return S.text.charAt(S.pos);
    }
    
    function next(signal_eof) {
        var ch = S.text.charAt(S.pos++);
        if (signal_eof && !ch) throw EX_EOF;
        if (ch == "\n") {
            S.newline_before = true;
            ++S.line;
            S.col = 0;
        }
        else {
            ++S.col;
        }
        return ch;
    }
    
    function eof() {
        return !S.peek();
    }
    
    function find(what, signal_eof) {
        var pos = S.text.indexOf(what, S.pos);
        if (signal_eof && pos == -1) throw EX_EOF;
        return pos;
    }
    
    function start_token() {
        S.tokline = S.line;
        S.tokcol = S.col;
        S.tokpos = S.pos;
    }
    
    function token(type, value, is_comment) {
        S.regex_allowed = ((type == "operator" && !HOP(UNARY_POSTFIX, value)) ||
                           (type == "keyword" && HOP(KEYWORDS_BEFORE_EXPRESSION, value)) ||
                           (type == "punc" && HOP(PUNC_BEFORE_EXPRESSION, value)));
        var ret = {
            type  : type,
            value : value,
            line  : S.tokline,
            col   : S.tokcol,
            pos   : S.tokpos,
            nlb   : S.newline_before
        };
        if (!is_comment) {
            ret.comments_before = S.comments_before;
            S.comments_before = [];
        }
        S.newline_before = false;
        return ret;
    }
    
    function skip_whitespace() {
        while (HOP(WHITESPACE_CHARS, peek()))
            next();
    }
    
    function read_while(pred) {
        var ret = "", ch = peek(), i = 0;
        while (ch && pred(ch, i++)) {
            ret += next();
            ch = peek();
        }
        return ret;
    }
    
    function parse_error(err) {
        js_error(err, S.tokline, S.tokcol, S.tokpos);
    }
    
    function read_num(prefix) {
        var has_e = false,
            after_e = false,
            has_x = false,
            has_dot = prefix == ".";
        var num = read_while(function(ch, i) {
            if (ch == "x" || ch == "X") {
                if (has_x) return false;
                return has_x = true;
            }
            if (!has_x && (ch == "E" || ch == "e")) {
                if (has_e) return false;
                return has_e = after_e = true;
            }
            if (ch == "-") {
                if (after_e || (i == 0 && !prefix)) return true;
                return false;
            }
            if (ch == "+") return after_e;
            after_e = false;
            if (ch == ".") {
                if (!has_dot && !has_x) return has_dot = true;
                return false;
            }
            return is_alphanumeric_char(ch);
        });
        if (prefix) num = prefix + num;
        var valid = parse_js_number(num);
        return token("num", num);
    }
    
    function read_escaped_char() {
        var ch = next(true);
        switch (ch) {
        case "n":
            return "\n";
        case "r":
            return "\r";
        case "t":
            return "\t";
        case "b":
            return "\b";
        case "v":
            return "\u000b";
        case "f":
            return "\f";
        case "0":
            return "\0";
        case "x":
            return String.fromCharCode(hex_bytes(2));
        case "u":
            return String.fromCharCode(hex_bytes(4));
        case "\n":
            return "";
        default:
            return ch;
        }
    }
    
    function hex_bytes(n) {
        var num = 0;
        for (; n > 0; --n) {
            var digit = parseInt(next(true), 16);
            if (isNaN(digit)) parse_error("Invalid hex-character pattern in string");
            num = (num << 4) | digit;
        }
        return num;
    }
    
    function read_string() {
        return with_eof_error("Unterminated string constant", function(){
            var quote = next(), ret = "";
            for (;;) {
                var ch = next(true);
                if (ch == "\\") {
                    // read OctalEscapeSequence (XXX: deprecated if "strict mode")
                    // https://github.com/mishoo/UglifyJS/issues/178
                    var octal_len = 0, first = null;
                    ch = read_while(function(ch){
                        if (ch >= "0" && ch <= "7") {
                            if (!first) {
                                first = ch;
                                return ++octal_len;
                            }
                            else if (first <= "3" && octal_len <= 2) return ++octal_len;
                            else if (first >= "4" && octal_len <= 1) return ++octal_len;
                        }
                        return false;
                    });
                    if (octal_len > 0) ch = String.fromCharCode(parseInt(ch, 8));
                    else ch = read_escaped_char();
                }
                else if (ch == quote) break;
                ret += ch;
            }
            return token("string", ret);
        });
    }
    
    function read_line_comment() {
        next();
        var i = find("\n"), ret;
        if (i == -1) {
            ret = S.text.substr(S.pos);
            S.pos = S.text.length;
        } else {
            ret = S.text.substring(S.pos, i);
            S.pos = i;
        }
        return token("comment1", ret, true);
    }
    
    function read_multiline_comment() {
        next();
        return with_eof_error("Unterminated multiline comment", function() {
            var i = find("*/", true),
                text = S.text.substring(S.pos, i),
                tok = token("comment2", text, true);
            S.pos = i + 2;
            S.line += text.split("\n").length - 1;
            S.newline_before = text.indexOf("\n") >= 0;
            // https://github.com/mishoo/UglifyJS/issues/#issue/100
            if (/^@cc_on/i.test(text)) {
                warn("WARNING: at line " + S.line);
                warn("*** Found \"conditional comment\": " + text);
                warn("*** UglifyJS DISCARDS ALL COMMENTS.  This means your code might no longer work properly in Internet Explorer.");
            }
            return tok;
        });
    }
    
    function read_name() {
        var backslash = false,
            name = "",
            ch;
        while ((ch = peek()) != null) {
            if (!backslash) {
                if (ch == "\\") backslash = true, next();
                else if (is_identifier_char(ch)) name += next();
                else break;
            }
            else {
                if (ch != "u") parse_error("Expecting UnicodeEscapeSequence -- uXXXX");
                ch = read_escaped_char();
                if (!is_identifier_char(ch)) parse_error("Unicode char: " + ch.charCodeAt(0) + " is not valid in identifier");
                name += ch;
                backslash = false;
            }
        }
        return name;
    }
    
    function read_regexp(regexp) {
        return with_eof_error("Unterminated regular expression", function() {
            var prev_backslash = false,
                ch, in_class = false;
            while ((ch = next(true))) if (prev_backslash) {
                regexp += "\\" + ch;
                prev_backslash = false;
            }
            else if (ch == "[") {
                in_class = true;
                regexp += ch;
            }
            else if (ch == "]" && in_class) {
                in_class = false;
                regexp += ch;
            }
            else if (ch == "/" && !in_class) {
                break;
            }
            else if (ch == "\\") {
                prev_backslash = true;
            }
            else {
                regexp += ch;
            }
            var mods = read_name();
            return token("regexp", [regexp, mods]);
        });
    }
    
    function read_operator(prefix) {
        function grow(op) {
            if (!peek()) return op;
            var bigger = op + peek();
            if (HOP(OPERATORS, bigger)) {
                next();
                return grow(bigger);
            }
            else {
                return op;
            }
        };
        return token("operator", grow(prefix || next()));
    }
    
    function handle_slash() {
        next();
        var regex_allowed = S.regex_allowed;
        switch (peek()) {
        case "/":
            S.comments_before.push(read_line_comment());
            S.regex_allowed = regex_allowed;
            return next_token();
        case "*":
            S.comments_before.push(read_multiline_comment());
            S.regex_allowed = regex_allowed;
            return next_token();
        }
        return S.regex_allowed ? read_regexp("") : read_operator("/");
    }
    
    function handle_dot() {
        next();
        return is_digit(peek()) ? read_num(".") : token("punc", ".");
    }
    
    function read_word() {
        var word = read_name();
        return !HOP(KEYWORDS, word)
                ? token("name", word)
                : HOP(OPERATORS, word)
                ? token("operator", word)
                : HOP(KEYWORDS_ATOM, word)
                ? token("atom", word)
                : token("keyword", word);
    };
    
    function with_eof_error(eof_error, cont) {
        try {
            return cont();
        }
        catch (ex) {
            if (ex === EX_EOF) parse_error(eof_error);
            else throw ex;
        }
    }
    
    function next_token(force_regexp) {
        if (force_regexp != null) return read_regexp(force_regexp);
        skip_whitespace();
        start_token();
        var ch = peek();
        if (!ch) return token("eof");
        if (is_digit(ch)) return read_num();
        if (ch == '"' || ch == "'") return read_string();
        if (HOP(PUNC_CHARS, ch)) return token("punc", next());
        if (ch == ".") return handle_dot();
        if (ch == "/") return handle_slash();
        if (HOP(OPERATOR_CHARS, ch)) return read_operator();
        if (ch == "\\" || is_identifier_start(ch)) return read_word();
        parse_error("Unexpected character '" + ch + "'");
    }
    
    next_token.context = function(nc) {
        if (nc) S = nc;
        return S;
    };
    
    return next_token;
}

/* -----[ Parser (constants) ]----- */

var UNARY_PREFIX = array_to_hash([
        "typeof",
        "void",
        "delete",
        "--",
        "++",
        "!",
        "~",
        "-",
        "+"
]);

var UNARY_POSTFIX = array_to_hash([ "--", "++" ]);

var ASSIGNMENT = (function(a, ret, i) {
    while (i < a.length) {
        ret[a[i]] = a[i].substr(0, a[i].length - 1);
        i++;
    }
    return ret;
})(["+=", "-=", "/=", "*=", "%=", ">>=", "<<=", ">>>=", "|=", "^=", "&="], {
    "=": true
}, 0);

var PRECEDENCE = (function(a, ret) {
    for (var i = 0, n = 1; i < a.length; ++i, ++n) {
        var b = a[i];
        for (var j = 0; j < b.length; ++j) {
            ret[b[j]] = n;
        }
    }
    return ret;
})([
    ["||"],
    ["&&"],
    ["|"],
    ["^"],
    ["&"],
    ["==", "===", "!=", "!=="],
    ["<", ">", "<=", ">=", "in", "instanceof"],
    [">>", "<<", ">>>"],
    ["+", "-"],
    ["*", "/", "%"]
], {});

var STATEMENTS_WITH_LABELS = array_to_hash([ "for", "do", "while", "switch" ]);
var ATOMIC_START_TOKEN = array_to_hash([ "atom", "num", "string", "regexp", "name" ]);

/* -----[ Parser ]----- */

function NodeWithToken(str, start, end) {
    this.name = str;
    this.start = start;
    this.end = end;
}

NodeWithToken.prototype.toString = function() {
    return this.name;
};

function parse($TEXT, exigent_mode, embed_tokens) {
    var S = {
        input       : typeof $TEXT == "string" ? tokenizer($TEXT, true) : $TEXT,
        token       : null,
        prev        : null,
        peeked      : null,
        in_function : 0,
        in_loop     : 0,
        labels      : [],
        line        : 0,
        col         : 0,
        error       : null
    };

    S.token = next();

    function is(type, value) {
        return is_token(S.token, type, value);
    }

    function peek() {
        return S.peeked || (S.peeked = S.input());
    }
    
    function register_error(message, token) {
        if (!token)
            token = S.token;
        if(!S.error)
            S.error = {line: token.line, col: token.col, message: message};
    }
    
    function next() {
        S.prev = S.token;
        var context = S.input.context();
        S.line = context.line;
        S.col = context.col;
        if (S.peeked) {
            S.token = S.peeked;
            S.peeked = null;
        }
        else {
            S.token = S.input();
        }
        return S.token;
    }
    
    function prev() {
        return S.prev;
    }
    
    function croak(msg, line, col, pos) {
        var ctx = S.input.context();
        js_error(msg,
                 line != null ? line : ctx.tokline,
                 col != null ? col : ctx.tokcol,
                 pos != null ? pos : ctx.tokpos);
    }

    function token_error(token, msg) {
        // RECOVERY
        register_error(msg, token);
        // croak(msg, token.line, token.col);
    }

    function unexpected(token) {
        // RECOVERY
        if (token == null)
            token = S.token;
        register_error("Unexpected token: " + token.type + " (" + token.value + ")", token);
        /*if (token == null)
            token = S.token;
        token_error(token, "Unexpected token: " + token.type + " (" + token.value + ")");*/
    }

    function expect_token(type, val) {
        if (is(type, val)) {
            return next();
        }
        register_error("Unexpected token " + S.token.type + ", expected " + type, S.token);
    }
    
    function expect(punc) {
        // RECOVER
        if(is("punc", punc))
           return next();
        
        register_error("Expected: " + punc);
        // return expect_token("punc", punc);
    }

    function can_insert_semicolon() {
        return !exigent_mode && (S.token.nlb || is("eof") || is("punc", "}"));
    }
    
    function semicolon() {
        // RECOVER
        if (is("punc", ";")) 
            next();
        else if (!can_insert_semicolon())
            register_error("Semicolon expected");
    }

    function as() {
       return slice(arguments);
    }

    function parenthesised() {
        if(!is("punc", "(")) {
            // RECOVER
            register_error("Expected: (");
            return as("ERROR");
        }
        expect("(");
        var ex = expression();
        expect(")");
        return ex;
    }

    function add_tokens(str, start, end) {
        return str instanceof NodeWithToken ? str : new NodeWithToken(str, start, end);
    }

    function maybe_embed_tokens(parser) {
        if (embed_tokens) return function() {
            var start = S.token;
            var ast = parser.apply(this, arguments);
            if (!ast) {
                register_error("Parse error");
                return ["ERROR"];
            }
            ast[0] = add_tokens(ast[0], start, prev());
            return ast;
        };
        else return parser;
    }
    
    var statement = maybe_embed_tokens(function() {
        if (is("operator", "/") || is("operator", "/=")) {
            S.peeked = null;
            S.token = S.input(S.token.value.substr(1)); // force regexp
        }
        switch (S.token.type) {
        case "num":
        case "string":
        case "regexp":
        case "operator":
        case "atom":
            return simple_statement();

        case "name":
            return is_token(peek(), "punc", ":")
                    ? labeled_statement(prog1(S.token.value, next, next))
                    : simple_statement();

        case "punc":
            switch (S.token.value) {
            case "{":
                return as("block", block_());
            case "[":
            case "(":
                return simple_statement();
            case ";":
                next();
                return as("block");
            default:
                // RECOVER
                next();
                register_error("Bracket expected.");
                return as("ERROR");
                //unexpected();
            }

        case "keyword":
            switch (prog1(S.token.value, next)) {
            case "break":
                return break_cont("break");

            case "continue":
                return break_cont("continue");

            case "debugger":
                semicolon();
                return as("debugger");

            case "do":
                return (function(body) {
                    // RECOVER
                    if (is("keyword", "while")) {
                        expect_token("keyword", "while");
                        return as("do", prog1(parenthesised, semicolon), body);
                    }
                    else {
                        register_error("Invalid do statement.");
                        return as("do", as("ERROR"), as("ERROR"));
                    }
                })(in_loop(statement));
            case "for":
                return for_();

            case "function":
                return function_(true);

            case "if":
                return if_();

            case "return":
                // RECOVERY
                if (S.in_function == 0)
                    register_error("'return' outside of function");
                return as("return",
                          is("punc", ";")
                          ? (next(), null)
                          : can_insert_semicolon()
                          ? null
                          : prog1(expression, semicolon));

            case "switch":
                return as("switch", parenthesised(), switch_block_());

            case "throw":
                if (S.token.nlb)
                    croak("Illegal newline after 'throw'");
                return as("throw", prog1(expression, semicolon));

            case "try":
                return try_();

            case "var":
                return prog1(var_, semicolon);
                
            case "let":
                return prog1(let_, semicolon);

            case "const":
                return prog1(const_, semicolon);

            case "while":
                return as("while", parenthesised(), in_loop(statement));

            case "with":
                return as("with", parenthesised(), statement());

            default:
                unexpected();
            }
        }
    });

    function labeled_statement(label) {
        S.labels.push(label);
        var start = S.token,
            stat = statement();
        if (exigent_mode && !HOP(STATEMENTS_WITH_LABELS, stat[0])) unexpected(start);
        S.labels.pop();
        return as("label", label, stat);
    }
    
    function simple_statement() {
        return as("stat", prog1(expression, semicolon));
    }
    
    function break_cont(type) {
        var name;
        if (!can_insert_semicolon()) {
            name = is("name") ? S.token.value : null;
        }
        if (name != null) {
            next();
            if (!member(name, S.labels)) croak("Label " + name + " without matching loop or statement");
        }
        else if (S.in_loop == 0) croak(type + " not inside a loop or switch");
        semicolon();
        return as(type, name);
    }

    function for_() {
        // RECOVER
        if(!is("punc", "(")) {
            register_error("Expected: (");
            return as("for", as("ERROR"), as("ERROR"), as("ERROR"), as("ERROR"));
        } else {
            expect("(");
            var init = null;
            if (!is("punc", ";")) {
                if(is("keyword", "var"))
                    init = (next(), var_(true));
                else if(is("keyword", "let"))
                    init = (next(), let_(true));
                else
                    init = expression(true, true);
                if (is("operator", "in"))
                        return for_in(init);
            }
            return regular_for(init);
        }
    }

    function regular_for(init) {
        expect(";");
        var test = is("punc", ";") ? null : expression();
        // RECOVER
        if(is("punc", ";")) {
            expect(";");
            var step = is("punc", ")") ? null : expression();
            expect(")");
        }
        else {
            register_error("Expected: ;");
        }
        return as("for", init, test, step, in_loop(statement));
    };

    function for_in(init) {
        var lhs;
        if(init[0] == "var")
            lhs = as("name", init[1][0]);
        else if(init[0] == "let")
            lhs = as("name", init[1][0]);
        else
            lhs = init;
        next();
        var obj = expression();
        expect(")");
        return as("for-in", init, lhs, obj, in_loop(statement));
    }

    var function_ = maybe_embed_tokens(function(in_statement) {
        var prev = S.token;
        var name = is("name") ? prog1(S.token.value, next) : null;
        name = add_tokens(name, prev, S.token);
        if (in_statement && !name) {
            // RECOVER
            register_error("Invalid function definition");
            return as("function", "", [], []);
        }
        expect("(");
        return as(in_statement ? "defun" : "function", name,
        // arguments
        (function(first, a) {
            while (!is("punc", ")") && !is("eof")) {
                if (first) first = false;
                else expect(",");
                if (!is("name")) unexpected();
                a.push(add_tokens(S.token.value, S.token));
                next();
            }
            next();
            return a;
        })(true, []),
        // body
        (function() {
            ++S.in_function;
            var loop = S.in_loop;
            S.in_loop = 0;
            var a = block_();
            --S.in_function;
            S.in_loop = loop;
            return a;
        })());
    });
    
    function if_() {
        var cond = parenthesised(),
            body = statement(),
            belse;
        if (is("keyword", "else")) {
            next();
            belse = statement();
        }
        return as("if", cond, body, belse);
    };
    
    function block_() {
        expect("{");
        var a = [];
        while (!is("punc", "}")) {
            if (is("eof")) {
                // RECOVERY
                //unexpected();
                return a;
            }
            a.push(statement());
        }
        next();
        return a;
    };
    
    var switch_block_ = curry(in_loop, function() {
        // RECOVER
        if (is("punc", "{")) expect("{");
        var a = [],
            cur = null;
        while (!is("punc", "}")) {
            if (is("eof")) {
                // RECOVER
                break;
                //unexpected();
            }
            if (is("keyword", "case")) {
                next();
                cur = [];
                a.push([expression(), cur]);
                expect(":");
            }
            else if (is("keyword", "default")) {
                next();
                expect(":");
                cur = [];
                a.push([null, cur]);
            }
            else {
                if (!cur) {
                    // RECOVER
                    //unexpected();
                    return a;
                }
                cur.push(statement());
            }
        }
        next();
        return a;
    });
    
    function try_() {
        var body = block_(),
            bcatch, bfinally;
        if (is("keyword", "catch")) {
            next();
            expect("(");
            if (!is("name")) croak("Name expected");
            var name = S.token.value;
            next();
            expect(")");
            bcatch = [name, block_()];
        }
        if (is("keyword", "finally")) {
            next();
            bfinally = block_();
        }
        if (!bcatch && !bfinally) croak("Missing catch/finally blocks");
        return as("try", body, bcatch, bfinally);
    }
    
    function vardefs(no_in) {
        var a = [];
        for (;;) {
            if (!is("name")) unexpected();
            var prev = S.token;
            var name = S.token.value;
            next();
            name = add_tokens(name, prev, S.token);
            if (is("operator", "=")) {
                next();
                a.push([name, expression(false, no_in)]);
            }
            else {
                a.push([name]);
            }
            if (!is("punc", ",")) break;
            next();
        }
        return a;
    }
    
    function var_(no_in) {
        return as("var", vardefs(no_in));
    }
    
    function let_(no_in) {
        return as("let", vardefs(no_in));
    }
    
    function const_() {
        return as("const", vardefs());
    }
    
    function new_() {
        var newexp = expr_atom(false),
            args;
        if (is("punc", "(")) {
            next();
            args = expr_list(")");
        }
        else {
            args = [];
        }
        return subscripts(as("new", newexp, args), true);
    }
    
    var expr_atom = maybe_embed_tokens(function(allow_calls) {
        if (is("operator", "new")) {
            next();
            return new_();
        }
        if (is("punc")) {
            switch (S.token.value) {
            case "(":
                next();
                return subscripts(prog1(expression, function() {
                    // RECOVER
                    // curry(expect, ")")
                    expect(")");
                }), allow_calls);
            case "[":
                next();
                return subscripts(array_(), allow_calls);
            case "{":
                next();
                return subscripts(object_(), allow_calls);
            }
            // RECOVER
            register_error("Bracket expected.");
            return as("ERROR");
            //unexpected();
        }
        if (is("keyword", "function")) {
            next();
            return subscripts(function_(false), allow_calls);
        }
        if (HOP(ATOMIC_START_TOKEN, S.token.type)) {
            var atom = S.token.type == "regexp"
                    ? as("regexp", S.token.value[0], S.token.value[1])
                    : as(S.token.type, S.token.value);
            return subscripts(prog1(atom, next), allow_calls);
        }
        unexpected();
    });

    function expr_list(closing, allow_trailing_comma, allow_empty) {
        var first = true,
            a = [];
        while (!is("punc", closing) && !is("eof")) {
            if (first) first = false;
            else expect(",");
            if (allow_trailing_comma && is("punc", closing)) break;
            if (is("punc", ",") && allow_empty) {
                a.push(["atom", "undefined"]);
            }
            else {
                a.push(expression(false));
            }
        }
        next();
        return a;
    }
    
    function array_() {
        return as("array", expr_list("]", !exigent_mode, true));
    }
    
    function object_() {
        var first = true,
            a = [];
        while (!is("punc", "}") && !is("eof")) {
            if (first) first = false;
            else expect(",");
            if (!exigent_mode && is("punc", "}"))
                // allow trailing comma
                break;
            var type = S.token.type;
            
            var name = as_property_name();
            if (type == "name" && (name == "get" || name == "set") && !is("punc", ":")) {
                a.push([as_name(), function_(false), name]);
            }
            else {
                expect(":");
                a.push([name, expression(false)]);
            }
        }
        next();
        return as("object", a);
    }
    
    function as_property_name() {
        switch (S.token.type) {
        case "num":
        case "string":
            return prog1(S.token.value, next);
        }
        return as_name();
    };
    
    function as_name() {
        switch (S.token.type) {
        case "name":
        case "operator":
        case "keyword":
        case "atom":
            return prog1(S.token.value, next);
        default:
            //unexpected();
            // RECOVER: Return empty token
            register_error("Name, operator, keyword or atom expected.");
            return ""; // prog1("", next);
        }
    };
    
    function insert_token(ast, prev) {
        ast[0] = add_tokens(ast[0], prev, S.token);
        return ast;
    }
    
    function subscripts(expr, allow_calls) {
        var p = S.prev;
        if(!(expr[0] instanceof NodeWithToken)) {
            expr = insert_token(expr, p);
        }
        if (is("punc", ".")) {
            next();
            return subscripts(insert_token(as("dot", expr, as_name()), p), allow_calls);
        }
        if (is("punc", "[")) {
            next();
            return subscripts(as("sub", expr, prog1(expression, curry(expect, "]"))), allow_calls);
        }
        if (allow_calls && is("punc", "(")) {
            next();
            return subscripts(as("call", expr, expr_list(")")), true);
        }
        return expr;
    }
    
    function maybe_unary(allow_calls) {
        if (is("operator") && HOP(UNARY_PREFIX, S.token.value)) {
            return make_unary("unary-prefix", prog1(S.token.value, next), maybe_unary(allow_calls));
        }
        var val = expr_atom(allow_calls);
        while (is("operator") && HOP(UNARY_POSTFIX, S.token.value) && !S.token.nlb) {
            val = make_unary("unary-postfix", S.token.value, val);
            next();
        }
        return val;
    }
    
    function make_unary(tag, op, expr) {
        if ((op == "++" || op == "--") && !is_assignable(expr)) croak("Invalid use of " + op + " operator");
        return as(tag, op, expr);
    }
    
    function expr_op(left, min_prec, no_in) {
        var op = is("operator") ? S.token.value : null;
        if (op && op == "in" && no_in) op = null;
        var prec = op != null ? PRECEDENCE[op] : null;
        if (prec != null && prec > min_prec) {
            next();
            var right = expr_op(maybe_unary(true), prec, no_in);
            return expr_op(as("binary", op, left, right), min_prec, no_in);
        }
        return left;
    }
    
    function expr_ops(no_in) {
        return expr_op(maybe_unary(true), 0, no_in);
    }
    
    function maybe_conditional(no_in) {
        var expr = expr_ops(no_in);
        if (is("operator", "?")) {
            next();
            var yes = expression(false);
            expect(":");
            return as("conditional", expr, yes, expression(false, no_in));
        }
        return expr;
    }
    
    function is_assignable(expr) {
        if (!exigent_mode) return true;
        switch (expr[0] + "") {
        case "dot":
        case "sub":
        case "new":
        case "call":
            return true;
        case "name":
            return expr[1] != "this";
        }
    }
    
    function maybe_assign(no_in) {
        var left = maybe_conditional(no_in),
            val = S.token.value;
        if (is("operator") && HOP(ASSIGNMENT, val)) {
            if (is_assignable(left)) {
                next();
                return as("assign", ASSIGNMENT[val], left, maybe_assign(no_in));
            }
            croak("Invalid assignment");
        }
        return left;
    }
    
    var expression = maybe_embed_tokens(function(commas, no_in) {
        if (arguments.length == 0) commas = true;
        // RECOVER: prevent infinite loops
        var oldLine = S.line;
        var oldCol = S.col;
        //
        var expr = maybe_assign(no_in);
        if (commas && is("punc", ",")) {
            next();
            return as("seq", expr, expression(true, no_in));
        }
        if(S.col === oldCol && S.line === oldLine) {
            // RECOVER: Preventing infinite loops here
            next();
        }
        return expr;
    });
    
    function in_loop(cont) {
        try {
            ++S.in_loop;
            return cont();
        }
        finally {
            --S.in_loop;
        }
    }
    
    return {
        ast: as("toplevel", (function(a) {
            while (!is("eof"))
            a.push(statement());
            return a;
        })([])),
        error: S.error
    };
};

/* -----[ Utilities ]----- */

function curry(f) {
    var args = slice(arguments, 1);
    return function() {
        return f.apply(this, args.concat(slice(arguments)));
    };
}

function prog1(ret) {
    if (ret instanceof Function) ret = ret();
    for (var i = 1, n = arguments.length; --n > 0; ++i)
    arguments[i]();
    return ret;
}

function array_to_hash(a) {
    var ret = {};
    for (var i = 0; i < a.length; ++i)
    ret[a[i]] = true;
    return ret;
}

function slice(a, start) {
    return Array.prototype.slice.call(a, start || 0);
}

function characters(str) {
    return str.split("");
}

function member(name, array) {
    for (var i = array.length; --i >= 0;)
    if (array[i] === name) return true;
    return false;
}

function HOP(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

var warn = function() {};

/* -----[ Exports ]----- */

exports.tokenizer = tokenizer;
exports.parse = parse;
exports.slice = slice;
exports.curry = curry;
exports.member = member;
exports.array_to_hash = array_to_hash;
exports.PRECEDENCE = PRECEDENCE;
exports.KEYWORDS_ATOM = KEYWORDS_ATOM;
exports.RESERVED_WORDS = RESERVED_WORDS;
exports.KEYWORDS = KEYWORDS;
exports.ATOMIC_START_TOKEN = ATOMIC_START_TOKEN;
exports.OPERATORS = OPERATORS;
exports.is_alphanumeric_char = is_alphanumeric_char;
exports.set_logger = function(logger) {
    warn = logger;
};

});/**
 * JavaScript scope analysis module and warning reporter.
 * 
 * This handler does a couple of things:
 * 1. It does scope analysis and attaches a scope object to every variable, variable declaration and function declaration
 * 2. It creates markers for undeclared variables
 * 3. It creates markers for unused variables
 * 4. It implements the local variable refactoring
 * 
 * @depend ext/jslanguage/parse
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define('ext/jslanguage/scope_analyzer', ['require', 'exports', 'module' , 'ext/language/base_handler', 'treehugger/traverse'], function(require, exports, module) {
var baseLanguageHandler = require('ext/language/base_handler');
require('treehugger/traverse');
var handler = module.exports = Object.create(baseLanguageHandler);

// Based on https://github.com/jshint/jshint/blob/master/jshint.js#L331
var GLOBALS = {
    // Literals
    "true"                   : true,
    "false"                  : true,
    "undefined"              : true,
    "null"                   : true,
    "this"                   : true,
    "arguments"              : true,
    // Browser
    ArrayBuffer              :  true,
    ArrayBufferView          :  true,
    Audio                    :  true,
    addEventListener         :  true,
    applicationCache         :  true,
    blur                     :  true,
    clearInterval            :  true,
    clearTimeout             :  true,
    close                    :  true,
    closed                   :  true,
    DataView                 :  true,
    defaultStatus            :  true,
    document                 :  true,
    event                    :  true,
    FileReader               :  true,
    Float32Array             :  true,
    Float64Array             :  true,
    FormData                 :  true,
    getComputedStyle         :  true,
    HTMLElement              :  true,
    HTMLAnchorElement        :  true,
    HTMLBaseElement          :  true,
    HTMLBlockquoteElement    :  true,
    HTMLBodyElement          :  true,
    HTMLBRElement            :  true,
    HTMLButtonElement        :  true,
    HTMLCanvasElement        :  true,
    HTMLDirectoryElement     :  true,
    HTMLDivElement           :  true,
    HTMLDListElement         :  true,
    HTMLFieldSetElement      :  true,
    HTMLFontElement          :  true,
    HTMLFormElement          :  true,
    HTMLFrameElement         :  true,
    HTMLFrameSetElement      :  true,
    HTMLHeadElement          :  true,
    HTMLHeadingElement       :  true,
    HTMLHRElement            :  true,
    HTMLHtmlElement          :  true,
    HTMLIFrameElement        :  true,
    HTMLImageElement         :  true,
    HTMLInputElement         :  true,
    HTMLIsIndexElement       :  true,
    HTMLLabelElement         :  true,
    HTMLLayerElement         :  true,
    HTMLLegendElement        :  true,
    HTMLLIElement            :  true,
    HTMLLinkElement          :  true,
    HTMLMapElement           :  true,
    HTMLMenuElement          :  true,
    HTMLMetaElement          :  true,
    HTMLModElement           :  true,
    HTMLObjectElement        :  true,
    HTMLOListElement         :  true,
    HTMLOptGroupElement      :  true,
    HTMLOptionElement        :  true,
    HTMLParagraphElement     :  true,
    HTMLParamElement         :  true,
    HTMLPreElement           :  true,
    HTMLQuoteElement         :  true,
    HTMLScriptElement        :  true,
    HTMLSelectElement        :  true,
    HTMLStyleElement         :  true,
    HTMLTableCaptionElement  :  true,
    HTMLTableCellElement     :  true,
    HTMLTableColElement      :  true,
    HTMLTableElement         :  true,
    HTMLTableRowElement      :  true,
    HTMLTableSectionElement  :  true,
    HTMLTextAreaElement      :  true,
    HTMLTitleElement         :  true,
    HTMLUListElement         :  true,
    HTMLVideoElement         :  true,
    Int16Array               :  true,
    Int32Array               :  true,
    Int8Array                :  true,
    Image                    :  true,
    localStorage             :  true,
    location                 :  true,
    navigator                :  true,
    open                     :  true,
    openDatabase             :  true,
    Option                   :  true,
    parent                   :  true,
    print                    :  true,
    removeEventListener      :  true,
    resizeBy                 :  true,
    resizeTo                 :  true,
    screen                   :  true,
    scroll                   :  true,
    scrollBy                 :  true,
    scrollTo                 :  true,
    sessionStorage           :  true,
    setInterval              :  true,
    setTimeout               :  true,
    SharedWorker             :  true,
    Uint16Array              :  true,
    Uint32Array              :  true,
    Uint8Array               :  true,
    WebSocket                :  true,
    window                   :  true,
    Worker                   :  true,
    XMLHttpRequest           :  true,
    XPathEvaluator           :  true,
    XPathException           :  true,
    XPathExpression          :  true,
    XPathNamespace           :  true,
    XPathNSResolver          :  true,
    XPathResult              :  true,
    // Devel
    alert                    : true,
    confirm                  : true,
    console                  : true,
    Debug                    : true,
    opera                    : true,
    prompt                   : true,
    // Frameworks
    jQuery                   : true,
    "$"                      : true,
    "$$"                     : true,
    goog                     : true,
    dojo                     : true,
    dojox                    : true,
    dijit                    : true,
    apf                      : true,
    // mootools
    Assets                   : true,
    Browser                  : true,
    Chain                    : true,
    Class                    : true,
    Color                    : true,
    Cookie                   : true,
    Core                     : true,
    Document                 : true,
    DomReady                 : true,
    DOMReady                 : true,
    Drag                     : true,
    Element                  : true,
    Elements                 : true,
    Event                    : true,
    Events                   : true,
    Fx                       : true,
    Group                    : true,
    Hash                     : true,
    HtmlTable                : true,
    Iframe                   : true,
    IframeShim               : true,
    InputValidator           : true,
    instanceOf               : true,
    Keyboard                 : true,
    Locale                   : true,
    Mask                     : true,
    MooTools                 : true,
    Native                   : true,
    Options                  : true,
    OverText                 : true,
    Request                  : true,
    Scroller                 : true,
    Slick                    : true,
    Slider                   : true,
    Sortables                : true,
    Spinner                  : true,
    Swiff                    : true,
    Tips                     : true,
    Type                     : true,
    typeOf                   : true,
    URI                      : true,
    Window                   : true,
    // prototype.js
    '$A'                     : true,
    '$F'                     : true,
    '$H'                     : true,
    '$R'                     : true,
    '$break'                 : true,
    '$continue'              : true,
    '$w'                     : true,
    Abstract                 : true,
    Ajax                     : true,
    Enumerable               : true,
    Field                    : true,
    Form                     : true,
    Insertion                : true,
    ObjectRange              : true,
    PeriodicalExecuter       : true,
    Position                 : true,
    Prototype                : true,
    Selector                 : true,
    Template                 : true,
    Toggle                   : true,
    Try                      : true,
    Autocompleter            : true,
    Builder                  : true,
    Control                  : true,
    Draggable                : true,
    Draggables               : true,
    Droppables               : true,
    Effect                   : true,
    Sortable                 : true,
    SortableObserver         : true,
    Sound                    : true,
    Scriptaculous            : true,
    // require.js
    define                   : true,
    // node.js
    __filename               : true,
    __dirname                : true,
    Buffer                   : true,
    exports                  : true,
    GLOBAL                   : true,
    global                   : true,
    module                   : true,
    process                  : true,
    require                  : true,
    // Standard
    Array                    : true,
    Boolean                  : true,
    Date                     : true,
    decodeURI                : true,
    decodeURIComponent       : true,
    encodeURI                : true,
    encodeURIComponent       : true,
    Error                    : true,
    'eval'                   : true,
    EvalError                : true,
    Function                 : true,
    hasOwnProperty           : true,
    isFinite                 : true,
    isNaN                    : true,
    JSON                     : true,
    Math                     : true,
    Number                   : true,
    Object                   : true,
    parseInt                 : true,
    parseFloat               : true,
    RangeError               : true,
    ReferenceError           : true,
    RegExp                   : true,
    String                   : true,
    SyntaxError              : true,
    TypeError                : true,
    URIError                 : true,
    // non-standard
    escape                   : true,
    unescape                 : true
};

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

function Variable(declaration) {
    this.declarations = [];
    if(declaration)
        this.declarations.push(declaration);
    this.uses = [];
}

Variable.prototype.addUse = function(node) {
    this.uses.push(node);
};

Variable.prototype.addDeclaration = function(node) {
    this.declarations.push(node);
};

handler.analyze = function(doc, ast) {
    var handler = this;
    var markers = [];
    
    // Preclare variables (pre-declares, yo!)
    function preDeclareHoisted(scope, node) {
        node.traverseTopDown(
            // var bla;
            'VarDecl(x)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(!scope.hasOwnProperty(b.x.value))
                    scope[b.x.value] = new Variable(b.x);
                else
                    scope[b.x.value].addDeclaration(b.x);
                return node;
            },
            // var bla = 10;
            'VarDeclInit(x, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(!scope.hasOwnProperty(b.x.value))
                    scope[b.x.value] = new Variable(b.x);
                else
                    scope[b.x.value].addDeclaration(b.x);
                return node;
            },
            // function bla(farg) { }
            'Function(x, _, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(b.x.value) {
                    scope[b.x.value] = new Variable(b.x);
                }
                return node;
            }
        );
    }
    
    function scopeAnalyzer(scope, node, parentLocalVars) {
        preDeclareHoisted(scope, node);
        var localVariables = parentLocalVars || [];
        function analyze(scope, node) {
            node.traverseTopDown(
                'VarDecl(x)', function(b) {
                    localVariables.push(scope[b.x.value]);
                },
                'VarDeclInit(x, _)', function(b) {
                    localVariables.push(scope[b.x.value]);
                },
                'Assign(Var(x), e)', function(b, node) {
                    if(!scope[b.x.value]) {
                        markers.push({
                            pos: node[0].getPos(),
                            type: 'warning',
                            message: 'Assigning to undeclared variable.'
                        });
                    }
                    else {
                        scope[b.x.value].addUse(node[0]);
                    }
                    analyze(scope, b.e);
                    return this;
                },
                'ForIn(Var(x), e, stats)', function(b, node) {
                    if(!scope[b.x.value]) {
                        markers.push({
                            pos: node[0].getPos(),
                            type: 'warning',
                            message: 'Using undeclared variable as iterator variable.'
                        });
                    }
                    else {
                        scope[b.x.value].addUse(node);
                    }
                    analyze(scope, b.e);
                    analyze(scope, b.stats);
                    return this;
                },
                'Var(x)', function(b, node) {
                    node.setAnnotation("scope", scope);
                    if(scope[b.x.value]) {
                        scope[b.x.value].addUse(node);
                    } else if(handler.isFeatureEnabled("undeclaredVars") && !GLOBALS[b.x.value]) {
                        markers.push({
                            pos: this.getPos(),
                            type: 'warning',
                            message: "Undeclared variable."
                        });
                    }
                    return node;
                },
                'Function(x, fargs, body)', function(b, node) {
                    node.setAnnotation("scope", scope);

                    var newScope = Object.create(scope);
                    newScope['this'] = new Variable();
                    b.fargs.forEach(function(farg) {
                        farg.setAnnotation("scope", newScope);
                        newScope[farg[0].value] = new Variable(farg);
                        if (handler.isFeatureEnabled("unusedFunctionArgs"))
                            localVariables.push(newScope[farg[0].value]);
                    });
                    scopeAnalyzer(newScope, b.body);
                    return node;
                },
                'Catch(x, body)', function(b, node) {
                    var oldVar = scope[b.x.value];
                    // Temporarily override
                    scope[b.x.value] = new Variable(b.x);
                    scopeAnalyzer(scope, b.body, localVariables);
                    // Put back
                    scope[b.x.value] = oldVar;
                    return node;
                },
                'PropAccess(_, "lenght")', function(b, node) {
                    markers.push({
                        pos: node.getPos(),
                        type: 'warning',
                        message: "Did you mean 'length'?"
                    });
                },
                'Call(Var("parseInt"), [_])', function() {
                    markers.push({
                        pos: this[0].getPos(),
                        type: 'warning',
                        message: "Missing radix argument."
                    });
                }
            );
        }
        analyze(scope, node);
        if(!parentLocalVars) {
            for (var i = 0; i < localVariables.length; i++) {
                if (localVariables[i].uses.length === 0) {
                    var v = localVariables[i];
                    v.declarations.forEach(function(decl) {
                        markers.push({
                            pos: decl.getPos(),
                            type: 'unused',
                            message: 'Unused variable.'
                        });
                    });
                }
            }
        }
    }
    scopeAnalyzer({}, ast);
    return markers;
};

handler.onCursorMovedNode = function(doc, fullAst, cursorPos, currentNode) {
    if (!currentNode)
        return;
    var markers = [];
    var enableRefactorings = [];
    
    function highlightVariable(v) {
        if (!v)
            return;
        v.declarations.forEach(function(decl) {    
            if(decl.getPos())    
                markers.push({
                    pos: decl.getPos(),
                    type: 'occurrence_main'
                });
        });    
        v.uses.forEach(function(node) {
            markers.push({
                pos: node.getPos(),
                type: 'occurrence_other'
            });
        });
    }
    currentNode.rewrite(
        'Var(x)', function(b) {
            var scope = this.getAnnotation("scope");
            if (!scope)
                return;
            var v = scope[b.x.value];
            highlightVariable(v);
            // Let's not enable renaming 'this' and only rename declared variables
            if(b.x.value !== "this" && v)
                enableRefactorings.push("renameVariable");
        },
        'VarDeclInit(x, _)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'VarDecl(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'FArg(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'Function(x, _, _)', function(b) {
            // Only for named functions
            if(!b.x.value)
                return;
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        }
    );
    
    if (!this.isFeatureEnabled("instanceHighlight"))
        return { enableRefactorings: enableRefactorings };    

    return {
        markers: markers,
        enableRefactorings: enableRefactorings
    };
};

handler.getVariablePositions = function(doc, fullAst, cursorPos, currentNode) {
    var v;
    var mainNode;    
    currentNode.rewrite(
        'VarDeclInit(x, _)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;    
        },
        'VarDecl(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;
        },
        'FArg(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = node;
        },
        'Function(x, _, _)', function(b, node) {
            if(!b.x.value)
                return;
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;
        },
        'Var(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = node;
        }
    );
    var pos = mainNode.getPos();
    var others = [];

    var length = pos.ec - pos.sc;

    v.declarations.forEach(function(node) {
         if(node !== currentNode[0]) {
            var pos = node.getPos();
            others.push({column: pos.sc, row: pos.sl});
        }
    });
    
    v.uses.forEach(function(node) {
        if(node !== currentNode) {
            var pos = node.getPos();
            others.push({column: pos.sc, row: pos.sl});
        }
    });
    return {
        length: length,
        pos: {
            row: pos.sl,
            column: pos.sc
        },
        others: others
    };
};

});
define('treehugger/traverse', ['require', 'exports', 'module' , 'treehugger/tree'], function(require, exports, module) {

var tree = require('treehugger/tree');

if (!Function.prototype.curry) {
    Function.prototype.curry = function() {
        var fn = this,
            args = Array.prototype.slice.call(arguments);
        return function() {
            return fn.apply(this, args.concat(Array.prototype.slice.call(arguments)));
        };
    };
}

function normalizeArgs(args) {
    if (args.length === 1 && args[0].apply) { // basic, one function, shortcut!
        return args[0];
    }
    args = Array.prototype.slice.call(args, 0);
    if (args[0] && Object.prototype.toString.call(args[0]) === '[object Array]') {
        args = args[0];
    }
    return function() {
        var result;
        for (var i = 0; i < args.length; i++) {
            if (typeof args[i] === 'string') {
                var parsedPattern = tree.parse(args[i]);
                var bindings = parsedPattern.match(this);
                if (bindings) {
                    if (args[i + 1] && args[i + 1].apply) {
                        result = args[i + 1].call(this, bindings, this);
                        i++;
                    }
                    else
                        result = this;
                    if (result)
                        return result;
                }
                else if (args[i + 1] && args[i + 1].apply)
                    i++;
            }
            else if (args[i].apply) {
                result = args[i].call(this);
                if (result)
                    return result;
            }
            else
                throw Error("Invalid argument: ", args[i]);
        }
        return false;
    };
}

exports.traverseAll = function(fn) {
    var result, i;
    fn = normalizeArgs(arguments);
    if (this instanceof tree.ConsNode || this instanceof tree.ListNode) {
        for (i = 0; i < this.length; i++) {
            result = fn.call(this[i]);
            if (!result)
                return false;
        }
    }
    return this;
};

/**
 * Sequential application last argument is term
 */
function seq() {
    var fn;
    var t = this;
    for (var i = 0; i < arguments.length; i++) {
        fn = arguments[i];
        t = fn.call(t);
        if (!t)
            return false;
    }
    return this;
}
// Try
exports.attempt = function(fn) {
    fn = normalizeArgs(arguments);
    var result = fn.call(this);
    return !result ? this : result;
};

exports.debug = function(pretty) {
    console.log(pretty ? this.toPrettyString("") : this.toString());
    return this;
};

// A somewhat optimized version of the "clean" topdown traversal
function traverseTopDown(fn) {
    var result, i;
    result = fn.call(this);
    if(result)
        return result;
    if (this instanceof tree.ConsNode || this instanceof tree.ListNode) {
        for (i = 0; i < this.length; i++) {
            traverseTopDown.call(this[i], fn);
        }
    }
    return this;
}

exports.traverseTopDown = function(fn) {
    fn = normalizeArgs(arguments);
    return traverseTopDown.call(this, fn);
    //exports.rewrite.call(this, fn, exports.traverseAll.curry(exports.traverseTopDown.curry(fn)));
    //return this;
};

/**
 * Traverse up the tree (using parent pointers) and return the first matching node
 * Doesn't only traverse parents, but also upward siblings
 */
exports.traverseUp = function(fn) {
    fn = normalizeArgs(arguments);
    var result = fn.call(this);
    if(result)
        return result;
    if (!this.parent)
        return false;
    return this.parent.traverseUp(fn);
};

exports.collectTopDown = function(fn) {
    fn = normalizeArgs(arguments);
    var results = [];
    this.traverseTopDown(function() {
        var r = fn.call(this);
        if (r) {
            results.push(r);
        }
        return r;
    });
    return tree.list(results);
};

exports.map = function(fn) {
    fn = normalizeArgs(arguments);
    var result, results = [];
    for (var i = 0; i < this.length; i++) {
        result = fn.call(this[i], this[i]);
        if (result) {
            results.push(result);
        }
        else {
            throw Error("Mapping failed: ", this[i]);
        }
    }
    return tree.list(results);
};

exports.each = function(fn) {
    fn = normalizeArgs(arguments);
    for (var i = 0; i < this.length; i++) {
        fn.call(this[i], this[i]);
    }
};

// fn return boolean
exports.filter = function(fn) {
    fn = normalizeArgs(arguments);
    var matching = [];
    this.forEach(function(el) {
        var result = fn.call(el);
        if (result) {
            matching.push(result);
        }
    });
    return tree.list(matching);
};

exports.rewrite = function(fn) {
    fn = normalizeArgs(arguments);
    return fn.call(this);
};

for (var p in exports) {
    if (exports.hasOwnProperty(p)) {
        tree.Node.prototype[p] = exports[p];
    }
}

exports.addParentPointers = function(node) {
    return node.traverseTopDown(function() {
        var that = this;
        this.traverseAll(function() {
            this.parent = that;
            return this;
        });
    });
};

});/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define('ext/jslanguage/narcissus_jshint', ['require', 'exports', 'module' , 'ext/language/base_handler', 'ace/worker/jshint', 'ace/narcissus/jsparse'], function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var lint = require("ace/worker/jshint").JSHINT;
var parser = require("ace/narcissus/jsparse");

var handler = module.exports = Object.create(baseLanguageHandler);

var disabledJSHintWarnings = [/Missing radix parameter./, /Bad for in variable '(.+)'./];

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

handler.analysisRequiresParsing = function() {
    return false;
};

handler.analyze = function(doc) {
    var value = doc.getValue();
    value = value.replace(/^(#!.*\n)/, "//$1");

    var markers = [];
    try {
        parser.parse(value);
    }
    catch (e) {
        var chunks = e.message.split(":");
        var message = chunks.pop().trim();
        var numString = chunks.pop();
        if(numString) {
            var lineNumber = parseInt(numString.trim(), 10) - 1;
            markers = [{
                pos: {
                    sl: lineNumber,
                    el: lineNumber
                },
                message: message,
                type: "error"
            }];
        }
        return markers;
    }
    finally {}
    if (this.isFeatureEnabled("jshint")) {
        lint(value, {
            undef: false,
            onevar: false,
            passfail: false,
            devel: true,
            browser: true,
            node: true
        });
        lint.errors.forEach(function(warning) {
            if (!warning)
                return;
            for (var i = 0; i < disabledJSHintWarnings.length; i++)
                if(disabledJSHintWarnings[i].test(warning.reason))
                    return;
            markers.push({
                pos: {
                    sl: warning.line-1,
                    sc: warning.column-1
                },
                type: 'warning',
                message: warning.reason
            });
        });
    }
    return markers;
};
    
});
define('ace/worker/jshint', ['require', 'exports', 'module' ], function(require, exports, module) {
/*!
 * JSHint, by JSHint Community.
 *
 * Licensed under the same slightly modified MIT license that JSLint is.
 * It stops evil-doers everywhere.
 *
 * JSHint is a derivative work of JSLint:
 *
 *   Copyright (c) 2002 Douglas Crockford  (www.JSLint.com)
 *
 *   Permission is hereby granted, free of charge, to any person obtaining
 *   a copy of this software and associated documentation files (the "Software"),
 *   to deal in the Software without restriction, including without limitation
 *   the rights to use, copy, modify, merge, publish, distribute, sublicense,
 *   and/or sell copies of the Software, and to permit persons to whom
 *   the Software is furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included
 *   in all copies or substantial portions of the Software.
 *
 *   The Software shall be used for Good, not Evil.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 *   FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 *   DEALINGS IN THE SOFTWARE.
 *
 * JSHint was forked from 2010-12-16 edition of JSLint.
 *
 */

/*
 JSHINT is a global function. It takes two parameters.

     var myResult = JSHINT(source, option);

 The first parameter is either a string or an array of strings. If it is a
 string, it will be split on '\n' or '\r'. If it is an array of strings, it
 is assumed that each string represents one line. The source can be a
 JavaScript text or a JSON text.

 The second parameter is an optional object of options which control the
 operation of JSHINT. Most of the options are booleans: They are all
 optional and have a default value of false. One of the options, predef,
 can be an array of names, which will be used to declare global variables,
 or an object whose keys are used as global names, with a boolean value
 that determines if they are assignable.

 If it checks out, JSHINT returns true. Otherwise, it returns false.

 If false, you can inspect JSHINT.errors to find out the problems.
 JSHINT.errors is an array of objects containing these members:

 {
     line      : The line (relative to 0) at which the lint was found
     character : The character (relative to 0) at which the lint was found
     reason    : The problem
     evidence  : The text line in which the problem occurred
     raw       : The raw message before the details were inserted
     a         : The first detail
     b         : The second detail
     c         : The third detail
     d         : The fourth detail
 }

 If a fatal error was found, a null will be the last element of the
 JSHINT.errors array.

 You can request a Function Report, which shows all of the functions
 and the parameters and vars that they use. This can be used to find
 implied global variables and other problems. The report is in HTML and
 can be inserted in an HTML <body>.

     var myReport = JSHINT.report(limited);

 If limited is true, then the report will be limited to only errors.

 You can request a data structure which contains JSHint's results.

     var myData = JSHINT.data();

 It returns a structure with this form:

 {
     errors: [
         {
             line: NUMBER,
             character: NUMBER,
             reason: STRING,
             evidence: STRING
         }
     ],
     functions: [
         name: STRING,
         line: NUMBER,
         last: NUMBER,
         param: [
             STRING
         ],
         closure: [
             STRING
         ],
         var: [
             STRING
         ],
         exception: [
             STRING
         ],
         outer: [
             STRING
         ],
         unused: [
             STRING
         ],
         global: [
             STRING
         ],
         label: [
             STRING
         ]
     ],
     globals: [
         STRING
     ],
     member: {
         STRING: NUMBER
     },
     unuseds: [
         {
             name: STRING,
             line: NUMBER
         }
     ],
     implieds: [
         {
             name: STRING,
             line: NUMBER
         }
     ],
     urls: [
         STRING
     ],
     json: BOOLEAN
 }

 Empty arrays will not be included.

*/

/*jshint
 evil: true, nomen: false, onevar: false, regexp: false, strict: true, boss: true,
 undef: true, maxlen: 100
*/

/*members "\b", "\t", "\n", "\f", "\r", "!=", "!==", "\"", "%", "(begin)",
 "(breakage)", "(context)", "(error)", "(global)", "(identifier)", "(last)",
 "(line)", "(loopage)", "(name)", "(onevar)", "(params)", "(scope)",
 "(statement)", "(verb)", "*", "+", "++", "-", "--", "\/", "<", "<=", "==",
 "===", ">", ">=", $, $$, $A, $F, $H, $R, $break, $continue, $w, Abstract, Ajax,
 __filename, __dirname, ActiveXObject, Array, ArrayBuffer, ArrayBufferView,
 Autocompleter, Assets, Boolean, Builder, Buffer, Browser, COM, CScript, Canvas,
 CustomAnimation, Class, Control, Chain, Color, Cookie, Core, DataView, Date,
 Debug, Draggable, Draggables, Droppables, Document, DomReady, DOMReady, Drag,
 E, Enumerator, Enumerable, Element, Elements, Error, Effect, EvalError, Event,
 Events, FadeAnimation, Field, Flash, Float32Array, Float64Array, Form,
 FormField, Frame, Function, Fx, GetObject, Group, Hash, HotKey, HTMLElement,
 HtmlTable, Iframe, IframeShim, Image, Int16Array, Int32Array, Int8Array,
 Insertion, InputValidator, JSON, Keyboard, Locale, LN10, LN2, LOG10E, LOG2E,
 MAX_VALUE, MIN_VALUE, Mask, Math, MenuItem, MoveAnimation, MooTools, Native,
 NEGATIVE_INFINITY, Number, Object, ObjectRange, Option, Options, OverText, PI,
 POSITIVE_INFINITY, PeriodicalExecuter, Point, Position, Prototype, RangeError,
 Rectangle, ReferenceError, RegExp, ResizeAnimation, Request, RotateAnimation,
 SQRT1_2, SQRT2, ScrollBar, ScriptEngine, ScriptEngineBuildVersion,
 ScriptEngineMajorVersion, ScriptEngineMinorVersion, Scriptaculous, Scroller,
 Slick, Slider, Selector, String, Style, SyntaxError, Sortable, Sortables,
 SortableObserver, Sound, Spinner, System, Swiff, Text, TextArea, Template,
 Timer, Tips, Type, TypeError, Toggle, Try, URI, URIError, URL, VBArray, WSH,
 WScript, Web, Window, XMLDOM, XMLHttpRequest, XPathEvaluator, XPathException,
 XPathExpression, XPathNamespace, XPathNSResolver, XPathResult, "\\", a,
 addEventListener, address, alert, apply, applicationCache, arguments, arity,
 asi, b, bitwise, block, blur, boolOptions, boss, browser, c, call, callee,
 caller, cases, charAt, charCodeAt, character, clearInterval, clearTimeout,
 close, closed, closure, comment, condition, confirm, console, constructor,
 content, couch, create, css, curly, d, data, datalist, dd, debug, decodeURI,
 decodeURIComponent, defaultStatus, defineClass, deserialize, devel, document,
 dojo, dijit, dojox, define, edition, else, emit, encodeURI, encodeURIComponent,
 entityify, eqeqeq, eqnull, errors, es5, escape, eval, event, evidence, evil,
 ex, exception, exec, exps, expr, exports, FileReader, first, floor, focus,
 forin, fragment, frames, from, fromCharCode, fud, funct, function, functions,
 g, gc, getComputedStyle, getRow, GLOBAL, global, globals, globalstrict,
 hasOwnProperty, help, history, i, id, identifier, immed, implieds, include,
 indent, indexOf, init, ins, instanceOf, isAlpha, isApplicationRunning, isArray,
 isDigit, isFinite, isNaN, iterator, join, jshint,
 JSHINT, json, jquery, jQuery, keys, label, labelled, last, lastsemic, laxbreak,
 latedef, lbp, led, left, length, line, load, loadClass, localStorage, location,
 log, loopfunc, m, match, maxerr, maxlen, member,message, meta, module, moveBy,
 moveTo, mootools, name, navigator, new, newcap, noarg, node, noempty, nomen,
 nonew, nud, onbeforeunload, onblur, onerror, onevar, onfocus, onload, onresize,
 onunload, open, openDatabase, openURL, opener, opera, outer, param, parent,
 parseFloat, parseInt, passfail, plusplus, predef, print, process, prompt,
 proto, prototype, prototypejs, push, quit, range, raw, reach, reason, regexp,
 readFile, readUrl, regexdash, removeEventListener, replace, report, require,
 reserved, resizeBy, resizeTo, resolvePath, resumeUpdates, respond, rhino, right,
 runCommand, scroll, screen, scripturl, scrollBy, scrollTo, scrollbar, search, seal, send,
 serialize, setInterval, setTimeout, shift, slice, sort,spawn, split, stack,
 status, start, strict, sub, substr, supernew, shadow, supplant, sum, sync,
 test, toLowerCase, toString, toUpperCase, toint32, token, top, trailing, type,
 typeOf, Uint16Array, Uint32Array, Uint8Array, undef, unused, urls, value, valueOf,
 var, version, WebSocket, white, window, Worker, wsh*/

/*global exports: false */

// We build the application inside a function so that we produce only a single
// global variable. That function will be invoked immediately, and its return
// value is the JSHINT function itself.

var JSHINT = (function () {
    "use strict";

    var anonname,       // The guessed name for anonymous functions.

// These are operators that should not be used with the ! operator.

        bang = {
            '<'  : true,
            '<=' : true,
            '==' : true,
            '===': true,
            '!==': true,
            '!=' : true,
            '>'  : true,
            '>=' : true,
            '+'  : true,
            '-'  : true,
            '*'  : true,
            '/'  : true,
            '%'  : true
        },

// These are the JSHint boolean options.

        boolOptions = {
            asi         : true, // if automatic semicolon insertion should be tolerated
            bitwise     : true, // if bitwise operators should not be allowed
            boss        : true, // if advanced usage of assignments should be allowed
            browser     : true, // if the standard browser globals should be predefined
            couch       : true, // if CouchDB globals should be predefined
            curly       : true, // if curly braces around all blocks should be required
            debug       : true, // if debugger statements should be allowed
            devel       : true, // if logging globals should be predefined (console, alert, etc.)
            dojo        : true, // if Dojo Toolkit globals should be predefined
            eqeqeq      : true, // if === should be required
            eqnull      : true, // if == null comparisons should be tolerated
            es5         : true, // if ES5 syntax should be allowed
            evil        : true, // if eval should be allowed
            expr        : true, // if ExpressionStatement should be allowed as Programs
            forin       : true, // if for in statements must filter
            globalstrict: true, // if global "use strict"; should be allowed (also enables 'strict')
            immed       : true, // if immediate invocations must be wrapped in parens
            iterator    : true, // if the `__iterator__` property should be disallowed
            jquery      : true, // if jQuery globals should be predefined
            latedef     : true, // if the use before definition should not be tolerated
            laxbreak    : true, // if line breaks should not be checked
            loopfunc    : true, // if functions should be allowed to be defined within loops
            mootools    : true, // if MooTools globals should be predefined
            newcap      : true, // if constructor names must be capitalized
            noarg       : true, // if arguments.caller and arguments.callee should be disallowed
            node        : true, // if the Node.js environment globals should be predefined
            noempty     : true, // if empty blocks should be disallowed
            nonew       : true, // if using `new` for side-effects should be disallowed
            nomen       : true, // if names should be checked
            onevar      : true, // if only one var statement per function should be allowed
            passfail    : true, // if the scan should stop on first error
            plusplus    : true, // if increment/decrement should not be allowed
            proto       : true, // if the `__proto__` property should be disallowed
            prototypejs : true, // if Prototype and Scriptaculous globals should be predefined
            regexdash   : true, // if unescaped last dash (-) inside brackets should be tolerated
            regexp      : true, // if the . should not be allowed in regexp literals
            rhino       : true, // if the Rhino environment globals should be predefined
            undef       : true, // if variables should be declared before used
            scripturl   : true, // if script-targeted URLs should be tolerated
            shadow      : true, // if variable shadowing should be tolerated
            strict      : true, // require the "use strict"; pragma
            sub         : true, // if all forms of subscript notation are tolerated
            supernew    : true, // if `new function () { ... };` and `new Object;`
                                // should be tolerated
            trailing    : true, // if trailing whitespace rules apply
            white       : true, // if strict whitespace rules apply
            wsh         : true  // if the Windows Scripting Host environment globals should
                                // be predefined
        },

// browser contains a set of global names which are commonly provided by a
// web browser environment.

        browser = {
            ArrayBuffer     : false,
            ArrayBufferView : false,
            addEventListener: false,
            applicationCache: false,
            blur            : false,
            clearInterval   : false,
            clearTimeout    : false,
            close           : false,
            closed          : false,
            DataView        : false,
            defaultStatus   : false,
            document        : false,
            event           : false,
            FileReader      : false,
            Float32Array    : false,
            Float64Array    : false,
            focus           : false,
            frames          : false,
            getComputedStyle: false,
            HTMLElement     : false,
            history         : false,
            Int16Array      : false,
            Int32Array      : false,
            Int8Array       : false,
            Image           : false,
            length          : false,
            localStorage    : false,
            location        : false,
            moveBy          : false,
            moveTo          : false,
            name            : false,
            navigator       : false,
            onbeforeunload  : true,
            onblur          : true,
            onerror         : true,
            onfocus         : true,
            onload          : true,
            onresize        : true,
            onunload        : true,
            open            : false,
            openDatabase    : false,
            opener          : false,
            Option          : false,
            parent          : false,
            print           : false,
            removeEventListener: false,
            resizeBy        : false,
            resizeTo        : false,
            screen          : false,
            scroll          : false,
            scrollBy        : false,
            scrollTo        : false,
            setInterval     : false,
            setTimeout      : false,
            status          : false,
            top             : false,
            Uint16Array     : false,
            Uint32Array     : false,
            Uint8Array      : false,
            WebSocket       : false,
            window          : false,
            Worker          : false,
            XMLHttpRequest  : false,
            XPathEvaluator  : false,
            XPathException  : false,
            XPathExpression : false,
            XPathNamespace  : false,
            XPathNSResolver : false,
            XPathResult     : false
        },

        couch = {
            "require" : false,
            respond   : false,
            getRow    : false,
            emit      : false,
            send      : false,
            start     : false,
            sum       : false,
            log       : false,
            exports   : false,
            module    : false
        },

        devel = {
            alert   : false,
            confirm : false,
            console : false,
            Debug   : false,
            opera   : false,
            prompt  : false
        },

        dojo = {
            dojo      : false,
            dijit     : false,
            dojox     : false,
            define    : false,
            "require" : false
        },

        escapes = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '/' : '\\/',
            '\\': '\\\\'
        },

        funct,          // The current function

        functionicity = [
            'closure', 'exception', 'global', 'label',
            'outer', 'unused', 'var'
        ],

        functions,      // All of the functions

        global,         // The global scope
        implied,        // Implied globals
        inblock,
        indent,
        jsonmode,

        jquery = {
            '$'    : false,
            jQuery : false
        },

        lines,
        lookahead,
        member,
        membersOnly,

        mootools = {
            '$'             : false,
            '$$'            : false,
            Assets          : false,
            Browser         : false,
            Chain           : false,
            Class           : false,
            Color           : false,
            Cookie          : false,
            Core            : false,
            Document        : false,
            DomReady        : false,
            DOMReady        : false,
            Drag            : false,
            Element         : false,
            Elements        : false,
            Event           : false,
            Events          : false,
            Fx              : false,
            Group           : false,
            Hash            : false,
            HtmlTable       : false,
            Iframe          : false,
            IframeShim      : false,
            InputValidator  : false,
            instanceOf      : false,
            Keyboard        : false,
            Locale          : false,
            Mask            : false,
            MooTools        : false,
            Native          : false,
            Options         : false,
            OverText        : false,
            Request         : false,
            Scroller        : false,
            Slick           : false,
            Slider          : false,
            Sortables       : false,
            Spinner         : false,
            Swiff           : false,
            Tips            : false,
            Type            : false,
            typeOf          : false,
            URI             : false,
            Window          : false
        },

        nexttoken,

        node = {
            __filename  : false,
            __dirname   : false,
            exports     : false,
            Buffer      : false,
            GLOBAL      : false,
            global      : false,
            module      : false,
            process     : false,
            require     : false
        },

        noreach,
        option,
        predefined,     // Global variables defined by option
        prereg,
        prevtoken,

        prototypejs = {
            '$'               : false,
            '$$'              : false,
            '$A'              : false,
            '$F'              : false,
            '$H'              : false,
            '$R'              : false,
            '$break'          : false,
            '$continue'       : false,
            '$w'              : false,
            Abstract          : false,
            Ajax              : false,
            Class             : false,
            Enumerable        : false,
            Element           : false,
            Event             : false,
            Field             : false,
            Form              : false,
            Hash              : false,
            Insertion         : false,
            ObjectRange       : false,
            PeriodicalExecuter: false,
            Position          : false,
            Prototype         : false,
            Selector          : false,
            Template          : false,
            Toggle            : false,
            Try               : false,
            Autocompleter     : false,
            Builder           : false,
            Control           : false,
            Draggable         : false,
            Draggables        : false,
            Droppables        : false,
            Effect            : false,
            Sortable          : false,
            SortableObserver  : false,
            Sound             : false,
            Scriptaculous     : false
        },

        rhino = {
            defineClass : false,
            deserialize : false,
            gc          : false,
            help        : false,
            load        : false,
            loadClass   : false,
            print       : false,
            quit        : false,
            readFile    : false,
            readUrl     : false,
            runCommand  : false,
            seal        : false,
            serialize   : false,
            spawn       : false,
            sync        : false,
            toint32     : false,
            version     : false
        },

        scope,      // The current scope
        src,
        stack,

// standard contains the global names that are provided by the
// ECMAScript standard.

        standard = {
            Array               : false,
            Boolean             : false,
            Date                : false,
            decodeURI           : false,
            decodeURIComponent  : false,
            encodeURI           : false,
            encodeURIComponent  : false,
            Error               : false,
            'eval'              : false,
            EvalError           : false,
            Function            : false,
            hasOwnProperty      : false,
            isFinite            : false,
            isNaN               : false,
            JSON                : false,
            Math                : false,
            Number              : false,
            Object              : false,
            parseInt            : false,
            parseFloat          : false,
            RangeError          : false,
            ReferenceError      : false,
            RegExp              : false,
            String              : false,
            SyntaxError         : false,
            TypeError           : false,
            URIError            : false
        },

        standard_member = {
            E                   : true,
            LN2                 : true,
            LN10                : true,
            LOG2E               : true,
            LOG10E              : true,
            MAX_VALUE           : true,
            MIN_VALUE           : true,
            NEGATIVE_INFINITY   : true,
            PI                  : true,
            POSITIVE_INFINITY   : true,
            SQRT1_2             : true,
            SQRT2               : true
        },

        strict_mode,
        syntax = {},
        tab,
        token,
        urls,
        warnings,

        wsh = {
            ActiveXObject             : true,
            Enumerator                : true,
            GetObject                 : true,
            ScriptEngine              : true,
            ScriptEngineBuildVersion  : true,
            ScriptEngineMajorVersion  : true,
            ScriptEngineMinorVersion  : true,
            VBArray                   : true,
            WSH                       : true,
            WScript                   : true
        };

        // Regular expressions. Some of these are stupidly long.
        var ax, cx, tx, nx, nxg, lx, ix, jx, ft;
        (function () {
            /*jshint maxlen:300 */

            // unsafe comment or string
            ax = /@cc|<\/?|script|\]\s*\]|<\s*!|&lt/i;

            // unsafe characters that are silently deleted by one or more browsers
            cx = /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;

            // token
            tx = /^\s*([(){}\[.,:;'"~\?\]#@]|==?=?|\/(\*(jshint|jslint|members?|global)?|=|\/)?|\*[\/=]?|\+(?:=|\++)?|-(?:=|-+)?|%=?|&[&=]?|\|[|=]?|>>?>?=?|<([\/=!]|\!(\[|--)?|<=?)?|\^=?|\!=?=?|[a-zA-Z_$][a-zA-Z0-9_$]*|[0-9]+([xX][0-9a-fA-F]+|\.[0-9]*)?([eE][+\-]?[0-9]+)?)/;

            // characters in strings that need escapement
            nx = /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;
            nxg = /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

            // star slash
            lx = /\*\/|\/\*/;

            // identifier
            ix = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/;

            // javascript url
            jx = /^(?:javascript|jscript|ecmascript|vbscript|mocha|livescript)\s*:/i;

            // catches /* falls through */ comments
            ft = /^\s*\/\*\s*falls\sthrough\s*\*\/\s*$/;
        }());

    function F() {}     // Used by Object.create

    function is_own(object, name) {

// The object.hasOwnProperty method fails when the property under consideration
// is named 'hasOwnProperty'. So we have to use this more convoluted form.

        return Object.prototype.hasOwnProperty.call(object, name);
    }

// Provide critical ES5 functions to ES3.

    if (typeof Array.isArray !== 'function') {
        Array.isArray = function (o) {
            return Object.prototype.toString.apply(o) === '[object Array]';
        };
    }

    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            F.prototype = o;
            return new F();
        };
    }

    if (typeof Object.keys !== 'function') {
        Object.keys = function (o) {
            var a = [], k;
            for (k in o) {
                if (is_own(o, k)) {
                    a.push(k);
                }
            }
            return a;
        };
    }

// Non standard methods

    if (typeof String.prototype.entityify !== 'function') {
        String.prototype.entityify = function () {
            return this
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };
    }

    if (typeof String.prototype.isAlpha !== 'function') {
        String.prototype.isAlpha = function () {
            return (this >= 'a' && this <= 'z\uffff') ||
                (this >= 'A' && this <= 'Z\uffff');
        };
    }

    if (typeof String.prototype.isDigit !== 'function') {
        String.prototype.isDigit = function () {
            return (this >= '0' && this <= '9');
        };
    }

    if (typeof String.prototype.supplant !== 'function') {
        String.prototype.supplant = function (o) {
            return this.replace(/\{([^{}]*)\}/g, function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            });
        };
    }

    if (typeof String.prototype.name !== 'function') {
        String.prototype.name = function () {

// If the string looks like an identifier, then we can return it as is.
// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can simply slap some quotes around it.
// Otherwise we must also replace the offending characters with safe
// sequences.

            if (ix.test(this)) {
                return this;
            }
            if (nx.test(this)) {
                return '"' + this.replace(nxg, function (a) {
                    var c = escapes[a];
                    if (c) {
                        return c;
                    }
                    return '\\u' + ('0000' + a.charCodeAt().toString(16)).slice(-4);
                }) + '"';
            }
            return '"' + this + '"';
        };
    }


    function combine(t, o) {
        var n;
        for (n in o) {
            if (is_own(o, n)) {
                t[n] = o[n];
            }
        }
    }

    function assume() {
        if (option.couch)
            combine(predefined, couch);

        if (option.rhino)
            combine(predefined, rhino);

        if (option.prototypejs)
            combine(predefined, prototypejs);

        if (option.node)
            combine(predefined, node);

        if (option.devel)
            combine(predefined, devel);

        if (option.dojo)
            combine(predefined, dojo);

        if (option.browser)
            combine(predefined, browser);

        if (option.jquery)
            combine(predefined, jquery);

        if (option.mootools)
            combine(predefined, mootools);

        if (option.wsh)
            combine(predefined, wsh);

        if (option.globalstrict && option.strict !== false)
            option.strict = true;
    }


// Produce an error warning.

    function quit(message, line, chr) {
        var percentage = Math.floor((line / lines.length) * 100);

        throw {
            name: 'JSHintError',
            line: line,
            character: chr,
            message: message + " (" + percentage + "% scanned)."
        };
    }

    function warning(m, t, a, b, c, d) {
        var ch, l, w;
        t = t || nexttoken;
        if (t.id === '(end)') {  // `~
            t = token;
        }
        l = t.line || 0;
        ch = t.from || 0;
        w = {
            id: '(error)',
            raw: m,
            evidence: lines[l - 1] || '',
            line: l,
            character: ch,
            a: a,
            b: b,
            c: c,
            d: d
        };
        w.reason = m.supplant(w);
        JSHINT.errors.push(w);
        if (option.passfail) {
            quit('Stopping. ', l, ch);
        }
        warnings += 1;
        if (warnings >= option.maxerr) {
            quit("Too many errors.", l, ch);
        }
        return w;
    }

    function warningAt(m, l, ch, a, b, c, d) {
        return warning(m, {
            line: l,
            from: ch
        }, a, b, c, d);
    }

    function error(m, t, a, b, c, d) {
        var w = warning(m, t, a, b, c, d);
        quit("Stopping, unable to continue.", w.line, w.character);
    }

    function errorAt(m, l, ch, a, b, c, d) {
        return error(m, {
            line: l,
            from: ch
        }, a, b, c, d);
    }



// lexical analysis and token construction

    var lex = (function lex() {
        var character, from, line, s;

// Private lex methods

        function nextLine() {
            var at,
                tw; // trailing whitespace check

            if (line >= lines.length)
                return false;

            character = 1;
            s = lines[line];
            line += 1;
            at = s.search(/ \t/);

            if (at >= 0)
                warningAt("Mixed spaces and tabs.", line, at + 1);

            s = s.replace(/\t/g, tab);
            at = s.search(cx);

            if (at >= 0)
                warningAt("Unsafe character.", line, at);

            if (option.maxlen && option.maxlen < s.length)
                warningAt("Line too long.", line, s.length);

            // Check for trailing whitespaces
            tw = s.search(/\s+$/);
            if (option.trailing && ~tw && !~s.search(/^\s+$/))
                warningAt("Trailing whitespace.", line, tw);

            return true;
        }

// Produce a token object.  The token inherits from a syntax symbol.

        function it(type, value) {
            var i, t;
            if (type === '(color)' || type === '(range)') {
                t = {type: type};
            } else if (type === '(punctuator)' ||
                    (type === '(identifier)' && is_own(syntax, value))) {
                t = syntax[value] || syntax['(error)'];
            } else {
                t = syntax[type];
            }
            t = Object.create(t);
            if (type === '(string)' || type === '(range)') {
                if (!option.scripturl && jx.test(value)) {
                    warningAt("Script URL.", line, from);
                }
            }
            if (type === '(identifier)') {
                t.identifier = true;
                if (value === '__proto__' && !option.proto) {
                    warningAt("The '{a}' property is deprecated.",
                        line, from, value);
                } else if (value === '__iterator__' && !option.iterator) {
                    warningAt("'{a}' is only available in JavaScript 1.7.",
                        line, from, value);
                } else if (option.nomen && (value.charAt(0) === '_' ||
                         value.charAt(value.length - 1) === '_')) {
                    warningAt("Unexpected {a} in '{b}'.", line, from,
                        "dangling '_'", value);
                }
            }
            t.value = value;
            t.line = line;
            t.character = character;
            t.from = from;
            i = t.id;
            if (i !== '(endline)') {
                prereg = i &&
                    (('(,=:[!&|?{};'.indexOf(i.charAt(i.length - 1)) >= 0) ||
                    i === 'return');
            }
            return t;
        }

// Public lex methods

        return {
            init: function (source) {
                if (typeof source === 'string') {
                    lines = source
                        .replace(/\r\n/g, '\n')
                        .replace(/\r/g, '\n')
                        .split('\n');
                } else {
                    lines = source;
                }

                // If the first line is a shebang (#!), make it a blank and move on.
                // Shebangs are used by Node scripts.
                if (lines[0] && lines[0].substr(0, 2) == '#!')
                    lines[0] = '';

                line = 0;
                nextLine();
                from = 1;
            },

            range: function (begin, end) {
                var c, value = '';
                from = character;
                if (s.charAt(0) !== begin) {
                    errorAt("Expected '{a}' and instead saw '{b}'.",
                            line, character, begin, s.charAt(0));
                }
                for (;;) {
                    s = s.slice(1);
                    character += 1;
                    c = s.charAt(0);
                    switch (c) {
                    case '':
                        errorAt("Missing '{a}'.", line, character, c);
                        break;
                    case end:
                        s = s.slice(1);
                        character += 1;
                        return it('(range)', value);
                    case '\\':
                        warningAt("Unexpected '{a}'.", line, character, c);
                    }
                    value += c;
                }

            },

// token -- this is called by advance to get the next token.

            token: function () {
                var b, c, captures, d, depth, high, i, l, low, q, t;

                function match(x) {
                    var r = x.exec(s), r1;
                    if (r) {
                        l = r[0].length;
                        r1 = r[1];
                        c = r1.charAt(0);
                        s = s.substr(l);
                        from = character + l - r1.length;
                        character += l;
                        return r1;
                    }
                }

                function string(x) {
                    var c, j, r = '';

                    if (jsonmode && x !== '"') {
                        warningAt("Strings must use doublequote.",
                                line, character);
                    }

                    function esc(n) {
                        var i = parseInt(s.substr(j + 1, n), 16);
                        j += n;
                        if (i >= 32 && i <= 126 &&
                                i !== 34 && i !== 92 && i !== 39) {
                            warningAt("Unnecessary escapement.", line, character);
                        }
                        character += n;
                        c = String.fromCharCode(i);
                    }
                    j = 0;
                    for (;;) {
                        while (j >= s.length) {
                            j = 0;
                            if (!nextLine()) {
                                errorAt("Unclosed string.", line, from);
                            }
                        }
                        c = s.charAt(j);
                        if (c === x) {
                            character += 1;
                            s = s.substr(j + 1);
                            return it('(string)', r, x);
                        }
                        if (c < ' ') {
                            if (c === '\n' || c === '\r') {
                                break;
                            }
                            warningAt("Control character in string: {a}.",
                                    line, character + j, s.slice(0, j));
                        } else if (c === '\\') {
                            j += 1;
                            character += 1;
                            c = s.charAt(j);
                            switch (c) {
                            case '\\':
                            case '"':
                            case '/':
                                break;
                            case '\'':
                                if (jsonmode) {
                                    warningAt("Avoid \\'.", line, character);
                                }
                                break;
                            case 'b':
                                c = '\b';
                                break;
                            case 'f':
                                c = '\f';
                                break;
                            case 'n':
                                c = '\n';
                                break;
                            case 'r':
                                c = '\r';
                                break;
                            case 't':
                                c = '\t';
                                break;
                            case 'u':
                                esc(4);
                                break;
                            case 'v':
                                if (jsonmode) {
                                    warningAt("Avoid \\v.", line, character);
                                }
                                c = '\v';
                                break;
                            case 'x':
                                if (jsonmode) {
                                    warningAt("Avoid \\x-.", line, character);
                                }
                                esc(2);
                                break;
                            default:
                                warningAt("Bad escapement.", line, character);
                            }
                        }
                        r += c;
                        character += 1;
                        j += 1;
                    }
                }

                for (;;) {
                    if (!s) {
                        return it(nextLine() ? '(endline)' : '(end)', '');
                    }
                    t = match(tx);
                    if (!t) {
                        t = '';
                        c = '';
                        while (s && s < '!') {
                            s = s.substr(1);
                        }
                        if (s) {
                            errorAt("Unexpected '{a}'.", line, character, s.substr(0, 1));
                        }
                    } else {

    //      identifier

                        if (c.isAlpha() || c === '_' || c === '$') {
                            return it('(identifier)', t);
                        }

    //      number

                        if (c.isDigit()) {
                            if (!isFinite(Number(t))) {
                                warningAt("Bad number '{a}'.",
                                    line, character, t);
                            }
                            if (s.substr(0, 1).isAlpha()) {
                                warningAt("Missing space after '{a}'.",
                                        line, character, t);
                            }
                            if (c === '0') {
                                d = t.substr(1, 1);
                                if (d.isDigit()) {
                                    if (token.id !== '.') {
                                        warningAt("Don't use extra leading zeros '{a}'.",
                                            line, character, t);
                                    }
                                } else if (jsonmode && (d === 'x' || d === 'X')) {
                                    warningAt("Avoid 0x-. '{a}'.",
                                            line, character, t);
                                }
                            }
                            if (t.substr(t.length - 1) === '.') {
                                warningAt(
"A trailing decimal point can be confused with a dot '{a}'.", line, character, t);
                            }
                            return it('(number)', t);
                        }
                        switch (t) {

    //      string

                        case '"':
                        case "'":
                            return string(t);

    //      // comment

                        case '//':
                            if (src) {
                                warningAt("Unexpected comment.", line, character);
                            }
                            s = '';
                            token.comment = true;
                            break;

    //      /* comment

                        case '/*':
                            if (src) {
                                warningAt("Unexpected comment.", line, character);
                            }
                            for (;;) {
                                i = s.search(lx);
                                if (i >= 0) {
                                    break;
                                }
                                if (!nextLine()) {
                                    errorAt("Unclosed comment.", line, character);
                                }
                            }
                            character += i + 2;
                            if (s.substr(i, 1) === '/') {
                                errorAt("Nested comment.", line, character);
                            }
                            s = s.substr(i + 2);
                            token.comment = true;
                            break;

    //      /*members /*jshint /*global

                        case '/*members':
                        case '/*member':
                        case '/*jshint':
                        case '/*jslint':
                        case '/*global':
                        case '*/':
                            return {
                                value: t,
                                type: 'special',
                                line: line,
                                character: character,
                                from: from
                            };

                        case '':
                            break;
    //      /
                        case '/':
                            if (token.id === '/=') {
                                errorAt(
"A regular expression literal can be confused with '/='.", line, from);
                            }
                            if (prereg) {
                                depth = 0;
                                captures = 0;
                                l = 0;
                                for (;;) {
                                    b = true;
                                    c = s.charAt(l);
                                    l += 1;
                                    switch (c) {
                                    case '':
                                        errorAt("Unclosed regular expression.",
                                                line, from);
                                        return;
                                    case '/':
                                        if (depth > 0) {
                                            warningAt("Unescaped '{a}'.",
                                                    line, from + l, '/');
                                        }
                                        c = s.substr(0, l - 1);
                                        q = {
                                            g: true,
                                            i: true,
                                            m: true
                                        };
                                        while (q[s.charAt(l)] === true) {
                                            q[s.charAt(l)] = false;
                                            l += 1;
                                        }
                                        character += l;
                                        s = s.substr(l);
                                        q = s.charAt(0);
                                        if (q === '/' || q === '*') {
                                            errorAt("Confusing regular expression.",
                                                    line, from);
                                        }
                                        return it('(regexp)', c);
                                    case '\\':
                                        c = s.charAt(l);
                                        if (c < ' ') {
                                            warningAt(
"Unexpected control character in regular expression.", line, from + l);
                                        } else if (c === '<') {
                                            warningAt(
"Unexpected escaped character '{a}' in regular expression.", line, from + l, c);
                                        }
                                        l += 1;
                                        break;
                                    case '(':
                                        depth += 1;
                                        b = false;
                                        if (s.charAt(l) === '?') {
                                            l += 1;
                                            switch (s.charAt(l)) {
                                            case ':':
                                            case '=':
                                            case '!':
                                                l += 1;
                                                break;
                                            default:
                                                warningAt(
"Expected '{a}' and instead saw '{b}'.", line, from + l, ':', s.charAt(l));
                                            }
                                        } else {
                                            captures += 1;
                                        }
                                        break;
                                    case '|':
                                        b = false;
                                        break;
                                    case ')':
                                        if (depth === 0) {
                                            warningAt("Unescaped '{a}'.",
                                                    line, from + l, ')');
                                        } else {
                                            depth -= 1;
                                        }
                                        break;
                                    case ' ':
                                        q = 1;
                                        while (s.charAt(l) === ' ') {
                                            l += 1;
                                            q += 1;
                                        }
                                        if (q > 1) {
                                            warningAt(
"Spaces are hard to count. Use {{a}}.", line, from + l, q);
                                        }
                                        break;
                                    case '[':
                                        c = s.charAt(l);
                                        if (c === '^') {
                                            l += 1;
                                            if (option.regexp) {
                                                warningAt("Insecure '{a}'.",
                                                        line, from + l, c);
                                            } else if (s.charAt(l) === ']') {
                                                errorAt("Unescaped '{a}'.",
                                                    line, from + l, '^');
                                            }
                                        }
                                        q = false;
                                        if (c === ']') {
                                            warningAt("Empty class.", line,
                                                    from + l - 1);
                                            q = true;
                                        }
klass:                                  do {
                                            c = s.charAt(l);
                                            l += 1;
                                            switch (c) {
                                            case '[':
                                            case '^':
                                                warningAt("Unescaped '{a}'.",
                                                        line, from + l, c);
                                                q = true;
                                                break;
                                            case '-':
                                                if (q) {
                                                    q = false;
                                                } else {
                                                    warningAt("Unescaped '{a}'.",
                                                            line, from + l, '-');
                                                    q = true;
                                                }
                                                break;
                                            case ']':
                                                if (!q && !option.regexdash) {
                                                    warningAt("Unescaped '{a}'.",
                                                            line, from + l - 1, '-');
                                                }
                                                break klass;
                                            case '\\':
                                                c = s.charAt(l);
                                                if (c < ' ') {
                                                    warningAt(
"Unexpected control character in regular expression.", line, from + l);
                                                } else if (c === '<') {
                                                    warningAt(
"Unexpected escaped character '{a}' in regular expression.", line, from + l, c);
                                                }
                                                l += 1;
                                                q = true;
                                                break;
                                            case '/':
                                                warningAt("Unescaped '{a}'.",
                                                        line, from + l - 1, '/');
                                                q = true;
                                                break;
                                            case '<':
                                                q = true;
                                                break;
                                            default:
                                                q = true;
                                            }
                                        } while (c);
                                        break;
                                    case '.':
                                        if (option.regexp) {
                                            warningAt("Insecure '{a}'.", line,
                                                    from + l, c);
                                        }
                                        break;
                                    case ']':
                                    case '?':
                                    case '{':
                                    case '}':
                                    case '+':
                                    case '*':
                                        warningAt("Unescaped '{a}'.", line,
                                                from + l, c);
                                    }
                                    if (b) {
                                        switch (s.charAt(l)) {
                                        case '?':
                                        case '+':
                                        case '*':
                                            l += 1;
                                            if (s.charAt(l) === '?') {
                                                l += 1;
                                            }
                                            break;
                                        case '{':
                                            l += 1;
                                            c = s.charAt(l);
                                            if (c < '0' || c > '9') {
                                                warningAt(
"Expected a number and instead saw '{a}'.", line, from + l, c);
                                            }
                                            l += 1;
                                            low = +c;
                                            for (;;) {
                                                c = s.charAt(l);
                                                if (c < '0' || c > '9') {
                                                    break;
                                                }
                                                l += 1;
                                                low = +c + (low * 10);
                                            }
                                            high = low;
                                            if (c === ',') {
                                                l += 1;
                                                high = Infinity;
                                                c = s.charAt(l);
                                                if (c >= '0' && c <= '9') {
                                                    l += 1;
                                                    high = +c;
                                                    for (;;) {
                                                        c = s.charAt(l);
                                                        if (c < '0' || c > '9') {
                                                            break;
                                                        }
                                                        l += 1;
                                                        high = +c + (high * 10);
                                                    }
                                                }
                                            }
                                            if (s.charAt(l) !== '}') {
                                                warningAt(
"Expected '{a}' and instead saw '{b}'.", line, from + l, '}', c);
                                            } else {
                                                l += 1;
                                            }
                                            if (s.charAt(l) === '?') {
                                                l += 1;
                                            }
                                            if (low > high) {
                                                warningAt(
"'{a}' should not be greater than '{b}'.", line, from + l, low, high);
                                            }
                                        }
                                    }
                                }
                                c = s.substr(0, l - 1);
                                character += l;
                                s = s.substr(l);
                                return it('(regexp)', c);
                            }
                            return it('(punctuator)', t);

    //      punctuator

                        case '#':
                            return it('(punctuator)', t);
                        default:
                            return it('(punctuator)', t);
                        }
                    }
                }
            }
        };
    }());


    function addlabel(t, type) {

        if (t === 'hasOwnProperty') {
            warning("'hasOwnProperty' is a really bad name.");
        }

// Define t in the current function in the current scope.

        if (is_own(funct, t) && !funct['(global)']) {
            if (funct[t] === true) {
                if (option.latedef)
                    warning("'{a}' was used before it was defined.", nexttoken, t);
            } else {
                if (!option.shadow)
                    warning("'{a}' is already defined.", nexttoken, t);
            }
        }

        funct[t] = type;
        if (funct['(global)']) {
            global[t] = funct;
            if (is_own(implied, t)) {
                if (option.latedef)
                    warning("'{a}' was used before it was defined.", nexttoken, t);
                delete implied[t];
            }
        } else {
            scope[t] = funct;
        }
    }


    function doOption() {
        var b, obj, filter, o = nexttoken.value, t, v;
        switch (o) {
        case '*/':
            error("Unbegun comment.");
            break;
        case '/*members':
        case '/*member':
            o = '/*members';
            if (!membersOnly) {
                membersOnly = {};
            }
            obj = membersOnly;
            break;
        case '/*jshint':
        case '/*jslint':
            obj = option;
            filter = boolOptions;
            break;
        case '/*global':
            obj = predefined;
            break;
        default:
            error("What?");
        }
        t = lex.token();
loop:   for (;;) {
            for (;;) {
                if (t.type === 'special' && t.value === '*/') {
                    break loop;
                }
                if (t.id !== '(endline)' && t.id !== ',') {
                    break;
                }
                t = lex.token();
            }
            if (t.type !== '(string)' && t.type !== '(identifier)' &&
                    o !== '/*members') {
                error("Bad option.", t);
            }
            v = lex.token();
            if (v.id === ':') {
                v = lex.token();
                if (obj === membersOnly) {
                    error("Expected '{a}' and instead saw '{b}'.",
                            t, '*/', ':');
                }
                if (t.value === 'indent' && (o === '/*jshint' || o === '/*jslint')) {
                    b = +v.value;
                    if (typeof b !== 'number' || !isFinite(b) || b <= 0 ||
                            Math.floor(b) !== b) {
                        error("Expected a small integer and instead saw '{a}'.",
                                v, v.value);
                    }
                    obj.white = true;
                    obj.indent = b;
                } else if (t.value === 'maxerr' && (o === '/*jshint' || o === '/*jslint')) {
                    b = +v.value;
                    if (typeof b !== 'number' || !isFinite(b) || b <= 0 ||
                            Math.floor(b) !== b) {
                        error("Expected a small integer and instead saw '{a}'.",
                                v, v.value);
                    }
                    obj.maxerr = b;
                } else if (t.value === 'maxlen' && (o === '/*jshint' || o === '/*jslint')) {
                    b = +v.value;
                    if (typeof b !== 'number' || !isFinite(b) || b <= 0 ||
                            Math.floor(b) !== b) {
                        error("Expected a small integer and instead saw '{a}'.",
                                v, v.value);
                    }
                    obj.maxlen = b;
                } else if (v.value === 'true') {
                    obj[t.value] = true;
                } else if (v.value === 'false') {
                    obj[t.value] = false;
                } else {
                    error("Bad option value.", v);
                }
                t = lex.token();
            } else {
                if (o === '/*jshint' || o === '/*jslint') {
                    error("Missing option value.", t);
                }
                obj[t.value] = false;
                t = v;
            }
        }
        if (filter) {
            assume();
        }
    }


// We need a peek function. If it has an argument, it peeks that much farther
// ahead. It is used to distinguish
//     for ( var i in ...
// from
//     for ( var i = ...

    function peek(p) {
        var i = p || 0, j = 0, t;

        while (j <= i) {
            t = lookahead[j];
            if (!t) {
                t = lookahead[j] = lex.token();
            }
            j += 1;
        }
        return t;
    }



// Produce the next token. It looks for programming errors.

    function advance(id, t) {
        switch (token.id) {
        case '(number)':
            if (nexttoken.id === '.') {
                warning("A dot following a number can be confused with a decimal point.", token);
            }
            break;
        case '-':
            if (nexttoken.id === '-' || nexttoken.id === '--') {
                warning("Confusing minusses.");
            }
            break;
        case '+':
            if (nexttoken.id === '+' || nexttoken.id === '++') {
                warning("Confusing plusses.");
            }
            break;
        }
        if (token.type === '(string)' || token.identifier) {
            anonname = token.value;
        }

        if (id && nexttoken.id !== id) {
            if (t) {
                if (nexttoken.id === '(end)') {
                    warning("Unmatched '{a}'.", t, t.id);
                } else {
                    warning("Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.",
                            nexttoken, id, t.id, t.line, nexttoken.value);
                }
            } else if (nexttoken.type !== '(identifier)' ||
                            nexttoken.value !== id) {
                warning("Expected '{a}' and instead saw '{b}'.",
                        nexttoken, id, nexttoken.value);
            }
        }
        prevtoken = token;
        token = nexttoken;
        for (;;) {
            nexttoken = lookahead.shift() || lex.token();
            if (nexttoken.id === '(end)' || nexttoken.id === '(error)') {
                return;
            }
            if (nexttoken.type === 'special') {
                doOption();
            } else {
                if (nexttoken.id !== '(endline)') {
                    break;
                }
            }
        }
    }


// This is the heart of JSHINT, the Pratt parser. In addition to parsing, it
// is looking for ad hoc lint patterns. We add .fud to Pratt's model, which is
// like .nud except that it is only used on the first token of a statement.
// Having .fud makes it much easier to define statement-oriented languages like
// JavaScript. I retained Pratt's nomenclature.

// .nud     Null denotation
// .fud     First null denotation
// .led     Left denotation
//  lbp     Left binding power
//  rbp     Right binding power

// They are elements of the parsing method called Top Down Operator Precedence.

    function expression(rbp, initial) {
        var left, isArray = false;

        if (nexttoken.id === '(end)')
            error("Unexpected early end of program.", token);

        advance();
        if (initial) {
            anonname = 'anonymous';
            funct['(verb)'] = token.value;
        }
        if (initial === true && token.fud) {
            left = token.fud();
        } else {
            if (token.nud) {
                left = token.nud();
            } else {
                if (nexttoken.type === '(number)' && token.id === '.') {
                    warning("A leading decimal point can be confused with a dot: '.{a}'.",
                            token, nexttoken.value);
                    advance();
                    return token;
                } else {
                    error("Expected an identifier and instead saw '{a}'.",
                            token, token.id);
                }
            }
            while (rbp < nexttoken.lbp) {
                isArray = token.value == 'Array';
                advance();
                if (isArray && token.id == '(' && nexttoken.id == ')')
                    warning("Use the array literal notation [].", token);
                if (token.led) {
                    left = token.led(left);
                } else {
                    error("Expected an operator and instead saw '{a}'.",
                        token, token.id);
                }
            }
        }
        return left;
    }


// Functions for conformance of style.

    function adjacent(left, right) {
        left = left || token;
        right = right || nexttoken;
        if (option.white) {
            if (left.character !== right.from && left.line === right.line) {
                warning("Unexpected space after '{a}'.", right, left.value);
            }
        }
    }

    function nobreak(left, right) {
        left = left || token;
        right = right || nexttoken;
        if (option.white && (left.character !== right.from || left.line !== right.line)) {
            warning("Unexpected space before '{a}'.", right, right.value);
        }
    }

    function nospace(left, right) {
        left = left || token;
        right = right || nexttoken;
        if (option.white && !left.comment) {
            if (left.line === right.line) {
                adjacent(left, right);
            }
        }
    }

    function nonadjacent(left, right) {
        if (option.white) {
            left = left || token;
            right = right || nexttoken;
            if (left.line === right.line && left.character === right.from) {
                warning("Missing space after '{a}'.",
                        nexttoken, left.value);
            }
        }
    }

    function nobreaknonadjacent(left, right) {
        left = left || token;
        right = right || nexttoken;
        if (!option.laxbreak && left.line !== right.line) {
            warning("Bad line breaking before '{a}'.", right, right.id);
        } else if (option.white) {
            left = left || token;
            right = right || nexttoken;
            if (left.character === right.from) {
                warning("Missing space after '{a}'.",
                        nexttoken, left.value);
            }
        }
    }

    function indentation(bias) {
        var i;
        if (option.white && nexttoken.id !== '(end)') {
            i = indent + (bias || 0);
            if (nexttoken.from !== i) {
                warning(
"Expected '{a}' to have an indentation at {b} instead at {c}.",
                        nexttoken, nexttoken.value, i, nexttoken.from);
            }
        }
    }

    function nolinebreak(t) {
        t = t || token;
        if (t.line !== nexttoken.line) {
            warning("Line breaking error '{a}'.", t, t.value);
        }
    }


    function comma() {
        if (token.line !== nexttoken.line) {
            if (!option.laxbreak) {
                warning("Bad line breaking before '{a}'.", token, nexttoken.id);
            }
        } else if (token.character !== nexttoken.from && option.white) {
            warning("Unexpected space after '{a}'.", nexttoken, token.value);
        }
        advance(',');
        nonadjacent(token, nexttoken);
    }


// Functional constructors for making the symbols that will be inherited by
// tokens.

    function symbol(s, p) {
        var x = syntax[s];
        if (!x || typeof x !== 'object') {
            syntax[s] = x = {
                id: s,
                lbp: p,
                value: s
            };
        }
        return x;
    }


    function delim(s) {
        return symbol(s, 0);
    }


    function stmt(s, f) {
        var x = delim(s);
        x.identifier = x.reserved = true;
        x.fud = f;
        return x;
    }


    function blockstmt(s, f) {
        var x = stmt(s, f);
        x.block = true;
        return x;
    }


    function reserveName(x) {
        var c = x.id.charAt(0);
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            x.identifier = x.reserved = true;
        }
        return x;
    }


    function prefix(s, f) {
        var x = symbol(s, 150);
        reserveName(x);
        x.nud = (typeof f === 'function') ? f : function () {
            this.right = expression(150);
            this.arity = 'unary';
            if (this.id === '++' || this.id === '--') {
                if (option.plusplus) {
                    warning("Unexpected use of '{a}'.", this, this.id);
                } else if ((!this.right.identifier || this.right.reserved) &&
                        this.right.id !== '.' && this.right.id !== '[') {
                    warning("Bad operand.", this);
                }
            }
            return this;
        };
        return x;
    }


    function type(s, f) {
        var x = delim(s);
        x.type = s;
        x.nud = f;
        return x;
    }


    function reserve(s, f) {
        var x = type(s, f);
        x.identifier = x.reserved = true;
        return x;
    }


    function reservevar(s, v) {
        return reserve(s, function () {
            if (typeof v === 'function') {
                v(this);
            }
            return this;
        });
    }


    function infix(s, f, p, w) {
        var x = symbol(s, p);
        reserveName(x);
        x.led = function (left) {
            if (!w) {
                nobreaknonadjacent(prevtoken, token);
                nonadjacent(token, nexttoken);
            }
            if (typeof f === 'function') {
                return f(left, this);
            } else {
                this.left = left;
                this.right = expression(p);
                return this;
            }
        };
        return x;
    }


    function relation(s, f) {
        var x = symbol(s, 100);
        x.led = function (left) {
            nobreaknonadjacent(prevtoken, token);
            nonadjacent(token, nexttoken);
            var right = expression(100);
            if ((left && left.id === 'NaN') || (right && right.id === 'NaN')) {
                warning("Use the isNaN function to compare with NaN.", this);
            } else if (f) {
                f.apply(this, [left, right]);
            }
            if (left.id === '!') {
                warning("Confusing use of '{a}'.", left, '!');
            }
            if (right.id === '!') {
                warning("Confusing use of '{a}'.", left, '!');
            }
            this.left = left;
            this.right = right;
            return this;
        };
        return x;
    }


    function isPoorRelation(node) {
        return node &&
              ((node.type === '(number)' && +node.value === 0) ||
               (node.type === '(string)' && node.value === '') ||
               (node.type === 'null' && !option.eqnull) ||
                node.type === 'true' ||
                node.type === 'false' ||
                node.type === 'undefined');
    }


    function assignop(s, f) {
        symbol(s, 20).exps = true;
        return infix(s, function (left, that) {
            var l;
            that.left = left;
            if (predefined[left.value] === false &&
                    scope[left.value]['(global)'] === true) {
                warning("Read only.", left);
            } else if (left['function']) {
                warning("'{a}' is a function.", left, left.value);
            }
            if (left) {
                if (left.id === '.' || left.id === '[') {
                    if (!left.left || left.left.value === 'arguments') {
                        warning('Bad assignment.', that);
                    }
                    that.right = expression(19);
                    return that;
                } else if (left.identifier && !left.reserved) {
                    if (funct[left.value] === 'exception') {
                        warning("Do not assign to the exception parameter.", left);
                    }
                    that.right = expression(19);
                    return that;
                }
                if (left === syntax['function']) {
                    warning(
"Expected an identifier in an assignment and instead saw a function invocation.",
                                token);
                }
            }
            error("Bad assignment.", that);
        }, 20);
    }


    function bitwise(s, f, p) {
        var x = symbol(s, p);
        reserveName(x);
        x.led = (typeof f === 'function') ? f : function (left) {
            if (option.bitwise) {
                warning("Unexpected use of '{a}'.", this, this.id);
            }
            this.left = left;
            this.right = expression(p);
            return this;
        };
        return x;
    }


    function bitwiseassignop(s) {
        symbol(s, 20).exps = true;
        return infix(s, function (left, that) {
            if (option.bitwise) {
                warning("Unexpected use of '{a}'.", that, that.id);
            }
            nonadjacent(prevtoken, token);
            nonadjacent(token, nexttoken);
            if (left) {
                if (left.id === '.' || left.id === '[' ||
                        (left.identifier && !left.reserved)) {
                    expression(19);
                    return that;
                }
                if (left === syntax['function']) {
                    warning(
"Expected an identifier in an assignment, and instead saw a function invocation.",
                                token);
                }
                return that;
            }
            error("Bad assignment.", that);
        }, 20);
    }


    function suffix(s, f) {
        var x = symbol(s, 150);
        x.led = function (left) {
            if (option.plusplus) {
                warning("Unexpected use of '{a}'.", this, this.id);
            } else if ((!left.identifier || left.reserved) &&
                    left.id !== '.' && left.id !== '[') {
                warning("Bad operand.", this);
            }
            this.left = left;
            return this;
        };
        return x;
    }


    // fnparam means that this identifier is being defined as a function
    // argument (see identifier())
    function optionalidentifier(fnparam) {
        if (nexttoken.identifier) {
            advance();
            if (token.reserved && !option.es5) {
                // `undefined` as a function param is a common pattern to protect
                // against the case when somebody does `undefined = true` and
                // help with minification. More info: https://gist.github.com/315916
                if (!fnparam || token.value != 'undefined') {
                    warning("Expected an identifier and instead saw '{a}' (a reserved word).",
                            token, token.id);
                }
            }
            return token.value;
        }
    }

    // fnparam means that this identifier is being defined as a function
    // argument
    function identifier(fnparam) {
        var i = optionalidentifier(fnparam);
        if (i) {
            return i;
        }
        if (token.id === 'function' && nexttoken.id === '(') {
            warning("Missing name in function declaration.");
        } else {
            error("Expected an identifier and instead saw '{a}'.",
                    nexttoken, nexttoken.value);
        }
    }


    function reachable(s) {
        var i = 0, t;
        if (nexttoken.id !== ';' || noreach) {
            return;
        }
        for (;;) {
            t = peek(i);
            if (t.reach) {
                return;
            }
            if (t.id !== '(endline)') {
                if (t.id === 'function') {
                    warning(
"Inner functions should be listed at the top of the outer function.", t);
                    break;
                }
                warning("Unreachable '{a}' after '{b}'.", t, t.value, s);
                break;
            }
            i += 1;
        }
    }


    function statement(noindent) {
        var i = indent, r, s = scope, t = nexttoken;

// We don't like the empty statement.

        if (t.id === ';') {
            warning("Unnecessary semicolon.", t);
            advance(';');
            return;
        }

// Is this a labelled statement?

        if (t.identifier && !t.reserved && peek().id === ':') {
            advance();
            advance(':');
            scope = Object.create(s);
            addlabel(t.value, 'label');
            if (!nexttoken.labelled) {
                warning("Label '{a}' on {b} statement.",
                        nexttoken, t.value, nexttoken.value);
            }
            if (jx.test(t.value + ':')) {
                warning("Label '{a}' looks like a javascript url.",
                        t, t.value);
            }
            nexttoken.label = t.value;
            t = nexttoken;
        }

// Parse the statement.

        if (!noindent) {
            indentation();
        }
        r = expression(0, true);

// Look for the final semicolon.

        if (!t.block) {
            if (!option.expr && (!r || !r.exps)) {
                warning("Expected an assignment or function call and instead saw an expression.",
                    token);
            } else if (option.nonew && r.id === '(' && r.left.id === 'new') {
                warning("Do not use 'new' for side effects.");
            }
            if (nexttoken.id !== ';') {
                if (!option.asi && !(option.lastsemic && nexttoken.id == '}' &&
                        nexttoken.line == token.line)) {
                    warningAt("Missing semicolon.", token.line, token.from + token.value.length);
                }
            } else {
                adjacent(token, nexttoken);
                advance(';');
                nonadjacent(token, nexttoken);
            }
        }

// Restore the indentation.

        indent = i;
        scope = s;
        return r;
    }


    function use_strict() {
        if (nexttoken.value === 'use strict') {
            if (strict_mode) {
                warning("Unnecessary \"use strict\".");
            }
            advance();
            advance(';');
            strict_mode = true;
            option.newcap = true;
            option.undef = true;
            return true;
        } else {
            return false;
        }
    }


    function statements(begin) {
        var a = [], f, p;

        while (!nexttoken.reach && nexttoken.id !== '(end)') {
            if (nexttoken.id === ';') {
                warning("Unnecessary semicolon.");
                advance(';');
            } else {
                a.push(statement());
            }
        }
        return a;
    }


    /*
     * Parses a single block. A block is a sequence of statements wrapped in
     * braces.
     *
     * ordinary - true for everything but function bodies and try blocks.
     * stmt     - true if block can be a single statement (e.g. in if/for/while).
     */
    function block(ordinary, stmt) {
        var a,
            b = inblock,
            old_indent = indent,
            m = strict_mode,
            s = scope,
            t;

        inblock = ordinary;
        scope = Object.create(scope);
        nonadjacent(token, nexttoken);
        t = nexttoken;

        if (nexttoken.id === '{') {
            advance('{');
            if (nexttoken.id !== '}' || token.line !== nexttoken.line) {
                indent += option.indent;
                while (!ordinary && nexttoken.from > indent) {
                    indent += option.indent;
                }
                if (!ordinary && !use_strict() && !m && option.strict &&
                        funct['(context)']['(global)']) {
                    warning("Missing \"use strict\" statement.");
                }
                a = statements();
                strict_mode = m;
                indent -= option.indent;
                indentation();
            }
            advance('}', t);
            indent = old_indent;
        } else if (!ordinary) {
            error("Expected '{a}' and instead saw '{b}'.",
                  nexttoken, '{', nexttoken.value);
        } else {
            if (!stmt || option.curly)
                warning("Expected '{a}' and instead saw '{b}'.",
                        nexttoken, '{', nexttoken.value);

            noreach = true;
            a = [statement()];
            noreach = false;
        }
        funct['(verb)'] = null;
        scope = s;
        inblock = b;
        if (ordinary && option.noempty && (!a || a.length === 0)) {
            warning("Empty block.");
        }
        return a;
    }


    function countMember(m) {
        if (membersOnly && typeof membersOnly[m] !== 'boolean') {
            warning("Unexpected /*member '{a}'.", token, m);
        }
        if (typeof member[m] === 'number') {
            member[m] += 1;
        } else {
            member[m] = 1;
        }
    }


    function note_implied(token) {
        var name = token.value, line = token.line, a = implied[name];
        if (typeof a === 'function') {
            a = false;
        }
        if (!a) {
            a = [line];
            implied[name] = a;
        } else if (a[a.length - 1] !== line) {
            a.push(line);
        }
    }

// Build the syntax table by declaring the syntactic elements of the language.

    type('(number)', function () {
        return this;
    });
    type('(string)', function () {
        return this;
    });

    syntax['(identifier)'] = {
        type: '(identifier)',
        lbp: 0,
        identifier: true,
        nud: function () {
            var v = this.value,
                s = scope[v],
                f;
            if (typeof s === 'function') {

// Protection against accidental inheritance.

                s = undefined;
            } else if (typeof s === 'boolean') {
                f = funct;
                funct = functions[0];
                addlabel(v, 'var');
                s = funct;
                funct = f;
            }

// The name is in scope and defined in the current function.

            if (funct === s) {

//      Change 'unused' to 'var', and reject labels.

                switch (funct[v]) {
                case 'unused':
                    funct[v] = 'var';
                    break;
                case 'unction':
                    funct[v] = 'function';
                    this['function'] = true;
                    break;
                case 'function':
                    this['function'] = true;
                    break;
                case 'label':
                    warning("'{a}' is a statement label.", token, v);
                    break;
                }

// The name is not defined in the function.  If we are in the global scope,
// then we have an undefined variable.
//
// Operators typeof and delete do not raise runtime errors even if the base
// object of a reference is null so no need to display warning if we're
// inside of typeof or delete.

            } else if (funct['(global)']) {
                if (anonname != 'typeof' && anonname != 'delete' &&
                    option.undef && typeof predefined[v] !== 'boolean') {
                    warning("'{a}' is not defined.", token, v);
                }
                note_implied(token);

// If the name is already defined in the current
// function, but not as outer, then there is a scope error.

            } else {
                switch (funct[v]) {
                case 'closure':
                case 'function':
                case 'var':
                case 'unused':
                    warning("'{a}' used out of scope.", token, v);
                    break;
                case 'label':
                    warning("'{a}' is a statement label.", token, v);
                    break;
                case 'outer':
                case 'global':
                    break;
                default:

// If the name is defined in an outer function, make an outer entry, and if
// it was unused, make it var.

                    if (s === true) {
                        funct[v] = true;
                    } else if (s === null) {
                        warning("'{a}' is not allowed.", token, v);
                        note_implied(token);
                    } else if (typeof s !== 'object') {

// Operators typeof and delete do not raise runtime errors even if the base object of
// a reference is null so no need to display warning if we're inside of typeof or delete.

                        if (anonname != 'typeof' && anonname != 'delete' && option.undef) {
                            warning("'{a}' is not defined.", token, v);
                        } else {
                            funct[v] = true;
                        }
                        note_implied(token);
                    } else {
                        switch (s[v]) {
                        case 'function':
                        case 'unction':
                            this['function'] = true;
                            s[v] = 'closure';
                            funct[v] = s['(global)'] ? 'global' : 'outer';
                            break;
                        case 'var':
                        case 'unused':
                            s[v] = 'closure';
                            funct[v] = s['(global)'] ? 'global' : 'outer';
                            break;
                        case 'closure':
                        case 'parameter':
                            funct[v] = s['(global)'] ? 'global' : 'outer';
                            break;
                        case 'label':
                            warning("'{a}' is a statement label.", token, v);
                        }
                    }
                }
            }
            return this;
        },
        led: function () {
            error("Expected an operator and instead saw '{a}'.",
                nexttoken, nexttoken.value);
        }
    };

    type('(regexp)', function () {
        return this;
    });


// ECMAScript parser

    delim('(endline)');
    delim('(begin)');
    delim('(end)').reach = true;
    delim('</').reach = true;
    delim('<!');
    delim('<!--');
    delim('-->');
    delim('(error)').reach = true;
    delim('}').reach = true;
    delim(')');
    delim(']');
    delim('"').reach = true;
    delim("'").reach = true;
    delim(';');
    delim(':').reach = true;
    delim(',');
    delim('#');
    delim('@');
    reserve('else');
    reserve('case').reach = true;
    reserve('catch');
    reserve('default').reach = true;
    reserve('finally');
    reservevar('arguments', function (x) {
        if (strict_mode && funct['(global)']) {
            warning("Strict violation.", x);
        }
    });
    reservevar('eval');
    reservevar('false');
    reservevar('Infinity');
    reservevar('NaN');
    reservevar('null');
    reservevar('this', function (x) {
        if (strict_mode && ((funct['(statement)'] &&
                funct['(name)'].charAt(0) > 'Z') || funct['(global)'])) {
            warning("Strict violation.", x);
        }
    });
    reservevar('true');
    reservevar('undefined');
    assignop('=', 'assign', 20);
    assignop('+=', 'assignadd', 20);
    assignop('-=', 'assignsub', 20);
    assignop('*=', 'assignmult', 20);
    assignop('/=', 'assigndiv', 20).nud = function () {
        error("A regular expression literal can be confused with '/='.");
    };
    assignop('%=', 'assignmod', 20);
    bitwiseassignop('&=', 'assignbitand', 20);
    bitwiseassignop('|=', 'assignbitor', 20);
    bitwiseassignop('^=', 'assignbitxor', 20);
    bitwiseassignop('<<=', 'assignshiftleft', 20);
    bitwiseassignop('>>=', 'assignshiftright', 20);
    bitwiseassignop('>>>=', 'assignshiftrightunsigned', 20);
    infix('?', function (left, that) {
        that.left = left;
        that.right = expression(10);
        advance(':');
        that['else'] = expression(10);
        return that;
    }, 30);

    infix('||', 'or', 40);
    infix('&&', 'and', 50);
    bitwise('|', 'bitor', 70);
    bitwise('^', 'bitxor', 80);
    bitwise('&', 'bitand', 90);
    relation('==', function (left, right) {
        var eqnull = option.eqnull &&
                (left.value == 'null' || right.value == 'null');

        if (!eqnull && option.eqeqeq) {
            warning("Expected '{a}' and instead saw '{b}'.",
                    this, '===', '==');
        } else if (isPoorRelation(left)) {
            warning("Use '{a}' to compare with '{b}'.",
                this, '===', left.value);
        } else if (isPoorRelation(right)) {
            warning("Use '{a}' to compare with '{b}'.",
                this, '===', right.value);
        }
        return this;
    });
    relation('===');
    relation('!=', function (left, right) {
        var eqnull = option.eqnull &&
                (left.value == 'null' || right.value == 'null');

        if (!eqnull && option.eqeqeq) {
            warning("Expected '{a}' and instead saw '{b}'.",
                    this, '!==', '!=');
        } else if (isPoorRelation(left)) {
            warning("Use '{a}' to compare with '{b}'.",
                    this, '!==', left.value);
        } else if (isPoorRelation(right)) {
            warning("Use '{a}' to compare with '{b}'.",
                    this, '!==', right.value);
        }
        return this;
    });
    relation('!==');
    relation('<');
    relation('>');
    relation('<=');
    relation('>=');
    bitwise('<<', 'shiftleft', 120);
    bitwise('>>', 'shiftright', 120);
    bitwise('>>>', 'shiftrightunsigned', 120);
    infix('in', 'in', 120);
    infix('instanceof', 'instanceof', 120);
    infix('+', function (left, that) {
        var right = expression(130);
        if (left && right && left.id === '(string)' && right.id === '(string)') {
            left.value += right.value;
            left.character = right.character;
            if (!option.scripturl && jx.test(left.value)) {
                warning("JavaScript URL.", left);
            }
            return left;
        }
        that.left = left;
        that.right = right;
        return that;
    }, 130);
    prefix('+', 'num');
    prefix('+++', function () {
        warning("Confusing pluses.");
        this.right = expression(150);
        this.arity = 'unary';
        return this;
    });
    infix('+++', function (left) {
        warning("Confusing pluses.");
        this.left = left;
        this.right = expression(130);
        return this;
    }, 130);
    infix('-', 'sub', 130);
    prefix('-', 'neg');
    prefix('---', function () {
        warning("Confusing minuses.");
        this.right = expression(150);
        this.arity = 'unary';
        return this;
    });
    infix('---', function (left) {
        warning("Confusing minuses.");
        this.left = left;
        this.right = expression(130);
        return this;
    }, 130);
    infix('*', 'mult', 140);
    infix('/', 'div', 140);
    infix('%', 'mod', 140);

    suffix('++', 'postinc');
    prefix('++', 'preinc');
    syntax['++'].exps = true;

    suffix('--', 'postdec');
    prefix('--', 'predec');
    syntax['--'].exps = true;
    prefix('delete', function () {
        var p = expression(0);
        if (!p || (p.id !== '.' && p.id !== '[')) {
            warning("Variables should not be deleted.");
        }
        this.first = p;
        return this;
    }).exps = true;

    prefix('~', function () {
        if (option.bitwise) {
            warning("Unexpected '{a}'.", this, '~');
        }
        expression(150);
        return this;
    });

    prefix('!', function () {
        this.right = expression(150);
        this.arity = 'unary';
        if (bang[this.right.id] === true) {
            warning("Confusing use of '{a}'.", this, '!');
        }
        return this;
    });
    prefix('typeof', 'typeof');
    prefix('new', function () {
        var c = expression(155), i;
        if (c && c.id !== 'function') {
            if (c.identifier) {
                c['new'] = true;
                switch (c.value) {
                case 'Object':
                    warning("Use the object literal notation {}.", token);
                    break;
                case 'Number':
                case 'String':
                case 'Boolean':
                case 'Math':
                case 'JSON':
                    warning("Do not use {a} as a constructor.", token, c.value);
                    break;
                case 'Function':
                    if (!option.evil) {
                        warning("The Function constructor is eval.");
                    }
                    break;
                case 'Date':
                case 'RegExp':
                    break;
                default:
                    if (c.id !== 'function') {
                        i = c.value.substr(0, 1);
                        if (option.newcap && (i < 'A' || i > 'Z')) {
                            warning("A constructor name should start with "+
                                "an uppercase letter.", token);
                        }
                    }
                }
            } else {
                if (c.id !== '.' && c.id !== '[' && c.id !== '(') {
                    warning("Bad constructor.", token);
                }
            }
        } else {
            if (!option.supernew)
                warning("Weird construction. Delete 'new'.", this);
        }
        adjacent(token, nexttoken);
        if (nexttoken.id !== '(' && !option.supernew) {
            warning("Missing '()' invoking a constructor.");
        }
        this.first = c;
        return this;
    });
    syntax['new'].exps = true;

    prefix('void').exps = true;

    infix('.', function (left, that) {
        adjacent(prevtoken, token);
        nobreak();
        var m = identifier();
        if (typeof m === 'string') {
            countMember(m);
        }
        that.left = left;
        that.right = m;
        if (option.noarg && left && left.value === 'arguments' &&
                (m === 'callee' || m === 'caller')) {
            warning("Avoid arguments.{a}.", left, m);
        } else if (!option.evil && left && left.value === 'document' &&
                (m === 'write' || m === 'writeln')) {
            warning("document.write can be a form of eval.", left);
        }
        if (!option.evil && (m === 'eval' || m === 'execScript')) {
            warning('eval is evil.');
        }
        return that;
    }, 160, true);

    infix('(', function (left, that) {
        if (prevtoken.id !== '}' && prevtoken.id !== ')') {
            nobreak(prevtoken, token);
        }
        nospace();
        if (option.immed && !left.immed && left.id === 'function') {
            warning("Wrap an immediate function invocation in parentheses " +
                "to assist the reader in understanding that the expression " +
                "is the result of a function, and not the function itself.");
        }
        var n = 0,
            p = [];
        if (left) {
            if (left.type === '(identifier)') {
                if (left.value.match(/^[A-Z]([A-Z0-9_$]*[a-z][A-Za-z0-9_$]*)?$/)) {
                    if (left.value !== 'Number' && left.value !== 'String' &&
                            left.value !== 'Boolean' &&
                            left.value !== 'Date') {
                        if (left.value === 'Math') {
                            warning("Math is not a function.", left);
                        } else if (option.newcap) {
                            warning(
"Missing 'new' prefix when invoking a constructor.", left);
                        }
                    }
                }
            }
        }
        if (nexttoken.id !== ')') {
            for (;;) {
                p[p.length] = expression(10);
                n += 1;
                if (nexttoken.id !== ',') {
                    break;
                }
                comma();
            }
        }
        advance(')');
        nospace(prevtoken, token);
        if (typeof left === 'object') {
            if (left.value === 'parseInt' && n === 1) {
                warning("Missing radix parameter.", left);
            }
            if (!option.evil) {
                if (left.value === 'eval' || left.value === 'Function' ||
                        left.value === 'execScript') {
                    warning("eval is evil.", left);
                } else if (p[0] && p[0].id === '(string)' &&
                       (left.value === 'setTimeout' ||
                        left.value === 'setInterval')) {
                    warning(
    "Implied eval is evil. Pass a function instead of a string.", left);
                }
            }
            if (!left.identifier && left.id !== '.' && left.id !== '[' &&
                    left.id !== '(' && left.id !== '&&' && left.id !== '||' &&
                    left.id !== '?') {
                warning("Bad invocation.", left);
            }
        }
        that.left = left;
        return that;
    }, 155, true).exps = true;

    prefix('(', function () {
        nospace();
        if (nexttoken.id === 'function') {
            nexttoken.immed = true;
        }
        var v = expression(0);
        advance(')', this);
        nospace(prevtoken, token);
        if (option.immed && v.id === 'function') {
            if (nexttoken.id === '(') {
                warning(
"Move the invocation into the parens that contain the function.", nexttoken);
            } else {
                warning(
"Do not wrap function literals in parens unless they are to be immediately invoked.",
                        this);
            }
        }
        return v;
    });

    infix('[', function (left, that) {
        nobreak(prevtoken, token);
        nospace();
        var e = expression(0), s;
        if (e && e.type === '(string)') {
            if (!option.evil && (e.value === 'eval' || e.value === 'execScript')) {
                warning("eval is evil.", that);
            }
            countMember(e.value);
            if (!option.sub && ix.test(e.value)) {
                s = syntax[e.value];
                if (!s || !s.reserved) {
                    warning("['{a}'] is better written in dot notation.",
                            e, e.value);
                }
            }
        }
        advance(']', that);
        nospace(prevtoken, token);
        that.left = left;
        that.right = e;
        return that;
    }, 160, true);

    prefix('[', function () {
        var b = token.line !== nexttoken.line;
        this.first = [];
        if (b) {
            indent += option.indent;
            if (nexttoken.from === indent + option.indent) {
                indent += option.indent;
            }
        }
        while (nexttoken.id !== '(end)') {
            while (nexttoken.id === ',') {
                warning("Extra comma.");
                advance(',');
            }
            if (nexttoken.id === ']') {
                break;
            }
            if (b && token.line !== nexttoken.line) {
                indentation();
            }
            this.first.push(expression(10));
            if (nexttoken.id === ',') {
                comma();
                if (nexttoken.id === ']' && !option.es5) {
                    warning("Extra comma.", token);
                    break;
                }
            } else {
                break;
            }
        }
        if (b) {
            indent -= option.indent;
            indentation();
        }
        advance(']', this);
        return this;
    }, 160);


    function property_name() {
        var id = optionalidentifier(true);
        if (!id) {
            if (nexttoken.id === '(string)') {
                id = nexttoken.value;
                advance();
            } else if (nexttoken.id === '(number)') {
                id = nexttoken.value.toString();
                advance();
            }
        }
        return id;
    }


    function functionparams() {
        var i, t = nexttoken, p = [];
        advance('(');
        nospace();
        if (nexttoken.id === ')') {
            advance(')');
            nospace(prevtoken, token);
            return;
        }
        for (;;) {
            i = identifier(true);
            p.push(i);
            addlabel(i, 'parameter');
            if (nexttoken.id === ',') {
                comma();
            } else {
                advance(')', t);
                nospace(prevtoken, token);
                return p;
            }
        }
    }


    function doFunction(i, statement) {
        var f,
            oldOption = option,
            oldScope  = scope;

        option = Object.create(option);
        scope = Object.create(scope);

        funct = {
            '(name)'     : i || '"' + anonname + '"',
            '(line)'     : nexttoken.line,
            '(context)'  : funct,
            '(breakage)' : 0,
            '(loopage)'  : 0,
            '(scope)'    : scope,
            '(statement)': statement
        };
        f = funct;
        token.funct = funct;
        functions.push(funct);
        if (i) {
            addlabel(i, 'function');
        }
        funct['(params)'] = functionparams();

        block(false);
        scope = oldScope;
        option = oldOption;
        funct['(last)'] = token.line;
        funct = funct['(context)'];
        return f;
    }


    (function (x) {
        x.nud = function () {
            var b, f, i, j, p, seen = {}, t;

            b = token.line !== nexttoken.line;
            if (b) {
                indent += option.indent;
                if (nexttoken.from === indent + option.indent) {
                    indent += option.indent;
                }
            }
            for (;;) {
                if (nexttoken.id === '}') {
                    break;
                }
                if (b) {
                    indentation();
                }
                if (nexttoken.value === 'get' && peek().id !== ':') {
                    advance('get');
                    if (!option.es5) {
                        error("get/set are ES5 features.");
                    }
                    i = property_name();
                    if (!i) {
                        error("Missing property name.");
                    }
                    t = nexttoken;
                    adjacent(token, nexttoken);
                    f = doFunction();
                    if (!option.loopfunc && funct['(loopage)']) {
                        warning("Don't make functions within a loop.", t);
                    }
                    p = f['(params)'];
                    if (p) {
                        warning("Unexpected parameter '{a}' in get {b} function.", t, p[0], i);
                    }
                    adjacent(token, nexttoken);
                    advance(',');
                    indentation();
                    advance('set');
                    j = property_name();
                    if (i !== j) {
                        error("Expected {a} and instead saw {b}.", token, i, j);
                    }
                    t = nexttoken;
                    adjacent(token, nexttoken);
                    f = doFunction();
                    p = f['(params)'];
                    if (!p || p.length !== 1 || p[0] !== 'value') {
                        warning("Expected (value) in set {a} function.", t, i);
                    }
                } else {
                    i = property_name();
                    if (typeof i !== 'string') {
                        break;
                    }
                    advance(':');
                    nonadjacent(token, nexttoken);
                    expression(10);
                }
                if (seen[i] === true) {
                    warning("Duplicate member '{a}'.", nexttoken, i);
                }
                seen[i] = true;
                countMember(i);
                if (nexttoken.id === ',') {
                    comma();
                    if (nexttoken.id === ',') {
                        warning("Extra comma.", token);
                    } else if (nexttoken.id === '}' && !option.es5) {
                        warning("Extra comma.", token);
                    }
                } else {
                    break;
                }
            }
            if (b) {
                indent -= option.indent;
                indentation();
            }
            advance('}', this);
            return this;
        };
        x.fud = function () {
            error("Expected to see a statement and instead saw a block.", token);
        };
    }(delim('{')));

    var varstatement = stmt('var', function (prefix) {
        // JavaScript does not have block scope. It only has function scope. So,
        // declaring a variable in a block can have unexpected consequences.
        var id, name, value;

        if (funct['(onevar)'] && option.onevar) {
            warning("Too many var statements.");
        } else if (!funct['(global)']) {
            funct['(onevar)'] = true;
        }
        this.first = [];
        for (;;) {
            nonadjacent(token, nexttoken);
            id = identifier();
            if (funct['(global)'] && predefined[id] === false) {
                warning("Redefinition of '{a}'.", token, id);
            }
            addlabel(id, 'unused');
            if (prefix) {
                break;
            }
            name = token;
            this.first.push(token);
            if (nexttoken.id === '=') {
                nonadjacent(token, nexttoken);
                advance('=');
                nonadjacent(token, nexttoken);
                if (nexttoken.id === 'undefined') {
                    warning("It is not necessary to initialize '{a}' to 'undefined'.", token, id);
                }
                if (peek(0).id === '=' && nexttoken.identifier) {
                    error("Variable {a} was not declared correctly.",
                            nexttoken, nexttoken.value);
                }
                value = expression(0);
                name.first = value;
            }
            if (nexttoken.id !== ',') {
                break;
            }
            comma();
        }
        return this;
    });
    varstatement.exps = true;

    blockstmt('function', function () {
        if (inblock) {
            warning("Function declarations should not be placed in blocks. " +
                "Use a function expression or move the statement to the top of " +
                "the outer function.", token);

        }
        var i = identifier();
        adjacent(token, nexttoken);
        addlabel(i, 'unction');
        doFunction(i, true);
        if (nexttoken.id === '(' && nexttoken.line === token.line) {
            error(
"Function declarations are not invocable. Wrap the whole function invocation in parens.");
        }
        return this;
    });

    prefix('function', function () {
        var i = optionalidentifier();
        if (i) {
            adjacent(token, nexttoken);
        } else {
            nonadjacent(token, nexttoken);
        }
        doFunction(i);
        if (!option.loopfunc && funct['(loopage)']) {
            warning("Don't make functions within a loop.");
        }
        return this;
    });

    blockstmt('if', function () {
        var t = nexttoken;
        advance('(');
        nonadjacent(this, t);
        nospace();
        expression(20);
        if (nexttoken.id === '=') {
            if (!option.boss)
                warning("Expected a conditional expression and instead saw an assignment.");
            advance('=');
            expression(20);
        }
        advance(')', t);
        nospace(prevtoken, token);
        block(true, true);
        if (nexttoken.id === 'else') {
            nonadjacent(token, nexttoken);
            advance('else');
            if (nexttoken.id === 'if' || nexttoken.id === 'switch') {
                statement(true);
            } else {
                block(true, true);
            }
        }
        return this;
    });

    blockstmt('try', function () {
        var b, e, s;

        block(false);
        if (nexttoken.id === 'catch') {
            advance('catch');
            nonadjacent(token, nexttoken);
            advance('(');
            s = scope;
            scope = Object.create(s);
            e = nexttoken.value;
            if (nexttoken.type !== '(identifier)') {
                warning("Expected an identifier and instead saw '{a}'.",
                    nexttoken, e);
            } else {
                addlabel(e, 'exception');
            }
            advance();
            advance(')');
            block(false);
            b = true;
            scope = s;
        }
        if (nexttoken.id === 'finally') {
            advance('finally');
            block(false);
            return;
        } else if (!b) {
            error("Expected '{a}' and instead saw '{b}'.",
                    nexttoken, 'catch', nexttoken.value);
        }
        return this;
    });

    blockstmt('while', function () {
        var t = nexttoken;
        funct['(breakage)'] += 1;
        funct['(loopage)'] += 1;
        advance('(');
        nonadjacent(this, t);
        nospace();
        expression(20);
        if (nexttoken.id === '=') {
            if (!option.boss)
                warning("Expected a conditional expression and instead saw an assignment.");
            advance('=');
            expression(20);
        }
        advance(')', t);
        nospace(prevtoken, token);
        block(true, true);
        funct['(breakage)'] -= 1;
        funct['(loopage)'] -= 1;
        return this;
    }).labelled = true;

    reserve('with');

    blockstmt('switch', function () {
        var t = nexttoken,
            g = false;
        funct['(breakage)'] += 1;
        advance('(');
        nonadjacent(this, t);
        nospace();
        this.condition = expression(20);
        advance(')', t);
        nospace(prevtoken, token);
        nonadjacent(token, nexttoken);
        t = nexttoken;
        advance('{');
        nonadjacent(token, nexttoken);
        indent += option.indent;
        this.cases = [];
        for (;;) {
            switch (nexttoken.id) {
            case 'case':
                switch (funct['(verb)']) {
                case 'break':
                case 'case':
                case 'continue':
                case 'return':
                case 'switch':
                case 'throw':
                    break;
                default:
                    // You can tell JSHint that you don't use break intentionally by
                    // adding a comment /* falls through */ on a line just before
                    // the next `case`.
                    if (!ft.test(lines[nexttoken.line - 2])) {
                        warning(
                            "Expected a 'break' statement before 'case'.",
                            token);
                    }
                }
                indentation(-option.indent);
                advance('case');
                this.cases.push(expression(20));
                g = true;
                advance(':');
                funct['(verb)'] = 'case';
                break;
            case 'default':
                switch (funct['(verb)']) {
                case 'break':
                case 'continue':
                case 'return':
                case 'throw':
                    break;
                default:
                    if (!ft.test(lines[nexttoken.line - 2])) {
                        warning(
                            "Expected a 'break' statement before 'default'.",
                            token);
                    }
                }
                indentation(-option.indent);
                advance('default');
                g = true;
                advance(':');
                break;
            case '}':
                indent -= option.indent;
                indentation();
                advance('}', t);
                if (this.cases.length === 1 || this.condition.id === 'true' ||
                        this.condition.id === 'false') {
                    warning("This 'switch' should be an 'if'.", this);
                }
                funct['(breakage)'] -= 1;
                funct['(verb)'] = undefined;
                return;
            case '(end)':
                error("Missing '{a}'.", nexttoken, '}');
                return;
            default:
                if (g) {
                    switch (token.id) {
                    case ',':
                        error("Each value should have its own case label.");
                        return;
                    case ':':
                        statements();
                        break;
                    default:
                        error("Missing ':' on a case clause.", token);
                    }
                } else {
                    error("Expected '{a}' and instead saw '{b}'.",
                        nexttoken, 'case', nexttoken.value);
                }
            }
        }
    }).labelled = true;

    stmt('debugger', function () {
        if (!option.debug) {
            warning("All 'debugger' statements should be removed.");
        }
        return this;
    }).exps = true;

    (function () {
        var x = stmt('do', function () {
            funct['(breakage)'] += 1;
            funct['(loopage)'] += 1;
            this.first = block(true);
            advance('while');
            var t = nexttoken;
            nonadjacent(token, t);
            advance('(');
            nospace();
            expression(20);
            if (nexttoken.id === '=') {
                if (!option.boss)
                    warning("Expected a conditional expression and instead saw an assignment.");
                advance('=');
                expression(20);
            }
            advance(')', t);
            nospace(prevtoken, token);
            funct['(breakage)'] -= 1;
            funct['(loopage)'] -= 1;
            return this;
        });
        x.labelled = true;
        x.exps = true;
    }());

    blockstmt('for', function () {
        var s, t = nexttoken;
        funct['(breakage)'] += 1;
        funct['(loopage)'] += 1;
        advance('(');
        nonadjacent(this, t);
        nospace();
        if (peek(nexttoken.id === 'var' ? 1 : 0).id === 'in') {
            if (nexttoken.id === 'var') {
                advance('var');
                varstatement.fud.call(varstatement, true);
            } else {
                switch (funct[nexttoken.value]) {
                case 'unused':
                    funct[nexttoken.value] = 'var';
                    break;
                case 'var':
                    break;
                default:
                    warning("Bad for in variable '{a}'.",
                            nexttoken, nexttoken.value);
                }
                advance();
            }
            advance('in');
            expression(20);
            advance(')', t);
            s = block(true, true);
            if (option.forin && (s.length > 1 || typeof s[0] !== 'object' ||
                    s[0].value !== 'if')) {
                warning("The body of a for in should be wrapped in an if statement to filter " +
                        "unwanted properties from the prototype.", this);
            }
            funct['(breakage)'] -= 1;
            funct['(loopage)'] -= 1;
            return this;
        } else {
            if (nexttoken.id !== ';') {
                if (nexttoken.id === 'var') {
                    advance('var');
                    varstatement.fud.call(varstatement);
                } else {
                    for (;;) {
                        expression(0, 'for');
                        if (nexttoken.id !== ',') {
                            break;
                        }
                        comma();
                    }
                }
            }
            nolinebreak(token);
            advance(';');
            if (nexttoken.id !== ';') {
                expression(20);
                if (nexttoken.id === '=') {
                    if (!option.boss)
                        warning("Expected a conditional expression and instead saw an assignment.");
                    advance('=');
                    expression(20);
                }
            }
            nolinebreak(token);
            advance(';');
            if (nexttoken.id === ';') {
                error("Expected '{a}' and instead saw '{b}'.",
                        nexttoken, ')', ';');
            }
            if (nexttoken.id !== ')') {
                for (;;) {
                    expression(0, 'for');
                    if (nexttoken.id !== ',') {
                        break;
                    }
                    comma();
                }
            }
            advance(')', t);
            nospace(prevtoken, token);
            block(true, true);
            funct['(breakage)'] -= 1;
            funct['(loopage)'] -= 1;
            return this;
        }
    }).labelled = true;


    stmt('break', function () {
        var v = nexttoken.value;
        if (funct['(breakage)'] === 0) {
            warning("Unexpected '{a}'.", nexttoken, this.value);
        }
        nolinebreak(this);
        if (nexttoken.id !== ';') {
            if (token.line === nexttoken.line) {
                if (funct[v] !== 'label') {
                    warning("'{a}' is not a statement label.", nexttoken, v);
                } else if (scope[v] !== funct) {
                    warning("'{a}' is out of scope.", nexttoken, v);
                }
                this.first = nexttoken;
                advance();
            }
        }
        reachable('break');
        return this;
    }).exps = true;


    stmt('continue', function () {
        var v = nexttoken.value;
        if (funct['(breakage)'] === 0) {
            warning("Unexpected '{a}'.", nexttoken, this.value);
        }
        nolinebreak(this);
        if (nexttoken.id !== ';') {
            if (token.line === nexttoken.line) {
                if (funct[v] !== 'label') {
                    warning("'{a}' is not a statement label.", nexttoken, v);
                } else if (scope[v] !== funct) {
                    warning("'{a}' is out of scope.", nexttoken, v);
                }
                this.first = nexttoken;
                advance();
            }
        } else if (!funct['(loopage)']) {
            warning("Unexpected '{a}'.", nexttoken, this.value);
        }
        reachable('continue');
        return this;
    }).exps = true;


    stmt('return', function () {
        nolinebreak(this);
        if (nexttoken.id === '(regexp)') {
            warning("Wrap the /regexp/ literal in parens to disambiguate the slash operator.");
        }
        if (nexttoken.id !== ';' && !nexttoken.reach) {
            nonadjacent(token, nexttoken);
            this.first = expression(20);
        }
        reachable('return');
        return this;
    }).exps = true;


    stmt('throw', function () {
        nolinebreak(this);
        nonadjacent(token, nexttoken);
        this.first = expression(20);
        reachable('throw');
        return this;
    }).exps = true;

//  Superfluous reserved words

    reserve('class');
    reserve('const');
    reserve('enum');
    reserve('export');
    reserve('extends');
    reserve('import');
    reserve('super');

    reserve('let');
    reserve('yield');
    reserve('implements');
    reserve('interface');
    reserve('package');
    reserve('private');
    reserve('protected');
    reserve('public');
    reserve('static');


// Parse JSON

    function jsonValue() {

        function jsonObject() {
            var o = {}, t = nexttoken;
            advance('{');
            if (nexttoken.id !== '}') {
                for (;;) {
                    if (nexttoken.id === '(end)') {
                        error("Missing '}' to match '{' from line {a}.",
                                nexttoken, t.line);
                    } else if (nexttoken.id === '}') {
                        warning("Unexpected comma.", token);
                        break;
                    } else if (nexttoken.id === ',') {
                        error("Unexpected comma.", nexttoken);
                    } else if (nexttoken.id !== '(string)') {
                        warning("Expected a string and instead saw {a}.",
                                nexttoken, nexttoken.value);
                    }
                    if (o[nexttoken.value] === true) {
                        warning("Duplicate key '{a}'.",
                                nexttoken, nexttoken.value);
                    } else if ((nexttoken.value === '__proto__' &&
                        !option.proto) || (nexttoken.value === '__iterator__' &&
                        !option.iterator)) {
                            warning("The '{a}' key may produce unexpected results.",
                                nexttoken, nexttoken.value);
                    } else {
                        o[nexttoken.value] = true;
                    }
                    advance();
                    advance(':');
                    jsonValue();
                    if (nexttoken.id !== ',') {
                        break;
                    }
                    advance(',');
                }
            }
            advance('}');
        }

        function jsonArray() {
            var t = nexttoken;
            advance('[');
            if (nexttoken.id !== ']') {
                for (;;) {
                    if (nexttoken.id === '(end)') {
                        error("Missing ']' to match '[' from line {a}.",
                                nexttoken, t.line);
                    } else if (nexttoken.id === ']') {
                        warning("Unexpected comma.", token);
                        break;
                    } else if (nexttoken.id === ',') {
                        error("Unexpected comma.", nexttoken);
                    }
                    jsonValue();
                    if (nexttoken.id !== ',') {
                        break;
                    }
                    advance(',');
                }
            }
            advance(']');
        }

        switch (nexttoken.id) {
        case '{':
            jsonObject();
            break;
        case '[':
            jsonArray();
            break;
        case 'true':
        case 'false':
        case 'null':
        case '(number)':
        case '(string)':
            advance();
            break;
        case '-':
            advance('-');
            if (token.character !== nexttoken.from) {
                warning("Unexpected space after '-'.", token);
            }
            adjacent(token, nexttoken);
            advance('(number)');
            break;
        default:
            error("Expected a JSON value.", nexttoken);
        }
    }


// The actual JSHINT function itself.

    var itself = function (s, o, g) {
        var a, i, k;
        JSHINT.errors = [];
        predefined = Object.create(standard);
        combine(predefined, g || {});
        if (o) {
            a = o.predef;
            if (a) {
                if (Array.isArray(a)) {
                    for (i = 0; i < a.length; i += 1) {
                        predefined[a[i]] = true;
                    }
                } else if (typeof a === 'object') {
                    k = Object.keys(a);
                    for (i = 0; i < k.length; i += 1) {
                        predefined[k[i]] = !!a[k[i]];
                    }
                }
            }
            option = o;
        } else {
            option = {};
        }
        option.indent = option.indent || 4;
        option.maxerr = option.maxerr || 50;

        tab = '';
        for (i = 0; i < option.indent; i += 1) {
            tab += ' ';
        }
        indent = 1;
        global = Object.create(predefined);
        scope = global;
        funct = {
            '(global)': true,
            '(name)': '(global)',
            '(scope)': scope,
            '(breakage)': 0,
            '(loopage)': 0
        };
        functions = [funct];
        urls = [];
        src = false;
        stack = null;
        member = {};
        membersOnly = null;
        implied = {};
        inblock = false;
        lookahead = [];
        jsonmode = false;
        warnings = 0;
        lex.init(s);
        prereg = true;
        strict_mode = false;

        prevtoken = token = nexttoken = syntax['(begin)'];
        assume();

        try {
            advance();
            switch (nexttoken.id) {
            case '{':
            case '[':
                option.laxbreak = true;
                jsonmode = true;
                jsonValue();
                break;
            default:
                if (nexttoken.value === 'use strict') {
                    if (!option.globalstrict)
                        warning("Use the function form of \"use strict\".");
                    use_strict();
                }
                statements('lib');
            }
            advance('(end)');
        } catch (e) {
            if (e) {
                JSHINT.errors.push({
                    reason    : e.message,
                    line      : e.line || nexttoken.line,
                    character : e.character || nexttoken.from
                }, null);
            }
        }
        return JSHINT.errors.length === 0;
    };


// Data summary.

    itself.data = function () {

        var data = {functions: []}, fu, globals, implieds = [], f, i, j,
            members = [], n, unused = [], v;
        if (itself.errors.length) {
            data.errors = itself.errors;
        }

        if (jsonmode) {
            data.json = true;
        }

        for (n in implied) {
            if (is_own(implied, n)) {
                implieds.push({
                    name: n,
                    line: implied[n]
                });
            }
        }
        if (implieds.length > 0) {
            data.implieds = implieds;
        }

        if (urls.length > 0) {
            data.urls = urls;
        }

        globals = Object.keys(scope);
        if (globals.length > 0) {
            data.globals = globals;
        }

        for (i = 1; i < functions.length; i += 1) {
            f = functions[i];
            fu = {};
            for (j = 0; j < functionicity.length; j += 1) {
                fu[functionicity[j]] = [];
            }
            for (n in f) {
                if (is_own(f, n) && n.charAt(0) !== '(') {
                    v = f[n];
                    if (v === 'unction') {
                        v = 'unused';
                    }
                    if (Array.isArray(fu[v])) {
                        fu[v].push(n);
                        if (v === 'unused') {
                            unused.push({
                                name: n,
                                line: f['(line)'],
                                'function': f['(name)']
                            });
                        }
                    }
                }
            }
            for (j = 0; j < functionicity.length; j += 1) {
                if (fu[functionicity[j]].length === 0) {
                    delete fu[functionicity[j]];
                }
            }
            fu.name = f['(name)'];
            fu.param = f['(params)'];
            fu.line = f['(line)'];
            fu.last = f['(last)'];
            data.functions.push(fu);
        }

        if (unused.length > 0) {
            data.unused = unused;
        }

        members = [];
        for (n in member) {
            if (typeof member[n] === 'number') {
                data.member = member;
                break;
            }
        }

        return data;
    };

    itself.report = function (option) {
        var data = itself.data();

        var a = [], c, e, err, f, i, k, l, m = '', n, o = [], s;

        function detail(h, array) {
            var b, i, singularity;
            if (array) {
                o.push('<div><i>' + h + '</i> ');
                array = array.sort();
                for (i = 0; i < array.length; i += 1) {
                    if (array[i] !== singularity) {
                        singularity = array[i];
                        o.push((b ? ', ' : '') + singularity);
                        b = true;
                    }
                }
                o.push('</div>');
            }
        }


        if (data.errors || data.implieds || data.unused) {
            err = true;
            o.push('<div id=errors><i>Error:</i>');
            if (data.errors) {
                for (i = 0; i < data.errors.length; i += 1) {
                    c = data.errors[i];
                    if (c) {
                        e = c.evidence || '';
                        o.push('<p>Problem' + (isFinite(c.line) ? ' at line ' +
                                c.line + ' character ' + c.character : '') +
                                ': ' + c.reason.entityify() +
                                '</p><p class=evidence>' +
                                (e && (e.length > 80 ? e.slice(0, 77) + '...' :
                                e).entityify()) + '</p>');
                    }
                }
            }

            if (data.implieds) {
                s = [];
                for (i = 0; i < data.implieds.length; i += 1) {
                    s[i] = '<code>' + data.implieds[i].name + '</code>&nbsp;<i>' +
                        data.implieds[i].line + '</i>';
                }
                o.push('<p><i>Implied global:</i> ' + s.join(', ') + '</p>');
            }

            if (data.unused) {
                s = [];
                for (i = 0; i < data.unused.length; i += 1) {
                    s[i] = '<code><u>' + data.unused[i].name + '</u></code>&nbsp;<i>' +
                        data.unused[i].line + '</i> <code>' +
                        data.unused[i]['function'] + '</code>';
                }
                o.push('<p><i>Unused variable:</i> ' + s.join(', ') + '</p>');
            }
            if (data.json) {
                o.push('<p>JSON: bad.</p>');
            }
            o.push('</div>');
        }

        if (!option) {

            o.push('<br><div id=functions>');

            if (data.urls) {
                detail("URLs<br>", data.urls, '<br>');
            }

            if (data.json && !err) {
                o.push('<p>JSON: good.</p>');
            } else if (data.globals) {
                o.push('<div><i>Global</i> ' +
                        data.globals.sort().join(', ') + '</div>');
            } else {
                o.push('<div><i>No new global variables introduced.</i></div>');
            }

            for (i = 0; i < data.functions.length; i += 1) {
                f = data.functions[i];

                o.push('<br><div class=function><i>' + f.line + '-' +
                        f.last + '</i> ' + (f.name || '') + '(' +
                        (f.param ? f.param.join(', ') : '') + ')</div>');
                detail('<big><b>Unused</b></big>', f.unused);
                detail('Closure', f.closure);
                detail('Variable', f['var']);
                detail('Exception', f.exception);
                detail('Outer', f.outer);
                detail('Global', f.global);
                detail('Label', f.label);
            }

            if (data.member) {
                a = Object.keys(data.member);
                if (a.length) {
                    a = a.sort();
                    m = '<br><pre id=members>/*members ';
                    l = 10;
                    for (i = 0; i < a.length; i += 1) {
                        k = a[i];
                        n = k.name();
                        if (l + n.length > 72) {
                            o.push(m + '<br>');
                            m = '    ';
                            l = 1;
                        }
                        l += n.length + 2;
                        if (data.member[k] === 1) {
                            n = '<i>' + n + '</i>';
                        }
                        if (i < a.length - 1) {
                            n += ', ';
                        }
                        m += n;
                    }
                    o.push(m + '<br>*/</pre>');
                }
                o.push('</div>');
            }
        }
        return o.join('');
    };
    itself.jshint = itself;

    itself.edition = '2011-04-16';

    return itself;

}());

// Make JSHINT a Node module, if possible.
if (typeof exports == 'object' && exports)
    exports.JSHINT = JSHINT;

});/* -*- Mode: JS; tab-width: 4; indent-tabs-mode: nil; -*-
 * vim: set sw=4 ts=4 et tw=78:
 * ***** BEGIN LICENSE BLOCK *****
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Narcissus JavaScript engine.
 *
 * The Initial Developer of the Original Code is
 * Brendan Eich <brendan@mozilla.org>.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tom Austin <taustin@ucsc.edu>
 *   Brendan Eich <brendan@mozilla.org>
 *   Shu-Yu Guo <shu@rfrn.org>
 *   Dave Herman <dherman@mozilla.com>
 *   Dimitris Vardoulakis <dimvar@ccs.neu.edu>
 *   Patrick Walton <pcwalton@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Narcissus - JS implemented in JS.
 *
 * Parser.
 */

define('ace/narcissus/jsparse', ['require', 'exports', 'module' , 'ace/narcissus/jslex', 'ace/narcissus/jsdefs'], function(require, exports, module) {

    var lexer = require("./jslex");
    var definitions = require("./jsdefs");

    const StringMap = definitions.StringMap;
    const Stack = definitions.Stack;

    // Set constants in the local scope.
    eval(definitions.consts);

    // Banned statement types by language version.
    const blackLists = { 160: {}, 185: {}, harmony: {} };
    blackLists[160][IMPORT] = true;
    blackLists[160][EXPORT] = true;
    blackLists[160][LET] = true;
    blackLists[160][MODULE] = true;
    blackLists[160][YIELD] = true;
    blackLists[185][IMPORT] = true;
    blackLists[185][EXPORT] = true;
    blackLists[185][MODULE] = true;
    blackLists.harmony[WITH] = true;

    /*
     * pushDestructuringVarDecls :: (node, hoisting node) -> void
     *
     * Recursively add all destructured declarations to varDecls.
     */
    function pushDestructuringVarDecls(n, s) {
        for (var i in n) {
            var sub = n[i];
            if (sub.type === IDENTIFIER) {
                s.varDecls.push(sub);
            } else {
                pushDestructuringVarDecls(sub, s);
            }
        }
    }

    function StaticContext(parentScript, parentBlock, inModule, inFunction) {
        this.parentScript = parentScript;
        this.parentBlock = parentBlock || parentScript;
        this.inModule = inModule || false;
        this.inFunction = inFunction || false;
        this.inForLoopInit = false;
        this.topLevel = true;
        this.allLabels = new Stack();
        this.currentLabels = new Stack();
        this.labeledTargets = new Stack();
        this.defaultLoopTarget = null;
        this.defaultTarget = null;
        this.blackList = blackLists[Narcissus.options.version];
        Narcissus.options.ecma3OnlyMode && (this.ecma3OnlyMode = true);
        Narcissus.options.parenFreeMode && (this.parenFreeMode = true);
    }

    StaticContext.prototype = {
        ecma3OnlyMode: false,
        parenFreeMode: false,
        // non-destructive update via prototype extension
        update: function(ext) {
            var desc = {};
            for (var key in ext) {
                desc[key] = {
                    value: ext[key],
                    writable: true,
                    enumerable: true,
                    configurable: true
                }
            }
            return Object.create(this, desc);
        },
        pushLabel: function(label) {
            return this.update({ currentLabels: this.currentLabels.push(label),
                                 allLabels: this.allLabels.push(label) });
        },
        pushTarget: function(target) {
            var isDefaultLoopTarget = target.isLoop;
            var isDefaultTarget = isDefaultLoopTarget || target.type === SWITCH;

            if (this.currentLabels.isEmpty()) {
                if (isDefaultLoopTarget) this.update({ defaultLoopTarget: target });
                if (isDefaultTarget) this.update({ defaultTarget: target });
                return this;
            }

            target.labels = new StringMap();
            this.currentLabels.forEach(function(label) {
                target.labels.set(label, true);
            });
            return this.update({ currentLabels: new Stack(),
                                 labeledTargets: this.labeledTargets.push(target),
                                 defaultLoopTarget: isDefaultLoopTarget
                                                    ? target
                                                    : this.defaultLoopTarget,
                                 defaultTarget: isDefaultTarget
                                                ? target
                                                : this.defaultTarget });
        },
        nest: function() {
            return this.topLevel ? this.update({ topLevel: false }) : this;
        },
        allow: function(type) {
            switch (type) {
              case EXPORT:
                if (!this.inModule || this.inFunction || !this.topLevel)
                    return false;
                // FALL THROUGH

              case IMPORT:
                return !this.inFunction && this.topLevel;

              case MODULE:
                return !this.inFunction && this.topLevel;

              default:
                return true;
            }
        }
    };

    /*
     * Script :: (tokenizer, boolean, boolean) -> node
     *
     * Parses the toplevel and module/function bodies.
     */
    function Script(t, inModule, inFunction) {
        var n = new Node(t, scriptInit());
        Statements(t, new StaticContext(n, n, inModule, inFunction), n);
        return n;
    }

    // We extend Array slightly with a top-of-stack method.
    definitions.defineProperty(Array.prototype, "top",
                               function() {
                                   return this.length && this[this.length-1];
                               }, false, false, true);

    /*
     * Node :: (tokenizer, optional init object) -> node
     */
    function Node(t, init) {
        var token = t.token;
        if (token) {
            // If init.type exists it will override token.type.
            this.type = token.type;
            this.value = token.value;
            this.lineno = token.lineno;

            // Start and end are file positions for error handling.
            this.start = token.start;
            this.end = token.end;
        } else {
            this.lineno = t.lineno;
        }

        // Node uses a tokenizer for debugging (getSource, filename getter).
        this.tokenizer = t;
        this.children = [];

        for (var prop in init)
            this[prop] = init[prop];
    }

    /*
     * SyntheticNode :: (tokenizer, optional init object) -> node
     */
    function SyntheticNode(t, init) {
        // print("SYNTHETIC NODE");
        // if (init.type === COMMA) {
        //     print("SYNTHETIC COMMA");
        //     print(init);
        // }
        this.tokenizer = t;
        this.children = [];
        for (var prop in init)
            this[prop] = init[prop];
        this.synthetic = true;
    }

    var Np = Node.prototype = SyntheticNode.prototype = {};
    Np.constructor = Node;

    const TO_SOURCE_SKIP = {
        type: true,
        value: true,
        lineno: true,
        start: true,
        end: true,
        tokenizer: true,
        assignOp: true
    };
    function unevalableConst(code) {
        var token = definitions.tokens[code];
        var constName = definitions.opTypeNames.hasOwnProperty(token)
                      ? definitions.opTypeNames[token]
                      : token in definitions.keywords
                      ? token.toUpperCase()
                      : token;
        return { toSource: function() { return constName } };
    }
    Np.toSource = function toSource() {
        var mock = {};
        var self = this;
        mock.type = unevalableConst(this.type);
        if ("value" in this)
            mock.value = this.value;
        if ("lineno" in this)
            mock.lineno = this.lineno;
        if ("start" in this)
            mock.start = this.start;
        if ("end" in this)
            mock.end = this.end;
        if (this.assignOp)
            mock.assignOp = unevalableConst(this.assignOp);
        for (var key in this) {
            if (this.hasOwnProperty(key) && !(key in TO_SOURCE_SKIP))
                mock[key] = this[key];
        }
        return mock.toSource();
    };

    // Always use push to add operands to an expression, to update start and end.
    Np.push = function (kid) {
        // kid can be null e.g. [1, , 2].
        if (kid !== null) {
            if (kid.start < this.start)
                this.start = kid.start;
            if (this.end < kid.end)
                this.end = kid.end;
        }
        return this.children.push(kid);
    }

    Node.indentLevel = 0;

    function tokenString(tt) {
        var t = definitions.tokens[tt];
        return /^\W/.test(t) ? definitions.opTypeNames[t] : t.toUpperCase();
    }

    Np.toString = function () {
        var a = [];
        for (var i in this) {
            if (this.hasOwnProperty(i) && i !== 'type' && i !== 'target')
                a.push({id: i, value: this[i]});
        }
        a.sort(function (a,b) { return (a.id < b.id) ? -1 : 1; });
        const INDENTATION = "    ";
        var n = ++Node.indentLevel;
        var s = "{\n" + INDENTATION.repeat(n) + "type: " + tokenString(this.type);
        for (i = 0; i < a.length; i++)
            s += ",\n" + INDENTATION.repeat(n) + a[i].id + ": " + a[i].value;
        n = --Node.indentLevel;
        s += "\n" + INDENTATION.repeat(n) + "}";
        return s;
    }

    Np.getSource = function () {
        return this.tokenizer.source.slice(this.start, this.end);
    };

    /*
     * Helper init objects for common nodes.
     */

    const LOOP_INIT = { isLoop: true };

    function blockInit() {
        return { type: BLOCK, varDecls: [] };
    }

    function scriptInit() {
        return { type: SCRIPT,
                 funDecls: [],
                 varDecls: [],
                 modDefns: new StringMap(),
                 modAssns: new StringMap(),
                 modDecls: new StringMap(),
                 modLoads: new StringMap(),
                 impDecls: [],
                 expDecls: [],
                 exports: new StringMap(),
                 hasEmptyReturn: false,
                 hasReturnWithValue: false,
                 isGenerator: false };
    }

    definitions.defineGetter(Np, "filename",
                             function() {
                                 return this.tokenizer.filename;
                             });

    definitions.defineGetter(Np, "length",
                             function() {
                                 throw new Error("Node.prototype.length is gone; " +
                                                 "use n.children.length instead");
                             });

    definitions.defineProperty(String.prototype, "repeat",
                               function(n) {
                                   var s = "", t = this + s;
                                   while (--n >= 0)
                                       s += t;
                                   return s;
                               }, false, false, true);

    function MaybeLeftParen(t, x) {
        if (x.parenFreeMode)
            return t.match(LEFT_PAREN) ? LEFT_PAREN : END;
        return t.mustMatch(LEFT_PAREN).type;
    }

    function MaybeRightParen(t, p) {
        if (p === LEFT_PAREN)
            t.mustMatch(RIGHT_PAREN);
    }

    /*
     * Statements :: (tokenizer, compiler context, node) -> void
     *
     * Parses a sequence of Statements.
     */
    function Statements(t, x, n) {
        try {
            while (!t.done && t.peek(true) !== RIGHT_CURLY)
                n.push(Statement(t, x));
        } catch (e) {
            if (t.done)
                t.unexpectedEOF = true;
            throw e;
        }
    }

    function Block(t, x) {
        t.mustMatch(LEFT_CURLY);
        var n = new Node(t, blockInit());
        Statements(t, x.update({ parentBlock: n }).pushTarget(n), n);
        t.mustMatch(RIGHT_CURLY);
        return n;
    }

    const DECLARED_FORM = 0, EXPRESSED_FORM = 1, STATEMENT_FORM = 2;

    /*
     * Export :: (binding node, boolean) -> Export
     *
     * Static semantic representation of a module export.
     */
    function Export(node, isDefinition) {
        this.node = node;                 // the AST node declaring this individual export
        this.isDefinition = isDefinition; // is the node an 'export'-annotated definition?
        this.resolved = null;             // resolved pointer to the target of this export
    }

    /*
     * registerExport :: (StringMap, EXPORT node) -> void
     */
    function registerExport(exports, decl) {
        function register(name, exp) {
            if (exports.has(name))
                throw new SyntaxError("multiple exports of " + name);
            exports.set(name, exp);
        }

        switch (decl.type) {
          case MODULE:
          case FUNCTION:
            register(decl.name, new Export(decl, true));
            break;

          case VAR:
            for (var i = 0; i < decl.children.length; i++)
                register(decl.children[i].name, new Export(decl.children[i], true));
            break;

          case LET:
          case CONST:
            throw new Error("NYI: " + definitions.tokens[decl.type]);

          case EXPORT:
            for (var i = 0; i < decl.pathList.length; i++) {
                var path = decl.pathList[i];
                switch (path.type) {
                  case OBJECT_INIT:
                    for (var j = 0; j < path.children.length; j++) {
                        // init :: IDENTIFIER | PROPERTY_INIT
                        var init = path.children[j];
                        if (init.type === IDENTIFIER)
                            register(init.value, new Export(init, false));
                        else
                            register(init.children[0].value, new Export(init.children[1], false));
                    }
                    break;

                  case DOT:
                    register(path.children[1].value, new Export(path, false));
                    break;

                  case IDENTIFIER:
                    register(path.value, new Export(path, false));
                    break;

                  default:
                    throw new Error("unexpected export path: " + definitions.tokens[path.type]);
                }
            }
            break;

          default:
            throw new Error("unexpected export decl: " + definitions.tokens[exp.type]);
        }
    }

    /*
     * Module :: (node) -> Module
     *
     * Static semantic representation of a module.
     */
    function Module(node) {
        var exports = node.body.exports;
        var modDefns = node.body.modDefns;

        var exportedModules = new StringMap();

        exports.forEach(function(name, exp) {
            var node = exp.node;
            if (node.type === MODULE) {
                exportedModules.set(name, node);
            } else if (!exp.isDefinition && node.type === IDENTIFIER && modDefns.has(node.value)) {
                var mod = modDefns.get(node.value);
                exportedModules.set(name, mod);
            }
        });

        this.node = node;
        this.exports = exports;
        this.exportedModules = exportedModules;
    }

    /*
     * Statement :: (tokenizer, compiler context) -> node
     *
     * Parses a Statement.
     */
    function Statement(t, x) {
        var i, label, n, n2, p, c, ss, tt = t.get(true), tt2, x2, x3;

        var comments = t.blockComments;

        if (x.blackList[tt])
            throw t.newSyntaxError(definitions.tokens[tt] + " statements only allowed in Harmony");
        if (!x.allow(tt))
            throw t.newSyntaxError(definitions.tokens[tt] + " statement in illegal context");

        // Cases for statements ending in a right curly return early, avoiding the
        // common semicolon insertion magic after this switch.
        switch (tt) {
          case IMPORT:
            n = new Node(t);
            n.pathList = ImportPathList(t, x);
            x.parentScript.impDecls.push(n);
            break;

          case EXPORT:
            switch (t.peek()) {
              case MODULE:
              case FUNCTION:
              case LET:
              case VAR:
              case CONST:
                n = Statement(t, x);
                n.blockComments = comments;
                n.exported = true;
                x.parentScript.expDecls.push(n);
                registerExport(x.parentScript.exports, n);
                return n;

              default:
                n = new Node(t);
                n.pathList = ExportPathList(t, x);
                break;
            }
            x.parentScript.expDecls.push(n);
            registerExport(x.parentScript.exports, n);
            break;

          case MODULE:
            n = new Node(t);
            n.blockComments = comments;
            t.mustMatch(IDENTIFIER);
            label = t.token.value;

            if (t.match(LEFT_CURLY)) {
                n.name = label;
                n.body = Script(t, true, false);
                n.module = new Module(n);
                t.mustMatch(RIGHT_CURLY);
                x.parentScript.modDefns.set(n.name, n);
                return n;
            }

            t.unget();
            ModuleVariables(t, x, n);
            return n;

          case FUNCTION:
            // DECLARED_FORM extends funDecls of x, STATEMENT_FORM doesn't.
            return FunctionDefinition(t, x, true, x.topLevel ? DECLARED_FORM : STATEMENT_FORM, comments);

          case LEFT_CURLY:
            n = new Node(t, blockInit());
            Statements(t, x.update({ parentBlock: n }).pushTarget(n).nest(), n);
            t.mustMatch(RIGHT_CURLY);
            return n;

          case IF:
            n = new Node(t);
            n.condition = HeadExpression(t, x);
            x2 = x.pushTarget(n).nest();
            n.thenPart = Statement(t, x2);
            n.elsePart = t.match(ELSE, true) ? Statement(t, x2) : null;
            return n;

          case SWITCH:
            // This allows CASEs after a DEFAULT, which is in the standard.
            n = new Node(t, { cases: [], defaultIndex: -1 });
            n.discriminant = HeadExpression(t, x);
            x2 = x.pushTarget(n).nest();
            t.mustMatch(LEFT_CURLY);
            while ((tt = t.get()) !== RIGHT_CURLY) {
                switch (tt) {
                  case DEFAULT:
                    if (n.defaultIndex >= 0)
                        throw t.newSyntaxError("More than one switch default");
                    // FALL THROUGH
                  case CASE:
                    n2 = new Node(t);
                    if (tt === DEFAULT)
                        n.defaultIndex = n.cases.length;
                    else
                        n2.caseLabel = Expression(t, x2, COLON);
                    break;

                  default:
                    throw t.newSyntaxError("Invalid switch case");
                }
                t.mustMatch(COLON);
                n2.statements = new Node(t, blockInit());
                while ((tt=t.peek(true)) !== CASE && tt !== DEFAULT &&
                        tt !== RIGHT_CURLY)
                    n2.statements.push(Statement(t, x2));
                n.cases.push(n2);
            }
            return n;

          case FOR:
            n = new Node(t, LOOP_INIT);
            n.blockComments = comments;
            if (t.match(IDENTIFIER)) {
                if (t.token.value === "each")
                    n.isEach = true;
                else
                    t.unget();
            }
            if (!x.parenFreeMode)
                t.mustMatch(LEFT_PAREN);
            x2 = x.pushTarget(n).nest();
            x3 = x.update({ inForLoopInit: true });
            n2 = null;
            if ((tt = t.peek(true)) !== SEMICOLON) {
                if (tt === VAR || tt === CONST) {
                    t.get();
                    n2 = Variables(t, x3);
                } else if (tt === LET) {
                    t.get();
                    if (t.peek() === LEFT_PAREN) {
                        n2 = LetBlock(t, x3, false);
                    } else {
                        // Let in for head, we need to add an implicit block
                        // around the rest of the for.
                        x3.parentBlock = n;
                        n.varDecls = [];
                        n2 = Variables(t, x3);
                    }
                } else {
                    n2 = Expression(t, x3);
                }
            }
            if (n2 && t.match(IN)) {
                n.type = FOR_IN;
                n.object = Expression(t, x3);
                if (n2.type === VAR || n2.type === LET) {
                    c = n2.children;

                    // Destructuring turns one decl into multiples, so either
                    // there must be only one destructuring or only one
                    // decl.
                    if (c.length !== 1 && n2.destructurings.length !== 1) {
                        throw new SyntaxError("Invalid for..in left-hand side",
                                              t.filename, n2.lineno);
                    }
                    if (n2.destructurings.length > 0) {
                        n.iterator = n2.destructurings[0];
                    } else {
                        n.iterator = c[0];
                    }
                    n.varDecl = n2;
                } else {
                    if (n2.type === ARRAY_INIT || n2.type === OBJECT_INIT) {
                        n2.destructuredNames = checkDestructuring(t, x3, n2);
                    }
                    n.iterator = n2;
                }
            } else {
                x3.inForLoopInit = false;
                n.setup = n2;
                t.mustMatch(SEMICOLON);
                if (n.isEach)
                    throw t.newSyntaxError("Invalid for each..in loop");
                n.condition = (t.peek(true) === SEMICOLON)
                              ? null
                              : Expression(t, x3);
                t.mustMatch(SEMICOLON);
                tt2 = t.peek(true);
                n.update = (x.parenFreeMode
                            ? tt2 === LEFT_CURLY || definitions.isStatementStartCode[tt2]
                            : tt2 === RIGHT_PAREN)
                           ? null
                           : Expression(t, x3);
            }
            if (!x.parenFreeMode)
                t.mustMatch(RIGHT_PAREN);
            n.body = Statement(t, x2);
            return n;

          case WHILE:
            n = new Node(t, { isLoop: true });
            n.blockComments = comments;
            n.condition = HeadExpression(t, x);
            n.body = Statement(t, x.pushTarget(n).nest());
            return n;

          case DO:
            n = new Node(t, { isLoop: true });
            n.blockComments = comments;
            n.body = Statement(t, x.pushTarget(n).nest());
            t.mustMatch(WHILE);
            n.condition = HeadExpression(t, x);
            if (!x.ecmaStrictMode) {
                // <script language="JavaScript"> (without version hints) may need
                // automatic semicolon insertion without a newline after do-while.
                // See http://bugzilla.mozilla.org/show_bug.cgi?id=238945.
                t.match(SEMICOLON);
                return n;
            }
            break;

          case BREAK:
          case CONTINUE:
            n = new Node(t);
            n.blockComments = comments;

            // handle the |foo: break foo;| corner case
            x2 = x.pushTarget(n);

            if (t.peekOnSameLine() === IDENTIFIER) {
                t.get();
                n.label = t.token.value;
            }

            if (n.label) {
                n.target = x2.labeledTargets.find(function(target) { return target.labels.has(n.label) });
            } else if (tt === CONTINUE) {
                n.target = x2.defaultLoopTarget;
            } else {
                n.target = x2.defaultTarget;
            }

            if (!n.target)
                throw t.newSyntaxError("Invalid " + ((tt === BREAK) ? "break" : "continue"));
            if (!n.target.isLoop && tt === CONTINUE)
                throw t.newSyntaxError("Invalid continue");

            break;

          case TRY:
            n = new Node(t, { catchClauses: [] });
            n.blockComments = comments;
            n.tryBlock = Block(t, x);
            while (t.match(CATCH)) {
                n2 = new Node(t);
                p = MaybeLeftParen(t, x);
                switch (t.get()) {
                  case LEFT_BRACKET:
                  case LEFT_CURLY:
                    // Destructured catch identifiers.
                    t.unget();
                    n2.varName = DestructuringExpression(t, x, true);
                    break;
                  case IDENTIFIER:
                    n2.varName = t.token.value;
                    break;
                  default:
                    throw t.newSyntaxError("missing identifier in catch");
                    break;
                }
                if (t.match(IF)) {
                    if (x.ecma3OnlyMode)
                        throw t.newSyntaxError("Illegal catch guard");
                    if (n.catchClauses.length && !n.catchClauses.top().guard)
                        throw t.newSyntaxError("Guarded catch after unguarded");
                    n2.guard = Expression(t, x);
                }
                MaybeRightParen(t, p);
                n2.block = Block(t, x);
                n.catchClauses.push(n2);
            }
            if (t.match(FINALLY))
                n.finallyBlock = Block(t, x);
            if (!n.catchClauses.length && !n.finallyBlock)
                throw t.newSyntaxError("Invalid try statement");
            return n;

          case CATCH:
          case FINALLY:
            throw t.newSyntaxError(definitions.tokens[tt] + " without preceding try");

          case THROW:
            n = new Node(t);
            n.exception = Expression(t, x);
            break;

          case RETURN:
            n = ReturnOrYield(t, x);
            break;

          case WITH:
            n = new Node(t);
            n.blockComments = comments;
            n.object = HeadExpression(t, x);
            n.body = Statement(t, x.pushTarget(n).nest());
            return n;

          case VAR:
          case CONST:
            n = Variables(t, x);
            break;

          case LET:
            if (t.peek() === LEFT_PAREN)
                n = LetBlock(t, x, true);
            else
                n = Variables(t, x);
            break;

          case DEBUGGER:
            n = new Node(t);
            break;

          case NEWLINE:
          case SEMICOLON:
            n = new Node(t, { type: SEMICOLON });
            n.blockComments = comments;
            n.expression = null;
            return n;

          default:
            if (tt === IDENTIFIER) {
                tt = t.peek();
                // Labeled statement.
                if (tt === COLON) {
                    label = t.token.value;
                    if (x.allLabels.has(label))
                        throw t.newSyntaxError("Duplicate label");
                    t.get();
                    n = new Node(t, { type: LABEL, label: label });
                    n.blockComments = comments;
                    n.statement = Statement(t, x.pushLabel(label).nest());
                    n.target = (n.statement.type === LABEL) ? n.statement.target : n.statement;
                    return n;
                }
            }

            // Expression statement.
            // We unget the current token to parse the expression as a whole.
            n = new Node(t, { type: SEMICOLON });
            t.unget();
            n.blockComments = comments;
            n.expression = Expression(t, x);
            n.end = n.expression.end;
            break;
        }

        n.blockComments = comments;
        MagicalSemicolon(t);
        return n;
    }

    /*
     * MagicalSemicolon :: (tokenizer) -> void
     */
    function MagicalSemicolon(t) {
        var tt;
        if (t.lineno === t.token.lineno) {
            tt = t.peekOnSameLine();
            if (tt !== END && tt !== NEWLINE && tt !== SEMICOLON && tt !== RIGHT_CURLY)
                throw t.newSyntaxError("missing ; before statement");
        }
        t.match(SEMICOLON);
    }

    /*
     * ReturnOrYield :: (tokenizer, compiler context) -> (RETURN | YIELD) node
     */
    function ReturnOrYield(t, x) {
        var n, b, tt = t.token.type, tt2;

        var parentScript = x.parentScript;

        if (tt === RETURN) {
            if (!x.inFunction)
                throw t.newSyntaxError("Return not in function");
        } else /* if (tt === YIELD) */ {
            if (!x.inFunction)
                throw t.newSyntaxError("Yield not in function");
            parentScript.isGenerator = true;
        }
        n = new Node(t, { value: undefined });

        tt2 = (tt === RETURN) ? t.peekOnSameLine(true) : t.peek(true);
        if (tt2 !== END && tt2 !== NEWLINE &&
            tt2 !== SEMICOLON && tt2 !== RIGHT_CURLY
            && (tt !== YIELD ||
                (tt2 !== tt && tt2 !== RIGHT_BRACKET && tt2 !== RIGHT_PAREN &&
                 tt2 !== COLON && tt2 !== COMMA))) {
            if (tt === RETURN) {
                n.value = Expression(t, x);
                parentScript.hasReturnWithValue = true;
            } else {
                n.value = AssignExpression(t, x);
            }
        } else if (tt === RETURN) {
            parentScript.hasEmptyReturn = true;
        }

        // Disallow return v; in generator.
        if (parentScript.hasReturnWithValue && parentScript.isGenerator)
            throw t.newSyntaxError("Generator returns a value");

        return n;
    }

    /*
     * ModuleExpression :: (tokenizer, compiler context) -> (STRING | IDENTIFIER | DOT) node
     */
    function ModuleExpression(t, x) {
        return t.match(STRING) ? new Node(t) : QualifiedPath(t, x);
    }

    /*
     * ImportPathList :: (tokenizer, compiler context) -> Array[DOT node]
     */
    function ImportPathList(t, x) {
        var a = [];
        do {
            a.push(ImportPath(t, x));
        } while (t.match(COMMA));
        return a;
    }

    /*
     * ImportPath :: (tokenizer, compiler context) -> DOT node
     */
    function ImportPath(t, x) {
        var n = QualifiedPath(t, x);
        if (!t.match(DOT)) {
            if (n.type === IDENTIFIER)
                throw t.newSyntaxError("cannot import local variable");
            return n;
        }

        var n2 = new Node(t);
        n2.push(n);
        n2.push(ImportSpecifierSet(t, x));
        return n2;
    }

    /*
     * ExplicitSpecifierSet :: (tokenizer, compiler context, (tokenizer, compiler context) -> node)
     *                      -> OBJECT_INIT node
     */
    function ExplicitSpecifierSet(t, x, SpecifierRHS) {
        var n, n2, id, tt;

        n = new Node(t, { type: OBJECT_INIT });
        t.mustMatch(LEFT_CURLY);

        if (!t.match(RIGHT_CURLY)) {
            do {
                id = Identifier(t, x);
                if (t.match(COLON)) {
                    n2 = new Node(t, { type: PROPERTY_INIT });
                    n2.push(id);
                    n2.push(SpecifierRHS(t, x));
                    n.push(n2);
                } else {
                    n.push(id);
                }
            } while (!t.match(RIGHT_CURLY) && t.mustMatch(COMMA));
        }

        return n;
    }

    /*
     * ImportSpecifierSet :: (tokenizer, compiler context) -> (IDENTIFIER | OBJECT_INIT) node
     */
    function ImportSpecifierSet(t, x) {
        return t.match(MUL)
             ? new Node(t, { type: IDENTIFIER, name: "*" })
             : ExplicitSpecifierSet(t, x, Identifier);
    }

    /*
     * Identifier :: (tokenizer, compiler context) -> IDENTIFIER node
     */
    function Identifier(t, x) {
        t.mustMatch(IDENTIFIER);
        return new Node(t, { type: IDENTIFIER });
    }

    /*
     * IdentifierName :: (tokenizer) -> IDENTIFIER node
     */
    function IdentifierName(t) {
        if (t.match(IDENTIFIER))
            return new Node(t, { type: IDENTIFIER });
        t.get();
        if (t.token.value in definitions.keywords)
            return new Node(t, { type: IDENTIFIER });
        throw t.newSyntaxError("missing IdentifierName");
    }

    /*
     * QualifiedPath :: (tokenizer, compiler context) -> (IDENTIFIER | DOT) node
     */
    function QualifiedPath(t, x) {
        var n, n2;

        n = Identifier(t, x);

        while (t.match(DOT)) {
            if (t.peek() !== IDENTIFIER) {
                // Unget the '.' token, which isn't part of the QualifiedPath.
                t.unget();
                break;
            }
            n2 = new Node(t);
            n2.push(n);
            n2.push(Identifier(t, x));
            n = n2;
        }

        return n;
    }

    /*
     * ExportPath :: (tokenizer, compiler context) -> (IDENTIFIER | DOT | OBJECT_INIT) node
     */
    function ExportPath(t, x) {
        if (t.peek() === LEFT_CURLY)
            return ExplicitSpecifierSet(t, x, QualifiedPath);
        return QualifiedPath(t, x);
    }

    /*
     * ExportPathList :: (tokenizer, compiler context)
     *                -> Array[(IDENTIFIER | DOT | OBJECT_INIT) node]
     */
    function ExportPathList(t, x) {
        var a = [];
        do {
            a.push(ExportPath(t, x));
        } while (t.match(COMMA));
        return a;
    }

    /*
     * FunctionDefinition :: (tokenizer, compiler context, boolean,
     *                        DECLARED_FORM or EXPRESSED_FORM or STATEMENT_FORM,
     *                        [string] or null or undefined)
     *                    -> node
     */
    function FunctionDefinition(t, x, requireName, functionForm, comments) {
        var tt;
        var f = new Node(t, { params: [], paramComments: [] });
        if (typeof comment === "undefined")
            comment = null;
        f.blockComments = comments;
        if (f.type !== FUNCTION)
            f.type = (f.value === "get") ? GETTER : SETTER;
        if (t.match(IDENTIFIER))
            f.name = t.token.value;
        else if (requireName)
            throw t.newSyntaxError("missing function identifier");

        var inModule = x ? x.inModule : false;
        var x2 = new StaticContext(null, null, inModule, true);

        t.mustMatch(LEFT_PAREN);
        if (!t.match(RIGHT_PAREN)) {
            do {
                tt = t.get();
                f.paramComments.push(t.lastBlockComment());
                switch (tt) {
                  case LEFT_BRACKET:
                  case LEFT_CURLY:
                    // Destructured formal parameters.
                    t.unget();
                    f.params.push(DestructuringExpression(t, x2));
                    break;
                  case IDENTIFIER:
                    f.params.push(t.token.value);
                    break;
                  default:
                    throw t.newSyntaxError("missing formal parameter");
                    break;
                }
            } while (t.match(COMMA));
            t.mustMatch(RIGHT_PAREN);
        }

        // Do we have an expression closure or a normal body?
        tt = t.get();
        if (tt !== LEFT_CURLY)
            t.unget();

        if (tt !== LEFT_CURLY) {
            f.body = AssignExpression(t, x2);
            if (f.body.isGenerator)
                throw t.newSyntaxError("Generator returns a value");
        } else {
            f.body = Script(t, inModule, true);
        }

        if (tt === LEFT_CURLY)
            t.mustMatch(RIGHT_CURLY);

        f.end = t.token.end;
        f.functionForm = functionForm;
        if (functionForm === DECLARED_FORM)
            x.parentScript.funDecls.push(f);
        return f;
    }

    /*
     * ModuleVariables :: (tokenizer, compiler context, MODULE node) -> void
     *
     * Parses a comma-separated list of module declarations (and maybe
     * initializations).
     */
    function ModuleVariables(t, x, n) {
        var n1, n2;
        do {
            n1 = Identifier(t, x);
            if (t.match(ASSIGN)) {
                n2 = ModuleExpression(t, x);
                n1.initializer = n2;
                if (n2.type === STRING)
                    x.parentScript.modLoads.set(n1.value, n2.value);
                else
                    x.parentScript.modAssns.set(n1.value, n1);
            }
            n.push(n1);
        } while (t.match(COMMA));
    }

    /*
     * Variables :: (tokenizer, compiler context) -> node
     *
     * Parses a comma-separated list of var declarations (and maybe
     * initializations).
     */
    function Variables(t, x, letBlock) {
        var n, n2, ss, i, s, tt;

        tt = t.token.type;
        switch (tt) {
          case VAR:
          case CONST:
            s = x.parentScript;
            break;
          case LET:
            s = x.parentBlock;
            break;
          case LEFT_PAREN:
            tt = LET;
            s = letBlock;
            break;
        }

        n = new Node(t, { type: tt, destructurings: [] });

        do {
            tt = t.get();
            if (tt === LEFT_BRACKET || tt === LEFT_CURLY) {
                // Need to unget to parse the full destructured expression.
                t.unget();

                var dexp = DestructuringExpression(t, x, true);

                n2 = new Node(t, { type: IDENTIFIER,
                                   name: dexp,
                                   readOnly: n.type === CONST });
                n.push(n2);
                pushDestructuringVarDecls(n2.name.destructuredNames, s);
                n.destructurings.push({ exp: dexp, decl: n2 });

                if (x.inForLoopInit && t.peek() === IN) {
                    continue;
                }

                t.mustMatch(ASSIGN);
                if (t.token.assignOp)
                    throw t.newSyntaxError("Invalid variable initialization");

                n2.blockComment = t.lastBlockComment();
                n2.initializer = AssignExpression(t, x);

                continue;
            }

            if (tt !== IDENTIFIER)
                throw t.newSyntaxError("missing variable name");

            n2 = new Node(t, { type: IDENTIFIER,
                               name: t.token.value,
                               readOnly: n.type === CONST });
            n.push(n2);
            s.varDecls.push(n2);

            if (t.match(ASSIGN)) {
                var comment = t.lastBlockComment();
                if (t.token.assignOp)
                    throw t.newSyntaxError("Invalid variable initialization");

                n2.initializer = AssignExpression(t, x);
            } else {
                var comment = t.lastBlockComment();
            }
            n2.blockComment = comment;
        } while (t.match(COMMA));

        return n;
    }

    /*
     * LetBlock :: (tokenizer, compiler context, boolean) -> node
     *
     * Does not handle let inside of for loop init.
     */
    function LetBlock(t, x, isStatement) {
        var n, n2;

        // t.token.type must be LET
        n = new Node(t, { type: LET_BLOCK, varDecls: [] });
        t.mustMatch(LEFT_PAREN);
        n.variables = Variables(t, x, n);
        t.mustMatch(RIGHT_PAREN);

        if (isStatement && t.peek() !== LEFT_CURLY) {
            /*
             * If this is really an expression in let statement guise, then we
             * need to wrap the LET_BLOCK node in a SEMICOLON node so that we pop
             * the return value of the expression.
             */
            n2 = new Node(t, { type: SEMICOLON,
                               expression: n });
            isStatement = false;
        }

        if (isStatement)
            n.block = Block(t, x);
        else
            n.expression = AssignExpression(t, x);

        return n;
    }

    function checkDestructuring(t, x, n, simpleNamesOnly) {
        if (n.type === ARRAY_COMP)
            throw t.newSyntaxError("Invalid array comprehension left-hand side");
        if (n.type !== ARRAY_INIT && n.type !== OBJECT_INIT)
            return;

        var lhss = {};
        var nn, n2, idx, sub, cc, c = n.children;
        for (var i = 0, j = c.length; i < j; i++) {
            if (!(nn = c[i]))
                continue;
            if (nn.type === PROPERTY_INIT) {
                cc = nn.children;
                sub = cc[1];
                idx = cc[0].value;
            } else if (n.type === OBJECT_INIT) {
                // Do we have destructuring shorthand {foo, bar}?
                sub = nn;
                idx = nn.value;
            } else {
                sub = nn;
                idx = i;
            }

            if (sub.type === ARRAY_INIT || sub.type === OBJECT_INIT) {
                lhss[idx] = checkDestructuring(t, x, sub, simpleNamesOnly);
            } else {
                if (simpleNamesOnly && sub.type !== IDENTIFIER) {
                    // In declarations, lhs must be simple names
                    throw t.newSyntaxError("missing name in pattern");
                }

                lhss[idx] = sub;
            }
        }

        return lhss;
    }

    function DestructuringExpression(t, x, simpleNamesOnly) {
        var n = PrimaryExpression(t, x);
        // Keep the list of lefthand sides for varDecls
        n.destructuredNames = checkDestructuring(t, x, n, simpleNamesOnly);
        return n;
    }

    function GeneratorExpression(t, x, e) {
        return new Node(t, { type: GENERATOR,
                             expression: e,
                             tail: ComprehensionTail(t, x) });
    }

    function ComprehensionTail(t, x) {
        var body, n, n2, n3, p;

        // t.token.type must be FOR
        body = new Node(t, { type: COMP_TAIL });

        do {
            // Comprehension tails are always for..in loops.
            n = new Node(t, { type: FOR_IN, isLoop: true });
            if (t.match(IDENTIFIER)) {
                // But sometimes they're for each..in.
                if (t.token.value === "each")
                    n.isEach = true;
                else
                    t.unget();
            }
            p = MaybeLeftParen(t, x);
            switch(t.get()) {
              case LEFT_BRACKET:
              case LEFT_CURLY:
                t.unget();
                // Destructured left side of for in comprehension tails.
                n.iterator = DestructuringExpression(t, x);
                break;

              case IDENTIFIER:
                n.iterator = n3 = new Node(t, { type: IDENTIFIER });
                n3.name = n3.value;
                n.varDecl = n2 = new Node(t, { type: VAR });
                n2.push(n3);
                x.parentScript.varDecls.push(n3);
                // Don't add to varDecls since the semantics of comprehensions is
                // such that the variables are in their own function when
                // desugared.
                break;

              default:
                throw t.newSyntaxError("missing identifier");
            }
            t.mustMatch(IN);
            n.object = Expression(t, x);
            MaybeRightParen(t, p);
            body.push(n);
        } while (t.match(FOR));

        // Optional guard.
        if (t.match(IF))
            body.guard = HeadExpression(t, x);

        return body;
    }

    function HeadExpression(t, x) {
        var p = MaybeLeftParen(t, x);
        var n = ParenExpression(t, x);
        MaybeRightParen(t, p);
        if (p === END && !n.parenthesized) {
            var tt = t.peek();
            if (tt !== LEFT_CURLY && !definitions.isStatementStartCode[tt])
                throw t.newSyntaxError("Unparenthesized head followed by unbraced body");
        }
        return n;
    }

    function ParenExpression(t, x) {
        // Always accept the 'in' operator in a parenthesized expression,
        // where it's unambiguous, even if we might be parsing the init of a
        // for statement.
        var n = Expression(t, x.update({ inForLoopInit: x.inForLoopInit &&
                                                        (t.token.type === LEFT_PAREN) }));

        if (t.match(FOR)) {
            if (n.type === YIELD && !n.parenthesized)
                throw t.newSyntaxError("Yield expression must be parenthesized");
            if (n.type === COMMA && !n.parenthesized)
                throw t.newSyntaxError("Generator expression must be parenthesized");
            n = GeneratorExpression(t, x, n);
        }

        return n;
    }

    /*
     * Expression :: (tokenizer, compiler context) -> node
     *
     * Top-down expression parser matched against SpiderMonkey.
     */
    function Expression(t, x) {
        var n, n2;

        n = AssignExpression(t, x);
        if (t.match(COMMA)) {
            n2 = new Node(t, { type: COMMA });
            n2.push(n);
            n = n2;
            do {
                n2 = n.children[n.children.length-1];
                if (n2.type === YIELD && !n2.parenthesized)
                    throw t.newSyntaxError("Yield expression must be parenthesized");
                n.push(AssignExpression(t, x));
            } while (t.match(COMMA));
        }

        return n;
    }

    function AssignExpression(t, x) {
        var n, lhs;

        // Have to treat yield like an operand because it could be the leftmost
        // operand of the expression.
        if (t.match(YIELD, true))
            return ReturnOrYield(t, x);

        n = new Node(t, { type: ASSIGN });
        lhs = ConditionalExpression(t, x);

        if (!t.match(ASSIGN)) {
            return lhs;
        }

        n.blockComment = t.lastBlockComment();

        switch (lhs.type) {
          case OBJECT_INIT:
          case ARRAY_INIT:
            lhs.destructuredNames = checkDestructuring(t, x, lhs);
            // FALL THROUGH
          case IDENTIFIER: case DOT: case INDEX: case CALL:
            break;
          default:
            throw t.newSyntaxError("Bad left-hand side of assignment");
            break;
        }

        n.assignOp = lhs.assignOp = t.token.assignOp;
        n.push(lhs);
        n.push(AssignExpression(t, x));

        return n;
    }

    function ConditionalExpression(t, x) {
        var n, n2;

        n = OrExpression(t, x);
        if (t.match(HOOK)) {
            n2 = n;
            n = new Node(t, { type: HOOK });
            n.push(n2);
            /*
             * Always accept the 'in' operator in the middle clause of a ternary,
             * where it's unambiguous, even if we might be parsing the init of a
             * for statement.
             */
            n.push(AssignExpression(t, x.update({ inForLoopInit: false })));
            if (!t.match(COLON))
                throw t.newSyntaxError("missing : after ?");
            n.push(AssignExpression(t, x));
        }

        return n;
    }

    function OrExpression(t, x) {
        var n, n2;

        n = AndExpression(t, x);
        while (t.match(OR)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(AndExpression(t, x));
            n = n2;
        }

        return n;
    }

    function AndExpression(t, x) {
        var n, n2;

        n = BitwiseOrExpression(t, x);
        while (t.match(AND)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(BitwiseOrExpression(t, x));
            n = n2;
        }

        return n;
    }

    function BitwiseOrExpression(t, x) {
        var n, n2;

        n = BitwiseXorExpression(t, x);
        while (t.match(BITWISE_OR)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(BitwiseXorExpression(t, x));
            n = n2;
        }

        return n;
    }

    function BitwiseXorExpression(t, x) {
        var n, n2;

        n = BitwiseAndExpression(t, x);
        while (t.match(BITWISE_XOR)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(BitwiseAndExpression(t, x));
            n = n2;
        }

        return n;
    }

    function BitwiseAndExpression(t, x) {
        var n, n2;

        n = EqualityExpression(t, x);
        while (t.match(BITWISE_AND)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(EqualityExpression(t, x));
            n = n2;
        }

        return n;
    }

    function EqualityExpression(t, x) {
        var n, n2;

        n = RelationalExpression(t, x);
        while (t.match(EQ) || t.match(NE) ||
               t.match(STRICT_EQ) || t.match(STRICT_NE)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(RelationalExpression(t, x));
            n = n2;
        }

        return n;
    }

    function RelationalExpression(t, x) {
        var n, n2;

        /*
         * Uses of the in operator in shiftExprs are always unambiguous,
         * so unset the flag that prohibits recognizing it.
         */
        var x2 = x.update({ inForLoopInit: false });
        n = ShiftExpression(t, x2);
        while ((t.match(LT) || t.match(LE) || t.match(GE) || t.match(GT) ||
               (!x.inForLoopInit && t.match(IN)) ||
               t.match(INSTANCEOF))) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(ShiftExpression(t, x2));
            n = n2;
        }

        return n;
    }

    function ShiftExpression(t, x) {
        var n, n2;

        n = AddExpression(t, x);
        while (t.match(LSH) || t.match(RSH) || t.match(URSH)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(AddExpression(t, x));
            n = n2;
        }

        return n;
    }

    function AddExpression(t, x) {
        var n, n2;

        n = MultiplyExpression(t, x);
        while (t.match(PLUS) || t.match(MINUS)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(MultiplyExpression(t, x));
            n = n2;
        }

        return n;
    }

    function MultiplyExpression(t, x) {
        var n, n2;

        n = UnaryExpression(t, x);
        while (t.match(MUL) || t.match(DIV) || t.match(MOD)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(UnaryExpression(t, x));
            n = n2;
        }

        return n;
    }

    function UnaryExpression(t, x) {
        var n, n2, tt;

        switch (tt = t.get(true)) {
          case DELETE: case VOID: case TYPEOF:
          case NOT: case BITWISE_NOT: case PLUS: case MINUS:
            if (tt === PLUS)
                n = new Node(t, { type: UNARY_PLUS });
            else if (tt === MINUS)
                n = new Node(t, { type: UNARY_MINUS });
            else
                n = new Node(t);
            n.push(UnaryExpression(t, x));
            break;

          case INCREMENT:
          case DECREMENT:
            // Prefix increment/decrement.
            n = new Node(t);
            n.push(MemberExpression(t, x, true));
            break;

          default:
            t.unget();
            n = MemberExpression(t, x, true);

            // Don't look across a newline boundary for a postfix {in,de}crement.
            if (t.tokens[(t.tokenIndex + t.lookahead - 1) & 3].lineno ===
                t.lineno) {
                if (t.match(INCREMENT) || t.match(DECREMENT)) {
                    n2 = new Node(t, { postfix: true });
                    n2.push(n);
                    n = n2;
                }
            }
            break;
        }

        return n;
    }

    function MemberExpression(t, x, allowCallSyntax) {
        var n, n2, name, tt;

        if (t.match(NEW)) {
            n = new Node(t);
            n.push(MemberExpression(t, x, false));
            if (t.match(LEFT_PAREN)) {
                n.type = NEW_WITH_ARGS;
                n.push(ArgumentList(t, x));
            }
        } else {
            n = PrimaryExpression(t, x);
        }

        while ((tt = t.get()) !== END) {
            switch (tt) {
              case DOT:
                n2 = new Node(t);
                n2.push(n);
                n2.push(IdentifierName(t));
                break;

              case LEFT_BRACKET:
                n2 = new Node(t, { type: INDEX });
                n2.push(n);
                n2.push(Expression(t, x));
                t.mustMatch(RIGHT_BRACKET);
                break;

              case LEFT_PAREN:
                if (allowCallSyntax) {
                    n2 = new Node(t, { type: CALL });
                    n2.push(n);
                    n2.push(ArgumentList(t, x));
                    break;
                }

                // FALL THROUGH
              default:
                t.unget();
                return n;
            }

            n = n2;
        }

        return n;
    }

    function ArgumentList(t, x) {
        var n, n2;

        n = new Node(t, { type: LIST });
        if (t.match(RIGHT_PAREN, true))
            return n;
        do {
            n2 = AssignExpression(t, x);
            if (n2.type === YIELD && !n2.parenthesized && t.peek() === COMMA)
                throw t.newSyntaxError("Yield expression must be parenthesized");
            if (t.match(FOR)) {
                n2 = GeneratorExpression(t, x, n2);
                if (n.children.length > 1 || t.peek(true) === COMMA)
                    throw t.newSyntaxError("Generator expression must be parenthesized");
            }
            n.push(n2);
        } while (t.match(COMMA));
        t.mustMatch(RIGHT_PAREN);

        return n;
    }

    function PrimaryExpression(t, x) {
        var n, n2, tt = t.get(true);

        switch (tt) {
          case FUNCTION:
            n = FunctionDefinition(t, x, false, EXPRESSED_FORM);
            break;

          case LEFT_BRACKET:
            n = new Node(t, { type: ARRAY_INIT });
            while ((tt = t.peek(true)) !== RIGHT_BRACKET) {
                if (tt === COMMA) {
                    t.get();
                    n.push(null);
                    continue;
                }
                n.push(AssignExpression(t, x));
                if (tt !== COMMA && !t.match(COMMA))
                    break;
            }

            // If we matched exactly one element and got a FOR, we have an
            // array comprehension.
            if (n.children.length === 1 && t.match(FOR)) {
                n2 = new Node(t, { type: ARRAY_COMP,
                                   expression: n.children[0],
                                   tail: ComprehensionTail(t, x) });
                n = n2;
            }
            t.mustMatch(RIGHT_BRACKET);
            break;

          case LEFT_CURLY:
            var id, fd;
            n = new Node(t, { type: OBJECT_INIT });

          object_init:
            if (!t.match(RIGHT_CURLY)) {
                do {
                    tt = t.get();
                    if ((t.token.value === "get" || t.token.value === "set") &&
                        t.peek() === IDENTIFIER) {
                        if (x.ecma3OnlyMode)
                            throw t.newSyntaxError("Illegal property accessor");
                        n.push(FunctionDefinition(t, x, true, EXPRESSED_FORM));
                    } else {
                        var comments = t.blockComments;
                        switch (tt) {
                          case IDENTIFIER: case NUMBER: case STRING:
                            id = new Node(t, { type: IDENTIFIER });
                            break;
                          case RIGHT_CURLY:
                            if (x.ecma3OnlyMode)
                                throw t.newSyntaxError("Illegal trailing ,");
                            break object_init;
                          default:
                            if (t.token.value in definitions.keywords) {
                                id = new Node(t, { type: IDENTIFIER });
                                break;
                            }
                            throw t.newSyntaxError("Invalid property name");
                        }
                        if (t.match(COLON)) {
                            n2 = new Node(t, { type: PROPERTY_INIT });
                            n2.push(id);
                            n2.push(AssignExpression(t, x));
                            n2.blockComments = comments;
                            n.push(n2);
                        } else {
                            // Support, e.g., |var {x, y} = o| as destructuring shorthand
                            // for |var {x: x, y: y} = o|, per proposed JS2/ES4 for JS1.8.
                            if (t.peek() !== COMMA && t.peek() !== RIGHT_CURLY)
                                throw t.newSyntaxError("missing : after property");
                            n.push(id);
                        }
                    }
                } while (t.match(COMMA));
                t.mustMatch(RIGHT_CURLY);
            }
            break;

          case LEFT_PAREN:
            n = ParenExpression(t, x);
            t.mustMatch(RIGHT_PAREN);
            n.parenthesized = true;
            break;

          case LET:
            n = LetBlock(t, x, false);
            break;

          case NULL: case THIS: case TRUE: case FALSE:
          case IDENTIFIER: case NUMBER: case STRING: case REGEXP:
            n = new Node(t);
            break;

          default:
            throw t.newSyntaxError("missing operand");
            break;
        }

        return n;
    }

    /*
     * parse :: (source, filename, line number) -> node
     */
    function parse(s, f, l) {
        var t = new lexer.Tokenizer(s, f, l);
        var n = Script(t, false, false);
        if (!t.done)
            throw t.newSyntaxError("Syntax error");

        return n;
    }

    /*
     * parseStdin :: (source, {line number}, string, (string) -> boolean) -> program node
     */
    function parseStdin(s, ln, prefix, isCommand) {
        // the special .begin command is only recognized at the beginning
        if (s.match(/^[\s]*\.begin[\s]*$/)) {
            ++ln.value;
            return parseMultiline(ln, prefix);
        }

        // commands at the beginning are treated as the entire input
        if (isCommand(s.trim()))
            s = "";

        for (;;) {
            try {
                var t = new lexer.Tokenizer(s, "stdin", ln.value);
                var n = Script(t, false, false);
                ln.value = t.lineno;
                return n;
            } catch (e) {
                if (!t.unexpectedEOF)
                    throw e;

                // commands in the middle are not treated as part of the input
                var more;
                do {
                    if (prefix)
                        putstr(prefix);
                    more = readline();
                    if (!more)
                        throw e;
                } while (isCommand(more.trim()));

                s += "\n" + more;
            }
        }
    }

    /*
     * parseMultiline :: ({line number}, string | null) -> program node
     */
    function parseMultiline(ln, prefix) {
        var s = "";
        for (;;) {
            if (prefix)
                putstr(prefix);
            var more = readline();
            if (more === null)
                return null;
            // the only command recognized in multiline mode is .end
            if (more.match(/^[\s]*\.end[\s]*$/))
                break;
            s += "\n" + more;
        }
        var t = new lexer.Tokenizer(s, "stdin", ln.value);
        var n = Script(t, false, false);
        ln.value = t.lineno;
        return n;
    }

    module.exports = {
        parse: parse,
        parseStdin: parseStdin,
        Node: Node,
        SyntheticNode: SyntheticNode,
        DECLARED_FORM: DECLARED_FORM,
        EXPRESSED_FORM: EXPRESSED_FORM,
        STATEMENT_FORM: STATEMENT_FORM,
        Tokenizer: lexer.Tokenizer,
        FunctionDefinition: FunctionDefinition,
        Module: Module,
        Export: Export
    };

});/* vim: set sw=4 ts=4 et tw=78: */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Narcissus JavaScript engine.
 *
 * The Initial Developer of the Original Code is
 * Brendan Eich <brendan@mozilla.org>.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tom Austin <taustin@ucsc.edu>
 *   Brendan Eich <brendan@mozilla.org>
 *   Shu-Yu Guo <shu@rfrn.org>
 *   Dave Herman <dherman@mozilla.com>
 *   Dimitris Vardoulakis <dimvar@ccs.neu.edu>
 *   Patrick Walton <pcwalton@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Narcissus - JS implemented in JS.
 *
 * Lexical scanner.
 */

 define('ace/narcissus/jslex', ['require', 'exports', 'module' , 'ace/narcissus/jsdefs'], function(require, exports, module) {

    var definitions = require("./jsdefs");

    // Set constants in the local scope.
    eval(definitions.consts);

    // Banned keywords by language version
    const blackLists = { 160: {}, 185: {}, harmony: {} };
    blackLists[160][LET] = true;
    blackLists[160][MODULE] = true;
    blackLists[160][YIELD] = true;
    blackLists[185][MODULE] = true;

    // Build up a trie of operator tokens.
    var opTokens = {};
    for (var op in definitions.opTypeNames) {
        if (op === '\n' || op === '.')
            continue;

        var node = opTokens;
        for (var i = 0; i < op.length; i++) {
            var ch = op[i];
            if (!(ch in node))
                node[ch] = {};
            node = node[ch];
            node.op = op;
        }
    }

    /*
     * Tokenizer :: (source, filename, line number) -> Tokenizer
     */
    function Tokenizer(s, f, l) {
        this.cursor = 0;
        this.source = String(s);
        this.tokens = [];
        this.tokenIndex = 0;
        this.lookahead = 0;
        this.scanNewlines = false;
        this.unexpectedEOF = false;
        this.filename = f || "";
        this.lineno = l || 1;
        this.blackList = blackLists[Narcissus.options.version];
        this.blockComments = null;
    }

    Tokenizer.prototype = {
        get done() {
            // We need to set scanOperand to true here because the first thing
            // might be a regexp.
            return this.peek(true) === END;
        },

        get token() {
            return this.tokens[this.tokenIndex];
        },

        match: function (tt, scanOperand) {
            return this.get(scanOperand) === tt || this.unget();
        },

        mustMatch: function (tt) {
            if (!this.match(tt)) {
                throw this.newSyntaxError("Missing " +
                                          definitions.tokens[tt].toLowerCase());
            }
            return this.token;
        },

        peek: function (scanOperand) {
            var tt, next;
            if (this.lookahead) {
                next = this.tokens[(this.tokenIndex + this.lookahead) & 3];
                tt = (this.scanNewlines && next.lineno !== this.lineno)
                     ? NEWLINE
                     : next.type;
            } else {
                tt = this.get(scanOperand);
                this.unget();
            }
            return tt;
        },

        peekOnSameLine: function (scanOperand) {
            this.scanNewlines = true;
            var tt = this.peek(scanOperand);
            this.scanNewlines = false;
            return tt;
        },

        lastBlockComment: function() {
            var length = this.blockComments.length;
            return length ? this.blockComments[length - 1] : null;
        },

        // Eat comments and whitespace.
        skip: function () {
            var input = this.source;
            this.blockComments = [];
            for (;;) {
                var ch = input[this.cursor++];
                var next = input[this.cursor];
                // handle \r, \r\n and (always preferable) \n
                if (ch === '\r') {
                    // if the next character is \n, we don't care about this at all
                    if (next === '\n') continue;

                    // otherwise, we want to consider this as a newline
                    ch = '\n';
                }

                if (ch === '\n' && !this.scanNewlines) {
                    this.lineno++;
                } else if (ch === '/' && next === '*') {
                    var commentStart = ++this.cursor;
                    for (;;) {
                        ch = input[this.cursor++];
                        if (ch === undefined)
                            throw this.newSyntaxError("Unterminated comment");

                        if (ch === '*') {
                            next = input[this.cursor];
                            if (next === '/') {
                                var commentEnd = this.cursor - 1;
                                this.cursor++;
                                break;
                            }
                        } else if (ch === '\n') {
                            this.lineno++;
                        }
                    }
                    this.blockComments.push(input.substring(commentStart, commentEnd));
                } else if (ch === '/' && next === '/') {
                    this.cursor++;
                    for (;;) {
                        ch = input[this.cursor++];
                        next = input[this.cursor];
                        if (ch === undefined)
                            return;

                        if (ch === '\r') {
                            // check for \r\n
                            if (next !== '\n') ch = '\n';
                        }

                        if (ch === '\n') {
                            if (this.scanNewlines) {
                                this.cursor--;
                            } else {
                                this.lineno++;
                            }
                            break;
                        }
                    }
                } else if (!(ch in definitions.whitespace)) {
                    this.cursor--;
                    return;
                }
            }
        },

        // Lex the exponential part of a number, if present. Return true iff an
        // exponential part was found.
        lexExponent: function() {
            var input = this.source;
            var next = input[this.cursor];
            if (next === 'e' || next === 'E') {
                this.cursor++;
                ch = input[this.cursor++];
                if (ch === '+' || ch === '-')
                    ch = input[this.cursor++];

                if (ch < '0' || ch > '9')
                    throw this.newSyntaxError("Missing exponent");

                do {
                    ch = input[this.cursor++];
                } while (ch >= '0' && ch <= '9');
                this.cursor--;

                return true;
            }

            return false;
        },

        lexZeroNumber: function (ch) {
            var token = this.token, input = this.source;
            token.type = NUMBER;

            ch = input[this.cursor++];
            if (ch === '.') {
                do {
                    ch = input[this.cursor++];
                } while (ch >= '0' && ch <= '9');
                this.cursor--;

                this.lexExponent();
                token.value = parseFloat(token.start, this.cursor);
            } else if (ch === 'x' || ch === 'X') {
                do {
                    ch = input[this.cursor++];
                } while ((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') ||
                         (ch >= 'A' && ch <= 'F'));
                this.cursor--;

                token.value = parseInt(input.substring(token.start, this.cursor));
            } else if (ch >= '0' && ch <= '7') {
                do {
                    ch = input[this.cursor++];
                } while (ch >= '0' && ch <= '7');
                this.cursor--;

                token.value = parseInt(input.substring(token.start, this.cursor));
            } else {
                this.cursor--;
                this.lexExponent();     // 0E1, &c.
                token.value = 0;
            }
        },

        lexNumber: function (ch) {
            var token = this.token, input = this.source;
            token.type = NUMBER;

            var floating = false;
            do {
                ch = input[this.cursor++];
                if (ch === '.' && !floating) {
                    floating = true;
                    ch = input[this.cursor++];
                }
            } while (ch >= '0' && ch <= '9');

            this.cursor--;

            var exponent = this.lexExponent();
            floating = floating || exponent;

            var str = input.substring(token.start, this.cursor);
            token.value = floating ? parseFloat(str) : parseInt(str);
        },

        lexDot: function (ch) {
            var token = this.token, input = this.source;
            var next = input[this.cursor];
            if (next >= '0' && next <= '9') {
                do {
                    ch = input[this.cursor++];
                } while (ch >= '0' && ch <= '9');
                this.cursor--;

                this.lexExponent();

                token.type = NUMBER;
                token.value = parseFloat(token.start, this.cursor);
            } else {
                token.type = DOT;
                token.assignOp = null;
                token.value = '.';
            }
        },

        lexString: function (ch) {
            var token = this.token, input = this.source;
            token.type = STRING;

            var hasEscapes = false;
            var delim = ch;
            if (input.length <= this.cursor)
                throw this.newSyntaxError("Unterminated string literal");
            while ((ch = input[this.cursor++]) !== delim) {
                if (this.cursor == input.length)
                    throw this.newSyntaxError("Unterminated string literal");
                if (ch === '\\') {
                    hasEscapes = true;
                    if (++this.cursor == input.length)
                        throw this.newSyntaxError("Unterminated string literal");
                }
            }

            token.value = hasEscapes
                          ? eval(input.substring(token.start, this.cursor))
                          : input.substring(token.start + 1, this.cursor - 1);
        },

        lexRegExp: function (ch) {
            var token = this.token, input = this.source;
            token.type = REGEXP;

            do {
                ch = input[this.cursor++];
                if (ch === '\\') {
                    this.cursor++;
                } else if (ch === '[') {
                    do {
                        if (ch === undefined)
                            throw this.newSyntaxError("Unterminated character class");

                        if (ch === '\\')
                            this.cursor++;

                        ch = input[this.cursor++];
                    } while (ch !== ']');
                } else if (ch === undefined) {
                    throw this.newSyntaxError("Unterminated regex");
                }
            } while (ch !== '/');

            do {
                ch = input[this.cursor++];
            } while (ch >= 'a' && ch <= 'z');

            this.cursor--;

            token.value = eval(input.substring(token.start, this.cursor));
        },

        lexOp: function (ch) {
            var token = this.token, input = this.source;

            // A bit ugly, but it seems wasteful to write a trie lookup routine
            // for only 3 characters...
            var node = opTokens[ch];
            var next = input[this.cursor];
            if (next in node) {
                node = node[next];
                this.cursor++;
                next = input[this.cursor];
                if (next in node) {
                    node = node[next];
                    this.cursor++;
                    next = input[this.cursor];
                }
            }

            var op = node.op;
            if (definitions.assignOps[op] && input[this.cursor] === '=') {
                this.cursor++;
                token.type = ASSIGN;
                token.assignOp = definitions.tokenIds[definitions.opTypeNames[op]];
                op += '=';
            } else {
                token.type = definitions.tokenIds[definitions.opTypeNames[op]];
                token.assignOp = null;
            }

            token.value = op;
        },

        // FIXME: Unicode escape sequences
        lexIdent: function (ch) {
            var token = this.token;
            var id = ch;

            while ((ch = this.getValidIdentifierChar(false)) !== null) {
                id += ch;
            }

            token.type = definitions.keywords[id] || IDENTIFIER;
            if (token.type in this.blackList) {
                // banned keyword, this is an identifier
                token.type = IDENTIFIER;
            }
            token.value = id;
        },

        /*
         * Tokenizer.get :: void -> token type
         *
         * Consume input *only* if there is no lookahead.
         * Dispatch to the appropriate lexing function depending on the input.
         */
        get: function (scanOperand) {
            var token;
            while (this.lookahead) {
                --this.lookahead;
                this.tokenIndex = (this.tokenIndex + 1) & 3;
                token = this.tokens[this.tokenIndex];
                if (token.type !== NEWLINE || this.scanNewlines)
                    return token.type;
            }

            this.skip();

            this.tokenIndex = (this.tokenIndex + 1) & 3;
            token = this.tokens[this.tokenIndex];
            if (!token)
                this.tokens[this.tokenIndex] = token = {};

            var input = this.source;
            if (this.cursor >= input.length)
                return token.type = END;

            token.start = this.cursor;
            token.lineno = this.lineno;

            var ich = this.getValidIdentifierChar(true);
            var ch = (ich === null) ? input[this.cursor++] : null;
            if (ich !== null) {
                this.lexIdent(ich);
            } else if (scanOperand && ch === '/') {
                this.lexRegExp(ch);
            } else if (ch in opTokens) {
                this.lexOp(ch);
            } else if (ch === '.') {
                this.lexDot(ch);
            } else if (ch >= '1' && ch <= '9') {
                this.lexNumber(ch);
            } else if (ch === '0') {
                this.lexZeroNumber(ch);
            } else if (ch === '"' || ch === "'") {
                this.lexString(ch);
            } else if (this.scanNewlines && (ch === '\n' || ch === '\r')) {
                // if this was a \r, look for \r\n
                if (ch === '\r' && input[this.cursor] === '\n') this.cursor++;
                token.type = NEWLINE;
                token.value = '\n';
                this.lineno++;
            } else {
                throw this.newSyntaxError("Illegal token");
            }

            token.end = this.cursor;
            return token.type;
        },

        /*
         * Tokenizer.unget :: void -> undefined
         *
         * Match depends on unget returning undefined.
         */
        unget: function () {
            if (++this.lookahead === 4) throw "PANIC: too much lookahead!";
            this.tokenIndex = (this.tokenIndex - 1) & 3;
        },

        newSyntaxError: function (m) {
            m = (this.filename ? this.filename + ":" : "") + this.lineno + ": " + m;
            var e = new SyntaxError(m, this.filename, this.lineno);
            e.source = this.source;
            e.cursor = this.lookahead
                       ? this.tokens[(this.tokenIndex + this.lookahead) & 3].start
                       : this.cursor;
            return e;
        },

        /* Gets a single valid identifier char from the input stream, or null
         * if there is none.
         * Since JavaScript provides no convenient way to determine if a
         * character is in a particular Unicode category, we use
         * metacircularity to accomplish this (oh yeaaaah!) */
        getValidIdentifierChar: function(first) {
            var input = this.source;
            if (this.cursor >= input.length) return null;
            var ch = input[this.cursor];

            // first check for \u escapes
            if (ch === '\\' && input[this.cursor+1] === 'u') {
                // get the character value
                try {
                    ch = String.fromCharCode(parseInt(
                        input.substring(this.cursor + 2, this.cursor + 6),
                        16));
                } catch (ex) {
                    return null;
                }
                this.cursor += 5;
            }

            // check directly for ASCII
            if (ch <= "\u007F") {
                if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '$' || ch === '_' ||
                    (!first && (ch >= '0' && ch <= '9'))) {
                    this.cursor++;
                    return ch;
                }
                return null;
            }
    
            // create an object to test this in
            var x = {};
            x["x"+ch] = true;
            x[ch] = true;
    
            // then use eval to determine if it's a valid character
            var valid = false;
            try {
                valid = (Function("x", "return (x." + (first?"":"x") + ch + ");")(x) === true);
            } catch (ex) {}
            if (valid) this.cursor++;
            return (valid ? ch : null);
        },
    };


    module.exports = { Tokenizer: Tokenizer };

});
/* vim: set sw=4 ts=4 et tw=78: */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Narcissus JavaScript engine.
 *
 * The Initial Developer of the Original Code is
 * Brendan Eich <brendan@mozilla.org>.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tom Austin <taustin@ucsc.edu>
 *   Brendan Eich <brendan@mozilla.org>
 *   Shu-Yu Guo <shu@rfrn.org>
 *   Dave Herman <dherman@mozilla.com>
 *   Dimitris Vardoulakis <dimvar@ccs.neu.edu>
 *   Patrick Walton <pcwalton@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Narcissus - JS implemented in JS.
 *
 * Well-known constants and lookup tables.  Many consts are generated from the
 * tokens table via eval to minimize redundancy, so consumers must be compiled
 * separately to take advantage of the simple switch-case constant propagation
 * done by SpiderMonkey.
 */

define('ace/narcissus/jsdefs', ['require', 'exports', 'module' ], function(require, exports, module) {

    var narcissus = {
        options: {
            version: 185,
            // Global variables to hide from the interpreter
            hiddenHostGlobals: { Narcissus: true },
            // Desugar SpiderMonkey language extensions?
            desugarExtensions: false
        },
        hostSupportsEvalConst: (function() {
            try {
                return eval("(function(s) { eval(s); return x })('const x = true;')");
            } catch (e) {
                return false;
            }
        })(),
        hostGlobal: this
    };
    Narcissus = narcissus;

    var tokens = [
        // End of source.
        "END",

        // Operators and punctuators.  Some pair-wise order matters, e.g. (+, -)
        // and (UNARY_PLUS, UNARY_MINUS).
        "\n", ";",
        ",",
        "=",
        "?", ":", "CONDITIONAL",
        "||",
        "&&",
        "|",
        "^",
        "&",
        "==", "!=", "===", "!==",
        "<", "<=", ">=", ">",
        "<<", ">>", ">>>",
        "+", "-",
        "*", "/", "%",
        "!", "~", "UNARY_PLUS", "UNARY_MINUS",
        "++", "--",
        ".",
        "[", "]",
        "{", "}",
        "(", ")",

        // Nonterminal tree node type codes.
        "SCRIPT", "BLOCK", "LABEL", "FOR_IN", "CALL", "NEW_WITH_ARGS", "INDEX",
        "ARRAY_INIT", "OBJECT_INIT", "PROPERTY_INIT", "GETTER", "SETTER",
        "GROUP", "LIST", "LET_BLOCK", "ARRAY_COMP", "GENERATOR", "COMP_TAIL",

        // Terminals.
        "IDENTIFIER", "NUMBER", "STRING", "REGEXP",

        // Keywords.
        "break",
        "case", "catch", "const", "continue",
        "debugger", "default", "delete", "do",
        "else", "export",
        "false", "finally", "for", "function",
        "if", "import", "in", "instanceof",
        "let", "module",
        "new", "null",
        "return",
        "switch",
        "this", "throw", "true", "try", "typeof",
        "var", "void",
        "yield",
        "while", "with",
    ];

    var statementStartTokens = [
        "break",
        "const", "continue",
        "debugger", "do",
        "for",
        "if",
        "return",
        "switch",
        "throw", "try",
        "var",
        "yield",
        "while", "with",
    ];

    // Whitespace characters (see ECMA-262 7.2)
    var whitespaceChars = [
        // normal whitespace:
        "\u0009", "\u000B", "\u000C", "\u0020", "\u00A0", "\uFEFF", 

        // high-Unicode whitespace:
        "\u1680", "\u180E",
        "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006",
        "\u2007", "\u2008", "\u2009", "\u200A",
        "\u202F", "\u205F", "\u3000"
    ];

    var whitespace = {};
    for (var i = 0; i < whitespaceChars.length; i++) {
        whitespace[whitespaceChars[i]] = true;
    }

    // Operator and punctuator mapping from token to tree node type name.
    // NB: because the lexer doesn't backtrack, all token prefixes must themselves
    // be valid tokens (e.g. !== is acceptable because its prefixes are the valid
    // tokens != and !).
    var opTypeNames = {
        '\n':   "NEWLINE",
        ';':    "SEMICOLON",
        ',':    "COMMA",
        '?':    "HOOK",
        ':':    "COLON",
        '||':   "OR",
        '&&':   "AND",
        '|':    "BITWISE_OR",
        '^':    "BITWISE_XOR",
        '&':    "BITWISE_AND",
        '===':  "STRICT_EQ",
        '==':   "EQ",
        '=':    "ASSIGN",
        '!==':  "STRICT_NE",
        '!=':   "NE",
        '<<':   "LSH",
        '<=':   "LE",
        '<':    "LT",
        '>>>':  "URSH",
        '>>':   "RSH",
        '>=':   "GE",
        '>':    "GT",
        '++':   "INCREMENT",
        '--':   "DECREMENT",
        '+':    "PLUS",
        '-':    "MINUS",
        '*':    "MUL",
        '/':    "DIV",
        '%':    "MOD",
        '!':    "NOT",
        '~':    "BITWISE_NOT",
        '.':    "DOT",
        '[':    "LEFT_BRACKET",
        ']':    "RIGHT_BRACKET",
        '{':    "LEFT_CURLY",
        '}':    "RIGHT_CURLY",
        '(':    "LEFT_PAREN",
        ')':    "RIGHT_PAREN"
    };

    // Hash of keyword identifier to tokens index.  NB: we must null __proto__ to
    // avoid toString, etc. namespace pollution.
    var keywords = {__proto__: null};

    // Define const END, etc., based on the token names.  Also map name to index.
    var tokenIds = {};

    // Building up a string to be eval'd in different contexts.
    var consts = Narcissus.hostSupportsEvalConst ? "const " : "var ";
    for (var i = 0, j = tokens.length; i < j; i++) {
        if (i > 0)
            consts += ", ";
        var t = tokens[i];
        var name;
        if (/^[a-z]/.test(t)) {
            name = t.toUpperCase();
            keywords[t] = i;
        } else {
            name = (/^\W/.test(t) ? opTypeNames[t] : t);
        }
        consts += name + " = " + i;
        tokenIds[name] = i;
        tokens[t] = i;
    }
    consts += ";";

    var isStatementStartCode = {__proto__: null};
    for (i = 0, j = statementStartTokens.length; i < j; i++)
        isStatementStartCode[keywords[statementStartTokens[i]]] = true;

    // Map assignment operators to their indexes in the tokens array.
    var assignOps = ['|', '^', '&', '<<', '>>', '>>>', '+', '-', '*', '/', '%'];

    for (i = 0, j = assignOps.length; i < j; i++) {
        t = assignOps[i];
        assignOps[t] = tokens[t];
    }

    function defineGetter(obj, prop, fn, dontDelete, dontEnum) {
        Object.defineProperty(obj, prop,
                              { get: fn, configurable: !dontDelete, enumerable: !dontEnum });
    }

    function defineGetterSetter(obj, prop, getter, setter, dontDelete, dontEnum) {
        Object.defineProperty(obj, prop, {
            get: getter,
            set: setter,
            configurable: !dontDelete,
            enumerable: !dontEnum
        });
    }

    function defineMemoGetter(obj, prop, fn, dontDelete, dontEnum) {
        Object.defineProperty(obj, prop, {
            get: function() {
                var val = fn();
                defineProperty(obj, prop, val, dontDelete, true, dontEnum);
                return val;
            },
            configurable: true,
            enumerable: !dontEnum
        });
    }

    function defineProperty(obj, prop, val, dontDelete, readOnly, dontEnum) {
        Object.defineProperty(obj, prop,
                              { value: val, writable: !readOnly, configurable: !dontDelete,
                                enumerable: !dontEnum });
    }

    // Returns true if fn is a native function.  (Note: SpiderMonkey specific.)
    function isNativeCode(fn) {
        // Relies on the toString method to identify native code.
        return ((typeof fn) === "function") && fn.toString().match(/\[native code\]/);
    }

    function getPropertyDescriptor(obj, name) {
        while (obj) {
            if (({}).hasOwnProperty.call(obj, name))
                return Object.getOwnPropertyDescriptor(obj, name);
            obj = Object.getPrototypeOf(obj);
        }
    }

    function getPropertyNames(obj) {
        var table = Object.create(null, {});
        while (obj) {
            var names = Object.getOwnPropertyNames(obj);
            for (var i = 0, n = names.length; i < n; i++)
                table[names[i]] = true;
            obj = Object.getPrototypeOf(obj);
        }
        return Object.keys(table);
    }

    function getOwnProperties(obj) {
        var map = {};
        for (var name in Object.getOwnPropertyNames(obj))
            map[name] = Object.getOwnPropertyDescriptor(obj, name);
        return map;
    }

    function blacklistHandler(target, blacklist) {
        var mask = Object.create(null, {});
        var redirect = StringMap.create(blacklist).mapObject(function(name) { return mask; });
        return mixinHandler(redirect, target);
    }

    function whitelistHandler(target, whitelist) {
        var catchall = Object.create(null, {});
        var redirect = StringMap.create(whitelist).mapObject(function(name) { return target; });
        return mixinHandler(redirect, catchall);
    }

    function mirrorHandler(target, writable) {
        var handler = makePassthruHandler(target);

        var defineProperty = handler.defineProperty;
        handler.defineProperty = function(name, desc) {
            if (!desc.enumerable)
                throw new Error("mirror property must be enumerable");
            if (!desc.configurable)
                throw new Error("mirror property must be configurable");
            if (desc.writable !== writable)
                throw new Error("mirror property must " + (writable ? "" : "not ") + "be writable");
            defineProperty(name, desc);
        };

        handler.fix = function() { };
        handler.getOwnPropertyDescriptor = handler.getPropertyDescriptor;
        handler.getOwnPropertyNames = getPropertyNames.bind(handler, target);
        handler.keys = handler.enumerate;
        handler["delete"] = function() { return false; };
        handler.hasOwn = handler.has;
        return handler;
    }

    /*
     * Mixin proxies break the single-inheritance model of prototypes, so
     * the handler treats all properties as own-properties:
     *
     *                  X
     *                  |
     *     +------------+------------+
     *     |                 O       |
     *     |                 |       |
     *     |  O         O    O       |
     *     |  |         |    |       |
     *     |  O    O    O    O       |
     *     |  |    |    |    |       |
     *     |  O    O    O    O    O  |
     *     |  |    |    |    |    |  |
     *     +-(*)--(w)--(x)--(y)--(z)-+
     */

    function mixinHandler(redirect, catchall) {
        function targetFor(name) {
            return hasOwn(redirect, name) ? redirect[name] : catchall;
        }

        function getMuxPropertyDescriptor(name) {
            var desc = getPropertyDescriptor(targetFor(name), name);
            if (desc)
                desc.configurable = true;
            return desc;
        }

        function getMuxPropertyNames() {
            var names1 = Object.getOwnPropertyNames(redirect).filter(function(name) {
                return name in redirect[name];
            });
            var names2 = getPropertyNames(catchall).filter(function(name) {
                return !hasOwn(redirect, name);
            });
            return names1.concat(names2);
        }

        function enumerateMux() {
            var result = Object.getOwnPropertyNames(redirect).filter(function(name) {
                return name in redirect[name];
            });
            for (name in catchall) {
                if (!hasOwn(redirect, name))
                    result.push(name);
            };
            return result;
        }

        function hasMux(name) {
            return name in targetFor(name);
        }

        return {
            getOwnPropertyDescriptor: getMuxPropertyDescriptor,
            getPropertyDescriptor: getMuxPropertyDescriptor,
            getOwnPropertyNames: getMuxPropertyNames,
            defineProperty: function(name, desc) {
                Object.defineProperty(targetFor(name), name, desc);
            },
            "delete": function(name) {
                var target = targetFor(name);
                return delete target[name];
            },
            // FIXME: ha ha ha
            fix: function() { },
            has: hasMux,
            hasOwn: hasMux,
            get: function(receiver, name) {
                var target = targetFor(name);
                return target[name];
            },
            set: function(receiver, name, val) {
                var target = targetFor(name);
                target[name] = val;
                return true;
            },
            enumerate: enumerateMux,
            keys: enumerateMux
        };
    }

    function makePassthruHandler(obj) {
        // Handler copied from
        // http://wiki.ecmascript.org/doku.php?id=harmony:proxies&s=proxy%20object#examplea_no-op_forwarding_proxy
        return {
            getOwnPropertyDescriptor: function(name) {
                var desc = Object.getOwnPropertyDescriptor(obj, name);

                // a trapping proxy's properties must always be configurable
                desc.configurable = true;
                return desc;
            },
            getPropertyDescriptor: function(name) {
                var desc = getPropertyDescriptor(obj, name);

                // a trapping proxy's properties must always be configurable
                desc.configurable = true;
                return desc;
            },
            getOwnPropertyNames: function() {
                return Object.getOwnPropertyNames(obj);
            },
            defineProperty: function(name, desc) {
                Object.defineProperty(obj, name, desc);
            },
            "delete": function(name) { return delete obj[name]; },
            fix: function() {
                if (Object.isFrozen(obj)) {
                    return getOwnProperties(obj);
                }

                // As long as obj is not frozen, the proxy won't allow itself to be fixed.
                return undefined; // will cause a TypeError to be thrown
            },

            has: function(name) { return name in obj; },
            hasOwn: function(name) { return ({}).hasOwnProperty.call(obj, name); },
            get: function(receiver, name) { return obj[name]; },

            // bad behavior when set fails in non-strict mode
            set: function(receiver, name, val) { obj[name] = val; return true; },
            enumerate: function() {
                var result = [];
                for (name in obj) { result.push(name); };
                return result;
            },
            keys: function() { return Object.keys(obj); }
        };
    }

    var hasOwnProperty = ({}).hasOwnProperty;

    function hasOwn(obj, name) {
        return hasOwnProperty.call(obj, name);
    }

    function StringMap(table, size) {
        this.table = table || Object.create(null, {});
        this.size = size || 0;
    }

    StringMap.create = function(table) {
        var init = Object.create(null, {});
        var size = 0;
        var names = Object.getOwnPropertyNames(table);
        for (var i = 0, n = names.length; i < n; i++) {
            var name = names[i];
            init[name] = table[name];
            size++;
        }
        return new StringMap(init, size);
    };

    StringMap.prototype = {
        has: function(x) { return hasOwnProperty.call(this.table, x); },
        set: function(x, v) {
            if (!hasOwnProperty.call(this.table, x))
                this.size++;
            this.table[x] = v;
        },
        get: function(x) { return this.table[x]; },
        getDef: function(x, thunk) {
            if (!hasOwnProperty.call(this.table, x)) {
                this.size++;
                this.table[x] = thunk();
            }
            return this.table[x];
        },
        forEach: function(f) {
            var table = this.table;
            for (var key in table)
                f.call(this, key, table[key]);
        },
        map: function(f) {
            var table1 = this.table;
            var table2 = Object.create(null, {});
            this.forEach(function(key, val) {
                table2[key] = f.call(this, val, key);
            });
            return new StringMap(table2, this.size);
        },
        mapObject: function(f) {
            var table1 = this.table;
            var table2 = Object.create(null, {});
            this.forEach(function(key, val) {
                table2[key] = f.call(this, val, key);
            });
            return table2;
        },
        toObject: function() {
            return this.mapObject(function(val) { return val; });
        },
        choose: function() {
            return Object.getOwnPropertyNames(this.table)[0];
        },
        remove: function(x) {
            if (hasOwnProperty.call(this.table, x)) {
                this.size--;
                delete this.table[x];
            }
        },
        copy: function() {
            var table = Object.create(null, {});
            for (var key in this.table)
                table[key] = this.table[key];
            return new StringMap(table, this.size);
        },
        toString: function() { return "[object StringMap]" }
    };

    // an object-key table with poor asymptotics (replace with WeakMap when possible)
    function ObjectMap(array) {
        this.array = array || [];
    }

    function searchMap(map, key, found, notFound) {
        var a = map.array;
        for (var i = 0, n = a.length; i < n; i++) {
            var pair = a[i];
            if (pair.key === key)
                return found(pair, i);
        }
        return notFound();
    }

    ObjectMap.prototype = {
        has: function(x) {
            return searchMap(this, x, function() { return true }, function() { return false });
        },
        set: function(x, v) {
            var a = this.array;
            searchMap(this, x,
                      function(pair) { pair.value = v },
                      function() { a.push({ key: x, value: v }) });
        },
        get: function(x) {
            return searchMap(this, x,
                             function(pair) { return pair.value },
                             function() { return null });
        },
        getDef: function(x, thunk) {
            var a = this.array;
            return searchMap(this, x,
                             function(pair) { return pair.value },
                             function() {
                                 var v = thunk();
                                 a.push({ key: x, value: v });
                                 return v;
                             });
        },
        forEach: function(f) {
            var a = this.array;
            for (var i = 0, n = a.length; i < n; i++) {
                var pair = a[i];
                f.call(this, pair.key, pair.value);
            }
        },
        choose: function() {
            return this.array[0].key;
        },
        get size() {
            return this.array.length;
        },
        remove: function(x) {
            var a = this.array;
            searchMap(this, x,
                      function(pair, i) { a.splice(i, 1) },
                      function() { });
        },
        copy: function() {
            return new ObjectMap(this.array.map(function(pair) {
                return { key: pair.key, value: pair.value }
            }));
        },
        clear: function() {
            this.array = [];
        },
        toString: function() { return "[object ObjectMap]" }
    };

    // non-destructive stack
    function Stack(elts) {
        this.elts = elts || null;
    }

    Stack.prototype = {
        push: function(x) {
            return new Stack({ top: x, rest: this.elts });
        },
        top: function() {
            if (!this.elts)
                throw new Error("empty stack");
            return this.elts.top;
        },
        isEmpty: function() {
            return this.top === null;
        },
        find: function(test) {
            for (var elts = this.elts; elts; elts = elts.rest) {
                if (test(elts.top))
                    return elts.top;
            }
            return null;
        },
        has: function(x) {
            return Boolean(this.find(function(elt) { return elt === x }));
        },
        forEach: function(f) {
            for (var elts = this.elts; elts; elts = elts.rest) {
                f(elts.top);
            }
        }
    };

    module.exports = {
        tokens: tokens,
        whitespace: whitespace,
        opTypeNames: opTypeNames,
        keywords: keywords,
        isStatementStartCode: isStatementStartCode,
        tokenIds: tokenIds,
        consts: consts,
        assignOps: assignOps,
        defineGetter: defineGetter,
        defineGetterSetter: defineGetterSetter,
        defineMemoGetter: defineMemoGetter,
        defineProperty: defineProperty,
        isNativeCode: isNativeCode,
        mirrorHandler: mirrorHandler,
        mixinHandler: mixinHandler,
        whitelistHandler: whitelistHandler,
        blacklistHandler: blacklistHandler,
        makePassthruHandler: makePassthruHandler,
        StringMap: StringMap,
        ObjectMap: ObjectMap,
        Stack: Stack
    };
});/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

// contains language specific debugger bindings
define('ext/jslanguage/debugger', ['require', 'exports', 'module' , 'ext/language/base_handler'], function(require, exports, module) {

    var baseLanguageHandler = require('ext/language/base_handler');
    
    var expressionBuilder = module.exports = Object.create(baseLanguageHandler);
    
    /*** publics ***/
    
    expressionBuilder.handlesLanguage = function(language) {
        return language === 'javascript';
    };
        
    // builds an expression for the v8 debugger based on a node
    expressionBuilder.buildExpression = function(node) {
        if (!node) return null;
        
        return getExpressionValue(node);
    };
    
    /*** privates ***/
    
    // get a string value of any expression
    var getExpressionValue = function(d) {
        if (d.value) return d.value;
        
        var result;
        
        d.rewrite(
            // var someVar = ...
            'VarDeclInit(x, _)', function(b) {
                result = b.x.value;
            },
            // var someVar;
            'VarDecl(x)', function(b) {
                result = b.x.value;
            },
            // e.x
            'PropAccess(e, x)', function(b) {
                result = getExpressionValue(b.e) + "." + b.x.value;
            },
            // x
            'Var(x)', function(b) {
                result = b.x.value;
            },
            // e(arg, ...)
            'Call(e, args)', function(b) {
                var method = getExpressionValue(b.e);
                var args = b.args.toArray().map(getExpressionValue).join(", ");
                result = method + "(" + args + ")";
            },
            // 10
            'Num(n)', function(b) {
                result = b.n.value;
            },
            // e[idx]
            'Index(e, idx)', function(b) {
                result = getExpressionValue(b.e) + "[" + getExpressionValue(b.idx) + "]";
            },
            // new SomeThing(arg, ...)
            'New(e, args)', function(b) {
                var method = getExpressionValue(b.e);
                var args = b.args.toArray().map(getExpressionValue).join(", ");
                result = "new " + method + "(" + args + ")";
            },
            // x (function argument)
            'FArg(x)', function(b) {
                result = b.x.value;
            },
            // 10 + 4
            'Op(op, e1, e2)', function(b) {
                result = getExpressionValue(b.e1) + " " + b.op.value + " " + getExpressionValue(b.e2);
            },
            // if nuthin' else matches
            function() {
                if(!result)
                    result = "";
            }
        );
        return result;
    };

});
