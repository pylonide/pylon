"use strict";

var testCase = require('nodeunit').testCase;
var sinon = require("sinon");
var Path = require("path");
var PathUtils = require("./path_utils.js");
var RevisionsModule = require("./revisions");
var rimraf = require("rimraf");
var Diff_Match_Patch = require("./diff_match_patch");

var BASE_URL = "/sergi/node_chat";
var FsMock = require("../cloud9.sandbox.fs/fs_mock");
var Fs = require("fs");

var assertPath = function(test, path, shouldExist, message) {
    test.ok(Path.existsSync(path) == shouldExist, message || "");
};

module.exports = testCase(
{
    setUp: function(next) {
        var self = this;
        
        var ide = {
            workspaceDir: __dirname,
            options: {
                baseUrl: BASE_URL
            },
            register: function (name, plugin, cb) {
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
        
        this.fsMock = new FsMock(__dirname, process.getuid());
        this.fsMock.setUp(function (err, fs) {
            if (err) return next(err);
            
            self.fs = fs;
            
            // init the module
            RevisionsModule(null, {
                "sandbox.fs": self.fs,
                ide: ide
            }, function () {
                self.revisionsPlugin = new RevisionsModule.RevisionsPlugin(ide, workspace);
                next();
            });
        });
    },

    tearDown: function(next) {
        this.fsMock.tearDown(function () {
            var revPath = __dirname + "/.c9revisions";
            rimraf(revPath, function(err) {
                if (!err)
                    next();
                else
                    throw new Error("Revisions directory (" + revPath + ") was not deleted");
            });
        });
    },

    "test: Plugin constructor": function(test) {
        test.ok(this.revisionsPlugin);
        test.done();
    },

    "test getSessionStylePath": function(test) {
        var path1 = PathUtils.getSessionStylePath.call(this.revisionsPlugin, "lib/test1.js");
        test.equal("sergi/node_chat/lib/test1.js", path1);
        test.done();
    },

    "test retrieve revision for a new file": function(test) {
        test.expect(9);

        var revPath = __dirname + "/.c9revisions";
        var R = this.revisionsPlugin;

        R.getRevisions(Path.basename(__filename), function(err, rev) {
            test.ok(err === null);
            test.ok(typeof rev === "object");

            var filePath = revPath + "/" + Path.basename(__filename) + ".c9save";
            assertPath(test, filePath, true, "Revisions file was not created");

            Fs.readFile(filePath, function(err, data) {
                test.ok(err === null);
                var revObj = JSON.parse(data);
                
                test.ok(typeof revObj === "object");
                test.ok(typeof revObj.revisions === "object");
                test.ok(revObj.revisions && revObj.revisions.length === 0);

                Fs.readFile(__filename, function(err, data) {
                    test.ok(err === null);

                    test.equal(data, revObj.originalContent);
                    test.done();
                })
            });
        });
    },

    "test saving revision from message": function(test) {
        test.expect(8);

        var fileName = __dirname + "/test_saving.txt";
        var revPath = __dirname + "/.c9revisions";
        var R = this.revisionsPlugin;

        R.ide.broadcast = sinon.spy();

        Fs.writeFile(fileName, "ABCDEFGHI", function(err) {
            test.equal(err, null);
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
                    test.ok(err === null);
                    test.ok(R.ide.broadcast.called);
                    test.equal(path, revPath + "/test_saving.txt.c9save");
                    test.equal(typeof revObj.revisions, "object");
                    test.equal(revObj.revisions.length, 1);
                    test.equal(revObj.originalContent, "ABCDEFGHI");
                    test.equal(revObj.lastContent, "123456789");
                    test.done();
                }
            );
        });
    },

    "test saving revision": function(test) {
        test.expect(8);

        var fileName = __dirname + "/test_saving.txt";
        var revPath = __dirname + "/.c9revisions";
        var R = this.revisionsPlugin;

        R.ide.broadcast = sinon.spy();

        var patch = new Diff_Match_Patch().patch_make("SERGI", "123456789");
        Fs.writeFile(fileName, "SERGI", function(err) {
            test.equal(err, null);
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
                    test.ok(err === null);
                    test.ok(R.ide.broadcast.called);
                    test.equal(path, revPath + "/test_saving.txt.c9save");
                    test.equal(typeof revObj.revisions, "object");
                    test.equal(revObj.revisions.length, 1);
                    test.equal(revObj.originalContent, "SERGI");
                    test.equal(revObj.lastContent, "123456789");
                    test.done();
                }
            );
        });
    }
});

