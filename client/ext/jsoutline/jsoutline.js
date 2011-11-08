/**
 * Code completion for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */


define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var language = require("ext/language/language");

module.exports = ext.register("ext/jsoutline/jsoutline", {
    name    : "Javascript Outline",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, language],
    nodes   : [],
    alone   : true,
    outline : [],

    init : function() {
        language.registerLanguageHandler('ext/jsoutline/outline_handler');
        language.registerLanguageHandler('ext/jsoutline/json_outline_handler');
        language.registerLanguageHandler('ext/jsoutline/semantic_highlighter');
    },
    
    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});