/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

"mocha";

var Assert = require("assert");
var VfsLocal = require("vfs-local");
var Search = require("./search");

var basePath = __dirname;
var workspaceId = "user/mikedeboer/cloud9";

describe("search", function() {
    var o;
    var vfs = VfsLocal({ root: "/" });

    beforeEach(function() {
        o = new Search();
        o.setEnv({ basePath: basePath });
    });

    it("should find matches without regexp, case-sensitive ON and word boundaries OFF",  function(next) {
        var out = "";

        o.exec({
                query: "Search",
                needle: "Search",
                pattern: "",
                casesensitive: false,
                regexp: false,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: ""
            }, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 36);
                Assert.equal(msg.filecount, 6);
                var lines = out.split("\n");
                Assert.equal(lines.length, 47);

                next();
            }
        );
    });

    it("should find matches without regexp, case-insensitive ON and word boundaries OFF",  function(next) {
        var out = "";

        o.exec({
                query: "Search",
                needle: "Search",
                pattern: "",
                casesensitive: true,
                regexp: false,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: ""
            }, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 23);
                Assert.equal(msg.filecount, 3);
                var lines = out.split("\n");
                Assert.equal(lines.length, 28);

                next();
            }
        );
    });

    it("should find matches without regexp, case-sensitive ON and word boundaries ON",  function(next) {
        var out = "";

        o.exec({
                query: "Search",
                needle: "Search",
                pattern: "",
                casesensitive: true,
                regexp: false,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: ""
            }, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 23);
                Assert.equal(msg.filecount, 3);
                var lines = out.split("\n");
                Assert.equal(lines.length, 28);

                next();
            }
        );
    });

    it("should find matches with a regexp",  function(next) {
        var out = "";

        o.exec({
                query: "Search.*",
                needle: "Search.*",
                pattern: "",
                casesensitive: true,
                regexp: true,
                replaceAll: false,
                replacement: "",
                wholeword: true,
                command: "codesearch",
                path: ""
            }, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 22);
                Assert.equal(msg.filecount, 3);
                var lines = out.split("\n");
                Assert.equal(lines.length, 27);

                next();
            }
        );
    });
});
