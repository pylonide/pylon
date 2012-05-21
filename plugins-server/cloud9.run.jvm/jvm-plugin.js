"use strict";

var JvmRunner = require("./jvm-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;

    JvmRunner.call(this, options.url, pm, sandbox, false, function (err) {
        if (err) return register(err);
        
        register(null, {
            "run-jvm": {
                Runner: JvmRunner.Runner
            }
        });
    });
};