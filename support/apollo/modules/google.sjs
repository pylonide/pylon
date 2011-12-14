/*
 * Oni Apollo 'google' module
 * Bindings to various Google webservices and APIs
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
  @module    google
  @summary   Bindings to various Google webservices and APIs 
*/
var http = require("./http");

/**
  @function  search
  @summary   Performs a Google web search query 
  @param     {String} [query] The search query to execute.
  @param     {optional Object} [settings] Hash of additional
             key/value query parameters.
  @return    {Object} The query result.
  @desc
    Uses the RESTful Google search API.
    See <http://code.google.com/apis/ajaxsearch/documentation/reference.html#_intro_fonje>.

    **Example:**
    
        var s = require("apollo:google").search("Onilabs", {start:4});
        console.log(s.responseData.results[0].url); // first result
*/
function search(q, settings) {
  return http.jsonp(["http://ajax.googleapis.com/ajax/services/search/web", {v: "1.0", q : q }, settings]);
};
exports.search = search;

/**
  @function siteSearch
  @summary   Performs a web search query limited to a particular site.
  @param     {String} [query] The search query to execute.
  @param     {String} [site] URL of site to limit the search to.
  @param     {optional Object} [settings] Hash of additional
             key/value query parameters.
  @return    {Object} The query result.
  @desc
    See [::search].
*/
exports.siteSearch = function (q, site, settings) {
  q = q || "";
  q += " site:" + site;
  return search(q, settings);
};

/**
  @function  translate
  @summary   Translates a string of text using the Google Translation webservice.
  @param     {String|Array} [text] A string containing the text to translate or an array specifying several strings for translation.
  @param     {String|Array} [to] A string specifying the target language or an array specifying several target languages.
  @param     {optional String} [from] An optional string specifying the source language.
  @param     {optional Object} [extra] A hash of key/value pairs to append to the request.
  @return    {Object} A ['Language Detection Result'](http://code.google.com/apis/ajaxlanguage/documentation/reference.html#detectResult)
  @desc
    Uses the RESTful Google Translation API v2
    See <http://code.google.com/apis/language/translate/overview.html>

    Note that as of August 2011, the Google Translate API is a paid service, so it
    requires an API key.

    Note that Google places a limit of ~2000 characters on request
    URIs. This limits the number of characters that can be translated by
    the API in one go.
    
    **Example:**

        var t = google.translate("hello", "de");
        console.log(t.translation, t.detectedSourceLanguage); // hallo, en

*/
exports.translate = function(text, to, /* [opt] */ from, /* [opt] */ extra) {
  from = from || ""; // "" == autodetect
  var langpair;
  if (require('sjs:apollo-sys').isArrayOrArguments(to)) {
    langpair = [];
    for (var i=0; i<to.length; ++i)
      langpair.push(from + "|" + to[i]);
  }
  else
    langpair = from + "|" + to;
  return http.jsonp(["http://ajax.googleapis.com/ajax/services/language/translate",
                     { q : text, v : "2.0", langpair: langpair },
                     extra]);
};

/**
  @function dictionaryLookup
  @param {String} [word] The word to look up
  @param {optional Object} [settings] Hash of additional
         key/value query parameters.
  @return {Object}
  @summary **Experimental** API performing dictionary queries using the **unofficial** Google dictionary service.
*/
exports.dictionaryLookup = function (word, settings) {
  var s = settings || {};
  s.q = word;
  s.sl = s.sl || "en";
  s.tl = s.tl || "en";
  return http.jsonp(["http://www.google.com/dictionary/json", s]);
}

/**
  @function speak
  @hostenv  xbrowser
  @summary **Experimental** API using the **unofficial** Google TTS service to
    speak a phrase.
  @param {String} [txt] Text to speak.
  @param {optional String} [language] Language of *txt* (default: "en").
  @desc
    Currently only works in Safari.

    Note that the API is limited to inputs of ~100 characters and is heavily
    rate-limited.

    It also doesn't work in browsers that send a Referer header with
    the request (Chrome).
*/
function speak(txt, language) {
  language = language || "en";
  var txt = encodeURIComponent(txt);
  try {
    var a = new Audio("http://translate.google.com/translate_tts?q="+txt+"&tl="+language);
    waitfor(var ok) {
      var r = resume;
      a.addEventListener("canplaythrough", r, true);
      hold(2000); // after 2s, we time out
      r(false);
    }
    finally {
      a.removeEventListener("canplaythrough", r, true);
    }
    if (!ok) throw new Error("Error playing back audio.");
    waitfor() {
      var r = resume;
      a.addEventListener("ended", r, true);
      a.play(); 
    }
    finally {
      a.removeEventListener("ended", r, true);
    }
  }
  finally {
    // does this help gc at all?
    delete a;
  }
}
exports.speak = speak;

// helper to check if google api is installed
function ensureAPI() {
  if (window["google"] && window.google.load) return;
  require('./dom').script("http://www.google.com/jsapi");
}

/**
  @function  load
  @hostenv   xbrowser
  @summary   Loads a JavaScript Google AJAX Module.
  @param     {String} [moduleName] A string representing a module.
  @param     {optional String} [moduleVersion] The module version to load.
  @param     {optional Object} [settings] An optional hash of key/value pairs.
  @desc
     See <http://code.google.com/apis/ajax/documentation/#GoogleLoad>

     **Example:**

         require('apollo:google').load("language", "1");
         if (google.language.isFontRenderingSupported("hi"))
           ...
*/
exports.load = function(moduleName, moduleVersion, settings) {
  ensureAPI();
  waitfor() {
    settings = settings || {};
    settings.callback = resume; // XXX we should really take a copy of settings
    google.load(moduleName, moduleVersion, settings);
  }
  return google[moduleName];
};

