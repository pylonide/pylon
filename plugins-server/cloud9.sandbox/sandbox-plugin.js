"use strict";

var assert = require("assert");

module.exports = function(options, imports, register) {

    assert(options.workspaceId, "option 'workspaceId' is required");
    assert(options.projectDir, "option 'projectDir' is required");

    register(null, {
        sandbox: {
            getProjectDir: function() {
                return options.projectDir;
            },
            getWorkspaceId: function() {
                return options.workspaceId;
            },
            getUnixId: function() {
                return options.unixId || null;
            }
        }
    });
};