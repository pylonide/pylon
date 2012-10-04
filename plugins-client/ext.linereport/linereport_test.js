if (typeof process !== "undefined") {
    require("amd-loader");
    require("../../test/setup_paths");
}

define(function(require, exports, module) {

var assert = require("assert");
var report = require("./linereport_base");

module.exports = {
    
    "test parse line" : function(next) {
        var results = report.parseOutput("1:2: 3");
        console.log(results[0]);
        assert.equal(results[0].pos.sl, 0);
        assert.equal(results[0].pos.sc, 1);
        assert.equal(results[0].message, "3");
        next();
    },
    
    "test parse two lines" : function(next) {
        var results = report.parseOutput("1:1: line 1\n1:2: line 2");
        assert.equal(results.length, 2);
        next();
    },
    
    "test ignore lines" : function(next) {
        var results = report.parseOutput("1:1: line 1\n1:2: line 2\bmove zig");
        assert.equal(results.length, 2);
        next();
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}