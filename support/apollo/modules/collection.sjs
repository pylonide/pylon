/*
 * Oni Apollo 'collection' module
 * Utility functions for processing collections
 *
 * Part of the Oni Apollo Standard Module Library
 * Version: 'unstable'
 * http://onilabs.com/apollo
 *
 * (c) 2010-2011 Oni Labs, http://onilabs.com
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

//TODO: Is there a likely performance difference between e.g map / mapSeq?
//for non-blocking functions, is it better to use sequential versions to save the
//indirection of all the waitFor branches?

/**
  @module  collection
  @summary Functional tools for iterating and processing collections (arrays or objects).
  @desc
    The collection module contains a number of building blocks common
    in functional programming and similar to libraries like
    [underscore.js](http://documentcloud.github.com/underscore/) and [Functional
    Javascript](http://osteele.com/sources/javascript/functional/).

    Where possible, the functions in this module work equally well
    iterating over elements in an array and properties of an object
    (ignoring properties on an object's prototype). `arguments`
    objects are treated like arrays.

    The top-level functions in this module operate sequentially
    over the items in a collection, suspending whenever the provided
    work function suspends.
    The module also exports a `par` object with versions of these
    functions that operate in parallel. The return value still
    maintains the initial ordering (except where noted), but the
    function you pass in will be called for items in "stratified parallel" order, 
    meaning that the execution of multiple calls will be interleaved when 
    a function blocks.

    ### A note on pure JavaScript libraries:

    It's worth noting that while pure JavaScript collection libraries
    can be used in stratified JavaScript, many of the results will not
    be as expected due to the fact that pure JavaScript cannot itself
    suspend.  Specifically, any time a suspending SJS function is
    called from plain JavaScript, the SJS computation will not
    complete before control is returned to JavaScript. While the SJS
    computation continues in the background, the return value passed
    to JS will be unintelligible.

    Practically speaking, this means that any pure JavaScript function
    which takes an iteration function will not work correctly in the
    presence of a suspended computation. This includes functions like
    `map`, `each`, etc. whenever the provided function does not
    immediately return a value.

    The functions in this module provide the same functionality,
    but are written in SJS and therefore respect the operation
    of stratified code.
*/

var sys = require('sjs:apollo-sys');
var stopIteration = {};
var par = exports.par = {};

// -------------------------------------------------------------
// object-specific helpers

/**
  @function toArray
  @param    {Array | Arguments} [array_or_arguments]
  @return   {Array}  [array]
  @summary  Returns an array untouched, or an array copy of an `arguments` object.
*/
exports.toArray = function(array_or_arguments) {
  if(Array.isArray(array_or_arguments)) {
    return array_or_arguments;
  }
  return Array.prototype.slice.call(array_or_arguments);
};

/**
  @function keys
  @param    {Object} [obj]
  @return   {Array}  [keys]
  @summary  Returns an array containing the names of `obj`'s own properties.
  @desc     The property names are returned with no consistent order.
            Note that you can also use the ECMA-263/5 function `Object.keys` - 
            on older JS engines Apollo adds a shim to emulate this function.
*/
exports.keys = function(obj) {
  return Object.keys(obj);
};

/**
  @function values
  @param    {Object} [obj]
  @return   {Array}  [values]
  @summary  Returns an array containing the values of `obj`'s own properties.
  @desc     The property values are returned in no consistent order.
*/
exports.values = function(obj) {
  var result = [];
  exports.each(obj, function(v) {
    result.push(v);
  });
  return result;
};

/**
  @function items
  @param    {Object | Array} [collection]
  @return   {Array}  [items] A list of [key, value] pairs.
  @summary  Returns an array containing the [key, value] pairs of `collection`'s properties.
  @desc
    Object properties are returned in no consistent order.
    Array properties are returned ordered.
    
    e.g:

        collection.items(['zero', 'one'])
        => [[0, 'zero'], [1,'one']]

        collection.items({k1:'v1', k2:'v2'})
        => [['k1', 'v1'], ['k2','v2']]
*/
exports.items = function(collection) {
  var result = [];
  exports.each(collection, function(v,k) {
    result.push([k,v]);
  });
  return result;
};

//----------------------------------------------------------------------

/**
  @function identity
  @param    [argument]
  @summary  Returns whatever argument it receives, unmodified.
  @desc
    Mostly useful as a pass-through test function given to `find`, `all`, etc.
*/
exports.identity = function(a) { return a; }

