/*
 * Oni Apollo 'http' module
 * Functions for performing HTTP requests and working with URLs
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
  @module    http
  @summary   Functions for performing HTTP requests and working with URLs.
*/

var sys = require('sjs:apollo-sys');

//----------------------------------------------------------------------
// url functions

/**
  @function  constructQueryString
  @summary Build a URL query string.
  @param {QUERYHASHARR} [hashes] Object(s) with key/value pairs.
         See below for full syntax.
  @return {String}
  @desc
    ###Notes:

    *hashes* can be a simple object with key/values or an arbitrarily nested
    array of (arrays of) key/value objects.

    Instead of passing an array, the individual array components can also
    be passed as individual parameters to [::constructURL].
    E.g. the following two calls are equivalent:

         http.constructQueryString({a:1}, {b:1});
         // is equivalent to
         http.constructQueryString([{a:1}, {b:1}]);


    If the value in a key/value pair is an array [a,b,c], then
    a key=value query will be encoded for each of the array elements.

    ###Examples:

        http.constructQueryString({a:1}, {b:1}); // -> "a=1&b=1"

        http.constructQueryString({a:1,b:"foo&bar"}); // -> "a=1&b=foo%26bar"

        http.constructQueryString([[null,[{a:1,b:['x','y']},{c:3}],[[]]]]);
        // -> "a=1&b=x&b=y&c=3"`

    Full syntax for *hashes*:

        QUERYHASHARR :  arbitraily nested array of [ QUERYHASH* ]

        QUERYHASH : { QUERY* } | undefined

        QUERY      : SIMPLE_QUERY | MULTI_QUERY

        SIMPLE_QUERY : "field" : "value"

        MULTI_QUERY  : "field" : [ "value1", ... ]

*/
exports.constructQueryString = sys.constructQueryString;

/**
  @function constructURL
  @summary Build a URL string.
  @param {URLSPEC} [urlspec] Base string and optional path strings
                   and query hashes. See below for full syntax.
  @return {String}
  @desc
    ###Notes:

    *urlspec* can be a simple string or an (arbitrarily nested) array composed
    of one base strings, and optionally a number of path strings and/or a
    number of QUERYHASH objects (as accepted by
    [::constructQueryString]).

    Instead of passing an array, the individual array components can also
    be passed as individual parameters to [::constructURL].
    E.g. the following two calls are equivalent:

         http.constructURL("foo", "bar", "baz");
         // is equivalent to
         http.constructURL(["foo", "bar", "baz"]);

    Base & path strings will be concatenated in such a way that there is
    exactly one '/' character between each component.

    The base string may contain a '?' character. In this case no path strings
    should be given, but query hashes can be specified and will be appended
    correctly (using '&' instead of '?').

    ###Examples:

        http.constructURL("foo.txt"); // -> "foo.txt"

        http.constructURL("foo", "bar", "foo.txt"); // -> "foo/bar/foo.txt"

        http.constructURL("foo/", "/bar/"); // -> "foo/bar/"

        http.constructURL("foo?a=b"); // -> "foo?a=b"

        http.constructURL("foo?a=b", {b:1}); // -> "foo?a=b&b=1"

        http.constructURL("foo?a=b", {b:[1,2]}); // -> "foo?a=b&b=1&b=2"

        http.constructURL("foo?a=b", [{b:[1,2]}]); // -> "foo?a=b&b=1&b=2"

        http.constructURL(["http://foo", {bar:"x", zz:"w"}, {foo:[1,2,3]}]);
        // -> "http://foo?bar=x&zz=w&foo=1&foo=2&foo=3"

        http.constructURL([["http://foo", {bar:"x", zz:"w"}], [{foo:[1,2,3]}]]);
        // -> "http://foo?bar=x&zz=w&foo=1&foo=2&foo=3"

    Full syntax for *urlspec*:

        URLSPEC   : arbitrarily nested array
                    [ BASESTR , PATHSTR* , QUERYHASH* ]

        BASESTR   : string with url base (e.g. "http://onilabs.com/foo")

        PATHSTR   : string with directory component

        QUERYHASH : { QUERY* } | undefined

        QUERY      : SIMPLE_QUERY | MULTI_QUERY

        SIMPLE_QUERY : "field" : "value"

        MULTI_QUERY  : "field" : [ "value1", ... ]
*/
exports.constructURL = sys.constructURL;

