define(function(require, exports, module) {

var oop = require("pilot/oop");
var parser = require("treehugger/js/parse");
require("treehugger/traverse");
var BaseLanguageHandler = require('ext/language/base_handler').BaseLanguageHandler;

var OutlineHandler = exports.OutlineHandler = function(sender) {
};

oop.inherits(OutlineHandler, BaseLanguageHandler);

(function() {

    this.handlesPath = function(path) {
        return path.search(/\.json$/) !== -1;
    };
    
    this.parse = function(code) {
        // wrap in () to pass it through the JS parser
        return parser.parse("(" + code + ")");
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