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
    offline : false,
    type    : ext.GENERAL,
    nodes   : [],

    register : function(themes){
        for (var name in themes) {
            this.nodes.push(
                mnuThemes.appendChild(new apf.item({
                    caption : name,
                    type    : "radio",
                    value   : themes[name]
                }))
            )
        }
    },

    set : function(path){
        //Save theme settings
        settings.model.setQueryValue("editors/code/@theme", path);
        settings.save();
    },

    init : function(){
        var _self = this;
        
        this.nodes.push(
            mnuView.appendChild(new apf.item({
                caption : "Themes",
                submenu : "mnuThemes"
            })),
            apf.document.body.appendChild(new apf.menu({
                id : "mnuThemes",
                onitemclick : function(e){
                    _self.set(e.relatedNode.value);
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