/**
  @function each
  @param    {Object | Array} [collection]
  @param    {Function} [fn] the iterator
  @param    {optional Object} [this_obj] the object on which `fn` will be executed
  @summary  Iterate over each element in a list or property in an object.
  @desc
    Calls the iterator once per item in the given
    collection, with arguments `(item, index, collection)`.

    When `collection` is an object, iterator is called once for each
    of the object's own properties. In this case `value` is the
    value of the property and `index` is the property's name.

    When `collection` is an array, the calls proceed in order from
    small to large indices.
*/
exports.each = function(collection, fn, this_obj) {
  if (sys.isArrayOrArguments(collection)) {
    for (var i=0,l=collection.length; i<l; ++i) 
      fn.call(this_obj, collection[i], i, collection);
  }
  else {
    var keys = exports.keys(collection);
    for (var i=0,l=keys.length; i<l; ++i)
      fn.call(this_obj, collection[keys[i]], keys[i], collection);
  }
}

/**
  @function par.waitforAll
  @summary  Execute a number of functions on separate strata and wait for all
            of them to finish, or, execute a single function with different
            arguments on separate strata and wait for all executions to finish.
  @param    {Function | Array} [funcs] Function or array of functions.
  @param    {optional Object | Array} [args] Argument or array of arguments.
  @param    {optional Object} [this_obj] 'this' object on which `funcs` will be executed.
  @desc
    If `funcs` is an array of functions, each of the functions will
    be executed on a separate stratum, with 'this' set to `this_obj` and
    the first argument set to `args`.

    If `funcs` is a single function and `args` is an array, `funcs`
    will be called `args.length` times on separate strata with its
    first argument set to a different elements of `args`, the second
    argument set to the index of the element in `args`, and the the
    third argument set to the `args`.
*/
exports.par.waitforAll = function waitforAll(funcs, args, this_obj) {
  this_obj = this_obj || null;
  if (sys.isArrayOrArguments(funcs)) {
    if (!funcs.length) return;
    //...else
    return waitforAllFuncs(funcs, args, this_obj);
  }
  else if (sys.isArrayOrArguments(args)) {
    if (!args.length) return;
    //...else
    return waitforAllArgs(funcs, args, 0, args.length, this_obj);
  }
  // else
  throw new Error("waitforAll: argument error; either funcs or args needs to be an array");
};

function waitforAllFuncs(funcs, args, this_obj) {
  if (funcs.length == 1)
    funcs[0].call(this_obj, args);
  else {
    // build a binary recursion tree, so that we don't blow the stack easily
    // XXX we should really have waitforAll as a language primitive
    var split = Math.floor(funcs.length/2);
    waitfor {
      waitforAllFuncs(funcs.slice(0,split), args, this_obj);
    }
    and {
      waitforAllFuncs(funcs.slice(split), args, this_obj);
    }
  }
};

function waitforAllArgs(f, args, i, l, this_obj) {
  if (l == 1)
    f.call(this_obj, args[i], i, args);
  else {
    // build a binary recursion tree, so that we don't blow the stack easily
    // XXX we should really have waitforAll as a language primitive
    var split = Math.floor(l/2);
    waitfor {
      waitforAllArgs(f, args, i, split, this_obj);
    }
    and {
      waitforAllArgs(f, args, i+split, l-split, this_obj);
    }
  }
}

/**
  @function par.waitforFirst
  @summary  Execute a number of functions on separate strata and wait for the first
            of them to finish, or, execute a single function with different
            arguments on separate strata and wait for the first execution to finish.
  @return   {value} Return value of function execution that finished first.
  @param    {Function | Array} [funcs] Function or array of functions.
  @param    {optional Object | Array} [args] Argument or array of arguments.
  @param    {optional Object} [this_obj] 'this' object on which *funcs* will be executed.
  @desc
    If `funcs` is an array of functions, each of the functions will
    be executed on a separate stratum, with 'this' set to `this_obj` and
    the first argument set to `args`.

    If `funcs` is a single function and `args` is an array, `funcs`
    will be called `args.length` times on separate strata with its
    first argument set to a different elements of `args`, the second
    argument set to the index of the element in `args`, and the
    third argument set to the `args`.  
*/
exports.par.waitforFirst = function waitforFirst(funcs, args, this_obj) {
  this_obj = this_obj || this;
  if (sys.isArrayOrArguments(funcs)) {
    if (!funcs.length) return;
    //...else
    return waitforFirstFuncs(funcs, args, this_obj);
  }
  else if (sys.isArrayOrArguments(args)) {
    if (!args.length) return;
    //...else
    return waitforFirstArgs(funcs, args, 0, args.length, this_obj);
  }
  // else
  throw new Error("waitforFirst: argument error; either funcs or args needs to be an array");
};


