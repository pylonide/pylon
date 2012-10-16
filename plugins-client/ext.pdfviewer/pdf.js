/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var PDFJS = {};

(function pdfjsWrapper() {
  // Use strict in our context only - users might not want it
  'use strict';

  PDFJS.build =
'c8cf445';

/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var globalScope = (typeof window === 'undefined') ? this : window;

var isWorker = (typeof window == 'undefined');

var ERRORS = 0, WARNINGS = 1, INFOS = 5;
var verbosity = WARNINGS;

// The global PDFJS object exposes the API
// In production, it will be declared outside a global wrapper
// In development, it will be declared here
if (!globalScope.PDFJS) {
  globalScope.PDFJS = {};
}

// getPdf()
// Convenience function to perform binary Ajax GET
// Usage: getPdf('http://...', callback)
//        getPdf({
//                 url:String ,
//                 [,progress:Function, error:Function]
//               },
//               callback)
function getPdf(arg, callback) {
  var params = arg;
  if (typeof arg === 'string')
    params = { url: arg };
//#if !B2G
  var xhr = new XMLHttpRequest();
//#else
//var xhr = new XMLHttpRequest({mozSystem: true});
//#endif
  xhr.open('GET', params.url);

  var headers = params.headers;
  if (headers) {
    for (var property in headers) {
      if (typeof headers[property] === 'undefined')
        continue;

      xhr.setRequestHeader(property, params.headers[property]);
    }
  }

  xhr.mozResponseType = xhr.responseType = 'arraybuffer';

  var protocol = params.url.substring(0, params.url.indexOf(':') + 1);
  xhr.expected = (protocol === 'http:' || protocol === 'https:') ? 200 : 0;

  if ('progress' in params)
    xhr.onprogress = params.progress || undefined;

  var calledErrorBack = false;

  if ('error' in params) {
    xhr.onerror = function errorBack() {
      if (!calledErrorBack) {
        calledErrorBack = true;
        params.error();
      }
    }
  }

  xhr.onreadystatechange = function getPdfOnreadystatechange(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === xhr.expected) {
        var data = (xhr.mozResponseArrayBuffer || xhr.mozResponse ||
                    xhr.responseArrayBuffer || xhr.response);
        callback(data);
      } else if (params.error && !calledErrorBack) {
        calledErrorBack = true;
        params.error(e);
      }
    }
  };
  xhr.send(null);
}
globalScope.PDFJS.getPdf = getPdf;
globalScope.PDFJS.pdfBug = false;

var Page = (function PageClosure() {
  function Page(xref, pageNumber, pageDict, ref) {
    this.pageNumber = pageNumber;
    this.pageDict = pageDict;
    this.xref = xref;
    this.ref = ref;

    this.displayReadyPromise = null;
  }

  Page.prototype = {
    getPageProp: function Page_getPageProp(key) {
      return this.pageDict.get(key);
    },
    inheritPageProp: function Page_inheritPageProp(key) {
      var dict = this.pageDict;
      var obj = dict.get(key);
      while (obj === undefined) {
        dict = dict.get('Parent');
        if (!dict)
          break;
        obj = dict.get(key);
      }
      return obj;
    },
    get content() {
      return shadow(this, 'content', this.getPageProp('Contents'));
    },
    get resources() {
      return shadow(this, 'resources', this.inheritPageProp('Resources'));
    },
    get mediaBox() {
      var obj = this.inheritPageProp('MediaBox');
      // Reset invalid media box to letter size.
      if (!isArray(obj) || obj.length !== 4)
        obj = [0, 0, 612, 792];
      return shadow(this, 'mediaBox', obj);
    },
    get view() {
      var mediaBox = this.mediaBox;
      var cropBox = this.inheritPageProp('CropBox');
      if (!isArray(cropBox) || cropBox.length !== 4)
        return shadow(this, 'view', mediaBox);

      // From the spec, 6th ed., p.963:
      // "The crop, bleed, trim, and art boxes should not ordinarily
      // extend beyond the boundaries of the media box. If they do, they are
      // effectively reduced to their intersection with the media box."
      cropBox = Util.intersect(cropBox, mediaBox);
      if (!cropBox)
        return shadow(this, 'view', mediaBox);

      return shadow(this, 'view', cropBox);
    },
    get annotations() {
      return shadow(this, 'annotations', this.inheritPageProp('Annots'));
    },
    get rotate() {
      var rotate = this.inheritPageProp('Rotate') || 0;
      // Normalize rotation so it's a multiple of 90 and between 0 and 270
      if (rotate % 90 != 0) {
        rotate = 0;
      } else if (rotate >= 360) {
        rotate = rotate % 360;
      } else if (rotate < 0) {
        // The spec doesn't cover negatives, assume its counterclockwise
        // rotation. The following is the other implementation of modulo.
        rotate = ((rotate % 360) + 360) % 360;
      }
      return shadow(this, 'rotate', rotate);
    },

    getOperatorList: function Page_getOperatorList(handler, dependency) {
      var xref = this.xref;
      var content = this.content;
      var resources = this.resources;
      if (isArray(content)) {
        // fetching items
        var streams = [];
        var i, n = content.length;
        var streams = [];
        for (i = 0; i < n; ++i)
          streams.push(xref.fetchIfRef(content[i]));
        content = new StreamsSequenceStream(streams);
      } else if (isStream(content)) {
        content.reset();
      } else if (!content) {
        // replacing non-existent page content with empty one
        content = new Stream(new Uint8Array(0));
      }

      var pe = this.pe = new PartialEvaluator(
                                xref, handler, 'p' + this.pageNumber + '_');

      return pe.getOperatorList(content, resources, dependency);
    },
    extractTextContent: function Page_extractTextContent() {
      var handler = {
        on: function nullHandlerOn() {},
        send: function nullHandlerSend() {}
      };

      var xref = this.xref;
      var content = xref.fetchIfRef(this.content);
      var resources = xref.fetchIfRef(this.resources);
      if (isArray(content)) {
        // fetching items
        var i, n = content.length;
        var streams = [];
        for (i = 0; i < n; ++i)
          streams.push(xref.fetchIfRef(content[i]));
        content = new StreamsSequenceStream(streams);
      } else if (isStream(content)) {
        content.reset();
      }

      var pe = new PartialEvaluator(
                     xref, handler, 'p' + this.pageNumber + '_');
      return pe.getTextContent(content, resources);
    },

    ensureFonts: function Page_ensureFonts(fonts, callback) {
      this.stats.time('Font Loading');
      // Convert the font names to the corresponding font obj.
      for (var i = 0, ii = fonts.length; i < ii; i++) {
        fonts[i] = this.objs.objs[fonts[i]].data;
      }

      // Load all the fonts
      FontLoader.bind(
        fonts,
        function pageEnsureFontsFontObjs(fontObjs) {
          this.stats.timeEnd('Font Loading');

          callback.call(this);
        }.bind(this)
      );
    },
    getLinks: function Page_getLinks() {
      var links = [];
      var annotations = this.getAnnotations();
      var i, n = annotations.length;
      for (i = 0; i < n; ++i) {
        if (annotations[i].type != 'Link')
          continue;
        links.push(annotations[i]);
      }
      return links;
    },
    getAnnotations: function Page_getAnnotations() {
      var xref = this.xref;
      function getInheritableProperty(annotation, name) {
        var item = annotation;
        while (item && !item.has(name)) {
          item = item.get('Parent');
        }
        if (!item)
          return null;
        return item.get(name);
      }
      function isValidUrl(url) {
        if (!url)
          return false;
        var colon = url.indexOf(':');
        if (colon < 0)
          return false;
        var protocol = url.substr(0, colon);
        switch (protocol) {
          case 'http':
          case 'https':
          case 'ftp':
          case 'mailto':
            return true;
          default:
            return false;
        }
      }

      var annotations = this.annotations || [];
      var i, n = annotations.length;
      var items = [];
      for (i = 0; i < n; ++i) {
        var annotationRef = annotations[i];
        var annotation = xref.fetch(annotationRef);
        if (!isDict(annotation))
          continue;
        var subtype = annotation.get('Subtype');
        if (!isName(subtype))
          continue;
        var rect = annotation.get('Rect');

        var item = {};
        item.type = subtype.name;
        item.rect = rect;
        switch (subtype.name) {
          case 'Link':
            var a = annotation.get('A');
            if (a) {
              switch (a.get('S').name) {
                case 'URI':
                  var url = a.get('URI');
                  // TODO: pdf spec mentions urls can be relative to a Base
                  // entry in the dictionary.
                  if (!isValidUrl(url))
                    url = '';
                  item.url = url;
                  break;
                case 'GoTo':
                  item.dest = a.get('D');
                  break;
                case 'GoToR':
                  var url = a.get('F');
                  // TODO: pdf reference says that GoToR
                  // can also have 'NewWindow' attribute
                  if (!isValidUrl(url))
                    url = '';
                  item.url = url;
                  item.dest = a.get('D');
                  break;
                default:
                  TODO('unrecognized link type: ' + a.get('S').name);
              }
            } else if (annotation.has('Dest')) {
              // simple destination link
              var dest = annotation.get('Dest');
              item.dest = isName(dest) ? dest.name : dest;
            }
            break;
          case 'Widget':
            var fieldType = getInheritableProperty(annotation, 'FT');
            if (!isName(fieldType))
              break;
            item.fieldType = fieldType.name;
            // Building the full field name by collecting the field and
            // its ancestors 'T' properties and joining them using '.'.
            var fieldName = [];
            var namedItem = annotation, ref = annotationRef;
            while (namedItem) {
              var parent = namedItem.get('Parent');
              var parentRef = namedItem.getRaw('Parent');
              var name = namedItem.get('T');
              if (name) {
                fieldName.unshift(stringToPDFString(name));
              } else {
                // The field name is absent, that means more than one field
                // with the same name may exist. Replacing the empty name
                // with the '`' plus index in the parent's 'Kids' array.
                // This is not in the PDF spec but necessary to id the
                // the input controls.
                var kids = parent.get('Kids');
                var j, jj;
                for (j = 0, jj = kids.length; j < jj; j++) {
                  var kidRef = kids[j];
                  if (kidRef.num == ref.num && kidRef.gen == ref.gen)
                    break;
                }
                fieldName.unshift('`' + j);
              }
              namedItem = parent;
              ref = parentRef;
            }
            item.fullName = fieldName.join('.');
            var alternativeText = stringToPDFString(annotation.get('TU') || '');
            item.alternativeText = alternativeText;
            var da = getInheritableProperty(annotation, 'DA') || '';
            var m = /([\d\.]+)\sTf/.exec(da);
            if (m)
              item.fontSize = parseFloat(m[1]);
            item.textAlignment = getInheritableProperty(annotation, 'Q');
            item.flags = getInheritableProperty(annotation, 'Ff') || 0;
            break;
          case 'Text':
            var content = annotation.get('Contents');
            var title = annotation.get('T');
            item.content = stringToPDFString(content || '');
            item.title = stringToPDFString(title || '');
            item.name = !annotation.has('Name') ? 'Note' :
              annotation.get('Name').name;
            break;
          default:
            TODO('unimplemented annotation type: ' + subtype.name);
            break;
        }
        items.push(item);
      }
      return items;
    }
  };

  return Page;
})();

/**
 * The `PDFDocument` holds all the data of the PDF file. Compared to the
 * `PDFDoc`, this one doesn't have any job management code.
 * Right now there exists one PDFDocument on the main thread + one object
 * for each worker. If there is no worker support enabled, there are two
 * `PDFDocument` objects on the main thread created.
 */
var PDFDocument = (function PDFDocumentClosure() {
  function PDFDocument(arg, password) {
    if (isStream(arg))
      init.call(this, arg, password);
    else if (isArrayBuffer(arg))
      init.call(this, new Stream(arg), password);
    else
      error('PDFDocument: Unknown argument type');
  }

  function init(stream, password) {
    assertWellFormed(stream.length > 0, 'stream must have data');
    this.stream = stream;
    this.setup(password);
    this.acroForm = this.catalog.catDict.get('AcroForm');
  }

  function find(stream, needle, limit, backwards) {
    var pos = stream.pos;
    var end = stream.end;
    var str = '';
    if (pos + limit > end)
      limit = end - pos;
    for (var n = 0; n < limit; ++n)
      str += stream.getChar();
    stream.pos = pos;
    var index = backwards ? str.lastIndexOf(needle) : str.indexOf(needle);
    if (index == -1)
      return false; /* not found */
    stream.pos += index;
    return true; /* found */
  }

  var DocumentInfoValidators = {
    get entries() {
      // Lazily build this since all the validation functions below are not
      // defined until after this file loads.
      return shadow(this, 'entries', {
        Title: isString,
        Author: isString,
        Subject: isString,
        Keywords: isString,
        Creator: isString,
        Producer: isString,
        CreationDate: isString,
        ModDate: isString,
        Trapped: isName
      });
    }
  };

  PDFDocument.prototype = {
    get linearization() {
      var length = this.stream.length;
      var linearization = false;
      if (length) {
        try {
          linearization = new Linearization(this.stream);
          if (linearization.length != length)
            linearization = false;
        } catch (err) {
          warn('The linearization data is not available ' +
               'or unreadable pdf data is found');
        }
      }
      // shadow the prototype getter with a data property
      return shadow(this, 'linearization', linearization);
    },
    get startXRef() {
      var stream = this.stream;
      var startXRef = 0;
      var linearization = this.linearization;
      if (linearization) {
        // Find end of first obj.
        stream.reset();
        if (find(stream, 'endobj', 1024))
          startXRef = stream.pos + 6;
      } else {
        // Find startxref by jumping backward from the end of the file.
        var step = 1024;
        var found = false, pos = stream.end;
        while (!found && pos > 0) {
          pos -= step - 'startxref'.length;
          if (pos < 0)
            pos = 0;
          stream.pos = pos;
          found = find(stream, 'startxref', step, true);
        }
        if (found) {
          stream.skip(9);
          var ch;
          do {
            ch = stream.getChar();
          } while (Lexer.isSpace(ch));
          var str = '';
          while ((ch - '0') <= 9) {
            str += ch;
            ch = stream.getChar();
          }
          startXRef = parseInt(str, 10);
          if (isNaN(startXRef))
            startXRef = 0;
        }
      }
      // shadow the prototype getter with a data property
      return shadow(this, 'startXRef', startXRef);
    },
    get mainXRefEntriesOffset() {
      var mainXRefEntriesOffset = 0;
      var linearization = this.linearization;
      if (linearization)
        mainXRefEntriesOffset = linearization.mainXRefEntriesOffset;
      // shadow the prototype getter with a data property
      return shadow(this, 'mainXRefEntriesOffset', mainXRefEntriesOffset);
    },
    // Find the header, remove leading garbage and setup the stream
    // starting from the header.
    checkHeader: function PDFDocument_checkHeader() {
      var stream = this.stream;
      stream.reset();
      if (find(stream, '%PDF-', 1024)) {
        // Found the header, trim off any garbage before it.
        stream.moveStart();
        return;
      }
      // May not be a PDF file, continue anyway.
    },
    setup: function PDFDocument_setup(password) {
      this.checkHeader();
      var xref = new XRef(this.stream,
                          this.startXRef,
                          this.mainXRefEntriesOffset,
                          password);
      this.xref = xref;
      this.catalog = new Catalog(xref);
    },
    get numPages() {
      var linearization = this.linearization;
      var num = linearization ? linearization.numPages : this.catalog.numPages;
      // shadow the prototype getter
      return shadow(this, 'numPages', num);
    },
    getDocumentInfo: function PDFDocument_getDocumentInfo() {
      var docInfo;
      if (this.xref.trailer.has('Info')) {
        var infoDict = this.xref.trailer.get('Info');

        docInfo = {};
        var validEntries = DocumentInfoValidators.entries;
        // Only fill the document info with valid entries from the spec.
        for (var key in validEntries) {
          if (infoDict.has(key)) {
            var value = infoDict.get(key);
            // Make sure the value conforms to the spec.
            if (validEntries[key](value)) {
              docInfo[key] = typeof value !== 'string' ? value :
                             stringToPDFString(value);
            } else {
              info('Bad value in document info for "' + key + '"');
            }
          }
        }
      }
      return shadow(this, 'getDocumentInfo', docInfo);
    },
    getFingerprint: function PDFDocument_getFingerprint() {
      var xref = this.xref, fileID;
      if (xref.trailer.has('ID')) {
        fileID = '';
        var id = xref.trailer.get('ID')[0];
        id.split('').forEach(function(el) {
          fileID += Number(el.charCodeAt(0)).toString(16);
        });
      } else {
        // If we got no fileID, then we generate one,
        // from the first 100 bytes of PDF
        var data = this.stream.bytes.subarray(0, 100);
        var hash = calculateMD5(data, 0, data.length);
        fileID = '';
        for (var i = 0, length = hash.length; i < length; i++) {
          fileID += Number(hash[i]).toString(16);
        }
      }

      return shadow(this, 'getFingerprint', fileID);
    },
    getPage: function PDFDocument_getPage(n) {
      return this.catalog.getPage(n);
    }
  };

  return PDFDocument;
})();



// Use only for debugging purposes. This should not be used in any code that is
// in mozilla master.
var log = (function() {
  if ('console' in globalScope && 'log' in globalScope['console']) {
    return globalScope['console']['log'].bind(globalScope['console']);
  } else {
    return function nop() {
    };
  }
})();

// A notice for devs that will not trigger the fallback UI.  These are good
// for things that are helpful to devs, such as warning that Workers were
// disabled, which is important to devs but not end users.
function info(msg) {
  if (verbosity >= INFOS) {
    log('Info: ' + msg);
    PDFJS.LogManager.notify('info', msg);
  }
}

// Non-fatal warnings that should trigger the fallback UI.
function warn(msg) {
  if (verbosity >= WARNINGS) {
    log('Warning: ' + msg);
    PDFJS.LogManager.notify('warn', msg);
  }
}

// Fatal errors that should trigger the fallback UI and halt execution by
// throwing an exception.
function error(msg) {
  // If multiple arguments were passed, pass them all to the log function.
  if (arguments.length > 1) {
    var logArguments = ['Error:'];
    logArguments.push.apply(logArguments, arguments);
    log.apply(null, logArguments);
    // Join the arguments into a single string for the lines below.
    msg = [].join.call(arguments, ' ');
  } else {
    log('Error: ' + msg);
  }
  log(backtrace());
  PDFJS.LogManager.notify('error', msg);
  throw new Error(msg);
}

// Missing features that should trigger the fallback UI.
function TODO(what) {
  warn('TODO: ' + what);
}

function backtrace() {
  try {
    throw new Error();
  } catch (e) {
    return e.stack ? e.stack.split('\n').slice(2).join('\n') : '';
  }
}

function assert(cond, msg) {
  if (!cond)
    error(msg);
}

// Combines two URLs. The baseUrl shall be absolute URL. If the url is an
// absolute URL, it will be returned as is.
function combineUrl(baseUrl, url) {
  if (url.indexOf(':') >= 0)
    return url;
  if (url.charAt(0) == '/') {
    // absolute path
    var i = baseUrl.indexOf('://');
    i = baseUrl.indexOf('/', i + 3);
    return baseUrl.substring(0, i) + url;
  } else {
    // relative path
    var pathLength = baseUrl.length, i;
    i = baseUrl.lastIndexOf('#');
    pathLength = i >= 0 ? i : pathLength;
    i = baseUrl.lastIndexOf('?', pathLength);
    pathLength = i >= 0 ? i : pathLength;
    var prefixLength = baseUrl.lastIndexOf('/', pathLength);
    return baseUrl.substring(0, prefixLength + 1) + url;
  }
}

// In a well-formed PDF, |cond| holds.  If it doesn't, subsequent
// behavior is undefined.
function assertWellFormed(cond, msg) {
  if (!cond)
    error(msg);
}

var LogManager = PDFJS.LogManager = (function LogManagerClosure() {
  var loggers = [];
  return {
    addLogger: function logManager_addLogger(logger) {
      loggers.push(logger);
    },
    notify: function(type, message) {
      for (var i = 0, ii = loggers.length; i < ii; i++) {
        var logger = loggers[i];
        if (logger[type])
          logger[type](message);
      }
    }
  };
})();

function shadow(obj, prop, value) {
  Object.defineProperty(obj, prop, { value: value,
                                     enumerable: true,
                                     configurable: true,
                                     writable: false });
  return value;
}

var PasswordException = (function PasswordExceptionClosure() {
  function PasswordException(msg, code) {
    this.name = 'PasswordException';
    this.message = msg;
    this.code = code;
  }

  PasswordException.prototype = new Error();
  PasswordException.constructor = PasswordException;

  return PasswordException;
})();

function bytesToString(bytes) {
  var str = '';
  var length = bytes.length;
  for (var n = 0; n < length; ++n)
    str += String.fromCharCode(bytes[n]);
  return str;
}

function stringToBytes(str) {
  var length = str.length;
  var bytes = new Uint8Array(length);
  for (var n = 0; n < length; ++n)
    bytes[n] = str.charCodeAt(n) & 0xFF;
  return bytes;
}

var IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];

var Util = PDFJS.Util = (function UtilClosure() {
  function Util() {}

  Util.makeCssRgb = function Util_makeCssRgb(r, g, b) {
    var ri = (255 * r) | 0, gi = (255 * g) | 0, bi = (255 * b) | 0;
    return 'rgb(' + ri + ',' + gi + ',' + bi + ')';
  };

  Util.makeCssCmyk = function Util_makeCssCmyk(c, m, y, k) {
    c = (new DeviceCmykCS()).getRgb([c, m, y, k]);
    var ri = (255 * c[0]) | 0, gi = (255 * c[1]) | 0, bi = (255 * c[2]) | 0;
    return 'rgb(' + ri + ',' + gi + ',' + bi + ')';
  };

  // For 2d affine transforms
  Util.applyTransform = function Util_applyTransform(p, m) {
    var xt = p[0] * m[0] + p[1] * m[2] + m[4];
    var yt = p[0] * m[1] + p[1] * m[3] + m[5];
    return [xt, yt];
  };

  Util.applyInverseTransform = function Util_applyInverseTransform(p, m) {
    var d = m[0] * m[3] - m[1] * m[2];
    var xt = (p[0] * m[3] - p[1] * m[2] + m[2] * m[5] - m[4] * m[3]) / d;
    var yt = (-p[0] * m[1] + p[1] * m[0] + m[4] * m[1] - m[5] * m[0]) / d;
    return [xt, yt];
  };

  Util.inverseTransform = function Util_inverseTransform(m) {
    var d = m[0] * m[3] - m[1] * m[2];
    return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d,
      (m[2] * m[5] - m[4] * m[3]) / d, (m[4] * m[1] - m[5] * m[0]) / d];
  };

  // Apply a generic 3d matrix M on a 3-vector v:
  //   | a b c |   | X |
  //   | d e f | x | Y |
  //   | g h i |   | Z |
  // M is assumed to be serialized as [a,b,c,d,e,f,g,h,i],
  // with v as [X,Y,Z]
  Util.apply3dTransform = function Util_apply3dTransform(m, v) {
    return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
      m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
      m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
    ];
  }

  // Normalize rectangle rect=[x1, y1, x2, y2] so that (x1,y1) < (x2,y2)
  // For coordinate systems whose origin lies in the bottom-left, this
  // means normalization to (BL,TR) ordering. For systems with origin in the
  // top-left, this means (TL,BR) ordering.
  Util.normalizeRect = function Util_normalizeRect(rect) {
    var r = rect.slice(0); // clone rect
    if (rect[0] > rect[2]) {
      r[0] = rect[2];
      r[2] = rect[0];
    }
    if (rect[1] > rect[3]) {
      r[1] = rect[3];
      r[3] = rect[1];
    }
    return r;
  }

  // Returns a rectangle [x1, y1, x2, y2] corresponding to the
  // intersection of rect1 and rect2. If no intersection, returns 'false'
  // The rectangle coordinates of rect1, rect2 should be [x1, y1, x2, y2]
  Util.intersect = function Util_intersect(rect1, rect2) {
    function compare(a, b) {
      return a - b;
    };

    // Order points along the axes
    var orderedX = [rect1[0], rect1[2], rect2[0], rect2[2]].sort(compare),
        orderedY = [rect1[1], rect1[3], rect2[1], rect2[3]].sort(compare),
        result = [];

    rect1 = Util.normalizeRect(rect1);
    rect2 = Util.normalizeRect(rect2);

    // X: first and second points belong to different rectangles?
    if ((orderedX[0] === rect1[0] && orderedX[1] === rect2[0]) ||
        (orderedX[0] === rect2[0] && orderedX[1] === rect1[0])) {
      // Intersection must be between second and third points
      result[0] = orderedX[1];
      result[2] = orderedX[2];
    } else {
      return false;
    }

    // Y: first and second points belong to different rectangles?
    if ((orderedY[0] === rect1[1] && orderedY[1] === rect2[1]) ||
        (orderedY[0] === rect2[1] && orderedY[1] === rect1[1])) {
      // Intersection must be between second and third points
      result[1] = orderedY[1];
      result[3] = orderedY[2];
    } else {
      return false;
    }

    return result;
  };

  Util.sign = function Util_sign(num) {
    return num < 0 ? -1 : 1;
  };

  return Util;
})();

var PageViewport = PDFJS.PageViewport = (function PageViewportClosure() {
  function PageViewport(viewBox, scale, rotate, offsetX, offsetY) {
    // creating transform to convert pdf coordinate system to the normal
    // canvas like coordinates taking in account scale and rotation
    var centerX = (viewBox[2] + viewBox[0]) / 2;
    var centerY = (viewBox[3] + viewBox[1]) / 2;
    var rotateA, rotateB, rotateC, rotateD;
    switch (rotate % 360) {
      case -180:
      case 180:
        rotateA = -1; rotateB = 0; rotateC = 0; rotateD = 1;
        break;
      case -270:
      case 90:
        rotateA = 0; rotateB = 1; rotateC = 1; rotateD = 0;
        break;
      case -90:
      case 270:
        rotateA = 0; rotateB = -1; rotateC = -1; rotateD = 0;
        break;
      case 360:
      case 0:
      default:
        rotateA = 1; rotateB = 0; rotateC = 0; rotateD = -1;
        break;
    }
    var offsetCanvasX, offsetCanvasY;
    var width, height;
    if (rotateA == 0) {
      offsetCanvasX = Math.abs(centerY - viewBox[1]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerX - viewBox[0]) * scale + offsetY;
      width = Math.abs(viewBox[3] - viewBox[1]) * scale;
      height = Math.abs(viewBox[2] - viewBox[0]) * scale;
    } else {
      offsetCanvasX = Math.abs(centerX - viewBox[0]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerY - viewBox[1]) * scale + offsetY;
      width = Math.abs(viewBox[2] - viewBox[0]) * scale;
      height = Math.abs(viewBox[3] - viewBox[1]) * scale;
    }
    // creating transform for the following operations:
    // translate(-centerX, -centerY), rotate and flip vertically,
    // scale, and translate(offsetCanvasX, offsetCanvasY)
    this.transform = [
      rotateA * scale,
      rotateB * scale,
      rotateC * scale,
      rotateD * scale,
      offsetCanvasX - rotateA * scale * centerX - rotateC * scale * centerY,
      offsetCanvasY - rotateB * scale * centerX - rotateD * scale * centerY
    ];

    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.width = width;
    this.height = height;
    this.fontScale = scale;
  }
  PageViewport.prototype = {
    convertToViewportPoint: function PageViewport_convertToViewportPoint(x, y) {
      return Util.applyTransform([x, y], this.transform);
    },
    convertToViewportRectangle:
      function PageViewport_convertToViewportRectangle(rect) {
      var tl = Util.applyTransform([rect[0], rect[1]], this.transform);
      var br = Util.applyTransform([rect[2], rect[3]], this.transform);
      return [tl[0], tl[1], br[0], br[1]];
    },
    convertToPdfPoint: function PageViewport_convertToPdfPoint(x, y) {
      return Util.applyInverseTransform([x, y], this.transform);
    }
  };
  return PageViewport;
})();

var PDFStringTranslateTable = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0x2D8, 0x2C7, 0x2C6, 0x2D9, 0x2DD, 0x2DB, 0x2DA, 0x2DC, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x2022, 0x2020, 0x2021, 0x2026, 0x2014,
  0x2013, 0x192, 0x2044, 0x2039, 0x203A, 0x2212, 0x2030, 0x201E, 0x201C,
  0x201D, 0x2018, 0x2019, 0x201A, 0x2122, 0xFB01, 0xFB02, 0x141, 0x152, 0x160,
  0x178, 0x17D, 0x131, 0x142, 0x153, 0x161, 0x17E, 0, 0x20AC
];

function stringToPDFString(str) {
  var i, n = str.length, str2 = '';
  if (str[0] === '\xFE' && str[1] === '\xFF') {
    // UTF16BE BOM
    for (i = 2; i < n; i += 2)
      str2 += String.fromCharCode(
        (str.charCodeAt(i) << 8) | str.charCodeAt(i + 1));
  } else {
    for (i = 0; i < n; ++i) {
      var code = PDFStringTranslateTable[str.charCodeAt(i)];
      str2 += code ? String.fromCharCode(code) : str.charAt(i);
    }
  }
  return str2;
}

function stringToUTF8String(str) {
  return decodeURIComponent(escape(str));
}

function isBool(v) {
  return typeof v == 'boolean';
}

function isInt(v) {
  return typeof v == 'number' && ((v | 0) == v);
}

function isNum(v) {
  return typeof v == 'number';
}

function isString(v) {
  return typeof v == 'string';
}

function isNull(v) {
  return v === null;
}

function isName(v) {
  return v instanceof Name;
}

function isCmd(v, cmd) {
  return v instanceof Cmd && (!cmd || v.cmd == cmd);
}

function isDict(v, type) {
  return v instanceof Dict && (!type || v.get('Type').name == type);
}

function isArray(v) {
  return v instanceof Array;
}

function isStream(v) {
  return typeof v == 'object' && v != null && ('getChar' in v);
}

function isArrayBuffer(v) {
  return typeof v == 'object' && v != null && ('byteLength' in v);
}

function isRef(v) {
  return v instanceof Ref;
}

function isPDFFunction(v) {
  var fnDict;
  if (typeof v != 'object')
    return false;
  else if (isDict(v))
    fnDict = v;
  else if (isStream(v))
    fnDict = v.dict;
  else
    return false;
  return fnDict.has('FunctionType');
}

/**
 * 'Promise' object.
 * Each object that is stored in PDFObjects is based on a Promise object that
 * contains the status of the object and the data. There migth be situations,
 * where a function want to use the value of an object, but it isn't ready at
 * that time. To get a notification, once the object is ready to be used, s.o.
 * can add a callback using the `then` method on the promise that then calls
 * the callback once the object gets resolved.
 * A promise can get resolved only once and only once the data of the promise
 * can be set. If any of these happens twice or the data is required before
 * it was set, an exception is throw.
 */
var Promise = PDFJS.Promise = (function PromiseClosure() {
  var EMPTY_PROMISE = {};

  /**
   * If `data` is passed in this constructor, the promise is created resolved.
   * If there isn't data, it isn't resolved at the beginning.
   */
  function Promise(name, data) {
    this.name = name;
    this.isRejected = false;
    this.error = null;
    // If you build a promise and pass in some data it's already resolved.
    if (data != null) {
      this.isResolved = true;
      this._data = data;
      this.hasData = true;
    } else {
      this.isResolved = false;
      this._data = EMPTY_PROMISE;
    }
    this.callbacks = [];
    this.errbacks = [];
    this.progressbacks = [];
  };
  /**
   * Builds a promise that is resolved when all the passed in promises are
   * resolved.
   * @param {Promise[]} promises Array of promises to wait for.
   * @return {Promise} New dependant promise.
   */
  Promise.all = function Promise_all(promises) {
    var deferred = new Promise();
    var unresolved = promises.length;
    var results = [];
    if (unresolved === 0) {
      deferred.resolve(results);
      return deferred;
    }
    for (var i = 0, ii = promises.length; i < ii; ++i) {
      var promise = promises[i];
      promise.then((function(i) {
        return function(value) {
          results[i] = value;
          unresolved--;
          if (unresolved === 0)
            deferred.resolve(results);
        };
      })(i));
    }
    return deferred;
  };
  Promise.prototype = {
    hasData: false,

    set data(value) {
      if (value === undefined) {
        return;
      }
      if (this._data !== EMPTY_PROMISE) {
        error('Promise ' + this.name +
              ': Cannot set the data of a promise twice');
      }
      this._data = value;
      this.hasData = true;

      if (this.onDataCallback) {
        this.onDataCallback(value);
      }
    },

    get data() {
      if (this._data === EMPTY_PROMISE) {
        error('Promise ' + this.name + ': Cannot get data that isn\'t set');
      }
      return this._data;
    },

    onData: function Promise_onData(callback) {
      if (this._data !== EMPTY_PROMISE) {
        callback(this._data);
      } else {
        this.onDataCallback = callback;
      }
    },

    resolve: function Promise_resolve(data) {
      if (this.isResolved) {
        error('A Promise can be resolved only once ' + this.name);
      }
      if (this.isRejected) {
        error('The Promise was already rejected ' + this.name);
      }

      this.isResolved = true;
      this.data = (typeof data !== 'undefined') ? data : null;
      var callbacks = this.callbacks;

      for (var i = 0, ii = callbacks.length; i < ii; i++) {
        callbacks[i].call(null, data);
      }
    },

    progress: function Promise_progress(data) {
      var callbacks = this.progressbacks;
      for (var i = 0, ii = callbacks.length; i < ii; i++) {
        callbacks[i].call(null, data);
      }
    },

    reject: function Promise_reject(reason, exception) {
      if (this.isRejected) {
        error('A Promise can be rejected only once ' + this.name);
      }
      if (this.isResolved) {
        error('The Promise was already resolved ' + this.name);
      }

      this.isRejected = true;
      this.error = reason || null;
      var errbacks = this.errbacks;

      for (var i = 0, ii = errbacks.length; i < ii; i++) {
        errbacks[i].call(null, reason, exception);
      }
    },

    then: function Promise_then(callback, errback, progressback) {
      if (!callback) {
        error('Requiring callback' + this.name);
      }

      // If the promise is already resolved, call the callback directly.
      if (this.isResolved) {
        var data = this.data;
        callback.call(null, data);
      } else if (this.isRejected && errback) {
        var error = this.error;
        errback.call(null, error);
      } else {
        this.callbacks.push(callback);
        if (errback)
          this.errbacks.push(errback);
      }

      if (progressback)
        this.progressbacks.push(progressback);
    }
  };

  return Promise;
})();

var StatTimer = (function StatTimerClosure() {
  function rpad(str, pad, length) {
    while (str.length < length)
      str += pad;
    return str;
  }
  function StatTimer() {
    this.started = {};
    this.times = [];
    this.enabled = true;
  }
  StatTimer.prototype = {
    time: function StatTimer_time(name) {
      if (!this.enabled)
        return;
      if (name in this.started)
        throw 'Timer is already running for ' + name;
      this.started[name] = Date.now();
    },
    timeEnd: function StatTimer_timeEnd(name) {
      if (!this.enabled)
        return;
      if (!(name in this.started))
        throw 'Timer has not been started for ' + name;
      this.times.push({
        'name': name,
        'start': this.started[name],
        'end': Date.now()
      });
      // Remove timer from started so it can be called again.
      delete this.started[name];
    },
    toString: function StatTimer_toString() {
      var times = this.times;
      var out = '';
      // Find the longest name for padding purposes.
      var longest = 0;
      for (var i = 0, ii = times.length; i < ii; ++i) {
        var name = times[i]['name'];
        if (name.length > longest)
          longest = name.length;
      }
      for (var i = 0, ii = times.length; i < ii; ++i) {
        var span = times[i];
        var duration = span.end - span.start;
        out += rpad(span['name'], ' ', longest) + ' ' + duration + 'ms\n';
      }
      return out;
    }
  };
  return StatTimer;
})();

PDFJS.createBlob = function createBlob(data, contentType) {
  if (typeof Blob === 'function')
    return new Blob([data], { type: contentType });
  // Blob builder is deprecated in FF14 and removed in FF18.
  var bb = new MozBlobBuilder();
  bb.append(data);
  return bb.getBlob(contentType);
};


