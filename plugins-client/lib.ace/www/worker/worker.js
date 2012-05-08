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

});
/*
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

/*
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
});
/* vim:ts=4:sts=4:sw=4:
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
        return defaultHandler(e);
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
/* -*- Mode: JS; tab-width: 4; indent-tabs-mode: nil; -*-
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

define('ace/narcissus/parser', ['require', 'exports', 'module' , 'ace/narcissus/lexer', 'ace/narcissus/definitions', 'ace/narcissus/options'], function(require, exports, module) {

var lexer = require('./lexer');
var definitions = require('./definitions');
var options = require('./options');
var Tokenizer = lexer.Tokenizer;

var Dict = definitions.Dict;
var Stack = definitions.Stack;

// Set constants in the local scope.
eval(definitions.consts);

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

function Parser(tokenizer) {
    tokenizer.parser = this;
    this.t = tokenizer;
    this.x = null;
    this.unexpectedEOF = false;
    options.mozillaMode && (this.mozillaMode = true);
    options.parenFreeMode && (this.parenFreeMode = true);
}

function StaticContext(parentScript, parentBlock, inModule, inFunction, strictMode) {
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
    this.strictMode = strictMode;
}

StaticContext.prototype = {
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

        target.labels = new Dict();
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
    canImport: function() {
        return this.topLevel && !this.inFunction;
    },
    canExport: function() {
        return this.inModule && this.topLevel && !this.inFunction;
    },
    banWith: function() {
        return this.strictMode || this.inModule;
    },
    modulesAllowed: function() {
        return this.topLevel && !this.inFunction;
    }
};

var Pp = Parser.prototype;

Pp.mozillaMode = false;

Pp.parenFreeMode = false;

Pp.withContext = function(x, f) {
    var x0 = this.x;
    this.x = x;
    var result = f.call(this);
    // NB: we don't bother with finally, since exceptions trash the parser
    this.x = x0;
    return result;
};

Pp.newNode = function newNode(opts) {
    return new Node(this.t, opts);
};

Pp.fail = function fail(msg) {
    throw this.t.newSyntaxError(msg);
};

Pp.match = function match(tt, scanOperand, keywordIsName) {
    return this.t.match(tt, scanOperand, keywordIsName);
};

Pp.mustMatch = function mustMatch(tt, keywordIsName) {
    return this.t.mustMatch(tt, keywordIsName);
};

Pp.peek = function peek(scanOperand) {
    return this.t.peek(scanOperand);
};

Pp.peekOnSameLine = function peekOnSameLine(scanOperand) {
    return this.t.peekOnSameLine(scanOperand);
};

Pp.done = function done() {
    return this.t.done;
};

/*
 * Script :: (boolean, boolean, boolean) -> node
 *
 * Parses the toplevel and module/function bodies.
 */
Pp.Script = function Script(inModule, inFunction, expectEnd) {
    var node = this.newNode(scriptInit());
    var x2 = new StaticContext(node, node, inModule, inFunction);
    this.withContext(x2, function() {
        this.Statements(node, true);
    });
    if (expectEnd && !this.done())
        this.fail("expected end of input");
    return node;
};

/*
 * Pragma :: (expression statement node) -> boolean
 *
 * Checks whether a node is a pragma and annotates it.
 */
function Pragma(n) {
    if (n.type === SEMICOLON) {
        var e = n.expression;
        if (e.type === STRING && e.value === "use strict") {
            n.pragma = "strict";
            return true;
        }
    }
    return false;
}

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

    this.filename = t.filename;
    this.children = [];

    for (var prop in init)
        this[prop] = init[prop];
}

/*
 * SyntheticNode :: (optional init object) -> node
 */
function SyntheticNode(init) {
    this.children = [];
    for (var prop in init)
        this[prop] = init[prop];
    this.synthetic = true;
}

var Np = Node.prototype = SyntheticNode.prototype = {};
Np.constructor = Node;

var TO_SOURCE_SKIP = {
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
    // avoid infinite recursion in case of back-links
    if (this.generatingSource)
        return mock.toSource();
    this.generatingSource = true;
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
    try {
        return mock.toSource();
    } finally {
        delete this.generatingSource;
    }
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
    var INDENTATION = "    ";
    var n = ++Node.indentLevel;
    var s = "{\n" + INDENTATION.repeat(n) + "type: " + tokenString(this.type);
    for (i = 0; i < a.length; i++)
        s += ",\n" + INDENTATION.repeat(n) + a[i].id + ": " + a[i].value;
    n = --Node.indentLevel;
    s += "\n" + INDENTATION.repeat(n) + "}";
    return s;
}

Np.synth = function(init) {
    var node = new SyntheticNode(init);
    node.filename = this.filename;
    node.lineno = this.lineno;
    node.start = this.start;
    node.end = this.end;
    return node;
};

/*
 * Helper init objects for common nodes.
 */

var LOOP_INIT = { isLoop: true };

function blockInit() {
    return { type: BLOCK, varDecls: [] };
}

function scriptInit() {
    return { type: SCRIPT,
             funDecls: [],
             varDecls: [],
             modDefns: new Dict(),
             modAssns: new Dict(),
             modDecls: new Dict(),
             modLoads: new Dict(),
             impDecls: [],
             expDecls: [],
             exports: new Dict(),
             hasEmptyReturn: false,
             hasReturnWithValue: false,
             hasYield: false };
}

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

Pp.MaybeLeftParen = function MaybeLeftParen() {
    if (this.parenFreeMode)
        return this.match(LEFT_PAREN) ? LEFT_PAREN : END;
    return this.mustMatch(LEFT_PAREN).type;
};

Pp.MaybeRightParen = function MaybeRightParen(p) {
    if (p === LEFT_PAREN)
        this.mustMatch(RIGHT_PAREN);
}

/*
 * Statements :: (node[, boolean]) -> void
 *
 * Parses a sequence of Statements.
 */
Pp.Statements = function Statements(n, topLevel) {
    var prologue = !!topLevel;
    try {
        while (!this.done() && this.peek(true) !== RIGHT_CURLY) {
            var n2 = this.Statement();
            n.push(n2);
            if (prologue && Pragma(n2)) {
                this.x.strictMode = true;
                n.strict = true;
            } else {
                prologue = false;
            }
        }
    } catch (e) {
        try {
            if (this.done())
                this.unexpectedEOF = true;
        } catch(e) {}
        throw e;
    }
}

Pp.Block = function Block() {
    this.mustMatch(LEFT_CURLY);
    var n = this.newNode(blockInit());
    var x2 = this.x.update({ parentBlock: n }).pushTarget(n);
    this.withContext(x2, function() {
        this.Statements(n);
    });
    this.mustMatch(RIGHT_CURLY);
    return n;
}

var DECLARED_FORM = 0, EXPRESSED_FORM = 1, STATEMENT_FORM = 2;

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
 * registerExport :: (Dict, EXPORT node) -> void
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

    var exportedModules = new Dict();

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
 * Statement :: () -> node
 *
 * Parses a Statement.
 */
Pp.Statement = function Statement() {
    var i, label, n, n2, p, c, ss, tt = this.t.get(true), tt2, x0, x2, x3;

    var comments = this.t.blockComments;

    // Cases for statements ending in a right curly return early, avoiding the
    // common semicolon insertion magic after this switch.
    switch (tt) {
      case IMPORT:
        if (!this.x.canImport())
            this.fail("illegal context for import statement");
        n = this.newNode();
        n.pathList = this.ImportPathList();
        this.x.parentScript.impDecls.push(n);
        break;

      case EXPORT:
        if (!this.x.canExport())
            this.fail("export statement not in module top level");
        switch (this.peek()) {
          case MODULE:
          case FUNCTION:
          case LET:
          case VAR:
          case CONST:
            n = this.Statement();
            n.blockComments = comments;
            n.exported = true;
            this.x.parentScript.expDecls.push(n);
            registerExport(this.x.parentScript.exports, n);
            return n;
        }
        n = this.newNode();
        n.pathList = this.ExportPathList();
        this.x.parentScript.expDecls.push(n);
        registerExport(this.x.parentScript.exports, n);
        break;

      case FUNCTION:
        // DECLARED_FORM extends funDecls of x, STATEMENT_FORM doesn't.
        return this.FunctionDefinition(true, this.x.topLevel ? DECLARED_FORM : STATEMENT_FORM, comments);

      case LEFT_CURLY:
        n = this.newNode(blockInit());
        x2 = this.x.update({ parentBlock: n }).pushTarget(n).nest();
        this.withContext(x2, function() {
            this.Statements(n);
        });
        this.mustMatch(RIGHT_CURLY);
        return n;

      case IF:
        n = this.newNode();
        n.condition = this.HeadExpression();
        x2 = this.x.pushTarget(n).nest();
        this.withContext(x2, function() {
            n.thenPart = this.Statement();
            n.elsePart = this.match(ELSE, true) ? this.Statement() : null;
        });
        return n;

      case SWITCH:
        // This allows CASEs after a DEFAULT, which is in the standard.
        n = this.newNode({ cases: [], defaultIndex: -1 });
        n.discriminant = this.HeadExpression();
        x2 = this.x.pushTarget(n).nest();
        this.withContext(x2, function() {
            this.mustMatch(LEFT_CURLY);
            while ((tt = this.t.get()) !== RIGHT_CURLY) {
                switch (tt) {
                  case DEFAULT:
                    if (n.defaultIndex >= 0)
                        this.fail("More than one switch default");
                    // FALL THROUGH
                  case CASE:
                    n2 = this.newNode();
                    if (tt === DEFAULT)
                        n.defaultIndex = n.cases.length;
                    else
                        n2.caseLabel = this.Expression(COLON);
                    break;

                  default:
                    this.fail("Invalid switch case");
                }
                this.mustMatch(COLON);
                n2.statements = this.newNode(blockInit());
                while ((tt=this.peek(true)) !== CASE && tt !== DEFAULT &&
                       tt !== RIGHT_CURLY)
                    n2.statements.push(this.Statement());
                n.cases.push(n2);
            }
        });
        return n;

      case FOR:
        n = this.newNode(LOOP_INIT);
        n.blockComments = comments;
        if (this.match(IDENTIFIER)) {
            if (this.t.token.value === "each")
                n.isEach = true;
            else
                this.t.unget();
        }
        if (!this.parenFreeMode)
            this.mustMatch(LEFT_PAREN);
        x2 = this.x.pushTarget(n).nest();
        x3 = this.x.update({ inForLoopInit: true });
        n2 = null;
        if ((tt = this.peek(true)) !== SEMICOLON) {
            this.withContext(x3, function() {
                if (tt === VAR || tt === CONST) {
                    this.t.get();
                    n2 = this.Variables();
                } else if (tt === LET) {
                    this.t.get();
                    if (this.peek() === LEFT_PAREN) {
                        n2 = this.LetBlock(false);
                    } else {
                        // Let in for head, we need to add an implicit block
                        // around the rest of the for.
                        this.x.parentBlock = n;
                        n.varDecls = [];
                        n2 = this.Variables();
                    }
                } else {
                    n2 = this.Expression();
                }
            });
        }
        if (n2 && this.match(IN)) {
            n.type = FOR_IN;
            this.withContext(x3, function() {
                n.object = this.Expression();
                if (n2.type === VAR || n2.type === LET) {
                    c = n2.children;

                    // Destructuring turns one decl into multiples, so either
                    // there must be only one destructuring or only one
                    // decl.
                    if (c.length !== 1 && n2.destructurings.length !== 1) {
                        // FIXME: this.fail ?
                        throw new SyntaxError("Invalid for..in left-hand side",
                                              this.filename, n2.lineno);
                    }
                    if (n2.destructurings.length > 0) {
                        n.iterator = n2.destructurings[0];
                    } else {
                        n.iterator = c[0];
                    }
                    n.varDecl = n2;
                } else {
                    if (n2.type === ARRAY_INIT || n2.type === OBJECT_INIT) {
                        n2.destructuredNames = this.checkDestructuring(n2);
                    }
                    n.iterator = n2;
                }
            });
        } else {
            x3.inForLoopInit = false;
            n.setup = n2;
            this.mustMatch(SEMICOLON);
            if (n.isEach)
                this.fail("Invalid for each..in loop");
            this.withContext(x3, function() {
                n.condition = (this.peek(true) === SEMICOLON)
                    ? null
                    : this.Expression();
                this.mustMatch(SEMICOLON);
                tt2 = this.peek(true);
                n.update = (this.parenFreeMode
                            ? tt2 === LEFT_CURLY || definitions.isStatementStartCode[tt2]
                            : tt2 === RIGHT_PAREN)
                    ? null
                    : this.Expression();
            });
        }
        if (!this.parenFreeMode)
            this.mustMatch(RIGHT_PAREN);
        this.withContext(x2, function() {
            n.body = this.Statement();
        });
        return n;

      case WHILE:
        n = this.newNode({ isLoop: true });
        n.blockComments = comments;
        n.condition = this.HeadExpression();
        x2 = this.x.pushTarget(n).nest();
        this.withContext(x2, function() {
            n.body = this.Statement();
        });
        return n;

      case DO:
        n = this.newNode({ isLoop: true });
        n.blockComments = comments;
        x2 = this.x.pushTarget(n).next();
        this.withContext(x2, function() {
            n.body = this.Statement();
        });
        this.mustMatch(WHILE);
        n.condition = this.HeadExpression();
        // <script language="JavaScript"> (without version hints) may need
        // automatic semicolon insertion without a newline after do-while.
        // See http://bugzilla.mozilla.org/show_bug.cgi?id=238945.
        this.match(SEMICOLON);
        return n;

      case BREAK:
      case CONTINUE:
        n = this.newNode();
        n.blockComments = comments;

        // handle the |foo: break foo;| corner case
        x2 = this.x.pushTarget(n);

        if (this.peekOnSameLine() === IDENTIFIER) {
            this.t.get();
            n.label = this.t.token.value;
        }

        if (n.label) {
            n.target = x2.labeledTargets.find(function(target) {
                return target.labels.has(n.label)
            });
        } else if (tt === CONTINUE) {
            n.target = x2.defaultLoopTarget;
        } else {
            n.target = x2.defaultTarget;
        }

        if (!n.target)
            this.fail("Invalid " + ((tt === BREAK) ? "break" : "continue"));
        if (!n.target.isLoop && tt === CONTINUE)
            this.fail("Invalid continue");

        break;

      case TRY:
        n = this.newNode({ catchClauses: [] });
        n.blockComments = comments;
        n.tryBlock = this.Block();
        while (this.match(CATCH)) {
            n2 = this.newNode();
            p = this.MaybeLeftParen();
            switch (this.t.get()) {
              case LEFT_BRACKET:
              case LEFT_CURLY:
                // Destructured catch identifiers.
                this.t.unget();
                n2.varName = this.DestructuringExpression(true);
                break;
              case IDENTIFIER:
                n2.varName = this.t.token.value;
                break;
              default:
                this.fail("missing identifier in catch");
                break;
            }
            if (this.match(IF)) {
                if (!this.mozillaMode)
                    this.fail("Illegal catch guard");
                if (n.catchClauses.length && !n.catchClauses.top().guard)
                    this.fail("Guarded catch after unguarded");
                n2.guard = this.Expression();
            }
            this.MaybeRightParen(p);
            n2.block = this.Block();
            n.catchClauses.push(n2);
        }
        if (this.match(FINALLY))
            n.finallyBlock = this.Block();
        if (!n.catchClauses.length && !n.finallyBlock)
            this.fail("Invalid try statement");
        return n;

      case CATCH:
      case FINALLY:
        this.fail(definitions.tokens[tt] + " without preceding try");

      case THROW:
        n = this.newNode();
        n.exception = this.Expression();
        break;

      case RETURN:
        n = this.ReturnOrYield();
        break;

      case WITH:
        if (this.x.banWith())
            this.fail("with statements not allowed in strict code or modules");
        n = this.newNode();
        n.blockComments = comments;
        n.object = this.HeadExpression();
        x2 = this.x.pushTarget(n).next();
        this.withContext(x2, function() {
            n.body = this.Statement();
        });
        return n;

      case VAR:
      case CONST:
        n = this.Variables();
        break;

      case LET:
        if (this.peek() === LEFT_PAREN) {
            n = this.LetBlock(true);
            return n;
        }
        n = this.Variables();
        break;

      case DEBUGGER:
        n = this.newNode();
        break;

      case NEWLINE:
      case SEMICOLON:
        n = this.newNode({ type: SEMICOLON });
        n.blockComments = comments;
        n.expression = null;
        return n;

      case IDENTIFIER:
      case USE:
      case MODULE:
        switch (this.t.token.value) {
          case "use":
            if (!isPragmaToken(this.peekOnSameLine())) {
                this.t.unget();
                break;
            }
            return this.newNode({ type: USE, params: this.Pragmas() });

          case "module":
            if (!this.x.modulesAllowed())
                this.fail("module declaration not at top level");
            this.x.parentScript.hasModules = true;
            tt = this.peekOnSameLine();
            if (tt !== IDENTIFIER && tt !== LEFT_CURLY) {
                this.t.unget();
                break;
            }
            n = this.newNode({ type: MODULE });
            n.blockComments = comments;
            this.mustMatch(IDENTIFIER);
            label = this.t.token.value;

            if (this.match(LEFT_CURLY)) {
                n.name = label;
                n.body = this.Script(true, false);
                n.module = new Module(n);
                this.mustMatch(RIGHT_CURLY);
                this.x.parentScript.modDefns.set(n.name, n);
                return n;
            }

            this.t.unget();
            this.ModuleVariables(n);
            return n;

          default:
            tt = this.peek();
            // Labeled statement.
            if (tt === COLON) {
                label = this.t.token.value;
                if (this.x.allLabels.has(label))
                    this.fail("Duplicate label: " + label);
                this.t.get();
                n = this.newNode({ type: LABEL, label: label });
                n.blockComments = comments;
                x2 = this.x.pushLabel(label).nest();
                this.withContext(x2, function() {
                    n.statement = this.Statement();
                });
                n.target = (n.statement.type === LABEL) ? n.statement.target : n.statement;
                return n;
            }
            // FALL THROUGH
        }
        // FALL THROUGH

      default:
        // Expression statement.
        // We unget the current token to parse the expression as a whole.
        n = this.newNode({ type: SEMICOLON });
        this.t.unget();
        n.blockComments = comments;
        n.expression = this.Expression();
        n.end = n.expression.end;
        break;
    }

    n.blockComments = comments;
    this.MagicalSemicolon();
    return n;
}

