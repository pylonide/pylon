var NodeDebugRunner = require("./node_debug-runner");

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var runNode = imports["run-node"];
    
    NodeDebugRunner.call(this, options.url, pm, sandbox, runNode, false, function (err) {
        if (err) return register(err);
        
        register(null, {
            "run-node-debug": { }
        });
    });
};