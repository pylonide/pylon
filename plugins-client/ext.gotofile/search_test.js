/*
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax.org>
 * @author Ruben Daniels <ruben AT c9 DOT io>
 */
"use strict";

if (typeof process !== "undefined") {
    require("amd-loader");
}

define(function(require, exports, module) {

var assert = require("assert");
var search = require("./search");

module.exports = {
    timeout: 30000,

    setUpSuite: function(next) {
        next();
    },

    tearDownSuite: function(next) {
        next();
    },

    "test searching": function(next) {
        var fileList = [
            "/.test", // excluded
            "/etc/config.js", // excluded
            "/etc/code", // first
            "/etc/code.xml", // prio because of in filename match
            "/blah/code/others.png", //included but no prio
            "/etc/code_test.xml", //included and prio because of in word
            "/blah/code/me.jpg" //included but no prio
        ];

        assert.deepEqual(search.fileSearch(fileList, "code"), ["/etc/code", "/etc/code.xml", "/etc/code_test.xml", "/blah/code/me.jpg", "/blah/code/others.png"]);
        assert.deepEqual(search.fileSearch(fileList, "etc.xml"), ["/etc/code.xml", "/etc/code_test.xml"]);
        next();
    },

    "test match": function (next) {
        var matches = search.matchPath("etc/code_test.xml", "etc/xml");
        assert.equal(matches.length, 4);
        assert.equal(matches.map(function (m) { return m.val; }).join(""), "etc/code_test.xml");
        assert.equal(matches.map(function (m) { return m.match && m.val; }).join(""), "etc/xml");
        next();
    },

    "test measure": function (next) {
        var spawn = require("child_process").spawn;
        var process = spawn("find", [".", "-type", "f"],
            {cwd: __dirname+"/../../"});
        var stdout = [];
        process.stdout.on("data", function (data) {
            stdout.push(data.toString());
        });
        process.on("exit", function (code) {
            var fileList = stdout.join("").split("\n");
            console.log("Num:", fileList.length);
            fileList.splice(fileList.length-1, 1);
            var sd = new Date();
            var result = search.fileSearch(fileList, "noderunner");
            console.log("took: " + (new Date() - sd));
            next();
        });
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}
