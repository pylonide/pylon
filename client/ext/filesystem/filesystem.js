/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/filesystem/filesystem",
    ["core/ide", "core/ext", "core/util"], function(ide, ext, util) {

return ext.register("ext/filesystem/filesystem", {
    name   : "File System",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],
    commands: {
        "open": {hint: "open a file to edit in a new tab"},
        "c9": {hint: "alias for 'open'"}
    },

    readFile : function (path, callback){
        if (this.webdav)
            this.webdav.read(path, callback);
    },

    saveFile : function(path, data, callback) {
        if (this.webdav)
            this.webdav.write(path, data, null, callback);
    },

    list : function(path, callback) {
        if (this.webdav)
            this.webdav.list(path, callback);
    },
    
    exists : function(path, callback) {
        this.readFile(path, function (data, state, extra) {
            callback(state == apf.SUCCESS)
        });
    },

    createFolder: function(name, tree) {
        if (!tree) {
            tree = apf.document.activeElement;
            if (!tree || tree.localName != "tree")
                tree = trFiles;  
        }
        
        var node = tree.selected;
        if (!node)
            node = tree.xmlRoot.selectSingleNode("folder");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;

        if (this.webdav) {
            var prefix = name ? name : "New Folder";
            var path = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }
            
            var _self = this,
                index = 0;
            
            function test(exists) {
                if (exists) {
                    name = prefix + index++;
                    _self.exists(path + "/" + name, test);     
                } else {
		            tree.focus();
		            _self.webdav.exec("mkdir", [path, name], function(data) {
		                // @todo: in case of error, show nice alert dialog
		                if (data instanceof Error)
		                    throw Error;
		                
		                console.log("name " + name);
		                var strXml = data.match(new RegExp(("(<folder path='" + path 
		                        + "/" + name + "'.*?>)").replace(/\//g, "\\/")))[1];
		
		                var folder = apf.xmldb.appendChild(node, apf.getXml(strXml));
		
		                tree.select(folder);
		                tree.startRename();
		            });
	            }
	        }
	        
	        name = prefix;
	        this.exists(path + "/" + name, test);
        }
    },

    createFile: function(filename, contenttype) {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;

        if (this.webdav) {
            if (!filename)
                filename = "Untitled.txt";

            trFiles.focus();
            var _self = this,
                path  = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }
            this.webdav.exec("create", [path, filename], function(data) {
                _self.webdav.exec("readdir", [path], function(data) {
                    // @todo: in case of error, show nice alert dialog
                    if (data instanceof Error)
                        throw Error;
                    
                    var strXml = data.match(new RegExp(("(<file path='" + path 
                        + "/" + filename + "'.*?>)").replace(/\//g, "\\/")))[1];

                    var file = apf.xmldb.appendChild(node, apf.getXml(strXml));
                    
                    trFiles.select(file);
                    trFiles.startRename();
                });
            });
        }
    },

    beforeRename : function(node, name, newPath) {
        var path = node.getAttribute("path"),
            page = tabEditors.getPage(path);

        if (name)
            newPath = path.replace(/^(.*\/)[^\/]+$/, "$1" + name);
        else
            name = newPath.match(/[^/]+$/);
            
        node.setAttribute("path", newPath);
        apf.xmldb.setAttribute(node, "name", name);
        if (page)
            page.setAttribute("id", newPath);
    },

    beforeMove: function(parent, node) {
        var path = node.getAttribute("path"),
            page = tabEditors.getPage(path),
            newpath = parent.getAttribute("path") + "/" + node.getAttribute("name");

        node.setAttribute("path", newpath);//apf.xmldb.setAttribute(node, "path", newpath);
        if (page)
            page.setAttribute("id", newpath);
    },

    remove: function(path) {
        var page = tabEditors.getPage(path);
        if (page)
            tabEditors.remove(page);

        davProject.remove(path, false, function() {
//            console.log("deleted", path);
        });
    },

    /**** Init ****/

    projectName : "Project",
    
    init : function(amlNode){
        this.model = new apf.model();
        this.model.load("<data><folder type='folder' name='" + this.projectName + "' path='/workspace' root='1'/></data>");

        var url;
        if (location.host) {
	        var dav_url = location.href.replace(location.hash, '');
            this.webdav = new apf.webdav({
                id  : "davProject",
                url : dav_url+"workspace"
            });
            url = "{davProject.getroot()}";
        }
        else {
            url = "ext/filesystem/files.xml";
            this.readFile = this.saveFile = apf.K;
        }

        /*this.model.insert(url, {
            insertPoint : this.model.queryNode("folder[@root='1']")
        });*/

        var fs = this;
        ide.addEventListener("openfile", function(e){
            var doc  = e.doc;
            var node = doc.getNode();

            if (doc.hasValue()) {
                ide.dispatchEvent("afteropenfile", {doc: doc});
                return;
            }

            var path = node.getAttribute("path");
            fs.readFile(path, function(data, state, extra) {
                if (state != apf.SUCCESS) {
                    if (extra.status == 404) {
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                    }
                }
                else {
                    if (!ide.davPrefix) {
                        /*util.alert(
                            "Could not connect to server backend",
                            "Could not connect",
                            "There is more than one session open with the server. " +
                            "This is currently not supported. Please close the other " +
                            "sessions and restart this one.");
                        return;*/
                        
                        ide.addEventListener("ideready", function(){
                            node.setAttribute("scriptname", ide.workspaceDir + path.slice(ide.davPrefix.length));
                            ide.removeEventListener("ideready", arguments.callee);
                        });
                    }
                    else
                        node.setAttribute("scriptname", ide.workspaceDir + path.slice(ide.davPrefix.length));
                    
                    doc.setValue(data);
                    ide.dispatchEvent("afteropenfile", {doc: doc});
                }
            });
        });

        ide.addEventListener("workspaceDirChange", function(e) {
            fs.setProjectName(e.workspaceDir.replace(/\/+$/, "").split("/").pop());
        });
    },

    setProjectName : function(name) {
        this.model && this.model.setQueryValue("folder[@root='1']/@name", name);
        this.projectName = name;
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
