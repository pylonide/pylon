"use strict";

var JvmRunner = require("./jvm-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;

    JvmRunner.call(this, options.url, vfs, pm, sandbox, function (err) {
        if (err) return register(err);
        
        register(null, {
            "run-jvm": {
                Runner: JvmRunner.Runner
            }
        });
    });
};