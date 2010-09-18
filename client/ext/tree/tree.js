/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/tree/tree",
    ["core/ide", "core/ext", "ext/tree/treeutil", "text!ext/tree/tree.xml"],
    function(ide, ext, treeutil, markup) {
        
if (!location.host)
    return {
        name    : "Disabled Tree No Host",
        dev     : "Ajax.org",
        alone   : true,
        type    : ext.GENERAL,
        path    : "ext/tree/tree",
        init    : function(){},
        destroy : function(){}
    };

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

    saveFile : function(fileEl) {
        var id = fileEl.getAttribute("id");
        var data = apf.queryValue(fileEl, "data");
        davProject.write(id, data);
    },

    getSelectedPath: function() {
        return treeutil.getPath(this.trFiles.selected);
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

});