/**
  @function parseURL
  @summary Parses the given URL into components.
  @param {String} [url] URL to parse.
  @return {Object} Parsed URL as described at <http://stevenlevithan.com/demo/parseuri/js/> (using 'strict' mode).
  @desc
     Uses the parseuri function from <http://blog.stevenlevithan.com/archives/parseuri>.
*/
exports.parseURL = sys.parseURL;

/**
  @function isSameOrigin
  @summary Checks if the given URLs have matching authority parts.
  @param {String} [url1] First URL.
  @param {String} [url2] Second URL.
  @desc
    If either URL is missing an authority part (i.e. it is a relative URL),
    the function returns true as well.
*/
exports.isSameOrigin = sys.isSameOrigin;

/**
  @function canonicalizeURL
  @summary Convert relative to absolute URLs and collapse '.' and '..' path
           components.
  @param {String} [url] URL to canonicalize.
  @param {optional String} [base] URL which will be taken as a base if *url* is relative.
  @return {String} Canonicalized URL.
  @desc
    ###Examples:

        http.canonicalizeURL("/foo/bar.txt", "http://a.b/c/d/baz.txt");
        // --> "http://a.b/foo/bar.txt"

        http.canonicalizeURL("foo/bar.txt", "http://a.b/c/d/baz.txt");
        // --> "http://a.b/c/d/foo/bar.txt"

        http.canonicalizeURL("././foo/./bar.txt", "http://a.b/c/d/");
        // --> "http://a.b/c/d/foo/bar.txt"

        http.canonicalizeURL(".././foo/../bar.txt", "http://a.b/c/d/");
        // --> "http://a.b/c/bar.txt"

*/
exports.canonicalizeURL = sys.canonicalizeURL;

//----------------------------------------------------------------------

exports.xhr = function() { throw "http.xhr() is obsolete. Please use http.request()"; };
exports.xml = function() { throw "http.xml() is obsolete."; };

/**
   @function getXDomainCaps
   @summary Returns the cross-domain capabilities of the host environment ('CORS'|'none'|'any')
   @return {String}
   @desc
     See also [::request].
*/
exports.getXDomainCaps = sys.getXDomainCaps;


/**
   @function request
   @summary Performs an [XMLHttpRequest](https://developer.mozilla.org/en/XMLHttpRequest)-like HTTP request.
   @param {URLSPEC} [url] Request URL (in the same format as accepted by [::constructURL])
   @param {optional Object} [settings] Hash of settings (or array of hashes)
   @return {String}
   @setting {String} [method="GET"] Request method.
   @setting {QUERYHASHARR} [query] Additional query hash(es) to append to url. Accepts same format as [::constructQueryString].
   @setting {String} [body] Request body.
   @setting {Object} [headers] Hash of additional request headers.
   @setting {String} [username] Username for authentication.
   @setting {String} [password] Password for authentication.
   @setting {String} [mime] Override mime type.
   @setting {Boolean} [throwing=true] Throw exception on error.
   @desc
     ### Limitations:

     This method exposes similar functionality to that provided by browsers' 
     [XMLHttpRequest](https://developer.mozilla.org/en/XMLHttpRequest), and as such has
     a number of limitations:

     * It is only safe for transferring textual data (UTF8-encoded by default).

     * Redirects will automatically be followed, and there is no way to discover
       the value of the final URL in a redirection chain.

     * Cross-origin restrictions might apply; see below.

     ### Cross-site requests:

     The success of cross-domain requests depends on the cross-domain
     capabilities of the host environment, see
     [::getXDomainCaps]. If this function
     returns "CORS" then success of cross-domain requests depends on
     whether the server allows the access (see
     <http://www.w3.org/TR/cors/>).

     In the xbrowser host environment, the standard
     XMLHttpRequest can handle cross-domain requests on compatible
     browsers (any recent Chrome, Safari, Firefox). On IE8+,
     [::request] will automatically fall back to using MS's
     XDomainRequest object for cross-site requests.

     In the nodejs host environment, we can always perform cross-domain requests

     ### Request failure:

     If the request is unsuccessful, and the call is configured to
     throw exceptions (setting {"throwing":true}; the default), an
     exception will be thrown which has a 'status' member set to the
     request status. If the call is configured to not throw, an empty
     string will be returned.

     ### Example:

         try { 
           alert(http.request("foo.txt"));
         }
         catch (e) {
           alert("Error! Status="+e.status);
         }

*/
exports.request = sys.request;


