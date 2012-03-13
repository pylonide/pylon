"use strict";

var util = require("util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    pm.addRunner("node", exports.factory(imports.sandbox.getUnixId()));

    register(null, {
        "run-node": {}
    });
};

exports.factory = function(uid) {
    return function(args, eventEmitter, eventName) {
        return new Runner(uid, args.file, args.args, args.cwd, args.env, eventEmitter, eventName);
    };
};

var Runner = exports.Runner = function(uid, file, args, cwd, env, eventEmitter, eventName) {
    this.uid = uid;
    this.file = file;

    this.scriptArgs = args || [];
    this.nodeArgs = [];

    env = env || {};
    ShellRunner.call(this, uid, process.execPath, [], cwd, env, eventEmitter, eventName);
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "node";

    this.createChild = function(callback) {
        this.args = this.nodeArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(Runner.prototype);