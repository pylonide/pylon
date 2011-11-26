define(function(require, exports, module) {

var parser = require("treehugger/js/parse");
var baseLanguageHandler = require('ext/language/base_handler');

var parseHandler = module.exports = Object.create(baseLanguageHandler);

parseHandler.handlesLanguage = function(language) {
    return language === 'javascript';
};
    
parseHandler.parse = function(code) {
    return parser.parse(code);
};

});