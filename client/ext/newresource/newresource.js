/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/newresource/newresource",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem", "text!ext/newresource/newresource.xml"],
    function(ide, ext, util, fs, markup) {

return ext.register("ext/newresource/newresource", {
    dev     : "Ajax.org",
    name    : "Newresource",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    deps    : [fs],
    commands : {
        "newfile": {hint: "create a new file resource"},
        "newfolder": {hint: "create a new directory resource"}
    },
    hotitems: {},

    nodes   : [],

    init : function(amlNode){
        var _self = this;

        //ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[1]").appendChild(tbNewResource);

        //btnNewFile.onclick   = this.newfile;
        //btnNewFolder.onclick = this.newfolder;

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),
            ide.mnuFile.insertBefore(new apf.item({
                caption : "New",
                submenu : "mnuNew"
            }), ide.mnuFile.firstChild)
        );

        //this.hotitems["newfolder"] = [mnuNew.firstChild];
        //this.hotitems["newfile"] = [mnuNew.childNodes[3]];
    },

    newfile: function() {
        fs.createFile(null, true);
        return false;
        
        var node = apf.getXml('<file path="/giannis/cloud9/workspace" type="file" size="" name="Untitled.txt" contenttype="text/plain; charset=utf-8" modifieddate="" creationdate="" lockable="false" hidden="false" executable="false"></file>');
        debugger;
        if (this.webdav) {
            var filename = "Untitled.txt",
                prefix   = filename,
                _self = this,
                path  = node.getAttribute("path"),
                index = 0;
            
            var test = function(exists) {
                if (exists) {
                    filename = prefix + "." + index++;
                    _self.exists(path + "/" + filename, test);    
                } else {
                    node.setAttribute('name', filename);
                    console.log(node)
//                    ide.dispatchEvent("openfile", {doc: ide.createDocument(node), type:'newfile'});
                }
            };
            
            filename = prefix;
            this.exists(path + "/" + filename, test);
        }
        
        return false;
    },

    newfolder: function() {
        fs.createFolder();
        return false;
    },

    enable : function(){
        if (!this.disabled) return;
        
        this.nodes.each(function(item){
            item.enable();
        });
        this.disabled = false;
    },
    
    disable : function(){
        if (this.disabled) return;
        
        this.nodes.each(function(item){
            item.disable();
        });
        this.disabled = true;
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        mnuNew.destroy(true, true);

        tabEditors.removeEventListener("close", this.$close);
    }
});

    }
);