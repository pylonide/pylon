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

var Os = require("os");
var Path = require("path");

var agModule = require("../cloud9.search.ag");
var nakModule = require("../cloud9.search.nak");

var basePath = Path.join(__dirname, "fixtures");

var outsidePath = "/../../../../../etc";

var options1 = {
        path: "",
        showHiddenFiles: true
    },
    options2 = {
        path: "",
        showHiddenFiles: false
    },
    options3 = {
        path: outsidePath,
        showHiddenFiles: true
    };

describe("filelist", function() {
    var o;
    var vfs = VfsLocal({ root: "/" });

    var platform = Os.platform(),
        arch = Os.arch(),
        agCmd = Path.join(__dirname, "..", "cloud9.search.ag", [platform, arch].join("_"), "ag"),
        nakCmd = "node " + Path.join(__dirname, "..", "..", "node_modules", "nak", "bin", "nak");

    var AgLib = agModule({
        agCmd: agCmd,
        nakCmd: nakCmd,
        test: true
    });

    var NakLib = nakModule({
        agCmd: agCmd,
        nakCmd: nakCmd,
        test: true
    });

    beforeEach(function() {
        o = new Filelist();
        o.setEnv({ 
            basePath: basePath
        });
    });

    it("should get filelist, including hidden files and binaries",  function(next) {
        var out = "", agCount = "", agFileCount = "", agLines = "";
        
        o.setEnv({ 
            searchType: AgLib
        });

        o.exec(options1, vfs,
            // data
            function(data) {
                out += data;
            },
            // exit
            function(code, stderr, msg) {
                Assert.equal(code, 0);
                var files = out.split("\n").filter(function(file) { return !!file; }).sort();

                Assert.equal(files[2], basePath + "/level1/Toasty.gif");
                Assert.equal(files[3], basePath + "/level1/level2/.hidden");
                Assert.equal(files[4], basePath + "/level1/level2/.level3a/.hidden");

                o.setEnv({ 
                    searchType: NakLib
                });
                        
                out = options1.path = "";

                o.exec(options1, vfs,
                    // data
                    function(data) {
                        out += data;
                    },
                    // exit
                    function(code, stderr) {
                        console.log(stderr)
                        Assert.equal(code, 0);
                        var files = out.split("\n").filter(function(file) { return !!file; }).sort();

                        Assert.equal(files[2], basePath + "/level1/Toasty.gif");
                        Assert.equal(files[3], basePath + "/level1/level2/.hidden");
                        Assert.equal(files[4], basePath + "/level1/level2/.level3a/.hidden");

                        next();
                    }
                );
            }
        );
    });

    it("should get filelist, without hidden files",  function(next) {
        var out = "", agCount = "", agFileCount = "", agLines = "";

        o.setEnv({ 
            searchType: AgLib
        });

        o.exec(options2, vfs,
            // data
            function(data) {
                out += data;
            },
            // exit
            function(code, stderr) {
                Assert.equal(code, 0);
                var files = out.split("\n").filter(function(file) { return !!file; }).sort();

                Assert.equal(files[3], basePath + "/level1/level2/level2.rb");
                Assert.equal(files[4], basePath + "/level1/level2/level3/level4/level4.txt");
                
                o.setEnv({ 
                    searchType: NakLib
                });
                        
                out = options2.path = "";

                o.exec(options2, vfs,
                    // data
                    function(data) {
                        out += data;
                    },
                    // exit
                    function(code, stderr) {
                        Assert.equal(code, 0);
                        var files = out.split("\n").filter(function(file) { return !!file; }).sort();
                        Assert.equal(files[3], basePath + "/level1/level2/level2.rb");
                        Assert.equal(files[4], basePath + "/level1/level2/level3/level4/level4.txt");

                        next();
                    }
                );
            }
        );
    });

    it("should not be possible to get a filelist from outside the root path ",  function(next) {
        var out = "", agCount = "", agFileCount = "", agLines = "";

        o.setEnv({ 
            searchType: AgLib
        });

        o.exec(options3, vfs,
            // data
            function(data) {
                out += data;
            },
            // exit
            function(code, stderr) {
                Assert.equal(code, 1);
                Assert.equal(stderr, "Invalid path");

                o.setEnv({ 
                    searchType: NakLib
                });
                        
                out = "";
                options3.path = outsidePath;

                o.exec(options3, vfs,
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
            }
        );
    });
});
