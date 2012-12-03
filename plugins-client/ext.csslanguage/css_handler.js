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

handler.analyze = function(value, ast, callback) {
    callback(handler.analyzeSync(value, ast));
};

var CSSLint_RULESET = {
    "adjoining-classes"           : 1,
    "box-model"                   : 1,
    "box-sizing"                  : 1,
    "compatible-vendor-prefixes"  : 1,
    "display-property-grouping"   : 1,
    "duplicate-background-images" : 1,
    "duplicate-properties"        : 1,
    "empty-rules"                 : 1,
    "errors"                      : 1,
    "fallback-colors"             : 1,
    "floats"                      : 1,
    "font-faces"                  : 1,
    "font-sizes"                  : 1,
    "gradients"                   : 1,
    // "ids"                      : 1,
    "import"                      : 1,
    "important"                   : 1,
    "known-properties"            : 1,
    "outline-none"                : 1,
    "overqualified-elements"      : 1,
    "qualified-headings"          : 1,
    "regex-selectors"             : 1,
    "rules-count"                 : 1,
    "shorthand"                   : 1,
    "star-property-hack"          : 1,
    "text-indent"                 : 1,
    "underscore-property-hack"    : 1,
    "unique-headings"             : 1,
    "universal-selector"          : 1,
    "unqualified-attributes"      : 1,
    "vendor-prefix"               : 1,
    "zero-units"                  : 1
};

handler.analyzeSync = function(value, ast) {
    value = value.replace(/^(#!.*\n)/, "//$1");

    var results = CSSLint.verify(value, CSSLint_RULESET);
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