/**
 * This is the main entry point for loading a PDF and interacting with it.
 * NOTE: If a URL is used to fetch the PDF data a standard XMLHttpRequest(XHR)
 * is used, which means it must follow the same origin rules that any XHR does
 * e.g. No cross domain requests without CORS.
 *
 * @param {string|TypedAray|object} source Can be an url to where a PDF is
 * located, a typed array (Uint8Array) already populated with data or
 * and parameter object with the following possible fields:
 *  - url   - The URL of the PDF.
 *  - data  - A typed array with PDF data.
 *  - httpHeaders - Basic authentication headers.
 *  - password - For decrypting password-protected PDFs.
 *
 * @return {Promise} A promise that is resolved with {PDFDocumentProxy} object.
 */
PDFJS.getDocument = function getDocument(source) {
  var workerInitializedPromise, workerReadyPromise, transport;

  if (typeof source === 'string') {
    source = { url: source };
  } else if (isArrayBuffer(source)) {
    source = { data: source };
  } else if (typeof source !== 'object') {
    error('Invalid parameter in getDocument, need either Uint8Array, ' +
          'string or a parameter object');
  }

  if (!source.url && !source.data)
    error('Invalid parameter array, need either .data or .url');

  // copy/use all keys as is except 'url' -- full path is required
  var params = {};
  for (var key in source) {
    if (key === 'url' && typeof window !== 'undefined') {
      params[key] = combineUrl(window.location.href, source[key]);
      continue;
    }
    params[key] = source[key];
  }

  workerInitializedPromise = new PDFJS.Promise();
  workerReadyPromise = new PDFJS.Promise();
  transport = new WorkerTransport(workerInitializedPromise, workerReadyPromise);
  workerInitializedPromise.then(function transportInitialized() {
    transport.fetchDocument(params);
  });
  return workerReadyPromise;
};

/**
 * Proxy to a PDFDocument in the worker thread. Also, contains commonly used
 * properties that can be read synchronously.
 */
var PDFDocumentProxy = (function PDFDocumentProxyClosure() {
  function PDFDocumentProxy(pdfInfo, transport) {
    this.pdfInfo = pdfInfo;
    this.transport = transport;
  }
  PDFDocumentProxy.prototype = {
    /**
     * @return {number} Total number of pages the PDF contains.
     */
    get numPages() {
      return this.pdfInfo.numPages;
    },
    /**
     * @return {string} A unique ID to identify a PDF. Not guaranteed to be
     * unique.
     */
    get fingerprint() {
      return this.pdfInfo.fingerprint;
    },
    /**
     * @param {number} The page number to get. The first page is 1.
     * @return {Promise} A promise that is resolved with a {PDFPageProxy}
     * object.
     */
    getPage: function PDFDocumentProxy_getPage(number) {
      return this.transport.getPage(number);
    },
    /**
     * @return {Promise} A promise that is resolved with a lookup table for
     * mapping named destinations to reference numbers.
     */
    getDestinations: function PDFDocumentProxy_getDestinations() {
      var promise = new PDFJS.Promise();
      var destinations = this.pdfInfo.destinations;
      promise.resolve(destinations);
      return promise;
    },
    /**
     * @return {Promise} A promise that is resolved with an {array} that is a
     * tree outline (if it has one) of the PDF. The tree is in the format of:
     * [
     *  {
     *   title: string,
     *   bold: boolean,
     *   italic: boolean,
     *   color: rgb array,
     *   dest: dest obj,
     *   items: array of more items like this
     *  },
     *  ...
     * ].
     */
    getOutline: function PDFDocumentProxy_getOutline() {
      var promise = new PDFJS.Promise();
      var outline = this.pdfInfo.outline;
      promise.resolve(outline);
      return promise;
    },
    /**
     * @return {Promise} A promise that is resolved with an {object} that has
     * info and metadata properties.  Info is an {object} filled with anything
     * available in the information dictionary and similarly metadata is a
     * {Metadata} object with information from the metadata section of the PDF.
     */
    getMetadata: function PDFDocumentProxy_getMetadata() {
      var promise = new PDFJS.Promise();
      var info = this.pdfInfo.info;
      var metadata = this.pdfInfo.metadata;
      promise.resolve({
        info: info,
        metadata: metadata ? new PDFJS.Metadata(metadata) : null
      });
      return promise;
    },
    isEncrypted: function PDFDocumentProxy_isEncrypted() {
      var promise = new PDFJS.Promise();
      promise.resolve(this.pdfInfo.encrypted);
      return promise;
    },
    /**
     * @return {Promise} A promise that is resolved with a TypedArray that has
     * the raw data from the PDF.
     */
    getData: function PDFDocumentProxy_getData() {
      var promise = new PDFJS.Promise();
      this.transport.getData(promise);
      return promise;
    },
    destroy: function PDFDocumentProxy_destroy() {
      this.transport.destroy();
    }
  };
  return PDFDocumentProxy;
})();

var PDFPageProxy = (function PDFPageProxyClosure() {
  function PDFPageProxy(pageInfo, transport) {
    this.pageInfo = pageInfo;
    this.transport = transport;
    this.stats = new StatTimer();
    this.stats.enabled = !!globalScope.PDFJS.enableStats;
    this.objs = transport.objs;
    this.renderInProgress = false;
  }
  PDFPageProxy.prototype = {
    /**
     * @return {number} Page number of the page. First page is 1.
     */
    get pageNumber() {
      return this.pageInfo.pageIndex + 1;
    },
    /**
     * @return {number} The number of degrees the page is rotated clockwise.
     */
    get rotate() {
      return this.pageInfo.rotate;
    },
    /**
     * @return {object} The reference that points to this page. It has 'num' and
     * 'gen' properties.
     */
    get ref() {
      return this.pageInfo.ref;
    },
    /**
     * @return {array} An array of the visible portion of the PDF page in the
     * user space units - [x1, y1, x2, y2].
     */
    get view() {
      return this.pageInfo.view;
    },
    /**
     * @param {number} scale The desired scale of the viewport.
     * @param {number} rotate Degrees to rotate the viewport. If omitted this
     * defaults to the page rotation.
     * @return {PageViewport} Contains 'width' and 'height' properties along
     * with transforms required for rendering.
     */
    getViewport: function PDFPageProxy_getViewport(scale, rotate) {
      if (arguments.length < 2)
        rotate = this.rotate;
      return new PDFJS.PageViewport(this.view, scale, rotate, 0, 0);
    },
    /**
     * @return {Promise} A promise that is resolved with an {array} of the
     * annotation objects.
     */
    getAnnotations: function PDFPageProxy_getAnnotations() {
      if (this.annotationsPromise)
        return this.annotationsPromise;

      var promise = new PDFJS.Promise();
      this.annotationsPromise = promise;
      this.transport.getAnnotations(this.pageInfo.pageIndex);
      return promise;
    },
    /**
     * Begins the process of rendering a page to the desired context.
     * @param {object} params A parameter object that supports:
     * {
     *   canvasContext(required): A 2D context of a DOM Canvas object.,
     *   textLayer(optional): An object that has beginLayout, endLayout, and
     *                        appendText functions.,
     *   continueCallback(optional): A function that will be called each time
     *                               the rendering is paused.  To continue
     *                               rendering call the function that is the
     *                               first argument to the callback.
     * }.
     * @return {Promise} A promise that is resolved when the page finishes
     * rendering.
     */
    render: function PDFPageProxy_render(params) {
      this.renderInProgress = true;

      var promise = new Promise();
      var stats = this.stats;
      stats.time('Overall');
      // If there is no displayReadyPromise yet, then the operatorList was never
      // requested before. Make the request and create the promise.
      if (!this.displayReadyPromise) {
        this.displayReadyPromise = new Promise();
        this.destroyed = false;

        this.stats.time('Page Request');
        this.transport.messageHandler.send('RenderPageRequest', {
          pageIndex: this.pageNumber - 1
        });
      }

      var self = this;
      function complete(error) {
        self.renderInProgress = false;
        if (self.destroyed) {
          delete self.operatorList;
          delete self.displayReadyPromise;
        }

        if (error)
          promise.reject(error);
        else
          promise.resolve();
      };
      var continueCallback = params.continueCallback;

      // Once the operatorList and fonts are loaded, do the actual rendering.
      this.displayReadyPromise.then(
        function pageDisplayReadyPromise() {
          if (self.destroyed) {
            complete();
            return;
          }

          var gfx = new CanvasGraphics(params.canvasContext,
            this.objs, params.textLayer);
          try {
            this.display(gfx, params.viewport, complete, continueCallback);
          } catch (e) {
            complete(e);
          }
        }.bind(this),
        function pageDisplayReadPromiseError(reason) {
          complete(reason);
        }
      );

      return promise;
    },
    /**
     * For internal use only.
     */
    startRenderingFromOperatorList:
      function PDFPageProxy_startRenderingFromOperatorList(operatorList,
                                                           fonts) {
      var self = this;
      this.operatorList = operatorList;

      var displayContinuation = function pageDisplayContinuation() {
        // Always defer call to display() to work around bug in
        // Firefox error reporting from XHR callbacks.
        setTimeout(function pageSetTimeout() {
          self.displayReadyPromise.resolve();
        });
      };

      this.ensureFonts(fonts,
        function pageStartRenderingFromOperatorListEnsureFonts() {
          displayContinuation();
        }
      );
    },
    /**
     * For internal use only.
     */
    ensureFonts: function PDFPageProxy_ensureFonts(fonts, callback) {
      this.stats.time('Font Loading');
      // Convert the font names to the corresponding font obj.
      var fontObjs = [];
      for (var i = 0, ii = fonts.length; i < ii; i++) {
        var obj = this.objs.objs[fonts[i]].data;
        if (obj.error) {
          warn('Error during font loading: ' + obj.error);
          continue;
        }
        fontObjs.push(obj);
      }

      // Load all the fonts
      FontLoader.bind(
        fontObjs,
        function pageEnsureFontsFontObjs(fontObjs) {
          this.stats.timeEnd('Font Loading');

          callback.call(this);
        }.bind(this)
      );
    },
    /**
     * For internal use only.
     */
    display: function PDFPageProxy_display(gfx, viewport, callback,
                                           continueCallback) {
      var stats = this.stats;
      stats.time('Rendering');

      gfx.beginDrawing(viewport);

      var startIdx = 0;
      var length = this.operatorList.fnArray.length;
      var operatorList = this.operatorList;
      var stepper = null;
      if (PDFJS.pdfBug && 'StepperManager' in globalScope &&
          globalScope['StepperManager'].enabled) {
        stepper = globalScope['StepperManager'].create(this.pageNumber - 1);
        stepper.init(operatorList);
        stepper.nextBreakPoint = stepper.getNextBreakPoint();
      }

      var continueWrapper;
      if (continueCallback)
        continueWrapper = function() { continueCallback(next); }
      else
        continueWrapper = next;

      var self = this;
      function next() {
        startIdx = gfx.executeOperatorList(operatorList, startIdx,
                                           continueWrapper, stepper);
        if (startIdx == length) {
          gfx.endDrawing();
          stats.timeEnd('Rendering');
          stats.timeEnd('Overall');
          if (callback) callback();
        }
      }
      continueWrapper();
    },
    /**
     * @return {Promise} That is resolved with the a {string} that is the text
     * content from the page.
     */
    getTextContent: function PDFPageProxy_getTextContent() {
      var promise = new PDFJS.Promise();
      this.transport.messageHandler.send('GetTextContent', {
          pageIndex: this.pageNumber - 1
        },
        function textContentCallback(textContent) {
          promise.resolve(textContent);
        }
      );
      return promise;
    },
    /**
     * Stub for future feature.
     */
    getOperationList: function PDFPageProxy_getOperationList() {
      var promise = new PDFJS.Promise();
      var operationList = { // not implemented
        dependencyFontsID: null,
        operatorList: null
      };
      promise.resolve(operationList);
      return promise;
    },
    /**
     * Destroys resources allocated by the page.
     */
    destroy: function PDFPageProxy_destroy() {
      this.destroyed = true;

      if (!this.renderInProgress) {
        delete this.operatorList;
        delete this.displayReadyPromise;
      }
    }
  };
  return PDFPageProxy;
})();
/**
 * For internal use only.
 */
var WorkerTransport = (function WorkerTransportClosure() {
  function WorkerTransport(workerInitializedPromise, workerReadyPromise) {
    this.workerReadyPromise = workerReadyPromise;
    this.objs = new PDFObjects();

    this.pageCache = [];
    this.pagePromises = [];
    this.fontsLoading = {};

    // If worker support isn't disabled explicit and the browser has worker
    // support, create a new web worker and test if it/the browser fullfills
    // all requirements to run parts of pdf.js in a web worker.
    // Right now, the requirement is, that an Uint8Array is still an Uint8Array
    // as it arrives on the worker. Chrome added this with version 15.
    if (!globalScope.PDFJS.disableWorker && typeof Worker !== 'undefined') {
      var workerSrc = PDFJS.workerSrc;
      if (typeof workerSrc === 'undefined') {
        error('No PDFJS.workerSrc specified');
      }

      try {
        var worker;
//#if !(FIREFOX || MOZCENTRAL)
        // Some versions of FF can't create a worker on localhost, see:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=683280
        worker = new Worker(workerSrc);
//#else
//      // The firefox extension can't load the worker from the resource://
//      // url so we have to inline the script and then use the blob loader.
//      var script = document.querySelector('#PDFJS_SCRIPT_TAG');
//      var blob = PDFJS.createBlob(script.textContent, script.type);
//      var blobUrl = window.URL.createObjectURL(blob);
//      worker = new Worker(blobUrl);
//#endif
        var messageHandler = new MessageHandler('main', worker);
        this.messageHandler = messageHandler;

        messageHandler.on('test', function transportTest(supportTypedArray) {
          if (supportTypedArray) {
            this.worker = worker;
            this.setupMessageHandler(messageHandler);
          } else {
            globalScope.PDFJS.disableWorker = true;
            this.setupFakeWorker();
          }
          workerInitializedPromise.resolve();
        }.bind(this));

        var testObj = new Uint8Array(1);
        // Some versions of Opera throw a DATA_CLONE_ERR on
        // serializing the typed array.
        messageHandler.send('test', testObj);
        return;
      } catch (e) {
        info('The worker has been disabled.');
      }
    }
    // Either workers are disabled, not supported or have thrown an exception.
    // Thus, we fallback to a faked worker.
    globalScope.PDFJS.disableWorker = true;
    this.setupFakeWorker();
    workerInitializedPromise.resolve();
  }
  WorkerTransport.prototype = {
    destroy: function WorkerTransport_destroy() {
      if (this.worker)
        this.worker.terminate();

      this.pageCache = [];
      this.pagePromises = [];
    },
    setupFakeWorker: function WorkerTransport_setupFakeWorker() {
      warn('Setting up fake worker.');
      // If we don't use a worker, just post/sendMessage to the main thread.
      var fakeWorker = {
        postMessage: function WorkerTransport_postMessage(obj) {
          fakeWorker.onmessage({data: obj});
        },
        terminate: function WorkerTransport_terminate() {}
      };

      var messageHandler = new MessageHandler('main', fakeWorker);
      this.setupMessageHandler(messageHandler);

      // If the main thread is our worker, setup the handling for the messages
      // the main thread sends to it self.
      WorkerMessageHandler.setup(messageHandler);
    },

    setupMessageHandler:
      function WorkerTransport_setupMessageHandler(messageHandler) {
      this.messageHandler = messageHandler;

      messageHandler.on('GetDoc', function transportDoc(data) {
        var pdfInfo = data.pdfInfo;
        var pdfDocument = new PDFDocumentProxy(pdfInfo, this);
        this.pdfDocument = pdfDocument;
        this.workerReadyPromise.resolve(pdfDocument);
      }, this);

      messageHandler.on('NeedPassword', function transportPassword(data) {
        this.workerReadyPromise.reject(data.exception.message, data.exception);
      }, this);

      messageHandler.on('IncorrectPassword', function transportBadPass(data) {
        this.workerReadyPromise.reject(data.exception.message, data.exception);
      }, this);

      messageHandler.on('GetPage', function transportPage(data) {
        var pageInfo = data.pageInfo;
        var page = new PDFPageProxy(pageInfo, this);
        this.pageCache[pageInfo.pageIndex] = page;
        var promise = this.pagePromises[pageInfo.pageIndex];
        promise.resolve(page);
      }, this);

      messageHandler.on('GetAnnotations', function transportAnnotations(data) {
        var annotations = data.annotations;
        var promise = this.pageCache[data.pageIndex].annotationsPromise;
        promise.resolve(annotations);
      }, this);

      messageHandler.on('RenderPage', function transportRender(data) {
        var page = this.pageCache[data.pageIndex];
        var depFonts = data.depFonts;

        page.stats.timeEnd('Page Request');
        page.startRenderingFromOperatorList(data.operatorList, depFonts);
      }, this);

      messageHandler.on('obj', function transportObj(data) {
        var id = data[0];
        var type = data[1];
        if (this.objs.hasData(id))
          return;

        switch (type) {
          case 'JpegStream':
            var imageData = data[2];
            loadJpegStream(id, imageData, this.objs);
            break;
          case 'Image':
            var imageData = data[2];
            this.objs.resolve(id, imageData);
            break;
          case 'Font':
            var exportedData = data[2];

            // At this point, only the font object is created but the font is
            // not yet attached to the DOM. This is done in `FontLoader.bind`.
            var font;
            if ('error' in exportedData)
              font = new ErrorFont(exportedData.error);
            else
              font = new Font(exportedData);
            this.objs.resolve(id, font);
            break;
          default:
            error('Got unkown object type ' + type);
        }
      }, this);

      messageHandler.on('DocProgress', function transportDocProgress(data) {
        this.workerReadyPromise.progress({
          loaded: data.loaded,
          total: data.total
        });
      }, this);

      messageHandler.on('DocError', function transportDocError(data) {
        this.workerReadyPromise.reject(data);
      }, this);

      messageHandler.on('PageError', function transportError(data) {
        var page = this.pageCache[data.pageNum - 1];
        if (page.displayReadyPromise)
          page.displayReadyPromise.reject(data.error);
        else
          error(data.error);
      }, this);

      messageHandler.on('JpegDecode', function(data, promise) {
        var imageData = data[0];
        var components = data[1];
        if (components != 3 && components != 1)
          error('Only 3 component or 1 component can be returned');

        var img = new Image();
        img.onload = (function messageHandler_onloadClosure() {
          var width = img.width;
          var height = img.height;
          var size = width * height;
          var rgbaLength = size * 4;
          var buf = new Uint8Array(size * components);
          var tmpCanvas = createScratchCanvas(width, height);
          var tmpCtx = tmpCanvas.getContext('2d');
          tmpCtx.drawImage(img, 0, 0);
          var data = tmpCtx.getImageData(0, 0, width, height).data;

          if (components == 3) {
            for (var i = 0, j = 0; i < rgbaLength; i += 4, j += 3) {
              buf[j] = data[i];
              buf[j + 1] = data[i + 1];
              buf[j + 2] = data[i + 2];
            }
          } else if (components == 1) {
            for (var i = 0, j = 0; i < rgbaLength; i += 4, j++) {
              buf[j] = data[i];
            }
          }
          promise.resolve({ data: buf, width: width, height: height});
        }).bind(this);
        var src = 'data:image/jpeg;base64,' + window.btoa(imageData);
        img.src = src;
      });
    },

    fetchDocument: function WorkerTransport_fetchDocument(source) {
      this.messageHandler.send('GetDocRequest', {source: source});
    },

    getData: function WorkerTransport_getData(promise) {
      this.messageHandler.send('GetData', null, function(data) {
        promise.resolve(data);
      });
    },

    getPage: function WorkerTransport_getPage(pageNumber, promise) {
      var pageIndex = pageNumber - 1;
      if (pageIndex in this.pagePromises)
        return this.pagePromises[pageIndex];
      var promise = new PDFJS.Promise('Page ' + pageNumber);
      this.pagePromises[pageIndex] = promise;
      this.messageHandler.send('GetPageRequest', { pageIndex: pageIndex });
      return promise;
    },

    getAnnotations: function WorkerTransport_getAnnotations(pageIndex) {
      this.messageHandler.send('GetAnnotationsRequest',
        { pageIndex: pageIndex });
    }
  };
  return WorkerTransport;

})();


// <canvas> contexts store most of the state we need natively.
// However, PDF needs a bit more state, which we store here.

var TextRenderingMode = {
  FILL: 0,
  STROKE: 1,
  FILL_STROKE: 2,
  INVISIBLE: 3,
  FILL_ADD_TO_PATH: 4,
  STROKE_ADD_TO_PATH: 5,
  FILL_STROKE_ADD_TO_PATH: 6,
  ADD_TO_PATH: 7,
  ADD_TO_PATH_FLAG: 4
};

// Minimal font size that would be used during canvas fillText operations.
var MIN_FONT_SIZE = 1;

function createScratchCanvas(width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function addContextCurrentTransform(ctx) {
  // If the context doesn't expose a `mozCurrentTransform`, add a JS based on.
  if (!ctx.mozCurrentTransform) {
    // Store the original context
    ctx._originalSave = ctx.save;
    ctx._originalRestore = ctx.restore;
    ctx._originalRotate = ctx.rotate;
    ctx._originalScale = ctx.scale;
    ctx._originalTranslate = ctx.translate;
    ctx._originalTransform = ctx.transform;

    ctx._transformMatrix = [1, 0, 0, 1, 0, 0];
    ctx._transformStack = [];

    Object.defineProperty(ctx, 'mozCurrentTransform', {
      get: function getCurrentTransform() {
        return this._transformMatrix;
      }
    });

    Object.defineProperty(ctx, 'mozCurrentTransformInverse', {
      get: function getCurrentTransformInverse() {
        // Calculation done using WolframAlpha:
        // http://www.wolframalpha.com/input/?
        //   i=Inverse+{{a%2C+c%2C+e}%2C+{b%2C+d%2C+f}%2C+{0%2C+0%2C+1}}

        var m = this._transformMatrix;
        var a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5];

        var ad_bc = a * d - b * c;
        var bc_ad = b * c - a * d;

        return [
          d / ad_bc,
          b / bc_ad,
          c / bc_ad,
          a / ad_bc,
          (d * e - c * f) / bc_ad,
          (b * e - a * f) / ad_bc
        ];
      }
    });

    ctx.save = function ctxSave() {
      var old = this._transformMatrix;
      this._transformStack.push(old);
      this._transformMatrix = old.slice(0, 6);

      this._originalSave();
    };

    ctx.restore = function ctxRestore() {
      var prev = this._transformStack.pop();
      if (prev) {
        this._transformMatrix = prev;
        this._originalRestore();
      }
    };

    ctx.translate = function ctxTranslate(x, y) {
      var m = this._transformMatrix;
      m[4] = m[0] * x + m[2] * y + m[4];
      m[5] = m[1] * x + m[3] * y + m[5];

      this._originalTranslate(x, y);
    };

    ctx.scale = function ctxScale(x, y) {
      var m = this._transformMatrix;
      m[0] = m[0] * x;
      m[1] = m[1] * x;
      m[2] = m[2] * y;
      m[3] = m[3] * y;

      this._originalScale(x, y);
    };

    ctx.transform = function ctxTransform(a, b, c, d, e, f) {
      var m = this._transformMatrix;
      this._transformMatrix = [
        m[0] * a + m[2] * b,
        m[1] * a + m[3] * b,
        m[0] * c + m[2] * d,
        m[1] * c + m[3] * d,
        m[0] * e + m[2] * f + m[4],
        m[1] * e + m[3] * f + m[5]
      ];

      ctx._originalTransform(a, b, c, d, e, f);
    };

    ctx.rotate = function ctxRotate(angle) {
      var cosValue = Math.cos(angle);
      var sinValue = Math.sin(angle);

      var m = this._transformMatrix;
      this._transformMatrix = [
        m[0] * cosValue + m[2] * sinValue,
        m[1] * cosValue + m[3] * sinValue,
        m[0] * (-sinValue) + m[2] * cosValue,
        m[1] * (-sinValue) + m[3] * cosValue,
        m[4],
        m[5]
      ];

      this._originalRotate(angle);
    };
  }
}

var CanvasExtraState = (function CanvasExtraStateClosure() {
  function CanvasExtraState(old) {
    // Are soft masks and alpha values shapes or opacities?
    this.alphaIsShape = false;
    this.fontSize = 0;
    this.fontSizeScale = 1;
    this.textMatrix = IDENTITY_MATRIX;
    this.fontMatrix = IDENTITY_MATRIX;
    this.leading = 0;
    // Current point (in user coordinates)
    this.x = 0;
    this.y = 0;
    // Start of text line (in text coordinates)
    this.lineX = 0;
    this.lineY = 0;
    // Character and word spacing
    this.charSpacing = 0;
    this.wordSpacing = 0;
    this.textHScale = 1;
    this.textRenderingMode = TextRenderingMode.FILL;
    this.textRise = 0;
    // Color spaces
    this.fillColorSpace = new DeviceGrayCS();
    this.fillColorSpaceObj = null;
    this.strokeColorSpace = new DeviceGrayCS();
    this.strokeColorSpaceObj = null;
    this.fillColorObj = null;
    this.strokeColorObj = null;
    // Default fore and background colors
    this.fillColor = '#000000';
    this.strokeColor = '#000000';
    // Note: fill alpha applies to all non-stroking operations
    this.fillAlpha = 1;
    this.strokeAlpha = 1;
    this.lineWidth = 1;

    this.old = old;
  }

  CanvasExtraState.prototype = {
    clone: function CanvasExtraState_clone() {
      return Object.create(this);
    },
    setCurrentPoint: function CanvasExtraState_setCurrentPoint(x, y) {
      this.x = x;
      this.y = y;
    }
  };
  return CanvasExtraState;
})();

