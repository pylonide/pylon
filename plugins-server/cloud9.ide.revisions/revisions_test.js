"use strict";

var assert = require("assert");
var sinon = require("sinon");
var Path = require("path");
var RevisionsModule = require("./revisions");
var rimraf = require("rimraf");
var Diff_Match_Patch = require("./diff_match_patch");
var VfsLocal = require("vfs-local");
var Fs = require("fs");
var util = require('util');

var Diff_Match_Patch = require("./diff_match_patch");
var Diff = new Diff_Match_Patch();

var BASE_URL = "/sergi/node_chat";

var assertPath = function(path, shouldExist, message) {
    assert.ok(Path.existsSync(path) == shouldExist, message || "");
};

var sampleData = Fs.readFileSync(Path.join(__dirname, "revobj.tst"), "utf8");

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
            setTimeout(function() {
                // Give some time to the inheritance chaing to be set properly
                self.revisionsPlugin = new Plugin(ide, workspace);
                next();
            }, 100);
        });
    },

    tearDown: function(next) {

        Fs.unlink(__dirname + "/test_saving.txt", function(){});
        var revPath = __dirname + "/.c9revisions";
        rimraf(revPath, function(err) {
            if (!err)
                next();
            else
                throw new Error("Revisions directory (" + revPath + ") was not deleted");
        });
    },

    "test: Plugin constructor": function(next) {
        var R = this.revisionsPlugin;
        assert.ok(R);
        assert.ok(R.hooks[0] === "command");
        assert.ok(R.name === "revisions");
        next();
    },

    "test bad onCommand 1": function(next) {
        var R = this.revisionsPlugin;
        var badMsg1 = { command: "_revisions" };
        var badMsg2 = { subCommand: "saveRevision" };
        var badMsg3 = { command: "revisions"  };

        assert.equal(false, R.command(null, badMsg1, null));
        assert.equal(false, R.command(null, badMsg2, null));
        assert.equal(false, R.command(null, badMsg3, null));
        next();
    },

    "test bad onCommand 2": function(next) {
        var R = this.revisionsPlugin;
        R.broadcastError = sinon.spy();

        // no 'path'
        var badMsg1 = { command: "revisions", subCommand: "saveRevision"  };
        R.command(null, badMsg1, null);
        assert.ok(R.broadcastError.called);
        next();
    },

    "test getRevisions with a valid path": function(next) {
        var file = ".c9revisions/" + Path.basename(__filename) + ".c9save";
        try {
            Fs.mkdirSync(".c9revisions");
            Fs.writeFileSync(file, "", "utf8");
        } catch(e) { assert(false, e); }

        var R = this.revisionsPlugin;
        R.getAllRevisions = function() {
            assert(true);
            next();
        };

        R.getRevisions(Path.basename(__filename), function() {}); // good path
    },

    "test getRevisions with a non-valid path": function(next) {
        var R = this.revisionsPlugin;
        R.saveSingleRevision = function() {
            assert(true);
            next();
        };

        R.getRevisions("fake", function() {}); // bad path
    },

    "test getAllRevisions with a non-valid path": function(next) {
        var R = this.revisionsPlugin;

        R.getAllRevisions("very/fake/path", function(err) {
            assert.ok(!!err);
            next();
        });
    },

    "test extractRevisions with an empty string": function(next) {
        var R = this.revisionsPlugin;

        R.extractRevisions("", function(err, revObj) {
            assert.ok(!err, err);
            assert.ok(typeof revObj === "object");
            assert.ok(Object.keys(revObj).length === 0);
            next();
        });
    },

    "test extractRevisions with a valid string": function(next) {
        var R = this.revisionsPlugin;

        R.extractRevisions(sampleData, function(err, revObj) {
            assert.ok(!err, err);
            assert.ok(typeof revObj === "object");
            assert.ok(Object.keys(revObj).length === 34, util.inspect(revObj, false, null));
            next();
        });
    },

    "test getRevisionsPath": function(next) {
        var R = this.revisionsPlugin;
        var path = R.getRevisionsPath("lib/test1.js");
        assert.equal(".c9revisions/lib/test1.js", path);
        next();
    },

    "test saveSingleRevision no path": function(next) {
        var R = this.revisionsPlugin;
        R.saveSingleRevision(null, null, function(err) {
            assert.ok(err instanceof Error);
            next();
        });
    },

    "test saveSingleRevision empty path": function(next) {
        var R = this.revisionsPlugin;
        R.saveSingleRevision("", null, function(err) {
            assert.ok(err instanceof Error);
            next();
        });
    },

    "test saveSingleRevision invalid path": function(next) {
        var R = this.revisionsPlugin;
        R.saveSingleRevision("fake/path", null, function(err) {
            assert.ok(err instanceof Error);
            next();
        });
    },

    "test saveSingleRevision valid path": function(next) {
        var R = this.revisionsPlugin;
        var fileName = __dirname + "/test_saving.txt";
        var revPath = __dirname + "/.c9revisions/test_saving.txt.c9save";
        var secondTime = Date.now() + 100;
        Fs.writeFile(fileName, "ABCDEFGH", function(err) {
            R.saveSingleRevision("test_saving.txt", null,
                function(err) {
                    assert.ok(!err);

                    Fs.writeFileSync(fileName, "123456789", "utf8");

                    R.saveSingleRevision("test_saving.txt", {
                        ts: secondTime,
                        silentsave: true,
                        restoring: false,
                        patch: [Diff.patch_make("ABCDEFGH", "123456789")],
                        length: "123456789".length
                    },
                    function(err) {
                        assert.ok(!err, err);
                        assert.ok(Path.existsSync(revPath));
                        var contents = Fs.readFileSync(revPath, "utf8");
                        var lines = contents.split(/\n/);

                        // Account for the extra newline at the end
                        assert.equal(lines.length, 2 + 1);
                        var first = JSON.parse(lines[0]);
                        var secondRev = JSON.parse(lines[1]);
                        var firstKey = Object.keys(first)[0];
                        var firstRev = first[firstKey];

                        assert.equal(firstRev.silentsave, true);
                        assert.equal(firstRev.restoring, false);
                        assert.equal(firstRev.length, 8);
                        assert.equal(firstRev.patch[0][0].diffs[0][1], "ABCDEFGH");
                        assert.equal(secondRev.ts, secondTime);

                        next();
                    });
                });
        });
    },

    "test retrieve revision for a new file [flow]": function(next) {
        var revPath = __dirname + "/.c9revisions";
        var savePath = revPath + "/" + Path.basename(__filename) + ".c9save";
        if (Path.existsSync(savePath))
            Fs.unlinkSync(savePath);

        assertPath(savePath, false, "Revisions file shouldn't be there");

        var R = this.revisionsPlugin;
        R.getRevisions(Path.basename(__filename), function(err, rev) {
            assert.ok(err === null, err);
            assert.ok(typeof rev === "object");

            assertPath(savePath, true, "Revisions file was not created");
            Fs.readFile(savePath, function(err, data) {
                assert.ok(err === null);
                var revObj = JSON.parse(data);

                assert.ok(typeof revObj === "object");
                //assert.ok(revObj.revisions && revObj.revisions.length === 0);
                //assert.ok(typeof revObj.revisions === "object");

                Fs.readFile(__filename, function(err, data) {
                    assert.ok(err === null);
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
        var broadcastRevisions = sinon.spy(R, "broadcastRevisions");
        var getAllRevisions = sinon.spy(R, "getAllRevisions");
        var broadcastConfirmSave = sinon.spy(R, "broadcastConfirmSave");
        var userBcastSpy = sinon.spy();

        Fs.writeFile(fileName, "ABCDEFGH", function(err) {
            assert.equal(err, null);
            R.onSaveRevision.call(R,
                {
                    data: { email: "sergi@c9.io" },
                    broadcast: userBcastSpy
                },
                {
                    path: Path.basename(fileName),
                    silentsave: true,
                    restoring: true,
                    contributors: ["sergi@c9.io", "mike@c9.io"],
                    content: "123456789"
                },
                function(err, path, revObj) {
                    assert.ok(!err, err);
                }
            );

            setTimeout(function() {
                assert.equal(broadcastConfirmSave.called, true);
                assert.equal(getAllRevisions.called, true);
                assert.equal(broadcastRevisions.called, true);
                assert.equal(userBcastSpy.called, true);

                var _mainRevObj = broadcastRevisions.args[0][0];
                var ts = Object.keys(_mainRevObj)[0];
                var revObj = _mainRevObj[ts];
                var path = broadcastRevisions.args[0][2]._revPath;
                var revisions = Object.keys(_mainRevObj);

                assert.equal(path, ".c9revisions/test_saving.txt.c9save");
                assert.equal(typeof _mainRevObj, "object");
                assert.equal(revisions.length, 1);
                assert.equal(revObj.originalContent, "ABCDEFGH");
                assert.equal(revObj.lastContent, "123456789");
                next();
            }, 500);
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
