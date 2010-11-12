/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/themes_default/themes_default",
    ["core/ide", "core/ext", "core/util", "ext/themes/themes"],
    function(ide, ext, util, themes) {

return ext.register("ext/themes_default/themes_default", {
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