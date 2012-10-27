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

var basePath = Path.join(__dirname, "fixtures");

var agResults = { "1": {}, "2": {}, "3": {}, "4": {}, "5": {}};

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
            };
    
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
    });

    it("with ag: should find matches without regexp, case-sensitive OFF and word boundaries OFF",  function(next) {
        var out = "";
        
        o.setEnv({ 
            useAg: true
        });
        
        o.exec(options1, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 6);
                Assert.equal(msg.filecount, 4);
                var lines = out.split("\n");
                Assert.equal(lines.length, 13);

                agResults["1"].count = msg.count;
                agResults["1"].filecount = msg.filecount;
                agResults["1"].lines = lines.length;
                
                next();
            }
        );
    });

    it("with ag: should find matches without regexp, case-sensitive ON and word boundaries OFF",  function(next) {
        var out = "";
        
        o.setEnv({ 
            useAg: true
        });
        
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
                Assert.equal(lines.length, 5);

                agResults["2"].count = msg.count;
                agResults["2"].filecount = msg.filecount;
                agResults["2"].lines = lines.length;
                
                next();
            }
        );
    });

    it("with ag: should find matches without regexp, case-sensitive OFF and word boundaries ON",  function(next) {
        var out = "";
        
        o.setEnv({ 
            useAg: true
        });
        
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
                Assert.equal(lines.length, 8);

                agResults["3"].count = msg.count;
                agResults["3"].filecount = msg.filecount;
                agResults["3"].lines = lines.length;
                
                next();
            }
        );
    });

    it("with ag: should find matches with a regexp, case-sensitive OFF",  function(next) {
        var out = "";
        
        o.setEnv({ 
            useAg: true
        });
        
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
                Assert.equal(lines.length, 15);

                agResults["4"].count = msg.count;
                agResults["4"].filecount = msg.filecount;
                agResults["4"].lines = lines.length;
                
                next();
            }
        );
    });
    
    it("with ag: should find matches with a regexp, case-sensitive ON, including the default .agignore file, and hidden files",  function(next) {
        var out = "";
        
        o.setEnv({ 
            useAg: true
        });
        
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
                Assert.equal(lines.length, 27);

                agResults["5"].count = msg.count;
                agResults["5"].filecount = msg.filecount;
                agResults["5"].lines = lines.length;
                
                next();
            }
        );
    });
    
    it("with nak: should find matches without regexp, case-sensitive OFF and word boundaries OFF",  function(next) {
        var out = "";

        o.setEnv({ 
            useAg: false
        });
        
        options1.path = "";
        
        o.exec(options1, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                console.log(msg.command);
                Assert.equal(code, 0);
                Assert.equal(msg.count, 11);
                Assert.equal(msg.filecount, 4);
                var lines = out.split("\n");
                Assert.equal(lines.length, 18);

                Assert.equal(msg.count, agResults["1"].count);
                Assert.equal(msg.filecount, agResults["1"].filecount);
                Assert.equal(msg.lines.length, agResults["1"].lines);
                
                next();
            }
        );
    });

    it("with nak: should find matches without regexp, case-sensitive ON and word boundaries OFF",  function(next) {
        var out = "";

        o.setEnv({ 
            useAg: false
        });
        
        options2.path = "";
        
        o.exec(options2, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 4);
                Assert.equal(msg.filecount, 2);
                var lines = out.split("\n");
                Assert.equal(lines.length, 27);

                Assert.equal(msg.count, agResults["2"].count);
                Assert.equal(msg.filecount, agResults["2"].filecount);
                Assert.equal(msg.lines.length, agResults["2"].lines);
                
                next();
            }
        );
    });

    it("with nak: should find matches without regexp, case-sensitive OFF and word boundaries ON",  function(next) {
        var out = "";

        o.setEnv({ 
            useAg: false
        });
        
        options3.path = "";
        
        o.exec(options3, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 250);
                Assert.equal(msg.filecount, 72);
                var lines = out.split("\n");
                Assert.equal(lines.length, 393);

                Assert.equal(msg.count, agResults["3"].count);
                Assert.equal(msg.filecount, agResults["3"].filecount);
                Assert.equal(msg.lines.length, agResults["3"].lines);
                
                next();
            }
        );
    });

    it("with nak: should find matches with a regexp",  function(next) {
        var out = "";

        o.setEnv({ 
            useAg: false
        });
        
        options4.path = "";
        
        o.exec(options4, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 13);
                Assert.equal(msg.filecount, 3);
                var lines = out.split("\n");
                Assert.equal(lines.length, 27);

                Assert.equal(msg.count, agResults["4"].count);
                Assert.equal(msg.filecount, agResults["4"].filecount);
                Assert.equal(msg.lines.length, agResults["4"].lines);
                
                next();
            }
        );
    });
    
    it("with nak: should find matches with a regexp, case-sensitive ON, and including the default .agignore file",  function(next) {
        var out = "";

        o.setEnv({ 
            useAg: false
        });
        
        options5.path = "";
        
        o.exec(options5, vfs,
            // data
            function(msg) {
                out += msg.data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                Assert.equal(msg.count, 18);
                Assert.equal(msg.filecount, 2);
                var lines = out.split("\n");
                Assert.equal(lines.length, 5);

                Assert.equal(msg.count, agResults["5"].count);
                Assert.equal(msg.filecount, agResults["5"].filecount);
                Assert.equal(msg.lines.length, agResults["5"].lines);
                
                next();
            }
        );
    });
});
