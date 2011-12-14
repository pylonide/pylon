/*
 * Oni Rocket Web Application Server
 * Main application module
 *
 * Part of Oni Apollo
 * Version: 'unstable'
 * http://onilabs.com/apollo
 *
 * (c) 2011 Oni Labs, http://onilabs.com
 *
 * This file is licensed under the terms of the GPL v2, see
 * http://www.gnu.org/licenses/gpl-2.0.html
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

var fs = require('apollo:node-fs');
var common = require('apollo:common');
var http = require('apollo:http');
var serverfs = require('./serverfs');
var path = require('path');
var print = function(s) { process.stdout.write(s+"\n") };
var stream = require('apollo:node-stream');

//----------------------------------------------------------------------

function usage() {
  print("Usage: rocket [options]");
  print("");
  print("Options:");
  print("  -h, --help         display this help message");
  print("      --port PORT    server port (default: "+port+")");
  print("      --host IPADDR  server host (default: "+host+"; use 'any' for INADDR_ANY)");
  print("      --root DIR     server root (default: "+root+")");
  print("      --cors         allow full cross-origin access (adds ");
  print("                     'Access-Control-Allow-Origin: *' headers)");
  print("");
}

//----------------------------------------------------------------------

var root = http.canonicalizeURL('../', module.id).substr(7);
var port = "7070";
var host = "localhost";
var cors = false;

for (var i=1; i<process.argv.length; ++i) {
  var flag = process.argv[i];
  switch (flag) {
  case "-h":
  case "--help":
    return usage();
    break;
  case "--port":
    port = process.argv[++i];
    break;
  case "--host":
    host = process.argv[++i];
    if (host == "any") host = undefined;
    break;
  case "--root":
    root = process.argv[++i];
    break;
  case "--cors":
    cors = true;
    break;
  default:
    return usage();
  }
}

//----------------------------------------------------------------------
// File format filter maps

// helper filter to wrap a file in a jsonp response:
function json2jsonp(src, dest, req) {
  var callback = req.parsedUrl.queryKey['callback'];
  if (!callback) callback = "callback";
  dest.write(callback + "(");
  stream.pump(src, dest);
  dest.write(")");
}

// filter that wraps a module as 'modp':
function modp(src, dest) {
  src = stream.readAll(src);
  dest.write("module("+require("../tmp/c1jsstr.js").compile(src, {keeplines:true})+");");
}

function BaseFileFormatMap() { }
BaseFileFormatMap.prototype = {
  html : { none : { mime: "text/html" },
           src  : { mime: "text/plain" }
         },
  js   : { none : { mime: "text/javascript" },
           src  : { mime: "text/plain" }
         },
  json : { none : { mime: "application/json" },
           src  : { mime: "text/plain" },
           jsonp: { mime: "text/javascript",
                    filter: json2jsonp }
         },
  sjs  : { none : { mime: "text/plain" },
           src  : { mime: "text/plain" },
           modp : { mime: "text/javascript",
                    filter: modp }
         },
  xml  : { none : { mime: "text/xml" },
           src  : { mime: "text/plain" }
         },
  svg  : { none : { mime: "image/svg+xml" } },
  txt  : { none : { mime: "text/plain" } },
  "*"  : { none : { /* serve without mimetype */ }
         }
};

var PublicFileFormatMap = new BaseFileFormatMap();
// serve sjs files only as js, never as source:
//PublicFileFormatMap.sjs = {
//  none : { mime: "text/javascript", filter: sjs2js }
//};

//----------------------------------------------------------------------

var pathMap = [
  {
    // main server root
    pattern: /(\/.*)$/,
    handler: serverfs.createMappedDirectoryHandler(
      root,
      PublicFileFormatMap,
      { allowDirListing: true,
        mapIndexToDir: true }
    )
  }
];

//----------------------------------------------------------------------


waitfor {
  serverfs.setStaticPathMap(pathMap);
  require('apollo:node-http').runSimpleServer(requestHandler, port, host);
}
and {
  print("");
  print("   ^    Oni Rocket Server");
  print("  | |");
  print("  |O|   * Version: 'unstable'");
  print("  | |");
  print(" | _ |  * Launched with root directory");
  print("/_| |_\\   '"+root+"'");
  print(" |||||");
  print("  |||   * Running on http://"+(host ? host : "INADDR_ANY")+":"+port+"/");
  print("  |||");
  print("   |");
}

//----------------------------------------------------------------------

function requestHandler(req, res) {
  try {
    req.parsedUrl = http.parseURL("http://"+req.headers.host+req.url);
    res.setHeader("Server", "OniRocket"); // XXX version
    if (cors)
      res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method == "GET") {
      if (!serverfs.handle_get(req, res)) throw "Unknown request";
    }
    else if (req.method == "POST") {
      if (!serverfs.handle_post(req, res)) throw "Unknown request";
    }
    else
      throw "Unknown method";
  }
  catch (e) {
    try {
      res.writeHead(400);
      res.end(e.toString());
    } catch (writeErr) {
      // ending up here means that we probably already sent headers to the clients...
      process.stderr.write(writeErr + "\n");
      // throw the original exception, it's more important
      throw e;
    }
  }
}

