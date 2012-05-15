"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");

/**
 * Run node scripts with restricted user rights
 */

var exports = module.exports = function (BaseRunner, pm, sandbox) {
    util.inherits(Runner, BaseRunner);

    this.init = function (callback) {
        sandbox.getUserDir(function(err, userDir) {
            if (err) return callback(err);
            
            sandbox.getPort(function(err, port) {
                if (err) return callback(err);
                
                sandbox.getUnixId(function(err, unixId) {
                    if (err) return callback(err);
                    
                    init(userDir, port, unixId);
                });
            });
        });
    
        function init(userDir, port, unixId) {
            pm.addRunner("npm", exports.factory(BaseRunner, userDir, port, unixId));
            
            callback();
        }
    };
    
};

exports.factory = function(BaseRunner, root, port, uid) {
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
        options.command = "npm";
        
        console.log("NPM FACTORY", options);
        return new Runner(BaseRunner, options);
    };
};

var Runner = exports.Runner = function(BaseRunner, options) {
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

    console.log("CALLING BASERUNNER", options);

    BaseRunner.call(this, options);
};

Runner.prototype.name = "npm";