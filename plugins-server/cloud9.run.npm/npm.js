"use strict";

var util = require("util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    pm.addRunner("npm", exports.factory(imports.sandbox.getUnixId()));

    register(null, {
        "run-npm": {}
    });
};

exports.factory = function(root, port, uid) {
    return function(args, eventEmitter, eventName) {
        return new Runner(uid, args.args, args.cwd, args.nodeVersion, eventEmitter, eventName);
    };
};

var Runner = exports.Runner = function(uid, args, cwd, nodeVersion, eventEmitter, eventName) {
    ShellRunner.call(this, uid, "npm", args, cwd, {}, eventEmitter, eventName);
};

util.inherits(Runner, ShellRunner);

Runner.prototype.name = "npm";