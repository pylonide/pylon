/**
 * File System Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");

return ext.register("ext/filesystem/filesystem", {
    name   : "File System",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],
    commands: {
        "open": {
            "hint": "open a file to edit in a new tab",
            "commands": {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        },
        "c9": {
            "hint": "alias for 'open'",
            "commands": {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        }
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
        if (this.webdav)
            this.webdav.exists(path, callback);
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
                    name = prefix + "." + index++;
                    _self.exists(path + "/" + name, test);     
                } else {
                    tree.focus();
                    _self.webdav.exec("mkdir", [path, name], function(data) {
                        // @todo: in case of error, show nice alert dialog
                        if (data instanceof Error)
                            throw Error;

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

    createFile: function(filename) {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;

        if (this.webdav) {
            var prefix = filename ? filename : "Untitled.txt";

            trFiles.focus();
            var _self = this,
                path  = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }
            
            var index = 0;
            
            var test = function(exists) {
                if (exists) {
                    filename = prefix + "." + index++;
                    _self.exists(path + "/" + filename, test);    
                } else {
                    var file, both = 0;
                    function done(){
                        if (both == 2) {
                            file = apf.xmldb.appendChild(node, file);
                            trFiles.select(file);
                            trFiles.startRename();
                        }
                    }
                    
                    trFiles.slideOpen(null, node, true, function(){
                        both++;
                        done(); 
                    });
                    
                    _self.webdav.exec("create", [path, filename], function(data) {
                        _self.webdav.exec("readdir", [path], function(data) {
                            // @todo: in case of error, show nice alert dialog
                            if (data instanceof Error)
                                throw Error;
                            
                            var strXml = data.match(new RegExp(("(<file path='" + path +
                                "/" + filename + "'.*?>)").replace(/\//g, "\\/")))[1];
                            file = apf.getXml(strXml);
                            
                            both++;
                            done();
                        });
                    });
                }
            };
            
            filename = prefix;
            this.exists(path + "/" + filename, test);
        }
    },

    beforeStopRename : function(name) {
        // Returning false from this function will cancel the rename. We do this
        // when the name to which the file is to be renamed contains invalid
        // characters
        var match = name.match(/^(?:\w|[.])(?:\w|[.-])*$/);

        return match !== null && match[0] == name;
    },

    beforeRename : function(node, name, newPath) {
        var path = node.getAttribute("path"),
            page = tabEditors.getPage(path),
            match;

        if (name)
            newPath = path.replace(/^(.*\/)[^\/]+$/, "$1" + name);
        else
            name = newPath.match(/[^\/]+$/);
            
        node.setAttribute("path", newPath);
        apf.xmldb.setAttribute(node, "name", name);
        if (page)
            page.setAttribute("id", newPath);
        
        var childNodes = node.childNodes;
        var length = childNodes.length;
        
        for (var i = 0; i < length; ++i) {
            var childNode = childNodes[i];
            var name = childNode.getAttribute("name");
            
            this.beforeRename(childNode, null,
                              node.getAttribute("path") + "/" + name);
        }
        ide.dispatchEvent("updatefile", {
            path: path,
            name: name.input,
            xmlNode: node
        });
    },

    beforeMove: function(parent, node) {
        var path = node.getAttribute("path"),
            page = tabEditors.getPage(path),
            newpath = parent.getAttribute("path") + "/" + node.getAttribute("name");

        node.setAttribute("path", newpath);
        if (page)
            page.setAttribute("id", newpath);
            
        var childNodes = node.childNodes;
        var length = childNodes.length;
        
        for (var i = 0; i < length; ++i)
            this.beforeMove(node, childNodes[i]);
        
        ide.dispatchEvent("updatefile", {
            path: path,
            xmlNode: node
        });
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

    init : function(amlNode){
        this.model = new apf.model();
        
        var _self = this;
        ide.addEventListener("afteronline", function(){
            _self.model.load("<data><folder type='folder' name='" + ide.projectName + "' path='" + ide.davPrefix + "' root='1'/></data>");
            ide.removeEventListener("afteronline", arguments.callee);
        });
        
        var url;
        if (location.host || window.cloud9config.standalone) {
            var dav_url = location.href.replace(location.path + location.hash, "") + ide.davPrefix;
            this.webdav = new apf.webdav({
                id  : "davProject",
                url : dav_url,
                onauthfailure: function(e) {
                    ide.dispatchEvent("authrequired");
                }
            });
            url = "{davProject.getroot()}";
        }
        else {
            url = "ext/filesystem/files.xml";
            this.readFile = this.saveFile = apf.K;
        }

        function openHandler(e) {
            ide.socket.send(JSON.stringify({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "filesystem"
            }));
            return false;
        }
        ide.addEventListener("consolecommand.open", openHandler);
        ide.addEventListener("consolecommand.c9",   openHandler);

        var fs = this;
        ide.addEventListener("openfile", function(e){
            var doc  = e.doc;
            var node = doc.getNode();

            if (doc.hasValue()) {
                ide.dispatchEvent("afteropenfile", {doc: doc, node: node});
                return;
            }

            // add a way to hook into loading of files
            if (ide.dispatchEvent("readfile", {doc: doc, node: node}) == false)
                return;

            var path = node.getAttribute("path");
            
            var callback = function(data, state, extra) {
                if (state == apf.OFFLINE) {
                    ide.addEventListener("afteronline", function(e) {
                        fs.readFile(path, callback);
                        ide.removeEventListener("afteronline", arguments.callee);
                    });
                }
                else if (state != apf.SUCCESS) {
                    if (extra.status == 404) {
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                    }
                }
                else {
                    doc.setValue(data);
                    ide.dispatchEvent("afteropenfile", {doc: doc, node: node});                    
                }
            };
            
            fs.readFile(path, callback);
        });
        
        ide.addEventListener("reload", function(e) {
            var doc  = e.doc,
                node = doc.getNode(),
                path = node.getAttribute("path");
            
            fs.readFile(path, function(data, state, extra) {
                if (state != apf.SUCCESS) {
                    if (extra.status == 404)
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                } else {
                   ide.dispatchEvent("afterreload", {doc : doc, data : data});
                }
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
