/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/tree/tree",
    ["core/ide", "core/ext", "text!ext/tree/tree.xml"],
    function(ide, ext, markup) {

return ext.register("ext/tree/tree", {
    name    : "Tree",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,

    init : function(){
        this.trFiles = trFiles;
        ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[1]").appendChild(trFiles);

        trFiles.addEventListener("afterselect", this.$afterselect = function() {
            var node = this.selected;
            if (node.tagName != 'file')
                return;

            ext.openEditor(trFiles.value, trFiles.selected);

            if (node.selectSingleNode("data"))
                return;

            apf.getData('{davProject.read([@id])}', {
                xmlNode : node,
                callback: function(data) {
                    var xml = apf.getXml(
                        '<data><![CDATA[' + data + ']]></data>'
                    );
                    apf.b(node).append(xml);
                }
            });
        });
    },

    enable : function(){
        trFiles.show();
    },

    disable : function(){
        trFiles.hide();
    },

    destroy : function(){
        davProject.destroy(true, true);
        mdlFiles.destroy(true, true);
        trFiles.destroy(true, true);

        trFiles.removeEventListener("afterselect", this.$afterselect);
    }
});

    }
);