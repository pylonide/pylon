"use strict";

var util = require("util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var c9util = require("../cloud9.core/util");

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];

    pm.addRunner("npm", exports.factory(imports.vfs, imports.sandbox, options.npmPath || "npm"));

    register(null, {
        "run-npm": {}
    });
};

exports.factory = function(vfs, sandbox, npmPath) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.args = args.args;
        options.command = npmPath;

        options.sandbox = sandbox;

        return new Runner(vfs, options, callback);
    };
};

var Runner = exports.Runner = function(vfs, options, callback) {
    ShellRunner.call(this, vfs, options, callback);
};

util.inherits(Runner, ShellRunner);

Runner.prototype.name = "npm";
