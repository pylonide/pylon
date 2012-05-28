"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;

    sandbox.getUserDir(function(err, userDir) {
        if (err) return register(err);
        
        sandbox.getUnixId(function(err, unixId) {
            if (err) return register(err);
            
            init(userDir, unixId);
        });
    });

    function init(userDir, unixId) {
        pm.addRunner("run-npm", exports.factory(imports.sandbox, userDir, unixId));

        register(null, {
            "run-run-npm": {}
        });
    }
};

exports.factory = function(sandbox, root, uid) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
        options.uid = uid;
        options.file = args.file;
        options.args = args.args;
        options.env = args.env;
        options.cwd = args.cwd;
        options.extra = args.extra;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        
        options.sandbox = sandbox;
        
        new Runner(options, callback);
    };
};

var Runner = exports.Runner = function(options, callback) {
    var self = this;
    
    this.uid = options.uid;
    this.file = options.file;
    this.extra = options.extra;

    this.scriptArgs = options.args || [];
    this.nodeArgs = [];

    options.env = options.env || {};
    options.command = process.execPath;
    
    options.sandbox.getPort(function (err, port) {
        if (err) return callback(err);
        
        options.port = port;
        
        ShellRunner.call(self, options, callback);
    });
};

util.inherits(Runner, ShellRunner);

(function() {

    this.name = "run-npm";

    this.createChild = function(callback) {
        this.args = this.nodeArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(Runner.prototype);