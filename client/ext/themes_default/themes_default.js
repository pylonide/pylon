/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var themes = require("ext/themes/themes");

module.exports = ext.register("ext/themes_default/themes_default", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],

    themes  : {
        "TextMate" : "ace/theme/textmate",
        "Eclipse" : "ace/theme/eclipse",
        "Dawn" : "ace/theme/dawn",
        "IdleFingers" : "ace/theme/idle_fingers",
        "Twilight" : "ace/theme/twilight",
        "Monokai": "ace/theme/monokai",
        "Cobalt": "ace/theme/cobalt",
        "Mono Industrial": "ace/theme/mono_industrial",
        "Clouds": "ace/theme/clouds",
        "Clouds Midnight": "ace/theme/clouds_midnight",     
        "krTheme": "ace/theme/kr_theme"        
    },

    init : function(){
        themes.register(this.themes);
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});