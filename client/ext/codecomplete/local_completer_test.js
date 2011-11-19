if (typeof process !== "undefined") {
    require("../../../support/paths");
    require("ace/test/mockdom");
}

define(function(require, exports, module) {

var EditSession = require("ace/edit_session").EditSession;
var Editor = require("ace/editor").Editor;
var MockRenderer = require("ace/test/mockrenderer").MockRenderer;
var assert = require("ace/test/assertions");

var localCompleter = require("ext/codecomplete/local_completer");

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

    "test basic completion" : function(next) {
        var session = new EditSession("hel hello2 hello3  hello2 abc");
        var editor = new Editor(new MockRenderer(), session);
        localCompleter.hook();
        editor.moveCursorTo(0, 3);

        localCompleter.analyze(editor, function() {
            localCompleter.complete(editor, function(matches) {
                matchSorter(matches);
                //console.log("Matches:", matches);
                assert.equal(matches.length, 2);
                assert.equal(matches[0].name, "hello2");
                assert.equal(determineDistance(matches[0].score), 0); // no distance
                assert.equal(matches[1].name, "hello3");
                assert.equal(determineDistance(matches[1].score), 1);
                next();
            });
        });
    },

    "test basic completion 2" : function(next) {
        var session = new EditSession("assert.equal(matchers[0].name, matches[0].score);\nassert.eq(matches[0].name, mat[0].score);\n");
        var editor = new Editor(new MockRenderer(), session);
        localCompleter.hook();
        editor.moveCursorTo(1, 9); // .eq|

        localCompleter.analyze(editor, function() {
            localCompleter.complete(editor, function(matches) {
                matchSorter(matches);
                assert.equal(matches.length, 1);
                assert.equal(matches[0].name, "equal");
                assert.equal(determineDistance(matches[0].score), 9);

                editor.moveCursorTo(1, 30); // .mat|[0]

                localCompleter.analyze(editor, function() {
                    localCompleter.complete(editor, function(matches) {
                        matchSorter(matches);
                        assert.equal(matches.length, 2);
                        assert.equal(matches[0].name, "matches");
                        assert.equal(determineDistance(matches[0].score), 4);
                        assert.equal(matches[1].name, "matchers");
                        assert.equal(determineDistance(matches[1].score), 12);
                        next();
                    });
                });

                next();
            });
        });
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}