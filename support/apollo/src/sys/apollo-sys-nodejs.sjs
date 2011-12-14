/*
 * Oni Apollo system module ('sjs:apollo-sys') hostenv-specific part
 *
 * NodeJS-based ('nodejs') version
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
   @setting {QUERYHASHARR} [query] Additional query hash(es) to append to url. Accepts same format as [http.constructQueryString](#http/constructQueryString).
   @setting {String} [cbfield="callback"] Name of JSONP callback field in query string.
   @setting {String} [forcecb] Force the name of the callback to the given string. 
*/
function jsonp_hostenv(url, settings) {
  var opts = exports.accuSettings({}, [ 
    {
      // query : undefined,
      cbfield : "callback",
      forcecb : "jsonp"
    },
    settings
  ]);
  var query = {};
  query[opts.cbfield] = opts.forcecb;
  // XXX should be cleverer about this 
  var parser = /^[^{]*({[^]+})[^}]*$/;
  var data = parser.exec(request_hostenv([url, opts.query, query]));
  
  // JSON.parse doesn't accept Latin-1 hex escapes (\xXX), but some
  // services (google dictionary) use them. Let's convert to unicode
  // escapes (\u00XX):
  data[1] = data[1].replace(/([^\\])\\x/g, "$1\\u00");

  try {
    return JSON.parse(data[1]);
  }
  catch (e) {
    throw new Error("Invalid jsonp response from "+exports.constructURL(url)+" ("+e+")");
  }
}

/**
   @function getXDomainCaps_hostenv
   @summary Returns the cross-domain capabilities of the host environment ('CORS'|'none'|'*')
   @return {String}
*/
function getXDomainCaps_hostenv() {
  return "*";
}

/**
   @function getTopReqParent_hostenv
   @summary Return top-level require parent (for converting relative urls in absolute ones)
*/
var req_base;
function getTopReqParent_hostenv() {
  if (!req_base) req_base = "file://"+process.cwd()+"/";
  return req_base;
}

