/**
 * Code completion for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var code = require("ext/code/code");
var dom = require("ace/lib/dom");

var completeUtil = require("ext/codecomplete/complete_util");
var language = require("ext/language/language");

module.exports = ext.register("ext/codecomplete/codecomplete", {
    name    : "Code Complete",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, language],
    nodes   : [],
    alone   : true,

    init : function() {
        language.registerLanguageHandler('ext/codecomplete/local_completer');
        language.registerLanguageHandler('ext/codecomplete/snippet_completer');
        language.registerLanguageHandler('ext/codecomplete/open_files_local_completer');
    },

    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
