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
        return new Runner({
            uid: uid, args: args.args, cwd: args.cwd, nodeVersion: args.nodeVersion, 
            encoding: args.encoding, extra: args.extra, eventEmitter: eventEmitter, 
            eventName: eventName
        });
    };
};

var Runner = exports.Runner = function(options) {
    ShellRunner.call(this, options);
};

util.inherits(Runner, ShellRunner);

Runner.prototype.name = "npm";