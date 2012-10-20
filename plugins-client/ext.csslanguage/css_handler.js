/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require("ext/language/base_handler");
var CSSLint = require("ext/csslanguage/csslint");
var handler = module.exports = Object.create(baseLanguageHandler);

handler.handlesLanguage = function(language) {
    return language === "css";
};

handler.analyze = function(doc, ast, callback) {
    callback(handler.analyzeSync(doc, ast));
};

handler.analyzeSync = function(doc, ast) {
    var value = doc.getValue();
    value = value.replace(/^(#!.*\n)/, "//$1");

    var results = CSSLint.verify(value);
    var warnings = results.messages;

    return warnings.map(function(warning) {
        return {
            pos: {
                sl: warning.line-1,
                sc: warning.col-1
            },
            type: warning.type,
            level: warning.type,
            message: warning.message
        };
    });
};

});