/**
  @function  get
  @summary   Perform a HTTP GET request and return the response text.
  @param {URLSPEC} [url] Request URL (in the same format as accepted by [::constructURL])
  @param {optional Object} [settings] Hash of settings (or array of hashes) as accepted by [::request].
  @return    {String}
  @shortcut  request
  @desc
    An alias for `http.request(url,settings)`.

    ### Example:
    
        console.log(
          require("apollo:http").get("data.txt")
        );
    
    ### Example: timeout
    
        var http = require("apollo:http");
        waitfor {
          var data = http.get("data.txt");
        } or {
          hold(1000);
        }
        if (!data) {
          throw "Server too slow...";
        }
*/
exports.get = exports.request;

/** 
  @function  post
  @summary   Perform a HTTP POST request and return the response text.
  @param {URLSPEC} [url] Request URL (in the same format as accepted by [::constructURL])
  @param     {String|null} [body] Request body.
  @param {optional Object} [settings] Hash of settings (or array of hashes) as accepted by [::request].
  @return    {String} 
  @shortcut  request
  @desc
    ### Example:
    
        var http = require("apollo:http");
        var response = http.post("/service", "some raw data");
        console.log("server replied:", response);
    
    ### Example: posting data in the url, not the body

        var http = require("apollo:http");
        var rv = http.post("/service", null,
                           { query: {
                                  name: "ford",
                                  lastname: "prefect"
                                    }
                           });
        // sends an HTTP POST to /service 
        // with payload: name=ford&lastname=prefect
*/
exports.post = function(url, body, settings) {
  return sys.request(url, [{method:"POST", body:body}, settings]);
};


/**
  @function  json
  @summary   Perform a HTTP GET request and parse the response text as a JSON object.
  @param {URLSPEC} [url] Request URL (in the same format as accepted by [::constructURL])
  @param {optional Object} [settings] Hash of settings (or array of hashes) as accepted by [::request].
  @shortcut  get
  @return    {Object}
  @desc
    ### Example:
    
        var http = require("apollo:http");
        var animals = http.json("/animals.php?type=cats").animals;
        for (var i = 0, cat; cat = animals[i]; i++) {
          console.log(cat.name);
        }
*/

// helper taken from jquery
function parseJSON(data) {
  if (typeof data !== "string" || !data) {
    return null;
  }
  
  // Make sure leading/trailing whitespace is removed (IE can't handle it)
  data = data.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, "");
  
  // Make sure the incoming data is actual JSON
  // Logic borrowed from http://json.org/json2.js
	if ( /^[\],:{}\s]*$/.test(data.replace(/\\(?:[\"\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
		                        .replace(/\"[^\"\\\n\r]*\"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
		                        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {
    
    // Try to use the native JSON parser first
    var global = sys.getGlobal();
    return global.JSON && global.JSON.parse ?
      global.JSON.parse(data) :
      (new Function("return " + data))();
    
  }
  else
    throw "Invalid JSON";
};


exports.json = function(/*url, settings*/) {
  return parseJSON(exports.get.apply(this, arguments));
};

//----------------------------------------------------------------------
// jsonp

/**
  @function  jsonp
  @summary   Perform a cross-domain capable JSONP-style request. 
  @param {URLSPEC} [url] Request URL (in the same format as accepted by [::constructURL])
  @param {optional Object} [settings] Hash of settings (or array of hashes)
  @return    {Object}
  @setting {QUERYHASHARR} [query] Additional query hash(es) to append to url. Accepts same format as [::constructQueryString].
  @setting {String} [cbfield="callback"] Name of JSONP callback field in query string.
  @setting {String} [forcecb] Force the name of the callback to the given string.
  @desc
    ### Example:

        var http = require("apollo:http");
        var url = "http://api.flickr.com/services/feeds/photos_public.gne?" +
                  "tags=cat&tagmode=any&format=json";
        var data = http.jsonp(url, {cbfield:"jsoncallback"});
        for (var i = 0, item; item = data.items[i]; i++) {
           c.log("src=", item.media.m);
        };
*/
exports.jsonp = sys.jsonp;

