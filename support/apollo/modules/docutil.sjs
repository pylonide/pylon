/*
 * Oni Apollo 'docutil' module
 * Utility functions for extracting JS-style comments from source code 
 *
 * Part of the Oni Apollo Standard Module Library
 * Version: 'unstable'
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
/**
   @module  docutil
   @summary Utility functions for extracting JS-style comments from source code.
   @desc    Work-in-progress
*/

var common = require('apollo:common');

// comment regexps for parseSource
var PAT_NBCOMMENT = "\\/\\/.*|#!.*";
var PAT_BCOMMENT =  "\\/\\*(?:.|\\n|\\r)*?\\*\\/";
var PAT_COMMENT = "(" + PAT_NBCOMMENT + "|" + PAT_BCOMMENT + ")";

// patterns that might contain something that _looks_ like a comment:
// e.g. " /* */ " <-- a string, not a comment
//      /\/* .*/  <-- a regexp, not a comment
var PAT_REGEXLIT = "\\/(?:\\\\.|\\[(?:\\\\.|[^\\n\\]])*\\]|[^\\/\\n])+\\/[gimy]*";
var PAT_ML_STRLIT_SGL = "'(?:\\\\.|[^\\'])*'";
var PAT_ML_STRLIT_DBL = '"(?:\\\\.|[^\\"])*"';
var PAT_ML_STRLIT = PAT_ML_STRLIT_SGL+"|"+PAT_ML_STRLIT_DBL;
var PAT_COMMENT_SHADOW = PAT_REGEXLIT + "|" + PAT_ML_STRLIT;

// safe, non-shadowing pattern:
var PAT_SAFE = "[^\'\"^\\/]+|(?:\\/[^\/*])";

var SOURCE_SPLITTER = new RegExp(PAT_COMMENT + "|(" + 
                                 PAT_COMMENT_SHADOW + "|" + PAT_SAFE + ")", "g");

function dummy(x) {};

/**
   @function  parseSource
   @summary   Parse SJS into a comments and code
   @param     {String} [src] Source to parse.
   @param     {optional Function} [handle_comment] Function that will be executed for each 
              comment encountered.
   @param     {optional Function} [handle_code] Function that will be executed for each piece
              of code encountered between comments.
       
*/
var parseSource = exports.parseSource = function(src, handle_comment, handle_code) {
  handle_comment = handle_comment || dummy;
  handle_code = handle_code || dummy;

  var matches;
  while ((matches = SOURCE_SPLITTER.exec(src))) {
    // save the lastIndex, in case SOURCE_SPLITTER gets run
    // reentrantly with different source code during invocations of
    // handle_comment/handle_code.
    var lastIndex = SOURCE_SPLITTER.lastIndex;
    if (matches[1])
      handle_comment(matches[1]);
    else
      handle_code(matches[2]);
    SOURCE_SPLITTER.lastIndex = lastIndex;
  }
};

/**
   @function parseCommentedJSON
   @summary  Like JSON.parse, but allows comments in JSON file.
   @param {String} [src] JSON string with comments allowed
   @desc
     Note: Will not work on old browsers without JSON support (IE6,7).
*/
exports.parseCommentedJSON = function(src) {
  // collect uncommented src:
  var json = "";
  parseSource(src,null,function(x) { json += x; });

  return JSON.parse(json);
};

/**
   @function extractDocComments
   @summary Extract documentation comments from SJS source.
   @param   {String} [src] SJS source string
   @return {Array}
   @desc TODO: document markup format
*/
var extractDocComments = exports.extractDocComments = function(src) {
  var comments = [];
  
  parseSource(src, function(c) {
    var matches;
    // extract only comments beginning with '/**'
    if (!(matches = /^\/\*\*((?:.|\n|\r)*)\*\/$/.exec(c))) return;
    comments.push(matches[1]);
  });
    
  return comments;
};

/**
   @function extractDocFields
   @summary Extract documentation fields from documentation string array.
   @param   {Array} [docs] SJS documents strings
   @return {Array}
   @desc TODO: document markup format
*/
var fieldRE = /@([a-z]+)[\t ]*\n?((?:.|\n+[\n\r\t ]*[^@\r\t\n ])*)/g;

var extractDocFields = exports.extractDocFields = function(docs) {
  var fields = [], matches;
  for (var i = 0; i<docs.length; ++i) {
    var doc = docs[i];
    while ((matches = fieldRE.exec(doc)))
      fields.push([matches[1], matches[2]]);
  }
  return fields;
};

/**
   @function parseSJSLibDocs
   @summary TODO: document me
*/
exports.parseSJSLibDocs = function(src) {
  var lib = { type: "lib", modules: {} };
  var fields = extractDocFields([src]);
  var prop, value, matches;
  for (var i=0; i<fields.length; ++i) {
    [prop,value] = fields[i];
    switch (prop) {
    case "module":
      if (!(matches = /^([^ \t]+)(?:[ \t]+(.+))?[ \t]*$/.exec(value))) break;
      lib.modules[matches[1]] = {type:"module", name:matches[1], summary:matches[2]};
      break;
    default:
      lib[prop] = value;
    }
  }
  return lib;
};

/**
   @function parseModuleDocs
   @summary TODO: document me
*/

// param: @param {type} [name=default] description
var paramRE = /^(?:\{([^\}]+)\})?(?:[\t ]*\[([^\]=]+)(?:\=([^\]]+))?\])?(?:[\t ]*\n?\r?(.(?:.|\n|\r)*))?$/;
var paramType = 1, paramName = 2, paramDefault = 3, paramDescription = 4;

exports.parseModuleDocs = function(src, module) {
  var module = common.mergeSettings({ type: "module", symbols: {}, classes: {} },
                                    module);
  var curr = module; // 'curr' determines where 'param', 'return', 'setting' are appended to
  var fields = extractDocFields(extractDocComments(src));

  for (var i=0; i<fields.length; ++i) {
    var prop, value;
    [prop,value] = fields[i];
    switch (prop) {
    case "class":
      curr = { type: "class", name: value, symbols: {} };
      module.classes[value] = curr;
      break;
    case "function":
    case "variable":
      // append to module or class depending on name
      var matches = /([^.]+)\.(.+)/.exec(value);
      // class member?
      if (matches && module.classes[matches[1]]) {
        //if (!module.classes[matches[1]])
        //  module.classes[matches[1]] = { name:matches[1], symbols:{}};
        curr = module.classes[matches[1]].symbols[matches[2]] = { name: matches[2], type: prop };
      }
      else if (module.classes[value]) {
        // constructor
        curr = module.classes[value].symbols[value] = { name: value, type: prop };
      }
      else {
        // top-level symbol
        curr= module.symbols[value] = { name: value, type: prop };
      }
      break;
    case "param":
    case "setting":
      // these get parsed & put into arrays on curr
      var matches = paramRE.exec(value);
      if (!curr[prop]) curr[prop] = [];
      curr[prop].push({
        type: prop,
        name: matches[paramName],
        valtype: matches[paramType], // value type
        defval: matches[paramDefault],
        summary: matches[paramDescription]
      });
      break;
    case "return":
      var matches = paramRE.exec(value);
      curr[prop] = {
        type: prop,
        valtype: matches[paramType],
        summary: matches[paramDescription]
      };
      break;
    default:
      curr[prop] = value;
    }
  }
  
  return module;
};
