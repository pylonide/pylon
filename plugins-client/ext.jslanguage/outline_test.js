if (typeof process !== "undefined") {
    require("amd-loader");
    require("../../test/setup_paths");
}

define(function(require, exports, module) {

var handler = require("ext/jslanguage/outline");
var parser = require("treehugger/js/parse");
var assert = require("ace/test/assertions");
var Document = require("ace/document").Document;

//var microtime = require("microtime");

module.exports = {
    "test basic outline" : function() {
        var testfile = "" + require('text!ext/jslanguage/test/test1.js');
        var node = parser.parse(testfile);
        console.log(Document);
        var outline = outlineSync(handler, new Document(testfile), node);
        //console.log(""+node);
        //console.log(JSON.stringify(outline, null, 2));
        assert.equal(outline[0].name, 'simpleFunction()');
        assert.equal(outline[1].name, 'simpleFunctionNested(a, b)');
        assert.equal(outline[1].items[0].name, 'nested(c)');
        assert.equal(outline[2].name, 'someFunction(a, b)');
        assert.equal(outline[3].name, 'bla()');
    }

    // Removed: "test jquery". It required a `jquery.js` fixture that was never part of
    // this repository, and asserted nothing -- it was a parse/outline benchmark whose
    // microtime measurements were already commented out, so it could only ever report
    // "did not throw".
};

});

function outlineSync(handler, document, node) {
    var result;
    handler.outline(document, node, function(o) {
        result = o.body;
    });
    return result;
}

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}
