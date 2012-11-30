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

var Path = require("path");

var nakModule = require("../cloud9.search.nak");

var basePath = Path.join(__dirname, "fixtures");

var options1 = {
                query: "sriracha",
                needle: "sriracha",
                pattern: "",
                casesensitive: false,
                regexp: false,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: ""
            },
    options2 = {
                query: "Messenger",
                needle: "Messenger",
                pattern: "",
                casesensitive: true,
                regexp: false,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: ""
            },
    options3 = {
                query: "gastro",
                needle: "gastro",
                pattern: "",
                casesensitive: false,
                regexp: false,
                replaceAll: false,
                replacement: "",
                wholeword: true,
                command: "codesearch",
                path: ""
            },
    options4 = {
                query: "pb.",
                needle: "pb.",
                pattern: "",
                casesensitive: false,
                regexp: true,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: ""
            },
    options5 = {
                query: ".+wave",
                needle: ".+wave",
                pattern: "",
                casesensitive: true,
                regexp: true,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: "",
                hidden: true
            },
    options6 = {
                query: "shorts",
                needle: "shorts",
                pattern: "*.txt, file*.gif",
                casesensitive: true,
                regexp: true,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: ""
            },
    options7 = {
                query: "williamsburg",
                needle: "williamsburg",
                pattern: "-file*.txt",
                casesensitive: true,
                regexp: true,
                replaceAll: false,
                replacement: "",
                wholeword: false,
                command: "codesearch",
                path: "",
                hidden: true
            };
    
describe("search", function() {
    var o;
    var vfs = VfsLocal({ root: "/" });

    var nakCmd = "node " + Path.join(__dirname, "..", "..", "node_modules", "nak", "build", "nak.vfs_concat.js");

    var NakLib = nakModule({
        nakCmd: nakCmd,
        test: true
    });

    o = new Search();
        o.setEnv({ 
            basePath: basePath,
            searchType: NakLib
        });

    afterEach(function(done) {
        vfs.unextend("nak_search", {}, done);
    });

    it("should find matches without regexp, case-sensitive OFF and word boundaries OFF",  function(next) {
        var out = "";
        
        o.exec(options1, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 8);
                Assert.equal(msg.filecount, 4);
                var lines = out.split("\n");
                Assert.equal(lines.length, 7);
                next();
            }
        );
    });

    it("should find matches without regexp, case-sensitive ON and word boundaries OFF",  function(next) {
        var out = "";

        o.exec(options2, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 2);
                Assert.equal(msg.filecount, 2);
                var lines = out.split("\n");
                Assert.equal(lines.length, 3);
                
                next();
            }
        );
    });

    it("should find matches without regexp, case-sensitive OFF and word boundaries ON",  function(next) {
        var out = "";
        
        o.exec(options3, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 3);
                Assert.equal(msg.filecount, 3);
                var lines = out.split("\n");
                Assert.equal(lines.length, 4);
                
                next();
            }
        );
    });

    it("should find matches with a regexp, case-sensitive OFF",  function(next) {
        var out = "";
        
        o.exec(options4, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 8);
                Assert.equal(msg.filecount, 4);
                var lines = out.split("\n");
                Assert.equal(lines.length, 9);
                
                next();
            }
        );
    });
    
    it("should find matches with a regexp, case-sensitive ON, including the default .agignore file, and hidden files",  function(next) {
        var out = "";
        
        o.exec(options5, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 14);
                Assert.equal(msg.filecount, 7);
                var lines = out.split("\n");
                Assert.equal(lines.length, 15);
                
                next();
            }
        );
    });
 
    it("should find matches without regexp, only two file types, and no hidden files (even if they contain the string)",  function(next) {
        var out = "";
        
        o.exec(options6, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 2);
                Assert.equal(msg.filecount, 2);
                var lines = out.split("\n");
                Assert.equal(lines.length, 3);

                Assert.equal(/.file8_hidden.txt/.test(lines), false);
                
                next();
            }
        );
    });

    it("should find matches without regexp, excluding txt files",  function(next) {
        var out = "";
        
        o.exec(options7, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 14);
                Assert.equal(msg.filecount, 4);
                var lines = out.split("\n");
                Assert.equal(lines.length, 11);
                
                next();
            }
        );
    });
});