function waitforFirstFuncs(funcs, args, this_obj) {
  if (funcs.length == 1)
    return funcs[0].call(this_obj, args);
  else {
    // build a binary recursion tree, so that we don't blow the stack easily
    // XXX we should really have waitforFirst as a language primitive
    var split = Math.floor(funcs.length/2);    
    waitfor {
      return waitforFirstFuncs(funcs.slice(0,split), args, this_obj);
    }
    or {
      return waitforFirstFuncs(funcs.slice(split), args, this_obj);
    }
  }
};

function waitforFirstArgs(f, args, i, l, this_obj) {
  if (l == 1)
    return f.call(this_obj, args[i], i, args);
  else {
    // build a binary recursion tree, so that we don't blow the stack easily
    // XXX we should really have waitforFirst as a language primitive
    var split = Math.floor(l/2);    
    waitfor {
      return waitforFirstArgs(f, args, i, split, this_obj);
    }
    or {
      return waitforFirstArgs(f, args, i+split, l-split, this_obj);
    }
  }
};


/**
  @function par.each
  @param    {Object | Array} [collection]
  @param    {Function} [fn] the iterator
  @param    {optional Object} [this_obj] the object on which `fn` will be executed
  @summary  Parallel version of [::each]
*/
exports.par.each = function(collection, fn, this_obj) {
  if (sys.isArrayOrArguments(collection))
    return exports.par.waitforAll(fn, collection, this_obj);
  else {
    return exports.par.waitforAll(function(key) {
      fn.call(this_obj, collection[key], key, collection);
    },
                                  exports.keys(collection));
  }
};


// for accumulating results, we start with an empty object of the same
// type as the collection (i.e object or array)
function emptyObj(collection) {
  if(sys.isArrayOrArguments(collection)) {
    return [];
  } else {
    return {};
  }
}

// Helper to make a `map` function, given a particular `each`:
function generateMap(each) {
  return function(collection, fn, this_obj) {
    var res = emptyObj(collection);
    each(collection, function(item, idx) {
      res[idx] = fn.apply(this_obj, arguments);
    });
    return res;
  }
}

/**
  @function map
  @param    {Object | Array} [collection]
  @param    {Function} [fn] the transform function
  @param    {optional Object} [this_obj] the object on which `fn` will be executed
  @summary  Apply a function to each item in a collection and return the results
  @desc
    Produces a new collection by applying the transformation `fn` to each
    value in the collection.

    `fn` will be called with arguments `(value, key, collection)` and the return value
    will replace `val` in the returned collection.

    e.g:

        collection.each([1,2,3], function(item) {
          return item + 1;
        });
        => [2,3,4]

        collection.each({foo: 1, bar:2}, function(item) {
          return item + 1;
        });
        => {foo: 2, bar:3}
*/
exports.map     = generateMap(exports.each);

/**
  @function par.map
  @param    {Object | Array} [collection]
  @param    {Function} [fn] the transform function
  @param    {optional Object} [this_obj]
  @summary  Parallel version of [::map]
  @desc
    Note: If `collection` is an Array, the order of elements of the
          output Array will be maintained, i.e. `par.map` will return
          `[ fn(collection[0]), fn(collection[1]), fn(collection[2]), ... ]`
          even if for invocation of `fn(collection[n])` and 
          `fn(collection[m])` with
          `m > n`, the latter might complete before the former.  
*/
exports.par.map = generateMap(exports.par.each);

// there are 4 versions of `find`, based on whether they are
// parallel and whether they return the key or value:
function generateFind(each, return_arg) {
  return function(collection, fn, this_obj) {
    var found = undefined;
    try {
      each(collection, function(elem) {
        if(fn.apply(this_obj, arguments)) {
          found = arguments;
          throw stopIteration;
        }
      });
    }
    catch (e) { 
      if (e === stopIteration)
        return found[return_arg];
      throw e;
    }
    return undefined;
  };
};

