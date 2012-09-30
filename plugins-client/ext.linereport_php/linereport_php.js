/**
 * PHP linter
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");
var language = require("ext/language/language");
var linereport = require("ext/linereport/linereport");

module.exports = ext.register("ext/linereport_php/linereport_php", {
    name    : "PHP Line Reporting Support",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, language, linereport],
    nodes   : [],
    alone   : true,

    init : function() {
        language.registerLanguageHandler(
            'ext/linereport_php/linereport_php_worker',
            language.isWorkerEnabled() &&
            require('ext/linereport_php/linereport_php_worker_wrapped')
        );
    },
    
    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
