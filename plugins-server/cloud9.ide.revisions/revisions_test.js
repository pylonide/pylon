"use strict";

var assert = require("assert");
var sinon = require("sinon");
var Path = require("path");
var PathUtils = require("./path_utils.js");
var RevisionsModule = require("./revisions");
var rimraf = require("rimraf");
var Diff_Match_Patch = require("./diff_match_patch");
var VfsLocal = require("vfs-local");
var Fs = require("fs");

var BASE_URL = "/sergi/node_chat";

var assertPath = function(path, shouldExist, message) {
    assert.ok(Path.existsSync(path) == shouldExist, message || "");
};

module.exports = {
    setUp: function(next) {
        var self = this;
        var Plugin;

        var ide = {
            workspaceDir: __dirname,
            options: {
                baseUrl: BASE_URL
            },
            register: function (name, plugin, cb) {
                Plugin = plugin;
                cb();
            }
        };

        var workspace = {
            plugins: {
                concorde: {
                    server: []
                }
            }
        };

        var fs = VfsLocal({
            root: __dirname,
            checkSymlinks: true
        });

        RevisionsModule(null, {
            vfs: fs,
            ide: ide,
            sandbox: {
                getProjectDir: function(cb) {
                    cb(null, ".");
                }
            }
        }, function () {
            self.revisionsPlugin = new Plugin(ide, workspace);
            next();
        });
    },

    tearDown: function(next) {
        var revPath = __dirname + "/.c9revisions";
        rimraf(revPath, function(err) {
            if (!err)
                next();
            else
                throw new Error("Revisions directory (" + revPath + ") was not deleted");
        });
    },

    "test: Plugin constructor": function(next) {
        assert.ok(this.revisionsPlugin);
        next();
    },

    "test getSessionStylePath": function(next) {
        var path1 = PathUtils.getSessionStylePath.call(this.revisionsPlugin, "lib/test1.js");
        assert.equal("sergi/node_chat/lib/test1.js", path1);
        next();
    },

    "!test getRevisionsPath": function(next) {
        var path1 = PathUtils.getSessionStylePath.call(this.revisionsPlugin, "lib/test1.js");
        assert.equal("sergi/node_chat/lib/test1.js", path1);
        next();
    },

    "test retrieve revision for a new file": function(next) {
        var revPath = __dirname + "/.c9revisions";
        var R = this.revisionsPlugin;
        R.getRevisions(Path.basename(__filename), function(err, rev) {
            assert.ok(err === null, err);
            assert.ok(typeof rev === "object");

            var filePath = revPath + "/" + Path.basename(__filename) + ".c9save";
            assertPath(filePath, true, "Revisions file was not created");

            Fs.readFile(filePath, function(err, data) {
                assert.ok(err === null);
                var revObj = JSON.parse(data);

                assert.ok(typeof revObj === "object");
                //assert.ok(revObj.revisions && revObj.revisions.length === 0);
                //assert.ok(typeof revObj.revisions === "object");

                Fs.readFile(__filename, function(err, data) {
                    assert.ok(err === null);
console.log("$$$", revObj)
                    next();
                });
            });
        });
    },

    "!test saving revision from message": function(next) {
        var fileName = __dirname + "/test_saving.txt";
        var revPath = __dirname + "/.c9revisions";
        var R = this.revisionsPlugin;

        R.ide.broadcast = sinon.spy();

        Fs.writeFile(fileName, "ABCDEFGHI", function(err) {
            assert.equal(err, null);
            R.saveRevisionFromMsg(
                {
                    data: { email: "sergi@c9.io" }
                },
                {
                    path: Path.basename(fileName),
                    silentsave: true,
                    restoring: true,
                    contributors: ["sergi@c9.io", "mike@c9.io"],
                    content: "123456789"
                },
                function(err, path, revObj) {
                    assert.ok(err === null);
                    assert.ok(R.ide.broadcast.called);
                    assert.equal(path, revPath + "/test_saving.txt.c9save");
                    assert.equal(typeof revObj.revisions, "object");
                    assert.equal(revObj.revisions.length, 1);
                    assert.equal(revObj.originalContent, "ABCDEFGHI");
                    assert.equal(revObj.lastContent, "123456789");
                    next();
                }
            );
        });
    },

    "!test saving revision": function(next) {
        var fileName = __dirname + "/test_saving.txt";
        var revPath = __dirname + "/.c9revisions";
        var R = this.revisionsPlugin;

        R.ide.broadcast = sinon.spy();

        var patch = new Diff_Match_Patch().patch_make("SERGI", "123456789");
        Fs.writeFile(fileName, "SERGI", function(err) {
            assert.equal(err, null);
            R.saveRevision(
                Path.basename(fileName),
                {
                    contributors: ["sergi@c9.io", "mike@c9.io"],
                    patch: [patch],
                    silentsave: true,
                    restoring: false,
                    ts: Date.now(),
                    lastContent: "123456789",
                    length: 9
                } ,
                function(err, path, revObj) {
                    assert.ok(err === null);
                    assert.ok(R.ide.broadcast.called);
                    assert.equal(path, revPath + "/test_saving.txt.c9save");
                    assert.equal(typeof revObj.revisions, "object");
                    assert.equal(revObj.revisions.length, 1);
                    assert.equal(revObj.originalContent, "SERGI");
                    assert.equal(revObj.lastContent, "123456789");
                    next();
                }
            );
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();