/**
   @function find
   @param    {Object | Array} [collection]
   @param    {Function} [fn] the test function
   @param    {optional Object} [this_obj] the object on which `fn` will be executed
   @summary  Find and return the first matching element
   @desc
     Returns the first item in the collection for which
     `test(item, key, collection)` returns true (or a truthy value).
   
   Returns `undefined` when no match is found.
*/
exports.find        = generateFind(exports.each     , 0);

/**
   @function par.find
   @param    {Object | Array} [collection]
   @param    {Function} [fn] the test function
   @param    {optional Object} [this_obj] the object on which `fn` will be executed
   @summary  Parallel version of [::find]
   @desc
     Like sequential [::find], but items in the collection will be
     tested concurrently.  The return value will be the first
     matching element in a *temporal* sense, but not necessarily the
     element at the smallest index in the collection.
*/
exports.par.find    = generateFind(exports.par.each , 0);

/**
   @function findKey
   @param    {Object | Array} [collection]
   @param    {Function} [fn] the test function
   @param    {optional Object} [this_obj] the object on which `fn` will be executed
   @summary  Find the key of the first matching object
   @desc
     Operates exactly like [::find], but returns you the key (index)
     of the first matching item instead of its value.

     Returns `undefined` when no match is found.
*/
exports.findKey     = generateFind(exports.each     , 1);

/**
   @function par.findKey
   @param    {Object | Array} [collection]
   @param    {Function} [fn] the test function
   @param    {optional Object} [this_obj] the object on which `fn` will be executed
   @summary  Parallel version of [::findKey]
   @desc
     Operates exactly like [::par.find], but returns you the key (index)
     of the first matching item instead of its value.

     Returns `undefined` when no match is found.
*/
exports.par.findKey = generateFind(exports.par.each , 1);

/**
  @function remove
  @param    {Object | Array} [collection]
  @param    {Object} [item] the item to remove
  @param    {optional Object} [default] The default object to return if `item` is not found.
  @return   {Object} removed object.
  @summary  Remove an item from an array, or a key from an object. Returns the item removed.
  @desc
    Items are removed from arrays using `splice`, and from objects using `delete`.
    `arguments` objects have no `splice` method, so they are treated as objects.

    If the item or key is not present in the collection, an error will be raised unless
    you pass anything other than `undefined` as the `default` argument - in which case
    it will be returned.

    Only the first matching item will be removed from an array. Array items are
    checked for equality using `indexOf` - if you need deeper equality checking
    or want to delete all matching objects, you may want to use `filter` instead.
*/
exports.remove = function(collection, item, _default) {
  var ensurePresent = _default === undefined;
  var key;
  var isArray = Array.isArray(collection);
  if(isArray) {
    key = collection.indexOf(item);
  } else {
    key = item;
  }
  if(!(key in collection)) {
    if(ensurePresent) {
      var err = new Error("Could not find item \"" + item + "\" to remove");
      err.item = item;
      err.collection = collection;
      throw err;
    }
    return _default;
  }
  var result = collection[key];
  if(isArray) {
    collection.splice(key, 1);
  } else {
    delete collection[key];
  }
  return result;
};

// filter uses a generic and parallelizeable part (filterItems) and then
// combines the results with array or object-specific functions
var KEY = 0;
var VALUE = 1;
function filterItems(each, collection, fn, this_obj) {
  var result = [];
  each(collection, function(val, key) {
    if(fn.apply(this_obj, arguments)) {
      result.push([key, val]);
    }
  });
  return result;
};

function concatArrayItems(items) {
  var result = [];
  for(var i=0; i<items.length; i++) {
    result.push(items[i][VALUE]);
  }
  return result;
};

function concatObjectItems(items) {
  var result = {};
  for(var i=0; i<items.length; i++) {
    result[items[i][KEY]] = items[i][VALUE];
  }
  return result;
};

function generateFilter(each) {
  return function(collection, fn, this_obj) {
    // build an unordered set of items
    var items = filterItems(each, collection, fn, this_obj);
    // and combine
    if(sys.isArrayOrArguments(collection)) {
      return concatArrayItems(items);
    } else {
      return concatObjectItems(items);
    }
  };
}