var CanvasGraphics = (function CanvasGraphicsClosure() {
  // Defines the time the executeOperatorList is going to be executing
  // before it stops and shedules a continue of execution.
  var kExecutionTime = 15;

  function CanvasGraphics(canvasCtx, objs, textLayer) {
    this.ctx = canvasCtx;
    this.current = new CanvasExtraState();
    this.stateStack = [];
    this.pendingClip = null;
    this.res = null;
    this.xobjs = null;
    this.objs = objs;
    this.textLayer = textLayer;
    if (canvasCtx) {
      addContextCurrentTransform(canvasCtx);
    }
  }

  var LINE_CAP_STYLES = ['butt', 'round', 'square'];
  var LINE_JOIN_STYLES = ['miter', 'round', 'bevel'];
  var NORMAL_CLIP = {};
  var EO_CLIP = {};

  CanvasGraphics.prototype = {
    slowCommands: {
      'stroke': true,
      'closeStroke': true,
      'fill': true,
      'eoFill': true,
      'fillStroke': true,
      'eoFillStroke': true,
      'closeFillStroke': true,
      'closeEOFillStroke': true,
      'showText': true,
      'showSpacedText': true,
      'setStrokeColorSpace': true,
      'setFillColorSpace': true,
      'setStrokeColor': true,
      'setStrokeColorN': true,
      'setFillColor': true,
      'setFillColorN': true,
      'setStrokeGray': true,
      'setFillGray': true,
      'setStrokeRGBColor': true,
      'setFillRGBColor': true,
      'setStrokeCMYKColor': true,
      'setFillCMYKColor': true,
      'paintJpegXObject': true,
      'paintImageXObject': true,
      'paintImageMaskXObject': true,
      'shadingFill': true
    },

    beginDrawing: function CanvasGraphics_beginDrawing(viewport) {
      var transform = viewport.transform;
      this.ctx.save();
      this.ctx.transform.apply(this.ctx, transform);

      if (this.textLayer)
        this.textLayer.beginLayout();
    },

    executeOperatorList: function CanvasGraphics_executeOperatorList(
                                    operatorList,
                                    executionStartIdx, continueCallback,
                                    stepper) {
      var argsArray = operatorList.argsArray;
      var fnArray = operatorList.fnArray;
      var i = executionStartIdx || 0;
      var argsArrayLen = argsArray.length;

      // Sometimes the OperatorList to execute is empty.
      if (argsArrayLen == i) {
        return i;
      }

      var executionEndIdx;
      var endTime = Date.now() + kExecutionTime;

      var objs = this.objs;
      var fnName;
      var slowCommands = this.slowCommands;

      while (true) {
        if (stepper && i === stepper.nextBreakPoint) {
          stepper.breakIt(i, continueCallback);
          return i;
        }

        fnName = fnArray[i];

        if (fnName !== 'dependency') {
          this[fnName].apply(this, argsArray[i]);
        } else {
          var deps = argsArray[i];
          for (var n = 0, nn = deps.length; n < nn; n++) {
            var depObjId = deps[n];

            // If the promise isn't resolved yet, add the continueCallback
            // to the promise and bail out.
            if (!objs.isResolved(depObjId)) {
              objs.get(depObjId, continueCallback);
              return i;
            }
          }
        }

        i++;

        // If the entire operatorList was executed, stop as were done.
        if (i == argsArrayLen) {
          return i;
        }

        // If the execution took longer then a certain amount of time, shedule
        // to continue exeution after a short delay.
        // However, this is only possible if a 'continueCallback' is passed in.
        if (continueCallback && slowCommands[fnName] && Date.now() > endTime) {
          setTimeout(continueCallback, 0);
          return i;
        }

        // If the operatorList isn't executed completely yet OR the execution
        // time was short enough, do another execution round.
      }
    },

    endDrawing: function CanvasGraphics_endDrawing() {
      this.ctx.restore();

      if (this.textLayer)
        this.textLayer.endLayout();
    },

    // Graphics state
    setLineWidth: function CanvasGraphics_setLineWidth(width) {
      this.current.lineWidth = width;
      this.ctx.lineWidth = width;
    },
    setLineCap: function CanvasGraphics_setLineCap(style) {
      this.ctx.lineCap = LINE_CAP_STYLES[style];
    },
    setLineJoin: function CanvasGraphics_setLineJoin(style) {
      this.ctx.lineJoin = LINE_JOIN_STYLES[style];
    },
    setMiterLimit: function CanvasGraphics_setMiterLimit(limit) {
      this.ctx.miterLimit = limit;
    },
    setDash: function CanvasGraphics_setDash(dashArray, dashPhase) {
      this.ctx.mozDash = dashArray;
      this.ctx.mozDashOffset = dashPhase;
      this.ctx.webkitLineDash = dashArray;
      this.ctx.webkitLineDashOffset = dashPhase;
    },
    setRenderingIntent: function CanvasGraphics_setRenderingIntent(intent) {
      // Maybe if we one day fully support color spaces this will be important
      // for now we can ignore.
      // TODO set rendering intent?
    },
    setFlatness: function CanvasGraphics_setFlatness(flatness) {
      // There's no way to control this with canvas, but we can safely ignore.
      // TODO set flatness?
    },
    setGState: function CanvasGraphics_setGState(states) {
      for (var i = 0, ii = states.length; i < ii; i++) {
        var state = states[i];
        var key = state[0];
        var value = state[1];

        switch (key) {
          case 'LW':
            this.setLineWidth(value);
            break;
          case 'LC':
            this.setLineCap(value);
            break;
          case 'LJ':
            this.setLineJoin(value);
            break;
          case 'ML':
            this.setMiterLimit(value);
            break;
          case 'D':
            this.setDash(value[0], value[1]);
            break;
          case 'RI':
            this.setRenderingIntent(value);
            break;
          case 'FL':
            this.setFlatness(value);
            break;
          case 'Font':
            this.setFont(state[1], state[2]);
            break;
          case 'CA':
            this.current.strokeAlpha = state[1];
            break;
          case 'ca':
            this.current.fillAlpha = state[1];
            this.ctx.globalAlpha = state[1];
            break;
        }
      }
    },
    save: function CanvasGraphics_save() {
      this.ctx.save();
      var old = this.current;
      this.stateStack.push(old);
      this.current = old.clone();
    },
    restore: function CanvasGraphics_restore() {
      if ('textClipLayers' in this) {
        this.completeTextClipping();
      }

      var prev = this.stateStack.pop();
      if (prev) {
        this.current = prev;
        this.ctx.restore();
      }
    },
    transform: function CanvasGraphics_transform(a, b, c, d, e, f) {
      this.ctx.transform(a, b, c, d, e, f);
    },

    // Path
    moveTo: function CanvasGraphics_moveTo(x, y) {
      this.ctx.moveTo(x, y);
      this.current.setCurrentPoint(x, y);
    },
    lineTo: function CanvasGraphics_lineTo(x, y) {
      this.ctx.lineTo(x, y);
      this.current.setCurrentPoint(x, y);
    },
    curveTo: function CanvasGraphics_curveTo(x1, y1, x2, y2, x3, y3) {
      this.ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      this.current.setCurrentPoint(x3, y3);
    },
    curveTo2: function CanvasGraphics_curveTo2(x2, y2, x3, y3) {
      var current = this.current;
      this.ctx.bezierCurveTo(current.x, current.y, x2, y2, x3, y3);
      current.setCurrentPoint(x3, y3);
    },
    curveTo3: function CanvasGraphics_curveTo3(x1, y1, x3, y3) {
      this.curveTo(x1, y1, x3, y3, x3, y3);
      this.current.setCurrentPoint(x3, y3);
    },
    closePath: function CanvasGraphics_closePath() {
      this.ctx.closePath();
    },
    rectangle: function CanvasGraphics_rectangle(x, y, width, height) {
      this.ctx.rect(x, y, width, height);
    },
    stroke: function CanvasGraphics_stroke(consumePath) {
      consumePath = typeof consumePath !== 'undefined' ? consumePath : true;
      var ctx = this.ctx;
      var strokeColor = this.current.strokeColor;
      if (this.current.lineWidth === 0)
        ctx.lineWidth = this.getSinglePixelWidth();
      // For stroke we want to temporarily change the global alpha to the
      // stroking alpha.
      ctx.globalAlpha = this.current.strokeAlpha;
      if (strokeColor && strokeColor.hasOwnProperty('type') &&
          strokeColor.type === 'Pattern') {
        // for patterns, we transform to pattern space, calculate
        // the pattern, call stroke, and restore to user space
        ctx.save();
        ctx.strokeStyle = strokeColor.getPattern(ctx);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.stroke();
      }
      if (consumePath)
        this.consumePath();
      // Restore the global alpha to the fill alpha
      ctx.globalAlpha = this.current.fillAlpha;
    },
    closeStroke: function CanvasGraphics_closeStroke() {
      this.closePath();
      this.stroke();
    },
    fill: function CanvasGraphics_fill(consumePath) {
      consumePath = typeof consumePath !== 'undefined' ? consumePath : true;
      var ctx = this.ctx;
      var fillColor = this.current.fillColor;

      if (fillColor && fillColor.hasOwnProperty('type') &&
          fillColor.type === 'Pattern') {
        ctx.save();
        ctx.fillStyle = fillColor.getPattern(ctx);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fill();
      }
      if (consumePath)
        this.consumePath();
    },
    eoFill: function CanvasGraphics_eoFill() {
      var savedFillRule = this.setEOFillRule();
      this.fill();
      this.restoreFillRule(savedFillRule);
    },
    fillStroke: function CanvasGraphics_fillStroke() {
      this.fill(false);
      this.stroke(false);

      this.consumePath();
    },
    eoFillStroke: function CanvasGraphics_eoFillStroke() {
      var savedFillRule = this.setEOFillRule();
      this.fillStroke();
      this.restoreFillRule(savedFillRule);
    },
    closeFillStroke: function CanvasGraphics_closeFillStroke() {
      this.closePath();
      this.fillStroke();
    },
    closeEOFillStroke: function CanvasGraphics_closeEOFillStroke() {
      var savedFillRule = this.setEOFillRule();
      this.closePath();
      this.fillStroke();
      this.restoreFillRule(savedFillRule);
    },
    endPath: function CanvasGraphics_endPath() {
      this.consumePath();
    },

    // Clipping
    clip: function CanvasGraphics_clip() {
      this.pendingClip = NORMAL_CLIP;
    },
    eoClip: function CanvasGraphics_eoClip() {
      this.pendingClip = EO_CLIP;
    },

    // Text
    beginText: function CanvasGraphics_beginText() {
      this.current.textMatrix = IDENTITY_MATRIX;
      this.current.x = this.current.lineX = 0;
      this.current.y = this.current.lineY = 0;
    },
    endText: function CanvasGraphics_endText() {
      if ('textClipLayers' in this) {
        this.swapImageForTextClipping();
      }
    },
    getCurrentTextClipping: function CanvasGraphics_getCurrentTextClipping() {
      var ctx = this.ctx;
      var transform = ctx.mozCurrentTransform;
      if ('textClipLayers' in this) {
        // we need to reset only font and transform
        var maskCtx = this.textClipLayers.maskCtx;
        maskCtx.setTransform.apply(maskCtx, transform);
        maskCtx.font = ctx.font;
        return maskCtx;
      }

      var canvasWidth = ctx.canvas.width;
      var canvasHeight = ctx.canvas.height;
      // keeping track of the text clipping of the separate canvas
      var maskCanvas = createScratchCanvas(canvasWidth, canvasHeight);
      var maskCtx = maskCanvas.getContext('2d');
      maskCtx.setTransform.apply(maskCtx, transform);
      maskCtx.font = ctx.font;
      var textClipLayers = {
        maskCanvas: maskCanvas,
        maskCtx: maskCtx
      };
      this.textClipLayers = textClipLayers;
      return maskCtx;
    },
    swapImageForTextClipping:
      function CanvasGraphics_swapImageForTextClipping() {
      var ctx = this.ctx;
      var canvasWidth = ctx.canvas.width;
      var canvasHeight = ctx.canvas.height;
      // saving current image content and clearing whole canvas
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      var data = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      this.textClipLayers.imageData = data;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    },
    completeTextClipping: function CanvasGraphics_completeTextClipping() {
      var ctx = this.ctx;
      // applying mask to the image (result is saved in maskCanvas)
      var maskCtx = this.textClipLayers.maskCtx;
      maskCtx.setTransform(1, 0, 0, 1, 0, 0);
      maskCtx.globalCompositeOperation = 'source-in';
      maskCtx.drawImage(ctx.canvas, 0, 0);

      // restoring image data and applying the result of masked drawing
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(this.textClipLayers.imageData, 0, 0);
      ctx.drawImage(this.textClipLayers.maskCanvas, 0, 0);
      ctx.restore();

      delete this.textClipLayers;
    },
    setCharSpacing: function CanvasGraphics_setCharSpacing(spacing) {
      this.current.charSpacing = spacing;
    },
    setWordSpacing: function CanvasGraphics_setWordSpacing(spacing) {
      this.current.wordSpacing = spacing;
    },
    setHScale: function CanvasGraphics_setHScale(scale) {
      this.current.textHScale = scale / 100;
    },
    setLeading: function CanvasGraphics_setLeading(leading) {
      this.current.leading = -leading;
    },
    setFont: function CanvasGraphics_setFont(fontRefName, size) {
      var fontObj = this.objs.get(fontRefName);
      var current = this.current;

      if (!fontObj)
        error('Can\'t find font for ' + fontRefName);

      // Slice-clone matrix so we can manipulate it without affecting original
      if (fontObj.fontMatrix)
        current.fontMatrix = fontObj.fontMatrix.slice(0);
      else
        current.fontMatrix = IDENTITY_MATRIX.slice(0);

      // A valid matrix needs all main diagonal elements to be non-zero
      // This also ensures we bypass FF bugzilla bug #719844.
      if (current.fontMatrix[0] === 0 ||
          current.fontMatrix[3] === 0) {
        warn('Invalid font matrix for font ' + fontRefName);
      }

      // The spec for Tf (setFont) says that 'size' specifies the font 'scale',
      // and in some docs this can be negative (inverted x-y axes).
      // We implement this condition with fontMatrix.
      if (size < 0) {
        size = -size;
        current.fontMatrix[0] *= -1;
        current.fontMatrix[3] *= -1;
      }

      this.current.font = fontObj;
      this.current.fontSize = size;

      if (fontObj.coded)
        return; // we don't need ctx.font for Type3 fonts

      var name = fontObj.loadedName || 'sans-serif';
      var bold = fontObj.black ? (fontObj.bold ? 'bolder' : 'bold') :
                                 (fontObj.bold ? 'bold' : 'normal');

      var italic = fontObj.italic ? 'italic' : 'normal';
      var typeface = '"' + name + '", ' + fontObj.fallbackName;

      // Some font backends cannot handle fonts below certain size.
      // Keeping the font at minimal size and using the fontSizeScale to change
      // the current transformation matrix before the fillText/strokeText.
      // See https://bugzilla.mozilla.org/show_bug.cgi?id=726227
      var browserFontSize = size >= MIN_FONT_SIZE ? size : MIN_FONT_SIZE;
      this.current.fontSizeScale = browserFontSize != MIN_FONT_SIZE ? 1.0 :
                                   size / MIN_FONT_SIZE;

      var rule = italic + ' ' + bold + ' ' + browserFontSize + 'px ' + typeface;
      this.ctx.font = rule;
    },
    setTextRenderingMode: function CanvasGraphics_setTextRenderingMode(mode) {
      this.current.textRenderingMode = mode;
    },
    setTextRise: function CanvasGraphics_setTextRise(rise) {
      this.current.textRise = rise;
    },
    moveText: function CanvasGraphics_moveText(x, y) {
      this.current.x = this.current.lineX += x;
      this.current.y = this.current.lineY += y;
    },
    setLeadingMoveText: function CanvasGraphics_setLeadingMoveText(x, y) {
      this.setLeading(-y);
      this.moveText(x, y);
    },
    setTextMatrix: function CanvasGraphics_setTextMatrix(a, b, c, d, e, f) {
      this.current.textMatrix = [a, b, c, d, e, f];

      this.current.x = this.current.lineX = 0;
      this.current.y = this.current.lineY = 0;
    },
    nextLine: function CanvasGraphics_nextLine() {
      this.moveText(0, this.current.leading);
    },
    applyTextTransforms: function CanvasGraphics_applyTextTransforms() {
      var ctx = this.ctx;
      var current = this.current;
      var textHScale = current.textHScale;
      var fontMatrix = current.fontMatrix || IDENTITY_MATRIX;

      ctx.transform.apply(ctx, current.textMatrix);
      ctx.scale(1, -1);
      ctx.translate(current.x, -current.y - current.textRise);
      ctx.transform.apply(ctx, fontMatrix);
      ctx.scale(textHScale, 1);
    },
    createTextGeometry: function CanvasGraphics_createTextGeometry() {
      var geometry = {};
      var ctx = this.ctx;
      var font = this.current.font;
      var ctxMatrix = ctx.mozCurrentTransform;
      if (ctxMatrix) {
        var bl = Util.applyTransform([0, 0], ctxMatrix);
        var tr = Util.applyTransform([1, 1], ctxMatrix);
        geometry.x = bl[0];
        geometry.y = bl[1];
        geometry.hScale = tr[0] - bl[0];
        geometry.vScale = tr[1] - bl[1];
      }
      geometry.spaceWidth = font.spaceWidth;
      geometry.fontName = font.loadedName;
      geometry.fontFamily = font.fallbackName;
      geometry.fontSize = this.current.fontSize;
      return geometry;
    },

    showText: function CanvasGraphics_showText(str, skipTextSelection) {
      var ctx = this.ctx;
      var current = this.current;
      var font = current.font;
      var glyphs = font.charsToGlyphs(str);
      var fontSize = current.fontSize;
      var fontSizeScale = current.fontSizeScale;
      var charSpacing = current.charSpacing;
      var wordSpacing = current.wordSpacing;
      var textHScale = current.textHScale;
      var fontMatrix = current.fontMatrix || IDENTITY_MATRIX;
      var textHScale2 = textHScale * fontMatrix[0];
      var glyphsLength = glyphs.length;
      var textLayer = this.textLayer;
      var geom;
      var textSelection = textLayer && !skipTextSelection ? true : false;
      var textRenderingMode = current.textRenderingMode;
      var canvasWidth = 0.0;

      // Type3 fonts - each glyph is a "mini-PDF"
      if (font.coded) {
        ctx.save();
        ctx.transform.apply(ctx, current.textMatrix);
        ctx.translate(current.x, current.y);

        ctx.scale(textHScale, 1);

        if (textSelection) {
          this.save();
          ctx.scale(1, -1);
          geom = this.createTextGeometry();
          this.restore();
        }
        for (var i = 0; i < glyphsLength; ++i) {

          var glyph = glyphs[i];
          if (glyph === null) {
            // word break
            this.ctx.translate(wordSpacing, 0);
            current.x += wordSpacing * textHScale;
            continue;
          }

          this.save();
          ctx.scale(fontSize, fontSize);
          ctx.transform.apply(ctx, fontMatrix);
          this.executeOperatorList(glyph.operatorList);
          this.restore();

          var transformed = Util.applyTransform([glyph.width, 0], fontMatrix);
          var width = transformed[0] * fontSize +
              Util.sign(current.fontMatrix[0]) * charSpacing;

          ctx.translate(width, 0);
          current.x += width * textHScale;

          canvasWidth += width;
        }
        ctx.restore();
      } else {
        ctx.save();
        this.applyTextTransforms();

        var lineWidth = current.lineWidth;
        var scale = Math.abs(current.textMatrix[0] * fontMatrix[0]);
        if (scale == 0 || lineWidth == 0)
          lineWidth = this.getSinglePixelWidth();
        else
          lineWidth /= scale;

        if (textSelection)
          geom = this.createTextGeometry();

        if (fontSizeScale != 1.0) {
          ctx.scale(fontSizeScale, fontSizeScale);
          lineWidth /= fontSizeScale;
        }

        ctx.lineWidth = lineWidth;

        var x = 0;
        for (var i = 0; i < glyphsLength; ++i) {
          var glyph = glyphs[i];
          if (glyph === null) {
            // word break
            x += Util.sign(current.fontMatrix[0]) * wordSpacing;
            continue;
          }

          var character = glyph.fontChar;
          var charWidth = glyph.width * fontSize * 0.001 +
              Util.sign(current.fontMatrix[0]) * charSpacing;

          if (!glyph.disabled) {
            var scaledX = x / fontSizeScale;
            switch (textRenderingMode) {
              default: // other unsupported rendering modes
              case TextRenderingMode.FILL:
              case TextRenderingMode.FILL_ADD_TO_PATH:
                ctx.fillText(character, scaledX, 0);
                break;
              case TextRenderingMode.STROKE:
              case TextRenderingMode.STROKE_ADD_TO_PATH:
                ctx.strokeText(character, scaledX, 0);
                break;
              case TextRenderingMode.FILL_STROKE:
              case TextRenderingMode.FILL_STROKE_ADD_TO_PATH:
                ctx.fillText(character, scaledX, 0);
                ctx.strokeText(character, scaledX, 0);
                break;
              case TextRenderingMode.INVISIBLE:
              case TextRenderingMode.ADD_TO_PATH:
                break;
            }
            if (textRenderingMode & TextRenderingMode.ADD_TO_PATH_FLAG) {
              var clipCtx = this.getCurrentTextClipping();
              clipCtx.fillText(character, scaledX, 0);
            }
          }

          x += charWidth;

          var glyphUnicode = glyph.unicode === ' ' ? '\u00A0' : glyph.unicode;
          if (glyphUnicode in NormalizedUnicodes)
            glyphUnicode = NormalizedUnicodes[glyphUnicode];

          canvasWidth += charWidth;
        }
        current.x += x * textHScale2;
        ctx.restore();
      }

      if (textSelection) {
        geom.canvasWidth = canvasWidth;
        this.textLayer.appendText(geom);
      }

      return canvasWidth;
    },
    showSpacedText: function CanvasGraphics_showSpacedText(arr) {
      var ctx = this.ctx;
      var current = this.current;
      var font = current.font;
      var fontSize = current.fontSize;
      var textHScale = current.textHScale;
      if (!font.coded)
        textHScale *= (current.fontMatrix || IDENTITY_MATRIX)[0];
      var arrLength = arr.length;
      var textLayer = this.textLayer;
      var geom;
      var canvasWidth = 0.0;
      var textSelection = textLayer ? true : false;

      if (textSelection) {
        ctx.save();
        // Type3 fonts - each glyph is a "mini-PDF" (see also showText)
        if (font.coded) {
          ctx.transform.apply(ctx, current.textMatrix);
          ctx.scale(1, -1);
          ctx.translate(current.x, -1 * current.y);
          ctx.scale(textHScale, 1);
        } else
          this.applyTextTransforms();
        geom = this.createTextGeometry();
        ctx.restore();
      }

      for (var i = 0; i < arrLength; ++i) {
        var e = arr[i];
        if (isNum(e)) {
          var spacingLength = -e * 0.001 * fontSize * textHScale;
          current.x += spacingLength;

          if (textSelection)
            canvasWidth += spacingLength;
        } else if (isString(e)) {
          var shownCanvasWidth = this.showText(e, true);

          if (textSelection)
            canvasWidth += shownCanvasWidth;
        } else {
          error('TJ array element ' + e + ' is not string or num');
        }
      }

      if (textSelection) {
        geom.canvasWidth = canvasWidth;
        this.textLayer.appendText(geom);
      }
    },
    nextLineShowText: function CanvasGraphics_nextLineShowText(text) {
      this.nextLine();
      this.showText(text);
    },
    nextLineSetSpacingShowText:
      function CanvasGraphics_nextLineSetSpacingShowText(wordSpacing,
                                                         charSpacing,
                                                         text) {
      this.setWordSpacing(wordSpacing);
      this.setCharSpacing(charSpacing);
      this.nextLineShowText(text);
    },

    // Type3 fonts
    setCharWidth: function CanvasGraphics_setCharWidth(xWidth, yWidth) {
      // We can safely ignore this since the width should be the same
      // as the width in the Widths array.
    },
    setCharWidthAndBounds: function CanvasGraphics_setCharWidthAndBounds(xWidth,
                                                                        yWidth,
                                                                        llx,
                                                                        lly,
                                                                        urx,
                                                                        ury) {
      // TODO According to the spec we're also suppose to ignore any operators
      // that set color or include images while processing this type3 font.
      this.rectangle(llx, lly, urx - llx, ury - lly);
      this.clip();
      this.endPath();
    },

    // Color
    setStrokeColorSpace: function CanvasGraphics_setStrokeColorSpace(raw) {
      this.current.strokeColorSpace = ColorSpace.fromIR(raw);
    },
    setFillColorSpace: function CanvasGraphics_setFillColorSpace(raw) {
      this.current.fillColorSpace = ColorSpace.fromIR(raw);
    },
    setStrokeColor: function CanvasGraphics_setStrokeColor(/*...*/) {
      var cs = this.current.strokeColorSpace;
      var rgbColor = cs.getRgb(arguments);
      var color = Util.makeCssRgb(rgbColor[0], rgbColor[1], rgbColor[2]);
      this.ctx.strokeStyle = color;
      this.current.strokeColor = color;
    },
    getColorN_Pattern: function CanvasGraphics_getColorN_Pattern(IR, cs) {
      if (IR[0] == 'TilingPattern') {
        var args = IR[1];
        var base = cs.base;
        var color;
        if (base) {
          var baseComps = base.numComps;

          color = [];
          for (var i = 0; i < baseComps; ++i)
            color.push(args[i]);

          color = base.getRgb(color);
        }
        var pattern = new TilingPattern(IR, color, this.ctx, this.objs);
      } else if (IR[0] == 'RadialAxial' || IR[0] == 'Dummy') {
        var pattern = Pattern.shadingFromIR(IR);
      } else {
        error('Unkown IR type ' + IR[0]);
      }
      return pattern;
    },
    setStrokeColorN: function CanvasGraphics_setStrokeColorN(/*...*/) {
      var cs = this.current.strokeColorSpace;

      if (cs.name == 'Pattern') {
        this.current.strokeColor = this.getColorN_Pattern(arguments, cs);
      } else {
        this.setStrokeColor.apply(this, arguments);
      }
    },
    setFillColor: function CanvasGraphics_setFillColor(/*...*/) {
      var cs = this.current.fillColorSpace;
      var rgbColor = cs.getRgb(arguments);
      var color = Util.makeCssRgb(rgbColor[0], rgbColor[1], rgbColor[2]);
      this.ctx.fillStyle = color;
      this.current.fillColor = color;
    },
    setFillColorN: function CanvasGraphics_setFillColorN(/*...*/) {
      var cs = this.current.fillColorSpace;

      if (cs.name == 'Pattern') {
        this.current.fillColor = this.getColorN_Pattern(arguments, cs);
      } else {
        this.setFillColor.apply(this, arguments);
      }
    },
    setStrokeGray: function CanvasGraphics_setStrokeGray(gray) {
      if (!(this.current.strokeColorSpace instanceof DeviceGrayCS))
        this.current.strokeColorSpace = new DeviceGrayCS();

      var color = Util.makeCssRgb(gray, gray, gray);
      this.ctx.strokeStyle = color;
      this.current.strokeColor = color;
    },
    setFillGray: function CanvasGraphics_setFillGray(gray) {
      if (!(this.current.fillColorSpace instanceof DeviceGrayCS))
        this.current.fillColorSpace = new DeviceGrayCS();

      var color = Util.makeCssRgb(gray, gray, gray);
      this.ctx.fillStyle = color;
      this.current.fillColor = color;
    },
    setStrokeRGBColor: function CanvasGraphics_setStrokeRGBColor(r, g, b) {
      if (!(this.current.strokeColorSpace instanceof DeviceRgbCS))
        this.current.strokeColorSpace = new DeviceRgbCS();

      var color = Util.makeCssRgb(r, g, b);
      this.ctx.strokeStyle = color;
      this.current.strokeColor = color;
    },
    setFillRGBColor: function CanvasGraphics_setFillRGBColor(r, g, b) {
      if (!(this.current.fillColorSpace instanceof DeviceRgbCS))
        this.current.fillColorSpace = new DeviceRgbCS();

      var color = Util.makeCssRgb(r, g, b);
      this.ctx.fillStyle = color;
      this.current.fillColor = color;
    },
    setStrokeCMYKColor: function CanvasGraphics_setStrokeCMYKColor(c, m, y, k) {
      if (!(this.current.strokeColorSpace instanceof DeviceCmykCS))
        this.current.strokeColorSpace = new DeviceCmykCS();

      var color = Util.makeCssCmyk(c, m, y, k);
      this.ctx.strokeStyle = color;
      this.current.strokeColor = color;
    },
    setFillCMYKColor: function CanvasGraphics_setFillCMYKColor(c, m, y, k) {
      if (!(this.current.fillColorSpace instanceof DeviceCmykCS))
        this.current.fillColorSpace = new DeviceCmykCS();

      var color = Util.makeCssCmyk(c, m, y, k);
      this.ctx.fillStyle = color;
      this.current.fillColor = color;
    },

    shadingFill: function CanvasGraphics_shadingFill(patternIR) {
      var ctx = this.ctx;

      this.save();
      var pattern = Pattern.shadingFromIR(patternIR);
      ctx.fillStyle = pattern.getPattern(ctx);

      var inv = ctx.mozCurrentTransformInverse;
      if (inv) {
        var canvas = ctx.canvas;
        var width = canvas.width;
        var height = canvas.height;

        var bl = Util.applyTransform([0, 0], inv);
        var br = Util.applyTransform([0, height], inv);
        var ul = Util.applyTransform([width, 0], inv);
        var ur = Util.applyTransform([width, height], inv);

        var x0 = Math.min(bl[0], br[0], ul[0], ur[0]);
        var y0 = Math.min(bl[1], br[1], ul[1], ur[1]);
        var x1 = Math.max(bl[0], br[0], ul[0], ur[0]);
        var y1 = Math.max(bl[1], br[1], ul[1], ur[1]);

        this.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      } else {
        // HACK to draw the gradient onto an infinite rectangle.
        // PDF gradients are drawn across the entire image while
        // Canvas only allows gradients to be drawn in a rectangle
        // The following bug should allow us to remove this.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=664884

        this.ctx.fillRect(-1e10, -1e10, 2e10, 2e10);
      }

      this.restore();
    },

    // Images
    beginInlineImage: function CanvasGraphics_beginInlineImage() {
      error('Should not call beginInlineImage');
    },
    beginImageData: function CanvasGraphics_beginImageData() {
      error('Should not call beginImageData');
    },

    paintFormXObjectBegin: function CanvasGraphics_paintFormXObjectBegin(matrix,
                                                                        bbox) {
      this.save();

      if (matrix && isArray(matrix) && 6 == matrix.length)
        this.transform.apply(this, matrix);

      if (bbox && isArray(bbox) && 4 == bbox.length) {
        var width = bbox[2] - bbox[0];
        var height = bbox[3] - bbox[1];
        this.rectangle(bbox[0], bbox[1], width, height);
        this.clip();
        this.endPath();
      }
    },

    paintFormXObjectEnd: function CanvasGraphics_paintFormXObjectEnd() {
      this.restore();
    },

    paintJpegXObject: function CanvasGraphics_paintJpegXObject(objId, w, h) {
      var domImage = this.objs.get(objId);
      if (!domImage) {
        error('Dependent image isn\'t ready yet');
      }

      this.save();

      var ctx = this.ctx;
      // scale the image to the unit square
      ctx.scale(1 / w, -1 / h);

      ctx.drawImage(domImage, 0, 0, domImage.width, domImage.height,
                    0, -h, w, h);

      this.restore();
    },

    paintImageMaskXObject: function CanvasGraphics_paintImageMaskXObject(
                             imgArray, inverseDecode, width, height) {
      function applyStencilMask(buffer, inverseDecode) {
        var imgArrayPos = 0;
        var i, j, mask, buf;
        // removing making non-masked pixels transparent
        var bufferPos = 3; // alpha component offset
        for (i = 0; i < height; i++) {
          mask = 0;
          for (j = 0; j < width; j++) {
            if (!mask) {
              buf = imgArray[imgArrayPos++];
              mask = 128;
            }
            if (!(buf & mask) == inverseDecode) {
              buffer[bufferPos] = 0;
            }
            bufferPos += 4;
            mask >>= 1;
          }
        }
      }
      function rescaleImage(pixels, widthScale, heightScale) {
        var scaledWidth = Math.ceil(width / widthScale);
        var scaledHeight = Math.ceil(height / heightScale);

        var itemsSum = new Uint32Array(scaledWidth * scaledHeight * 4);
        var itemsCount = new Uint32Array(scaledWidth * scaledHeight);
        for (var i = 0, position = 0; i < height; i++) {
          var lineOffset = (0 | (i / heightScale)) * scaledWidth;
          for (var j = 0; j < width; j++) {
            var countOffset = lineOffset + (0 | (j / widthScale));
            var sumOffset = countOffset << 2;
            itemsSum[sumOffset] += pixels[position];
            itemsSum[sumOffset + 1] += pixels[position + 1];
            itemsSum[sumOffset + 2] += pixels[position + 2];
            itemsSum[sumOffset + 3] += pixels[position + 3];
            itemsCount[countOffset]++;
            position += 4;
          }
        }
        var tmpCanvas = createScratchCanvas(scaledWidth, scaledHeight);
        var tmpCtx = tmpCanvas.getContext('2d');
        var imgData = tmpCtx.getImageData(0, 0, scaledWidth, scaledHeight);
        pixels = imgData.data;
        for (var i = 0, j = 0, ii = scaledWidth * scaledHeight; i < ii; i++) {
          var count = itemsCount[i];
          pixels[j] = itemsSum[j] / count;
          pixels[j + 1] = itemsSum[j + 1] / count;
          pixels[j + 2] = itemsSum[j + 2] / count;
          pixels[j + 3] = itemsSum[j + 3] / count;
          j += 4;
        }
        tmpCtx.putImageData(imgData, 0, 0);
        return tmpCanvas;
      }

      this.save();

      var ctx = this.ctx;
      var w = width, h = height;
      // scale the image to the unit square
      ctx.scale(1 / w, -1 / h);

      var tmpCanvas = createScratchCanvas(w, h);
      var tmpCtx = tmpCanvas.getContext('2d');

      var fillColor = this.current.fillColor;
      tmpCtx.fillStyle = (fillColor && fillColor.hasOwnProperty('type') &&
                          fillColor.type === 'Pattern') ?
                          fillColor.getPattern(tmpCtx) : fillColor;
      tmpCtx.fillRect(0, 0, w, h);

      var imgData = tmpCtx.getImageData(0, 0, w, h);
      var pixels = imgData.data;

      applyStencilMask(pixels, inverseDecode);

      var currentTransform = ctx.mozCurrentTransformInverse;
      var widthScale = Math.max(Math.abs(currentTransform[0]), 1);
      var heightScale = Math.max(Math.abs(currentTransform[3]), 1);
      if (widthScale >= 2 || heightScale >= 2) {
        // canvas does not resize well large images to small -- using simple
        // algorithm to perform pre-scaling
        tmpCanvas = rescaleImage(imgData.data, widthScale, heightScale);
        ctx.scale(widthScale, heightScale);
        ctx.drawImage(tmpCanvas, 0, -h / heightScale);
      } else {
        tmpCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(tmpCanvas, 0, -h);
      }
      this.restore();
    },

    paintImageXObject: function CanvasGraphics_paintImageXObject(objId) {
      var imgData = this.objs.get(objId);
      if (!imgData)
        error('Dependent image isn\'t ready yet');

      this.save();
      var ctx = this.ctx;
      var w = imgData.width;
      var h = imgData.height;
      // scale the image to the unit square
      ctx.scale(1 / w, -1 / h);

      var tmpCanvas = createScratchCanvas(w, h);
      var tmpCtx = tmpCanvas.getContext('2d');
      this.putBinaryImageData(tmpCtx, imgData, w, h);

      ctx.drawImage(tmpCanvas, 0, -h);
      this.restore();
    },

    putBinaryImageData: function CanvasGraphics_putBinaryImageData(ctx, imgData,
                                                                   w, h) {
      var tmpImgData = 'createImageData' in ctx ? ctx.createImageData(w, h) :
        ctx.getImageData(0, 0, w, h);

      var tmpImgDataPixels = tmpImgData.data;
      var data = imgData.data;
      if ('set' in tmpImgDataPixels)
        tmpImgDataPixels.set(data);
      else {
        // Copy over the imageData pixel by pixel.
        for (var i = 0, ii = tmpImgDataPixels.length; i < ii; i++)
          tmpImgDataPixels[i] = data[i];
      }

      ctx.putImageData(tmpImgData, 0, 0);
    },

    // Marked content

    markPoint: function CanvasGraphics_markPoint(tag) {
      // TODO Marked content.
    },
    markPointProps: function CanvasGraphics_markPointProps(tag, properties) {
      // TODO Marked content.
    },
    beginMarkedContent: function CanvasGraphics_beginMarkedContent(tag) {
      // TODO Marked content.
    },
    beginMarkedContentProps: function CanvasGraphics_beginMarkedContentProps(
                                        tag, properties) {
      // TODO Marked content.
    },
    endMarkedContent: function CanvasGraphics_endMarkedContent() {
      // TODO Marked content.
    },

    // Compatibility

    beginCompat: function CanvasGraphics_beginCompat() {
      TODO('ignore undefined operators (should we do that anyway?)');
    },
    endCompat: function CanvasGraphics_endCompat() {
      TODO('stop ignoring undefined operators');
    },

    // Helper functions

    consumePath: function CanvasGraphics_consumePath() {
      if (this.pendingClip) {
        var savedFillRule = null;
        if (this.pendingClip == EO_CLIP)
          savedFillRule = this.setEOFillRule();

        this.ctx.clip();

        this.pendingClip = null;
        if (savedFillRule !== null)
          this.restoreFillRule(savedFillRule);
      }
      this.ctx.beginPath();
    },
    // We generally keep the canvas context set for
    // nonzero-winding, and just set evenodd for the operations
    // that need them.
    setEOFillRule: function CanvasGraphics_setEOFillRule() {
      var savedFillRule = this.ctx.mozFillRule;
      this.ctx.mozFillRule = 'evenodd';
      return savedFillRule;
    },
    restoreFillRule: function CanvasGraphics_restoreFillRule(rule) {
      this.ctx.mozFillRule = rule;
    },
    getSinglePixelWidth: function CanvasGraphics_getSinglePixelWidth(scale) {
      var inverse = this.ctx.mozCurrentTransformInverse;
      return Math.abs(inverse[0] + inverse[2]);
    }
  };

  return CanvasGraphics;
})();



var Name = (function NameClosure() {
  function Name(name) {
    this.name = name;
  }

  Name.prototype = {};

  return Name;
})();

var Cmd = (function CmdClosure() {
  function Cmd(cmd) {
    this.cmd = cmd;
  }

  Cmd.prototype = {};

  var cmdCache = {};

  Cmd.get = function Cmd_get(cmd) {
    var cmdValue = cmdCache[cmd];
    if (cmdValue)
      return cmdValue;

    return cmdCache[cmd] = new Cmd(cmd);
  };

  return Cmd;
})();

var Dict = (function DictClosure() {
  // xref is optional
  function Dict(xref) {
    // Map should only be used internally, use functions below to access.
    var map = Object.create(null);

    this.assignXref = function Dict_assignXref(newXref) {
      xref = newXref;
    };

    // automatically dereferences Ref objects
    this.get = function Dict_get(key1, key2, key3) {
      var value;
      if (typeof (value = map[key1]) != 'undefined' || key1 in map ||
          typeof key2 == 'undefined') {
        return xref ? xref.fetchIfRef(value) : value;
      }
      if (typeof (value = map[key2]) != 'undefined' || key2 in map ||
          typeof key3 == 'undefined') {
        return xref ? xref.fetchIfRef(value) : value;
      }
      value = map[key3] || null;
      return xref ? xref.fetchIfRef(value) : value;
    };

    // no dereferencing
    this.getRaw = function Dict_getRaw(key) {
      return map[key];
    };

    // creates new map and dereferences all Refs
    this.getAll = function Dict_getAll() {
      var all = {};
      for (var key in map) {
        var obj = this.get(key);
        all[key] = obj instanceof Dict ? obj.getAll() : obj;
      }
      return all;
    };

    this.set = function Dict_set(key, value) {
      map[key] = value;
    };

    this.has = function Dict_has(key) {
      return key in map;
    };

    this.forEach = function Dict_forEach(callback) {
      for (var key in map) {
        callback(key, this.get(key));
      }
    };
  };

  return Dict;
})();

var Ref = (function RefClosure() {
  function Ref(num, gen) {
    this.num = num;
    this.gen = gen;
  }

  Ref.prototype = {};

  return Ref;
})();

// The reference is identified by number and generation,
// this structure stores only one instance of the reference.
var RefSet = (function RefSetClosure() {
  function RefSet() {
    this.dict = {};
  }

  RefSet.prototype = {
    has: function RefSet_has(ref) {
      return !!this.dict['R' + ref.num + '.' + ref.gen];
    },

    put: function RefSet_put(ref) {
      this.dict['R' + ref.num + '.' + ref.gen] = ref;
    }
  };

  return RefSet;
})();

var Catalog = (function CatalogClosure() {
  function Catalog(xref) {
    this.xref = xref;
    var obj = xref.getCatalogObj();
    assertWellFormed(isDict(obj), 'catalog object is not a dictionary');
    this.catDict = obj;
  }

  Catalog.prototype = {
    get metadata() {
      var streamRef = this.catDict.getRaw('Metadata');
      if (!isRef(streamRef))
        return shadow(this, 'metadata', null);

      var encryptMetadata = !this.xref.encrypt ? false :
        this.xref.encrypt.encryptMetadata;

      var stream = this.xref.fetch(streamRef, !encryptMetadata);
      var metadata;
      if (stream && isDict(stream.dict)) {
        var type = stream.dict.get('Type');
        var subtype = stream.dict.get('Subtype');

        if (isName(type) && isName(subtype) &&
            type.name === 'Metadata' && subtype.name === 'XML') {
          // XXX: This should examine the charset the XML document defines,
          // however since there are currently no real means to decode
          // arbitrary charsets, let's just hope that the author of the PDF
          // was reasonable enough to stick with the XML default charset,
          // which is UTF-8.
          try {
            metadata = stringToUTF8String(bytesToString(stream.getBytes()));
          } catch (e) {
            info('Skipping invalid metadata.');
          }
        }
      }

      return shadow(this, 'metadata', metadata);
    },
    get toplevelPagesDict() {
      var pagesObj = this.catDict.get('Pages');
      assertWellFormed(isDict(pagesObj), 'invalid top-level pages dictionary');
      // shadow the prototype getter
      return shadow(this, 'toplevelPagesDict', pagesObj);
    },
    get documentOutline() {
      var xref = this.xref;
      var obj = this.catDict.get('Outlines');
      var root = { items: [] };
      if (isDict(obj)) {
        obj = obj.getRaw('First');
        var processed = new RefSet();
        if (isRef(obj)) {
          var queue = [{obj: obj, parent: root}];
          // to avoid recursion keeping track of the items
          // in the processed dictionary
          processed.put(obj);
          while (queue.length > 0) {
            var i = queue.shift();
            var outlineDict = xref.fetchIfRef(i.obj);
            if (outlineDict === null)
              continue;
            if (!outlineDict.has('Title'))
              error('Invalid outline item');
            var dest = outlineDict.get('A');
            if (dest)
              dest = dest.get('D');
            else if (outlineDict.has('Dest')) {
              dest = outlineDict.getRaw('Dest');
              if (isName(dest))
                dest = dest.name;
            }
            var title = outlineDict.get('Title');
            var outlineItem = {
              dest: dest,
              title: stringToPDFString(title),
              color: outlineDict.get('C') || [0, 0, 0],
              count: outlineDict.get('Count'),
              bold: !!(outlineDict.get('F') & 2),
              italic: !!(outlineDict.get('F') & 1),
              items: []
            };
            i.parent.items.push(outlineItem);
            obj = outlineDict.getRaw('First');
            if (isRef(obj) && !processed.has(obj)) {
              queue.push({obj: obj, parent: outlineItem});
              processed.put(obj);
            }
            obj = outlineDict.getRaw('Next');
            if (isRef(obj) && !processed.has(obj)) {
              queue.push({obj: obj, parent: i.parent});
              processed.put(obj);
            }
          }
        }
      }
      obj = root.items.length > 0 ? root.items : null;
      return shadow(this, 'documentOutline', obj);
    },
    get numPages() {
      var obj = this.toplevelPagesDict.get('Count');
      assertWellFormed(
        isInt(obj),
        'page count in top level pages object is not an integer'
      );
      // shadow the prototype getter
      return shadow(this, 'num', obj);
    },
    traverseKids: function Catalog_traverseKids(pagesDict) {
      var pageCache = this.pageCache;
      var kids = pagesDict.get('Kids');
      assertWellFormed(isArray(kids),
                       'page dictionary kids object is not an array');
      for (var i = 0, ii = kids.length; i < ii; ++i) {
        var kid = kids[i];
        assertWellFormed(isRef(kid),
                        'page dictionary kid is not a reference');
        var obj = this.xref.fetch(kid);
        if (isDict(obj, 'Page') || (isDict(obj) && !obj.has('Kids'))) {
          pageCache.push(new Page(this.xref, pageCache.length, obj, kid));
        } else { // must be a child page dictionary
          assertWellFormed(
            isDict(obj),
            'page dictionary kid reference points to wrong type of object'
          );
          this.traverseKids(obj);
        }
      }
    },
    get destinations() {
      function fetchDestination(dest) {
        return isDict(dest) ? dest.get('D') : dest;
      }

      var xref = this.xref;
      var dests = {}, nameTreeRef, nameDictionaryRef;
      var obj = this.catDict.get('Names');
      if (obj)
        nameTreeRef = obj.getRaw('Dests');
      else if (this.catDict.has('Dests'))
        nameDictionaryRef = this.catDict.get('Dests');

      if (nameDictionaryRef) {
        // reading simple destination dictionary
        obj = nameDictionaryRef;
        obj.forEach(function catalogForEach(key, value) {
          if (!value) return;
          dests[key] = fetchDestination(value);
        });
      }
      if (nameTreeRef) {
        // reading name tree
        var processed = new RefSet();
        processed.put(nameTreeRef);
        var queue = [nameTreeRef];
        while (queue.length > 0) {
          var i, n;
          obj = xref.fetch(queue.shift());
          if (obj.has('Kids')) {
            var kids = obj.get('Kids');
            for (i = 0, n = kids.length; i < n; i++) {
              var kid = kids[i];
              if (processed.has(kid))
                error('invalid destinations');
              queue.push(kid);
              processed.put(kid);
            }
            continue;
          }
          var names = obj.get('Names');
          for (i = 0, n = names.length; i < n; i += 2) {
            dests[names[i]] = fetchDestination(xref.fetchIfRef(names[i + 1]));
          }
        }
      }
      return shadow(this, 'destinations', dests);
    },
    getPage: function Catalog_getPage(n) {
      var pageCache = this.pageCache;
      if (!pageCache) {
        pageCache = this.pageCache = [];
        this.traverseKids(this.toplevelPagesDict);
      }
      return this.pageCache[n - 1];
    }
  };

  return Catalog;
})();

