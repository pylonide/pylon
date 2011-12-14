/*
 * Oni Apollo system module ('sjs:apollo-sys') hostenv-specific part
 *
 * Cross-browser ('xbrowser') version
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


   The system module is spread over two parts: the 'common' part, and the
   'hostenv' specific part. 
   hostenv is one of : 'xbrowser' | 'nodejs' 

   See apollo-sys-common.sjs for the functions that the
   hostenv-specific part must provide.


*/

/**
   @function  jsonp_hostenv
   @summary   Perform a cross-domain capable JSONP-style request. 
   @param {URLSPEC} [url] Request URL (in the same format as accepted by [http.constructURL](#http/constructURL))
   @param {optional Object} [settings] Hash of settings (or array of hashes)
   @return    {Object}
   @setting {Boolean} [iframe=false] Perform the request in a temporary iframe.
   @setting {QUERYHASHARR} [query] Additional query hash(es) to append to url. Accepts same format as [http.constructQueryString](#http/constructQueryString).
   @setting {String} [cbfield="callback"] Name of JSONP callback field in query string.
   @setting {String} [forcecb] Force the name of the callback to the given string. Note: setting this value automatically forces the setting *iframe*=*true*.  
*/
function jsonp_hostenv(url, settings) {
  var opts = exports.accuSettings({}, [
    {
      iframe : false,
      //    query : undefined,
      cbfield : "callback",
      //    forcecb : undefined,
    }, 
    settings
  ]);

  url = exports.constructURL(url, opts.query);
  if (opts.iframe || opts.forcecb)
    return jsonp_iframe(url, opts);
  else
    return jsonp_indoc(url, opts);
};

var jsonp_req_count = 0;
var jsonp_cb_obj = "_oni_jsonpcb";
function jsonp_indoc(url, opts) {
  if (!window[jsonp_cb_obj])
    window[jsonp_cb_obj] = {};
  var cb = "cb" + (jsonp_req_count++);
  var cb_query = {};
  cb_query[opts.cbfield] = jsonp_cb_obj + "." + cb;
  url = exports.constructURL(url, cb_query);
  var elem = document.createElement("script");
  elem.setAttribute("src", url);
  elem.setAttribute("async", "async"); //XXX ?
  elem.setAttribute("type", "text/javascript");
  waitfor (var rv) {
    window[jsonp_cb_obj][cb] = resume;
    document.getElementsByTagName("head")[0].appendChild(elem);

    waitfor() {
      if (elem.addEventListener)
        elem.addEventListener("error", resume, false);
      else // IE
        elem.attachEvent("onerror", resume);
    }
    finally {
      if (elem.removeEventListener)
        elem.removeEventListener("error", resume, false);
      else // IE
        elem.detachEvent("onerror", resume);
    }
    // this line never reached unless there is an error
    throw new Error("Could not complete JSONP request to '"+url+"'");
  }
  finally {
    elem.parentNode.removeChild(elem);
    delete window[jsonp_cb_obj][cb];
  }
  return rv;
}

function jsonp_iframe(url, opts) {
  var cb = opts.forcecb || "R";
  var cb_query = {};
  if (opts.cbfield)
    cb_query[opts.cbfield] = cb;
  url = exports.constructURL(url, cb_query);
  var iframe = document.createElement("iframe");
  document.getElementsByTagName("head")[0].appendChild(iframe);
  var doc = iframe.contentWindow.document;
  waitfor (var rv) {
    doc.open();
    iframe.contentWindow[cb] = resume;
    // This hold(0) is required in case the script is cached and loads
    // synchronously. Alternatively we could spawn() this code:
    hold(0);
    doc.write("\x3Cscript type='text/javascript' src=\""+url+"\">\x3C/script>");
    doc.close();
  }
  finally {
    iframe.parentNode.removeChild(iframe);
  }
  // This hold(0) is required to prevent a security (cross-domain)
  // error under FF, if the code continues with loading another iframe:
  hold(0);
  return rv; 
};

    
var XHR_caps;
var activex_xhr_ver;
// construct/retrieve xhr caps.
function getXHRCaps() {
  if (!XHR_caps) {
    XHR_caps = {};
    // set xhr ctor:
    if (__oni_rt.G.XMLHttpRequest)
      XHR_caps.XHR_ctor = function() { return new XMLHttpRequest(); };
    else
      XHR_caps.XHR_ctor = function() {
        if (activex_xhr_ver !== undefined)
          return new ActiveXObject(activex_xhr_ver);    
        for (var v in
             { "MSXML2.XMLHTTP.6.0":1,
               "MSXML2.XMLHTTP.3.0":1,
               "MSXML2.XMLHTTP":1
             }) {
          try {
            var req = new ActiveXObject(v);
            activex_xhr_ver = v;
            return req;
          }
          catch (e) {}
        }
        throw new Error("Browser does not support XMLHttpRequest");
      };
    
    // determine CORS caps:
    XHR_caps.XHR_CORS = ("withCredentials" in XHR_caps.XHR_ctor());
    if (!XHR_caps.XHR_CORS)
      XHR_caps.XDR = (__oni_rt.G.XDomainRequest !== undefined);
    XHR_caps.CORS = (XHR_caps.XHR_CORS || XHR_caps.XDR) ? "CORS" : "none";
  }
  return XHR_caps;
}

