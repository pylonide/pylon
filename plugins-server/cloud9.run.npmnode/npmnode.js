"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;

    sandbox.getUserDir(function(err, userDir) {
        if (err) return register(err);
        
        sandbox.getPort(function(err, port) {
            if (err) return register(err);
            
            sandbox.getUnixId(function(err, unixId) {
                if (err) return register(err);
                
                init(userDir, port, unixId);
            });
        });
    });

    function init(userDir, port, unixId) {
        pm.addRunner("run-npm", exports.factory(userDir, port, unixId));

        register(null, {
            "run-run-npm": {}
        });
    }
};

exports.factory = function(root, port, uid) {
    return function(args, eventEmitter, eventName) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
        options.port = port;
        options.uid = uid;
        options.file = args.file;
        options.args = args.args;
        options.env = args.env;
        options.cwd = args.cwd;
        options.extra = args.extra;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        return new Runner(options);
    };
};

var Runner = exports.Runner = function(options) {
    this.uid = options.uid;
    this.file = options.file;
    this.extra = options.extra;

    this.scriptArgs = options.args || [];
    this.nodeArgs = [];

    options.env = options.env || {};
    options.command = process.execPath;
    
    ShellRunner.call(this, options);
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "run-npm";

    this.createChild = function(callback) {
        this.args = this.nodeArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(Runner.prototype);