/*
 * isPragmaToken :: (number) -> boolean
 */
function isPragmaToken(tt) {
    switch (tt) {
      case IDENTIFIER:
      case STRING:
      case NUMBER:
      case NULL:
      case TRUE:
      case FALSE:
        return true;
    }
    return false;
}

/*
 * Pragmas :: () -> Array[Array[token]]
 */
Pp.Pragmas = function Pragmas() {
    var pragmas = [];
    do {
        pragmas.push(this.Pragma());
    } while (this.match(COMMA));
    this.MagicalSemicolon();
    return pragmas;
}

/*
 * Pragmas :: () -> Array[token]
 */
Pp.Pragma = function Pragma() {
    var items = [];
    var tt;
    do {
        tt = this.t.get(true);
        items.push(this.t.token);
    } while (isPragmaToken(this.peek()));
    return items;
}

/*
 * MagicalSemicolon :: () -> void
 */
Pp.MagicalSemicolon = function MagicalSemicolon() {
    var tt;
    if (this.t.lineno === this.t.token.lineno) {
        tt = this.peekOnSameLine();
        if (tt !== END && tt !== NEWLINE && tt !== SEMICOLON && tt !== RIGHT_CURLY)
            this.fail("missing ; before statement");
    }
    this.match(SEMICOLON);
}

/*
 * ReturnOrYield :: () -> (RETURN | YIELD) node
 */
Pp.ReturnOrYield = function ReturnOrYield() {
    var n, b, tt = this.t.token.type, tt2;

    var parentScript = this.x.parentScript;

    if (tt === RETURN) {
        if (!this.x.inFunction)
            this.fail("Return not in function");
    } else /* if (tt === YIELD) */ {
        if (!this.x.inFunction)
            this.fail("Yield not in function");
        parentScript.hasYield = true;
    }
    n = this.newNode({ value: undefined });

    tt2 = (tt === RETURN) ? this.peekOnSameLine(true) : this.peek(true);
    if (tt2 !== END && tt2 !== NEWLINE &&
        tt2 !== SEMICOLON && tt2 !== RIGHT_CURLY
        && (tt !== YIELD ||
            (tt2 !== tt && tt2 !== RIGHT_BRACKET && tt2 !== RIGHT_PAREN &&
             tt2 !== COLON && tt2 !== COMMA))) {
        if (tt === RETURN) {
            n.value = this.Expression();
            parentScript.hasReturnWithValue = true;
        } else {
            n.value = this.AssignExpression();
        }
    } else if (tt === RETURN) {
        parentScript.hasEmptyReturn = true;
    }

    return n;
}

/*
 * ModuleExpression :: () -> (STRING | IDENTIFIER | DOT) node
 */
Pp.ModuleExpression = function ModuleExpression() {
    return this.match(STRING) ? this.newNode() : this.QualifiedPath();
}

/*
 * ImportPathList :: () -> Array[DOT node]
 */
Pp.ImportPathList = function ImportPathList() {
    var a = [];
    do {
        a.push(this.ImportPath());
    } while (this.match(COMMA));
    return a;
}

/*
 * ImportPath :: () -> DOT node
 */
Pp.ImportPath = function ImportPath() {
    var n = this.QualifiedPath();
    if (!this.match(DOT)) {
        if (n.type === IDENTIFIER)
            this.fail("cannot import local variable");
        return n;
    }

    var n2 = this.newNode();
    n2.push(n);
    n2.push(this.ImportSpecifierSet());
    return n2;
}

/*
 * ExplicitSpecifierSet :: (() -> node) -> OBJECT_INIT node
 */
Pp.ExplicitSpecifierSet = function ExplicitSpecifierSet(SpecifierRHS) {
    var n, n2, id, tt;

    n = this.newNode({ type: OBJECT_INIT });
    this.mustMatch(LEFT_CURLY);

    if (!this.match(RIGHT_CURLY)) {
        do {
            id = this.Identifier();
            if (this.match(COLON)) {
                n2 = this.newNode({ type: PROPERTY_INIT });
                n2.push(id);
                n2.push(SpecifierRHS());
                n.push(n2);
            } else {
                n.push(id);
            }
        } while (!this.match(RIGHT_CURLY) && this.mustMatch(COMMA));
    }

    return n;
}

/*
 * ImportSpecifierSet :: () -> (IDENTIFIER | OBJECT_INIT) node
 */
Pp.ImportSpecifierSet = function ImportSpecifierSet() {
    var self = this;
    return this.match(MUL)
        ? this.newNode({ type: IDENTIFIER, name: "*" })
    : ExplicitSpecifierSet(function() { return self.Identifier() });
}

/*
 * Identifier :: () -> IDENTIFIER node
 */
Pp.Identifier = function Identifier() {
    this.mustMatch(IDENTIFIER);
    return this.newNode({ type: IDENTIFIER });
}

/*
 * IdentifierName :: () -> IDENTIFIER node
 */
Pp.IdentifierName = function IdentifierName() {
    this.mustMatch(IDENTIFIER, true);
    return this.newNode({ type: IDENTIFIER });
}

/*
 * QualifiedPath :: () -> (IDENTIFIER | DOT) node
 */
Pp.QualifiedPath = function QualifiedPath() {
    var n, n2;

    n = this.Identifier();

    while (this.match(DOT)) {
        if (this.peek() !== IDENTIFIER) {
            // Unget the '.' token, which isn't part of the QualifiedPath.
            this.t.unget();
            break;
        }
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.Identifier());
        n = n2;
    }

    return n;
}

/*
 * ExportPath :: () -> (IDENTIFIER | DOT | OBJECT_INIT) node
 */
Pp.ExportPath = function ExportPath() {
    var self = this;
    if (this.peek() === LEFT_CURLY)
        return this.ExplicitSpecifierSet(function() { return self.QualifiedPath() });
    return this.QualifiedPath();
}

/*
 * ExportPathList :: () -> Array[(IDENTIFIER | DOT | OBJECT_INIT) node]
 */
Pp.ExportPathList = function ExportPathList() {
    var a = [];
    do {
        a.push(this.ExportPath());
    } while (this.match(COMMA));
    return a;
}

/*
 * FunctionDefinition :: (boolean,
 *                        DECLARED_FORM or EXPRESSED_FORM or STATEMENT_FORM,
 *                        [string] or null or undefined)
 *                    -> node
 */
Pp.FunctionDefinition = function FunctionDefinition(requireName, functionForm, comments) {
    var tt;
    var f = this.newNode({ params: [], paramComments: [] });
    if (typeof comments === "undefined")
        comments = null;
    f.blockComments = comments;
    if (f.type !== FUNCTION)
        f.type = (f.value === "get") ? GETTER : SETTER;
    if (this.match(MUL))
        f.isExplicitGenerator = true;
    if (this.match(IDENTIFIER, false, true))
        f.name = this.t.token.value;
    else if (requireName)
        this.fail("missing function identifier");

    var inModule = this.x.inModule;
    x2 = new StaticContext(null, null, inModule, true, this.x.strictMode);
    this.withContext(x2, function() {
        this.mustMatch(LEFT_PAREN);
        if (!this.match(RIGHT_PAREN)) {
            do {
                tt = this.t.get();
                f.paramComments.push(this.t.lastBlockComment());
                switch (tt) {
                  case LEFT_BRACKET:
                  case LEFT_CURLY:
                    // Destructured formal parameters.
                    this.t.unget();
                    f.params.push(this.DestructuringExpression());
                    break;
                  case IDENTIFIER:
                    f.params.push(this.t.token.value);
                    break;
                  default:
                    this.fail("missing formal parameter");
                }
            } while (this.match(COMMA));
            this.mustMatch(RIGHT_PAREN);
        }

        // Do we have an expression closure or a normal body?
        tt = this.t.get(true);
        if (tt !== LEFT_CURLY)
            this.t.unget();

        if (tt !== LEFT_CURLY) {
            f.body = this.AssignExpression();
        } else {
            f.body = this.Script(inModule, true);
        }
    });

    if (tt === LEFT_CURLY)
        this.mustMatch(RIGHT_CURLY);

    f.end = this.t.token.end;
    f.functionForm = functionForm;
    if (functionForm === DECLARED_FORM)
        this.x.parentScript.funDecls.push(f);

    if (this.x.inModule && !f.isExplicitGenerator && f.body.hasYield)
        this.fail("yield in non-generator function");

    if (f.isExplicitGenerator || f.body.hasYield)
        f.body = this.newNode({ type: GENERATOR, body: f.body });

    return f;
}

/*
 * ModuleVariables :: (MODULE node) -> void
 *
 * Parses a comma-separated list of module declarations (and maybe
 * initializations).
 */
Pp.ModuleVariables = function ModuleVariables(n) {
    var n1, n2;
    do {
        n1 = this.Identifier();
        if (this.match(ASSIGN)) {
            n2 = this.ModuleExpression();
            n1.initializer = n2;
            if (n2.type === STRING)
                this.x.parentScript.modLoads.set(n1.value, n2.value);
            else
                this.x.parentScript.modAssns.set(n1.value, n1);
        }
        n.push(n1);
    } while (this.match(COMMA));
}

/*
 * Variables :: () -> node
 *
 * Parses a comma-separated list of var declarations (and maybe
 * initializations).
 */
Pp.Variables = function Variables(letBlock) {
    var n, n2, ss, i, s, tt;

    tt = this.t.token.type;
    switch (tt) {
      case VAR:
      case CONST:
        s = this.x.parentScript;
        break;
      case LET:
        s = this.x.parentBlock;
        break;
      case LEFT_PAREN:
        tt = LET;
        s = letBlock;
        break;
    }

    n = this.newNode({ type: tt, destructurings: [] });

    do {
        tt = this.t.get();
        if (tt === LEFT_BRACKET || tt === LEFT_CURLY) {
            // Need to unget to parse the full destructured expression.
            this.t.unget();

            var dexp = this.DestructuringExpression(true);

            n2 = this.newNode({ type: IDENTIFIER,
                                name: dexp,
                                readOnly: n.type === CONST });
            n.push(n2);
            pushDestructuringVarDecls(n2.name.destructuredNames, s);
            n.destructurings.push({ exp: dexp, decl: n2 });

            if (this.x.inForLoopInit && this.peek() === IN) {
                continue;
            }

            this.mustMatch(ASSIGN);
            if (this.t.token.assignOp)
                this.fail("Invalid variable initialization");

            n2.blockComment = this.t.lastBlockComment();
            n2.initializer = this.AssignExpression();

            continue;
        }

        if (tt !== IDENTIFIER)
            this.fail("missing variable name");

        n2 = this.newNode({ type: IDENTIFIER,
                            name: this.t.token.value,
                            readOnly: n.type === CONST });
        n.push(n2);
        s.varDecls.push(n2);

        if (this.match(ASSIGN)) {
            var comment = this.t.lastBlockComment();
            if (this.t.token.assignOp)
                this.fail("Invalid variable initialization");

            n2.initializer = this.AssignExpression();
        } else {
            var comment = this.t.lastBlockComment();
        }
        n2.blockComment = comment;
    } while (this.match(COMMA));

    return n;
}

/*
 * LetBlock :: (boolean) -> node
 *
 * Does not handle let inside of for loop init.
 */
Pp.LetBlock = function LetBlock(isStatement) {
    var n, n2;

    // t.token.type must be LET
    n = this.newNode({ type: LET_BLOCK, varDecls: [] });
    this.mustMatch(LEFT_PAREN);
    n.variables = this.Variables(n);
    this.mustMatch(RIGHT_PAREN);

    if (isStatement && this.peek() !== LEFT_CURLY) {
        /*
         * If this is really an expression in let statement guise, then we
         * need to wrap the LET_BLOCK node in a SEMICOLON node so that we pop
         * the return value of the expression.
         */
        n2 = this.newNode({ type: SEMICOLON, expression: n });
        isStatement = false;
    }

    if (isStatement)
        n.block = this.Block();
    else
        n.expression = this.AssignExpression();

    return n;
}

Pp.checkDestructuring = function checkDestructuring(n, simpleNamesOnly) {
    if (n.type === ARRAY_COMP)
        this.fail("Invalid array comprehension left-hand side");
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
            lhss[idx] = this.checkDestructuring(sub, simpleNamesOnly);
        } else {
            if (simpleNamesOnly && sub.type !== IDENTIFIER) {
                // In declarations, lhs must be simple names
                this.fail("missing name in pattern");
            }

            lhss[idx] = sub;
        }
    }

    return lhss;
}

Pp.DestructuringExpression = function DestructuringExpression(simpleNamesOnly) {
    var n = this.PrimaryExpression();
    // Keep the list of lefthand sides for varDecls
    n.destructuredNames = this.checkDestructuring(n, simpleNamesOnly);
    return n;
}

Pp.GeneratorExpression = function GeneratorExpression(e) {
    return this.newNode({ type: GENERATOR,
                          expression: e,
                          tail: this.ComprehensionTail() });
}

Pp.ComprehensionTail = function ComprehensionTail() {
    var body, n, n2, n3, p;

    // t.token.type must be FOR
    body = this.newNode({ type: COMP_TAIL });

    do {
        // Comprehension tails are always for..in loops.
        n = this.newNode({ type: FOR_IN, isLoop: true });
        if (this.match(IDENTIFIER)) {
            // But sometimes they're for each..in.
            if (this.mozillaMode && this.t.token.value === "each")
                n.isEach = true;
            else
                this.t.unget();
        }
        p = this.MaybeLeftParen();
        switch(this.t.get()) {
          case LEFT_BRACKET:
          case LEFT_CURLY:
            this.t.unget();
            // Destructured left side of for in comprehension tails.
            n.iterator = this.DestructuringExpression();
            break;

          case IDENTIFIER:
            n.iterator = n3 = this.newNode({ type: IDENTIFIER });
            n3.name = n3.value;
            n.varDecl = n2 = this.newNode({ type: VAR });
            n2.push(n3);
            this.x.parentScript.varDecls.push(n3);
            // Don't add to varDecls since the semantics of comprehensions is
            // such that the variables are in their own function when
            // desugared.
            break;

          default:
            this.fail("missing identifier");
        }
        this.mustMatch(IN);
        n.object = this.Expression();
        this.MaybeRightParen(p);
        body.push(n);
    } while (this.match(FOR));

    // Optional guard.
    if (this.match(IF))
        body.guard = this.HeadExpression();

    return body;
}

Pp.HeadExpression = function HeadExpression() {
    var p = this.MaybeLeftParen();
    var n = this.ParenExpression();
    this.MaybeRightParen(p);
    if (p === END && !n.parenthesized) {
        var tt = this.peek();
        if (tt !== LEFT_CURLY && !definitions.isStatementStartCode[tt])
            this.fail("Unparenthesized head followed by unbraced body");
    }
    return n;
}

Pp.ParenExpression = function ParenExpression() {
    // Always accept the 'in' operator in a parenthesized expression,
    // where it's unambiguous, even if we might be parsing the init of a
    // for statement.
    var x2 = this.x.update({
        inForLoopInit: this.x.inForLoopInit && (this.t.token.type === LEFT_PAREN)
    });
    var n = this.withContext(x2, function() {
        return this.Expression();
    });
    if (this.match(FOR)) {
        if (n.type === YIELD && !n.parenthesized)
            this.fail("Yield expression must be parenthesized");
        if (n.type === COMMA && !n.parenthesized)
            this.fail("Generator expression must be parenthesized");
        n = this.GeneratorExpression(n);
    }

    return n;
}

/*
 * Expression :: () -> node
 *
 * Top-down expression parser matched against SpiderMonkey.
 */
Pp.Expression = function Expression() {
    var n, n2;

    n = this.AssignExpression();
    if (this.match(COMMA)) {
        n2 = this.newNode({ type: COMMA });
        n2.push(n);
        n = n2;
        do {
            n2 = n.children[n.children.length-1];
            if (n2.type === YIELD && !n2.parenthesized)
                this.fail("Yield expression must be parenthesized");
            n.push(this.AssignExpression());
        } while (this.match(COMMA));
    }

    return n;
}

Pp.AssignExpression = function AssignExpression() {
    var n, lhs;

    // Have to treat yield like an operand because it could be the leftmost
    // operand of the expression.
    if (this.match(YIELD, true))
        return this.ReturnOrYield();

    n = this.newNode({ type: ASSIGN });
    lhs = this.ConditionalExpression();

    if (!this.match(ASSIGN)) {
        return lhs;
    }

    n.blockComment = this.t.lastBlockComment();

    switch (lhs.type) {
      case OBJECT_INIT:
      case ARRAY_INIT:
        lhs.destructuredNames = this.checkDestructuring(lhs);
        // FALL THROUGH
      case IDENTIFIER: case DOT: case INDEX: case CALL:
        break;
      default:
        this.fail("Bad left-hand side of assignment");
        break;
    }

    n.assignOp = lhs.assignOp = this.t.token.assignOp;
    n.push(lhs);
    n.push(this.AssignExpression());

    return n;
}

