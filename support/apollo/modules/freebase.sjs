/*
 * Oni Apollo 'freebase' module
 * Bindings to various Google webservices and APIs
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
  @module    freebase
  @summary   Bindings to the [Freebase](http://freebase.com) API
*/
var http = require("./http");
var sys = require("sjs:apollo-sys");

var api_base = "http://api.freebase.com/api/service/"; // XXX do we want https?

/**
   @function mqlread
   @summary See [freebase mqlread docs](http://freebase.com/docs/web_services/mqlread)
   @param {Object} [query] MQL query object
   @param {optional Object} [envelope_props] Hash of envelope parameters
   @return {Object} 
*/
function mqlread(query, envelope_props) {
  return http.jsonp([api_base, "mqlread", 
                     {query: JSON.stringify(sys.accuSettings({query:query},
                                                             [envelope_props]))}]);
}
exports.mqlread = mqlread;

/**
  @function search
  @summary See [freebase api/service/search](http://freebase.com/docs/web_services/search)
  @param {String} [query] Search string
  @param {optional Object} [props] Hash of additional query parameters
  @return {Object}
*/
function search(query, props) {
  return http.jsonp([api_base,"search",{query:query},props]);
}
exports.search = search;

