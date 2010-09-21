/**
 * Node Runner Module for the Ajax.org Cloud IDE
 */
require.def("ext/filesystem/filesystem",
    ["core/ide", "core/ext"], function(ide, ext, localFiles) {

return ext.register("ext/filesystem/filesystem", {
    name   : "File System",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],
    
    readFile : function (id, callback){
        if (this.webdav) {
            apf.getData('{davProject.read(id)}', {
                id       : id,
                callback : callback
            });
        }
    },
    
    saveFile : function(fileEl) {
        var id = fileEl.getAttribute("id");
        var data = apf.queryValue(fileEl, "data");
        if (apf.queryValue(fileEl, "data/@newline") == "windows")
            data = data.replace(/\n/g, "\r\n");

        if (this.webdav)
            this.webdav.exec("write", [id, data]);
    },

    createDir: function(name) {
        var node = trFiles.selected;
        if (!node)
            node = mdlFiles.selectSingleNode("//folder[1]");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;
        
        if (this.webdav)
            this.webdav.exec("mkdir", [node.getAttribute("id"), name || "untitled folder", ""]);
    },

    createFile: function(name) {
        var node = trFiles.selected;
        if (!node)
            node = mdlFiles.selectSingleNode("//folder[1]");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;
        
        if (this.webdav)
            this.webdav.exec("create", [node.getAttribute("id"), name || "Newfile.txt", ""]);
    },

    /**** Init ****/

    init : function(amlNode){
        this.model = new apf.model();
        this.model.load("<data><project name='Project' /></data>");
        
        var url;
        if (location.host) {
            this.webdav = new apf.webdav({
                id  : "davProject",
                url : location.protocol + "//" + location.host + "/workspace"
            });
            url = "{davProject.getroot()}";
        }
        else {
            url = "ext/filesystem/files.xml";
            this.readFile = this.saveFile = apf.K;
        }
        
        this.model.insert(url, {
            insertPoint : this.model.queryNode("project")
        });
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
        this.webdav.destroy(true, true);
        this.model.destroy(true, true);
    }
});

});