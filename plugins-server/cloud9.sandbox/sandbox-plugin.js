"use strict";

var assert = require("assert");
var netutil = require("../cloud9.core/netutil");

module.exports = function(options, imports, register) {

    assert(options.workspaceId, "option 'workspaceId' is required");
    assert(options.projectDir, "option 'projectDir' is required");
    // assert(options.userDir, "option 'userDir' is required");
    assert(options.host, "option 'host' is required");
    
    // grab a free port
    netutil.findFreePort(20000, 64000, "localhost", function (err, port) {
        if (err) return register(err);
        
        doRegister(port);
    });
    
    function doRegister (port) {
        register(null, {
            sandbox: {
                getProjectDir: function(callback) {
                    callback(null, options.projectDir);
                },
                getWorkspaceId: function(callback) {
                    callback(null, options.workspaceId);
                },
                getUnixId: function(callback) {
                    callback(null, options.unixId || null);
                },
                getPort: function(callback) {
                    callback(null, port);
                },
                getHost: function(callback) {
                    callback(null, options.host);
                },
                getUserDir: function(callback) {
                    callback(null, options.userDir);
                }
            }
        });
    }
};