var XRef = (function XRefClosure() {
  function XRef(stream, startXRef, mainXRefEntriesOffset, password) {
    this.stream = stream;
    this.entries = [];
    this.xrefstms = {};
    var trailerDict = this.readXRef(startXRef);
    trailerDict.assignXref(this);
    this.trailer = trailerDict;
    // prepare the XRef cache
    this.cache = [];

    var encrypt = trailerDict.get('Encrypt');
    if (encrypt) {
      var fileId = trailerDict.get('ID');
      this.encrypt = new CipherTransformFactory(encrypt, fileId[0], password);
    }

    // get the root dictionary (catalog) object
    if (!(this.root = trailerDict.get('Root')))
      error('Invalid root reference');
  }

  XRef.prototype = {
    readXRefTable: function XRef_readXRefTable(parser) {
      // Example of cross-reference table:
      // xref
      // 0 1                    <-- subsection header (first obj #, obj count)
      // 0000000000 65535 f     <-- actual object (offset, generation #, f/n)
      // 23 2                   <-- subsection header ... and so on ...
      // 0000025518 00002 n
      // 0000025635 00000 n
      // trailer
      // ...

      // Outer loop is over subsection headers
      var obj;
      while (!isCmd(obj = parser.getObj(), 'trailer')) {
        var first = obj,
            count = parser.getObj();

        if (!isInt(first) || !isInt(count))
          error('Invalid XRef table: wrong types in subsection header');

        // Inner loop is over objects themselves
        for (var i = 0; i < count; i++) {
          var entry = {};
          entry.offset = parser.getObj();
          entry.gen = parser.getObj();
          var type = parser.getObj();

          if (isCmd(type, 'f'))
            entry.free = true;
          else if (isCmd(type, 'n'))
            entry.uncompressed = true;

          // Validate entry obj
          if (!isInt(entry.offset) || !isInt(entry.gen) ||
              !(entry.free || entry.uncompressed)) {
            error('Invalid entry in XRef subsection: ' + first + ', ' + count);
          }

          if (!this.entries[i + first])
            this.entries[i + first] = entry;
        }
      }

      // Sanity check: as per spec, first object must be free
      if (this.entries[0] && !this.entries[0].free)
        error('Invalid XRef table: unexpected first object');

      // Sanity check
      if (!isCmd(obj, 'trailer'))
        error('Invalid XRef table: could not find trailer dictionary');

      // Read trailer dictionary, e.g.
      // trailer
      //    << /Size 22
      //      /Root 20R
      //      /Info 10R
      //      /ID [ <81b14aafa313db63dbd6f981e49f94f4> ]
      //    >>
      // The parser goes through the entire stream << ... >> and provides
      // a getter interface for the key-value table
      var dict = parser.getObj();
      if (!isDict(dict))
        error('Invalid XRef table: could not parse trailer dictionary');

      return dict;
    },
    readXRefStream: function XRef_readXRefStream(stream) {
      var streamParameters = stream.parameters;
      var byteWidths = streamParameters.get('W');
      var range = streamParameters.get('Index');
      if (!range)
        range = [0, streamParameters.get('Size')];
      var i, j;
      while (range.length > 0) {
        var first = range[0], n = range[1];
        if (!isInt(first) || !isInt(n))
          error('Invalid XRef range fields: ' + first + ', ' + n);
        var typeFieldWidth = byteWidths[0];
        var offsetFieldWidth = byteWidths[1];
        var generationFieldWidth = byteWidths[2];
        if (!isInt(typeFieldWidth) || !isInt(offsetFieldWidth) ||
            !isInt(generationFieldWidth)) {
          error('Invalid XRef entry fields length: ' + first + ', ' + n);
        }
        for (i = 0; i < n; ++i) {
          var type = 0, offset = 0, generation = 0;
          for (j = 0; j < typeFieldWidth; ++j)
            type = (type << 8) | stream.getByte();
          // if type field is absent, its default value = 1
          if (typeFieldWidth == 0)
            type = 1;
          for (j = 0; j < offsetFieldWidth; ++j)
            offset = (offset << 8) | stream.getByte();
          for (j = 0; j < generationFieldWidth; ++j)
            generation = (generation << 8) | stream.getByte();
          var entry = {};
          entry.offset = offset;
          entry.gen = generation;
          switch (type) {
            case 0:
              entry.free = true;
              break;
            case 1:
              entry.uncompressed = true;
              break;
            case 2:
              break;
            default:
              error('Invalid XRef entry type: ' + type);
          }
          if (!this.entries[first + i])
            this.entries[first + i] = entry;
        }
        range.splice(0, 2);
      }
      return streamParameters;
    },
    indexObjects: function XRef_indexObjects() {
      // Simple scan through the PDF content to find objects,
      // trailers and XRef streams.
      function readToken(data, offset) {
        var token = '', ch = data[offset];
        while (ch !== 13 && ch !== 10) {
          if (++offset >= data.length)
            break;
          token += String.fromCharCode(ch);
          ch = data[offset];
        }
        return token;
      }
      function skipUntil(data, offset, what) {
        var length = what.length, dataLength = data.length;
        var skipped = 0;
        // finding byte sequence
        while (offset < dataLength) {
          var i = 0;
          while (i < length && data[offset + i] == what[i])
            ++i;
          if (i >= length)
            break; // sequence found

          offset++;
          skipped++;
        }
        return skipped;
      }
      var trailerBytes = new Uint8Array([116, 114, 97, 105, 108, 101, 114]);
      var startxrefBytes = new Uint8Array([115, 116, 97, 114, 116, 120, 114,
                                          101, 102]);
      var endobjBytes = new Uint8Array([101, 110, 100, 111, 98, 106]);
      var xrefBytes = new Uint8Array([47, 88, 82, 101, 102]);

      var stream = this.stream;
      stream.pos = 0;
      var buffer = stream.getBytes();
      var position = stream.start, length = buffer.length;
      var trailers = [], xrefStms = [];
      var state = 0;
      var currentToken;
      while (position < length) {
        var ch = buffer[position];
        if (ch === 32 || ch === 9 || ch === 13 || ch === 10) {
          ++position;
          continue;
        }
        if (ch === 37) { // %-comment
          do {
            ++position;
            ch = buffer[position];
          } while (ch !== 13 && ch !== 10);
          continue;
        }
        var token = readToken(buffer, position);
        var m;
        if (token === 'xref') {
          position += skipUntil(buffer, position, trailerBytes);
          trailers.push(position);
          position += skipUntil(buffer, position, startxrefBytes);
        } else if ((m = /^(\d+)\s+(\d+)\s+obj\b/.exec(token))) {
          this.entries[m[1]] = {
            offset: position,
            gen: m[2] | 0,
            uncompressed: true
          };

          var contentLength = skipUntil(buffer, position, endobjBytes) + 7;
          var content = buffer.subarray(position, position + contentLength);

          // checking XRef stream suspect
          // (it shall have '/XRef' and next char is not a letter)
          var xrefTagOffset = skipUntil(content, 0, xrefBytes);
          if (xrefTagOffset < contentLength &&
              content[xrefTagOffset + 5] < 64) {
            xrefStms.push(position);
            this.xrefstms[position] = 1; // don't read it recursively
          }

          position += contentLength;
        } else
          position += token.length + 1;
      }
      // reading XRef streams
      for (var i = 0, ii = xrefStms.length; i < ii; ++i) {
          this.readXRef(xrefStms[i], true);
      }
      // finding main trailer
      var dict;
      for (var i = 0, ii = trailers.length; i < ii; ++i) {
        stream.pos = trailers[i];
        var parser = new Parser(new Lexer(stream), true, null);
        var obj = parser.getObj();
        if (!isCmd(obj, 'trailer'))
          continue;
        // read the trailer dictionary
        if (!isDict(dict = parser.getObj()))
          continue;
        // taking the first one with 'ID'
        if (dict.has('ID'))
          return dict;
      }
      // no tailer with 'ID', taking last one (if exists)
      if (dict)
        return dict;
      // nothing helps
      error('Invalid PDF structure');
    },
    readXRef: function XRef_readXRef(startXRef, recoveryMode) {
      var stream = this.stream;
      stream.pos = startXRef;

      try {
        var parser = new Parser(new Lexer(stream), true, null);
        var obj = parser.getObj();
        var dict;

        // Get dictionary
        if (isCmd(obj, 'xref')) {
          // Parse end-of-file XRef
          dict = this.readXRefTable(parser);

          // Recursively get other XRefs 'XRefStm', if any
          obj = dict.get('XRefStm');
          if (isInt(obj)) {
            var pos = obj;
            // ignore previously loaded xref streams
            // (possible infinite recursion)
            if (!(pos in this.xrefstms)) {
              this.xrefstms[pos] = 1;
              this.readXRef(pos);
            }
          }
        } else if (isInt(obj)) {
          // Parse in-stream XRef
          if (!isInt(parser.getObj()) ||
              !isCmd(parser.getObj(), 'obj') ||
              !isStream(obj = parser.getObj())) {
            error('Invalid XRef stream');
          }
          dict = this.readXRefStream(obj);
          if (!dict)
            error('Failed to read XRef stream');
        }

        // Recursively get previous dictionary, if any
        obj = dict.get('Prev');
        if (isInt(obj))
          this.readXRef(obj, recoveryMode);
        else if (isRef(obj)) {
          // The spec says Prev must not be a reference, i.e. "/Prev NNN"
          // This is a fallback for non-compliant PDFs, i.e. "/Prev NNN 0 R"
          this.readXRef(obj.num, recoveryMode);
        }

        return dict;
      } catch (e) {
        log('(while reading XRef): ' + e);
      }

      if (recoveryMode)
        return;

      warn('Indexing all PDF objects');
      return this.indexObjects();
    },
    getEntry: function XRef_getEntry(i) {
      var e = this.entries[i];
      if (e === null)
        return null;
      return e.free || !e.offset ? null : e; // returns null if entry is free
    },
    fetchIfRef: function XRef_fetchIfRef(obj) {
      if (!isRef(obj))
        return obj;
      return this.fetch(obj);
    },
    fetch: function XRef_fetch(ref, suppressEncryption) {
      assertWellFormed(isRef(ref), 'ref object is not a reference');
      var num = ref.num;
      if (num in this.cache)
        return this.cache[num];

      var e = this.getEntry(num);

      // the referenced entry can be free
      if (e === null)
        return (this.cache[num] = e);

      var gen = ref.gen;
      var stream, parser;
      if (e.uncompressed) {
        if (e.gen != gen)
          error('inconsistent generation in XRef');
        stream = this.stream.makeSubStream(e.offset);
        parser = new Parser(new Lexer(stream), true, this);
        var obj1 = parser.getObj();
        var obj2 = parser.getObj();
        var obj3 = parser.getObj();
        if (!isInt(obj1) || obj1 != num ||
            !isInt(obj2) || obj2 != gen ||
            !isCmd(obj3)) {
          error('bad XRef entry');
        }
        if (!isCmd(obj3, 'obj')) {
          // some bad pdfs use "obj1234" and really mean 1234
          if (obj3.cmd.indexOf('obj') == 0) {
            num = parseInt(obj3.cmd.substring(3), 10);
            if (!isNaN(num))
              return num;
          }
          error('bad XRef entry');
        }
        if (this.encrypt && !suppressEncryption) {
          try {
            e = parser.getObj(this.encrypt.createCipherTransform(num, gen));
          } catch (ex) {
            // almost all streams must be encrypted, but sometimes
            // they are not probably due to some broken generators
            // re-trying without encryption
            return this.fetch(ref, true);
          }
        } else {
          e = parser.getObj();
        }
        // Don't cache streams since they are mutable (except images).
        if (!isStream(e) || e instanceof JpegStream)
          this.cache[num] = e;
        return e;
      }

      // compressed entry
      stream = this.fetch(new Ref(e.offset, 0));
      if (!isStream(stream))
        error('bad ObjStm stream');
      var first = stream.parameters.get('First');
      var n = stream.parameters.get('N');
      if (!isInt(first) || !isInt(n)) {
        error('invalid first and n parameters for ObjStm stream');
      }
      parser = new Parser(new Lexer(stream), false, this);
      var i, entries = [], nums = [];
      // read the object numbers to populate cache
      for (i = 0; i < n; ++i) {
        num = parser.getObj();
        if (!isInt(num)) {
          error('invalid object number in the ObjStm stream: ' + num);
        }
        nums.push(num);
        var offset = parser.getObj();
        if (!isInt(offset)) {
          error('invalid object offset in the ObjStm stream: ' + offset);
        }
      }
      // read stream objects for cache
      for (i = 0; i < n; ++i) {
        entries.push(parser.getObj());
        this.cache[nums[i]] = entries[i];
      }
      e = entries[e.gen];
      if (!e) {
        error('bad XRef entry for compressed object');
      }
      return e;
    },
    getCatalogObj: function XRef_getCatalogObj() {
      return this.root;
    }
  };

  return XRef;
})();

/**
 * A PDF document and page is built of many objects. E.g. there are objects
 * for fonts, images, rendering code and such. These objects might get processed
 * inside of a worker. The `PDFObjects` implements some basic functions to
 * manage these objects.
 */
var PDFObjects = (function PDFObjectsClosure() {
  function PDFObjects() {
    this.objs = {};
  }

  PDFObjects.prototype = {
    objs: null,

    /**
     * Internal function.
     * Ensures there is an object defined for `objId`. Stores `data` on the
     * object *if* it is created.
     */
    ensureObj: function PDFObjects_ensureObj(objId, data) {
      if (this.objs[objId])
        return this.objs[objId];
      return this.objs[objId] = new Promise(objId, data);
    },

    /**
     * If called *without* callback, this returns the data of `objId` but the
     * object needs to be resolved. If it isn't, this function throws.
     *
     * If called *with* a callback, the callback is called with the data of the
     * object once the object is resolved. That means, if you call this
     * function and the object is already resolved, the callback gets called
     * right away.
     */
    get: function PDFObjects_get(objId, callback) {
      // If there is a callback, then the get can be async and the object is
      // not required to be resolved right now
      if (callback) {
        this.ensureObj(objId).then(callback);
        return null;
      }

      // If there isn't a callback, the user expects to get the resolved data
      // directly.
      var obj = this.objs[objId];

      // If there isn't an object yet or the object isn't resolved, then the
      // data isn't ready yet!
      if (!obj || !obj.isResolved)
        error('Requesting object that isn\'t resolved yet ' + objId);

      return obj.data;
    },

    /**
     * Resolves the object `objId` with optional `data`.
     */
    resolve: function PDFObjects_resolve(objId, data) {
      var objs = this.objs;

      // In case there is a promise already on this object, just resolve it.
      if (objs[objId]) {
        objs[objId].resolve(data);
      } else {
        this.ensureObj(objId, data);
      }
    },

    onData: function PDFObjects_onData(objId, callback) {
      this.ensureObj(objId).onData(callback);
    },

    isResolved: function PDFObjects_isResolved(objId) {
      var objs = this.objs;
      if (!objs[objId]) {
        return false;
      } else {
        return objs[objId].isResolved;
      }
    },

    hasData: function PDFObjects_hasData(objId) {
      var objs = this.objs;
      if (!objs[objId]) {
        return false;
      } else {
        return objs[objId].hasData;
      }
    },

    /**
     * Sets the data of an object but *doesn't* resolve it.
     */
    setData: function PDFObjects_setData(objId, data) {
      // Watchout! If you call `this.ensureObj(objId, data)` you're going to
      // create a *resolved* promise which shouldn't be the case!
      this.ensureObj(objId).data = data;
    }
  };
  return PDFObjects;
})();



var PDFFunction = (function PDFFunctionClosure() {
  var CONSTRUCT_SAMPLED = 0;
  var CONSTRUCT_INTERPOLATED = 2;
  var CONSTRUCT_STICHED = 3;
  var CONSTRUCT_POSTSCRIPT = 4;

  return {
    getSampleArray: function PDFFunction_getSampleArray(size, outputSize, bps,
                                                       str) {
      var length = 1;
      for (var i = 0, ii = size.length; i < ii; i++)
        length *= size[i];
      length *= outputSize;

      var array = [];
      var codeSize = 0;
      var codeBuf = 0;
      // 32 is a valid bps so shifting won't work
      var sampleMul = 1.0 / (Math.pow(2.0, bps) - 1);

      var strBytes = str.getBytes((length * bps + 7) / 8);
      var strIdx = 0;
      for (var i = 0; i < length; i++) {
        while (codeSize < bps) {
          codeBuf <<= 8;
          codeBuf |= strBytes[strIdx++];
          codeSize += 8;
        }
        codeSize -= bps;
        array.push((codeBuf >> codeSize) * sampleMul);
        codeBuf &= (1 << codeSize) - 1;
      }
      return array;
    },

    getIR: function PDFFunction_getIR(xref, fn) {
      var dict = fn.dict;
      if (!dict)
        dict = fn;

      var types = [this.constructSampled,
                   null,
                   this.constructInterpolated,
                   this.constructStiched,
                   this.constructPostScript];

      var typeNum = dict.get('FunctionType');
      var typeFn = types[typeNum];
      if (!typeFn)
        error('Unknown type of function');

      return typeFn.call(this, fn, dict, xref);
    },

    fromIR: function PDFFunction_fromIR(IR) {
      var type = IR[0];
      switch (type) {
        case CONSTRUCT_SAMPLED:
          return this.constructSampledFromIR(IR);
        case CONSTRUCT_INTERPOLATED:
          return this.constructInterpolatedFromIR(IR);
        case CONSTRUCT_STICHED:
          return this.constructStichedFromIR(IR);
        case CONSTRUCT_POSTSCRIPT:
        default:
          return this.constructPostScriptFromIR(IR);
      }
    },

    parse: function PDFFunction_parse(xref, fn) {
      var IR = this.getIR(xref, fn);
      return this.fromIR(IR);
    },

    constructSampled: function PDFFunction_constructSampled(str, dict) {
      function toMultiArray(arr) {
        var inputLength = arr.length;
        var outputLength = arr.length / 2;
        var out = [];
        var index = 0;
        for (var i = 0; i < inputLength; i += 2) {
          out[index] = [arr[i], arr[i + 1]];
          ++index;
        }
        return out;
      }
      var domain = dict.get('Domain');
      var range = dict.get('Range');

      if (!domain || !range)
        error('No domain or range');

      var inputSize = domain.length / 2;
      var outputSize = range.length / 2;

      domain = toMultiArray(domain);
      range = toMultiArray(range);

      var size = dict.get('Size');
      var bps = dict.get('BitsPerSample');
      var order = dict.get('Order') || 1;
      if (order !== 1) {
        // No description how cubic spline interpolation works in PDF32000:2008
        // As in poppler, ignoring order, linear interpolation may work as good
        TODO('No support for cubic spline interpolation: ' + order);
      }

      var encode = dict.get('Encode');
      if (!encode) {
        encode = [];
        for (var i = 0; i < inputSize; ++i) {
          encode.push(0);
          encode.push(size[i] - 1);
        }
      }
      encode = toMultiArray(encode);

      var decode = dict.get('Decode');
      if (!decode)
        decode = range;
      else
        decode = toMultiArray(decode);

      var samples = this.getSampleArray(size, outputSize, bps, str);

      return [
        CONSTRUCT_SAMPLED, inputSize, domain, encode, decode, samples, size,
        outputSize, Math.pow(2, bps) - 1, range
      ];
    },

    constructSampledFromIR: function PDFFunction_constructSampledFromIR(IR) {
      // See chapter 3, page 109 of the PDF reference
      function interpolate(x, xmin, xmax, ymin, ymax) {
        return ymin + ((x - xmin) * ((ymax - ymin) / (xmax - xmin)));
      }

      return function constructSampledFromIRResult(args) {
        // See chapter 3, page 110 of the PDF reference.
        var m = IR[1];
        var domain = IR[2];
        var encode = IR[3];
        var decode = IR[4];
        var samples = IR[5];
        var size = IR[6];
        var n = IR[7];
        var mask = IR[8];
        var range = IR[9];

        if (m != args.length)
          error('Incorrect number of arguments: ' + m + ' != ' +
                args.length);

        var x = args;

        // Building the cube vertices: its part and sample index
        // http://rjwagner49.com/Mathematics/Interpolation.pdf
        var cubeVertices = 1 << m;
        var cubeN = new Float64Array(cubeVertices);
        var cubeVertex = new Uint32Array(cubeVertices);
        for (var j = 0; j < cubeVertices; j++)
          cubeN[j] = 1;

        var k = n, pos = 1;
        // Map x_i to y_j for 0 <= i < m using the sampled function.
        for (var i = 0; i < m; ++i) {
          // x_i' = min(max(x_i, Domain_2i), Domain_2i+1)
          var domain_2i = domain[i][0];
          var domain_2i_1 = domain[i][1];
          var xi = Math.min(Math.max(x[i], domain_2i), domain_2i_1);

          // e_i = Interpolate(x_i', Domain_2i, Domain_2i+1,
          //                   Encode_2i, Encode_2i+1)
          var e = interpolate(xi, domain_2i, domain_2i_1,
                              encode[i][0], encode[i][1]);

          // e_i' = min(max(e_i, 0), Size_i - 1)
          var size_i = size[i];
          e = Math.min(Math.max(e, 0), size_i - 1);

          // Adjusting the cube: N and vertex sample index
          var e0 = e < size_i - 1 ? Math.floor(e) : e - 1; // e1 = e0 + 1;
          var n0 = e0 + 1 - e; // (e1 - e) / (e1 - e0);
          var n1 = e - e0; // (e - e0) / (e1 - e0);
          var offset0 = e0 * k;
          var offset1 = offset0 + k; // e1 * k
          for (var j = 0; j < cubeVertices; j++) {
            if (j & pos) {
              cubeN[j] *= n1;
              cubeVertex[j] += offset1;
            } else {
              cubeN[j] *= n0;
              cubeVertex[j] += offset0;
            }
          }

          k *= size_i;
          pos <<= 1;
        }

        var y = new Float64Array(n);
        for (var j = 0; j < n; ++j) {
          // Sum all cube vertices' samples portions
          var rj = 0;
          for (var i = 0; i < cubeVertices; i++)
            rj += samples[cubeVertex[i] + j] * cubeN[i];

          // r_j' = Interpolate(r_j, 0, 2^BitsPerSample - 1,
          //                    Decode_2j, Decode_2j+1)
          rj = interpolate(rj, 0, 1, decode[j][0], decode[j][1]);

          // y_j = min(max(r_j, range_2j), range_2j+1)
          y[j] = Math.min(Math.max(rj, range[j][0]), range[j][1]);
        }

        return y;
      }
    },

    constructInterpolated: function PDFFunction_constructInterpolated(str,
                                                                      dict) {
      var c0 = dict.get('C0') || [0];
      var c1 = dict.get('C1') || [1];
      var n = dict.get('N');

      if (!isArray(c0) || !isArray(c1))
        error('Illegal dictionary for interpolated function');

      var length = c0.length;
      var diff = [];
      for (var i = 0; i < length; ++i)
        diff.push(c1[i] - c0[i]);

      return [CONSTRUCT_INTERPOLATED, c0, diff, n];
    },

    constructInterpolatedFromIR:
      function PDFFunction_constructInterpolatedFromIR(IR) {
      var c0 = IR[1];
      var diff = IR[2];
      var n = IR[3];

      var length = diff.length;

      return function constructInterpolatedFromIRResult(args) {
        var x = n == 1 ? args[0] : Math.pow(args[0], n);

        var out = [];
        for (var j = 0; j < length; ++j)
          out.push(c0[j] + (x * diff[j]));

        return out;

      }
    },

    constructStiched: function PDFFunction_constructStiched(fn, dict, xref) {
      var domain = dict.get('Domain');

      if (!domain)
        error('No domain');

      var inputSize = domain.length / 2;
      if (inputSize != 1)
        error('Bad domain for stiched function');

      var fnRefs = dict.get('Functions');
      var fns = [];
      for (var i = 0, ii = fnRefs.length; i < ii; ++i)
        fns.push(PDFFunction.getIR(xref, xref.fetchIfRef(fnRefs[i])));

      var bounds = dict.get('Bounds');
      var encode = dict.get('Encode');

      return [CONSTRUCT_STICHED, domain, bounds, encode, fns];
    },

    constructStichedFromIR: function PDFFunction_constructStichedFromIR(IR) {
      var domain = IR[1];
      var bounds = IR[2];
      var encode = IR[3];
      var fnsIR = IR[4];
      var fns = [];

      for (var i = 0, ii = fnsIR.length; i < ii; i++) {
        fns.push(PDFFunction.fromIR(fnsIR[i]));
      }

      return function constructStichedFromIRResult(args) {
        var clip = function constructStichedFromIRClip(v, min, max) {
          if (v > max)
            v = max;
          else if (v < min)
            v = min;
          return v;
        };

        // clip to domain
        var v = clip(args[0], domain[0], domain[1]);
        // calulate which bound the value is in
        for (var i = 0, ii = bounds.length; i < ii; ++i) {
          if (v < bounds[i])
            break;
        }

        // encode value into domain of function
        var dmin = domain[0];
        if (i > 0)
          dmin = bounds[i - 1];
        var dmax = domain[1];
        if (i < bounds.length)
          dmax = bounds[i];

        var rmin = encode[2 * i];
        var rmax = encode[2 * i + 1];

        var v2 = rmin + (v - dmin) * (rmax - rmin) / (dmax - dmin);

        // call the appropropriate function
        return fns[i]([v2]);
      };
    },

    constructPostScript: function PDFFunction_constructPostScript(fn, dict,
                                                                  xref) {
      var domain = dict.get('Domain');
      var range = dict.get('Range');

      if (!domain)
        error('No domain.');

      if (!range)
        error('No range.');

      var lexer = new PostScriptLexer(fn);
      var parser = new PostScriptParser(lexer);
      var code = parser.parse();

      return [CONSTRUCT_POSTSCRIPT, domain, range, code];
    },

    constructPostScriptFromIR: function PDFFunction_constructPostScriptFromIR(
                                          IR) {
      var domain = IR[1];
      var range = IR[2];
      var code = IR[3];
      var numOutputs = range.length / 2;
      var evaluator = new PostScriptEvaluator(code);
      // Cache the values for a big speed up, the cache size is limited though
      // since the number of possible values can be huge from a PS function.
      var cache = new FunctionCache();
      return function constructPostScriptFromIRResult(args) {
        var initialStack = [];
        for (var i = 0, ii = (domain.length / 2); i < ii; ++i) {
          initialStack.push(args[i]);
        }

        var key = initialStack.join('_');
        if (cache.has(key))
          return cache.get(key);

        var stack = evaluator.execute(initialStack);
        var transformed = [];
        for (i = numOutputs - 1; i >= 0; --i) {
          var out = stack.pop();
          var rangeIndex = 2 * i;
          if (out < range[rangeIndex])
            out = range[rangeIndex];
          else if (out > range[rangeIndex + 1])
            out = range[rangeIndex + 1];
          transformed[i] = out;
        }
        cache.set(key, transformed);
        return transformed;
      };
    }
  };
})();

var FunctionCache = (function FunctionCacheClosure() {
  // Of 10 PDF's with type4 functions the maxium number of distinct values seen
  // was 256. This still may need some tweaking in the future though.
  var MAX_CACHE_SIZE = 1024;
  function FunctionCache() {
    this.cache = {};
    this.total = 0;
  }
  FunctionCache.prototype = {
    has: function FunctionCache_has(key) {
      return key in this.cache;
    },
    get: function FunctionCache_get(key) {
      return this.cache[key];
    },
    set: function FunctionCache_set(key, value) {
      if (this.total < MAX_CACHE_SIZE) {
        this.cache[key] = value;
        this.total++;
      }
    }
  };
  return FunctionCache;
})();

var PostScriptStack = (function PostScriptStackClosure() {
  var MAX_STACK_SIZE = 100;
  function PostScriptStack(initialStack) {
    this.stack = initialStack || [];
  }

  PostScriptStack.prototype = {
    push: function PostScriptStack_push(value) {
      if (this.stack.length >= MAX_STACK_SIZE)
        error('PostScript function stack overflow.');
      this.stack.push(value);
    },
    pop: function PostScriptStack_pop() {
      if (this.stack.length <= 0)
        error('PostScript function stack underflow.');
      return this.stack.pop();
    },
    copy: function PostScriptStack_copy(n) {
      if (this.stack.length + n >= MAX_STACK_SIZE)
        error('PostScript function stack overflow.');
      var stack = this.stack;
      for (var i = stack.length - n, j = n - 1; j >= 0; j--, i++)
        stack.push(stack[i]);
    },
    index: function PostScriptStack_index(n) {
      this.push(this.stack[this.stack.length - n - 1]);
    },
    // rotate the last n stack elements p times
    roll: function PostScriptStack_roll(n, p) {
      var stack = this.stack;
      var l = stack.length - n;
      var r = stack.length - 1, c = l + (p - Math.floor(p / n) * n), i, j, t;
      for (i = l, j = r; i < j; i++, j--) {
        t = stack[i]; stack[i] = stack[j]; stack[j] = t;
      }
      for (i = l, j = c - 1; i < j; i++, j--) {
        t = stack[i]; stack[i] = stack[j]; stack[j] = t;
      }
      for (i = c, j = r; i < j; i++, j--) {
        t = stack[i]; stack[i] = stack[j]; stack[j] = t;
      }
    }
  };
  return PostScriptStack;
})();
var PostScriptEvaluator = (function PostScriptEvaluatorClosure() {
  function PostScriptEvaluator(operators, operands) {
    this.operators = operators;
    this.operands = operands;
  }
  PostScriptEvaluator.prototype = {
    execute: function PostScriptEvaluator_execute(initialStack) {
      var stack = new PostScriptStack(initialStack);
      var counter = 0;
      var operators = this.operators;
      var length = operators.length;
      var operator, a, b;
      while (counter < length) {
        operator = operators[counter++];
        if (typeof operator == 'number') {
          // Operator is really an operand and should be pushed to the stack.
          stack.push(operator);
          continue;
        }
        switch (operator) {
          // non standard ps operators
          case 'jz': // jump if false
            b = stack.pop();
            a = stack.pop();
            if (!a)
              counter = b;
            break;
          case 'j': // jump
            a = stack.pop();
            counter = a;
            break;

          // all ps operators in alphabetical order (excluding if/ifelse)
          case 'abs':
            a = stack.pop();
            stack.push(Math.abs(a));
            break;
          case 'add':
            b = stack.pop();
            a = stack.pop();
            stack.push(a + b);
            break;
          case 'and':
            b = stack.pop();
            a = stack.pop();
            if (isBool(a) && isBool(b))
              stack.push(a && b);
            else
              stack.push(a & b);
            break;
          case 'atan':
            a = stack.pop();
            stack.push(Math.atan(a));
            break;
          case 'bitshift':
            b = stack.pop();
            a = stack.pop();
            if (a > 0)
              stack.push(a << b);
            else
              stack.push(a >> b);
            break;
          case 'ceiling':
            a = stack.pop();
            stack.push(Math.ceil(a));
            break;
          case 'copy':
            a = stack.pop();
            stack.copy(a);
            break;
          case 'cos':
            a = stack.pop();
            stack.push(Math.cos(a));
            break;
          case 'cvi':
            a = stack.pop() | 0;
            stack.push(a);
            break;
          case 'cvr':
            // noop
            break;
          case 'div':
            b = stack.pop();
            a = stack.pop();
            stack.push(a / b);
            break;
          case 'dup':
            stack.copy(1);
            break;
          case 'eq':
            b = stack.pop();
            a = stack.pop();
            stack.push(a == b);
            break;
          case 'exch':
            stack.roll(2, 1);
            break;
          case 'exp':
            b = stack.pop();
            a = stack.pop();
            stack.push(Math.pow(a, b));
            break;
          case 'false':
            stack.push(false);
            break;
          case 'floor':
            a = stack.pop();
            stack.push(Math.floor(a));
            break;
          case 'ge':
            b = stack.pop();
            a = stack.pop();
            stack.push(a >= b);
            break;
          case 'gt':
            b = stack.pop();
            a = stack.pop();
            stack.push(a > b);
            break;
          case 'idiv':
            b = stack.pop();
            a = stack.pop();
            stack.push((a / b) | 0);
            break;
          case 'index':
            a = stack.pop();
            stack.index(a);
            break;
          case 'le':
            b = stack.pop();
            a = stack.pop();
            stack.push(a <= b);
            break;
          case 'ln':
            a = stack.pop();
            stack.push(Math.log(a));
            break;
          case 'log':
            a = stack.pop();
            stack.push(Math.log(a) / Math.LN10);
            break;
          case 'lt':
            b = stack.pop();
            a = stack.pop();
            stack.push(a < b);
            break;
          case 'mod':
            b = stack.pop();
            a = stack.pop();
            stack.push(a % b);
            break;
          case 'mul':
            b = stack.pop();
            a = stack.pop();
            stack.push(a * b);
            break;
          case 'ne':
            b = stack.pop();
            a = stack.pop();
            stack.push(a != b);
            break;
          case 'neg':
            a = stack.pop();
            stack.push(-b);
            break;
          case 'not':
            a = stack.pop();
            if (isBool(a) && isBool(b))
              stack.push(a && b);
            else
              stack.push(a & b);
            break;
          case 'or':
            b = stack.pop();
            a = stack.pop();
            if (isBool(a) && isBool(b))
              stack.push(a || b);
            else
              stack.push(a | b);
            break;
          case 'pop':
            stack.pop();
            break;
          case 'roll':
            b = stack.pop();
            a = stack.pop();
            stack.roll(a, b);
            break;
          case 'round':
            a = stack.pop();
            stack.push(Math.round(a));
            break;
          case 'sin':
            a = stack.pop();
            stack.push(Math.sin(a));
            break;
          case 'sqrt':
            a = stack.pop();
            stack.push(Math.sqrt(a));
            break;
          case 'sub':
            b = stack.pop();
            a = stack.pop();
            stack.push(a - b);
            break;
          case 'true':
            stack.push(true);
            break;
          case 'truncate':
            a = stack.pop();
            a = a < 0 ? Math.ceil(a) : Math.floor(a);
            stack.push(a);
            break;
          case 'xor':
            b = stack.pop();
            a = stack.pop();
            if (isBool(a) && isBool(b))
              stack.push(a != b);
            else
              stack.push(a ^ b);
            break;
          default:
            error('Unknown operator ' + operator);
            break;
        }
      }
      return stack.stack;
    }
  };
  return PostScriptEvaluator;
})();

var PostScriptParser = (function PostScriptParserClosure() {
  function PostScriptParser(lexer) {
    this.lexer = lexer;
    this.operators = [];
    this.token;
    this.prev;
  }
  PostScriptParser.prototype = {
    nextToken: function PostScriptParser_nextToken() {
      this.prev = this.token;
      this.token = this.lexer.getToken();
    },
    accept: function PostScriptParser_accept(type) {
      if (this.token.type == type) {
        this.nextToken();
        return true;
      }
      return false;
    },
    expect: function PostScriptParser_expect(type) {
      if (this.accept(type))
        return true;
      error('Unexpected symbol: found ' + this.token.type + ' expected ' +
            type + '.');
    },
    parse: function PostScriptParser_parse() {
      this.nextToken();
      this.expect(PostScriptTokenTypes.LBRACE);
      this.parseBlock();
      this.expect(PostScriptTokenTypes.RBRACE);
      return this.operators;
    },
    parseBlock: function PostScriptParser_parseBlock() {
      while (true) {
        if (this.accept(PostScriptTokenTypes.NUMBER)) {
          this.operators.push(this.prev.value);
        } else if (this.accept(PostScriptTokenTypes.OPERATOR)) {
          this.operators.push(this.prev.value);
        } else if (this.accept(PostScriptTokenTypes.LBRACE)) {
          this.parseCondition();
        } else {
          return;
        }
      }
    },
    parseCondition: function PostScriptParser_parseCondition() {
      // Add two place holders that will be updated later
      var conditionLocation = this.operators.length;
      this.operators.push(null, null);

      this.parseBlock();
      this.expect(PostScriptTokenTypes.RBRACE);
      if (this.accept(PostScriptTokenTypes.IF)) {
        // The true block is right after the 'if' so it just falls through on
        // true else it jumps and skips the true block.
        this.operators[conditionLocation] = this.operators.length;
        this.operators[conditionLocation + 1] = 'jz';
      } else if (this.accept(PostScriptTokenTypes.LBRACE)) {
        var jumpLocation = this.operators.length;
        this.operators.push(null, null);
        var endOfTrue = this.operators.length;
        this.parseBlock();
        this.expect(PostScriptTokenTypes.RBRACE);
        this.expect(PostScriptTokenTypes.IFELSE);
        // The jump is added at the end of the true block to skip the false
        // block.
        this.operators[jumpLocation] = this.operators.length;
        this.operators[jumpLocation + 1] = 'j';

        this.operators[conditionLocation] = endOfTrue;
        this.operators[conditionLocation + 1] = 'jz';
      } else {
        error('PS Function: error parsing conditional.');
      }
    }
  };
  return PostScriptParser;
})();

