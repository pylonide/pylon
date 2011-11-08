define(function(require, exports, module) {

var oop = require("pilot/oop");
var tree = require("treehugger/tree");
require("treehugger/traverse");
var BaseLanguageHandler = require('ext/language/base_handler').BaseLanguageHandler;

var OutlineHandler = exports.OutlineHandler = function(sender) {
};

oop.inherits(OutlineHandler, BaseLanguageHandler);

(function() {

    this.handlesPath = function(path) {
        return path.search(/\.md$/) !== -1;
    };
    
    this.parse = function(code) {
        var nodes = [];
        var lines = code.split("\n");
        var text = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if(line.search(/===+/) === 0) {
                nodes.push({
                    name: lines[i-1],
                    pos: {sl: i-1, el: i-1}
                });
            }
        }
        return tree.list(nodes);
    };
    
    this.outline = function(ast) {
        return extractOutline(ast);
    };
    
    // This is where the fun stuff happens
    function extractOutline(node) {
        var outline = [];
        console.log(""+node);
        node.traverseTopDown(
            'PropertyInit(x, e)', function(b) {
                outline.push({
                    name: b.x.value,
                    pos: this.getPos(),
                    items: extractOutline(b.e)
                });
                return this;
            }
        );
        return outline;
    }

}).call(OutlineHandler.prototype);

});