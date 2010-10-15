var Fs    = require("fs"),
    Util  = require(__dirname + "/../common/jsdav/lib/DAV/util"),
    Cache = require(__dirname + "/guid_cache");

var guid;
while (!Util.empty(Cache[(guid = Util.uuid())])) {}
Cache[guid] = 1;
Fs.writeFileSync(__dirname + "/guid_cache.js", "module.exports = " + JSON.stringify(Cache));
console.log("New GUID for you to use: " + guid);