/**
   @function getXDomainCaps_hostenv
   @summary Returns the cross-domain capabilities of the host environment ('CORS'|'none'|'*')
   @return {String}
*/
function getXDomainCaps_hostenv() {
  return getXHRCaps().CORS;
}

/**
   @function getTopReqParent_hostenv
   @summary Return top-level require parent (for converting relative urls in absolute ones)
*/
var req_base;
function getTopReqParent_hostenv() {
  if (!req_base) req_base = document.location.href;
  return req_base;
}

/**
   @function resolveSchemelessURL_hostenv
   @summary Resolve a relative URL to an absolute one (for the require-mechanism)
   @param {String} [url_string] Relative URL to be converted
   @param {Object} [req_obj] require-object
   @param {parent} [parent] Module parent (possibly undefined if loading from top-level)
   @return {String} Absolute URL
*/
function resolveSchemelessURL_hostenv(url_string, req_obj, parent) {
  if (req_obj.path && req_obj.path.length)
    url_string = exports.constructURL(req_obj.path, url_string);
  return exports.canonicalizeURL(url_string, parent);
}


/**
   @function request_hostenv
   @summary Performs an [XMLHttpRequest](https://developer.mozilla.org/en/XMLHttpRequest)-like HTTP request.
   @param {URLSPEC} [url] Request URL (in the same format as accepted by [http.constructURL](#http/constructURL))
   @param {optional Object} [settings] Hash of settings (or array of hashes)
   @return {String}
   @setting {String} [method="GET"] Request method.
   @setting {QUERYHASHARR} [query] Additional query hash(es) to append to url. Accepts same format as [http.constructQueryString](#http/constructQueryString).
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

     ### Cross-domain requests:

     The success of cross-domain requests depends on the cross-domain
     capabilities of the host environment, see
     [apollo-sys.getXDomainCaps](#apollo-sys/getXDomainCaps). If this function
     returns "CORS" then success of cross-domain requests depends on
     whether the server allows the access (see
     <http://www.w3.org/TR/cors/>).

     In the xbrowser host environment, the standard XMLHttpRequest can
     handle cross-domain requests on compatible browsers (any recent
     Chrome, Safari, Firefox). On IE8+,
     [apollo-sys.request](#apollo-sys/request) will automatically fall
     back to using MS's XDomainRequest object for cross-site requests.

     ### Request failure:

     If the request is unsuccessful, and the call is configured to
     throw exceptions (setting {"throwing":true}; the default), an
     exception will be thrown which has a 'status' member set to the
     request status. If the call is configured to not throw, an empty
     string will be returned.  
*/
function request_hostenv(url, settings) {
  var opts = exports.accuSettings({},
                                   [
                                     {
                                       method   : "GET",
                                       //    query    : undefined,
                                       body     : null,
                                       //    headers  : undefined,
                                       //    username : undefined,
                                       //    password : undefined,
                                       throwing   : true
                                     },
                                     settings
                                   ]);
  url = exports.constructURL(url, opts.query);

  var caps = getXHRCaps();
  if (!caps.XDR || exports.isSameOrigin(url, document.location)) {
    var req = caps.XHR_ctor();
    req.open(opts.method, url, true, opts.username || "", opts.password || "");
  }
  else {
    // A cross-site request on IE, where we have to use XDR instead of XHR:
    req = new XDomainRequest();
    req.open(opts.method, url);
  }
  
  waitfor(var error) {
    if (req.onerror !== undefined) {
      req.onload = function() { resume(); };
      req.onerror = function() { resume(true); };
    }
    else { // IE
      req.onreadystatechange = function(evt) {
        if (req.readyState != 4)
          return;
        else
          resume();
      };
    }

    if (opts.headers)
      for (var h in opts.headers)
        req.setRequestHeader(h, opts.headers[h]);
    if (opts.mime && req.overrideMimeType)
      req.overrideMimeType(opts.mime);
    req.send(opts.body);
  }
  retract {
    req.abort();
  }

  // file urls will return a success code '0', not '2'!
  if (error ||
      (req.status !== undefined && // req.status is undefined for IE XDR objs
       !(req.status.toString().charAt(0) in {'0':1,'2':1}))) {
    if (opts.throwing) {
      var txt = "Failed " + opts.method + " request to '"+url+"'";
      if (req.statusText) txt += ": "+req.statusText;
      if (req.status) txt += " ("+req.status+")";
      var err = new Error(txt);
      err.status = req.status;
      throw err;
    }
    else
      return "";
  }
  return req.responseText;
}

