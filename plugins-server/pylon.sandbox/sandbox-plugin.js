"use strict";

var assert = require("assert");
var netutil = require("netutil");

module.exports = function(options, imports, register) {

    assert(options.workspaceId, "option 'workspaceId' is required");
    assert(options.projectDir, "option 'projectDir' is required");
    // assert(options.userDir, "option 'userDir' is required");
    assert(options.host, "option 'host' is required");

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
                // grab a free port
                netutil.findFreePort(20000, 64000, options.host, function (err, port) {
                    callback(err, port);
                });
            },
            getHost: function(callback) {
                callback(null, options.host);
            },
            getUserDir: function(callback) {
                callback(null, options.userDir);
            }
        }
    });
};