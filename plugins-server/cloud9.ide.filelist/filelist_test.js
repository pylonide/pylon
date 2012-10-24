/**
 * Filelist module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

"mocha";

var Assert = require("assert");
var VfsLocal = require("vfs-local");
var Filelist = require("./filelist");

var basePath = __dirname + "/fixtures";
var workspaceId = "user/mikedeboer/cloud9";

describe("filelist", function() {
    var o;
    var vfs = VfsLocal({ root: "/" });

    beforeEach(function() {
        o = new Filelist();
        o.setEnv({
            basePath: basePath,
            workspaceId: workspaceId
        });
    });

    it("should get filelist, including hidden files",  function(next) {
        var out = "";

        o.exec({
                path: "",
                showHiddenFiles: true
            }, vfs,
            // data
            function(data) {
                out += data;
            },
            // exit
            function(code, stderr) {
                Assert.equal(code, 0);
                var files = out.split("\n").filter(function(file) { return !!file; }).sort();
                Assert.equal(files[2], "./level1/level2/.hidden");
                Assert.equal(files[3], "./level1/level2/.level3a/.hidden");

                next();
            }
        );
    });

    it("should get filelist, without hidden files",  function(next) {
        var out = "";

        o.exec({
                path: "",
                showHiddenFiles: false
            }, vfs,
            // data
            function(data) {
                out += data;
            },
            // exit
            function(code, stderr) {
                Assert.equal(code, 0);
                var files = out.split("\n").filter(function(file) { return !!file; }).sort();
                Assert.equal(files[2], "./level1/level2/level2.rb");
                Assert.equal(files[3], "./level1/level2/level3/level4/level4.txt");

                next();
            }
        );
    });

    it("should not be possible to get a filelist from outside the root path ",  function(next) {
        var out = "";

        o.exec({
                path: "/../../../../../etc",
                showHiddenFiles: true
            }, vfs,
            // data
            function(data) {
                out += data;
            },
            // exit
            function(code, stderr) {
                Assert.equal(code, 1);
                Assert.equal(stderr, "Invalid path");

                next();
            }
        );
    });
});
