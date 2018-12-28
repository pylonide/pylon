"use strict";

var assert = require("assert");
var sinon = require("sinon");
var Path = require("path");
var RevisionsModule = require("../revisions");
var rimraf = require("rimraf");
var Diff_Match_Patch = require("../diff_match_patch");
var VfsLocal = require("vfs-local");
var Fs = require("fs");
var util = require('util');

var Diff = new Diff_Match_Patch();

var BASE_URL = "/sergi/node_chat";

var assertPath = function(path, shouldExist, message) {
    assert.ok(Path.existsSync(path) == shouldExist, message || "");
};

var sampleData = Fs.readFileSync(Path.join(__dirname, "revobj.tst"), "utf8");
var ___dirname = Path.resolve(__dirname, "..");

module.exports = {
    setUp: function(next) {
        var self = this;
        var Plugin;

        var ide = {
            workspaceDir: ___dirname,
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
            root: ___dirname,
            checkSymlinks: true
        });

        Fs.mkdirSync(Path.join(___dirname, ".c9revisions"));

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
        Fs.unlink(___dirname + "/test_saving.txt", function(){});
        var revPath = Path.join(___dirname, ".c9revisions");
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

    "test onCommand": function(next) {
        var R = this.revisionsPlugin;
        R.onSaveRevision = sinon.spy();
        R.onGetRevisionHistory = sinon.spy();
        R.onGetRealFileContents = sinon.spy();
        R.onRemoveRevision = sinon.spy();
        R.onMoveRevision = sinon.spy();

        // no 'path'
        var msg1 = { command: "revisions", subCommand: "saveRevision"  };
        var msg2 = { command: "revisions", subCommand: "getRevisionHistory"  };
        var msg3 = { command: "revisions", subCommand: "getRealFileContents"  };
        var msg4 = { command: "revisions", subCommand: "removeRevision"  };
        var msg5 = { command: "revisions", subCommand: "moveRevision"  };

        R.command(null, msg1, null);
        assert.ok(R.onSaveRevision.called);

        R.command(null, msg2, null);
        assert.ok(R.onGetRevisionHistory.called);

        R.command(null, msg3, null);
        assert.ok(R.onGetRealFileContents.called);

        R.command(null, msg4, null);
        assert.ok(R.onRemoveRevision.called);

        R.command(null, msg5, null);
        assert.ok(R.onMoveRevision.called);
        next();
    },

    "test getRevisions with a valid path": function(next) {
        var file = Path.join(___dirname, ".c9revisions", Path.basename(__filename) + ".c9save");
        try {

            Fs.writeFileSync(file, "", "utf8");
        }
        catch(e) {
            assert(false, e);
        }

        var R = this.revisionsPlugin;
        var spy = sinon.spy(R, "getAllRevisions");

        R.getRevisions(Path.basename(__filename), function() {
            assert.equal(spy.called, true);
            next();
        });
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

            var randomRev = revObj[Object.keys(revObj)[12]];
            assert.equal(randomRev.hasOwnProperty("ts"), true);
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

        var leafName = "test_saving.txt";
        var fileName = Path.join(___dirname, leafName);
        var revPathRel = Path.join(".c9revisions", "test_saving.txt.c9save");
        var revPath = Path.join(___dirname, revPathRel);

        var secondTime = Date.now() + 100;

        var firstContent = "ABCDEFGH";
        var secondContent = "123456789";

        Fs.writeFile(fileName, firstContent, function(err) {
            R.saveSingleRevision(leafName, null,
                function(err, data1) {
                    assert.ok(!err, err);

                    R.saveSingleRevision(leafName, {
                        ts: secondTime,
                        silentsave: true,
                        restoring: false,
                        patch: [Diff.patch_make(firstContent, secondContent)],
                        length: secondContent.length
                    },
                    function(err, data2) {
                        assert.ok(!err, err);

                        //assert.equal(data2.path, leafName);
                        assert.ok(Path.existsSync(revPath));

                        var contents = Fs.readFileSync(revPath, "utf8");
                        var lines = contents.split(/\n/);

                        // Account for the extra newline at the end
                        assert.equal(lines.length, 2 + 1);

                        var first = JSON.parse(lines[0]);
                        var secondRev = JSON.parse(lines[1]);
                        //assert.equal(data2.revision, secondRev.ts);

                        assert.equal(first.silentsave, true);
                        assert.equal(first.restoring, false);
                        assert.equal(first.length, 8);
                        assert.equal(first.patch[0][0].diffs[0][1], firstContent);
                        assert.equal(secondRev.ts, secondTime);

                        next();
                    });
                });
        });
    },

    "test onRemoveRevision empty path": function(next) {
        var R = this.revisionsPlugin;
        R.onRemoveRevision(
            null,
            { path: "" },
            function(err) {
                assert.ok(err);
                next();
            },
            function() {
                assert.ok(false, "Should never get here");
                next();
            }
        );
    },

    "test onRemoveRevision invalid filepath": function(next) {
        var R = this.revisionsPlugin;
        R.onRemoveRevision(
            null,
            { path: "madeup/path/test.js" },
            function(err) {
                assert.ok(false, "Should never get here: " + err);
                next();
            },
            function(err) {
                assert.ok(err instanceof Error);
                next();
            }
        );
    },

    "test onRemoveRevision invalid folderpath": function(next) {
        var R = this.revisionsPlugin;
        R.onRemoveRevision(
            null,
            { path: "madeup/path", isFolder: true },
            function(err) {
                assert.ok(false, "Should never get here: " + err);
                next();
            },
            function(err) {
                assert.ok(err instanceof Error);
                next();
            }
        );
    },

    "test onRemoveRevision valid filepath": function(next) {
        var R = this.revisionsPlugin;
        var fileName = ___dirname + "/.c9revisions/test_rev.js.c9save";

        Fs.writeFile(fileName, "ABCDEFGH", function(err) {
            assert.ok(!err);

            R.onRemoveRevision(
                null,
                { path: "test_rev.js.c9save", isFolder: true },
                function(err) {
                    assert.ok(false, "Should never get here: " + err);
                    next();
                },
                function(err, data) {
                    assert.ok(!err);
                    next();
                }
            );
        });
    },

    "test retrieve revision for a new file [flow]": function(next) {
        var revPath = Path.join(___dirname, ".c9revisions");
        var savePath = Path.join(revPath, "package.json.c9save");
        if (Path.existsSync(savePath))
            Fs.unlinkSync(savePath);

        assertPath(savePath, false, "Revisions file shouldn't be there");

        var R = this.revisionsPlugin;
        R.getRevisions("package.json", function(err, rev) {
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

    "test saving revision [flow]": function(next) {
        var fileName = ___dirname + "/test_saving.txt";
        //var revPath = ___dirname + "/.c9revisions";
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
                    content: "123456789",
                    forceRevisionListResponse: true
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
                var revisions = Object.keys(_mainRevObj);

                assert.equal(typeof _mainRevObj, "object");
                assert.equal(revisions.length, 1);
                next();
            }, 500);
        });
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();
