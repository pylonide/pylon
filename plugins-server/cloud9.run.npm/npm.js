"use strict";

var util = require("util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var c9util = require("../cloud9.core/util");

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];

    pm.addRunner("npm", exports.factory(imports.vfs));

    register(null, {
        "run-npm": {}
    });
};

exports.factory = function(vfs) {
    return function(args, eventEmitter, eventName) {
        return new Runner(vfs, {
            command: "npm",
            args: args.args,
            cwd: args.cwd,
            nodeVersion: args.nodeVersion,
            encoding: args.encoding,
            extra: args.extra,
            eventEmitter: eventEmitter,
            eventName: eventName
        });
    };
};

var Runner = exports.Runner = function(vfs, options) {
    ShellRunner.call(this, vfs, options);
};

util.inherits(Runner, ShellRunner);

Runner.prototype.name = "npm";
