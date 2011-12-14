/*
 * Oni Apollo 'common' module
 * Common JS utility functions 
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
/**
  @module    common
  @summary   Common JS utility functions
*/

/**
  @function bind
  @summary Bind a function to a given 'this' object.
  @param   {Function} [f] Function to bind to *thisObj*
  @param   {Object} [thisObj] 'this' object to bind *f* to
  @return  {Function} Bound function
  @deprecated use Function.prototype.bind instead
*/
exports.bind = function(f, thisObj) {
  return function() { return f.apply(thisObj, arguments); };
};

/**
  @function isArray
  @summary  Tests if an object is an array.
  @param    {anything} [testObj] Object to test.
  @return   {Boolean}
  @deprecated use [::isArrayOrArguments]
*/
exports.isArray = Array.isArray;

/**
   @function isArrayOrArguments
   @summary  Tests if an object is an array or arguments object.
   @param    {anything} [testObj] Object to test.
   @return   {Boolean}
*/
exports.isArrayOrArguments = require('sjs:apollo-sys').isArrayOrArguments;

/**
  @function flatten
  @summary Create a recursively flattened version of an array.
  @param   {Array} [arr] The array to flatten.
  @return  {Array} Flattend version of *arr*, consisting of the elements
                   of *arr*, but with elements that are arrays replaced by
                   their elements (recursively).
  @desc
     ###Example:

         var a = [1,2,[3,4,[5,6]],[[7,8]],[9],10];
         var b = require('apollo:common').flatten(a);
         // b is now [1,2,3,4,5,6,7,8,9,10]
*/
exports.flatten = require('sjs:apollo-sys').flatten;

/**
  @function supplant
  @summary  Performs variable substitution on a string.
  @param    {String} [template] A string holding variable names enclosed in **{ }** braces.
  @param    {Object} [replacements] Hash of key/value pairs that will be replaced in *template*.
  @return   {String} String with placeholders replaced by variables.
  @desc
    An error will be thrown if any substitution can't be found
    
    ###Example:

        var rv = common.supplant("Hello {who}", { who: "world"});
        // rv will equal "Hello world"
*/
//XXX how should you escape {foo}? {{foo}}? \{foo\}?
exports.supplant = function(str, o) {
  return str.replace(/{([^{} ]*)}/g,
    function(text, key) {
      var replacement = o[key];
      if(replacement === undefined) throw new Error("No substitution found for \"" + key + "\"");
      if(replacement instanceof Function) { replacement = replacement.call(o); };
      return replacement;
    }
  );
};

/**
  @function sanitize
  @summary  Make a string safe for insertion into html.
  @param    {String} [str] String to sanitize.
  @return   {String} Sanitized string.
  @desc
    Returns sanitized string with **<**,**>**, and **&** replaced by their corresponding html entities.
**/

var replacements = {
  '&':'&amp;',
  '>':'&gt;',
  '<':'&lt;'
};

exports.sanitize = function(str) {
  return str.replace(/[<>&]/g, function(c) {
    return replacements[c];
  })
};

/**
  @function mergeSettings
  @summary Merge objects of key/value pairs.
  @param {SETTINGSHASHARR} [hashes] Object(s) with key/value pairs.
                                   See below for full syntax.
  @return {Object} Object with all key/value pairs merged.
  @desc
    *hashes* can be a simple object with key/value pairs or an arbitrarily nested
    array of (arrays of) key/value objects.

    Instead of passing an array, the individual array components can also
    be passed as individual parameters. E.g., the following two calls are
    equivalent:

        common.mergeSettings({a:1}, {b:1});
        // is equivalent to
        common.mergeSettings([{a:1}, {b:1}]);


    The key/value pairs will be merged into the return object in the order that
    they appear in the arguments. I.e. settings on objects that appear later in
    *mergeSettings* arguments override settings from earlier objects.

    Full syntax for *hashes*:

        SETTINGSHASHEARR  : arbitrarily nested array of [ SETTINGSHASH* ]

        SETTINGSHASH    : { key: value, ... } | undefined
*/
exports.mergeSettings = function(/*settings-hash,...*/) {
  return require('sjs:apollo-sys').accuSettings({}, arguments);
};
