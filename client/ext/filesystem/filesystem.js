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

    createFolder: function() {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("//folder[1]");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;
        
        if (this.webdav) {
            trFiles.focus();
            this.webdav.exec("mkdir", [node.getAttribute("id"), "untitled folder"], function(data) {
                // @todo: in case of error, show nice alert dialog
                if (data instanceof Error)
                    throw Error;
                if (data.indexOf("<folder") > -1) {
                    trFiles.insert(data, {
                        insertPoint: node,
                        clearContents: true
                    });
                }
                trFiles.select(node.selectSingleNode("folder[@name='untitled folder']"));
                trFiles.startRename();
            });
        }
    },

    createFile: function() {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("//folder[1]");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;
        
        if (this.webdav) {
            trFiles.focus();
            var _self = this;
            this.webdav.exec("create", [node.getAttribute("id"), "untitled file.txt"], function(data) {
                _self.webdav.exec("readdir", [node.getAttribute("id")], function(data) {
                    if (data.indexOf("<file") > -1) {
                        trFiles.insert(data, {
                            insertPoint: node,
                            clearContents: true
                        });
                    }
                    trFiles.select(node.selectSingleNode("file[@name='untitled file.txt']"));
                    trFiles.startRename();
                });
            });
        }
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
        
        var fs = this;
        ide.addEventListener("openfile", function(e){
            var node = e.node;
            
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