/**
 * Refactor Module for the Ajax.org Cloud IDE
 */
require.def("ext/clipboard/clipboard",
    ["core/ide", "core/ext"],
    function(ide, ext) {

return ext.register("ext/clipboard/clipboard", {
    dev    : "Ajax.org",
    name   : "Clipboard",
    alone  : true,
    type   : ext.GENERAL,

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Cut",
                hotkey  : "Ctrl-X",
                onclick : function(){
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Copy",
                hotkey  : "Ctrl-C",
                onclick : function(){
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Paste",
                hotkey  : "Ctrl-V",
                onclick : function(){
                }
            }))
        );
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