var module = require("module");
var oldResolve = module._resolveFilename;
// Search paths for the AMD module ids used by client code. treehugger and v8debug are
// published under the @pylonide scope, but the module ids in the client source
// ("treehugger/tree", "v8debug/...") are what RequireJS resolves in the browser via the
// path config in lib.treehugger / lib.v8debug. They are therefore mapped here for node,
// rather than rewritten at the call sites -- rewriting would break the browser.
var extraPaths = [
    __dirname + "/../node_modules/ace/lib",
    __dirname + "/../node_modules/@pylonide/treehugger/lib",
    __dirname + "/../node_modules/@pylonide/v8debug/lib",
    __dirname + "/../plugins-client"
];
module._resolveFilename = function(request, paths) {
    // Ensure client extensions can be loaded
    request = request.replace(/^ext\//, "ext.")
            .replace(/^core\//, "pylon.core/www/core/");
    // Add the extra paths
    extraPaths.forEach(function(p) {
        if(paths.paths.indexOf(p) === -1)
            paths.paths.push(p);
    });
    return oldResolve(request, paths);
};