/**
   @function filter
   @param    {Object | Array} [collection]
   @param    {Function} [fn] the test function
   @param    {optional Object} [this_obj] the object on which `fn` will be executed
   @summary  Return all items that satisfy `test`
   @desc
     Returns a collection containing only the items in the original
     collection where `test(item, key, collection)` returns truthy.
     When `collection` is an array, the return value will
     maintain relative ordering between elements.
*/
exports.filter     = generateFilter(exports.each);
/**
   @function par.filter
   @param    {Object | Array} [collection]
   @param    {Function} [fn] the test function
   @param    {optional Object} [this_obj] the object on which `fn` will be executed
   @summary  Parallel version of [::filter]
   @desc
     Note that unlike [::filter], the result of [::par.filter] will
     **not** necessarily maintain the same relative ordering as the
     input collection. Items will be ordered in the order in which their 
     corresponding `fn` invocations return.
*/
exports.par.filter = generateFilter(exports.par.each);

/**
  @function reduce
  @param    {Object | Array} [collection]
  @param    {Object} [initial] the initial value
  @param    {Function} [fn] the reducer function
  @param    {optional Object} [this_obj] the object on which `fn` will be executed
  @return   {Object}
  @summary  Cumulatively combine elements in an array.
  @desc
    Also known as `foldl` or `inject`.
    
    For each element in the collection, call `fn(accum, elem, key, collection)`. 
    The return value of this call is used as the value of `accum` for the
    next call. 

    When `collection` is an array, the calls proceed in order from
    small to large indices.

    `initial` is used as the initial value for `accum`, and the final
    value of `accum` is the return value of this function.

    Since the calculation is inherently sequential there is no
    parallel version of this function.
*/
exports.reduce = function(collection, initial, fn, this_obj) {
  var accum = initial;
  exports.each(collection, function(elem, key) {
    accum = fn.call(this_obj, accum, elem, key, collection);
  });
  return accum;
};

/**
  @function reduce1
  @param    {Object | Array} [collection]
  @param    {Function} [fn] the reducer function
  @param    {optional Object} [this_obj] the object on which `fn` will be executed
  @summary  [::reduce] for a non-empty list
  @desc
    Calls `reduce`, using the first element of `collection` as
    the initial value, and the remaining elements as the collection
    to operate on.

    Throws an error when given an empty list.
*/
exports.reduce1 = function(collection, fn, this_obj) {
  var accum, first = true;
  exports.each(collection, function(elem, key) {
    if (first) {
      accum = elem;
      first = false;
    }
    else {
      accum = fn.call(this_obj, accum, elem, key, collection);
    }
  });
  if (first) throw new Error("reduce1 on empty collection");
  return accum;
};

function generateAll(each) {
  return function(collection, fn, this_obj) {
    try {
      each(collection, function() {
        if(!fn.apply(this_obj, arguments)) {
          throw stopIteration;
        }
      });
    }
    catch (e) {
      if (e === stopIteration) return false;
      throw e;
    }
    return true;
  };
}

/**
  @function all
  @param    {Object | Array} [collection]
  @param    {Function} [test] The test function
  @param    {optional Object} [this_obj] the object on which `fn` will be executed
  @summary  Return whether all items in a collection satisfy the test function
  @desc
    Returns `true` if `test(item, key, collection)` returns truthy for all items in the
    collection, `false` otherwise.
*/
exports.all     = generateAll(exports.each);
/**
  @function par.all
  @param    {Object | Array} [collection]
  @param    {Function} [fn] The test function
  @param    {optional Object} [this_obj]
  @summary  Parallel version of [::all]
*/
exports.par.all = generateAll(exports.par.each);

function generateAny(find) {
  return function(collection, fn, this_obj) {
    return find(collection, fn, this_obj) !== undefined;
  };
}

/**
  @function any
  @param    {Object | Array} [collection]
  @param    {Function} [test] The test function
  @param    {optional Object} [this_obj]
  @summary  Return whether any item in a collection satisfies the test function
  @desc
    Returns `true` if `test(item, key, collection)` returns truthy for any item in the
    collection, `false` otherwise.
*/
exports.any     = generateAny(exports.findKey);

/**
  @function par.any
  @param    {Object | Array} [collection]
  @param    {Function} [test] The test function
  @param    {optional Object} [this_obj]
  @summary  Parallel version of [::any]
*/
exports.par.any = generateAny(exports.par.findKey);
