"use strict";

var ShellRunner = require("../cloud9.run.shell/shell").Runner;

var Runner = require("./npm-runner");

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    
    // create
    var runner = new Runner(ShellRunner, pm, sandbox);
    runner.init(function (err) {
        if (err) return register(err);
        
        register(null, {
            "run-npm": {}
        });
    });
};
