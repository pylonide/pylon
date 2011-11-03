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

    hook : function() {
    	var _self = this;
		ide.addEventListener("afteropenfile", function(){
            $setTimeout(function() { ext.initExtension(_self); });
	    });
	},

    init : function() {
    	language.registerLanguageHandler('ext/jsoutline/outline_handler', "OutlineHandler");
        console.log("Hooked js analysis!");
    },
    
    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});