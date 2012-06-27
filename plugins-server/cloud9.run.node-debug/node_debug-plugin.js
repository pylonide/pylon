var NodeDebugRunner = require("./node_debug-runner");
var assert = require("assert");

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;
    var nodePath = options.nodePath || null;
    var debugPort = options.debugPort || 5858;
    var runNode = imports["run-node"];
    
    assert(options.listenHint, "Option 'listenHint' is required");

    NodeDebugRunner.call(this, options.url, options.listenHint, vfs, pm, sandbox, runNode, false, nodePath, debugPort, function (err) {
        if (err) return register(err);

        register(null, {
            "run-node-debug": { }
        });
    });
};