/**
 * Refactor Module for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/undo/undo",
    ["core/ide", "core/ext"],
    function(ide, ext) {

return ext.register("ext/undo/undo", {
    dev    : "Ajax.org",
    name   : "Undo",
    alone  : true,
    type   : ext.GENERAL,
    hotkeys: {"undo":1, "redo":1},

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            //mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Undo",
                onclick : function(){
                    tabEditors.getPage().$at.undo();
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Redo",
                onclick : function(){
                    tabEditors.getPage().$at.redo();
                }
            }))
        );

        this.hotitems = {
            "undo" : [this.nodes[0]],
            "redo" : [this.nodes[1]]
        };
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

    }
);