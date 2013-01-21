"use strict";

var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run shell commands
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];

    pm.addRunner("other", exports.factory(imports.vfs));

    register(null, {
        "run-other": {}
    });
};

exports.factory = function(vfs) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};

        c9util.extend(options, args);
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.args = args.args;

        return new Runner(vfs, options, callback);
    };
};

var Runner = exports.Runner = ShellRunner;

for (var prop in ShellRunner.prototype)
    Runner.prototype[prop] = ShellRunner.prototype[prop];

Runner.prototype.name = "other";
