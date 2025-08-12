// Support for growable heap + pthreads, where the buffer may change, so JS views
// must be updated.
function GROWABLE_HEAP_I8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP8;
}
function GROWABLE_HEAP_U8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU8;
}
function GROWABLE_HEAP_I16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP16;
}
function GROWABLE_HEAP_U16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU16;
}
function GROWABLE_HEAP_I32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP32;
}
function GROWABLE_HEAP_U32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU32;
}
function GROWABLE_HEAP_F32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPF32;
}
function GROWABLE_HEAP_F64() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPF64;
}

var Module = typeof Module != "undefined" ? Module : {};

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

var ENVIRONMENT_IS_PTHREAD = Module["ENVIRONMENT_IS_PTHREAD"] || false;

var _scriptDir = (typeof document != "undefined" && document.currentScript) ? document.currentScript.src : undefined;

if (ENVIRONMENT_IS_WORKER) {
 _scriptDir = self.location.href;
} else if (ENVIRONMENT_IS_NODE) {
 _scriptDir = __filename;
}

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
 var fs = require("fs");
 var nodePath = require("path");
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
 } else {
  scriptDirectory = __dirname + "/";
 }
 read_ = (filename, binary) => {
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  return fs.readFileSync(filename, binary ? undefined : "utf8");
 };
 readBinary = filename => {
  var ret = read_(filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  return ret;
 };
 readAsync = (filename, onload, onerror, binary = true) => {
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
   if (err) onerror(err); else onload(binary ? data.buffer : data);
  });
 };
 if (!Module["thisProgram"] && process.argv.length > 1) {
  thisProgram = process.argv[1].replace(/\\/g, "/");
 }
 arguments_ = process.argv.slice(2);
 if (typeof module != "undefined") {
  module["exports"] = Module;
 }
 process.on("uncaughtException", ex => {
  if (ex !== "unwind" && !(ex instanceof ExitStatus) && !(ex.context instanceof ExitStatus)) {
   throw ex;
  }
 });
 quit_ = (status, toThrow) => {
  process.exitCode = status;
  throw toThrow;
 };
 Module["inspect"] = () => "[Emscripten Module object]";
 let nodeWorkerThreads;
 try {
  nodeWorkerThreads = require("worker_threads");
 } catch (e) {
  console.error('The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?');
  throw e;
 }
 global.Worker = nodeWorkerThreads.Worker;
} else  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document != "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 if (!ENVIRONMENT_IS_NODE) {
  read_ = url => {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = url => {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
   };
  }
  readAsync = (url, onload, onerror) => {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = () => {
    if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
} else  {}

if (ENVIRONMENT_IS_NODE) {
 if (typeof performance == "undefined") {
  global.performance = require("perf_hooks").performance;
 }
}

var defaultPrint = console.log.bind(console);

var defaultPrintErr = console.error.bind(console);

if (ENVIRONMENT_IS_NODE) {
 defaultPrint = (...args) => fs.writeSync(1, args.join(" ") + "\n");
 defaultPrintErr = (...args) => fs.writeSync(2, args.join(" ") + "\n");
}

var out = Module["print"] || defaultPrint;

var err = Module["printErr"] || defaultPrintErr;

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

if (typeof WebAssembly != "object") {
 abort("no native wasm support detected");
}

var wasmMemory;

var wasmModule;

var ABORT = false;

var EXITSTATUS;

/** @type {function(*, string=)} */ function assert(condition, text) {
 if (!condition) {
  abort(text);
 }
}

var HEAP, /** @type {!Int8Array} */ HEAP8, /** @type {!Uint8Array} */ HEAPU8, /** @type {!Int16Array} */ HEAP16, /** @type {!Uint16Array} */ HEAPU16, /** @type {!Int32Array} */ HEAP32, /** @type {!Uint32Array} */ HEAPU32, /** @type {!Float32Array} */ HEAPF32, /* BigInt64Array type is not correctly defined in closure
/** not-@type {!BigInt64Array} */ HEAP64, /* BigUInt64Array type is not correctly defined in closure
/** not-t@type {!BigUint64Array} */ HEAPU64, /** @type {!Float64Array} */ HEAPF64;

function updateMemoryViews() {
 var b = wasmMemory.buffer;
 Module["HEAP8"] = HEAP8 = new Int8Array(b);
 Module["HEAP16"] = HEAP16 = new Int16Array(b);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
 Module["HEAP32"] = HEAP32 = new Int32Array(b);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
 Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
 Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b);
}

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 134217728;

if (ENVIRONMENT_IS_PTHREAD) {
 wasmMemory = Module["wasmMemory"];
} else {
 if (Module["wasmMemory"]) {
  wasmMemory = Module["wasmMemory"];
 } else {
  wasmMemory = new WebAssembly.Memory({
   "initial": INITIAL_MEMORY / 65536,
   "maximum": 2147483648 / 65536,
   "shared": true
  });
  if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
   err("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag");
   if (ENVIRONMENT_IS_NODE) {
    err("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and/or recent version)");
   }
   throw Error("bad memory");
  }
 }
}

updateMemoryViews();

INITIAL_MEMORY = wasmMemory.buffer.byteLength;

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 runtimeInitialized = true;
 if (ENVIRONMENT_IS_PTHREAD) return;
 if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
 FS.ignorePermissions = false;
 TTY.init();
 SOCKFS.root = FS.mount(SOCKFS, {}, null);
 PIPEFS.root = FS.mount(PIPEFS, {}, null);
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 if (ENVIRONMENT_IS_PTHREAD) return;
 callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
 if (ENVIRONMENT_IS_PTHREAD) return;
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
 return id;
}

function addRunDependency(id) {
 runDependencies++;
 Module["monitorRunDependencies"]?.(runDependencies);
}

function removeRunDependency(id) {
 runDependencies--;
 Module["monitorRunDependencies"]?.(runDependencies);
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

/** @param {string|number=} what */ function abort(what) {
 Module["onAbort"]?.(what);
 what = "Aborted(" + what + ")";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 what += ". Build with -sASSERTIONS for more info.";
 /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
 throw e;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */ var isDataURI = filename => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");

var wasmBinaryFile;

wasmBinaryFile = "imhex.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinarySync(file) {
 if (file == wasmBinaryFile && wasmBinary) {
  return new Uint8Array(wasmBinary);
 }
 if (readBinary) {
  return readBinary(file);
 }
 throw "both async and sync fetching of the wasm failed";
}

function getBinaryPromise(binaryFile) {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function" && !isFileURI(binaryFile)) {
   return fetch(binaryFile, {
    credentials: "same-origin"
   }).then(response => {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + binaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(() => getBinarySync(binaryFile));
  } else if (readAsync) {
   return new Promise((resolve, reject) => {
    readAsync(binaryFile, response => resolve(new Uint8Array(/** @type{!ArrayBuffer} */ (response))), reject);
   });
  }
 }
 return Promise.resolve().then(() => getBinarySync(binaryFile));
}

var wasmOffsetConverter;

/** @constructor */ function WasmOffsetConverter(wasmBytes, wasmModule) {
 var offset = 8;
 var funcidx = 0;
 this.offset_map = {};
 this.func_starts = [];
 this.name_map = {};
 this.import_functions = 0;
 var buffer = wasmBytes;
 function unsignedLEB128() {
  var result = 0;
  var shift = 0;
  do {
   var byte = buffer[offset++];
   result += (byte & 127) << shift;
   shift += 7;
  } while (byte & 128);
  return result;
 }
 function skipLimits() {
  var flags = unsignedLEB128();
  unsignedLEB128();
  var hasMax = (flags & 1) != 0;
  if (hasMax) {
   unsignedLEB128();
  }
 }
 binary_parse: while (offset < buffer.length) {
  var start = offset;
  var type = buffer[offset++];
  var end = unsignedLEB128() + offset;
  switch (type) {
  case 2:
   var count = unsignedLEB128();
   while (count-- > 0) {
    offset = unsignedLEB128() + offset;
    offset = unsignedLEB128() + offset;
    var kind = buffer[offset++];
    switch (kind) {
    case 0:
     ++funcidx;
     unsignedLEB128();
     break;

    case 1:
     unsignedLEB128();
     skipLimits();
     break;

    case 2:
     skipLimits();
     break;

    case 3:
     offset += 2;
     break;

    case 4:
     ++offset;
     unsignedLEB128();
     break;
    }
   }
   this.import_functions = funcidx;
   break;

  case 10:
   var count = unsignedLEB128();
   while (count-- > 0) {
    var size = unsignedLEB128();
    this.offset_map[funcidx++] = offset;
    this.func_starts.push(offset);
    offset += size;
   }
   break binary_parse;
  }
  offset = end;
 }
 var sections = WebAssembly.Module.customSections(wasmModule, "name");
 var nameSection = sections.length ? sections[0] : undefined;
 if (nameSection) {
  buffer = new Uint8Array(nameSection);
  offset = 0;
  while (offset < buffer.length) {
   var subsection_type = buffer[offset++];
   var len = unsignedLEB128();
   if (subsection_type != 1) {
    offset += len;
    continue;
   }
   var count = unsignedLEB128();
   while (count-- > 0) {
    var index = unsignedLEB128();
    var length = unsignedLEB128();
    this.name_map[index] = UTF8ArrayToString(buffer, offset, length);
    offset += length;
   }
  }
 }
}

WasmOffsetConverter.prototype.convert = function(funcidx, offset) {
 return this.offset_map[funcidx] + offset;
};

WasmOffsetConverter.prototype.getIndex = function(offset) {
 var lo = 0;
 var hi = this.func_starts.length;
 var mid;
 while (lo < hi) {
  mid = Math.floor((lo + hi) / 2);
  if (this.func_starts[mid] > offset) {
   hi = mid;
  } else {
   lo = mid + 1;
  }
 }
 return lo + this.import_functions - 1;
};

WasmOffsetConverter.prototype.isSameFunc = function(offset1, offset2) {
 return this.getIndex(offset1) == this.getIndex(offset2);
};

WasmOffsetConverter.prototype.getName = function(offset) {
 var index = this.getIndex(offset);
 return this.name_map[index] || ("wasm-function[" + index + "]");
};

function resetPrototype(constructor, attrs) {
 var object = Object.create(constructor.prototype);
 return Object.assign(object, attrs);
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
 var savedBinary;
 return getBinaryPromise(binaryFile).then(binary => {
  savedBinary = binary;
  return WebAssembly.instantiate(binary, imports);
 }).then(instance => {
  wasmOffsetConverter = new WasmOffsetConverter(savedBinary, instance.module);
  return instance;
 }).then(receiver, reason => {
  err(`failed to asynchronously prepare wasm: ${reason}`);
  abort(reason);
 });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
 if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) &&  !isFileURI(binaryFile) &&  !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
  return fetch(binaryFile, {
   credentials: "same-origin"
  }).then(response => {
   /** @suppress {checkTypes} */ var result = WebAssembly.instantiateStreaming(response, imports);
   var clonedResponsePromise = response.clone().arrayBuffer();
   return result.then(function(instantiationResult) {
    clonedResponsePromise.then(arrayBufferResult => {
     wasmOffsetConverter = new WasmOffsetConverter(new Uint8Array(arrayBufferResult), instantiationResult.module);
     callback(instantiationResult);
    }, reason => err(`failed to initialize offset-converter: ${reason}`));
   }, function(reason) {
    err(`wasm streaming compile failed: ${reason}`);
    err("falling back to ArrayBuffer instantiation");
    return instantiateArrayBuffer(binaryFile, imports, callback);
   });
  });
 }
 return instantiateArrayBuffer(binaryFile, imports, callback);
}

function createWasm() {
 var info = {
  "env": wasmImports,
  "wasi_snapshot_preview1": wasmImports
 };
 /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
  wasmExports = instance.exports;
  registerTLSInit(wasmExports["_emscripten_tls_init"]);
  wasmTable = wasmExports["__indirect_function_table"];
  addOnInit(wasmExports["__wasm_call_ctors"]);
  wasmModule = module;
  removeRunDependency("wasm-instantiate");
  return wasmExports;
 }
 addRunDependency("wasm-instantiate");
 function receiveInstantiationResult(result) {
  receiveInstance(result["instance"], result["module"]);
 }
 if (Module["instantiateWasm"]) {
  if (ENVIRONMENT_IS_PTHREAD) {
   wasmOffsetConverter = resetPrototype(WasmOffsetConverter, Module["wasmOffsetData"]);
  }
  try {
   return Module["instantiateWasm"](info, receiveInstance);
  } catch (e) {
   err(`Module.instantiateWasm callback failed with error: ${e}`);
   return false;
  }
 }
 instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
 return {};
}

var ASM_CONSTS = {
 14836015: $0 => {
  alert(UTF8ToString($0));
 },
 14836044: () => {
  FS.mkdir("/home/web_user/.local");
  FS.mount(IDBFS, {}, "/home/web_user/.local");
  FS.syncfs(true, function(err) {
   if (!err) return;
   alert("Failed to load permanent file system: " + err);
  });
  document.addEventListener("paste", event => {
   console.log("HELLO: paste event");
  });
 },
 14836325: () => {
  FS.syncfs(function(err) {
   if (!err) return;
   alert("Failed to save permanent file system: " + err);
  });
 },
 14836431: () => {
  location.reload();
 },
 14836454: () => {
  let data = localStorage.getItem("config");
  return data ? stringToNewUTF8(data) : null;
 },
 14836545: $0 => {
  localStorage.setItem("config", UTF8ToString($0));
 },
 14836599: () => {
  localStorage.removeItem("config");
 },
 14836638: $0 => {
  window.open(UTF8ToString($0), "_blank");
 },
 14836683: $0 => {
  var canvas = document.getElementById("canvas");
  if ($0) canvas.style.imageRendering = "pixelated"; else canvas.style.imageRendering = "smooth";
 },
 14836831: () => {
  if (typeof window === "undefined" || (window.AudioContext || window.webkitAudioContext) === undefined) {
   return 0;
  }
  if (typeof (window.miniaudio) === "undefined") {
   window.miniaudio = {
    referenceCount: 0
   };
   miniaudio.devices = [];
   miniaudio.track_device = function(device) {
    for (var iDevice = 0; iDevice < miniaudio.devices.length; ++iDevice) {
     if (miniaudio.devices[iDevice] == null) {
      miniaudio.devices[iDevice] = device;
      return iDevice;
     }
    }
    miniaudio.devices.push(device);
    return miniaudio.devices.length - 1;
   };
   miniaudio.untrack_device_by_index = function(deviceIndex) {
    miniaudio.devices[deviceIndex] = null;
    while (miniaudio.devices.length > 0) {
     if (miniaudio.devices[miniaudio.devices.length - 1] == null) {
      miniaudio.devices.pop();
     } else {
      break;
     }
    }
   };
   miniaudio.untrack_device = function(device) {
    for (var iDevice = 0; iDevice < miniaudio.devices.length; ++iDevice) {
     if (miniaudio.devices[iDevice] == device) {
      return miniaudio.untrack_device_by_index(iDevice);
     }
    }
   };
   miniaudio.get_device_by_index = function(deviceIndex) {
    return miniaudio.devices[deviceIndex];
   };
   miniaudio.unlock_event_types = (function() {
    return [ "touchstart", "touchend", "click" ];
   })();
   miniaudio.unlock = function() {
    for (var i = 0; i < miniaudio.devices.length; ++i) {
     var device = miniaudio.devices[i];
     if (device != null && device.webaudio != null && device.state === 2) {
      device.webaudio.resume();
     }
    }
    miniaudio.unlock_event_types.map(function(event_type) {
     document.removeEventListener(event_type, miniaudio.unlock, true);
    });
   };
   miniaudio.unlock_event_types.map(function(event_type) {
    document.addEventListener(event_type, miniaudio.unlock, true);
   });
  }
  window.miniaudio.referenceCount++;
  return 1;
 },
 14838530: () => {
  if (typeof (window.miniaudio) !== "undefined") {
   window.miniaudio.referenceCount--;
   if (window.miniaudio.referenceCount === 0) {
    delete window.miniaudio;
   }
  }
 },
 14838691: () => (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined),
 14838795: () => {
  try {
   var temp = new (window.AudioContext || window.webkitAudioContext);
   var sampleRate = temp.sampleRate;
   temp.close();
   return sampleRate;
  } catch (e) {
   return 0;
  }
 },
 14838966: ($0, $1, $2, $3, $4, $5) => {
  var channels = $0;
  var sampleRate = $1;
  var bufferSize = $2;
  var isCapture = $3;
  var pDevice = $4;
  var pAllocationCallbacks = $5;
  if (typeof (window.miniaudio) === "undefined") {
   return -1;
  }
  var device = {};
  device.webaudio = new (window.AudioContext || window.webkitAudioContext)({
   sampleRate: sampleRate
  });
  device.webaudio.suspend();
  device.state = 1;
  device.intermediaryBufferSizeInBytes = channels * bufferSize * 4;
  device.intermediaryBuffer = _ma_malloc_emscripten(device.intermediaryBufferSizeInBytes, pAllocationCallbacks);
  device.intermediaryBufferView = new Float32Array(Module.HEAPF32.buffer, device.intermediaryBuffer, device.intermediaryBufferSizeInBytes);
  device.scriptNode = device.webaudio.createScriptProcessor(bufferSize, (isCapture) ? channels : 0, (isCapture) ? 0 : channels);
  if (isCapture) {
   device.scriptNode.onaudioprocess = function(e) {
    if (device.intermediaryBuffer === undefined) {
     return;
    }
    if (device.intermediaryBufferView.length == 0) {
     device.intermediaryBufferView = new Float32Array(Module.HEAPF32.buffer, device.intermediaryBuffer, device.intermediaryBufferSizeInBytes);
    }
    for (var iChannel = 0; iChannel < e.outputBuffer.numberOfChannels; ++iChannel) {
     e.outputBuffer.getChannelData(iChannel).fill(0);
    }
    var sendSilence = false;
    if (device.streamNode === undefined) {
     sendSilence = true;
    }
    if (e.inputBuffer.numberOfChannels != channels) {
     console.log("Capture: Channel count mismatch. " + e.inputBufer.numberOfChannels + " != " + channels + ". Sending silence.");
     sendSilence = true;
    }
    var totalFramesProcessed = 0;
    while (totalFramesProcessed < e.inputBuffer.length) {
     var framesRemaining = e.inputBuffer.length - totalFramesProcessed;
     var framesToProcess = framesRemaining;
     if (framesToProcess > (device.intermediaryBufferSizeInBytes / channels / 4)) {
      framesToProcess = (device.intermediaryBufferSizeInBytes / channels / 4);
     }
     if (sendSilence) {
      device.intermediaryBufferView.fill(0);
     } else {
      for (var iFrame = 0; iFrame < framesToProcess; ++iFrame) {
       for (var iChannel = 0; iChannel < e.inputBuffer.numberOfChannels; ++iChannel) {
        device.intermediaryBufferView[iFrame * channels + iChannel] = e.inputBuffer.getChannelData(iChannel)[totalFramesProcessed + iFrame];
       }
      }
     }
     _ma_device_process_pcm_frames_capture__webaudio(pDevice, framesToProcess, device.intermediaryBuffer);
     totalFramesProcessed += framesToProcess;
    }
   };
   navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
   }).then(function(stream) {
    device.streamNode = device.webaudio.createMediaStreamSource(stream);
    device.streamNode.connect(device.scriptNode);
    device.scriptNode.connect(device.webaudio.destination);
   }).catch(function(error) {
    device.scriptNode.connect(device.webaudio.destination);
   });
  } else {
   device.scriptNode.onaudioprocess = function(e) {
    if (device.intermediaryBuffer === undefined) {
     return;
    }
    if (device.intermediaryBufferView.length == 0) {
     device.intermediaryBufferView = new Float32Array(Module.HEAPF32.buffer, device.intermediaryBuffer, device.intermediaryBufferSizeInBytes);
    }
    var outputSilence = false;
    if (e.outputBuffer.numberOfChannels != channels) {
     console.log("Playback: Channel count mismatch. " + e.outputBufer.numberOfChannels + " != " + channels + ". Outputting silence.");
     outputSilence = true;
     return;
    }
    var totalFramesProcessed = 0;
    while (totalFramesProcessed < e.outputBuffer.length) {
     var framesRemaining = e.outputBuffer.length - totalFramesProcessed;
     var framesToProcess = framesRemaining;
     if (framesToProcess > (device.intermediaryBufferSizeInBytes / channels / 4)) {
      framesToProcess = (device.intermediaryBufferSizeInBytes / channels / 4);
     }
     _ma_device_process_pcm_frames_playback__webaudio(pDevice, framesToProcess, device.intermediaryBuffer);
     if (outputSilence) {
      for (var iChannel = 0; iChannel < e.outputBuffer.numberOfChannels; ++iChannel) {
       e.outputBuffer.getChannelData(iChannel).fill(0);
      }
     } else {
      for (var iChannel = 0; iChannel < e.outputBuffer.numberOfChannels; ++iChannel) {
       var outputBuffer = e.outputBuffer.getChannelData(iChannel);
       var intermediaryBuffer = device.intermediaryBufferView;
       for (var iFrame = 0; iFrame < framesToProcess; ++iFrame) {
        outputBuffer[totalFramesProcessed + iFrame] = intermediaryBuffer[iFrame * channels + iChannel];
       }
      }
     }
     totalFramesProcessed += framesToProcess;
    }
   };
   device.scriptNode.connect(device.webaudio.destination);
  }
  return miniaudio.track_device(device);
 },
 14843316: $0 => miniaudio.get_device_by_index($0).webaudio.sampleRate,
 14843382: ($0, $1, $2, $3) => {
  var device = miniaudio.get_device_by_index($0);
  var pAllocationCallbacks = $3;
  if (device.scriptNode !== undefined) {
   device.scriptNode.onaudioprocess = function(e) {};
   device.scriptNode.disconnect();
   device.scriptNode = undefined;
  }
  if (device.streamNode !== undefined) {
   device.streamNode.disconnect();
   device.streamNode = undefined;
  }
  device.webaudio.close();
  device.webaudio = undefined;
  if (device.intermediaryBuffer !== undefined) {
   _ma_free_emscripten(device.intermediaryBuffer, pAllocationCallbacks);
   device.intermediaryBuffer = undefined;
   device.intermediaryBufferView = undefined;
   device.intermediaryBufferSizeInBytes = undefined;
  }
  miniaudio.untrack_device_by_index($0);
 },
 14844068: $0 => {
  var device = miniaudio.get_device_by_index($0);
  device.webaudio.resume();
  device.state = 2;
 },
 14844164: $0 => {
  var device = miniaudio.get_device_by_index($0);
  device.webaudio.resume();
  device.state = 2;
 },
 14844260: $0 => {
  var device = miniaudio.get_device_by_index($0);
  device.webaudio.suspend();
  device.state = 1;
 },
 14844357: $0 => {
  var device = miniaudio.get_device_by_index($0);
  device.webaudio.suspend();
  device.state = 1;
 }
};

function canvas_get_width() {
 return Module.canvas.width;
}

function canvas_get_height() {
 return Module.canvas.height;
}

function resizeCanvas() {
 js_resizeCanvas();
}

function setupThemeListener() {
 window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
  Module._handleThemeChange();
 });
}

function isDarkModeEnabled() {
 return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function callJs_saveFile(rawFilename) {
 let filename = UTF8ToString(rawFilename) || "file.bin";
 FS.createPath("/", "savedFiles");
 if (FS.analyzePath(filename).exists) {
  FS.unlink(filename);
 }
 Module._fileBrowserCallback(stringToNewUTF8("/savedFiles/" + filename));
 let data = FS.readFile("/savedFiles/" + filename);
 const reader = Object.assign(new FileReader, {
  onload: () => {
   let saver = document.createElement("a");
   saver.href = reader.result;
   saver.download = filename;
   saver.style = "display: none";
   saver.click();
  },
  onerror: () => {
   throw new Error(reader.error);
  }
 });
 reader.readAsDataURL(new File([ data ], "", {
  type: "application/octet-stream"
 }));
}

function callJs_openFile(multiple) {
 let selector = document.createElement("input");
 selector.type = "file";
 selector.style = "display: none";
 if (multiple) {
  selector.multiple = true;
 }
 selector.onchange = () => {
  if (selector.files.length == 0) return;
  FS.createPath("/", "openedFiles");
  for (let file of selector.files) {
   const fr = new FileReader;
   fr.onload = () => {
    let folder = "/openedFiles/" + Math.random().toString(36).substring(2) + "/";
    FS.createPath("/", folder);
    if (FS.analyzePath(folder + file.name).exists) {
     console.log(`Error: ${folder + file.name} already exist`);
    } else {
     FS.createDataFile(folder, file.name, fr.result, true, true);
     Module._fileBrowserCallback(stringToNewUTF8(folder + file.name));
    }
   };
   fr.readAsBinaryString(file);
  }
 };
 selector.click();
}

function paste_js(callback, callback_data) {
 document.addEventListener("paste", event => {
  Module["ccall"]("paste_return", "number", [ "string", "number", "number" ], [ event.clipboardData.getData("text/plain"), callback, callback_data ]);
 });
}

function copy_js(callback, callback_data) {
 document.addEventListener("copy", event => {
  const content_ptr = Module["ccall"]("copy_return", "number", [ "number", "number" ], [ callback, callback_data ]);
  event.clipboardData.setData("text/plain", UTF8ToString(content_ptr));
  event.preventDefault();
 });
}

function copy_async_js(content_ptr) {
 navigator.clipboard.writeText(UTF8ToString(content_ptr));
}

/** @constructor */ function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = `Program terminated with exit(${status})`;
 this.status = status;
}

var terminateWorker = worker => {
 worker.terminate();
 worker.onmessage = e => {};
};

var killThread = pthread_ptr => {
 var worker = PThread.pthreads[pthread_ptr];
 delete PThread.pthreads[pthread_ptr];
 terminateWorker(worker);
 __emscripten_thread_free_data(pthread_ptr);
 PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
 worker.pthread_ptr = 0;
};

var cancelThread = pthread_ptr => {
 var worker = PThread.pthreads[pthread_ptr];
 worker.postMessage({
  "cmd": "cancel"
 });
};

var cleanupThread = pthread_ptr => {
 var worker = PThread.pthreads[pthread_ptr];
 PThread.returnWorkerToPool(worker);
};

var zeroMemory = (address, size) => {
 GROWABLE_HEAP_U8().fill(0, address, address + size);
 return address;
};

var spawnThread = threadParams => {
 var worker = PThread.getNewWorker();
 if (!worker) {
  return 6;
 }
 PThread.runningWorkers.push(worker);
 PThread.pthreads[threadParams.pthread_ptr] = worker;
 worker.pthread_ptr = threadParams.pthread_ptr;
 var msg = {
  "cmd": "run",
  "start_routine": threadParams.startRoutine,
  "arg": threadParams.arg,
  "pthread_ptr": threadParams.pthread_ptr
 };
 if (ENVIRONMENT_IS_NODE) {
  worker.unref();
 }
 worker.postMessage(msg, threadParams.transferList);
 return 0;
};

var runtimeKeepaliveCounter = 0;

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

var PATH = {
 isAbs: path => path.charAt(0) === "/",
 splitPath: filename => {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 },
 normalizeArray: (parts, allowAboveRoot) => {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (;up; up--) {
    parts.unshift("..");
   }
  }
  return parts;
 },
 normalize: path => {
  var isAbsolute = PATH.isAbs(path), trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 },
 dirname: path => {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 },
 basename: path => {
  if (path === "/") return "/";
  path = PATH.normalize(path);
  path = path.replace(/\/$/, "");
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 },
 join: function() {
  var paths = Array.prototype.slice.call(arguments);
  return PATH.normalize(paths.join("/"));
 },
 join2: (l, r) => PATH.normalize(l + "/" + r)
};

var initRandomFill = () => {
 if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
  return view => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), 
  view);
 } else if (ENVIRONMENT_IS_NODE) {
  try {
   var crypto_module = require("crypto");
   var randomFillSync = crypto_module["randomFillSync"];
   if (randomFillSync) {
    return view => crypto_module["randomFillSync"](view);
   }
   var randomBytes = crypto_module["randomBytes"];
   return view => (view.set(randomBytes(view.byteLength)),  view);
  } catch (e) {}
 }
 abort("initRandomDevice");
};

var randomFill = view => (randomFill = initRandomFill())(view);

var PATH_FS = {
 resolve: function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
   var path = (i >= 0) ? arguments[i] : FS.cwd();
   if (typeof path != "string") {
    throw new TypeError("Arguments to path.resolve must be strings");
   } else if (!path) {
    return "";
   }
   resolvedPath = path + "/" + resolvedPath;
   resolvedAbsolute = PATH.isAbs(path);
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
  return ((resolvedAbsolute ? "/" : "") + resolvedPath) || ".";
 },
 relative: (from, to) => {
  from = PATH_FS.resolve(from).substr(1);
  to = PATH_FS.resolve(to).substr(1);
  function trim(arr) {
   var start = 0;
   for (;start < arr.length; start++) {
    if (arr[start] !== "") break;
   }
   var end = arr.length - 1;
   for (;end >= 0; end--) {
    if (arr[end] !== "") break;
   }
   if (start > end) return [];
   return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
   if (fromParts[i] !== toParts[i]) {
    samePartsLength = i;
    break;
   }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
   outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
 }
};

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

/**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */ var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
  return UTF8Decoder.decode(heapOrArray.buffer instanceof SharedArrayBuffer ? heapOrArray.slice(idx, endPtr) : heapOrArray.subarray(idx, endPtr));
 }
 var str = "";
 while (idx < endPtr) {
  var u0 = heapOrArray[idx++];
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  var u1 = heapOrArray[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode(((u0 & 31) << 6) | u1);
   continue;
  }
  var u2 = heapOrArray[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
  } else {
   u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
  }
 }
 return str;
};

var FS_stdin_getChar_buffer = [];

var lengthBytesUTF8 = str => {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var c = str.charCodeAt(i);
  if (c <= 127) {
   len++;
  } else if (c <= 2047) {
   len += 2;
  } else if (c >= 55296 && c <= 57343) {
   len += 4;
   ++i;
  } else {
   len += 3;
  }
 }
 return len;
};

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | (u1 & 1023);
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | (u >> 6);
   heap[outIdx++] = 128 | (u & 63);
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | (u >> 12);
   heap[outIdx++] = 128 | ((u >> 6) & 63);
   heap[outIdx++] = 128 | (u & 63);
  } else {
   if (outIdx + 3 >= endIdx) break;
   heap[outIdx++] = 240 | (u >> 18);
   heap[outIdx++] = 128 | ((u >> 12) & 63);
   heap[outIdx++] = 128 | ((u >> 6) & 63);
   heap[outIdx++] = 128 | (u & 63);
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
};

/** @type {function(string, boolean=, number=)} */ function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}

var FS_stdin_getChar = () => {
 if (!FS_stdin_getChar_buffer.length) {
  var result = null;
  if (ENVIRONMENT_IS_NODE) {
   var BUFSIZE = 256;
   var buf = Buffer.alloc(BUFSIZE);
   var bytesRead = 0;
   /** @suppress {missingProperties} */ var fd = process.stdin.fd;
   try {
    bytesRead = fs.readSync(fd, buf);
   } catch (e) {
    if (e.toString().includes("EOF")) bytesRead = 0; else throw e;
   }
   if (bytesRead > 0) {
    result = buf.slice(0, bytesRead).toString("utf-8");
   } else {
    result = null;
   }
  } else if (typeof window != "undefined" && typeof window.prompt == "function") {
   result = window.prompt("Input: ");
   if (result !== null) {
    result += "\n";
   }
  } else if (typeof readline == "function") {
   result = readline();
   if (result !== null) {
    result += "\n";
   }
  }
  if (!result) {
   return null;
  }
  FS_stdin_getChar_buffer = intArrayFromString(result, true);
 }
 return FS_stdin_getChar_buffer.shift();
};

var TTY = {
 ttys: [],
 init() {},
 shutdown() {},
 register(dev, ops) {
  TTY.ttys[dev] = {
   input: [],
   output: [],
   ops: ops
  };
  FS.registerDevice(dev, TTY.stream_ops);
 },
 stream_ops: {
  open(stream) {
   var tty = TTY.ttys[stream.node.rdev];
   if (!tty) {
    throw new FS.ErrnoError(43);
   }
   stream.tty = tty;
   stream.seekable = false;
  },
  close(stream) {
   stream.tty.ops.fsync(stream.tty);
  },
  fsync(stream) {
   stream.tty.ops.fsync(stream.tty);
  },
  read(stream, buffer, offset, length, pos) {
   /* ignored */ if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(60);
   }
   var bytesRead = 0;
   for (var i = 0; i < length; i++) {
    var result;
    try {
     result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
     throw new FS.ErrnoError(29);
    }
    if (result === undefined && bytesRead === 0) {
     throw new FS.ErrnoError(6);
    }
    if (result === null || result === undefined) break;
    bytesRead++;
    buffer[offset + i] = result;
   }
   if (bytesRead) {
    stream.node.timestamp = Date.now();
   }
   return bytesRead;
  },
  write(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(60);
   }
   try {
    for (var i = 0; i < length; i++) {
     stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    }
   } catch (e) {
    throw new FS.ErrnoError(29);
   }
   if (length) {
    stream.node.timestamp = Date.now();
   }
   return i;
  }
 },
 default_tty_ops: {
  get_char(tty) {
   return FS_stdin_getChar();
  },
  put_char(tty, val) {
   if (val === null || val === 10) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  },
  fsync(tty) {
   if (tty.output && tty.output.length > 0) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  },
  ioctl_tcgets(tty) {
   return {
    c_iflag: 25856,
    c_oflag: 5,
    c_cflag: 191,
    c_lflag: 35387,
    c_cc: [ 3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
   };
  },
  ioctl_tcsets(tty, optional_actions, data) {
   return 0;
  },
  ioctl_tiocgwinsz(tty) {
   return [ 24, 80 ];
  }
 },
 default_tty1_ops: {
  put_char(tty, val) {
   if (val === null || val === 10) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  },
  fsync(tty) {
   if (tty.output && tty.output.length > 0) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  }
 }
};

var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;

var mmapAlloc = size => {
 size = alignMemory(size, 65536);
 var ptr = _emscripten_builtin_memalign(65536, size);
 if (!ptr) return 0;
 return zeroMemory(ptr, size);
};

var MEMFS = {
 ops_table: null,
 mount(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, /* 0777 */ 0);
 },
 createNode(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
   throw new FS.ErrnoError(63);
  }
  MEMFS.ops_table ||= {
   dir: {
    node: {
     getattr: MEMFS.node_ops.getattr,
     setattr: MEMFS.node_ops.setattr,
     lookup: MEMFS.node_ops.lookup,
     mknod: MEMFS.node_ops.mknod,
     rename: MEMFS.node_ops.rename,
     unlink: MEMFS.node_ops.unlink,
     rmdir: MEMFS.node_ops.rmdir,
     readdir: MEMFS.node_ops.readdir,
     symlink: MEMFS.node_ops.symlink
    },
    stream: {
     llseek: MEMFS.stream_ops.llseek
    }
   },
   file: {
    node: {
     getattr: MEMFS.node_ops.getattr,
     setattr: MEMFS.node_ops.setattr
    },
    stream: {
     llseek: MEMFS.stream_ops.llseek,
     read: MEMFS.stream_ops.read,
     write: MEMFS.stream_ops.write,
     allocate: MEMFS.stream_ops.allocate,
     mmap: MEMFS.stream_ops.mmap,
     msync: MEMFS.stream_ops.msync
    }
   },
   link: {
    node: {
     getattr: MEMFS.node_ops.getattr,
     setattr: MEMFS.node_ops.setattr,
     readlink: MEMFS.node_ops.readlink
    },
    stream: {}
   },
   chrdev: {
    node: {
     getattr: MEMFS.node_ops.getattr,
     setattr: MEMFS.node_ops.setattr
    },
    stream: FS.chrdev_stream_ops
   }
  };
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
   node.node_ops = MEMFS.ops_table.dir.node;
   node.stream_ops = MEMFS.ops_table.dir.stream;
   node.contents = {};
  } else if (FS.isFile(node.mode)) {
   node.node_ops = MEMFS.ops_table.file.node;
   node.stream_ops = MEMFS.ops_table.file.stream;
   node.usedBytes = 0;
   node.contents = null;
  } else if (FS.isLink(node.mode)) {
   node.node_ops = MEMFS.ops_table.link.node;
   node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
   node.node_ops = MEMFS.ops_table.chrdev.node;
   node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
   parent.contents[name] = node;
   parent.timestamp = node.timestamp;
  }
  return node;
 },
 getFileDataAsTypedArray(node) {
  if (!node.contents) return new Uint8Array(0);
  if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
 },
 expandFileStorage(node, newCapacity) {
  var prevCapacity = node.contents ? node.contents.length : 0;
  if (prevCapacity >= newCapacity) return;
  var CAPACITY_DOUBLING_MAX = 1024 * 1024;
  newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0);
  if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
  var oldContents = node.contents;
  node.contents = new Uint8Array(newCapacity);
  if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
 },
 resizeFileStorage(node, newSize) {
  if (node.usedBytes == newSize) return;
  if (newSize == 0) {
   node.contents = null;
   node.usedBytes = 0;
  } else {
   var oldContents = node.contents;
   node.contents = new Uint8Array(newSize);
   if (oldContents) {
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
   }
   node.usedBytes = newSize;
  }
 },
 node_ops: {
  getattr(node) {
   var attr = {};
   attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
   attr.ino = node.id;
   attr.mode = node.mode;
   attr.nlink = 1;
   attr.uid = 0;
   attr.gid = 0;
   attr.rdev = node.rdev;
   if (FS.isDir(node.mode)) {
    attr.size = 4096;
   } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
   } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
   } else {
    attr.size = 0;
   }
   attr.atime = new Date(node.timestamp);
   attr.mtime = new Date(node.timestamp);
   attr.ctime = new Date(node.timestamp);
   attr.blksize = 4096;
   attr.blocks = Math.ceil(attr.size / attr.blksize);
   return attr;
  },
  setattr(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
   if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
   }
  },
  lookup(parent, name) {
   throw FS.genericErrors[44];
  },
  mknod(parent, name, mode, dev) {
   return MEMFS.createNode(parent, name, mode, dev);
  },
  rename(old_node, new_dir, new_name) {
   if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
     new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (new_node) {
     for (var i in new_node.contents) {
      throw new FS.ErrnoError(55);
     }
    }
   }
   delete old_node.parent.contents[old_node.name];
   old_node.parent.timestamp = Date.now();
   old_node.name = new_name;
   new_dir.contents[new_name] = old_node;
   new_dir.timestamp = old_node.parent.timestamp;
   old_node.parent = new_dir;
  },
  unlink(parent, name) {
   delete parent.contents[name];
   parent.timestamp = Date.now();
  },
  rmdir(parent, name) {
   var node = FS.lookupNode(parent, name);
   for (var i in node.contents) {
    throw new FS.ErrnoError(55);
   }
   delete parent.contents[name];
   parent.timestamp = Date.now();
  },
  readdir(node) {
   var entries = [ ".", ".." ];
   for (var key of Object.keys(node.contents)) {
    entries.push(key);
   }
   return entries;
  },
  symlink(parent, newname, oldpath) {
   var node = MEMFS.createNode(parent, newname, 511 | /* 0777 */ 40960, 0);
   node.link = oldpath;
   return node;
  },
  readlink(node) {
   if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(28);
   }
   return node.link;
  }
 },
 stream_ops: {
  read(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= stream.node.usedBytes) return 0;
   var size = Math.min(stream.node.usedBytes - position, length);
   if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
   } else {
    for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
   }
   return size;
  },
  write(stream, buffer, offset, length, position, canOwn) {
   if (buffer.buffer === GROWABLE_HEAP_I8().buffer) {
    canOwn = false;
   }
   if (!length) return 0;
   var node = stream.node;
   node.timestamp = Date.now();
   if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
     node.contents = buffer.subarray(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (node.usedBytes === 0 && position === 0) {
     node.contents = buffer.slice(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (position + length <= node.usedBytes) {
     node.contents.set(buffer.subarray(offset, offset + length), position);
     return length;
    }
   }
   MEMFS.expandFileStorage(node, position + length);
   if (node.contents.subarray && buffer.subarray) {
    node.contents.set(buffer.subarray(offset, offset + length), position);
   } else {
    for (var i = 0; i < length; i++) {
     node.contents[position + i] = buffer[offset + i];
    }
   }
   node.usedBytes = Math.max(node.usedBytes, position + length);
   return length;
  },
  llseek(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.usedBytes;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(28);
   }
   return position;
  },
  allocate(stream, offset, length) {
   MEMFS.expandFileStorage(stream.node, offset + length);
   stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
  },
  mmap(stream, length, position, prot, flags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
   }
   var ptr;
   var allocated;
   var contents = stream.node.contents;
   if (!(flags & 2) && contents.buffer === GROWABLE_HEAP_I8().buffer) {
    allocated = false;
    ptr = contents.byteOffset;
   } else {
    if (position > 0 || position + length < contents.length) {
     if (contents.subarray) {
      contents = contents.subarray(position, position + length);
     } else {
      contents = Array.prototype.slice.call(contents, position, position + length);
     }
    }
    allocated = true;
    ptr = mmapAlloc(length);
    if (!ptr) {
     throw new FS.ErrnoError(48);
    }
    GROWABLE_HEAP_I8().set(contents, ptr);
   }
   return {
    ptr: ptr,
    allocated: allocated
   };
  },
  msync(stream, buffer, offset, length, mmapFlags) {
   MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
   return 0;
  }
 }
};

/** @param {boolean=} noRunDep */ var asyncLoad = (url, onload, onerror, noRunDep) => {
 var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
 readAsync(url, arrayBuffer => {
  assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
  onload(new Uint8Array(arrayBuffer));
  if (dep) removeRunDependency(dep);
 }, event => {
  if (onerror) {
   onerror();
  } else {
   throw `Loading data file "${url}" failed.`;
  }
 });
 if (dep) addRunDependency(dep);
};

var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
 FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
};

var preloadPlugins = Module["preloadPlugins"] || [];

var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
 if (typeof Browser != "undefined") Browser.init();
 var handled = false;
 preloadPlugins.forEach(plugin => {
  if (handled) return;
  if (plugin["canHandle"](fullname)) {
   plugin["handle"](byteArray, fullname, finish, onerror);
   handled = true;
  }
 });
 return handled;
};

var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
 var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
 var dep = getUniqueRunDependency(`cp ${fullname}`);
 function processData(byteArray) {
  function finish(byteArray) {
   preFinish?.();
   if (!dontCreateFile) {
    FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
   }
   onload?.();
   removeRunDependency(dep);
  }
  if (FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
   onerror?.();
   removeRunDependency(dep);
  })) {
   return;
  }
  finish(byteArray);
 }
 addRunDependency(dep);
 if (typeof url == "string") {
  asyncLoad(url, byteArray => processData(byteArray), onerror);
 } else {
  processData(url);
 }
};

var FS_modeStringToFlags = str => {
 var flagModes = {
  "r": 0,
  "r+": 2,
  "w": 512 | 64 | 1,
  "w+": 512 | 64 | 2,
  "a": 1024 | 64 | 1,
  "a+": 1024 | 64 | 2
 };
 var flags = flagModes[str];
 if (typeof flags == "undefined") {
  throw new Error(`Unknown file open mode: ${str}`);
 }
 return flags;
};

var FS_getMode = (canRead, canWrite) => {
 var mode = 0;
 if (canRead) mode |= 292 | 73;
 if (canWrite) mode |= 146;
 return mode;
};

var IDBFS = {
 dbs: {},
 indexedDB: () => {
  if (typeof indexedDB != "undefined") return indexedDB;
  var ret = null;
  if (typeof window == "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  assert(ret, "IDBFS used, but indexedDB not supported");
  return ret;
 },
 DB_VERSION: 21,
 DB_STORE_NAME: "FILE_DATA",
 mount: function(mount) {
  return MEMFS.mount.apply(null, arguments);
 },
 syncfs: (mount, populate, callback) => {
  IDBFS.getLocalSet(mount, (err, local) => {
   if (err) return callback(err);
   IDBFS.getRemoteSet(mount, (err, remote) => {
    if (err) return callback(err);
    var src = populate ? remote : local;
    var dst = populate ? local : remote;
    IDBFS.reconcile(src, dst, callback);
   });
  });
 },
 quit: () => {
  Object.values(IDBFS.dbs).forEach(value => value.close());
  IDBFS.dbs = {};
 },
 getDB: (name, callback) => {
  var db = IDBFS.dbs[name];
  if (db) {
   return callback(null, db);
  }
  var req;
  try {
   req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
  } catch (e) {
   return callback(e);
  }
  if (!req) {
   return callback("Unable to connect to IndexedDB");
  }
  req.onupgradeneeded = e => {
   var db = /** @type {IDBDatabase} */ (e.target.result);
   var transaction = e.target.transaction;
   var fileStore;
   if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
    fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
   } else {
    fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
   }
   if (!fileStore.indexNames.contains("timestamp")) {
    fileStore.createIndex("timestamp", "timestamp", {
     unique: false
    });
   }
  };
  req.onsuccess = () => {
   db = /** @type {IDBDatabase} */ (req.result);
   IDBFS.dbs[name] = db;
   callback(null, db);
  };
  req.onerror = e => {
   callback(e.target.error);
   e.preventDefault();
  };
 },
 getLocalSet: (mount, callback) => {
  var entries = {};
  function isRealDir(p) {
   return p !== "." && p !== "..";
  }
  function toAbsolute(root) {
   return p => PATH.join2(root, p);
  }
  var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  while (check.length) {
   var path = check.pop();
   var stat;
   try {
    stat = FS.stat(path);
   } catch (e) {
    return callback(e);
   }
   if (FS.isDir(stat.mode)) {
    check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
   }
   entries[path] = {
    "timestamp": stat.mtime
   };
  }
  return callback(null, {
   type: "local",
   entries: entries
  });
 },
 getRemoteSet: (mount, callback) => {
  var entries = {};
  IDBFS.getDB(mount.mountpoint, (err, db) => {
   if (err) return callback(err);
   try {
    var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readonly");
    transaction.onerror = e => {
     callback(e.target.error);
     e.preventDefault();
    };
    var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
    var index = store.index("timestamp");
    index.openKeyCursor().onsuccess = event => {
     var cursor = event.target.result;
     if (!cursor) {
      return callback(null, {
       type: "remote",
       db: db,
       entries: entries
      });
     }
     entries[cursor.primaryKey] = {
      "timestamp": cursor.key
     };
     cursor.continue();
    };
   } catch (e) {
    return callback(e);
   }
  });
 },
 loadLocalEntry: (path, callback) => {
  var stat, node;
  try {
   var lookup = FS.lookupPath(path);
   node = lookup.node;
   stat = FS.stat(path);
  } catch (e) {
   return callback(e);
  }
  if (FS.isDir(stat.mode)) {
   return callback(null, {
    "timestamp": stat.mtime,
    "mode": stat.mode
   });
  } else if (FS.isFile(stat.mode)) {
   node.contents = MEMFS.getFileDataAsTypedArray(node);
   return callback(null, {
    "timestamp": stat.mtime,
    "mode": stat.mode,
    "contents": node.contents
   });
  } else {
   return callback(new Error("node type not supported"));
  }
 },
 storeLocalEntry: (path, entry, callback) => {
  try {
   if (FS.isDir(entry["mode"])) {
    FS.mkdirTree(path, entry["mode"]);
   } else if (FS.isFile(entry["mode"])) {
    FS.writeFile(path, entry["contents"], {
     canOwn: true
    });
   } else {
    return callback(new Error("node type not supported"));
   }
   FS.chmod(path, entry["mode"]);
   FS.utime(path, entry["timestamp"], entry["timestamp"]);
  } catch (e) {
   return callback(e);
  }
  callback(null);
 },
 removeLocalEntry: (path, callback) => {
  try {
   var stat = FS.stat(path);
   if (FS.isDir(stat.mode)) {
    FS.rmdir(path);
   } else if (FS.isFile(stat.mode)) {
    FS.unlink(path);
   }
  } catch (e) {
   return callback(e);
  }
  callback(null);
 },
 loadRemoteEntry: (store, path, callback) => {
  var req = store.get(path);
  req.onsuccess = event => callback(null, event.target.result);
  req.onerror = e => {
   callback(e.target.error);
   e.preventDefault();
  };
 },
 storeRemoteEntry: (store, path, entry, callback) => {
  try {
   var req = store.put(entry, path);
  } catch (e) {
   callback(e);
   return;
  }
  req.onsuccess = event => callback();
  req.onerror = e => {
   callback(e.target.error);
   e.preventDefault();
  };
 },
 removeRemoteEntry: (store, path, callback) => {
  var req = store.delete(path);
  req.onsuccess = event => callback();
  req.onerror = e => {
   callback(e.target.error);
   e.preventDefault();
  };
 },
 reconcile: (src, dst, callback) => {
  var total = 0;
  var create = [];
  Object.keys(src.entries).forEach(function(key) {
   var e = src.entries[key];
   var e2 = dst.entries[key];
   if (!e2 || e["timestamp"].getTime() != e2["timestamp"].getTime()) {
    create.push(key);
    total++;
   }
  });
  var remove = [];
  Object.keys(dst.entries).forEach(function(key) {
   if (!src.entries[key]) {
    remove.push(key);
    total++;
   }
  });
  if (!total) {
   return callback(null);
  }
  var errored = false;
  var db = src.type === "remote" ? src.db : dst.db;
  var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readwrite");
  var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  function done(err) {
   if (err && !errored) {
    errored = true;
    return callback(err);
   }
  }
  transaction.onerror = e => {
   done(this.error);
   e.preventDefault();
  };
  transaction.oncomplete = e => {
   if (!errored) {
    callback(null);
   }
  };
  create.sort().forEach(path => {
   if (dst.type === "local") {
    IDBFS.loadRemoteEntry(store, path, (err, entry) => {
     if (err) return done(err);
     IDBFS.storeLocalEntry(path, entry, done);
    });
   } else {
    IDBFS.loadLocalEntry(path, (err, entry) => {
     if (err) return done(err);
     IDBFS.storeRemoteEntry(store, path, entry, done);
    });
   }
  });
  remove.sort().reverse().forEach(path => {
   if (dst.type === "local") {
    IDBFS.removeLocalEntry(path, done);
   } else {
    IDBFS.removeRemoteEntry(store, path, done);
   }
  });
 }
};

var FS = {
 root: null,
 mounts: [],
 devices: {},
 streams: [],
 nextInode: 1,
 nameTable: null,
 currentPath: "/",
 initialized: false,
 ignorePermissions: true,
 ErrnoError: null,
 genericErrors: {},
 filesystems: null,
 syncFSRequests: 0,
 lookupPath(path, opts = {}) {
  path = PATH_FS.resolve(path);
  if (!path) return {
   path: "",
   node: null
  };
  var defaults = {
   follow_mount: true,
   recurse_count: 0
  };
  opts = Object.assign(defaults, opts);
  if (opts.recurse_count > 8) {
   throw new FS.ErrnoError(32);
  }
  var parts = path.split("/").filter(p => !!p);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
   var islast = (i === parts.length - 1);
   if (islast && opts.parent) {
    break;
   }
   current = FS.lookupNode(current, parts[i]);
   current_path = PATH.join2(current_path, parts[i]);
   if (FS.isMountpoint(current)) {
    if (!islast || (islast && opts.follow_mount)) {
     current = current.mounted.root;
    }
   }
   if (!islast || opts.follow) {
    var count = 0;
    while (FS.isLink(current.mode)) {
     var link = FS.readlink(current_path);
     current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
     var lookup = FS.lookupPath(current_path, {
      recurse_count: opts.recurse_count + 1
     });
     current = lookup.node;
     if (count++ > 40) {
      throw new FS.ErrnoError(32);
     }
    }
   }
  }
  return {
   path: current_path,
   node: current
  };
 },
 getPath(node) {
  var path;
  while (true) {
   if (FS.isRoot(node)) {
    var mount = node.mount.mountpoint;
    if (!path) return mount;
    return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
   }
   path = path ? `${node.name}/${path}` : node.name;
   node = node.parent;
  }
 },
 hashName(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
   hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return ((parentid + hash) >>> 0) % FS.nameTable.length;
 },
 hashAddNode(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
 },
 hashRemoveNode(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
   FS.nameTable[hash] = node.name_next;
  } else {
   var current = FS.nameTable[hash];
   while (current) {
    if (current.name_next === node) {
     current.name_next = node.name_next;
     break;
    }
    current = current.name_next;
   }
  }
 },
 lookupNode(parent, name) {
  var errCode = FS.mayLookup(parent);
  if (errCode) {
   throw new FS.ErrnoError(errCode, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
   var nodeName = node.name;
   if (node.parent.id === parent.id && nodeName === name) {
    return node;
   }
  }
  return FS.lookup(parent, name);
 },
 createNode(parent, name, mode, rdev) {
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
 },
 destroyNode(node) {
  FS.hashRemoveNode(node);
 },
 isRoot(node) {
  return node === node.parent;
 },
 isMountpoint(node) {
  return !!node.mounted;
 },
 isFile(mode) {
  return (mode & 61440) === 32768;
 },
 isDir(mode) {
  return (mode & 61440) === 16384;
 },
 isLink(mode) {
  return (mode & 61440) === 40960;
 },
 isChrdev(mode) {
  return (mode & 61440) === 8192;
 },
 isBlkdev(mode) {
  return (mode & 61440) === 24576;
 },
 isFIFO(mode) {
  return (mode & 61440) === 4096;
 },
 isSocket(mode) {
  return (mode & 49152) === 49152;
 },
 flagsToPermissionString(flag) {
  var perms = [ "r", "w", "rw" ][flag & 3];
  if ((flag & 512)) {
   perms += "w";
  }
  return perms;
 },
 nodePermissions(node, perms) {
  if (FS.ignorePermissions) {
   return 0;
  }
  if (perms.includes("r") && !(node.mode & 292)) {
   return 2;
  } else if (perms.includes("w") && !(node.mode & 146)) {
   return 2;
  } else if (perms.includes("x") && !(node.mode & 73)) {
   return 2;
  }
  return 0;
 },
 mayLookup(dir) {
  var errCode = FS.nodePermissions(dir, "x");
  if (errCode) return errCode;
  if (!dir.node_ops.lookup) return 2;
  return 0;
 },
 mayCreate(dir, name) {
  try {
   var node = FS.lookupNode(dir, name);
   return 20;
  } catch (e) {}
  return FS.nodePermissions(dir, "wx");
 },
 mayDelete(dir, name, isdir) {
  var node;
  try {
   node = FS.lookupNode(dir, name);
  } catch (e) {
   return e.errno;
  }
  var errCode = FS.nodePermissions(dir, "wx");
  if (errCode) {
   return errCode;
  }
  if (isdir) {
   if (!FS.isDir(node.mode)) {
    return 54;
   }
   if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
    return 10;
   }
  } else {
   if (FS.isDir(node.mode)) {
    return 31;
   }
  }
  return 0;
 },
 mayOpen(node, flags) {
  if (!node) {
   return 44;
  }
  if (FS.isLink(node.mode)) {
   return 32;
  } else if (FS.isDir(node.mode)) {
   if (FS.flagsToPermissionString(flags) !== "r" ||  (flags & 512)) {
    return 31;
   }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
 },
 MAX_OPEN_FDS: 4096,
 nextfd() {
  for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(33);
 },
 getStreamChecked(fd) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  return stream;
 },
 getStream: fd => FS.streams[fd],
 createStream(stream, fd = -1) {
  if (!FS.FSStream) {
   FS.FSStream = /** @constructor */ function() {
    this.shared = {};
   };
   FS.FSStream.prototype = {};
   Object.defineProperties(FS.FSStream.prototype, {
    object: {
     /** @this {FS.FSStream} */ get() {
      return this.node;
     },
     /** @this {FS.FSStream} */ set(val) {
      this.node = val;
     }
    },
    isRead: {
     /** @this {FS.FSStream} */ get() {
      return (this.flags & 2097155) !== 1;
     }
    },
    isWrite: {
     /** @this {FS.FSStream} */ get() {
      return (this.flags & 2097155) !== 0;
     }
    },
    isAppend: {
     /** @this {FS.FSStream} */ get() {
      return (this.flags & 1024);
     }
    },
    flags: {
     /** @this {FS.FSStream} */ get() {
      return this.shared.flags;
     },
     /** @this {FS.FSStream} */ set(val) {
      this.shared.flags = val;
     }
    },
    position: {
     /** @this {FS.FSStream} */ get() {
      return this.shared.position;
     },
     /** @this {FS.FSStream} */ set(val) {
      this.shared.position = val;
     }
    }
   });
  }
  stream = Object.assign(new FS.FSStream, stream);
  if (fd == -1) {
   fd = FS.nextfd();
  }
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
 },
 closeStream(fd) {
  FS.streams[fd] = null;
 },
 chrdev_stream_ops: {
  open(stream) {
   var device = FS.getDevice(stream.node.rdev);
   stream.stream_ops = device.stream_ops;
   stream.stream_ops.open?.(stream);
  },
  llseek() {
   throw new FS.ErrnoError(70);
  }
 },
 major: dev => ((dev) >> 8),
 minor: dev => ((dev) & 255),
 makedev: (ma, mi) => ((ma) << 8 | (mi)),
 registerDevice(dev, ops) {
  FS.devices[dev] = {
   stream_ops: ops
  };
 },
 getDevice: dev => FS.devices[dev],
 getMounts(mount) {
  var mounts = [];
  var check = [ mount ];
  while (check.length) {
   var m = check.pop();
   mounts.push(m);
   check.push.apply(check, m.mounts);
  }
  return mounts;
 },
 syncfs(populate, callback) {
  if (typeof populate == "function") {
   callback = populate;
   populate = false;
  }
  FS.syncFSRequests++;
  if (FS.syncFSRequests > 1) {
   err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function doCallback(errCode) {
   FS.syncFSRequests--;
   return callback(errCode);
  }
  function done(errCode) {
   if (errCode) {
    if (!done.errored) {
     done.errored = true;
     return doCallback(errCode);
    }
    return;
   }
   if (++completed >= mounts.length) {
    doCallback(null);
   }
  }
  mounts.forEach(mount => {
   if (!mount.type.syncfs) {
    return done(null);
   }
   mount.type.syncfs(mount, populate, done);
  });
 },
 mount(type, opts, mountpoint) {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
   throw new FS.ErrnoError(10);
  } else if (!root && !pseudo) {
   var lookup = FS.lookupPath(mountpoint, {
    follow_mount: false
   });
   mountpoint = lookup.path;
   node = lookup.node;
   if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(10);
   }
   if (!FS.isDir(node.mode)) {
    throw new FS.ErrnoError(54);
   }
  }
  var mount = {
   type: type,
   opts: opts,
   mountpoint: mountpoint,
   mounts: []
  };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
   FS.root = mountRoot;
  } else if (node) {
   node.mounted = mount;
   if (node.mount) {
    node.mount.mounts.push(mount);
   }
  }
  return mountRoot;
 },
 unmount(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, {
   follow_mount: false
  });
  if (!FS.isMountpoint(lookup.node)) {
   throw new FS.ErrnoError(28);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach(hash => {
   var current = FS.nameTable[hash];
   while (current) {
    var next = current.name_next;
    if (mounts.includes(current.mount)) {
     FS.destroyNode(current);
    }
    current = next;
   }
  });
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  node.mount.mounts.splice(idx, 1);
 },
 lookup(parent, name) {
  return parent.node_ops.lookup(parent, name);
 },
 mknod(path, mode, dev) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
   throw new FS.ErrnoError(28);
  }
  var errCode = FS.mayCreate(parent, name);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.mknod) {
   throw new FS.ErrnoError(63);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
 },
 create(path, mode) {
  mode = mode !== undefined ? mode : 438;
  /* 0666 */ mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
 },
 mkdir(path, mode) {
  mode = mode !== undefined ? mode : 511;
  /* 0777 */ mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
 },
 mkdirTree(path, mode) {
  var dirs = path.split("/");
  var d = "";
  for (var i = 0; i < dirs.length; ++i) {
   if (!dirs[i]) continue;
   d += "/" + dirs[i];
   try {
    FS.mkdir(d, mode);
   } catch (e) {
    if (e.errno != 20) throw e;
   }
  }
 },
 mkdev(path, mode, dev) {
  if (typeof dev == "undefined") {
   dev = mode;
   mode = 438;
  }
  /* 0666 */ mode |= 8192;
  return FS.mknod(path, mode, dev);
 },
 symlink(oldpath, newpath) {
  if (!PATH_FS.resolve(oldpath)) {
   throw new FS.ErrnoError(44);
  }
  var lookup = FS.lookupPath(newpath, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(44);
  }
  var newname = PATH.basename(newpath);
  var errCode = FS.mayCreate(parent, newname);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.symlink) {
   throw new FS.ErrnoError(63);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
 },
 rename(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  lookup = FS.lookupPath(old_path, {
   parent: true
  });
  old_dir = lookup.node;
  lookup = FS.lookupPath(new_path, {
   parent: true
  });
  new_dir = lookup.node;
  if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
  if (old_dir.mount !== new_dir.mount) {
   throw new FS.ErrnoError(75);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH_FS.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(28);
  }
  relative = PATH_FS.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(55);
  }
  var new_node;
  try {
   new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {}
  if (old_node === new_node) {
   return;
  }
  var isdir = FS.isDir(old_node.mode);
  var errCode = FS.mayDelete(old_dir, old_name, isdir);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!old_dir.node_ops.rename) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
   throw new FS.ErrnoError(10);
  }
  if (new_dir !== old_dir) {
   errCode = FS.nodePermissions(old_dir, "w");
   if (errCode) {
    throw new FS.ErrnoError(errCode);
   }
  }
  FS.hashRemoveNode(old_node);
  try {
   old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
   throw e;
  } finally {
   FS.hashAddNode(old_node);
  }
 },
 rmdir(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var errCode = FS.mayDelete(parent, name, true);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.rmdir) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(10);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
 },
 readdir(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
   throw new FS.ErrnoError(54);
  }
  return node.node_ops.readdir(node);
 },
 unlink(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(44);
  }
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var errCode = FS.mayDelete(parent, name, false);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.unlink) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(10);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
 },
 readlink(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
   throw new FS.ErrnoError(44);
  }
  if (!link.node_ops.readlink) {
   throw new FS.ErrnoError(28);
  }
  return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
 },
 stat(path, dontFollow) {
  var lookup = FS.lookupPath(path, {
   follow: !dontFollow
  });
  var node = lookup.node;
  if (!node) {
   throw new FS.ErrnoError(44);
  }
  if (!node.node_ops.getattr) {
   throw new FS.ErrnoError(63);
  }
  return node.node_ops.getattr(node);
 },
 lstat(path) {
  return FS.stat(path, true);
 },
 chmod(path, mode, dontFollow) {
  var node;
  if (typeof path == "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, {
   mode: (mode & 4095) | (node.mode & ~4095),
   timestamp: Date.now()
  });
 },
 lchmod(path, mode) {
  FS.chmod(path, mode, true);
 },
 fchmod(fd, mode) {
  var stream = FS.getStreamChecked(fd);
  FS.chmod(stream.node, mode);
 },
 chown(path, uid, gid, dontFollow) {
  var node;
  if (typeof path == "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, {
   timestamp: Date.now()
  });
 },
 lchown(path, uid, gid) {
  FS.chown(path, uid, gid, true);
 },
 fchown(fd, uid, gid) {
  var stream = FS.getStreamChecked(fd);
  FS.chown(stream.node, uid, gid);
 },
 truncate(path, len) {
  if (len < 0) {
   throw new FS.ErrnoError(28);
  }
  var node;
  if (typeof path == "string") {
   var lookup = FS.lookupPath(path, {
    follow: true
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isDir(node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!FS.isFile(node.mode)) {
   throw new FS.ErrnoError(28);
  }
  var errCode = FS.nodePermissions(node, "w");
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  node.node_ops.setattr(node, {
   size: len,
   timestamp: Date.now()
  });
 },
 ftruncate(fd, len) {
  var stream = FS.getStreamChecked(fd);
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(28);
  }
  FS.truncate(stream.node, len);
 },
 utime(path, atime, mtime) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  node.node_ops.setattr(node, {
   timestamp: Math.max(atime, mtime)
  });
 },
 open(path, flags, mode) {
  if (path === "") {
   throw new FS.ErrnoError(44);
  }
  flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
  mode = typeof mode == "undefined" ? 438 : /* 0666 */ mode;
  if ((flags & 64)) {
   mode = (mode & 4095) | 32768;
  } else {
   mode = 0;
  }
  var node;
  if (typeof path == "object") {
   node = path;
  } else {
   path = PATH.normalize(path);
   try {
    var lookup = FS.lookupPath(path, {
     follow: !(flags & 131072)
    });
    node = lookup.node;
   } catch (e) {}
  }
  var created = false;
  if ((flags & 64)) {
   if (node) {
    if ((flags & 128)) {
     throw new FS.ErrnoError(20);
    }
   } else {
    node = FS.mknod(path, mode, 0);
    created = true;
   }
  }
  if (!node) {
   throw new FS.ErrnoError(44);
  }
  if (FS.isChrdev(node.mode)) {
   flags &= ~512;
  }
  if ((flags & 65536) && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(54);
  }
  if (!created) {
   var errCode = FS.mayOpen(node, flags);
   if (errCode) {
    throw new FS.ErrnoError(errCode);
   }
  }
  if ((flags & 512) && !created) {
   FS.truncate(node, 0);
  }
  flags &= ~(128 | 512 | 131072);
  var stream = FS.createStream({
   node: node,
   path: FS.getPath(node),
   flags: flags,
   seekable: true,
   position: 0,
   stream_ops: node.stream_ops,
   ungotten: [],
   error: false
  });
  if (stream.stream_ops.open) {
   stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
   if (!FS.readFiles) FS.readFiles = {};
   if (!(path in FS.readFiles)) {
    FS.readFiles[path] = 1;
   }
  }
  return stream;
 },
 close(stream) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (stream.getdents) stream.getdents = null;
  try {
   if (stream.stream_ops.close) {
    stream.stream_ops.close(stream);
   }
  } catch (e) {
   throw e;
  } finally {
   FS.closeStream(stream.fd);
  }
  stream.fd = null;
 },
 isClosed(stream) {
  return stream.fd === null;
 },
 llseek(stream, offset, whence) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (!stream.seekable || !stream.stream_ops.llseek) {
   throw new FS.ErrnoError(70);
  }
  if (whence != 0 && whence != 1 && whence != 2) {
   throw new FS.ErrnoError(28);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
 },
 read(stream, buffer, offset, length, position) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.read) {
   throw new FS.ErrnoError(28);
  }
  var seeking = typeof position != "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(70);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 },
 write(stream, buffer, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.write) {
   throw new FS.ErrnoError(28);
  }
  if (stream.seekable && stream.flags & 1024) {
   FS.llseek(stream, 0, 2);
  }
  var seeking = typeof position != "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(70);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) stream.position += bytesWritten;
  return bytesWritten;
 },
 allocate(stream, offset, length) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (offset < 0 || length <= 0) {
   throw new FS.ErrnoError(28);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(8);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(43);
  }
  if (!stream.stream_ops.allocate) {
   throw new FS.ErrnoError(138);
  }
  stream.stream_ops.allocate(stream, offset, length);
 },
 mmap(stream, length, position, prot, flags) {
  if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
   throw new FS.ErrnoError(2);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(2);
  }
  if (!stream.stream_ops.mmap) {
   throw new FS.ErrnoError(43);
  }
  return stream.stream_ops.mmap(stream, length, position, prot, flags);
 },
 msync(stream, buffer, offset, length, mmapFlags) {
  if (!stream.stream_ops.msync) {
   return 0;
  }
  return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
 },
 munmap: stream => 0,
 ioctl(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
   throw new FS.ErrnoError(59);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
 },
 readFile(path, opts = {}) {
  opts.flags = opts.flags || 0;
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error(`Invalid encoding type "${opts.encoding}"`);
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
   ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
   ret = buf;
  }
  FS.close(stream);
  return ret;
 },
 writeFile(path, data, opts = {}) {
  opts.flags = opts.flags || 577;
  var stream = FS.open(path, opts.flags, opts.mode);
  if (typeof data == "string") {
   var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
   var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
   FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
  } else if (ArrayBuffer.isView(data)) {
   FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
  } else {
   throw new Error("Unsupported data type");
  }
  FS.close(stream);
 },
 cwd: () => FS.currentPath,
 chdir(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  if (lookup.node === null) {
   throw new FS.ErrnoError(44);
  }
  if (!FS.isDir(lookup.node.mode)) {
   throw new FS.ErrnoError(54);
  }
  var errCode = FS.nodePermissions(lookup.node, "x");
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  FS.currentPath = lookup.path;
 },
 createDefaultDirectories() {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
 },
 createDefaultDevices() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {
   read: () => 0,
   write: (stream, buffer, offset, length, pos) => length
  });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var randomBuffer = new Uint8Array(1024), randomLeft = 0;
  var randomByte = () => {
   if (randomLeft === 0) {
    randomLeft = randomFill(randomBuffer).byteLength;
   }
   return randomBuffer[--randomLeft];
  };
  FS.createDevice("/dev", "random", randomByte);
  FS.createDevice("/dev", "urandom", randomByte);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
 },
 createSpecialDirectories() {
  FS.mkdir("/proc");
  var proc_self = FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({
   mount() {
    var node = FS.createNode(proc_self, "fd", 16384 | 511, /* 0777 */ 73);
    node.node_ops = {
     lookup(parent, name) {
      var fd = +name;
      var stream = FS.getStreamChecked(fd);
      var ret = {
       parent: null,
       mount: {
        mountpoint: "fake"
       },
       node_ops: {
        readlink: () => stream.path
       }
      };
      ret.parent = ret;
      return ret;
     }
    };
    return node;
   }
  }, {}, "/proc/self/fd");
 },
 createStandardStreams() {
  if (Module["stdin"]) {
   FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
   FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
   FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
   FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", 0);
  var stdout = FS.open("/dev/stdout", 1);
  var stderr = FS.open("/dev/stderr", 1);
 },
 ensureErrnoError() {
  if (FS.ErrnoError) return;
  FS.ErrnoError = /** @this{Object} */ function ErrnoError(errno, node) {
   this.name = "ErrnoError";
   this.node = node;
   this.setErrno = /** @this{Object} */ function(errno) {
    this.errno = errno;
   };
   this.setErrno(errno);
   this.message = "FS error";
  };
  FS.ErrnoError.prototype = new Error;
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [ 44 ].forEach(code => {
   FS.genericErrors[code] = new FS.ErrnoError(code);
   FS.genericErrors[code].stack = "<generic error, no stack>";
  });
 },
 staticInit() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = {
   "MEMFS": MEMFS,
   "IDBFS": IDBFS
  };
 },
 init(input, output, error) {
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
 },
 quit() {
  FS.init.initialized = false;
  for (var i = 0; i < FS.streams.length; i++) {
   var stream = FS.streams[i];
   if (!stream) {
    continue;
   }
   FS.close(stream);
  }
 },
 findObject(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (!ret.exists) {
   return null;
  }
  return ret.object;
 },
 analyzePath(path, dontResolveLastLink) {
  try {
   var lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   path = lookup.path;
  } catch (e) {}
  var ret = {
   isRoot: false,
   exists: false,
   error: 0,
   name: null,
   path: null,
   object: null,
   parentExists: false,
   parentPath: null,
   parentObject: null
  };
  try {
   var lookup = FS.lookupPath(path, {
    parent: true
   });
   ret.parentExists = true;
   ret.parentPath = lookup.path;
   ret.parentObject = lookup.node;
   ret.name = PATH.basename(path);
   lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   ret.exists = true;
   ret.path = lookup.path;
   ret.object = lookup.node;
   ret.name = lookup.node.name;
   ret.isRoot = lookup.path === "/";
  } catch (e) {
   ret.error = e.errno;
  }
  return ret;
 },
 createPath(parent, path, canRead, canWrite) {
  parent = typeof parent == "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
   var part = parts.pop();
   if (!part) continue;
   var current = PATH.join2(parent, part);
   try {
    FS.mkdir(current);
   } catch (e) {}
   parent = current;
  }
  return current;
 },
 createFile(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
  var mode = FS_getMode(canRead, canWrite);
  return FS.create(path, mode);
 },
 createDataFile(parent, name, data, canRead, canWrite, canOwn) {
  var path = name;
  if (parent) {
   parent = typeof parent == "string" ? parent : FS.getPath(parent);
   path = name ? PATH.join2(parent, name) : parent;
  }
  var mode = FS_getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
   if (typeof data == "string") {
    var arr = new Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
    data = arr;
   }
   FS.chmod(node, mode | 146);
   var stream = FS.open(node, 577);
   FS.write(stream, data, 0, data.length, 0, canOwn);
   FS.close(stream);
   FS.chmod(node, mode);
  }
 },
 createDevice(parent, name, input, output) {
  var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
  var mode = FS_getMode(!!input, !!output);
  if (!FS.createDevice.major) FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {
   open(stream) {
    stream.seekable = false;
   },
   close(stream) {
    if (output?.buffer?.length) {
     output(10);
    }
   },
   read(stream, buffer, offset, length, pos) {
    /* ignored */ var bytesRead = 0;
    for (var i = 0; i < length; i++) {
     var result;
     try {
      result = input();
     } catch (e) {
      throw new FS.ErrnoError(29);
     }
     if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(6);
     }
     if (result === null || result === undefined) break;
     bytesRead++;
     buffer[offset + i] = result;
    }
    if (bytesRead) {
     stream.node.timestamp = Date.now();
    }
    return bytesRead;
   },
   write(stream, buffer, offset, length, pos) {
    for (var i = 0; i < length; i++) {
     try {
      output(buffer[offset + i]);
     } catch (e) {
      throw new FS.ErrnoError(29);
     }
    }
    if (length) {
     stream.node.timestamp = Date.now();
    }
    return i;
   }
  });
  return FS.mkdev(path, mode, dev);
 },
 forceLoadFile(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
  if (typeof XMLHttpRequest != "undefined") {
   throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (read_) {
   try {
    obj.contents = intArrayFromString(read_(obj.url), true);
    obj.usedBytes = obj.contents.length;
   } catch (e) {
    throw new FS.ErrnoError(29);
   }
  } else {
   throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
 },
 createLazyFile(parent, name, url, canRead, canWrite) {
  /** @constructor */ function LazyUint8Array() {
   this.lengthKnown = false;
   this.chunks = [];
  }
  LazyUint8Array.prototype.get = /** @this{Object} */ function LazyUint8Array_get(idx) {
   if (idx > this.length - 1 || idx < 0) {
    return undefined;
   }
   var chunkOffset = idx % this.chunkSize;
   var chunkNum = (idx / this.chunkSize) | 0;
   return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
   this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
   var xhr = new XMLHttpRequest;
   xhr.open("HEAD", url, false);
   xhr.send(null);
   if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
   var datalength = Number(xhr.getResponseHeader("Content-length"));
   var header;
   var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
   var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
   var chunkSize = 1024 * 1024;
   if (!hasByteServing) chunkSize = datalength;
   var doXHR = (from, to) => {
    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    xhr.responseType = "arraybuffer";
    if (xhr.overrideMimeType) {
     xhr.overrideMimeType("text/plain; charset=x-user-defined");
    }
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    if (xhr.response !== undefined) {
     return new Uint8Array(/** @type{Array<number>} */ (xhr.response || []));
    }
    return intArrayFromString(xhr.responseText || "", true);
   };
   var lazyArray = this;
   lazyArray.setDataGetter(chunkNum => {
    var start = chunkNum * chunkSize;
    var end = (chunkNum + 1) * chunkSize - 1;
    end = Math.min(end, datalength - 1);
    if (typeof lazyArray.chunks[chunkNum] == "undefined") {
     lazyArray.chunks[chunkNum] = doXHR(start, end);
    }
    if (typeof lazyArray.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
    return lazyArray.chunks[chunkNum];
   });
   if (usesGzip || !datalength) {
    chunkSize = datalength = 1;
    datalength = this.getter(0).length;
    chunkSize = datalength;
    out("LazyFiles on gzip forces download of the whole file when length is accessed");
   }
   this._length = datalength;
   this._chunkSize = chunkSize;
   this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest != "undefined") {
   if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
   var lazyArray = new LazyUint8Array;
   Object.defineProperties(lazyArray, {
    length: {
     get: /** @this{Object} */ function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._length;
     }
    },
    chunkSize: {
     get: /** @this{Object} */ function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._chunkSize;
     }
    }
   });
   var properties = {
    isDevice: false,
    contents: lazyArray
   };
  } else {
   var properties = {
    isDevice: false,
    url: url
   };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
   node.contents = properties.contents;
  } else if (properties.url) {
   node.contents = null;
   node.url = properties.url;
  }
  Object.defineProperties(node, {
   usedBytes: {
    get: /** @this {FSNode} */ function() {
     return this.contents.length;
    }
   }
  });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach(key => {
   var fn = node.stream_ops[key];
   stream_ops[key] = function forceLoadLazyFile() {
    FS.forceLoadFile(node);
    return fn.apply(null, arguments);
   };
  });
  function writeChunks(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= contents.length) return 0;
   var size = Math.min(contents.length - position, length);
   if (contents.slice) {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents[position + i];
    }
   } else {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents.get(position + i);
    }
   }
   return size;
  }
  stream_ops.read = (stream, buffer, offset, length, position) => {
   FS.forceLoadFile(node);
   return writeChunks(stream, buffer, offset, length, position);
  };
  stream_ops.mmap = (stream, length, position, prot, flags) => {
   FS.forceLoadFile(node);
   var ptr = mmapAlloc(length);
   if (!ptr) {
    throw new FS.ErrnoError(48);
   }
   writeChunks(stream, GROWABLE_HEAP_I8(), ptr, length, position);
   return {
    ptr: ptr,
    allocated: true
   };
  };
  node.stream_ops = stream_ops;
  return node;
 }
};

/**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */ var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(GROWABLE_HEAP_U8(), ptr, maxBytesToRead) : "";

var SYSCALLS = {
 DEFAULT_POLLMASK: 5,
 calculateAt(dirfd, path, allowEmpty) {
  if (PATH.isAbs(path)) {
   return path;
  }
  var dir;
  if (dirfd === -100) {
   dir = FS.cwd();
  } else {
   var dirstream = SYSCALLS.getStreamFromFD(dirfd);
   dir = dirstream.path;
  }
  if (path.length == 0) {
   if (!allowEmpty) {
    throw new FS.ErrnoError(44);
   }
   return dir;
  }
  return PATH.join2(dir, path);
 },
 doStat(func, path, buf) {
  try {
   var stat = func(path);
  } catch (e) {
   if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
    return -54;
   }
   throw e;
  }
  GROWABLE_HEAP_I32()[((buf) >> 2)] = stat.dev;
  GROWABLE_HEAP_I32()[(((buf) + (4)) >> 2)] = stat.mode;
  GROWABLE_HEAP_U32()[(((buf) + (8)) >> 2)] = stat.nlink;
  GROWABLE_HEAP_I32()[(((buf) + (12)) >> 2)] = stat.uid;
  GROWABLE_HEAP_I32()[(((buf) + (16)) >> 2)] = stat.gid;
  GROWABLE_HEAP_I32()[(((buf) + (20)) >> 2)] = stat.rdev;
  HEAP64[(((buf) + (24)) >> 3)] = BigInt(stat.size);
  GROWABLE_HEAP_I32()[(((buf) + (32)) >> 2)] = 4096;
  GROWABLE_HEAP_I32()[(((buf) + (36)) >> 2)] = stat.blocks;
  var atime = stat.atime.getTime();
  var mtime = stat.mtime.getTime();
  var ctime = stat.ctime.getTime();
  HEAP64[(((buf) + (40)) >> 3)] = BigInt(Math.floor(atime / 1e3));
  GROWABLE_HEAP_U32()[(((buf) + (48)) >> 2)] = (atime % 1e3) * 1e3;
  HEAP64[(((buf) + (56)) >> 3)] = BigInt(Math.floor(mtime / 1e3));
  GROWABLE_HEAP_U32()[(((buf) + (64)) >> 2)] = (mtime % 1e3) * 1e3;
  HEAP64[(((buf) + (72)) >> 3)] = BigInt(Math.floor(ctime / 1e3));
  GROWABLE_HEAP_U32()[(((buf) + (80)) >> 2)] = (ctime % 1e3) * 1e3;
  HEAP64[(((buf) + (88)) >> 3)] = BigInt(stat.ino);
  return 0;
 },
 doMsync(addr, stream, len, flags, offset) {
  if (!FS.isFile(stream.node.mode)) {
   throw new FS.ErrnoError(43);
  }
  if (flags & 2) {
   return 0;
  }
  var buffer = GROWABLE_HEAP_U8().slice(addr, addr + len);
  FS.msync(stream, buffer, offset, len, flags);
 },
 varargs: undefined,
 get() {
  var ret = GROWABLE_HEAP_I32()[((+SYSCALLS.varargs) >> 2)];
  SYSCALLS.varargs += 4;
  return ret;
 },
 getp() {
  return SYSCALLS.get();
 },
 getStr(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 },
 getStreamFromFD(fd) {
  var stream = FS.getStreamChecked(fd);
  return stream;
 }
};

var withStackSave = f => {
 var stack = stackSave();
 var ret = f();
 stackRestore(stack);
 return ret;
};

var MAX_INT53 = 9007199254740992;

var MIN_INT53 = -9007199254740992;

var bigintToI53Checked = num => (num < MIN_INT53 || num > MAX_INT53) ? NaN : Number(num);

/** @type{function(number, (number|boolean), ...(number|boolean))} */ var proxyToMainThread = function(index, sync) {
 var numCallArgs = arguments.length - 2;
 var outerArgs = arguments;
 return withStackSave(() => {
  var serializedNumCallArgs = numCallArgs * 2;
  var args = stackAlloc(serializedNumCallArgs * 8);
  var b = ((args) >> 3);
  for (var i = 0; i < numCallArgs; i++) {
   var arg = outerArgs[2 + i];
   if (typeof arg == "bigint") {
    HEAP64[b + 2 * i] = 1n;
    HEAP64[b + 2 * i + 1] = arg;
   } else {
    HEAP64[b + 2 * i] = 0n;
    GROWABLE_HEAP_F64()[b + 2 * i + 1] = arg;
   }
  }
  return __emscripten_run_on_main_thread_js(index, serializedNumCallArgs, args, sync);
 });
};

function _proc_exit(code) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 1, code);
 EXITSTATUS = code;
 if (!keepRuntimeAlive()) {
  PThread.terminateAllThreads();
  Module["onExit"]?.(code);
  ABORT = true;
 }
 quit_(code, new ExitStatus(code));
}

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
 EXITSTATUS = status;
 if (ENVIRONMENT_IS_PTHREAD) {
  exitOnMainThread(status);
  throw "unwind";
 }
 _proc_exit(status);
};

var _exit = exitJS;

var handleException = e => {
 if (e instanceof ExitStatus || e == "unwind") {
  return EXITSTATUS;
 }
 quit_(1, e);
};

var PThread = {
 unusedWorkers: [],
 runningWorkers: [],
 tlsInitFunctions: [],
 pthreads: {},
 init() {
  if (ENVIRONMENT_IS_PTHREAD) {
   PThread.initWorker();
  } else {
   PThread.initMainThread();
  }
 },
 initMainThread() {
  addOnPreRun(() => {
   addRunDependency("loading-workers");
   PThread.loadWasmModuleToAllWorkers(() => removeRunDependency("loading-workers"));
  });
 },
 initWorker() {
  PThread["receiveObjectTransfer"] = PThread.receiveObjectTransfer;
  PThread["threadInitTLS"] = PThread.threadInitTLS;
  PThread["setExitStatus"] = PThread.setExitStatus;
  noExitRuntime = false;
 },
 setExitStatus: status => EXITSTATUS = status,
 terminateAllThreads__deps: [ "$terminateWorker" ],
 terminateAllThreads: () => {
  for (var worker of PThread.runningWorkers) {
   terminateWorker(worker);
  }
  for (var worker of PThread.unusedWorkers) {
   terminateWorker(worker);
  }
  PThread.unusedWorkers = [];
  PThread.runningWorkers = [];
  PThread.pthreads = [];
 },
 returnWorkerToPool: worker => {
  var pthread_ptr = worker.pthread_ptr;
  delete PThread.pthreads[pthread_ptr];
  PThread.unusedWorkers.push(worker);
  PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
  worker.pthread_ptr = 0;
  __emscripten_thread_free_data(pthread_ptr);
 },
 receiveObjectTransfer(data) {},
 threadInitTLS() {
  PThread.tlsInitFunctions.forEach(f => f());
 },
 loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => {
  worker.onmessage = e => {
   var d = e["data"];
   var cmd = d["cmd"];
   if (d["targetThread"] && d["targetThread"] != _pthread_self()) {
    var targetWorker = PThread.pthreads[d["targetThread"]];
    if (targetWorker) {
     targetWorker.postMessage(d, d["transferList"]);
    } else {
     err(`Internal error! Worker sent a message "${cmd}" to target pthread ${d["targetThread"]}, but that thread no longer exists!`);
    }
    return;
   }
   if (cmd === "checkMailbox") {
    checkMailbox();
   } else if (cmd === "spawnThread") {
    spawnThread(d);
   } else if (cmd === "cleanupThread") {
    cleanupThread(d["thread"]);
   } else if (cmd === "killThread") {
    killThread(d["thread"]);
   } else if (cmd === "cancelThread") {
    cancelThread(d["thread"]);
   } else if (cmd === "loaded") {
    worker.loaded = true;
    onFinishedLoading(worker);
   } else if (cmd === "alert") {
    alert(`Thread ${d["threadId"]}: ${d["text"]}`);
   } else if (d.target === "setimmediate") {
    worker.postMessage(d);
   } else if (cmd === "callHandler") {
    Module[d["handler"]](...d["args"]);
   } else if (cmd) {
    err(`worker sent an unknown command ${cmd}`);
   }
  };
  worker.onerror = e => {
   var message = "worker sent an error!";
   err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
   throw e;
  };
  if (ENVIRONMENT_IS_NODE) {
   worker.on("message", data => worker.onmessage({
    data: data
   }));
   worker.on("error", e => worker.onerror(e));
  }
  var handlers = [];
  var knownHandlers = [ "onExit", "onAbort", "print", "printErr" ];
  for (var handler of knownHandlers) {
   if (Module.hasOwnProperty(handler)) {
    handlers.push(handler);
   }
  }
  worker.postMessage({
   "cmd": "load",
   "handlers": handlers,
   "urlOrBlob": Module["mainScriptUrlOrBlob"] || _scriptDir,
   "wasmMemory": wasmMemory,
   "wasmModule": wasmModule,
   "wasmOffsetConverter": wasmOffsetConverter
  });
 }),
 loadWasmModuleToAllWorkers(onMaybeReady) {
  onMaybeReady();
 },
 allocateUnusedWorker() {
  var worker;
  var pthreadMainJs = locateFile("imhex.worker.js");
  worker = new Worker(pthreadMainJs);
  PThread.unusedWorkers.push(worker);
 },
 getNewWorker() {
  if (PThread.unusedWorkers.length == 0) {
   PThread.allocateUnusedWorker();
   PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
  }
  return PThread.unusedWorkers.pop();
 }
};

Module["PThread"] = PThread;

var callRuntimeCallbacks = callbacks => {
 while (callbacks.length > 0) {
  callbacks.shift()(Module);
 }
};

var establishStackSpace = () => {
 var pthread_ptr = _pthread_self();
 var stackHigh = GROWABLE_HEAP_U32()[(((pthread_ptr) + (52)) >> 2)];
 var stackSize = GROWABLE_HEAP_U32()[(((pthread_ptr) + (56)) >> 2)];
 var stackLow = stackHigh - stackSize;
 _emscripten_stack_set_limits(stackHigh, stackLow);
 stackRestore(stackHigh);
};

Module["establishStackSpace"] = establishStackSpace;

function exitOnMainThread(returnCode) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, returnCode);
 _exit(returnCode);
}

/**
     * @param {number} ptr
     * @param {string} type
     */ function getValue(ptr, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  return GROWABLE_HEAP_I8()[((ptr) >> 0)];

 case "i8":
  return GROWABLE_HEAP_I8()[((ptr) >> 0)];

 case "i16":
  return GROWABLE_HEAP_I16()[((ptr) >> 1)];

 case "i32":
  return GROWABLE_HEAP_I32()[((ptr) >> 2)];

 case "i64":
  return HEAP64[((ptr) >> 3)];

 case "float":
  return GROWABLE_HEAP_F32()[((ptr) >> 2)];

 case "double":
  return GROWABLE_HEAP_F64()[((ptr) >> 3)];

 case "*":
  return GROWABLE_HEAP_U32()[((ptr) >> 2)];

 default:
  abort(`invalid type for getValue: ${type}`);
 }
}

var wasmTableMirror = [];

var wasmTable;

var getWasmTableEntry = funcPtr => {
 var func = wasmTableMirror[funcPtr];
 if (!func) {
  if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
  wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
 }
 return func;
};

var invokeEntryPoint = (ptr, arg) => {
 var result = getWasmTableEntry(ptr)(arg);
 function finish(result) {
  if (keepRuntimeAlive()) {
   PThread.setExitStatus(result);
  } else {
   __emscripten_thread_exit(result);
  }
 }
 finish(result);
};

Module["invokeEntryPoint"] = invokeEntryPoint;

var noExitRuntime = Module["noExitRuntime"] || true;

var registerTLSInit = tlsInitFunc => PThread.tlsInitFunctions.push(tlsInitFunc);

/**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */ function setValue(ptr, value, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  GROWABLE_HEAP_I8()[((ptr) >> 0)] = value;
  break;

 case "i8":
  GROWABLE_HEAP_I8()[((ptr) >> 0)] = value;
  break;

 case "i16":
  GROWABLE_HEAP_I16()[((ptr) >> 1)] = value;
  break;

 case "i32":
  GROWABLE_HEAP_I32()[((ptr) >> 2)] = value;
  break;

 case "i64":
  HEAP64[((ptr) >> 3)] = BigInt(value);
  break;

 case "float":
  GROWABLE_HEAP_F32()[((ptr) >> 2)] = value;
  break;

 case "double":
  GROWABLE_HEAP_F64()[((ptr) >> 3)] = value;
  break;

 case "*":
  GROWABLE_HEAP_U32()[((ptr) >> 2)] = value;
  break;

 default:
  abort(`invalid type for setValue: ${type}`);
 }
}

var ___assert_fail = (condition, filename, line, func) => {
 abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
};

var exceptionCaught = [];

var uncaughtExceptionCount = 0;

var ___cxa_begin_catch = ptr => {
 var info = new ExceptionInfo(ptr);
 if (!info.get_caught()) {
  info.set_caught(true);
  uncaughtExceptionCount--;
 }
 info.set_rethrown(false);
 exceptionCaught.push(info);
 ___cxa_increment_exception_refcount(info.excPtr);
 return info.get_exception_ptr();
};

var ___cxa_current_primary_exception = () => {
 if (!exceptionCaught.length) {
  return 0;
 }
 var info = exceptionCaught[exceptionCaught.length - 1];
 ___cxa_increment_exception_refcount(info.excPtr);
 return info.excPtr;
};

var exceptionLast = 0;

var ___cxa_end_catch = () => {
 _setThrew(0, 0);
 var info = exceptionCaught.pop();
 ___cxa_decrement_exception_refcount(info.excPtr);
 exceptionLast = 0;
};

/** @constructor */ function ExceptionInfo(excPtr) {
 this.excPtr = excPtr;
 this.ptr = excPtr - 24;
 this.set_type = function(type) {
  GROWABLE_HEAP_U32()[(((this.ptr) + (4)) >> 2)] = type;
 };
 this.get_type = function() {
  return GROWABLE_HEAP_U32()[(((this.ptr) + (4)) >> 2)];
 };
 this.set_destructor = function(destructor) {
  GROWABLE_HEAP_U32()[(((this.ptr) + (8)) >> 2)] = destructor;
 };
 this.get_destructor = function() {
  return GROWABLE_HEAP_U32()[(((this.ptr) + (8)) >> 2)];
 };
 this.set_caught = function(caught) {
  caught = caught ? 1 : 0;
  GROWABLE_HEAP_I8()[(((this.ptr) + (12)) >> 0)] = caught;
 };
 this.get_caught = function() {
  return GROWABLE_HEAP_I8()[(((this.ptr) + (12)) >> 0)] != 0;
 };
 this.set_rethrown = function(rethrown) {
  rethrown = rethrown ? 1 : 0;
  GROWABLE_HEAP_I8()[(((this.ptr) + (13)) >> 0)] = rethrown;
 };
 this.get_rethrown = function() {
  return GROWABLE_HEAP_I8()[(((this.ptr) + (13)) >> 0)] != 0;
 };
 this.init = function(type, destructor) {
  this.set_adjusted_ptr(0);
  this.set_type(type);
  this.set_destructor(destructor);
 };
 this.set_adjusted_ptr = function(adjustedPtr) {
  GROWABLE_HEAP_U32()[(((this.ptr) + (16)) >> 2)] = adjustedPtr;
 };
 this.get_adjusted_ptr = function() {
  return GROWABLE_HEAP_U32()[(((this.ptr) + (16)) >> 2)];
 };
 this.get_exception_ptr = function() {
  var isPointer = ___cxa_is_pointer_type(this.get_type());
  if (isPointer) {
   return GROWABLE_HEAP_U32()[((this.excPtr) >> 2)];
  }
  var adjusted = this.get_adjusted_ptr();
  if (adjusted !== 0) return adjusted;
  return this.excPtr;
 };
}

var ___resumeException = ptr => {
 if (!exceptionLast) {
  exceptionLast = ptr;
 }
 throw exceptionLast;
};

var findMatchingCatch = args => {
 var thrown = exceptionLast;
 if (!thrown) {
  setTempRet0(0);
  return 0;
 }
 var info = new ExceptionInfo(thrown);
 info.set_adjusted_ptr(thrown);
 var thrownType = info.get_type();
 if (!thrownType) {
  setTempRet0(0);
  return thrown;
 }
 for (var arg in args) {
  var caughtType = args[arg];
  if (caughtType === 0 || caughtType === thrownType) {
   break;
  }
  var adjusted_ptr_addr = info.ptr + 16;
  if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
   setTempRet0(caughtType);
   return thrown;
  }
 }
 setTempRet0(thrownType);
 return thrown;
};

var ___cxa_find_matching_catch_2 = () => findMatchingCatch([]);

var ___cxa_find_matching_catch_3 = arg0 => findMatchingCatch([ arg0 ]);

var ___cxa_find_matching_catch_4 = (arg0, arg1) => findMatchingCatch([ arg0, arg1 ]);

var ___cxa_find_matching_catch_5 = (arg0, arg1, arg2) => findMatchingCatch([ arg0, arg1, arg2 ]);

var ___cxa_rethrow = () => {
 var info = exceptionCaught.pop();
 if (!info) {
  abort("no exception to throw");
 }
 var ptr = info.excPtr;
 if (!info.get_rethrown()) {
  exceptionCaught.push(info);
  info.set_rethrown(true);
  info.set_caught(false);
  uncaughtExceptionCount++;
 }
 exceptionLast = ptr;
 throw exceptionLast;
};

var ___cxa_rethrow_primary_exception = ptr => {
 if (!ptr) return;
 var info = new ExceptionInfo(ptr);
 exceptionCaught.push(info);
 info.set_rethrown(true);
 ___cxa_rethrow();
};

var ___cxa_throw = (ptr, type, destructor) => {
 var info = new ExceptionInfo(ptr);
 info.init(type, destructor);
 exceptionLast = ptr;
 uncaughtExceptionCount++;
 throw exceptionLast;
};

var ___cxa_uncaught_exceptions = () => uncaughtExceptionCount;

var ___emscripten_init_main_thread_js = tb => {
 __emscripten_thread_init(tb, /*is_main=*/ !ENVIRONMENT_IS_WORKER, /*is_runtime=*/ 1, /*can_block=*/ !ENVIRONMENT_IS_WEB, /*default_stacksize=*/ 65536, /*start_profiling=*/ false);
 PThread.threadInitTLS();
};

var ___emscripten_thread_cleanup = thread => {
 if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread); else postMessage({
  "cmd": "cleanupThread",
  "thread": thread
 });
};

function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 1, pthread_ptr, attr, startRoutine, arg);
 return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
}

var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => {
 if (typeof SharedArrayBuffer == "undefined") {
  err("Current environment does not support SharedArrayBuffer, pthreads are not available!");
  return 6;
 }
 var transferList = [];
 var error = 0;
 if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
  return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
 }
 if (error) return error;
 var threadParams = {
  startRoutine: startRoutine,
  pthread_ptr: pthread_ptr,
  arg: arg,
  transferList: transferList
 };
 if (ENVIRONMENT_IS_PTHREAD) {
  threadParams.cmd = "spawnThread";
  postMessage(threadParams, transferList);
  return 0;
 }
 return spawnThread(threadParams);
};

function ___syscall__newselect(nfds, readfds, writefds, exceptfds, timeout) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 1, nfds, readfds, writefds, exceptfds, timeout);
 try {
  var total = 0;
  var srcReadLow = (readfds ? GROWABLE_HEAP_I32()[((readfds) >> 2)] : 0), srcReadHigh = (readfds ? GROWABLE_HEAP_I32()[(((readfds) + (4)) >> 2)] : 0);
  var srcWriteLow = (writefds ? GROWABLE_HEAP_I32()[((writefds) >> 2)] : 0), srcWriteHigh = (writefds ? GROWABLE_HEAP_I32()[(((writefds) + (4)) >> 2)] : 0);
  var srcExceptLow = (exceptfds ? GROWABLE_HEAP_I32()[((exceptfds) >> 2)] : 0), srcExceptHigh = (exceptfds ? GROWABLE_HEAP_I32()[(((exceptfds) + (4)) >> 2)] : 0);
  var dstReadLow = 0, dstReadHigh = 0;
  var dstWriteLow = 0, dstWriteHigh = 0;
  var dstExceptLow = 0, dstExceptHigh = 0;
  var allLow = (readfds ? GROWABLE_HEAP_I32()[((readfds) >> 2)] : 0) | (writefds ? GROWABLE_HEAP_I32()[((writefds) >> 2)] : 0) | (exceptfds ? GROWABLE_HEAP_I32()[((exceptfds) >> 2)] : 0);
  var allHigh = (readfds ? GROWABLE_HEAP_I32()[(((readfds) + (4)) >> 2)] : 0) | (writefds ? GROWABLE_HEAP_I32()[(((writefds) + (4)) >> 2)] : 0) | (exceptfds ? GROWABLE_HEAP_I32()[(((exceptfds) + (4)) >> 2)] : 0);
  var check = function(fd, low, high, val) {
   return (fd < 32 ? (low & val) : (high & val));
  };
  for (var fd = 0; fd < nfds; fd++) {
   var mask = 1 << (fd % 32);
   if (!(check(fd, allLow, allHigh, mask))) {
    continue;
   }
   var stream = SYSCALLS.getStreamFromFD(fd);
   var flags = SYSCALLS.DEFAULT_POLLMASK;
   if (stream.stream_ops.poll) {
    var timeoutInMillis = -1;
    if (timeout) {
     var tv_sec = (readfds ? GROWABLE_HEAP_I32()[((timeout) >> 2)] : 0), tv_usec = (readfds ? GROWABLE_HEAP_I32()[(((timeout) + (4)) >> 2)] : 0);
     timeoutInMillis = (tv_sec + tv_usec / 1e6) * 1e3;
    }
    flags = stream.stream_ops.poll(stream, timeoutInMillis);
   }
   if ((flags & 1) && check(fd, srcReadLow, srcReadHigh, mask)) {
    fd < 32 ? (dstReadLow = dstReadLow | mask) : (dstReadHigh = dstReadHigh | mask);
    total++;
   }
   if ((flags & 4) && check(fd, srcWriteLow, srcWriteHigh, mask)) {
    fd < 32 ? (dstWriteLow = dstWriteLow | mask) : (dstWriteHigh = dstWriteHigh | mask);
    total++;
   }
   if ((flags & 2) && check(fd, srcExceptLow, srcExceptHigh, mask)) {
    fd < 32 ? (dstExceptLow = dstExceptLow | mask) : (dstExceptHigh = dstExceptHigh | mask);
    total++;
   }
  }
  if (readfds) {
   GROWABLE_HEAP_I32()[((readfds) >> 2)] = dstReadLow;
   GROWABLE_HEAP_I32()[(((readfds) + (4)) >> 2)] = dstReadHigh;
  }
  if (writefds) {
   GROWABLE_HEAP_I32()[((writefds) >> 2)] = dstWriteLow;
   GROWABLE_HEAP_I32()[(((writefds) + (4)) >> 2)] = dstWriteHigh;
  }
  if (exceptfds) {
   GROWABLE_HEAP_I32()[((exceptfds) >> 2)] = dstExceptLow;
   GROWABLE_HEAP_I32()[(((exceptfds) + (4)) >> 2)] = dstExceptHigh;
  }
  return total;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

var SOCKFS = {
 mount(mount) {
  Module["websocket"] = (Module["websocket"] && ("object" === typeof Module["websocket"])) ? Module["websocket"] : {};
  Module["websocket"]._callbacks = {};
  Module["websocket"]["on"] = /** @this{Object} */ function(event, callback) {
   if ("function" === typeof callback) {
    this._callbacks[event] = callback;
   }
   return this;
  };
  Module["websocket"].emit = /** @this{Object} */ function(event, param) {
   if ("function" === typeof this._callbacks[event]) {
    this._callbacks[event].call(this, param);
   }
  };
  return FS.createNode(null, "/", 16384 | 511, /* 0777 */ 0);
 },
 createSocket(family, type, protocol) {
  type &= ~526336;
  var streaming = type == 1;
  if (streaming && protocol && protocol != 6) {
   throw new FS.ErrnoError(66);
  }
  var sock = {
   family: family,
   type: type,
   protocol: protocol,
   server: null,
   error: null,
   peers: {},
   pending: [],
   recv_queue: [],
   sock_ops: SOCKFS.websocket_sock_ops
  };
  var name = SOCKFS.nextname();
  var node = FS.createNode(SOCKFS.root, name, 49152, 0);
  node.sock = sock;
  var stream = FS.createStream({
   path: name,
   node: node,
   flags: 2,
   seekable: false,
   stream_ops: SOCKFS.stream_ops
  });
  sock.stream = stream;
  return sock;
 },
 getSocket(fd) {
  var stream = FS.getStream(fd);
  if (!stream || !FS.isSocket(stream.node.mode)) {
   return null;
  }
  return stream.node.sock;
 },
 stream_ops: {
  poll(stream) {
   var sock = stream.node.sock;
   return sock.sock_ops.poll(sock);
  },
  ioctl(stream, request, varargs) {
   var sock = stream.node.sock;
   return sock.sock_ops.ioctl(sock, request, varargs);
  },
  read(stream, buffer, offset, length, position) {
   /* ignored */ var sock = stream.node.sock;
   var msg = sock.sock_ops.recvmsg(sock, length);
   if (!msg) {
    return 0;
   }
   buffer.set(msg.buffer, offset);
   return msg.buffer.length;
  },
  write(stream, buffer, offset, length, position) {
   /* ignored */ var sock = stream.node.sock;
   return sock.sock_ops.sendmsg(sock, buffer, offset, length);
  },
  close(stream) {
   var sock = stream.node.sock;
   sock.sock_ops.close(sock);
  }
 },
 nextname() {
  if (!SOCKFS.nextname.current) {
   SOCKFS.nextname.current = 0;
  }
  return "socket[" + (SOCKFS.nextname.current++) + "]";
 },
 websocket_sock_ops: {
  createPeer(sock, addr, port) {
   var ws;
   if (typeof addr == "object") {
    ws = addr;
    addr = null;
    port = null;
   }
   if (ws) {
    if (ws._socket) {
     addr = ws._socket.remoteAddress;
     port = ws._socket.remotePort;
    } else  {
     var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
     if (!result) {
      throw new Error("WebSocket URL must be in the format ws(s)://address:port");
     }
     addr = result[1];
     port = parseInt(result[2], 10);
    }
   } else {
    try {
     var runtimeConfig = (Module["websocket"] && ("object" === typeof Module["websocket"]));
     var url = "ws:#".replace("#", "//");
     if (runtimeConfig) {
      if ("string" === typeof Module["websocket"]["url"]) {
       url = Module["websocket"]["url"];
      }
     }
     if (url === "ws://" || url === "wss://") {
      var parts = addr.split("/");
      url = url + parts[0] + ":" + port + "/" + parts.slice(1).join("/");
     }
     var subProtocols = "binary";
     if (runtimeConfig) {
      if ("string" === typeof Module["websocket"]["subprotocol"]) {
       subProtocols = Module["websocket"]["subprotocol"];
      }
     }
     var opts = undefined;
     if (subProtocols !== "null") {
      subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
      opts = subProtocols;
     }
     if (runtimeConfig && null === Module["websocket"]["subprotocol"]) {
      subProtocols = "null";
      opts = undefined;
     }
     var WebSocketConstructor;
     if (ENVIRONMENT_IS_NODE) {
      WebSocketConstructor = /** @type{(typeof WebSocket)} */ (require("ws"));
     } else {
      WebSocketConstructor = WebSocket;
     }
     ws = new WebSocketConstructor(url, opts);
     ws.binaryType = "arraybuffer";
    } catch (e) {
     throw new FS.ErrnoError(23);
    }
   }
   var peer = {
    addr: addr,
    port: port,
    socket: ws,
    dgram_send_queue: []
   };
   SOCKFS.websocket_sock_ops.addPeer(sock, peer);
   SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
   if (sock.type === 2 && typeof sock.sport != "undefined") {
    peer.dgram_send_queue.push(new Uint8Array([ 255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), ((sock.sport & 65280) >> 8), (sock.sport & 255) ]));
   }
   return peer;
  },
  getPeer(sock, addr, port) {
   return sock.peers[addr + ":" + port];
  },
  addPeer(sock, peer) {
   sock.peers[peer.addr + ":" + peer.port] = peer;
  },
  removePeer(sock, peer) {
   delete sock.peers[peer.addr + ":" + peer.port];
  },
  handlePeerEvents(sock, peer) {
   var first = true;
   var handleOpen = function() {
    Module["websocket"].emit("open", sock.stream.fd);
    try {
     var queued = peer.dgram_send_queue.shift();
     while (queued) {
      peer.socket.send(queued);
      queued = peer.dgram_send_queue.shift();
     }
    } catch (e) {
     peer.socket.close();
    }
   };
   function handleMessage(data) {
    if (typeof data == "string") {
     var encoder = new TextEncoder;
     data = encoder.encode(data);
    } else  {
     assert(data.byteLength !== undefined);
     if (data.byteLength == 0) {
      return;
     }
     data = new Uint8Array(data);
    }
    var wasfirst = first;
    first = false;
    if (wasfirst && data.length === 10 && data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 && data[4] === "p".charCodeAt(0) && data[5] === "o".charCodeAt(0) && data[6] === "r".charCodeAt(0) && data[7] === "t".charCodeAt(0)) {
     var newport = ((data[8] << 8) | data[9]);
     SOCKFS.websocket_sock_ops.removePeer(sock, peer);
     peer.port = newport;
     SOCKFS.websocket_sock_ops.addPeer(sock, peer);
     return;
    }
    sock.recv_queue.push({
     addr: peer.addr,
     port: peer.port,
     data: data
    });
    Module["websocket"].emit("message", sock.stream.fd);
   }
   if (ENVIRONMENT_IS_NODE) {
    peer.socket.on("open", handleOpen);
    peer.socket.on("message", function(data, isBinary) {
     if (!isBinary) {
      return;
     }
     handleMessage((new Uint8Array(data)).buffer);
    });
    peer.socket.on("close", function() {
     Module["websocket"].emit("close", sock.stream.fd);
    });
    peer.socket.on("error", function(error) {
     sock.error = 14;
     Module["websocket"].emit("error", [ sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused" ]);
    });
   } else {
    peer.socket.onopen = handleOpen;
    peer.socket.onclose = function() {
     Module["websocket"].emit("close", sock.stream.fd);
    };
    peer.socket.onmessage = function peer_socket_onmessage(event) {
     handleMessage(event.data);
    };
    peer.socket.onerror = function(error) {
     sock.error = 14;
     Module["websocket"].emit("error", [ sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused" ]);
    };
   }
  },
  poll(sock) {
   if (sock.type === 1 && sock.server) {
    return sock.pending.length ? (64 | 1) : 0;
   }
   var mask = 0;
   var dest = sock.type === 1 ?  SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
   if (sock.recv_queue.length || !dest ||  (dest && dest.socket.readyState === dest.socket.CLOSING) || (dest && dest.socket.readyState === dest.socket.CLOSED)) {
    mask |= (64 | 1);
   }
   if (!dest ||  (dest && dest.socket.readyState === dest.socket.OPEN)) {
    mask |= 4;
   }
   if ((dest && dest.socket.readyState === dest.socket.CLOSING) || (dest && dest.socket.readyState === dest.socket.CLOSED)) {
    mask |= 16;
   }
   return mask;
  },
  ioctl(sock, request, arg) {
   switch (request) {
   case 21531:
    var bytes = 0;
    if (sock.recv_queue.length) {
     bytes = sock.recv_queue[0].data.length;
    }
    GROWABLE_HEAP_I32()[((arg) >> 2)] = bytes;
    return 0;

   default:
    return 28;
   }
  },
  close(sock) {
   if (sock.server) {
    try {
     sock.server.close();
    } catch (e) {}
    sock.server = null;
   }
   var peers = Object.keys(sock.peers);
   for (var i = 0; i < peers.length; i++) {
    var peer = sock.peers[peers[i]];
    try {
     peer.socket.close();
    } catch (e) {}
    SOCKFS.websocket_sock_ops.removePeer(sock, peer);
   }
   return 0;
  },
  bind(sock, addr, port) {
   if (typeof sock.saddr != "undefined" || typeof sock.sport != "undefined") {
    throw new FS.ErrnoError(28);
   }
   sock.saddr = addr;
   sock.sport = port;
   if (sock.type === 2) {
    if (sock.server) {
     sock.server.close();
     sock.server = null;
    }
    try {
     sock.sock_ops.listen(sock, 0);
    } catch (e) {
     if (!(e.name === "ErrnoError")) throw e;
     if (e.errno !== 138) throw e;
    }
   }
  },
  connect(sock, addr, port) {
   if (sock.server) {
    throw new FS.ErrnoError(138);
   }
   if (typeof sock.daddr != "undefined" && typeof sock.dport != "undefined") {
    var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
    if (dest) {
     if (dest.socket.readyState === dest.socket.CONNECTING) {
      throw new FS.ErrnoError(7);
     } else {
      throw new FS.ErrnoError(30);
     }
    }
   }
   var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
   sock.daddr = peer.addr;
   sock.dport = peer.port;
   throw new FS.ErrnoError(26);
  },
  listen(sock, backlog) {
   if (!ENVIRONMENT_IS_NODE) {
    throw new FS.ErrnoError(138);
   }
   if (sock.server) {
    throw new FS.ErrnoError(28);
   }
   var WebSocketServer = require("ws").Server;
   var host = sock.saddr;
   sock.server = new WebSocketServer({
    host: host,
    port: sock.sport
   });
   Module["websocket"].emit("listen", sock.stream.fd);
   sock.server.on("connection", function(ws) {
    if (sock.type === 1) {
     var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
     var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
     newsock.daddr = peer.addr;
     newsock.dport = peer.port;
     sock.pending.push(newsock);
     Module["websocket"].emit("connection", newsock.stream.fd);
    } else {
     SOCKFS.websocket_sock_ops.createPeer(sock, ws);
     Module["websocket"].emit("connection", sock.stream.fd);
    }
   });
   sock.server.on("close", function() {
    Module["websocket"].emit("close", sock.stream.fd);
    sock.server = null;
   });
   sock.server.on("error", function(error) {
    sock.error = 23;
    Module["websocket"].emit("error", [ sock.stream.fd, sock.error, "EHOSTUNREACH: Host is unreachable" ]);
   });
  },
  accept(listensock) {
   if (!listensock.server || !listensock.pending.length) {
    throw new FS.ErrnoError(28);
   }
   var newsock = listensock.pending.shift();
   newsock.stream.flags = listensock.stream.flags;
   return newsock;
  },
  getname(sock, peer) {
   var addr, port;
   if (peer) {
    if (sock.daddr === undefined || sock.dport === undefined) {
     throw new FS.ErrnoError(53);
    }
    addr = sock.daddr;
    port = sock.dport;
   } else {
    addr = sock.saddr || 0;
    port = sock.sport || 0;
   }
   return {
    addr: addr,
    port: port
   };
  },
  sendmsg(sock, buffer, offset, length, addr, port) {
   if (sock.type === 2) {
    if (addr === undefined || port === undefined) {
     addr = sock.daddr;
     port = sock.dport;
    }
    if (addr === undefined || port === undefined) {
     throw new FS.ErrnoError(17);
    }
   } else {
    addr = sock.daddr;
    port = sock.dport;
   }
   var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
   if (sock.type === 1) {
    if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
     throw new FS.ErrnoError(53);
    } else if (dest.socket.readyState === dest.socket.CONNECTING) {
     throw new FS.ErrnoError(6);
    }
   }
   if (ArrayBuffer.isView(buffer)) {
    offset += buffer.byteOffset;
    buffer = buffer.buffer;
   }
   var data;
   if (buffer instanceof SharedArrayBuffer) {
    data = new Uint8Array(new Uint8Array(buffer.slice(offset, offset + length))).buffer;
   } else {
    data = buffer.slice(offset, offset + length);
   }
   if (sock.type === 2) {
    if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
     if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
      dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
     }
     dest.dgram_send_queue.push(data);
     return length;
    }
   }
   try {
    dest.socket.send(data);
    return length;
   } catch (e) {
    throw new FS.ErrnoError(28);
   }
  },
  recvmsg(sock, length) {
   if (sock.type === 1 && sock.server) {
    throw new FS.ErrnoError(53);
   }
   var queued = sock.recv_queue.shift();
   if (!queued) {
    if (sock.type === 1) {
     var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
     if (!dest) {
      throw new FS.ErrnoError(53);
     }
     if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
      return null;
     }
     throw new FS.ErrnoError(6);
    }
    throw new FS.ErrnoError(6);
   }
   var queuedLength = queued.data.byteLength || queued.data.length;
   var queuedOffset = queued.data.byteOffset || 0;
   var queuedBuffer = queued.data.buffer || queued.data;
   var bytesRead = Math.min(length, queuedLength);
   var res = {
    buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
    addr: queued.addr,
    port: queued.port
   };
   if (sock.type === 1 && bytesRead < queuedLength) {
    var bytesRemaining = queuedLength - bytesRead;
    queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
    sock.recv_queue.unshift(queued);
   }
   return res;
  }
 }
};

var getSocketFromFD = fd => {
 var socket = SOCKFS.getSocket(fd);
 if (!socket) throw new FS.ErrnoError(8);
 return socket;
};

var setErrNo = value => {
 GROWABLE_HEAP_I32()[((___errno_location()) >> 2)] = value;
 return value;
};

var Sockets = {
 BUFFER_SIZE: 10240,
 MAX_BUFFER_SIZE: 10485760,
 nextFd: 1,
 fds: {},
 nextport: 1,
 maxport: 65535,
 peer: null,
 connections: {},
 portmap: {},
 localAddr: 4261412874,
 addrPool: [ 33554442, 50331658, 67108874, 83886090, 100663306, 117440522, 134217738, 150994954, 167772170, 184549386, 201326602, 218103818, 234881034 ]
};

var inetPton4 = str => {
 var b = str.split(".");
 for (var i = 0; i < 4; i++) {
  var tmp = Number(b[i]);
  if (isNaN(tmp)) return null;
  b[i] = tmp;
 }
 return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
};

/** @suppress {checkTypes} */ var jstoi_q = str => parseInt(str);

var inetPton6 = str => {
 var words;
 var w, offset, z, i;
 /* http://home.deds.nl/~aeron/regex/ */ var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
 var parts = [];
 if (!valid6regx.test(str)) {
  return null;
 }
 if (str === "::") {
  return [ 0, 0, 0, 0, 0, 0, 0, 0 ];
 }
 if (str.startsWith("::")) {
  str = str.replace("::", "Z:");
 } else  {
  str = str.replace("::", ":Z:");
 }
 if (str.indexOf(".") > 0) {
  str = str.replace(new RegExp("[.]", "g"), ":");
  words = str.split(":");
  words[words.length - 4] = jstoi_q(words[words.length - 4]) + jstoi_q(words[words.length - 3]) * 256;
  words[words.length - 3] = jstoi_q(words[words.length - 2]) + jstoi_q(words[words.length - 1]) * 256;
  words = words.slice(0, words.length - 2);
 } else {
  words = str.split(":");
 }
 offset = 0;
 z = 0;
 for (w = 0; w < words.length; w++) {
  if (typeof words[w] == "string") {
   if (words[w] === "Z") {
    for (z = 0; z < (8 - words.length + 1); z++) {
     parts[w + z] = 0;
    }
    offset = z - 1;
   } else {
    parts[w + offset] = _htons(parseInt(words[w], 16));
   }
  } else {
   parts[w + offset] = words[w];
  }
 }
 return [ (parts[1] << 16) | parts[0], (parts[3] << 16) | parts[2], (parts[5] << 16) | parts[4], (parts[7] << 16) | parts[6] ];
};

/** @param {number=} addrlen */ var writeSockaddr = (sa, family, addr, port, addrlen) => {
 switch (family) {
 case 2:
  addr = inetPton4(addr);
  zeroMemory(sa, 16);
  if (addrlen) {
   GROWABLE_HEAP_I32()[((addrlen) >> 2)] = 16;
  }
  GROWABLE_HEAP_I16()[((sa) >> 1)] = family;
  GROWABLE_HEAP_I32()[(((sa) + (4)) >> 2)] = addr;
  GROWABLE_HEAP_I16()[(((sa) + (2)) >> 1)] = _htons(port);
  break;

 case 10:
  addr = inetPton6(addr);
  zeroMemory(sa, 28);
  if (addrlen) {
   GROWABLE_HEAP_I32()[((addrlen) >> 2)] = 28;
  }
  GROWABLE_HEAP_I32()[((sa) >> 2)] = family;
  GROWABLE_HEAP_I32()[(((sa) + (8)) >> 2)] = addr[0];
  GROWABLE_HEAP_I32()[(((sa) + (12)) >> 2)] = addr[1];
  GROWABLE_HEAP_I32()[(((sa) + (16)) >> 2)] = addr[2];
  GROWABLE_HEAP_I32()[(((sa) + (20)) >> 2)] = addr[3];
  GROWABLE_HEAP_I16()[(((sa) + (2)) >> 1)] = _htons(port);
  break;

 default:
  return 5;
 }
 return 0;
};

var DNS = {
 address_map: {
  id: 1,
  addrs: {},
  names: {}
 },
 lookup_name(name) {
  var res = inetPton4(name);
  if (res !== null) {
   return name;
  }
  res = inetPton6(name);
  if (res !== null) {
   return name;
  }
  var addr;
  if (DNS.address_map.addrs[name]) {
   addr = DNS.address_map.addrs[name];
  } else {
   var id = DNS.address_map.id++;
   assert(id < 65535, "exceeded max address mappings of 65535");
   addr = "172.29." + (id & 255) + "." + (id & 65280);
   DNS.address_map.names[addr] = name;
   DNS.address_map.addrs[name] = addr;
  }
  return addr;
 },
 lookup_addr(addr) {
  if (DNS.address_map.names[addr]) {
   return DNS.address_map.names[addr];
  }
  return null;
 }
};

function ___syscall_accept4(fd, addr, addrlen, flags, d1, d2) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 1, fd, addr, addrlen, flags, d1, d2);
 try {
  var sock = getSocketFromFD(fd);
  var newsock = sock.sock_ops.accept(sock);
  if (addr) {
   var errno = writeSockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport, addrlen);
  }
  return newsock.stream.fd;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

var inetNtop4 = addr => (addr & 255) + "." + ((addr >> 8) & 255) + "." + ((addr >> 16) & 255) + "." + ((addr >> 24) & 255);

var inetNtop6 = ints => {
 var str = "";
 var word = 0;
 var longest = 0;
 var lastzero = 0;
 var zstart = 0;
 var len = 0;
 var i = 0;
 var parts = [ ints[0] & 65535, (ints[0] >> 16), ints[1] & 65535, (ints[1] >> 16), ints[2] & 65535, (ints[2] >> 16), ints[3] & 65535, (ints[3] >> 16) ];
 var hasipv4 = true;
 var v4part = "";
 for (i = 0; i < 5; i++) {
  if (parts[i] !== 0) {
   hasipv4 = false;
   break;
  }
 }
 if (hasipv4) {
  v4part = inetNtop4(parts[6] | (parts[7] << 16));
  if (parts[5] === -1) {
   str = "::ffff:";
   str += v4part;
   return str;
  }
  if (parts[5] === 0) {
   str = "::";
   if (v4part === "0.0.0.0") v4part = "";
   if (v4part === "0.0.0.1") v4part = "1";
   str += v4part;
   return str;
  }
 }
 for (word = 0; word < 8; word++) {
  if (parts[word] === 0) {
   if (word - lastzero > 1) {
    len = 0;
   }
   lastzero = word;
   len++;
  }
  if (len > longest) {
   longest = len;
   zstart = word - longest + 1;
  }
 }
 for (word = 0; word < 8; word++) {
  if (longest > 1) {
   if (parts[word] === 0 && word >= zstart && word < (zstart + longest)) {
    if (word === zstart) {
     str += ":";
     if (zstart === 0) str += ":";
    }
    continue;
   }
  }
  str += Number(_ntohs(parts[word] & 65535)).toString(16);
  str += word < 7 ? ":" : "";
 }
 return str;
};

var readSockaddr = (sa, salen) => {
 var family = GROWABLE_HEAP_I16()[((sa) >> 1)];
 var port = _ntohs(GROWABLE_HEAP_U16()[(((sa) + (2)) >> 1)]);
 var addr;
 switch (family) {
 case 2:
  if (salen !== 16) {
   return {
    errno: 28
   };
  }
  addr = GROWABLE_HEAP_I32()[(((sa) + (4)) >> 2)];
  addr = inetNtop4(addr);
  break;

 case 10:
  if (salen !== 28) {
   return {
    errno: 28
   };
  }
  addr = [ GROWABLE_HEAP_I32()[(((sa) + (8)) >> 2)], GROWABLE_HEAP_I32()[(((sa) + (12)) >> 2)], GROWABLE_HEAP_I32()[(((sa) + (16)) >> 2)], GROWABLE_HEAP_I32()[(((sa) + (20)) >> 2)] ];
  addr = inetNtop6(addr);
  break;

 default:
  return {
   errno: 5
  };
 }
 return {
  family: family,
  addr: addr,
  port: port
 };
};

/** @param {boolean=} allowNull */ var getSocketAddress = (addrp, addrlen, allowNull) => {
 if (allowNull && addrp === 0) return null;
 var info = readSockaddr(addrp, addrlen);
 if (info.errno) throw new FS.ErrnoError(info.errno);
 info.addr = DNS.lookup_addr(info.addr) || info.addr;
 return info;
};

function ___syscall_bind(fd, addr, addrlen, d1, d2, d3) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 1, fd, addr, addrlen, d1, d2, d3);
 try {
  var sock = getSocketFromFD(fd);
  var info = getSocketAddress(addr, addrlen);
  sock.sock_ops.bind(sock, info.addr, info.port);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_chdir(path) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 1, path);
 try {
  path = SYSCALLS.getStr(path);
  FS.chdir(path);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_chmod(path, mode) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 1, path, mode);
 try {
  path = SYSCALLS.getStr(path);
  FS.chmod(path, mode);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_connect(fd, addr, addrlen, d1, d2, d3) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 1, fd, addr, addrlen, d1, d2, d3);
 try {
  var sock = getSocketFromFD(fd);
  var info = getSocketAddress(addr, addrlen);
  sock.sock_ops.connect(sock, info.addr, info.port);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_dup3(fd, newfd, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 1, fd, newfd, flags);
 try {
  var old = SYSCALLS.getStreamFromFD(fd);
  if (old.fd === newfd) return -28;
  var existing = FS.getStream(newfd);
  if (existing) FS.close(existing);
  return FS.createStream(old, newfd).fd;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_faccessat(dirfd, path, amode, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 1, dirfd, path, amode, flags);
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  if (amode & ~7) {
   return -28;
  }
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node) {
   return -44;
  }
  var perms = "";
  if (amode & 4) perms += "r";
  if (amode & 2) perms += "w";
  if (amode & 1) perms += "x";
  if (perms && /* otherwise, they've just passed F_OK */ FS.nodePermissions(node, perms)) {
   return -2;
  }
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_fchmod(fd, mode) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 1, fd, mode);
 try {
  FS.fchmod(fd, mode);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_fcntl64(fd, cmd, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(12, 1, fd, cmd, varargs);
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  switch (cmd) {
  case 0:
   {
    var arg = SYSCALLS.get();
    if (arg < 0) {
     return -28;
    }
    while (FS.streams[arg]) {
     arg++;
    }
    var newStream;
    newStream = FS.createStream(stream, arg);
    return newStream.fd;
   }

  case 1:
  case 2:
   return 0;

  case 3:
   return stream.flags;

  case 4:
   {
    var arg = SYSCALLS.get();
    stream.flags |= arg;
    return 0;
   }

  case 5:
   {
    var arg = SYSCALLS.getp();
    var offset = 0;
    GROWABLE_HEAP_I16()[(((arg) + (offset)) >> 1)] = 2;
    return 0;
   }

  case 6:
  case 7:
   return 0;

  case 16:
  case 8:
   return -28;

  case 9:
   setErrNo(28);
   return -1;

  default:
   {
    return -28;
   }
  }
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_fstat64(fd, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(13, 1, fd, buf);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  return SYSCALLS.doStat(FS.stat, stream.path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_ftruncate64(fd, length) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(14, 1, fd, length);
 length = bigintToI53Checked(length);
 try {
  if (isNaN(length)) return 61;
  FS.ftruncate(fd, length);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, GROWABLE_HEAP_U8(), outPtr, maxBytesToWrite);

function ___syscall_getcwd(buf, size) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(15, 1, buf, size);
 try {
  if (size === 0) return -28;
  var cwd = FS.cwd();
  var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
  if (size < cwdLengthInBytes) return -68;
  stringToUTF8(cwd, buf, size);
  return cwdLengthInBytes;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_getdents64(fd, dirp, count) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(16, 1, fd, dirp, count);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  stream.getdents ||= FS.readdir(stream.path);
  var struct_size = 280;
  var pos = 0;
  var off = FS.llseek(stream, 0, 1);
  var idx = Math.floor(off / struct_size);
  while (idx < stream.getdents.length && pos + struct_size <= count) {
   var id;
   var type;
   var name = stream.getdents[idx];
   if (name === ".") {
    id = stream.node.id;
    type = 4;
   } else if (name === "..") {
    var lookup = FS.lookupPath(stream.path, {
     parent: true
    });
    id = lookup.node.id;
    type = 4;
   } else {
    var child = FS.lookupNode(stream.node, name);
    id = child.id;
    type = FS.isChrdev(child.mode) ? 2 :  FS.isDir(child.mode) ? 4 :  FS.isLink(child.mode) ? 10 :  8;
   }
   HEAP64[((dirp + pos) >> 3)] = BigInt(id);
   HEAP64[(((dirp + pos) + (8)) >> 3)] = BigInt((idx + 1) * struct_size);
   GROWABLE_HEAP_I16()[(((dirp + pos) + (16)) >> 1)] = 280;
   GROWABLE_HEAP_I8()[(((dirp + pos) + (18)) >> 0)] = type;
   stringToUTF8(name, dirp + pos + 19, 256);
   pos += struct_size;
   idx += 1;
  }
  FS.llseek(stream, idx * struct_size, 0);
  return pos;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_ioctl(fd, op, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(17, 1, fd, op, varargs);
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  switch (op) {
  case 21509:
   {
    if (!stream.tty) return -59;
    return 0;
   }

  case 21505:
   {
    if (!stream.tty) return -59;
    if (stream.tty.ops.ioctl_tcgets) {
     var termios = stream.tty.ops.ioctl_tcgets(stream);
     var argp = SYSCALLS.getp();
     GROWABLE_HEAP_I32()[((argp) >> 2)] = termios.c_iflag || 0;
     GROWABLE_HEAP_I32()[(((argp) + (4)) >> 2)] = termios.c_oflag || 0;
     GROWABLE_HEAP_I32()[(((argp) + (8)) >> 2)] = termios.c_cflag || 0;
     GROWABLE_HEAP_I32()[(((argp) + (12)) >> 2)] = termios.c_lflag || 0;
     for (var i = 0; i < 32; i++) {
      GROWABLE_HEAP_I8()[(((argp + i) + (17)) >> 0)] = termios.c_cc[i] || 0;
     }
     return 0;
    }
    return 0;
   }

  case 21510:
  case 21511:
  case 21512:
   {
    if (!stream.tty) return -59;
    return 0;
   }

  case 21506:
  case 21507:
  case 21508:
   {
    if (!stream.tty) return -59;
    if (stream.tty.ops.ioctl_tcsets) {
     var argp = SYSCALLS.getp();
     var c_iflag = GROWABLE_HEAP_I32()[((argp) >> 2)];
     var c_oflag = GROWABLE_HEAP_I32()[(((argp) + (4)) >> 2)];
     var c_cflag = GROWABLE_HEAP_I32()[(((argp) + (8)) >> 2)];
     var c_lflag = GROWABLE_HEAP_I32()[(((argp) + (12)) >> 2)];
     var c_cc = [];
     for (var i = 0; i < 32; i++) {
      c_cc.push(GROWABLE_HEAP_I8()[(((argp + i) + (17)) >> 0)]);
     }
     return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
      c_iflag: c_iflag,
      c_oflag: c_oflag,
      c_cflag: c_cflag,
      c_lflag: c_lflag,
      c_cc: c_cc
     });
    }
    return 0;
   }

  case 21519:
   {
    if (!stream.tty) return -59;
    var argp = SYSCALLS.getp();
    GROWABLE_HEAP_I32()[((argp) >> 2)] = 0;
    return 0;
   }

  case 21520:
   {
    if (!stream.tty) return -59;
    return -28;
   }

  case 21531:
   {
    var argp = SYSCALLS.getp();
    return FS.ioctl(stream, op, argp);
   }

  case 21523:
   {
    if (!stream.tty) return -59;
    if (stream.tty.ops.ioctl_tiocgwinsz) {
     var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
     var argp = SYSCALLS.getp();
     GROWABLE_HEAP_I16()[((argp) >> 1)] = winsize[0];
     GROWABLE_HEAP_I16()[(((argp) + (2)) >> 1)] = winsize[1];
    }
    return 0;
   }

  case 21524:
   {
    if (!stream.tty) return -59;
    return 0;
   }

  case 21515:
   {
    if (!stream.tty) return -59;
    return 0;
   }

  default:
   return -28;
  }
 }  catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_listen(fd, backlog) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(18, 1, fd, backlog);
 try {
  var sock = getSocketFromFD(fd);
  sock.sock_ops.listen(sock, backlog);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_lstat64(path, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(19, 1, path, buf);
 try {
  path = SYSCALLS.getStr(path);
  return SYSCALLS.doStat(FS.lstat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_mkdirat(dirfd, path, mode) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(20, 1, dirfd, path, mode);
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  path = PATH.normalize(path);
  if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
  FS.mkdir(path, mode, 0);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_newfstatat(dirfd, path, buf, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(21, 1, dirfd, path, buf, flags);
 try {
  path = SYSCALLS.getStr(path);
  var nofollow = flags & 256;
  var allowEmpty = flags & 4096;
  flags = flags & (~6400);
  path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
  return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_openat(dirfd, path, flags, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(22, 1, dirfd, path, flags, varargs);
 SYSCALLS.varargs = varargs;
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  var mode = varargs ? SYSCALLS.get() : 0;
  return FS.open(path, flags, mode).fd;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

var PIPEFS = {
 BUCKET_BUFFER_SIZE: 8192,
 mount(mount) {
  return FS.createNode(null, "/", 16384 | 511, /* 0777 */ 0);
 },
 createPipe() {
  var pipe = {
   buckets: [],
   refcnt: 2
  };
  pipe.buckets.push({
   buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
   offset: 0,
   roffset: 0
  });
  var rName = PIPEFS.nextname();
  var wName = PIPEFS.nextname();
  var rNode = FS.createNode(PIPEFS.root, rName, 4096, 0);
  var wNode = FS.createNode(PIPEFS.root, wName, 4096, 0);
  rNode.pipe = pipe;
  wNode.pipe = pipe;
  var readableStream = FS.createStream({
   path: rName,
   node: rNode,
   flags: 0,
   seekable: false,
   stream_ops: PIPEFS.stream_ops
  });
  rNode.stream = readableStream;
  var writableStream = FS.createStream({
   path: wName,
   node: wNode,
   flags: 1,
   seekable: false,
   stream_ops: PIPEFS.stream_ops
  });
  wNode.stream = writableStream;
  return {
   readable_fd: readableStream.fd,
   writable_fd: writableStream.fd
  };
 },
 stream_ops: {
  poll(stream) {
   var pipe = stream.node.pipe;
   if ((stream.flags & 2097155) === 1) {
    return (256 | 4);
   }
   if (pipe.buckets.length > 0) {
    for (var i = 0; i < pipe.buckets.length; i++) {
     var bucket = pipe.buckets[i];
     if (bucket.offset - bucket.roffset > 0) {
      return (64 | 1);
     }
    }
   }
   return 0;
  },
  ioctl(stream, request, varargs) {
   return 28;
  },
  fsync(stream) {
   return 28;
  },
  read(stream, buffer, offset, length, position) {
   /* ignored */ var pipe = stream.node.pipe;
   var currentLength = 0;
   for (var i = 0; i < pipe.buckets.length; i++) {
    var bucket = pipe.buckets[i];
    currentLength += bucket.offset - bucket.roffset;
   }
   var data = buffer.subarray(offset, offset + length);
   if (length <= 0) {
    return 0;
   }
   if (currentLength == 0) {
    throw new FS.ErrnoError(6);
   }
   var toRead = Math.min(currentLength, length);
   var totalRead = toRead;
   var toRemove = 0;
   for (var i = 0; i < pipe.buckets.length; i++) {
    var currBucket = pipe.buckets[i];
    var bucketSize = currBucket.offset - currBucket.roffset;
    if (toRead <= bucketSize) {
     var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
     if (toRead < bucketSize) {
      tmpSlice = tmpSlice.subarray(0, toRead);
      currBucket.roffset += toRead;
     } else {
      toRemove++;
     }
     data.set(tmpSlice);
     break;
    } else {
     var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
     data.set(tmpSlice);
     data = data.subarray(tmpSlice.byteLength);
     toRead -= tmpSlice.byteLength;
     toRemove++;
    }
   }
   if (toRemove && toRemove == pipe.buckets.length) {
    toRemove--;
    pipe.buckets[toRemove].offset = 0;
    pipe.buckets[toRemove].roffset = 0;
   }
   pipe.buckets.splice(0, toRemove);
   return totalRead;
  },
  write(stream, buffer, offset, length, position) {
   /* ignored */ var pipe = stream.node.pipe;
   var data = buffer.subarray(offset, offset + length);
   var dataLen = data.byteLength;
   if (dataLen <= 0) {
    return 0;
   }
   var currBucket = null;
   if (pipe.buckets.length == 0) {
    currBucket = {
     buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
     offset: 0,
     roffset: 0
    };
    pipe.buckets.push(currBucket);
   } else {
    currBucket = pipe.buckets[pipe.buckets.length - 1];
   }
   assert(currBucket.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
   var freeBytesInCurrBuffer = PIPEFS.BUCKET_BUFFER_SIZE - currBucket.offset;
   if (freeBytesInCurrBuffer >= dataLen) {
    currBucket.buffer.set(data, currBucket.offset);
    currBucket.offset += dataLen;
    return dataLen;
   } else if (freeBytesInCurrBuffer > 0) {
    currBucket.buffer.set(data.subarray(0, freeBytesInCurrBuffer), currBucket.offset);
    currBucket.offset += freeBytesInCurrBuffer;
    data = data.subarray(freeBytesInCurrBuffer, data.byteLength);
   }
   var numBuckets = (data.byteLength / PIPEFS.BUCKET_BUFFER_SIZE) | 0;
   var remElements = data.byteLength % PIPEFS.BUCKET_BUFFER_SIZE;
   for (var i = 0; i < numBuckets; i++) {
    var newBucket = {
     buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
     offset: PIPEFS.BUCKET_BUFFER_SIZE,
     roffset: 0
    };
    pipe.buckets.push(newBucket);
    newBucket.buffer.set(data.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE));
    data = data.subarray(PIPEFS.BUCKET_BUFFER_SIZE, data.byteLength);
   }
   if (remElements > 0) {
    var newBucket = {
     buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
     offset: data.byteLength,
     roffset: 0
    };
    pipe.buckets.push(newBucket);
    newBucket.buffer.set(data);
   }
   return dataLen;
  },
  close(stream) {
   var pipe = stream.node.pipe;
   pipe.refcnt--;
   if (pipe.refcnt === 0) {
    pipe.buckets = null;
   }
  }
 },
 nextname() {
  if (!PIPEFS.nextname.current) {
   PIPEFS.nextname.current = 0;
  }
  return "pipe[" + (PIPEFS.nextname.current++) + "]";
 }
};

function ___syscall_pipe(fdPtr) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(23, 1, fdPtr);
 try {
  if (fdPtr == 0) {
   throw new FS.ErrnoError(21);
  }
  var res = PIPEFS.createPipe();
  GROWABLE_HEAP_I32()[((fdPtr) >> 2)] = res.readable_fd;
  GROWABLE_HEAP_I32()[(((fdPtr) + (4)) >> 2)] = res.writable_fd;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(24, 1, dirfd, path, buf, bufsize);
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  if (bufsize <= 0) return -28;
  var ret = FS.readlink(path);
  var len = Math.min(bufsize, lengthBytesUTF8(ret));
  var endChar = GROWABLE_HEAP_I8()[buf + len];
  stringToUTF8(ret, buf, bufsize + 1);
  GROWABLE_HEAP_I8()[buf + len] = endChar;
  return len;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_recvfrom(fd, buf, len, flags, addr, addrlen) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(25, 1, fd, buf, len, flags, addr, addrlen);
 try {
  var sock = getSocketFromFD(fd);
  var msg = sock.sock_ops.recvmsg(sock, len);
  if (!msg) return 0;
  if (addr) {
   var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port, addrlen);
  }
  GROWABLE_HEAP_U8().set(msg.buffer, buf);
  return msg.buffer.byteLength;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_rmdir(path) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(26, 1, path);
 try {
  path = SYSCALLS.getStr(path);
  FS.rmdir(path);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_sendto(fd, message, length, flags, addr, addr_len) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(27, 1, fd, message, length, flags, addr, addr_len);
 try {
  var sock = getSocketFromFD(fd);
  var dest = getSocketAddress(addr, addr_len, true);
  if (!dest) {
   return FS.write(sock.stream, GROWABLE_HEAP_I8(), message, length);
  }
  return sock.sock_ops.sendmsg(sock, GROWABLE_HEAP_I8(), message, length, dest.addr, dest.port);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_socket(domain, type, protocol) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(28, 1, domain, type, protocol);
 try {
  var sock = SOCKFS.createSocket(domain, type, protocol);
  return sock.stream.fd;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_stat64(path, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(29, 1, path, buf);
 try {
  path = SYSCALLS.getStr(path);
  return SYSCALLS.doStat(FS.stat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_unlinkat(dirfd, path, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(30, 1, dirfd, path, flags);
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  if (flags === 0) {
   FS.unlink(path);
  } else if (flags === 512) {
   FS.rmdir(path);
  } else {
   abort("Invalid flags passed to unlinkat");
  }
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function __emscripten_fetch_free(id) {
 if (Fetch.xhrs.has(id)) {
  var xhr = Fetch.xhrs.get(id);
  Fetch.xhrs.free(id);
  if (xhr.readyState > 0 && xhr.readyState < 4) {
   xhr.abort();
  }
 }
}

var nowIsMonotonic = 1;

var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;

var maybeExit = () => {
 if (!keepRuntimeAlive()) {
  try {
   if (ENVIRONMENT_IS_PTHREAD) __emscripten_thread_exit(EXITSTATUS); else _exit(EXITSTATUS);
  } catch (e) {
   handleException(e);
  }
 }
};

var callUserCallback = func => {
 if (ABORT) {
  return;
 }
 try {
  func();
  maybeExit();
 } catch (e) {
  handleException(e);
 }
};

var __emscripten_thread_mailbox_await = pthread_ptr => {
 if (typeof Atomics.waitAsync === "function") {
  var wait = Atomics.waitAsync(GROWABLE_HEAP_I32(), ((pthread_ptr) >> 2), pthread_ptr);
  wait.value.then(checkMailbox);
  var waitingAsync = pthread_ptr + 128;
  Atomics.store(GROWABLE_HEAP_I32(), ((waitingAsync) >> 2), 1);
 }
};

Module["__emscripten_thread_mailbox_await"] = __emscripten_thread_mailbox_await;

var checkMailbox = () => {
 var pthread_ptr = _pthread_self();
 if (pthread_ptr) {
  __emscripten_thread_mailbox_await(pthread_ptr);
  callUserCallback(__emscripten_check_mailbox);
 }
};

Module["checkMailbox"] = checkMailbox;

var __emscripten_notify_mailbox_postmessage = (targetThreadId, currThreadId, mainThreadId) => {
 if (targetThreadId == currThreadId) {
  setTimeout(() => checkMailbox());
 } else if (ENVIRONMENT_IS_PTHREAD) {
  postMessage({
   "targetThread": targetThreadId,
   "cmd": "checkMailbox"
  });
 } else {
  var worker = PThread.pthreads[targetThreadId];
  if (!worker) {
   return;
  }
  worker.postMessage({
   "cmd": "checkMailbox"
  });
 }
};

var proxiedJSCallArgs = [];

var __emscripten_receive_on_main_thread_js = (index, callingThread, numCallArgs, args) => {
 numCallArgs /= 2;
 proxiedJSCallArgs.length = numCallArgs;
 var b = ((args) >> 3);
 for (var i = 0; i < numCallArgs; i++) {
  if (HEAP64[b + 2 * i]) {
   proxiedJSCallArgs[i] = HEAP64[b + 2 * i + 1];
  } else {
   proxiedJSCallArgs[i] = GROWABLE_HEAP_F64()[b + 2 * i + 1];
  }
 }
 var isEmAsmConst = index < 0;
 var func = !isEmAsmConst ? proxiedFunctionTable[index] : ASM_CONSTS[-index - 1];
 PThread.currentProxiedOperationCallerThread = callingThread;
 var rtn = func.apply(null, proxiedJSCallArgs);
 PThread.currentProxiedOperationCallerThread = 0;
 return rtn;
};

var __emscripten_thread_set_strongref = thread => {
 if (ENVIRONMENT_IS_NODE) {
  PThread.pthreads[thread].ref();
 }
};

var __emscripten_throw_longjmp = () => {
 throw Infinity;
};

function __gmtime_js(time, tmPtr) {
 time = bigintToI53Checked(time);
 var date = new Date(time * 1e3);
 GROWABLE_HEAP_I32()[((tmPtr) >> 2)] = date.getUTCSeconds();
 GROWABLE_HEAP_I32()[(((tmPtr) + (4)) >> 2)] = date.getUTCMinutes();
 GROWABLE_HEAP_I32()[(((tmPtr) + (8)) >> 2)] = date.getUTCHours();
 GROWABLE_HEAP_I32()[(((tmPtr) + (12)) >> 2)] = date.getUTCDate();
 GROWABLE_HEAP_I32()[(((tmPtr) + (16)) >> 2)] = date.getUTCMonth();
 GROWABLE_HEAP_I32()[(((tmPtr) + (20)) >> 2)] = date.getUTCFullYear() - 1900;
 GROWABLE_HEAP_I32()[(((tmPtr) + (24)) >> 2)] = date.getUTCDay();
 var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
 var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
 GROWABLE_HEAP_I32()[(((tmPtr) + (28)) >> 2)] = yday;
}

var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

var MONTH_DAYS_LEAP_CUMULATIVE = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335 ];

var MONTH_DAYS_REGULAR_CUMULATIVE = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];

var ydayFromDate = date => {
 var leap = isLeapYear(date.getFullYear());
 var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
 var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
 return yday;
};

function __localtime_js(time, tmPtr) {
 time = bigintToI53Checked(time);
 var date = new Date(time * 1e3);
 GROWABLE_HEAP_I32()[((tmPtr) >> 2)] = date.getSeconds();
 GROWABLE_HEAP_I32()[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
 GROWABLE_HEAP_I32()[(((tmPtr) + (8)) >> 2)] = date.getHours();
 GROWABLE_HEAP_I32()[(((tmPtr) + (12)) >> 2)] = date.getDate();
 GROWABLE_HEAP_I32()[(((tmPtr) + (16)) >> 2)] = date.getMonth();
 GROWABLE_HEAP_I32()[(((tmPtr) + (20)) >> 2)] = date.getFullYear() - 1900;
 GROWABLE_HEAP_I32()[(((tmPtr) + (24)) >> 2)] = date.getDay();
 var yday = ydayFromDate(date) | 0;
 GROWABLE_HEAP_I32()[(((tmPtr) + (28)) >> 2)] = yday;
 GROWABLE_HEAP_I32()[(((tmPtr) + (36)) >> 2)] = -(date.getTimezoneOffset() * 60);
 var start = new Date(date.getFullYear(), 0, 1);
 var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
 var winterOffset = start.getTimezoneOffset();
 var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
 GROWABLE_HEAP_I32()[(((tmPtr) + (32)) >> 2)] = dst;
}

var __mktime_js = function(tmPtr) {
 var ret = (() => {
  var date = new Date(GROWABLE_HEAP_I32()[(((tmPtr) + (20)) >> 2)] + 1900, GROWABLE_HEAP_I32()[(((tmPtr) + (16)) >> 2)], GROWABLE_HEAP_I32()[(((tmPtr) + (12)) >> 2)], GROWABLE_HEAP_I32()[(((tmPtr) + (8)) >> 2)], GROWABLE_HEAP_I32()[(((tmPtr) + (4)) >> 2)], GROWABLE_HEAP_I32()[((tmPtr) >> 2)], 0);
  var dst = GROWABLE_HEAP_I32()[(((tmPtr) + (32)) >> 2)];
  var guessedOffset = date.getTimezoneOffset();
  var start = new Date(date.getFullYear(), 0, 1);
  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dstOffset = Math.min(winterOffset, summerOffset);
  if (dst < 0) {
   GROWABLE_HEAP_I32()[(((tmPtr) + (32)) >> 2)] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
  } else if ((dst > 0) != (dstOffset == guessedOffset)) {
   var nonDstOffset = Math.max(winterOffset, summerOffset);
   var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
   date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
  }
  GROWABLE_HEAP_I32()[(((tmPtr) + (24)) >> 2)] = date.getDay();
  var yday = ydayFromDate(date) | 0;
  GROWABLE_HEAP_I32()[(((tmPtr) + (28)) >> 2)] = yday;
  GROWABLE_HEAP_I32()[((tmPtr) >> 2)] = date.getSeconds();
  GROWABLE_HEAP_I32()[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
  GROWABLE_HEAP_I32()[(((tmPtr) + (8)) >> 2)] = date.getHours();
  GROWABLE_HEAP_I32()[(((tmPtr) + (12)) >> 2)] = date.getDate();
  GROWABLE_HEAP_I32()[(((tmPtr) + (16)) >> 2)] = date.getMonth();
  GROWABLE_HEAP_I32()[(((tmPtr) + (20)) >> 2)] = date.getYear();
  var timeMs = date.getTime();
  if (isNaN(timeMs)) {
   setErrNo(61);
   return -1;
  }
  return timeMs / 1e3;
 })();
 return BigInt(ret);
};

function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(31, 1, len, prot, flags, fd, offset, allocated, addr);
 offset = bigintToI53Checked(offset);
 try {
  if (isNaN(offset)) return 61;
  var stream = SYSCALLS.getStreamFromFD(fd);
  var res = FS.mmap(stream, len, offset, prot, flags);
  var ptr = res.ptr;
  GROWABLE_HEAP_I32()[((allocated) >> 2)] = res.allocated;
  GROWABLE_HEAP_U32()[((addr) >> 2)] = ptr;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function __munmap_js(addr, len, prot, flags, fd, offset) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(32, 1, addr, len, prot, flags, fd, offset);
 offset = bigintToI53Checked(offset);
 try {
  if (isNaN(offset)) return 61;
  var stream = SYSCALLS.getStreamFromFD(fd);
  if (prot & 2) {
   SYSCALLS.doMsync(addr, stream, len, flags, offset);
  }
  FS.munmap(stream);
 }  catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

var stringToNewUTF8 = str => {
 var size = lengthBytesUTF8(str) + 1;
 var ret = _malloc(size);
 if (ret) stringToUTF8(str, ret, size);
 return ret;
};

var __tzset_js = (timezone, daylight, tzname) => {
 var currentYear = (new Date).getFullYear();
 var winter = new Date(currentYear, 0, 1);
 var summer = new Date(currentYear, 6, 1);
 var winterOffset = winter.getTimezoneOffset();
 var summerOffset = summer.getTimezoneOffset();
 var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
 GROWABLE_HEAP_U32()[((timezone) >> 2)] = stdTimezoneOffset * 60;
 GROWABLE_HEAP_I32()[((daylight) >> 2)] = Number(winterOffset != summerOffset);
 function extractZone(date) {
  var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
  return match ? match[1] : "GMT";
 }
 var winterName = extractZone(winter);
 var summerName = extractZone(summer);
 var winterNamePtr = stringToNewUTF8(winterName);
 var summerNamePtr = stringToNewUTF8(summerName);
 if (summerOffset < winterOffset) {
  GROWABLE_HEAP_U32()[((tzname) >> 2)] = winterNamePtr;
  GROWABLE_HEAP_U32()[(((tzname) + (4)) >> 2)] = summerNamePtr;
 } else {
  GROWABLE_HEAP_U32()[((tzname) >> 2)] = summerNamePtr;
  GROWABLE_HEAP_U32()[(((tzname) + (4)) >> 2)] = winterNamePtr;
 }
};

var _abort = () => {
 abort("");
};

var readEmAsmArgsArray = [];

var readEmAsmArgs = (sigPtr, buf) => {
 readEmAsmArgsArray.length = 0;
 var ch;
 while (ch = GROWABLE_HEAP_U8()[sigPtr++]) {
  var wide = (ch != 105);
  wide &= (ch != 112);
  buf += wide && (buf % 8) ? 4 : 0;
  readEmAsmArgsArray.push( ch == 112 ? GROWABLE_HEAP_U32()[((buf) >> 2)] : ch == 106 ? HEAP64[((buf) >> 3)] : ch == 105 ? GROWABLE_HEAP_I32()[((buf) >> 2)] : GROWABLE_HEAP_F64()[((buf) >> 3)]);
  buf += wide ? 8 : 4;
 }
 return readEmAsmArgsArray;
};

var runEmAsmFunction = (code, sigPtr, argbuf) => {
 var args = readEmAsmArgs(sigPtr, argbuf);
 return ASM_CONSTS[code].apply(null, args);
};

var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);

var runMainThreadEmAsm = (code, sigPtr, argbuf, sync) => {
 var args = readEmAsmArgs(sigPtr, argbuf);
 if (ENVIRONMENT_IS_PTHREAD) {
  return proxyToMainThread.apply(null, [ -1 - code, sync ].concat(args));
 }
 return ASM_CONSTS[code].apply(null, args);
};

var _emscripten_asm_const_int_sync_on_main_thread = (code, sigPtr, argbuf) => runMainThreadEmAsm(code, sigPtr, argbuf, 1);

var runtimeKeepalivePush = () => {
 runtimeKeepaliveCounter += 1;
};

var _emscripten_set_main_loop_timing = (mode, value) => {
 Browser.mainLoop.timingMode = mode;
 Browser.mainLoop.timingValue = value;
 if (!Browser.mainLoop.func) {
  return 1;
 }
 if (!Browser.mainLoop.running) {
  runtimeKeepalivePush();
  Browser.mainLoop.running = true;
 }
 if (mode == 0) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
   var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
   setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
  };
  Browser.mainLoop.method = "timeout";
 } else if (mode == 1) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
   Browser.requestAnimationFrame(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "rAF";
 } else if (mode == 2) {
  if (typeof Browser.setImmediate == "undefined") {
   if (typeof setImmediate == "undefined") {
    var setImmediates = [];
    var emscriptenMainLoopMessageId = "setimmediate";
    /** @param {Event} event */ var Browser_setImmediate_messageHandler = event => {
     if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
      event.stopPropagation();
      setImmediates.shift()();
     }
    };
    addEventListener("message", Browser_setImmediate_messageHandler, true);
    Browser.setImmediate = /** @type{function(function(): ?, ...?): number} */ (function Browser_emulated_setImmediate(func) {
     setImmediates.push(func);
     if (ENVIRONMENT_IS_WORKER) {
      if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
      Module["setImmediates"].push(func);
      postMessage({
       target: emscriptenMainLoopMessageId
      });
     } else postMessage(emscriptenMainLoopMessageId, "*");
    });
   } else {
    Browser.setImmediate = setImmediate;
   }
  }
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
   Browser.setImmediate(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "immediate";
 }
 return 0;
};

var _emscripten_get_now;

_emscripten_get_now = () => performance.timeOrigin + performance.now();

var runtimeKeepalivePop = () => {
 runtimeKeepaliveCounter -= 1;
};

/**
     * @param {number=} arg
     * @param {boolean=} noSetTiming
     */ var setMainLoop = (browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = browserIterationFunc;
 Browser.mainLoop.arg = arg;
 /** @type{number} */ var thisMainLoopId = (() => Browser.mainLoop.currentlyRunningMainloop)();
 function checkIsRunning() {
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
   runtimeKeepalivePop();
   return false;
  }
  return true;
 }
 Browser.mainLoop.running = false;
 Browser.mainLoop.runner = function Browser_mainLoop_runner() {
  if (ABORT) return;
  if (Browser.mainLoop.queue.length > 0) {
   var start = Date.now();
   var blocker = Browser.mainLoop.queue.shift();
   blocker.func(blocker.arg);
   if (Browser.mainLoop.remainingBlockers) {
    var remaining = Browser.mainLoop.remainingBlockers;
    var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
    if (blocker.counted) {
     Browser.mainLoop.remainingBlockers = next;
    } else {
     next = next + .5;
     Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
    }
   }
   Browser.mainLoop.updateStatus();
   if (!checkIsRunning()) return;
   setTimeout(Browser.mainLoop.runner, 0);
   return;
  }
  if (!checkIsRunning()) return;
  Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
  if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
   Browser.mainLoop.scheduler();
   return;
  } else if (Browser.mainLoop.timingMode == 0) {
   Browser.mainLoop.tickStartTime = _emscripten_get_now();
  }
  GL.newRenderingFrameStarted();
  Browser.mainLoop.runIter(browserIterationFunc);
  if (!checkIsRunning()) return;
  if (typeof SDL == "object") SDL.audio?.queueNewAudioData?.();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) {
   _emscripten_set_main_loop_timing(0, 1e3 / fps);
  } else {
   _emscripten_set_main_loop_timing(1, 1);
  }
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "unwind";
 }
};

/** @param {number=} timeout */ var safeSetTimeout = (func, timeout) => {
 runtimeKeepalivePush();
 return setTimeout(() => {
  runtimeKeepalivePop();
  callUserCallback(func);
 }, timeout);
};

var warnOnce = text => {
 warnOnce.shown ||= {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
  err(text);
 }
};

var Browser = {
 mainLoop: {
  running: false,
  scheduler: null,
  method: "",
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  pause() {
   Browser.mainLoop.scheduler = null;
   Browser.mainLoop.currentlyRunningMainloop++;
  },
  resume() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  },
  updateStatus() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  },
  runIter(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   callUserCallback(func);
   Module["postMainLoop"]?.();
  }
 },
 isFullscreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init() {
  if (Browser.initted) return;
  Browser.initted = true;
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = new Blob([ byteArray ], {
    type: Browser.getMimetype(name)
   });
   if (b.size !== byteArray.length) {
    b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
     type: Browser.getMimetype(name)
    });
   }
   var url = URL.createObjectURL(b);
   var img = new Image;
   img.onload = () => {
    assert(img.complete, `Image ${name} could not be decoded`);
    var canvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    preloadedImages[name] = canvas;
    URL.revokeObjectURL(url);
    onload?.(byteArray);
   };
   img.onerror = event => {
    err(`Image ${url} could not be decoded`);
    onerror?.();
   };
   img.src = url;
  };
  preloadPlugins.push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
   return !Module.noAudioDecoding && name.substr(-4) in {
    ".ogg": 1,
    ".wav": 1,
    ".mp3": 1
   };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
   var done = false;
   function finish(audio) {
    if (done) return;
    done = true;
    preloadedAudios[name] = audio;
    onload?.(byteArray);
   }
   function fail() {
    if (done) return;
    done = true;
    preloadedAudios[name] = new Audio;
    onerror?.();
   }
   var b = new Blob([ byteArray ], {
    type: Browser.getMimetype(name)
   });
   var url = URL.createObjectURL(b);
   var audio = new Audio;
   audio.addEventListener("canplaythrough", () => finish(audio), false);
   audio.onerror = function audio_onerror(event) {
    if (done) return;
    err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
    function encode64(data) {
     var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
     var PAD = "=";
     var ret = "";
     var leftchar = 0;
     var leftbits = 0;
     for (var i = 0; i < data.length; i++) {
      leftchar = (leftchar << 8) | data[i];
      leftbits += 8;
      while (leftbits >= 6) {
       var curr = (leftchar >> (leftbits - 6)) & 63;
       leftbits -= 6;
       ret += BASE[curr];
      }
     }
     if (leftbits == 2) {
      ret += BASE[(leftchar & 3) << 4];
      ret += PAD + PAD;
     } else if (leftbits == 4) {
      ret += BASE[(leftchar & 15) << 2];
      ret += PAD;
     }
     return ret;
    }
    audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
    finish(audio);
   };
   audio.src = url;
   safeSetTimeout(() => {
    finish(audio);
   },  1e4);
  };
  preloadPlugins.push(audioPlugin);
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
  }
  var canvas = Module["canvas"];
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (() => {});
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (() => {});
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", ev => {
     if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
      Module["canvas"].requestPointerLock();
      ev.preventDefault();
     }
    }, false);
   }
  }
 },
 createContext(/** @type {HTMLCanvasElement} */ canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
   var contextAttributes = {
    antialias: false,
    alpha: false,
    majorVersion: (typeof WebGL2RenderingContext != "undefined") ? 2 : 1
   };
   if (webGLContextAttributes) {
    for (var attribute in webGLContextAttributes) {
     contextAttributes[attribute] = webGLContextAttributes[attribute];
    }
   }
   if (typeof GL != "undefined") {
    contextHandle = GL.createContext(canvas, contextAttributes);
    if (contextHandle) {
     ctx = GL.getContext(contextHandle).GLctx;
    }
   }
  } else {
   ctx = canvas.getContext("2d");
  }
  if (!ctx) return null;
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GL.makeContextCurrent(contextHandle);
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
   Browser.init();
  }
  return ctx;
 },
 destroyContext(canvas, useWebGL, setInModule) {},
 fullscreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullscreen(lockPointer, resizeCanvas) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
  var canvas = Module["canvas"];
  function fullscreenChange() {
   Browser.isFullscreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.exitFullscreen = Browser.exitFullscreen;
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullscreen = true;
    if (Browser.resizeCanvas) {
     Browser.setFullscreenCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) {
     Browser.setWindowedCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   }
   Module["onFullScreen"]?.(Browser.isFullscreen);
   Module["onFullscreen"]?.(Browser.isFullscreen);
  }
  if (!Browser.fullscreenHandlersInstalled) {
   Browser.fullscreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullscreenChange, false);
   document.addEventListener("mozfullscreenchange", fullscreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
   document.addEventListener("MSFullscreenChange", fullscreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
  canvasContainer.requestFullscreen();
 },
 exitFullscreen() {
  if (!Browser.isFullscreen) {
   return false;
  }
  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (() => {});
  CFS.apply(document, []);
  return true;
 },
 nextRAF: 0,
 fakeRequestAnimationFrame(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 },
 requestAnimationFrame(func) {
  if (typeof requestAnimationFrame == "function") {
   requestAnimationFrame(func);
   return;
  }
  var RAF = Browser.fakeRequestAnimationFrame;
  RAF(func);
 },
 safeSetTimeout(func, timeout) {
  return safeSetTimeout(func, timeout);
 },
 safeRequestAnimationFrame(func) {
  runtimeKeepalivePush();
  return Browser.requestAnimationFrame(() => {
   runtimeKeepalivePop();
   callUserCallback(func);
  });
 },
 getMimetype(name) {
  return {
   "jpg": "image/jpeg",
   "jpeg": "image/jpeg",
   "png": "image/png",
   "bmp": "image/bmp",
   "ogg": "audio/ogg",
   "wav": "audio/wav",
   "mp3": "audio/mpeg"
  }[name.substr(name.lastIndexOf(".") + 1)];
 },
 getUserMedia(func) {
  window.getUserMedia ||= navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  window.getUserMedia(func);
 },
 getMovementX(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 },
 getMovementY(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 },
 getMouseWheelDelta(event) {
  var delta = 0;
  switch (event.type) {
  case "DOMMouseScroll":
   delta = event.detail / 3;
   break;

  case "mousewheel":
   delta = event.wheelDelta / 120;
   break;

  case "wheel":
   delta = event.deltaY;
   switch (event.deltaMode) {
   case 0:
    delta /= 100;
    break;

   case 1:
    delta /= 3;
    break;

   case 2:
    delta *= 80;
    break;

   default:
    throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
   }
   break;

  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
 },
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseCoords(pageX, pageY) {
  var rect = Module["canvas"].getBoundingClientRect();
  var cw = Module["canvas"].width;
  var ch = Module["canvas"].height;
  var scrollX = ((typeof window.scrollX != "undefined") ? window.scrollX : window.pageXOffset);
  var scrollY = ((typeof window.scrollY != "undefined") ? window.scrollY : window.pageYOffset);
  var adjustedX = pageX - (scrollX + rect.left);
  var adjustedY = pageY - (scrollY + rect.top);
  adjustedX = adjustedX * (cw / rect.width);
  adjustedY = adjustedY * (ch / rect.height);
  return {
   x: adjustedX,
   y: adjustedY
  };
 },
 setMouseCoords(pageX, pageY) {
  const {x: x, y: y} = Browser.calculateMouseCoords(pageX, pageY);
  Browser.mouseMovementX = x - Browser.mouseX;
  Browser.mouseMovementY = y - Browser.mouseY;
  Browser.mouseX = x;
  Browser.mouseY = y;
 },
 calculateMouseEvent(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && ("mozMovementX" in event)) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     last ||= coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   Browser.setMouseCoords(event.pageX, event.pageY);
  }
 },
 resizeListeners: [],
 updateResizeListeners() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach(listener => listener(canvas.width, canvas.height));
 },
 setCanvasSize(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 },
 windowedWidth: 0,
 windowedHeight: 0,
 setFullscreenCanvasSize() {
  if (typeof SDL != "undefined") {
   var flags = GROWABLE_HEAP_U32()[((SDL.screen) >> 2)];
   flags = flags | 8388608;
   GROWABLE_HEAP_I32()[((SDL.screen) >> 2)] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 setWindowedCanvasSize() {
  if (typeof SDL != "undefined") {
   var flags = GROWABLE_HEAP_U32()[((SDL.screen) >> 2)];
   flags = flags & ~8388608;
   GROWABLE_HEAP_I32()[((SDL.screen) >> 2)] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 updateCanvasDimensions(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if (((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode) && (typeof screen != "undefined")) {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 }
};

var _emscripten_cancel_main_loop = () => {
 Browser.mainLoop.pause();
 Browser.mainLoop.func = null;
};

var _emscripten_check_blocking_allowed = () => {};

var _emscripten_date_now = () => Date.now();

var _emscripten_exit_with_live_runtime = () => {
 runtimeKeepalivePush();
 throw "unwind";
};

var JSEvents = {
 inEventHandler: 0,
 removeAllEventListeners() {
  for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
   JSEvents._removeHandler(i);
  }
  JSEvents.eventHandlers = [];
  JSEvents.deferredCalls = [];
 },
 registerRemoveEventListeners() {
  if (!JSEvents.removeEventListenersRegistered) {
   __ATEXIT__.push(JSEvents.removeAllEventListeners);
   JSEvents.removeEventListenersRegistered = true;
  }
 },
 deferredCalls: [],
 deferCall(targetFunction, precedence, argsList) {
  function arraysHaveEqualContent(arrA, arrB) {
   if (arrA.length != arrB.length) return false;
   for (var i in arrA) {
    if (arrA[i] != arrB[i]) return false;
   }
   return true;
  }
  for (var i in JSEvents.deferredCalls) {
   var call = JSEvents.deferredCalls[i];
   if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
    return;
   }
  }
  JSEvents.deferredCalls.push({
   targetFunction: targetFunction,
   precedence: precedence,
   argsList: argsList
  });
  JSEvents.deferredCalls.sort((x, y) => x.precedence < y.precedence);
 },
 removeDeferredCalls(targetFunction) {
  for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
   if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
    JSEvents.deferredCalls.splice(i, 1);
    --i;
   }
  }
 },
 canPerformEventHandlerRequests() {
  if (navigator.userActivation) {
   return navigator.userActivation.isActive;
  }
  return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
 },
 runDeferredCalls() {
  if (!JSEvents.canPerformEventHandlerRequests()) {
   return;
  }
  for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
   var call = JSEvents.deferredCalls[i];
   JSEvents.deferredCalls.splice(i, 1);
   --i;
   call.targetFunction.apply(null, call.argsList);
  }
 },
 eventHandlers: [],
 removeAllHandlersOnTarget: (target, eventTypeString) => {
  for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
   if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
    JSEvents._removeHandler(i--);
   }
  }
 },
 _removeHandler(i) {
  var h = JSEvents.eventHandlers[i];
  h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
  JSEvents.eventHandlers.splice(i, 1);
 },
 registerOrRemoveHandler(eventHandler) {
  if (!eventHandler.target) {
   return -4;
  }
  var jsEventHandler = function jsEventHandler(event) {
   ++JSEvents.inEventHandler;
   JSEvents.currentEventHandler = eventHandler;
   JSEvents.runDeferredCalls();
   eventHandler.handlerFunc(event);
   JSEvents.runDeferredCalls();
   --JSEvents.inEventHandler;
  };
  if (eventHandler.callbackfunc) {
   eventHandler.eventListenerFunc = jsEventHandler;
   eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
   JSEvents.eventHandlers.push(eventHandler);
   JSEvents.registerRemoveEventListeners();
  } else {
   for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
    if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
     JSEvents._removeHandler(i--);
    }
   }
  }
  return 0;
 },
 getTargetThreadForEventCallback(targetThread) {
  switch (targetThread) {
  case 1:
   return 0;

  case 2:
   return PThread.currentProxiedOperationCallerThread;

  default:
   return targetThread;
  }
 },
 getNodeNameForTarget(target) {
  if (!target) return "";
  if (target == window) return "#window";
  if (target == screen) return "#screen";
  return target?.nodeName || "";
 },
 fullscreenEnabled() {
  return document.fullscreenEnabled ||  document.webkitFullscreenEnabled;
 }
};

var maybeCStringToJsString = cString => cString > 2 ? UTF8ToString(cString) : cString;

var specialHTMLTargets = [ 0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0 ];

var findEventTarget = target => {
 target = maybeCStringToJsString(target);
 var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : undefined);
 return domElement;
};

var getBoundingClientRect = e => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
 "left": 0,
 "top": 0
};

function _emscripten_get_element_css_size(target, width, height) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(33, 1, target, width, height);
 target = findEventTarget(target);
 if (!target) return -4;
 var rect = getBoundingClientRect(target);
 GROWABLE_HEAP_F64()[((width) >> 3)] = rect.width;
 GROWABLE_HEAP_F64()[((height) >> 3)] = rect.height;
 return 0;
}

var getHeapMax = () =>  2147483648;

var _emscripten_get_heap_max = () => getHeapMax();

var _emscripten_num_logical_cores = () => ENVIRONMENT_IS_NODE ? require("os").cpus().length : navigator["hardwareConcurrency"];

var growMemory = size => {
 var b = wasmMemory.buffer;
 var pages = (size - b.byteLength + 65535) / 65536;
 try {
  wasmMemory.grow(pages);
  updateMemoryViews();
  return 1;
 } /*success*/ catch (e) {}
};

var _emscripten_resize_heap = requestedSize => {
 var oldSize = GROWABLE_HEAP_U8().length;
 requestedSize >>>= 0;
 if (requestedSize <= oldSize) {
  return false;
 }
 var maxHeapSize = getHeapMax();
 if (requestedSize > maxHeapSize) {
  return false;
 }
 var alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
 for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
  var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
  overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
  var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
  var replacement = growMemory(newSize);
  if (replacement) {
   return true;
  }
 }
 return false;
};

var registerBeforeUnloadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) => {
 var beforeUnloadEventHandlerFunc = (e = event) => {
  var confirmationMessage = getWasmTableEntry(callbackfunc)(eventTypeId, 0, userData);
  if (confirmationMessage) {
   confirmationMessage = UTF8ToString(confirmationMessage);
  }
  if (confirmationMessage) {
   e.preventDefault();
   e.returnValue = confirmationMessage;
   return confirmationMessage;
  }
 };
 var eventHandler = {
  target: findEventTarget(target),
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: beforeUnloadEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_beforeunload_callback_on_thread(userData, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(34, 1, userData, callbackfunc, targetThread);
 if (typeof onbeforeunload == "undefined") return -1;
 if (targetThread !== 1) return -5;
 return registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, "beforeunload");
}

var fillFullscreenChangeEventData = eventStruct => {
 var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
 var isFullscreen = !!fullscreenElement;
 /** @suppress{checkTypes} */ GROWABLE_HEAP_I32()[((eventStruct) >> 2)] = isFullscreen;
 GROWABLE_HEAP_I32()[(((eventStruct) + (4)) >> 2)] = JSEvents.fullscreenEnabled();
 var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
 var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
 var id = reportedElement?.id || "";
 stringToUTF8(nodeName, eventStruct + 8, 128);
 stringToUTF8(id, eventStruct + 136, 128);
 GROWABLE_HEAP_I32()[(((eventStruct) + (264)) >> 2)] = reportedElement ? reportedElement.clientWidth : 0;
 GROWABLE_HEAP_I32()[(((eventStruct) + (268)) >> 2)] = reportedElement ? reportedElement.clientHeight : 0;
 GROWABLE_HEAP_I32()[(((eventStruct) + (272)) >> 2)] = screen.width;
 GROWABLE_HEAP_I32()[(((eventStruct) + (276)) >> 2)] = screen.height;
 if (isFullscreen) {
  JSEvents.previousFullscreenElement = fullscreenElement;
 }
};

var registerFullscreenChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.fullscreenChangeEvent) JSEvents.fullscreenChangeEvent = _malloc(280);
 var fullscreenChangeEventhandlerFunc = (e = event) => {
  var fullscreenChangeEvent = targetThread ? _malloc(280) : JSEvents.fullscreenChangeEvent;
  fillFullscreenChangeEventData(fullscreenChangeEvent);
  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, fullscreenChangeEvent, userData); else if (getWasmTableEntry(callbackfunc)(eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: fullscreenChangeEventhandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(35, 1, target, userData, useCapture, callbackfunc, targetThread);
 if (!JSEvents.fullscreenEnabled()) return -1;
 target = findEventTarget(target);
 if (!target) return -4;
 registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
 return registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
}

var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
 var browserIterationFunc = getWasmTableEntry(func);
 setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop);
};

var _emscripten_set_main_loop_arg = (func, arg, fps, simulateInfiniteLoop) => {
 var browserIterationFunc = () => getWasmTableEntry(func)(arg);
 setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg);
};

var registerUiEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.uiEvent) JSEvents.uiEvent = _malloc(36);
 target = findEventTarget(target);
 var uiEventHandlerFunc = (e = event) => {
  if (e.target != target) {
   return;
  }
  var b = document.body;
  if (!b) {
   return;
  }
  var uiEvent = targetThread ? _malloc(36) : JSEvents.uiEvent;
  GROWABLE_HEAP_I32()[((uiEvent) >> 2)] = e.detail;
  GROWABLE_HEAP_I32()[(((uiEvent) + (4)) >> 2)] = b.clientWidth;
  GROWABLE_HEAP_I32()[(((uiEvent) + (8)) >> 2)] = b.clientHeight;
  GROWABLE_HEAP_I32()[(((uiEvent) + (12)) >> 2)] = innerWidth;
  GROWABLE_HEAP_I32()[(((uiEvent) + (16)) >> 2)] = innerHeight;
  GROWABLE_HEAP_I32()[(((uiEvent) + (20)) >> 2)] = outerWidth;
  GROWABLE_HEAP_I32()[(((uiEvent) + (24)) >> 2)] = outerHeight;
  GROWABLE_HEAP_I32()[(((uiEvent) + (28)) >> 2)] = pageXOffset;
  GROWABLE_HEAP_I32()[(((uiEvent) + (32)) >> 2)] = pageYOffset;
  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, uiEvent, userData); else if (getWasmTableEntry(callbackfunc)(eventTypeId, uiEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: uiEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(36, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread);
}

var fillMouseEventData = (eventStruct, e, target) => {
 GROWABLE_HEAP_F64()[((eventStruct) >> 3)] = e.timeStamp;
 var idx = ((eventStruct) >> 2);
 GROWABLE_HEAP_I32()[idx + 2] = e.screenX;
 GROWABLE_HEAP_I32()[idx + 3] = e.screenY;
 GROWABLE_HEAP_I32()[idx + 4] = e.clientX;
 GROWABLE_HEAP_I32()[idx + 5] = e.clientY;
 GROWABLE_HEAP_I32()[idx + 6] = e.ctrlKey;
 GROWABLE_HEAP_I32()[idx + 7] = e.shiftKey;
 GROWABLE_HEAP_I32()[idx + 8] = e.altKey;
 GROWABLE_HEAP_I32()[idx + 9] = e.metaKey;
 GROWABLE_HEAP_I16()[idx * 2 + 20] = e.button;
 GROWABLE_HEAP_I16()[idx * 2 + 21] = e.buttons;
 GROWABLE_HEAP_I32()[idx + 11] = e["movementX"];
 GROWABLE_HEAP_I32()[idx + 12] = e["movementY"];
 var rect = getBoundingClientRect(target);
 GROWABLE_HEAP_I32()[idx + 13] = e.clientX - rect.left;
 GROWABLE_HEAP_I32()[idx + 14] = e.clientY - rect.top;
};

var registerWheelEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc(104);
 var wheelHandlerFunc = (e = event) => {
  var wheelEvent = targetThread ? _malloc(104) : JSEvents.wheelEvent;
  fillMouseEventData(wheelEvent, e, target);
  GROWABLE_HEAP_F64()[(((wheelEvent) + (72)) >> 3)] = e["deltaX"];
  GROWABLE_HEAP_F64()[(((wheelEvent) + (80)) >> 3)] = e["deltaY"];
  GROWABLE_HEAP_F64()[(((wheelEvent) + (88)) >> 3)] = e["deltaZ"];
  GROWABLE_HEAP_I32()[(((wheelEvent) + (96)) >> 2)] = e["deltaMode"];
  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, wheelEvent, userData); else if (getWasmTableEntry(callbackfunc)(eventTypeId, wheelEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  allowsDeferredCalls: true,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: wheelHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(37, 1, target, userData, useCapture, callbackfunc, targetThread);
 target = findEventTarget(target);
 if (!target) return -4;
 if (typeof target.onwheel != "undefined") {
  return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
 } else {
  return -1;
 }
}

function handleAllocatorInit() {
 Object.assign(HandleAllocator.prototype, /** @lends {HandleAllocator.prototype} */ {
  get(id) {
   return this.allocated[id];
  },
  has(id) {
   return this.allocated[id] !== undefined;
  },
  allocate(handle) {
   var id = this.freelist.pop() || this.allocated.length;
   this.allocated[id] = handle;
   return id;
  },
  free(id) {
   this.allocated[id] = undefined;
   this.freelist.push(id);
  }
 });
}

/** @constructor */ function HandleAllocator() {
 this.allocated = [ undefined ];
 this.freelist = [];
}

var Fetch = {
 openDatabase(dbname, dbversion, onsuccess, onerror) {
  try {
   var openRequest = indexedDB.open(dbname, dbversion);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = event => {
   var db = /** @type {IDBDatabase} */ (event.target.result);
   if (db.objectStoreNames.contains("FILES")) {
    db.deleteObjectStore("FILES");
   }
   db.createObjectStore("FILES");
  };
  openRequest.onsuccess = event => onsuccess(event.target.result);
  openRequest.onerror = onerror;
 },
 init() {
  Fetch.xhrs = new HandleAllocator;
  if (ENVIRONMENT_IS_PTHREAD) return;
  var onsuccess = db => {
   Fetch.dbInstance = db;
   removeRunDependency("library_fetch_init");
  };
  var onerror = () => {
   Fetch.dbInstance = false;
   removeRunDependency("library_fetch_init");
  };
  addRunDependency("library_fetch_init");
  Fetch.openDatabase("emscripten_filesystem", 1, onsuccess, onerror);
 }
};

function fetchXHR(fetch, onsuccess, onerror, onprogress, onreadystatechange) {
 var url = GROWABLE_HEAP_U32()[(((fetch) + (8)) >> 2)];
 if (!url) {
  onerror(fetch, 0, "no url specified!");
  return;
 }
 var url_ = UTF8ToString(url);
 var fetch_attr = fetch + 112;
 var requestMethod = UTF8ToString(fetch_attr + 0);
 requestMethod ||= "GET";
 var timeoutMsecs = GROWABLE_HEAP_U32()[(((fetch_attr) + (56)) >> 2)];
 var userName = GROWABLE_HEAP_U32()[(((fetch_attr) + (68)) >> 2)];
 var password = GROWABLE_HEAP_U32()[(((fetch_attr) + (72)) >> 2)];
 var requestHeaders = GROWABLE_HEAP_U32()[(((fetch_attr) + (76)) >> 2)];
 var overriddenMimeType = GROWABLE_HEAP_U32()[(((fetch_attr) + (80)) >> 2)];
 var dataPtr = GROWABLE_HEAP_U32()[(((fetch_attr) + (84)) >> 2)];
 var dataLength = GROWABLE_HEAP_U32()[(((fetch_attr) + (88)) >> 2)];
 var fetchAttributes = GROWABLE_HEAP_U32()[(((fetch_attr) + (52)) >> 2)];
 var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
 var fetchAttrStreamData = !!(fetchAttributes & 2);
 var fetchAttrSynchronous = !!(fetchAttributes & 64);
 var userNameStr = userName ? UTF8ToString(userName) : undefined;
 var passwordStr = password ? UTF8ToString(password) : undefined;
 var xhr = new XMLHttpRequest;
 xhr.withCredentials = !!GROWABLE_HEAP_U8()[(((fetch_attr) + (60)) >> 0)];
 xhr.open(requestMethod, url_, !fetchAttrSynchronous, userNameStr, passwordStr);
 if (!fetchAttrSynchronous) xhr.timeout = timeoutMsecs;
 xhr.url_ = url_;
 xhr.responseType = "arraybuffer";
 if (overriddenMimeType) {
  var overriddenMimeTypeStr = UTF8ToString(overriddenMimeType);
  xhr.overrideMimeType(overriddenMimeTypeStr);
 }
 if (requestHeaders) {
  for (;;) {
   var key = GROWABLE_HEAP_U32()[((requestHeaders) >> 2)];
   if (!key) break;
   var value = GROWABLE_HEAP_U32()[(((requestHeaders) + (4)) >> 2)];
   if (!value) break;
   requestHeaders += 8;
   var keyStr = UTF8ToString(key);
   var valueStr = UTF8ToString(value);
   xhr.setRequestHeader(keyStr, valueStr);
  }
 }
 var id = Fetch.xhrs.allocate(xhr);
 GROWABLE_HEAP_U32()[((fetch) >> 2)] = id;
 var data = (dataPtr && dataLength) ? GROWABLE_HEAP_U8().slice(dataPtr, dataPtr + dataLength) : null;
 function saveResponseAndStatus() {
  var ptr = 0;
  var ptrLen = 0;
  if (xhr.response && fetchAttrLoadToMemory && GROWABLE_HEAP_U32()[fetch + 12 >> 2] === 0) {
   ptrLen = xhr.response.byteLength;
  }
  if (ptrLen > 0) {
   ptr = _malloc(ptrLen);
   GROWABLE_HEAP_U8().set(new Uint8Array(/** @type{Array<number>} */ (xhr.response)), ptr);
  }
  GROWABLE_HEAP_U32()[fetch + 12 >> 2] = ptr;
  writeI53ToI64(fetch + 16, ptrLen);
  writeI53ToI64(fetch + 24, 0);
  var len = xhr.response ? xhr.response.byteLength : 0;
  if (len) {
   writeI53ToI64(fetch + 32, len);
  }
  GROWABLE_HEAP_U16()[fetch + 40 >> 1] = xhr.readyState;
  GROWABLE_HEAP_U16()[fetch + 42 >> 1] = xhr.status;
  if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
 }
 xhr.onload = e => {
  if (!Fetch.xhrs.has(id)) {
   return;
  }
  saveResponseAndStatus();
  if (xhr.status >= 200 && xhr.status < 300) {
   onsuccess?.(fetch, xhr, e);
  } else {
   onerror?.(fetch, xhr, e);
  }
 };
 xhr.onerror = e => {
  if (!Fetch.xhrs.has(id)) {
   return;
  }
  saveResponseAndStatus();
  onerror?.(fetch, xhr, e);
 };
 xhr.ontimeout = e => {
  if (!Fetch.xhrs.has(id)) {
   return;
  }
  onerror?.(fetch, xhr, e);
 };
 xhr.onprogress = e => {
  if (!Fetch.xhrs.has(id)) {
   return;
  }
  var ptrLen = (fetchAttrLoadToMemory && fetchAttrStreamData && xhr.response) ? xhr.response.byteLength : 0;
  var ptr = 0;
  if (ptrLen > 0 && fetchAttrLoadToMemory && fetchAttrStreamData) {
   ptr = _malloc(ptrLen);
   GROWABLE_HEAP_U8().set(new Uint8Array(/** @type{Array<number>} */ (xhr.response)), ptr);
  }
  GROWABLE_HEAP_U32()[fetch + 12 >> 2] = ptr;
  writeI53ToI64(fetch + 16, ptrLen);
  writeI53ToI64(fetch + 24, e.loaded - ptrLen);
  writeI53ToI64(fetch + 32, e.total);
  GROWABLE_HEAP_U16()[fetch + 40 >> 1] = xhr.readyState;
  if (xhr.readyState >= 3 && xhr.status === 0 && e.loaded > 0) xhr.status = 200;
  GROWABLE_HEAP_U16()[fetch + 42 >> 1] = xhr.status;
  if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
  onprogress?.(fetch, xhr, e);
  if (ptr) {
   _free(ptr);
  }
 };
 xhr.onreadystatechange = e => {
  if (!Fetch.xhrs.has(id)) {
   runtimeKeepalivePop();
   return;
  }
  GROWABLE_HEAP_U16()[fetch + 40 >> 1] = xhr.readyState;
  if (xhr.readyState >= 2) {
   GROWABLE_HEAP_U16()[fetch + 42 >> 1] = xhr.status;
  }
  onreadystatechange?.(fetch, xhr, e);
 };
 try {
  xhr.send(data);
 } catch (e) {
  onerror?.(fetch, xhr, e);
 }
}

var writeI53ToI64 = (ptr, num) => {
 GROWABLE_HEAP_U32()[((ptr) >> 2)] = num;
 var lower = GROWABLE_HEAP_U32()[((ptr) >> 2)];
 GROWABLE_HEAP_U32()[(((ptr) + (4)) >> 2)] = (num - lower) / 4294967296;
};

function fetchCacheData(/** @type {IDBDatabase} */ db, fetch, data, onsuccess, onerror) {
 if (!db) {
  onerror(fetch, 0, "IndexedDB not available!");
  return;
 }
 var fetch_attr = fetch + 112;
 var destinationPath = GROWABLE_HEAP_U32()[fetch_attr + 64 >> 2];
 destinationPath ||= GROWABLE_HEAP_U32()[fetch + 8 >> 2];
 var destinationPathStr = UTF8ToString(destinationPath);
 try {
  var transaction = db.transaction([ "FILES" ], "readwrite");
  var packages = transaction.objectStore("FILES");
  var putRequest = packages.put(data, destinationPathStr);
  putRequest.onsuccess = event => {
   GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
   GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 200;
   stringToUTF8("OK", fetch + 44, 64);
   onsuccess(fetch, 0, destinationPathStr);
  };
  putRequest.onerror = error => {
   GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
   GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 413;
   stringToUTF8("Payload Too Large", fetch + 44, 64);
   onerror(fetch, 0, error);
  };
 } catch (e) {
  onerror(fetch, 0, e);
 }
}

function fetchLoadCachedData(db, fetch, onsuccess, onerror) {
 if (!db) {
  onerror(fetch, 0, "IndexedDB not available!");
  return;
 }
 var fetch_attr = fetch + 112;
 var path = GROWABLE_HEAP_U32()[fetch_attr + 64 >> 2];
 path ||= GROWABLE_HEAP_U32()[fetch + 8 >> 2];
 var pathStr = UTF8ToString(path);
 try {
  var transaction = db.transaction([ "FILES" ], "readonly");
  var packages = transaction.objectStore("FILES");
  var getRequest = packages.get(pathStr);
  getRequest.onsuccess = event => {
   if (event.target.result) {
    var value = event.target.result;
    var len = value.byteLength || value.length;
    var ptr = _malloc(len);
    GROWABLE_HEAP_U8().set(new Uint8Array(value), ptr);
    GROWABLE_HEAP_U32()[fetch + 12 >> 2] = ptr;
    writeI53ToI64(fetch + 16, len);
    writeI53ToI64(fetch + 24, 0);
    writeI53ToI64(fetch + 32, len);
    GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
    GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 200;
    stringToUTF8("OK", fetch + 44, 64);
    onsuccess(fetch, 0, value);
   } else {
    GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
    GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 404;
    stringToUTF8("Not Found", fetch + 44, 64);
    onerror(fetch, 0, "no data");
   }
  };
  getRequest.onerror = error => {
   GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
   GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 404;
   stringToUTF8("Not Found", fetch + 44, 64);
   onerror(fetch, 0, error);
  };
 } catch (e) {
  onerror(fetch, 0, e);
 }
}

function fetchDeleteCachedData(db, fetch, onsuccess, onerror) {
 if (!db) {
  onerror(fetch, 0, "IndexedDB not available!");
  return;
 }
 var fetch_attr = fetch + 112;
 var path = GROWABLE_HEAP_U32()[fetch_attr + 64 >> 2];
 path ||= GROWABLE_HEAP_U32()[fetch + 8 >> 2];
 var pathStr = UTF8ToString(path);
 try {
  var transaction = db.transaction([ "FILES" ], "readwrite");
  var packages = transaction.objectStore("FILES");
  var request = packages.delete(pathStr);
  request.onsuccess = event => {
   var value = event.target.result;
   GROWABLE_HEAP_U32()[fetch + 12 >> 2] = 0;
   writeI53ToI64(fetch + 16, 0);
   writeI53ToI64(fetch + 24, 0);
   writeI53ToI64(fetch + 32, 0);
   GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
   GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 200;
   stringToUTF8("OK", fetch + 44, 64);
   onsuccess(fetch, 0, value);
  };
  request.onerror = error => {
   GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
   GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 404;
   stringToUTF8("Not Found", fetch + 44, 64);
   onerror(fetch, 0, error);
  };
 } catch (e) {
  onerror(fetch, 0, e);
 }
}

function _emscripten_start_fetch(fetch, successcb, errorcb, progresscb, readystatechangecb) {
 runtimeKeepalivePush();
 var fetch_attr = fetch + 112;
 var onsuccess = GROWABLE_HEAP_U32()[fetch_attr + 36 >> 2];
 var onerror = GROWABLE_HEAP_U32()[fetch_attr + 40 >> 2];
 var onprogress = GROWABLE_HEAP_U32()[fetch_attr + 44 >> 2];
 var onreadystatechange = GROWABLE_HEAP_U32()[fetch_attr + 48 >> 2];
 var fetchAttributes = GROWABLE_HEAP_U32()[fetch_attr + 52 >> 2];
 var fetchAttrSynchronous = !!(fetchAttributes & 64);
 function doCallback(f) {
  if (fetchAttrSynchronous) {
   f();
  } else {
   callUserCallback(f);
  }
 }
 var reportSuccess = (fetch, xhr, e) => {
  runtimeKeepalivePop();
  doCallback(() => {
   if (onsuccess) getWasmTableEntry(onsuccess)(fetch); else successcb?.(fetch);
  });
 };
 var reportProgress = (fetch, xhr, e) => {
  doCallback(() => {
   if (onprogress) getWasmTableEntry(onprogress)(fetch); else progresscb?.(fetch);
  });
 };
 var reportError = (fetch, xhr, e) => {
  runtimeKeepalivePop();
  doCallback(() => {
   if (onerror) getWasmTableEntry(onerror)(fetch); else errorcb?.(fetch);
  });
 };
 var reportReadyStateChange = (fetch, xhr, e) => {
  doCallback(() => {
   if (onreadystatechange) getWasmTableEntry(onreadystatechange)(fetch); else readystatechangecb?.(fetch);
  });
 };
 var performUncachedXhr = (fetch, xhr, e) => {
  fetchXHR(fetch, reportSuccess, reportError, reportProgress, reportReadyStateChange);
 };
 var cacheResultAndReportSuccess = (fetch, xhr, e) => {
  var storeSuccess = (fetch, xhr, e) => {
   runtimeKeepalivePop();
   doCallback(() => {
    if (onsuccess) getWasmTableEntry(onsuccess)(fetch); else successcb?.(fetch);
   });
  };
  var storeError = (fetch, xhr, e) => {
   runtimeKeepalivePop();
   doCallback(() => {
    if (onsuccess) getWasmTableEntry(onsuccess)(fetch); else successcb?.(fetch);
   });
  };
  fetchCacheData(Fetch.dbInstance, fetch, xhr.response, storeSuccess, storeError);
 };
 var performCachedXhr = (fetch, xhr, e) => {
  fetchXHR(fetch, cacheResultAndReportSuccess, reportError, reportProgress, reportReadyStateChange);
 };
 var requestMethod = UTF8ToString(fetch_attr + 0);
 var fetchAttrReplace = !!(fetchAttributes & 16);
 var fetchAttrPersistFile = !!(fetchAttributes & 4);
 var fetchAttrNoDownload = !!(fetchAttributes & 32);
 if (requestMethod === "EM_IDB_STORE") {
  var ptr = GROWABLE_HEAP_U32()[(((fetch_attr) + (84)) >> 2)];
  var size = GROWABLE_HEAP_U32()[(((fetch_attr) + (88)) >> 2)];
  fetchCacheData(Fetch.dbInstance, fetch, GROWABLE_HEAP_U8().slice(ptr, ptr + size), reportSuccess, reportError);
 } else if (requestMethod === "EM_IDB_DELETE") {
  fetchDeleteCachedData(Fetch.dbInstance, fetch, reportSuccess, reportError);
 } else if (!fetchAttrReplace) {
  fetchLoadCachedData(Fetch.dbInstance, fetch, reportSuccess, fetchAttrNoDownload ? reportError : (fetchAttrPersistFile ? performCachedXhr : performUncachedXhr));
 } else if (!fetchAttrNoDownload) {
  fetchXHR(fetch, fetchAttrPersistFile ? cacheResultAndReportSuccess : reportSuccess, reportError, reportProgress, reportReadyStateChange);
 } else {
  return 0;
 }
 return fetch;
}

var ENV = {};

var getExecutableName = () => thisProgram || "./this.program";

var getEnvStrings = () => {
 if (!getEnvStrings.strings) {
  var lang = ((typeof navigator == "object" && navigator.languages && navigator.languages[0]) || "C").replace("-", "_") + ".UTF-8";
  var env = {
   "USER": "web_user",
   "LOGNAME": "web_user",
   "PATH": "/",
   "PWD": "/",
   "HOME": "/home/web_user",
   "LANG": lang,
   "_": getExecutableName()
  };
  for (var x in ENV) {
   if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x];
  }
  var strings = [];
  for (var x in env) {
   strings.push(`${x}=${env[x]}`);
  }
  getEnvStrings.strings = strings;
 }
 return getEnvStrings.strings;
};

var stringToAscii = (str, buffer) => {
 for (var i = 0; i < str.length; ++i) {
  GROWABLE_HEAP_I8()[((buffer++) >> 0)] = str.charCodeAt(i);
 }
 GROWABLE_HEAP_I8()[((buffer) >> 0)] = 0;
};

var _environ_get = function(__environ, environ_buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(38, 1, __environ, environ_buf);
 var bufSize = 0;
 getEnvStrings().forEach((string, i) => {
  var ptr = environ_buf + bufSize;
  GROWABLE_HEAP_U32()[(((__environ) + (i * 4)) >> 2)] = ptr;
  stringToAscii(string, ptr);
  bufSize += string.length + 1;
 });
 return 0;
};

var _environ_sizes_get = function(penviron_count, penviron_buf_size) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(39, 1, penviron_count, penviron_buf_size);
 var strings = getEnvStrings();
 GROWABLE_HEAP_U32()[((penviron_count) >> 2)] = strings.length;
 var bufSize = 0;
 strings.forEach(string => bufSize += string.length + 1);
 GROWABLE_HEAP_U32()[((penviron_buf_size) >> 2)] = bufSize;
 return 0;
};

function _fd_close(fd) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(40, 1, fd);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function _fd_fdstat_get(fd, pbuf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(41, 1, fd, pbuf);
 try {
  var rightsBase = 0;
  var rightsInheriting = 0;
  var flags = 0;
  {
   var stream = SYSCALLS.getStreamFromFD(fd);
   var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
  }
  GROWABLE_HEAP_I8()[((pbuf) >> 0)] = type;
  GROWABLE_HEAP_I16()[(((pbuf) + (2)) >> 1)] = flags;
  HEAP64[(((pbuf) + (8)) >> 3)] = BigInt(rightsBase);
  HEAP64[(((pbuf) + (16)) >> 3)] = BigInt(rightsInheriting);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

/** @param {number=} offset */ var doReadv = (stream, iov, iovcnt, offset) => {
 var ret = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = GROWABLE_HEAP_U32()[((iov) >> 2)];
  var len = GROWABLE_HEAP_U32()[(((iov) + (4)) >> 2)];
  iov += 8;
  var curr = FS.read(stream, GROWABLE_HEAP_I8(), ptr, len, offset);
  if (curr < 0) return -1;
  ret += curr;
  if (curr < len) break;
  if (typeof offset !== "undefined") {
   offset += curr;
  }
 }
 return ret;
};

function _fd_pread(fd, iov, iovcnt, offset, pnum) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(42, 1, fd, iov, iovcnt, offset, pnum);
 offset = bigintToI53Checked(offset);
 try {
  if (isNaN(offset)) return 61;
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = doReadv(stream, iov, iovcnt, offset);
  GROWABLE_HEAP_U32()[((pnum) >> 2)] = num;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

/** @param {number=} offset */ var doWritev = (stream, iov, iovcnt, offset) => {
 var ret = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = GROWABLE_HEAP_U32()[((iov) >> 2)];
  var len = GROWABLE_HEAP_U32()[(((iov) + (4)) >> 2)];
  iov += 8;
  var curr = FS.write(stream, GROWABLE_HEAP_I8(), ptr, len, offset);
  if (curr < 0) return -1;
  ret += curr;
  if (typeof offset !== "undefined") {
   offset += curr;
  }
 }
 return ret;
};

function _fd_pwrite(fd, iov, iovcnt, offset, pnum) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(43, 1, fd, iov, iovcnt, offset, pnum);
 offset = bigintToI53Checked(offset);
 try {
  if (isNaN(offset)) return 61;
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = doWritev(stream, iov, iovcnt, offset);
  GROWABLE_HEAP_U32()[((pnum) >> 2)] = num;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function _fd_read(fd, iov, iovcnt, pnum) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(44, 1, fd, iov, iovcnt, pnum);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = doReadv(stream, iov, iovcnt);
  GROWABLE_HEAP_U32()[((pnum) >> 2)] = num;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function _fd_seek(fd, offset, whence, newOffset) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(45, 1, fd, offset, whence, newOffset);
 offset = bigintToI53Checked(offset);
 try {
  if (isNaN(offset)) return 61;
  var stream = SYSCALLS.getStreamFromFD(fd);
  FS.llseek(stream, offset, whence);
  HEAP64[((newOffset) >> 3)] = BigInt(stream.position);
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function _fd_write(fd, iov, iovcnt, pnum) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(46, 1, fd, iov, iovcnt, pnum);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = doWritev(stream, iov, iovcnt);
  GROWABLE_HEAP_U32()[((pnum) >> 2)] = num;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

var _getentropy = (buffer, size) => {
 randomFill(GROWABLE_HEAP_U8().subarray(buffer, buffer + size));
 return 0;
};

var webgl_enable_ANGLE_instanced_arrays = ctx => {
 var ext = ctx.getExtension("ANGLE_instanced_arrays");
 if (ext) {
  ctx["vertexAttribDivisor"] = (index, divisor) => ext["vertexAttribDivisorANGLE"](index, divisor);
  ctx["drawArraysInstanced"] = (mode, first, count, primcount) => ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
  ctx["drawElementsInstanced"] = (mode, count, type, indices, primcount) => ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
  return 1;
 }
};

var webgl_enable_OES_vertex_array_object = ctx => {
 var ext = ctx.getExtension("OES_vertex_array_object");
 if (ext) {
  ctx["createVertexArray"] = () => ext["createVertexArrayOES"]();
  ctx["deleteVertexArray"] = vao => ext["deleteVertexArrayOES"](vao);
  ctx["bindVertexArray"] = vao => ext["bindVertexArrayOES"](vao);
  ctx["isVertexArray"] = vao => ext["isVertexArrayOES"](vao);
  return 1;
 }
};

var webgl_enable_WEBGL_draw_buffers = ctx => {
 var ext = ctx.getExtension("WEBGL_draw_buffers");
 if (ext) {
  ctx["drawBuffers"] = (n, bufs) => ext["drawBuffersWEBGL"](n, bufs);
  return 1;
 }
};

var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = ctx =>  !!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"));

var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = ctx => !!(ctx.mdibvbi = ctx.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance"));

var webgl_enable_WEBGL_multi_draw = ctx => !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));

var GL = {
 counter: 1,
 buffers: [],
 programs: [],
 framebuffers: [],
 renderbuffers: [],
 textures: [],
 shaders: [],
 vaos: [],
 contexts: {},
 offscreenCanvases: {},
 queries: [],
 samplers: [],
 transformFeedbacks: [],
 syncs: [],
 byteSizeByTypeRoot: 5120,
 byteSizeByType: [ 1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8 ],
 stringCache: {},
 stringiCache: {},
 unpackAlignment: 4,
 recordError: function recordError(errorCode) {
  if (!GL.lastError) {
   GL.lastError = errorCode;
  }
 },
 getNewId: table => {
  var ret = GL.counter++;
  for (var i = table.length; i < ret; i++) {
   table[i] = null;
  }
  return ret;
 },
 MAX_TEMP_BUFFER_SIZE: 2097152,
 numTempVertexBuffersPerSize: 64,
 log2ceilLookup: i => 32 - Math.clz32(i === 0 ? 0 : i - 1),
 generateTempBuffers: (quads, context) => {
  var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
  context.tempVertexBufferCounters1 = [];
  context.tempVertexBufferCounters2 = [];
  context.tempVertexBufferCounters1.length = context.tempVertexBufferCounters2.length = largestIndex + 1;
  context.tempVertexBuffers1 = [];
  context.tempVertexBuffers2 = [];
  context.tempVertexBuffers1.length = context.tempVertexBuffers2.length = largestIndex + 1;
  context.tempIndexBuffers = [];
  context.tempIndexBuffers.length = largestIndex + 1;
  for (var i = 0; i <= largestIndex; ++i) {
   context.tempIndexBuffers[i] = null;
   context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[i] = 0;
   var ringbufferLength = GL.numTempVertexBuffersPerSize;
   context.tempVertexBuffers1[i] = [];
   context.tempVertexBuffers2[i] = [];
   var ringbuffer1 = context.tempVertexBuffers1[i];
   var ringbuffer2 = context.tempVertexBuffers2[i];
   ringbuffer1.length = ringbuffer2.length = ringbufferLength;
   for (var j = 0; j < ringbufferLength; ++j) {
    ringbuffer1[j] = ringbuffer2[j] = null;
   }
  }
  if (quads) {
   context.tempQuadIndexBuffer = GLctx.createBuffer();
   context.GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ context.tempQuadIndexBuffer);
   var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
   var quadIndexes = new Uint16Array(numIndexes);
   var i = 0, v = 0;
   while (1) {
    quadIndexes[i++] = v;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v + 1;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v + 2;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v + 2;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v + 3;
    if (i >= numIndexes) break;
    v += 4;
   }
   context.GLctx.bufferData(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ quadIndexes, 35044);
   /*GL_STATIC_DRAW*/ context.GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ null);
  }
 },
 getTempVertexBuffer: function getTempVertexBuffer(sizeBytes) {
  var idx = GL.log2ceilLookup(sizeBytes);
  var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
  var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
  GL.currentContext.tempVertexBufferCounters1[idx] = (GL.currentContext.tempVertexBufferCounters1[idx] + 1) & (GL.numTempVertexBuffersPerSize - 1);
  var vbo = ringbuffer[nextFreeBufferIndex];
  if (vbo) {
   return vbo;
  }
  var prevVBO = GLctx.getParameter(34964);
  /*GL_ARRAY_BUFFER_BINDING*/ ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
  GLctx.bindBuffer(34962, /*GL_ARRAY_BUFFER*/ ringbuffer[nextFreeBufferIndex]);
  GLctx.bufferData(34962, /*GL_ARRAY_BUFFER*/ 1 << idx, 35048);
  /*GL_DYNAMIC_DRAW*/ GLctx.bindBuffer(34962, /*GL_ARRAY_BUFFER*/ prevVBO);
  return ringbuffer[nextFreeBufferIndex];
 },
 getTempIndexBuffer: function getTempIndexBuffer(sizeBytes) {
  var idx = GL.log2ceilLookup(sizeBytes);
  var ibo = GL.currentContext.tempIndexBuffers[idx];
  if (ibo) {
   return ibo;
  }
  var prevIBO = GLctx.getParameter(34965);
  /*ELEMENT_ARRAY_BUFFER_BINDING*/ GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
  GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ GL.currentContext.tempIndexBuffers[idx]);
  GLctx.bufferData(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ 1 << idx, 35048);
  /*GL_DYNAMIC_DRAW*/ GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ prevIBO);
  return GL.currentContext.tempIndexBuffers[idx];
 },
 newRenderingFrameStarted: function newRenderingFrameStarted() {
  if (!GL.currentContext) {
   return;
  }
  var vb = GL.currentContext.tempVertexBuffers1;
  GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
  GL.currentContext.tempVertexBuffers2 = vb;
  vb = GL.currentContext.tempVertexBufferCounters1;
  GL.currentContext.tempVertexBufferCounters1 = GL.currentContext.tempVertexBufferCounters2;
  GL.currentContext.tempVertexBufferCounters2 = vb;
  var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
  for (var i = 0; i <= largestIndex; ++i) {
   GL.currentContext.tempVertexBufferCounters1[i] = 0;
  }
 },
 getSource: (shader, count, string, length) => {
  var source = "";
  for (var i = 0; i < count; ++i) {
   var len = length ? GROWABLE_HEAP_I32()[(((length) + (i * 4)) >> 2)] : -1;
   source += UTF8ToString(GROWABLE_HEAP_I32()[(((string) + (i * 4)) >> 2)], len < 0 ? undefined : len);
  }
  var type = GLctx.getShaderParameter(GL.shaders[shader], 35663);
  /* GL_SHADER_TYPE */ if (type == 35632) /* GL_FRAGMENT_SHADER */ {
   if (GLEmulation.findToken(source, "dFdx") || GLEmulation.findToken(source, "dFdy") || GLEmulation.findToken(source, "fwidth")) {
    source = "#extension GL_OES_standard_derivatives : enable\n" + source;
    var extension = GLctx.getExtension("OES_standard_derivatives");
   }
  }
  return source;
 },
 createContext: (/** @type {HTMLCanvasElement} */ canvas, webGLContextAttributes) => {
  if (!canvas.getContextSafariWebGL2Fixed) {
   canvas.getContextSafariWebGL2Fixed = canvas.getContext;
   /** @type {function(this:HTMLCanvasElement, string, (Object|null)=): (Object|null)} */ function fixedGetContext(ver, attrs) {
    var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
    return ((ver == "webgl") == (gl instanceof WebGLRenderingContext)) ? gl : null;
   }
   canvas.getContext = fixedGetContext;
  }
  var ctx = (webGLContextAttributes.majorVersion > 1) ? canvas.getContext("webgl2", webGLContextAttributes) : (canvas.getContext("webgl", webGLContextAttributes));
  if (!ctx) return 0;
  var handle = GL.registerContext(ctx, webGLContextAttributes);
  return handle;
 },
 registerContext: (ctx, webGLContextAttributes) => {
  var handle = _malloc(8);
  GROWABLE_HEAP_U32()[(((handle) + (4)) >> 2)] = _pthread_self();
  var context = {
   handle: handle,
   attributes: webGLContextAttributes,
   version: webGLContextAttributes.majorVersion,
   GLctx: ctx
  };
  if (ctx.canvas) ctx.canvas.GLctxObject = context;
  GL.contexts[handle] = context;
  if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
   GL.initExtensions(context);
  }
  return handle;
 },
 makeContextCurrent: contextHandle => {
  GL.currentContext = GL.contexts[contextHandle];
  Module.ctx = GLctx = GL.currentContext?.GLctx;
  return !(contextHandle && !GLctx);
 },
 getContext: contextHandle => GL.contexts[contextHandle],
 deleteContext: contextHandle => {
  if (GL.currentContext === GL.contexts[contextHandle]) {
   GL.currentContext = null;
  }
  if (typeof JSEvents == "object") {
   JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
  }
  if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) {
   GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
  }
  _free(GL.contexts[contextHandle].handle);
  GL.contexts[contextHandle] = null;
 },
 initExtensions: context => {
  context ||= GL.currentContext;
  if (context.initExtensionsDone) return;
  context.initExtensionsDone = true;
  var GLctx = context.GLctx;
  context.compressionExt = GLctx.getExtension("WEBGL_compressed_texture_s3tc");
  context.anisotropicExt = GLctx.getExtension("EXT_texture_filter_anisotropic");
  webgl_enable_ANGLE_instanced_arrays(GLctx);
  webgl_enable_OES_vertex_array_object(GLctx);
  webgl_enable_WEBGL_draw_buffers(GLctx);
  webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
  webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
  if (context.version >= 2) {
   GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query_webgl2");
  }
  if (context.version < 2 || !GLctx.disjointTimerQueryExt) {
   GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
  }
  webgl_enable_WEBGL_multi_draw(GLctx);
  var exts = GLctx.getSupportedExtensions() || [];
  exts.forEach(ext => {
   if (!ext.includes("lose_context") && !ext.includes("debug")) {
    GLctx.getExtension(ext);
   }
  });
 },
 getExtensions() {
  var exts = GLctx.getSupportedExtensions() || [];
  exts = exts.concat(exts.map(e => "GL_" + e));
  return exts;
 }
};

function _glActiveTexture(x0) {
 GLctx.activeTexture(x0);
}

var _glAttachShader = (program, shader) => {
 GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
};

var _glBindBuffer = (target, buffer) => {
 if (target == 34962) /*GL_ARRAY_BUFFER*/ {
  GLctx.currentArrayBufferBinding = buffer;
  GLImmediate.lastArrayBuffer = buffer;
 } else if (target == 34963) /*GL_ELEMENT_ARRAY_BUFFER*/ {
  GLctx.currentElementArrayBufferBinding = buffer;
 }
 if (target == 35051) /*GL_PIXEL_PACK_BUFFER*/ {
  GLctx.currentPixelPackBufferBinding = buffer;
 } else if (target == 35052) /*GL_PIXEL_UNPACK_BUFFER*/ {
  GLctx.currentPixelUnpackBufferBinding = buffer;
 }
 GLctx.bindBuffer(target, GL.buffers[buffer]);
};

var _glBindFramebuffer = (target, framebuffer) => {
 GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
};

var _glBindRenderbuffer = (target, renderbuffer) => {
 GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
};

var _glBindTexture = (target, texture) => {
 GLctx.bindTexture(target, GL.textures[texture]);
};

var _glEnableVertexAttribArray = index => {
 GLctx.enableVertexAttribArray(index);
};

var _glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
 GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
};

var _glEnableClientState = cap => {
 var attrib = GLEmulation.getAttributeFromCapability(cap);
 if (attrib === null) {
  return;
 }
 if (!GLImmediate.enabledClientAttributes[attrib]) {
  GLImmediate.enabledClientAttributes[attrib] = true;
  GLImmediate.totalEnabledClientAttributes++;
  GLImmediate.currentRenderer = null;
  if (GLEmulation.currentVao) GLEmulation.currentVao.enabledClientStates[cap] = 1;
  GLImmediate.modifiedClientAttributes = true;
 }
};

var emulGlBindVertexArray = vao => {
 GLEmulation.currentVao = null;
 GLImmediate.lastRenderer?.cleanup();
 _glBindBuffer(GLctx.ARRAY_BUFFER, 0);
 _glBindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, 0);
 for (var vaa in GLEmulation.enabledVertexAttribArrays) {
  GLctx.disableVertexAttribArray(vaa);
 }
 GLEmulation.enabledVertexAttribArrays = {};
 GLImmediate.enabledClientAttributes = [ 0, 0 ];
 GLImmediate.totalEnabledClientAttributes = 0;
 GLImmediate.modifiedClientAttributes = true;
 if (vao) {
  var info = GLEmulation.vaos[vao];
  _glBindBuffer(GLctx.ARRAY_BUFFER, info.arrayBuffer);
  _glBindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, info.elementArrayBuffer);
  for (var vaa in info.enabledVertexAttribArrays) {
   _glEnableVertexAttribArray(vaa);
  }
  for (var vaa in info.vertexAttribPointers) {
   _glVertexAttribPointer.apply(null, info.vertexAttribPointers[vaa]);
  }
  for (var attrib in info.enabledClientStates) {
   _glEnableClientState(attrib | 0);
  }
  GLEmulation.currentVao = info;
 }
};

var _glBindVertexArray = vao => {
 emulGlBindVertexArray(vao);
 var ibo = GLctx.getParameter(34965);
 /*ELEMENT_ARRAY_BUFFER_BINDING*/ GLctx.currentElementArrayBufferBinding = ibo ? (ibo.name | 0) : 0;
};

var _glBindVertexArrayOES = _glBindVertexArray;

function _glBlendEquation(x0) {
 GLctx.blendEquation(x0);
}

function _glBlendEquationSeparate(x0, x1) {
 GLctx.blendEquationSeparate(x0, x1);
}

function _glBlendFuncSeparate(x0, x1, x2, x3) {
 GLctx.blendFuncSeparate(x0, x1, x2, x3);
}

var _glBufferData = (target, size, data, usage) => {
 switch (usage) {
 case 35041:
 case 35042:
  usage = 35040;
  break;

 case 35045:
 case 35046:
  usage = 35044;
  break;

 case 35049:
 case 35050:
  usage = 35048;
  break;
 }
 if (GL.currentContext.version >= 2) {
  if (data && size) {
   GLctx.bufferData(target, GROWABLE_HEAP_U8(), usage, data, size);
  } else {
   GLctx.bufferData(target, size, usage);
  }
 } else {
  GLctx.bufferData(target, data ? GROWABLE_HEAP_U8().subarray(data, data + size) : size, usage);
 }
};

var _glBufferSubData = (target, offset, size, data) => {
 if (GL.currentContext.version >= 2) {
  size && GLctx.bufferSubData(target, offset, GROWABLE_HEAP_U8(), data, size);
  return;
 }
 GLctx.bufferSubData(target, offset, GROWABLE_HEAP_U8().subarray(data, data + size));
};

function _glClear(x0) {
 GLctx.clear(x0);
}

function _glClearColor(x0, x1, x2, x3) {
 GLctx.clearColor(x0, x1, x2, x3);
}

var _glCompileShader = shader => {
 GLctx.compileShader(GL.shaders[shader]);
};

var _glCreateProgram = () => {
 var id = GL.getNewId(GL.programs);
 var program = GLctx.createProgram();
 program.name = id;
 program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
 program.uniformIdCounter = 1;
 GL.programs[id] = program;
 return id;
};

var _glCreateShader = shaderType => {
 var id = GL.getNewId(GL.shaders);
 GL.shaders[id] = GLctx.createShader(shaderType);
 return id;
};

var _glDeleteBuffers = (n, buffers) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((buffers) + (i * 4)) >> 2)];
  var buffer = GL.buffers[id];
  if (!buffer) continue;
  GLctx.deleteBuffer(buffer);
  buffer.name = 0;
  GL.buffers[id] = null;
  if (id == GLctx.currentArrayBufferBinding) GLctx.currentArrayBufferBinding = 0;
  if (id == GLctx.currentElementArrayBufferBinding) GLctx.currentElementArrayBufferBinding = 0;
  if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
  if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0;
 }
};

var _glDeleteFramebuffers = (n, framebuffers) => {
 for (var i = 0; i < n; ++i) {
  var id = GROWABLE_HEAP_I32()[(((framebuffers) + (i * 4)) >> 2)];
  var framebuffer = GL.framebuffers[id];
  if (!framebuffer) continue;
  GLctx.deleteFramebuffer(framebuffer);
  framebuffer.name = 0;
  GL.framebuffers[id] = null;
 }
};

var _glDeleteProgram = id => {
 if (!id) return;
 var program = GL.programs[id];
 if (!program) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GLctx.deleteProgram(program);
 program.name = 0;
 GL.programs[id] = null;
};

var _glDeleteRenderbuffers = (n, renderbuffers) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((renderbuffers) + (i * 4)) >> 2)];
  var renderbuffer = GL.renderbuffers[id];
  if (!renderbuffer) continue;
  GLctx.deleteRenderbuffer(renderbuffer);
  renderbuffer.name = 0;
  GL.renderbuffers[id] = null;
 }
};

var _glDeleteShader = id => {
 if (!id) return;
 var shader = GL.shaders[id];
 if (!shader) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GLctx.deleteShader(shader);
 GL.shaders[id] = null;
};

var _glDeleteTextures = (n, textures) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((textures) + (i * 4)) >> 2)];
  var texture = GL.textures[id];
  if (!texture) continue;
  GLctx.deleteTexture(texture);
  texture.name = 0;
  GL.textures[id] = null;
 }
};

var emulGlDeleteVertexArrays = (n, vaos) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((vaos) + (i * 4)) >> 2)];
  GLEmulation.vaos[id] = null;
  if (GLEmulation.currentVao && GLEmulation.currentVao.id == id) GLEmulation.currentVao = null;
 }
};

var _glDeleteVertexArrays = (n, vaos) => {
 emulGlDeleteVertexArrays(n, vaos);
};

var _glDeleteVertexArraysOES = _glDeleteVertexArrays;

function _glDepthRangef(x0, x1) {
 GLctx.depthRange(x0, x1);
}

var _glDetachShader = (program, shader) => {
 GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
};

function _glDisable(x0) {
 GLctx.disable(x0);
}

var _glDrawArrays = (mode, first, count) => {
 if (GLImmediate.totalEnabledClientAttributes == 0 && mode <= 6) {
  GLctx.drawArrays(mode, first, count);
  return;
 }
 GLImmediate.prepareClientAttributes(count, false);
 GLImmediate.mode = mode;
 if (!GLctx.currentArrayBufferBinding) {
  GLImmediate.vertexData = GROWABLE_HEAP_F32().subarray((GLImmediate.vertexPointer) >> 2, (GLImmediate.vertexPointer + (first + count) * GLImmediate.stride) >> 2);
  GLImmediate.firstVertex = first;
  GLImmediate.lastVertex = first + count;
 }
 GLImmediate.flush(null, first);
 GLImmediate.mode = -1;
};

var _glDrawElements = (mode, count, type, indices, start, end) => {
 if (GLImmediate.totalEnabledClientAttributes == 0 && mode <= 6 && GLctx.currentElementArrayBufferBinding) {
  GLctx.drawElements(mode, count, type, indices);
  return;
 }
 GLImmediate.prepareClientAttributes(count, false);
 GLImmediate.mode = mode;
 if (!GLctx.currentArrayBufferBinding) {
  GLImmediate.firstVertex = end ? start : GROWABLE_HEAP_I8().length;
  GLImmediate.lastVertex = end ? end + 1 : 0;
  GLImmediate.vertexData = GROWABLE_HEAP_F32().subarray(GLImmediate.vertexPointer >> 2, end ? (GLImmediate.vertexPointer + (end + 1) * GLImmediate.stride) >> 2 : undefined);
 }
 GLImmediate.flush(count, 0, indices);
 GLImmediate.mode = -1;
};

function _glEnable(x0) {
 GLctx.enable(x0);
}

var _glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
 GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
};

var _glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
 GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
};

var __glGenObject = (n, buffers, createFunction, objectTable) => {
 for (var i = 0; i < n; i++) {
  var buffer = GLctx[createFunction]();
  var id = buffer && GL.getNewId(objectTable);
  if (buffer) {
   buffer.name = id;
   objectTable[id] = buffer;
  } else {
   GL.recordError(1282);
  }
  GROWABLE_HEAP_I32()[(((buffers) + (i * 4)) >> 2)] = id;
 }
};

var _glGenBuffers = (n, buffers) => {
 __glGenObject(n, buffers, "createBuffer", GL.buffers);
};

var _glGenFramebuffers = (n, ids) => {
 __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
};

var _glGenRenderbuffers = (n, renderbuffers) => {
 __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
};

var _glGenTextures = (n, textures) => {
 __glGenObject(n, textures, "createTexture", GL.textures);
};

var GLImmediate = {
 MapTreeLib: null,
 spawnMapTreeLib: () => {
  /**
         * A naive implementation of a map backed by an array, and accessed by
         * naive iteration along the array. (hashmap with only one bucket)
         * @constructor
         */ function CNaiveListMap() {
   var list = [];
   this.insert = function CNaiveListMap_insert(key, val) {
    if (this.contains(key | 0)) return false;
    list.push([ key, val ]);
    return true;
   };
   var __contains_i;
   this.contains = function CNaiveListMap_contains(key) {
    for (__contains_i = 0; __contains_i < list.length; ++__contains_i) {
     if (list[__contains_i][0] === key) return true;
    }
    return false;
   };
   var __get_i;
   this.get = function CNaiveListMap_get(key) {
    for (__get_i = 0; __get_i < list.length; ++__get_i) {
     if (list[__get_i][0] === key) return list[__get_i][1];
    }
    return undefined;
   };
  }
  /**
         * A tree of map nodes.
         * Uses `KeyView`s to allow descending the tree without garbage.
         * Example: {
         *   // Create our map object.
         *   var map = new ObjTreeMap();
         *
         *   // Grab the static keyView for the map.
         *   var keyView = map.GetStaticKeyView();
         *
         *   // Let's make a map for:
         *   // root: <undefined>
         *   //   1: <undefined>
         *   //     2: <undefined>
         *   //       5: "Three, sir!"
         *   //       3: "Three!"
         *
         *   // Note how we can chain together `Reset` and `Next` to
         *   // easily descend based on multiple key fragments.
         *   keyView.Reset().Next(1).Next(2).Next(5).Set("Three, sir!");
         *   keyView.Reset().Next(1).Next(2).Next(3).Set("Three!");
         * }
         * @constructor
         */ function CMapTree() {
   /** @constructor */ function CNLNode() {
    var map = new CNaiveListMap;
    this.child = function CNLNode_child(keyFrag) {
     if (!map.contains(keyFrag | 0)) {
      map.insert(keyFrag | 0, new CNLNode);
     }
     return map.get(keyFrag | 0);
    };
    this.value = undefined;
    this.get = function CNLNode_get() {
     return this.value;
    };
    this.set = function CNLNode_set(val) {
     this.value = val;
    };
   }
   /** @constructor */ function CKeyView(root) {
    var cur;
    this.reset = function CKeyView_reset() {
     cur = root;
     return this;
    };
    this.reset();
    this.next = function CKeyView_next(keyFrag) {
     cur = cur.child(keyFrag);
     return this;
    };
    this.get = function CKeyView_get() {
     return cur.get();
    };
    this.set = function CKeyView_set(val) {
     cur.set(val);
    };
   }
   var root;
   var staticKeyView;
   this.createKeyView = function CNLNode_createKeyView() {
    return new CKeyView(root);
   };
   this.clear = function CNLNode_clear() {
    root = new CNLNode;
    staticKeyView = this.createKeyView();
   };
   this.clear();
   this.getStaticKeyView = function CNLNode_getStaticKeyView() {
    staticKeyView.reset();
    return staticKeyView;
   };
  }
  return {
   create: () => new CMapTree
  };
 },
 TexEnvJIT: null,
 spawnTexEnvJIT: () => {
  var GL_TEXTURE0 = 33984;
  var GL_TEXTURE_1D = 3552;
  var GL_TEXTURE_2D = 3553;
  var GL_TEXTURE_3D = 32879;
  var GL_TEXTURE_CUBE_MAP = 34067;
  var GL_TEXTURE_ENV = 8960;
  var GL_TEXTURE_ENV_MODE = 8704;
  var GL_TEXTURE_ENV_COLOR = 8705;
  var GL_TEXTURE_CUBE_MAP_POSITIVE_X = 34069;
  var GL_TEXTURE_CUBE_MAP_NEGATIVE_X = 34070;
  var GL_TEXTURE_CUBE_MAP_POSITIVE_Y = 34071;
  var GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072;
  var GL_TEXTURE_CUBE_MAP_POSITIVE_Z = 34073;
  var GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074;
  var GL_SRC0_RGB = 34176;
  var GL_SRC1_RGB = 34177;
  var GL_SRC2_RGB = 34178;
  var GL_SRC0_ALPHA = 34184;
  var GL_SRC1_ALPHA = 34185;
  var GL_SRC2_ALPHA = 34186;
  var GL_OPERAND0_RGB = 34192;
  var GL_OPERAND1_RGB = 34193;
  var GL_OPERAND2_RGB = 34194;
  var GL_OPERAND0_ALPHA = 34200;
  var GL_OPERAND1_ALPHA = 34201;
  var GL_OPERAND2_ALPHA = 34202;
  var GL_COMBINE_RGB = 34161;
  var GL_COMBINE_ALPHA = 34162;
  var GL_RGB_SCALE = 34163;
  var GL_ALPHA_SCALE = 3356;
  var GL_ADD = 260;
  var GL_BLEND = 3042;
  var GL_REPLACE = 7681;
  var GL_MODULATE = 8448;
  var GL_DECAL = 8449;
  var GL_COMBINE = 34160;
  var GL_SUBTRACT = 34023;
  var GL_INTERPOLATE = 34165;
  var GL_TEXTURE = 5890;
  var GL_CONSTANT = 34166;
  var GL_PRIMARY_COLOR = 34167;
  var GL_PREVIOUS = 34168;
  var GL_SRC_COLOR = 768;
  var GL_ONE_MINUS_SRC_COLOR = 769;
  var GL_SRC_ALPHA = 770;
  var GL_ONE_MINUS_SRC_ALPHA = 771;
  var GL_RGB = 6407;
  var GL_RGBA = 6408;
  var TEXENVJIT_NAMESPACE_PREFIX = "tej_";
  var TEX_UNIT_UNIFORM_PREFIX = "uTexUnit";
  var TEX_COORD_VARYING_PREFIX = "vTexCoord";
  var PRIM_COLOR_VARYING = "vPrimColor";
  var TEX_MATRIX_UNIFORM_PREFIX = "uTexMatrix";
  var s_texUnits = null;
  var s_activeTexture = 0;
  var s_requiredTexUnitsForPass = [];
  function abort(info) {
   assert(false, "[TexEnvJIT] ABORT: " + info);
  }
  function abort_noSupport(info) {
   abort("No support: " + info);
  }
  function abort_sanity(info) {
   abort("Sanity failure: " + info);
  }
  function genTexUnitSampleExpr(texUnitID) {
   var texUnit = s_texUnits[texUnitID];
   var texType = texUnit.getTexType();
   var func = null;
   switch (texType) {
   case GL_TEXTURE_1D:
    func = "texture2D";
    break;

   case GL_TEXTURE_2D:
    func = "texture2D";
    break;

   case GL_TEXTURE_3D:
    return abort_noSupport("No support for 3D textures.");

   case GL_TEXTURE_CUBE_MAP:
    func = "textureCube";
    break;

   default:
    return abort_sanity("Unknown texType: " + ptrToString(texType));
   }
   var texCoordExpr = TEX_COORD_VARYING_PREFIX + texUnitID;
   if (TEX_MATRIX_UNIFORM_PREFIX != null) {
    texCoordExpr = "(" + TEX_MATRIX_UNIFORM_PREFIX + texUnitID + " * " + texCoordExpr + ")";
   }
   return func + "(" + TEX_UNIT_UNIFORM_PREFIX + texUnitID + ", " + texCoordExpr + ".xy)";
  }
  function getTypeFromCombineOp(op) {
   switch (op) {
   case GL_SRC_COLOR:
   case GL_ONE_MINUS_SRC_COLOR:
    return "vec3";

   case GL_SRC_ALPHA:
   case GL_ONE_MINUS_SRC_ALPHA:
    return "float";
   }
   return abort_noSupport("Unsupported combiner op: " + ptrToString(op));
  }
  function getCurTexUnit() {
   return s_texUnits[s_activeTexture];
  }
  function genCombinerSourceExpr(texUnitID, constantExpr, previousVar, src, op) {
   var srcExpr = null;
   switch (src) {
   case GL_TEXTURE:
    srcExpr = genTexUnitSampleExpr(texUnitID);
    break;

   case GL_CONSTANT:
    srcExpr = constantExpr;
    break;

   case GL_PRIMARY_COLOR:
    srcExpr = PRIM_COLOR_VARYING;
    break;

   case GL_PREVIOUS:
    srcExpr = previousVar;
    break;

   default:
    return abort_noSupport("Unsupported combiner src: " + ptrToString(src));
   }
   var expr = null;
   switch (op) {
   case GL_SRC_COLOR:
    expr = srcExpr + ".rgb";
    break;

   case GL_ONE_MINUS_SRC_COLOR:
    expr = "(vec3(1.0) - " + srcExpr + ".rgb)";
    break;

   case GL_SRC_ALPHA:
    expr = srcExpr + ".a";
    break;

   case GL_ONE_MINUS_SRC_ALPHA:
    expr = "(1.0 - " + srcExpr + ".a)";
    break;

   default:
    return abort_noSupport("Unsupported combiner op: " + ptrToString(op));
   }
   return expr;
  }
  function valToFloatLiteral(val) {
   if (val == Math.round(val)) return val + ".0";
   return val;
  }
  /** @constructor */ function CTexEnv() {
   this.mode = GL_MODULATE;
   this.colorCombiner = GL_MODULATE;
   this.alphaCombiner = GL_MODULATE;
   this.colorScale = 1;
   this.alphaScale = 1;
   this.envColor = [ 0, 0, 0, 0 ];
   this.colorSrc = [ GL_TEXTURE, GL_PREVIOUS, GL_CONSTANT ];
   this.alphaSrc = [ GL_TEXTURE, GL_PREVIOUS, GL_CONSTANT ];
   this.colorOp = [ GL_SRC_COLOR, GL_SRC_COLOR, GL_SRC_ALPHA ];
   this.alphaOp = [ GL_SRC_ALPHA, GL_SRC_ALPHA, GL_SRC_ALPHA ];
   this.traverseKey = {
    7681: /* GL_REPLACE */ 0,
    8448: /* GL_MODULATE */ 1,
    260: /* GL_ADD */ 2,
    3042: /* GL_BLEND */ 3,
    8449: /* GL_DECAL */ 4,
    34160: /* GL_COMBINE */ 5,
    34023: /* GL_SUBTRACT */ 3,
    34165: /* GL_INTERPOLATE */ 4,
    5890: /* GL_TEXTURE */ 0,
    34166: /* GL_CONSTANT */ 1,
    34167: /* GL_PRIMARY_COLOR */ 2,
    34168: /* GL_PREVIOUS */ 3,
    768: /* GL_SRC_COLOR */ 0,
    769: /* GL_ONE_MINUS_SRC_COLOR */ 1,
    770: /* GL_SRC_ALPHA */ 2,
    771: /* GL_ONE_MINUS_SRC_ALPHA */ 3
   };
   this.key0 = -1;
   this.key1 = 0;
   this.key2 = 0;
   this.computeKey0 = function() {
    var k = this.traverseKey;
    var key = k[this.mode] * 1638400;
    key += k[this.colorCombiner] * 327680;
    key += k[this.alphaCombiner] * 65536;
    key += (this.colorScale - 1) * 16384;
    key += (this.alphaScale - 1) * 4096;
    key += k[this.colorSrc[0]] * 1024;
    key += k[this.colorSrc[1]] * 256;
    key += k[this.colorSrc[2]] * 64;
    key += k[this.alphaSrc[0]] * 16;
    key += k[this.alphaSrc[1]] * 4;
    key += k[this.alphaSrc[2]];
    return key;
   };
   this.computeKey1 = function() {
    var k = this.traverseKey;
    var key = k[this.colorOp[0]] * 4096;
    key += k[this.colorOp[1]] * 1024;
    key += k[this.colorOp[2]] * 256;
    key += k[this.alphaOp[0]] * 16;
    key += k[this.alphaOp[1]] * 4;
    key += k[this.alphaOp[2]];
    return key;
   };
   this.computeKey2 = function() {
    return this.envColor[0] * 16777216 + this.envColor[1] * 65536 + this.envColor[2] * 256 + 1 + this.envColor[3];
   };
   this.recomputeKey = function() {
    this.key0 = this.computeKey0();
    this.key1 = this.computeKey1();
    this.key2 = this.computeKey2();
   };
   this.invalidateKey = function() {
    this.key0 = -1;
    GLImmediate.currentRenderer = null;
   };
  }
  /** @constructor */ function CTexUnit() {
   this.env = new CTexEnv;
   this.enabled_tex1D = false;
   this.enabled_tex2D = false;
   this.enabled_tex3D = false;
   this.enabled_texCube = false;
   this.texTypesEnabled = 0;
   this.traverseState = function CTexUnit_traverseState(keyView) {
    if (this.texTypesEnabled) {
     if (this.env.key0 == -1) {
      this.env.recomputeKey();
     }
     keyView.next(this.texTypesEnabled | (this.env.key0 << 4));
     keyView.next(this.env.key1);
     keyView.next(this.env.key2);
    } else {
     keyView.next(0);
    }
   };
  }
  CTexUnit.prototype.enabled = function CTexUnit_enabled() {
   return this.texTypesEnabled;
  };
  CTexUnit.prototype.genPassLines = function CTexUnit_genPassLines(passOutputVar, passInputVar, texUnitID) {
   if (!this.enabled()) {
    return [ "vec4 " + passOutputVar + " = " + passInputVar + ";" ];
   }
   var lines = this.env.genPassLines(passOutputVar, passInputVar, texUnitID).join("\n");
   var texLoadLines = "";
   var texLoadRegex = /(texture.*?\(.*?\))/g;
   var loadCounter = 0;
   var load;
   while (load = texLoadRegex.exec(lines)) {
    var texLoadExpr = load[1];
    var secondOccurrence = lines.slice(load.index + 1).indexOf(texLoadExpr);
    if (secondOccurrence != -1) {
     var prefix = TEXENVJIT_NAMESPACE_PREFIX + "env" + texUnitID + "_";
     var texLoadVar = prefix + "texload" + loadCounter++;
     var texLoadLine = "vec4 " + texLoadVar + " = " + texLoadExpr + ";\n";
     texLoadLines += texLoadLine + "\n";
     lines = lines.split(texLoadExpr).join(texLoadVar);
     texLoadRegex = /(texture.*\(.*\))/g;
    }
   }
   return [ texLoadLines + lines ];
  };
  CTexUnit.prototype.getTexType = function CTexUnit_getTexType() {
   if (this.enabled_texCube) {
    return GL_TEXTURE_CUBE_MAP;
   } else if (this.enabled_tex3D) {
    return GL_TEXTURE_3D;
   } else if (this.enabled_tex2D) {
    return GL_TEXTURE_2D;
   } else if (this.enabled_tex1D) {
    return GL_TEXTURE_1D;
   }
   return 0;
  };
  CTexEnv.prototype.genPassLines = function CTexEnv_genPassLines(passOutputVar, passInputVar, texUnitID) {
   switch (this.mode) {
   case GL_REPLACE:
    {
     /* RGB:
               * Cv = Cs
               * Av = Ap // Note how this is different, and that we'll
               *            need to track the bound texture internalFormat
               *            to get this right.
               *
               * RGBA:
               * Cv = Cs
               * Av = As
               */ return [ "vec4 " + passOutputVar + " = " + genTexUnitSampleExpr(texUnitID) + ";" ];
    }

   case GL_ADD:
    {
     /* RGBA:
               * Cv = Cp + Cs
               * Av = ApAs
               */ var prefix = TEXENVJIT_NAMESPACE_PREFIX + "env" + texUnitID + "_";
     var texVar = prefix + "tex";
     var colorVar = prefix + "color";
     var alphaVar = prefix + "alpha";
     return [ "vec4 " + texVar + " = " + genTexUnitSampleExpr(texUnitID) + ";", "vec3 " + colorVar + " = " + passInputVar + ".rgb + " + texVar + ".rgb;", "float " + alphaVar + " = " + passInputVar + ".a * " + texVar + ".a;", "vec4 " + passOutputVar + " = vec4(" + colorVar + ", " + alphaVar + ");" ];
    }

   case GL_MODULATE:
    {
     /* RGBA:
               * Cv = CpCs
               * Av = ApAs
               */ var line = [ "vec4 " + passOutputVar, " = ", passInputVar, " * ", genTexUnitSampleExpr(texUnitID), ";" ];
     return [ line.join("") ];
    }

   case GL_DECAL:
    {
     /* RGBA:
               * Cv = Cp(1 - As) + CsAs
               * Av = Ap
               */ var prefix = TEXENVJIT_NAMESPACE_PREFIX + "env" + texUnitID + "_";
     var texVar = prefix + "tex";
     var colorVar = prefix + "color";
     var alphaVar = prefix + "alpha";
     return [ "vec4 " + texVar + " = " + genTexUnitSampleExpr(texUnitID) + ";", [ "vec3 " + colorVar + " = ", passInputVar + ".rgb * (1.0 - " + texVar + ".a)", " + ", texVar + ".rgb * " + texVar + ".a", ";" ].join(""), "float " + alphaVar + " = " + passInputVar + ".a;", "vec4 " + passOutputVar + " = vec4(" + colorVar + ", " + alphaVar + ");" ];
    }

   case GL_BLEND:
    {
     /* RGBA:
               * Cv = Cp(1 - Cs) + CcCs
               * Av = As
               */ var prefix = TEXENVJIT_NAMESPACE_PREFIX + "env" + texUnitID + "_";
     var texVar = prefix + "tex";
     var colorVar = prefix + "color";
     var alphaVar = prefix + "alpha";
     return [ "vec4 " + texVar + " = " + genTexUnitSampleExpr(texUnitID) + ";", [ "vec3 " + colorVar + " = ", passInputVar + ".rgb * (1.0 - " + texVar + ".rgb)", " + ", PRIM_COLOR_VARYING + ".rgb * " + texVar + ".rgb", ";" ].join(""), "float " + alphaVar + " = " + texVar + ".a;", "vec4 " + passOutputVar + " = vec4(" + colorVar + ", " + alphaVar + ");" ];
    }

   case GL_COMBINE:
    {
     var prefix = TEXENVJIT_NAMESPACE_PREFIX + "env" + texUnitID + "_";
     var colorVar = prefix + "color";
     var alphaVar = prefix + "alpha";
     var colorLines = this.genCombinerLines(true, colorVar, passInputVar, texUnitID, this.colorCombiner, this.colorSrc, this.colorOp);
     var alphaLines = this.genCombinerLines(false, alphaVar, passInputVar, texUnitID, this.alphaCombiner, this.alphaSrc, this.alphaOp);
     var scaledColor = (this.colorScale == 1) ? colorVar : (colorVar + " * " + valToFloatLiteral(this.colorScale));
     var scaledAlpha = (this.alphaScale == 1) ? alphaVar : (alphaVar + " * " + valToFloatLiteral(this.alphaScale));
     var line = [ "vec4 " + passOutputVar, " = ", "vec4(", scaledColor, ", ", scaledAlpha, ")", ";" ].join("");
     return [].concat(colorLines, alphaLines, [ line ]);
    }
   }
   return abort_noSupport("Unsupported TexEnv mode: " + ptrToString(this.mode));
  };
  CTexEnv.prototype.genCombinerLines = function CTexEnv_getCombinerLines(isColor, outputVar, passInputVar, texUnitID, combiner, srcArr, opArr) {
   var argsNeeded = null;
   switch (combiner) {
   case GL_REPLACE:
    argsNeeded = 1;
    break;

   case GL_MODULATE:
   case GL_ADD:
   case GL_SUBTRACT:
    argsNeeded = 2;
    break;

   case GL_INTERPOLATE:
    argsNeeded = 3;
    break;

   default:
    return abort_noSupport("Unsupported combiner: " + ptrToString(combiner));
   }
   var constantExpr = [ "vec4(", valToFloatLiteral(this.envColor[0]), ", ", valToFloatLiteral(this.envColor[1]), ", ", valToFloatLiteral(this.envColor[2]), ", ", valToFloatLiteral(this.envColor[3]), ")" ].join("");
   var src0Expr = (argsNeeded >= 1) ? genCombinerSourceExpr(texUnitID, constantExpr, passInputVar, srcArr[0], opArr[0]) : null;
   var src1Expr = (argsNeeded >= 2) ? genCombinerSourceExpr(texUnitID, constantExpr, passInputVar, srcArr[1], opArr[1]) : null;
   var src2Expr = (argsNeeded >= 3) ? genCombinerSourceExpr(texUnitID, constantExpr, passInputVar, srcArr[2], opArr[2]) : null;
   var outputType = isColor ? "vec3" : "float";
   var lines = null;
   switch (combiner) {
   case GL_REPLACE:
    {
     var line = [ outputType + " " + outputVar, " = ", src0Expr, ";" ];
     lines = [ line.join("") ];
     break;
    }

   case GL_MODULATE:
    {
     var line = [ outputType + " " + outputVar + " = ", src0Expr + " * " + src1Expr, ";" ];
     lines = [ line.join("") ];
     break;
    }

   case GL_ADD:
    {
     var line = [ outputType + " " + outputVar + " = ", src0Expr + " + " + src1Expr, ";" ];
     lines = [ line.join("") ];
     break;
    }

   case GL_SUBTRACT:
    {
     var line = [ outputType + " " + outputVar + " = ", src0Expr + " - " + src1Expr, ";" ];
     lines = [ line.join("") ];
     break;
    }

   case GL_INTERPOLATE:
    {
     var prefix = TEXENVJIT_NAMESPACE_PREFIX + "env" + texUnitID + "_";
     var arg2Var = prefix + "colorSrc2";
     var arg2Line = getTypeFromCombineOp(this.colorOp[2]) + " " + arg2Var + " = " + src2Expr + ";";
     var line = [ outputType + " " + outputVar, " = ", src0Expr + " * " + arg2Var, " + ", src1Expr + " * (1.0 - " + arg2Var + ")", ";" ];
     lines = [ arg2Line, line.join("") ];
     break;
    }

   default:
    return abort_sanity("Unmatched TexEnv.colorCombiner?");
   }
   return lines;
  };
  return {
   init: (gl, specifiedMaxTextureImageUnits) => {
    var maxTexUnits = 0;
    if (specifiedMaxTextureImageUnits) {
     maxTexUnits = specifiedMaxTextureImageUnits;
    } else if (gl) {
     maxTexUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    }
    s_texUnits = [];
    for (var i = 0; i < maxTexUnits; i++) {
     s_texUnits.push(new CTexUnit);
    }
   },
   setGLSLVars: (uTexUnitPrefix, vTexCoordPrefix, vPrimColor, uTexMatrixPrefix) => {
    TEX_UNIT_UNIFORM_PREFIX = uTexUnitPrefix;
    TEX_COORD_VARYING_PREFIX = vTexCoordPrefix;
    PRIM_COLOR_VARYING = vPrimColor;
    TEX_MATRIX_UNIFORM_PREFIX = uTexMatrixPrefix;
   },
   genAllPassLines: (resultDest, indentSize = 0) => {
    s_requiredTexUnitsForPass.length = 0;
    var lines = [];
    var lastPassVar = PRIM_COLOR_VARYING;
    for (var i = 0; i < s_texUnits.length; i++) {
     if (!s_texUnits[i].enabled()) continue;
     s_requiredTexUnitsForPass.push(i);
     var prefix = TEXENVJIT_NAMESPACE_PREFIX + "env" + i + "_";
     var passOutputVar = prefix + "result";
     var newLines = s_texUnits[i].genPassLines(passOutputVar, lastPassVar, i);
     lines = lines.concat(newLines, [ "" ]);
     lastPassVar = passOutputVar;
    }
    lines.push(resultDest + " = " + lastPassVar + ";");
    var indent = "";
    for (var i = 0; i < indentSize; i++) indent += " ";
    var output = indent + lines.join("\n" + indent);
    return output;
   },
   getUsedTexUnitList: () => s_requiredTexUnitsForPass,
   getActiveTexture: () => s_activeTexture,
   traverseState: keyView => {
    for (var i = 0; i < s_texUnits.length; i++) {
     s_texUnits[i].traverseState(keyView);
    }
   },
   getTexUnitType: texUnitID => s_texUnits[texUnitID].getTexType(),
   hook_activeTexture: texture => {
    s_activeTexture = texture - GL_TEXTURE0;
    if (GLImmediate.currentMatrix >= 2) {
     GLImmediate.currentMatrix = 2 + s_activeTexture;
    }
   },
   hook_enable: cap => {
    var cur = getCurTexUnit();
    switch (cap) {
    case GL_TEXTURE_1D:
     if (!cur.enabled_tex1D) {
      GLImmediate.currentRenderer = null;
      cur.enabled_tex1D = true;
      cur.texTypesEnabled |= 1;
     }
     break;

    case GL_TEXTURE_2D:
     if (!cur.enabled_tex2D) {
      GLImmediate.currentRenderer = null;
      cur.enabled_tex2D = true;
      cur.texTypesEnabled |= 2;
     }
     break;

    case GL_TEXTURE_3D:
     if (!cur.enabled_tex3D) {
      GLImmediate.currentRenderer = null;
      cur.enabled_tex3D = true;
      cur.texTypesEnabled |= 4;
     }
     break;

    case GL_TEXTURE_CUBE_MAP:
     if (!cur.enabled_texCube) {
      GLImmediate.currentRenderer = null;
      cur.enabled_texCube = true;
      cur.texTypesEnabled |= 8;
     }
     break;
    }
   },
   hook_disable: cap => {
    var cur = getCurTexUnit();
    switch (cap) {
    case GL_TEXTURE_1D:
     if (cur.enabled_tex1D) {
      GLImmediate.currentRenderer = null;
      cur.enabled_tex1D = false;
      cur.texTypesEnabled &= ~1;
     }
     break;

    case GL_TEXTURE_2D:
     if (cur.enabled_tex2D) {
      GLImmediate.currentRenderer = null;
      cur.enabled_tex2D = false;
      cur.texTypesEnabled &= ~2;
     }
     break;

    case GL_TEXTURE_3D:
     if (cur.enabled_tex3D) {
      GLImmediate.currentRenderer = null;
      cur.enabled_tex3D = false;
      cur.texTypesEnabled &= ~4;
     }
     break;

    case GL_TEXTURE_CUBE_MAP:
     if (cur.enabled_texCube) {
      GLImmediate.currentRenderer = null;
      cur.enabled_texCube = false;
      cur.texTypesEnabled &= ~8;
     }
     break;
    }
   },
   hook_texEnvf(target, pname, param) {
    if (target != GL_TEXTURE_ENV) return;
    var env = getCurTexUnit().env;
    switch (pname) {
    case GL_RGB_SCALE:
     if (env.colorScale != param) {
      env.invalidateKey();
      env.colorScale = param;
     }
     break;

    case GL_ALPHA_SCALE:
     if (env.alphaScale != param) {
      env.invalidateKey();
      env.alphaScale = param;
     }
     break;

    default:
     err("WARNING: Unhandled `pname` in call to `glTexEnvf`.");
    }
   },
   hook_texEnvi(target, pname, param) {
    if (target != GL_TEXTURE_ENV) return;
    var env = getCurTexUnit().env;
    switch (pname) {
    case GL_TEXTURE_ENV_MODE:
     if (env.mode != param) {
      env.invalidateKey();
      env.mode = param;
     }
     break;

    case GL_COMBINE_RGB:
     if (env.colorCombiner != param) {
      env.invalidateKey();
      env.colorCombiner = param;
     }
     break;

    case GL_COMBINE_ALPHA:
     if (env.alphaCombiner != param) {
      env.invalidateKey();
      env.alphaCombiner = param;
     }
     break;

    case GL_SRC0_RGB:
     if (env.colorSrc[0] != param) {
      env.invalidateKey();
      env.colorSrc[0] = param;
     }
     break;

    case GL_SRC1_RGB:
     if (env.colorSrc[1] != param) {
      env.invalidateKey();
      env.colorSrc[1] = param;
     }
     break;

    case GL_SRC2_RGB:
     if (env.colorSrc[2] != param) {
      env.invalidateKey();
      env.colorSrc[2] = param;
     }
     break;

    case GL_SRC0_ALPHA:
     if (env.alphaSrc[0] != param) {
      env.invalidateKey();
      env.alphaSrc[0] = param;
     }
     break;

    case GL_SRC1_ALPHA:
     if (env.alphaSrc[1] != param) {
      env.invalidateKey();
      env.alphaSrc[1] = param;
     }
     break;

    case GL_SRC2_ALPHA:
     if (env.alphaSrc[2] != param) {
      env.invalidateKey();
      env.alphaSrc[2] = param;
     }
     break;

    case GL_OPERAND0_RGB:
     if (env.colorOp[0] != param) {
      env.invalidateKey();
      env.colorOp[0] = param;
     }
     break;

    case GL_OPERAND1_RGB:
     if (env.colorOp[1] != param) {
      env.invalidateKey();
      env.colorOp[1] = param;
     }
     break;

    case GL_OPERAND2_RGB:
     if (env.colorOp[2] != param) {
      env.invalidateKey();
      env.colorOp[2] = param;
     }
     break;

    case GL_OPERAND0_ALPHA:
     if (env.alphaOp[0] != param) {
      env.invalidateKey();
      env.alphaOp[0] = param;
     }
     break;

    case GL_OPERAND1_ALPHA:
     if (env.alphaOp[1] != param) {
      env.invalidateKey();
      env.alphaOp[1] = param;
     }
     break;

    case GL_OPERAND2_ALPHA:
     if (env.alphaOp[2] != param) {
      env.invalidateKey();
      env.alphaOp[2] = param;
     }
     break;

    case GL_RGB_SCALE:
     if (env.colorScale != param) {
      env.invalidateKey();
      env.colorScale = param;
     }
     break;

    case GL_ALPHA_SCALE:
     if (env.alphaScale != param) {
      env.invalidateKey();
      env.alphaScale = param;
     }
     break;

    default:
     err("WARNING: Unhandled `pname` in call to `glTexEnvi`.");
    }
   },
   hook_texEnvfv(target, pname, params) {
    if (target != GL_TEXTURE_ENV) return;
    var env = getCurTexUnit().env;
    switch (pname) {
    case GL_TEXTURE_ENV_COLOR:
     {
      for (var i = 0; i < 4; i++) {
       var param = GROWABLE_HEAP_F32()[(((params) + (i * 4)) >> 2)];
       if (env.envColor[i] != param) {
        env.invalidateKey();
        env.envColor[i] = param;
       }
      }
      break;
     }

    default:
     err("WARNING: Unhandled `pname` in call to `glTexEnvfv`.");
    }
   },
   hook_getTexEnviv(target, pname, param) {
    if (target != GL_TEXTURE_ENV) return;
    var env = getCurTexUnit().env;
    switch (pname) {
    case GL_TEXTURE_ENV_MODE:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.mode;
     return;

    case GL_TEXTURE_ENV_COLOR:
     GROWABLE_HEAP_I32()[((param) >> 2)] = Math.max(Math.min(env.envColor[0] * 255, 255, -255));
     GROWABLE_HEAP_I32()[(((param) + (1)) >> 2)] = Math.max(Math.min(env.envColor[1] * 255, 255, -255));
     GROWABLE_HEAP_I32()[(((param) + (2)) >> 2)] = Math.max(Math.min(env.envColor[2] * 255, 255, -255));
     GROWABLE_HEAP_I32()[(((param) + (3)) >> 2)] = Math.max(Math.min(env.envColor[3] * 255, 255, -255));
     return;

    case GL_COMBINE_RGB:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.colorCombiner;
     return;

    case GL_COMBINE_ALPHA:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.alphaCombiner;
     return;

    case GL_SRC0_RGB:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.colorSrc[0];
     return;

    case GL_SRC1_RGB:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.colorSrc[1];
     return;

    case GL_SRC2_RGB:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.colorSrc[2];
     return;

    case GL_SRC0_ALPHA:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.alphaSrc[0];
     return;

    case GL_SRC1_ALPHA:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.alphaSrc[1];
     return;

    case GL_SRC2_ALPHA:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.alphaSrc[2];
     return;

    case GL_OPERAND0_RGB:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.colorOp[0];
     return;

    case GL_OPERAND1_RGB:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.colorOp[1];
     return;

    case GL_OPERAND2_RGB:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.colorOp[2];
     return;

    case GL_OPERAND0_ALPHA:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.alphaOp[0];
     return;

    case GL_OPERAND1_ALPHA:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.alphaOp[1];
     return;

    case GL_OPERAND2_ALPHA:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.alphaOp[2];
     return;

    case GL_RGB_SCALE:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.colorScale;
     return;

    case GL_ALPHA_SCALE:
     GROWABLE_HEAP_I32()[((param) >> 2)] = env.alphaScale;
     return;

    default:
     err("WARNING: Unhandled `pname` in call to `glGetTexEnvi`.");
    }
   },
   hook_getTexEnvfv: (target, pname, param) => {
    if (target != GL_TEXTURE_ENV) return;
    var env = getCurTexUnit().env;
    switch (pname) {
    case GL_TEXTURE_ENV_COLOR:
     GROWABLE_HEAP_F32()[((param) >> 2)] = env.envColor[0];
     GROWABLE_HEAP_F32()[(((param) + (4)) >> 2)] = env.envColor[1];
     GROWABLE_HEAP_F32()[(((param) + (8)) >> 2)] = env.envColor[2];
     GROWABLE_HEAP_F32()[(((param) + (12)) >> 2)] = env.envColor[3];
     return;
    }
   }
  };
 },
 vertexData: null,
 vertexDataU8: null,
 tempData: null,
 indexData: null,
 vertexCounter: 0,
 mode: -1,
 rendererCache: null,
 rendererComponents: [],
 rendererComponentPointer: 0,
 lastRenderer: null,
 lastArrayBuffer: null,
 lastProgram: null,
 lastStride: -1,
 matrix: [],
 matrixStack: [],
 currentMatrix: 0,
 tempMatrix: null,
 matricesModified: false,
 useTextureMatrix: false,
 VERTEX: 0,
 NORMAL: 1,
 COLOR: 2,
 TEXTURE0: 3,
 NUM_ATTRIBUTES: -1,
 MAX_TEXTURES: -1,
 totalEnabledClientAttributes: 0,
 enabledClientAttributes: [ 0, 0 ],
 clientAttributes: [],
 liveClientAttributes: [],
 currentRenderer: null,
 modifiedClientAttributes: false,
 clientActiveTexture: 0,
 clientColor: null,
 usedTexUnitList: [],
 fixedFunctionProgram: null,
 setClientAttribute(name, size, type, stride, pointer) {
  var attrib = GLImmediate.clientAttributes[name];
  if (!attrib) {
   for (var i = 0; i <= name; i++) {
    GLImmediate.clientAttributes[i] ||= {
     name: name,
     size: size,
     type: type,
     stride: stride,
     pointer: pointer,
     offset: 0
    };
   }
  } else {
   attrib.name = name;
   attrib.size = size;
   attrib.type = type;
   attrib.stride = stride;
   attrib.pointer = pointer;
   attrib.offset = 0;
  }
  GLImmediate.modifiedClientAttributes = true;
 },
 addRendererComponent(name, size, type) {
  if (!GLImmediate.rendererComponents[name]) {
   GLImmediate.rendererComponents[name] = 1;
   GLImmediate.enabledClientAttributes[name] = true;
   GLImmediate.setClientAttribute(name, size, type, 0, GLImmediate.rendererComponentPointer);
   GLImmediate.rendererComponentPointer += size * GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
  } else {
   GLImmediate.rendererComponents[name]++;
  }
 },
 disableBeginEndClientAttributes() {
  for (var i = 0; i < GLImmediate.NUM_ATTRIBUTES; i++) {
   if (GLImmediate.rendererComponents[i]) GLImmediate.enabledClientAttributes[i] = false;
  }
 },
 getRenderer() {
  if (GLImmediate.currentRenderer) {
   return GLImmediate.currentRenderer;
  }
  var attributes = GLImmediate.liveClientAttributes;
  var cacheMap = GLImmediate.rendererCache;
  var keyView = cacheMap.getStaticKeyView().reset();
  var enabledAttributesKey = 0;
  for (var i = 0; i < attributes.length; i++) {
   enabledAttributesKey |= 1 << attributes[i].name;
  }
  keyView.next(enabledAttributesKey);
  enabledAttributesKey = 0;
  var fogParam = 0;
  if (GLEmulation.fogEnabled) {
   switch (GLEmulation.fogMode) {
   case 2049:
    fogParam = 1;
    break;

   case 9729:
    fogParam = 2;
    break;

   default:
    fogParam = 3;
    break;
   }
  }
  enabledAttributesKey = (enabledAttributesKey << 2) | fogParam;
  for (var clipPlaneId = 0; clipPlaneId < GLEmulation.MAX_CLIP_PLANES; clipPlaneId++) {
   enabledAttributesKey = (enabledAttributesKey << 1) | GLEmulation.clipPlaneEnabled[clipPlaneId];
  }
  enabledAttributesKey = (enabledAttributesKey << 1) | GLEmulation.lightingEnabled;
  for (var lightId = 0; lightId < GLEmulation.MAX_LIGHTS; lightId++) {
   enabledAttributesKey = (enabledAttributesKey << 1) | (GLEmulation.lightingEnabled ? GLEmulation.lightEnabled[lightId] : 0);
  }
  enabledAttributesKey = (enabledAttributesKey << 3) | (GLEmulation.alphaTestEnabled ? (GLEmulation.alphaTestFunc - 512) : 7);
  enabledAttributesKey = (enabledAttributesKey << 1) | (GLImmediate.mode == GLctx.POINTS ? 1 : 0);
  keyView.next(enabledAttributesKey);
  keyView.next(GL.currProgram);
  if (!GL.currProgram) {
   GLImmediate.TexEnvJIT.traverseState(keyView);
  }
  var renderer = keyView.get();
  if (!renderer) {
   renderer = GLImmediate.createRenderer();
   GLImmediate.currentRenderer = renderer;
   keyView.set(renderer);
   return renderer;
  }
  GLImmediate.currentRenderer = renderer;
  return renderer;
 },
 createRenderer(renderer) {
  var useCurrProgram = !!GL.currProgram;
  var hasTextures = false;
  for (var i = 0; i < GLImmediate.MAX_TEXTURES; i++) {
   var texAttribName = GLImmediate.TEXTURE0 + i;
   if (!GLImmediate.enabledClientAttributes[texAttribName]) continue;
   hasTextures = true;
  }
  /** @constructor */ function Renderer() {
   this.init = function() {
    var uTexUnitPrefix = "u_texUnit";
    var aTexCoordPrefix = "a_texCoord";
    var vTexCoordPrefix = "v_texCoord";
    var vPrimColor = "v_color";
    var uTexMatrixPrefix = GLImmediate.useTextureMatrix ? "u_textureMatrix" : null;
    if (useCurrProgram) {
     if (GL.shaderInfos[GL.programShaders[GL.currProgram][0]].type == GLctx.VERTEX_SHADER) {
      this.vertexShader = GL.shaders[GL.programShaders[GL.currProgram][0]];
      this.fragmentShader = GL.shaders[GL.programShaders[GL.currProgram][1]];
     } else {
      this.vertexShader = GL.shaders[GL.programShaders[GL.currProgram][1]];
      this.fragmentShader = GL.shaders[GL.programShaders[GL.currProgram][0]];
     }
     this.program = GL.programs[GL.currProgram];
     this.usedTexUnitList = [];
    } else {
     if (GLEmulation.fogEnabled) {
      switch (GLEmulation.fogMode) {
      case 2049:
       var fogFormula = "  float fog = exp(-u_fogDensity * u_fogDensity * ecDistance * ecDistance); \n";
       break;

      case 9729:
       var fogFormula = "  float fog = (u_fogEnd - ecDistance) * u_fogScale; \n";
       break;

      default:
       var fogFormula = "  float fog = exp(-u_fogDensity * ecDistance); \n";
       break;
      }
     }
     GLImmediate.TexEnvJIT.setGLSLVars(uTexUnitPrefix, vTexCoordPrefix, vPrimColor, uTexMatrixPrefix);
     var fsTexEnvPass = GLImmediate.TexEnvJIT.genAllPassLines("gl_FragColor", 2);
     var texUnitAttribList = "";
     var texUnitVaryingList = "";
     var texUnitUniformList = "";
     var vsTexCoordInits = "";
     this.usedTexUnitList = GLImmediate.TexEnvJIT.getUsedTexUnitList();
     for (var i = 0; i < this.usedTexUnitList.length; i++) {
      var texUnit = this.usedTexUnitList[i];
      texUnitAttribList += "attribute vec4 " + aTexCoordPrefix + texUnit + ";\n";
      texUnitVaryingList += "varying vec4 " + vTexCoordPrefix + texUnit + ";\n";
      texUnitUniformList += "uniform sampler2D " + uTexUnitPrefix + texUnit + ";\n";
      vsTexCoordInits += "  " + vTexCoordPrefix + texUnit + " = " + aTexCoordPrefix + texUnit + ";\n";
      if (GLImmediate.useTextureMatrix) {
       texUnitUniformList += "uniform mat4 " + uTexMatrixPrefix + texUnit + ";\n";
      }
     }
     var vsFogVaryingInit = null;
     if (GLEmulation.fogEnabled) {
      vsFogVaryingInit = "  v_fogFragCoord = abs(ecPosition.z);\n";
     }
     var vsPointSizeDefs = null;
     var vsPointSizeInit = null;
     if (GLImmediate.mode == GLctx.POINTS) {
      vsPointSizeDefs = "uniform float u_pointSize;\n";
      vsPointSizeInit = "  gl_PointSize = u_pointSize;\n";
     }
     var vsClipPlaneDefs = "";
     var vsClipPlaneInit = "";
     var fsClipPlaneDefs = "";
     var fsClipPlanePass = "";
     for (var clipPlaneId = 0; clipPlaneId < GLEmulation.MAX_CLIP_PLANES; clipPlaneId++) {
      if (GLEmulation.clipPlaneEnabled[clipPlaneId]) {
       vsClipPlaneDefs += "uniform vec4 u_clipPlaneEquation" + clipPlaneId + ";";
       vsClipPlaneDefs += "varying float v_clipDistance" + clipPlaneId + ";";
       vsClipPlaneInit += "  v_clipDistance" + clipPlaneId + " = dot(ecPosition, u_clipPlaneEquation" + clipPlaneId + ");";
       fsClipPlaneDefs += "varying float v_clipDistance" + clipPlaneId + ";";
       fsClipPlanePass += "  if (v_clipDistance" + clipPlaneId + " < 0.0) discard;";
      }
     }
     var vsLightingDefs = "";
     var vsLightingPass = "";
     if (GLEmulation.lightingEnabled) {
      vsLightingDefs += "attribute vec3 a_normal;";
      vsLightingDefs += "uniform mat3 u_normalMatrix;";
      vsLightingDefs += "uniform vec4 u_lightModelAmbient;";
      vsLightingDefs += "uniform vec4 u_materialAmbient;";
      vsLightingDefs += "uniform vec4 u_materialDiffuse;";
      vsLightingDefs += "uniform vec4 u_materialSpecular;";
      vsLightingDefs += "uniform float u_materialShininess;";
      vsLightingDefs += "uniform vec4 u_materialEmission;";
      vsLightingPass += "  vec3 ecNormal = normalize(u_normalMatrix * a_normal);";
      vsLightingPass += "  v_color.w = u_materialDiffuse.w;";
      vsLightingPass += "  v_color.xyz = u_materialEmission.xyz;";
      vsLightingPass += "  v_color.xyz += u_lightModelAmbient.xyz * u_materialAmbient.xyz;";
      for (var lightId = 0; lightId < GLEmulation.MAX_LIGHTS; lightId++) {
       if (GLEmulation.lightEnabled[lightId]) {
        vsLightingDefs += "uniform vec4 u_lightAmbient" + lightId + ";";
        vsLightingDefs += "uniform vec4 u_lightDiffuse" + lightId + ";";
        vsLightingDefs += "uniform vec4 u_lightSpecular" + lightId + ";";
        vsLightingDefs += "uniform vec4 u_lightPosition" + lightId + ";";
        vsLightingPass += "  {";
        vsLightingPass += "    vec3 lightDirection = normalize(u_lightPosition" + lightId + ").xyz;";
        vsLightingPass += "    vec3 halfVector = normalize(lightDirection + vec3(0,0,1));";
        vsLightingPass += "    vec3 ambient = u_lightAmbient" + lightId + ".xyz * u_materialAmbient.xyz;";
        vsLightingPass += "    float diffuseI = max(dot(ecNormal, lightDirection), 0.0);";
        vsLightingPass += "    float specularI = max(dot(ecNormal, halfVector), 0.0);";
        vsLightingPass += "    vec3 diffuse = diffuseI * u_lightDiffuse" + lightId + ".xyz * u_materialDiffuse.xyz;";
        vsLightingPass += "    specularI = (diffuseI > 0.0 && specularI > 0.0) ? exp(u_materialShininess * log(specularI)) : 0.0;";
        vsLightingPass += "    vec3 specular = specularI * u_lightSpecular" + lightId + ".xyz * u_materialSpecular.xyz;";
        vsLightingPass += "    v_color.xyz += ambient + diffuse + specular;";
        vsLightingPass += "  }";
       }
      }
      vsLightingPass += "  v_color = clamp(v_color, 0.0, 1.0);";
     }
     var vsSource = [ "attribute vec4 a_position;", "attribute vec4 a_color;", "varying vec4 v_color;", texUnitAttribList, texUnitVaryingList, (GLEmulation.fogEnabled ? "varying float v_fogFragCoord;" : null), "uniform mat4 u_modelView;", "uniform mat4 u_projection;", vsPointSizeDefs, vsClipPlaneDefs, vsLightingDefs, "void main()", "{", "  vec4 ecPosition = u_modelView * a_position;",  "  gl_Position = u_projection * ecPosition;", "  v_color = a_color;", vsTexCoordInits, vsFogVaryingInit, vsPointSizeInit, vsClipPlaneInit, vsLightingPass, "}", "" ].join("\n").replace(/\n\n+/g, "\n");
     this.vertexShader = GLctx.createShader(GLctx.VERTEX_SHADER);
     GLctx.shaderSource(this.vertexShader, vsSource);
     GLctx.compileShader(this.vertexShader);
     var fogHeaderIfNeeded = null;
     if (GLEmulation.fogEnabled) {
      fogHeaderIfNeeded = [ "", "varying float v_fogFragCoord; ", "uniform vec4 u_fogColor;      ", "uniform float u_fogEnd;       ", "uniform float u_fogScale;     ", "uniform float u_fogDensity;   ", "float ffog(in float ecDistance) { ", fogFormula, "  fog = clamp(fog, 0.0, 1.0); ", "  return fog;                 ", "}", "" ].join("\n");
     }
     var fogPass = null;
     if (GLEmulation.fogEnabled) {
      fogPass = "gl_FragColor = vec4(mix(u_fogColor.rgb, gl_FragColor.rgb, ffog(v_fogFragCoord)), gl_FragColor.a);\n";
     }
     var fsAlphaTestDefs = "";
     var fsAlphaTestPass = "";
     if (GLEmulation.alphaTestEnabled) {
      fsAlphaTestDefs = "uniform float u_alphaTestRef;";
      switch (GLEmulation.alphaTestFunc) {
      case 512:
       fsAlphaTestPass = "discard;";
       break;

      case 513:
       fsAlphaTestPass = "if (!(gl_FragColor.a < u_alphaTestRef)) { discard; }";
       break;

      case 514:
       fsAlphaTestPass = "if (!(gl_FragColor.a == u_alphaTestRef)) { discard; }";
       break;

      case 515:
       fsAlphaTestPass = "if (!(gl_FragColor.a <= u_alphaTestRef)) { discard; }";
       break;

      case 516:
       fsAlphaTestPass = "if (!(gl_FragColor.a > u_alphaTestRef)) { discard; }";
       break;

      case 517:
       fsAlphaTestPass = "if (!(gl_FragColor.a != u_alphaTestRef)) { discard; }";
       break;

      case 518:
       fsAlphaTestPass = "if (!(gl_FragColor.a >= u_alphaTestRef)) { discard; }";
       break;

      case 519:
       fsAlphaTestPass = "";
       break;
      }
     }
     var fsSource = [ "precision mediump float;", texUnitVaryingList, texUnitUniformList, "varying vec4 v_color;", fogHeaderIfNeeded, fsClipPlaneDefs, fsAlphaTestDefs, "void main()", "{", fsClipPlanePass, fsTexEnvPass, fogPass, fsAlphaTestPass, "}", "" ].join("\n").replace(/\n\n+/g, "\n");
     this.fragmentShader = GLctx.createShader(GLctx.FRAGMENT_SHADER);
     GLctx.shaderSource(this.fragmentShader, fsSource);
     GLctx.compileShader(this.fragmentShader);
     this.program = GLctx.createProgram();
     GLctx.attachShader(this.program, this.vertexShader);
     GLctx.attachShader(this.program, this.fragmentShader);
     GLctx.bindAttribLocation(this.program, GLImmediate.VERTEX, "a_position");
     GLctx.bindAttribLocation(this.program, GLImmediate.COLOR, "a_color");
     GLctx.bindAttribLocation(this.program, GLImmediate.NORMAL, "a_normal");
     var maxVertexAttribs = GLctx.getParameter(GLctx.MAX_VERTEX_ATTRIBS);
     for (var i = 0; i < GLImmediate.MAX_TEXTURES && GLImmediate.TEXTURE0 + i < maxVertexAttribs; i++) {
      GLctx.bindAttribLocation(this.program, GLImmediate.TEXTURE0 + i, "a_texCoord" + i);
      GLctx.bindAttribLocation(this.program, GLImmediate.TEXTURE0 + i, aTexCoordPrefix + i);
     }
     GLctx.linkProgram(this.program);
    }
    this.textureMatrixVersion = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.positionLocation = GLctx.getAttribLocation(this.program, "a_position");
    this.texCoordLocations = [];
    for (var i = 0; i < GLImmediate.MAX_TEXTURES; i++) {
     if (!GLImmediate.enabledClientAttributes[GLImmediate.TEXTURE0 + i]) {
      this.texCoordLocations[i] = -1;
      continue;
     }
     if (useCurrProgram) {
      this.texCoordLocations[i] = GLctx.getAttribLocation(this.program, `a_texCoord${i}`);
     } else {
      this.texCoordLocations[i] = GLctx.getAttribLocation(this.program, aTexCoordPrefix + i);
     }
    }
    this.colorLocation = GLctx.getAttribLocation(this.program, "a_color");
    if (!useCurrProgram) {
     var prevBoundProg = GLctx.getParameter(GLctx.CURRENT_PROGRAM);
     GLctx.useProgram(this.program);
     {
      for (var i = 0; i < this.usedTexUnitList.length; i++) {
       var texUnitID = this.usedTexUnitList[i];
       var texSamplerLoc = GLctx.getUniformLocation(this.program, uTexUnitPrefix + texUnitID);
       GLctx.uniform1i(texSamplerLoc, texUnitID);
      }
     }
     GLctx.vertexAttrib4fv(this.colorLocation, [ 1, 1, 1, 1 ]);
     GLctx.useProgram(prevBoundProg);
    }
    this.textureMatrixLocations = [];
    for (var i = 0; i < GLImmediate.MAX_TEXTURES; i++) {
     this.textureMatrixLocations[i] = GLctx.getUniformLocation(this.program, `u_textureMatrix${i}`);
    }
    this.normalLocation = GLctx.getAttribLocation(this.program, "a_normal");
    this.modelViewLocation = GLctx.getUniformLocation(this.program, "u_modelView");
    this.projectionLocation = GLctx.getUniformLocation(this.program, "u_projection");
    this.normalMatrixLocation = GLctx.getUniformLocation(this.program, "u_normalMatrix");
    this.hasTextures = hasTextures;
    this.hasNormal = GLImmediate.enabledClientAttributes[GLImmediate.NORMAL] && GLImmediate.clientAttributes[GLImmediate.NORMAL].size > 0 && this.normalLocation >= 0;
    this.hasColor = (this.colorLocation === 0) || this.colorLocation > 0;
    this.floatType = GLctx.FLOAT;
    this.fogColorLocation = GLctx.getUniformLocation(this.program, "u_fogColor");
    this.fogEndLocation = GLctx.getUniformLocation(this.program, "u_fogEnd");
    this.fogScaleLocation = GLctx.getUniformLocation(this.program, "u_fogScale");
    this.fogDensityLocation = GLctx.getUniformLocation(this.program, "u_fogDensity");
    this.hasFog = !!(this.fogColorLocation || this.fogEndLocation || this.fogScaleLocation || this.fogDensityLocation);
    this.pointSizeLocation = GLctx.getUniformLocation(this.program, "u_pointSize");
    this.hasClipPlane = false;
    this.clipPlaneEquationLocation = [];
    for (var clipPlaneId = 0; clipPlaneId < GLEmulation.MAX_CLIP_PLANES; clipPlaneId++) {
     this.clipPlaneEquationLocation[clipPlaneId] = GLctx.getUniformLocation(this.program, `u_clipPlaneEquation${clipPlaneId}`);
     this.hasClipPlane = (this.hasClipPlane || this.clipPlaneEquationLocation[clipPlaneId]);
    }
    this.hasLighting = GLEmulation.lightingEnabled;
    this.lightModelAmbientLocation = GLctx.getUniformLocation(this.program, "u_lightModelAmbient");
    this.materialAmbientLocation = GLctx.getUniformLocation(this.program, "u_materialAmbient");
    this.materialDiffuseLocation = GLctx.getUniformLocation(this.program, "u_materialDiffuse");
    this.materialSpecularLocation = GLctx.getUniformLocation(this.program, "u_materialSpecular");
    this.materialShininessLocation = GLctx.getUniformLocation(this.program, "u_materialShininess");
    this.materialEmissionLocation = GLctx.getUniformLocation(this.program, "u_materialEmission");
    this.lightAmbientLocation = [];
    this.lightDiffuseLocation = [];
    this.lightSpecularLocation = [];
    this.lightPositionLocation = [];
    for (var lightId = 0; lightId < GLEmulation.MAX_LIGHTS; lightId++) {
     this.lightAmbientLocation[lightId] = GLctx.getUniformLocation(this.program, `u_lightAmbient${lightId}`);
     this.lightDiffuseLocation[lightId] = GLctx.getUniformLocation(this.program, `u_lightDiffuse${lightId}`);
     this.lightSpecularLocation[lightId] = GLctx.getUniformLocation(this.program, `u_lightSpecular${lightId}`);
     this.lightPositionLocation[lightId] = GLctx.getUniformLocation(this.program, `u_lightPosition${lightId}`);
    }
    this.hasAlphaTest = GLEmulation.alphaTestEnabled;
    this.alphaTestRefLocation = GLctx.getUniformLocation(this.program, "u_alphaTestRef");
   };
   this.prepare = function() {
    var arrayBuffer;
    if (!GLctx.currentArrayBufferBinding) {
     var start = GLImmediate.firstVertex * GLImmediate.stride;
     var end = GLImmediate.lastVertex * GLImmediate.stride;
     arrayBuffer = GL.getTempVertexBuffer(end);
    } else  {
     arrayBuffer = GLctx.currentArrayBufferBinding;
    }
    var lastRenderer = GLImmediate.lastRenderer;
    var canSkip = this == lastRenderer && arrayBuffer == GLImmediate.lastArrayBuffer && (GL.currProgram || this.program) == GLImmediate.lastProgram && GLImmediate.stride == GLImmediate.lastStride && !GLImmediate.matricesModified;
    if (!canSkip && lastRenderer) lastRenderer.cleanup();
    if (!GLctx.currentArrayBufferBinding) {
     if (arrayBuffer != GLImmediate.lastArrayBuffer) {
      GLctx.bindBuffer(GLctx.ARRAY_BUFFER, arrayBuffer);
      GLImmediate.lastArrayBuffer = arrayBuffer;
     }
     GLctx.bufferSubData(GLctx.ARRAY_BUFFER, start, GLImmediate.vertexData.subarray(start >> 2, end >> 2));
    }
    if (canSkip) return;
    GLImmediate.lastRenderer = this;
    GLImmediate.lastProgram = GL.currProgram || this.program;
    GLImmediate.lastStride = GLImmediate.stride;
    GLImmediate.matricesModified = false;
    if (!GL.currProgram) {
     if (GLImmediate.fixedFunctionProgram != this.program) {
      GLctx.useProgram(this.program);
      GLImmediate.fixedFunctionProgram = this.program;
     }
    }
    if (this.modelViewLocation && this.modelViewMatrixVersion != GLImmediate.matrixVersion[0]) /*m*/ {
     this.modelViewMatrixVersion = GLImmediate.matrixVersion[0];
     /*m*/ GLctx.uniformMatrix4fv(this.modelViewLocation, false, GLImmediate.matrix[0]);
     if (GLEmulation.lightEnabled) {
      var tmpMVinv = GLImmediate.matrixLib.mat4.create(GLImmediate.matrix[0]);
      GLImmediate.matrixLib.mat4.inverse(tmpMVinv);
      GLImmediate.matrixLib.mat4.transpose(tmpMVinv);
      GLctx.uniformMatrix3fv(this.normalMatrixLocation, false, GLImmediate.matrixLib.mat4.toMat3(tmpMVinv));
     }
    }
    if (this.projectionLocation && this.projectionMatrixVersion != GLImmediate.matrixVersion[1]) /*p*/ {
     this.projectionMatrixVersion = GLImmediate.matrixVersion[1];
     /*p*/ GLctx.uniformMatrix4fv(this.projectionLocation, false, GLImmediate.matrix[1]);
    }
    var clientAttributes = GLImmediate.clientAttributes;
    var posAttr = clientAttributes[GLImmediate.VERTEX];
    GLctx.vertexAttribPointer(this.positionLocation, posAttr.size, posAttr.type, false, GLImmediate.stride, posAttr.offset);
    GLctx.enableVertexAttribArray(this.positionLocation);
    if (this.hasNormal) {
     var normalAttr = clientAttributes[GLImmediate.NORMAL];
     GLctx.vertexAttribPointer(this.normalLocation, normalAttr.size, normalAttr.type, true, GLImmediate.stride, normalAttr.offset);
     GLctx.enableVertexAttribArray(this.normalLocation);
    }
    if (this.hasTextures) {
     for (var i = 0; i < GLImmediate.MAX_TEXTURES; i++) {
      var attribLoc = this.texCoordLocations[i];
      if (attribLoc === undefined || attribLoc < 0) continue;
      var texAttr = clientAttributes[GLImmediate.TEXTURE0 + i];
      if (texAttr.size) {
       GLctx.vertexAttribPointer(attribLoc, texAttr.size, texAttr.type, false, GLImmediate.stride, texAttr.offset);
       GLctx.enableVertexAttribArray(attribLoc);
      } else {
       GLctx.vertexAttrib4f(attribLoc, 0, 0, 0, 1);
       GLctx.disableVertexAttribArray(attribLoc);
      }
      var t = 2 + /*t*/ i;
      if (this.textureMatrixLocations[i] && this.textureMatrixVersion[t] != GLImmediate.matrixVersion[t]) {
       this.textureMatrixVersion[t] = GLImmediate.matrixVersion[t];
       GLctx.uniformMatrix4fv(this.textureMatrixLocations[i], false, GLImmediate.matrix[t]);
      }
     }
    }
    if (GLImmediate.enabledClientAttributes[GLImmediate.COLOR]) {
     var colorAttr = clientAttributes[GLImmediate.COLOR];
     GLctx.vertexAttribPointer(this.colorLocation, colorAttr.size, colorAttr.type, true, GLImmediate.stride, colorAttr.offset);
     GLctx.enableVertexAttribArray(this.colorLocation);
    } else if (this.hasColor) {
     GLctx.disableVertexAttribArray(this.colorLocation);
     GLctx.vertexAttrib4fv(this.colorLocation, GLImmediate.clientColor);
    }
    if (this.hasFog) {
     if (this.fogColorLocation) GLctx.uniform4fv(this.fogColorLocation, GLEmulation.fogColor);
     if (this.fogEndLocation) GLctx.uniform1f(this.fogEndLocation, GLEmulation.fogEnd);
     if (this.fogScaleLocation) GLctx.uniform1f(this.fogScaleLocation, 1 / (GLEmulation.fogEnd - GLEmulation.fogStart));
     if (this.fogDensityLocation) GLctx.uniform1f(this.fogDensityLocation, GLEmulation.fogDensity);
    }
    if (this.hasClipPlane) {
     for (var clipPlaneId = 0; clipPlaneId < GLEmulation.MAX_CLIP_PLANES; clipPlaneId++) {
      if (this.clipPlaneEquationLocation[clipPlaneId]) GLctx.uniform4fv(this.clipPlaneEquationLocation[clipPlaneId], GLEmulation.clipPlaneEquation[clipPlaneId]);
     }
    }
    if (this.hasLighting) {
     if (this.lightModelAmbientLocation) GLctx.uniform4fv(this.lightModelAmbientLocation, GLEmulation.lightModelAmbient);
     if (this.materialAmbientLocation) GLctx.uniform4fv(this.materialAmbientLocation, GLEmulation.materialAmbient);
     if (this.materialDiffuseLocation) GLctx.uniform4fv(this.materialDiffuseLocation, GLEmulation.materialDiffuse);
     if (this.materialSpecularLocation) GLctx.uniform4fv(this.materialSpecularLocation, GLEmulation.materialSpecular);
     if (this.materialShininessLocation) GLctx.uniform1f(this.materialShininessLocation, GLEmulation.materialShininess[0]);
     if (this.materialEmissionLocation) GLctx.uniform4fv(this.materialEmissionLocation, GLEmulation.materialEmission);
     for (var lightId = 0; lightId < GLEmulation.MAX_LIGHTS; lightId++) {
      if (this.lightAmbientLocation[lightId]) GLctx.uniform4fv(this.lightAmbientLocation[lightId], GLEmulation.lightAmbient[lightId]);
      if (this.lightDiffuseLocation[lightId]) GLctx.uniform4fv(this.lightDiffuseLocation[lightId], GLEmulation.lightDiffuse[lightId]);
      if (this.lightSpecularLocation[lightId]) GLctx.uniform4fv(this.lightSpecularLocation[lightId], GLEmulation.lightSpecular[lightId]);
      if (this.lightPositionLocation[lightId]) GLctx.uniform4fv(this.lightPositionLocation[lightId], GLEmulation.lightPosition[lightId]);
     }
    }
    if (this.hasAlphaTest) {
     if (this.alphaTestRefLocation) GLctx.uniform1f(this.alphaTestRefLocation, GLEmulation.alphaTestRef);
    }
    if (GLImmediate.mode == GLctx.POINTS) {
     if (this.pointSizeLocation) {
      GLctx.uniform1f(this.pointSizeLocation, GLEmulation.pointSize);
     }
    }
   };
   this.cleanup = function() {
    GLctx.disableVertexAttribArray(this.positionLocation);
    if (this.hasTextures) {
     for (var i = 0; i < GLImmediate.MAX_TEXTURES; i++) {
      if (GLImmediate.enabledClientAttributes[GLImmediate.TEXTURE0 + i] && this.texCoordLocations[i] >= 0) {
       GLctx.disableVertexAttribArray(this.texCoordLocations[i]);
      }
     }
    }
    if (this.hasColor) {
     GLctx.disableVertexAttribArray(this.colorLocation);
    }
    if (this.hasNormal) {
     GLctx.disableVertexAttribArray(this.normalLocation);
    }
    if (!GL.currProgram) {
     GLctx.useProgram(null);
     GLImmediate.fixedFunctionProgram = 0;
    }
    if (!GLctx.currentArrayBufferBinding) {
     GLctx.bindBuffer(GLctx.ARRAY_BUFFER, null);
     GLImmediate.lastArrayBuffer = null;
    }
    GLImmediate.lastRenderer = null;
    GLImmediate.lastProgram = null;
    GLImmediate.matricesModified = true;
   };
   this.init();
  }
  return new Renderer;
 },
 setupFuncs() {
  GLImmediate.MapTreeLib = GLImmediate.spawnMapTreeLib();
  GLImmediate.spawnMapTreeLib = null;
  GLImmediate.TexEnvJIT = GLImmediate.spawnTexEnvJIT();
  GLImmediate.spawnTexEnvJIT = null;
  GLImmediate.setupHooks();
 },
 setupHooks() {
  if (!GLEmulation.hasRunInit) {
   GLEmulation.init();
  }
  var glActiveTexture = _glActiveTexture;
  _glActiveTexture = _emscripten_glActiveTexture = texture => {
   GLImmediate.TexEnvJIT.hook_activeTexture(texture);
   glActiveTexture(texture);
  };
  var glEnable = _glEnable;
  _glEnable = _emscripten_glEnable = cap => {
   GLImmediate.TexEnvJIT.hook_enable(cap);
   glEnable(cap);
  };
  var glDisable = _glDisable;
  _glDisable = _emscripten_glDisable = cap => {
   GLImmediate.TexEnvJIT.hook_disable(cap);
   glDisable(cap);
  };
  var glTexEnvf = (typeof _glTexEnvf != "undefined") ? _glTexEnvf : () => {};
  /** @suppress {checkTypes} */ _glTexEnvf = _emscripten_glTexEnvf = (target, pname, param) => {
   GLImmediate.TexEnvJIT.hook_texEnvf(target, pname, param);
  };
  var glTexEnvi = (typeof _glTexEnvi != "undefined") ? _glTexEnvi : () => {};
  /** @suppress {checkTypes} */ _glTexEnvi = _emscripten_glTexEnvi = (target, pname, param) => {
   GLImmediate.TexEnvJIT.hook_texEnvi(target, pname, param);
  };
  var glTexEnvfv = (typeof _glTexEnvfv != "undefined") ? _glTexEnvfv : () => {};
  /** @suppress {checkTypes} */ _glTexEnvfv = _emscripten_glTexEnvfv = (target, pname, param) => {
   GLImmediate.TexEnvJIT.hook_texEnvfv(target, pname, param);
  };
  _glGetTexEnviv = (target, pname, param) => {
   GLImmediate.TexEnvJIT.hook_getTexEnviv(target, pname, param);
  };
  _glGetTexEnvfv = (target, pname, param) => {
   GLImmediate.TexEnvJIT.hook_getTexEnvfv(target, pname, param);
  };
  var glGetIntegerv = _glGetIntegerv;
  _glGetIntegerv = _emscripten_glGetIntegerv = (pname, params) => {
   switch (pname) {
   case 35725:
    {
     var cur = GLctx.getParameter(GLctx.CURRENT_PROGRAM);
     if (cur == GLImmediate.fixedFunctionProgram) {
      GROWABLE_HEAP_I32()[((params) >> 2)] = 0;
      return;
     }
     break;
    }
   }
   glGetIntegerv(pname, params);
  };
 },
 initted: false,
 init() {
  err("WARNING: using emscripten GL immediate mode emulation. This is very limited in what it supports");
  GLImmediate.initted = true;
  if (!Module.useWebGL) return;
  GLImmediate.MAX_TEXTURES = Math.min(Module["GL_MAX_TEXTURE_IMAGE_UNITS"] || GLctx.getParameter(GLctx.MAX_TEXTURE_IMAGE_UNITS), 28);
  GLImmediate.TexEnvJIT.init(GLctx, GLImmediate.MAX_TEXTURES);
  GLImmediate.NUM_ATTRIBUTES = 3 + /*pos+normal+color attributes*/ GLImmediate.MAX_TEXTURES;
  GLImmediate.clientAttributes = [];
  GLEmulation.enabledClientAttribIndices = [];
  for (var i = 0; i < GLImmediate.NUM_ATTRIBUTES; i++) {
   GLImmediate.clientAttributes.push({});
   GLEmulation.enabledClientAttribIndices.push(false);
  }
  GLImmediate.matrix = [];
  GLImmediate.matrixStack = [];
  GLImmediate.matrixVersion = [];
  for (var i = 0; i < 2 + GLImmediate.MAX_TEXTURES; i++) {
   GLImmediate.matrixStack.push([]);
   GLImmediate.matrixVersion.push(0);
   GLImmediate.matrix.push(GLImmediate.matrixLib.mat4.create());
   GLImmediate.matrixLib.mat4.identity(GLImmediate.matrix[i]);
  }
  GLImmediate.rendererCache = GLImmediate.MapTreeLib.create();
  GLImmediate.tempData = new Float32Array(GL.MAX_TEMP_BUFFER_SIZE >> 2);
  GLImmediate.indexData = new Uint16Array(GL.MAX_TEMP_BUFFER_SIZE >> 1);
  GLImmediate.vertexDataU8 = new Uint8Array(GLImmediate.tempData.buffer);
  GL.generateTempBuffers(true, GL.currentContext);
  GLImmediate.clientColor = new Float32Array([ 1, 1, 1, 1 ]);
 },
 prepareClientAttributes(count, beginEnd) {
  if (!GLImmediate.modifiedClientAttributes) {
   GLImmediate.vertexCounter = (GLImmediate.stride * count) / 4;
   return;
  }
  GLImmediate.modifiedClientAttributes = false;
  var clientStartPointer = 2147483647;
  var bytes = 0;
  var minStride = 2147483647;
  var maxStride = 0;
  var attributes = GLImmediate.liveClientAttributes;
  attributes.length = 0;
  for (var i = 0; i < 3 + GLImmediate.MAX_TEXTURES; i++) {
   if (GLImmediate.enabledClientAttributes[i]) {
    var attr = GLImmediate.clientAttributes[i];
    attributes.push(attr);
    clientStartPointer = Math.min(clientStartPointer, attr.pointer);
    attr.sizeBytes = attr.size * GL.byteSizeByType[attr.type - GL.byteSizeByTypeRoot];
    bytes += attr.sizeBytes;
    minStride = Math.min(minStride, attr.stride);
    maxStride = Math.max(maxStride, attr.stride);
   }
  }
  if ((minStride != maxStride || maxStride < bytes) && !beginEnd) {
   GLImmediate.restrideBuffer ||= _malloc(GL.MAX_TEMP_BUFFER_SIZE);
   var start = GLImmediate.restrideBuffer;
   bytes = 0;
   for (var i = 0; i < attributes.length; i++) {
    var attr = attributes[i];
    var size = attr.sizeBytes;
    if (size % 4 != 0) size += 4 - (size % 4);
    attr.offset = bytes;
    bytes += size;
   }
   for (var i = 0; i < attributes.length; i++) {
    var attr = attributes[i];
    var srcStride = Math.max(attr.sizeBytes, attr.stride);
    if ((srcStride & 3) == 0 && (attr.sizeBytes & 3) == 0) {
     var size4 = attr.sizeBytes >> 2;
     var srcStride4 = Math.max(attr.sizeBytes, attr.stride) >> 2;
     for (var j = 0; j < count; j++) {
      for (var k = 0; k < size4; k++) {
       GROWABLE_HEAP_I32()[((start + attr.offset + bytes * j) >> 2) + k] = GROWABLE_HEAP_I32()[(attr.pointer >> 2) + j * srcStride4 + k];
      }
     }
    } else {
     for (var j = 0; j < count; j++) {
      for (var k = 0; k < attr.sizeBytes; k++) {
       GROWABLE_HEAP_I8()[start + attr.offset + bytes * j + k] = GROWABLE_HEAP_I8()[attr.pointer + j * srcStride + k];
      }
     }
    }
    attr.pointer = start + attr.offset;
   }
   GLImmediate.stride = bytes;
   GLImmediate.vertexPointer = start;
  } else {
   if (GLctx.currentArrayBufferBinding) {
    GLImmediate.vertexPointer = 0;
   } else {
    GLImmediate.vertexPointer = clientStartPointer;
   }
   for (var i = 0; i < attributes.length; i++) {
    var attr = attributes[i];
    attr.offset = attr.pointer - GLImmediate.vertexPointer;
   }
   GLImmediate.stride = Math.max(maxStride, bytes);
  }
  if (!beginEnd) {
   GLImmediate.vertexCounter = (GLImmediate.stride * count) / 4;
  }
 },
 flush(numProvidedIndexes, startIndex = 0, ptr = 0) {
  var renderer = GLImmediate.getRenderer();
  var numVertexes = 4 * GLImmediate.vertexCounter / GLImmediate.stride;
  if (!numVertexes) return;
  var emulatedElementArrayBuffer = false;
  var numIndexes = 0;
  if (numProvidedIndexes) {
   numIndexes = numProvidedIndexes;
   if (!GLctx.currentArrayBufferBinding && GLImmediate.firstVertex > GLImmediate.lastVertex) {
    for (var i = 0; i < numProvidedIndexes; i++) {
     var currIndex = GROWABLE_HEAP_U16()[(((ptr) + (i * 2)) >> 1)];
     GLImmediate.firstVertex = Math.min(GLImmediate.firstVertex, currIndex);
     GLImmediate.lastVertex = Math.max(GLImmediate.lastVertex, currIndex + 1);
    }
   }
   if (!GLctx.currentElementArrayBufferBinding) {
    var indexBuffer = GL.getTempIndexBuffer(numProvidedIndexes << 1);
    GLctx.bindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, indexBuffer);
    GLctx.bufferSubData(GLctx.ELEMENT_ARRAY_BUFFER, 0, GROWABLE_HEAP_U16().subarray((ptr) >> 1, (ptr + (numProvidedIndexes << 1)) >> 1));
    ptr = 0;
    emulatedElementArrayBuffer = true;
   }
  } else if (GLImmediate.mode > 6) {
   if (GLImmediate.mode != 7) throw "unsupported immediate mode " + GLImmediate.mode;
   ptr = GLImmediate.firstVertex * 3;
   var numQuads = numVertexes / 4;
   numIndexes = numQuads * 6;
   GLctx.bindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, GL.currentContext.tempQuadIndexBuffer);
   emulatedElementArrayBuffer = true;
   GLImmediate.mode = GLctx.TRIANGLES;
  }
  renderer.prepare();
  if (numIndexes) {
   GLctx.drawElements(GLImmediate.mode, numIndexes, GLctx.UNSIGNED_SHORT, ptr);
  } else {
   GLctx.drawArrays(GLImmediate.mode, startIndex, numVertexes);
  }
  if (emulatedElementArrayBuffer) {
   GLctx.bindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, GL.buffers[GLctx.currentElementArrayBufferBinding] || null);
  }
 }
};

GLImmediate.matrixLib = (function() {
 /**
   * @class 3 Dimensional Vector
   * @name vec3
   */ var vec3 = {};
 /**
   * @class 3x3 Matrix
   * @name mat3
   */ var mat3 = {};
 /**
   * @class 4x4 Matrix
   * @name mat4
   */ var mat4 = {};
 /**
   * @class Quaternion
   * @name quat4
   */ var quat4 = {};
 var MatrixArray = Float32Array;
 /**
   * Creates a new instance of a vec3 using the default array type
   * Any javascript array-like objects containing at least 3 numeric elements can serve as a vec3
   *
   * _param {vec3} [vec] vec3 containing values to initialize with
   *
   * _returns {vec3} New vec3
   */ vec3.create = function(vec) {
  var dest = new MatrixArray(3);
  if (vec) {
   dest[0] = vec[0];
   dest[1] = vec[1];
   dest[2] = vec[2];
  } else {
   dest[0] = dest[1] = dest[2] = 0;
  }
  return dest;
 };
 /**
   * Copies the values of one vec3 to another
   *
   * _param {vec3} vec vec3 containing values to copy
   * _param {vec3} dest vec3 receiving copied values
   *
   * _returns {vec3} dest
   */ vec3.set = function(vec, dest) {
  dest[0] = vec[0];
  dest[1] = vec[1];
  dest[2] = vec[2];
  return dest;
 };
 /**
   * Performs a vector addition
   *
   * _param {vec3} vec First operand
   * _param {vec3} vec2 Second operand
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.add = function(vec, vec2, dest) {
  if (!dest || vec === dest) {
   vec[0] += vec2[0];
   vec[1] += vec2[1];
   vec[2] += vec2[2];
   return vec;
  }
  dest[0] = vec[0] + vec2[0];
  dest[1] = vec[1] + vec2[1];
  dest[2] = vec[2] + vec2[2];
  return dest;
 };
 /**
   * Performs a vector subtraction
   *
   * _param {vec3} vec First operand
   * _param {vec3} vec2 Second operand
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.subtract = function(vec, vec2, dest) {
  if (!dest || vec === dest) {
   vec[0] -= vec2[0];
   vec[1] -= vec2[1];
   vec[2] -= vec2[2];
   return vec;
  }
  dest[0] = vec[0] - vec2[0];
  dest[1] = vec[1] - vec2[1];
  dest[2] = vec[2] - vec2[2];
  return dest;
 };
 /**
   * Performs a vector multiplication
   *
   * _param {vec3} vec First operand
   * _param {vec3} vec2 Second operand
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.multiply = function(vec, vec2, dest) {
  if (!dest || vec === dest) {
   vec[0] *= vec2[0];
   vec[1] *= vec2[1];
   vec[2] *= vec2[2];
   return vec;
  }
  dest[0] = vec[0] * vec2[0];
  dest[1] = vec[1] * vec2[1];
  dest[2] = vec[2] * vec2[2];
  return dest;
 };
 /**
   * Negates the components of a vec3
   *
   * _param {vec3} vec vec3 to negate
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.negate = function(vec, dest) {
  if (!dest) {
   dest = vec;
  }
  dest[0] = -vec[0];
  dest[1] = -vec[1];
  dest[2] = -vec[2];
  return dest;
 };
 /**
   * Multiplies the components of a vec3 by a scalar value
   *
   * _param {vec3} vec vec3 to scale
   * _param {number} val Value to scale by
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.scale = function(vec, val, dest) {
  if (!dest || vec === dest) {
   vec[0] *= val;
   vec[1] *= val;
   vec[2] *= val;
   return vec;
  }
  dest[0] = vec[0] * val;
  dest[1] = vec[1] * val;
  dest[2] = vec[2] * val;
  return dest;
 };
 /**
   * Generates a unit vector of the same direction as the provided vec3
   * If vector length is 0, returns [0, 0, 0]
   *
   * _param {vec3} vec vec3 to normalize
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.normalize = function(vec, dest) {
  if (!dest) {
   dest = vec;
  }
  var x = vec[0], y = vec[1], z = vec[2], len = Math.sqrt(x * x + y * y + z * z);
  if (!len) {
   dest[0] = 0;
   dest[1] = 0;
   dest[2] = 0;
   return dest;
  } else if (len === 1) {
   dest[0] = x;
   dest[1] = y;
   dest[2] = z;
   return dest;
  }
  len = 1 / len;
  dest[0] = x * len;
  dest[1] = y * len;
  dest[2] = z * len;
  return dest;
 };
 /**
   * Generates the cross product of two vec3s
   *
   * _param {vec3} vec First operand
   * _param {vec3} vec2 Second operand
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.cross = function(vec, vec2, dest) {
  if (!dest) {
   dest = vec;
  }
  var x = vec[0], y = vec[1], z = vec[2], x2 = vec2[0], y2 = vec2[1], z2 = vec2[2];
  dest[0] = y * z2 - z * y2;
  dest[1] = z * x2 - x * z2;
  dest[2] = x * y2 - y * x2;
  return dest;
 };
 /**
   * Caclulates the length of a vec3
   *
   * _param {vec3} vec vec3 to calculate length of
   *
   * _returns {number} Length of vec
   */ vec3.length = function(vec) {
  var x = vec[0], y = vec[1], z = vec[2];
  return Math.sqrt(x * x + y * y + z * z);
 };
 /**
   * Caclulates the dot product of two vec3s
   *
   * _param {vec3} vec First operand
   * _param {vec3} vec2 Second operand
   *
   * _returns {number} Dot product of vec and vec2
   */ vec3.dot = function(vec, vec2) {
  return vec[0] * vec2[0] + vec[1] * vec2[1] + vec[2] * vec2[2];
 };
 /**
   * Generates a unit vector pointing from one vector to another
   *
   * _param {vec3} vec Origin vec3
   * _param {vec3} vec2 vec3 to point to
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.direction = function(vec, vec2, dest) {
  if (!dest) {
   dest = vec;
  }
  var x = vec[0] - vec2[0], y = vec[1] - vec2[1], z = vec[2] - vec2[2], len = Math.sqrt(x * x + y * y + z * z);
  if (!len) {
   dest[0] = 0;
   dest[1] = 0;
   dest[2] = 0;
   return dest;
  }
  len = 1 / len;
  dest[0] = x * len;
  dest[1] = y * len;
  dest[2] = z * len;
  return dest;
 };
 /**
   * Performs a linear interpolation between two vec3
   *
   * _param {vec3} vec First vector
   * _param {vec3} vec2 Second vector
   * _param {number} lerp Interpolation amount between the two inputs
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.lerp = function(vec, vec2, lerp, dest) {
  if (!dest) {
   dest = vec;
  }
  dest[0] = vec[0] + lerp * (vec2[0] - vec[0]);
  dest[1] = vec[1] + lerp * (vec2[1] - vec[1]);
  dest[2] = vec[2] + lerp * (vec2[2] - vec[2]);
  return dest;
 };
 /**
   * Calculates the euclidian distance between two vec3
   *
   * Params:
   * _param {vec3} vec First vector
   * _param {vec3} vec2 Second vector
   *
   * _returns {number} Distance between vec and vec2
   */ vec3.dist = function(vec, vec2) {
  var x = vec2[0] - vec[0], y = vec2[1] - vec[1], z = vec2[2] - vec[2];
  return Math.sqrt(x * x + y * y + z * z);
 };
 /**
   * Projects the specified vec3 from screen space into object space
   * Based on the <a href="http://webcvs.freedesktop.org/mesa/Mesa/src/glu/mesa/project.c?revision=1.4&view=markup">Mesa gluUnProject implementation</a>
   *
   * _param {vec3} vec Screen-space vector to project
   * _param {mat4} view View matrix
   * _param {mat4} proj Projection matrix
   * _param {vec4} viewport Viewport as given to gl.viewport [x, y, width, height]
   * _param {vec3} [dest] vec3 receiving unprojected result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ vec3.unproject = function(vec, view, proj, viewport, dest) {
  if (!dest) {
   dest = vec;
  }
  var m = mat4.create();
  var v = new MatrixArray(4);
  v[0] = (vec[0] - viewport[0]) * 2 / viewport[2] - 1;
  v[1] = (vec[1] - viewport[1]) * 2 / viewport[3] - 1;
  v[2] = 2 * vec[2] - 1;
  v[3] = 1;
  mat4.multiply(proj, view, m);
  if (!mat4.inverse(m)) {
   return null;
  }
  mat4.multiplyVec4(m, v);
  if (v[3] === 0) {
   return null;
  }
  dest[0] = v[0] / v[3];
  dest[1] = v[1] / v[3];
  dest[2] = v[2] / v[3];
  return dest;
 };
 /**
   * Returns a string representation of a vector
   *
   * _param {vec3} vec Vector to represent as a string
   *
   * _returns {string} String representation of vec
   */ vec3.str = function(vec) {
  return "[" + vec[0] + ", " + vec[1] + ", " + vec[2] + "]";
 };
 /**
   * Creates a new instance of a mat3 using the default array type
   * Any javascript array-like object containing at least 9 numeric elements can serve as a mat3
   *
   * _param {mat3} [mat] mat3 containing values to initialize with
   *
   * _returns {mat3} New mat3
   *
   * @param {Object=} mat
   */ mat3.create = function(mat) {
  var dest = new MatrixArray(9);
  if (mat) {
   dest[0] = mat[0];
   dest[1] = mat[1];
   dest[2] = mat[2];
   dest[3] = mat[3];
   dest[4] = mat[4];
   dest[5] = mat[5];
   dest[6] = mat[6];
   dest[7] = mat[7];
   dest[8] = mat[8];
  }
  return dest;
 };
 /**
   * Copies the values of one mat3 to another
   *
   * _param {mat3} mat mat3 containing values to copy
   * _param {mat3} dest mat3 receiving copied values
   *
   * _returns {mat3} dest
   */ mat3.set = function(mat, dest) {
  dest[0] = mat[0];
  dest[1] = mat[1];
  dest[2] = mat[2];
  dest[3] = mat[3];
  dest[4] = mat[4];
  dest[5] = mat[5];
  dest[6] = mat[6];
  dest[7] = mat[7];
  dest[8] = mat[8];
  return dest;
 };
 /**
   * Sets a mat3 to an identity matrix
   *
   * _param {mat3} dest mat3 to set
   *
   * _returns dest if specified, otherwise a new mat3
   */ mat3.identity = function(dest) {
  if (!dest) {
   dest = mat3.create();
  }
  dest[0] = 1;
  dest[1] = 0;
  dest[2] = 0;
  dest[3] = 0;
  dest[4] = 1;
  dest[5] = 0;
  dest[6] = 0;
  dest[7] = 0;
  dest[8] = 1;
  return dest;
 };
 /**
   * Transposes a mat3 (flips the values over the diagonal)
   *
   * Params:
   * _param {mat3} mat mat3 to transpose
   * _param {mat3} [dest] mat3 receiving transposed values. If not specified result is written to mat
   */ mat3.transpose = function(mat, dest) {
  if (!dest || mat === dest) {
   var a01 = mat[1], a02 = mat[2], a12 = mat[5];
   mat[1] = mat[3];
   mat[2] = mat[6];
   mat[3] = a01;
   mat[5] = mat[7];
   mat[6] = a02;
   mat[7] = a12;
   return mat;
  }
  dest[0] = mat[0];
  dest[1] = mat[3];
  dest[2] = mat[6];
  dest[3] = mat[1];
  dest[4] = mat[4];
  dest[5] = mat[7];
  dest[6] = mat[2];
  dest[7] = mat[5];
  dest[8] = mat[8];
  return dest;
 };
 /**
   * Copies the elements of a mat3 into the upper 3x3 elements of a mat4
   *
   * _param {mat3} mat mat3 containing values to copy
   * _param {mat4} [dest] mat4 receiving copied values
   *
   * _returns {mat4} dest if specified, a new mat4 otherwise
   */ mat3.toMat4 = function(mat, dest) {
  if (!dest) {
   dest = mat4.create();
  }
  dest[15] = 1;
  dest[14] = 0;
  dest[13] = 0;
  dest[12] = 0;
  dest[11] = 0;
  dest[10] = mat[8];
  dest[9] = mat[7];
  dest[8] = mat[6];
  dest[7] = 0;
  dest[6] = mat[5];
  dest[5] = mat[4];
  dest[4] = mat[3];
  dest[3] = 0;
  dest[2] = mat[2];
  dest[1] = mat[1];
  dest[0] = mat[0];
  return dest;
 };
 /**
   * Returns a string representation of a mat3
   *
   * _param {mat3} mat mat3 to represent as a string
   *
   * _param {string} String representation of mat
   */ mat3.str = function(mat) {
  return "[" + mat[0] + ", " + mat[1] + ", " + mat[2] + ", " + mat[3] + ", " + mat[4] + ", " + mat[5] + ", " + mat[6] + ", " + mat[7] + ", " + mat[8] + "]";
 };
 /**
   * Creates a new instance of a mat4 using the default array type
   * Any javascript array-like object containing at least 16 numeric elements can serve as a mat4
   *
   * _param {mat4} [mat] mat4 containing values to initialize with
   *
   * _returns {mat4} New mat4
   *
   * @param {Object=} mat
   */ mat4.create = function(mat) {
  var dest = new MatrixArray(16);
  if (mat) {
   dest[0] = mat[0];
   dest[1] = mat[1];
   dest[2] = mat[2];
   dest[3] = mat[3];
   dest[4] = mat[4];
   dest[5] = mat[5];
   dest[6] = mat[6];
   dest[7] = mat[7];
   dest[8] = mat[8];
   dest[9] = mat[9];
   dest[10] = mat[10];
   dest[11] = mat[11];
   dest[12] = mat[12];
   dest[13] = mat[13];
   dest[14] = mat[14];
   dest[15] = mat[15];
  }
  return dest;
 };
 /**
   * Copies the values of one mat4 to another
   *
   * _param {mat4} mat mat4 containing values to copy
   * _param {mat4} dest mat4 receiving copied values
   *
   * _returns {mat4} dest
   */ mat4.set = function(mat, dest) {
  dest[0] = mat[0];
  dest[1] = mat[1];
  dest[2] = mat[2];
  dest[3] = mat[3];
  dest[4] = mat[4];
  dest[5] = mat[5];
  dest[6] = mat[6];
  dest[7] = mat[7];
  dest[8] = mat[8];
  dest[9] = mat[9];
  dest[10] = mat[10];
  dest[11] = mat[11];
  dest[12] = mat[12];
  dest[13] = mat[13];
  dest[14] = mat[14];
  dest[15] = mat[15];
  return dest;
 };
 /**
   * Sets a mat4 to an identity matrix
   *
   * _param {mat4} dest mat4 to set
   *
   * _returns {mat4} dest
   */ mat4.identity = function(dest) {
  if (!dest) {
   dest = mat4.create();
  }
  dest[0] = 1;
  dest[1] = 0;
  dest[2] = 0;
  dest[3] = 0;
  dest[4] = 0;
  dest[5] = 1;
  dest[6] = 0;
  dest[7] = 0;
  dest[8] = 0;
  dest[9] = 0;
  dest[10] = 1;
  dest[11] = 0;
  dest[12] = 0;
  dest[13] = 0;
  dest[14] = 0;
  dest[15] = 1;
  return dest;
 };
 /**
   * Transposes a mat4 (flips the values over the diagonal)
   *
   * _param {mat4} mat mat4 to transpose
   * _param {mat4} [dest] mat4 receiving transposed values. If not specified result is written to mat
   */ mat4.transpose = function(mat, dest) {
  if (!dest || mat === dest) {
   var a01 = mat[1], a02 = mat[2], a03 = mat[3], a12 = mat[6], a13 = mat[7], a23 = mat[11];
   mat[1] = mat[4];
   mat[2] = mat[8];
   mat[3] = mat[12];
   mat[4] = a01;
   mat[6] = mat[9];
   mat[7] = mat[13];
   mat[8] = a02;
   mat[9] = a12;
   mat[11] = mat[14];
   mat[12] = a03;
   mat[13] = a13;
   mat[14] = a23;
   return mat;
  }
  dest[0] = mat[0];
  dest[1] = mat[4];
  dest[2] = mat[8];
  dest[3] = mat[12];
  dest[4] = mat[1];
  dest[5] = mat[5];
  dest[6] = mat[9];
  dest[7] = mat[13];
  dest[8] = mat[2];
  dest[9] = mat[6];
  dest[10] = mat[10];
  dest[11] = mat[14];
  dest[12] = mat[3];
  dest[13] = mat[7];
  dest[14] = mat[11];
  dest[15] = mat[15];
  return dest;
 };
 /**
   * Calculates the determinant of a mat4
   *
   * _param {mat4} mat mat4 to calculate determinant of
   *
   * _returns {number} determinant of mat
   */ mat4.determinant = function(mat) {
  var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3], a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7], a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11], a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
  return (a30 * a21 * a12 * a03 - a20 * a31 * a12 * a03 - a30 * a11 * a22 * a03 + a10 * a31 * a22 * a03 + a20 * a11 * a32 * a03 - a10 * a21 * a32 * a03 - a30 * a21 * a02 * a13 + a20 * a31 * a02 * a13 + a30 * a01 * a22 * a13 - a00 * a31 * a22 * a13 - a20 * a01 * a32 * a13 + a00 * a21 * a32 * a13 + a30 * a11 * a02 * a23 - a10 * a31 * a02 * a23 - a30 * a01 * a12 * a23 + a00 * a31 * a12 * a23 + a10 * a01 * a32 * a23 - a00 * a11 * a32 * a23 - a20 * a11 * a02 * a33 + a10 * a21 * a02 * a33 + a20 * a01 * a12 * a33 - a00 * a21 * a12 * a33 - a10 * a01 * a22 * a33 + a00 * a11 * a22 * a33);
 };
 /**
   * Calculates the inverse matrix of a mat4
   *
   * _param {mat4} mat mat4 to calculate inverse of
   * _param {mat4} [dest] mat4 receiving inverse matrix. If not specified result is written to mat, null if matrix cannot be inverted
   *
   * @param {Object=} dest
   */ mat4.inverse = function(mat, dest) {
  if (!dest) {
   dest = mat;
  }
  var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3], a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7], a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11], a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06), invDet;
  if (!d) {
   return null;
  }
  invDet = 1 / d;
  dest[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
  dest[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
  dest[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
  dest[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
  dest[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
  dest[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
  dest[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
  dest[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
  dest[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
  dest[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
  dest[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
  dest[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
  dest[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
  dest[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
  dest[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
  dest[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;
  return dest;
 };
 /**
   * Copies the upper 3x3 elements of a mat4 into another mat4
   *
   * _param {mat4} mat mat4 containing values to copy
   * _param {mat4} [dest] mat4 receiving copied values
   *
   * _returns {mat4} dest is specified, a new mat4 otherwise
   */ mat4.toRotationMat = function(mat, dest) {
  if (!dest) {
   dest = mat4.create();
  }
  dest[0] = mat[0];
  dest[1] = mat[1];
  dest[2] = mat[2];
  dest[3] = mat[3];
  dest[4] = mat[4];
  dest[5] = mat[5];
  dest[6] = mat[6];
  dest[7] = mat[7];
  dest[8] = mat[8];
  dest[9] = mat[9];
  dest[10] = mat[10];
  dest[11] = mat[11];
  dest[12] = 0;
  dest[13] = 0;
  dest[14] = 0;
  dest[15] = 1;
  return dest;
 };
 /**
   * Copies the upper 3x3 elements of a mat4 into a mat3
   *
   * _param {mat4} mat mat4 containing values to copy
   * _param {mat3} [dest] mat3 receiving copied values
   *
   * _returns {mat3} dest is specified, a new mat3 otherwise
   */ mat4.toMat3 = function(mat, dest) {
  if (!dest) {
   dest = mat3.create();
  }
  dest[0] = mat[0];
  dest[1] = mat[1];
  dest[2] = mat[2];
  dest[3] = mat[4];
  dest[4] = mat[5];
  dest[5] = mat[6];
  dest[6] = mat[8];
  dest[7] = mat[9];
  dest[8] = mat[10];
  return dest;
 };
 /**
   * Calculates the inverse of the upper 3x3 elements of a mat4 and copies the result into a mat3
   * The resulting matrix is useful for calculating transformed normals
   *
   * Params:
   * _param {mat4} mat mat4 containing values to invert and copy
   * _param {mat3} [dest] mat3 receiving values
   *
   * _returns {mat3} dest is specified, a new mat3 otherwise, null if the matrix cannot be inverted
   */ mat4.toInverseMat3 = function(mat, dest) {
  var a00 = mat[0], a01 = mat[1], a02 = mat[2], a10 = mat[4], a11 = mat[5], a12 = mat[6], a20 = mat[8], a21 = mat[9], a22 = mat[10], b01 = a22 * a11 - a12 * a21, b11 = -a22 * a10 + a12 * a20, b21 = a21 * a10 - a11 * a20, d = a00 * b01 + a01 * b11 + a02 * b21, id;
  if (!d) {
   return null;
  }
  id = 1 / d;
  if (!dest) {
   dest = mat3.create();
  }
  dest[0] = b01 * id;
  dest[1] = (-a22 * a01 + a02 * a21) * id;
  dest[2] = (a12 * a01 - a02 * a11) * id;
  dest[3] = b11 * id;
  dest[4] = (a22 * a00 - a02 * a20) * id;
  dest[5] = (-a12 * a00 + a02 * a10) * id;
  dest[6] = b21 * id;
  dest[7] = (-a21 * a00 + a01 * a20) * id;
  dest[8] = (a11 * a00 - a01 * a10) * id;
  return dest;
 };
 /**
   * Performs a matrix multiplication
   *
   * _param {mat4} mat First operand
   * _param {mat4} mat2 Second operand
   * _param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
   */ mat4.multiply = function(mat, mat2, dest) {
  if (!dest) {
   dest = mat;
  }
  var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3], a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7], a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11], a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15], b00 = mat2[0], b01 = mat2[1], b02 = mat2[2], b03 = mat2[3], b10 = mat2[4], b11 = mat2[5], b12 = mat2[6], b13 = mat2[7], b20 = mat2[8], b21 = mat2[9], b22 = mat2[10], b23 = mat2[11], b30 = mat2[12], b31 = mat2[13], b32 = mat2[14], b33 = mat2[15];
  dest[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
  dest[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
  dest[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
  dest[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
  dest[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
  dest[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
  dest[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
  dest[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
  dest[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
  dest[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
  dest[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
  dest[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
  dest[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
  dest[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
  dest[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
  dest[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  return dest;
 };
 /**
   * Transforms a vec3 with the given matrix
   * 4th vector component is implicitly '1'
   *
   * _param {mat4} mat mat4 to transform the vector with
   * _param {vec3} vec vec3 to transform
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec3} dest if specified, vec otherwise
   */ mat4.multiplyVec3 = function(mat, vec, dest) {
  if (!dest) {
   dest = vec;
  }
  var x = vec[0], y = vec[1], z = vec[2];
  dest[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
  dest[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
  dest[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
  return dest;
 };
 /**
   * Transforms a vec4 with the given matrix
   *
   * _param {mat4} mat mat4 to transform the vector with
   * _param {vec4} vec vec4 to transform
   * _param {vec4} [dest] vec4 receiving operation result. If not specified result is written to vec
   *
   * _returns {vec4} dest if specified, vec otherwise
   *
   * @param {Object=} dest
   */ mat4.multiplyVec4 = function(mat, vec, dest) {
  if (!dest) {
   dest = vec;
  }
  var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
  dest[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w;
  dest[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w;
  dest[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w;
  dest[3] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w;
  return dest;
 };
 /**
   * Translates a matrix by the given vector
   *
   * _param {mat4} mat mat4 to translate
   * _param {vec3} vec vec3 specifying the translation
   * _param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
   */ mat4.translate = function(mat, vec, dest) {
  var x = vec[0], y = vec[1], z = vec[2], a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23;
  if (!dest || mat === dest) {
   mat[12] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
   mat[13] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
   mat[14] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
   mat[15] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15];
   return mat;
  }
  a00 = mat[0];
  a01 = mat[1];
  a02 = mat[2];
  a03 = mat[3];
  a10 = mat[4];
  a11 = mat[5];
  a12 = mat[6];
  a13 = mat[7];
  a20 = mat[8];
  a21 = mat[9];
  a22 = mat[10];
  a23 = mat[11];
  dest[0] = a00;
  dest[1] = a01;
  dest[2] = a02;
  dest[3] = a03;
  dest[4] = a10;
  dest[5] = a11;
  dest[6] = a12;
  dest[7] = a13;
  dest[8] = a20;
  dest[9] = a21;
  dest[10] = a22;
  dest[11] = a23;
  dest[12] = a00 * x + a10 * y + a20 * z + mat[12];
  dest[13] = a01 * x + a11 * y + a21 * z + mat[13];
  dest[14] = a02 * x + a12 * y + a22 * z + mat[14];
  dest[15] = a03 * x + a13 * y + a23 * z + mat[15];
  return dest;
 };
 /**
   * Scales a matrix by the given vector
   *
   * _param {mat4} mat mat4 to scale
   * _param {vec3} vec vec3 specifying the scale for each axis
   * _param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
   */ mat4.scale = function(mat, vec, dest) {
  var x = vec[0], y = vec[1], z = vec[2];
  if (!dest || mat === dest) {
   mat[0] *= x;
   mat[1] *= x;
   mat[2] *= x;
   mat[3] *= x;
   mat[4] *= y;
   mat[5] *= y;
   mat[6] *= y;
   mat[7] *= y;
   mat[8] *= z;
   mat[9] *= z;
   mat[10] *= z;
   mat[11] *= z;
   return mat;
  }
  dest[0] = mat[0] * x;
  dest[1] = mat[1] * x;
  dest[2] = mat[2] * x;
  dest[3] = mat[3] * x;
  dest[4] = mat[4] * y;
  dest[5] = mat[5] * y;
  dest[6] = mat[6] * y;
  dest[7] = mat[7] * y;
  dest[8] = mat[8] * z;
  dest[9] = mat[9] * z;
  dest[10] = mat[10] * z;
  dest[11] = mat[11] * z;
  dest[12] = mat[12];
  dest[13] = mat[13];
  dest[14] = mat[14];
  dest[15] = mat[15];
  return dest;
 };
 /**
   * Rotates a matrix by the given angle around the specified axis
   * If rotating around a primary axis (X,Y,Z) one of the specialized rotation functions should be used instead for performance
   *
   * _param {mat4} mat mat4 to rotate
   * _param {number} angle Angle (in radians) to rotate
   * _param {vec3} axis vec3 representing the axis to rotate around
   * _param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
   */ mat4.rotate = function(mat, angle, axis, dest) {
  var x = axis[0], y = axis[1], z = axis[2], len = Math.sqrt(x * x + y * y + z * z), s, c, t, a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, b00, b01, b02, b10, b11, b12, b20, b21, b22;
  if (!len) {
   return null;
  }
  if (len !== 1) {
   len = 1 / len;
   x *= len;
   y *= len;
   z *= len;
  }
  s = Math.sin(angle);
  c = Math.cos(angle);
  t = 1 - c;
  a00 = mat[0];
  a01 = mat[1];
  a02 = mat[2];
  a03 = mat[3];
  a10 = mat[4];
  a11 = mat[5];
  a12 = mat[6];
  a13 = mat[7];
  a20 = mat[8];
  a21 = mat[9];
  a22 = mat[10];
  a23 = mat[11];
  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c;
  if (!dest) {
   dest = mat;
  } else if (mat !== dest) {
   dest[12] = mat[12];
   dest[13] = mat[13];
   dest[14] = mat[14];
   dest[15] = mat[15];
  }
  dest[0] = a00 * b00 + a10 * b01 + a20 * b02;
  dest[1] = a01 * b00 + a11 * b01 + a21 * b02;
  dest[2] = a02 * b00 + a12 * b01 + a22 * b02;
  dest[3] = a03 * b00 + a13 * b01 + a23 * b02;
  dest[4] = a00 * b10 + a10 * b11 + a20 * b12;
  dest[5] = a01 * b10 + a11 * b11 + a21 * b12;
  dest[6] = a02 * b10 + a12 * b11 + a22 * b12;
  dest[7] = a03 * b10 + a13 * b11 + a23 * b12;
  dest[8] = a00 * b20 + a10 * b21 + a20 * b22;
  dest[9] = a01 * b20 + a11 * b21 + a21 * b22;
  dest[10] = a02 * b20 + a12 * b21 + a22 * b22;
  dest[11] = a03 * b20 + a13 * b21 + a23 * b22;
  return dest;
 };
 /**
   * Rotates a matrix by the given angle around the X axis
   *
   * _param {mat4} mat mat4 to rotate
   * _param {number} angle Angle (in radians) to rotate
   * _param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
   */ mat4.rotateX = function(mat, angle, dest) {
  var s = Math.sin(angle), c = Math.cos(angle), a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7], a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
  if (!dest) {
   dest = mat;
  } else if (mat !== dest) {
   dest[0] = mat[0];
   dest[1] = mat[1];
   dest[2] = mat[2];
   dest[3] = mat[3];
   dest[12] = mat[12];
   dest[13] = mat[13];
   dest[14] = mat[14];
   dest[15] = mat[15];
  }
  dest[4] = a10 * c + a20 * s;
  dest[5] = a11 * c + a21 * s;
  dest[6] = a12 * c + a22 * s;
  dest[7] = a13 * c + a23 * s;
  dest[8] = a10 * -s + a20 * c;
  dest[9] = a11 * -s + a21 * c;
  dest[10] = a12 * -s + a22 * c;
  dest[11] = a13 * -s + a23 * c;
  return dest;
 };
 /**
   * Rotates a matrix by the given angle around the Y axis
   *
   * _param {mat4} mat mat4 to rotate
   * _param {number} angle Angle (in radians) to rotate
   * _param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
   */ mat4.rotateY = function(mat, angle, dest) {
  var s = Math.sin(angle), c = Math.cos(angle), a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3], a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
  if (!dest) {
   dest = mat;
  } else if (mat !== dest) {
   dest[4] = mat[4];
   dest[5] = mat[5];
   dest[6] = mat[6];
   dest[7] = mat[7];
   dest[12] = mat[12];
   dest[13] = mat[13];
   dest[14] = mat[14];
   dest[15] = mat[15];
  }
  dest[0] = a00 * c + a20 * -s;
  dest[1] = a01 * c + a21 * -s;
  dest[2] = a02 * c + a22 * -s;
  dest[3] = a03 * c + a23 * -s;
  dest[8] = a00 * s + a20 * c;
  dest[9] = a01 * s + a21 * c;
  dest[10] = a02 * s + a22 * c;
  dest[11] = a03 * s + a23 * c;
  return dest;
 };
 /**
   * Rotates a matrix by the given angle around the Z axis
   *
   * _param {mat4} mat mat4 to rotate
   * _param {number} angle Angle (in radians) to rotate
   * _param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
   */ mat4.rotateZ = function(mat, angle, dest) {
  var s = Math.sin(angle), c = Math.cos(angle), a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3], a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
  if (!dest) {
   dest = mat;
  } else if (mat !== dest) {
   dest[8] = mat[8];
   dest[9] = mat[9];
   dest[10] = mat[10];
   dest[11] = mat[11];
   dest[12] = mat[12];
   dest[13] = mat[13];
   dest[14] = mat[14];
   dest[15] = mat[15];
  }
  dest[0] = a00 * c + a10 * s;
  dest[1] = a01 * c + a11 * s;
  dest[2] = a02 * c + a12 * s;
  dest[3] = a03 * c + a13 * s;
  dest[4] = a00 * -s + a10 * c;
  dest[5] = a01 * -s + a11 * c;
  dest[6] = a02 * -s + a12 * c;
  dest[7] = a03 * -s + a13 * c;
  return dest;
 };
 /**
   * Generates a frustum matrix with the given bounds
   *
   * _param {number} left Left bound of the frustum
   * _param {number} right Right bound of the frustum
   * _param {number} bottom Bottom bound of the frustum
   * _param {number} top Top bound of the frustum
   * _param {number} near Near bound of the frustum
   * _param {number} far Far bound of the frustum
   * _param {mat4} [dest] mat4 frustum matrix will be written into
   *
   * _returns {mat4} dest if specified, a new mat4 otherwise
   */ mat4.frustum = function(left, right, bottom, top, near, far, dest) {
  if (!dest) {
   dest = mat4.create();
  }
  var rl = (right - left), tb = (top - bottom), fn = (far - near);
  dest[0] = (near * 2) / rl;
  dest[1] = 0;
  dest[2] = 0;
  dest[3] = 0;
  dest[4] = 0;
  dest[5] = (near * 2) / tb;
  dest[6] = 0;
  dest[7] = 0;
  dest[8] = (right + left) / rl;
  dest[9] = (top + bottom) / tb;
  dest[10] = -(far + near) / fn;
  dest[11] = -1;
  dest[12] = 0;
  dest[13] = 0;
  dest[14] = -(far * near * 2) / fn;
  dest[15] = 0;
  return dest;
 };
 /**
   * Generates a perspective projection matrix with the given bounds
   *
   * _param {number} fovy Vertical field of view
   * _param {number} aspect Aspect ratio. typically viewport width/height
   * _param {number} near Near bound of the frustum
   * _param {number} far Far bound of the frustum
   * _param {mat4} [dest] mat4 frustum matrix will be written into
   *
   * _returns {mat4} dest if specified, a new mat4 otherwise
   */ mat4.perspective = function(fovy, aspect, near, far, dest) {
  var top = near * Math.tan(fovy * Math.PI / 360), right = top * aspect;
  return mat4.frustum(-right, right, -top, top, near, far, dest);
 };
 /**
   * Generates a orthogonal projection matrix with the given bounds
   *
   * _param {number} left Left bound of the frustum
   * _param {number} right Right bound of the frustum
   * _param {number} bottom Bottom bound of the frustum
   * _param {number} top Top bound of the frustum
   * _param {number} near Near bound of the frustum
   * _param {number} far Far bound of the frustum
   * _param {mat4} [dest] mat4 frustum matrix will be written into
   *
   * _returns {mat4} dest if specified, a new mat4 otherwise
   */ mat4.ortho = function(left, right, bottom, top, near, far, dest) {
  if (!dest) {
   dest = mat4.create();
  }
  var rl = (right - left), tb = (top - bottom), fn = (far - near);
  dest[0] = 2 / rl;
  dest[1] = 0;
  dest[2] = 0;
  dest[3] = 0;
  dest[4] = 0;
  dest[5] = 2 / tb;
  dest[6] = 0;
  dest[7] = 0;
  dest[8] = 0;
  dest[9] = 0;
  dest[10] = -2 / fn;
  dest[11] = 0;
  dest[12] = -(left + right) / rl;
  dest[13] = -(top + bottom) / tb;
  dest[14] = -(far + near) / fn;
  dest[15] = 1;
  return dest;
 };
 /**
   * Generates a look-at matrix with the given eye position, focal point, and up axis
   *
   * _param {vec3} eye Position of the viewer
   * _param {vec3} center Point the viewer is looking at
   * _param {vec3} up vec3 pointing "up"
   * _param {mat4} [dest] mat4 frustum matrix will be written into
   *
   * _returns {mat4} dest if specified, a new mat4 otherwise
   */ mat4.lookAt = function(eye, center, up, dest) {
  if (!dest) {
   dest = mat4.create();
  }
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len, eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2], centerx = center[0], centery = center[1], centerz = center[2];
  if (eyex === centerx && eyey === centery && eyez === centerz) {
   return mat4.identity(dest);
  }
  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
   x0 = 0;
   x1 = 0;
   x2 = 0;
  } else {
   len = 1 / len;
   x0 *= len;
   x1 *= len;
   x2 *= len;
  }
  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
   y0 = 0;
   y1 = 0;
   y2 = 0;
  } else {
   len = 1 / len;
   y0 *= len;
   y1 *= len;
   y2 *= len;
  }
  dest[0] = x0;
  dest[1] = y0;
  dest[2] = z0;
  dest[3] = 0;
  dest[4] = x1;
  dest[5] = y1;
  dest[6] = z1;
  dest[7] = 0;
  dest[8] = x2;
  dest[9] = y2;
  dest[10] = z2;
  dest[11] = 0;
  dest[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  dest[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  dest[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  dest[15] = 1;
  return dest;
 };
 /**
   * Creates a matrix from a quaternion rotation and vector translation
   * This is equivalent to (but much faster than):
   *
   *     mat4.identity(dest);
   *     mat4.translate(dest, vec);
   *     var quatMat = mat4.create();
   *     quat4.toMat4(quat, quatMat);
   *     mat4.multiply(dest, quatMat);
   *
   * _param {quat4} quat Rotation quaternion
   * _param {vec3} vec Translation vector
   * _param {mat4} [dest] mat4 receiving operation result. If not specified result is written to a new mat4
   *
   * _returns {mat4} dest if specified, a new mat4 otherwise
   */ mat4.fromRotationTranslation = function(quat, vec, dest) {
  if (!dest) {
   dest = mat4.create();
  }
  var x = quat[0], y = quat[1], z = quat[2], w = quat[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  dest[0] = 1 - (yy + zz);
  dest[1] = xy + wz;
  dest[2] = xz - wy;
  dest[3] = 0;
  dest[4] = xy - wz;
  dest[5] = 1 - (xx + zz);
  dest[6] = yz + wx;
  dest[7] = 0;
  dest[8] = xz + wy;
  dest[9] = yz - wx;
  dest[10] = 1 - (xx + yy);
  dest[11] = 0;
  dest[12] = vec[0];
  dest[13] = vec[1];
  dest[14] = vec[2];
  dest[15] = 1;
  return dest;
 };
 /**
   * Returns a string representation of a mat4
   *
   * _param {mat4} mat mat4 to represent as a string
   *
   * _returns {string} String representation of mat
   */ mat4.str = function(mat) {
  return "[" + mat[0] + ", " + mat[1] + ", " + mat[2] + ", " + mat[3] + ", " + mat[4] + ", " + mat[5] + ", " + mat[6] + ", " + mat[7] + ", " + mat[8] + ", " + mat[9] + ", " + mat[10] + ", " + mat[11] + ", " + mat[12] + ", " + mat[13] + ", " + mat[14] + ", " + mat[15] + "]";
 };
 /**
   * Creates a new instance of a quat4 using the default array type
   * Any javascript array containing at least 4 numeric elements can serve as a quat4
   *
   * _param {quat4} [quat] quat4 containing values to initialize with
   *
   * _returns {quat4} New quat4
   */ quat4.create = function(quat) {
  var dest = new MatrixArray(4);
  if (quat) {
   dest[0] = quat[0];
   dest[1] = quat[1];
   dest[2] = quat[2];
   dest[3] = quat[3];
  }
  return dest;
 };
 /**
   * Copies the values of one quat4 to another
   *
   * _param {quat4} quat quat4 containing values to copy
   * _param {quat4} dest quat4 receiving copied values
   *
   * _returns {quat4} dest
   */ quat4.set = function(quat, dest) {
  dest[0] = quat[0];
  dest[1] = quat[1];
  dest[2] = quat[2];
  dest[3] = quat[3];
  return dest;
 };
 /**
   * Calculates the W component of a quat4 from the X, Y, and Z components.
   * Assumes that quaternion is 1 unit in length.
   * Any existing W component will be ignored.
   *
   * _param {quat4} quat quat4 to calculate W component of
   * _param {quat4} [dest] quat4 receiving calculated values. If not specified result is written to quat
   *
   * _returns {quat4} dest if specified, quat otherwise
   */ quat4.calculateW = function(quat, dest) {
  var x = quat[0], y = quat[1], z = quat[2];
  if (!dest || quat === dest) {
   quat[3] = -Math.sqrt(Math.abs(1 - x * x - y * y - z * z));
   return quat;
  }
  dest[0] = x;
  dest[1] = y;
  dest[2] = z;
  dest[3] = -Math.sqrt(Math.abs(1 - x * x - y * y - z * z));
  return dest;
 };
 /**
   * Calculates the dot product of two quaternions
   *
   * _param {quat4} quat First operand
   * _param {quat4} quat2 Second operand
   *
   * @return {number} Dot product of quat and quat2
   */ quat4.dot = function(quat, quat2) {
  return quat[0] * quat2[0] + quat[1] * quat2[1] + quat[2] * quat2[2] + quat[3] * quat2[3];
 };
 /**
   * Calculates the inverse of a quat4
   *
   * _param {quat4} quat quat4 to calculate inverse of
   * _param {quat4} [dest] quat4 receiving inverse values. If not specified result is written to quat
   *
   * _returns {quat4} dest if specified, quat otherwise
   */ quat4.inverse = function(quat, dest) {
  var q0 = quat[0], q1 = quat[1], q2 = quat[2], q3 = quat[3], dot = q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3, invDot = dot ? 1 / dot : 0;
  if (!dest || quat === dest) {
   quat[0] *= -invDot;
   quat[1] *= -invDot;
   quat[2] *= -invDot;
   quat[3] *= invDot;
   return quat;
  }
  dest[0] = -quat[0] * invDot;
  dest[1] = -quat[1] * invDot;
  dest[2] = -quat[2] * invDot;
  dest[3] = quat[3] * invDot;
  return dest;
 };
 /**
   * Calculates the conjugate of a quat4
   * If the quaternion is normalized, this function is faster than quat4.inverse and produces the same result.
   *
   * _param {quat4} quat quat4 to calculate conjugate of
   * _param {quat4} [dest] quat4 receiving conjugate values. If not specified result is written to quat
   *
   * _returns {quat4} dest if specified, quat otherwise
   */ quat4.conjugate = function(quat, dest) {
  if (!dest || quat === dest) {
   quat[0] *= -1;
   quat[1] *= -1;
   quat[2] *= -1;
   return quat;
  }
  dest[0] = -quat[0];
  dest[1] = -quat[1];
  dest[2] = -quat[2];
  dest[3] = quat[3];
  return dest;
 };
 /**
   * Calculates the length of a quat4
   *
   * Params:
   * _param {quat4} quat quat4 to calculate length of
   *
   * _returns Length of quat
   */ quat4.length = function(quat) {
  var x = quat[0], y = quat[1], z = quat[2], w = quat[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
 };
 /**
   * Generates a unit quaternion of the same direction as the provided quat4
   * If quaternion length is 0, returns [0, 0, 0, 0]
   *
   * _param {quat4} quat quat4 to normalize
   * _param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
   *
   * _returns {quat4} dest if specified, quat otherwise
   */ quat4.normalize = function(quat, dest) {
  if (!dest) {
   dest = quat;
  }
  var x = quat[0], y = quat[1], z = quat[2], w = quat[3], len = Math.sqrt(x * x + y * y + z * z + w * w);
  if (len === 0) {
   dest[0] = 0;
   dest[1] = 0;
   dest[2] = 0;
   dest[3] = 0;
   return dest;
  }
  len = 1 / len;
  dest[0] = x * len;
  dest[1] = y * len;
  dest[2] = z * len;
  dest[3] = w * len;
  return dest;
 };
 /**
   * Performs quaternion addition
   *
   * _param {quat4} quat First operand
   * _param {quat4} quat2 Second operand
   * _param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
   *
   * _returns {quat4} dest if specified, quat otherwise
   */ quat4.add = function(quat, quat2, dest) {
  if (!dest || quat === dest) {
   quat[0] += quat2[0];
   quat[1] += quat2[1];
   quat[2] += quat2[2];
   quat[3] += quat2[3];
   return quat;
  }
  dest[0] = quat[0] + quat2[0];
  dest[1] = quat[1] + quat2[1];
  dest[2] = quat[2] + quat2[2];
  dest[3] = quat[3] + quat2[3];
  return dest;
 };
 /**
   * Performs a quaternion multiplication
   *
   * _param {quat4} quat First operand
   * _param {quat4} quat2 Second operand
   * _param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
   *
   * _returns {quat4} dest if specified, quat otherwise
   */ quat4.multiply = function(quat, quat2, dest) {
  if (!dest) {
   dest = quat;
  }
  var qax = quat[0], qay = quat[1], qaz = quat[2], qaw = quat[3], qbx = quat2[0], qby = quat2[1], qbz = quat2[2], qbw = quat2[3];
  dest[0] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
  dest[1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
  dest[2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
  dest[3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
  return dest;
 };
 /**
   * Transforms a vec3 with the given quaternion
   *
   * _param {quat4} quat quat4 to transform the vector with
   * _param {vec3} vec vec3 to transform
   * _param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
   *
   * _returns dest if specified, vec otherwise
   */ quat4.multiplyVec3 = function(quat, vec, dest) {
  if (!dest) {
   dest = vec;
  }
  var x = vec[0], y = vec[1], z = vec[2], qx = quat[0], qy = quat[1], qz = quat[2], qw = quat[3],  ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
  dest[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  dest[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  dest[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return dest;
 };
 /**
   * Multiplies the components of a quaternion by a scalar value
   *
   * _param {quat4} quat to scale
   * _param {number} val Value to scale by
   * _param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
   *
   * _returns {quat4} dest if specified, quat otherwise
   */ quat4.scale = function(quat, val, dest) {
  if (!dest || quat === dest) {
   quat[0] *= val;
   quat[1] *= val;
   quat[2] *= val;
   quat[3] *= val;
   return quat;
  }
  dest[0] = quat[0] * val;
  dest[1] = quat[1] * val;
  dest[2] = quat[2] * val;
  dest[3] = quat[3] * val;
  return dest;
 };
 /**
   * Calculates a 3x3 matrix from the given quat4
   *
   * _param {quat4} quat quat4 to create matrix from
   * _param {mat3} [dest] mat3 receiving operation result
   *
   * _returns {mat3} dest if specified, a new mat3 otherwise
   */ quat4.toMat3 = function(quat, dest) {
  if (!dest) {
   dest = mat3.create();
  }
  var x = quat[0], y = quat[1], z = quat[2], w = quat[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  dest[0] = 1 - (yy + zz);
  dest[1] = xy + wz;
  dest[2] = xz - wy;
  dest[3] = xy - wz;
  dest[4] = 1 - (xx + zz);
  dest[5] = yz + wx;
  dest[6] = xz + wy;
  dest[7] = yz - wx;
  dest[8] = 1 - (xx + yy);
  return dest;
 };
 /**
   * Calculates a 4x4 matrix from the given quat4
   *
   * _param {quat4} quat quat4 to create matrix from
   * _param {mat4} [dest] mat4 receiving operation result
   *
   * _returns {mat4} dest if specified, a new mat4 otherwise
   */ quat4.toMat4 = function(quat, dest) {
  if (!dest) {
   dest = mat4.create();
  }
  var x = quat[0], y = quat[1], z = quat[2], w = quat[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  dest[0] = 1 - (yy + zz);
  dest[1] = xy + wz;
  dest[2] = xz - wy;
  dest[3] = 0;
  dest[4] = xy - wz;
  dest[5] = 1 - (xx + zz);
  dest[6] = yz + wx;
  dest[7] = 0;
  dest[8] = xz + wy;
  dest[9] = yz - wx;
  dest[10] = 1 - (xx + yy);
  dest[11] = 0;
  dest[12] = 0;
  dest[13] = 0;
  dest[14] = 0;
  dest[15] = 1;
  return dest;
 };
 /**
   * Performs a spherical linear interpolation between two quat4
   *
   * _param {quat4} quat First quaternion
   * _param {quat4} quat2 Second quaternion
   * _param {number} slerp Interpolation amount between the two inputs
   * _param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
   *
   * _returns {quat4} dest if specified, quat otherwise
   */ quat4.slerp = function(quat, quat2, slerp, dest) {
  if (!dest) {
   dest = quat;
  }
  var cosHalfTheta = quat[0] * quat2[0] + quat[1] * quat2[1] + quat[2] * quat2[2] + quat[3] * quat2[3], halfTheta, sinHalfTheta, ratioA, ratioB;
  if (Math.abs(cosHalfTheta) >= 1) {
   if (dest !== quat) {
    dest[0] = quat[0];
    dest[1] = quat[1];
    dest[2] = quat[2];
    dest[3] = quat[3];
   }
   return dest;
  }
  halfTheta = Math.acos(cosHalfTheta);
  sinHalfTheta = Math.sqrt(1 - cosHalfTheta * cosHalfTheta);
  if (Math.abs(sinHalfTheta) < .001) {
   dest[0] = (quat[0] * .5 + quat2[0] * .5);
   dest[1] = (quat[1] * .5 + quat2[1] * .5);
   dest[2] = (quat[2] * .5 + quat2[2] * .5);
   dest[3] = (quat[3] * .5 + quat2[3] * .5);
   return dest;
  }
  ratioA = Math.sin((1 - slerp) * halfTheta) / sinHalfTheta;
  ratioB = Math.sin(slerp * halfTheta) / sinHalfTheta;
  dest[0] = (quat[0] * ratioA + quat2[0] * ratioB);
  dest[1] = (quat[1] * ratioA + quat2[1] * ratioB);
  dest[2] = (quat[2] * ratioA + quat2[2] * ratioB);
  dest[3] = (quat[3] * ratioA + quat2[3] * ratioB);
  return dest;
 };
 /**
   * Returns a string representation of a quaternion
   *
   * _param {quat4} quat quat4 to represent as a string
   *
   * _returns {string} String representation of quat
   */ quat4.str = function(quat) {
  return "[" + quat[0] + ", " + quat[1] + ", " + quat[2] + ", " + quat[3] + "]";
 };
 return {
  vec3: vec3,
  mat3: mat3,
  mat4: mat4,
  quat4: quat4
 };
})();

var GLImmediateSetup = {};

function _glIsEnabled(x0) {
 return GLctx.isEnabled(x0);
}

var emscriptenWebGLGet = (name_, p, type) => {
 if (!p) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 var ret = undefined;
 switch (name_) {
 case 36346:
  ret = 1;
  break;

 case 36344:
  if (type != 0 && type != 1) {
   GL.recordError(1280);
  }
  return;

 case 34814:
 case 36345:
  ret = 0;
  break;

 case 34466:
  var formats = GLctx.getParameter(34467);
  /*GL_COMPRESSED_TEXTURE_FORMATS*/ ret = formats ? formats.length : 0;
  break;

 case 33309:
  if (GL.currentContext.version < 2) {
   GL.recordError(1282);
   /* GL_INVALID_OPERATION */ return;
  }
  var exts = GLctx.getSupportedExtensions() || [];
  ret = 2 * exts.length;
  break;

 case 33307:
 case 33308:
  if (GL.currentContext.version < 2) {
   GL.recordError(1280);
   return;
  }
  ret = name_ == 33307 ? 3 : 0;
  break;
 }
 if (ret === undefined) {
  var result = GLctx.getParameter(name_);
  switch (typeof result) {
  case "number":
   ret = result;
   break;

  case "boolean":
   ret = result ? 1 : 0;
   break;

  case "string":
   GL.recordError(1280);
   return;

  case "object":
   if (result === null) {
    switch (name_) {
    case 34964:
    case 35725:
    case 34965:
    case 36006:
    case 36007:
    case 32873:
    case 34229:
    case 36662:
    case 36663:
    case 35053:
    case 35055:
    case 36010:
    case 35097:
    case 35869:
    case 32874:
    case 36389:
    case 35983:
    case 35368:
    case 34068:
     {
      ret = 0;
      break;
     }

    default:
     {
      GL.recordError(1280);
      return;
     }
    }
   } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
    for (var i = 0; i < result.length; ++i) {
     switch (type) {
     case 0:
      GROWABLE_HEAP_I32()[(((p) + (i * 4)) >> 2)] = result[i];
      break;

     case 2:
      GROWABLE_HEAP_F32()[(((p) + (i * 4)) >> 2)] = result[i];
      break;

     case 4:
      GROWABLE_HEAP_I8()[(((p) + (i)) >> 0)] = result[i] ? 1 : 0;
      break;
     }
    }
    return;
   } else {
    try {
     ret = result.name | 0;
    } catch (e) {
     GL.recordError(1280);
     err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
     return;
    }
   }
   break;

  default:
   GL.recordError(1280);
   err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof (result)}!`);
   return;
  }
 }
 switch (type) {
 case 1:
  writeI53ToI64(p, ret);
  break;

 case 0:
  GROWABLE_HEAP_I32()[((p) >> 2)] = ret;
  break;

 case 2:
  GROWABLE_HEAP_F32()[((p) >> 2)] = ret;
  break;

 case 4:
  GROWABLE_HEAP_I8()[((p) >> 0)] = ret ? 1 : 0;
  break;
 }
};

var _glGetBooleanv = (name_, p) => emscriptenWebGLGet(name_, p, 4);

var _glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);

var _glGetString = name_ => {
 var ret = GL.stringCache[name_];
 if (!ret) {
  switch (name_) {
  case 7939:
   /* GL_EXTENSIONS */ ret = stringToNewUTF8(GL.getExtensions().join(" "));
   break;

  case 7936:
  /* GL_VENDOR */ case 7937:
  /* GL_RENDERER */ case 37445:
  /* UNMASKED_VENDOR_WEBGL */ case 37446:
   /* UNMASKED_RENDERER_WEBGL */ var s = GLctx.getParameter(name_);
   if (!s) {
    GL.recordError(1280);
   }
   ret = s ? stringToNewUTF8(s) : 0;
   break;

  case 7938:
   /* GL_VERSION */ var glVersion = GLctx.getParameter(7938);
   if (GL.currentContext.version >= 2) glVersion = `OpenGL ES 3.0 (${glVersion})`; else {
    glVersion = `OpenGL ES 2.0 (${glVersion})`;
   }
   ret = stringToNewUTF8(glVersion);
   break;

  case 35724:
   /* GL_SHADING_LANGUAGE_VERSION */ var glslVersion = GLctx.getParameter(35724);
   var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
   var ver_num = glslVersion.match(ver_re);
   if (ver_num !== null) {
    if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
    glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`;
   }
   ret = stringToNewUTF8(glslVersion);
   break;

  default:
   GL.recordError(1280);
  }
  GL.stringCache[name_] = ret;
 }
 return ret;
};

var _glShaderSource = (shader, count, string, length) => {
 var source = GL.getSource(shader, count, string, length);
 GLctx.shaderSource(GL.shaders[shader], source);
};

var _glUseProgram = program => {
 program = GL.programs[program];
 GLctx.useProgram(program);
 GLctx.currentProgram = program;
};

var _glBindAttribLocation = (program, index, name) => {
 GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
};

var _glLinkProgram = program => {
 program = GL.programs[program];
 GLctx.linkProgram(program);
 program.uniformLocsById = 0;
 program.uniformSizeAndIdsByName = {};
};

var _glGetFloatv = (name_, p) => emscriptenWebGLGet(name_, p, 2);

function _glHint(x0, x1) {
 GLctx.hint(x0, x1);
}

var _glDisableVertexAttribArray = index => {
 GLctx.disableVertexAttribArray(index);
};

var ptrToString = ptr => {
 ptr >>>= 0;
 return "0x" + ptr.toString(16).padStart(8, "0");
};

var GLEmulation = {
 fogStart: 0,
 fogEnd: 1,
 fogDensity: 1,
 fogColor: null,
 fogMode: 2048,
 fogEnabled: false,
 MAX_CLIP_PLANES: 6,
 clipPlaneEnabled: [ false, false, false, false, false, false ],
 clipPlaneEquation: [],
 lightingEnabled: false,
 lightModelAmbient: null,
 lightModelLocalViewer: false,
 lightModelTwoSide: false,
 materialAmbient: null,
 materialDiffuse: null,
 materialSpecular: null,
 materialShininess: null,
 materialEmission: null,
 MAX_LIGHTS: 8,
 lightEnabled: [ false, false, false, false, false, false, false, false ],
 lightAmbient: [],
 lightDiffuse: [],
 lightSpecular: [],
 lightPosition: [],
 alphaTestEnabled: false,
 alphaTestFunc: 519,
 alphaTestRef: 0,
 pointSize: 1,
 vaos: [],
 currentVao: null,
 enabledVertexAttribArrays: {},
 hasRunInit: false,
 findToken(source, token) {
  function isIdentChar(ch) {
   if (ch >= 48 && ch <= 57)  return true;
   if (ch >= 65 && ch <= 90)  return true;
   if (ch >= 97 && ch <= 122)  return true;
   return false;
  }
  var i = -1;
  do {
   i = source.indexOf(token, i + 1);
   if (i < 0) {
    break;
   }
   if (i > 0 && isIdentChar(source[i - 1])) {
    continue;
   }
   i += token.length;
   if (i < source.length - 1 && isIdentChar(source[i + 1])) {
    continue;
   }
   return true;
  } while (true);
  return false;
 },
 init() {
  if (GLEmulation.hasRunInit) {
   return;
  }
  GLEmulation.hasRunInit = true;
  GLEmulation.fogColor = new Float32Array(4);
  for (var clipPlaneId = 0; clipPlaneId < GLEmulation.MAX_CLIP_PLANES; clipPlaneId++) {
   GLEmulation.clipPlaneEquation[clipPlaneId] = new Float32Array(4);
  }
  GLEmulation.lightModelAmbient = new Float32Array([ .2, .2, .2, 1 ]);
  GLEmulation.materialAmbient = new Float32Array([ .2, .2, .2, 1 ]);
  GLEmulation.materialDiffuse = new Float32Array([ .8, .8, .8, 1 ]);
  GLEmulation.materialSpecular = new Float32Array([ 0, 0, 0, 1 ]);
  GLEmulation.materialShininess = new Float32Array([ 0 ]);
  GLEmulation.materialEmission = new Float32Array([ 0, 0, 0, 1 ]);
  for (var lightId = 0; lightId < GLEmulation.MAX_LIGHTS; lightId++) {
   GLEmulation.lightAmbient[lightId] = new Float32Array([ 0, 0, 0, 1 ]);
   GLEmulation.lightDiffuse[lightId] = lightId ? new Float32Array([ 0, 0, 0, 1 ]) : new Float32Array([ 1, 1, 1, 1 ]);
   GLEmulation.lightSpecular[lightId] = lightId ? new Float32Array([ 0, 0, 0, 1 ]) : new Float32Array([ 1, 1, 1, 1 ]);
   GLEmulation.lightPosition[lightId] = new Float32Array([ 0, 0, 1, 0 ]);
  }
  err("WARNING: using emscripten GL emulation. This is a collection of limited workarounds, do not expect it to work.");
  err("WARNING: using emscripten GL emulation unsafe opts. If weirdness happens, try -sGL_UNSAFE_OPTS=0");
  var validCapabilities = {
   2884: 1,
   3042: 1,
   3024: 1,
   2960: 1,
   2929: 1,
   3089: 1,
   32823: 1,
   32926: 1,
   32928: 1
  };
  var glEnable = _glEnable;
  _glEnable = _emscripten_glEnable = cap => {
   GLImmediate.lastRenderer?.cleanup();
   if (cap == 2912) /* GL_FOG */ {
    if (GLEmulation.fogEnabled != true) {
     GLImmediate.currentRenderer = null;
     GLEmulation.fogEnabled = true;
    }
    return;
   } else if ((cap >= 12288) && (cap < 12294)) /* GL_CLIP_PLANE0 to GL_CLIP_PLANE5 */ {
    var clipPlaneId = cap - 12288;
    if (GLEmulation.clipPlaneEnabled[clipPlaneId] != true) {
     GLImmediate.currentRenderer = null;
     GLEmulation.clipPlaneEnabled[clipPlaneId] = true;
    }
    return;
   } else if ((cap >= 16384) && (cap < 16392)) /* GL_LIGHT0 to GL_LIGHT7 */ {
    var lightId = cap - 16384;
    if (GLEmulation.lightEnabled[lightId] != true) {
     GLImmediate.currentRenderer = null;
     GLEmulation.lightEnabled[lightId] = true;
    }
    return;
   } else if (cap == 2896) /* GL_LIGHTING */ {
    if (GLEmulation.lightingEnabled != true) {
     GLImmediate.currentRenderer = null;
     GLEmulation.lightingEnabled = true;
    }
    return;
   } else if (cap == 3008) /* GL_ALPHA_TEST */ {
    if (GLEmulation.alphaTestEnabled != true) {
     GLImmediate.currentRenderer = null;
     GLEmulation.alphaTestEnabled = true;
    }
    return;
   } else if (cap == 3553) /* GL_TEXTURE_2D */ {
    /* Actually, let's not, for now. (This sounds exceedingly broken)
             * This is in gl_ps_workaround2.c.
            _glEnableClientState(cap);
            */ return;
   } else if (!(cap in validCapabilities)) {
    return;
   }
   glEnable(cap);
  };
  var glDisable = _glDisable;
  _glDisable = _emscripten_glDisable = cap => {
   GLImmediate.lastRenderer?.cleanup();
   if (cap == 2912) /* GL_FOG */ {
    if (GLEmulation.fogEnabled != false) {
     GLImmediate.currentRenderer = null;
     GLEmulation.fogEnabled = false;
    }
    return;
   } else if ((cap >= 12288) && (cap < 12294)) /* GL_CLIP_PLANE0 to GL_CLIP_PLANE5 */ {
    var clipPlaneId = cap - 12288;
    if (GLEmulation.clipPlaneEnabled[clipPlaneId] != false) {
     GLImmediate.currentRenderer = null;
     GLEmulation.clipPlaneEnabled[clipPlaneId] = false;
    }
    return;
   } else if ((cap >= 16384) && (cap < 16392)) /* GL_LIGHT0 to GL_LIGHT7 */ {
    var lightId = cap - 16384;
    if (GLEmulation.lightEnabled[lightId] != false) {
     GLImmediate.currentRenderer = null;
     GLEmulation.lightEnabled[lightId] = false;
    }
    return;
   } else if (cap == 2896) /* GL_LIGHTING */ {
    if (GLEmulation.lightingEnabled != false) {
     GLImmediate.currentRenderer = null;
     GLEmulation.lightingEnabled = false;
    }
    return;
   } else if (cap == 3008) /* GL_ALPHA_TEST */ {
    if (GLEmulation.alphaTestEnabled != false) {
     GLImmediate.currentRenderer = null;
     GLEmulation.alphaTestEnabled = false;
    }
    return;
   } else if (cap == 3553) /* GL_TEXTURE_2D */ {
    /* Actually, let's not, for now. (This sounds exceedingly broken)
             * This is in gl_ps_workaround2.c.
            _glDisableClientState(cap);
            */ return;
   } else if (!(cap in validCapabilities)) {
    return;
   }
   glDisable(cap);
  };
  _glIsEnabled = _emscripten_glIsEnabled = cap => {
   if (cap == 2912) /* GL_FOG */ {
    return GLEmulation.fogEnabled ? 1 : 0;
   } else if ((cap >= 12288) && (cap < 12294)) /* GL_CLIP_PLANE0 to GL_CLIP_PLANE5 */ {
    var clipPlaneId = cap - 12288;
    return GLEmulation.clipPlaneEnabled[clipPlaneId] ? 1 : 0;
   } else if ((cap >= 16384) && (cap < 16392)) /* GL_LIGHT0 to GL_LIGHT7 */ {
    var lightId = cap - 16384;
    return GLEmulation.lightEnabled[lightId] ? 1 : 0;
   } else if (cap == 2896) /* GL_LIGHTING */ {
    return GLEmulation.lightingEnabled ? 1 : 0;
   } else if (cap == 3008) /* GL_ALPHA_TEST */ {
    return GLEmulation.alphaTestEnabled ? 1 : 0;
   } else if (!(cap in validCapabilities)) {
    return 0;
   }
   return GLctx.isEnabled(cap);
  };
  var glGetBooleanv = _glGetBooleanv;
  _glGetBooleanv = _emscripten_glGetBooleanv = (pname, p) => {
   var attrib = GLEmulation.getAttributeFromCapability(pname);
   if (attrib !== null) {
    var result = GLImmediate.enabledClientAttributes[attrib];
    GROWABLE_HEAP_I8()[((p) >> 0)] = result === true ? 1 : 0;
    return;
   }
   glGetBooleanv(pname, p);
  };
  var glGetIntegerv = _glGetIntegerv;
  _glGetIntegerv = _emscripten_glGetIntegerv = (pname, params) => {
   switch (pname) {
   case 34018:
    pname = GLctx.MAX_TEXTURE_IMAGE_UNITS;
    /* fake it */ break;

   case 35658:
    {
     var result = GLctx.getParameter(GLctx.MAX_VERTEX_UNIFORM_VECTORS);
     GROWABLE_HEAP_I32()[((params) >> 2)] = result * 4;
     return;
    }

   case 35657:
    {
     var result = GLctx.getParameter(GLctx.MAX_FRAGMENT_UNIFORM_VECTORS);
     GROWABLE_HEAP_I32()[((params) >> 2)] = result * 4;
     return;
    }

   case 35659:
    {
     var result = GLctx.getParameter(GLctx.MAX_VARYING_VECTORS);
     GROWABLE_HEAP_I32()[((params) >> 2)] = result * 4;
     return;
    }

   case 34929:
    pname = GLctx.MAX_COMBINED_TEXTURE_IMAGE_UNITS;
    /* close enough */ break;

   case 32890:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.VERTEX];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.size : 0;
     return;
    }

   case 32891:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.VERTEX];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.type : 0;
     return;
    }

   case 32892:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.VERTEX];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.stride : 0;
     return;
    }

   case 32897:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.COLOR];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.size : 0;
     return;
    }

   case 32898:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.COLOR];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.type : 0;
     return;
    }

   case 32899:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.COLOR];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.stride : 0;
     return;
    }

   case 32904:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.TEXTURE0 + GLImmediate.clientActiveTexture];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.size : 0;
     return;
    }

   case 32905:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.TEXTURE0 + GLImmediate.clientActiveTexture];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.type : 0;
     return;
    }

   case 32906:
    {
     var attribute = GLImmediate.clientAttributes[GLImmediate.TEXTURE0 + GLImmediate.clientActiveTexture];
     GROWABLE_HEAP_I32()[((params) >> 2)] = attribute ? attribute.stride : 0;
     return;
    }

   case 3378:
    {
     GROWABLE_HEAP_I32()[((params) >> 2)] = GLEmulation.MAX_CLIP_PLANES;
     return;
    }

   case 2976:
    {
     GROWABLE_HEAP_I32()[((params) >> 2)] = GLImmediate.currentMatrix + 5888;
     return;
    }

   case 3009:
    {
     GROWABLE_HEAP_I32()[((params) >> 2)] = GLEmulation.alphaTestFunc;
     return;
    }
   }
   glGetIntegerv(pname, params);
  };
  var glGetString = _glGetString;
  _glGetString = _emscripten_glGetString = name_ => {
   if (GL.stringCache[name_]) return GL.stringCache[name_];
   switch (name_) {
   case 7939:
    var ret = stringToNewUTF8((GLctx.getSupportedExtensions() || []).join(" ") + " GL_EXT_texture_env_combine GL_ARB_texture_env_crossbar GL_ATI_texture_env_combine3 GL_NV_texture_env_combine4 GL_EXT_texture_env_dot3 GL_ARB_multitexture GL_ARB_vertex_buffer_object GL_EXT_framebuffer_object GL_ARB_vertex_program GL_ARB_fragment_program GL_ARB_shading_language_100 GL_ARB_shader_objects GL_ARB_vertex_shader GL_ARB_fragment_shader GL_ARB_texture_cube_map GL_EXT_draw_range_elements" + (GL.currentContext.compressionExt ? " GL_ARB_texture_compression GL_EXT_texture_compression_s3tc" : "") + (GL.currentContext.anisotropicExt ? " GL_EXT_texture_filter_anisotropic" : ""));
    return GL.stringCache[name_] = ret;
   }
   return glGetString(name_);
  };
  GL.shaderInfos = {};
  var glCreateShader = _glCreateShader;
  _glCreateShader = _emscripten_glCreateShader = shaderType => {
   var id = glCreateShader(shaderType);
   GL.shaderInfos[id] = {
    type: shaderType,
    ftransform: false
   };
   return id;
  };
  function ensurePrecision(source) {
   if (!/precision +(low|medium|high)p +float *;/.test(source)) {
    source = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n" + source;
   }
   return source;
  }
  var glShaderSource = _glShaderSource;
  _glShaderSource = _emscripten_glShaderSource = (shader, count, string, length) => {
   var source = GL.getSource(shader, count, string, length);
   if (GL.shaderInfos[shader].type == GLctx.VERTEX_SHADER) {
    var has_pm = source.search(/u_projection/) >= 0;
    var has_mm = source.search(/u_modelView/) >= 0;
    var has_pv = source.search(/a_position/) >= 0;
    var need_pm = 0, need_mm = 0, need_pv = 0;
    var old = source;
    source = source.replace(/ftransform\(\)/g, "(u_projection * u_modelView * a_position)");
    if (old != source) need_pm = need_mm = need_pv = 1;
    old = source;
    source = source.replace(/gl_ProjectionMatrix/g, "u_projection");
    if (old != source) need_pm = 1;
    old = source;
    source = source.replace(/gl_ModelViewMatrixTranspose\[2\]/g, "vec4(u_modelView[0][2], u_modelView[1][2], u_modelView[2][2], u_modelView[3][2])");
    if (old != source) need_mm = 1;
    old = source;
    source = source.replace(/gl_ModelViewMatrix/g, "u_modelView");
    if (old != source) need_mm = 1;
    old = source;
    source = source.replace(/gl_Vertex/g, "a_position");
    if (old != source) need_pv = 1;
    old = source;
    source = source.replace(/gl_ModelViewProjectionMatrix/g, "(u_projection * u_modelView)");
    if (old != source) need_pm = need_mm = 1;
    if (need_pv && !has_pv) source = "attribute vec4 a_position; \n" + source;
    if (need_mm && !has_mm) source = "uniform mat4 u_modelView; \n" + source;
    if (need_pm && !has_pm) source = "uniform mat4 u_projection; \n" + source;
    GL.shaderInfos[shader].ftransform = need_pm || need_mm || need_pv;
    for (var i = 0; i < GLImmediate.MAX_TEXTURES; i++) {
     old = source;
     var need_vtc = source.search(`v_texCoord${i}`) == -1;
     source = source.replace(new RegExp(`gl_TexCoord\\[${i}\\]`, "g"), `v_texCoord${i}`).replace(new RegExp(`gl_MultiTexCoord${i}`, "g"), `a_texCoord${i}`);
     if (source != old) {
      source = `attribute vec4 a_texCoord${i}; \n${source}`;
      if (need_vtc) {
       source = `varying vec4 v_texCoord${i};   \n${source}`;
      }
     }
     old = source;
     source = source.replace(new RegExp(`gl_TextureMatrix\\[${i}\\]`, "g"), `u_textureMatrix${i}`);
     if (source != old) {
      source = `uniform mat4 u_textureMatrix${i}; \n${source}`;
     }
    }
    if (source.includes("gl_FrontColor")) {
     source = "varying vec4 v_color; \n" + source.replace(/gl_FrontColor/g, "v_color");
    }
    if (source.includes("gl_Color")) {
     source = "attribute vec4 a_color; \n" + source.replace(/gl_Color/g, "a_color");
    }
    if (source.includes("gl_Normal")) {
     source = "attribute vec3 a_normal; \n" + source.replace(/gl_Normal/g, "a_normal");
    }
    if (source.includes("gl_FogFragCoord")) {
     source = "varying float v_fogFragCoord;   \n" + source.replace(/gl_FogFragCoord/g, "v_fogFragCoord");
    }
   } else {
    for (i = 0; i < GLImmediate.MAX_TEXTURES; i++) {
     old = source;
     source = source.replace(new RegExp(`gl_TexCoord\\[${i}\\]`, "g"), `v_texCoord${i}`);
     if (source != old) {
      source = "varying vec4 v_texCoord" + i + ";   \n" + source;
     }
    }
    if (source.includes("gl_Color")) {
     source = "varying vec4 v_color; \n" + source.replace(/gl_Color/g, "v_color");
    }
    if (source.includes("gl_Fog.color")) {
     source = "uniform vec4 u_fogColor;   \n" + source.replace(/gl_Fog.color/g, "u_fogColor");
    }
    if (source.includes("gl_Fog.end")) {
     source = "uniform float u_fogEnd;   \n" + source.replace(/gl_Fog.end/g, "u_fogEnd");
    }
    if (source.includes("gl_Fog.scale")) {
     source = "uniform float u_fogScale;   \n" + source.replace(/gl_Fog.scale/g, "u_fogScale");
    }
    if (source.includes("gl_Fog.density")) {
     source = "uniform float u_fogDensity;   \n" + source.replace(/gl_Fog.density/g, "u_fogDensity");
    }
    if (source.includes("gl_FogFragCoord")) {
     source = "varying float v_fogFragCoord;   \n" + source.replace(/gl_FogFragCoord/g, "v_fogFragCoord");
    }
    source = ensurePrecision(source);
   }
   GLctx.shaderSource(GL.shaders[shader], source);
  };
  var glCompileShader = _glCompileShader;
  _glCompileShader = _emscripten_glCompileShader = shader => {
   GLctx.compileShader(GL.shaders[shader]);
  };
  GL.programShaders = {};
  var glAttachShader = _glAttachShader;
  _glAttachShader = _emscripten_glAttachShader = (program, shader) => {
   GL.programShaders[program] ||= [];
   GL.programShaders[program].push(shader);
   glAttachShader(program, shader);
  };
  var glDetachShader = _glDetachShader;
  _glDetachShader = _emscripten_glDetachShader = (program, shader) => {
   var programShader = GL.programShaders[program];
   if (!programShader) {
    err(`WARNING: _glDetachShader received invalid program: ${program}`);
    return;
   }
   var index = programShader.indexOf(shader);
   programShader.splice(index, 1);
   glDetachShader(program, shader);
  };
  var glUseProgram = _glUseProgram;
  _glUseProgram = _emscripten_glUseProgram = program => {
   if (GL.currProgram != program) {
    GLImmediate.currentRenderer = null;
    GL.currProgram = program;
    GLImmediate.fixedFunctionProgram = 0;
    glUseProgram(program);
   }
  };
  var glDeleteProgram = _glDeleteProgram;
  _glDeleteProgram = _emscripten_glDeleteProgram = program => {
   glDeleteProgram(program);
   if (program == GL.currProgram) {
    GLImmediate.currentRenderer = null;
    GL.currProgram = 0;
   }
  };
  var zeroUsedPrograms = {};
  var glBindAttribLocation = _glBindAttribLocation;
  _glBindAttribLocation = _emscripten_glBindAttribLocation = (program, index, name) => {
   if (index == 0) zeroUsedPrograms[program] = true;
   glBindAttribLocation(program, index, name);
  };
  var glLinkProgram = _glLinkProgram;
  _glLinkProgram = _emscripten_glLinkProgram = program => {
   if (!(program in zeroUsedPrograms)) {
    GLctx.bindAttribLocation(GL.programs[program], 0, "a_position");
   }
   glLinkProgram(program);
  };
  var glBindBuffer = _glBindBuffer;
  _glBindBuffer = _emscripten_glBindBuffer = (target, buffer) => {
   glBindBuffer(target, buffer);
   if (target == GLctx.ARRAY_BUFFER) {
    if (GLEmulation.currentVao) {
     GLEmulation.currentVao.arrayBuffer = buffer;
    }
   } else if (target == GLctx.ELEMENT_ARRAY_BUFFER) {
    if (GLEmulation.currentVao) GLEmulation.currentVao.elementArrayBuffer = buffer;
   }
  };
  var glGetFloatv = _glGetFloatv;
  _glGetFloatv = _emscripten_glGetFloatv = (pname, params) => {
   if (pname == 2982) {
    GROWABLE_HEAP_F32().set(GLImmediate.matrix[0], /*m*/ params >> 2);
   } else if (pname == 2983) {
    GROWABLE_HEAP_F32().set(GLImmediate.matrix[1], /*p*/ params >> 2);
   } else if (pname == 2984) {
    GROWABLE_HEAP_F32().set(GLImmediate.matrix[2 + /*t*/ GLImmediate.clientActiveTexture], params >> 2);
   } else if (pname == 2918) {
    GROWABLE_HEAP_F32().set(GLEmulation.fogColor, params >> 2);
   } else if (pname == 2915) {
    GROWABLE_HEAP_F32()[((params) >> 2)] = GLEmulation.fogStart;
   } else if (pname == 2916) {
    GROWABLE_HEAP_F32()[((params) >> 2)] = GLEmulation.fogEnd;
   } else if (pname == 2914) {
    GROWABLE_HEAP_F32()[((params) >> 2)] = GLEmulation.fogDensity;
   } else if (pname == 2917) {
    GROWABLE_HEAP_F32()[((params) >> 2)] = GLEmulation.fogMode;
   } else if (pname == 2899) {
    GROWABLE_HEAP_F32()[((params) >> 2)] = GLEmulation.lightModelAmbient[0];
    GROWABLE_HEAP_F32()[(((params) + (4)) >> 2)] = GLEmulation.lightModelAmbient[1];
    GROWABLE_HEAP_F32()[(((params) + (8)) >> 2)] = GLEmulation.lightModelAmbient[2];
    GROWABLE_HEAP_F32()[(((params) + (12)) >> 2)] = GLEmulation.lightModelAmbient[3];
   } else if (pname == 3010) {
    GROWABLE_HEAP_F32()[((params) >> 2)] = GLEmulation.alphaTestRef;
   } else {
    glGetFloatv(pname, params);
   }
  };
  var glHint = _glHint;
  _glHint = _emscripten_glHint = (target, mode) => {
   if (target == 34031) {
    return;
   }
   glHint(target, mode);
  };
  var glEnableVertexAttribArray = _glEnableVertexAttribArray;
  _glEnableVertexAttribArray = _emscripten_glEnableVertexAttribArray = index => {
   glEnableVertexAttribArray(index);
   GLEmulation.enabledVertexAttribArrays[index] = 1;
   if (GLEmulation.currentVao) GLEmulation.currentVao.enabledVertexAttribArrays[index] = 1;
  };
  var glDisableVertexAttribArray = _glDisableVertexAttribArray;
  _glDisableVertexAttribArray = _emscripten_glDisableVertexAttribArray = index => {
   glDisableVertexAttribArray(index);
   delete GLEmulation.enabledVertexAttribArrays[index];
   if (GLEmulation.currentVao) delete GLEmulation.currentVao.enabledVertexAttribArrays[index];
  };
  var glVertexAttribPointer = _glVertexAttribPointer;
  _glVertexAttribPointer = _emscripten_glVertexAttribPointer = (index, size, type, normalized, stride, pointer) => {
   glVertexAttribPointer(index, size, type, normalized, stride, pointer);
   if (GLEmulation.currentVao) {
    GLEmulation.currentVao.vertexAttribPointers[index] = [ index, size, type, normalized, stride, pointer ];
   }
  };
 },
 getAttributeFromCapability(cap) {
  var attrib = null;
  switch (cap) {
  case 3553:
  case 32888:
   attrib = GLImmediate.TEXTURE0 + GLImmediate.clientActiveTexture;
   break;

  case 32884:
   attrib = GLImmediate.VERTEX;
   break;

  case 32885:
   attrib = GLImmediate.NORMAL;
   break;

  case 32886:
   attrib = GLImmediate.COLOR;
   break;
  }
  return attrib;
 }
};

var emulGlGenVertexArrays = (n, vaos) => {
 for (var i = 0; i < n; i++) {
  var id = GL.getNewId(GLEmulation.vaos);
  GLEmulation.vaos[id] = {
   id: id,
   arrayBuffer: 0,
   elementArrayBuffer: 0,
   enabledVertexAttribArrays: {},
   vertexAttribPointers: {},
   enabledClientStates: {}
  };
  GROWABLE_HEAP_I32()[(((vaos) + (i * 4)) >> 2)] = id;
 }
};

function _glGenVertexArrays(n, arrays) {
 emulGlGenVertexArrays(n, arrays);
}

var _glGenVertexArraysOES = _glGenVertexArrays;

var _glGetAttribLocation = (program, name) => GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));

var _glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
 var log = GLctx.getProgramInfoLog(GL.programs[program]);
 if (log === null) log = "(unknown error)";
 var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
 if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = numBytesWrittenExclNull;
};

var _glGetProgramiv = (program, pname, p) => {
 if (!p) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (program >= GL.counter) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 program = GL.programs[program];
 if (pname == 35716) {
  var log = GLctx.getProgramInfoLog(program);
  if (log === null) log = "(unknown error)";
  GROWABLE_HEAP_I32()[((p) >> 2)] = log.length + 1;
 } else if (pname == 35719) /* GL_ACTIVE_UNIFORM_MAX_LENGTH */ {
  if (!program.maxUniformLength) {
   for (var i = 0; i < GLctx.getProgramParameter(program, 35718); /*GL_ACTIVE_UNIFORMS*/ ++i) {
    program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1);
   }
  }
  GROWABLE_HEAP_I32()[((p) >> 2)] = program.maxUniformLength;
 } else if (pname == 35722) /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */ {
  if (!program.maxAttributeLength) {
   for (var i = 0; i < GLctx.getProgramParameter(program, 35721); /*GL_ACTIVE_ATTRIBUTES*/ ++i) {
    program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1);
   }
  }
  GROWABLE_HEAP_I32()[((p) >> 2)] = program.maxAttributeLength;
 } else if (pname == 35381) /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */ {
  if (!program.maxUniformBlockNameLength) {
   for (var i = 0; i < GLctx.getProgramParameter(program, 35382); /*GL_ACTIVE_UNIFORM_BLOCKS*/ ++i) {
    program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1);
   }
  }
  GROWABLE_HEAP_I32()[((p) >> 2)] = program.maxUniformBlockNameLength;
 } else {
  GROWABLE_HEAP_I32()[((p) >> 2)] = GLctx.getProgramParameter(program, pname);
 }
};

var _glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
 var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
 if (log === null) log = "(unknown error)";
 var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
 if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = numBytesWrittenExclNull;
};

var _glGetShaderiv = (shader, pname, p) => {
 if (!p) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (pname == 35716) {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null) log = "(unknown error)";
  var logLength = log ? log.length + 1 : 0;
  GROWABLE_HEAP_I32()[((p) >> 2)] = logLength;
 } else if (pname == 35720) {
  var source = GLctx.getShaderSource(GL.shaders[shader]);
  var sourceLength = source ? source.length + 1 : 0;
  GROWABLE_HEAP_I32()[((p) >> 2)] = sourceLength;
 } else {
  GROWABLE_HEAP_I32()[((p) >> 2)] = GLctx.getShaderParameter(GL.shaders[shader], pname);
 }
};

/** @noinline */ var webglGetLeftBracePos = name => name.slice(-1) == "]" && name.lastIndexOf("[");

var webglPrepareUniformLocationsBeforeFirstUse = program => {
 var uniformLocsById = program.uniformLocsById,  uniformSizeAndIdsByName = program.uniformSizeAndIdsByName,  i, j;
 if (!uniformLocsById) {
  program.uniformLocsById = uniformLocsById = {};
  program.uniformArrayNamesById = {};
  for (i = 0; i < GLctx.getProgramParameter(program, 35718); /*GL_ACTIVE_UNIFORMS*/ ++i) {
   var u = GLctx.getActiveUniform(program, i);
   var nm = u.name;
   var sz = u.size;
   var lb = webglGetLeftBracePos(nm);
   var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
   var id = program.uniformIdCounter;
   program.uniformIdCounter += sz;
   uniformSizeAndIdsByName[arrayName] = [ sz, id ];
   for (j = 0; j < sz; ++j) {
    uniformLocsById[id] = j;
    program.uniformArrayNamesById[id++] = arrayName;
   }
  }
 }
};

var _glGetUniformLocation = (program, name) => {
 name = UTF8ToString(name);
 if (program = GL.programs[program]) {
  webglPrepareUniformLocationsBeforeFirstUse(program);
  var uniformLocsById = program.uniformLocsById;
  var arrayIndex = 0;
  var uniformBaseName = name;
  var leftBrace = webglGetLeftBracePos(name);
  if (leftBrace > 0) {
   arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
   uniformBaseName = name.slice(0, leftBrace);
  }
  var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
  if (sizeAndId && arrayIndex < sizeAndId[0]) {
   arrayIndex += sizeAndId[1];
   if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
    return arrayIndex;
   }
  }
 } else {
  GL.recordError(1281);
 }
 /* GL_INVALID_VALUE */ return -1;
};

var _glIsProgram = program => {
 program = GL.programs[program];
 if (!program) return 0;
 return GLctx.isProgram(program);
};

var _glPixelStorei = (pname, param) => {
 if (pname == 3317) /* GL_UNPACK_ALIGNMENT */ {
  GL.unpackAlignment = param;
 }
 GLctx.pixelStorei(pname, param);
};

function _glRenderbufferStorage(x0, x1, x2, x3) {
 GLctx.renderbufferStorage(x0, x1, x2, x3);
}

function _glScissor(x0, x1, x2, x3) {
 GLctx.scissor(x0, x1, x2, x3);
}

var computeUnpackAlignedImageSize = (width, height, sizePerPixel, alignment) => {
 function roundedToNextMultipleOf(x, y) {
  return (x + y - 1) & -y;
 }
 var plainRowSize = width * sizePerPixel;
 var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
 return height * alignedRowSize;
};

var colorChannelsInGlTextureFormat = format => {
 var colorChannels = {
  5: 3,
  6: 4,
  8: 2,
  29502: 3,
  29504: 4,
  26917: 2,
  26918: 2,
  29846: 3,
  29847: 4
 };
 return colorChannels[format - 6402] || 1;
};

var heapObjectForWebGLType = type => {
 type -= 5120;
 if (type == 0) return GROWABLE_HEAP_I8();
 if (type == 1) return GROWABLE_HEAP_U8();
 if (type == 2) return GROWABLE_HEAP_I16();
 if (type == 4) return GROWABLE_HEAP_I32();
 if (type == 6) return GROWABLE_HEAP_F32();
 if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return GROWABLE_HEAP_U32();
 return GROWABLE_HEAP_U16();
};

var heapAccessShiftForWebGLHeap = heap => 31 - Math.clz32(heap.BYTES_PER_ELEMENT);

var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
 var heap = heapObjectForWebGLType(type);
 var shift = heapAccessShiftForWebGLHeap(heap);
 var byteSize = 1 << shift;
 var sizePerPixel = colorChannelsInGlTextureFormat(format) * byteSize;
 var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
 return heap.subarray(pixels >> shift, pixels + bytes >> shift);
};

var _glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
 if (GL.currentContext.version >= 2) {
  if (GLctx.currentPixelUnpackBufferBinding) {
   GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
  } else if (pixels) {
   var heap = heapObjectForWebGLType(type);
   GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
  } else {
   GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null);
  }
  return;
 }
 GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
};

function _glTexParameteri(x0, x1, x2) {
 GLctx.texParameteri(x0, x1, x2);
}

var webglGetUniformLocation = location => {
 var p = GLctx.currentProgram;
 if (p) {
  var webglLoc = p.uniformLocsById[location];
  if (typeof webglLoc == "number") {
   p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ""));
  }
  return webglLoc;
 } else {
  GL.recordError(1282);
 }
};

var _glUniform1i = (location, v0) => {
 GLctx.uniform1i(webglGetUniformLocation(location), v0);
};

var _glUniform3f = (location, v0, v1, v2) => {
 GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
};

var _glUniform4f = (location, v0, v1, v2, v3) => {
 GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3);
};

var miniTempWebGLFloatBuffers = [];

var _glUniformMatrix4fv = (location, count, transpose, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 16);
  return;
 }
 if (count <= 18) {
  var view = miniTempWebGLFloatBuffers[16 * count - 1];
  var heap = GROWABLE_HEAP_F32();
  value >>= 2;
  for (var i = 0; i < 16 * count; i += 16) {
   var dst = value + i;
   view[i] = heap[dst];
   view[i + 1] = heap[dst + 1];
   view[i + 2] = heap[dst + 2];
   view[i + 3] = heap[dst + 3];
   view[i + 4] = heap[dst + 4];
   view[i + 5] = heap[dst + 5];
   view[i + 6] = heap[dst + 6];
   view[i + 7] = heap[dst + 7];
   view[i + 8] = heap[dst + 8];
   view[i + 9] = heap[dst + 9];
   view[i + 10] = heap[dst + 10];
   view[i + 11] = heap[dst + 11];
   view[i + 12] = heap[dst + 12];
   view[i + 13] = heap[dst + 13];
   view[i + 14] = heap[dst + 14];
   view[i + 15] = heap[dst + 15];
  }
 } else {
  var view = GROWABLE_HEAP_F32().subarray((value) >> 2, (value + count * 64) >> 2);
 }
 GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
};

function _glViewport(x0, x1, x2, x3) {
 GLctx.viewport(x0, x1, x2, x3);
}

/** @constructor */ function GLFW_Window(id, width, height, framebufferWidth, framebufferHeight, title, monitor, share) {
 this.id = id;
 this.x = 0;
 this.y = 0;
 this.fullscreen = false;
 this.storedX = 0;
 this.storedY = 0;
 this.width = width;
 this.height = height;
 this.framebufferWidth = framebufferWidth;
 this.framebufferHeight = framebufferHeight;
 this.storedWidth = width;
 this.storedHeight = height;
 this.title = title;
 this.monitor = monitor;
 this.share = share;
 this.attributes = Object.assign({}, GLFW.hints);
 this.inputModes = {
  208897: 212993,
  208898: 0,
  208899: 0
 };
 this.buttons = 0;
 this.keys = new Array;
 this.domKeys = new Array;
 this.shouldClose = 0;
 this.title = null;
 this.windowPosFunc = 0;
 this.windowSizeFunc = 0;
 this.windowCloseFunc = 0;
 this.windowRefreshFunc = 0;
 this.windowFocusFunc = 0;
 this.windowIconifyFunc = 0;
 this.windowMaximizeFunc = 0;
 this.framebufferSizeFunc = 0;
 this.windowContentScaleFunc = 0;
 this.mouseButtonFunc = 0;
 this.cursorPosFunc = 0;
 this.cursorEnterFunc = 0;
 this.scrollFunc = 0;
 this.dropFunc = 0;
 this.keyFunc = 0;
 this.charFunc = 0;
 this.userptr = 0;
}

function _emscripten_set_window_title(title) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(47, 1, title);
 return document.title = UTF8ToString(title);
}

var GLFW = {
 WindowFromId: id => {
  if (id <= 0 || !GLFW.windows) return null;
  return GLFW.windows[id - 1];
 },
 joystickFunc: 0,
 errorFunc: 0,
 monitorFunc: 0,
 active: null,
 scale: null,
 windows: null,
 monitors: null,
 monitorString: null,
 versionString: null,
 initialTime: null,
 extensions: null,
 devicePixelRatioMQL: null,
 hints: null,
 primaryTouchId: null,
 defaultHints: {
  131073: 0,
  131074: 0,
  131075: 1,
  131076: 1,
  131077: 1,
  131082: 0,
  135169: 8,
  135170: 8,
  135171: 8,
  135172: 8,
  135173: 24,
  135174: 8,
  135175: 0,
  135176: 0,
  135177: 0,
  135178: 0,
  135179: 0,
  135180: 0,
  135181: 0,
  135182: 0,
  135183: 0,
  139265: 196609,
  139266: 1,
  139267: 0,
  139268: 0,
  139269: 0,
  139270: 0,
  139271: 0,
  139272: 0,
  139276: 0
 },
 DOMToGLFWKeyCode: keycode => {
  switch (keycode) {
  case 32:
   return 32;

  case 222:
   return 39;

  case 188:
   return 44;

  case 173:
   return 45;

  case 189:
   return 45;

  case 190:
   return 46;

  case 191:
   return 47;

  case 48:
   return 48;

  case 49:
   return 49;

  case 50:
   return 50;

  case 51:
   return 51;

  case 52:
   return 52;

  case 53:
   return 53;

  case 54:
   return 54;

  case 55:
   return 55;

  case 56:
   return 56;

  case 57:
   return 57;

  case 59:
   return 59;

  case 61:
   return 61;

  case 187:
   return 61;

  case 65:
   return 65;

  case 66:
   return 66;

  case 67:
   return 67;

  case 68:
   return 68;

  case 69:
   return 69;

  case 70:
   return 70;

  case 71:
   return 71;

  case 72:
   return 72;

  case 73:
   return 73;

  case 74:
   return 74;

  case 75:
   return 75;

  case 76:
   return 76;

  case 77:
   return 77;

  case 78:
   return 78;

  case 79:
   return 79;

  case 80:
   return 80;

  case 81:
   return 81;

  case 82:
   return 82;

  case 83:
   return 83;

  case 84:
   return 84;

  case 85:
   return 85;

  case 86:
   return 86;

  case 87:
   return 87;

  case 88:
   return 88;

  case 89:
   return 89;

  case 90:
   return 90;

  case 219:
   return 91;

  case 220:
   return 92;

  case 221:
   return 93;

  case 192:
   return 96;

  case 27:
   return 256;

  case 13:
   return 257;

  case 9:
   return 258;

  case 8:
   return 259;

  case 45:
   return 260;

  case 46:
   return 261;

  case 39:
   return 262;

  case 37:
   return 263;

  case 40:
   return 264;

  case 38:
   return 265;

  case 33:
   return 266;

  case 34:
   return 267;

  case 36:
   return 268;

  case 35:
   return 269;

  case 20:
   return 280;

  case 145:
   return 281;

  case 144:
   return 282;

  case 44:
   return 283;

  case 19:
   return 284;

  case 112:
   return 290;

  case 113:
   return 291;

  case 114:
   return 292;

  case 115:
   return 293;

  case 116:
   return 294;

  case 117:
   return 295;

  case 118:
   return 296;

  case 119:
   return 297;

  case 120:
   return 298;

  case 121:
   return 299;

  case 122:
   return 300;

  case 123:
   return 301;

  case 124:
   return 302;

  case 125:
   return 303;

  case 126:
   return 304;

  case 127:
   return 305;

  case 128:
   return 306;

  case 129:
   return 307;

  case 130:
   return 308;

  case 131:
   return 309;

  case 132:
   return 310;

  case 133:
   return 311;

  case 134:
   return 312;

  case 135:
   return 313;

  case 136:
   return 314;

  case 96:
   return 320;

  case 97:
   return 321;

  case 98:
   return 322;

  case 99:
   return 323;

  case 100:
   return 324;

  case 101:
   return 325;

  case 102:
   return 326;

  case 103:
   return 327;

  case 104:
   return 328;

  case 105:
   return 329;

  case 110:
   return 330;

  case 111:
   return 331;

  case 106:
   return 332;

  case 109:
   return 333;

  case 107:
   return 334;

  case 16:
   return 340;

  case 17:
   return 341;

  case 18:
   return 342;

  case 91:
   return 343;

  case 93:
   return 348;

  default:
   return -1;
  }
 },
 getModBits: win => {
  var mod = 0;
  if (win.keys[340]) mod |= 1;
  if (win.keys[341]) mod |= 2;
  if (win.keys[342]) mod |= 4;
  if (win.keys[343]) mod |= 8;
  return mod;
 },
 onKeyPress: event => {
  if (!GLFW.active || !GLFW.active.charFunc) return;
  if (event.ctrlKey || event.metaKey) return;
  var charCode = event.charCode;
  if (charCode == 0 || (charCode >= 0 && charCode <= 31)) return;
  getWasmTableEntry(GLFW.active.charFunc)(GLFW.active.id, charCode);
 },
 onKeyChanged: (keyCode, status) => {
  if (!GLFW.active) return;
  var key = GLFW.DOMToGLFWKeyCode(keyCode);
  if (key == -1) return;
  var repeat = status && GLFW.active.keys[key];
  GLFW.active.keys[key] = status;
  GLFW.active.domKeys[keyCode] = status;
  if (GLFW.active.keyFunc) {
   if (repeat) status = 2;
   getWasmTableEntry(GLFW.active.keyFunc)(GLFW.active.id, key, keyCode, status, GLFW.getModBits(GLFW.active));
  }
 },
 onGamepadConnected: event => {
  GLFW.refreshJoysticks();
 },
 onGamepadDisconnected: event => {
  GLFW.refreshJoysticks();
 },
 onKeydown: event => {
  GLFW.onKeyChanged(event.keyCode, 1);
  if (event.keyCode === 8 || /* backspace */ event.keyCode === 9) /* tab */ {
   event.preventDefault();
  }
 },
 onKeyup: event => {
  GLFW.onKeyChanged(event.keyCode, 0);
 },
 onBlur: event => {
  if (!GLFW.active) return;
  for (var i = 0; i < GLFW.active.domKeys.length; ++i) {
   if (GLFW.active.domKeys[i]) {
    GLFW.onKeyChanged(i, 0);
   }
  }
 },
 onMousemove: event => {
  if (!GLFW.active) return;
  if (event.type === "touchmove") {
   event.preventDefault();
   let primaryChanged = false;
   for (let i of event.changedTouches) {
    if (GLFW.primaryTouchId === i.identifier) {
     Browser.setMouseCoords(i.pageX, i.pageY);
     primaryChanged = true;
     break;
    }
   }
   if (!primaryChanged) {
    return;
   }
  } else {
   Browser.calculateMouseEvent(event);
  }
  if (event.target != Module["canvas"] || !GLFW.active.cursorPosFunc) return;
  if (GLFW.active.cursorPosFunc) {
   getWasmTableEntry(GLFW.active.cursorPosFunc)(GLFW.active.id, Browser.mouseX, Browser.mouseY);
  }
 },
 DOMToGLFWMouseButton: event => {
  var eventButton = event["button"];
  if (eventButton > 0) {
   if (eventButton == 1) {
    eventButton = 2;
   } else {
    eventButton = 1;
   }
  }
  return eventButton;
 },
 onMouseenter: event => {
  if (!GLFW.active) return;
  if (event.target != Module["canvas"]) return;
  if (GLFW.active.cursorEnterFunc) {
   getWasmTableEntry(GLFW.active.cursorEnterFunc)(GLFW.active.id, 1);
  }
 },
 onMouseleave: event => {
  if (!GLFW.active) return;
  if (event.target != Module["canvas"]) return;
  if (GLFW.active.cursorEnterFunc) {
   getWasmTableEntry(GLFW.active.cursorEnterFunc)(GLFW.active.id, 0);
  }
 },
 onMouseButtonChanged: (event, status) => {
  if (!GLFW.active) return;
  if (event.target != Module["canvas"]) return;
  const isTouchType = event.type === "touchstart" || event.type === "touchend" || event.type === "touchcancel";
  let eventButton = 0;
  if (isTouchType) {
   event.preventDefault();
   let primaryChanged = false;
   if (GLFW.primaryTouchId === null && event.type === "touchstart" && event.targetTouches.length > 0) {
    const chosenTouch = event.targetTouches[0];
    GLFW.primaryTouchId = chosenTouch.identifier;
    Browser.setMouseCoords(chosenTouch.pageX, chosenTouch.pageY);
    primaryChanged = true;
   } else if (event.type === "touchend" || event.type === "touchcancel") {
    for (let i of event.changedTouches) {
     if (GLFW.primaryTouchId === i.identifier) {
      GLFW.primaryTouchId = null;
      primaryChanged = true;
      break;
     }
    }
   }
   if (!primaryChanged) {
    return;
   }
  } else {
   Browser.calculateMouseEvent(event);
   eventButton = GLFW.DOMToGLFWMouseButton(event);
  }
  if (status == 1) {
   GLFW.active.buttons |= (1 << eventButton);
   try {
    event.target.setCapture();
   } catch (e) {}
  } else {
   GLFW.active.buttons &= ~(1 << eventButton);
  }
  if (GLFW.active.mouseButtonFunc) {
   getWasmTableEntry(GLFW.active.mouseButtonFunc)(GLFW.active.id, eventButton, status, GLFW.getModBits(GLFW.active));
  }
 },
 onMouseButtonDown: event => {
  if (!GLFW.active) return;
  GLFW.onMouseButtonChanged(event, 1);
 },
 onMouseButtonUp: event => {
  if (!GLFW.active) return;
  GLFW.onMouseButtonChanged(event, 0);
 },
 onMouseWheel: event => {
  var delta = -Browser.getMouseWheelDelta(event);
  delta = (delta == 0) ? 0 : (delta > 0 ? Math.max(delta, 1) : Math.min(delta, -1));
  GLFW.wheelPos += delta;
  if (!GLFW.active || !GLFW.active.scrollFunc || event.target != Module["canvas"]) return;
  var sx = 0;
  var sy = delta;
  if (event.type == "mousewheel") {
   sx = event.wheelDeltaX;
  } else {
   sx = event.deltaX;
  }
  getWasmTableEntry(GLFW.active.scrollFunc)(GLFW.active.id, sx, sy);
  event.preventDefault();
 },
 onCanvasResize: (width, height, framebufferWidth, framebufferHeight) => {
  if (!GLFW.active) return;
  var resizeNeeded = false;
  if (document["fullscreen"] || document["fullScreen"] || document["mozFullScreen"] || document["webkitIsFullScreen"]) {
   if (!GLFW.active.fullscreen) {
    resizeNeeded = width != screen.width || height != screen.height;
    GLFW.active.storedX = GLFW.active.x;
    GLFW.active.storedY = GLFW.active.y;
    GLFW.active.storedWidth = GLFW.active.width;
    GLFW.active.storedHeight = GLFW.active.height;
    GLFW.active.x = GLFW.active.y = 0;
    GLFW.active.width = screen.width;
    GLFW.active.height = screen.height;
    GLFW.active.fullscreen = true;
   }
  } else  if (GLFW.active.fullscreen == true) {
   resizeNeeded = width != GLFW.active.storedWidth || height != GLFW.active.storedHeight;
   GLFW.active.x = GLFW.active.storedX;
   GLFW.active.y = GLFW.active.storedY;
   GLFW.active.width = GLFW.active.storedWidth;
   GLFW.active.height = GLFW.active.storedHeight;
   GLFW.active.fullscreen = false;
  }
  if (resizeNeeded) {
   Browser.setCanvasSize(GLFW.active.width, GLFW.active.height);
  } else if (GLFW.active.width != width || GLFW.active.height != height || GLFW.active.framebufferWidth != framebufferWidth || GLFW.active.framebufferHeight != framebufferHeight) {
   GLFW.active.width = width;
   GLFW.active.height = height;
   GLFW.active.framebufferWidth = framebufferWidth;
   GLFW.active.framebufferHeight = framebufferHeight;
   GLFW.onWindowSizeChanged();
   GLFW.onFramebufferSizeChanged();
  }
 },
 onWindowSizeChanged: () => {
  if (!GLFW.active) return;
  if (GLFW.active.windowSizeFunc) {
   getWasmTableEntry(GLFW.active.windowSizeFunc)(GLFW.active.id, GLFW.active.width, GLFW.active.height);
  }
 },
 onFramebufferSizeChanged: () => {
  if (!GLFW.active) return;
  if (GLFW.active.framebufferSizeFunc) {
   getWasmTableEntry(GLFW.active.framebufferSizeFunc)(GLFW.active.id, GLFW.active.framebufferWidth, GLFW.active.framebufferHeight);
  }
 },
 onWindowContentScaleChanged: scale => {
  GLFW.scale = scale;
  if (!GLFW.active) return;
  if (GLFW.active.windowContentScaleFunc) {
   getWasmTableEntry(GLFW.active.windowContentScaleFunc)(GLFW.active.id, GLFW.scale, GLFW.scale);
  }
 },
 getTime: () => _emscripten_get_now() / 1e3,
 setWindowTitle: (winid, title) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return;
  win.title = title;
  if (GLFW.active.id == win.id) {
   _emscripten_set_window_title(title);
  }
 },
 setJoystickCallback: cbfun => {
  var prevcbfun = GLFW.joystickFunc;
  GLFW.joystickFunc = cbfun;
  GLFW.refreshJoysticks();
  return prevcbfun;
 },
 joys: {},
 lastGamepadState: [],
 lastGamepadStateFrame: null,
 refreshJoysticks: () => {
  if (Browser.mainLoop.currentFrameNumber !== GLFW.lastGamepadStateFrame || !Browser.mainLoop.currentFrameNumber) {
   GLFW.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads || []);
   GLFW.lastGamepadStateFrame = Browser.mainLoop.currentFrameNumber;
   for (var joy = 0; joy < GLFW.lastGamepadState.length; ++joy) {
    var gamepad = GLFW.lastGamepadState[joy];
    if (gamepad) {
     if (!GLFW.joys[joy]) {
      out("glfw joystick connected:", joy);
      GLFW.joys[joy] = {
       id: stringToNewUTF8(gamepad.id),
       buttonsCount: gamepad.buttons.length,
       axesCount: gamepad.axes.length,
       buttons: _malloc(gamepad.buttons.length),
       axes: _malloc(gamepad.axes.length * 4)
      };
      if (GLFW.joystickFunc) {
       getWasmTableEntry(GLFW.joystickFunc)(joy, 262145);
      }
     }
     var data = GLFW.joys[joy];
     for (var i = 0; i < gamepad.buttons.length; ++i) {
      GROWABLE_HEAP_I8()[((data.buttons + i) >> 0)] = gamepad.buttons[i].pressed;
     }
     for (var i = 0; i < gamepad.axes.length; ++i) {
      GROWABLE_HEAP_F32()[((data.axes + i * 4) >> 2)] = gamepad.axes[i];
     }
    } else {
     if (GLFW.joys[joy]) {
      out("glfw joystick disconnected", joy);
      if (GLFW.joystickFunc) {
       getWasmTableEntry(GLFW.joystickFunc)(joy, 262146);
      }
      _free(GLFW.joys[joy].id);
      _free(GLFW.joys[joy].buttons);
      _free(GLFW.joys[joy].axes);
      delete GLFW.joys[joy];
     }
    }
   }
  }
 },
 setKeyCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.keyFunc;
  win.keyFunc = cbfun;
  return prevcbfun;
 },
 setCharCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.charFunc;
  win.charFunc = cbfun;
  return prevcbfun;
 },
 setMouseButtonCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.mouseButtonFunc;
  win.mouseButtonFunc = cbfun;
  return prevcbfun;
 },
 setCursorPosCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.cursorPosFunc;
  win.cursorPosFunc = cbfun;
  return prevcbfun;
 },
 setScrollCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.scrollFunc;
  win.scrollFunc = cbfun;
  return prevcbfun;
 },
 setDropCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.dropFunc;
  win.dropFunc = cbfun;
  return prevcbfun;
 },
 onDrop: event => {
  if (!GLFW.active || !GLFW.active.dropFunc) return;
  if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length == 0) return;
  event.preventDefault();
  var filenames = _malloc(event.dataTransfer.files.length * 4);
  var filenamesArray = [];
  var count = event.dataTransfer.files.length;
  var written = 0;
  var drop_dir = ".glfw_dropped_files";
  FS.createPath("/", drop_dir);
  function save(file) {
   var path = "/" + drop_dir + "/" + file.name.replace(/\//g, "_");
   var reader = new FileReader;
   reader.onloadend = e => {
    if (reader.readyState != 2) {
     ++written;
     out("failed to read dropped file: " + file.name + ": " + reader.error);
     return;
    }
    var data = e.target.result;
    FS.writeFile(path, new Uint8Array(data));
    if (++written === count) {
     getWasmTableEntry(GLFW.active.dropFunc)(GLFW.active.id, count, filenames);
     for (var i = 0; i < filenamesArray.length; ++i) {
      _free(filenamesArray[i]);
     }
     _free(filenames);
    }
   };
   reader.readAsArrayBuffer(file);
   var filename = stringToNewUTF8(path);
   filenamesArray.push(filename);
   GROWABLE_HEAP_U32()[((filenames + i * 4) >> 2)] = filename;
  }
  for (var i = 0; i < count; ++i) {
   save(event.dataTransfer.files[i]);
  }
  return false;
 },
 onDragover: event => {
  if (!GLFW.active || !GLFW.active.dropFunc) return;
  event.preventDefault();
  return false;
 },
 setWindowSizeCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.windowSizeFunc;
  win.windowSizeFunc = cbfun;
  return prevcbfun;
 },
 setWindowCloseCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.windowCloseFunc;
  win.windowCloseFunc = cbfun;
  return prevcbfun;
 },
 setWindowRefreshCallback: (winid, cbfun) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return null;
  var prevcbfun = win.windowRefreshFunc;
  win.windowRefreshFunc = cbfun;
  return prevcbfun;
 },
 onClickRequestPointerLock: e => {
  if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
   Module["canvas"].requestPointerLock();
   e.preventDefault();
  }
 },
 setInputMode: (winid, mode, value) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return;
  switch (mode) {
  case 208897:
   {
    switch (value) {
    case 212993:
     {
      win.inputModes[mode] = value;
      Module["canvas"].removeEventListener("click", GLFW.onClickRequestPointerLock, true);
      Module["canvas"].exitPointerLock();
      break;
     }

    case 212994:
     {
      err("glfwSetInputMode called with GLFW_CURSOR_HIDDEN value not implemented");
      break;
     }

    case 212995:
     {
      win.inputModes[mode] = value;
      Module["canvas"].addEventListener("click", GLFW.onClickRequestPointerLock, true);
      Module["canvas"].requestPointerLock();
      break;
     }

    default:
     {
      err(`glfwSetInputMode called with unknown value parameter value: ${value}`);
      break;
     }
    }
    break;
   }

  case 208898:
   {
    err("glfwSetInputMode called with GLFW_STICKY_KEYS mode not implemented");
    break;
   }

  case 208899:
   {
    err("glfwSetInputMode called with GLFW_STICKY_MOUSE_BUTTONS mode not implemented");
    break;
   }

  case 208900:
   {
    err("glfwSetInputMode called with GLFW_LOCK_KEY_MODS mode not implemented");
    break;
   }

  case 3342341:
   {
    err("glfwSetInputMode called with GLFW_RAW_MOUSE_MOTION mode not implemented");
    break;
   }

  default:
   {
    err(`glfwSetInputMode called with unknown mode parameter value: ${mode}`);
    break;
   }
  }
 },
 getKey: (winid, key) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return 0;
  return win.keys[key];
 },
 getMouseButton: (winid, button) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return 0;
  return (win.buttons & (1 << button)) > 0;
 },
 getCursorPos: (winid, x, y) => {
  GROWABLE_HEAP_F64()[((x) >> 3)] = Browser.mouseX;
  GROWABLE_HEAP_F64()[((y) >> 3)] = Browser.mouseY;
 },
 getMousePos: (winid, x, y) => {
  GROWABLE_HEAP_I32()[((x) >> 2)] = Browser.mouseX;
  GROWABLE_HEAP_I32()[((y) >> 2)] = Browser.mouseY;
 },
 setCursorPos: (winid, x, y) => {},
 getWindowPos: (winid, x, y) => {
  var wx = 0;
  var wy = 0;
  var win = GLFW.WindowFromId(winid);
  if (win) {
   wx = win.x;
   wy = win.y;
  }
  if (x) {
   GROWABLE_HEAP_I32()[((x) >> 2)] = wx;
  }
  if (y) {
   GROWABLE_HEAP_I32()[((y) >> 2)] = wy;
  }
 },
 setWindowPos: (winid, x, y) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return;
  win.x = x;
  win.y = y;
 },
 getWindowSize: (winid, width, height) => {
  var ww = 0;
  var wh = 0;
  var win = GLFW.WindowFromId(winid);
  if (win) {
   ww = win.width;
   wh = win.height;
  }
  if (width) {
   GROWABLE_HEAP_I32()[((width) >> 2)] = ww;
  }
  if (height) {
   GROWABLE_HEAP_I32()[((height) >> 2)] = wh;
  }
 },
 setWindowSize: (winid, width, height) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return;
  if (GLFW.active.id == win.id) {
   Browser.setCanvasSize(width, height);
  }
 },
 defaultWindowHints: () => {
  GLFW.hints = Object.assign({}, GLFW.defaultHints);
 },
 createWindow: (width, height, title, monitor, share) => {
  var i, id;
  for (i = 0; i < GLFW.windows.length && GLFW.windows[i] !== null; i++) {}
  if (i > 0) throw "glfwCreateWindow only supports one window at time currently";
  id = i + 1;
  if (width <= 0 || height <= 0) return 0;
  if (monitor) {
   Browser.requestFullscreen();
  } else {
   Browser.setCanvasSize(width, height);
  }
  for (i = 0; i < GLFW.windows.length && GLFW.windows[i] == null; i++) {}
  var useWebGL = GLFW.hints[139265] > 0;
  if (i == GLFW.windows.length) {
   if (useWebGL) {
    var contextAttributes = {
     antialias: (GLFW.hints[135181] > 1),
     depth: (GLFW.hints[135173] > 0),
     stencil: (GLFW.hints[135174] > 0),
     alpha: (GLFW.hints[135172] > 0)
    };
    Module.ctx = Browser.createContext(Module["canvas"], true, true, contextAttributes);
   } else {
    Browser.init();
   }
  }
  if (!Module.ctx && useWebGL) return 0;
  const canvas = Module["canvas"];
  var win = new GLFW_Window(id, canvas.clientWidth, canvas.clientHeight, canvas.width, canvas.height, title, monitor, share);
  if (id - 1 == GLFW.windows.length) {
   GLFW.windows.push(win);
  } else {
   GLFW.windows[id - 1] = win;
  }
  GLFW.active = win;
  GLFW.adjustCanvasDimensions();
  return win.id;
 },
 destroyWindow: winid => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return;
  if (win.windowCloseFunc) {
   getWasmTableEntry(win.windowCloseFunc)(win.id);
  }
  GLFW.windows[win.id - 1] = null;
  if (GLFW.active.id == win.id) GLFW.active = null;
  for (var i = 0; i < GLFW.windows.length; i++) if (GLFW.windows[i] !== null) return;
  Module.ctx = Browser.destroyContext(Module["canvas"], true, true);
 },
 swapBuffers: winid => {},
 requestFullscreen(lockPointer, resizeCanvas) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
  var canvas = Module["canvas"];
  function fullscreenChange() {
   Browser.isFullscreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.exitFullscreen = Browser.exitFullscreen;
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullscreen = true;
    if (Browser.resizeCanvas) {
     Browser.setFullscreenCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
     Browser.updateResizeListeners();
    }
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) {
     Browser.setWindowedCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
     Browser.updateResizeListeners();
    }
   }
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
   if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
  }
  if (!Browser.fullscreenHandlersInstalled) {
   Browser.fullscreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullscreenChange, false);
   document.addEventListener("mozfullscreenchange", fullscreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
   document.addEventListener("MSFullscreenChange", fullscreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
  canvasContainer.requestFullscreen();
 },
 updateCanvasDimensions(canvas, wNative, hNative) {
  const scale = GLFW.getHiDPIScale();
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if (((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode) && (typeof screen != "undefined")) {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   wNative = w;
   hNative = h;
  }
  const wNativeScaled = Math.floor(wNative * scale);
  const hNativeScaled = Math.floor(hNative * scale);
  if (canvas.width != wNativeScaled) canvas.width = wNativeScaled;
  if (canvas.height != hNativeScaled) canvas.height = hNativeScaled;
  if (typeof canvas.style != "undefined") {
   if (wNativeScaled != wNative || hNativeScaled != hNative) {
    canvas.style.setProperty("width", wNative + "px", "important");
    canvas.style.setProperty("height", hNative + "px", "important");
   } else {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  }
 },
 calculateMouseCoords(pageX, pageY) {
  var rect = Module["canvas"].getBoundingClientRect();
  var cw = Module["canvas"].clientWidth;
  var ch = Module["canvas"].clientHeight;
  var scrollX = ((typeof window.scrollX != "undefined") ? window.scrollX : window.pageXOffset);
  var scrollY = ((typeof window.scrollY != "undefined") ? window.scrollY : window.pageYOffset);
  var adjustedX = pageX - (scrollX + rect.left);
  var adjustedY = pageY - (scrollY + rect.top);
  adjustedX = adjustedX * (cw / rect.width);
  adjustedY = adjustedY * (ch / rect.height);
  return {
   x: adjustedX,
   y: adjustedY
  };
 },
 setWindowAttrib: (winid, attrib, value) => {
  var win = GLFW.WindowFromId(winid);
  if (!win) return;
  const isHiDPIAware = GLFW.isHiDPIAware();
  win.attributes[attrib] = value;
  if (isHiDPIAware !== GLFW.isHiDPIAware()) GLFW.adjustCanvasDimensions();
 },
 getDevicePixelRatio() {
  return (typeof devicePixelRatio == "number" && devicePixelRatio) || 1;
 },
 isHiDPIAware() {
  if (GLFW.active) return GLFW.active.attributes[139276] > 0; else return false;
 },
 adjustCanvasDimensions() {
  const canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, canvas.clientWidth, canvas.clientHeight);
  Browser.updateResizeListeners();
 },
 getHiDPIScale() {
  return GLFW.isHiDPIAware() ? GLFW.scale : 1;
 },
 onDevicePixelRatioChange() {
  GLFW.onWindowContentScaleChanged(GLFW.getDevicePixelRatio());
  GLFW.adjustCanvasDimensions();
 },
 GLFW2ParamToGLFW3Param: param => {
  var table = {
   196609: 0,
   196610: 0,
   196611: 0,
   196612: 0,
   196613: 0,
   196614: 0,
   131073: 0,
   131074: 0,
   131075: 0,
   131076: 0,
   131077: 135169,
   131078: 135170,
   131079: 135171,
   131080: 135172,
   131081: 135173,
   131082: 135174,
   131083: 135183,
   131084: 135175,
   131085: 135176,
   131086: 135177,
   131087: 135178,
   131088: 135179,
   131089: 135180,
   131090: 0,
   131091: 135181,
   131092: 139266,
   131093: 139267,
   131094: 139270,
   131095: 139271,
   131096: 139272
  };
  return table[param];
 }
};

var _glfwCreateStandardCursor = shape => {};

var _glfwCreateWindow = (width, height, title, monitor, share) => GLFW.createWindow(width, height, title, monitor, share);

var _glfwDestroyCursor = cursor => {};

var _glfwDestroyWindow = winid => GLFW.destroyWindow(winid);

var _glfwFocusWindow = winid => {};

var _glfwGetCurrentContext = () => GLFW.active ? GLFW.active.id : 0;

var _glfwGetCursorPos = (winid, x, y) => GLFW.getCursorPos(winid, x, y);

var _glfwGetFramebufferSize = (winid, width, height) => {
 var ww = 0;
 var wh = 0;
 var win = GLFW.WindowFromId(winid);
 if (win) {
  ww = win.framebufferWidth;
  wh = win.framebufferHeight;
 }
 if (width) {
  GROWABLE_HEAP_I32()[((width) >> 2)] = ww;
 }
 if (height) {
  GROWABLE_HEAP_I32()[((height) >> 2)] = wh;
 }
};

var _glfwGetInputMode = (winid, mode) => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return;
 switch (mode) {
 case 208897:
  {
   if (Browser.pointerLock) {
    win.inputModes[mode] = 212995;
   } else  {
    win.inputModes[mode] = 212993;
   }
  }
 }
 return win.inputModes[mode];
};

var _glfwGetJoystickAxes = (joy, count) => {
 GLFW.refreshJoysticks();
 var state = GLFW.joys[joy];
 if (!state || !state.axes) {
  GROWABLE_HEAP_I32()[((count) >> 2)] = 0;
  return;
 }
 GROWABLE_HEAP_I32()[((count) >> 2)] = state.axesCount;
 return state.axes;
};

var _glfwGetJoystickButtons = (joy, count) => {
 GLFW.refreshJoysticks();
 var state = GLFW.joys[joy];
 if (!state || !state.buttons) {
  GROWABLE_HEAP_I32()[((count) >> 2)] = 0;
  return;
 }
 GROWABLE_HEAP_I32()[((count) >> 2)] = state.buttonsCount;
 return state.buttons;
};

var _glfwGetKey = (winid, key) => GLFW.getKey(winid, key);

var _glfwGetMonitorContentScale = (monitor, x, y) => {
 GROWABLE_HEAP_F32()[((x) >> 2)] = GLFW.scale;
 GROWABLE_HEAP_F32()[((y) >> 2)] = GLFW.scale;
};

var _glfwGetMonitorPos = (monitor, x, y) => {
 GROWABLE_HEAP_I32()[((x) >> 2)] = 0;
 GROWABLE_HEAP_I32()[((y) >> 2)] = 0;
};

var _glfwGetMonitorWorkarea = (monitor, x, y, w, h) => {
 GROWABLE_HEAP_I32()[((x) >> 2)] = 0;
 GROWABLE_HEAP_I32()[((y) >> 2)] = 0;
 GROWABLE_HEAP_I32()[((w) >> 2)] = screen.availWidth;
 GROWABLE_HEAP_I32()[((h) >> 2)] = screen.availHeight;
};

var _glfwGetMonitors = count => {
 GROWABLE_HEAP_I32()[((count) >> 2)] = 1;
 if (!GLFW.monitors) {
  GLFW.monitors = _malloc(4);
  GROWABLE_HEAP_I32()[((GLFW.monitors) >> 2)] = 1;
 }
 return GLFW.monitors;
};

var _glfwGetPrimaryMonitor = () => 1;

var _glfwGetTime = () => GLFW.getTime() - GLFW.initialTime;

var _glfwGetVideoMode = monitor => 0;

var _glfwGetWindowAttrib = (winid, attrib) => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return 0;
 return win.attributes[attrib];
};

var _glfwGetWindowContentScale = (winid, x, y) => {
 GROWABLE_HEAP_F32()[((x) >> 2)] = GLFW.scale;
 GROWABLE_HEAP_F32()[((y) >> 2)] = GLFW.scale;
};

var _glfwGetWindowMonitor = winid => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return 0;
 return win.monitor;
};

var _glfwGetWindowPos = (winid, x, y) => GLFW.getWindowPos(winid, x, y);

var _glfwGetWindowSize = (winid, width, height) => GLFW.getWindowSize(winid, width, height);

var _glfwGetWindowUserPointer = winid => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return 0;
 return win.userptr;
};

var _glfwIconifyWindow = winid => {};

var _glfwInit = () => {
 if (GLFW.windows) return 1;
 GLFW.initialTime = GLFW.getTime();
 GLFW.defaultWindowHints();
 GLFW.windows = new Array;
 GLFW.active = null;
 GLFW.scale = GLFW.getDevicePixelRatio();
 window.addEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
 window.addEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
 window.addEventListener("keydown", GLFW.onKeydown, true);
 window.addEventListener("keypress", GLFW.onKeyPress, true);
 window.addEventListener("keyup", GLFW.onKeyup, true);
 window.addEventListener("blur", GLFW.onBlur, true);
 GLFW.devicePixelRatioMQL = window.matchMedia("(resolution: " + GLFW.getDevicePixelRatio() + "dppx)");
 GLFW.devicePixelRatioMQL.addEventListener("change", GLFW.onDevicePixelRatioChange);
 Module["canvas"].addEventListener("touchmove", GLFW.onMousemove, true);
 Module["canvas"].addEventListener("touchstart", GLFW.onMouseButtonDown, true);
 Module["canvas"].addEventListener("touchcancel", GLFW.onMouseButtonUp, true);
 Module["canvas"].addEventListener("touchend", GLFW.onMouseButtonUp, true);
 Module["canvas"].addEventListener("mousemove", GLFW.onMousemove, true);
 Module["canvas"].addEventListener("mousedown", GLFW.onMouseButtonDown, true);
 Module["canvas"].addEventListener("mouseup", GLFW.onMouseButtonUp, true);
 Module["canvas"].addEventListener("wheel", GLFW.onMouseWheel, true);
 Module["canvas"].addEventListener("mousewheel", GLFW.onMouseWheel, true);
 Module["canvas"].addEventListener("mouseenter", GLFW.onMouseenter, true);
 Module["canvas"].addEventListener("mouseleave", GLFW.onMouseleave, true);
 Module["canvas"].addEventListener("drop", GLFW.onDrop, true);
 Module["canvas"].addEventListener("dragover", GLFW.onDragover, true);
 Browser.requestFullscreen = GLFW.requestFullscreen;
 Browser.calculateMouseCoords = GLFW.calculateMouseCoords;
 Browser.updateCanvasDimensions = GLFW.updateCanvasDimensions;
 Browser.resizeListeners.push((width, height) => {
  if (GLFW.isHiDPIAware()) {
   var canvas = Module["canvas"];
   GLFW.onCanvasResize(canvas.clientWidth, canvas.clientHeight, width, height);
  } else {
   GLFW.onCanvasResize(width, height, width, height);
  }
 });
 return 1;
};

var _glfwMakeContextCurrent = winid => {};

var _glfwMaximizeWindow = winid => {};

var _glfwPollEvents = () => {};

var _glfwRestoreWindow = winid => {};

var _glfwSetCharCallback = (winid, cbfun) => GLFW.setCharCallback(winid, cbfun);

var _glfwSetClipboardString = (win, string) => {};

var _glfwSetCursor = (winid, cursor) => {};

var _glfwSetCursorEnterCallback = (winid, cbfun) => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return null;
 var prevcbfun = win.cursorEnterFunc;
 win.cursorEnterFunc = cbfun;
 return prevcbfun;
};

var _glfwSetCursorPos = (winid, x, y) => GLFW.setCursorPos(winid, x, y);

var _glfwSetCursorPosCallback = (winid, cbfun) => GLFW.setCursorPosCallback(winid, cbfun);

var _glfwSetDropCallback = (winid, cbfun) => GLFW.setDropCallback(winid, cbfun);

var _glfwSetErrorCallback = cbfun => {
 var prevcbfun = GLFW.errorFunc;
 GLFW.errorFunc = cbfun;
 return prevcbfun;
};

var _glfwSetInputMode = (winid, mode, value) => {
 GLFW.setInputMode(winid, mode, value);
};

var _glfwSetKeyCallback = (winid, cbfun) => GLFW.setKeyCallback(winid, cbfun);

var _glfwSetMonitorCallback = cbfun => {
 var prevcbfun = GLFW.monitorFunc;
 GLFW.monitorFunc = cbfun;
 return prevcbfun;
};

var _glfwSetMouseButtonCallback = (winid, cbfun) => GLFW.setMouseButtonCallback(winid, cbfun);

var _glfwSetScrollCallback = (winid, cbfun) => GLFW.setScrollCallback(winid, cbfun);

var _glfwSetWindowCloseCallback = (winid, cbfun) => GLFW.setWindowCloseCallback(winid, cbfun);

var _glfwSetWindowFocusCallback = (winid, cbfun) => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return null;
 var prevcbfun = win.windowFocusFunc;
 win.windowFocusFunc = cbfun;
 return prevcbfun;
};

var _glfwSetWindowOpacity = (winid, opacity) => {};

/* error */ var _glfwSetWindowPos = (winid, x, y) => GLFW.setWindowPos(winid, x, y);

var _glfwSetWindowPosCallback = (winid, cbfun) => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return null;
 var prevcbfun = win.windowPosFunc;
 win.windowPosFunc = cbfun;
 return prevcbfun;
};

var _glfwSetWindowShouldClose = (winid, value) => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return;
 win.shouldClose = value;
};

var _glfwSetWindowSize = (winid, width, height) => GLFW.setWindowSize(winid, width, height);

var _glfwSetWindowSizeCallback = (winid, cbfun) => GLFW.setWindowSizeCallback(winid, cbfun);

var _glfwSetWindowSizeLimits = (winid, minwidth, minheight, maxwidth, maxheight) => {};

var _glfwSetWindowTitle = (winid, title) => GLFW.setWindowTitle(winid, title);

var _glfwSetWindowUserPointer = (winid, ptr) => {
 var win = GLFW.WindowFromId(winid);
 if (!win) return;
 win.userptr = ptr;
};

var _glfwShowWindow = winid => {};

var _glfwSwapBuffers = winid => GLFW.swapBuffers(winid);

var _glfwSwapInterval = interval => {
 interval = Math.abs(interval);
 if (interval == 0) _emscripten_set_main_loop_timing(0, 0); else _emscripten_set_main_loop_timing(1, interval);
};

var _glfwTerminate = () => {
 window.removeEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
 window.removeEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
 window.removeEventListener("keydown", GLFW.onKeydown, true);
 window.removeEventListener("keypress", GLFW.onKeyPress, true);
 window.removeEventListener("keyup", GLFW.onKeyup, true);
 window.removeEventListener("blur", GLFW.onBlur, true);
 Module["canvas"].removeEventListener("touchmove", GLFW.onMousemove, true);
 Module["canvas"].removeEventListener("touchstart", GLFW.onMouseButtonDown, true);
 Module["canvas"].removeEventListener("touchcancel", GLFW.onMouseButtonUp, true);
 Module["canvas"].removeEventListener("touchend", GLFW.onMouseButtonUp, true);
 Module["canvas"].removeEventListener("mousemove", GLFW.onMousemove, true);
 Module["canvas"].removeEventListener("mousedown", GLFW.onMouseButtonDown, true);
 Module["canvas"].removeEventListener("mouseup", GLFW.onMouseButtonUp, true);
 Module["canvas"].removeEventListener("wheel", GLFW.onMouseWheel, true);
 Module["canvas"].removeEventListener("mousewheel", GLFW.onMouseWheel, true);
 Module["canvas"].removeEventListener("mouseenter", GLFW.onMouseenter, true);
 Module["canvas"].removeEventListener("mouseleave", GLFW.onMouseleave, true);
 Module["canvas"].removeEventListener("drop", GLFW.onDrop, true);
 Module["canvas"].removeEventListener("dragover", GLFW.onDragover, true);
 if (GLFW.devicePixelRatioMQL) GLFW.devicePixelRatioMQL.removeEventListener("change", GLFW.onDevicePixelRatioChange);
 Module["canvas"].width = Module["canvas"].height = 1;
 GLFW.windows = null;
 GLFW.active = null;
};

var _glfwWindowHint = (target, hint) => {
 GLFW.hints[target] = hint;
};

var _llvm_eh_typeid_for = type => type;

var arraySum = (array, index) => {
 var sum = 0;
 for (var i = 0; i <= index; sum += array[i++]) {}
 return sum;
};

var MONTH_DAYS_LEAP = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

var MONTH_DAYS_REGULAR = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

var addDays = (date, days) => {
 var newDate = new Date(date.getTime());
 while (days > 0) {
  var leap = isLeapYear(newDate.getFullYear());
  var currentMonth = newDate.getMonth();
  var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
  if (days > daysInCurrentMonth - newDate.getDate()) {
   days -= (daysInCurrentMonth - newDate.getDate() + 1);
   newDate.setDate(1);
   if (currentMonth < 11) {
    newDate.setMonth(currentMonth + 1);
   } else {
    newDate.setMonth(0);
    newDate.setFullYear(newDate.getFullYear() + 1);
   }
  } else {
   newDate.setDate(newDate.getDate() + days);
   return newDate;
  }
 }
 return newDate;
};

var writeArrayToMemory = (array, buffer) => {
 GROWABLE_HEAP_I8().set(array, buffer);
};

var _strftime = (s, maxsize, format, tm) => {
 var tm_zone = GROWABLE_HEAP_U32()[(((tm) + (40)) >> 2)];
 var date = {
  tm_sec: GROWABLE_HEAP_I32()[((tm) >> 2)],
  tm_min: GROWABLE_HEAP_I32()[(((tm) + (4)) >> 2)],
  tm_hour: GROWABLE_HEAP_I32()[(((tm) + (8)) >> 2)],
  tm_mday: GROWABLE_HEAP_I32()[(((tm) + (12)) >> 2)],
  tm_mon: GROWABLE_HEAP_I32()[(((tm) + (16)) >> 2)],
  tm_year: GROWABLE_HEAP_I32()[(((tm) + (20)) >> 2)],
  tm_wday: GROWABLE_HEAP_I32()[(((tm) + (24)) >> 2)],
  tm_yday: GROWABLE_HEAP_I32()[(((tm) + (28)) >> 2)],
  tm_isdst: GROWABLE_HEAP_I32()[(((tm) + (32)) >> 2)],
  tm_gmtoff: GROWABLE_HEAP_I32()[(((tm) + (36)) >> 2)],
  tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
 };
 var pattern = UTF8ToString(format);
 var EXPANSION_RULES_1 = {
  "%c": "%a %b %d %H:%M:%S %Y",
  "%D": "%m/%d/%y",
  "%F": "%Y-%m-%d",
  "%h": "%b",
  "%r": "%I:%M:%S %p",
  "%R": "%H:%M",
  "%T": "%H:%M:%S",
  "%x": "%m/%d/%y",
  "%X": "%H:%M:%S",
  "%Ec": "%c",
  "%EC": "%C",
  "%Ex": "%m/%d/%y",
  "%EX": "%H:%M:%S",
  "%Ey": "%y",
  "%EY": "%Y",
  "%Od": "%d",
  "%Oe": "%e",
  "%OH": "%H",
  "%OI": "%I",
  "%Om": "%m",
  "%OM": "%M",
  "%OS": "%S",
  "%Ou": "%u",
  "%OU": "%U",
  "%OV": "%V",
  "%Ow": "%w",
  "%OW": "%W",
  "%Oy": "%y"
 };
 for (var rule in EXPANSION_RULES_1) {
  pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
 }
 var WEEKDAYS = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
 var MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
 function leadingSomething(value, digits, character) {
  var str = typeof value == "number" ? value.toString() : (value || "");
  while (str.length < digits) {
   str = character[0] + str;
  }
  return str;
 }
 function leadingNulls(value, digits) {
  return leadingSomething(value, digits, "0");
 }
 function compareByDay(date1, date2) {
  function sgn(value) {
   return value < 0 ? -1 : (value > 0 ? 1 : 0);
  }
  var compare;
  if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
   if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
    compare = sgn(date1.getDate() - date2.getDate());
   }
  }
  return compare;
 }
 function getFirstWeekStartDate(janFourth) {
  switch (janFourth.getDay()) {
  case 0:
   return new Date(janFourth.getFullYear() - 1, 11, 29);

  case 1:
   return janFourth;

  case 2:
   return new Date(janFourth.getFullYear(), 0, 3);

  case 3:
   return new Date(janFourth.getFullYear(), 0, 2);

  case 4:
   return new Date(janFourth.getFullYear(), 0, 1);

  case 5:
   return new Date(janFourth.getFullYear() - 1, 11, 31);

  case 6:
   return new Date(janFourth.getFullYear() - 1, 11, 30);
  }
 }
 function getWeekBasedYear(date) {
  var thisDate = addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
  var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
  var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
  var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
  var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
   if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
    return thisDate.getFullYear() + 1;
   }
   return thisDate.getFullYear();
  }
  return thisDate.getFullYear() - 1;
 }
 var EXPANSION_RULES_2 = {
  "%a": date => WEEKDAYS[date.tm_wday].substring(0, 3),
  "%A": date => WEEKDAYS[date.tm_wday],
  "%b": date => MONTHS[date.tm_mon].substring(0, 3),
  "%B": date => MONTHS[date.tm_mon],
  "%C": date => {
   var year = date.tm_year + 1900;
   return leadingNulls((year / 100) | 0, 2);
  },
  "%d": date => leadingNulls(date.tm_mday, 2),
  "%e": date => leadingSomething(date.tm_mday, 2, " "),
  "%g": date => getWeekBasedYear(date).toString().substring(2),
  "%G": date => getWeekBasedYear(date),
  "%H": date => leadingNulls(date.tm_hour, 2),
  "%I": date => {
   var twelveHour = date.tm_hour;
   if (twelveHour == 0) twelveHour = 12; else if (twelveHour > 12) twelveHour -= 12;
   return leadingNulls(twelveHour, 2);
  },
  "%j": date => leadingNulls(date.tm_mday + arraySum(isLeapYear(date.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date.tm_mon - 1), 3),
  "%m": date => leadingNulls(date.tm_mon + 1, 2),
  "%M": date => leadingNulls(date.tm_min, 2),
  "%n": () => "\n",
  "%p": date => {
   if (date.tm_hour >= 0 && date.tm_hour < 12) {
    return "AM";
   }
   return "PM";
  },
  "%S": date => leadingNulls(date.tm_sec, 2),
  "%t": () => "\t",
  "%u": date => date.tm_wday || 7,
  "%U": date => {
   var days = date.tm_yday + 7 - date.tm_wday;
   return leadingNulls(Math.floor(days / 7), 2);
  },
  "%V": date => {
   var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7) / 7);
   if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
    val++;
   }
   if (!val) {
    val = 52;
    var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
    if (dec31 == 4 || (dec31 == 5 && isLeapYear(date.tm_year % 400 - 1))) {
     val++;
    }
   } else if (val == 53) {
    var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
    if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year))) val = 1;
   }
   return leadingNulls(val, 2);
  },
  "%w": date => date.tm_wday,
  "%W": date => {
   var days = date.tm_yday + 7 - ((date.tm_wday + 6) % 7);
   return leadingNulls(Math.floor(days / 7), 2);
  },
  "%y": date => (date.tm_year + 1900).toString().substring(2),
  "%Y": date => date.tm_year + 1900,
  "%z": date => {
   var off = date.tm_gmtoff;
   var ahead = off >= 0;
   off = Math.abs(off) / 60;
   off = (off / 60) * 100 + (off % 60);
   return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
  },
  "%Z": date => date.tm_zone,
  "%%": () => "%"
 };
 pattern = pattern.replace(/%%/g, "\0\0");
 for (var rule in EXPANSION_RULES_2) {
  if (pattern.includes(rule)) {
   pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
  }
 }
 pattern = pattern.replace(/\0\0/g, "%");
 var bytes = intArrayFromString(pattern, false);
 if (bytes.length > maxsize) {
  return 0;
 }
 writeArrayToMemory(bytes, s);
 return bytes.length - 1;
};

var _strftime_l = (s, maxsize, format, tm, loc) => _strftime(s, maxsize, format, tm);

var _system = command => {
 if (ENVIRONMENT_IS_NODE) {
  if (!command) return 1;
  var cmdstr = UTF8ToString(command);
  if (!cmdstr.length) return 0;
  var cp = require("child_process");
  var ret = cp.spawnSync(cmdstr, [], {
   shell: true,
   stdio: "inherit"
  });
  var _W_EXITCODE = (ret, sig) => ((ret) << 8 | (sig));
  if (ret.status === null) {
   var signalToNumber = sig => {
    switch (sig) {
    case "SIGHUP":
     return 1;

    case "SIGINT":
     return 2;

    case "SIGQUIT":
     return 3;

    case "SIGFPE":
     return 8;

    case "SIGKILL":
     return 9;

    case "SIGALRM":
     return 14;

    case "SIGTERM":
     return 15;
    }
    return 2;
   };
   return _W_EXITCODE(0, signalToNumber(ret.signal));
  }
  return _W_EXITCODE(ret.status, 0);
 }
 if (!command) return 0;
 setErrNo(52);
 return -1;
};

var stringToUTF8OnStack = str => {
 var size = lengthBytesUTF8(str) + 1;
 var ret = stackAlloc(size);
 stringToUTF8(str, ret, size);
 return ret;
};

var getCFunc = ident => {
 var func = Module["_" + ident];
 return func;
};

/**
     * @param {string|null=} returnType
     * @param {Array=} argTypes
     * @param {Arguments|Array=} args
     * @param {Object=} opts
     */ var ccall = (ident, returnType, argTypes, args, opts) => {
 var toC = {
  "string": str => {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    ret = stringToUTF8OnStack(str);
   }
   return ret;
  },
  "array": arr => {
   var ret = stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }
 };
 function convertReturnValue(ret) {
  if (returnType === "string") {
   return UTF8ToString(ret);
  }
  if (returnType === "boolean") return Boolean(ret);
  return ret;
 }
 var func = getCFunc(ident);
 var cArgs = [];
 var stack = 0;
 if (args) {
  for (var i = 0; i < args.length; i++) {
   var converter = toC[argTypes[i]];
   if (converter) {
    if (stack === 0) stack = stackSave();
    cArgs[i] = converter(args[i]);
   } else {
    cArgs[i] = args[i];
   }
  }
 }
 var ret = func.apply(null, cArgs);
 function onDone(ret) {
  if (stack !== 0) stackRestore(stack);
  return convertReturnValue(ret);
 }
 ret = onDone(ret);
 return ret;
};

PThread.init();

var FSNode = /** @constructor */ function(parent, name, mode, rdev) {
 if (!parent) {
  parent = this;
 }
 this.parent = parent;
 this.mount = parent.mount;
 this.mounted = null;
 this.id = FS.nextInode++;
 this.name = name;
 this.mode = mode;
 this.node_ops = {};
 this.stream_ops = {};
 this.rdev = rdev;
};

var readMode = 292 | /*292*/ 73;

/*73*/ var writeMode = 146;

/*146*/ Object.defineProperties(FSNode.prototype, {
 read: {
  get: /** @this{FSNode} */ function() {
   return (this.mode & readMode) === readMode;
  },
  set: /** @this{FSNode} */ function(val) {
   val ? this.mode |= readMode : this.mode &= ~readMode;
  }
 },
 write: {
  get: /** @this{FSNode} */ function() {
   return (this.mode & writeMode) === writeMode;
  },
  set: /** @this{FSNode} */ function(val) {
   val ? this.mode |= writeMode : this.mode &= ~writeMode;
  }
 },
 isFolder: {
  get: /** @this{FSNode} */ function() {
   return FS.isDir(this.mode);
  }
 },
 isDevice: {
  get: /** @this{FSNode} */ function() {
   return FS.isChrdev(this.mode);
  }
 }
});

FS.FSNode = FSNode;

FS.createPreloadedFile = FS_createPreloadedFile;

FS.staticInit();

Module["requestFullscreen"] = Browser.requestFullscreen;

Module["requestAnimationFrame"] = Browser.requestAnimationFrame;

Module["setCanvasSize"] = Browser.setCanvasSize;

Module["pauseMainLoop"] = Browser.mainLoop.pause;

Module["resumeMainLoop"] = Browser.mainLoop.resume;

Module["getUserMedia"] = Browser.getUserMedia;

Module["createContext"] = Browser.createContext;

var preloadedImages = {};

var preloadedAudios = {};

Fetch.init();

handleAllocatorInit();

var GLctx;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glDrawArrays;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glDrawElements;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glActiveTexture;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glEnable;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glDisable;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glTexEnvf;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glTexEnvi;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glTexEnvfv;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glGetIntegerv;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glIsEnabled;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glGetBooleanv;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glGetString;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glCreateShader;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glShaderSource;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glCompileShader;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glAttachShader;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glDetachShader;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glUseProgram;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glDeleteProgram;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glBindAttribLocation;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glLinkProgram;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glBindBuffer;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glGetFloatv;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glHint;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glEnableVertexAttribArray;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glDisableVertexAttribArray;

/**@suppress {duplicate, undefinedVars}*/ var _emscripten_glVertexAttribPointer;

/**@suppress {duplicate, undefinedVars}*/ var _glTexEnvf;

/**@suppress {duplicate, undefinedVars}*/ var _glTexEnvi;

/**@suppress {duplicate, undefinedVars}*/ var _glTexEnvfv;

/**@suppress {duplicate, undefinedVars}*/ var _glGetTexEnviv;

/**@suppress {duplicate, undefinedVars}*/ var _glGetTexEnvfv;

GLEmulation.init();

GLImmediate.setupFuncs();

Browser.moduleContextCreatedCallbacks.push(() => GLImmediate.init());

var miniTempWebGLFloatBuffersStorage = new Float32Array(288);

for (/**@suppress{duplicate}*/ var i = 0; i < 288; ++i) {
 miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1);
}

var proxiedFunctionTable = [ _proc_exit, exitOnMainThread, pthreadCreateProxied, ___syscall__newselect, ___syscall_accept4, ___syscall_bind, ___syscall_chdir, ___syscall_chmod, ___syscall_connect, ___syscall_dup3, ___syscall_faccessat, ___syscall_fchmod, ___syscall_fcntl64, ___syscall_fstat64, ___syscall_ftruncate64, ___syscall_getcwd, ___syscall_getdents64, ___syscall_ioctl, ___syscall_listen, ___syscall_lstat64, ___syscall_mkdirat, ___syscall_newfstatat, ___syscall_openat, ___syscall_pipe, ___syscall_readlinkat, ___syscall_recvfrom, ___syscall_rmdir, ___syscall_sendto, ___syscall_socket, ___syscall_stat64, ___syscall_unlinkat, __mmap_js, __munmap_js, _emscripten_get_element_css_size, _emscripten_set_beforeunload_callback_on_thread, _emscripten_set_fullscreenchange_callback_on_thread, _emscripten_set_resize_callback_on_thread, _emscripten_set_wheel_callback_on_thread, _environ_get, _environ_sizes_get, _fd_close, _fd_fdstat_get, _fd_pread, _fd_pwrite, _fd_read, _fd_seek, _fd_write, _emscripten_set_window_title ];

var wasmImports = {
 /** @export */ __assert_fail: ___assert_fail,
 /** @export */ __cxa_begin_catch: ___cxa_begin_catch,
 /** @export */ __cxa_current_primary_exception: ___cxa_current_primary_exception,
 /** @export */ __cxa_end_catch: ___cxa_end_catch,
 /** @export */ __cxa_find_matching_catch_2: ___cxa_find_matching_catch_2,
 /** @export */ __cxa_find_matching_catch_3: ___cxa_find_matching_catch_3,
 /** @export */ __cxa_find_matching_catch_4: ___cxa_find_matching_catch_4,
 /** @export */ __cxa_find_matching_catch_5: ___cxa_find_matching_catch_5,
 /** @export */ __cxa_rethrow: ___cxa_rethrow,
 /** @export */ __cxa_rethrow_primary_exception: ___cxa_rethrow_primary_exception,
 /** @export */ __cxa_throw: ___cxa_throw,
 /** @export */ __cxa_uncaught_exceptions: ___cxa_uncaught_exceptions,
 /** @export */ __emscripten_init_main_thread_js: ___emscripten_init_main_thread_js,
 /** @export */ __emscripten_thread_cleanup: ___emscripten_thread_cleanup,
 /** @export */ __pthread_create_js: ___pthread_create_js,
 /** @export */ __resumeException: ___resumeException,
 /** @export */ __syscall__newselect: ___syscall__newselect,
 /** @export */ __syscall_accept4: ___syscall_accept4,
 /** @export */ __syscall_bind: ___syscall_bind,
 /** @export */ __syscall_chdir: ___syscall_chdir,
 /** @export */ __syscall_chmod: ___syscall_chmod,
 /** @export */ __syscall_connect: ___syscall_connect,
 /** @export */ __syscall_dup3: ___syscall_dup3,
 /** @export */ __syscall_faccessat: ___syscall_faccessat,
 /** @export */ __syscall_fchmod: ___syscall_fchmod,
 /** @export */ __syscall_fcntl64: ___syscall_fcntl64,
 /** @export */ __syscall_fstat64: ___syscall_fstat64,
 /** @export */ __syscall_ftruncate64: ___syscall_ftruncate64,
 /** @export */ __syscall_getcwd: ___syscall_getcwd,
 /** @export */ __syscall_getdents64: ___syscall_getdents64,
 /** @export */ __syscall_ioctl: ___syscall_ioctl,
 /** @export */ __syscall_listen: ___syscall_listen,
 /** @export */ __syscall_lstat64: ___syscall_lstat64,
 /** @export */ __syscall_mkdirat: ___syscall_mkdirat,
 /** @export */ __syscall_newfstatat: ___syscall_newfstatat,
 /** @export */ __syscall_openat: ___syscall_openat,
 /** @export */ __syscall_pipe: ___syscall_pipe,
 /** @export */ __syscall_readlinkat: ___syscall_readlinkat,
 /** @export */ __syscall_recvfrom: ___syscall_recvfrom,
 /** @export */ __syscall_rmdir: ___syscall_rmdir,
 /** @export */ __syscall_sendto: ___syscall_sendto,
 /** @export */ __syscall_socket: ___syscall_socket,
 /** @export */ __syscall_stat64: ___syscall_stat64,
 /** @export */ __syscall_unlinkat: ___syscall_unlinkat,
 /** @export */ _emscripten_fetch_free: __emscripten_fetch_free,
 /** @export */ _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
 /** @export */ _emscripten_notify_mailbox_postmessage: __emscripten_notify_mailbox_postmessage,
 /** @export */ _emscripten_receive_on_main_thread_js: __emscripten_receive_on_main_thread_js,
 /** @export */ _emscripten_thread_mailbox_await: __emscripten_thread_mailbox_await,
 /** @export */ _emscripten_thread_set_strongref: __emscripten_thread_set_strongref,
 /** @export */ _emscripten_throw_longjmp: __emscripten_throw_longjmp,
 /** @export */ _gmtime_js: __gmtime_js,
 /** @export */ _localtime_js: __localtime_js,
 /** @export */ _mktime_js: __mktime_js,
 /** @export */ _mmap_js: __mmap_js,
 /** @export */ _munmap_js: __munmap_js,
 /** @export */ _tzset_js: __tzset_js,
 /** @export */ abort: _abort,
 /** @export */ callJs_openFile: callJs_openFile,
 /** @export */ callJs_saveFile: callJs_saveFile,
 /** @export */ canvas_get_height: canvas_get_height,
 /** @export */ canvas_get_width: canvas_get_width,
 /** @export */ copy_async_js: copy_async_js,
 /** @export */ emscripten_asm_const_int: _emscripten_asm_const_int,
 /** @export */ emscripten_asm_const_int_sync_on_main_thread: _emscripten_asm_const_int_sync_on_main_thread,
 /** @export */ emscripten_cancel_main_loop: _emscripten_cancel_main_loop,
 /** @export */ emscripten_check_blocking_allowed: _emscripten_check_blocking_allowed,
 /** @export */ emscripten_date_now: _emscripten_date_now,
 /** @export */ emscripten_exit_with_live_runtime: _emscripten_exit_with_live_runtime,
 /** @export */ emscripten_get_element_css_size: _emscripten_get_element_css_size,
 /** @export */ emscripten_get_heap_max: _emscripten_get_heap_max,
 /** @export */ emscripten_get_now: _emscripten_get_now,
 /** @export */ emscripten_num_logical_cores: _emscripten_num_logical_cores,
 /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
 /** @export */ emscripten_set_beforeunload_callback_on_thread: _emscripten_set_beforeunload_callback_on_thread,
 /** @export */ emscripten_set_fullscreenchange_callback_on_thread: _emscripten_set_fullscreenchange_callback_on_thread,
 /** @export */ emscripten_set_main_loop: _emscripten_set_main_loop,
 /** @export */ emscripten_set_main_loop_arg: _emscripten_set_main_loop_arg,
 /** @export */ emscripten_set_resize_callback_on_thread: _emscripten_set_resize_callback_on_thread,
 /** @export */ emscripten_set_wheel_callback_on_thread: _emscripten_set_wheel_callback_on_thread,
 /** @export */ emscripten_start_fetch: _emscripten_start_fetch,
 /** @export */ environ_get: _environ_get,
 /** @export */ environ_sizes_get: _environ_sizes_get,
 /** @export */ exit: _exit,
 /** @export */ fd_close: _fd_close,
 /** @export */ fd_fdstat_get: _fd_fdstat_get,
 /** @export */ fd_pread: _fd_pread,
 /** @export */ fd_pwrite: _fd_pwrite,
 /** @export */ fd_read: _fd_read,
 /** @export */ fd_seek: _fd_seek,
 /** @export */ fd_write: _fd_write,
 /** @export */ getentropy: _getentropy,
 /** @export */ glActiveTexture: _glActiveTexture,
 /** @export */ glAttachShader: _glAttachShader,
 /** @export */ glBindBuffer: _glBindBuffer,
 /** @export */ glBindFramebuffer: _glBindFramebuffer,
 /** @export */ glBindRenderbuffer: _glBindRenderbuffer,
 /** @export */ glBindTexture: _glBindTexture,
 /** @export */ glBindVertexArray: _glBindVertexArray,
 /** @export */ glBindVertexArrayOES: _glBindVertexArrayOES,
 /** @export */ glBlendEquation: _glBlendEquation,
 /** @export */ glBlendEquationSeparate: _glBlendEquationSeparate,
 /** @export */ glBlendFuncSeparate: _glBlendFuncSeparate,
 /** @export */ glBufferData: _glBufferData,
 /** @export */ glBufferSubData: _glBufferSubData,
 /** @export */ glClear: _glClear,
 /** @export */ glClearColor: _glClearColor,
 /** @export */ glCompileShader: _glCompileShader,
 /** @export */ glCreateProgram: _glCreateProgram,
 /** @export */ glCreateShader: _glCreateShader,
 /** @export */ glDeleteBuffers: _glDeleteBuffers,
 /** @export */ glDeleteFramebuffers: _glDeleteFramebuffers,
 /** @export */ glDeleteProgram: _glDeleteProgram,
 /** @export */ glDeleteRenderbuffers: _glDeleteRenderbuffers,
 /** @export */ glDeleteShader: _glDeleteShader,
 /** @export */ glDeleteTextures: _glDeleteTextures,
 /** @export */ glDeleteVertexArrays: _glDeleteVertexArrays,
 /** @export */ glDeleteVertexArraysOES: _glDeleteVertexArraysOES,
 /** @export */ glDepthRangef: _glDepthRangef,
 /** @export */ glDetachShader: _glDetachShader,
 /** @export */ glDisable: _glDisable,
 /** @export */ glDrawArrays: _glDrawArrays,
 /** @export */ glDrawElements: _glDrawElements,
 /** @export */ glEnable: _glEnable,
 /** @export */ glEnableVertexAttribArray: _glEnableVertexAttribArray,
 /** @export */ glFramebufferRenderbuffer: _glFramebufferRenderbuffer,
 /** @export */ glFramebufferTexture2D: _glFramebufferTexture2D,
 /** @export */ glGenBuffers: _glGenBuffers,
 /** @export */ glGenFramebuffers: _glGenFramebuffers,
 /** @export */ glGenRenderbuffers: _glGenRenderbuffers,
 /** @export */ glGenTextures: _glGenTextures,
 /** @export */ glGenVertexArrays: _glGenVertexArrays,
 /** @export */ glGenVertexArraysOES: _glGenVertexArraysOES,
 /** @export */ glGetAttribLocation: _glGetAttribLocation,
 /** @export */ glGetIntegerv: _glGetIntegerv,
 /** @export */ glGetProgramInfoLog: _glGetProgramInfoLog,
 /** @export */ glGetProgramiv: _glGetProgramiv,
 /** @export */ glGetShaderInfoLog: _glGetShaderInfoLog,
 /** @export */ glGetShaderiv: _glGetShaderiv,
 /** @export */ glGetString: _glGetString,
 /** @export */ glGetUniformLocation: _glGetUniformLocation,
 /** @export */ glIsEnabled: _glIsEnabled,
 /** @export */ glIsProgram: _glIsProgram,
 /** @export */ glLinkProgram: _glLinkProgram,
 /** @export */ glPixelStorei: _glPixelStorei,
 /** @export */ glRenderbufferStorage: _glRenderbufferStorage,
 /** @export */ glScissor: _glScissor,
 /** @export */ glShaderSource: _glShaderSource,
 /** @export */ glTexImage2D: _glTexImage2D,
 /** @export */ glTexParameteri: _glTexParameteri,
 /** @export */ glUniform1i: _glUniform1i,
 /** @export */ glUniform3f: _glUniform3f,
 /** @export */ glUniform4f: _glUniform4f,
 /** @export */ glUniformMatrix4fv: _glUniformMatrix4fv,
 /** @export */ glUseProgram: _glUseProgram,
 /** @export */ glVertexAttribPointer: _glVertexAttribPointer,
 /** @export */ glViewport: _glViewport,
 /** @export */ glfwCreateStandardCursor: _glfwCreateStandardCursor,
 /** @export */ glfwCreateWindow: _glfwCreateWindow,
 /** @export */ glfwDestroyCursor: _glfwDestroyCursor,
 /** @export */ glfwDestroyWindow: _glfwDestroyWindow,
 /** @export */ glfwFocusWindow: _glfwFocusWindow,
 /** @export */ glfwGetCurrentContext: _glfwGetCurrentContext,
 /** @export */ glfwGetCursorPos: _glfwGetCursorPos,
 /** @export */ glfwGetFramebufferSize: _glfwGetFramebufferSize,
 /** @export */ glfwGetInputMode: _glfwGetInputMode,
 /** @export */ glfwGetJoystickAxes: _glfwGetJoystickAxes,
 /** @export */ glfwGetJoystickButtons: _glfwGetJoystickButtons,
 /** @export */ glfwGetKey: _glfwGetKey,
 /** @export */ glfwGetMonitorContentScale: _glfwGetMonitorContentScale,
 /** @export */ glfwGetMonitorPos: _glfwGetMonitorPos,
 /** @export */ glfwGetMonitorWorkarea: _glfwGetMonitorWorkarea,
 /** @export */ glfwGetMonitors: _glfwGetMonitors,
 /** @export */ glfwGetPrimaryMonitor: _glfwGetPrimaryMonitor,
 /** @export */ glfwGetTime: _glfwGetTime,
 /** @export */ glfwGetVideoMode: _glfwGetVideoMode,
 /** @export */ glfwGetWindowAttrib: _glfwGetWindowAttrib,
 /** @export */ glfwGetWindowContentScale: _glfwGetWindowContentScale,
 /** @export */ glfwGetWindowMonitor: _glfwGetWindowMonitor,
 /** @export */ glfwGetWindowPos: _glfwGetWindowPos,
 /** @export */ glfwGetWindowSize: _glfwGetWindowSize,
 /** @export */ glfwGetWindowUserPointer: _glfwGetWindowUserPointer,
 /** @export */ glfwIconifyWindow: _glfwIconifyWindow,
 /** @export */ glfwInit: _glfwInit,
 /** @export */ glfwMakeContextCurrent: _glfwMakeContextCurrent,
 /** @export */ glfwMaximizeWindow: _glfwMaximizeWindow,
 /** @export */ glfwPollEvents: _glfwPollEvents,
 /** @export */ glfwRestoreWindow: _glfwRestoreWindow,
 /** @export */ glfwSetCharCallback: _glfwSetCharCallback,
 /** @export */ glfwSetClipboardString: _glfwSetClipboardString,
 /** @export */ glfwSetCursor: _glfwSetCursor,
 /** @export */ glfwSetCursorEnterCallback: _glfwSetCursorEnterCallback,
 /** @export */ glfwSetCursorPos: _glfwSetCursorPos,
 /** @export */ glfwSetCursorPosCallback: _glfwSetCursorPosCallback,
 /** @export */ glfwSetDropCallback: _glfwSetDropCallback,
 /** @export */ glfwSetErrorCallback: _glfwSetErrorCallback,
 /** @export */ glfwSetInputMode: _glfwSetInputMode,
 /** @export */ glfwSetKeyCallback: _glfwSetKeyCallback,
 /** @export */ glfwSetMonitorCallback: _glfwSetMonitorCallback,
 /** @export */ glfwSetMouseButtonCallback: _glfwSetMouseButtonCallback,
 /** @export */ glfwSetScrollCallback: _glfwSetScrollCallback,
 /** @export */ glfwSetWindowCloseCallback: _glfwSetWindowCloseCallback,
 /** @export */ glfwSetWindowFocusCallback: _glfwSetWindowFocusCallback,
 /** @export */ glfwSetWindowOpacity: _glfwSetWindowOpacity,
 /** @export */ glfwSetWindowPos: _glfwSetWindowPos,
 /** @export */ glfwSetWindowPosCallback: _glfwSetWindowPosCallback,
 /** @export */ glfwSetWindowShouldClose: _glfwSetWindowShouldClose,
 /** @export */ glfwSetWindowSize: _glfwSetWindowSize,
 /** @export */ glfwSetWindowSizeCallback: _glfwSetWindowSizeCallback,
 /** @export */ glfwSetWindowSizeLimits: _glfwSetWindowSizeLimits,
 /** @export */ glfwSetWindowTitle: _glfwSetWindowTitle,
 /** @export */ glfwSetWindowUserPointer: _glfwSetWindowUserPointer,
 /** @export */ glfwShowWindow: _glfwShowWindow,
 /** @export */ glfwSwapBuffers: _glfwSwapBuffers,
 /** @export */ glfwSwapInterval: _glfwSwapInterval,
 /** @export */ glfwTerminate: _glfwTerminate,
 /** @export */ glfwWindowHint: _glfwWindowHint,
 /** @export */ invoke_d: invoke_d,
 /** @export */ invoke_di: invoke_di,
 /** @export */ invoke_dii: invoke_dii,
 /** @export */ invoke_diii: invoke_diii,
 /** @export */ invoke_f: invoke_f,
 /** @export */ invoke_fi: invoke_fi,
 /** @export */ invoke_fiii: invoke_fiii,
 /** @export */ invoke_fj: invoke_fj,
 /** @export */ invoke_fjj: invoke_fjj,
 /** @export */ invoke_i: invoke_i,
 /** @export */ invoke_idiii: invoke_idiii,
 /** @export */ invoke_ii: invoke_ii,
 /** @export */ invoke_iid: invoke_iid,
 /** @export */ invoke_iidd: invoke_iidd,
 /** @export */ invoke_iiddi: invoke_iiddi,
 /** @export */ invoke_iidi: invoke_iidi,
 /** @export */ invoke_iidii: invoke_iidii,
 /** @export */ invoke_iidjj: invoke_iidjj,
 /** @export */ invoke_iif: invoke_iif,
 /** @export */ invoke_iifiif: invoke_iifiif,
 /** @export */ invoke_iii: invoke_iii,
 /** @export */ invoke_iiid: invoke_iiid,
 /** @export */ invoke_iiidd: invoke_iiidd,
 /** @export */ invoke_iiiddii: invoke_iiiddii,
 /** @export */ invoke_iiifffii: invoke_iiifffii,
 /** @export */ invoke_iiiffii: invoke_iiiffii,
 /** @export */ invoke_iiifii: invoke_iiifii,
 /** @export */ invoke_iiii: invoke_iiii,
 /** @export */ invoke_iiiif: invoke_iiiif,
 /** @export */ invoke_iiiifii: invoke_iiiifii,
 /** @export */ invoke_iiiifiiii: invoke_iiiifiiii,
 /** @export */ invoke_iiiii: invoke_iiiii,
 /** @export */ invoke_iiiiid: invoke_iiiiid,
 /** @export */ invoke_iiiiif: invoke_iiiiif,
 /** @export */ invoke_iiiiii: invoke_iiiiii,
 /** @export */ invoke_iiiiiii: invoke_iiiiiii,
 /** @export */ invoke_iiiiiiii: invoke_iiiiiiii,
 /** @export */ invoke_iiiiiiiii: invoke_iiiiiiiii,
 /** @export */ invoke_iiiiiiiiii: invoke_iiiiiiiiii,
 /** @export */ invoke_iiiiiiiiiii: invoke_iiiiiiiiiii,
 /** @export */ invoke_iiiiiiiiiiii: invoke_iiiiiiiiiiii,
 /** @export */ invoke_iiiiiiiiiiiii: invoke_iiiiiiiiiiiii,
 /** @export */ invoke_iiiiij: invoke_iiiiij,
 /** @export */ invoke_iiiijii: invoke_iiiijii,
 /** @export */ invoke_iiijii: invoke_iiijii,
 /** @export */ invoke_iiijjjj: invoke_iiijjjj,
 /** @export */ invoke_iij: invoke_iij,
 /** @export */ invoke_iiji: invoke_iiji,
 /** @export */ invoke_iijiii: invoke_iijiii,
 /** @export */ invoke_iijiiii: invoke_iijiiii,
 /** @export */ invoke_iijj: invoke_iijj,
 /** @export */ invoke_iijjd: invoke_iijjd,
 /** @export */ invoke_iijjii: invoke_iijjii,
 /** @export */ invoke_iijjiii: invoke_iijjiii,
 /** @export */ invoke_ijjiii: invoke_ijjiii,
 /** @export */ invoke_j: invoke_j,
 /** @export */ invoke_ji: invoke_ji,
 /** @export */ invoke_jii: invoke_jii,
 /** @export */ invoke_jiii: invoke_jiii,
 /** @export */ invoke_jiiii: invoke_jiiii,
 /** @export */ invoke_jiij: invoke_jiij,
 /** @export */ invoke_jij: invoke_jij,
 /** @export */ invoke_jjiiii: invoke_jjiiii,
 /** @export */ invoke_v: invoke_v,
 /** @export */ invoke_vddddi: invoke_vddddi,
 /** @export */ invoke_vdiii: invoke_vdiii,
 /** @export */ invoke_vf: invoke_vf,
 /** @export */ invoke_vff: invoke_vff,
 /** @export */ invoke_vffff: invoke_vffff,
 /** @export */ invoke_vfffiii: invoke_vfffiii,
 /** @export */ invoke_vfii: invoke_vfii,
 /** @export */ invoke_vi: invoke_vi,
 /** @export */ invoke_vid: invoke_vid,
 /** @export */ invoke_vif: invoke_vif,
 /** @export */ invoke_vifff: invoke_vifff,
 /** @export */ invoke_viffff: invoke_viffff,
 /** @export */ invoke_viffffi: invoke_viffffi,
 /** @export */ invoke_vii: invoke_vii,
 /** @export */ invoke_viid: invoke_viid,
 /** @export */ invoke_viidd: invoke_viidd,
 /** @export */ invoke_viif: invoke_viif,
 /** @export */ invoke_viiff: invoke_viiff,
 /** @export */ invoke_viiffff: invoke_viiffff,
 /** @export */ invoke_viifi: invoke_viifi,
 /** @export */ invoke_viii: invoke_viii,
 /** @export */ invoke_viiidddiidddi: invoke_viiidddiidddi,
 /** @export */ invoke_viiiddiii: invoke_viiiddiii,
 /** @export */ invoke_viiif: invoke_viiif,
 /** @export */ invoke_viiii: invoke_viiii,
 /** @export */ invoke_viiiif: invoke_viiiif,
 /** @export */ invoke_viiiifi: invoke_viiiifi,
 /** @export */ invoke_viiiifif: invoke_viiiifif,
 /** @export */ invoke_viiiifiif: invoke_viiiifiif,
 /** @export */ invoke_viiiii: invoke_viiiii,
 /** @export */ invoke_viiiiii: invoke_viiiiii,
 /** @export */ invoke_viiiiiii: invoke_viiiiiii,
 /** @export */ invoke_viiiiiiii: invoke_viiiiiiii,
 /** @export */ invoke_viiiiiiiii: invoke_viiiiiiiii,
 /** @export */ invoke_viiiiiiiiii: invoke_viiiiiiiiii,
 /** @export */ invoke_viiiiiiiiiii: invoke_viiiiiiiiiii,
 /** @export */ invoke_viiiiiiiiiiiiii: invoke_viiiiiiiiiiiiii,
 /** @export */ invoke_viiiiiiiiiiiiiii: invoke_viiiiiiiiiiiiiii,
 /** @export */ invoke_viiiiiij: invoke_viiiiiij,
 /** @export */ invoke_viiiij: invoke_viiiij,
 /** @export */ invoke_viiiiji: invoke_viiiiji,
 /** @export */ invoke_viiiijiiii: invoke_viiiijiiii,
 /** @export */ invoke_viiiijj: invoke_viiiijj,
 /** @export */ invoke_viiij: invoke_viiij,
 /** @export */ invoke_viiiji: invoke_viiiji,
 /** @export */ invoke_viiijii: invoke_viiijii,
 /** @export */ invoke_viiijj: invoke_viiijj,
 /** @export */ invoke_viij: invoke_viij,
 /** @export */ invoke_viiji: invoke_viiji,
 /** @export */ invoke_viijii: invoke_viijii,
 /** @export */ invoke_viijiiii: invoke_viijiiii,
 /** @export */ invoke_viijj: invoke_viijj,
 /** @export */ invoke_viijjf: invoke_viijjf,
 /** @export */ invoke_viijji: invoke_viijji,
 /** @export */ invoke_viijjii: invoke_viijjii,
 /** @export */ invoke_viijjiijji: invoke_viijjiijji,
 /** @export */ invoke_viijjijji: invoke_viijjijji,
 /** @export */ invoke_viijjj: invoke_viijjj,
 /** @export */ invoke_viijjji: invoke_viijjji,
 /** @export */ invoke_viijjjj: invoke_viijjjj,
 /** @export */ invoke_viijjjjjjjj: invoke_viijjjjjjjj,
 /** @export */ invoke_vij: invoke_vij,
 /** @export */ invoke_viji: invoke_viji,
 /** @export */ invoke_vijii: invoke_vijii,
 /** @export */ invoke_vijiii: invoke_vijiii,
 /** @export */ invoke_vijiiii: invoke_vijiiii,
 /** @export */ invoke_vijiiji: invoke_vijiiji,
 /** @export */ invoke_vijji: invoke_vijji,
 /** @export */ invoke_vijjii: invoke_vijjii,
 /** @export */ invoke_vijjijjijj: invoke_vijjijjijj,
 /** @export */ invoke_vijjjj: invoke_vijjjj,
 /** @export */ invoke_vjii: invoke_vjii,
 /** @export */ invoke_vjjiii: invoke_vjjiii,
 /** @export */ isDarkModeEnabled: isDarkModeEnabled,
 /** @export */ llvm_eh_typeid_for: _llvm_eh_typeid_for,
 /** @export */ memory: wasmMemory,
 /** @export */ paste_js: paste_js,
 /** @export */ proc_exit: _proc_exit,
 /** @export */ resizeCanvas: resizeCanvas,
 /** @export */ setupThemeListener: setupThemeListener,
 /** @export */ strftime: _strftime,
 /** @export */ strftime_l: _strftime_l,
 /** @export */ system: _system
};

var wasmExports = createWasm();

var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["__wasm_call_ctors"])();

var _main = Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["__main_argc_argv"])(a0, a1);

var ___cxa_free_exception = a0 => (___cxa_free_exception = wasmExports["__cxa_free_exception"])(a0);

var ___errno_location = () => (___errno_location = wasmExports["__errno_location"])();

var _handleThemeChange = Module["_handleThemeChange"] = () => (_handleThemeChange = Module["_handleThemeChange"] = wasmExports["handleThemeChange"])();

var _pthread_self = Module["_pthread_self"] = () => (_pthread_self = Module["_pthread_self"] = wasmExports["pthread_self"])();

var _fileBrowserCallback = Module["_fileBrowserCallback"] = a0 => (_fileBrowserCallback = Module["_fileBrowserCallback"] = wasmExports["fileBrowserCallback"])(a0);

var _free = a0 => (_free = wasmExports["free"])(a0);

var _malloc = a0 => (_malloc = wasmExports["malloc"])(a0);

var _paste_return = Module["_paste_return"] = (a0, a1, a2) => (_paste_return = Module["_paste_return"] = wasmExports["paste_return"])(a0, a1, a2);

var _copy_return = Module["_copy_return"] = (a0, a1) => (_copy_return = Module["_copy_return"] = wasmExports["copy_return"])(a0, a1);

var setTempRet0 = a0 => (setTempRet0 = wasmExports["setTempRet0"])(a0);

var _ma_malloc_emscripten = Module["_ma_malloc_emscripten"] = (a0, a1) => (_ma_malloc_emscripten = Module["_ma_malloc_emscripten"] = wasmExports["ma_malloc_emscripten"])(a0, a1);

var _ma_free_emscripten = Module["_ma_free_emscripten"] = (a0, a1) => (_ma_free_emscripten = Module["_ma_free_emscripten"] = wasmExports["ma_free_emscripten"])(a0, a1);

var _ma_device_process_pcm_frames_capture__webaudio = Module["_ma_device_process_pcm_frames_capture__webaudio"] = (a0, a1, a2) => (_ma_device_process_pcm_frames_capture__webaudio = Module["_ma_device_process_pcm_frames_capture__webaudio"] = wasmExports["ma_device_process_pcm_frames_capture__webaudio"])(a0, a1, a2);

var _ma_device_process_pcm_frames_playback__webaudio = Module["_ma_device_process_pcm_frames_playback__webaudio"] = (a0, a1, a2) => (_ma_device_process_pcm_frames_playback__webaudio = Module["_ma_device_process_pcm_frames_playback__webaudio"] = wasmExports["ma_device_process_pcm_frames_playback__webaudio"])(a0, a1, a2);

var _htons = a0 => (_htons = wasmExports["htons"])(a0);

var _emscripten_builtin_free = a0 => (_emscripten_builtin_free = wasmExports["emscripten_builtin_free"])(a0);

var __emscripten_tls_init = Module["__emscripten_tls_init"] = () => (__emscripten_tls_init = Module["__emscripten_tls_init"] = wasmExports["_emscripten_tls_init"])();

var _emscripten_builtin_memalign = (a0, a1) => (_emscripten_builtin_memalign = wasmExports["emscripten_builtin_memalign"])(a0, a1);

var __emscripten_run_callback_on_thread = (a0, a1, a2, a3, a4) => (__emscripten_run_callback_on_thread = wasmExports["_emscripten_run_callback_on_thread"])(a0, a1, a2, a3, a4);

var __emscripten_thread_init = Module["__emscripten_thread_init"] = (a0, a1, a2, a3, a4, a5) => (__emscripten_thread_init = Module["__emscripten_thread_init"] = wasmExports["_emscripten_thread_init"])(a0, a1, a2, a3, a4, a5);

var __emscripten_thread_crashed = Module["__emscripten_thread_crashed"] = () => (__emscripten_thread_crashed = Module["__emscripten_thread_crashed"] = wasmExports["_emscripten_thread_crashed"])();

var _emscripten_main_thread_process_queued_calls = () => (_emscripten_main_thread_process_queued_calls = wasmExports["emscripten_main_thread_process_queued_calls"])();

var _emscripten_builtin_malloc = a0 => (_emscripten_builtin_malloc = wasmExports["emscripten_builtin_malloc"])(a0);

var _emscripten_main_runtime_thread_id = () => (_emscripten_main_runtime_thread_id = wasmExports["emscripten_main_runtime_thread_id"])();

var _ntohs = a0 => (_ntohs = wasmExports["ntohs"])(a0);

var __emscripten_run_on_main_thread_js = (a0, a1, a2, a3) => (__emscripten_run_on_main_thread_js = wasmExports["_emscripten_run_on_main_thread_js"])(a0, a1, a2, a3);

var __emscripten_thread_free_data = a0 => (__emscripten_thread_free_data = wasmExports["_emscripten_thread_free_data"])(a0);

var __emscripten_thread_exit = Module["__emscripten_thread_exit"] = a0 => (__emscripten_thread_exit = Module["__emscripten_thread_exit"] = wasmExports["_emscripten_thread_exit"])(a0);

var __emscripten_check_mailbox = () => (__emscripten_check_mailbox = wasmExports["_emscripten_check_mailbox"])();

var _memalign = (a0, a1) => (_memalign = wasmExports["memalign"])(a0, a1);

var _setThrew = (a0, a1) => (_setThrew = wasmExports["setThrew"])(a0, a1);

var _emscripten_stack_set_limits = (a0, a1) => (_emscripten_stack_set_limits = wasmExports["emscripten_stack_set_limits"])(a0, a1);

var stackSave = () => (stackSave = wasmExports["stackSave"])();

var stackRestore = a0 => (stackRestore = wasmExports["stackRestore"])(a0);

var stackAlloc = a0 => (stackAlloc = wasmExports["stackAlloc"])(a0);

var ___cxa_decrement_exception_refcount = a0 => (___cxa_decrement_exception_refcount = wasmExports["__cxa_decrement_exception_refcount"])(a0);

var ___cxa_increment_exception_refcount = a0 => (___cxa_increment_exception_refcount = wasmExports["__cxa_increment_exception_refcount"])(a0);

var ___cxa_can_catch = (a0, a1, a2) => (___cxa_can_catch = wasmExports["__cxa_can_catch"])(a0, a1, a2);

var ___cxa_is_pointer_type = a0 => (___cxa_is_pointer_type = wasmExports["__cxa_is_pointer_type"])(a0);

var ___start_em_js = Module["___start_em_js"] = 14833620;

var ___stop_em_js = Module["___stop_em_js"] = 14836015;

function invoke_vi(index, a1) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vii(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_i(index) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ii(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iijiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iijjiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vjjiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ijjiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_v(index) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vdiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_idiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_d(index) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vif(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vfffiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiifi(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vijjii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiijii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vij(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viid(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ji(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_vijiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viji(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viij(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vijii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiif(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iifiif(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iif(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vff(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_dii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiijj(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vijji(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiij(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_fi(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viif(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijj(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_fj(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_f(index) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiffii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiifiif(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_fjj(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiifif(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijjf(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_j(index) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_iiiiif(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viifi(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijiiii(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiji(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vf(index, a1) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiifii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_fiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiifii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_viiffff(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijjjj(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijji(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijjj(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vid(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vjii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiddii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiji(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iij(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vijiiji(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iidii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiij(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiif(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vfii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_diii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiijj(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jjiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_iijjii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vijjjj(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiijii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijjiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iijiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vijiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijjii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiif(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiddiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vffff(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viffffi(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vifff(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viffff(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiff(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiifffii(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vddddi(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijjjjjjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_di(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiidddiidddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viidd(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iid(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiddi(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiij(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jij(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_viiiiji(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiid(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iijjd(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiijjjj(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iidi(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iidjj(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iidd(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiidd(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiijii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijjijji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vijjijjijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viijjji(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iijj(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jiij(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_iiiiij(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jiiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiji(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

Module["wasmMemory"] = wasmMemory;

Module["keepRuntimeAlive"] = keepRuntimeAlive;

Module["ccall"] = ccall;

Module["ExitStatus"] = ExitStatus;

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function callMain(args = []) {
 var entryFunction = _main;
 args.unshift(thisProgram);
 var argc = args.length;
 var argv = stackAlloc((argc + 1) * 4);
 var argv_ptr = argv;
 args.forEach(arg => {
  GROWABLE_HEAP_U32()[((argv_ptr) >> 2)] = stringToUTF8OnStack(arg);
  argv_ptr += 4;
 });
 GROWABLE_HEAP_U32()[((argv_ptr) >> 2)] = 0;
 try {
  var ret = entryFunction(argc, argv);
  exitJS(ret, /* implicit = */ true);
  return ret;
 } catch (e) {
  return handleException(e);
 }
}

function run(args = arguments_) {
 if (runDependencies > 0) {
  return;
 }
 if (ENVIRONMENT_IS_PTHREAD) {
  initRuntime();
  startWorker(Module);
  return;
 }
 preRun();
 if (runDependencies > 0) {
  return;
 }
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (shouldRunNow) callMain(args);
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

var shouldRunNow = true;

if (Module["noInitialRun"]) shouldRunNow = false;

run();
