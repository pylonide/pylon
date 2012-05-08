"use strict";

var util = require("util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var ide = imports.ide.getServer();

    imports.sandbox.getUnixId(function(err, unixId) {
        if (err) return register(err);

        pm.addRunner("node", exports.factory(unixId, ide));

        register(null, {
            "run-node": {}
        });
    });
};

exports.factory = function(uid, ide) {
    return function(args, eventEmitter, eventName) {
        var cwd = args.cwd || ide.workspaceDir;
        return new Runner(uid, args.file, args.args, cwd, args.env, args.extra, eventEmitter, eventName);
    };
};

var Runner = exports.Runner = function(uid, file, args, cwd, env, extra, eventEmitter, eventName) {
    this.uid = uid;
    this.file = file;
    this.extra = extra;

    this.scriptArgs = args || [];
    this.nodeArgs = [];

    env = env || {};
    ShellRunner.call(this, uid, process.execPath, [], cwd, env, extra, eventEmitter, eventName);
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "node";

    this.createChild = function(callback) {
        this.args = this.nodeArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(Runner.prototype);