//----------------------------------------------------------------------
// initial list of hubs and extensions:

function getHubs_hostenv() {
  // determine location of oni-apollo.js script:
  var scripts = document.getElementsByTagName("script"),matches;
  var location;
  for (var i=0; i<scripts.length; ++i) {
    if ((matches = /(.*)oni-apollo.js$/.exec(scripts[i].src))) {
      location = exports.canonicalizeURL(matches[1]+"modules/", document.location.href);
      break;
    }
  }
  
  return [
    ["apollo:", location ? 
                  location : 
                  { src: function(path) { 
                      throw new Error("Can't load module '"+path+
                                      "': The location of the apollo standard module lib is unknown - it can only be inferred automatically if you load oni-apollo.js in the normal way through a <script> element."); }
                  } ],
    ["github:", {src:github_src_loader} ],
    ["http:",  {src:http_src_loader} ],
    ["https:", {src:http_src_loader} ]
  ];
}

function getExtensions_hostenv() {
  return {
    // normal sjs modules
    'sjs': function(src, descriptor) {
      var f = exports.eval("(function(module,exports,require){"+src+"})",
                           {filename:"module '"+descriptor.id+"'"});
      f(descriptor, descriptor.exports, descriptor.require);
    },
    // plain non-sjs js modules
    'js': function(src, descriptor) {
      var f = new Function("module", "exports", src);
      f.apply(descriptor.exports, [descriptor, descriptor.exports]);
    }
  };
}

//----------------------------------------------------------------------
// exports into global scope:

__oni_rt.G.require = __oni_rt.sys.require;

//----------------------------------------------------------------------
// the init function serves no useful purpose in the xbrowser environment,
// all initialization is done below
hostenv_init = function(){};

//----------------------------------------------------------------------
// script loading:

if (!__oni_rt.G.__oni_rt_no_script_load) {
  function runScripts() {
    var scripts = document.getElementsByTagName("script");
    
    // if there is something like a require('google').load() call in
    // one of the scripts, our 'scripts' variable will change. In some
    // circumstances this can lead to scripts being executed twice. To
    // prevent this, we select text/sjs scripts and eval them in two passes:
    
    // this doesn't work on IE: ("JScript object expected")
    //var ss = Array.prototype.slice.call(scripts, 0);
    var ss = [];
    for (var i=0; i<scripts.length; ++i) {
      if (scripts[i].getAttribute("type") == "text/sjs") {
        var s = scripts[i];
        ss.push(s);
      }
    }
    
    for (var i=0; i<ss.length; ++i) {
      var s = ss[i];
      var m = s.getAttribute("module");
      // textContent is for XUL compatibility:
      var content = s.textContent || s.innerHTML;
      if (__oni_rt.UA == "msie") {
        // special casing for IE: remove spurious CRLF at beginning of content
        content = content.replace(/\r\n/, "");
        }
      if (m)
        __oni_rt.modsrc[m] = content;
      else
        exports.eval(content, {filename:"inline_script"+(i+1)});
    }
  };
  
  if (document.readyState === "complete") {
    runScripts();
  }
  else {
    // XXX maybe use DOMContentLoaded here, if available
    if (__oni_rt.G.addEventListener)
      __oni_rt.G.addEventListener("load", runScripts, true);
    else
      __oni_rt.G.attachEvent("onload", runScripts);
  }
}

