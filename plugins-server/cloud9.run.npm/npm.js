"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];

    imports.sandbox.getUnixId(function(err, unixId) {
        if (err) return register(err);

        pm.addRunner("npm", exports.factory(unixId, imports.sandbox));

        register(null, {
            "run-npm": {}
        });
    });
};

exports.factory = function(uid, sandbox) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.uid = uid;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.args = args.args;
        options.command = "npm";
        
        options.sandbox = sandbox;
        
        return new Runner(options, callback);
    };
};

var Runner = exports.Runner = function(options, callback) {
    ShellRunner.call(this, options, callback);
};

util.inherits(Runner, ShellRunner);

Runner.prototype.name = "npm";
