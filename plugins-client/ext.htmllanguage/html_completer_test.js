if (typeof process !== "undefined") {
    require("amd-loader");
    require("../../test/setup_paths");
}

define(function(require, exports, module) {

var assert = require("ace/test/assertions");
var Document = require("ace/document").Document;
var completer = require("ext/htmllanguage/html_completer");

module.exports = {
    
    "test basic snippet completion 1" : function(next) {
        var doc = new Document("<bo");
        var matches = completer.complete(doc, null, {row: 0, column: 3}, null, function(matches) {
            console.log("Matches:", matches);
            assert.equal(matches.length, 1);
            assert.equal(matches[0].name, "body");
            next();
        });
    },

    "test basic snippet completion 2" : function(next) {
        var doc = new Document("link");
        var matches = completer.complete(doc, null, {row: 0, column: 3}, null, function(matches) {
            console.log("Matches:", matches);
            assert.equal(matches.length, 1);
            assert.ok(matches[0].replaceText.match(/^<link .*stylesheet.*css.*\/>$/));
            next();
        });
    },

    "test Jade/Haml completion 1" : function(next) {
        var doc = new Document("\n.breaty");
        var matches = completer.complete(doc, null, {row: 1, column: 7}, null, function(matches) {
            console.log("Matches:", matches);
            assert.equal(matches.length, 1);
            assert.equal(matches[0].replaceText, '<div class="breaty">^^</div>');
            next();
        });
    },

    "test Jade/Haml completion 2" : function(next) {
        var doc = new Document("<span>anything</span>table.cool<p>stuff</p>");
        var matches = completer.complete(doc, null, {row: 0, column: 31}, null, function(matches) {
            console.log("Matches:", matches);
            assert.equal(matches.length, 1);
            assert.ok(matches[0].replaceText.match(/^<table/));
            assert.ok(matches[0].replaceText.match(/<\/table>$/));
            next();
        });
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}
