/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/themes/themes",
    ["core/ide", "core/ext", "core/util", "ext/editors/editors", "ext/settings/settings"],
    function(ide, ext, util, editors, settings) {

return ext.register("ext/themes/themes", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],

    set : function(){
        //Save theme settings
        //settings.model
        
        //Set theme
    },

    init : function(){
        this.nodes.push(
            mnuView.appendChild(new apf.item({
                caption : "Themes",
                submenu : "mnuThemes"
            })),
            apf.document.body.appendChild(new apf.menu({
                id : "mnuThemes",
            }))
        );
        
        //Hook settings
        //settings
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});