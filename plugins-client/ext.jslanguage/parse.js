/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var parser = require("treehugger/js/parse");
var traverse = require("treehugger/traverse");
var baseLanguageHandler = require('ext/language/base_handler');

var handler = module.exports = Object.create(baseLanguageHandler);

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};
    
handler.parse = function(code, callback) {
    code = code.replace(/^(#!.*\n)/, "//$1");
    var ast = parser.parse(code);
    traverse.addParentPointers(ast);
    callback(ast);
};

handler.isParsingSupported = function() {
    return true;
}; 

handler.findNode = function(ast, pos, callback) {
    callback(ast.findNode(pos));
};

handler.getPos = function(node, callback) {
    callback(node.getPos());
};

/* Ready to be enabled to replace Narcissus, when mature

handler.analyze = function(doc, ast) {
    var error = ast.getAnnotation("error");
    if (error)
        return [{
            pos: {sl: error.line},
            type: 'error',
            message: error.message || "Parse error."
        }];
    else
        return [];
};
*/

});
