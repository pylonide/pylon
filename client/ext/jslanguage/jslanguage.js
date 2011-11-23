/**
 * Code completion for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */


define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");
var language = require("ext/language/language");

module.exports = ext.register("ext/jslanguage/jslanguage", {
    name    : "Javascript Language Support",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, language],
    nodes   : [],
    alone   : true,

    init : function() {
        language.registerLanguageHandler('ext/jslanguage/parse');
        language.registerLanguageHandler('ext/jslanguage/scope_analyzer');
        language.registerLanguageHandler('ext/jslanguage/narcissus_jshint');
    },
    
    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
