var JvmDebugRunner = require("./jvm_debug-runner");

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;
    var debugPort = options.debugPort || 5858;
    var runJvm = imports["run-jvm"];

    JvmDebugRunner.call(this, options.url, vfs, pm, sandbox, runJvm, debugPort, function (err) {
        if (err) return register(err);
        
        register(null, {
            "run-jvm-debug": {}
        });
    });
};