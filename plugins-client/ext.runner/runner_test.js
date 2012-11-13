/*
 * @copyright Copyright(c) 2012 Ajax.org B.V. <info@ajax.org>
 * @author Sergi Mansilla <sergi@c9.io>
 */
"use strict";

if (typeof process !== "undefined") {
    require("amd-loader");
}

define(function(require, exports, module) {

var assert = require("assert");

module.exports = {
    timeout: 30000,

    setUpSuite: function(next) {
        next();
    },

    tearDownSuite: function(next) {
        next();
    },

    "test 1": function(next) {
        next();
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}
