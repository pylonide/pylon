define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');

var handler = module.exports = Object.create(baseLanguageHandler);

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};
    
handler.analyze = function(doc, ast) {
    var annos = [];
    ast.traverseTopDown(
        'New(_, _)', function(b) {
            annos.push({
                node: this.getPos(),
                type: 'error',
                message: 'You look like a Java programmer, are you?'
            });
        }
    );
    return annos;
};
    
});