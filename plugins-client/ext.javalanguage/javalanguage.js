/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");
var language = require("ext/language/language");

module.exports = ext.register("ext/javalanguage/javalanguage", {
    name    : "Java Language Support",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, language],
    nodes   : [],
    alone   : true,
    offline : false,
    command : "jvm_features",

    init : function() {
        language.registerLanguageHandler("ext/javalanguage/processor");
    },

    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
