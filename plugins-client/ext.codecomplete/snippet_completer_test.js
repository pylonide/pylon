if (typeof process !== "undefined") {
    require("amd-loader");
    require("../../test/setup_paths");
}

define(function(require, exports, module) {

var Document = require("ace/document").Document;
var assert = require("ace/test/assertions");
var completer = require("ext/codecomplete/snippet_completer");
var completeUtil = require("ext/codecomplete/complete_util");

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

completeUtil.fetchText = function(staticPrefix, path) {
    return require('fs').readFileSync(__dirname + "/../" + path.replace("ext/", "ext."), 'ascii');
};


module.exports = {
    "test javascript found completions" : function() {
        var doc = new Document("while(true) {\n    fn\n}");
        completer.language = 'javascript';
        completer.complete(doc, null, {row: 1, column: 6}, null, function(matches) {
            matchSorter(matches);
            assert.equal(matches.length, 1);
            assert.equal(matches[0].name, "fn");
        });
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}
