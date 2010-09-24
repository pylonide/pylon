/**
 * Refactor Module for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/newresource/newresource",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem", "text!ext/newresource/newresource.xml"],
    function(ide, ext, util, fs, markup) {

return ext.register("ext/newresource/newresource", {
    dev     : "Ajax.org",
    name    : "Save",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    deps    : [fs],
    hotkeys : {"newfile":1, "newdir":1},
    hotitems: {},

    nodes   : [],

    init : function(amlNode){
        var _self = this;

        //ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[1]").appendChild(tbNewResource);

        //btnNewFile.onclick   = this.newfile;
        //btnNewFolder.onclick = this.newfolder;

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "New Folder",
                onclick : this.newfolder
            }), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.item({
                caption : "New File",
                onclick : this.newfile
            }), ide.mnuFile.firstChild)
        );

        this.hotitems["newdir"]  = [this.nodes[0]];
        this.hotitems["newfile"] = [this.nodes[1]];
    },

    newfile: function() {
        fs.createFile();
        return false;
    },

    newfolder: function() {
        fs.createFolder();
        return false;
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