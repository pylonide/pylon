var JvmDebugRunner = require("./jvm_debug-runner");

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var runJvm = imports["run-jvm"];

    JvmDebugRunner.call(this, options.url, pm, sandbox, runJvm, false, function (err) {
        if (err) return register(err);
        
        register(null, {
            "run-jvm-debug": {}
        });
    });
};