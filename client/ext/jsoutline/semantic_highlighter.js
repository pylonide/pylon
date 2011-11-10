define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');

var handler = module.exports = Object.create(baseLanguageHandler);
var lang = require("pilot/lang");

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

var KNOWN_GLOBALS = lang.arrayToMap(["this", "require", "define", "console", "true", "false", "null", "Error", "Array", "Math", "Number"]);
    
handler.analyze = function(doc, ast) {
    var annos = [];
    // TODO: Take hoisting into account
    function scopeAnalyzer(scope, node) {
        node.traverseTopDown(
            'Function(x, fargs, body)', function(b) {
                if(b.x.value) {
                    scope[b.x.value] = true;
                }
                var newScope = Object.create(scope);
                b.fargs.forEach(function(farg) {
                    newScope[farg.value] = true;
                });
                scopeAnalyzer(newScope, b.body);
                return this;
            },
            'VarDecl(x)', function(b) {
                scope[b.x.value] = true;
            },
            'VarDeclInit(x, _)', function(b) {
                scope[b.x.value] = true;
            },
            'Var(x)', function(b) {
                if(!KNOWN_GLOBALS[b.x.value] && !scope[b.x.value]) {
                    annos.push({
                        pos: this.getPos(),
                        type: 'warning',
                        message: 'Undeclared variable'
                    });
                }
                return this;
            }
        );
    }
    
    scopeAnalyzer({}, ast);
    return annos;
};
    
});