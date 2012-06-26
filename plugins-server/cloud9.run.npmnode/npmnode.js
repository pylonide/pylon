"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

var exports = module.exports = function setup(options, imports, register) {
   var pm = imports["process-manager"];

    imports.sandbox.getProjectDir(function(err, projectDir) {
        if (err)
            return register(err);

       pm.addRunner("run-npm", exports.factory(imports.vfs, projectDir, options.nodePath));

        register(null, {
            "run-run-npm": {}
        });
    });
};

exports.factory = function(vfs, root, nodePath) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
        options.file = args.file;
        options.args = args.args;
        options.env = args.env;
        options.cwd = args.cwd;
        options.extra = args.extra;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.nodePath = nodePath;

        new Runner(vfs, options, callback);
    };
};

var Runner = exports.Runner = function(vfs, options, callback) {
    var self = this;

    this.uid = options.uid;
    this.file = options.file;
    this.extra = options.extra;

    this.scriptArgs = options.args || [];
    this.nodeArgs = [];

    options.env = options.env || {};
    options.command = options.nodePath || process.execPath;
    options.nodePath = options.nodePath || process.execPath;

    ShellRunner.call(self, vfs, options, callback);
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "run-npm";

    this.createChild = function(callback) {
        this.args = this.nodeArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(Runner.prototype);