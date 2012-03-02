if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
}

define(function(require, exports, module) {

var Document = require("ace/document").Document;
var assert = require("ace/test/assertions");
var Completer = require("ext/codecomplete/snippet_completer").Completer;

function matchSorter(matches) {
    matches.sort(function(a, b) {
        if (a.name < b.name)
            return -1;
        else if (a.name > b.name)
            return 1;
        else
            return 0;
    });
}

Completer.prototype.fetchText = function(path) {
    return require('fs').readFileSync(__dirname + "/../../" + path, 'ascii');
};

module.exports = {
    "test javascript found completions" : function() {
        var doc = new Document("while(true) {\n    fn\n}");
        var completer = new Completer();
        completer.path = 'bla.js';
        var matches = completer.complete(doc, null, {row: 1, column: 6});

        matchSorter(matches);
        assert.equal(matches.length, 1);
        assert.equal(matches[0].name, "fn");
    },

    "test javascript insertion" : function(next) {
        var doc = new Document("while(true) {\n    fn\n}");
        var completer = new Completer();
        completer.path = 'bla.js';
        var matches = completer.complete(doc, null, {row: 1, column: 6});
        matchSorter(matches);
        
        completeUtil.replaceText(editor, "fn", matches[0].replaceText);
        assert.equal(session.getValue(), "while(true) {\n    function () {\n        \n    }\n}");
        var pos = editor.getCursorPosition();
        assert.equal(pos.row, 1);
        assert.equal(pos.column, 13);
    },

    "test javascript insertion 2" : function(next) {
        var session = new EditSession("while(true) {\n    fnc\n}", new JavascriptMode());
        var editor = new Editor(new MockRenderer(), session);
        snippetCompleter.hook();
        editor.moveCursorTo(1, 7);

        snippetCompleter.analyze(editor, function() {
            snippetCompleter.complete(editor, function(matches) {
                matchSorter(matches);
                completeUtil.replaceText(editor, "fnc", matches[0].replaceText);
                assert.equal(session.getValue(), "while(true) {\n    (function() {\n        \n    })();\n}");
                var pos = editor.getCursorPosition();
                assert.equal(pos.row, 2);
                assert.equal(pos.column, 8);
                next();
            });
        });
    },

    "test html insertion" : function(next) {
        var session = new EditSession("divc", new HTMLMode());
        var editor = new Editor(new MockRenderer(), session);
        snippetCompleter.hook();
        editor.moveCursorTo(0, 4);

        snippetCompleter.analyze(editor, function() {
            snippetCompleter.complete(editor, function(matches) {
                completeUtil.replaceText(editor, "divc", matches[0].replaceText);
                assert.equal(session.getValue(), '<div class=""></div>');
                var pos = editor.getCursorPosition();
                assert.equal(pos.row, 0);
                assert.equal(pos.column, 12);
                next();
            });
        });
    }

};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}