Pp.ConditionalExpression = function ConditionalExpression() {
    var n, n2;

    n = this.OrExpression();
    if (this.match(HOOK)) {
        n2 = n;
        n = this.newNode({ type: HOOK });
        n.push(n2);
        /*
         * Always accept the 'in' operator in the middle clause of a ternary,
         * where it's unambiguous, even if we might be parsing the init of a
         * for statement.
         */
        var x2 = this.x.update({ inForLoopInit: false });
        this.withContext(x2, function() {
            n.push(this.AssignExpression());
        });
        if (!this.match(COLON))
            this.fail("missing : after ?");
        n.push(this.AssignExpression());
    }

    return n;
}

Pp.OrExpression = function OrExpression() {
    var n, n2;

    n = this.AndExpression();
    while (this.match(OR)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.AndExpression());
        n = n2;
    }

    return n;
}

Pp.AndExpression = function AndExpression() {
    var n, n2;

    n = this.BitwiseOrExpression();
    while (this.match(AND)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.BitwiseOrExpression());
        n = n2;
    }

    return n;
}

Pp.BitwiseOrExpression = function BitwiseOrExpression() {
    var n, n2;

    n = this.BitwiseXorExpression();
    while (this.match(BITWISE_OR)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.BitwiseXorExpression());
        n = n2;
    }

    return n;
}

Pp.BitwiseXorExpression = function BitwiseXorExpression() {
    var n, n2;

    n = this.BitwiseAndExpression();
    while (this.match(BITWISE_XOR)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.BitwiseAndExpression());
        n = n2;
    }

    return n;
}

Pp.BitwiseAndExpression = function BitwiseAndExpression() {
    var n, n2;

    n = this.EqualityExpression();
    while (this.match(BITWISE_AND)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.EqualityExpression());
        n = n2;
    }

    return n;
}

Pp.EqualityExpression = function EqualityExpression() {
    var n, n2;

    n = this.RelationalExpression();
    while (this.match(EQ) || this.match(NE) ||
           this.match(STRICT_EQ) || this.match(STRICT_NE)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.RelationalExpression());
        n = n2;
    }

    return n;
}

Pp.RelationalExpression = function RelationalExpression() {
    var n, n2;

    /*
     * Uses of the in operator in shiftExprs are always unambiguous,
     * so unset the flag that prohibits recognizing it.
     */
    var x2 = this.x.update({ inForLoopInit: false });
    this.withContext(x2, function() {
        n = this.ShiftExpression();
        while ((this.match(LT) || this.match(LE) || this.match(GE) || this.match(GT) ||
                (!this.x.inForLoopInit && this.match(IN)) ||
                this.match(INSTANCEOF))) {
            n2 = this.newNode();
            n2.push(n);
            n2.push(this.ShiftExpression());
            n = n2;
        }
    });

    return n;
}

Pp.ShiftExpression = function ShiftExpression() {
    var n, n2;

    n = this.AddExpression();
    while (this.match(LSH) || this.match(RSH) || this.match(URSH)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.AddExpression());
        n = n2;
    }

    return n;
}

Pp.AddExpression = function AddExpression() {
    var n, n2;

    n = this.MultiplyExpression();
    while (this.match(PLUS) || this.match(MINUS)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.MultiplyExpression());
        n = n2;
    }

    return n;
}

Pp.MultiplyExpression = function MultiplyExpression() {
    var n, n2;

    n = this.UnaryExpression();
    while (this.match(MUL) || this.match(DIV) || this.match(MOD)) {
        n2 = this.newNode();
        n2.push(n);
        n2.push(this.UnaryExpression());
        n = n2;
    }

    return n;
}

Pp.UnaryExpression = function UnaryExpression() {
    var n, n2, tt;

    switch (tt = this.t.get(true)) {
      case DELETE: case VOID: case TYPEOF:
      case NOT: case BITWISE_NOT: case PLUS: case MINUS:
        if (tt === PLUS)
            n = this.newNode({ type: UNARY_PLUS });
        else if (tt === MINUS)
            n = this.newNode({ type: UNARY_MINUS });
        else
            n = this.newNode();
        n.push(this.UnaryExpression());
        break;

      case INCREMENT:
      case DECREMENT:
        // Prefix increment/decrement.
        n = this.newNode();
        n.push(this.MemberExpression(true));
        break;

      default:
        this.t.unget();
        n = this.MemberExpression(true);

        // Don't look across a newline boundary for a postfix {in,de}crement.
        if (this.t.tokens[(this.t.tokenIndex + this.t.lookahead - 1) & 3].lineno ===
            this.t.lineno) {
            if (this.match(INCREMENT) || this.match(DECREMENT)) {
                n2 = this.newNode({ postfix: true });
                n2.push(n);
                n = n2;
            }
        }
        break;
    }

    return n;
}

Pp.MemberExpression = function MemberExpression(allowCallSyntax) {
    var n, n2, name, tt;

    if (this.match(NEW)) {
        n = this.newNode();
        n.push(this.MemberExpression(false));
        if (this.match(LEFT_PAREN)) {
            n.type = NEW_WITH_ARGS;
            n.push(this.ArgumentList());
        }
    } else {
        n = this.PrimaryExpression();
    }

    while ((tt = this.t.get()) !== END) {
        switch (tt) {
          case DOT:
            n2 = this.newNode();
            n2.push(n);
            n2.push(this.IdentifierName());
            break;

          case LEFT_BRACKET:
            n2 = this.newNode({ type: INDEX });
            n2.push(n);
            n2.push(this.Expression());
            this.mustMatch(RIGHT_BRACKET);
            break;

          case LEFT_PAREN:
            if (allowCallSyntax) {
                n2 = this.newNode({ type: CALL });
                n2.push(n);
                n2.push(this.ArgumentList());
                break;
            }

            // FALL THROUGH
          default:
            this.t.unget();
            return n;
        }

        n = n2;
    }

    return n;
}

Pp.ArgumentList = function ArgumentList() {
    var n, n2;

    n = this.newNode({ type: LIST });
    if (this.match(RIGHT_PAREN, true))
        return n;
    do {
        n2 = this.AssignExpression();
        if (n2.type === YIELD && !n2.parenthesized && this.peek() === COMMA)
            this.fail("Yield expression must be parenthesized");
        if (this.match(FOR)) {
            n2 = this.GeneratorExpression(n2);
            if (n.children.length > 1 || this.peek(true) === COMMA)
                this.fail("Generator expression must be parenthesized");
        }
        n.push(n2);
    } while (this.match(COMMA));
    this.mustMatch(RIGHT_PAREN);

    return n;
}

Pp.PrimaryExpression = function PrimaryExpression() {
    var n, n2, tt = this.t.get(true);

    switch (tt) {
      case FUNCTION:
        n = this.FunctionDefinition(false, EXPRESSED_FORM);
        break;

      case LEFT_BRACKET:
        n = this.newNode({ type: ARRAY_INIT });
        while ((tt = this.peek(true)) !== RIGHT_BRACKET) {
            if (tt === COMMA) {
                this.t.get();
                n.push(null);
                continue;
            }
            n.push(this.AssignExpression());
            if (tt !== COMMA && !this.match(COMMA))
                break;
        }

        // If we matched exactly one element and got a FOR, we have an
        // array comprehension.
        if (n.children.length === 1 && this.match(FOR)) {
            n2 = this.newNode({ type: ARRAY_COMP,
                                expression: n.children[0],
                                tail: this.ComprehensionTail() });
            n = n2;
        }
        this.mustMatch(RIGHT_BRACKET);
        break;

      case LEFT_CURLY:
        var id, fd;
        n = this.newNode({ type: OBJECT_INIT });

        object_init:
        if (!this.match(RIGHT_CURLY)) {
            do {
                tt = this.t.get();
                if ((this.t.token.value === "get" || this.t.token.value === "set") &&
                    this.peek() === IDENTIFIER) {
                    n.push(this.FunctionDefinition(true, EXPRESSED_FORM));
                } else {
                    var comments = this.t.blockComments;
                    switch (tt) {
                      case IDENTIFIER: case NUMBER: case STRING:
                        id = this.newNode({ type: IDENTIFIER });
                        break;
                      case RIGHT_CURLY:
                        break object_init;
                      default:
                        if (this.t.token.value in definitions.keywords) {
                            id = this.newNode({ type: IDENTIFIER });
                            break;
                        }
                        this.fail("Invalid property name");
                    }
                    if (this.match(COLON)) {
                        n2 = this.newNode({ type: PROPERTY_INIT });
                        n2.push(id);
                        n2.push(this.AssignExpression());
                        n2.blockComments = comments;
                        n.push(n2);
                    } else {
                        // Support, e.g., |var {x, y} = o| as destructuring shorthand
                        // for |var {x: x, y: y} = o|, per proposed JS2/ES4 for JS1.8.
                        if (this.peek() !== COMMA && this.peek() !== RIGHT_CURLY)
                            this.fail("missing : after property");
                        n.push(id);
                    }
                }
            } while (this.match(COMMA));
            this.mustMatch(RIGHT_CURLY);
        }
        break;

      case LEFT_PAREN:
        n = this.ParenExpression();
        this.mustMatch(RIGHT_PAREN);
        n.parenthesized = true;
        break;

      case LET:
        n = this.LetBlock(false);
        break;

      case NULL: case THIS: case TRUE: case FALSE:
      case IDENTIFIER: case NUMBER: case STRING: case REGEXP:
        n = this.newNode();
        break;

      default:
        this.fail("missing operand; found " + definitions.tokens[tt]);
        break;
    }

    return n;
}

/*
 * parse :: (source, filename, line number) -> node
 */
function parse(s, f, l) {
    var t = new Tokenizer(s, f, l, options.allowHTMLComments);
    var p = new Parser(t);
    return p.Script(false, false, true);
}

/*
 * parseFunction :: (source, boolean,
 *                   DECLARED_FORM or EXPRESSED_FORM or STATEMENT_FORM,
 *                   filename, line number)
 *               -> node
 */
function parseFunction(s, requireName, form, f, l) {
    var t = new Tokenizer(s, f, l);
    var p = new Parser(t);
    p.x = new StaticContext(null, null, false, false, false);
    return p.FunctionDefinition(requireName, form);
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
            var t = new Tokenizer(s, "stdin", ln.value, false);
            var p = new Parser(t);
            var n = p.Script(false, false);
            ln.value = t.lineno;
            return n;
        } catch (e) {
            if (!p.unexpectedEOF)
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
    var t = new Tokenizer(s, "stdin", ln.value, false);
    var p = new Parser(t);
    var n = p.Script(false, false);
    ln.value = t.lineno;
    return n;
}

