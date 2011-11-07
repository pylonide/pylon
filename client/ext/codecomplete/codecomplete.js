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
var canon = require("pilot/canon");
var dom = require("pilot/dom");

var completeUtil = require("ext/codecomplete/complete_util");
var language = require("ext/language/language");

/**
 * Asynchrounously performs `fn` on every element of `array` in parallel, then
 * calls callback
 */
function asyncParForEach(array, fn, callback) {
    var completed = 0;
    var arLength = array.length;
    if (arLength === 0) {
        callback();
    }
    for (var i = 0; i < arLength; i++) {
        fn(array[i], function(result, err) {
            completed++;
            if (completed === arLength) {
                callback(result, err);
            }
        });
    }
}

module.exports = ext.register("ext/codecomplete/codecomplete", {
    name    : "Code Complete",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, language],
    nodes   : [],
    alone   : true,

    init : function() {
        language.registerLanguageHandler('ext/codecomplete/local_completer', "Completer");
        language.registerLanguageHandler('ext/codecomplete/snippet_completer', "Completer");
        language.registerLanguageHandler('ext/codecomplete/open_files_local_completer', "Completer");
    },

    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
