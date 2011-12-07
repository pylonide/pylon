if (typeof process !== "undefined") {
    require("../../../support/paths");
    //require("ace/test/mockdom");
    require.paths.unshift(__dirname + "/../..");
}

define(function(require, exports, module) {

var Document = require("ace/document").Document;
var assert = require("ace/test/assertions");

var completer = require("ext/codecomplete/local_completer");

function matchSorter(matches) {
    matches.sort(function(a, b) {
        if (a.score < b.score)
            return 1;
        else if (a.score > b.score)
            return -1;
        else
            return 0;
    });
}

function determineDistance(score) {
    return 1000000 - score;
}

module.exports = {
    "test basic completion" : function() {
        var doc = new Document("hel hello2 hello3  hello2 abc");
        var matches = completer.complete(doc, null, {row: 0, column: 3});

        matchSorter(matches);
        //console.log("Matches:", matches);
        assert.equal(matches.length, 2);
        assert.equal(matches[0].name, "hello2");
        assert.equal(determineDistance(matches[0].score), 0); // no distance
        assert.equal(matches[1].name, "hello3");
        assert.equal(determineDistance(matches[1].score), 1);
    },

    "test basic completion 2" : function() {
        var doc = new Document("assert.equal(matchers[0].name, matches[0].score);\nassert.eq(matches[0].name, mat[0].score);\n");
        var matches = completer.complete(doc, null, {row: 1, column: 9}); // .eq|
        matchSorter(matches);
        assert.equal(matches.length, 1);
        assert.equal(matches[0].name, "equal");
        assert.equal(determineDistance(matches[0].score), 9);

        matches = completer.complete(doc, null, {row: 1, column: 30});  // .mat|[0]
        matchSorter(matches);
        assert.equal(matches.length, 2);
        assert.equal(matches[0].name, "matches");
        assert.equal(determineDistance(matches[0].score), 4);
        assert.equal(matches[1].name, "matchers");
        assert.equal(determineDistance(matches[1].score), 12);
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}