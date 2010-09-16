/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/tree/tree",
    ["core/ide", "core/ext"],
    function(ide, ext) {

        var plugin = {
            name    : "Tree",
            type    : ext.GENERAL,
            markup  : "tree.xml",

            init : function(){
                plugin.trFiles = trFiles;
                ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[1]").appendChild(trFiles);

                trFiles.addEventListener("afterselect", function() {
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
            },

            disable : function(){
            },

            destroy : function(){
            }
        };

        return plugin;
    }
);