exports.parse = parse;
exports.parseStdin = parseStdin;
exports.parseFunction = parseFunction;
exports.Node = Node;
exports.DECLARED_FORM = DECLARED_FORM;
exports.EXPRESSED_FORM = EXPRESSED_FORM;
exports.STATEMENT_FORM = STATEMENT_FORM;
exports.Tokenizer = Tokenizer;
exports.Parser = Parser;
exports.Module = Module;
exports.Export = Export;

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
 *   Stephan Herhut <stephan.a.herhut@intel.com>
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

 define('ace/narcissus/lexer', ['require', 'exports', 'module' , 'ace/narcissus/definitions'], function(require, exports, module) {

var definitions = require('./definitions');

// Set constants in the local scope.
eval(definitions.consts);

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
 * Since JavaScript provides no convenient way to determine if a
 * character is in a particular Unicode category, we use
 * metacircularity to accomplish this (oh yeaaaah!)
 */
function isValidIdentifierChar(ch, first) {
    // check directly for ASCII
    if (ch <= "\u007F") {
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '$' || ch === '_' ||
            (!first && (ch >= '0' && ch <= '9'))) {
            return true;
        }
        return false;
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

    return valid;
}

function isIdentifier(str) {
    if (typeof str !== "string")
        return false;

    if (str.length === 0)
        return false;

    if (!isValidIdentifierChar(str[0], true))
        return false;

    for (var i = 1; i < str.length; i++) {
        if (!isValidIdentifierChar(str[i], false))
            return false;
    }

    return true;
}

/*
 * Tokenizer :: (source, filename, line number, boolean) -> Tokenizer
 */
function Tokenizer(s, f, l, allowHTMLComments) {
    this.cursor = 0;
    this.source = String(s);
    this.tokens = [];
    this.tokenIndex = 0;
    this.lookahead = 0;
    this.scanNewlines = false;
    this.filename = f || "";
    this.lineno = l || 1;
    this.allowHTMLComments = allowHTMLComments;
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

    match: function (tt, scanOperand, keywordIsName) {
        return this.get(scanOperand, keywordIsName) === tt || this.unget();
    },

    mustMatch: function (tt, keywordIsName) {
        if (!this.match(tt, false, keywordIsName)) {
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
            } else if ((ch === '/' && next === '/') ||
                       (this.allowHTMLComments && ch === '<' && next === '!' &&
                        input[this.cursor + 1] === '-' && input[this.cursor + 2] === '-' &&
                        (this.cursor += 2))) {
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
            token.value = parseFloat(
                input.substring(token.start, this.cursor));
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
            token.value = parseFloat(
                input.substring(token.start, this.cursor));
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
            if (ch == '\n' || ch == '\r')
                throw this.newSyntaxError("Unterminated string literal");
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
    lexIdent: function (ch, keywordIsName) {
        var token = this.token;
        var id = ch;

        while ((ch = this.getValidIdentifierChar(false)) !== null) {
            id += ch;
        }

        token.type = IDENTIFIER;
        token.value = id;

        if (keywordIsName)
            return;

        var kw;

        if (this.parser.mozillaMode) {
            kw = definitions.mozillaKeywords[id];
            if (kw) {
                token.type = kw;
                return;
            }
        }

        if (this.parser.x.strictMode) {
            kw = definitions.strictKeywords[id];
            if (kw) {
                token.type = kw;
                return;
            }
        }

        kw = definitions.keywords[id];
        if (kw)
            token.type = kw;
    },

    /*
     * Tokenizer.get :: ([boolean[, boolean]]) -> token type
     *
     * Consume input *only* if there is no lookahead.
     * Dispatch to the appropriate lexing function depending on the input.
     */
    get: function (scanOperand, keywordIsName) {
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
            this.lexIdent(ich, keywordIsName);
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
     */
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

        var valid = isValidIdentifierChar(ch, first);
        if (valid) this.cursor++;
        return (valid ? ch : null);
    },
};


exports.isIdentifier = isIdentifier;
exports.Tokenizer = Tokenizer;

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

define('ace/narcissus/definitions', ['require', 'exports', 'module' ], function(require, exports, module) {

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

    // Contextual keywords.
    "IMPLEMENTS", "INTERFACE", "LET", "MODULE", "PACKAGE", "PRIVATE",
    "PROTECTED", "PUBLIC", "STATIC", "USE", "YIELD",

    // Terminals.
    "IDENTIFIER", "NUMBER", "STRING", "REGEXP",

    // Keywords.
    "break",
    "case", "catch", "const", "continue",
    "debugger", "default", "delete", "do",
    "else", "export",
    "false", "finally", "for", "function",
    "if", "import", "in", "instanceof",
    "new", "null",
    "return",
    "switch",
    "this", "throw", "true", "try", "typeof",
    "var", "void",
    "while", "with",
];

var strictKeywords = {
    __proto__: null,
    "implements": true,
    "interface": true,
    "let": true,
    //"module": true,
    "package": true,
    "private": true,
    "protected": true,
    "public": true,
    "static": true,
    "use": true,
    "yield": true
};

var statementStartTokens = [
    "break",
    "const", "continue",
    "debugger", "do",
    "for",
    "if",
    "let",
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
var mozillaKeywords = {__proto__: null};

// Define const END, etc., based on the token names.  Also map name to index.
var tokenIds = {};

var hostSupportsEvalConst = (function() {
    try {
        return eval("(function(s) { eval(s); return x })('const x = true;')");
    } catch (e) {
        return false;
    }
})();

// Building up a string to be eval'd in different contexts.
var consts = hostSupportsEvalConst ? "const " : "var ";
for (var i = 0, j = tokens.length; i < j; i++) {
    if (i > 0)
        consts += ", ";
    var t = tokens[i];
    var name;
    if (/^[a-z]/.test(t)) {
        name = t.toUpperCase();
        if (name === "LET" || name === "YIELD")
            mozillaKeywords[name] = i;
        if (strictKeywords[name])
            strictKeywords[name] = i;
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

var Fpapply = Function.prototype.apply;

function apply(f, o, a) {
    return Fpapply.call(f, [o].concat(a));
}

var applyNew;

// ES5's bind is a simpler way to implement applyNew
if (Function.prototype.bind) {
    applyNew = function applyNew(f, a) {
        return new (f.bind.apply(f, [,].concat(Array.prototype.slice.call(a))))();
    };
} else {
    applyNew = function applyNew(f, a) {
        switch (a.length) {
          case 0:
            return new f();
          case 1:
            return new f(a[0]);
          case 2:
            return new f(a[0], a[1]);
          case 3:
            return new f(a[0], a[1], a[2]);
          default:
            var argStr = "a[0]";
            for (var i = 1, n = a.length; i < n; i++)
                argStr += ",a[" + i + "]";
            return eval("new f(" + argStr + ")");
        }
    };
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
    var redirect = Dict.create(blacklist).mapObject(function(name) { return mask; });
    return mixinHandler(redirect, target);
}

function whitelistHandler(target, whitelist) {
    var catchall = Object.create(null, {});
    var redirect = Dict.create(whitelist).mapObject(function(name) { return target; });
    return mixinHandler(redirect, catchall);
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

function Dict(table, size) {
    this.table = table || Object.create(null, {});
    this.size = size || 0;
}

Dict.create = function(table) {
    var init = Object.create(null, {});
    var size = 0;
    var names = Object.getOwnPropertyNames(table);
    for (var i = 0, n = names.length; i < n; i++) {
        var name = names[i];
        init[name] = table[name];
        size++;
    }
    return new Dict(init, size);
};

Dict.prototype = {
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
        return new Dict(table2, this.size);
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
        return new Dict(table, this.size);
    },
    keys: function() {
        return Object.keys(this.table);
    },
    toString: function() { return "[object Dict]" }
};

var _WeakMap = typeof WeakMap === "function" ? WeakMap : (function() {
    // shim for ES6 WeakMap with poor asymptotics
    function WeakMap(array) {
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

    WeakMap.prototype = {
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
        "delete": function(x) {
            var a = this.array;
            searchMap(this, x,
                      function(pair, i) { a.splice(i, 1) },
                      function() { });
        },
        toString: function() { return "[object WeakMap]" }
    };

    return WeakMap;
})();

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

if (!Array.prototype.copy) {
    defineProperty(Array.prototype, "copy",
                   function() {
                       var result = [];
                       for (var i = 0, n = this.length; i < n; i++)
                           result[i] = this[i];
                       return result;
                   }, false, false, true);
}

if (!Array.prototype.top) {
    defineProperty(Array.prototype, "top",
                   function() {
                       return this.length && this[this.length-1];
                   }, false, false, true);
}

exports.tokens = tokens;
exports.whitespace = whitespace;
exports.opTypeNames = opTypeNames;
exports.keywords = keywords;
exports.mozillaKeywords = mozillaKeywords;
exports.strictKeywords = strictKeywords;
exports.isStatementStartCode = isStatementStartCode;
exports.tokenIds = tokenIds;
exports.consts = consts;
exports.assignOps = assignOps;
exports.defineGetter = defineGetter;
exports.defineGetterSetter = defineGetterSetter;
exports.defineMemoGetter = defineMemoGetter;
exports.defineProperty = defineProperty;
exports.isNativeCode = isNativeCode;
exports.apply = apply;
exports.applyNew = applyNew;
exports.mixinHandler = mixinHandler;
exports.whitelistHandler = whitelistHandler;
exports.blacklistHandler = blacklistHandler;
exports.makePassthruHandler = makePassthruHandler;
exports.Dict = Dict;
exports.WeakMap = _WeakMap;
exports.Stack = Stack;

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

define('ace/narcissus/options', ['require', 'exports', 'module' ], function(require, exports, module) {

// Global variables to hide from the interpreter
exports.hiddenHostGlobals = { Narcissus: true };

// Desugar SpiderMonkey language extensions?
exports.desugarExtensions = false;

// Allow HTML comments?
exports.allowHTMLComments = false;

// Allow non-standard Mozilla extensions?
exports.mozillaMode = true;

// Allow experimental paren-free mode?
exports.parenFreeMode = false;

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

var WARNING_LEVELS = {
    error: 3,
    warning: 2,
    info: 1
};

// Leaking into global namespace of worker, to allow handlers to have access
disabledFeatures = {};

var LanguageWorker = exports.LanguageWorker = function(sender) {
    var _self = this;
    this.handlers = [];
    this.currentMarkers = [];
    this.$lastAggregateActions = {};
    this.$warningLevel = "info";
    
    Mirror.call(this, sender);
    this.setTimeout(500);
    
    sender.on("complete", function(pos) {
        _self.complete(pos);
    });
    sender.on("documentClose", function(event) {
        _self.documentClose(event);
    });
    sender.on("analyze", function(event) {
        _self.analyze(function() { });
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
    sender.on("jumpToDefinition", function(event) {
        _self.jumpToDefinition(event);
    });
    sender.on("fetchVariablePositions", function(event) {
        _self.sendVariablePositions(event);
    });
};

oop.inherits(LanguageWorker, Mirror);

function asyncForEach(array, fn, callback) {
	array = array.slice(0); // Just to be sure
	function processOne() {
		var item = array.pop();
		fn(item, function(result, err) {
			if (array.length > 0) {
				processOne();
			}
			else {
				callback(result, err);
			}
		});
	}
	if (array.length > 0) {
		processOne();
	}
	else {
		callback();
	}
}

function asyncParForEach(array, fn, callback) {
	var completed = 0;
	var arLength = array.length;
	if (arLength === 0) {
		callback();
	}
	for (var i = 0; i < arLength; i++) {
		fn(array[i], function(result, err) {
			completed++;
			if (completed === arLength) {
				callback(result, err);
			}
		});
	}
}

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
    
    this.setWarningLevel = function(level) {
        this.$warningLevel = level;
    };
    
    /**
     * Registers a handler by loading its code and adding it the handler array
     */
    this.register = function(path) {
        var handler = require(path);
        this.handlers.push(handler);
    };

    this.parse = function(callback) {
        var _self = this;
        this.cachedAst = null;
        asyncForEach(this.handlers, function(handler, next) {
            if (handler.handlesLanguage(_self.$language)) {
                try {
                    handler.parse(_self.doc.getValue(), function(ast) {
                        if(ast)
                            _self.cachedAst = ast;
                        next();
                    });
                } catch(e) {
                    // Ignore parse errors
                    next();
                }
            }
        }, function() {
            callback(_self.cachedAst);
        });
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
    
    this.analyze = function(callback) {
        var _self = this;
        this.parse(function(ast) {
            var markers = [];
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language) && (ast || !handler.analysisRequiresParsing())) {
                    handler.analyze(_self.doc, ast, function(result) {
                        if (result)
                            markers = markers.concat(result);
                        next();
                    });
                }
            }, function() {
                var extendedMakers = markers;
                filterMarkersAroundError(ast, markers);
                if (_self.getLastAggregateActions().markers.length > 0)
                    extendedMakers = markers.concat(_self.getLastAggregateActions().markers);
                _self.scheduleEmit("markers", _self.filterMarkersBasedOnLevel(extendedMakers));
                _self.currentMarkers = markers;
                if (_self.postponedCursorMove)
                    _self.onCursorMove(_self.postponedCursorMove);
                callback();
            });
        });
    };

/*
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
*/

    this.checkForMarker = function(pos) {
        var astPos = {line: pos.row, col: pos.column};
        for (var i = 0; i < this.currentMarkers.length; i++) {
            var currentMarker = this.currentMarkers[i];
            if (currentMarker.message && tree.inRange(currentMarker.pos, astPos)) {
                return currentMarker.message;
            }
        }
    };
    
    this.filterMarkersBasedOnLevel = function(markers) {
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            if(marker.level && WARNING_LEVELS[marker.level] < WARNING_LEVELS[this.$warningLevel]) {
                markers.splice(i, 1);
                i--;
            }
        }
        return markers;
    }
    
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
        var _self = this;
        var hintMessage = ""; // this.checkForMarker(pos) || "";
        // Not going to parse for this, only if already parsed successfully
        var aggregateActions = {markers: [], hint: null, enableRefactorings: []};
        
        function cursorMoved() {
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.onCursorMovedNode(_self.doc, ast, pos, currentNode, function(response) {
                        if (!response)
                            return next();
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
                        next();
                    });
                }
                else
                    next();
            }, function() {
                if (aggregateActions.hint && !hintMessage) {
                    hintMessage = aggregateActions.hint;
                }
                _self.scheduleEmit("markers", _self.filterMarkersBasedOnLevel(_self.currentMarkers.concat(aggregateActions.markers)));
                _self.scheduleEmit("enableRefactorings", aggregateActions.enableRefactorings);
                _self.lastCurrentNode = currentNode;
                _self.setLastAggregateActions(aggregateActions);
                _self.scheduleEmit("hint", {
                    pos: pos,
                	message: hintMessage
                });
            });

        }
        
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            if (currentNode !== this.lastCurrentNode || pos.force) {
                cursorMoved();
            }
        } else {
            cursorMoved();
        }
    };


    this.jumpToDefinition = function(event) {
        var pos = event.data;
        // Not going to parse for this, only if already parsed successfully
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            for (var i = 0; i < this.handlers.length; i++) {
                var handler = this.handlers[i];
                if (handler.handlesLanguage(this.$language)) {
                    var response = handler.jumpToDefinition(this.doc, ast, pos, currentNode);
                    if (response)
                        this.sender.emit("jumpToDefinition", response);
                }
            }
        }
    };

    this.sendVariablePositions = function(event) {
        var pos = event.data;
        var _self = this;
        // Not going to parse for this, only if already parsed successfully
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            asyncForEach(this.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.getVariablePositions(_self.doc, ast, pos, currentNode, function(response) {
                        if (response)
                            _self.sender.emit("variableLocations", response);
                        next();
                    });
                }
            }, function() {
            });
        }
    };

    this.onUpdate = function() {
        this.scheduledUpdate = false;
        var _self = this;
        asyncForEach(this.handlers, function(handler, next) { 
            if (handler.handlesLanguage(_self.$language))
                handler.onUpdate(_self.doc, next);
            else
                next();
        }, function() {
            _self.analyze(function() {});
        });
    };
    
    // TODO: BUG open an XML file and switch between, language doesn't update soon enough
    this.switchFile = function(path, language, code) {
        var oldPath = this.$path;
        code = code || "";
        this.$path = path;
        this.$language = language;
        this.cachedAst = null;
        this.lastCurrentNode = null;
        this.setValue(code);
        var doc = this.doc;
        asyncForEach(this.handlers, function(handler, next) {
            handler.path = path;
            handler.language = language;
            handler.onDocumentOpen(path, doc, oldPath, next);
        }, function() { });
    };
    
    this.documentClose = function(event) {
        var path = event.data;
        asyncForEach(this.handlers, function(handler, next) {
            handler.onDocumentClose(path, next);
        }, function() { });
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
        var _self = this;
        
        
        asyncForEach(this.handlers, function(handler, next) {
            if (!ast && handler.handlesLanguage(_self.$language) && handler.completionRequiresParsing()) {
                _self.parse(function(hAst) {
                    if(hAst) {
                        ast = hAst;
                        currentNode = ast.findNode({line: pos.row, col: pos.column});
                    }
                    next();
                });
            }
            else
                next();
        }, function() {
            var matches = [];
            
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.complete(_self.doc, ast, pos, currentNode, function(completions) {
                        if (completions)
                            matches = matches.concat(completions);
                        next();
                    });
                }
                else
                    next();
            }, function() {
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
                    else if(a.name < b.name)
                        return -1;
                    else if(a.name > b.name)
                        return 1;
                    else
                        return 0;
                });
                
                matches = matches.slice(0, 50); // 50 ought to be enough for everybody
                _self.sender.emit("complete", matches);
            });
        });
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

