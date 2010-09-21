/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/tree/tree",
    ["core/ide", "core/ext", "ext/tree/treeutil", "ext/filesystem/filesystem", "text!ext/tree/tree.xml"],
    function(ide, ext, treeutil, fs, markup) {
        
return ext.register("ext/tree/tree", {
    name    : "Tree",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,

    init : function() {
        this.trFiles = trFiles;
        ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[1]").appendChild(trFiles);
        trFiles.setAttribute("model", fs.model);
        
        var _self = this;
        this.mnuItem = mnuPanels.appendChild(new apf.item({
            caption : this.name,
            type    : "check",
            checked : true,
            onclick : function(){
                this.checked ? _self.enable() : _self.disable();
            }
        }));

        trFiles.addEventListener("afterselect", this.$afterselect = function() {
            var node = this.selected;
            if (node.tagName != "file")
                return;

            //ext.openEditor(trFiles.value, trFiles.selected);
            ide.dispatchEvent("openfile", {value: this.value, node: node});

            if (node.selectSingleNode("data"))
                return;

            fs.readFile(node.getAttribute("id"), function(data) {
                var match = data.match(/^.*?(\r?\n)/m);
                if (match && match[1] == "\r\n")
                    var nl = "windows";
                else
                    nl = "unix";

                var doc = node.ownerDocument;
                var xml = doc.createElement("data");
                xml.appendChild(doc.createTextNode(data));
                xml.setAttribute("newline", nl);
                apf.b(node).append(xml);
            });
        });
    },

    getSelectedPath: function() {
        return treeutil.getPath(this.trFiles.selected);
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
        davProject.destroy(true, true);
        mdlFiles.destroy(true, true);
        trFiles.destroy(true, true);
        this.mnuItem.destroy(true, true);

        trFiles.removeEventListener("afterselect", this.$afterselect);
    }
});

});