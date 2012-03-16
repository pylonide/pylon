"use strict";

var assert = require("assert");

module.exports = function(options, imports, register) {

    assert(options.workspaceId, "option 'workspaceId' is required");
    assert(options.projectDir, "option 'projectDir' is required");

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
            }
        }
    });
};