var PostScriptTokenTypes = {
  LBRACE: 0,
  RBRACE: 1,
  NUMBER: 2,
  OPERATOR: 3,
  IF: 4,
  IFELSE: 5
};

var PostScriptToken = (function PostScriptTokenClosure() {
  function PostScriptToken(type, value) {
    this.type = type;
    this.value = value;
  }

  var opCache = {};

  PostScriptToken.getOperator = function PostScriptToken_getOperator(op) {
    var opValue = opCache[op];
    if (opValue)
      return opValue;

    return opCache[op] = new PostScriptToken(PostScriptTokenTypes.OPERATOR, op);
  };

  PostScriptToken.LBRACE = new PostScriptToken(PostScriptTokenTypes.LBRACE,
                                                '{');
  PostScriptToken.RBRACE = new PostScriptToken(PostScriptTokenTypes.RBRACE,
                                                '}');
  PostScriptToken.IF = new PostScriptToken(PostScriptTokenTypes.IF, 'IF');
  PostScriptToken.IFELSE = new PostScriptToken(PostScriptTokenTypes.IFELSE,
                                                'IFELSE');
  return PostScriptToken;
})();

var PostScriptLexer = (function PostScriptLexerClosure() {
  function PostScriptLexer(stream) {
    this.stream = stream;
  }
  PostScriptLexer.prototype = {
    getToken: function PostScriptLexer_getToken() {
      var s = '';
      var ch;
      var comment = false;
      var stream = this.stream;

      // skip comments
      while (true) {
        if (!(ch = stream.getChar()))
          return EOF;

        if (comment) {
          if (ch == '\x0a' || ch == '\x0d')
            comment = false;
        } else if (ch == '%') {
          comment = true;
        } else if (!Lexer.isSpace(ch)) {
          break;
        }
      }
      switch (ch) {
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
        case '+': case '-': case '.':
          return new PostScriptToken(PostScriptTokenTypes.NUMBER,
                                      this.getNumber(ch));
        case '{':
          return PostScriptToken.LBRACE;
        case '}':
          return PostScriptToken.RBRACE;
      }
      // operator
      var str = ch.toLowerCase();
      while (true) {
        ch = stream.lookChar();
        if (ch === null)
          break;
        ch = ch.toLowerCase();
        if (ch >= 'a' && ch <= 'z')
          str += ch;
        else
          break;
        stream.skip();
      }
      switch (str) {
        case 'if':
          return PostScriptToken.IF;
        case 'ifelse':
          return PostScriptToken.IFELSE;
        default:
          return PostScriptToken.getOperator(str);
      }
    },
    getNumber: function PostScriptLexer_getNumber(ch) {
      var str = ch;
      var stream = this.stream;
      while (true) {
        ch = stream.lookChar();
        if ((ch >= '0' && ch <= '9') || ch == '-' || ch == '.')
          str += ch;
        else
          break;
        stream.skip();
      }
      var value = parseFloat(str);
      if (isNaN(value))
        error('Invalid floating point number: ' + value);
      return value;
    }
  };
  return PostScriptLexer;
})();



var ISOAdobeCharset = [
  '.notdef', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar',
  'percent', 'ampersand', 'quoteright', 'parenleft', 'parenright',
  'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question',
  'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
  'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'braceleft', 'bar', 'braceright', 'asciitilde', 'exclamdown', 'cent',
  'sterling', 'fraction', 'yen', 'florin', 'section', 'currency',
  'quotesingle', 'quotedblleft', 'guillemotleft', 'guilsinglleft',
  'guilsinglright', 'fi', 'fl', 'endash', 'dagger', 'daggerdbl',
  'periodcentered', 'paragraph', 'bullet', 'quotesinglbase',
  'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis',
  'perthousand', 'questiondown', 'grave', 'acute', 'circumflex', 'tilde',
  'macron', 'breve', 'dotaccent', 'dieresis', 'ring', 'cedilla',
  'hungarumlaut', 'ogonek', 'caron', 'emdash', 'AE', 'ordfeminine',
  'Lslash', 'Oslash', 'OE', 'ordmasculine', 'ae', 'dotlessi', 'lslash',
  'oslash', 'oe', 'germandbls', 'onesuperior', 'logicalnot', 'mu',
  'trademark', 'Eth', 'onehalf', 'plusminus', 'Thorn', 'onequarter',
  'divide', 'brokenbar', 'degree', 'thorn', 'threequarters', 'twosuperior',
  'registered', 'minus', 'eth', 'multiply', 'threesuperior', 'copyright',
  'Aacute', 'Acircumflex', 'Adieresis', 'Agrave', 'Aring', 'Atilde',
  'Ccedilla', 'Eacute', 'Ecircumflex', 'Edieresis', 'Egrave', 'Iacute',
  'Icircumflex', 'Idieresis', 'Igrave', 'Ntilde', 'Oacute', 'Ocircumflex',
  'Odieresis', 'Ograve', 'Otilde', 'Scaron', 'Uacute', 'Ucircumflex',
  'Udieresis', 'Ugrave', 'Yacute', 'Ydieresis', 'Zcaron', 'aacute',
  'acircumflex', 'adieresis', 'agrave', 'aring', 'atilde', 'ccedilla',
  'eacute', 'ecircumflex', 'edieresis', 'egrave', 'iacute', 'icircumflex',
  'idieresis', 'igrave', 'ntilde', 'oacute', 'ocircumflex', 'odieresis',
  'ograve', 'otilde', 'scaron', 'uacute', 'ucircumflex', 'udieresis',
  'ugrave', 'yacute', 'ydieresis', 'zcaron'
];

var ExpertCharset = [
  '.notdef', 'space', 'exclamsmall', 'Hungarumlautsmall', 'dollaroldstyle',
  'dollarsuperior', 'ampersandsmall', 'Acutesmall', 'parenleftsuperior',
  'parenrightsuperior', 'twodotenleader', 'onedotenleader', 'comma',
  'hyphen', 'period', 'fraction', 'zerooldstyle', 'oneoldstyle',
  'twooldstyle', 'threeoldstyle', 'fouroldstyle', 'fiveoldstyle',
  'sixoldstyle', 'sevenoldstyle', 'eightoldstyle', 'nineoldstyle',
  'colon', 'semicolon', 'commasuperior', 'threequartersemdash',
  'periodsuperior', 'questionsmall', 'asuperior', 'bsuperior',
  'centsuperior', 'dsuperior', 'esuperior', 'isuperior', 'lsuperior',
  'msuperior', 'nsuperior', 'osuperior', 'rsuperior', 'ssuperior',
  'tsuperior', 'ff', 'fi', 'fl', 'ffi', 'ffl', 'parenleftinferior',
  'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall',
  'Asmall', 'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall',
  'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall', 'Msmall', 'Nsmall',
  'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall',
  'Vsmall', 'Wsmall', 'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary',
  'onefitted', 'rupiah', 'Tildesmall', 'exclamdownsmall', 'centoldstyle',
  'Lslashsmall', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall',
  'Brevesmall', 'Caronsmall', 'Dotaccentsmall', 'Macronsmall',
  'figuredash', 'hypheninferior', 'Ogoneksmall', 'Ringsmall',
  'Cedillasmall', 'onequarter', 'onehalf', 'threequarters',
  'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths',
  'seveneighths', 'onethird', 'twothirds', 'zerosuperior', 'onesuperior',
  'twosuperior', 'threesuperior', 'foursuperior', 'fivesuperior',
  'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior',
  'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior',
  'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior',
  'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior',
  'periodinferior', 'commainferior', 'Agravesmall', 'Aacutesmall',
  'Acircumflexsmall', 'Atildesmall', 'Adieresissmall', 'Aringsmall',
  'AEsmall', 'Ccedillasmall', 'Egravesmall', 'Eacutesmall',
  'Ecircumflexsmall', 'Edieresissmall', 'Igravesmall', 'Iacutesmall',
  'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall',
  'Ogravesmall', 'Oacutesmall', 'Ocircumflexsmall', 'Otildesmall',
  'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall', 'Uacutesmall',
  'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall',
  'Ydieresissmall'
];

var ExpertSubsetCharset = [
  '.notdef', 'space', 'dollaroldstyle', 'dollarsuperior',
  'parenleftsuperior', 'parenrightsuperior', 'twodotenleader',
  'onedotenleader', 'comma', 'hyphen', 'period', 'fraction',
  'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle',
  'fouroldstyle', 'fiveoldstyle', 'sixoldstyle', 'sevenoldstyle',
  'eightoldstyle', 'nineoldstyle', 'colon', 'semicolon', 'commasuperior',
  'threequartersemdash', 'periodsuperior', 'asuperior', 'bsuperior',
  'centsuperior', 'dsuperior', 'esuperior', 'isuperior', 'lsuperior',
  'msuperior', 'nsuperior', 'osuperior', 'rsuperior', 'ssuperior',
  'tsuperior', 'ff', 'fi', 'fl', 'ffi', 'ffl', 'parenleftinferior',
  'parenrightinferior', 'hyphensuperior', 'colonmonetary', 'onefitted',
  'rupiah', 'centoldstyle', 'figuredash', 'hypheninferior', 'onequarter',
  'onehalf', 'threequarters', 'oneeighth', 'threeeighths', 'fiveeighths',
  'seveneighths', 'onethird', 'twothirds', 'zerosuperior', 'onesuperior',
  'twosuperior', 'threesuperior', 'foursuperior', 'fivesuperior',
  'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior',
  'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior',
  'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior',
  'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior',
  'periodinferior', 'commainferior'
];



