/**
 * Search module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

"mocha";

var Assert = require("assert");
var Path = require("path");
var Os = require("os");

var VfsLocal = require("vfs-local");
var Search = require("./search");

var basePath = Path.join(__dirname, "..");

describe("search", function() {
    var o;
    var vfs = VfsLocal({ root: "/" });

    var platform = Os.platform() ,
        arch = Os.arch();

    beforeEach(function() {
        o = new Search();
        o.setEnv({ 
            basePath: basePath,
            platform:  platform,
            arch:  arch,
            agCmd:  Path.join(__dirname, [platform, arch].join("_"), "ag"),
            nakCmd: "node " + Path.join(__dirname, "../../node_modules/nak/bin/nak")
        });
        if (!o.isAgAvailable())
            console.warn("No ag found for " + [platform, arch].join("_"));
        else 
            o.setEnv({
                useAg: true
        });
    });

    it("with ag: should find matches without regexp, case-sensitive OFF and word boundaries OFF",  function(next) {
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
                Assert.equal(msg.count, 48);
                Assert.equal(msg.filecount, 15);
                var lines = out.split("\n");
                Assert.equal(lines.length, 77);

                next();
            }
        );
    });

    it("with ag: should find matches without regexp, case-sensitive ON and word boundaries OFF",  function(next) {
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
                Assert.equal(msg.count, 22);
                Assert.equal(msg.filecount, 3);
                var lines = out.split("\n");
                Assert.equal(lines.length, 27);

                next();
            }
        );
    });

    it("with ag: should find matches without regexp, case-sensitive OFF and word boundaries ON",  function(next) {
        var out = "";

        o.exec({
                query: "var",
                needle: "var",
                pattern: "",
                casesensitive: false,
                regexp: false,
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
                Assert.equal(msg.count, 941);
                Assert.equal(msg.filecount, 3);
                var lines = out.split("\n");
                Assert.equal(lines.length, 28);

                next();
            }
        );
    });

    it("with ag: should find matches with a regexp",  function(next) {
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
