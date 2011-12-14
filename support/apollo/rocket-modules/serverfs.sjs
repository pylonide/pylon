/*
 * Oni Rocket Web Application Server
 * Server filesystem module
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
var path = require('path');
var common = require('apollo:common');
var stream = require('apollo:node-stream');
var logging = require('apollo:logging');

// this is the configurable part of the filesystem:
var staticPathMap = [];

// this is where modules map their paths; these paths take priority
// over the static map:
var dynamicPathMap = [];

//----------------------------------------------------------------------
// initialization

exports.setStaticPathMap = function(pathMap) {
  staticPathMap = pathMap;
};

exports.mapDynamicHandler = function(regex, handler) {
  dynamicPathMap.push({pattern: regex, handler:handler});
};

//----------------------------------------------------------------------
// helpers

// returns [matches, handler] || null
function match_handler(path) {
  var matches;
  var l = dynamicPathMap.length;
  for (var i=0; i<l; ++i) {
    if((matches = path.match(dynamicPathMap[i].pattern)))
      return [matches, dynamicPathMap[i].handler];
  }
  l = staticPathMap.length;
  for (var i=0; i<l; ++i) {
    if((matches = path.match(staticPathMap[i].pattern)))
      return [matches, staticPathMap[i].handler];
  }
  return null;
}

//----------------------------------------------------------------------
// response helpers

function writeRedirectResponse(response, location, status) {
  if (!status) status = 302;
  var resp = "<html><head><title>"+status+" Redirect</title></head>";
  resp += "<body><h4>"+status+" Redirect</h4>";
  resp += "The document can be found <a href='"+location+"'>"+location+"</a>.";
  resp += "<hr>Oni Rocket Server</body></html>";
  response.writeHead(status, { "Content-Type":"text/html", "Location":location});
  response.end(resp);
}

function writeErrorResponse(response, status, title, text) {
  var resp = "<html><head><title>"+status+" "+title+"</title></head>";
  resp += "<body><h4>"+status+" "+title+"</h4>";
  resp += text;
  resp += "<hr>Oni Rocket Server</body></html>";
  response.writeHead(status, title, { "Content-Type":"text/html" });
  response.end(resp);
}

//----------------------------------------------------------------------
// main entry points into the filesystem:

exports.handle_get = function(request, response) {
  var mh = match_handler(request.parsedUrl.path);
  if (!mh || !mh[1].handle_get) return false;
  mh[1].handle_get(request, response, mh[0]);
  return true;
};

exports.handle_post = function(request, response) {
  var mh = match_handler(request.parsedUrl.path);
  if (!mh || !mh[1].handle_post) return false;
  mh[1].handle_post(request, response, mh[0]);
  return true;
};


//----------------------------------------------------------------------
// mapped directory handler: maps directories on disk to the virtual
// filesystem

// helper for listing directories
function listDirectory(request, response, root, branch, format, formats) {
  
  var listing = {
    path: branch,
    directories: [],
    files: []
  };
  
  // add ".." unless we're listing the root
  if(branch != '/') {
    listing.directories.push("..");
  }

  var files = fs.readdir(path.join(root, branch));
  for (var i=0; i<files.length; ++i) {
    var filename = files[i];
    var filepath = path.join(root, branch, filename);

    if (fs.isDirectory(filepath)) {
      listing.directories.push(filename);
    }
    else if (fs.isFile(filepath)) {
      var size = fs.stat(filepath).size;
      listing.files.push({name: filename, size: size});
    }
  }
  var listingJson = JSON.stringify(listing);
  return formatResponse(
      { input: new stream.ReadableStringStream(listingJson),
        extension: "/",
        requestedFormat: format,
        defaultFormats: defaultDirectoryListingFormats
      },
      request, response, formats);
}

function directoryListingToJSON(src, dest) {
  // directory listing currently comes as JSON
  stream.pump(src, dest);
};

function directoryListingToHtml(src, dest) {
  var dir = JSON.parse(stream.readAll(src));
  //XXX should this preserve !format fragment when linking to other directories?
  var header = "<h1>Contents of " + dir.path + "</h1>";
  var folderList = dir.directories.map(function(d) {
    //XXX xml escaping!
    return "<li><a href=\"" + d + "/\">" + d + "/</a></li>";
  });
  var fileList = dir.files.map(function(f) {
    var size = f.size;
    var sizeDesc = null;
    if (size < 1024)
      sizeDesc = size + " B";
    else if (size < 1024 * 1024)
      sizeDesc = Math.round(size/1024*10)/10+ " kB";
    else
      sizeDesc = Math.round(size/1024/1024*10)/10+ " MB";
    return "<li><a href=\"" + f.name + "\">" + f.name + "</a>(" + sizeDesc + ")</li>";
  });
  dest.write(header + "<ul>" + folderList.join("\n") + fileList.join("\n") + "</ul>");
};

// Used as a default, overrideable by specifying
// something for "/" in formats
var defaultDirectoryListingFormats = {
  "/": { none: { mime: "text/html",
               filter: directoryListingToHtml },
         json: { mime: 'application/json',
               filter: directoryListingToJSON }}
};



//----------------------------------------------------------------------
// formatResponse:
// takes an `item`, a request, a response and a
// formats object, and may write the item to the
// response. Returns whether the item was written.
//
// An item must contain the following keys:
//  - extension
//  - input (a stream of data)
//  - requestedFormat
// It may also contain defaultFormats, for use when
// the server has no configured format for the given
// extension / format.
function formatResponse(item, request, response, formats) {
  var input = item.input;
  var extension = item.extension;
  var format = item.requestedFormat;
  var defaultFormats = item.defaultFormats;

  formats = common.mergeSettings(defaultFormats, formats);
  var filedesc = formats[extension] || formats["*"];
  if (!filedesc) {
    console.log("Don't know how to serve item with extension '"+extension+"'");
    // XXX should we generate an error?
    return false;
  }

  var formatdesc = filedesc[format];
  if (!formatdesc) {
    console.log("Can't serve item with extension '"+extension+"' in format '"+format+"'");
    // XXX should we generate an error?
    return false;
  }

  var contentHeader = formatdesc.mime ? {"Content-Type":formatdesc.mime} : {};
  response.writeHead(200, contentHeader);
  if(formatdesc.filter) {
    formatdesc.filter(input, response, request);
  } else {
    stream.pump(input, response);
  }
  response.end();
  return true;
};

// attempts to serve the file; returns 'false' if not found
function serveFile(request, response, filePath, format, formats) {
  if (!fs.isFile(filePath)) return false;
  
  var ext = path.extname(filePath).slice(1);
  return formatResponse(
      { input: require('fs').createReadStream(filePath),
        extension: ext,
        requestedFormat: format
      },
      request, response, formats);
}

// Maps a directory on disk into the server fs.
// - The 'pattern' regex under which the handler will be filed needs to
//   have capturing parenthesis around the relative path that will be mapped
//   e.g.:  pattern: /^/virtual_root(\/.*)?$/
// - 'root' is the absolute on-disk path prefix.
// - 'formats' is a 'fileformat map' which determines the mime type
//   and filters (if any) for get-requests.
function createMappedDirectoryHandler(root, formats, flags)
{
  function handle_get(request, response, matches) {
    
    var relativePath = matches[1] || "/";
    var pathAndFormat = relativePath.split("!");
    relativePath = pathAndFormat[0];
    var format   = pathAndFormat[1] || "none";

    var file = relativePath ? path.join(root, relativePath) : root;
    
    if (fs.isDirectory(file)) {
      // make sure we have a canonical url with '/' at the
      // end. otherwise relative links will break:
      if (file[file.length-1] != "/") {
        // XXX this wll lose any format given
        // (and we don't want to append '!none' if no format was given)
        var newUrl = relativePath + "/";
        writeRedirectResponse(response, newUrl);
        return;
      }
      var served = false;
      if (flags.mapIndexToDir)
        served = serveFile(request, response, file + "/index.html", format, formats);
      if (!served) {
        if(flags.allowDirListing)
          served = listDirectory(request, response, root, relativePath, format, formats);
        if(!served) {
          console.log("Could not render '"+file+"' in the requested format");
          writeErrorResponse(response, 406, "Not Acceptable", "Could not find an appropriate representation");
        }
      }
    }
    else {
      // normal file
      try {
        if (!serveFile(request, response, file, format, formats)) {
          console.log("File '"+file+"' not found");
          writeErrorResponse(response, 404, "Not Found",
                             "File '"+matches[1]+"' not found");
        }
      }
      catch (e) {
        throw "Error serving file '"+matches[1]+"': "+e;
      }
    }
  }
  return {
    handle_get: handle_get,
    flags: flags
  };
}

exports.createMappedDirectoryHandler = createMappedDirectoryHandler;

