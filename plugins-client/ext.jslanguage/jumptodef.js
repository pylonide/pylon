/**
 * JavaScript jump to definition.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var handler = module.exports = Object.create(baseLanguageHandler);
var scopes = require("ext/jslanguage/scope_analyzer");

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

handler.jumpToDefinition = function(doc, fullAst, pos, currentNode, callback) {
    if (!fullAst)
        return callback();
    scopes.getVariablePositions(doc, fullAst, pos, currentNode, function (data) {
        if (!data || !data.declarations || data.declarations.length === 0) {
            return callback(null);
        }
        
        callback(data.declarations);
    });
};

});
