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

    init : function(){
        this.nodes.push(
            mnuThemes.appendChild(new apf.item({
                caption : "My First Theme",
                onclick : function(){
                    themes.set("ext/themes_default/theme1.css");
                }
            })),
            mnuThemes.appendChild(new apf.item({
                caption : "Dark Theme",
                onclick : function(){
                    themes.set("ext/themes_default/theme2.css");
                }
            })),
            mnuThemes.appendChild(new apf.item({
                caption : "Dark Theme 2",
                onclick : function(){
                    themes.set("ext/themes_default/theme3.css");
                }
            }))
        );
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});