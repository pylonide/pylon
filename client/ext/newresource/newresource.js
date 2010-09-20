/**
 * Refactor Module for the Ajax.org Cloud IDE
 */
require.def("ext/newresource/newresource",
    ["core/ide", "core/ext", "core/util", "ext/tree/tree", "text!ext/newresource/newresource.xml"],
    function(ide, ext, util, tree, markup) {

return ext.register("ext/newresource/newresource", {
    dev     : "Ajax.org",
    name    : "Save",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    deps    : [tree],
    hotkeys : {"newfile":1, "newdir":1},
    hotitems: {},

    nodes   : [],

    init : function(amlNode){
        var _self = this;

        var nodes = barNew.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }

        btnNew.onclick = _self.newresdialog;

        winNewFile.addEventListener("afterrender", function() {
            var buttons = this.selectNodes("a:vbox[2]/a:hbox[1]/a:button");
            buttons[0].onclick = _self.newfile.bind(_self);
            buttons[1].onclick = function() {winNewFile.hide();};
            _self.filetext = this.selectSingleNode("a:vbox[1]/a:textbox");
        });

        winNewDir.addEventListener("afterrender", function() {
            var buttons = this.selectNodes("a:vbox[2]/a:hbox[1]/a:button");
            buttons[0].onclick = _self.newdir.bind(_self);
            buttons[1].onclick = function() {winNewDir.hide();};
            _self.dirtext = this.selectSingleNode("a:vbox[1]/a:textbox");
        });

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "New Folder",
                onclick : _self.newdirdialog
            }), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.item({
                caption : "New File",
                onclick : _self.newfiledialog
            }), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.item({
                caption : "New...",
                onclick : _self.newresdialog
            }), ide.mnuFile.firstChild)
        );

        this.hotitems["newdir"]  = [this.nodes[0]];
        this.hotitems["newfile"] = [this.nodes[1]];
    },

    newfiledialog: function() {
        if (this.filetext)
            this.filetext.setValue("");
        winNewFile.show();
    },

    newdirdialog: function() {
        if (this.dirtext)
            this.dirtext.setValue("");
        winNewDir.show();
    },

    newresdialog: function() {
        //
    },

    newfile: function() {
        winNewFile.hide();
        var name = this.filetext.getValue();
        if (!name)
            return;
        tree.createFile(name);
    },

    newdir: function() {
        winNewDir.hide();
        var name = this.dirtext.getValue();
        if (!name)
            return;
        tree.createDir(name);
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

        tabEditors.removeEventListener("close", this.$close);
    }
});

    }
);