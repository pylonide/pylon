define(function(require, exports, module) {

var parser = require("treehugger/js/parse");
require("treehugger/traverse");
var baseLanguageHandler = require('ext/language/base_handler');

var outlineHandler = module.exports = Object.create(baseLanguageHandler);

outlineHandler.handlesLanguage = function(language) {
    return language === 'json';
};
    
outlineHandler.parse = function(code) {
    // wrap in () to pass it through the JS parser
    return parser.parse("(" + code + ")");
};
    
outlineHandler.outline = function(ast) {
    return extractOutline(ast);
};
    
// This is where the fun stuff happens
function extractOutline(node) {
    var outline = [];
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

});