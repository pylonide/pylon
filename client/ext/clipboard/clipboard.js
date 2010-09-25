/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/clipboard/clipboard",
    ["core/ide", "core/ext"],
    function(ide, ext) {

return ext.register("ext/clipboard/clipboard", {
    dev    : "Ajax.org",
    name   : "Clipboard",
    alone  : true,
    type   : ext.GENERAL,
    hotkeys: {"cut":1, "copy":1, "paste":1},

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Cut",
                onclick : this.cut
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Copy",
                onclick : this.copy
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Paste",
                onclick : this.paste
            }))
        );

        this.hotitems = {
            "cut" : [this.nodes[1]],
            "copy" : [this.nodes[2]],
            "paste" : [this.nodes[3]]
        };
    },

    cut: function() {},

    copy: function() {},

    paste: function() {},

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