define('ace/document', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter', 'ace/range', 'ace/anchor'], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var Range = require("./range").Range;
var Anchor = require("./anchor").Anchor;

/**
 * class Document
 *
 * Contains the text of the document. Documents are controlled by a single [[EditSession `EditSession`]]. At its core, `Document`s are just an array of strings, with each row in the document matching up to the array index.
 *
 *
 **/

 /**
 * new Document([text])
 * - text (String | Array): The starting text
 *
 * Creates a new `Document`. If `text` is included, the `Document` contains those strings; otherwise, it's empty.
 *
 **/
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

    /**
    * Document.setValue(text) -> Void
    * - text (String): The text to use
    *
    * Replaces all the lines in the current `Document` with the value of `text`.
    **/
    this.setValue = function(text) {
        var len = this.getLength();
        this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        this.insert({row: 0, column:0}, text);
    };

    /**
    * Document.getValue() -> String
    * 
    * Returns all the lines in the document as a single string, split by the new line character.
    **/
    this.getValue = function() {
        return this.getAllLines().join(this.getNewLineCharacter());
    };

    /** 
    * Document.createAnchor(row, column) -> Anchor
    * - row (Number): The row number to use
    * - column (Number): The column number to use
    *
    * Creates a new `Anchor` to define a floating point in the document.
    **/
    this.createAnchor = function(row, column) {
        return new Anchor(this, row, column);
    };

    /** internal, hide
    * Document.$split(text) -> [String]
    * - text (String): The text to work with
    * + ([String]): A String array, with each index containing a piece of the original `text` string.
    * 
    * Splits a string of text on any newline (`\n`) or carriage-return ('\r') characters.
    *
    *
    **/

    // check for IE split bug
    if ("aaa".split(/a/).length == 0)
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        }
    else
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };


    /** internal, hide
    * Document.$detectNewLine(text) -> Void
    * 
    * 
    **/
    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r\n|\r|\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };

    /**
    * Document.getNewLineCharacter() -> String
    * + (String): If `newLineMode == windows`, `\r\n` is returned.<br/>
    *  If `newLineMode == unix`, `\n` is returned.<br/>
    *  If `newLineMode == auto`, the value of `autoNewLine` is returned.
    * 
    * Returns the newline character that's being used, depending on the value of `newLineMode`. 
    *
    * 
    * 
    **/
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
    /**
     * Document.setNewLineMode(newLineMode) -> Void
     * - newLineMode(String): [The newline mode to use; can be either `windows`, `unix`, or `auto`]{: #Document.setNewLineMode.param}
     * 
     * [Sets the new line mode.]{: #Document.setNewLineMode.desc}
     **/
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode)
            return;

        this.$newLineMode = newLineMode;
    };

    /**
    * Document.getNewLineMode() -> String
    * 
    * [Returns the type of newlines being used; either `windows`, `unix`, or `auto`]{: #Document.getNewLineMode}
    *
    **/
    this.getNewLineMode = function() {
        return this.$newLineMode;
    };

    /**
    * Document.isNewLine(text) -> Boolean
    * - text (String): The text to check
    *
    * Returns `true` if `text` is a newline character (either `\r\n`, `\r`, or `\n`).
    *
    **/
    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };

    /**
    * Document.getLine(row) -> String
    * - row (Number): The row index to retrieve
    * 
    * Returns a verbatim copy of the given line as it is in the document
    *
    **/
    this.getLine = function(row) {
        return this.$lines[row] || "";
    };

    /**
    * Document.getLines(firstRow, lastRow) -> [String]
    * - firstRow (Number): The first row index to retrieve
    * - lastRow (Number): The final row index to retrieve
    * 
    * Returns an array of strings of the rows between `firstRow` and `lastRow`. This function is inclusive of `lastRow`.
    *
    **/
    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow + 1);
    };

    /**
    * Document.getAllLines() -> [String]
    * 
    * Returns all lines in the document as string array. Warning: The caller should not modify this array!
    **/
    this.getAllLines = function() {
        return this.getLines(0, this.getLength());
    };

    /**
    * Document.getLength() -> Number
    * 
    * Returns the number of rows in the document.
    **/
    this.getLength = function() {
        return this.$lines.length;
    };

    /**
    * Document.getTextRange(range) -> String
    * - range (Range): The range to work with
    * 
    * [Given a range within the document, this function returns all the text within that range as a single string.]{: #Document.getTextRange.desc}
    **/
    this.getTextRange = function(range) {
        if (range.start.row == range.end.row) {
            return this.$lines[range.start.row].substring(range.start.column,
                                                         range.end.column);
        }
        else {
            var lines = this.getLines(range.start.row+1, range.end.row-1);
            lines.unshift((this.$lines[range.start.row] || "").substring(range.start.column));
            lines.push((this.$lines[range.end.row] || "").substring(0, range.end.column));
            return lines.join(this.getNewLineCharacter());
        }
    };

    /** internal, hide
    * Document.$clipPosition(position) -> Number
    * 
    * 
    **/
    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length-1).length;
        }
        return position;
    };

    /**
    * Document.insert(position, text) -> Number
    * - position (Number): The position to start inserting at 
    * - text (String): A chunk of text to insert
    * + (Number): The position of the last line of `text`. If the length of `text` is 0, this function simply returns `position`. 
    * Inserts a block of `text` and the indicated `position`.
    *
    * 
    **/
    this.insert = function(position, text) {
        if (!text || text.length === 0)
            return position;

        position = this.$clipPosition(position);

        // only detect new lines if the document has no line break yet
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

    /**
    * Document.insertLines(row, lines) -> Object
    * - row (Number): The index of the row to insert at
    * - lines (Array): An array of strings
    * + (Object): Returns an object containing the final row and column, like this:<br/>
    *   ```{row: endRow, column: 0}```<br/>
    *   If `lines` is empty, this function returns an object containing the current row, and column, like this:<br/>
    *   ```{row: row, column: 0}```
    *
    * Inserts the elements in `lines` into the document, starting at the row index given by `row`. This method also triggers the `'change'` event.
    *
    *
    **/
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

    /**
    * Document.insertNewLine(position) -> Object
    * - position (String): The position to insert at
    * + (Object): Returns an object containing the final row and column, like this:<br/>
    *    ```{row: endRow, column: 0}```
    * 
    * Inserts a new line into the document at the current row's `position`. This method also triggers the `'change'` event. 
    *
    *   
    *
    **/
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

    /**
    * Document.insertInLine(position, text) -> Object | Number
    * - position (Number): The position to insert at
    * - text (String): A chunk of text
    * + (Object): Returns an object containing the final row and column, like this:<br/>
    *     ```{row: endRow, column: 0}```
    * + (Number): If `text` is empty, this function returns the value of `position`
    * 
    * Inserts `text` into the `position` at the current row. This method also triggers the `'change'` event.
    *
    *
    *
    **/
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

    /**
    * Document.remove(range) -> Object
    * - range (Range): A specified Range to remove
    * + (Object): Returns the new `start` property of the range, which contains `startRow` and `startColumn`. If `range` is empty, this function returns the unmodified value of `range.start`.
    * 
    * Removes the `range` from the document.
    *
    *
    **/
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

    /**
    * Document.removeInLine(row, startColumn, endColumn) -> Object
    * - row (Number): The row to remove from
    * - startColumn (Number): The column to start removing at 
    * - endColumn (Number): The column to stop removing at
    * + (Object): Returns an object containing `startRow` and `startColumn`, indicating the new row and column values.<br/>If `startColumn` is equal to `endColumn`, this function returns nothing.
    *
    * Removes the specified columns from the `row`. This method also triggers the `'change'` event.
    *
    * 
    **/
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
    * Document.removeLines(firstRow, lastRow) -> [String]
    * - firstRow (Number): The first row to be removed
    * - lastRow (Number): The last row to be removed
    * + ([String]): Returns all the removed lines.
    * 
    * Removes a range of full lines. This method also triggers the `'change'` event.
    * 
    *
    **/
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

    /**
    * Document.removeNewLine(row) -> Void
    * - row (Number): The row to check
    * 
    * Removes the new line between `row` and the row immediately following it. This method also triggers the `'change'` event.
    *
    **/
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

    /**
    * Document.replace(range, text) -> Object
    * - range (Range): A specified Range to replace
    * - text (String): The new text to use as a replacement
    * + (Object): Returns an object containing the final row and column, like this:
    *     {row: endRow, column: 0}
    * If the text and range are empty, this function returns an object containing the current `range.start` value.
    * If the text is the exact same as what currently exists, this function returns an object containing the current `range.end` value.
    *
    * Replaces a range in the document with the new `text`.
    *
    **/
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

    /**
    * Document.applyDeltas(deltas) -> Void
    * 
    * Applies all the changes previously accumulated. These can be either `'includeText'`, `'insertLines'`, `'removeText'`, and `'removeLines'`.
    **/
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

    /**
    * Document.revertDeltas(deltas) -> Void
    * 
    * Reverts any changes previously applied. These can be either `'includeText'`, `'insertLines'`, `'removeText'`, and `'removeLines'`.
    **/
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

/**
 * class Range
 *
 * This object is used in various places to indicate a region within the editor. To better visualize how this works, imagine a rectangle. Each quadrant of the rectangle is analogus to a range, as ranges contain a starting row and starting column, and an ending row, and ending column.
 *
 **/

/**
 * new Range(startRow, startColumn, endRow, endColumn)
 * - startRow (Number): The starting row
 * - startColumn (Number): The starting column
 * - endRow (Number): The ending row
 * - endColumn (Number): The ending column
 *
 * Creates a new `Range` object with the given starting and ending row and column points.
 *
 **/
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
    /**
     * Range.isEqual(range) -> Boolean
     * - range (Range): A range to check against
     *
     * Returns `true` if and only if the starting row and column, and ending tow and column, are equivalent to those given by `range`.
     *
     **/ 
    this.isEqual = function(range) {
        return this.start.row == range.start.row &&
            this.end.row == range.end.row &&
            this.start.column == range.start.column &&
            this.end.column == range.end.column
    };

    /**
     * Range.toString() -> String
     *
     * Returns a string containing the range's row and column information, given like this:
     *
     *    [start.row/start.column] -> [end.row/end.column]
     *
     **/ 

    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    /** related to: Range.compare
     * Range.contains(row, column) -> Boolean
     * - row (Number): A row to check for
     * - column (Number): A column to check for
     *
     * Returns `true` if the `row` and `column` provided are within the given range. This can better be expressed as returning `true` if:
     *
     *    this.start.row <= row <= this.end.row &&
     *    this.start.column <= column <= this.end.column
     *
     **/ 

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };

    /** related to: Range.compare
     * Range.compareRange(range) -> Number
     * - range (Range): A range to compare with
     * + (Number): This method returns one of the following numbers:<br/>
     * <br/>
     * * `-2`: (B) is in front of (A), and doesn't intersect with (A)<br/>
     * * `-1`: (B) begins before (A) but ends inside of (A)<br/>
     * * `0`: (B) is completely inside of (A) OR (A) is completely inside of (B)<br/>
     * * `+1`: (B) begins inside of (A) but ends outside of (A)<br/>
     * * `+2`: (B) is after (A) and doesn't intersect with (A)<br/>
     * * `42`: FTW state: (B) ends in (A) but starts outside of (A)
     * 
     * Compares `this` range (A) with another range (B).
     *
     **/ 
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

    /** related to: Range.compare
     * Range.comparePoint(p) -> Number
     * - p (Range): A point to compare with
     * + (Number): This method returns one of the following numbers:<br/>
     * * `0` if the two points are exactly equal<br/>
     * * `-1` if `p.row` is less then the calling range<br/>
     * * `1` if `p.row` is greater than the calling range<br/>
     * <br/>
     * If the starting row of the calling range is equal to `p.row`, and:<br/>
     * * `p.column` is greater than or equal to the calling range's starting column, this returns `0`<br/>
     * * Otherwise, it returns -1<br/>
     *<br/>
     * If the ending row of the calling range is equal to `p.row`, and:<br/>
     * * `p.column` is less than or equal to the calling range's ending column, this returns `0`<br/>
     * * Otherwise, it returns 1<br/>
     *
     * Checks the row and column points of `p` with the row and column points of the calling range.
     *
     * 
     *
     **/ 
    this.comparePoint = function(p) {
        return this.compare(p.row, p.column);
    }

    /** related to: Range.comparePoint
     * Range.containsRange(range) -> Boolean
     * - range (Range): A range to compare with
     *
     * Checks the start and end points of `range` and compares them to the calling range. Returns `true` if the `range` is contained within the caller's range.
     *
     **/ 
    this.containsRange = function(range) {
        return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    }

    /**
     * Range.intersects(range) -> Boolean
     * - range (Range): A range to compare with
     *
     * Returns `true` if passed in `range` intersects with the one calling this method.
     *
     **/
    this.intersects = function(range) {
        var cmp = this.compareRange(range);
        return (cmp == -1 || cmp == 0 || cmp == 1);
    }

    /**
     * Range.isEnd(row, column) -> Boolean
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     *
     * Returns `true` if the caller's ending row point is the same as `row`, and if the caller's ending column is the same as `column`.
     *
     **/
    this.isEnd = function(row, column) {
        return this.end.row == row && this.end.column == column;
    }

    /**
     * Range.isStart(row, column) -> Boolean
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     *
     * Returns `true` if the caller's starting row point is the same as `row`, and if the caller's starting column is the same as `column`.
     *
     **/ 
    this.isStart = function(row, column) {
        return this.start.row == row && this.start.column == column;
    }

    /**
     * Range.setStart(row, column)
     * - row (Number): A row point to set
     * - column (Number): A column point to set
     *
     * Sets the starting row and column for the range.
     *
     **/ 
    this.setStart = function(row, column) {
        if (typeof row == "object") {
            this.start.column = row.column;
            this.start.row = row.row;
        } else {
            this.start.row = row;
            this.start.column = column;
        }
    }

    /**
     * Range.setEnd(row, column)
     * - row (Number): A row point to set
     * - column (Number): A column point to set
     *
     * Sets the starting row and column for the range.
     *
     **/ 
    this.setEnd = function(row, column) {
        if (typeof row == "object") {
            this.end.column = row.column;
            this.end.row = row.row;
        } else {
            this.end.row = row;
            this.end.column = column;
        }
    }

    /** related to: Range.compare
     * Range.inside(row, column) -> Boolean
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     *
     * Returns `true` if the `row` and `column` are within the given range.
     *
     **/ 
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

    /** related to: Range.compare
     * Range.insideStart(row, column) -> Boolean
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     *
     * Returns `true` if the `row` and `column` are within the given range's starting points.
     *
     **/ 
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

    /** related to: Range.compare
     * Range.insideEnd(row, column) -> Boolean
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     *
     * Returns `true` if the `row` and `column` are within the given range's ending points.
     *
     **/ 
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

    /** 
     * Range.compare(row, column) -> Number
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     * + (Number): This method returns one of the following numbers:<br/>
     * * `0` if the two points are exactly equal <br/>
     * * `-1` if `p.row` is less then the calling range <br/>
     * * `1` if `p.row` is greater than the calling range <br/>
     *  <br/>
     * If the starting row of the calling range is equal to `p.row`, and: <br/>
     * * `p.column` is greater than or equal to the calling range's starting column, this returns `0`<br/>
     * * Otherwise, it returns -1<br/>
     * <br/>
     * If the ending row of the calling range is equal to `p.row`, and: <br/>
     * * `p.column` is less than or equal to the calling range's ending column, this returns `0` <br/>
     * * Otherwise, it returns 1
     *
     * Checks the row and column points with the row and column points of the calling range.
     *
     *
     **/
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
     * Range.compareStart(row, column) -> Number
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     * + (Number): This method returns one of the following numbers:<br/>
     * <br/>
     * * `0` if the two points are exactly equal<br/>
     * * `-1` if `p.row` is less then the calling range<br/>
     * * `1` if `p.row` is greater than the calling range, or if `isStart` is `true`.<br/>
     * <br/>
     * If the starting row of the calling range is equal to `p.row`, and:<br/>
     * * `p.column` is greater than or equal to the calling range's starting column, this returns `0`<br/>
     * * Otherwise, it returns -1<br/>
     * <br/>
     * If the ending row of the calling range is equal to `p.row`, and:<br/>
     * * `p.column` is less than or equal to the calling range's ending column, this returns `0`<br/>
     * * Otherwise, it returns 1
     *
     * Checks the row and column points with the row and column points of the calling range.
     *
     *
     *
     **/
    this.compareStart = function(row, column) {
        if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    }

    /**
     * Range.compareEnd(row, column) -> Number
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     * + (Number): This method returns one of the following numbers:<br/>
     * * `0` if the two points are exactly equal<br/>
     * * `-1` if `p.row` is less then the calling range<br/>
     * * `1` if `p.row` is greater than the calling range, or if `isEnd` is `true.<br/>
     * <br/>
     * If the starting row of the calling range is equal to `p.row`, and:<br/>
     * * `p.column` is greater than or equal to the calling range's starting column, this returns `0`<br/>
     * * Otherwise, it returns -1<br/>
     *<br/>
     * If the ending row of the calling range is equal to `p.row`, and:<br/>
     * * `p.column` is less than or equal to the calling range's ending column, this returns `0`<br/>
     * * Otherwise, it returns 1
     *
     * Checks the row and column points with the row and column points of the calling range.
     *
     *
     **/
    this.compareEnd = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else {
            return this.compare(row, column);
        }
    }

   /** 
     * Range.compareInside(row, column) -> Number
     * - row (Number): A row point to compare with
     * - column (Number): A column point to compare with
     * + (Number): This method returns one of the following numbers:<br/>
     * * `1` if the ending row of the calling range is equal to `row`, and the ending column of the calling range is equal to `column`<br/>
     * * `-1` if the starting row of the calling range is equal to `row`, and the starting column of the calling range is equal to `column`<br/>
     * <br/>
     * Otherwise, it returns the value after calling [[Range.compare `compare()`]].
     *
     * Checks the row and column points with the row and column points of the calling range.
     *
     *
     *
     **/
    this.compareInside = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    }

   /** 
     * Range.clipRows(firstRow, lastRow) -> Range
     * - firstRow (Number): The starting row
     * - lastRow (Number): The ending row
     *
     * Returns the part of the current `Range` that occurs within the boundaries of `firstRow` and `lastRow` as a new `Range` object.
     *
    **/
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

   /** 
     * Range.extend(row, column) -> Range
     * - row (Number): A new row to extend to
     * - column (Number): A new column to extend to
     *
     *  Changes the row and column points for the calling range for both the starting and ending points. This method returns that range with a new row.
     *
    **/
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

   /** 
     * Range.isMultiLine() -> Boolean
     *
     * Returns true if the range spans across multiple lines.
     *
    **/
    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };

   /** 
     * Range.clone() -> Range
     *
     * Returns a duplicate of the calling range.
     *
    **/
    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };

   /** 
     * Range.collapseRows() -> Range
     *
     * Returns a range containing the starting and ending rows of the original range, but with a column value of `0`.
     *
    **/
    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };

   /** 
     * Range.toScreenRange(session) -> Range
     * - session (EditSession): The `EditSession` to retrieve coordinates from
     * 
     * Given the current `Range`, this function converts those starting and ending points into screen positions, and then returns a new `Range` object.
    **/
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

/** 
 * Range.fromPoints(start, end) -> Range
 * - start (Range): A starting point to use
 * - end (Range): An ending point to use
 * 
 * Creates and returns a new `Range` based on the row and column of the given parameters.
 *
**/
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
 * class Anchor
 *
 * Defines the floating pointer in the document. Whenever text is inserted or deleted before the cursor, the position of the cursor is updated
 *
 **/

/**
 * new Anchor(doc, row, column)
 * - doc (Document): The document to associate with the anchor
 * - row (Number): The starting row position
 * - column (Number): The starting column position
 *
 * Creates a new `Anchor` and associates it with a document.
 *
 **/

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
    
    /**
     * Anchor.getPosition() -> Object
     *
     * Returns an object identifying the `row` and `column` position of the current anchor.
     *
     **/

    this.getPosition = function() {
        return this.$clipPositionToDocument(this.row, this.column);
    };
 
     /**
     * Anchor.getDocument() -> Document
     *
     * Returns the current document.
     *
     **/
        
    this.getDocument = function() {
        return this.document;
    };
    
     /**
     * Anchor@onChange(e)
     * - e (Event): Contains data about the event
     *
     * Fires whenever the anchor position changes. Events that can trigger this function include `'includeText'`, `'insertLines'`, `'removeText'`, and `'removeLines'`.
     *
     **/

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

     /**
     * Anchor.setPosition(row, column, noClip)
     * - row (Number): The row index to move the anchor to
     * - column (Number): The column index to move the anchor to
     * - noClip (Boolean): Identifies if you want the position to be clipped
     *
     * Sets the anchor position to the specified row and column. If `noClip` is `true`, the position is not clipped.
     *
     **/

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
    
    /**
     * Anchor.detach()
     *
     * When called, the `'change'` event listener is removed.
     *
     **/

    this.detach = function() {
        this.document.removeEventListener("change", this.$onChange);
    };
    
    /** internal, hide
     * Anchor.clipPositionToDocument(row, column)
     * - row (Number): The row index to clip the anchor to
     * - column (Number): The column index to clip the anchor to
     *
     * Clips the anchor position to the specified row and column.
     *
     **/

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

