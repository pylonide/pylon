if (typeof process !== "undefined") {
    require("../../../support/paths");
    //require("ace/test/mockdom");
    require.paths.unshift(__dirname + "/../..");
    require.paths.unshift(__dirname + "/../../../support/treehugger/lib");
}

define(function(require, exports, module) {

var handler = require("ext/jslanguage/outline");
var parser = require("treehugger/js/parse");
var assert = require("ace/test/assertions");

//var microtime = require("microtime");

module.exports = {
    "test basic outline" : function() {
        var node = parser.parse(""+require('text!ext/jslanguage/test/test1.js'));
        var outline = handler.outline(node);
        //console.log(""+node);
        //console.log(JSON.stringify(outline, null, 2));
        assert.equal(outline[0].name, 'simpleFunction()');
        assert.equal(outline[1].name, 'simpleFunctionNested(a, b)');
        assert.equal(outline[1].items[0].name, 'nested(c)');
        assert.equal(outline[2].name, 'someFunction(a, b)');
        assert.equal(outline[3].name, 'bla()');
    },

    "test jquery" : function() {
        //var now = microtime.now();
        var node = parser.parse(""+require('text!jquery.js'));
        //console.log("Parsing time: " + (microtime.now() - now)/1000 + "ms");
        //var now = microtime.now();
        var outline = handler.outline(node);
        //console.log("Outline time: " + (microtime.now() - now)/1000 + "ms");
    }

};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}