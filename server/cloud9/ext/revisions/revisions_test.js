"use strict";
require("../../../../support/paths");

var assert = require("assert");
var PathUtils = require("c9/ext/revisions/path_utils");
var RevisionsPlugin = require("c9/ext/revisions/revisions");

var BASE_URL = "/sergi/node_chat";

module.exports = {
    setUp: function(next) {
        var ide = {
            workspaceDir: __dirname,
            options: {
                baseUrl: BASE_URL
            }
        };

        var workspace = {
            plugins: {
                concorde: {
                    server: []
                }
            }
        };

        this.revisionsPlugin = new RevisionsPlugin(ide, workspace);
    },

    tearDown: function(next) {
        next();
    },

    "test: Plugin constructor": function() {
        assert.ok(this.revisionsPlugin);
    },

    "test getSessionStylePath": function() {
        var path1 = PathUtils.getSessionStylePath.call(this.revisionsPlugin, "lib/test1.js");
        assert.equal("sergi/node_chat/lib/test1.js", path1);
    },

    "test getAbsoluteParent works": function() {
        var path1 = PathUtils.getAbsoluteParent.call(this.revisionsPlugin, "lib/test1.js");
        assert.equal(__dirname + "/.c9revisions/lib", path1);
    },

    "test getAbsoluteParent no workspace": function() {
        this.revisionsPlugin.ide.workspaceDir = null;
        var path1 = PathUtils.getAbsoluteParent.call(this.revisionsPlugin, "lib/test1.js");
        assert.equal(null, path1);
    },

    "test getAbsolutePath works": function() {
        var path1 = PathUtils.getAbsolutePath.call(this.revisionsPlugin, "lib/test1.js");
        assert.equal(__dirname + "/.c9revisions/lib/test1.js", path1);
    },

    "test getRevisions": function() {
        var path1 = PathUtils.getAbsolutePath.call(this.revisionsPlugin, "lib/test1.js");
        assert.equal(__dirname + "/.c9revisions/lib/test1.js", path1);
    }
};

!module.parent && require("c9/test").testcase(module.exports).deps().exec();