/**
   @function resolveSchemelessURL_hostenv
   @summary Resolve a scheme-less URL (for the require-mechanism)
   @param {String} [url_string] Scheme-less URL to be converted
   @param {Object} [req_obj] require-object
   @param {String} [parent] parent url (possibly undefined if loading from top-level)
   @return {String} Absolute URL
*/
function resolveSchemelessURL_hostenv(url_string, req_obj, parent) {
  if (/^\.?\.?\//.exec(url_string))
    return exports.canonicalizeURL(url_string, parent);
  else
    return "nodejs:"+url_string;
}


// reads data from a stream; returns null if the stream has ended;
// throws if there is an error
var readStream = exports.readStream = function readStream(stream) {
  //XXX 2.X doesn't implement readable on some streams (http
  //responses, maybe others), so we gotto be careful what exactly we
  //test here:
  if (stream.readable === false) return null;
  var data = null;
  
 stream.resume();
  waitfor {
    waitfor (var exception) {
      stream.on('error', resume);
      stream.on('end', resume);
    }
    finally {
      stream.removeListener('error', resume);
      stream.removeListener('end', resume);
    }
    if (exception) throw exception;
  }
  or {
    waitfor (data) {
      stream.on('data', resume);
    }
    finally {
      stream.removeListener('data', resume);
    }
  }
  finally {
    if (stream.readable)
      stream.pause();
  }
  
  return data;
}


/**
   @function request
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
   @setting {Boolean} [throwing=true] Throw exception on error.
   @setting {Integer} [max_redirects=5] Maximum number of redirects to follow.
*/
function request_hostenv(url, settings) {
  var opts = exports.accuSettings({},
                                  [ 
                                    { 
                                      method : "GET",
                                      // query : undefined
                                      body : null,
                                      headers : {},
                                      // username : undefined
                                      // password : undefined
                                      throwing : true,
                                      max_redirects : 5
                                    },
                                    settings
                                  ]);
  var url_string = exports.constructURL(url, opts.query);
  // XXX ok, it sucks that we have to take this URL apart again :-/
  var url = exports.parseURL(url_string);
  var protocol = url.protocol;
  if(!(protocol === 'http' || protocol === 'https')) {
    throw('Unsupported protocol: ' + protocol);
  }
  var secure = (protocol == "https");
  var port = url.port || (secure ? 443 : 80);

  if (!opts.headers['Host'])
    opts.headers.Host = url.authority;
  var request = __oni_rt.nodejs_require(protocol).request({
    method: opts.method,
    host: url.host,
    port: port,
    path: url.relative || '/',
    headers: opts.headers
  });
  request.end(); // XXX body

  waitfor {
    waitfor (var err) {
      request.on('error', resume);
    }
    finally {
      request.removeListener('error', resume);
    }
    throw new Error(err);
  }
  or {
    waitfor (var response) {
      request.on('response', resume);
    }
    finally {
      request.removeListener('response', resume);
    }
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    switch (response.statusCode) {
    case 300: case 301: case 302: case 303: case 307:
      if (opts.max_redirects > 0) {
        //console.log('redirect to ' + response.headers['location']);
        opts.headers.host = null;
        --opts.max_redirects;
        return request_hostenv(response.headers['location'], opts);
      }
      // else fall through
    default:
      if (opts.throwing) {
        var txt = "Failed " + opts.method + " request to '"+url_string+"'";
        txt += " ("+response.statusCode+")";
        var err = new Error(txt);
        err.status = response.statusCode;
        err.request = request;
        err.response = response;
        throw err;
        }
      else
        return "";
    }
  }
  
  // XXX support for returning streambuffer
  response.setEncoding('utf8');
  response.data = "";
  var data;
  while (data = readStream(response)) {
    response.data += data;
  }

  return response.data;
};

function file_src_loader(path) {
  waitfor (var err, data) {
    // asynchronously load file at path (removing 'file://' prefix first):
    __oni_rt.nodejs_require('fs').readFile(path.substr(7), resume);
  }
  if (err) {
    // XXX this is a hack to allow us to load sjs scripts without .sjs extension, 
    // e.g. hash-bang scripts
    var matches;
    if ((matches = /(.*)\.sjs$/.exec(path))) {
      try {
        return file_src_loader(matches[1]);
      } catch (e) { throw err + "\nand then\n"+e; }
    }
    else
      throw err;
  }
  return { src: data.toString(), loaded_from: path };
}

// load a builtin nodejs module:
function nodejs_loader(path, parent, dummy_src, opts) {

  // strip off 'nodejs:'
  path = path.substr(7);
  // resolve using node's require mechanism in this order:
  //  native nodejs module, apollo-native module (based on known extensions), other nodejs module

  var base;
  if (!(/^file:/.exec(parent))) // e.g. we are being loaded from a http module
    base = getTopReqParent_hostenv();
  
  // strip 'file://'
  base = parent.substr(7);

  var mockModule = { 
    paths: __oni_rt.nodejs_require('module')._nodeModulePaths(base) 
  };

  var resolved="";
  try {
    resolved = __oni_rt.nodejs_require('module')._resolveFilename(path, mockModule)[1];
    if (resolved.indexOf('.') == -1) return __oni_rt.nodejs_require(resolved); // native module
  }
  catch (e) {}
  // if the url doesn't have an extension, try .sjs (even if we already resolved a module):
  var matches;
  if (!(matches = /.+\.([^\.\/]+)$/.exec(path))) {
    try {
      // now try .sjs
      resolved = __oni_rt.nodejs_require('module')._resolveFilename(path+".sjs", mockModule)[1];
      // ok, success. load as a file module:
      return default_loader("file://"+resolved, parent, file_src_loader);
    }
    catch (e) {}
  }
  else if (resolved && matches[1]!="js") {
    // see if this is an apollo-known extension (but NOT js!)
    if (exports.require.extensions[matches[1]]) // yup; load as apollo-native module
      return default_loader("file://"+resolved, parent, file_src_loader);
  }

  if (resolved == "") throw new Error("nodejs module at '"+path+"' not found");
  return __oni_rt.nodejs_require(resolved);
}

function getHubs_hostenv() {
  return [
    ["apollo:", "file://"+__oni_rt.nodejs_apollo_lib_dir ],
    ["github:", {src: github_src_loader} ],
    ["http:", {src: http_src_loader} ],
    ["https:", {src: http_src_loader} ],
    ["file:", {src: file_src_loader} ],
    ["nodejs:", {loader: nodejs_loader} ]
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
    // plain non-sjs js modules (note: for 'nodejs' scheme we bypass this)
    'js': function(src, descriptor) {
      var f = new Function("module", "exports", "require", src);
      f.apply(descriptor.exports, [descriptor, descriptor.exports, descriptor.require]);
    }
  };
}

//----------------------------------------------------------------------
// Called once apollo itself is initialized.
// Loads any user-defined init scripts from $APOLLO_INIT.
function init_hostenv() {
  var init_path = process.env['APOLLO_INIT'];
  if(init_path) {
    var node_fs = __oni_rt.nodejs_require('fs');
    var files = init_path.split(':');
    for(var i=0; i<files.length; i++) {
      var path = files[i];
      if(!path) continue;
      try {
        path = node_fs.realpathSync(path); // file:// URIs need an absolute path
        exports.require('file://' + path);
      } catch(e) {
        console.error("Error loading init script at " + path + ": " + e);
        throw e;
      }
    }
  }
};

