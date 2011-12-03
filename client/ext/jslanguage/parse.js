/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var parser = require("treehugger/js/parse");
var baseLanguageHandler = require('ext/language/base_handler');

var handler = module.exports = Object.create(baseLanguageHandler);

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};
    
handler.parse = function(code) {
    code = code.replace(/^(#!.*\n)/, "//$1");
    return parser.parse(code);
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