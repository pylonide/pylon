var NodeDebugRunner = require("./node_debug-runner");
var assert = require("assert");

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;
    var runNode = imports["run-node"];
    var debugPort = options.debugPort || 5858;
    
    assert(options.listenHint, "Option 'listenHint' is required");

    NodeDebugRunner.call(this, options.url, options.listenHint, vfs, pm, sandbox, runNode, false, options.nodePath, options.nodeVersions, debugPort, function (err) {
        if (err) return register(err);

        register(null, {
            "run-node-debug": { }
        });
    });
};