/*
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
    
completer.complete = function(doc, fullAst, pos, currentNode, callback) {
    var identDict = analyze(doc, pos);
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    
    var allIdentifiers = [];
    for (var ident in identDict) {
        allIdentifiers.push(ident);
    }
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);

    callback(matches.map(function(m) {
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          score       : identDict[m],
          meta        : "",
          priority    : 1
        };
    }));
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
    parse: function(doc, callback) {
        callback();
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
    onParse: function(ast, callback) {
        callback();
    },
    
    /**
     * Invoked when the document has been updated (possibly after a certain interval)
     * @param doc the document object
     */
    onUpdate: function(doc, callback) {
        callback();
    },
    
    /**
     * Invoked when a new document has been opened
     * @param path the path of the newly opened document
     * @param doc the document object
     * @param oldPath the path of the document that was active before
     */
    onDocumentOpen: function(path, doc, oldPath, callback) {
        callback();
    },
    
    /**
     * Invoked when a document is closed in the IDE
     * @param path the path of the file
     */
    onDocumentClose: function(path, callback) {
        callback();
    },
    
    /**
     * Invoked when the cursor has been moved inside to a different AST node
     * @return a JSON object with three optional keys: {markers: [...], hint: {message: ...}, enableRefactoring: [...]}
     */
    onCursorMovedNode: function(doc, fullAst, cursorPos, currentNode, callback) {
        callback();
    },
    
    /**
     * Invoked when an outline is required
     * @return a JSON outline structure or null if not supported
     */
    outline: function(ast, callback) {
        callback();
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
    complete: function(doc, fullAst, cursorPos, currentNode, callback) {
        callback();
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
    analyze: function(doc, fullAst, callback) {
        callback();
    },
    
    /**
     * Invoked when inline variable renaming is activated
     * @return an array of positions of the currently selected variable
     */
    getVariablePositions: function(doc, fullAst, pos, currentNode, callback) {
        callback();
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
    for (var i = startIdx; i < allIdentifiers.length && allIdentifiers[i].indexOf(prefix) === 0; i++)
        matches.push(allIdentifiers[i]);
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

completer.complete = function(doc, fullAst, pos, currentNode, callback) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    if(line[pos.column-1] === '.') // No snippet completion after "."
        return;

    var snippets = snippetCache[this.language];
    
    if (snippets === undefined) {
        var text = this.fetchText('ext/codecomplete/snippets/' + this.language + '.json');
        snippets = text ? JSON.parse(text) : {};
        // Cache
        snippetCache[this.language] = snippets;
    }
    
    var allIdentifiers = Object.keys(snippets);
    
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);
    callback(matches.map(function(m) {
        return {
          name        : m,
          replaceText : snippets[m],
          icon        : null,
          meta        : "snippet",
          priority    : 2
        };
    }));
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

completer.onDocumentOpen = function(path, doc, oldPath, callback) {
    if (!analysisCache[path]) {
        analyzeDocument(path, doc.getValue());
    }
    callback();
};
    
completer.onDocumentClose = function(path, callback) {
    removeDocumentFromCache(path);
    callback();
};

completer.onUpdate = function(doc, callback) {
    removeDocumentFromCache(this.path);
    analyzeDocument(this.path, doc.getValue());
    callback();
};

completer.complete = function(doc, fullAst, pos, currentNode, callback) {
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

    callback(matches.map(function(m) {
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
    }));
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
    
handler.parse = function(code, callback) {
    code = code.replace(/^(#!.*\n)/, "//$1");
    callback(parser.parse(code));
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
define('ext/jslanguage/scope_analyzer', ['require', 'exports', 'module' , 'ext/language/base_handler', 'ext/codecomplete/complete_util', 'treehugger/traverse'], function(require, exports, module) {
    
var baseLanguageHandler = require('ext/language/base_handler');
var completeUtil = require("ext/codecomplete/complete_util");
var handler = module.exports = Object.create(baseLanguageHandler);
require('treehugger/traverse');

// Based on https://github.com/jshint/jshint/blob/master/jshint.js#L331
var GLOBALS = {
    // Literals
    "true"                   : true,
    "false"                  : true,
    "undefined"              : true,
    "null"                   : true,
    "this"                   : true,
    "arguments"              : true,
    self                     : true,
    Infinity                 : true,
    onmessage                : true,
    postMessage              : true,
    importScripts            : true,
    "continue"               : true,
    "return"                 : true,
    "else"                   : true,
    // Browser
    ArrayBuffer              : true,
    ArrayBufferView          : true,
    Audio                    : true,
    addEventListener         : true,
    applicationCache         : true,
    blur                     : true,
    clearInterval            : true,
    clearTimeout             : true,
    close                    : true,
    closed                   : true,
    DataView                 : true,
    defaultStatus            : true,
    document                 : true,
    event                    : true,
    FileReader               : true,
    Float32Array             : true,
    Float64Array             : true,
    FormData                 : true,
    getComputedStyle         : true,
    CDATASection             : true,
    HTMLElement              : true,
    HTMLAnchorElement        : true,
    HTMLBaseElement          : true,
    HTMLBlockquoteElement    : true,
    HTMLBodyElement          : true,
    HTMLBRElement            : true,
    HTMLButtonElement        : true,
    HTMLCanvasElement        : true,
    HTMLDirectoryElement     : true,
    HTMLDivElement           : true,
    HTMLDListElement         : true,
    HTMLFieldSetElement      : true,
    HTMLFontElement          : true,
    HTMLFormElement          : true,
    HTMLFrameElement         : true,
    HTMLFrameSetElement      : true,
    HTMLHeadElement          : true,
    HTMLHeadingElement       : true,
    HTMLHRElement            : true,
    HTMLHtmlElement          : true,
    HTMLIFrameElement        : true,
    HTMLImageElement         : true,
    HTMLInputElement         : true,
    HTMLIsIndexElement       : true,
    HTMLLabelElement         : true,
    HTMLLayerElement         : true,
    HTMLLegendElement        : true,
    HTMLLIElement            : true,
    HTMLLinkElement          : true,
    HTMLMapElement           : true,
    HTMLMenuElement          : true,
    HTMLMetaElement          : true,
    HTMLModElement           : true,
    HTMLObjectElement        : true,
    HTMLOListElement         : true,
    HTMLOptGroupElement      : true,
    HTMLOptionElement        : true,
    HTMLParagraphElement     : true,
    HTMLParamElement         : true,
    HTMLPreElement           : true,
    HTMLQuoteElement         : true,
    HTMLScriptElement        : true,
    HTMLSelectElement        : true,
    HTMLStyleElement         : true,
    HTMLTableCaptionElement  : true,
    HTMLTableCellElement     : true,
    HTMLTableColElement      : true,
    HTMLTableElement         : true,
    HTMLTableRowElement      : true,
    HTMLTableSectionElement  : true,
    HTMLTextAreaElement      : true,
    HTMLTitleElement         : true,
    HTMLUListElement         : true,
    HTMLVideoElement         : true,
    Int16Array               : true,
    Int32Array               : true,
    Int8Array                : true,
    Image                    : true,
    localStorage             : true,
    location                 : true,
    navigator                : true,
    open                     : true,
    openDatabase             : true,
    Option                   : true,
    parent                   : true,
    print                    : true,
    removeEventListener      : true,
    resizeBy                 : true,
    resizeTo                 : true,
    screen                   : true,
    scroll                   : true,
    scrollBy                 : true,
    scrollTo                 : true,
    sessionStorage           : true,
    setInterval              : true,
    setTimeout               : true,
    SharedWorker             : true,
    Uint16Array              : true,
    Uint32Array              : true,
    Uint8Array               : true,
    WebSocket                : true,
    window                   : true,
    Worker                   : true,
    XMLHttpRequest           : true,
    XPathEvaluator           : true,
    XPathException           : true,
    XPathExpression          : true,
    XPathNamespace           : true,
    XPathNSResolver          : true,
    XPathResult              : true,
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

var scopeId = 0;

var Variable = module.exports.Variable = function Variable(declaration) {
    this.declarations = [];
    if(declaration)
        this.declarations.push(declaration);
    this.uses = [];
    this.values = [];
}

Variable.prototype.addUse = function(node) {
    this.uses.push(node);
};

Variable.prototype.addDeclaration = function(node) {
    this.declarations.push(node);
};

/**
 * Implements Javascript's scoping mechanism using a hashmap with parent
 * pointers.
 */
var Scope = module.exports.Scope = function Scope(parent) {
    this.id = scopeId++;
    this.parent = parent;
    this.vars = {};
};

/**
 * Declare a variable in the current scope
 */
Scope.prototype.declare = function(name, resolveNode) {
    if(!this.vars['_'+name]) 
        this.vars['_'+name] = new Variable(resolveNode);
    else if(resolveNode)
        this.vars['_'+name].addDeclaration(resolveNode);
    return this.vars['_'+name];
};

Scope.prototype.isDeclared = function(name) {
    return !!this.get(name);
};

/**
 * Get possible values of a variable
 * @param name name of variable
 * @return Variable instance 
 */
Scope.prototype.get = function(name) {
    if(this.vars['_'+name])
        return this.vars['_'+name];
    else if(this.parent)
        return this.parent.get(name);
};

Scope.prototype.getVariableNames = function() {
    var names = [];
    for(var p in this.vars) {
        if(this.vars.hasOwnProperty(p)) {
            names.push(p.slice(1));
        }
    }
    if(this.parent) {
        var namesFromParent = this.parent.getVariableNames();
        for (var i = 0; i < namesFromParent.length; i++) {
            names.push(namesFromParent[i]);
        }
    }
    return names;
};

var GLOBALS_ARRAY = Object.keys(GLOBALS);

handler.complete = function(doc, fullAst, pos, currentNode, callback) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);

    var matches = completeUtil.findCompletions(identifier, GLOBALS_ARRAY);
    callback(matches.map(function(m) {
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          meta        : "EcmaScript",
          priority    : 0
        };
    }));
};

handler.analyze = function(doc, ast, callback) {
    var handler = this;
    var markers = [];
    
    // Preclare variables (pre-declares, yo!)
    function preDeclareHoisted(scope, node) {
        node.traverseTopDown(
            // var bla;
            'VarDecl(x)', function(b, node) {
                node.setAnnotation("scope", scope);
                scope.declare(b.x.value, b.x);
                return node;
            },
            // var bla = 10;
            'VarDeclInit(x, e)', function(b, node) {
                node.setAnnotation("scope", scope);
                scope.declare(b.x.value, b.x);
            },
            // function bla(farg) { }
            'Function(x, _, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(b.x.value) {
                    scope.declare(b.x.value, b.x);
                }
                return node;
            }
        );
    }
    
    function scopeAnalyzer(scope, node, parentLocalVars) {
        preDeclareHoisted(scope, node);
        var localVariables = parentLocalVars || [];
        node.setAnnotation("scope", scope);
        function analyze(scope, node) {
            node.traverseTopDown(
                'VarDecl(x)', function(b) {
                    localVariables.push(scope.get(b.x.value));
                },
                'VarDeclInit(x, _)', function(b) {
                    localVariables.push(scope.get(b.x.value));
                },
                'Assign(Var(x), e)', function(b, node) {
                    if(!scope.isDeclared(b.x.value)) {
                        markers.push({
                            pos: node[0].getPos(),
                            level: 'warning',
                            type: 'warning',
                            message: "Assigning to undeclared variable."
                        });
                    }
                    else {
                        scope.get(b.x.value).addUse(node[0]);
                    }
                    analyze(scope, b.e);
                    return this;
                },
                'ForIn(Var(x), e, stats)', function(b) {
                    if(!scope.isDeclared(b.x.value)) {
                        markers.push({
                            pos: this.getPos(),
                            level: 'warning',
                            type: 'warning',
                            message: "Using undeclared variable as iterator variable."
                        });
                    }
                    analyze(scope, b.e);
                    analyze(scope, b.stats);
                    return this;
                },
                'Var(x)', function(b, node) {
                    node.setAnnotation("scope", scope);
                    if(scope.isDeclared(b.x.value)) {
                        scope.get(b.x.value).addUse(node);
                    } else if(handler.isFeatureEnabled("undeclaredVars") && !GLOBALS[b.x.value]) {
                        markers.push({
                            pos: this.getPos(),
                            level: 'warning',
                            type: 'warning',
                            message: "Undeclared variable."
                        });
                    }
                    return node;
                },
                'Function(x, fargs, body)', function(b, node) {
                    var newScope = new Scope(scope);
                    node.setAnnotation("localScope", newScope);
                    newScope.declare("this");
                    b.fargs.forEach(function(farg) {
                        farg.setAnnotation("scope", newScope);
                        var v = newScope.declare(farg[0].value, farg);
                        if (handler.isFeatureEnabled("unusedFunctionArgs"))
                            localVariables.push(v);
                    });
                    scopeAnalyzer(newScope, b.body);
                    return node;
                },
                'Catch(x, body)', function(b, node) {
                    var oldVar = scope.get(b.x.value);
                    // Temporarily override
                    scope.vars[b.x.value] = new Variable(b.x);
                    scopeAnalyzer(scope, b.body, localVariables);
                    // Put back
                    scope.vars[b.x.value] = oldVar;
                    return node;
                },
                'PropAccess(_, "lenght")', function(b, node) {
                    markers.push({
                        pos: node.getPos(),
                        type: 'warning',
                        level: 'warning',
                        message: "Did you mean 'length'?"
                    });
                },
                'Call(Var("parseInt"), [_])', function() {
                    markers.push({
                        pos: this[0].getPos(),
                        type: 'info',
                        level: 'info',
                        message: "Missing radix argument."
                    });
                },
                'Block(_)', function() {
                    this.setAnnotation("scope", scope);
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
                            level: 'info',
                            message: 'Unused variable.'
                        });
                    });
                }
            }
        }
    }
    var rootScope = new Scope();
    scopeAnalyzer(rootScope, ast);
    callback(markers);
};

handler.onCursorMovedNode = function(doc, fullAst, cursorPos, currentNode, callback) {
    if (!currentNode)
        return callback();
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
            var v = scope.get(b.x.value);
            highlightVariable(v);
            // Let's not enable renaming 'this' and only rename declared variables
            if(b.x.value !== "this" && v)
                enableRefactorings.push("renameVariable");
        },
        'VarDeclInit(x, _)', function(b) {
            highlightVariable(this.getAnnotation("scope").get(b.x.value));
            enableRefactorings.push("renameVariable");
        },
        'VarDecl(x)', function(b) {
            highlightVariable(this.getAnnotation("scope").get(b.x.value));
            enableRefactorings.push("renameVariable");
        },
        'FArg(x)', function(b) {
            highlightVariable(this.getAnnotation("scope").get(b.x.value));
            enableRefactorings.push("renameVariable");
        },
        'Function(x, _, _)', function(b) {
            // Only for named functions
            if(!b.x.value)
                return;
            highlightVariable(this.getAnnotation("scope").get(b.x.value));
            enableRefactorings.push("renameVariable");
        }
    );
    
    if (!this.isFeatureEnabled("instanceHighlight"))
        return callback({ enableRefactorings: enableRefactorings });

    callback({
        markers: markers,
        enableRefactorings: enableRefactorings
    });
};

