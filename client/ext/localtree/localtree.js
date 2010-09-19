/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/localtree/localtree",
    ["core/ide", "core/ext", "text!ext/localtree/localtree.xml"],
    function(ide, ext, markup) {

return ext.register("ext/localtree/localtree", {
    name    : "Local Tree",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,

    init : function(){
        ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[1]").appendChild(trFiles);

        var _self = this;
        this.mnuItem = mnuPanels.appendChild(new apf.item({
            caption : this.name,
            type    : "check",
            checked : true,
            onclick : function(){
                this.checked ? _self.enable() : _self.disable();
            }
        }));

        trFiles.addEventListener("afterselect", function() {
            var node = this.selected;
            if (node.tagName != 'file')
                return;

            ext.openEditor(this.value, node);
        });
    },
    
    enable : function(){
        trFiles.show();
        this.mnuItem.check();
    },

    disable : function(){
        trFiles.hide();
        this.mnuItem.uncheck();
    },

    destroy : function(){
        mdlFiles.destroy(true, true);
        trFiles.destroy(true, true);
        this.mnuItem.destroy(true, true);
    }
});

    }
);