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
var search = require("./search").fileSearch;

module.exports = {
    timeout: 30000,

    setUpSuite: function(next) {
        next();
    },

    tearDownSuite: function(next) {
        next();
    },

    "test searching": function(next) {
        var xml = search([
            "/.test", // excluded
            "/etc/config.js", // excluded
            "/etc/code", // first
            "/etc/code.xml", // prio because of in filename match
            "/blah/code/others.png", //included but no prio
            "/etc/code_test.xml", //included and prio because of in word
            "/blah/code/me.jpg" //included but no prio
        ], "code", []);

        assert.deepEqual(xml, ["/etc/code", "/etc/code.xml", "/etc/code_test.xml", "/blah/code/others.png", "/blah/code/me.jpg"]);
        
        next();
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}