handler.getVariablePositions = function(doc, fullAst, cursorPos, currentNode, callback) {
    var v;
    var mainNode;    
    currentNode.rewrite(
        'VarDeclInit(x, _)', function(b, node) {
            v = node.getAnnotation("scope").get(b.x.value);
            mainNode = b.x;
        },
        'VarDecl(x)', function(b, node) {
            v = node.getAnnotation("scope").get(b.x.value);
            mainNode = b.x;
        },
        'FArg(x)', function(b, node) {
            v = node.getAnnotation("scope").get(b.x.value);
            mainNode = node;
        },
        'Function(x, _, _)', function(b, node) {
            if(!b.x.value)
                return;
            v = node.getAnnotation("scope").get(b.x.value);
            mainNode = b.x;
        },
        'Var(x)', function(b, node) {
            v = node.getAnnotation("scope").get(b.x.value);
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
    callback({
        length: length,
        pos: {
            row: pos.sl,
            column: pos.sc
        },
        others: others
    });
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
define('ext/jslanguage/narcissus_jshint', ['require', 'exports', 'module' , 'ext/language/base_handler', 'ace/worker/jshint'], function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var lint = require("ace/worker/jshint").JSHINT;
var handler = module.exports = Object.create(baseLanguageHandler);

var disabledJSHintWarnings = [/Missing radix parameter./, /Bad for in variable '(.+)'./, /use strict/];

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

handler.analysisRequiresParsing = function() {
    return false;
};

handler.analyze = function(doc, ast, callback) {
    var value = doc.getValue();
    value = value.replace(/^(#!.*\n)/, "//$1");

    var markers = [];
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
            var type = "warning"
            var reason = warning.reason;
            if(reason.indexOf("Expected") !== -1 && reason.indexOf("instead saw") !== -1) // Parse error!
                type = "error";
            if(reason.indexOf("Missing semicolon") !== -1)
                type = "info";
            for (var i = 0; i < disabledJSHintWarnings.length; i++)
                if(disabledJSHintWarnings[i].test(warning.reason))
                    return;
            markers.push({
                pos: {
                    sl: warning.line-1,
                    sc: warning.column-1
                },
                type: type,
                level: type,
                message: warning.reason
            });
        });
    }
    callback(markers);
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
     unused: [
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
 undef: true, maxlen: 100, indent:4
*/

/*members "\b", "\t", "\n", "\f", "\r", "!=", "!==", "\"", "%", "(begin)",
 "(breakage)", "(context)", "(error)", "(global)", "(identifier)", "(last)",
 "(line)", "(loopage)", "(name)", "(onevar)", "(params)", "(scope)",
 "(statement)", "(verb)", "*", "+", "++", "-", "--", "\/", "<", "<=", "==",
 "===", ">", ">=", $, $$, $A, $F, $H, $R, $break, $continue, $w, Abstract, Ajax,
 __filename, __dirname, ActiveXObject, Array, ArrayBuffer, ArrayBufferView, Audio,
 Autocompleter, Assets, Boolean, Builder, Buffer, Browser, COM, CScript, Canvas,
 CustomAnimation, Class, Control, Chain, Color, Cookie, Core, DataView, Date,
 Debug, Draggable, Draggables, Droppables, Document, DomReady, DOMReady, DOMParser, Drag,
 E, Enumerator, Enumerable, Element, Elements, Error, Effect, EvalError, Event,
 Events, FadeAnimation, Field, Flash, Float32Array, Float64Array, Form,
 FormField, Frame, FormData, Function, Fx, GetObject, Group, Hash, HotKey,
 HTMLElement, HTMLAnchorElement, HTMLBaseElement, HTMLBlockquoteElement,
 HTMLBodyElement, HTMLBRElement, HTMLButtonElement, HTMLCanvasElement, HTMLDirectoryElement,
 HTMLDivElement, HTMLDListElement, HTMLFieldSetElement,
 HTMLFontElement, HTMLFormElement, HTMLFrameElement, HTMLFrameSetElement,
 HTMLHeadElement, HTMLHeadingElement, HTMLHRElement, HTMLHtmlElement,
 HTMLIFrameElement, HTMLImageElement, HTMLInputElement, HTMLIsIndexElement,
 HTMLLabelElement, HTMLLayerElement, HTMLLegendElement, HTMLLIElement,
 HTMLLinkElement, HTMLMapElement, HTMLMenuElement, HTMLMetaElement,
 HTMLModElement, HTMLObjectElement, HTMLOListElement, HTMLOptGroupElement,
 HTMLOptionElement, HTMLParagraphElement, HTMLParamElement, HTMLPreElement,
 HTMLQuoteElement, HTMLScriptElement, HTMLSelectElement, HTMLStyleElement,
 HtmlTable, HTMLTableCaptionElement, HTMLTableCellElement, HTMLTableColElement,
 HTMLTableElement, HTMLTableRowElement, HTMLTableSectionElement,
 HTMLTextAreaElement, HTMLTitleElement, HTMLUListElement, HTMLVideoElement,
 Iframe, IframeShim, Image, Int16Array, Int32Array, Int8Array,
 Insertion, InputValidator, JSON, Keyboard, Locale, LN10, LN2, LOG10E, LOG2E,
 MAX_VALUE, MIN_VALUE, Mask, Math, MenuItem, MessageChannel, MessageEvent, MessagePort,
 MoveAnimation, MooTools, Native, NEGATIVE_INFINITY, Number, Object, ObjectRange, Option,
 Options, OverText, PI, POSITIVE_INFINITY, PeriodicalExecuter, Point, Position, Prototype,
 RangeError, Rectangle, ReferenceError, RegExp, ResizeAnimation, Request, RotateAnimation,
 SQRT1_2, SQRT2, ScrollBar, ScriptEngine, ScriptEngineBuildVersion,
 ScriptEngineMajorVersion, ScriptEngineMinorVersion, Scriptaculous, Scroller,
 Slick, Slider, Selector, SharedWorker, String, Style, SyntaxError, Sortable, Sortables,
 SortableObserver, Sound, Spinner, System, Swiff, Text, TextArea, Template,
 Timer, Tips, Type, TypeError, Toggle, Try, "use strict", unescape, URI, URIError, URL,
 VBArray, WSH, WScript, XDomainRequest, Web, Window, XMLDOM, XMLHttpRequest, XMLSerializer,
 XPathEvaluator, XPathException, XPathExpression, XPathNamespace, XPathNSResolver, XPathResult,
 "\\", a, addEventListener, address, alert, apply, applicationCache, arguments, arity, asi, atob,
 b, basic, basicToken, bitwise, block, blur, boolOptions, boss, browser, btoa, c, call, callee,
 caller, cases, charAt, charCodeAt, character, clearInterval, clearTimeout,
 close, closed, closure, comment, condition, confirm, console, constructor,
 content, couch, create, css, curly, d, data, datalist, dd, debug, decodeURI,
 decodeURIComponent, defaultStatus, defineClass, deserialize, devel, document,
 dojo, dijit, dojox, define, else, emit, encodeURI, encodeURIComponent,
 entityify, eqeqeq, eqnull, errors, es5, escape, esnext, eval, event, evidence, evil,
 ex, exception, exec, exps, expr, exports, FileReader, first, floor, focus,
 forin, fragment, frames, from, fromCharCode, fud, funcscope, funct, function, functions,
 g, gc, getComputedStyle, getRow, getter, getterToken, GLOBAL, global, globals, globalstrict,
 hasOwnProperty, help, history, i, id, identifier, immed, implieds, importPackage, include,
 indent, indexOf, init, ins, instanceOf, isAlpha, isApplicationRunning, isArray,
 isDigit, isFinite, isNaN, iterator, java, join, jshint,
 JSHINT, json, jquery, jQuery, keys, label, labelled, last, lastsemic, laxbreak, laxcomma,
 latedef, lbp, led, left, length, line, load, loadClass, localStorage, location,
 log, loopfunc, m, match, maxerr, maxlen, member,message, meta, module, moveBy,
 moveTo, mootools, multistr, name, navigator, new, newcap, noarg, node, noempty, nomen,
 nonew, nonstandard, nud, onbeforeunload, onblur, onerror, onevar, onecase, onfocus,
 onload, onresize, onunload, open, openDatabase, openURL, opener, opera, options, outer, param,
 parent, parseFloat, parseInt, passfail, plusplus, predef, print, process, prompt,
 proto, prototype, prototypejs, provides, push, quit, range, raw, reach, reason, regexp,
 readFile, readUrl, regexdash, removeEventListener, replace, report, require,
 reserved, resizeBy, resizeTo, resolvePath, resumeUpdates, respond, rhino, right,
 runCommand, scroll, screen, scripturl, scrollBy, scrollTo, scrollbar, search, seal,
 send, serialize, sessionStorage, setInterval, setTimeout, setter, setterToken, shift, slice,
 smarttabs, sort, spawn, split, stack, status, start, strict, sub, substr, supernew, shadow,
 supplant, sum, sync, test, toLowerCase, toString, toUpperCase, toint32, token, top, trailing,
 type, typeOf, Uint16Array, Uint32Array, Uint8Array, undef, undefs, unused, urls, validthis,
 value, valueOf, var, version, WebSocket, withstmt, white, window, Worker, wsh*/

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
            devel       : true, // if logging globals should be predefined (console,
                                // alert, etc.)
            dojo        : true, // if Dojo Toolkit globals should be predefined
            eqeqeq      : true, // if === should be required
            eqnull      : true, // if == null comparisons should be tolerated
            es5         : true, // if ES5 syntax should be allowed
            esnext      : true, // if es.next specific syntax should be allowed
            evil        : true, // if eval should be allowed
            expr        : true, // if ExpressionStatement should be allowed as Programs
            forin       : true, // if for in statements must filter
            funcscope   : true, // if only function scope should be used for scope tests
            globalstrict: true, // if global "use strict"; should be allowed (also
                                // enables 'strict')
            immed       : true, // if immediate invocations must be wrapped in parens
            iterator    : true, // if the `__iterator__` property should be allowed
            jquery      : true, // if jQuery globals should be predefined
            lastsemic   : true, // if semicolons may be ommitted for the trailing
                                // statements inside of a one-line blocks.
            latedef     : true, // if the use before definition should not be tolerated
            laxbreak    : true, // if line breaks should not be checked
            laxcomma    : true, // if line breaks should not be checked around commas
            loopfunc    : true, // if functions should be allowed to be defined within
                                // loops
            mootools    : true, // if MooTools globals should be predefined
            multistr    : true, // allow multiline strings
            newcap      : true, // if constructor names must be capitalized
            noarg       : true, // if arguments.caller and arguments.callee should be
                                // disallowed
            node        : true, // if the Node.js environment globals should be
                                // predefined
            noempty     : true, // if empty blocks should be disallowed
            nonew       : true, // if using `new` for side-effects should be disallowed
            nonstandard : true, // if non-standard (but widely adopted) globals should
                                // be predefined
            nomen       : true, // if names should be checked
            onevar      : true, // if only one var statement per function should be
                                // allowed
            onecase     : true, // if one case switch statements should be allowed
            passfail    : true, // if the scan should stop on first error
            plusplus    : true, // if increment/decrement should not be allowed
            proto       : true, // if the `__proto__` property should be allowed
            prototypejs : true, // if Prototype and Scriptaculous globals should be
                                // predefined
            regexdash   : true, // if unescaped first/last dash (-) inside brackets
                                // should be tolerated
            regexp      : true, // if the . should not be allowed in regexp literals
            rhino       : true, // if the Rhino environment globals should be predefined
            undef       : true, // if variables should be declared before used
            scripturl   : true, // if script-targeted URLs should be tolerated
            shadow      : true, // if variable shadowing should be tolerated
            smarttabs   : true, // if smarttabs should be tolerated
                                // (http://www.emacswiki.org/emacs/SmartTabs)
            strict      : true, // require the "use strict"; pragma
            sub         : true, // if all forms of subscript notation are tolerated
            supernew    : true, // if `new function () { ... };` and `new Object;`
                                // should be tolerated
            trailing    : true, // if trailing whitespace rules apply
            validthis   : true, // if 'this' inside a non-constructor function is valid.
                                // This is a function scoped option only.
            withstmt    : true, // if with statements should be allowed
            white       : true, // if strict whitespace rules apply
            wsh         : true  // if the Windows Scripting Host environment globals
                                // should be predefined
        },

        // These are the JSHint options that can take any value
        // (we use this object to detect invalid options)
        valOptions = {
            maxlen: false,
            indent: false,
            maxerr: false,
            predef: false
        },


        // browser contains a set of global names which are commonly provided by a
        // web browser environment.
        browser = {
            ArrayBuffer              :  false,
            ArrayBufferView          :  false,
            Audio                    :  false,
            addEventListener         :  false,
            applicationCache         :  false,
            atob                     :  false,
            blur                     :  false,
            btoa                     :  false,
            clearInterval            :  false,
            clearTimeout             :  false,
            close                    :  false,
            closed                   :  false,
            DataView                 :  false,
            DOMParser                :  false,
            defaultStatus            :  false,
            document                 :  false,
            event                    :  false,
            FileReader               :  false,
            Float32Array             :  false,
            Float64Array             :  false,
            FormData                 :  false,
            focus                    :  false,
            frames                   :  false,
            getComputedStyle         :  false,
            HTMLElement              :  false,
            HTMLAnchorElement        :  false,
            HTMLBaseElement          :  false,
            HTMLBlockquoteElement    :  false,
            HTMLBodyElement          :  false,
            HTMLBRElement            :  false,
            HTMLButtonElement        :  false,
            HTMLCanvasElement        :  false,
            HTMLDirectoryElement     :  false,
            HTMLDivElement           :  false,
            HTMLDListElement         :  false,
            HTMLFieldSetElement      :  false,
            HTMLFontElement          :  false,
            HTMLFormElement          :  false,
            HTMLFrameElement         :  false,
            HTMLFrameSetElement      :  false,
            HTMLHeadElement          :  false,
            HTMLHeadingElement       :  false,
            HTMLHRElement            :  false,
            HTMLHtmlElement          :  false,
            HTMLIFrameElement        :  false,
            HTMLImageElement         :  false,
            HTMLInputElement         :  false,
            HTMLIsIndexElement       :  false,
            HTMLLabelElement         :  false,
            HTMLLayerElement         :  false,
            HTMLLegendElement        :  false,
            HTMLLIElement            :  false,
            HTMLLinkElement          :  false,
            HTMLMapElement           :  false,
            HTMLMenuElement          :  false,
            HTMLMetaElement          :  false,
            HTMLModElement           :  false,
            HTMLObjectElement        :  false,
            HTMLOListElement         :  false,
            HTMLOptGroupElement      :  false,
            HTMLOptionElement        :  false,
            HTMLParagraphElement     :  false,
            HTMLParamElement         :  false,
            HTMLPreElement           :  false,
            HTMLQuoteElement         :  false,
            HTMLScriptElement        :  false,
            HTMLSelectElement        :  false,
            HTMLStyleElement         :  false,
            HTMLTableCaptionElement  :  false,
            HTMLTableCellElement     :  false,
            HTMLTableColElement      :  false,
            HTMLTableElement         :  false,
            HTMLTableRowElement      :  false,
            HTMLTableSectionElement  :  false,
            HTMLTextAreaElement      :  false,
            HTMLTitleElement         :  false,
            HTMLUListElement         :  false,
            HTMLVideoElement         :  false,
            history                  :  false,
            Int16Array               :  false,
            Int32Array               :  false,
            Int8Array                :  false,
            Image                    :  false,
            length                   :  false,
            localStorage             :  false,
            location                 :  false,
            MessageChannel           :  false,
            MessageEvent             :  false,
            MessagePort              :  false,
            moveBy                   :  false,
            moveTo                   :  false,
            name                     :  false,
            navigator                :  false,
            onbeforeunload           :  true,
            onblur                   :  true,
            onerror                  :  true,
            onfocus                  :  true,
            onload                   :  true,
            onresize                 :  true,
            onunload                 :  true,
            open                     :  false,
            openDatabase             :  false,
            opener                   :  false,
            Option                   :  false,
            parent                   :  false,
            print                    :  false,
            removeEventListener      :  false,
            resizeBy                 :  false,
            resizeTo                 :  false,
            screen                   :  false,
            scroll                   :  false,
            scrollBy                 :  false,
            scrollTo                 :  false,
            sessionStorage           :  false,
            setInterval              :  false,
            setTimeout               :  false,
            SharedWorker             :  false,
            status                   :  false,
            top                      :  false,
            Uint16Array              :  false,
            Uint32Array              :  false,
            Uint8Array               :  false,
            WebSocket                :  false,
            window                   :  false,
            Worker                   :  false,
            XMLHttpRequest           :  false,
            XMLSerializer            :  false,
            XPathEvaluator           :  false,
            XPathException           :  false,
            XPathExpression          :  false,
            XPathNamespace           :  false,
            XPathNSResolver          :  false,
            XPathResult              :  false
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
            module    : false,
            provides  : false
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
            __filename    : false,
            __dirname     : false,
            Buffer        : false,
            console       : false,
            exports       : false,
            GLOBAL        : false,
            global        : false,
            module        : false,
            process       : false,
            require       : false,
            setTimeout    : false,
            clearTimeout  : false,
            setInterval   : false,
            clearInterval : false
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
            defineClass  : false,
            deserialize  : false,
            gc           : false,
            help         : false,
            importPackage: false,
            "java"       : false,
            load         : false,
            loadClass    : false,
            print        : false,
            quit         : false,
            readFile     : false,
            readUrl      : false,
            runCommand   : false,
            seal         : false,
            serialize    : false,
            spawn        : false,
            sync         : false,
            toint32      : false,
            version      : false
        },

        scope,      // The current scope
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

        // widely adopted global names that are not part of ECMAScript standard
        nonstandard = {
            escape              : false,
            unescape            : false
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

        directive,
        syntax = {},
        tab,
        token,
        urls,
        useESNextSyntax,
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
            WScript                   : true,
            XDomainRequest            : true
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

    function checkOption(name, t) {
        if (valOptions[name] === undefined && boolOptions[name] === undefined) {
            warning("Bad option: '" + name + "'.", t);
        }
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
        if (option.couch) {
            combine(predefined, couch);
        }

        if (option.rhino) {
            combine(predefined, rhino);
        }

        if (option.prototypejs) {
            combine(predefined, prototypejs);
        }

        if (option.node) {
            combine(predefined, node);
            option.globalstrict = true;
        }

        if (option.devel) {
            combine(predefined, devel);
        }

        if (option.dojo) {
            combine(predefined, dojo);
        }

        if (option.browser) {
            combine(predefined, browser);
        }

        if (option.nonstandard) {
            combine(predefined, nonstandard);
        }

        if (option.jquery) {
            combine(predefined, jquery);
        }

        if (option.mootools) {
            combine(predefined, mootools);
        }

        if (option.wsh) {
            combine(predefined, wsh);
        }

        if (option.esnext) {
            useESNextSyntax();
        }

        if (option.globalstrict && option.strict !== false) {
            option.strict = true;
        }
    }


    // Produce an error warning.
    function quit(message, line, chr) {
        var percentage = Math.floor((line / lines.length) * 100);

        throw {
            name: 'JSHintError',
            line: line,
            character: chr,
            message: message + " (" + percentage + "% scanned).",
            raw: message
        };
    }

    function isundef(scope, m, t, a) {
        return JSHINT.undefs.push([scope, m, t, a]);
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

            // If smarttabs option is used check for spaces followed by tabs only.
            // Otherwise check for any occurence of mixed tabs and spaces.
            if (option.smarttabs)
                at = s.search(/ \t/);
            else
                at = s.search(/ \t|\t /);

            if (at >= 0)
                warningAt("Mixed spaces and tabs.", line, at + 1);

            s = s.replace(/\t/g, tab);
            at = s.search(cx);

            if (at >= 0)
                warningAt("Unsafe character.", line, at);

            if (option.maxlen && option.maxlen < s.length)
                warningAt("Line too long.", line, s.length);

            // Check for trailing whitespaces
            tw = option.trailing && s.match(/^(.*?)\s+$/);
            if (tw && !/^\s+$/.test(s)) {
                warningAt("Trailing whitespace.", line, tw[1].length + 1);
            }
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
                    if (!option.node || token.id === '.' ||
                            (value !== '__dirname' && value !== '__filename')) {
                        warningAt("Unexpected {a} in '{b}'.", line, from, "dangling '_'", value);
                    }
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
                    i === 'return' ||
                    i === 'case');
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
                if (lines[0] && lines[0].substr(0, 2) === '#!')
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


            // token -- this is called by advance to get the next token
            token: function () {
                var b, c, captures, d, depth, high, i, l, low, q, t, isLiteral, isInRange, n;

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
                    var c, j, r = '', allowNewLine = false;

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
unclosedString:     for (;;) {
                        while (j >= s.length) {
                            j = 0;

                            var cl = line, cf = from;
                            if (!nextLine()) {
                                errorAt("Unclosed string.", cl, cf);
                                break unclosedString;
                            }

                            if (allowNewLine) {
                                allowNewLine = false;
                            } else {
                                warningAt("Unclosed string.", cl, cf);
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
                            n = s.charAt(j + 1);
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
                            case '0':
                                c = '\0';
                                // Octal literals fail in strict mode
                                // check if the number is between 00 and 07
                                // where 'n' is the token next to 'c'
                                if (n >= 0 && n <= 7 && directive["use strict"]) {
                                    warningAt(
                                    "Octal literals are not allowed in strict mode.",
                                    line, character);
                                }
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
                            case '':
                                // last character is escape character
                                // always allow new line if escaped, but show
                                // warning if option is not set
                                allowNewLine = true;
                                if (option.multistr) {
                                    if (jsonmode) {
                                        warningAt("Avoid EOL escapement.", line, character);
                                    }
                                    c = '';
                                    character -= 1;
                                    break;
                                }
                                warningAt("Bad escapement of EOL. Use option multistr if needed.",
                                    line, character);
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
                            s = '';
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
                            s = '';
                            token.comment = true;
                            break;

    //      /* comment

                        case '/*':
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
                                errorAt("A regular expression literal can be confused with '/='.",
                                    line, from);
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
                                        errorAt("Unclosed regular expression.", line, from);
                                        return quit('Stopping.', line, from);
                                    case '/':
                                        if (depth > 0) {
                                            warningAt("{a} unterminated regular expression " +
                                                "group(s).", line, from + l, depth);
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
                                        if (c === ']') {
                                            warningAt("Empty class.", line,
                                                    from + l - 1);
                                        }
                                        isLiteral = false;
                                        isInRange = false;
klass:                                  do {
                                            c = s.charAt(l);
                                            l += 1;
                                            switch (c) {
                                            case '[':
                                            case '^':
                                                warningAt("Unescaped '{a}'.",
                                                        line, from + l, c);
                                                if (isInRange) {
                                                    isInRange = false;
                                                } else {
                                                    isLiteral = true;
                                                }
                                                break;
                                            case '-':
                                                if (isLiteral && !isInRange) {
                                                    isLiteral = false;
                                                    isInRange = true;
                                                } else if (isInRange) {
                                                    isInRange = false;
                                                } else if (s.charAt(l) === ']') {
                                                    isInRange = true;
                                                } else {
                                                    if (option.regexdash !== (l === 2 || (l === 3 &&
                                                        s.charAt(1) === '^'))) {
                                                        warningAt("Unescaped '{a}'.",
                                                            line, from + l - 1, '-');
                                                    }
                                                    isLiteral = true;
                                                }
                                                break;
                                            case ']':
                                                if (isInRange && !option.regexdash) {
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

                                                // \w, \s and \d are never part of a character range
                                                if (/[wsd]/i.test(c)) {
                                                    if (isInRange) {
                                                        warningAt("Unescaped '{a}'.",
                                                            line, from + l, '-');
                                                        isInRange = false;
                                                    }
                                                    isLiteral = false;
                                                } else if (isInRange) {
                                                    isInRange = false;
                                                } else {
                                                    isLiteral = true;
                                                }
                                                break;
                                            case '/':
                                                warningAt("Unescaped '{a}'.",
                                                        line, from + l - 1, '/');

                                                if (isInRange) {
                                                    isInRange = false;
                                                } else {
                                                    isLiteral = true;
                                                }
                                                break;
                                            case '<':
                                                if (isInRange) {
                                                    isInRange = false;
                                                } else {
                                                    isLiteral = true;
                                                }
                                                break;
                                            default:
                                                if (isInRange) {
                                                    isInRange = false;
                                                } else {
                                                    isLiteral = true;
                                                }
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
                if (!option.shadow && type !== "exception")
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

                if (o === '/*jshint') {
                    checkOption(t.value, t);
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
                } else if (t.value === 'validthis') {
                    if (funct['(global)']) {
                        error("Option 'validthis' can't be used in a global scope.");
                    } else {
                        if (v.value === 'true' || v.value === 'false')
                            obj[t.value] = v.value === 'true';
                        else
                            error("Bad option value.", v);
                    }
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
        var left, isArray = false, isObject = false;

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
                isArray = token.value === 'Array';
                isObject = token.value === 'Object';
                advance();
                if (isArray && token.id === '(' && nexttoken.id === ')')
                    warning("Use the array literal notation [].", token);
                if (isObject && token.id === '(' && nexttoken.id === ')')
                    warning("Use the object literal notation {}.", token);
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
                left.from += (left.character - left.from);
                warning("Unexpected space after '{a}'.", left, left.value);
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
                left.from += (left.character - left.from);
                warning("Missing space after '{a}'.",
                        left, left.value);
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
                left.from += (left.character - left.from);
                warning("Missing space after '{a}'.",
                        left, left.value);
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
            if (!option.laxcomma) {
                if (comma.first) {
                    warning("Comma warnings can be turned off with 'laxcomma'");
                    comma.first = false;
                }
                warning("Bad line breaking before '{a}'.", token, nexttoken.id);
            }
        } else if (!token.comment && token.character !== nexttoken.from && option.white) {
            token.from += (token.character - token.from);
            warning("Unexpected space after '{a}'.", token, token.value);
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
            if (s === "in" && left.id === "!") {
                warning("Confusing use of '{a}'.", left, '!');
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
                warning("Confusing use of '{a}'.", right, '!');
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
                if (option.esnext && funct[left.value] === 'const') {
                    warning("Attempting to override '{a}' which is a constant", left, left.value);
                }
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
                if (!fnparam || token.value !== 'undefined') {
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
                    if (!option.latedef) {
                        break;
                    }
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

        if (t.id === ";") {
            advance(";");
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

            if (nexttoken.id === ',') {
                return comma();
            }

            if (nexttoken.id !== ';') {
                if (!option.asi) {
                    // If this is the last statement in a block that ends on
                    // the same line *and* option lastsemic is on, ignore the warning.
                    // Otherwise, complain about missing semicolon.
                    if (!option.lastsemic || nexttoken.id !== '}' ||
                            nexttoken.line !== token.line) {
                        warningAt("Missing semicolon.", token.line, token.character);
                    }
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


    function statements(startLine) {
        var a = [], f, p;

        while (!nexttoken.reach && nexttoken.id !== '(end)') {
            if (nexttoken.id === ';') {
                p = peek();
                if (!p || p.id !== "(") {
                    warning("Unnecessary semicolon.");
                }
                advance(';');
            } else {
                a.push(statement(startLine === nexttoken.line));
            }
        }
        return a;
    }


    /*
     * read all directives
     * recognizes a simple form of asi, but always
     * warns, if it is used
     */
    function directives() {
        var i, p, pn;

        for (;;) {
            if (nexttoken.id === "(string)") {
                p = peek(0);
                if (p.id === "(endline)") {
                    i = 1;
                    do {
                        pn = peek(i);
                        i = i + 1;
                    } while (pn.id === "(endline)");

                    if (pn.id !== ";") {
                        if (pn.id !== "(string)" && pn.id !== "(number)" &&
                            pn.id !== "(regexp)" && pn.identifier !== true &&
                            pn.id !== "}") {
                            break;
                        }
                        warning("Missing semicolon.", nexttoken);
                    } else {
                        p = pn;
                    }
                } else if (p.id === "}") {
                    // directive with no other statements, warn about missing semicolon
                    warning("Missing semicolon.", p);
                } else if (p.id !== ";") {
                    break;
                }

                indentation();
                advance();
                if (directive[token.value]) {
                    warning("Unnecessary directive \"{a}\".", token, token.value);
                }

                if (token.value === "use strict") {
                    option.newcap = true;
                    option.undef = true;
                }

                // there's no directive negation, so always set to true
                directive[token.value] = true;

                if (p.id === ";") {
                    advance(";");
                }
                continue;
            }
            break;
        }
    }


    /*
     * Parses a single block. A block is a sequence of statements wrapped in
     * braces.
     *
     * ordinary - true for everything but function bodies and try blocks.
     * stmt     - true if block can be a single statement (e.g. in if/for/while).
     * isfunc   - true if block is a function body
     */
    function block(ordinary, stmt, isfunc) {
        var a,
            b = inblock,
            old_indent = indent,
            m,
            s = scope,
            t,
            line,
            d;

        inblock = ordinary;
        if (!ordinary || !option.funcscope) scope = Object.create(scope);
        nonadjacent(token, nexttoken);
        t = nexttoken;

        if (nexttoken.id === '{') {
            advance('{');
            line = token.line;
            if (nexttoken.id !== '}') {
                indent += option.indent;
                while (!ordinary && nexttoken.from > indent) {
                    indent += option.indent;
                }

                if (isfunc) {
                    m = {};
                    for (d in directive) {
                        if (is_own(directive, d)) {
                            m[d] = directive[d];
                        }
                    }
                    directives();

                    if (option.strict && funct['(context)']['(global)']) {
                        if (!m["use strict"] && !directive["use strict"]) {
                            warning("Missing \"use strict\" statement.");
                        }
                    }
                }

                a = statements(line);

                if (isfunc) {
                    directive = m;
                }

                indent -= option.indent;
                if (line !== nexttoken.line) {
                    indentation();
                }
            } else if (line !== nexttoken.line) {
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
            indent += option.indent;
            // test indentation only if statement is in new line
            a = [statement(nexttoken.line === token.line)];
            indent -= option.indent;
            noreach = false;
        }
        funct['(verb)'] = null;
        if (!ordinary || !option.funcscope) scope = s;
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
                // Change 'unused' to 'var', and reject labels.
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
            } else if (funct['(global)']) {
                // The name is not defined in the function.  If we are in the global
                // scope, then we have an undefined variable.
                //
                // Operators typeof and delete do not raise runtime errors even if
                // the base object of a reference is null so no need to display warning
                // if we're inside of typeof or delete.

                if (option.undef && typeof predefined[v] !== 'boolean') {
                    // Attempting to subscript a null reference will throw an
                    // error, even within the typeof and delete operators
                    if (!(anonname === 'typeof' || anonname === 'delete') ||
                        (nexttoken && (nexttoken.value === '.' || nexttoken.value === '['))) {

                        isundef(funct, "'{a}' is not defined.", token, v);
                    }
                }
                note_implied(token);
            } else {
                // If the name is already defined in the current
                // function, but not as outer, then there is a scope error.

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
                    // If the name is defined in an outer function, make an outer entry,
                    // and if it was unused, make it var.
                    if (s === true) {
                        funct[v] = true;
                    } else if (s === null) {
                        warning("'{a}' is not allowed.", token, v);
                        note_implied(token);
                    } else if (typeof s !== 'object') {
                        // Operators typeof and delete do not raise runtime errors even
                        // if the base object of a reference is null so no need to
                        // display warning if we're inside of typeof or delete.
                        if (option.undef) {
                            // Attempting to subscript a null reference will throw an
                            // error, even within the typeof and delete operators
                            if (!(anonname === 'typeof' || anonname === 'delete') ||
                                (nexttoken &&
                                    (nexttoken.value === '.' || nexttoken.value === '['))) {

                                isundef(funct, "'{a}' is not defined.", token, v);
                            }
                        }
                        funct[v] = true;
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
        if (directive['use strict'] && funct['(global)']) {
            warning("Strict violation.", x);
        }
    });
    reservevar('eval');
    reservevar('false');
    reservevar('Infinity');
    reservevar('NaN');
    reservevar('null');
    reservevar('this', function (x) {
        if (directive['use strict'] && !option.validthis && ((funct['(statement)'] &&
                funct['(name)'].charAt(0) > 'Z') || funct['(global)'])) {
            warning("Possible strict violation.", x);
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
        var eqnull = option.eqnull && (left.value === 'null' || right.value === 'null');

        if (!eqnull && option.eqeqeq)
            warning("Expected '{a}' and instead saw '{b}'.", this, '===', '==');
        else if (isPoorRelation(left))
            warning("Use '{a}' to compare with '{b}'.", this, '===', left.value);
        else if (isPoorRelation(right))
            warning("Use '{a}' to compare with '{b}'.", this, '===', right.value);

        return this;
    });
    relation('===');
    relation('!=', function (left, right) {
        var eqnull = option.eqnull &&
                (left.value === 'null' || right.value === 'null');

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
                            warning("A constructor name should start with an uppercase letter.",
                                token);
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
        if (left && left.value === 'arguments' && (m === 'callee' || m === 'caller')) {
            if (option.noarg)
                warning("Avoid arguments.{a}.", left, m);
            else if (directive['use strict'])
                error('Strict violation.');
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
            if (nexttoken.id === '(' ||
              (nexttoken.id === '.' && (peek().value === 'call' || peek().value === 'apply'))) {
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

        block(false, false, true);
        scope = oldScope;
        option = oldOption;
        funct['(last)'] = token.line;
        funct = funct['(context)'];
        return f;
    }


    (function (x) {
        x.nud = function () {
            var b, f, i, j, p, t;
            var props = {}; // All properties, including accessors

            function saveProperty(name, token) {
                if (props[name] && is_own(props, name))
                    warning("Duplicate member '{a}'.", nexttoken, i);
                else
                    props[name] = {};

                props[name].basic = true;
                props[name].basicToken = token;
            }

            function saveSetter(name, token) {
                if (props[name] && is_own(props, name)) {
                    if (props[name].basic || props[name].setter)
                        warning("Duplicate member '{a}'.", nexttoken, i);
                } else {
                    props[name] = {};
                }

                props[name].setter = true;
                props[name].setterToken = token;
            }

            function saveGetter(name) {
                if (props[name] && is_own(props, name)) {
                    if (props[name].basic || props[name].getter)
                        warning("Duplicate member '{a}'.", nexttoken, i);
                } else {
                    props[name] = {};
                }

                props[name].getter = true;
                props[name].getterToken = token;
            }

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
                    saveGetter(i);
                    t = nexttoken;
                    adjacent(token, nexttoken);
                    f = doFunction();
                    p = f['(params)'];
                    if (p) {
                        warning("Unexpected parameter '{a}' in get {b} function.", t, p[0], i);
                    }
                    adjacent(token, nexttoken);
                } else if (nexttoken.value === 'set' && peek().id !== ':') {
                    advance('set');
                    if (!option.es5) {
                        error("get/set are ES5 features.");
                    }
                    i = property_name();
                    if (!i) {
                        error("Missing property name.");
                    }
                    saveSetter(i, nexttoken);
                    t = nexttoken;
                    adjacent(token, nexttoken);
                    f = doFunction();
                    p = f['(params)'];
                    if (!p || p.length !== 1) {
                        warning("Expected a single parameter in set {a} function.", t, i);
                    }
                } else {
                    i = property_name();
                    saveProperty(i, nexttoken);
                    if (typeof i !== 'string') {
                        break;
                    }
                    advance(':');
                    nonadjacent(token, nexttoken);
                    expression(10);
                }

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

            // Check for lonely setters if in the ES5 mode.
            if (option.es5) {
                for (var name in props) {
                    if (is_own(props, name) && props[name].setter && !props[name].getter) {
                        warning("Setter is defined without getter.", props[name].setterToken);
                    }
                }
            }
            return this;
        };
        x.fud = function () {
            error("Expected to see a statement and instead saw a block.", token);
        };
    }(delim('{')));

// This Function is called when esnext option is set to true
// it adds the `const` statement to JSHINT

    useESNextSyntax = function () {
        var conststatement = stmt('const', function (prefix) {
            var id, name, value;

            this.first = [];
            for (;;) {
                nonadjacent(token, nexttoken);
                id = identifier();
                if (funct[id] === "const") {
                    warning("const '" + id + "' has already been declared");
                }
                if (funct['(global)'] && predefined[id] === false) {
                    warning("Redefinition of '{a}'.", token, id);
                }
                addlabel(id, 'const');
                if (prefix) {
                    break;
                }
                name = token;
                this.first.push(token);

                if (nexttoken.id !== "=") {
                    warning("const " +
                      "'{a}' is initialized to 'undefined'.", token, id);
                }

                if (nexttoken.id === '=') {
                    nonadjacent(token, nexttoken);
                    advance('=');
                    nonadjacent(token, nexttoken);
                    if (nexttoken.id === 'undefined') {
                        warning("It is not necessary to initialize " +
                          "'{a}' to 'undefined'.", token, id);
                    }
                    if (peek(0).id === '=' && nexttoken.identifier) {
                        error("Constant {a} was not declared correctly.",
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
        conststatement.exps = true;
    };

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
            if (option.esnext && funct[id] === "const") {
                warning("const '" + id + "' has already been declared");
            }
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
        if (option.esnext && funct[i] === "const") {
            warning("const '" + i + "' has already been declared");
        }
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

    blockstmt('with', function () {
        var t = nexttoken;
        if (directive['use strict']) {
            error("'with' is not allowed in strict mode.", token);
        } else if (!option.withstmt) {
            warning("Don't use 'with'.", token);
        }

        advance('(');
        nonadjacent(this, t);
        nospace();
        expression(0);
        advance(')', t);
        nospace(prevtoken, token);
        block(true, true);

        return this;
    });

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
                    if (!option.onecase)
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
                        g = false;
                        statements();
                        break;
                    default:
                        error("Missing ':' on a case clause.", token);
                        return;
                    }
                } else {
                    if (token.id === ':') {
                        advance(':');
                        error("Unexpected '{a}'.", token, ':');
                        statements();
                    } else {
                        error("Expected '{a}' and instead saw '{b}'.",
                            nexttoken, 'case', nexttoken.value);
                        return;
                    }
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
            if (option.forin && s && (s.length > 1 || typeof s[0] !== 'object' ||
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

        if (funct['(breakage)'] === 0)
            warning("Unexpected '{a}'.", nexttoken, this.value);

        if (!option.asi)
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

        if (funct['(breakage)'] === 0)
            warning("Unexpected '{a}'.", nexttoken, this.value);

        if (!option.asi)
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
        if (this.line === nexttoken.line) {
            if (nexttoken.id === '(regexp)')
                warning("Wrap the /regexp/ literal in parens to disambiguate the slash operator.");

            if (nexttoken.id !== ';' && !nexttoken.reach) {
                nonadjacent(token, nexttoken);
                if (peek().value === "=" && !option.boss) {
                    warningAt("Did you mean to return a conditional instead of an assignment?",
                              token.line, token.character + 1);
                }
                this.first = expression(0);
            }
        } else if (!option.asi) {
            nolinebreak(this); // always warn (Line breaking error)
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
        JSHINT.undefs = [];
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
        directive = {};

        prevtoken = token = nexttoken = syntax['(begin)'];

        // Check options
        for (var name in o) {
            if (is_own(o, name)) {
                checkOption(name, token);
            }
        }

        assume();

        // combine the passed globals after we've assumed all our options
        combine(predefined, g || {});

        //reset values
        comma.first = true;

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
                directives();
                if (directive["use strict"] && !option.globalstrict) {
                    warning("Use the function form of \"use strict\".", prevtoken);
                }

                statements();
            }
            advance('(end)');

            var markDefined = function (name, context) {
                do {
                    if (typeof context[name] === 'string') {
                        // JSHINT marks unused variables as 'unused' and
                        // unused function declaration as 'unction'. This
                        // code changes such instances back 'var' and
                        // 'closure' so that the code in JSHINT.data()
                        // doesn't think they're unused.

                        if (context[name] === 'unused')
                            context[name] = 'var';
                        else if (context[name] === 'unction')
                            context[name] = 'closure';

                        return true;
                    }

                    context = context['(context)'];
                } while (context);

                return false;
            };

            var clearImplied = function (name, line) {
                if (!implied[name])
                    return;

                var newImplied = [];
                for (var i = 0; i < implied[name].length; i += 1) {
                    if (implied[name][i] !== line)
                        newImplied.push(implied[name][i]);
                }

                if (newImplied.length === 0)
                    delete implied[name];
                else
                    implied[name] = newImplied;
            };

            // Check queued 'x is not defined' instances to see if they're still undefined.
            for (i = 0; i < JSHINT.undefs.length; i += 1) {
                k = JSHINT.undefs[i].slice(0);

                if (markDefined(k[2].value, k[0])) {
                    clearImplied(k[2].value, k[2].line);
                } else {
                    warning.apply(warning, k.slice(1));
                }
            }
        } catch (e) {
            if (e) {
                var nt = nexttoken || {};
                JSHINT.errors.push({
                    raw       : e.raw,
                    reason    : e.message,
                    line      : e.line || nt.line,
                    character : e.character || nt.from
                }, null);
            }
        }

        return JSHINT.errors.length === 0;
    };

    // Data summary.
    itself.data = function () {

        var data = { functions: [], options: option }, fu, globals, implieds = [], f, i, j,
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

    return itself;
}());

// Make JSHINT a Node module, if possible.
if (typeof exports === 'object' && exports)
    exports.JSHINT = JSHINT;

});
/**
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
