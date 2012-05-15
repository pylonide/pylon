"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var NodeRunner = require("../cloud9.run.node/node").Runner;

/**
 * Run node scripts with restricted user rights
 */

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
        console.log("NPM INIT", arguments);
        
        pm.addRunner("npm", exports.factory(userDir, port, unixId));

        register(null, {
            "run-npm": {}
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
        options.cwd = args.cwd;
        options.nodeVersion = args.nodeVersion;
        options.encoding = args.encoding;
        options.extra = args.extra;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        console.log("NPM FACTORY", options);
        return new Runner(options);
    };
};

var Runner = exports.Runner = function(options) {
    console.log("NPM RUNNER", options);
    
    this.npmGlobalPath = options.root + "/npm_global";
    this.npmCachePath = options.root + "/npm_cache";

    var env = {
        NPM_CONFIG_PREFIX: this.npmGlobalPath,
        NPM_CONFIG_CACHE: this.npmCachePath
    };

    if (process.platform == "sunos")
        env.NPM_CONFIG_TAR = "/opt/local/bin/gtar";

    this.cwd = options.cwd;

    console.log("CALLING NODERUNNER", options);

    NodeRunner.call(this, options);
    this.nodeArgs.push("--allow-childprocess");
};

util.inherits(Runner, NodeRunner);

Runner.prototype.name = "npm";
