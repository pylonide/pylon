"use strict";

var util = require("util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];

    imports.sandbox.getUnixId(function(err, unixId) {
        if (err) return register(err);

        pm.addRunner("npm", exports.factory(unixId));

        register(null, {
            "run-npm": {}
        });
    });
};

exports.factory = function(root, port, uid) {
    return function(args, eventEmitter, eventName) {
        return new Runner(uid, args.args, args.cwd, args.nodeVersion, args.extra, eventEmitter, eventName);
    };
};

var Runner = exports.Runner = function(uid, args, cwd, nodeVersion, extra, eventEmitter, eventName) {
    ShellRunner.call(this, uid, "npm", args, cwd, {}, extra, eventEmitter, eventName);
};

util.inherits(Runner, ShellRunner);

Runner.prototype.name = "npm";