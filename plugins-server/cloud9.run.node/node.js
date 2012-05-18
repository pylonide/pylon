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
        
        return new Runner({
            uid: uid, file: args.file, args: args.args, cwd: cwd, env: args.env, 
            encoding: args.encoding, extra: args.extra, 
            eventEmitter: eventEmitter, eventName: eventName
        });
    };
};

var Runner = exports.Runner = function(options) {
    this.uid = options.uid;
    this.file = options.file;
    this.extra = options.extra;

    this.scriptArgs = options.args || [];
    this.nodeArgs = [];

    env = options.env || {};
    ShellRunner.call(this, options);
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "node";

    this.createChild = function(callback) {
        this.args = this.nodeArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(Runner.prototype);