var CIDToUnicodeMaps = {
  'Adobe-Japan1': [[32, 160], {f: 12, c: 33}, [45, 8209], {f: 46, c: 46}, 165,
    {f: 2, c: 93}, [95, 818], [96, 768], {f: 27, c: 97}, 166, 125, [732, 771],
    [700, 8217], 92, [699, 8216], 124, [126, 8764], {f: 3, c: 161}, 8260, 402,
    0, 164, 8220, 171, {f: 2, c: 8249}, {f: 2, c: 64257}, [8210, 8211], 0, 0,
    [183, 8729], 0, 8226, 8218, 8222, 8221, 187, 0, 0, 191, {f: 2, c: 769},
    [175, 772], {f: 3, c: 774}, 778, [184, 807], 779, 808, 780, [822, 8212],
    198, 170, 321, 216, 338, 186, 230, 305, 322, 248, 339, 223, 173, 169, 172,
    174, 0, 0, {f: 2, c: 178}, 181, 185, {f: 3, c: 188}, {f: 6, c: 192},
    {f: 16, c: 199}, 0, {f: 6, c: 217}, {f: 6, c: 224}, {f: 16, c: 231}, 0,
    {f: 7, c: 249}, 352, 376, 381, [773, 8254], 353, 8482, 382, 0, 8194,
    {s: 91}, 65512, {s: 3}, {f: 63, c: 65377}, {s: 243}, [8195, 12288],
    {f: 2, c: 12289}, 65292, 65294, 12539, {f: 2, c: 65306}, 65311, 65281,
    {f: 2, c: 12443}, 180, 65344, 168, 65342, 65507, 65343, {f: 2, c: 12541},
    {f: 2, c: 12445}, 12291, 20189, {f: 3, c: 12293}, 12540, 8213, 8208, 65295,
    65340, [12316, 65374], 8214, 65372, 8230, 8229, {s: 4}, {f: 2, c: 65288},
    {f: 2, c: 12308}, 65339, 65341, 65371, 65373, {f: 10, c: 12296}, 65291,
    [8722, 65293], 177, 215, 247, 65309, 8800, 65308, 65310, {f: 2, c: 8806},
    8734, 8756, 9794, 9792, 176, {f: 2, c: 8242}, 8451, 65509, 65284,
    {f: 2, c: 65504}, 65285, 65283, 65286, 65290, 65312, 167, 9734, 9733, 9675,
    9679, 9678, 9671, 9670, 9633, 9632, 9651, 9650, 9661, 9660, 8251, 12306,
    8594, {f: 2, c: 8592}, 8595, 12307, 8712, 8715, {f: 2, c: 8838},
    {f: 2, c: 8834}, 8746, 8745, {f: 2, c: 8743}, 65506, 8658, 8660, 8704,
    8707, 8736, 8869, 8978, 8706, 8711, 8801, 8786, {f: 2, c: 8810}, 8730,
    8765, 8733, 8757, {f: 2, c: 8747}, 8491, 8240, 9839, 9837, 9834,
    {f: 2, c: 8224}, 182, 9711, {f: 10, c: 65296}, {f: 26, c: 65313},
    {f: 26, c: 65345}, {f: 83, c: 12353}, {f: 86, c: 12449}, {f: 17, c: 913},
    {f: 7, c: 931}, {f: 17, c: 945}, {f: 7, c: 963}, {f: 6, c: 1040}, 1025,
    {f: 32, c: 1046}, 1105, {f: 26, c: 1078}, 20124, 21782, 23043, 38463,
    21696, 24859, 25384, 23030, 36898, 33909, 33564, 31312, 24746, 25569,
    28197, 26093, 33894, 33446, 39925, 26771, 22311, 26017, 25201, 23451,
    22992, 34427, 39156, 32098, 32190, 39822, 25110, 31903, 34999, 23433,
    24245, 25353, 26263, 26696, 38343, 38797, 26447, 20197, 20234, 20301,
    20381, 20553, 22258, 22839, 22996, 23041, 23561, 24799, 24847, 24944,
    26131, 26885, 28858, 30031, 30064, 31227, 32173, 32239, 32963, 33806,
    [12176, 34915], 35586, 36949, 36986, 21307, 20117, 20133, 22495, 32946,
    37057, 30959, [12032, 19968], 22769, 28322, 36920, 31282, 33576, 33419,
    39983, 20801, 21360, 21693, 21729, 22240, 23035, 24341, 39154, 28139,
    32996, 34093, 38498, 38512, 38560, 38907, 21515, 21491, 23431, 28879,
    [12155, 32701], 36802, [12204, 38632], 21359, 40284, 31418, 19985, 30867,
    [12165, 33276], 28198, 22040, 21764, 27421, 34074, 39995, 23013, 21417,
    28006, [12128, 29916], 38287, 22082, 20113, 36939, 38642, 33615, 39180,
    21473, 21942, 23344, 24433, 26144, 26355, 26628, 27704, 27891, 27945,
    29787, 30408, 31310, 38964, 33521, 34907, 35424, 37613, 28082, 30123,
    30410, 39365, 24742, 35585, 36234, 38322, 27022, 21421, 20870, 22290,
    22576, 22852, 23476, 24310, 24616, 25513, 25588, 27839, 28436, 28814,
    28948, 29017, 29141, 29503, 32257, 33398, 33489, 34199, 36960, 37467,
    40219, 22633, 26044, 27738, 29989, 20985, 22830, 22885, 24448, 24540,
    25276, 26106, 27178, 27431, 27572, 29579, 32705, 35158, 40236, 40206,
    [12009, 40644], 23713, 27798, 33659, 20740, 23627, 25014, 33222, 26742,
    29281, [12036, 20057], 20474, 21368, 24681, 28201, 31311, [12211, 38899],
    19979, 21270, 20206, 20309, 20285, 20385, 20339, 21152, 21487, 22025,
    22799, 23233, 23478, 23521, 31185, 26247, 26524, 26550, 27468, 27827,
    [12117, 28779], 29634, 31117, [12146, 31166], 31292, 31623, 33457, 33499,
    33540, 33655, 33775, 33747, 34662, 35506, 22057, 36008, 36838, 36942,
    38686, 34442, 20420, 23784, 25105, [12123, 29273], 30011, 33253, 33469,
    34558, 36032, 38597, 39187, 39381, 20171, 20250, 35299, 22238, 22602,
    22730, 24315, 24555, 24618, 24724, 24674, 25040, 25106, 25296, 25913,
    39745, 26214, 26800, 28023, 28784, 30028, 30342, 32117, 33445, 34809,
    38283, 38542, [12185, 35997], 20977, 21182, 22806, 21683, 23475, 23830,
    24936, 27010, 28079, 30861, 33995, 34903, 35442, 37799, 39608, 28012,
    39336, 34521, 22435, 26623, 34510, 37390, 21123, 22151, 21508, 24275,
    25313, 25785, 26684, 26680, 27579, 29554, 30906, 31339, 35226,
    [12179, 35282], 36203, 36611, 37101, 38307, 38548, [12208, 38761], 23398,
    23731, 27005, {f: 2, c: 38989}, 25499, 31520, 27179, 27263, 26806, 39949,
    28511, 21106, 21917, 24688, 25324, 27963, 28167, 28369, 33883, 35088,
    36676, 19988, 39993, 21494, 26907, 27194, 38788, 26666, 20828, 31427,
    33970, 37340, 37772, 22107, 40232, 26658, 33541, 33841, 31909, 21000,
    33477, [12129, 29926], 20094, 20355, 20896, 23506, 21002, 21208, 21223,
    24059, 21914, 22570, 23014, 23436, 23448, 23515, [12082, 24178], 24185,
    24739, 24863, 24931, 25022, 25563, 25954, 26577, 26707, 26874, 27454,
    27475, 27735, 28450, 28567, 28485, 29872, [12130, 29976], 30435, 30475,
    31487, 31649, 31777, 32233, [12152, 32566], 32752, 32925, 33382, 33694,
    35251, 35532, 36011, 36996, 37969, 38291, 38289, 38306, 38501, 38867,
    39208, 33304, 20024, 21547, 23736, 24012, 29609, 30284, 30524, 23721,
    32747, 36107, 38593, 38929, 38996, 39000, 20225, 20238, 21361, 21916,
    22120, 22522, 22855, 23305, 23492, 23696, 24076, 24190, 24524, 25582,
    26426, 26071, 26082, 26399, 26827, 26820, 27231, 24112, 27589, 27671,
    27773, 30079, 31048, 23395, 31232, 32000, 24509, 35215, 35352, 36020,
    36215, 36556, 36637, 39138, 39438, [12004, 12225, 39740], [12018, 20096],
    20605, 20736, 22931, 23452, 25135, 25216, 25836, 27450, 29344, 30097,
    31047, 32681, 34811, 35516, 35696, 25516, 33738, 38816, 21513, 21507,
    21931, 26708, 27224, 35440, 30759, 26485, [12233, 40653], 21364, 23458,
    33050, 34384, 36870, 19992, 20037, 20167, 20241, 21450, 21560, 23470,
    [12088, 24339], 24613, 25937, 26429, 27714, 27762, 27875, 28792, 29699,
    31350, 31406, 31496, 32026, 31998, 32102, 26087, [12124, 29275], 21435,
    23621, 24040, 25298, 25312, 25369, 28192, 34394, 35377, 36317, 37624,
    28417, 31142, [12226, 39770], 20136, {f: 2, c: 20139}, 20379, 20384, 20689,
    20807, 31478, 20849, 20982, 21332, 21281, 21375, 21483, 21932, 22659,
    23777, 24375, 24394, 24623, 24656, 24685, 25375, 25945, 27211, 27841,
    29378, 29421, 30703, 33016, 33029, 33288, 34126, 37111, 37857, 38911,
    39255, 39514, 20208, 20957, 23597, 26241, 26989, 23616, 26354, 26997,
    [12127, 29577], 26704, 31873, 20677, 21220, 22343, [12081, 24062], 37670,
    [12100, 26020], 27427, 27453, 29748, 31105, 31165, 31563, 32202, 33465,
    33740, 34943, 35167, 35641, 36817, [12198, 37329], 21535, 37504, 20061,
    20534, 21477, 21306, 29399, 29590, 30697, 33510, 36527, 39366, 39368,
    39378, 20855, 24858, 34398, 21936, 31354, 20598, 23507, 36935, 38533,
    20018, 27355, 37351, 23633, 23624, 25496, 31391, 27795, 38772, 36705,
    31402, 29066, 38536, 31874, 26647, 32368, 26705, 37740, 21234, 21531,
    34219, 35347, 32676, 36557, 37089, 21350, 34952, 31041, 20418, 20670,
    21009, 20804, 21843, 22317, 29674, 22411, 22865, 24418, 24452, 24693,
    24950, 24935, 25001, 25522, 25658, 25964, 26223, 26690, 28179, 30054,
    31293, 31995, 32076, 32153, 32331, 32619, 33550, 33610, 34509, 35336,
    35427, 35686, 36605, 38938, 40335, 33464, 36814, 39912, 21127, 25119,
    25731, 28608, 38553, 26689, 20625, [12107, 27424], 27770, 28500,
    [12147, 31348], 32080, [12174, 34880], 35363, [12105, 26376], 20214, 20537,
    20518, 20581, 20860, 21048, 21091, 21927, 22287, 22533, 23244, 24314,
    25010, 25080, 25331, 25458, 26908, 27177, 29309, [12125, 29356], 29486,
    30740, 30831, 32121, 30476, 32937, [12178, 35211], 35609, 36066, 36562,
    36963, 37749, 38522, 38997, 39443, 40568, 20803, 21407, 21427, 24187,
    24358, 28187, 28304, [12126, 29572], 29694, 32067, 33335, [12180, 35328],
    35578, 38480, 20046, 20491, 21476, 21628, 22266, 22993, 23396,
    [12080, 24049], 24235, 24359, [12094, 25144], 25925, 26543, 28246, 29392,
    31946, 34996, 32929, 32993, 33776, [11969, 34382], 35463, 36328, 37431,
    38599, 39015, [12238, 40723], 20116, 20114, 20237, 21320, 21577, 21566,
    23087, 24460, 24481, 24735, 26791, 27278, 29786, 30849, 35486, 35492,
    35703, 37264, 20062, 39881, 20132, 20348, 20399, 20505, 20502, 20809,
    20844, 21151, 21177, 21246, 21402, [12061, 21475], 21521, 21518, 21897,
    22353, 22434, 22909, 23380, 23389, 23439, [12079, 24037], 24039, 24055,
    24184, 24195, 24218, 24247, 24344, 24658, 24908, 25239, 25304, 25511,
    25915, 26114, 26179, 26356, 26477, 26657, 26775, 27083, 27743, 27946,
    28009, 28207, 28317, 30002, 30343, 30828, 31295, 31968, 32005, 32024,
    32094, 32177, 32789, 32771, 32943, 32945, 33108, 33167, 33322, 33618,
    [12175, 34892], 34913, 35611, 36002, 36092, 37066, 37237, 37489, 30783,
    37628, 38308, 38477, 38917, [12217, 39321], [12220, 39640], 40251, 21083,
    21163, 21495, 21512, 22741, 25335, 28640, 35946, 36703, 40633, 20811,
    21051, 21578, 22269, 31296, 37239, 40288, [12234, 40658], 29508, 28425,
    33136, 29969, 24573, 24794, [12219, 39592], 29403, 36796, 27492, 38915,
    20170, 22256, 22372, 22718, 23130, 24680, 25031, 26127, 26118, 26681,
    26801, 28151, 30165, 32058, [12169, 33390], 39746, 20123, 20304, 21449,
    21766, 23919, 24038, 24046, 26619, 27801, 29811, 30722, 35408, 37782,
    35039, 22352, 24231, 25387, 20661, 20652, 20877, 26368, 21705, 22622,
    22971, 23472, 24425, 25165, 25505, 26685, 27507, 28168, 28797, 37319,
    29312, 30741, 30758, 31085, 25998, 32048, 33756, 35009, 36617, 38555,
    21092, 22312, 26448, 32618, 36001, 20916, 22338, 38442, 22586, 27018,
    32948, 21682, 23822, 22524, 30869, 40442, 20316, 21066, 21643, 25662,
    26152, 26388, 26613, 31364, 31574, 32034, 37679, 26716, 39853, 31545,
    21273, 20874, 21047, 23519, 25334, 25774, 25830, 26413, 27578, 34217,
    38609, 30352, 39894, 25420, 37638, 39851, [12139, 30399], 26194, 19977,
    20632, 21442, [12077, 23665], 24808, 25746, 25955, 26719, 29158, 29642,
    29987, 31639, 32386, 34453, 35715, 36059, 37240, 39184, 26028, 26283,
    27531, 20181, 20180, 20282, 20351, 21050, 21496, 21490, 21987, 22235,
    [12064, 22763], 22987, 22985, 23039, [12070, 23376], 23629, 24066, 24107,
    24535, 24605, 25351, [12096, 25903], 23388, 26031, 26045, 26088, 26525,
    [12108, 27490], 27515, [12114, 27663], 29509, 31049, 31169, [12151, 31992],
    32025, 32043, 32930, 33026, [12164, 33267], 35222, 35422, 35433, 35430,
    35468, 35566, 36039, 36060, 38604, 39164, [12013, 27503], 20107, 20284,
    20365, 20816, 23383, 23546, 24904, 25345, 26178, 27425, 28363, 27835,
    29246, 29885, 30164, 30913, [12144, 31034], [12157, 32780], [12159, 32819],
    [12163, 33258], 33940, 36766, 27728, [12229, 40575], 24335, 35672, 40235,
    31482, 36600, 23437, 38635, 19971, 21489, 22519, 22833, 23241, 23460,
    24713, 28287, 28422, 30142, 36074, 23455, 34048, 31712, 20594, 26612,
    33437, 23649, 34122, 32286, 33294, 20889, 23556, 25448, 36198, 26012,
    29038, 31038, 32023, 32773, 35613, [12190, 36554], 36974, 34503, 37034,
    20511, 21242, 23610, 26451, 28796, 29237, 37196, 37320, 37675, 33509,
    23490, 24369, 24825, 20027, 21462, 23432, [12095, 25163], 26417, 27530,
    29417, 29664, 31278, 33131, 36259, 37202, [12216, 39318], 20754, 21463,
    21610, 23551, 25480, 27193, 32172, 38656, 22234, 21454, 21608, 23447,
    23601, 24030, 20462, 24833, 25342, 27954, 31168, 31179, 32066, 32333,
    32722, 33261, [12168, 33311], 33936, 34886, 35186, 35728, 36468, 36655,
    36913, 37195, 37228, 38598, 37276, 20160, 20303, 20805, [12055, 21313],
    24467, 25102, 26580, 27713, 28171, 29539, 32294, 37325, 37507, 21460,
    22809, 23487, 28113, 31069, 32302, 31899, 22654, 29087, 20986, 34899,
    36848, 20426, 23803, 26149, 30636, 31459, 33308, 39423, 20934, 24490,
    26092, 26991, 27529, 28147, 28310, 28516, 30462, 32020, 24033, 36981,
    37255, 38918, 20966, 21021, 25152, 26257, 26329, 28186, 24246, 32210,
    32626, 26360, 34223, 34295, 35576, 21161, 21465, [12069, 22899], 24207,
    24464, 24661, 37604, 38500, 20663, 20767, 21213, 21280, 21319, 21484,
    21736, 21830, 21809, 22039, 22888, 22974, 23100, 23477, 23558,
    [12073, 23567], 23569, 23578, 24196, 24202, 24288, 24432, 25215, 25220,
    25307, 25484, 25463, 26119, 26124, 26157, 26230, 26494, 26786, 27167,
    27189, 27836, 28040, 28169, 28248, 28988, 28966, 29031, 30151, 30465,
    30813, 30977, 31077, 31216, 31456, 31505, 31911, 32057, 32918, 33750,
    33931, 34121, 34909, 35059, 35359, 35388, 35412, 35443, 35937, 36062,
    37284, 37478, 37758, 37912, 38556, 38808, 19978, 19976, 19998, 20055,
    20887, 21104, 22478, 22580, 22732, 23330, 24120, 24773, 25854, 26465,
    26454, 27972, 29366, 30067, 31331, 33976, 35698, 37304, 37664, 22065,
    22516, 39166, 25325, 26893, 27542, 29165, 32340, 32887, [12170, 33394],
    35302, [12215, 39135], 34645, 36785, 23611, 20280, 20449, 20405, 21767,
    23072, 23517, 23529, [12092, 24515], 24910, 25391, 26032, 26187, 26862,
    27035, 28024, 28145, 30003, 30137, 30495, 31070, 31206, 32051,
    [12162, 33251], 33455, 34218, 35242, 35386, [12189, 36523], [12191, 36763],
    36914, 37341, 38663, [12040, 20154], 20161, 20995, 22645, 22764, 23563,
    29978, 23613, 33102, 35338, 36805, 38499, 38765, 31525, 35535, 38920,
    37218, 22259, 21416, 36887, 21561, 22402, 24101, 25512, [12116, 27700],
    28810, 30561, 31883, 32736, 34928, 36930, 37204, 37648, 37656, 38543,
    29790, 39620, 23815, 23913, 25968, 26530, 36264, 38619, 25454, 26441,
    26905, 33733, 38935, 38592, 35070, 28548, 25722, [12072, 23544], 19990,
    28716, 30045, 26159, 20932, 21046, 21218, 22995, 24449, 24615, 25104,
    25919, 25972, 26143, 26228, 26866, 26646, 27491, 28165, 29298,
    [12131, 29983], 30427, 31934, 32854, 22768, 35069, [11972, 35199], 35488,
    35475, 35531, 36893, 37266, [11992, 38738], 38745, [12011, 25993], 31246,
    33030, 38587, 24109, 24796, 25114, 26021, 26132, 26512, [12143, 30707],
    31309, 31821, 32318, 33034, 36012, [12186, 36196], 36321, 36447, 30889,
    20999, 25305, 25509, 25666, 25240, 35373, 31363, 31680, 35500, 38634,
    32118, [12166, 33292], 34633, 20185, 20808, 21315, 21344, 23459, 23554,
    23574, 24029, 25126, 25159, 25776, 26643, 26676, 27849, 27973, 27927,
    26579, 28508, 29006, 29053, 26059, 31359, 31661, 32218, 32330, 32680,
    33146, [12167, 33307], 33337, 34214, 35438, 36046, 36341, 36984, 36983,
    37549, 37521, 38275, 39854, 21069, 21892, 28472, 28982, 20840, 31109,
    32341, 33203, 31950, 22092, 22609, 23720, 25514, 26366, 26365, 26970,
    29401, 30095, 30094, 30990, 31062, 31199, 31895, 32032, 32068, 34311,
    35380, 38459, 36961, [12239, 40736], 20711, 21109, 21452, 21474, 20489,
    21930, 22766, 22863, 29245, 23435, 23652, 21277, 24803, 24819, 25436,
    25475, 25407, 25531, 25805, 26089, 26361, 24035, 27085, 27133, 28437,
    29157, 20105, 30185, 30456, 31379, 31967, 32207, 32156, 32865, 33609,
    33624, 33900, 33980, 34299, 35013, [12187, 36208], 36865, 36973, 37783,
    38684, 39442, 20687, 22679, 24974, 33235, 34101, 36104, 36896, 20419,
    20596, 21063, 21363, 24687, 25417, 26463, 28204, [12188, 36275], 36895,
    20439, 23646, 36042, 26063, 32154, 21330, 34966, 20854, 25539, 23384,
    23403, 23562, 25613, 26449, 36956, 20182, 22810, 22826, 27760, 35409,
    21822, 22549, 22949, 24816, 25171, 26561, 33333, 26965, 38464, 39364,
    39464, 20307, 22534, 23550, 32784, 23729, 24111, 24453, 24608, 24907,
    25140, 26367, 27888, 28382, 32974, 33151, 33492, 34955, 36024, 36864,
    36910, 38538, 40667, 39899, 20195, 21488, [12068, 22823], 31532, 37261,
    38988, 40441, 28381, 28711, 21331, 21828, 23429, 25176, 25246, 25299,
    27810, 28655, 29730, 35351, 37944, 28609, 35582, 33592, 20967, 34552,
    21482, 21481, 20294, 36948, [12192, 36784], 22890, 33073, 24061, 31466,
    36799, 26842, [12181, 35895], 29432, 40008, 27197, 35504, 20025, 21336,
    22022, 22374, 25285, 25506, 26086, 27470, 28129, 28251, 28845, 30701,
    31471, 31658, 32187, 32829, 32966, 34507, 35477, 37723, 22243, 22727,
    24382, 26029, 26262, 27264, 27573, 30007, 35527, 20516, 30693, 22320,
    24347, 24677, 26234, 27744, 30196, 31258, 32622, 33268, 34584, 36933,
    39347, 31689, 30044, [12149, 31481], 31569, 33988, 36880, 31209, 31378,
    33590, 23265, 30528, 20013, 20210, 23449, 24544, 25277, 26172, 26609,
    27880, [12173, 34411], 34935, 35387, 37198, 37619, 39376, 27159, 28710,
    29482, 33511, 33879, 36015, 19969, 20806, 20939, 21899, 23541, 24086,
    24115, 24193, 24340, 24373, 24427, 24500, 25074, 25361, 26274, 26397,
    28526, 29266, 30010, 30522, 32884, 33081, 33144, 34678, 35519, 35548,
    36229, 36339, 37530, [11985, 12199, 38263], 38914, [12227, 40165], 21189,
    25431, 30452, 26389, 27784, 29645, 36035, 37806, 38515, 27941, 22684,
    26894, 27084, 36861, 37786, 30171, 36890, 22618, 26626, 25524, 27131,
    20291, 28460, 26584, 36795, 34086, 32180, 37716, 26943, 28528, 22378,
    22775, 23340, 32044, [12118, 29226], 21514, 37347, 40372, 20141, 20302,
    20572, 20597, 21059, 35998, 21576, 22564, 23450, 24093, 24213, 24237,
    24311, 24351, 24716, 25269, 25402, 25552, 26799, 27712, 30855, 31118,
    31243, 32224, 33351, 35330, 35558, 36420, 36883, 37048, 37165, 37336,
    [12237, 40718], 27877, 25688, 25826, 25973, 28404, 30340, 31515, 36969,
    37841, 28346, 21746, 24505, 25764, 36685, 36845, 37444, 20856, 22635,
    22825, 23637, 24215, 28155, 32399, 29980, 36028, 36578, 39003, 28857,
    20253, 27583, 28593, [12133, 30000], 38651, 20814, 21520, 22581, 22615,
    22956, 23648, 24466, [12099, 26007], 26460, 28193, 30331, 33759, 36077,
    36884, 37117, 37709, 30757, 30778, 21162, 24230, [12063, 22303], 22900,
    24594, 20498, 20826, 20908, 20941, [12049, 20992], 21776, 22612, 22616,
    22871, 23445, 23798, 23947, 24764, 25237, 25645, 26481, 26691, 26812,
    26847, 30423, 28120, 28271, 28059, 28783, 29128, 24403, 30168, 31095,
    31561, 31572, 31570, 31958, 32113, 21040, 33891, 34153, 34276, 35342,
    35588, [12182, 35910], 36367, 36867, 36879, 37913, 38518, 38957, 39472,
    38360, 20685, 21205, 21516, 22530, 23566, 24999, 25758, 27934, 30643,
    31461, 33012, 33796, 36947, 37509, 23776, 40199, 21311, 24471, 24499,
    28060, 29305, 30563, 31167, 31716, 27602, 29420, 35501, 26627, 27233,
    20984, 31361, 26932, 23626, 40182, 33515, 23493, [12195, 37193], 28702,
    22136, 23663, 24775, 25958, 27788, 35930, 36929, 38931, 21585, 26311,
    37389, 22856, 37027, 20869, 20045, 20970, 34201, 35598, 28760, 25466,
    37707, 26978, 39348, 32260, 30071, 21335, 26976, 36575, 38627, 27741,
    [12038, 20108], 23612, 24336, 36841, 21250, 36049, [12161, 32905], 34425,
    24319, [12103, 26085], 20083, [12042, 20837], 22914, 23615, 38894, 20219,
    22922, 24525, 35469, 28641, 31152, 31074, 23527, 33905, 29483, 29105,
    24180, 24565, 25467, 25754, 29123, 31896, 20035, 24316, 20043, 22492,
    22178, 24745, 28611, 32013, 33021, 33075, 33215, 36786, 35223, 34468,
    24052, 25226, 25773, 35207, 26487, 27874, 27966, 29750, 30772, 23110,
    32629, 33453, [12218, 39340], 20467, 24259, 25309, 25490, 25943, 26479,
    30403, 29260, 32972, 32954, 36649, 37197, 20493, 22521, 23186, 26757,
    26995, 29028, 29437, 36023, 22770, 36064, 38506, 36889, 34687, 31204,
    30695, 33833, 20271, 21093, 21338, 25293, 26575, 27850, [12137, 30333],
    31636, 31893, 33334, 34180, 36843, 26333, 28448, 29190, 32283, 33707,
    39361, [12008, 40614], 20989, 31665, 30834, 31672, 32903, 31560, 27368,
    24161, 32908, 30033, 30048, [12043, 20843], 37474, 28300, 30330, 37271,
    39658, 20240, 32624, 25244, 31567, 38309, 40169, 22138, 22617, 34532,
    38588, 20276, 21028, 21322, 21453, 21467, 24070, 25644, 26001, 26495,
    27710, 27726, 29256, 29359, 29677, 30036, 32321, 33324, 34281, 36009,
    31684, [12196, 37318], 29033, 38930, 39151, 25405, 26217, 30058, 30436,
    30928, 34115, 34542, 21290, 21329, 21542, 22915, 24199, 24444, 24754,
    25161, 25209, 25259, 26000, [12112, 27604], 27852, 30130, [12138, 30382],
    30865, 31192, 32203, 32631, 32933, 34987, 35513, 36027, 36991,
    [12206, 38750], [12214, 39131], 27147, 31800, 20633, 23614, 24494, 26503,
    27608, 29749, 30473, 32654, [12240, 40763], 26570, 31255, 21305,
    [12134, 30091], 39661, 24422, 33181, 33777, 32920, 24380, 24517, 30050,
    31558, 36924, 26727, 23019, 23195, 32016, 30334, 35628, 20469, 24426,
    27161, 27703, 28418, 29922, 31080, 34920, 35413, 35961, 24287, 25551,
    30149, 31186, 33495, 37672, 37618, 33948, 34541, 39981, 21697, 24428,
    25996, 27996, 28693, 36007, 36051, 38971, 25935, 29942, 19981, 20184,
    22496, 22827, 23142, 23500, 20904, 24067, 24220, 24598, 25206, 25975,
    26023, 26222, 28014, [12119, 29238], 31526, 33104, 33178, 33433, 35676,
    36000, 36070, 36212, [12201, 38428], 38468, 20398, 25771, 27494, 33310,
    33889, 34154, 37096, 23553, 26963, [12213, 39080], 33914, 34135, 20239,
    21103, 24489, 24133, 26381, 31119, 33145, 35079, 35206, 28149, 24343,
    25173, 27832, 20175, 29289, 39826, 20998, 21563, 22132, 22707, 24996,
    25198, 28954, 22894, 31881, 31966, 32027, 38640, [12098, 25991], 32862,
    19993, 20341, 20853, 22592, 24163, 24179, 24330, 26564, 20006, 34109,
    38281, 38491, [12150, 31859], [12212, 38913], 20731, 22721, 30294, 30887,
    21029, 30629, 34065, 31622, 20559, 22793, [12122, 29255], 31687, 32232,
    36794, 36820, 36941, 20415, 21193, 23081, 24321, 38829, 20445, 33303,
    37610, 22275, 25429, 27497, 29995, 35036, 36628, 31298, 21215, 22675,
    24917, 25098, 26286, [11935, 27597], 31807, 33769, 20515, 20472, 21253,
    21574, 22577, 22857, 23453, 23792, 23791, 23849, 24214, 25265, 25447,
    25918, [12101, 26041], 26379, 27861, 27873, 28921, 30770, 32299, 32990,
    33459, 33804, 34028, 34562, 35090, 35370, 35914, 37030, 37586, 39165,
    40179, 40300, 20047, 20129, 20621, 21078, 22346, 22952, 24125,
    {f: 2, c: 24536}, 25151, 26292, 26395, 26576, 26834, 20882, 32033, 32938,
    33192, 35584, 35980, 36031, 37502, 38450, 21536, 38956, 21271, 20693,
    [12056, 21340], 22696, 25778, 26420, 29287, 30566, 31302, 37350, 21187,
    27809, 27526, 22528, 24140, 22868, 26412, 32763, 20961, 30406, 25705,
    30952, 39764, [12231, 40635], 22475, 22969, 26151, 26522, 27598, 21737,
    27097, 24149, 33180, 26517, 39850, 26622, 40018, 26717, 20134, 20451,
    [12060, 21448], 25273, 26411, 27819, 36804, 20397, 32365, 40639, 19975,
    24930, 28288, 28459, 34067, 21619, 26410, 39749, [11922, 24051], 31637,
    23724, 23494, 34588, 28234, 34001, 31252, 33032, 22937, 31885,
    [11936, 27665], 30496, 21209, 22818, 28961, 29279, [12141, 30683], 38695,
    40289, 26891, 23167, 23064, 20901, 21517, 21629, 26126, 30431, 36855,
    37528, 40180, 23018, 29277, 28357, 20813, 26825, 32191, 32236,
    [12207, 38754], 40634, 25720, 27169, 33538, 22916, 23391, [12113, 27611],
    29467, 30450, 32178, 32791, 33945, 20786, [12106, 26408], 40665,
    [12140, 30446], 26466, 21247, 39173, 23588, 25147, 31870, 36016, 21839,
    24758, 32011, [12200, 38272], 21249, 20063, 20918, 22812, 29242, 32822,
    37326, 24357, [12142, 30690], 21380, 24441, 32004, 34220, 35379, 36493,
    38742, 26611, 34222, 37971, 24841, 24840, 27833, 30290, 35565, 36664,
    21807, 20305, 20778, 21191, 21451, 23461, 24189, 24736, 24962, 25558,
    26377, 26586, 28263, 28044, {f: 2, c: 29494}, 30001, 31056, 35029, 35480,
    36938, [12194, 37009], 37109, 38596, 34701, [12067, 22805], 20104, 20313,
    19982, 35465, 36671, 38928, 20653, 24188, 22934, 23481, 24248, 25562,
    25594, 25793, 26332, 26954, 27096, 27915, 28342, 29076, [12132, 29992],
    31407, [12154, 32650], 32768, 33865, 33993, 35201, 35617, 36362, 36965,
    38525, 39178, 24958, 25233, 27442, 27779, 28020, 32716, 32764, 28096,
    32645, 34746, 35064, 26469, 33713, 38972, 38647, 27931, 32097, 33853,
    37226, 20081, 21365, 23888, 27396, 28651, 34253, 34349, 35239, 21033,
    21519, 23653, 26446, 26792, 29702, 29827, 30178, 35023, 35041,
    [12197, 37324], 38626, 38520, 24459, 29575, [12148, 31435], 33870, 25504,
    30053, 21129, 27969, 28316, 29705, 30041, 30827, 31890, 38534,
    [12015, 31452], [12243, 40845], 20406, 24942, 26053, 34396, 20102, 20142,
    20698, 20001, 20940, 23534, 26009, 26753, 28092, 29471, 30274, 30637,
    31260, 31975, 33391, 35538, 36988, 37327, 38517, 38936, [12050, 21147],
    32209, 20523, 21400, 26519, 28107, 29136, 29747, 33256, 36650, 38563,
    40023, 40607, 29792, 22593, 28057, 32047, 39006, 20196, 20278, 20363,
    20919, 21169, 23994, 24604, 29618, 31036, 33491, 37428, 38583, 38646,
    38666, 40599, 40802, 26278, 27508, 21015, 21155, 28872, 35010, 24265,
    24651, 24976, 28451, 29001, 31806, 32244, 32879, 34030, 36899, 37676,
    21570, 39791, 27347, 28809, 36034, 36335, 38706, 21172, 23105, 24266,
    24324, 26391, 27004, 27028, 28010, 28431, 29282, 29436, 31725,
    [12156, 32769], 32894, 34635, 37070, 20845, 40595, 31108, 32907, 37682,
    35542, 20525, 21644, 35441, 27498, 36036, 33031, 24785, 26528, 40434,
    20121, 20120, 39952, 35435, 34241, 34152, 26880, 28286, 30871, 33109,
    24332, 19984, 19989, 20010, 20017, [12034, 20022], 20028, [12035, 20031],
    20034, 20054, 20056, 20098, [12037, 20101], 35947, 20106, 33298, 24333,
    20110, {f: 2, c: 20126}, [12039, 20128], 20130, 20144, 20147, 20150, 20174,
    20173, 20164, 20166, 20162, 20183, 20190, 20205, 20191, 20215, 20233,
    20314, 20272, 20315, 20317, 20311, 20295, 20342, 20360, 20367, 20376,
    20347, 20329, 20336, 20369, 20335, 20358, 20374, 20760, 20436, 20447,
    20430, 20440, 20443, 20433, 20442, 20432, {f: 2, c: 20452}, 20506, 20520,
    20500, 20522, 20517, 20485, 20252, 20470, 20513, 20521, 20524, 20478,
    20463, 20497, 20486, 20547, 20551, 26371, 20565, 20560, 20552, 20570,
    20566, 20588, 20600, 20608, 20634, 20613, 20660, 20658, {f: 2, c: 20681},
    20659, 20674, 20694, 20702, 20709, 20717, 20707, 20718, 20729, 20725,
    20745, {f: 2, c: 20737}, 20758, 20757, 20756, 20762, 20769, 20794, 20791,
    20796, 20795, [12041, 20799], [11918, 20800], 20818, 20812, 20820, 20834,
    31480, {f: 2, c: 20841}, 20846, 20864, [12044, 20866], 22232, 20876, 20873,
    20879, 20881, 20883, 20885, [12045, 20886], 20900, 20902, 20898,
    {f: 2, c: 20905}, [12046, 20907], 20915, {f: 2, c: 20913}, 20912, 20917,
    20925, 20933, 20937, 20955, [12047, 20960], 34389, 20969, 20973, 20976,
    [12048, 20981], 20990, 20996, 21003, 21012, 21006, 21031, 21034, 21038,
    21043, 21049, 21071, 21060, {f: 2, c: 21067}, 21086, 21076, 21098, 21108,
    21097, 21107, 21119, 21117, 21133, 21140, 21138, 21105, 21128, 21137,
    36776, 36775, {f: 2, c: 21164}, 21180, 21173, 21185, 21197, 21207, 21214,
    21219, 21222, 39149, 21216, 21235, 21237, 21240, [12051, 21241], 21254,
    21256, 30008, 21261, 21264, 21263, [12052, 21269], [12053, 21274], 21283,
    21295, 21297, 21299, [12054, 21304], 21312, 21318, 21317, 19991, 21321,
    21325, 20950, 21342, [12057, 21353], 21358, 22808, 21371, 21367,
    [12058, 21378], 21398, 21408, 21414, 21413, 21422, 21424, [12059, 21430],
    21443, 31762, 38617, 21471, 26364, 29166, 21486, 21480, 21485, 21498,
    21505, 21565, 21568, {f: 2, c: 21548}, 21564, 21550, 21558, 21545, 21533,
    21582, 21647, 21621, 21646, 21599, 21617, 21623, 21616, 21650, 21627,
    21632, 21622, 21636, 21648, 21638, 21703, 21666, 21688, 21669, 21676,
    21700, 21704, 21672, 21675, 21698, 21668, 21694, 21692, 21720,
    {f: 2, c: 21733}, 21775, 21780, 21757, 21742, 21741, 21754, 21730, 21817,
    21824, 21859, 21836, 21806, 21852, 21829, {f: 2, c: 21846}, 21816, 21811,
    21853, 21913, 21888, 21679, 21898, 21919, 21883, 21886, 21912, 21918,
    21934, 21884, 21891, 21929, 21895, 21928, 21978, 21957, 21983, 21956,
    21980, 21988, 21972, 22036, 22007, 22038, 22014, 22013, 22043, 22009,
    22094, 22096, 29151, 22068, 22070, 22066, 22072, 22123, 22116, 22063,
    22124, 22122, 22150, 22144, 22154, 22176, 22164, 22159, 22181, 22190,
    22198, 22196, 22210, 22204, 22209, 22211, 22208, 22216, 22222, 22225,
    22227, [12062, 22231], 22254, 22265, 22272, 22271, 22276, 22281, 22280,
    22283, 22285, 22291, 22296, 22294, 21959, 22300, 22310, {f: 2, c: 22327},
    22350, 22331, 22336, 22351, 22377, 22464, 22408, 22369, 22399, 22409,
    22419, 22432, 22451, 22436, 22442, 22448, 22467, 22470, 22484,
    {f: 2, c: 22482}, 22538, 22486, 22499, 22539, 22553, 22557, 22642, 22561,
    22626, 22603, 22640, 27584, 22610, 22589, 22649, 22661, 22713, 22687,
    22699, 22714, 22750, 22715, 22712, 22702, 22725, 22739, 22737, 22743,
    22745, 22744, 22757, 22748, 22756, 22751, 22767, 22778, 22777,
    {f: 3, c: 22779}, [12065, 22786], [12066, 22794], 22800, 22811, 26790,
    22821, {f: 2, c: 22828}, 22834, 22840, 22846, 31442, 22869, 22864, 22862,
    22874, 22872, 22882, 22880, 22887, 22892, 22889, 22904, 22913, 22941,
    20318, 20395, 22947, 22962, 22982, 23016, 23004, 22925, {f: 2, c: 23001},
    23077, 23071, 23057, 23068, 23049, 23066, 23104, 23148, 23113,
    {f: 2, c: 23093}, 23138, 23146, 23194, 23228, 23230, 23243, 23234, 23229,
    23267, 23255, 23270, 23273, 23254, {f: 2, c: 23290}, 23308, 23307, 23318,
    23346, 23248, 23338, 23350, 23358, 23363, 23365, 23360, 23377, 23381,
    {f: 2, c: 23386}, 23397, 23401, 23408, 23411, 23413, 23416, 25992, 23418,
    [12071, 23424], 23427, 23462, 23480, 23491, 23495, 23497, 23508, 23504,
    23524, 23526, 23522, 23518, 23525, 23531, 23536, 23542, 23539, 23557,
    {f: 2, c: 23559}, 23565, 23571, 23584, [11920, 12074, 23586], 23592,
    [12075, 23608], 23609, 23617, 23622, 23630, 23635, 23632, 23631, 23409,
    23660, [12076, 23662], 20066, 23670, 23673, 23692, 23697, 23700, 22939,
    23723, 23739, 23734, 23740, 23735, 23749, 23742, 23751, 23769, 23785,
    23805, 23802, 23789, 23948, 23786, 23819, 23829, 23831, 23900, 23839,
    23835, 23825, 23828, 23842, 23834, 23833, 23832, 23884, 23890, 23886,
    23883, 23916, 23923, 23926, 23943, 23940, 23938, 23970, 23965, 23980,
    23982, 23997, 23952, 23991, 23996, 24009, 24013, 24019, 24018, 24022,
    [12078, 24027], 24043, 24050, 24053, 24075, 24090, 24089, 24081, 24091,
    {f: 2, c: 24118}, 24132, 24131, 24128, 24142, 24151, 24148, 24159, 24162,
    24164, 24135, {f: 2, c: 24181}, [11923, 12083, 24186], 40636,
    [12084, 24191], 24224, {f: 2, c: 24257}, 24264, 24272, 24271, 24278, 24291,
    24285, {f: 2, c: 24282}, 24290, 24289, {f: 2, c: 24296}, 24300, 24305,
    24307, 24304, [12085, 24308], 24312, [12086, 24318], 24323, 24329, 24413,
    24412, [12087, 24331], 24337, 24342, 24361, 24365, 24376, 24385, 24392,
    24396, 24398, 24367, [11924, 24401], {f: 2, c: 24406}, 24409,
    [12090, 24417], 24429, [12091, 24435], 24439, 24451, 24450, 24447, 24458,
    24456, 24465, 24455, 24478, 24473, 24472, 24480, 24488, 24493, 24508,
    24534, 24571, 24548, 24568, 24561, 24541, 24755, 24575, 24609, 24672,
    24601, 24592, 24617, 24590, 24625, 24603, 24597, 24619, 24614, 24591,
    24634, 24666, 24641, 24682, 24695, 24671, 24650, 24646, 24653, 24675,
    24643, 24676, 24642, 24684, 24683, 24665, 24705, 24717, 24807, 24707,
    24730, 24708, 24731, {f: 2, c: 24726}, 24722, 24743, 24715, 24801, 24760,
    24800, 24787, 24756, 24560, 24765, 24774, 24757, 24792, 24909, 24853,
    24838, {f: 2, c: 24822}, 24832, 24820, 24826, 24835, 24865, 24827, 24817,
    {f: 2, c: 24845}, 24903, 24894, 24872, 24871, 24906, 24895, 24892, 24876,
    24884, 24893, 24898, 24900, 24947, 24951, {f: 3, c: 24920}, 24939, 24948,
    24943, 24933, 24945, 24927, 24925, 24915, 24949, 24985, 24982, 24967,
    25004, 24980, 24986, 24970, 24977, 25003, 25006, 25036, 25034, 25033,
    25079, 25032, 25027, 25030, 25018, 25035, 32633, 25037, 25062, 25059,
    25078, 25082, 25076, 25087, 25085, 25084, 25086, 25088, [12093, 25096],
    25097, 25101, 25100, 25108, 25115, 25118, 25121, 25130, 25134, 25136,
    {f: 2, c: 25138}, 25153, 25166, 25182, 25187, 25179, 25184, 25192, 25212,
    25218, 25225, 25214, {f: 2, c: 25234}, 25238, 25300, 25219, 25236, 25303,
    25297, 25275, 25295, 25343, 25286, 25812, 25288, 25308, 25292, 25290,
    25282, 25287, 25243, 25289, 25356, 25326, 25329, 25383, 25346, 25352,
    25327, 25333, 25424, 25406, 25421, 25628, 25423, 25494, 25486, 25472,
    25515, 25462, 25507, 25487, 25481, 25503, 25525, 25451, 25449, 25534,
    25577, 25536, 25542, 25571, 25545, 25554, 25590, 25540, 25622, 25652,
    25606, 25619, 25638, 25654, 25885, 25623, 25640, 25615, 25703, 25711,
    25718, 25678, 25898, 25749, 25747, 25765, 25769, 25736, 25788, 25818,
    25810, 25797, 25799, 25787, 25816, 25794, 25841, 25831, 33289,
    {f: 2, c: 25824}, 25260, 25827, 25839, 25900, 25846, 25844, 25842, 25850,
    25856, 25853, 25880, 25884, 25861, 25892, 25891, 25899, [12097, 25908],
    [11929, 25909], 25911, 25910, 25912, 30027, 25928, 25942, 25941, 25933,
    25944, 25950, 25949, 25970, 25976, {f: 2, c: 25986}, 35722, 26011, 26015,
    26027, 26039, 26051, 26054, 26049, 26052, 26060, 26066, 26075, 26073,
    [12102, 26080], [11931, 26081], 26097, 26482, 26122, 26115, 26107, 26483,
    {f: 2, c: 26165}, 26164, 26140, 26191, 26180, 26185, 26177, 26206, 26205,
    26212, {f: 2, c: 26215}, 26207, 26210, 26224, 26243, 26248, 26254, 26249,
    26244, 26264, 26269, 26305, 26297, 26313, 26302, 26300, 26308, 26296,
    26326, 26330, 26336, 26175, 26342, 26345, [12104, 26352], 26357, 26359,
    26383, 26390, 26398, {f: 2, c: 26406}, 38712, 26414, 26431, 26422, 26433,
    26424, 26423, 26438, 26462, 26464, 26457, {f: 2, c: 26467}, 26505, 26480,
    26537, 26492, 26474, 26508, 26507, 26534, 26529, 26501, 26551, 26607,
    26548, 26604, 26547, 26601, 26552, 26596, 26590, 26589, 26594, 26606,
    26553, 26574, 26566, 26599, 27292, 26654, 26694, 26665, 26688, 26701,
    26674, 26702, 26803, 26667, 26713, 26723, 26743, 26751, 26783, 26767,
    26797, 26772, 26781, 26779, 26755, 27310, 26809, 26740, 26805, 26784,
    26810, 26895, 26765, 26750, 26881, 26826, 26888, 26840, 26914, 26918,
    26849, 26892, 26829, 26836, 26855, 26837, 26934, 26898, 26884, 26839,
    26851, 26917, 26873, 26848, 26863, 26920, 26922, 26906, 26915, 26913,
    26822, 27001, 26999, 26972, 27000, 26987, 26964, 27006, 26990, 26937,
    26996, 26941, 26969, 26928, 26977, 26974, 26973, 27009, 26986, 27058,
    27054, 27088, 27071, 27073, 27091, 27070, 27086, 23528, 27082, 27101,
    27067, 27075, 27047, 27182, 27025, 27040, 27036, 27029, 27060, 27102,
    27112, 27138, 27163, 27135, 27402, 27129, 27122, 27111, 27141, 27057,
    27166, 27117, 27156, 27115, 27146, 27154, 27329, 27171, 27155, 27204,
    27148, 27250, 27190, 27256, 27207, 27234, 27225, 27238, 27208, 27192,
    27170, 27280, 27277, 27296, 27268, {f: 2, c: 27298}, 27287, 34327, 27323,
    27331, 27330, 27320, 27315, 27308, 27358, 27345, 27359, 27306, 27354,
    27370, 27387, 27397, 34326, 27386, 27410, 27414, 39729, 27423, 27448,
    27447, 30428, 27449, 39150, 27463, 27459, 27465, 27472, 27481, 27476,
    27483, 27487, 27489, 27512, [12109, 27513], {f: 2, c: 27519}, 27524, 27523,
    27533, 27544, 27541, 27550, 27556, {f: 2, c: 27562}, 27567, 27570, 27569,
    [12110, 27571], 27575, 27580, 27590, [12111, 27595], 27603, 27615, 27628,
    27627, 27635, 27631, 40638, 27656, 27667, [12115, 27668], 27675, 27684,
    27683, 27742, 27733, 27746, 27754, 27778, 27789, 27802, 27777, 27803,
    27774, 27752, 27763, 27794, 27792, 27844, 27889, 27859, 27837, 27863,
    27845, 27869, 27822, 27825, 27838, 27834, 27867, 27887, 27865, 27882,
    27935, 34893, 27958, 27947, 27965, 27960, 27929, 27957, 27955, 27922,
    27916, 28003, 28051, 28004, 27994, 28025, 27993, 28046, 28053, 28644,
    28037, 28153, 28181, 28170, 28085, 28103, 28134, 28088, 28102, 28140,
    28126, 28108, 28136, 28114, 28101, 28154, 28121, 28132, 28117, 28138,
    28142, 28205, 28270, 28206, 28185, 28274, 28255, 28222, 28195, 28267,
    28203, 28278, 28237, 28191, 28227, 28218, 28238, 28196, 28415, 28189,
    28216, 28290, 28330, 28312, 28361, 28343, 28371, 28349, 28335, 28356,
    28338, {f: 2, c: 28372}, 28303, 28325, 28354, 28319, 28481, 28433, 28748,
    28396, 28408, 28414, 28479, 28402, 28465, 28399, 28466, 28364, 28478,
    28435, 28407, 28550, 28538, 28536, 28545, 28544, 28527, 28507, 28659,
    28525, 28546, 28540, 28504, 28558, 28561, 28610, 28518, 28595, 28579,
    28577, 28580, 28601, 28614, 28586, 28639, 28629, 28652, 28628, 28632,
    28657, 28654, 28635, 28681, 28683, 28666, 28689, 28673, 28687, 28670,
    28699, 28698, 28532, 28701, 28696, 28703, 28720, 28734, 28722, 28753,
    28771, 28825, 28818, 28847, 28913, 28844, 28856, 28851, 28846, 28895,
    28875, 28893, 28889, 28937, 28925, 28956, 28953, 29029, 29013, 29064,
    29030, 29026, 29004, 29014, 29036, 29071, 29179, 29060, 29077, 29096,
    29100, 29143, 29113, 29118, 29138, 29129, 29140, 29134, 29152, 29164,
    29159, 29173, 29180, 29177, 29183, 29197, 29200, 29211, 29224, 29229,
    29228, 29232, 29234, [12120, 29243], 29244, [12121, 29247], 29248, 29254,
    29259, 29272, 29300, 29310, 29314, 29313, 29319, 29330, 29334, 29346,
    29351, 29369, 29362, 29379, 29382, 29380, 29390, 29394, 29410,
    {f: 2, c: 29408}, 29433, 29431, 20495, 29463, 29450, 29468, 29462, 29469,
    29492, 29487, 29481, 29477, 29502, {f: 2, c: 29518}, 40664, 29527, 29546,
    29544, 29552, 29560, 29557, 29563, 29562, 29640, 29619, 29646, 29627,
    29632, 29669, 29678, 29662, 29858, 29701, 29807, 29733, 29688, 29746,
    29754, 29781, 29759, 29791, 29785, 29761, 29788, 29801, 29808, 29795,
    29802, 29814, 29822, 29835, 29854, 29863, 29898, 29903, 29908, 29681,
    29920, 29923, 29927, 29929, 29934, 29938, {f: 2, c: 29936}, 29944, 29943,
    29956, 29955, 29957, 29964, 29966, 29965, 29973, 29971, 29982, 29990,
    29996, 30012, 30020, 30029, 30026, 30025, 30043, 30022, 30042, 30057,
    30052, 30055, 30059, 30061, 30072, 30070, {f: 2, c: 30086}, 30068, 30090,
    30089, 30082, 30100, 30106, 30109, 30117, 30115, 30146, 30131, 30147,
    30133, 30141, 30136, 30140, 30129, 30157, 30154, 30162, 30169, 30179,
    30174, {f: 2, c: 30206}, 30204, 30209, 30192, 30202, {f: 2, c: 30194},
    30219, 30221, 30217, 30239, 30247, {f: 3, c: 30240}, 30244, 30260, 30256,
    30267, {f: 2, c: 30279}, 30278, 30300, 30296, {f: 2, c: 30305},
    {f: 3, c: 30312}, 30311, 30316, 30320, 30322, [12136, 30326], 30328, 30332,
    30336, 30339, 30344, 30347, 30350, 30358, 30355, {f: 2, c: 30361}, 30384,
    30388, {f: 3, c: 30392}, 30402, 30413, 30422, 30418, 30430, 30433, 30437,
    30439, 30442, 34351, 30459, 30472, 30471, 30468, 30505, 30500, 30494,
    {f: 2, c: 30501}, 30491, {f: 2, c: 30519}, 30535, 30554, 30568, 30571,
    30555, 30565, 30591, 30590, 30585, 30606, 30603, 30609, 30624, 30622,
    30640, 30646, 30649, 30655, {f: 2, c: 30652}, 30651, 30663, 30669, 30679,
    30682, 30684, 30691, 30702, 30716, 30732, 30738, 31014, 30752, 31018,
    30789, 30862, 30836, 30854, 30844, 30874, 30860, 30883, 30901, 30890,
    30895, 30929, 30918, 30923, 30932, 30910, 30908, 30917, 30922, 30956,
    30951, 30938, 30973, 30964, 30983, 30994, 30993, 31001, 31020, 31019,
    31040, 31072, 31063, 31071, 31066, 31061, 31059, 31098, 31103, 31114,
    31133, 31143, 40779, 31146, 31150, 31155, {f: 2, c: 31161}, 31177, 31189,
    31207, 31212, 31201, 31203, 31240, 31245, {f: 2, c: 31256}, 31264, 31263,
    31104, 31281, 31291, 31294, 31287, 31299, 31319, 31305, {f: 2, c: 31329},
    31337, 40861, 31344, 31353, 31357, 31368, 31383, 31381, 31384, 31382,
    31401, 31432, 31408, 31414, 31429, 31428, 31423, 36995, 31431, 31434,
    31437, 31439, 31445, 31443, {f: 2, c: 31449}, 31453, {f: 2, c: 31457},
    31462, 31469, 31472, 31490, 31503, 31498, 31494, 31539, {f: 2, c: 31512},
    31518, 31541, 31528, 31542, 31568, 31610, 31492, 31565, 31499, 31564,
    31557, 31605, 31589, 31604, 31591, {f: 2, c: 31600}, 31596, 31598, 31645,
    31640, 31647, 31629, 31644, 31642, 31627, 31634, 31631, 31581, 31641,
    31691, 31681, 31692, 31695, 31668, 31686, 31709, 31721, 31761, 31764,
    31718, 31717, 31840, 31744, 31751, 31763, 31731, 31735, 31767, 31757,
    31734, 31779, 31783, 31786, 31775, 31799, 31787, 31805, 31820, 31811,
    31828, 31823, 31808, 31824, 31832, 31839, 31844, 31830, 31845, 31852,
    31861, 31875, 31888, 31908, 31917, 31906, 31915, 31905, 31912, 31923,
    31922, 31921, 31918, 31929, 31933, 31936, 31941, 31938, 31960, 31954,
    31964, 31970, 39739, 31983, 31986, 31988, 31990, 31994, 32006, 32002,
    32028, 32021, 32010, 32069, 32075, 32046, 32050, 32063, 32053, 32070,
    32115, 32086, 32078, 32114, 32104, 32110, 32079, 32099, 32147, 32137,
    32091, 32143, 32125, 32155, 32186, 32174, 32163, 32181, 32199, 32189,
    32171, 32317, 32162, 32175, 32220, 32184, 32159, 32176, 32216, 32221,
    32228, 32222, 32251, 32242, 32225, 32261, 32266, 32291, 32289, 32274,
    32305, 32287, 32265, 32267, 32290, 32326, 32358, 32315, 32309, 32313,
    32323, 32311, 32306, 32314, 32359, 32349, 32342, 32350, {f: 2, c: 32345},
    32377, 32362, 32361, 32380, 32379, 32387, 32213, 32381, 36782, 32383,
    {f: 2, c: 32392}, 32396, 32402, 32400, {f: 2, c: 32403}, 32406, 32398,
    {f: 2, c: 32411}, 32568, 32570, 32581, {f: 3, c: 32588}, 32592,
    [12153, 32593], 32597, 32596, 32600, {f: 2, c: 32607}, {f: 2, c: 32616},
    32615, 32632, 32642, 32646, 32643, 32648, 32647, 32652, 32660, 32670,
    32669, 32666, 32675, 32687, 32690, 32697, 32686, 32694, 32696, 35697,
    {f: 2, c: 32709}, 32714, 32725, 32724, 32737, 32742, 32745, 32755, 32761,
    39132, 32774, 32772, 32779, [12158, 32786], {f: 2, c: 32792}, 32796, 32801,
    32808, 32831, 32827, 32842, 32838, 32850, 32856, 32858, 32863, 32866,
    32872, 32883, 32882, 32880, 32886, 32889, 32893, [12160, 32895], 32900,
    32902, 32901, 32923, 32915, 32922, 32941, 20880, 32940, 32987, 32997,
    32985, 32989, 32964, 32986, 32982, 33033, 33007, 33009, 33051, 33065,
    33059, 33071, 33099, 38539, 33094, 33086, 33107, 33105, 33020, 33137,
    33134, {f: 2, c: 33125}, 33140, 33155, 33160, 33162, 33152, 33154, 33184,
    33173, 33188, 33187, 33119, 33171, 33193, 33200, 33205, 33214, 33208,
    33213, 33216, 33218, 33210, 33225, 33229, 33233, 33241, 33240, 33224,
    33242, {f: 2, c: 33247}, 33255, {f: 2, c: 33274}, 33278, {f: 2, c: 33281},
    33285, 33287, 33290, 33293, 33296, 33302, 33321, 33323, 33336, 33331,
    33344, 33369, 33368, 33373, 33370, 33375, 33380, 33378, 33384,
    {f: 2, c: 33386}, 33326, 33393, 33399, [12171, 33400], 33406, 33421, 33426,
    33451, 33439, 33467, 33452, 33505, 33507, 33503, 33490, 33524, 33523,
    33530, 33683, 33539, 33531, 33529, 33502, 33542, 33500, 33545, 33497,
    33589, 33588, 33558, 33586, 33585, 33600, 33593, 33616, 33605, 33583,
    33579, {f: 2, c: 33559}, 33669, 33690, 33706, 33695, 33698, 33686, 33571,
    33678, 33671, 33674, 33660, 33717, 33651, 33653, 33696, 33673, 33704,
    33780, 33811, 33771, 33742, 33789, 33795, 33752, 33803, 33729, 33783,
    33799, 33760, 33778, 33805, 33826, 33824, 33725, 33848, 34054, 33787,
    33901, 33834, 33852, 34138, 33924, 33911, 33899, 33965, 33902, 33922,
    33897, 33862, 33836, 33903, 33913, 33845, 33994, 33890, 33977, 33983,
    33951, 34009, 33997, 33979, 34010, 34000, 33985, 33990, 34006, 33953,
    34081, 34047, 34036, {f: 2, c: 34071}, 34092, 34079, 34069, 34068, 34044,
    34112, 34147, 34136, 34120, 34113, 34306, 34123, 34133, 34176, 34212,
    34184, 34193, 34186, 34216, 34157, 34196, 34203, 34282, 34183, 34204,
    34167, 34174, 34192, 34249, 34234, 34255, 34233, 34256, 34261, 34269,
    34277, 34268, 34297, 34314, 34323, 34315, 34302, 34298, 34310, 34338,
    34330, 34352, 34367, [12172, 34381], 20053, 34388, 34399, 34407, 34417,
    34451, 34467, {f: 2, c: 34473}, {f: 2, c: 34443}, 34486, 34479, 34500,
    34502, 34480, 34505, 34851, 34475, 34516, 34526, 34537, 34540, 34527,
    34523, 34543, 34578, 34566, 34568, 34560, 34563, 34555, 34577, 34569,
    34573, 34553, 34570, 34612, 34623, 34615, 34619, 34597, 34601, 34586,
    34656, 34655, 34680, 34636, 34638, 34676, 34647, 34664, 34670, 34649,
    34643, 34659, 34666, 34821, 34722, 34719, 34690, 34735, 34763, 34749,
    34752, 34768, 38614, 34731, 34756, 34739, 34759, 34758, 34747, 34799,
    34802, 34784, 34831, 34829, 34814, {f: 2, c: 34806}, 34830, 34770, 34833,
    34838, 34837, 34850, 34849, 34865, 34870, 34873, 34855, 34875, 34884,
    34882, 34898, 34905, 34910, 34914, 34923, 34945, 34942, 34974, 34933,
    34941, 34997, 34930, 34946, 34967, 34962, 34990, 34969, 34978, 34957,
    34980, 34992, 35007, 34993, {f: 2, c: 35011}, 35028, {f: 2, c: 35032},
    35037, 35065, 35074, 35068, 35060, 35048, 35058, 35076, 35084, 35082,
    35091, 35139, 35102, 35109, {f: 2, c: 35114}, 35137, 35140, 35131, 35126,
    35128, 35148, 35101, 35168, 35166, 35174, 35172, 35181, 35178, 35183,
    35188, 35191, [12177, 35198], 35203, 35208, 35210, 35219, 35224, 35233,
    35241, 35238, 35244, 35247, 35250, 35258, 35261, {f: 2, c: 35263}, 35290,
    {f: 2, c: 35292}, 35303, 35316, 35320, 35331, 35350, 35344, 35340, 35355,
    35357, 35365, 35382, 35393, 35419, 35410, 35398, 35400, 35452, 35437,
    35436, 35426, 35461, 35458, 35460, 35496, 35489, 35473, {f: 2, c: 35493},
    35482, 35491, 35524, 35533, 35522, 35546, 35563, 35571, 35559, 35556,
    35569, 35604, 35552, 35554, 35575, 35550, 35547, 35596, 35591, 35610,
    35553, 35606, 35600, 35607, 35616, 35635, 38827, 35622, 35627, 35646,
    35624, 35649, 35660, 35663, 35662, 35657, 35670, 35675, 35674, 35691,
    35679, 35692, 35695, 35700, 35709, 35712, 35724, 35726, {f: 2, c: 35730},
    35734, {f: 2, c: 35737}, 35898, 35905, 35903, 35912, 35916, 35918, 35920,
    [12183, 35925], 35938, 35948, [12184, 35960], 35962, 35970, 35977, 35973,
    35978, {f: 2, c: 35981}, 35988, 35964, 35992, 25117, 36013, 36010, 36029,
    {f: 2, c: 36018}, 36014, 36022, 36040, 36033, 36068, 36067, 36058, 36093,
    {f: 2, c: 36090}, {f: 2, c: 36100}, 36106, 36103, 36111, 36109, 36112,
    40782, 36115, 36045, 36116, 36118, 36199, 36205, 36209, 36211, 36225,
    36249, 36290, 36286, 36282, 36303, 36314, 36310, 36300, 36315, 36299,
    {f: 2, c: 36330}, 36319, 36323, 36348, {f: 2, c: 36360}, 36351,
    {f: 2, c: 36381}, 36368, 36383, 36418, 36405, 36400, 36404, 36426, 36423,
    36425, 36428, 36432, 36424, 36441, 36452, 36448, 36394, 36451, 36437,
    36470, 36466, 36476, 36481, 36487, 36485, 36484, 36491, 36490, 36499,
    36497, 36500, 36505, 36522, 36513, 36524, 36528, 36550, 36529, 36542,
    36549, 36552, 36555, 36571, 36579, 36604, 36603, 36587, 36606, 36618,
    36613, 36629, 36626, 36633, 36627, 36636, 36639, 36635, 36620, 36646,
    36659, 36667, 36665, 36677, 36674, 36670, 36684, 36681, 36678, 36686,
    36695, 36700, {f: 3, c: 36706}, 36764, 36767, 36771, 36781, 36783, 36791,
    36826, 36837, 36834, 36842, 36847, 36999, 36852, 36869, {f: 2, c: 36857},
    36881, 36885, 36897, 36877, 36894, 36886, 36875, 36903, 36918, 36917,
    36921, 36856, {f: 4, c: 36943}, 36878, 36937, 36926, 36950, 36952, 36958,
    36968, 36975, 36982, 38568, 36978, 36994, 36989, 36993, 36992, 37002,
    37001, 37007, 37032, 37039, 37041, 37045, 37090, 37092, 25160, 37083,
    37122, 37138, 37145, 37170, 37168, 37194, 37206, 37208, 37219, 37221,
    37225, 37235, 37234, 37259, 37257, 37250, 37282, 37291, 37295, 37290,
    37301, 37300, 37306, {f: 2, c: 37312}, 37321, 37323, 37328, 37334, 37343,
    37345, 37339, 37372, {f: 2, c: 37365}, 37406, 37375, 37396, 37420, 37397,
    37393, 37470, 37463, 37445, 37449, 37476, 37448, 37525, 37439, 37451,
    37456, 37532, 37526, 37523, 37531, 37466, 37583, 37561, 37559, 37609,
    37647, 37626, 37700, 37678, 37657, 37666, 37658, 37667, 37690, 37685,
    37691, 37724, 37728, 37756, 37742, 37718, 37808, {f: 2, c: 37804}, 37780,
    37817, {f: 2, c: 37846}, 37864, 37861, 37848, 37827, 37853, 37840, 37832,
    37860, 37914, 37908, 37907, 37891, 37895, 37904, 37942, 37931, 37941,
    37921, 37946, 37953, 37970, 37956, 37979, 37984, 37986, 37982, 37994,
    37417, 38000, 38005, 38007, 38013, 37978, 38012, 38014, 38017, 38015,
    38274, 38279, 38282, 38292, 38294, {f: 2, c: 38296}, 38304, 38312, 38311,
    38317, 38332, 38331, 38329, 38334, 38346, 28662, 38339, 38349, 38348,
    38357, 38356, 38358, 38364, 38369, 38373, 38370, 38433, 38440,
    {f: 2, c: 38446}, 38466, 38476, 38479, 38475, 38519, 38492, 38494, 38493,
    38495, 38502, 38514, 38508, 38541, 38552, 38549, 38551, 38570, 38567,
    {f: 2, c: 38577}, 38576, 38580, [12202, 38582], 38584, [12203, 38585],
    38606, 38603, 38601, 38605, 35149, 38620, 38669, 38613, 38649, 38660,
    38662, 38664, 38675, 38670, 38673, 38671, 38678, 38681, 38692, 38698,
    38704, 38713, {f: 2, c: 38717}, 38724, 38726, 38728, 38722, 38729, 38748,
    38752, 38756, 38758, 38760, 21202, 38763, 38769, 38777, 38789, 38780,
    38785, 38778, 38790, 38795, {f: 2, c: 38799}, 38812, 38824, 38822, 38819,
    {f: 2, c: 38835}, 38851, 38854, 38856, [12209, 38859], 38876,
    [12210, 38893], 40783, 38898, 31455, 38902, 38901, 38927, 38924, 38968,
    38948, 38945, 38967, 38973, 38982, 38991, 38987, 39019, {f: 3, c: 39023},
    39028, 39027, 39082, 39087, 39089, 39094, 39108, 39107, 39110, 39145,
    39147, 39171, 39177, 39186, 39188, 39192, 39201, {f: 2, c: 39197}, 39204,
    39200, 39212, 39214, {f: 2, c: 39229}, 39234, 39241, 39237, 39248, 39243,
    {f: 2, c: 39249}, 39244, 39253, {f: 2, c: 39319}, 39333, {f: 2, c: 39341},
    39356, 39391, 39387, 39389, 39384, 39377, {f: 2, c: 39405},
    {f: 2, c: 39409}, 39419, 39416, 39425, 39439, 39429, 39394, 39449, 39467,
    39479, 39493, 39490, 39488, 39491, 39486, 39509, 39501, 39515, 39511,
    39519, 39522, 39525, 39524, 39529, 39531, 39530, 39597, 39600, 39612,
    39616, 39631, 39633, {f: 2, c: 39635}, 39646, [12221, 39647],
    {f: 2, c: 39650}, 39654, 39663, 39659, 39662, 39668, 39665, 39671, 39675,
    39686, 39704, 39706, 39711, {f: 2, c: 39714}, [12222, 39717],
    {f: 4, c: 39719}, 39726, [12223, 39727], [12224, 39730], 39748, 39747,
    39759, {f: 2, c: 39757}, 39761, 39768, 39796, 39827, 39811, 39825,
    {f: 2, c: 39830}, {f: 2, c: 39839}, 39848, 39860, 39872, 39882, 39865,
    39878, 39887, {f: 2, c: 39889}, 39907, 39906, 39908, 39892, 39905, 39994,
    39922, 39921, 39920, 39957, 39956, 39945, 39955, 39948, 39942, 39944,
    39954, 39946, 39940, 39982, 39963, 39973, 39972, 39969, 39984, 40007,
    39986, 40006, 39998, 40026, 40032, 40039, 40054, 40056, 40167, 40172,
    40176, 40201, 40200, 40171, 40195, 40198, 40234, 40230, 40367, 40227,
    40223, 40260, 40213, 40210, 40257, 40255, 40254, 40262, 40264,
    {f: 2, c: 40285}, 40292, 40273, 40272, 40281, 40306, 40329, 40327, 40363,
    40303, 40314, 40346, 40356, 40361, 40370, 40388, 40385, 40379, 40376,
    40378, 40390, 40399, 40386, 40409, 40403, 40440, 40422, 40429, 40431,
    40445, {f: 2, c: 40474}, 40478, [12228, 40565], 40569, 40573, 40577, 40584,
    {f: 2, c: 40587}, 40594, 40597, 40593, 40605, [12230, 40613], 40617, 40632,
    40618, 40621, 38753, 40652, {f: 3, c: 40654}, 40660, 40668, 40670, 40669,
    40672, 40677, 40680, 40687, 40692, {f: 2, c: 40694}, [12235, 40697],
    {f: 2, c: 40699}, [12236, 40701], {f: 2, c: 40711}, 30391, 40725, 40737,
    40748, 40766, [12241, 40778], [12242, 40786], 40788, 40803,
    {f: 3, c: 40799}, {f: 2, c: 40806}, 40812, 40810, 40823, 40818, 40822,
    40853, [12244, 40860], [12245, 40864], 22575, 27079, 36953, 29796, 0,
    {f: 76, c: 9472}, {f: 20, c: 9312}, {f: 10, c: 8544}, 13129, 13076, 0,
    13133, 0, 13095, 0, 13110, 13137, 0, 13069, 13094, 0, 13099, 13130, 0,
    {f: 3, c: 13212}, {f: 2, c: 13198}, 13252, 13217, 12317, 12319, 8470,
    13261, 0, {f: 5, c: 12964}, {f: 2, c: 12849}, 12857, 13182, 13181, 13180,
    8750, 8721, {s: 3}, 8735, 8895, 0, 0, 21854, {s: 7}, 167133, 0, 0, 28976,
    0, 40407, {s: 4}, 64054, 0, 0, 22169, 15694, {s: 4}, 20448, 0, 0, 36544, 0,
    194797, {s: 4}, 153716, 32363, 33606, 167670, {s: 3}, 40572, 0, 0, 26171,
    0, 40628, {s: 4}, 26629, {s: 5}, 23650, 0, 194780, 0, 32353, 0, 0, 64070,
    {s: 5}, 34083, 37292, {s: 7}, 34796, {s: 8}, 25620, 0, 0, 39506, {s: 4},
    64074, 0, 194692, {s: 4}, 31774, {s: 6}, 64016, 25681, 0, 0, 63980, 22625,
    39002, 0, 194679, {s: 3}, 31153, 0, 28678, {s: 9}, 22218, {s: 3}, 21085, 0,
    28497, 37297, {s: 10}, 64106, {s: 6}, 38960, 0, 40629, {s: 9}, 33802,
    63939, {f: 2, c: 63890}, 63897, 0, 34847, 194575, 0, 194771, 194584,
    {s: 7}, 137754, 23643, {s: 4}, 25890, 0, 0, 26618, 0, 26766, 0, 148432,
    194848, {s: 21}, 34110, {s: 15}, 30562, {s: 12}, 65075, 0,
    {f: 2, c: 65073}, {s: 4}, 65072, {f: 2, c: 65077}, {f: 2, c: 65081}, 0, 0,
    {f: 2, c: 65079}, {f: 2, c: 65087}, {f: 2, c: 65085}, {f: 4, c: 65089},
    {f: 2, c: 65083}, {s: 41}, {f: 3, c: 12436}, 0, 0, 22099, {s: 41}, 65508,
    65287, 65282, 0, 9665, 9655, 8681, 8679, 8678, 8680, 9634, 9831, 9825,
    9828, 9826, 13216, 13218, {f: 2, c: 13220}, 13207, 8467, 13208, 13235,
    13234, 13233, 13232, {f: 3, c: 13189}, 13259, 13200, 13268, 13206, 13090,
    13078, 13080, 13077, 13059, 13091, 13143, 13122, 13113, 13115, 13056,
    13105, 13127, 13086, 13098, 0, 13183, 8481, 9742, 12342, 12320, {s: 3},
    {f: 9, c: 9352}, {f: 20, c: 9332}, 12881, {f: 10, c: 8560},
    {f: 10, c: 12882}, {f: 26, c: 9372}, 12867, 12861, 12863, 12852, 12856,
    12851, 12860, 12866, 12862, 12854, 12853, 12859, 12864, 12858, 12976,
    12973, 12969, 12975, 12948, 12970, 12952, 12971, 12946, 12945, 12947,
    12972, 12974, 12950, {s: 8}, {f: 3, c: 9131}, 0, {f: 3, c: 9127}, 0, 13260,
    13061, 0, 0, 13215, 13219, 13222, 0, 0, 12958, {f: 2, c: 13192}, 13256,
    8749, 0, 12848, {f: 6, c: 12842}, 12855, 12865, 10145, {s: 3}, 9673, 9824,
    9829, 9827, 9830, {f: 4, c: 9728}, 9758, {f: 2, c: 9756}, 9759, 12953,
    9450, {f: 2, c: 8554}, {s: 3}, {f: 8, c: 9601}, 9615, 9614, 9613, 9612,
    9611, 9610, 9609, {f: 2, c: 9620}, {f: 2, c: 9581}, 9584, 9583, 9552, 9566,
    9578, 9569, {f: 2, c: 9698}, 9701, 9700, 0, 0, {f: 3, c: 9585}, {s: 20},
    20956, 29081, {f: 9, c: 10102}, {s: 3}, {f: 2, c: 8570}, {s: 3}, 8575,
    8458, 8457, 0, 0, 12292, 8646, {f: 2, c: 8644}, 0, {f: 4, c: 12535}, 0, 0,
    12957, {s: 3}, 13179, {s: 3}, 13107, 13134, {s: 30}, 32394, 35100, 37704,
    37512, 34012, 20425, 28859, 26161, 26824, 37625, 26363, 24389,
    [12033, 20008], 20193, 20220, 20224, 20227, 20281, 20310, 20370, 20362,
    20378, 20372, 20429, 20544, 20514, 20479, 20510, 20550, 20592, 20546,
    20628, 20724, 20696, 20810, 20836, 20893, 20926, 20972, 21013, 21148,
    21158, 21184, 21211, 21248, 0, 21284, 21362, 21395, 21426, 21469, 64014,
    21660, 21642, 21673, 21759, 21894, 22361, 22373, 22444, 22472, 22471,
    64015, 0, 22686, 22706, 22795, 22867, 22875, 22877, 22883, 22948, 22970,
    23382, 23488, 29999, 23512, 0, 23582, 23718, 23738, 23797, 23847, 23891, 0,
    23874, 23917, {f: 2, c: 23992}, 24016, 24353, 24372, 24423, 24503, 24542,
    24669, 24709, 24714, 24798, 24789, 24864, 24818, 24849, 24887, 24880,
    24984, 25107, 25254, 25589, 25696, 25757, 25806, 25934, 26112, 26133,
    26121, 26158, 0, 26148, 26213, 26199, 26201, 64018, 26227, 26265, 26272,
    26290, 26303, 26362, 26382, 0, 26470, 26555, 26706, 26560, 0, 26692, 26831,
    64019, 26984, 64020, 27032, 27106, 27184, 27243, 27206, 27251, 27262,
    27362, 27364, 27606, 27711, 27740, 27782, 27759, 27866, 27908, 28039,
    28015, 28054, 28076, 28111, 28152, 28146, 28156, 28217, 28252, 28199,
    28220, 28351, 28552, 28597, 28661, 28677, 28679, 28712, 28805, 28843,
    28943, 28932, 29020, {f: 2, c: 28998}, 0, 29121, 29182, 29361, 29374,
    29476, 64022, 29559, 29629, 29641, 29654, 29667, 29650, 29703, 29685,
    29734, 29738, 29737, 29742, 0, 29833, 29855, 29953, 30063, 30338, 30364,
    30366, 30363, 30374, 64023, 30534, 21167, 30753, 30798, 30820, 30842,
    31024, {f: 3, c: 64024}, 31124, 64027, 31131, 31441, 31463, 64028, 31467,
    31646, 64029, 32072, 0, 32183, 32160, 32214, 32338, 32583, 32673, 64030,
    33537, 33634, 33663, 33735, 33782, 33864, 33972, 34131, 34137, 34155,
    64031, 34224, {f: 2, c: 64032}, 34823, 35061, 35346, 35383, 35449, 35495,
    35518, 35551, 64034, 35574, 35667, 35711, 36080, 36084, 36114, 36214,
    64035, 36559, 0, 64037, 36967, 37086, 64038, 37141, 37159, 37338, 37335,
    37342, {f: 2, c: 37357}, {f: 2, c: 37348}, 37382, 37392, 37386, 37434,
    37440, 37436, 37454, 37465, 37457, 37433, 37479, 37543, {f: 2, c: 37495},
    37607, 37591, 37593, 37584, 64039, 37589, 37600, 37587, 37669, 37665,
    37627, 64040, 37662, 37631, 37661, 37634, 37744, 37719, 37796, 37830,
    37854, 37880, 37937, 37957, 37960, 38290, 0, 64041, 38557, 38575, 38707,
    38715, 38723, 38733, 38735, [12205, 38737], 0, 38999, 39013,
    {f: 2, c: 64042}, 39207, 64044, 39326, 39502, 39641, 39644, 39797, 39794,
    39823, 39857, 39867, 39936, 40304, 40299, 64045, 40473, 40657, {s: 636},
    8364, 8486, 0, 0, 64256, {f: 2, c: 64259}, 257, 299, 363, 275, 333, 256,
    298, 362, 274, 332, {f: 4, c: 8539}, {f: 2, c: 8531}, 8304,
    {f: 6, c: 8308}, {f: 10, c: 8320}, 461, 282, 0, 7868, 463, 0, 296, 465, 0,
    467, 366, 360, 462, 283, 0, 7869, 464, 0, 297, 466, 0, 468, 367, 361, 593,
    8049, 8048, 509, 0, 596, 0, 0, 601, 0, 0, 602, 0, 0, 603, 8051, 8050, 0,
    331, 629, 652, 0, 0, 658, 643, 720, {s: 682}, {f: 10, c: 12832}, {s: 108},
    {f: 4, c: 12892}, {f: 15, c: 12977}, {s: 50}, {f: 26, c: 9424},
    {f: 26, c: 9398}, {s: 48}, {f: 47, c: 13008}, 0, {f: 10, c: 12928}, 12944,
    {f: 6, c: 12938}, 0, 12959, {s: 6}, {f: 2, c: 12960}, 12955, 12954, 12963,
    12962, 12951, 0, 12956, 12949, {s: 6}, 9676, {s: 11}, 10111,
    {f: 10, c: 9451}, {s: 510}, 8414, {s: 815}, 13274, {s: 3}, 8448, 13250, 0,
    0, 8453, 0, 13169, 0, 0, 13197, 13211, {s: 3}, {f: 2, c: 13271}, {s: 3},
    {f: 2, c: 13057}, 13060, 13062, 0, 13064, 0, 13063, 13066, 0, 13065, 0,
    13067, 0, 13068, {f: 6, c: 13070}, 0, 13079, 0, 13081, 0, {f: 4, c: 13082},
    {f: 3, c: 13087}, 13092, 0, 13093, 0, 0, {f: 2, c: 13096}, 0, 13101, 0, 0,
    {f: 3, c: 13102}, 13106, 0, 0, {f: 2, c: 13108}, 13116, {s: 3}, 13111, 0,
    13112, 13114, 13117, 13121, {f: 3, c: 13118}, {f: 4, c: 13123}, 13128,
    {f: 2, c: 13131}, {f: 2, c: 13135}, 0, 0, 13138, 13140, 0, 0, 13139,
    {f: 2, c: 13141}, {s: 132}, 8501, 976, 8714, 8463, 0, 981, 987, 977, 0,
    {f: 2, c: 9832}, 9836, {s: 5}, 12347, 0, {f: 3, c: 12339}, 8252, 8265,
    {s: 5}, 8723, 0, 8771, {f: 2, c: 8818}, {s: 6}, {f: 2, c: 12312},
    {f: 2, c: 65375}, {s: 10}, 9115, {f: 2, c: 9117}, 9120, {s: 4}, 9121,
    {f: 2, c: 9123}, 9126, {s: 12}, [9116, 9119, 9122, 9125, 9130], {s: 8},
    9986, 0, 0, 12349, 0, 12447, 0, 0, 8709, 8864, 8854, 8856, 8853, 8855,
    {s: 4}, 9664, 9654, {s: 4}, 8656, 8596, {f: 2, c: 8600}, {f: 2, c: 8598},
    8652, 8651, {s: 10}, 12336, 8967, {s: 8}, 10048, 10047, {s: 7}, 9643, 0,
    9642, 0, 10010, {s: 12}, 9702, {s: 4}, 10070, {s: 379}, {f: 2, c: 65093},
    {s: 679}, 64103, 64098, 32227, [12232, 40643], 28331, 64082, 64061, 64069,
    64062, 27114, 28212, 64096, 64071, 64056, 64066, 64078, 34395, 64105,
    64052, 64099, 25581, 25802, 30799, 64084, 63856, 64077, 64097, 64072,
    64076, {f: 2, c: 64091}, 64081, 64067, 64090, 28041, 29376, 0, 194885,
    64086, 64080, 64049, 64059, 24034, 64063, 64101, 21373, 64055, 64095,
    24501, 64064, 0, 64083, 0, 64085, 64104, 64068, 64089, 26202, 64053, 64075,
    64100, 64065, 64048, 0, 64057, 64051, 27493, 64058, 27599, 64050, 25150,
    64079, 63773, 63964, 63798, 28122, 63952, 26310, 27511, 64087, 37706, 0,
    37636, {s: 120}, 133390, {s: 120}, 35999, 11991, [11965, 158033], {s: 5},
    37555, 38321, 0, 0, 194812, {s: 13}, 194965, {s: 8}, 194794, 0, 26478,
    11974, 0, 194594, {s: 13}, 13314, 0, 0, 26083, {s: 4}, 134071, {s: 10},
    171339, 0, 194611, 24378, {s: 8}, 11945, 0, 20465, {s: 7}, 63753, {s: 7},
    11964, 0, 0, 194732, 26435, {s: 3}, 133732, 35329, 25142, 0, 0, 21555,
    23067, {s: 3}, 25221, 0, 0, 194819, {s: 6}, 21567, {s: 9}, 27506, {s: 4},
    29986, 19256, 0, 0, 24063, {s: 6}, 194827, 29626, 134047, {s: 3}, 194600,
    0, 194849, {s: 5}, 194623, {s: 16}, 194675, {f: 2, c: 11916}, 23577,
    {s: 3}, 131083, 23426, 194642, {s: 5}, 11997, [11999, 39136],
    [11998, 169599], 14221, 0, [11927, 14586], 0, 194887, 0, [11909, 20155],
    131490, {s: 7}, 13599, 0, 194738, 0, 0, [11971, 35200], {s: 4}, 31237,
    {s: 4}, 35498, 0, 32085, 0, 28568, {s: 7}, 25591, 30246, {s: 4},
    [11978, 163767], {s: 5}, 146686, {s: 5}, 13351, 0, 0, 33067, 0, 0, 194842,
    {s: 5}, 11950, {s: 5}, 194714, {s: 3}, 194831, {s: 19}, 22305, 135741,
    194586, 0, 64003, {s: 7}, 21534, 15240, 20839, {s: 4}, 63839, {s: 9},
    20023, {s: 13}, [11946, 150804], 24421, 23020, 194658, 0, 24217, {s: 46},
    13416, {s: 8}, 21200, {s: 9}, 26625, 0, 195024, 195039, {s: 5}, 153215, 0,
    0, 11959, {s: 4}, 36534, 63775, {s: 3}, 63875, {s: 5}, 31867, 63906, 0,
    63898, 0, [11961, 32770], 157360, {s: 4}, [11911, 132648], 0, 0, 131210,
    194604, [11915, 13630], {s: 4}, 21589, 0, 22841, 0, 0, 23414, 194669,
    23572, 14306, 23782, 0, 20040, 0, 0, 194742, {s: 4}, 158105, 25371, 0, 0,
    26211, 0, 194779, 0, 0, 27126, 27014, {s: 3}, 27596, 0, 28183, 0, 0, 27818,
    {s: 3}, [11942, 20012], 0, 0, 29935, 30069, 30188, 30286, 16305, 30570,
    30633, {s: 6}, 31571, 0, 0, 16996, {s: 3}, 194924, 0, 0, 32328, {s: 5},
    11955, {s: 4}, 33089, 17491, 0, [11966, 33401], [11967, 64094],
    [11968, 64093], 0, 20857, 33626, {s: 3}, 17701, 0, 34292, 131248, {s: 4},
    34429, 0, 13358, 35014, {s: 6}, 18406, {s: 8}, 36808, {s: 19}, 166279, 0,
    0, 167447, 0, 0, 38969, {s: 6}, 39432, {s: 4}, 39903, {s: 10}, 148206,
    {s: 5}, 21385, 0, 64017, 194785, 0, 146622, 132625, 0, {f: 2, c: 19972},
    19999, 20011, {f: 2, c: 20015}, {f: 2, c: 20032}, 20036, [11907, 20058],
    20095, 20109, 20118, 20153, 20176, 20192, 20221, 20223, 20235, 20245,
    20320, 20283, 20297, 20308, 20346, {f: 2, c: 20349}, 20375, 20414, 20431,
    20477, {f: 2, c: 20480}, 20496, 20507, 20519, 20526, 20567, 20582, 20586,
    20539, 20623, 20630, 20636, 20684, 20710, 20713, 20719, 20744, 20747,
    20752, 20763, 20766, 20831, 20897, 20924, 0, 20974, 20980, 20993,
    [11913, 20994], 21011, 21065, 21089, 21094, 21139, 21192, 21232,
    {f: 2, c: 21258}, 21310, 21324, 21323, 21345, 21356, 21419, 21466, 21478,
    21493, 21543, 21581, 21606, 21611, 21620, 21645, 21654, 21665, 21677,
    21689, 21695, 21702, 21709, 21774, 21803, 21813, 21834, 21856, 0, 21896,
    21902, 22024, {f: 2, c: 22030}, 22071, 22079, 22089, 22091, 22095, 22118,
    22121, 22127, {f: 2, c: 22129}, 22165, 22170, {f: 2, c: 22188}, 22193,
    22217, 22237, 22244, 22282, 22293, 22307, 22319, {f: 2, c: 22323}, 22348,
    22384, 22412, 22428, 22456, 22502, 22509, {f: 2, c: 22517}, 22527, 22537,
    22560, 22578, 22652, 22656, 22697, 22734, 22736, 22740, 22746, 22761,
    22796, 22820, 22831, 22881, 22893, 22986, 22994, 23005, {f: 2, c: 23011},
    23044, 23052, 23075, 23111, 23125, 23139, 23149, 23166, 23198, 23207,
    23212, 23219, 23264, 23296, 23321, 23333, 23341, 23361, 23420,
    {f: 2, c: 23422}, 23434, [11919, 23587], 23595, 23600, 23651, 23657, 23676,
    23755, 23762, 23796, 23844, 23846, 23875, 23878, 23882, 23954, 23956,
    23961, 23968, 24024, 24032, 24056, 24064, 24082, {f: 2, c: 24084}, 24088,
    24110, 24152, {f: 2, c: 24171}, 24232, 24234, {f: 2, c: 24254}, 0, 24274,
    24327, 24334, {f: 2, c: 24348}, 24354, 24360, 24374, 24379, 24384,
    [12089, 24400], 24408, 24420, 24457, 24476, 24487, 24484, 24495, 24504,
    [11926, 24516], 24521, 24545, 24553, 24557, 24572, 24599, 24602, 24627,
    24673, 24703, 24734, 24740, 24752, 24779, 24795, 24824, {f: 3, c: 24850},
    24860, 24956, 24973, 24991, 25000, 25026, 25055, 25109, 25129, 25155,
    25158, [11928, 25164], 25169, 25174, 25284, 25340, 25354, 25357, 25368,
    25401, {f: 2, c: 25410}, 25445, 25460, 25469, 25476, 25479, 25488, 25502,
    25553, 25564, 25609, 25616, 25634, 25684, 25691, 25709, 25723,
    {f: 2, c: 25790}, 25829, 25847, 25851, 25860, 25878, 25881, 25927, 25959,
    25985, 25989, 26050, 26096, 26098, 26156, 26188, {f: 2, c: 26203}, 26209,
    26219, 0, 26276, 26312, 26348, 26373, 26387, 26419, 26440, 26444, 26486,
    26491, 26544, 26546, 26617, 26583, 26585, 26608, 26668, {f: 2, c: 26672},
    26715, 26738, 26741, 26746, 26756, 26789, 26802, 26832, 26838, 26856,
    26861, {f: 2, c: 26864}, 26876, 26897, 26899, 26933, 26939, 26967, 26979,
    26994, {f: 2, c: 27007}, 27046, 27053, 27063, {f: 2, c: 27094}, 27137,
    27151, 27157, 27176, 27188, 27198, 27205, {f: 2, c: 27216}, 27222, 27227,
    27267, 27273, 27281, {f: 3, c: 27293}, 27356, 27367, 27372, 27422, 27428,
    27445, 27462, 27478, 27488, 27522, 27582, 27617, 27633, 27664, 27699,
    [11937, 27701], 11938, 27737, 27766, 27771, 27781, 27797, 27804, 27856,
    27860, 27862, 27872, {f: 2, c: 27883}, 27886, 27914, 27918, 27921, 27950,
    27991, 27998, 28005, 28034, 28095, 28100, 28106, 28118, 28137, 28194,
    28241, 28359, 28362, 28366, 28413, 28442, 28458, 28463, 28467, 28506,
    28510, 28514, 28541, 28555, 28557, 28562, 28564, 28570, {f: 2, c: 28583},
    28598, 28634, 28638, 0, 28729, 28732, 0, 28756, {f: 2, c: 28765}, 28772,
    [11939, 28780], 28798, 28801, 28821, 28855, {f: 2, c: 28883}, 28888, 28892,
    28935, 28960, 28977, 29002, 29010, 29024, 29049, 29074, 0, 29131, 29139,
    29142, 29184, 29213, 29227, 29240, 29249, 29267, {f: 2, c: 29269}, 29276,
    29325, [11944, 29357], 29364, 29383, 29435, {f: 2, c: 29444}, 29480, 29489,
    29507, 29548, 29564, 29571, {f: 2, c: 29573}, 29589, {f: 3, c: 29598},
    29606, 29611, 29621, 29623, 29628, 29647, 29657, 29673, 29684, 29693,
    29700, 29706, {f: 2, c: 29722}, 29732, 29736, 29740, {f: 3, c: 29743},
    29753, 29764, 29767, 29771, 29773, 29777, 29783, 29798, 29803, 29809,
    29824, {f: 3, c: 29829}, 29840, 29848, 29852, 29856, 29859, 29864, 29867,
    29877, 29887, 29896, 29914, 29918, 30030, 30073, 30081, 30096,
    [12135, 30098], 30099, 30132, 30180, 30201, 30208, 30218, {f: 2, c: 30229},
    30233, 30238, 30253, 30261, 30275, 30283, 30309, 30317, 30319, 30321,
    30324, {f: 2, c: 30372}, 30405, 30412, 30444, 30460, 30516, 30518, 30556,
    {f: 2, c: 30559}, 30578, 30589, 30613, 30634, 30694, 30704, 30708, 30726,
    30754, {f: 2, c: 30765}, 30768, 30773, 30824, 30878, 30920, 30924, 30926,
    30948, {f: 2, c: 30944}, 30962, 30967, 30971, 31025, 0, [11949, 31035],
    31037, 31045, {f: 2, c: 31067}, 31115, 31126, 31128, [12145, 31160], 31163,
    31178, 31194, 31235, 31241, 31249, 31262, 31277, 31289, 31301, 31308,
    31325, 0, 31341, 31352, 31392, 31395, 31411, {f: 2, c: 31419}, 31430,
    31495, 31508, 31527, 31537, 31559, 31566, 31584, 31593, 31597, 31602,
    31633, 31663, 31703, 31705, 31755, 31759, 31776, 31782, 31793, 31798,
    31825, 31833, 31847, 31854, 31856, 31932, 31935, {f: 2, c: 31944}, 31959,
    31961, 31965, 31979, {f: 3, c: 32007}, 32019, 32029, 32035, 32065, 32083,
    32089, 32093, 32122, 32134, {f: 2, c: 32139}, 32204, 32235, 32241, 32249,
    32264, 32273, 32277, 32288, 32327, 32354, 32366, 32371, 32397, 32401,
    32408, 32580, 32591, [11947, 11954, 32594], [11953, 32595], 32609, 32657,
    32703, 32718, 32735, 32741, 32748, {f: 2, c: 32750}, 32762, 32782, 32785,
    32788, 32804, 32806, 32826, 32828, 32864, 32881, 32885, 32926, 32934,
    32939, {f: 2, c: 32983}, 33046, 33048, 33082, 33098, 33100, 33153, 33156,
    33204, 33231, 33273, 33283, 33313, 33330, 33332, 33350, 33355, 33359,
    33422, 33454, 33463, 33470, 33478, 33534, 33603, 33617, 33621, 33670,
    33677, 33682, 33688, 33705, {f: 2, c: 33727}, 33770, 33807, 33809, 33866,
    33910, 33960, 33967, 33984, 33986, 34032, 34045, 34060, 34100, 34142,
    34191, 34231, 34254, 34221, 34322, 34345, 34386, 34403, 34412, 34415,
    34426, 34445, 34449, 34456, {f: 2, c: 34471}, 34554, 34557, 34571, 34579,
    34585, 34590, 34600, 34622, 34673, 34696, 34713, {f: 2, c: 34732}, 34741,
    34774, 34795, 34797, 34817, 0, 34822, 34827, 34836, 34844, 34902, 34911,
    [11970, 34916], 34968, 34986, {f: 2, c: 35005}, 35018, 35026, 35035,
    {f: 2, c: 35056}, 35078, {f: 3, c: 35096}, 35111, 35120, 35134, 35195,
    35284, 35286, 35301, 35313, 35335, 35343, 35349, 35362, 35406, 35455,
    35572, 35615, 35639, {f: 2, c: 35651}, 35668, 35740, 35742, 35911, 35924,
    35955, 36004, 36057, 36065, 36088, 36094, 36123, 36201, 36204, 36228,
    36237, 36245, 36262, 36294, 36302, 36324, 36332, 36384, 36427, 36460,
    36464, 36474, 36498, 36526, 36531, 36561, 36564, 36601, 36631, 36662,
    36774, [12193, 36789], [11981, 36790], 0, 36832, 36836, 36854, 36866,
    36908, 36932, 37000, 37013, 37017, 37019, 37026, 37044, 37079, 37085,
    37108, 37143, 37148, 37169, 37178, 37181, 37192, 37211, 37217, 37220,
    37262, 37278, 37288, {f: 2, c: 37293}, 37298, 37308, 37360, 37367, 37371,
    37383, 37416, 37427, 37432, 37443, 37447, 37455, 37472, 37570,
    {f: 2, c: 37579}, 37599, 37645, 37653, 37663, 37671, 37703, 37714, 0,
    37738, 37741, 37787, 37818, 37801, 37825, 37834, 37858, 37882, 37885,
    37903, 37940, 37951, 37973, 37995, 38002, [11986, 38264], 38310, 38313, 0,
    38324, 38333, 38362, [11983, 11990, 38429], 38465, 38488, 38532, 38564,
    38569, 38610, 195060, 38622, 38633, 38641, 38658, 38665, 38746, 38755,
    38766, 38771, 38810, 38818, {f: 2, c: 38837}, 38873, 38878, 38900, 38922,
    38926, 38942, 38947, 38955, 38974, {f: 2, c: 38994}, 39001, 39020, 39096,
    39098, 39103, 39112, 39141, {f: 2, c: 39218}, 39232, 39245, 39260, 39263,
    39345, {f: 2, c: 39353}, 39369, 39426, 39446, 39460, 39463,
    {f: 2, c: 39469}, 39478, 39480, 39498, 39510, {f: 2, c: 39605}, 39673,
    39683, 39712, {f: 2, c: 39731}, 39795, 39801, 39847, 39873, 39879, 39895,
    39911, 39915, 39927, 39930, 39933, 39947, 39975, 39978, 39990, 40001,
    40019, 40035, 40048, 40055, 40194, 40258, 40263, 40291, 40297, 40316,
    40318, 40333, 40369, 40387, 40391, 40406, 40415, 40427, 40436, 40469,
    40477, 40612, 40616, 40620, 40679, 40686, 40720, 40722, 40727, 40729,
    40751, 40759, 40761, 40769, 40773, 40791, 40808, 40817, 40821, 40848,
    40852, 40866, 0, 13317, 194564, 22048, 24267, 11925, 0, 144954, 0, 28665,
    28390, 29107, [11940, 64073], {s: 4}, [11980, 64102], 0, 23986, 0, 20435,
    20697, 20720, 20931, 22134, 27220, 27905, 28112, 28226, 28377, 29668,
    29729, 30060, 30801, 34805, 144382, 29608, 15091, 13531, 17420, 16010, 0,
    0, 19432, 0, 16090, 15138, 0, 17786, 16531, 0, 18021, 16643, 17043, 18094,
    13448, 140809, {f: 3, c: 63584}, 63610, 63615, {s: 23}, {f: 2, c: 8836},
    {f: 2, c: 8842}, 8713, 0, {f: 2, c: 8965}, {s: 9}, {f: 2, c: 8741},
    {s: 14}, 8802, 0, 8773, 8776, {f: 2, c: 8822}, {s: 4}, 8487, {s: 209},
    {f: 2, c: 8922}, 8533, 8984, {f: 2, c: 7742}, {f: 2, c: 504}, 470, 472,
    474, 476, 260, 728, 317, 346, 350, 356, 377, 379, 261, 731, 318, 347, 711,
    351, 357, 378, 733, 380, 340, 258, 313, 262, 268, 280, 270, 323, 327, 336,
    344, 368, 354, 341, 259, 314, 263, 269, 281, 271, 273, 324, 328, 337, 345,
    369, 355, 729, 264, 284, 292, 308, 348, 364, 265, 285, 293, 309, 349, 365,
    625, 651, 638, 620, 622, 633, 648, 598, 627, 637, 642, 656, 635, 621, 607,
    626, 669, 654, 609, 624, 641, 295, 661, 660, 614, 664, 450, 595, 599, 644,
    608, 403, 616, 649, 600, 604, 606, 592, 623, 650, 612, 594, 653, 613, 674,
    673, 597, 657, 634, 615, 865, 712, 716, 721, 8255, 783, {f: 5, c: 741}, 0,
    0, 805, 812, 825, 796, {f: 2, c: 799}, 829, 809, 815, 734, 804, 816, 828,
    820, {f: 2, c: 797}, {f: 2, c: 792}, 810, {f: 2, c: 826}, 794, {s: 3},
    {f: 2, c: 610}, 618, 628, 630, 632, 640, 655, 665, 668, 671, 688, 690, 695,
    704, {f: 2, c: 736}, {s: 6}, 8862, {s: 287}, 12348, 12543, 0,
    {f: 2, c: 12310}, 9838, 9835, {f: 2, c: 10548}, 10687, 0, 12448, 0,
    {f: 2, c: 10746}, {s: 13}, 962, {f: 10, c: 9461}, {f: 2, c: 9750}, 9649,
    {f: 10, c: 12784}, 0, {f: 6, c: 12794}, {f: 15, c: 9150}, 0, 0, 10003, 0,
    9251, 9166, {f: 4, c: 9680}, {f: 2, c: 8263}, 0, 8273, 8258,
    {f: 16, c: 12688}, {s: 13}, {f: 2, c: 9136}, {f: 12, c: 9842},
    {f: 2, c: 12441}, 8413, {s: 450}, 20296, 20319, 20330, 20332, 20494, 20504,
    20545, 20722, 20688, 20742, 20739, 20789, 20821, 20823, 13493, 20938,
    20962, 21079, 21196, 21206, 21243, 21276, 21347, 21405, 21522, 21631,
    21640, 21840, 21889, 21933, 21966, 22075, 22174, 22185, 22195, 22391,
    22396, 135963, 22479, 22500, 22628, 22665, 136302, 22738, 22752, 34369,
    22923, 22930, 22979, 23059, 23143, 23159, 23172, 23236, 137405, 23421,
    23443, 23570, 64060, 136884, 23674, 23695, 23711, 23715, 23722, 23760,
    138804, 23821, 23879, 23937, 23972, 23975, 24011, 24158, 24313, 24320,
    24322, 24355, 24381, 24404, 24445, 24589, 24596, 24600, 24629, 24647,
    24733, 24788, 24797, 24875, 25020, 25017, 25122, 25178, 25199, 25302,
    25468, 25573, 25721, 25796, 25808, 25897, 26013, 26170, 26146, 26155,
    26160, 26163, 26184, 143812, {f: 2, c: 26231}, 26253, 26299, 26331, 26344,
    26439, 26497, 26515, 26520, 26523, 26620, 26653, 26787, 26890, 26953,
    144836, 26946, 26980, 27045, 27087, 15286, 15299, 27113, 27125, 145215,
    27195, 145251, 27284, 27301, 15375, 27419, 27436, 27495, 27561, 27565,
    27607, 27647, 27653, 27764, 27800, 27899, 27846, 27953, 27961, 27967,
    27992, 28052, 28074, 28123, 28125, 28228, 28254, 28337, 28353, 28432,
    28505, 28513, 28542, 28556, 28576, 28604, 28615, 28618, 28656, 28750,
    28789, 28836, 28900, 28971, 28958, 28974, 29009, 29032, 29061, 29063,
    29114, 29124, 29205, 15935, 29339, 149489, 29479, 29520, 29542, 29602,
    29739, 29766, 29794, 29805, 29862, 29865, 29897, 29951, 29975, 16242,
    30158, 30210, 30216, 30308, 30337, 30365, 30378, 30390, 30414, 30420,
    30438, 30449, 30474, 30489, {f: 2, c: 30541}, 30586, 30592, 30612, 30688,
    152718, 30787, 30830, 30896, 152846, 30893, 30976, 31004, 31022, 31028,
    31046, 31097, 31176, 153457, 31188, 31198, 31211, 31213, 31365, 154052,
    31438, 31485, 31506, 31533, 31547, 31599, 31745, 31795, 155041, 31853,
    31865, 31887, 31892, 31904, 31957, 32049, 32092, 32131, 32166, 32194,
    32296, 32663, 32731, 32821, 32823, 32970, 32992, 33011, 33120,
    {f: 2, c: 33127}, 33133, 33211, 33226, 33239, 17499, 33376, 33396, 158463,
    33441, {f: 2, c: 33443}, 33449, 33471, 33493, 33533, 33536, 33570, 33581,
    33594, 33607, 33661, 33703, 33743, 33745, 33761, 33793, 33798, 33887,
    33904, 33907, 33925, 33950, 33978, 159296, 34098, 34078, 34095, 34148,
    34170, 34188, 34210, 34251, 34285, 34303, {f: 2, c: 34308}, 34320, 159988,
    34328, 34360, 34391, 34402, 17821, 34421, 34488, 34556, 34695, 17898,
    34826, 34832, 35022, 161412, 35122, 35129, 35136, 35220, 35318, 35399,
    35421, 35425, 35445, 35536, 35654, 35673, 35689, 35741, 35913, 35944,
    36271, 36305, 36311, 36387, 36413, 36475, 164471, 18500, 36602, 36638,
    36653, 36692, 164813, 36840, 36846, 36872, 36909, 37015, 37043, 37054,
    {f: 2, c: 37060}, 37063, 37103, 37140, 37142, {f: 2, c: 37154}, 37167,
    37172, 37251, 37361, 37705, {f: 2, c: 37732}, 37795, 37855, 37892, 37939,
    37962, 37987, 38001, 38286, 38303, 38316, 38326, 38347, 38352, 38355,
    18864, 38366, 38565, 38639, 38734, 38805, 38830, 38842, 38849, 38857,
    38875, 38998, 39143, 39256, 39427, 39617, 39619, 39630, 39638, 39682,
    39688, 19479, 39725, 39774, 39782, 39812, 39818, 39838, 39886, 39909,
    39928, 39971, {f: 2, c: 40015}, 40037, {f: 2, c: 40221}, 40259, 40274,
    40330, 40342, 40384, 40364, 40380, 172432, 40423, 40455, 40606, 40623,
    40855, 131209, 19970, 19983, 19986, 20009, 20014, 20039, 131234, 20049,
    13318, 131236, 20073, 20125, 13356, 20156, 20163, 20168, 20203, 20186,
    20209, 20213, 20246, 20324, 20279, 20286, 20312, 131603, {f: 2, c: 20343},
    20354, 20357, 20454, 20402, 20421, 20427, 20434, 13418, 20466, 20499,
    20508, 20558, 20563, 20579, 20643, 20616, {f: 2, c: 20626}, 20629, 20650,
    131883, 20657, {f: 2, c: 20666}, 20676, 20679, 20723, 131969, 20686,
    131953, 20692, 20705, 13458, 132089, 20759, 132170, 20832, 132361, 20851,
    20867, 20875, 13500, 20888, 20899, 20909, 13511, 132566, 20979, 21010,
    21014, 132943, 21077, 21084, 21100, 21111, 21124, 21122, 133127, 21144,
    133178, 21156, {f: 2, c: 21178}, 21194, 21201, 133305, 21239, 21301, 21314,
    133500, 133533, 21351, 21370, 21412, 21428, 133843, 21431, 21440, 133917,
    {f: 2, c: 13661}, 21461, 13667, 21492, 21540, 21544, 13678, 21571, 21602,
    21612, 21653, 21664, 21670, 21678, 21687, 21690, 21699, 134469, 21740,
    21743, 21745, 21747, {f: 2, c: 21760}, 21769, 21820, 21825, 13734, 21831,
    13736, 21860, 134625, 21885, 21890, 21905, 13765, 21970, 134805, 134765,
    21951, 21961, 21964, 21969, 21981, 13786, 21986, 134756, 21993, 22056,
    135007, 22023, 22032, 22064, 13812, 22077, 22080, 22087, 22110, 22112,
    22125, 13829, 22152, 22156, 22173, 22184, 22194, 22213, 22221, 22239,
    22248, {f: 2, c: 22262}, 135681, 135765, 22313, 135803, {f: 2, c: 22341},
    22349, 135796, 22376, 22383, {f: 3, c: 22387}, 22395, 135908, 135895,
    22426, {f: 2, c: 22429}, 22440, 22487, 135933, 22476, 135990, 136004,
    22494, 22512, 13898, 22520, 22523, 22525, 22532, 22558, 22567, 22585,
    136132, 22601, 22604, 22631, {f: 2, c: 22666}, 22669, {f: 2, c: 22671},
    22676, 22685, 22698, 22705, 136301, 22723, 22733, 22754, {f: 2, c: 22771},
    {f: 2, c: 22789}, 22797, 22804, 136663, 13969, 22845, 13977, 22854, 13974,
    158761, 22879, 136775, {f: 2, c: 22901}, 22908, 22943, 22958, 22972, 22984,
    22989, 23006, 23015, 23022, 136966, 137026, 14031, 23053, 23063, 23079,
    23085, 23141, 23162, 23179, 23196, {f: 2, c: 23199}, 23202, 23217, 23221,
    23226, 23231, 23258, 23260, 23269, 23280, 23278, 23285, 23304, 23319,
    23348, 23372, 23378, 23400, 23407, 23425, 23428, 137667, 23446, 23468,
    {f: 2, c: 14177}, 23502, 23510, 14188, 14187, 23537, 23549, 14197, 23555,
    23593, 138326, 23647, {f: 2, c: 23655}, 23664, 138541, 138565, 138616,
    138594, 23688, 23690, 14273, 138657, 138652, 23712, 23714, 23719, 138642,
    23725, 23733, 138679, 23753, 138720, 138803, 23814, 23824, 23851, 23837,
    23840, 23857, 23865, 14312, 23905, 23914, 14324, 23920, 139038, 14333,
    23944, 14336, 23959, 23984, 23988, 139126, 24017, 24023, 139258, 24036,
    24041, 14383, 14390, 14400, 24095, 24126, 24137, 14428, 24150, 14433,
    {f: 2, c: 24173}, 139643, 24229, 24236, 24249, 24262, 24281, 140062, 24317,
    24328, 140205, 24350, 24391, 24419, 24434, 24446, 24463, 24482, 24519,
    24523, {f: 3, c: 24530}, 24546, {f: 2, c: 24558}, 24563, 14615, 24610,
    24612, 14618, 24652, 24725, 24744, 141043, 24753, 24766, 24776, 24793,
    24814, 24821, 24848, 24857, 24862, 24890, 14703, 24897, 24902, 24928,
    141403, {f: 2, c: 24978}, 24983, 24997, 25005, 141483, 25045, 25053, 25077,
    141711, 25123, 25170, 25185, 25188, 25211, 25197, 25203, 25241, 25301,
    142008, 25341, 25347, 25360, {f: 2, c: 142159}, 25394, 25397,
    {f: 2, c: 25403}, 25409, 25412, 25422, 142150, 25433, 142365, 142246,
    25452, 25497, 142372, 25492, 25533, {f: 2, c: 25556}, 25568,
    {f: 2, c: 25579}, 25586, 25630, 25637, 25641, 25647, 25690, 25693, 25715,
    25725, 25735, 25745, 25759, {f: 2, c: 25803}, 25813, 25815, 142817, 25828,
    25855, 14958, 25871, 25876, 14963, 25886, 25906, 25924, 25940, 25963,
    25978, 25988, 25994, 26034, 26037, 26040, 26047, 26057, 26068, 15062,
    26105, 26108, 26116, 26120, 26145, 26154, 26181, 26193, 26190, 15082,
    143811, 143861, 143798, 26218, {f: 2, c: 26220}, 26235, 26240, 26256,
    26258, 15118, 26285, 26289, 26293, 15130, 15132, 15063, 26369, 26386,
    144242, 26393, 144339, 144338, 26445, 26452, 26461, 144336, 144356, 144341,
    26484, 144346, 26514, 144351, 33635, 26640, 26563, 26568, 26578, 26587,
    26615, 144458, 144465, 144459, 26648, 26655, 26669, 144485, 26675, 26683,
    26686, 26693, 26697, 26700, 26709, 26711, 15223, 26731, 26734, 26748,
    26754, 26768, 26774, 15213, {f: 3, c: 26776}, 26780, {f: 2, c: 26794},
    26804, 26811, 26875, 144612, 144730, 26819, 26821, 26828, 26841,
    {f: 2, c: 26852}, 26860, 26871, 26883, 26887, 15239, 144788, 15245, 26950,
    26985, 26988, 27002, 27026, 15268, 27030, 27056, 27066, 27068, 27072,
    27089, 144953, 144967, 144952, 27107, {f: 2, c: 27118}, 27123, 15309,
    27124, 27134, 27153, 27162, 27165, 145180, {f: 2, c: 27186}, 27199, 27209,
    27258, 27214, 27218, 27236, 145164, 27275, 15344, 27297, 145252, 27307,
    27325, 27334, 27348, 27344, 27357, 145407, 145383, {f: 3, c: 27377}, 27389,
    145444, 27403, {f: 3, c: 27407}, 145469, 27415, 15398, 27439, 27466, 27480,
    27500, 27509, [11934, 27514], 27521, 27547, 27566, 146072, 27581,
    {f: 3, c: 27591}, 27610, {f: 2, c: 27622}, 27630, 27650, 27658, 27662,
    27702, 146559, 27725, 27739, 27757, 27780, 27785, 15555, 27796, 27799,
    27821, 27842, 15570, 27868, 27881, 27885, 146688, 27904, 27940,
    {f: 2, c: 27942}, 27751, 27951, 27964, 27995, 28000, 28016,
    {f: 2, c: 28032}, 28042, 28045, 28049, 28056, 146752, 146938, 146937,
    146899, 28075, 28078, 28084, 28098, 27956, 28104, 28110, 28127, 28150,
    28214, 28190, 15633, 28210, {f: 2, c: 28232}, {f: 2, c: 28235}, 28239,
    {f: 2, c: 28243}, 28247, 28259, 15646, 28307, 28327, 28340, 28355, 28469,
    28395, 28409, 28411, 28426, 28428, 28440, 28453, 28470, 28476, 147326,
    28498, 28503, 28512, 28520, 28560, 28566, 28606, 28575, 28581, 28591,
    15716, {f: 2, c: 28616}, 28649, 147606, 28668, 28672, 28682, 28707, 147715,
    28730, 28739, 28743, 28747, 15770, 28773, 28777, 28782, 28790, 28806,
    28823, 147910, 28831, 28849, 147966, 28908, 28874, 28881, 28931, 28934,
    28936, 28940, 15808, 28975, 29008, 29011, 29022, 15828, 29078, 29056,
    29083, 29088, 29090, {f: 2, c: 29102}, 148412, 29145, 29148, 29191, 15877,
    29236, 29241, 29250, 29271, 29283, 149033, {f: 2, c: 29294}, 29304, 29311,
    29326, 149157, 29358, 29360, 29377, 15968, 29388, 15974, 15976, 29427,
    29434, 29447, 29458, {f: 2, c: 29464}, 16003, 29497, 29484, 29491, 29501,
    29522, 16020, 29547, 149654, {f: 2, c: 29550}, 29553, 29569, 29578, 29588,
    29592, 29596, 29605, 29625, 29631, 29637, 29643, 29665, 29671, 29689,
    29715, 29690, 29697, 29779, 29760, 29763, 29778, 29789, 29825, 29832,
    150093, 29842, 29847, 29849, 29857, 29861, 29866, 29881, 29883, 29882,
    29910, 29912, 29931, 150358, 29946, 150383, 29984, 29988, 29994, 16215,
    150550, {f: 2, c: 30013}, 30016, 30024, 30032, 30034, 30066, 30065, 30074,
    {f: 2, c: 30077}, 30092, 16245, 30114, 16247, 30128, 30135,
    {f: 2, c: 30143}, 30150, 30159, 30163, 30173, {f: 2, c: 30175}, 30183,
    30190, 30193, 30211, 30232, 30215, 30223, 16302, 151054, 30227,
    {f: 2, c: 30235}, 151095, 30245, 30248, 30268, 30259, 151146, 16329, 30273,
    151179, 30281, 30293, 16343, 30318, 30357, 30369, 30368, {f: 2, c: 30375},
    30383, 151626, 30409, 151637, 30440, 151842, 30487, 30490, 30509, 30517,
    151977, 16441, 152037, 152013, 30552, 152094, 30588, 152140, 16472, 30618,
    30623, 30626, 30628, {f: 2, c: 30686}, 30692, 30698, 30700, 30715, 152622,
    30725, 30729, 30733, 30745, 30764, 30791, 30826, 152793, 30858, 30868,
    30884, 30877, 30879, 30907, 30933, 30950, {f: 2, c: 30969}, 30974, 152999,
    30992, 31003, 31013, 31050, 31064, 16645, 31079, 31090, 31125, 31137,
    31145, 31156, 31170, 31175, {f: 2, c: 31180}, 31190, 16712, 153513, 153524,
    16719, 31242, 31253, 31259, 16739, 31288, 31303, 31318, 31321, 31324,
    31327, 31335, 31338, 31349, 31362, 31370, 31376, 31404, 154068, 16820,
    31417, 31422, 16831, 31436, 31464, 31476, 154340, 154339, 154353, 31549,
    31530, {f: 2, c: 31534}, 16870, 16883, 31615, 31553, 16878, 31573, 31609,
    31588, 31590, 31603, 154546, 16903, 31632, 31643, 16910, 31669, 31676,
    31685, 31690, 154699, 154724, 31700, 31702, 31706, 31722, 31728, 31747,
    31758, 31813, 31818, 31831, 31838, 31841, 31849, 31855, 155182, 155222,
    155237, 31910, 155234, {f: 2, c: 31926}, 155352, 31940, 155330, 31949,
    155368, 155427, 31974, 155484, 31989, 32003, 17094, 32018, 32030, 155616,
    155604, {f: 2, c: 32061}, 32064, 32071, 155660, 155643, 17110, 32090,
    32106, 32112, 17117, 32127, 155671, 32136, 32151, 155744, 32157, 32167,
    32170, 32182, 32192, 32215, 32217, 32230, 17154, 155885, 64088, 32272,
    32279, 32285, 32295, 32300, 32325, 32373, 32382, {f: 2, c: 32390}, 17195,
    32410, 17219, 32572, 32571, 32574, 32579, 13505, 156272, 156294,
    {f: 2, c: 32611}, 32621, {f: 2, c: 32637}, 32656, 20859, 146702, 32662,
    32668, 32685, 156674, 32707, 32719, 32739, 32754, 32778, 32776, 32790,
    32812, 32816, 32835, 32870, 32891, 32921, 32924, 32932, 32935, 32952,
    157310, 32965, 32981, 32998, 33037, 33013, 33019, 17390, 33077, 33054,
    17392, 33060, 33063, 33068, 157469, 33085, 17416, 33129, 17431, 17436,
    33157, 17442, 33176, 33202, 33217, 33219, 33238, 33243, 157917, 33252,
    157930, 33260, 33277, 33279, 158063, 33284, 158173, 33305, 33314, 158238,
    33340, 33353, 33349, 158296, 17526, 17530, 33367, 158348, 33372, 33379,
    158391, 17553, 33405, 33407, 33411, 33418, 33427, {f: 2, c: 33447}, 33458,
    33460, 33466, 33468, 33506, 33512, 33527, {f: 2, c: 33543}, 33548, 33620,
    33563, 33565, 33584, 33596, 33604, 33623, 17598, 17620, 17587,
    {f: 2, c: 33684}, 33691, 33693, 33737, 33744, 33748, 33757, 33765, 33785,
    33813, 158835, 33815, 33849, 33871, {f: 2, c: 33873}, {f: 2, c: 33881},
    33884, 158941, 33893, 33912, 33916, 33921, 17677, 33943, 33958, 33982,
    17672, {f: 2, c: 33998}, 34003, 159333, 34023, 34026, 34031, 34033, 34042,
    34075, {f: 2, c: 34084}, 34091, 34127, 34159, 17731, 34129,
    {f: 2, c: 34145}, 159636, 34171, 34173, 34175, 34177, 34182, 34195, 34205,
    34207, 159736, {f: 2, c: 159734}, 34236, 34247, 34250, {f: 2, c: 34264},
    34271, 34273, 34278, 34294, 34304, 34321, 34334, 34337, 34340, 34343,
    160013, 34361, 34364, 160057, 34368, 34387, 34390, 34423, 34439, 34441,
    {f: 2, c: 34460}, 34481, 34483, 34497, 34499, 34513, 34517, 34519, 34531,
    34534, 17848, 34565, 34567, 34574, 34576, 34591, 34593, 34595, 34609,
    34618, 34624, 34627, 34641, 34648, {f: 2, c: 34660}, 34674, 34684, 160731,
    160730, 34727, 34697, 34699, 34707, 34720, 160766, 17893, 34750, 160784,
    34753, 34766, 34783, 160841, 34787, {f: 2, c: 34789}, 34794, 34835, 34856,
    34862, 34866, 34876, 17935, 34890, 34904, 161301, 161300, 34921, 161329,
    34927, 34976, 35004, 35008, 161427, 35025, 35027, 17985, 35073, 161550,
    35127, 161571, 35138, 35141, 35145, 161618, 35170, 35209, 35216, 35231,
    35248, 35255, 35288, 35307, 18081, 35315, 35325, 35327, 18095, 35345,
    35348, 162181, 35361, 35381, 35390, 35397, 35405, 35416, 35502, 35472,
    35511, 35543, 35580, 162436, 35594, 35589, 35597, 35612, 35629, 18188,
    35665, 35678, 35702, 35713, 35723, {f: 2, c: 35732}, 35897, 162739, 35901,
    162750, 162759, 35909, 35919, 35927, 35945, 35949, 163000, 35987, 35986,
    35993, 18276, 35995, 36054, 36053, 163232, 36081, 163344, 36105, 36110,
    36296, 36313, 36364, 18429, 36349, 36358, 163978, 36372, 36374,
    {f: 2, c: 36385}, 36391, 164027, 18454, 36406, 36409, 36436, 36450, 36461,
    36463, 36504, 36510, 36533, 36539, 164482, 18510, 164595, 36608, 36616,
    36651, 36672, 36682, 36696, 164876, 36772, 36788, 164949, 36801, 36806,
    64036, 36810, 36813, 36819, 36821, 36849, 36853, 36859, 36876, 36919,
    165227, 36931, 36957, {f: 2, c: 165320}, 36997, 37004, 37008, 37025, 18613,
    37040, 37046, 37059, 37064, 165591, 37084, 37087, 165626, 37110, 37106,
    37120, 37099, {f: 2, c: 37118}, 37124, 37126, 37144, 37150, 37175, 37177,
    {f: 2, c: 37190}, 37207, 37209, 37236, 37241, 37253, 37299, 37302,
    {f: 2, c: 37315}, 166217, 166214, 37356, 37377, {f: 2, c: 37398}, 166251,
    37442, 37450, 37462, 37473, 37477, 37480, 166280, {f: 2, c: 37500}, 37503,
    37513, 37517, 37527, 37529, 37535, 37547, {f: 2, c: 166330}, 37554,
    {f: 2, c: 37567}, 37574, 37582, 37605, 37649, 166430, 166441, 37623, 37673,
    166513, 166467, 37713, 37722, 37739, 37745, 37747, 37793, 166553, 166605,
    37768, 37771, 37775, 37790, 37877, 166628, 166621, 37873, 37831, 37852,
    37863, 37897, {f: 2, c: 37910}, 37883, 37938, 37947, 166849, 166895, 37997,
    37999, 38265, 38278, {f: 2, c: 38284}, 167184, 167281, 38344, 167419,
    167455, 38444, {f: 2, c: 38451}, 167478, 38460, 38497, 167561, 38530,
    167659, 38554, 167730, 18919, 38579, 38586, 38589, 18938, 167928, 38616,
    38618, 38621, 18948, 38676, 38691, 18985, 38710, 38721, 38727, 38743,
    38747, 38762, 168608, 168625, 38806, 38814, {f: 2, c: 38833}, 38846, 38860,
    38865, 38868, 38872, 38881, 38897, 38916, 38925, 38932, 38934, 19132,
    169104, {f: 2, c: 38962}, 38949, 38983, 39014, 39083, 39085, 39088, 169423,
    39095, {f: 2, c: 39099}, 39106, 39111, 39115, 39137, 39139, 39146,
    {f: 2, c: 39152}, 39155, 39176, 19259, 169712, {f: 2, c: 39190}, 169753,
    {f: 3, c: 39194}, 169808, 39217, {f: 3, c: 39226}, 39233, 39238, 39246,
    39264, 39331, 39334, 39357, 39359, 39363, 39380, 39385, 39390, 170182,
    39408, 39417, 39420, 39434, 39441, 39450, 39456, 39473, 39492, 39500,
    39512, 19394, 39599, 19402, 39607, 19410, 39609, 170610, 39622, 39632,
    39634, 39637, 39648, 39653, 39657, 39692, 39696, 39698, 39702, 39708,
    39723, 39741, 19488, 39755, 39779, 39781, {f: 2, c: 39787},
    {f: 2, c: 39798}, 39846, 39852, 171483, 39858, 39864, 39870, 39923, 39896,
    39901, 39914, 39919, 39918, 171541, 171658, 171593, 39958,
    {f: 3, c: 39960}, 39965, 39970, 39977, 171716, 39985, 39991, 40005, 40028,
    171753, {f: 2, c: 40009}, 171739, 40020, 40024, 40027, 40029, 40031,
    {f: 3, c: 40041}, {f: 2, c: 40045}, 40050, 40053, 40058, 40166, 40178,
    40203, [171982, 171991], 40209, {f: 2, c: 40215}, 172079, 19652, 172058,
    40242, 19665, 40266, 40287, 40290, 172281, 172162, 40307, {f: 2, c: 40310},
    40324, 40345, 40353, 40383, 40373, 40377, 40381, 40393, 40410, 40416,
    40419, 19719, 40458, 40450, 40461, 40476, 40571, 139800, 40576, 40581,
    40603, 172940, 40637, 173111, 40671, 40703, 40706, 19831, 40707, 40762,
    40765, 40774, 40787, 40789, 40792, 173553, 40797, 173570, 40809, 40813,
    40816, 173746, 11948, 13844, 14509, 15820, 16348, 17854, 17936, 19326,
    19512, 19681, 19980, {f: 2, c: 20003}, 20089, 20211, 20236, 20249, 20267,
    20270, 20273, 20356, 20382, 20407, 20484, 20492, 20556, 20575, 20578,
    20599, 20622, 20638, 20642, 20675, 20712, 20721, 20734, 20743,
    {f: 3, c: 20748}, 20787, 20792, 20852, 20868, 20920, 20922, 20936, 20943,
    20945, {f: 2, c: 20947}, 20952, 20959, 20997, 21030, 21032, 21035,
    {f: 2, c: 21041}, 21045, 21052, 21082, 21088, 21102, {f: 2, c: 21112},
    21130, 21132, 21217, 21225, 21233, 21251, 21265, 21279, 21293, 21298,
    21309, 21349, 21357, 21369, 21374, 21396, 21401, 21418, 21423, 21434,
    21441, {f: 2, c: 21444}, 21472, 21523, 21546, 21553, {f: 2, c: 21556},
    21580, 21671, 21674, 21681, 21691, 21710, 21738, 21756, 21765, 21768,
    21781, 21799, 21802, 21814, 21841, 21862, 21903, 21906, 21908, 21924,
    21938, 21955, 21958, 21971, 21979, 21996, 21998, 22001, 22006, 22008,
    22021, 22029, {f: 2, c: 22033}, 22060, 22069, 22073, 22093, 22100, 22149,
    22175, 22182, 22199, 22220, 22223, 22233, 22241, 22251, 22253, 22257,
    22279, 22284, {f: 2, c: 22298}, 22301, 22316, 22318, {f: 2, c: 22333},
    22367, 22379, 22381, 22394, 22403, 22423, 22446, 22485, 22503, 22541,
    22566, 22605, 22607, 22623, 22637, 22655, 22657, 22680, 22716, 22815,
    22819, 22873, 22905, 22935, 22959, 22963, 23007, 23025, 23032, 23218,
    23224, 23274, 23286, 23323, 23325, 23329, 23352, 23479, 23511, 23520,
    23583, 23594, 23596, 23606, 23641, 23644, 23661, 23773, 23809, 23860,
    23869, 23897, 23934, 23939, 24007, 24057, 24104, 24114, 24117, 24155,
    24168, 24170, 24183, 24192, 24203, 24243, 24253, 24273, {f: 2, c: 24276},
    24397, 24492, 24554, 24583, 24649, 24660, 24679, 24763, 24772, 24829,
    24842, 24854, 24874, 24886, 24926, 24932, 24955, 24957, 24959, 24989,
    25016, 25052, 25058, 25061, 25064, 25092, 25095, 25137, 25145, 25149,
    25210, 25232, 25256, 25306, 25332, 25366, 25386, 25398, 25414, 25419,
    25427, 25457, 25461, 25471, 25474, 25482, {f: 2, c: 25518}, 25578,
    {f: 2, c: 25592}, 25618, 25624, 25632, 25636, 25642, 25653, 25661, 25663,
    25682, 25695, 25716, 25744, {f: 2, c: 25752}, 25772, 25779, 25837, 25840,
    25883, 25887, 25902, 25929, 25952, 26002, 26005, 26036, 26046, 26056,
    26062, 26064, 26079, 26238, {f: 2, c: 26251}, 26291, 26304, 26319, 26405,
    26421, 26453, 26496, 26511, 26513, 26532, 26545, 26549, 26558, 26664,
    26758, 26859, 26869, 26903, 26931, 26936, 26971, 26981, 27048, 27051,
    27055, 27109, 27121, 27210, 27221, 27239, 27249, 27311, {f: 2, c: 27336},
    27395, 27451, 27455, {f: 2, c: 27517}, 27568, 27639, 27641, 27652, 27657,
    27661, 27692, 27722, 27730, 27732, 27769, 27820, 27828, 27858, 28001,
    28028, 28089, 28144, 28229, 28275, 28283, 28285, 28297, 28348,
    {f: 2, c: 28378}, 28454, 28457, 28464, 28551, 28573, 28590, 28599, 28685,
    28704, 28745, 28824, 28848, {f: 2, c: 28885}, 28997, 29106, 29172, 29207,
    29215, 29251, {f: 2, c: 29263}, 29274, 29280, 29288, 29303, 29316, 29385,
    29413, 29428, 29442, 29451, 29470, 29474, {f: 2, c: 29498}, 29517, 29528,
    29543, 29810, 29871, 29919, 29924, 29940, 29947, 29974, 29985, 30015,
    30046, 30105, 30116, 30145, 30148, 30156, 30167, 30172, 30177, 30191,
    30212, 30220, 30237, 30258, 30264, 30277, 30282, 30303, 30381, 30397,
    30425, 30443, 30448, 30457, 30464, 30478, 30498, 30504, 30511, 30521,
    30526, 30533, 30538, 30543, 30558, 30564, 30567, 30572, 30596,
    {f: 2, c: 30604}, 30614, 30631, 30639, 30647, 30654, 30665, 30673, 30681,
    30705, 30775, 30812, 30846, 30872, 30881, 30897, 30899, 30921, 30931,
    30988, 31007, {f: 2, c: 31015}, 31039, 31042, 31060, 31083, 31100, 31147,
    31172, 31210, 31234, 31244, 31280, 31290, 31300, 31360, 31366, 31380,
    31413, 31421, 31486, 31531, 31607, 31648, 31660, 31664, 31720, 31730,
    31736, 31740, 31742, 31753, 31784, 31791, 31810, {f: 2, c: 31826},
    {f: 3, c: 31835}, 31858, 31869, 31879, 31902, 31930, 31943, 31955, 31962,
    32060, 32077, 32130, 32133, 32141, 32145, 32158, 32179, 32185, 32208,
    32229, {f: 2, c: 32245}, 32303, 32310, 32324, 32367, 32376, 32385, 32573,
    32603, 32605, 32613, 32625, {f: 2, c: 32639}, 32651, 32674,
    {f: 3, c: 32765}, 32775, 32781, 32798, 32825, 32904, 32910, 32975, 32980,
    33005, 33008, 33015, 33018, 33022, 33027, 33047, 33072, 33111, 33135,
    33139, 33163, 33168, 33179, 33182, 33227, 33237, {f: 2, c: 33245}, 33249,
    33263, 33270, 33280, 33291, {f: 2, c: 33299}, 33306, 33338, 33348, 33389,
    33412, 33417, 33425, 33450, 33456, 33488, 33514, 33519, 33526, 33622,
    33656, 33784, 33788, 33880, 33939, 33969, 33981, 34043, 34118, 34134,
    34141, 34181, 34200, 34370, 34374, 34496, 34580, 34594, 34606, 34617,
    34653, 34683, 34700, 34702, {f: 2, c: 34711}, 34718, 34723, 34734, 34751,
    34761, 34778, 34840, 34843, 34861, 34874, 34885, 34891, 34894, 34901,
    34906, 34926, {f: 3, c: 34970}, 35021, 35040, 35055, {f: 2, c: 35086},
    35110, 35125, 35162, 35164, 35179, 35184, 35196, 35237, 35253, 35260,
    35285, 35401, 35415, 35431, 35454, 35462, 35478, 35510, 35529, 35537,
    35549, 35564, 35573, 35590, 35599, 35601, 35653, 35666, 35693, 35704,
    35708, 35710, 35717, 35743, 35915, 35923, 35963, 36026, 36037, 36041,
    36050, 36076, 36085, 36087, 36097, 36099, 36119, 36124, 36206, 36241,
    36255, 36267, 36274, 36309, 36327, {f: 2, c: 36337}, 36340, 36353, 36363,
    36390, 36401, {f: 2, c: 36416}, 36429, 36431, 36444, 36449, 36457, 36465,
    36469, 36471, 36489, 36496, 36501, 36506, 36519, 36521, 36525, 36584,
    36592, 36615, 36632, 36645, 36647, 36652, 36661, 36666, 36675, 36679,
    36689, 36693, {f: 3, c: 36768}, 36773, 36868, 36891, 36911, 36940, 36955,
    36976, 36980, 36985, 37003, 37016, 37024, 37042, 37053, 37065, 37104,
    37125, 37157, 37210, 37223, 37242, 37258, 37265, 37269, 37296, 37307,
    37309, 37314, 37317, 37376, 37385, 37411, 37494, 37518, 37551,
    {f: 2, c: 37563}, 37569, 37571, 37573, 37576, 37652, 37683, 37686, 37720,
    37759, 37762, 37770, 37819, 37836, 37862, 37881, 37890, {f: 2, c: 37901},
    37934, 37964, 38280, 38305, 38335, 38342, 38345, {f: 2, c: 38353}, 38368,
    38372, 38374, 38436, 38449, 38456, 38461, 38484, 38516, 38523, 38527,
    38529, 38531, 38537, 38550, 38574, 38659, 38683, {f: 2, c: 38689}, 38696,
    38705, 38759, 38774, 38781, 38783, 38809, 38815, 38828, 38841, 38861,
    38880, 38895, 38919, 38950, 38958, {f: 2, c: 39010}, 39092, 39109, 39170,
    39185, 39189, 39221, 39240, 39252, 39262, 39393, 39436, 39440, 39459,
    39489, 39505, {f: 2, c: 39613}, 39681, 39689, 39691, {f: 2, c: 39693},
    39705, 39733, 39752, 39765, 39784, 39808, 39814, 39824, 39837, 39856,
    39871, 39880, 39935, 39938, 39964, 39989, 40004, 40022, 40033, 40040,
    40240, 40253, 40298, 40315, 40421, 40425, 40435, 40570, {f: 3, c: 40578},
    40624, 40676, 40688, 40690, 40713, 40719, 40724, 40731, 40738, 40742,
    {f: 2, c: 40746}, 40756, 407