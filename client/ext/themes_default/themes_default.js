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
        "TextMate" : "ace/theme/TextMate",
        "Eclipse" : "ace/theme/Eclipse",
        "Dawn" : "ace/theme/Dawn",
        "IdleFingers" : "ace/theme/IdleFingers",
        "Twilight" : "ace/theme/Twilight"
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